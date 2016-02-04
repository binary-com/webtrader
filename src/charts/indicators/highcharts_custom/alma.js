/**
 * Created by Mahboob.M on 2/2/16.
 */

ALMA = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    this.CalculateALMAValue = function (data, index) {
        /* ALMA :
        $sigma = 6;
        $offset = 0.85;
        $m = $offset * ($period - 1);
        $s = $period / $sigma;
        $sum = 0;
        $norm = 0;
        for ($i = 0; $i < $period; $i++) {
	        $coeff = exp (- ($i - $m) * ($i - $m) / 2 * $s * $s);
	        $sum += $data[$period - $i ] * $coeff;
	        $norm += $coeff;
        }
        return $sum / $norm;*/
        console.info(this.options.sigma, this.options.offset, this.options.period);
        var m = Math.floor(this.options.offset * (this.options.period - 1));
        var s = this.options.period / this.options.sigma;
        var sum = 0.0;
        var norm = 0;
        for (var i = 0; i < this.options.period; i++) {
            var coeff = Math.exp(-(Math.pow((i - m), 2) / (2 * Math.pow(s, 2))));
            sum += this.indicators.getIndicatorOrPriceValue(data[index - i], this.options.appliedTo) * coeff;
            norm += coeff; 
        }
        var alma = 0;
        if (norm !== 0)
            alma = sum / norm;
        return toFixed(alma, 4);
    };

    for (var index = 0; index < data.length; index++) {
        if (index >= this.options.period) {
            var alma = this.CalculateALMAValue(data, index);
            this.indicatorData.push({ time: data[index].time, value: alma });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    }
};

ALMA.prototype = Object.create(IndicatorBase.prototype);
ALMA.prototype.constructor = ALMA;

ALMA.prototype.addPoint = function (data) {
    console.log('Adding ALMA data point : ', data);
    this.priceData.push(data);
    var alma = this.CalculateALMAValue(this.priceData, this.priceData.length - 1);
    this.indicatorData.push({ time: data.time, value: alma });
    return [{
        id: this.uniqueID,
        value: alma
    }];
};

ALMA.prototype.update = function (data) {
    console.log('Updating ALMA data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var alma = this.CalculateALMAValue(this.priceData, index);
    this.indicatorData[index].value = alma;
    return [{
        id: this.uniqueID,
        value: alma
    }];
};

ALMA.prototype.toString = function () {
    return 'ALMA (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
