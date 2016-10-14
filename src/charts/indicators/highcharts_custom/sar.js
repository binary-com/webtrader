/**
 * Created by Mahboob.M on 1/30/16.
 */
SAR = function (data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.ep=[], this.af=[], this.trend=[];
    this.period = 5;
    this.priceData = [];
    this.calculateSAR = function (data, index, isPointUpdate) {
        /*
         Prior SAR: The SAR value for the previous period.
         Extreme Point (EP): The highest high of the current uptrend.
         Acceleration Factor (AF): Starting at .02, AF increases by .02 each
         time the extreme point makes a new high. AF can reach a maximum
         of .20, no matter how long the uptrend extends.
         Current SAR = Prior SAR + Prior AF(Prior EP - Prior SAR)
         13-Apr-10 SAR = 48.28 = 48.13 + .14(49.20 - 48.13)
         */
        var highPrice = data[index].high;
        var lowPrice = data[index].low;

        var sarValue = 0.0;
        if (this.trend[index - 2].value === this.trend[index - 1].value) {
            var prevSarPlusDeltaAF = (this.indicatorData[index - 1].value + (this.af[index - 1].value * (this.ep[index - 1].value - this.indicatorData[index - 1].value)));
            if (this.trend[index - 1].value === "UP") {
                var lowMin = Math.min(data[index - 1].low, data[index - 2].low);
                if ((prevSarPlusDeltaAF) < lowMin) {
                    sarValue = prevSarPlusDeltaAF;
                } else {
                    sarValue = lowMin;
                }
            } else {
                var highMax = Math.max(data[index - 1].high, data[index - 2].high);
                if ((prevSarPlusDeltaAF) > highMax) {
                    sarValue = highMax;
                } else {
                    sarValue = prevSarPlusDeltaAF;
                }
            }
        } else {
            sarValue = this.ep[index - 1].value;
        }

        var epValue = this.trend[index - 1].value === "UP" ?
            (highPrice > this.ep[index - 1].value ? highPrice : this.ep[index - 1].value)
            : (lowPrice < this.ep[index - 1].value ? lowPrice : this.ep[index - 1].value);
        if (isPointUpdate) {
            this.ep.push({ time: data[index].time, value: epValue });
        }
        else {
            this.ep[index] = { time: data[index].time, value: epValue };
        }

        var trendDirection = '';
        if (this.trend[index - 1].value === "UP") {
            if (lowPrice > sarValue) {
                trendDirection = 'UP';
            } else {
                trendDirection = 'DOWN';
            }
        } else if (this.trend[index - 1].value === "DOWN") {
            if (highPrice < sarValue) {
                trendDirection = 'DOWN';
            } else {
                trendDirection = 'UP';
            }
        }
        if (isPointUpdate) {
            this.trend.push({ time: data[index].time, value: trendDirection });
        }
        else {
            this.trend[index] = { time: data[index].time, value: trendDirection };
        }
        // Refer to https://www.tradingview.com/stock-charts-support/index.php/Parabolic_SAR_(SAR)#CALCULATION on updating the af.
        var afValue = 0.0;
        if (this.trend[index].value === this.trend[index - 1].value) {
            if (this.trend[index].value === "UP") {
                if(this.ep[index].value > this.ep[index-1].value){
                    afValue = Math.min(this.af[index-1].value + this.options.acceleration, this.options.maximum);
                } else{
                    afValue = this.af[index-1].value;
                }
            } else {
                if(this.ep[index].value < this.ep[index-1].value){
                    afValue = Math.min(this.af[index-1].value + this.options.acceleration, this.options.maximum);
                } else{
                    afValue = this.af[index-1].value;
                }
            }
        } else {
            afValue = this.options.acceleration;
        }
        if (isPointUpdate) {
            this.af.push({ time: data[index].time, value: afValue });
        }
        else {
            this.af[index] = { time: data[index].time, value: afValue };
        }
        return toFixed(sarValue, 4);
    };
    for (var index = 0; index < data.length; index++) {
        if (index < this.period) {
            this.ep.push({ time: data[index].time, value: 0 });
            this.af.push({ time: data[index].time, value: this.options.acceleration });
            if (index === (this.period - 1)) {
                this.trend.push({ time: data[index].time, value: 'UP' });
            } else {
                this.trend.push({ time: data[index].time, value: '' });
            }
            this.indicatorData.push({ time: data[index].time, value: 0 });
        }
        else if (index === this.period) {
            var sarValue = 0.0, epValue = 0.0;
            for (var i = 0; i < this.period; i++) {
                var highPrice = data[index].high;
                var lowPrice = data[index].low;

                if (sarValue === 0.0) {
                    //value init so that Math.min works properly
                    sarValue = highPrice;
                }
                sarValue = Math.min(sarValue, lowPrice, highPrice);
                epValue = Math.max(sarValue, lowPrice, highPrice);
            }
            this.ep.push({ time: data[index].time, value: epValue });
            this.af.push({ time: data[index].time, value: this.options.acceleration });

            var trendDirection = 'UP';
            if (this.trend[index - 1].value === 'UP') {
                if (lowPrice > sarValue) {
                    trendDirection = 'UP';
                } else {
                    trendDirection = 'DOWN';
                }
            } else if (this.trend[index - 1].value === 'DOWN') {
                if (highPrice < sarValue) {
                    trendDirection = 'DOWN';
                } else {
                    trendDirection = 'UP';
                }
            }
            this.trend.push({ time: data[index].time, value: trendDirection });
            this.indicatorData.push({ time: data[index].time, value: toFixed(sarValue, 4) });
        }
        else {
            var sarValue = this.calculateSAR(data, index ,false);
            this.indicatorData.push({ time: data[index].time, value: sarValue });
        }
        this.priceData.push(data[index]);
    }
};

SAR.prototype = Object.create(IndicatorBase.prototype);
SAR.prototype.constructor = SAR;

SAR.prototype.addPoint = function (data) {
    this.priceData.push(data);
    var sar = this.calculateSAR(this.priceData, this.priceData.length - 1, false);
    this.indicatorData.push({ time: data.time, value: sar });
    return [{
        id: this.uniqueID,
        value: sar
    }];
};

SAR.prototype.update = function (data) {
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var sar = this.calculateSAR(this.priceData, index, true);
    this.indicatorData[index].value = sar;
    return [{
        id: this.uniqueID,
        value: sar
    }];
};

SAR.prototype.toString = function () {
    return 'SAR (' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};

SAR.prototype.buildSeriesAndAxisConfFromData = function (indicatorMetadata) {
    var data = [];
    //Prepare the data before sending a configuration
    this.indicatorData.forEach(function (e) {
        data.push([e.time, e.value]);
    });
    return [
        {
            seriesConf: {
                id: this.uniqueID,
                name: 'SAR (' + this.options.acceleration + "," + this.options.maximum + ')',
                data: data,
                lineWidth: 0,
                marker: {
                    enabled: true,
                },
                color: this.options.stroke,
                states: {
                    hover: {
                        enabled: false
                    }
                },
                onChartIndicator: true
            }
        }
    ];
};
