/**
 * Created by arnab on 3/22/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    var mamaOptionsMap = {}, mamaSeriesMap = {};
    var smooth = {}, detrender = {}, period = {}, I1 = {}, Q1 = {}, I2 = {}, Q2 = {}, Re = {}, Im = {}, smoothPeriod = {}, phase = {};
    function calculateMamaValue(options) {

        var data = options.data,
            mamaData = options.mamaData,
            index = options.index,
            fastLimit = options.fastLimit,
            slowLimit = options.slowLimit,
            type = options.type,
            key = options.key,
            appliedTo = options.appliedTo;

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
        var time = (data[index].x || data[index][0]);
        var mamaValue = indicatorBase.getPrice(data, index, appliedTo, type);
        if (index <= 10) {
            smooth[key][index] = [time, 0];
            detrender[key][index] = [time, 0];
            I1[key][index] = [time, 0];
            Q1[key][index] = [time, 0];
            I2[key][index] = [time, 0];
            Q2[key][index] = [time, 0];
            Re[key][index] = [time, 0];
            Im[key][index] = [time, 0];
            period[key][index] = [time, 0];
            smoothPeriod[key][index] = [time, 0];
            phase[key][index] = [time, 0];
        }

        else if (index > 10) {
            smooth[key][index] = [time, ((4 * indicatorBase.getPrice(data, index, appliedTo, type)
                + 3 * indicatorBase.getPrice(data, index - 1, appliedTo, type)
                + 2 * indicatorBase.getPrice(data, index - 2, appliedTo, type)
                + 1 * indicatorBase.getPrice(data, index - 3, appliedTo, type)) / 10)];

            detrender[key][index] = [time, ((0.0962 * smooth[key][index][1]
                                    + 0.5769 * smooth[key][index - 2][1]
                                    + 0.5769 * smooth[key][index - 4][1]
                                    + 0.0962 * smooth[key][index - 6][1]) * (0.075 * period[key][index - 1][1] + 0.054))];

            //Compute InPhase and Quadrature components
            Q1[key][index] = [time, ((0.0962 * detrender[key][index][1]
                            + 0.5769 * detrender[key][index - 2][1]
                            + 0.5769 * detrender[key][index - 4][1]
                            + 0.0962 * detrender[key][index - 6][1]) * (0.075 * period[key][index - 1][1] + 0.054))];
            I1[key][index] = [time, (detrender[key][index - 3][1])];

            //Advance the phase of I1 and Q1 by 90º
            var jI = (0.0962 * I1[key][index][1]
                        + 0.5769 * I1[key][index - 2][1]
                        + 0.5769 * I1[key][index - 4][1]
                        + 0.0962 * I1[key][index - 6][1]) * (0.075 * period[key][index - 1][1] + 0.054);
            var jQ = (0.0962 * Q1[key][index][1]
                        + 0.5769 * Q1[key][index - 2][1]
                        + 0.5769 * Q1[key][index - 4][1]
                        + 0.0962 * Q1[key][index - 6][1]) * (0.075 * period[key][index - 1][1] + 0.054);

            //Phasor addition for 3 bar averaging
            I2[key][index] = [time, (I1[key][index][1] - jQ)];
            Q2[key][index] = [time, (Q1[key][index][1] + jI)];

            //Smooth the I and Q components before applying the discriminator
            I2[key][index] = [time, (0.2 * I2[key][index][1] + 0.8 * I2[key][index - 1][1])];
            Q2[key][index] = [time, (0.2 * Q2[key][index][1] + 0.8 * Q2[key][index - 1][1])];

            //{Homodyne Discriminator} 
            Re[key][index] = [time, (I2[key][index][1] * I2[key][index - 1][1] + Q2[key][index][1] * Q2[key][index - 1][1])];
            Im[key][index] = [time, (I2[key][index][1] * Q2[key][index - 1][1] - Q2[key][index][1] * I2[key][index - 1][1])];

            Re[key][index] = [time, (0.2 * Re[key][index][1] + 0.8 * Re[key][index - 1][1])];
            Im[key][index] = [time, (0.2 * Im[key][index][1] + 0.8 * Im[key][index - 1][1])];

            period[key][index] = [time, 0];
            if (Im[key][index][1] !== 0.0 && Re[key][index][1] !== 0.0)
                period[key][index] = [time, (360 / (Math.atan(Im[key][index][1] / Re[key][index][1]) * (180.0 / 3.14159265359)))];
            if (period[key][index][1] > 1.5 * period[key][index - 1][1])
                period[key][index] = [time, (1.5 * period[key][index - 1][1])];
            if (period[key][index][1] < 0.67 * period[key][index - 1][1])
                period[key][index] = [time, (0.67 * period[key][index - 1][1])];
            if (period[key][index][1] < 6)
                period[key][index] = [time, 6];
            if (period[key][index][1] > 50)
                period[key][index] = [time, 50];
            period[key][index] = [time, (0.2 * period[key][index][1] + 0.8 * period[key][index - 1][1])];
            smoothPeriod[key][index] = [time, (0.33 * period[key][index][1] + 0.67 * smoothPeriod[key][index - 1][1])];

            phase[key][index] = [time, 0];
            if (I1[key][index][1] !== 0.0)
                phase[key][index] = [time, (Math.atan(Q1[key][index][1] / I1[key][index][1]) * (180.0 / 3.14159265359))];
            var deltaPhase = phase[key][index - 1][1] - phase[key][index][1];
            if (deltaPhase < 1)
                deltaPhase = 1;
            var alpha = (fastLimit / deltaPhase);
            if (alpha < slowLimit)
                alpha = slowLimit;
            if (alpha > fastLimit)
                alpha = fastLimit;
            mamaValue = alpha * indicatorBase.getPrice(data, index, appliedTo, type) + (1 - alpha) * indicatorBase.getIndicatorData(mamaData, index - 1);
        }

        return mamaValue;
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

                    if (data && data.length > 0) {

                        //Calculate MAMA data
                        var mamaData = [];
                        smooth[uniqueID] = [], detrender[uniqueID] = [], period[uniqueID] = [],
                        I1[uniqueID] = [], Q1[uniqueID] = [], I2[uniqueID] = [], Q2[uniqueID] = [],
                        Re[uniqueID] = [], Im[uniqueID] = [], smoothPeriod[uniqueID] = [], phase[uniqueID] = [];
                        for (var index = 0; index < data.length; index++) {
                            var maValue = calculateMamaValue({
                                data: data,
                                mamaData: mamaData,
                                index: index,
                                fastLimit: mamaOptions.fastLimit,
                                slowLimit: mamaOptions.slowLimit,
                                type: this.options.type,
                                key:uniqueID,
                                appliedTo: mamaOptions.appliedTo
                            });

                            mamaData.push([(data[index].x || data[index][0]), indicatorBase.toFixed(maValue, 4)]);
                        }

                        var chart = this.chart;

                        mamaOptionsMap[uniqueID] = mamaOptions;

                        var series = this;
                        mamaSeriesMap[uniqueID] = chart.addSeries({
                            id: uniqueID,
                            name: 'MAMA (' + indicatorBase.appliedPriceString(mamaOptions.appliedTo) + ')',
                            data: mamaData,
                            type: 'line',
                            dataGrouping: series.options.dataGrouping,
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
                            parentSeriesID: mamaOptions.parentSeriesID
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
                    smooth[uniqueID] = [], detrender[uniqueID] = [], period[uniqueID] = [],
                    I1[uniqueID] = [], Q1[uniqueID] = [], I2[uniqueID] = [], Q2[uniqueID] = [],
                    Re[uniqueID] = [], Im[uniqueID] = [], smoothPeriod[uniqueID] = [], phase[uniqueID] = [];
                };

                H.Series.prototype.preRemovalCheckMAMA = function (uniqueID) {
                    return {
                        isMainIndicator: true,
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
                            //Find the data point
                            var data = series.options.data;
                            var mamaData = mamaSeriesMap[key].options.data;
                            var mamaOptions = mamaOptionsMap[key];
                            var dataPointIndex = indicatorBase.findIndexInDataForTime(data, time);
                            if (dataPointIndex >= 1) {

                                var mamaValue = calculateMamaValue({
                                    data: data,
                                    mamaData: mamaData,
                                    index: dataPointIndex,
                                    fastLimit: mamaOptions.fastLimit,
                                    slowLimit: mamaOptions.slowLimit,
                                    type: this.options.type,
                                    key: key,
                                    appliedTo: mamaOptions.appliedTo
                                });

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
