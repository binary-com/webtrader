/**
 * Created by arnab on 4/3/15.
 */


define(['highstock', 'lodash'], function() {

    if (!window['DrawTool']) {
        /*    -----------------------------------------------DrawTool (Base Constructor for all Drawing Tools)----------------------------------------------------------*/

        DrawTool = function(type, chartID, options) {
            try {
                this.drawTool = type;
                this.toolID = this.generateUniqueToolID();
                this.chartID = chartID;
                this.drawOptions = options || this.getDefaultDrawOptions();

                this.chartRef = $(this.chartID).highcharts();
                this.series = this.chartRef.series[0];
                this.Renderer = Highcharts.Renderer;
                this.self = this;

                //TODO SAVE TO CACHE ONCE DRAWTOOL IS DRAWN NOT ON INITIALIZATION 
                this.cacheDrawTool();            

            } catch (ex) {
                console.log("Error Initialising DrawTool");
            }
        }


        //Generates a unique ToolId  => type + "_"+ time
        DrawTool.prototype.generateUniqueToolID = function() {
            return this.drawTool + '_' + new Date().getTime();
        };

        //Keeping it Static for general purpose use outside
        DrawTool.prototype.listAllDrawTools = function(chartID) {
            return $(chartID).data('tools') || [];
        }

        //Keeping it Static for general purpose use outside
        DrawTool.prototype.getDrawTool = function(chartID, toolID) {
            var toolID = this.toolID || toolID,
                toolList = $(chartID).data('tools');

            // Find the Tool  
            var tool = _.find(toolList, function(tool) {
                return tool.toolID == toolID;
            }, this);

            return tool;
        }


        DrawTool.prototype.getDefaultDrawOptions = function() {
            return {};
        }

        //This will save & cache the Tool Instance on the Chart Container itself 
        //TODO:- Work on how to save the cache if Chart is refreshed & then reapply/redraw all the tool instance maybe use Localstorage()
        DrawTool.prototype.cacheDrawTool = function() {
            var toolList = $(this.chartID).data('tools');
            if (toolList) {
                toolList.push(this);
            } else {
                $(this.chartID).data('tools', []).data('tools').push(this);
            }
            return this;
        }

        DrawTool.prototype.destroyDrawTool = function(chartID, toolID) {
            var toolID = this.toolID || toolID,
                toolList = $(this.chartID || chartID).data('tools');

            // FIND THE TOOL ID

            // REMOVE THE TOOL ID FROM THE CACHE LIST
            var toolRef = _.remove(toolList, function(tool) {
                return tool.toolID == toolID;
            });

            toolRef = toolRef[0];

            // CALL THE DESTROY ON THE TOOL
            toolRef.remove();
            return this;
        }


        DrawTool.prototype.removeDrawTool = function(chartID, toolID) {

            var chartID = this.chartID || chartID,
                toolList = $(chartID).data('tools');

            if (toolList && toolID) {

                //Destroy All DrawTools on the given Chart
                var tool = _.find(toolList, function(tool) {
                    return tool.toolID == toolID;
                }, this);

                if (tool && tool.remove) {
                    tool.remove();
                }
            }
            return this;
        }


        DrawTool.prototype.destroyAllDrawTools = function(chartID) {

            var chartID = this.chartID || chartID,
                toolList = $(chartID).data('tools');

            if (toolList) {
                //Destroy All DrawTools on the given Chart
                _.forEach(toolList, function(tool) {
                    if (tool && tool.remove) {
                        tool.remove();
                    }
                }, this);
            }

            return this;
        }

        DrawTool.prototype.isPointInsideChartArea = function(pointX, pointY) {
            return this.chartRef.isInsidePlot(pointX, pointY);
        }

        DrawTool.prototype.bindClick = function(drawOptions, handler) {
            $(this.chartID).on('click', this, handler);
        }

        DrawTool.prototype.unBindClick = function(handler) {
            $(this.chartID).off('click', handler);
        }

        DrawTool.prototype.addEventhandlers = function(drawOptions) {
            this.drawOptions = this.drawOptions || this.getDefaultDrawOptions();
            this.drawOptions.id = this.toolID;
            this.bindClick(this.drawOptions, this.clickHandler);
        }

        DrawTool.prototype.removeEventhandlers = function() {
            this.unBindClick(this.clickHandler);
        }

        DrawTool.prototype.clickHandler = function(e) {
            try {
                var chartID = e.data.chartID,
                    drawOptions = e.data.drawOptions || drawOptions,
                    seriesRef = e.data.drawOptions.seriesRef,
                    self = e.data.self;

                console.log('Clicked chart at ' + e.chartX + ', ' + e.chartY);

                if (e.originalEvent.xAxis || e.originalEvent.yAxis) {

                    //drawOptions.time = e.originalEvent.xAxis[0].value;
                    //drawOptions.value = e.originalEvent.yAxis[0].value;

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



        /**
         * Add crossbrowser support for chartX and chartY
         * @param {Object} e The event object in standard browsers
         */
        DrawTool.prototype.getHighchartNormalizedPoint = function(e) {

            return (this.chartRef) ? this.chartRef.pointer.normalize(e) : Highcharts.Pointer.prototype.normalize(e);
        }

        //Sets the panning of Chart on mouse drag
        DrawTool.prototype.setChartPanning = function(boolVal, container) {

            (this.chartRef) ? this.chartRef.options.chart.panning = boolVal:
                $(container).highcharts().options.chart.panning = boolVal;

        }


        DrawTool.prototype.getValueFromCoordinates = function(x, y) {
            return {
                x: Math.round(this.series.xAxis.toValue(x)) || 0,
                y: this.series.yAxis.toValue(y) || 0
            }
        }


        DrawTool.prototype.getCoordinatesFromvalue = function(x, y) {
            return {
                x: this.series.xAxis.toPixels(x),
                y: this.series.yAxis.toPixels(y)
            }

        }

        DrawTool.prototype.getPointDetailsFromCoordinates = function(x, y) {
            var pointValues = this.getValueFromCoordinates(x, y);

            return {
                xPos: x,
                yPos: y,
                xValue: Math.round(pointValues.x),
                yValue: pointValues.y
            };
        }

        DrawTool.prototype.getDateTimeString = function(unixTimeStamp) {
            var date = new Date(unixTimeStamp);
            var dateArr = date.toString().split(' ').splice(0, 5);
            return dateArr[0] + ", " + dateArr[1] + " " + dateArr[2] + " " + dateArr[3] + " " + dateArr[4];
        };


        DrawTool.prototype.bindDrag = function(container, callback) {
            // unbind 'click'
            // on chartID
            var container = container || this.chartID;
            $(container).on('mousedown', { ref: this, container: container, callback: callback }, this.startDrag);

        }

        DrawTool.prototype.startDrag = function(e) {
            // unbind 'click'
            // on chartID     

            var self = e.data.ref,
                callback = e.data.callback,
                container = e.data.container || self.chartID,
                chartRef = self.chartRef || $(self.chartID).highcharts();

            e = self.getHighchartNormalizedPoint(e);

            //Disable Chart Panning
            self.setChartPanning(false, container);

            //Ignore if clicked outside main chart area    
            if (!self.isPointInsideChartArea(e.chartX, e.chartY)) {
                return;
            }

            var point = self.getValueFromCoordinates(e.chartX, e.chartY);

            self.startPos = {
                x: e.chartX,
                y: e.chartY,
                xValue: point.x,
                yValue: point.y
            };

            //$(self.chartID).off('mousemove', self.mouseDrag);
            $(container).on('mousemove', { ref: self, container: container, callback: callback }, self.mouseDrag);


            $(container).one('mouseup', function() {
                console.info('DrawTool Created: ' + self.toolID);
                self.unbindDrag(container);

                if (self.bindNext) {
                    self.bindNext();
                }
            });

            // e.preventDefault();
            // e.stopPropogation();

        }

        DrawTool.prototype.mouseDrag = function(e) {
            // unbind 'click'
            // on chartID
            var self = e.data.ref,
                callback = e.data.callback,
                container = e.data.container || self.chartID,
                chartRef = self.chartRef || $(self.chartID).highcharts();


            e = self.getHighchartNormalizedPoint(e);

            //Ignore if dragged outside main chart area    
            if (!self.isPointInsideChartArea(e.chartX, e.chartY)) {
                return;
            }

            var point = self.getValueFromCoordinates(e.chartX, e.chartY);

            self.endPos = {
                x: e.chartX,
                y: e.chartY,
                xValue: point.x,
                yValue: point.y
            };

            // call the update / step function
            callback.call(self);
        }

        DrawTool.prototype.unbindDrag = function(container) {

            var container = this.chartID || container;

            //Re-Enable Chart Panning
            this.setChartPanning(true);

            //Checking if 'mousedown' Event is to be kept active after 'mouseup' Event    
            if (this.drawOnce == true) {
                $(container).off('mousedown', this.startDrag);
            }

            //Disable Mouse-move
            $(container).off('mousemove', this.mouseDrag);
        }


        // Move the shape object along with the Chart panning
        DrawTool.prototype.panShapeAlongWithTheChart = function(elem, callback) {

            H.wrap(H.Pointer.prototype, 'drag', function(c, e) {


                var chart = this.chart;
                var renderer = chart.renderer;
                var bbox = chart.container.getBoundingClientRect();
                e = chart.pointer.normalize();

                c.call(this, e);
            });
        }

        DrawTool.prototype.dragTool = function(item, callback) {

            var self = this,
                object = object,
                callback = callback;


            $(item).on('mousedown', function(e) {

                e = self.getHighchartNormalizedPoint(e);

                //disable Chart Panning
                self.setChartPanning(false);


                //Ignore if clicked outside main chart area    
                if (!self.isPointInsideChartArea(e.chartX, e.chartY)) {
                    return;
                }

                self.dragStartPos = {
                    x: e.chartX,
                    y: e.chartY
                };


                //$(self.chartID).off('mousemove', self.mouseDrag);
                $(item).mousemove(function(e) {

                    e = self.getHighchartNormalizedPoint(e);

                    self.dragEndPos = {
                        x: e.chartX,
                        y: e.chartY
                    };

                    $(item).one('mouseup mouseout', function(e) {

                        //Re-Enable Chart Panning
                        self.setChartPanning(true);

                        //Disable 
                        //$(container).off('mousedown', this.startDrag);

                        //Disble Mouse-move
                        $(item).off('mousemove');
                    });

                    // call the update / step function
                    callback.call(self);
                });

            });
        };


        DrawTool.prototype.openDialog = function() {
            if (!this.dialog) {
                this.createDialog();

            } else {
                this.$dialog = this.dialog.openDialog(this.chartID, _.bind(function($dialog) {
                    this.$dialog = $dialog.data('reference', this);
                }, this));
                //Saving Jquery Refrence of Dialog on 'this'
                //this.$dialog=$('.lineDrawOptions').data('reference', this);
            }
        }


        DrawTool.prototype.onHoverCursor = function() {
            // ADD HAND CURSOR
        }



        /*    -----------------------------------------------DrawTool----------------------------------------------------------*/

        window['DrawTool'] = DrawTool;
    }

    //return window['DrawTool'] = DrawTool;

});
