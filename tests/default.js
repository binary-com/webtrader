import { start, close } from './server';

// this file is used for spawning the server and navigating to the trading page.
export const before = (browser) => {
  if (browser.globals.env !== 'browserstack')
    start(); //Start server
  browser
    //Navigate to index page
    .url(browser.globals.url)
    .waitForElementVisible('body')
    .click('button')
    .waitForElementNotVisible('.sk-spinner-container')
    .assert.containsText('.top-nav-menu .instruments', 'Chart')
    .waitForElementVisible('.chrome_extension')
    //Close chrome pop-up
    .click('.chrome_extension #cancel')
    .waitForElementPresent('.top-nav-menu .instruments > ul > li:first-of-type')
    .click('.top-nav-menu .windows')
    //Close all dialogs.
    .click('.top-nav-menu .windows .closeAll')
};

export const after = (browser) => {
  if (browser.globals.env !== 'browserstack')
    close(); // Close server
  // End test
  browser.end();
}
