exports.command = function (selector, dataCount) {
  const timeout = this.globals.waitForConditionPollInterval; // Default Poll interval
  return this.perform((browser, done) => {
    let test_count = 0;
    let prev_length = 0;
    const check_property = () => {
      browser.execute("return $('" +
        selector.replace(/['"]/g, '\\\'') + "').highcharts().series[0].data.length",
        (result) => {
          if (result.value == dataCount + 1) {
            browser.execute("return $('" +
              selector.replace(/['"]/g, '\\\'') + "').highcharts().series[0].xAxis.plotLinesAndBands[1].label.textStr",
              (result) => {
                if (result.value === "Exit Spot") {
                  console.log(' \x1b[1;32m✔\x1b[m Found Exit spot.');
                  done();
                } else {
                  browser.assert.fail('Exit spot to be present.', 'Exit spot not found.',
                    'Unexpected error.', '');
                }
              });
          } else if (result.value > prev_length) {
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
