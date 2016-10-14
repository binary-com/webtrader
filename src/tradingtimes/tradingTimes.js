/**
 * Created by amin on 10/5/15.
 */
define(["jquery", "windows/windows","websockets/binary_websockets","navigation/menu", "datatables","jquery-growl"], function ($,windows,liveapi, menu) {


    var table = null;
    var tradingWin = null;

    /* data: result of trading_times api */
    function processData(markets){
        markets = markets || [];
        //    || [{
        //    display_name: 'Forex',
        //    submarkets: [{
        //        display_name: 'Major Paris',
        //        instruments: [{
        //            delay_amount: 0,
        //            events: [{dates:'Fridays',descrip:'Closes early at(21:00)'}],
        //            display_name: 'AUD/JPY',
        //            settlement: '23:59:59',
        //            symbol: 'frxAUDJPY',
        //            times: {
        //                close: ['23:59:59'],
        //                open: ['00:00:00']
        //            }
        //        }]
        //    }]
        //}];
        /* extract market and submarket names */
        var market_names = [];
        var submarket_names = { };
        markets.forEach(function(market) {
            market_names.push(market.display_name);
            submarket_names[market.display_name] = [];
            market.submarkets.forEach(function (submarket) {
                submarket_names[market.display_name].push(submarket.display_name);
            })
        });

        /* get the rows for this particular marketname and sumbarket_name */
        function getRowsFor(marketname, submarket_name) {
            // TODO: comeback and use lodash once 'trade module' changes got merged.
            var market = markets.filter(function (m) { return m.display_name == marketname; })[0];
            var symbols = market && market.submarkets.filter(function (s) { return s.display_name == submarket_name; })[0].instruments;

            var rows = (symbols || []).map(function (sym) {
                return [
                    sym.display_name,
                    sym.times.open[0],
                    sym.times.close[0],
                    sym.times.settlement || sym.settlement || '-',
                    sym.events[0] ? sym.events[0].descrip + ':' + sym.events[0].dates : '-'
                ];
            });
            return rows;
        }

        return {
            market_names: market_names,
            submarket_names: submarket_names,
            getRowsFor: getRowsFor
        };
    }

    function init($menuLink) {
        require(["css!tradingtimes/tradingTimes.css"]);
        $menuLink.click(function () {
            if (!tradingWin) {
                tradingWin = windows.createBlankWindow($('<div/>'), {
                    title: 'Trading Times'.i18n(),
                    width: 700 ,
                    height: 400
                });
                tradingWin.track({
                  module_id: 'tradingTimes',
                  is_unique: true,
                  data: null
                });
                tradingWin.dialog('open');
                require(['text!tradingtimes/tradingTimes.html'], initTradingWin);
            }
            else
                tradingWin.moveToTop();
        });
    }

    function initTradingWin($html) {
        $html = $($html).i18n();
        var subheader = $html.filter('.trading-times-sub-header');
        table = $html.filter('table');
        $html.appendTo(tradingWin);

        table = table.dataTable({
            data: [],
            "columnDefs": [
                { className: "dt-body-center dt-header-center", "targets": [ 0,1,2,3,4 ] }
            ],
            paging: false,
            ordering: false,
            searching: true,
            processing: true
        });
        table.parent().addClass('hide-search-input');

        // Apply the a search on each column input change
        table.api().columns().every(function () {
            var column = this;
            $('input', this.header()).on('keyup change', function () {
                if (column.search() !== this.value)
                    column.search(this.value) .draw();
            });
        });

        var market_names = null,
            submarket_names = null;

        var refreshTable = function (yyyy_mm_dd) {
            var processing_msg = $('#' + table.attr('id') + '_processing').show();

            /* update the table with the given marketname and submarketname */
            var updateTable = function(result, market_name,submarket_name){
                console.log(market_name, submarket_name)
                var rows = result.getRowsFor(market_name, submarket_name);
                console.log(rows);
                table.api().rows().remove();
                table.api().rows.add(rows);
                table.api().draw();
            }

            /* refresh the table with result of {trading_times:yyyy_mm_dd} from WS */
            var refresh = function (data) {
                data = menu.extractChartableMarkets(data);
                var result = processData(data);

                if (market_names == null) {
                    var select = $('<select />');
                    select.appendTo(subheader);
                    market_names = windows.makeSelectmenu(select, {
                        list: result.market_names,
                        inx: 0,
                        changed: function (val) {
                            submarket_names.update_list(result.submarket_names[val]);
                            updateTable(result, market_names.val(), submarket_names.val());
                        }
                    });
                }

                if (submarket_names == null) {
                    var sub_select = $('<select />');
                    sub_select.appendTo(subheader);
                    submarket_names = windows.makeSelectmenu(sub_select, {
                        list: result.submarket_names[market_names.val()],
                        inx: 0,
                        changed: function (val) {
                            updateTable(result, market_names.val(), submarket_names.val());
                        }
                    });
                }

                updateTable(result, market_names.val(), submarket_names.val());
                processing_msg.hide();
            };

            liveapi.cached.send({ trading_times: yyyy_mm_dd })
            .then(refresh)
            .catch(function (error) {
                $.growl.error({ message: error.message });
                console.warn(error);
                refresh({});
            });
        }

        refreshTable(new Date().toISOString().slice(0, 10));
        tradingWin.addDateToHeader({
            title: 'Date: ',
            date: new Date(),
            changed: refreshTable
        });
    }

    return {
        init: init
    }
});
