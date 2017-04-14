/**
 * Created by arnab on 2/14/15.
 */
const crossHair_highchartsConf = {
  width: 2, //This looks better
  color: 'red',
  dashStyle: 'dash'
};
export const toggleCrossHair = (containerIDWithHash) => {
  const chart = $(containerIDWithHash).highcharts();
  if (chart) {
    chart.xAxis[0].crosshair = chart.xAxis[0].crosshair ? false : crossHair_highchartsConf;
    chart.yAxis[0].crosshair = chart.yAxis[0].crosshair ? false : crossHair_highchartsConf;
    if (chart.yAxis[0].crosshair) {
      chart.tooltip.options.formatter = null;
    } else {
      chart.tooltip.options.formatter = () => {
        return false;
      };
    }
  }
};

export default {
  toggleCrossHair
}
