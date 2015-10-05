/**
 * Created by amin on 10/3/15.
 */
define(["jquery", "jquery-ui",'websockets/symbol_handler'], function ($,$ui,symbol_handler) {

    function init($parentObj) {
        $.get("reports/reports.html", function ($html) {
            $html = $($html);
            var button = $parentObj.find('button').button("widget");
            button.append($html).button("enable").button("refresh");
            var menu = button.closest('div').find("ul").menu();

            button.click(function (e) {
                e.preventDefault();
                menu.is(':visible') ? menu.hide(true) : menu.show(); // true to animate hide
                return false;
            }).focusout( menu.hide.bind(menu,true));

            /* create or reveal the tradingTimes Dialog on corresponding li click */
            require(['charts/chartWindow','reports/tradingTimes'], function (chartWindow,tradingTimes) {
                var tradingWin = null;
                var animation = {effect: "bounce",  times: 2, distance: 15 ,duration: 450};

                menu.find('li.tradingTimes').click(function () {
                    if (!tradingWin)
                        chartWindow.createBlankWindow('Trading Times', {width: 500}, function (win) {
                            tradingWin = win;
                            tradingWin.parent().effect(animation);
                            tradingTimes.init(tradingWin);
                        });
                    else
                        tradingWin.dialog('open') //.dialog('moveToTop')
                            .parent().effect(animation);
                });
            });
        });
    }

    return {
        init: init
    };
});
