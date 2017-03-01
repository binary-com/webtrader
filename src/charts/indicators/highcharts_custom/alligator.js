ALLIGATOR = function(data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.options = options;
    this.jaw = [];
    this.teeth = [];
    this.lips = [];

    this.uniqueID = [uuid(), uuid(), uuid()];

    this.priceData = data;
    /*
     * Calculation:
     * Jaw = SMMA(13,CLOSE)
     * Teeth = SMMA(8, CLOSE)
     * Lips = SMMA(5, CLOSE)
     */
    this.jaw = new SMMA(data, $.extend({ period: 13, color: options.jawStroke }, options), indicators);
    this.indicatorData = this.jaw.indicatorData;
    this.teeth = new SMMA(data, $.extend({ period: 8, color: options.teethStroke }, options), indicators);
    this.lips = new SMMA(data, $.extend({ period: 5, color: options.lipsStroke }, options), indicators);
}

ALLIGATOR.prototype = Object.create(IndicatorBase.prototype);
ALLIGATOR.prototype.constructor = ALLIGATOR;

ALLIGATOR.prototype.addPoint = function(data) {
    //console.log('Adding ALLIGATOR data point : ', data);
    this.priceData.push(data);
    var jaw = this.jaw.CalculateSMMAValue(this.priceData, this.priceData.length - 1);
    var teeth = this.teeth.CalculateSMMAValue(this.priceData, this.priceData.length - 1);
    var lips = this.lips.CalculateSMMAValue(this.priceData, this.priceData.length - 1);
    this.jaw.indicatorData.push({ time: data.time, value: jaw });
    this.teeth.indicatorData.push({ time: data.time, value: teeth });
    this.lips.indicatorData.push({ time: data.time, value: lips });
    this.indicatorData.push({ time: data.time, value: jaw });
    return [{
        id: this.uniqueID[0],
        value: jaw
    }, {
        id: this.uniqueID[1],
        value: teeth
    }, {
        id: this.uniqueID[2],
        value: lips
    }];
};

ALLIGATOR.prototype.update = function(data) {
    //console.log('Updating ALLIGATOR data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var jaw = this.jaw.CalculateSMMAValue(this.priceData, index);
    var teeth = this.teeth.CalculateSMMAValue(this.priceData, index);
    var lips = this.lips.CalculateSMMAValue(this.priceData, index);
    this.jaw.indicatorData[index].value = jaw;
    this.teeth.indicatorData[index].value = teeth;
    this.lips.indicatorData[index].value = lips;
    this.indicatorData[index].value = jaw;
    return [{
        id: this.uniqueID[0],
        value: jaw
    }, {
        id: this.uniqueID[1],
        value: teeth
    }, {
        id: this.uniqueID[2],
        value: lips
    }];
};

ALLIGATOR.prototype.buildSeriesAndAxisConfFromData = function(indicatorMetadata) {
    var jaw = [];
    this.jaw.indicatorData.forEach(function(e) {
        jaw.push([e.time, e.value]);
    });

    var teeth = [];
    this.teeth.indicatorData.forEach(function(e) {
        teeth.push([e.time, e.value]);
    });

    var lips = [];
    this.lips.indicatorData.forEach(function(e) {
        lips.push([e.time, e.value]);
    });

    return [{
        seriesConf: {
            id: this.uniqueID[0],
            name: 'Alligator Jaw - ' + this.jaw.toString(),
            data: jaw,
            type: 'line',
            color: this.options.jawStroke,
            lineWidth: this.options.width,
            dashStyle: this.options.dashStyle,
            onChartIndicator: true
        }
    }, {
        seriesConf: {
            id: this.uniqueID[1],
            name: 'Alligator Teeth - ' + this.teeth.toString(),
            data: teeth,
            type: 'line',
            color: this.options.teethStroke,
            lineWidth: this.options.width,
            dashStyle: this.options.dashStyle,
            onChartIndicator: true
        }
    }, {
        seriesConf: {
            id: this.uniqueID[2],
            name: 'Alligator Lips - ' + this.lips.toString(),
            data: lips,
            type: 'line',
            color: this.options.lipsStroke,
            lineWidth: this.options.width,
            dashStyle: this.options.dashStyle,
            onChartIndicator: true
        }
    }];
}

ALLIGATOR.prototype.getIDs = function() {
    return this.uniqueID;
};

ALLIGATOR.prototype.isSameInstance = function(uniqueIDArr) {
    return _.isEqual(uniqueIDArr.sort(), this.uniqueID);
};

ALLIGATOR.prototype.toString = function() {
    return 'ALLIGATOR (5,8,13)';
};
