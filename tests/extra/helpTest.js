export default {
  help: (browser) => {
    browser
      .click('.help')
      .waitForElementPresent('.help-dialog')
      .execute('$(".help-dialog .help-search").val("AROONOSC").trigger("input")')
      .assert.containsText('.help-dialog .content .items .search-text .highlight', 'AROONOSC')
      .execute('$(".help-dialog .content .items .search-text > a").click()')
      .assert.containsText('.help-dialog .content .items #aroonoscillatoraroonosc', 'Aroon Oscillator (AROONOSC)');
  }
}
