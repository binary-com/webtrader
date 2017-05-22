exports.command = function waitForSeriesPresent(selector, seriesName) {
  const timeout = this.globals.waitForConditionPollInterval; // Default Poll interval
  return this.perform((browser, done) => {
    var test_count = 0;
    var check_property = () => {
      browser.execute("return $('" +
        selector.replace(/['"]/g, '\\\'') + "').highcharts().series.map((a)=>a.options.name)",
        (result) => {
          if (~result.value.indexOf(seriesName)) {
            console.log(' \x1b[1;32m✔\x1b[m Series "' + seriesName + '" found after ' + test_count * timeout + ' milliseconds.');
            done();
          } else if (test_count >= 20) {
            browser.assert.fail('Series ' + seriesName + ' not found.', 'Series ' + seriesName + ' to be present.', 
              'Timed out while waiting for Series "' + seriesName + '".', '');
          } else {
            test_count++;
            setTimeout(check_property, timeout)
          }
        });
    }
    check_property();
  });
}