export default {
  login: (browser) => {
    browser
      .click('.login button')
      .waitForElementVisible('.oauth-dialog')
      .click('.login-pane button')
      //Navigate to oauth.binary.com
      .assert.urlContains('oauth.binary.com')
      //Login
      .url(browser.globals.url + browser.globals.auth_url)
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
  }
}
