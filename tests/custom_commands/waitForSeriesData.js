const trade_results = {
  'Up': (barrier, exit_spot) => barrier < exit_spot,
  'Down': (barrier, exit_spot) => barrier > exit_spot
}

exports.command = function (selector, dataCount) {
  const timeout = this.globals.waitForConditionPollInterval; // Default Poll interval
  return this.perform((browser, done) => {
    let test_count = 0;
    let prev_length = 0;
    const check_property = () => {
      browser.execute((selector) => {
        const series = $(selector).highcharts().series[0];
        const series_length = series.data.length;
        const last_data = series_length && series.data[series_length - 1].y;
        const barrier = series.yAxis.plotLinesAndBands.length && series.yAxis.plotLinesAndBands[0].options.value;
        return [series_length, barrier, last_data];
      }, [selector],
        (result) => {
          if (result.value[0] == dataCount + 1) {
            if (trade_results[browser.tradeDirection]) {
              const isWin = trade_results[browser.tradeDirection](result.value[1], result.value[2]);
              browser.assert.containsText('.trade-dialog .trade-conf .title-row > li > span',
                isWin ? 'This contract won' : 'This contract lost');
            }
            done();
          } else if (result.value[0] > prev_length) {
            test_count = 0;
            prev_length++;
            console.log(' \x1b[1;32m✔\x1b[m Got tick "' + prev_length + '".');
            setTimeout(check_property, timeout)
          } else if (test_count >= 10) { //Wait for 5 seconds before error
            browser.assert.fail('Tick not found', 'Tick ' + prev_length + ' to be present.',
              'Timed out while waiting for tick.', '');
          } else {
            test_count++;
            setTimeout(check_property, timeout)
          }
        });
    }
    check_property();
  });
}
