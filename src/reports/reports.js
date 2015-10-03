/**
 * Created by amin on 3/10/15.
 */
define(["jquery", "jquery-ui"], function ($,$ui) {

    function tradingTimes() {

    }

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

            menu.find('li.tradingTimes').click(tradingTimes);
        });
    }

    return {
        init: init
    };
});
