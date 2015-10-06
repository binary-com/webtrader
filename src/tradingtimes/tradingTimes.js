/**
 * Created by amin on 10/5/15.
 */
define(["jquery", "charts/chartWindow","websockets/symbol_handler","datatables"], function ($,chartWindow,symbol_handler) {
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
                return [sym.name, sym.times.open[0], sym.times.close[0], sym.settlement, sym.events[0].descrip + ':' + sym.events[0].dates];
            });
            table.rows.add(rows);
        }

        updateTable(market_names[0], submarket_names[market_names[0]][0]);
    }

    function init(li) {
        li.click(function () {
            if (!tradingWin)
                chartWindow.createBlankWindow('Trading Times', { width: 500 }, function (win) {
                    tradingWin = win;
                    initTradingWin();
                });
            else
                tradingWin.dialog('open');

        });
    }

    function initTradingWin() {

        table = $("<table width='100%' class='display' cellspacing='0'/>");
        table.appendTo(tradingWin.find('.chartSubContainer'));
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
            searching: false
        });

        symbol_handler.fetchMarkets(update)
    }
   
    return {
        init: init
    }
});
