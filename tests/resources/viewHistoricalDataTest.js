export default {
  viewHistoricalData: (browser) => {
    browser
      .click('.resources')
      .click('.resources .download')
      .waitForElementPresent('.download_window')
      .click('.download_window .download .download_inst_time_cont .download_instruments_container .download_instruments')
      .click('.download_window .download .download_inst_time_cont .download_instruments_container > ul > li:last-of-type')
      .click('.download_window .download .download_inst_time_cont .download_instruments_container > ul > li:last-of-type > ul > li:last-of-type')
      .click('.download_window .download .download_inst_time_cont .download_instruments_container > ul > li:last-of-type > ul > li:last-of-type > ul > li:first-of-type')
      .click('.download_window .download .download_inst_time_cont .download_timePeriod_container .download_timePeriod')
      .execute('$(".download_window .download .download_inst_time_cont .download_timePeriod_container > ul > li:first-of-type").click()')
      .execute('$(".download_window .download .download_inst_time_cont .download_timePeriod_container > ul > li:nth-of-type(2) > ul > li:first-of-type").click()')
      .execute('$(".download_window .download .download_fromDate").val("01/01/2017")')
      .click('.download_window .download .download_show')
      .waitForSeriesPresent('.download_window .download .downloadChart', 'Bear Market Index')
      .assert.containsText('.download_window .download .downloadChart svg .highcharts-title > tspan', 'Bear Market Index (1m)')
  }
}
