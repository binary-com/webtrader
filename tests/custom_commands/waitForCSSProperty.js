exports.command = function waitForCSSProperty(selector, property, value, timeout) {
  if (!timeout)
    timeout = this.globals.waitForConditionPollInterval; // Default Poll interval
  return this.perform((browser, done) => {
    var test_count = 0;
    var check_property = () => {
      browser.getCssProperty(selector, property, (result) => {
        if (result.value === value) {
          browser.assert.cssProperty(selector, property, value);
          done();
        } else if (test_count >= 20) {
          browser.assert.fail('purchase-row (style : ' + property + ') to be ' +
            value, 'purchase-row (style : opacity) to be ' + result.value,
            'Timed out while waiting for proposal response', '');
        } else {
          test_count++;
          setTimeout(check_property, timeout)
        }
      });
    }
    check_property();
  });
  /*var test_count = 0;
  var max_tests = this.api.waitForConditionTimeout / timeout;
  this.perform*/
}