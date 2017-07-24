/**
 * Created by Arnab Karmakar on 7/19/17.
 */
export default (browser) => {
    browser
        .url(browser.globals.url)
        .waitForElementVisible('body')
        .assert.title('Binary.com : Webtrader');
};
