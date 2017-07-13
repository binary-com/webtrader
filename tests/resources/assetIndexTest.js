export default {
  assetIndex: (browser) => {
    browser
      .click('.resources')
      .assert.visible('.resources > ul')
      .click('.resources > ul > li > .assetIndex')
      .waitForElementPresent('div.assetIndex')
      .waitForElementNotVisible('div.assetIndex .dataTables_processing')
      .assert.containsText('div.assetIndex .ui-dialog-titlebar .ui-dialog-title', 'Asset Index')
      .click('div.assetIndex .ui-dialog-titlebar > span:nth-of-type(2)')
      .click('.assetIndex .ui-selectmenu-open .ui-menu-item:nth-of-type(5)')
      .assert.containsText('div.assetIndex .ui-dialog-titlebar > span:nth-of-type(2)', 'Volatility Indices')
      .click('div.assetIndex .ui-dialog-titlebar > span:nth-of-type(3)')
      .click('.assetIndex .ui-selectmenu-open .ui-menu-item:nth-of-type(2)')
      .assert.containsText('div.assetIndex .ui-dialog-titlebar > span:nth-of-type(3)', 'Daily Reset Indices')
      .assert.containsText('.assetIndex .asset-index-dialog > tbody > tr.odd > td:first-of-type', 'Bear Market Index')
      .click('.windows')
      .click('.windows .closeAll')
      .waitForElementNotVisible('.assetIndex')
  }
}
