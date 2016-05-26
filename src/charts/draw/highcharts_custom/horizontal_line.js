/**
 * Created by Arnab Karmakar on 12/7/15.
 */
define(['highstock', 'common/util'], function () {

    /*
         This is a map storing information as -
         horizontalLineOptions[seriesID] = {
             stroke : 'red',
             strokeWidth : 1,
             dashStyle : 'dash',
             parentSeriesID : seriesID
         }
     */
    var horizontalLineOptionsMap = {};

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
                    var value = evt.yAxis[0].value;
                    var axis = evt.yAxis[0].axis;
                    var uniqueID = 'horizontalLine_' + new Date().getTime();
                    var line = axis.addPlotLine({
                        value: value,
                        width: 2,
                        color: 'green',
                        id: uniqueID
                    }).svgElem
                    .css({'cursor':'pointer'})
                    .attr('id',uniqueID)
                    .translate(0,0)
                    .on('mousedown', updateHorizontalLine)
                    .on('dblclick', removeLine);
                    horizontalLineOptionsMap[uniqueID] = line;
                }

                function updateHorizontalLine(evt) {
                    chart.annotate = true;
                    var lineID = $(this).attr('id'),
                        line = horizontalLineOptionsMap[lineID],
                        clickY = evt.pageY - line.translateY,
                        clickX,
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
                    delete horizontalLineOptionsMap[lineID];
                    chart.yAxis[0].removePlotLine(lineID);
                }
            }(Highcharts, jQuery));

        }
    };

});
