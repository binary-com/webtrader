import { closeDialog as closeIndicatorDialog ,addIndicator, removeIndicator } from './indicatorTest';
import { openDialog, closeDialog, addOverlay } from './overlayTest';

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

export default {
  indicatorAndOverlay: (browser) => {
    openDialog(browser, 'Indicators', 'indicator-dialog');
    addIndicator(browser);
    closeIndicatorDialog(browser, 'indicator-dialog');
    openDialog(browser, 'Comparisons', 'overlay-dialog');
    addOverlay(browser, ovrly1);
    closeDialog(browser, 'overlay-dialog');
    browser
      .waitForSeriesPresent('div[role=\'dialog\'] .webtrader-dialog .chartSubContainer', 'AUD/JPY')
      .waitForSeriesPresent('div[role=\'dialog\'] .webtrader-dialog .chartSubContainer', 'ATR (14)');
  }
}