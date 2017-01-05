/**
 * Created by arnab on 2/14/15.
 */

define(["charts/charts"], function() {

    var crossHair_highchartsConf = {
			width: 2,
			color: 'red',
			dashStyle: 'dash'
		};
    var toggleCrossHair = function( containerIDWithHash ) {
        var chart = $(containerIDWithHash).highcharts();
        if (chart)
        {
            chart.xAxis[0].crosshair = chart.xAxis[0].crosshair ? null : crossHair_highchartsConf;
            chart.yAxis[0].crosshair = chart.yAxis[0].crosshair ? null : crossHair_highchartsConf;
            if (chart.yAxis[0].crosshair)
            {
                chart.tooltip.options.formatter = null;
            }
            else
            {
                chart.tooltip.options.formatter = function() {
                    return false;
                };
            }
        }
    };

    return {
        toggleCrossHair: toggleCrossHair
    };

});
