/**
 * Created by arnab on 2/12/15.
 */

define(["jquery"], function($) {

    "use strict";

    var MIN_WIDTH = 400;
    var MIN_HEIGHT = 600;

    function reconfigureSize() {
        $(".mainContainer").height(Math.max($(window).height() - 20, MIN_HEIGHT));
        $(".chartContainer").width(Math.max($(window).width() - 28, MIN_WIDTH))
                            .height(Math.max($(window).height() - $(".topContainer").height() - 30, MIN_HEIGHT));

        $(".chartSubContainer").width($(".chartContainer").width() - 20)
                                .height($(".chartContainer").height() - 90);
    }

    return {
        init: function() {
            reconfigureSize();
            $(window).unbind("resize").resize(this.resizeHandler);
        },

        resizeHandler: function () {
            $(".mainContainer").height($(window).height() - 20);
            reconfigureSize();
            //TODO Change tabs to accordian for mobile sizes
        }
    };

});
