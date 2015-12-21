/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var mamaOptionsMap = {}, mamaSeriesMap = {};
    var smooth = [], detrender = [], period = [], I1 = [], Q1 = [], I2 = [], Q2 = [], Re = [], Im = [], smoothPeriod = [], phase=[];
    function calculateMamaValue(data, mamaData, index, fastLimit, slowLimit, type, appliedTo) {
        /*FORMULA
        Inputs: Price((H+L)/2),   FastLimit(.5),   SlowLimit(.05);  
        Vars: Smooth(0),   Detrender(0),   I1(0),   Q1(0),   jI(0),  jQ(0),  I2(0),  Q2(0),  Re(0),   Im(0),   Period(0),  SmoothPeriod(0),  Phase(0),  DeltaPhase(0),  alpha(0),  MAMA(0),       FAMA(0);     
        If CurrentBar > 5 then begin 
            Smooth = (4*Price + 3*Price[1] + 2*Price[2] + Price[3]) / 10;  
            Detrender = (.0962*Smooth + .5769*Smooth[2] - .5769*Smooth[4] - .0962*Smooth[6])*(.075*Period[1] + .54);  
            //Compute InPhase and Quadrature components
            Q1 = (.0962*Detrender + .5769*Detrender[2] - .5769*Detrender[4] - .0962*Detrender[6])*(.075*Period[1] + .54);   
            I1 = Detrender[3];  
            //{Advance the phase of I1 and Q1 by 90 degrees} 
            jI = (.0962*I1 + .5769*I1[2] - .5769*I1[4] - .0962*I1[6])*(.075*Period[1] + .54);
            jQ = (.0962*Q1 + .5769*Q1[2] - .5769*Q1[4] - .0962*Q1[6])*(.075*Period[1] + .54);  
            //{Phasor addition for 3 bar averaging)}  
            I2 = I1 - jQ; 
            Q2 = Q1 + jI;  
            //{Smooth the I and Q components before applying the discriminator} 
            I2 = .2*I2 + .8*I2[1];  
            Q2 = .2*Q2 + .8*Q2[1];  
            //{Homodyne Discriminator} 
            Re = I2*I2[1] + Q2*Q2[1];  
            Im = I2*Q2[1] - Q2*I2[1]; 
            Re = .2*Re + .8*Re[1];  
            Im = .2*Im + .8*Im[1]; 
            If Im <> 0 and Re <> 0 then Period = 360/ArcTangent(Im/Re); 
            If Period > 1.5*Period[1] then Period = 1.5*Period[1];
            If Period < .67*Period[1] then Period = .67*Period[1]; 
            If Period < 6 then Period = 6;  
            If Period > 50 then Period = 50; 
            Period = .2*Period + .8*Period[1]; 
            SmoothPeriod = .33*Period + .67*SmoothPeriod[1];  
            If I1 <> 0 then Phase = (ArcTangent(Q1 / I1)); 
            DeltaPhase = Phase[1] - Phase; 
            If DeltaPhase < 1 then DeltaPhase = 1;
            alpha = FastLimit / DeltaPhase; 
            If alpha < SlowLimit then alpha = SlowLimit;
            MAMA = alpha*Price + (1 - alpha)*MAMA[1];       
            FAMA = .5*alpha*MAMA + (1 - .5*alpha)*FAMA[1];    
        End; */

        if (index <= 5) {
            smooth.push(0), period.push(0), detrender.push(0), I1.push(0), Q1.push(0),
            I2.push(0), Q2.push(0), Re.push(0), Im.push(0), smoothPeriod.push(0), phase.push(0);
        }
        if (index > 5) {
            //var smoothValue = (4 * price[index] + 3 * price[index - 1] + 2 * price[index - 2] + 1 * price[index - 3] + 0 * price[index - 4]) / 10;
            var smoothValue = (4 * indicatorBase.getPrice(data, index, appliedTo, type)
                + 3 * indicatorBase.getPrice(data, index - 1, appliedTo, type)
                + 2 * indicatorBase.getPrice(data, index - 2, appliedTo, type)
                + 1 * indicatorBase.getPrice(data, index - 3, appliedTo, type)) / 10;
            smooth.push(smoothValue);
            var detrenderValue = (0.0962 * smooth[index] + 0.5769 * smooth[index - 2] + 0.5769 * smooth[index - 4] + 0.0962 * smooth[index - 6]) * (0.075 * period[index - 1] + 0.054);
            detrender.push(detrenderValue);
            //Compute InPhase and Quadrature components
            Q1[index] = (0.0962 * detrender[index] + 0.5769 * detrender[index - 2] + 0.5769 * detrender[index - 4] + 0.0962 * detrender[index - 6]) * (0.075 * period[index - 1] + 0.054);
            I1[index] = detrender[index - 3];
            //Advance the phase of I1 and Q1 by 90º
            var jI = (0.0962 * I1[index] + 0.5769 * I1[index - 2] + 0.5769 * I1[index - 4] + 0.0962 * I1[index - 6]) * (0.075 * period[index - 1] + 0.054);
            var jQ = (0.0962 * Q1[index] + 0.5769 * Q1[index - 2] + 0.5769 * Q1[index - 4] + 0.0962 * Q1[index - 6]) * (0.075 * period[index - 1] + 0.054);
            //Phasor addition for 3 bar averaging
            I2[index] = I1[index] + jQ;
            Q2[index] = Q1[index] + jI;
            //Smooth the I and Q components before applying the discriminator
            I2[index] = 0.2 * I2[index] + 0.8 * I2[index - 1];
            Q2[index] = 0.2 * Q2[index] + 0.8 * Q2[index - 1];

            //{Homodyne Discriminator} 
            Re[index] = I2[index] * I2[index - 1] + Q2[index] * Q2[index - 1];
            Im[index] = I2[index] * Q2[index - 1] + Q2[index] * I2[index - 1];

            Re[index] = 0.2 * Re[index] + 0.8 * Re[index - 1];
            Im[index] = 0.2 * Im[index] + 0.8 * Im[index - 1];

            if (Im[index] != 0.0 && Re[index] != 0.0)
                period[index] = 360 / Math.atan(Im[index] / Re[index]);
            if (period[index] > 1.5 * period[index - 1])
                period[index] = 1.5 * period[index - 1];
            if (period[index] < 0.67 * period[index - 1])
                period[index] = 0.67 * period[index - 1];
            if (period[index] < 6)
                period[index] = 6;
            if (period[index] > 50)
                period[index] = 50;
            period[index] = 0.2 * period[index] + 0.8 * period[index - 1];
            smoothPeriod[index] = 0.88 * period[index] + 0.67 * smoothPeriod[index - 1];
            if (I1[index] != 0.0)
                phase[index] = Math.atan(Q1[index] / I1[index]);
            var deltaPhase = phase[index - 1] - phase[index];
            if (deltaPhase < 1)
                deltaPhase = 1;
            var alpha = fastLimit / deltaPhase;
            if (alpha < slowLimit)
                alpha = slowLimit;
            if (alpha > fastLimit)
                alpha = fastLimit;
            var mamaValue = alpha * indicatorBase.getPrice(data, index, appliedTo, type) + (1 - alpha) * mamaData[index - 1];
            return mamaValue;
        }
        else return null;
        //FAMA = 0.5*alpha*MAMA + (1 - 0.5*alpha)*FAMA[1];


     
    }

    return {
        init: function () {

            (function (H, $) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addMAMA) return;

                H.Series.prototype.addMAMA = function (mamaOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    mamaOptions = $.extend({
                        period: 21,
                        fastLimit: 0.5,
                        slowLimit:.05,
                        stroke: 'red',
                        strokeWidth: 2,
                        dashStyle: 'line',
                        levels: [],
                        appliedTo: indicatorBase.CLOSE,
                        parentSeriesID: seriesID
                    }, mamaOptions);

                    var uniqueID = '_' + new Date().getTime();

                    var data = this.options.data || [];

                    if (mamaOptions.period >= data.length) return;

                    if (data && data.length > 0) {

                        //Calculate MAMA data
                        /*  mama(t) = p(t) * 2/(T+1) + mama(t-1) * (1 - 2 / (T+1))
                         *  Do not fill any value in mamaData from 0 index to options.period-1 index
                         */
                        var mamaData = [];
                        for (var index = 0; index < data.length; index++) {
                            var maValue = calculateMamaValue(data, mamaData, index, mamaOptions.fastLimit, mamaOptions.slowLimit, this.options.type, mamaOptions.appliedTo);
                            mamaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(maValue, 4)]);
                        }

                        var chart = this.chart;

                        mamaOptionsMap[uniqueID] = mamaOptions;

                        var series = this;
                        mamaSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'MAMA (' + mamaOptions.period + ', ' + indicatorBase.appliedPriceString(mamaOptions.period) + ')',
                            data: mamaData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
                            //yAxis: 'mama'+ uniqueID,
                            opposite: series.options.opposite,
                            color: mamaOptions.stroke,
                            lineWidth: mamaOptions.strokeWidth,
                            dashStyle: mamaOptions.dashStyle,
                            compare: series.options.compare
                        }, false, false);

                        //This is a on chart indicator
                        $(mamaSeriesMap[uniqueID]).data({
                            onChartIndicator: true,
                            indicatorID: 'mama',
                            isIndicator: true,
                            parentSeriesID: mamaOptions.parentSeriesID,
                            period: mamaOptions.period
                        });

                        //We are update everything in one shot
                        chart.redraw();

                    }

                    return uniqueID;

                };

                H.Series.prototype.removeMAMA = function (uniqueID) {
                    var chart = this.chart;
                    mamaOptionsMap[uniqueID] = null;
                    chart.get(uniqueID).remove();
                    mamaSeriesMap[uniqueID] = null;
                };

                H.Series.prototype.preRemovalCheckMAMA = function (uniqueID) {
                    return {
                        isMainIndicator: true,
                        period: !mamaOptionsMap[uniqueID] ? undefined : mamaOptionsMap[uniqueID].period,
                        appliedTo: !mamaOptionsMap[uniqueID] ? undefined : mamaOptionsMap[uniqueID].appliedTo,
                        isValidUniqueID: mamaOptionsMap[uniqueID] != null
                    };
                };

                /*
                 *  Wrap HC's Series.addPoint
                 */
                H.wrap(H.Series.prototype, 'addPoint', function (proceed, options, redraw, shift, animation) {

                    proceed.call(this, options, redraw, shift, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(mamaOptionsMap, this.options.id)) {
                        updateMAMASeries.call(this, options[0]);
                    }

                });

                /*
                 *  Wrap HC's Point.update
                 */
                H.wrap(H.Point.prototype, 'update', function (proceed, options, redraw, animation) {

                    proceed.call(this, options, redraw, animation);
                    if (indicatorBase.checkCurrentSeriesHasIndicator(mamaOptionsMap, this.series.options.id)) {
                        updateMAMASeries.call(this.series, this.x, true);
                    }

                });

                /**
                 * This function should be called in the context of series object
                 * @param time - The data update values
                 */
                function updateMAMASeries(time, isPointUpdate) {
                    var series = this;
                    var chart = series.chart;

                    //Add a new MAMA data point
                    for (var key in mamaSeriesMap) {
                        if (mamaSeriesMap[key] && mamaSeriesMap[key].options && mamaSeriesMap[key].options.data && mamaSeriesMap[key].options.data.length > 0
                                && mamaOptionsMap[key].parentSeriesID == series.options.id) {
                            //This is MAMA series. Add one more MAMA point
                            //Calculate MAMA data
                            /*
                             * mama(t) = p(t) * 2/(T+1) + mama(t-1) * (1 - 2 / (T+1))
                             */
                            //Find the data point
                            var data = series.options.data;
                            var mamaData = mamaSeriesMap[key].options.data;
                            var mamaOptions = mamaOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                var mamaValue = calculateMamaValue(data, mamaData, dataPointIndex,  mamaOptions.fastLimit, mamaOptions.slowLimit, this.options.type, mamaOptions.appliedTo);

                                if (isPointUpdate) {
                                    mamaSeriesMap[key].data[dataPointIndex].update({ y: indicatorBase.toFixed(mamaValue, 4) });
                                }
                                else {
                                    mamaSeriesMap[key].addPoint([(data[dataPointIndex].x || data[dataPointIndex][0]), indicatorBase.toFixed(mamaValue, 4)], true, true, false);
                                }
                            }
                        }
                    }
                }

            })(Highcharts, jQuery, indicatorBase);

        }
    };
});
