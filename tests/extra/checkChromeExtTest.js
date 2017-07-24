/**
 * Created by Arnab Karmakar on 7/19/17.
 */
export default (browser) => {
    browser.waitForElementVisible('.chrome_extension')
        .click('.chrome_extension #cancel');
};
