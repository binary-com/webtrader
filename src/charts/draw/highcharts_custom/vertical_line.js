/**
 * Created by Arnab Karmakar on 12/7/15.
 */
define(['highstock', 'common/util'], function () {

    /*
         This is a map storing information as -
         verticalLineOptions[seriesID] = {
             stroke : 'red',
             strokeWidth : 1,
             dashStyle : 'dash',
             parentSeriesID : seriesID
         }
     */
    var verticalLineOptionsMap = {};

    return {

        init: function(refererChartID) {
            (function(H,$){
                //Make sure that HighStocks have been loaded
                if (!H) return;

                var chart = $(refererChartID).highcharts();
                H.addEvent(chart,'click',function(evt){
                    if(chart.annotate){
                        chart.annotate = false;
                        addPlotLines(chart, evt);
                        H.removeEvent(chart,'click');
                    }
                });

                function addPlotLines(chart, evt){
                    var value = evt.xAxis[0].value;
                    var axis = evt.xAxis[0].axis;
                    var uniqueID = 'verticalLine_' + new Date().getTime();
                    var line = axis.addPlotLine({
                        value: value,
                        width: 2,
                        color: 'red',
                        id: uniqueID
                    }).svgElem
                    .css({'cursor':'pointer'})
                    .attr('id',uniqueID)
                    .translate(0,0)
                    .on('mousedown', updateverticalLine)
                    .on('dblclick', removeLine);
                    verticalLineOptionsMap[uniqueID] = line;
                }

                function updateverticalLine(evt) {
                    chart.annotate = true;
                    var lineID = $(this).attr('id'),
                        line = verticalLineOptionsMap[lineID],
                        clickY,
                        clickX = evt.pageX - line.translateX,
                        mouseUpEventAdded = false;
                    
                    H.wrap(H.Pointer.prototype, 'drag', function(c, e){
                        if(chart.annotate){
                            if(!mouseUpEventAdded){
                                mouseUpEventAdded = true;
                                $(refererChartID).one("mouseup", function(){
                                    chart.annotate = false;
                                    mouseUpEventAdded = false;
                                });
                            }
                            if(chart.isInsidePlot(e.chartX -chart.plotLeft, e.chartY - chart.plotTop)){
                                line.translate(e.pageX - clickX, e.pageY - clickY);
                            }
                            
                        } else{
                            c.call(this, e);
                        }
                    });
                }

                function removeLine(evt){
                    var lineID = $(this).attr('id');
                    delete verticalLineOptionsMap[lineID];
                    chart.xAxis[0].removePlotLine(lineID);
                }
            }(Highcharts, jQuery));

        }
    };

});
