/**
 * Created by arnab on 2/14/15.
 */

define(["jquery"], function($) {
    return {

        validateNumericBetween : function(value, min, max) {
            return $.isNumeric(value) && Math.floor(value) == value && min <= value && max >= value;
        },


        validateTimeperiodNotBelow : function(value, minTimeperiod) {
            return $.isNumeric(value) && value >= minTimeperiod;
        }

    };
});
