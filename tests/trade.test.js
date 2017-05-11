/**
 * Tests for trade dialog
 */
var server = require('./server.js');

module.exports = {
  before: (browser) => {
    if (browser.globals.env !== 'browserstack')
      server.connect();
    browser
      .url(browser.globals.url)
      .waitForElementVisible('body')
      .click('button')
      .waitForElementNotVisible('.sk-spinner-container')
      .waitForElementVisible('.chrome_extension')
      //Close chrome pop-up
      .click('.chrome_extension #cancel')
      .waitForElementPresent('.top-nav-menu .instruments ul:first-of-type li:first-of-type')
      .click('.top-nav-menu .windows')
      //Close all dialogs.
      .click('.top-nav-menu .windows .closeAll')
  },
  after: (browser) => {
    if (browser.globals.env !== 'browserstack')
      server.disconnect();
  },
  'Up/Down (RISE)': (browser) => {
    browser
      // Open volatility 10 index dialog
      .click('.trade')
      .waitForElementVisible('.trade > ul > li:last-of-type')
      .click('.trade > ul > li:last-of-type')
      .waitForElementVisible('.trade > ul > li:last-of-type > ul > li:first-of-type')
      .click('.trade > ul > li:last-of-type > ul > li:first-of-type')
      .waitForElementVisible('.trade > ul > li:last-of-type > ul > li:first-of-type > ul > li:first-of-type')
      .click('.trade > ul > li:last-of-type > ul > li:first-of-type > ul > li:first-of-type')
      .waitForElementPresent('.trade-dialog')
      .assert.containsText('.proposal-message', 'Loading ...')
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
      .end()
  }
}