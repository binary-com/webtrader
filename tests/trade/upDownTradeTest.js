const buyContract = (browser, direction) => {
  browser.tradeDirection = direction;
  browser
    // Check if the purchase button is enabled
    .waitForCSSProperty('.trade-dialog .trade-fields .purchase-row', 'opacity', '1')
    // Purchase contract
    .execute("$('.trade-dialog .trade-fields .purchase-row > li > button').click()")
    .waitForElementPresent('.trade-dialog .trade-conf')
    .waitForElementVisible('.trade-dialog .trade-conf .tick-chart')
    // Monitoring tick trade
    .waitForSeriesData('.trade-dialog .trade-conf .tick-chart', 5)
    .waitForElementVisible('.trade-dialog .trade-conf .close')
    .execute('$(".trade-dialog .trade-conf .close").click()')
    .assert.elementNotPresent('.trade-dialog .trade-conf')
};

export default {
  rise: (browser) => {
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
    buyContract(browser, 'Up');
  },
  fall: (browser) => {
    browser
      .click('.trade-dialog .trade-fields .contract-displays [data-name="fall"]')
      .assert.containsText('.trade-dialog .trade-fields .contract-displays > .active', 'Fall');
    //buyContract(browser, 'Down');
  },
  higher: (browser) => {
    // Add tests for barrier
    browser
      .click('.trade-dialog .trade-fields .contract-displays [data-name="higher"]')
      .assert.containsText('.trade-dialog .trade-fields .contract-displays > .active', 'Higher')
      .waitForCSSProperty('.trade-dialog .trade-fields .barriers-barrier-row', 'display', 'flex');
    //buyContract(browser, 'Up');
  },
  lower: (browser) => {
    // Add tests for barrier
    browser
      .click('.trade-dialog .trade-fields .contract-displays [data-name="lower"]')
      .assert.containsText('.trade-dialog .trade-fields .contract-displays > .active', 'Lower')
      .assert.visible('.trade-dialog .trade-fields .barriers-barrier-row');
    //buyContract(browser, 'Down');
  }
}
