export default {
  statement: (browser) => {
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
  }
}