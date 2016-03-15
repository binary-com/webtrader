/**
 * Created by Ankit on 15 March 2016.
 */
define(['highstock', 'charts/draw/highcharts_custom/DrawingBase'], function() {

    if (!window['DrawTool']) {
        return;
    }




    if (!window['PlotLine']) {

        /*    -----------------------------------------------PLOTLINE (Base Constructor for Horizontal & Vertical Line)----------------------------------------------------------*/
        PlotLine = function(type, chartID, options) {

            DrawTool.call(this, type, chartID, options);

            // Keeping bindOnce to true will limit the Drawing of HorizontalLine to One Instance per User-Interaction
            this.drawOnce = true;
            this.decimals = 4;

        };
        PlotLine.prototype = Object.create(DrawTool.prototype);
        PlotLine.constructor = PlotLine;

        PlotLine.prototype.addEventhandlers = function(drawOptions) {
            this.drawOptions = this.drawOptions || this.getDefaultDrawOptions();
            this.drawOptions.id = this.toolID;
            this.bindClick(this.drawOptions, this.clickHandler);
        }
        PlotLine.prototype.removeEventhandlers = function() {

            this.unBindClick(this.clickHandler);

        }
        PlotLine.prototype.clickHandler = function(e) {
            try {
                var chartID = e.data.chartID,
                    drawOptions = e.data.drawOptions || drawOptions,
                    seriesRef = e.data.drawOptions.seriesRef,
                    self = e.data.self;

                console.log('Clicked chart at ' + e.chartX + ', ' + e.chartY);

                if (e.originalEvent.xAxis || e.originalEvent.yAxis) {                   

                    self.drawOptions.time = e.originalEvent.xAxis[0].value;
                    self.drawOptions.value = Number((e.originalEvent.yAxis[0].value).toFixed(self.decimals || 2));

                    if (self.drawOnce)
                        self.removeEventhandlers();

                    self.create();
                    //callback(e, drawOptions);
                }

            } catch (ex) {

                console.error('Error on Drawing:' + ex.message);
            }

        }


        /*    -----------------------------------------------PLOTLINE----------------------------------------------------------*/
        window['PlotLine'] = PlotLine;
    }

});
