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
  },
  noTouch: (browser) => {
    browser
      .click('.trade-dialog .trade-fields .contract-displays [data-name="no touch"]')
      .waitForCSSProperty('.trade-dialog .trade-fields .purchase-row', 'opacity', '1')
      .assert.containsText('.trade-dialog .trade-fields .contract-displays .active', 'No touch')
  }
}
