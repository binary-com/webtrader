/**
 * Created by arnab on 2/14/15.
 */

define(["jquery"], function($) {

    "use strict";
    var MIN_WIDTH = 350;
    var MIN_HEIGHT = 400;

    return {

        validateNumericBetween : function(value, min, max) {
            return $.isNumeric(value) && Math.floor(value) == value && min <= value && max >= value;
        },

        //10 for desktop and 4 for mobile devices
        validateIfNoOfChartsCrossingThreshold : function( noOfChartsAlreadyOpened ) {
            var ret = true;
            if ((noOfChartsAlreadyOpened + 1) > 10)
            {
                ret = false;
            }
            else
            {
                if ($(window).width() <= MIN_WIDTH && (noOfChartsAlreadyOpened + 1) > 4)
                {
                    ret = false;
                }
            }
            return ret;
        }

    };
});
