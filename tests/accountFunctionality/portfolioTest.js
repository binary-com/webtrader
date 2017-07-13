export default {
    portfolio: (browser) => {
    browser
      .click('.link.portfolio')
      .waitForElementPresent('.portfolio')
      .waitForElementVisible('.portfolio .ui-dialog-title')
      .assert.containsText('.portfolio .ui-dialog-title', 'Portfolio')
      .click('.custom-icon-close')
  }
}
