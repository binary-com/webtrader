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

export const addOverlay = (browser, overlayObject) => {
  browser
    //Apply overlay
    .click('.overlay-dialog > div:nth-of-type(3) > .categories:first-of-type .category > div:nth-of-type(' + overlayObject.count + ') span')
    .waitForElementNotPresent('.overlay-dialog')
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

export const closeDialog = (browser, dialogName) => {
  browser
    .execute("$('." + dialogName + "').parent().find('.lean_overlay_titlebar .close').click()")
    .waitForElementNotPresent('.' + dialogName);
}
export const openDialog = (browser, ele, dialogName) => {
  browser
    .click('div[role="dialog"] .webtrader-dialog .chartOptions_button span[data-balloon="' + ele + '"]')
    .waitForElementPresent('.' + dialogName);
};

export default {
  overlay: (browser) => {
    openDialog(browser, 'Comparisons', 'overlay-dialog');
    addOverlay(browser, ovrly1); //Add one overlay
    addOverlay(browser, ovrly2); //Add another overlay
    removeOverlay(browser, ovrly1);
  }
}
