const changeTradeType = (browser) => {
  browser
    .click('.trade-dialog .trade-fields .categories-row li:first-of-type .ui-selectmenu-button')
    .click('.ui-selectmenu-menu.ui-selectmenu-open > ul > li:nth-of-type(5)')
    .assert.containsText('.trade-dialog .trade-fields .categories-row li:first-of-type .ui-selectmenu-button .ui-selectmenu-text', 'Asians')
    .waitForCSSProperty('.trade-dialog .trade-fields .purchase-row', 'opacity', '1')
};

const buyContract = (browser, tradeDirection) => {
  browser.tradeDirection = tradeDirection;
  browser
    // Check if the purchase button is enabled
    .waitForCSSProperty('.trade-dialog .trade-fields .purchase-row', 'opacity', '1')
    // Purchase contract
    .execute("$('.trade-dialog .trade-fields .purchase-row > li > button').click()")
    .waitForElementPresent('.trade-dialog .trade-conf')
    .waitForElementVisible('.trade-dialog .trade-conf .tick-chart')
    // Monitoring tick trade
    .waitForSeriesData('.trade-dialog .trade-conf .tick-chart', 4)
    .waitForElementVisible('.trade-dialog .trade-conf .close')
    .execute('$(".trade-dialog .trade-conf .close").click()')
    .assert.elementNotPresent('.trade-dialog .trade-conf')
};

export default {
  up: (browser) => {
    changeTradeType(browser);
    browser
      .assert.containsText('.trade-dialog .trade-fields .contract-displays .active', 'Asian up')
    buyContract(browser, 'Up');
  },
  down: (browser) => {
    browser
      .click('.trade-dialog .trade-fields .contract-displays [data-name="asian down"]')
      .assert.containsText('.trade-dialog .trade-fields .contract-displays .active', 'Asian down')
  }
}
