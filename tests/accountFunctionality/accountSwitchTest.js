export default {
  accountSwitch: (browser) => {
    browser
      .click('.account-menu > ul:first-of-type > li .main-account')
      .assert.visible('.account-menu > #all-accounts-top')
      .click('.account-menu > #all-accounts-top .login-id-list > a:nth-of-type(2)')
      .waitForElementPresent('.realitycheck:last-of-type')
      .execute("$('.realitycheck .realitycheck_firstscreen .realitycheck_btnContainer .button').click()")
      .assert.containsText('.account-menu > ul:first-of-type > li .main-account .account-type', 'Investment Account')
      .assert.containsText('.account-menu > ul:first-of-type > li .main-account .account-id', 'MF6797')
  }
}