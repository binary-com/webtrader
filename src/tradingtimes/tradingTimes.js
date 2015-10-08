/**
 * Created by amin on 10/5/15.
 */
define(["jquery", "windows/windows","websockets/symbol_handler","datatables"], function ($,windows,symbol_handler) {
    loadCSS("//cdn.datatables.net/1.10.5/css/jquery.dataTables.min.css");


    var table = null;
    var tradingWin = null;

    /* result of trading_times api */
    function update(data){
        markets = data.trading_times.markets;
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
            var symbols = market.submarkets.find(function(s) { return s.name == submarket;}).symbols;
            var rows = symbols.map(function (sym) {
                return [
                    sym.name,
                    sym.times.open[0],
                    sym.times.close[0],
                    sym.settlement || '-',
                    sym.events[0].descrip + ':' + sym.events[0].dates
                ];
            });
            table.rows.add(rows);
            table.columns.adjust();
            table.draw();
        }

        updateTable(market_names[0], submarket_names[market_names[0]][0]);
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

    function addToHeader($element){
        var header = tradingWin.parent().find('.ui-dialog-title');
        header.css('width', '25%');
        $element.css({ float: 'left' }).insertAfter(header);
        return $element;
    }
    function addSpinner(list) {
        var spinner = $('<input>').spinner({
            max: list.lenght -1,
            min: 0,
            icons: { down: "ui-icon-triangle-1-s", up: "ui-icon-triangle-1-n" }
        });
        spinner.change(function () {
            var elem = $(this);
            //elem.val(list[elem.val()]);
        })
        .trigger("change");
        ggg = spinner;

        addToHeader(spinner);
    }

    function initTradingWin() {
        addToHeader($('<span>Date: </span>'));
        addSpinner(["a", "bcd", "dd"]);

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

        symbol_handler.fetchMarkets(update)
    }
   
    return {
        init: init
    }
});
