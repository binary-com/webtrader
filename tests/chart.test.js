module.exports = {
    'Navigate to trading page': (browser) => {
        browser
            .url('http://localhost:9001')
            .waitForElementVisible('body')
            .click('button')
            .waitForElementNotVisible('.sk-spinner-container')
    },
    'Chart drop down': (browser) => {
        browser
            .assert.containsText('.top-nav-menu .instruments', 'Chart')
            .waitForElementPresent('.top-nav-menu .instruments ul:first-of-type li:first-of-type')
            .click('.top-nav-menu .windows')
            //Close all dialogs.
            .click('.top-nav-menu .windows .closeAll')
            .waitForElementVisible('.chrome_extension')
            //Close chrome pop-up
            .click('.chrome_extension #cancel')
            .click('.top-nav-menu .instruments')
            .waitForElementVisible('.top-nav-menu .instruments ul:first-of-type')
            .click('.top-nav-menu .instruments ul:first-of-type li:first-of-type')
            .assert.visible('.top-nav-menu .instruments ul:first-of-type li:first-of-type')
            .click('.top-nav-menu .instruments ul:first-of-type li:first-of-type ul:first-of-type li:first-of-type')
            .assert.visible('.top-nav-menu .instruments ul:first-of-type li:first-of-type ul:first-of-type li:first-of-type')
            .click('.top-nav-menu .instruments ul:first-of-type li:first-of-type ul:first-of-type li:first-of-type ul:first-of-type li:first-of-type')
            .saveScreenshot('./screenshots/chart.png')
    },
    'Chart functions': (browser) => {
        browser
            .waitForElementVisible('div[role="dialog"]:last-of-type')
            .waitForElementNotVisible('div[role="dialog"]:last-of-type .webtrader-dialog .highcharts-loading')
            .click('div[role="dialog"]:last-of-type img.reload')
            .waitForElementVisible('div[role="dialog"]:last-of-type .webtrader-dialog .highcharts-loading')
    },
    'End': (browser) => {
        browser
            .end()
    }
}