/**
 * Created by amin on 10/5/15.
 */
define(["jquery", "windows/windows","websockets/eventSourceHandler","datatables","jquery-growl"], function ($,windows,liveapi) {


    var table = null;
    var tradingWin = null;

    /* result of trading_times api */
    function update(data){
        markets = (data.trading_times && data.trading_times.markets) || [];
        //    || [{
        //    name: 'Forex',
        //    submarkets: [{
        //        name: 'Major Paris',
        //        symbols: [{
        //            delay_amount: 0,
        //            events: [{dates:'Fridays',descrip:'Closes early at(21:00)'}],
        //            name: 'AUD/JPY',
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
            market_names.push(market.name);             
            submarket_names[market.name] = [];
            market.submarkets.forEach(function (submarket) {
                submarket_names[market.name].push(submarket.name);
            })
        });

        function updateTable(name, submarket) {
            var market = markets.find(function (m) { return m.name == name; });
            var symbols = (market && market.submarkets.find(function (s) { return s.name == submarket; }).symbols)
                || [];
            var rows = symbols.map(function (sym) {
                return [
                    sym.name,
                    sym.times.open[0],
                    sym.times.close[0],
                    sym.settlement || '-',
                    sym.events[0] ? sym.events[0].descrip + ':' + sym.events[0].dates : '-'
                ];
            });
            table.api().rows().remove();
            table.api().rows.add(rows);
            table.api().draw();
        }

        return {
            market_names: market_names,
            submarket_names: submarket_names,
            updateTable: updateTable
        };
    }

    function init(li) {
        li.click(function () {
            if (!tradingWin) {
                tradingWin = windows.createBlankWindow($('<div/>'), { title:'Trading Times', width: 800 });
                initTradingWin();
            }
            tradingWin.dialog('open');

        });
    }

    function initTradingWin() {
        var subheader = $('<div class="trading-times-sub-header" />');
        $('<span class="subheader-message"/>').text('All times are in GMT(Greenwich mean time).').appendTo(subheader);
        subheader.appendTo(tradingWin);

        table = $("<table width='100%' class='display compact'/>");
        table.appendTo(tradingWin);
        table = table.dataTable({
            data: [],
            columns: [
                {title: 'Asset'},
                {title: 'Opens'},
                {title: 'Closes'},
                {title: 'Settles'},
                {title: 'Upcoming Events'}
            ],
            "columnDefs": [
                { className: "dt-body-center dt-header-center", "targets": [ 0,1,2,3,4 ] }
            ],
            paging: false,
            ordering: false,
            searching: true,
            processing: true
        });
        table.parent().addClass('hide-search-input');

        table.find('thead th').each(function () {
            var th = $(this),
                text = th.text();
            th.html(text +'<br/><input class="search-input" placeholder="Search ' + text + '" />');
        });
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

        var refresh_table = function (yyyy_mm_dd) {
            var processing_msg = $('#' + table.attr('id') + '_processing');
            processing_msg.show();

            var refresh = function (data) {
                var result = update(data);
                if (market_names == null) {
                    var select = $('<select class="spinner-in-dialog-body"/>');
                    select.appendTo(subheader);
                    market_names = windows.makeSelectmenu(select, {
                        list: result.market_names,
                        inx: 0,
                        changed: function (val) {
                            submarket_names.update_list(result.submarket_names[val]);
                            result.updateTable(market_names.val(), submarket_names.val());
                        }
                    });
                }

                if (submarket_names == null) {
                    var sub_select = $('<select />');
                    sub_select.appendTo(subheader);
                    submarket_names = windows.makeSelectmenu(sub_select, {
                        list: result.submarket_names[market_names.val()],
                        inx: 0,
                        changed: function (val) { result.updateTable(market_names.val(), submarket_names.val()); }
                    });
                }

                result.updateTable(market_names.val(), submarket_names.val());
                processing_msg.hide();
            };
            
            liveapi.send({ trading_times: yyyy_mm_dd })
            .then(refresh)
            .catch(function (error) {
                refresh({});
                $.growl.error({ message: error.message });
                console.warn(error);
            });
        }
        refresh_table(new Date().toISOString().slice(0, 10));

        tradingWin.addDateToHeader({
            title: 'Date: ',
            date: new Date(),
            changed: refresh_table
        });
    }
   
    return {
        init: init
    }
});
