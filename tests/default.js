import { start, close } from './server';

// this file is used for spawning the server and navigating to the trading page.
export const before = (browser) => {
  if (browser.globals.env !== 'browserstack')
    start(); //Start server
  const mainPage = browser.page.mainPage();
  //Open Main page
  mainPage.navigate().open();
};

export const beforeLogin = (browser) => {
  if (browser.globals.env !== 'browserstack')
    start(); //Start server
  const mainPage = browser.page.mainPage();
  //Open Main page
  mainPage.login();
};

export const after = (browser) => {
  if (browser.globals.env !== 'browserstack')
    close(); // Close server
  // End test
  browser.end();
}
