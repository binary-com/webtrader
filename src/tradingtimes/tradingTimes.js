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

    function addSpinnerToHeader(header,options) {
        var input = $('<input  class="spinner-in-dialog-header" type="text"></input>');
        input.val(options.value + '');
        input.insertAfter(header);
        var last_val = options.value + '';

        var spinner = input.spinner({
            max: options.max,
            min: options.min,
            spin: function (e, ui) {
                last_val = ui.value;
                spinner.trigger('changed',[ui.value]);
            }
        });
        // TODO: see if can be fixed in css without affecting other items
        spinner.parent().css('margin-left', '5px');
        spinner.parent().find('.ui-spinner-up').css('margin-top', 0);

        spinner.val = function () { return last_val + ''; };
        return spinner;
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
        var header = tradingWin.parent().find('.ui-dialog-title');
        header.css('width', '25%');

        var subheader = $('<div class="trading-times-sub-header" />');
        subheader.appendTo(tradingWin);

        var dt = new Date();
        $('<span class="span-in-dialog-header">Date: </span>').insertAfter(header);
        var day = addSpinnerToHeader(header, { value: dt.getDate(), min: 1, max: 31 });
        var month = addSpinnerToHeader(header, { value: dt.getMonth()+1, min: 1, max: 12 });
        var year = addSpinnerToHeader(header, { value: dt.getFullYear(), min: 2000, max: dt.getFullYear() });


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

        var refresh_table = function () {
            var yyyy_mm_dd = year.val() + '-' + month.val() + '-' + day.val();
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

        year.on('changed', refresh_table);
        month.on('changed', refresh_table);
        day.on('changed', refresh_table);
        refresh_table();
    }
   
    return {
        init: init
    }
});
