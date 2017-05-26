export default {
  tradingTimes: (browser) => {
    browser
      .click('.resources')
      .assert.visible('.resources > ul')
      .click('.resources > ul > li > .tradingTimes')
      .waitForElementPresent('div.tradingTimes')
      .waitForElementNotVisible('div.tradingTimes .dataTables_processing')
      .assert.containsText('div.tradingTimes .ui-dialog-titlebar .ui-dialog-title', 'Trading Times')
      .click('div.tradingTimes .ui-dialog-titlebar > span:nth-of-type(3)')
      .click('div.tradingTimes .ui-selectmenu-open .ui-menu-item:nth-of-type(2)')
      .waitForElementNotVisible('div.tradingTimes .dataTables_processing')
      .click('div.tradingTimes .trading-times-sub-header > span:nth-of-type(2)')
      .click('div.tradingTimes .ui-selectmenu-open .ui-menu-item:nth-of-type(5)')
      .click('div.tradingTimes .trading-times-sub-header > span:nth-of-type(3)')
      .click('div.tradingTimes .ui-selectmenu-open .ui-menu-item:nth-of-type(2)')
      .assert.containsText('.tradingTimes tbody > tr.odd > td:first-of-type', 'Bear Market Index')
      .click('.windows')
      .click('.windows .closeAll')
      .waitForElementNotVisible('.tradingTimes')
  }
}
