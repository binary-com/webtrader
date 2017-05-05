var server = require('./server.js');

module.exports = {
  before: (browser) => {
    if (browser.globals.env === 'browserstack')
      return;
    server.connect();
  },
  after: (browser) => {
    if (browser.globals.env === 'browserstack')
      return;
    server.disconnect();
  },
  'Login': (browser) => {
    var url = 'http://localhost:3000';
    if (browser.globals.env === 'browserstack')
      url = 'https://webtrader.binary.com/beta';
    browser
      .url(url)
      .waitForElementVisible('body')
      .click('button')
      .waitForElementNotVisible('.sk-spinner-container')
      .waitForElementVisible('.chrome_extension')
      //Close chrome pop-up
      .click('.chrome_extension #cancel')
      .waitForElementPresent('.top-nav-menu .instruments ul:first-of-type li:first-of-type')
      .click('.top-nav-menu .windows')
      //Close all dialogs.
      .click('.top-nav-menu .windows .closeAll')
      .click('.login button')
      .waitForElementVisible('.oauth-dialog')
      .click('.login-pane button')
      //Navigate to oauth.binary.com
      .assert.urlContains('oauth.binary.com')
      //Login
      .url(url + '/?acct1=VRTC1418840&token1=vFXoxzTlyaFm6wU')
      .waitForElementVisible('body')
      .waitForElementNotVisible('.sk-spinner-container')
      //Check if logged in
      .waitForElementVisible('.main-account')
      // Close all chart windows
      .waitForElementPresent('.top-nav-menu .instruments ul:first-of-type li:first-of-type')
      .click('.top-nav-menu .windows')
      //Check account credentials
      .click('.top-nav-menu .windows .closeAll')
      .assert.containsText('.main-account .account-type', 'Virtual Account')
      .assert.containsText('.account .main-account .account-id', 'VRTC1418840')
      //Check login dropdown
      .click('.main-account')
      .assert.visible('#all-accounts-top')
  },
  'Portfolio': (browser) => {
    browser
      .click('.link.portfolio')
      .waitForElementPresent('.webtrader-dialog[data-authorized="true"]')
      .assert.containsText('.ui-dialog .ui-dialog-title', 'Portfolio')
      .click('.custom-icon-close')
  },
  'Statement': (browser) => {
    browser
      .click('.main-account')
      .assert.visible('#all-accounts-top')
      //Open statement
      .click('.link.statement')
      .waitForElementPresent('.statement-dialog-content')
      .waitForElementPresent('.statement-dialog-content button')
      //Open view popup
      .execute('$(".statement-dialog-content button:not(.button-disabled):first").click()')
      .waitForElementPresent('.view-transaction-dialog')
      .click('.view-transaction-dialog .tabs li[rv-on-click="route.update | bind \'chart\'"]')
      .assert.cssClassPresent('.view-transaction-dialog .tabs li[rv-on-click="route.update | bind \'chart\'"]', 'active')
      .assert.visible('.view-transaction-dialog .content .chart-container')
      .waitForElementNotVisible('.view-transaction-dialog .content .chart-container .loading')
      .assert.elementPresent('.view-transaction-dialog .content .chart-container .transaction-chart .highcharts-container svg')
      .end()
  }
}
