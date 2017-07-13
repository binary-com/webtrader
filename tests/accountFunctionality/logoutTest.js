export default {
  logout: (browser) => {
    browser
      .click('.main-account')
      .click('a[rv-on-click="logout"]')
      .waitForElementVisible('.login')
  }
}
