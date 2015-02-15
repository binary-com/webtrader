/**
 * Created by arnab on 2/14/15.
 */

define(["charts/charts"], function() {
    return {
        toggleCrossHair : function( containerIDWithHash ) {
            var chart = $(containerIDWithHash).highcharts();
            if (chart)
            {
                chart.xAxis[0].crosshair = !chart.xAxis[0].crosshair;
                chart.yAxis[0].crosshair = !chart.yAxis[0].crosshair;
            }
        }
    };
});
