const changeTradeType = (browser) => {
  browser
    .click('.trade-dialog .trade-fields .categories-row li:first-of-type .ui-selectmenu-button')
    .click('.ui-selectmenu-menu.ui-selectmenu-open > ul > li:nth-of-type(4)')
    .assert.containsText('.trade-dialog .trade-fields .categories-row li:first-of-type .ui-selectmenu-button .ui-selectmenu-text', 'Digits')
    .waitForCSSProperty('.trade-dialog .trade-fields .purchase-row', 'opacity', '1')
};

const buyContract = (browser, tradeType, barrier) => {
  browser.barrier = barrier;
  browser.tradeType = tradeType;
  browser
    // Check if the purchase button is enabled
    .waitForCSSProperty('.trade-dialog .trade-fields .purchase-row', 'opacity', '1')
    // Purchase contract
    .execute("$('.trade-dialog .trade-fields .purchase-row > li > button').click()")
    .waitForElementPresent('.trade-dialog .trade-conf')
    .waitForDigitData('.trade-dialog .trade-conf .digits-row', 5)
    .waitForElementVisible('.trade-dialog .trade-conf .close')
    .execute('$(".trade-dialog .trade-conf .close").click()')
    .assert.elementNotPresent('.trade-dialog .trade-conf')
};

export default {
  matches: (browser) => {
    changeTradeType(browser);
    browser
      .assert.containsText('.trade-dialog .trade-fields .contract-displays .active', 'Matches')
      .assert.visible('.trade-dialog .trade-fields .digits-row');
    buyContract(browser, 'Matches', '0');
  },
  differs: (browser) => {
    browser
      .click('.trade-dialog .trade-fields .contract-displays [data-name="differs"]')
      .assert.containsText('.trade-dialog .trade-fields .contract-displays .active', 'Differs')
      .assert.visible('.trade-dialog .trade-fields .digits-row');
    //buyContract(browser, 'Differs', '0');
  },
  over: (browser) => {
    browser
      .click('.trade-dialog .trade-fields .contract-displays [data-name="over"]')
      .assert.containsText('.trade-dialog .trade-fields .contract-displays .active', 'Over')
      .assert.visible('.trade-dialog .trade-fields .digits-row');
    //buyContract(browser, 'Over', '0');
  },
  under: (browser) => {
    browser
      .click('.trade-dialog .trade-fields .contract-displays [data-name="under"]')
      .assert.containsText('.trade-dialog .trade-fields .contract-displays .active', 'Under')
      .assert.visible('.trade-dialog .trade-fields .digits-row');
    //buyContract(browser, 'Under', '1');
  },
  even: (browser) => {
    browser
      .click('.trade-dialog .trade-fields .contract-displays [data-name="even"]')
      .assert.containsText('.trade-dialog .trade-fields .contract-displays .active', 'Even');
    //buyContract(browser, 'Even');
  },
  odd: (browser) => {
    browser
      .click('.trade-dialog .trade-fields .contract-displays [data-name="odd"]')
      .assert.containsText('.trade-dialog .trade-fields .contract-displays .active', 'Odd');
    //buyContract(browser, 'Odd');
  }
}
