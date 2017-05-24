const ovrly1 = {
  count: '1',
  symbol: 'AUD/JPY',
  appliedOverlaySelector: '.overlay-dialog > .current > .overlay_symbol span[rv-text="ov"]'
};
const ovrly2 = {
  count: '2',
  symbol: 'AUD/USD',
  appliedOverlaySelector: '.overlay-dialog > .current > .overlay_symbol:nth-of-type(2) span[rv-text="ov"]'
};

const addIndicator = (browser) => {
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

const removeIndicator = (browser) => {
  browser
    .click('.indicator-dialog .current > .table > .row > .cell > .remove')
    .assert.elementNotPresent('.indicator-dialog .current > .table');
  closeDialog(browser, 'indicator-dialog');
  browser
    .assert.hidden('div[role="dialog"] .webtrader-dialog .chartOptions > .table > .row > .cell .countBubl[rv-text="indicatorsCount"]');
};

const addOverlay = (browser, overlayObject) => {
  browser
    //Apply overlay
    .click('.overlay-dialog > div:nth-of-type(3) > .categories:first-of-type .category > div:nth-of-type(' + overlayObject.count + ') span')
    .assert.hidden('.overlay-dialog')
    //Check overlay count
    .waitForSeriesPresent('div[role=\'dialog\'] .webtrader-dialog .chartSubContainer', overlayObject.symbol)
    .waitForElementPresent('div[role="dialog"] .webtrader-dialog .chartOptions > .table > .row > .cell .countBubl[rv-text="overlayCount"]')
    .assert.containsText('div[role="dialog"] .webtrader-dialog .chartOptions > .table > .row > .cell .countBubl[rv-text="overlayCount"]',
    overlayObject.count.toString())
    .click('div[role=\'dialog\'] .webtrader-dialog .chartOptions_button span[data-balloon="Comparisons"]')
    .assert.containsText(overlayObject.appliedOverlaySelector, overlayObject.symbol);
};

const removeOverlay = (browser) => {
  browser
    .click('.overlay-dialog > .current > .overlay_symbol span.remove')
    .click('.overlay-dialog > .current > .overlay_symbol span.remove');
  closeDialog(browser, 'overlay-dialog');
  browser
    .assert.hidden('div[role="dialog"] .webtrader-dialog .chartOptions > .table > .row > .cell .countBubl[rv-text="overlayCount"]');
};

const closeDialog = (browser, dialogName) => {
  browser
    .execute("$('." + dialogName + "').parent().find('.ui-dialog-titlebar-close').click()")
    .assert.hidden('.' + dialogName);
}
const openDialog = (browser, ele, dialogName) => {
  browser
    .click('div[role="dialog"] .webtrader-dialog .chartOptions_button span[data-balloon="' + ele + '"]')
    .waitForElementPresent('.' + dialogName);
};

export default {
  indicator: (browser) => {
    openDialog(browser, 'Indicators', 'indicator-dialog');
    addIndicator(browser);
    removeIndicator(browser);
  },
  overlay: (browser) => {
    openDialog(browser, 'Comparisons', 'overlay-dialog');
    addOverlay(browser, ovrly1); //Add one overlay
    addOverlay(browser, ovrly2); //Add another overlay
    removeOverlay(browser, ovrly1);
  },
  indicatorAndOverlay: (browser) => {
    openDialog(browser, 'Indicators', 'indicator-dialog');
    addIndicator(browser);
    closeDialog(browser, 'indicator-dialog');
    openDialog(browser, 'Comparisons', 'overlay-dialog');
    addOverlay(browser, ovrly1);
    closeDialog(browser, 'overlay-dialog');
    browser
      .waitForSeriesPresent('div[role=\'dialog\'] .webtrader-dialog .chartSubContainer', 'AUD/JPY')
      .waitForSeriesPresent('div[role=\'dialog\'] .webtrader-dialog .chartSubContainer', 'ATR (14)');
  }
}
