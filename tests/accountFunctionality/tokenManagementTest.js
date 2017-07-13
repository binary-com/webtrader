export default {
  tokenManagement: (browser) => {
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
  }
}