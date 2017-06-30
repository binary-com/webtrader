export default {
  ticker: (browser) => {
    browser
      .assert.visible('.trade-dialog .trade-fields .tick-quote')
      .assert.visible('.trade-dialog .trade-fields .sparkline-chart');
  }
};
