/**
 * Tests for trade dialog
 */
var server = require('./server.js');

module.exports = {
  before: (browser) => {
    if (browser.globals.env !== 'browserstack')
      server.connect();
    browser
      .url(browser.globals.url + browser.globals.auth_url)
      .waitForElementVisible('body')
      .waitForElementNotVisible('.sk-spinner-container')
      .waitForElementVisible('.chrome_extension')
      //Close chrome pop-up
      .click('.chrome_extension #cancel')
      .waitForElementPresent('.top-nav-menu .instruments > ul > li:first-of-type')
      .click('.top-nav-menu .windows')
      //Close all dialogs.
      .click('.top-nav-menu .windows .closeAll')
      // Open volatility 10 index dialog
      .click('.trade')
      .waitForElementVisible('.trade > ul > li:last-of-type')
      .click('.trade > ul > li:last-of-type')
      .waitForElementVisible('.trade > ul > li:last-of-type > ul > li:first-of-type')
      .click('.trade > ul > li:last-of-type > ul > li:first-of-type')
      .waitForElementVisible('.trade > ul > li:last-of-type > ul > li:first-of-type > ul > li:first-of-type')
      .click('.trade > ul > li:last-of-type > ul > li:first-of-type > ul > li:first-of-type')
      .waitForElementPresent('.trade-dialog')
  },
  after: (browser) => {
    if (browser.globals.env !== 'browserstack')
      server.disconnect();
  },
  'Up/Down (RISE)': (browser) => {
    browser
      //Check that RISE is selected by default
      .assert.cssProperty('.trade-dialog .trade-fields .contract-displays [data-name="rise"]', 'font-weight', 'bold')
      .waitForElementPresent('.trade-dialog .trade-fields .date-start-row')
      .assert.hidden('.trade-dialog .trade-fields .duration-row > li:last-of-type')
      .click('.trade-dialog .trade-fields .duration-row > li:first-of-type > span')
      .click('div[role="dialog"] .ui-selectmenu-open > ul > li:last-of-type')
      // Check if End time options are visible
      .assert.visible('.trade-dialog .trade-fields .duration-row li[rv-show="duration.value | eq \'End Time\' "]')
      //Switch back to duration
      .click('.trade-dialog .trade-fields .duration-row > li:first-of-type > span')
      .click('div[role="dialog"] .ui-selectmenu-open > ul > li:first-of-type')
  },
  'Up/Down (FALL)': (browser) => {
    browser
      .click('.trade-dialog .trade-fields .contract-displays [data-name="fall"]')
      .assert.containsText('.trade-dialog .trade-fields .contract-displays > .active', 'Fall')
  },
  'Up/Down (HIGHER)': (browser) => {
    browser
      .click('.trade-dialog .trade-fields .contract-displays [data-name="higher"]')
      .assert.containsText('.trade-dialog .trade-fields .contract-displays > .active', 'Higher')
      .assert.visible('.trade-dialog .trade-fields .barriers-barrier-row')
  },
  'Up/Down (LOWER)': (browser) => {
    browser
      .click('.trade-dialog .trade-fields .contract-displays [data-name="lower"]')
      .assert.containsText('.trade-dialog .trade-fields .contract-displays > .active', 'Lower')
      .assert.visible('.trade-dialog .trade-fields .barriers-barrier-row')
  },
  // This can be made optional.
  'Tick trade': (browser) => {
    browser
      // Check if the purchase button is enabled
      .perform((browser, done) => {
        var test_count = 0;
        var check_opacity = () => {
          browser.getCssProperty('.trade-dialog .trade-fields .purchase-row', 'opacity', (result) => {
            if (result.value === '1') {
              browser.assert.cssProperty('.trade-dialog .trade-fields .purchase-row', 'opacity', '1');
              done();
            } else if (test_count >= 20) {
              browser.assert.fail('purchase-row (style : opacity) to be 1', 'purchase-row (style : opacity) to be ' + result.value,
                'Timed out while waiting for proposal response', '');
            } else {
              test_count++;
              setTimeout(check_opacity, browser.globals.waitForConditionPollInterval)
            }
          });
        }
        check_opacity();
      })
      // Purchase contract
      .execute("$('.trade-dialog .trade-fields .purchase-row > li > button').click()")
      .waitForElementPresent('.trade-dialog .trade-conf')
      .waitForElementVisible('.trade-dialog .trade-conf .tick-chart')
      /*
      .waitForElementPresent('.trade-dialog .trade-conf .highcharts-container svg \
        .highcharts-series-group .highcharts-markers .highcharts-point')*/
      // Monitoring tick trade
      .browser.pause(10000)
      .waitForElementVisible('.trade-dialog .trade-conf .close')
      .execute('$(".trade-dialog .trade-conf .close").click()')
      .assert.elementNotPresent('.trade-dialog .trade-conf')
  },
  'Trade template': (browser) => {
    browser
      .click('.trade-fields .categories-row .trade-template-manager > .img')
      .assert.visible('.trade-fields .categories-row .trade-template-manager-root')
      .click('.trade-fields .categories-row .trade-template-manager-root .button-secondary[rv-on-click="menu.save_as"]')
      .assert.visible('.trade-fields .categories-row .trade-template-manager-root .save-as')
      .setValue('.trade-fields .categories-row .trade-template-manager-root .save-as form > input', '(Some)')
      .click('.trade-fields .categories-row .trade-template-manager-root .save-as form > button')
      .assert.visible('.trade-fields .categories-row .trade-template-manager-root .menu')
      .click('.trade-fields .categories-row .trade-template-manager-root .menu [rv-on-click="menu.templates"]')
      .assert.visible('.trade-fields .categories-row .trade-template-manager-root .templates')
      .assert.containsText('.trade-fields .categories-row .trade-template-manager-root .templates > div > .template .name', 'Up/Down Lower(Some)')
      .end()
  }
}
