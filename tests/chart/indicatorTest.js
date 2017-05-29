const closeDialog = (browser, dialogName) => {
  browser
    .execute("$('." + dialogName + "').parent().find('.ui-dialog-titlebar-close').click()")
    .assert.hidden('.' + dialogName);
};

const openDialog = (browser, ele, dialogName) => {
  browser
    .click('div[role="dialog"] .webtrader-dialog .chartOptions_button span[data-balloon="' + ele + '"]')
    .waitForElementPresent('.' + dialogName);
};


export const addIndicator = (browser) => {
  browser
    .click('.indicator-dialog div:nth-of-type(4) > div > div:first-of-type > span:first-of-type')
    .assert.hidden('.indicator-dialog')
    .waitForElementPresent('.indicator-builder-ui-dialog')
    .assert.containsText('.indicator-builder-ui-dialog .ui-dialog-titlebar > span', 'Average True Range')
    // Apply indicator
    .click('.indicator-builder-ui-dialog .ui-dialog-buttonpane .ui-dialog-buttonset button:first-of-type')
    .waitForElementPresent('div[role="dialog"] .webtrader-dialog .chartOptions > .table > .row > .cell .countBubl[rv-text="indicatorsCount"]')
    //Check indicator count is as expected
    .waitForSeriesPresent('div[role=\'dialog\'] .webtrader-dialog .chartSubContainer', 'ATR (14)')
    .assert.containsText('div[role="dialog"] .webtrader-dialog .chartOptions > .table > .row > .cell .countBubl[rv-text="indicatorsCount"]', '1')
    .click('div[role="dialog"] .webtrader-dialog .chartOptions_button span[data-balloon="Indicators"]')
    .waitForElementPresent('.indicator-dialog')
    .assert.containsText('.indicator-dialog .current > .table > .row > .cell > .table > .row:first-of-type > .cell > span', "Average True Range");
};

export const removeIndicator = (browser) => {
  browser
    .click('.indicator-dialog .current > .table > .row > .cell > .remove')
    .assert.elementNotPresent('.indicator-dialog .current > .table');
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
