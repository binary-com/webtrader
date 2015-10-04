/**
 * Created by amin on 3/10/15.
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
            require(['charts/chartWindow'], function (chartWindow) {
                var tradingWin = null;
                var onClose = function (title, win) {
                    if (tradingWin && win.attr('id') == tradingWin.attr('id'))
                        tradingWin = null;
                };

                menu.find('li.tradingTimes').click(function () {
                    if (!tradingWin)
                        chartWindow.createBlankWindow('Trading Times', onClose, function (win) {
                            tradingWin = win;
                        });
                    else
                        tradingWin.dialog('moveToTop')
                            .parent().effect("bounce", { times: 2, distance: 15 }, 450);
                });
            });
        });
    }

    return {
        init: init
    };
});
