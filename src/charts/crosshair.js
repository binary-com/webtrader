/**
 * Created by arnab on 2/14/15.
 */

define(["charts/charts"], function() {
    return {
        toggleCrossHair : function( containerIDWithHash ) {
            var chart = $(containerIDWithHash).highcharts();
            if (chart)
            {
                if (chart.series[0].option.tooltip.crosshairs[0])
                {
                    chart.series[0].option.tooltip.crosshairs = [false, false];
                    chart.series[0].option.tooltip.enabled = false;
                }
                else
                {
                    chart.series[0].option.tooltip.crosshairs = [true, true];
                    chart.series[0].option.tooltip.enabled = true;
                }
            }
        }
    };
});
