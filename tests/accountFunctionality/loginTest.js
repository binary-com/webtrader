import assert from 'assert';
import head from 'lodash/head';

export default {
  login: (browser) => {

    let accountId = browser.globals.auth_url.split('&');
    assert.notEqual(accountId, null, 'No account info found');
    assert.notEqual(accountId, undefined, 'No account info found');
    assert.notEqual(accountId.length, 0, 'Incorrect account info');
    accountId = head(accountId).replace('acct1=', '');
    assert.notEqual(accountId, null, 'No account info found');
    assert.notEqual(accountId, undefined, 'No account info found');

    browser
      .click('.login button')
      .waitForElementVisible('.oauth-dialog')
      .click('.login-pane button')
      //Navigate to oauth.binary.com
      .assert.urlContains('oauth.binary.com')
      //Login
      .url(`${browser.globals.url}/?${browser.globals.auth_url}`)
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
      .assert.containsText('.account .main-account .account-id', accountId)
      //Check login dropdown
      .click('.main-account')
      .assert.visible('#all-accounts-top');

  }
}
