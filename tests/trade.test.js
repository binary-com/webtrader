/**
 * Tests for trade dialog
 */
import { beforeLogin, after } from './default';

module.exports = {
  before: (browser) => {
    beforeLogin(browser);
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
  },
  after: after,
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
      .waitForCSSProperty('.trade-dialog .trade-fields .purchase-row', 'opacity', '1')
      // Purchase contract
      .execute("$('.trade-dialog .trade-fields .purchase-row > li > button').click()")
      .waitForElementPresent('.trade-dialog .trade-conf')
      .waitForElementVisible('.trade-dialog .trade-conf .tick-chart')
      /*
      .waitForElementPresent('.trade-dialog .trade-conf .highcharts-container svg \
        .highcharts-series-group .highcharts-markers .highcharts-point')*/
      // Monitoring tick trade
      .waitForSeriesData('.trade-dialog .trade-conf .tick-chart', 5)
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
  }
}
