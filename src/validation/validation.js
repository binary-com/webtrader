/**
 * Created by arnab on 2/14/15.
 */

define(["jquery", "common/util"], function($) {

    "use strict";
    var MIN_WIDTH = 350;
    var MIN_HEIGHT = 400;

    return {

        validateNumericBetween : function(value, min, max) {
            return $.isNumeric(value) && Math.floor(value) == value && min <= value && max >= value;
        },

        //10 for desktop and 1 for mobile devices
        validateIfNoOfChartsCrossingThreshold : function( noOfChartsAlreadyOpened ) {
            var ret = true;
            if ((noOfChartsAlreadyOpened + 1) > 10)
            {
                ret = false;
            }
            else
            {
                if (isSmallView() && (noOfChartsAlreadyOpened + 1) > 1)
                {
                    ret = false;
                }
            }
            return ret;
        }

    };
});
