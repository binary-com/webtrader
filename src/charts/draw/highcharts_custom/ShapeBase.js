/**
 * Created by Ankit on 14 March 2016.
 */
define(['highstock', 'charts/draw/highcharts_custom/DrawingBase'], function() {

    if (!window['DrawTool']) {
        return;
    }


    if (!window['Shape']) {

        /*    ------------------------------SHAPE (Base Constructor for Circle , Rect & text)---------------------------*/

        Shape = function(type, chartID, options) {
            DrawTool.call(this, type, chartID, options);
            // Keeping bindOnce to true will limit the Drawing of HorizontalLine to One Instance per User-Interaction
            this.drawOnce = true;
            this.decimals = 4;
        };
        Shape.prototype = Object.create(DrawTool.prototype);
        Shape.prototype.constructor = Shape;

        //  This will save the Position of the Object on the instance itself 
        //  position will also get updated when the Item is dragged
        //  The position will be required for updating the Shape object when chart is panned  
        Shape.prototype.saveObjectPosition = function() {
            //The Shape will move along with the chart panning
            this.panShapeAlongWithTheChart();
        };

        Shape.prototype.addEventhandlers = function(drawOptions) {
            this.drawOptions = this.drawOptions || drawOptions || this.getDefaultDrawOptions();
            this.drawOptions.id = this.toolID;
            this.bindDrag(null, this.onDraw);
        }

        Shape.prototype.onDraw = function() {
            this.create();
        }

        /*    -----------------------------------------------SHAPE----------------------------------------------------------*/

        window['Shape'] = Shape;
    }

});
