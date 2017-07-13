const trade_results = {
  'Matches': (value, barrier) => value == barrier,
  'Differs': (value, barrier) => value != barrier,
  'Over': (value, barrier) => parseInt(value, 10) > parseInt(barrier, 10),
  'Under': (value, barrier) => parseInt(value, 10) < parseInt(barrier, 10),
  'Even': (value, barrier) => parseInt(value, 10) % 2 == 0,
  'Odd': (value, barrier) => parseInt(value, 10) % 2 != 0
}
exports.command = function (selector, dataCount) {
  const timeout = this.globals.waitForConditionPollInterval; // Default Poll interval
  return this.perform((browser, done) => {
    let test_count = 0;
    let prev_length = 0;
    const check_property = () => {
      browser.execute((selector) => {
        const data = $(selector).find("li span strong").map((i, el) => el.innerText);
        const length = data.length;
        const last_data = length && data[length - 1];
        return [length, last_data];
      }, [selector],
        (result) => {
          if (result.value[0] == dataCount) {
            if (trade_results[browser.tradeType]) {
              const isWin = trade_results[browser.tradeType](result.value[1], browser.barrier);
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
