export default {
  chartFunctionTest: (browser) => {
    browser
      //Dialog reload
      .click('div[role="dialog"]:last-of-type img.reload')
      //Show time period dropdown
      .click('div[role="dialog"]:last-of-type .chartOptions_button.timeperiod')
      .assert.visible('div[role="dialog"]:last-of-type .timePeriodOverlay')
      //Change time period
      .click('div[role="dialog"]:last-of-type .timePeriodOverlay .row:nth-of-type(2) .cell:last-of-type span:nth-of-type(4)')
      .waitForElementNotVisible('div[role="dialog"]:last-of-type .webtrader-dialog .highcharts-loading')
      // Chart type dropdown
      .click('div[role="dialog"]:last-of-type .chartOptions_button.chart_type')
      .assert.visible('div[role="dialog"]:last-of-type .chartTypeOverlay')
      // Change chart type
      .click('div[role="dialog"]:last-of-type .chartTypeOverlay .row .cell[data-charttype="line"]')
      .waitForElementNotVisible('div[role="dialog"]:last-of-type .webtrader-dialog .highcharts-loading')
      .click('div[role="dialog"]:last-of-type .chartOptions_button.chart_type')
      //Open table view
      .click('div[role="dialog"]:last-of-type .chartTypeOverlay .row .cell[data-charttype="table"]')
      .waitForCSSProperty('div[role="dialog"]:last-of-type .table-view', 'left', '0px', 100)
      //Close table view
      .click('div[role="dialog"]:last-of-type span.close')
      .waitForCSSProperty('div[role="dialog"]:last-of-type .table-view', 'left', '350px',100)
      //Change chart type to candle
      .click('div[role="dialog"]:last-of-type .chartOptions_button.chart_type')
      .click('div[role="dialog"]:last-of-type .chartTypeOverlay .row .cell[data-charttype="ohlc"]')
      .click('div[role="dialog"]:last-of-type .chartOptions_button.chart_type')
      //Crosshair enabled
      .assert.cssClassPresent('div[role="dialog"]:last-of-type .chartTypeOverlay [rv-class-bold="enableCrosshair"]', 'bold')
      .execute('$(\'div[role="dialog"]:last-of-type .chartTypeOverlay [rv-class-bold="enableCrosshair"]\').parent().click()')
      .click('div[role="dialog"]:last-of-type .chartOptions_button.chart_type')
      .assert.cssClassNotPresent('div[role="dialog"]:last-of-type .chartTypeOverlay [rv-class-bold="enableCrosshair"]', 'bold')
      .execute('$(\'div[role="dialog"]:last-of-type .chartTypeOverlay [rv-class-bold="enableCrosshair"]\').parent().click()')
    /**
     * To-Do:
     *  - Figure out a way to simulate mouse hover over highcharts
     */
    /*
    //Check crosshair
    .moveToElement('div[role="dialog"]:last-of-type .highcharts-container', 100, 50)
    .mouseButtonClick(0)
    .mouseButtonClick(2)
    .pause(10000)
    .saveScreenshot('screenshots/crosshair.png')
    .click('div[role="dialog"]:last-of-type .highcharts-container svg > path')
    .assert.elementPresent('div[role="dialog"]:last-of-type .highcharts-container svg > path[stroke-width="2"]')*/
  }
}
