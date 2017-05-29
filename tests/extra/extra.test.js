import { beforeLogin, after } from '../default';
import { help as helpTest } from './helpTest.js';

export default {
  before: beforeLogin,
  after: after,
  'Help': helpTest,
  'Switch account': (browser) => {
    browser
      .click('.account-menu > ul:first-of-type > li .main-account')
      .assert.visible('.account-menu > #all-accounts-top')
      .click('.account-menu > #all-accounts-top .login-id-list > a:nth-of-type(2)')
      .waitForElementPresent('.realitycheck:last-of-type')
      .execute("$('.realitycheck .realitycheck_firstscreen .realitycheck_btnContainer .button').click()")
      .assert.containsText('.account-menu > ul:first-of-type > li .main-account .account-type', 'Investment Account')
      .assert.containsText('.account-menu > ul:first-of-type > li .main-account .account-id', 'MF6797')
  },
  'Language change': (browser) => {
    browser
      .click('#display_language')
      .assert.visible('#select_language')
      .assert.cssClassPresent('#select_language > li:nth-of-type(2)', 'invisible')
      .click('#select_language > li:nth-of-type(3)')
      .waitForElementPresent('body')
      .assert.containsText('.trade', 'Handel');
  },
}
