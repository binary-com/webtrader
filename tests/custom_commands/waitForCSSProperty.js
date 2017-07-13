exports.command = function waitForCSSProperty(selector, property, value, timeout) {
  if (!timeout)
    timeout = this.globals.waitForConditionPollInterval; // Default Poll interval
  return this.perform((browser, done) => {
    var test_count = 0;
    var check_property = () => {
      browser.getCssProperty(selector, property, (result) => {
        if (result.value === value) {
          console.log(' \x1b[1;32m✔\x1b[m Element <' + selector + '> has css property "' + property + '": "' + value + '".')
          done();
        } else if (test_count >= 20) {
          browser.assert.fail('purchase-row (style : ' + property + ') to be ' + result.value,
            'purchase-row (style : ' + property + ') to be ' + value,
            'Timed out while waiting for proposal response', '');
        } else {
          test_count++;
          setTimeout(check_property, timeout)
        }
      });
    }
    check_property();
  });
}