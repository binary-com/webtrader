/**
 * Created by Mahboob.M on 2/3/16.
 */
AO = function (data, options, indicators) {

    options.shortMaType = (options.shortMaType || 'SMA').toUpperCase();
    options.longMaType = (options.longMaType || 'SMA').toUpperCase();
    IndicatorBase.call(this, data, options, indicators);
    var shortOptions = { maType: options.shortMaType, period: options.shortPeriod },
        longOprions = { maType: options.longMaType, period: options.longPeriod };
   
    this.getBarColor = function (index) {
        var color = this.options.aoHighStroke;
        if (index > 1 && this.indicatorData[index].value < this.indicatorData[index - 1].value) {
            color = this.options.aoLowStroke;
        };
        return color;
    };
    /*
    AO = SMA(High+Low)/2, 5 Periods) - SMA(High+Low/2, 34 Periods)
    */
    var MedianData = [];
    for (var index = 0; index < data.length; index++) {
        var medVAlue = (data[index].high + data[index].low) / 2;
        MedianData.push({ time: data[index].time, close: medVAlue });
    };

    this.shortMa = new window[options.shortMaType](MedianData, shortOptions, indicators);
    this.longMa = new window[options.longMaType](MedianData, longOprions, indicators);

    var index = 0;
    var _this = this;
    this.shortMa.indicatorData.forEach(function (shortMa) {
        var aoValue = toFixed((shortMa.value - _this.longMa.indicatorData[index].value), 4);
        _this.indicatorData.push({ time: data[index].time, value: aoValue });
        index++;
    });
};

AO.prototype = Object.create(IndicatorBase.prototype);
AO.prototype.constructor = AO;

AO.prototype.addPoint = function (data) {
    var medVAlue = (data.high + data.low) / 2;
    var shortMa = this.shortMa.addPoint({ time: data.time, close: medVAlue })[0].value;
    var longMa = this.longMa.addPoint({ time: data.time, close: medVAlue })[0].value;
    var aoValue = toFixed((shortMa - longMa), 4);
    this.indicatorData.push({ time: data.time, value: aoValue });
    return [{
        id: this.uniqueID,
        value: aoValue,
        color: this.getBarColor(this.indicatorData.length - 1)
    }];
};

AO.prototype.update = function (data) {
    var index = this.indicatorData.length - 1;
    var medVAlue = (data.high + data.low) / 2;
    var shortMa = this.shortMa.update({ time: data.time, close: medVAlue })[0].value;
    var longMa = this.longMa.update({ time: data.time, close: medVAlue })[0].value;
    var aoValue = toFixed((shortMa - longMa), 4);
    this.indicatorData[index].value = aoValue;
    return [{
        id: this.uniqueID,
        value: aoValue
    }];
};

AO.prototype.toString = function () {
    return 'AO (' + this.options.shortPeriod + ', ' + this.options.longPeriod  + ')';
};

/**
 * @param indicatorMetadata
 * @returns {*[]}
 */
AO.prototype.buildSeriesAndAxisConfFromData = function (indicatorMetadata) {
    var aoData = [];
    var colors = [];
    //Prepare the data before sending a configuration
    for (var index = 0; index < this.indicatorData.length; index++) {
        var data = this.indicatorData[index];
        aoData.push([data.time, data.value]);
        colors.push(this.getBarColor(index));
    };

    return [{
        axisConf: { // Secondary yAxis
            id: indicatorMetadata.id + '-' + this.uniqueID,
            title: {
                text: this.toString(),
                align: 'high',
                offset: 0,
                rotation: 0,
                y: 10, 
                x: 30+ this.toString().length * 7.5
            },
            lineWidth: 2,
            plotLines: this.options.levels
             }
        },
        {
             seriesConf: {
                 id: this.uniqueID,
                 name: this.toString(),
                 data: aoData,
                 type: 'column',
                 yAxis: indicatorMetadata.id + '-' + this.uniqueID,
                 onChartIndicator: false,
                 colorByPoint:true,
                 colors: colors
             }
        }];
};

