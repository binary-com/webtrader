const changeTradeType = (browser) => {
  browser
    .click('.trade-dialog .trade-fields .categories-row li:first-of-type .ui-selectmenu-button')
    .click('.ui-selectmenu-menu.ui-selectmenu-open > ul > li:nth-of-type(3)')
    .assert.containsText('.trade-dialog .trade-fields .categories-row li:first-of-type .ui-selectmenu-button .ui-selectmenu-text', 'In/Out')
    .waitForCSSProperty('.trade-dialog .trade-fields .purchase-row', 'opacity', '1')
};

export default {
  in: (browser) => {
    browser
      .click('.trade-dialog .trade-fields .contract-displays [data-name="ends in"]')
      .assert.containsText('.trade-dialog .trade-fields .contract-displays .active', 'Ends in')
      .assert.visible('.trade-dialog .trade-fields .barriers-high-barrier-row')
      .assert.visible('.trade-dialog .trade-fields .barriers-low-barrier-row')
      .waitForCSSProperty('.trade-dialog .trade-fields .purchase-row', 'opacity', '1');
  },
  out: (browser) => {
    changeTradeType(browser);
    browser
      .assert.containsText('.trade-dialog .trade-fields .contract-displays .active', 'Ends out')
      .assert.visible('.trade-dialog .trade-fields .barriers-high-barrier-row')
      .assert.visible('.trade-dialog .trade-fields .barriers-low-barrier-row')
      .waitForCSSProperty('.trade-dialog .trade-fields .purchase-row', 'opacity', '1')
  }
}
