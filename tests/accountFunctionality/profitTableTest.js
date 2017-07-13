export default {
  profitTable: (browser) => {
    browser
      .click('.main-account')
      //Open Profit table
      .click('.link.profitTable')
      .waitForElementPresent('.profitTable')
      .waitForElementNotVisible('.profitTable .dataTables_processing')
      // Close profit table
      .click('.profitTable .custom-icon-close')
      .waitForElementNotVisible('.profitTable')
  }
}