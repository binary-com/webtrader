/**
 * Created by Mahboob.M on 2/6/16.
 */

DX = function (data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    /*Current High - Previous High = UpMove
    Current Low - Previous Low = DownMove
    If UpMove > DownMove and UpMove > 0, then +DM = UpMove, else +DM = 0
    If DownMove > Upmove and Downmove > 0, then -DM = DownMove, else -DM = 0
    +DI = 100 times Exponential Moving Average of (+DM / Average True Range)
    -DI = 100 times Exponential Moving Average of (-DM / Average True Range)
    DX = 100 times the Exponential Moving Average of the Absolute Value of (+DI- -DI) / (+DI + -DI).*/
    this.uniqueID = [uuid(), uuid(), uuid()];
    this.adx = new ADX(data, options, indicators);
    this.plusDIData = this.adx.PlusDI.indicatorData;
    this.minusData = this.adx.MinusDI.indicatorData;
    this.indicatorData = this.adx.indicatorData;
};

DX.prototype = Object.create(IndicatorBase.prototype);
DX.prototype.constructor = DX;

DX.prototype.addPoint = function (data) {
    console.log('Adding DX data point : ', data);
    var adx = this.adx.addPoint(data)[0].value;
    this.plusDIData = this.adx.PlusDI.indicatorData;
    this.minusData = this.adx.MinusDI.indicatorData;
    this.indicatorData = this.adx.indicatorData;
    return [{
        id: this.uniqueID[0],
        value: adx
    }, {
        id: this.uniqueID[1],
        value: this.plusDIData[this.plusDIData.length - 1].value
    }, {
        id: this.uniqueID[2],
        value: this.minusData[this.minusData.length - 1].value
    }];
};

DX.prototype.update = function (data) {
    console.log('Updating DX data point : ', data);
    var adx = this.adx.update(data)[0].value;
    this.plusDIData = this.adx.PlusDI.indicatorData;
    this.minusData = this.adx.MinusDI.indicatorData;
    this.indicatorData = this.adx.indicatorData;
    return [{
        id: this.uniqueID[0],
        value: adx
    }, {
        id: this.uniqueID[1],
        value: this.plusDIData[this.plusDIData.length - 1].value
    }, {
        id: this.uniqueID[2],
        value: this.minusData[this.minusData.length - 1].value
    }];
};

DX.prototype.toString = function () {
    return 'DX (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};


/**
 * @param indicatorMetadata
 * @returns {*[]}
 */
DX.prototype.buildSeriesAndAxisConfFromData = function (indicatorMetadata) {
    //Prepare the data before sending a configuration
    var adxData = [];
    this.indicatorData.forEach(function (e) {
        adxData.push([e.time, e.value]);
    });

    var plusDIData = [];
    this.plusDIData.forEach(function (e) {
        plusDIData.push([e.time, e.value]);
    });

    var minusData = [];
    this.minusData.forEach(function (e) {
        minusData.push([e.time, e.value]);
    });

    return [{
            axisConf: { // Secondary yAxis
                id: indicatorMetadata.id + '-' + this.uniqueID[0],
                title: {
                    text: this.toString(),
                    align: 'high',
                    offset: 0,
                    rotation: 0,
                    y: 10, //Trying to show title inside the indicator chart
                    x: 30+ this.toString().length * 7.5
                },
                lineWidth: 2,
                plotLines: this.options.levels
             }
         },
         {
            seriesConf: {
                 id: this.uniqueID[0],
                 name: 'ADX ' + this.toString(),
                 data: adxData,
                 type: 'line',
                 yAxis: indicatorMetadata.id + '-' + this.uniqueID[0],
                 color: this.options.dxStroke,
                 lineWidth: this.options.strokeWidth,
                 dashStyle: this.options.dashStyle,
                 onChartIndicator: false
             }
         },
         {
             seriesConf: {
                 id: this.uniqueID[1],
                 name: '+DI ' + this.toString(),
                 data: plusDIData,
                 type: 'line',
                 yAxis: indicatorMetadata.id + '-' + this.uniqueID[0],
                 color: this.options.plusDIStroke,
                 lineWidth: this.options.strokeWidth,
                 dashStyle: this.options.dashStyle,
                 onChartIndicator: false
             }
         },
         {
             seriesConf: {
                 id: this.uniqueID[2],
                 name: '-DI ' + this.toString(),
                 data: minusData,
                 type: 'line',
                 yAxis: indicatorMetadata.id + '-' + this.uniqueID[0],
                 color: this.options.minusDIStroke,
                 lineWidth: this.options.strokeWidth,
                 dashStyle: this.options.dashStyle,
                 onChartIndicator: false
             }
         }];
};

/**
 * This method will return all IDs that are used to identify data series configuration
 * in the buildSeriesAndAxisConfFromData method.
 * @returns {*[]}
 */
DX.prototype.getIDs = function () {
    return this.uniqueID;
};

/**
 * If all the unique IDs generated by this instance is same as what is passed in the parameter,
 * then we consider this instance to be same as what caller is looking for
 * @param uniqueIDArr
 * @returns {boolean}
 */
DX.prototype.isSameInstance = function (uniqueIDArr) {
    return _.isEqual(uniqueIDArr.sort(), this.uniqueID);
};
