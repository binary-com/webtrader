/**
 * Created by amin on 10/5/15.
 */
define(["jquery", "windows/windows","websockets/symbol_handler","datatables"], function ($,windows,symbol_handler) {
    loadCSS("//cdn.datatables.net/1.10.5/css/jquery.dataTables.min.css");


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
            table.rows().remove();
            table.rows.add(rows);
            table.draw();
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
                tradingWin = windows.createBlankWindow($('<div/>'), { title:'Trading Times', width: 700 });
                initTradingWin();
            }
            tradingWin.dialog('open');

        });
    }

    function addSpinnerToBody(sub_header,inx, list) {
        var input = $('<input  class="spinner-in-dialog-body" type="text"></input>');
        input.val(list[inx]);
        input.appendTo(sub_header);

        var spinner = input.spinner({
            max: list.length - 1,
            min: 0,
            spin: function(e,ui){
                e.preventDefault();
                var direction = (ui.value | 0) === 0 ? -1 : +1;
                inx = inx + direction;
                inx = Math.max(inx, 0);
                inx = Math.min(inx, list.length - 1);
                input.val(list[inx]);
                spinner.trigger('changed', [list[inx]]);
            }
        });

        spinner.parent().css('margin-left', '5px');
        spinner.parent().find('.ui-spinner-up').css('margin-top', 0);
        spinner.update_list = function (new_list) {
            list = new_list;
            inx = 0;
            input.val(list[inx]);
        }
        return spinner;
    }

    function initTradingWin() {
        var subheader = $('<div class="trading-times-sub-header" />');
        subheader.appendTo(tradingWin);

        table = $("<table width='100%' class='display compact'/>");
        table.appendTo(tradingWin);
        table = table.DataTable({
            data: [],
            columns: [
                {title: 'Asset'},
                {title: 'Opens'},
                {title: 'Closes'},
                {title: 'Settles'},
                {title: 'Upcoming Events'}
            ],
            paging: false,
            ordering: false,
            searching: false
        });

        var market_names = null,
            submarket_names = null;

        var refresh_table = function (yyyy_mm_dd) {
            symbol_handler.fetchMarkets(function (data) {
                var result = update(data);
                if (market_names == null)
                    market_names = addSpinnerToBody(subheader, 0, result.market_names);
                
                if (submarket_names == null) 
                    submarket_names = addSpinnerToBody(subheader, 0, result.submarket_names[market_names.val()]);
                
                submarket_names.on('changed', function (e, val) {
                    result.updateTable(market_names.val(), submarket_names.val());
                })
                market_names.on('changed', function (e, val) {
                    submarket_names.update_list(result.submarket_names[val]);
                    result.updateTable(market_names.val(), submarket_names.val());
                });
                result.updateTable(market_names.val(), submarket_names.val());
            },yyyy_mm_dd);
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
