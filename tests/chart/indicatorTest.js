export const closeDialog = (browser, dialogName) => {
  browser
    .click('div[role="dialog"] .webtrader-dialog .chartOptions_button span[data-balloon="Indicators"]')
    .assert.hidden('.' + dialogName);
};

const openDialog = (browser, ele, dialogName) => {
  browser
    .click('div[role="dialog"] .webtrader-dialog .chartOptions_button span[data-balloon="' + ele + '"]')
    .assert.visible('.' + dialogName);
};


export const addIndicator = (browser) => {
  browser
    .click('.indicator-dialog .view > .types:first-of-type .display_name')
    .assert.visible('.indicator.view')
    .assert.containsText('.header-bar[rv-show="route.value | contains \'indicatorBuilder\'"]', 'Average True Range')
    // Apply indicator
    .click('.indicator.view .action_btn > a:first-of-type')
    .waitForElementPresent('div[role="dialog"] .webtrader-dialog .chartOptions > .table > .row > .cell .countBubl[rv-text="indicatorsCount"]')
    //Check indicator count is as expected
    .waitForSeriesPresent('div[role=\'dialog\'] .webtrader-dialog .chartSubContainer', 'ATR (14)')
    .assert.containsText('div[role="dialog"] .webtrader-dialog .chartOptions > .table > .row > .cell .countBubl[rv-text="indicatorsCount"]', '1')
    .click('div[role="dialog"] .webtrader-dialog .chartOptions_button span[data-balloon="Indicators"]')
    .assert.visible('.indicator-dialog')
    .assert.cssClassNotPresent('.indicator-dialog [rv-on-click=\"route.update | bind \'active\'\"]', 'disabled')
    .execute(() => {
      $('.indicator-dialog div[rv-on-click="route.update | bind \'active\'"] span').click();
    })
    .assert.visible('.indicator-dialog .view[rv-show="route.value | eq \'active\'"]')
    .assert.containsText('.indicator-dialog .view[rv-show="route.value | eq \'active\'"] .display_name', "Average True Range");
};

export const removeIndicator = (browser) => {
  browser
    .execute(() => {
      $('.indicator-dialog .view[rv-show="route.value | eq \'active\'"] span.option-2.remove').click();
    });
  closeDialog(browser, 'indicator-dialog');
  browser
    .assert.hidden('div[role="dialog"] .webtrader-dialog .chartOptions > .table > .row > .cell .countBubl[rv-text="indicatorsCount"]');
};

export default {
  indicator: (browser) => {
    openDialog(browser, 'Indicators', 'indicator-dialog');
    addIndicator(browser);
    removeIndicator(browser);
  }
}
