const changeTradeType = (browser) => {
  browser
    .click('.trade-dialog .trade-fields .categories-row li:first-of-type .ui-selectmenu-button')
    .click('.ui-selectmenu-menu.ui-selectmenu-open > ul > li:nth-of-type(2)')
    .assert.containsText('.trade-dialog .trade-fields .categories-row li:first-of-type .ui-selectmenu-button .ui-selectmenu-text', 'Touch/No Touch')
    .waitForCSSProperty('.trade-dialog .trade-fields .purchase-row', 'opacity', '1')
};

export default {
  touch: (browser) => {
    changeTradeType(browser);
    browser
      .waitForCSSProperty('.trade-dialog .trade-fields .purchase-row', 'opacity', '1')
      .assert.containsText('.trade-dialog .trade-fields .contract-displays .active', 'Touch')
      .execute(() => { $('.trade-dialog .trade-fields .purchase-row > li > button').click() })
      .waitForElementPresent('.trade-dialog .trade-conf')
      .assert.containsText('.trade-dialog .trade-conf .title-row > li > span', 'Contract Confirmation')
      .waitForElementVisible('.trade-dialog .trade-conf .close')
      .execute(() => { $(".trade-dialog .trade-conf .close").click() })
      .assert.elementNotPresent('.trade-dialog .trade-conf')
  },
  noTouch: (browser) => {
    browser
      .click('.trade-dialog .trade-fields .contract-displays [data-name="no touch"]')
      .waitForCSSProperty('.trade-dialog .trade-fields .purchase-row', 'opacity', '1')
      .assert.containsText('.trade-dialog .trade-fields .contract-displays .active', 'No touch')
      .execute(() => { $('.trade-dialog .trade-fields .purchase-row > li > button').click() })
      .waitForElementPresent('.trade-dialog .trade-conf')
      .assert.containsText('.trade-dialog .trade-conf .title-row > li > span', 'Contract Confirmation')
      .waitForElementVisible('.trade-dialog .trade-conf .close')
      .execute(() => { $(".trade-dialog .trade-conf .close").click() })
      .assert.elementNotPresent('.trade-dialog .trade-conf')
  }
}
