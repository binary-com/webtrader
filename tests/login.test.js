/**
 * This file contains test for:
 * - Login process
 * - Portfolio
 * - Profit table
 * - Statement
 * - Token Management
 * - Logout
 */
var server = require('./server.js');

module.exports = {
  before: (browser) => {
    if (browser.globals.env !== 'browserstack')
      server.connect();

    browser
      .url(browser.globals.url)
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
  },
  after: (browser) => {
    if (browser.globals.env !== 'browserstack')
      server.disconnect();
  },
  'Login': (browser) => {
    browser
      .click('.login button')
      .waitForElementVisible('.oauth-dialog')
      .click('.login-pane button')
      //Navigate to oauth.binary.com
      .assert.urlContains('oauth.binary.com')
      //Login
      .url(browser.globals.url + '/?acct1=VRTC1418840&token1=z2d7JWm4TS4Fei1')
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
      .waitForElementPresent('.portfolio')
      .waitForElementVisible('.portfolio .ui-dialog-title')
      .assert.containsText('.portfolio .ui-dialog-title', 'Portfolio')
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
      // Close view transaction
      .execute("$('.view-transaction-dialog').parent().find('.custom-icon-close').click()")
      .waitForElementNotPresent('.view-transaction-dialog')
      .execute('$(".webtrader-dialog").parent().find(".custom-icon-close").click()')
      .waitForElementNotPresent('.statement-dialog-content')
  },
  'Profit Table': (browser) => {
    browser
      .click('.main-account')
      //Open Profit table
      .click('.link.profitTable')
      .waitForElementPresent('.profitTable')
      .waitForElementNotVisible('.profitTable .dataTables_processing')
      // Close profit table
      .click('.profitTable .custom-icon-close')
      .waitForElementNotVisible('.profitTable')
  },
  'Token Mangement': (browser) => {
    browser
      .click('.main-account')
      //Open token management
      .click('.link.token-management')
      .waitForElementPresent('.token-dialog')
      .pause(500)
      // Create token button
      .execute('$(".token-dialog > button").click()')
      .assert.visible('.token-dialog .create-token-pane')
      .setValue('.create-token-pane .token-input', 'Example token')
      //Create token
      .click('.create-token-pane button')
      .waitForElementNotVisible('.token-dialog .create-token-pane')
      .setValue('.token-dialog .token-search', 'Example token')
      .assert.containsText('.token-dialog table tbody tr td:nth-of-type(1)', 'Example token')
      .assert.containsText('.token-dialog table tbody tr td:nth-of-type(3)', 'read')
      //Remove token
      .execute('$(".token-dialog table tbody tr td:nth-of-type(5) .ui-icon-delete").click()')
      .assert.visible('.token-dialog .confirm')
      .click('.token-dialog .confirm button:first-of-type')
      .waitForElementNotPresent('.token-dialog table tbody tr')
  },
  'Logout': (browser) => {
    browser
      .click('.main-account')
      .click('a[rv-on-click="logout"]')
      .waitForElementVisible('.login')
      .end()
  }
}
