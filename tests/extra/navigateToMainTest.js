/**
 * Created by Arnab Karmakar on 7/19/17.
 */
export default (browser) => {
    browser
        .waitForElementVisible('button')
        .click('button')
        .assert.urlContains('main.html');
};
