/**
 * Created by arnab on 2/14/15.
 */

define(["jquery", "common/util"], function($) {

    "use strict";

    return {

        validateNumericBetween : function(value, min, max) {
            return $.isNumeric(value) && Math.floor(value) == value && min <= value && max >= value;
        },

        /*
            We are not restricting how many dialogs user can open on desktop or laptop as long as their system
            resource can support. Since we moved to WS API, we are capable of handling large instruments now.
            This application is not meant for small devices. However if anyone opens it in small device, we will
            show one window
        */
        validateIfNoOfChartsCrossingThreshold : function( noOfChartsAlreadyOpened ) {
            var ret = isSmallView() && (noOfChartsAlreadyOpened + 1) > 1
            return !ret;
        }

    };
});
