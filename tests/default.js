import { start, close } from './server';

// this file is used for spawning the server and navigating to the trading page.
export const before = (browser) => {
  start(); //Start server
  const mainPage = browser.page.mainPage();
  //Open Main page
  mainPage.navigate().open();
};

export const beforeLogin = (browser) => {
  start(); //Start server
  const mainPage = browser.page.mainPage();
  //Open Main page
  mainPage.login();
};

export const after = (browser) => {
  close(); // Close server
  // End test
  browser.end();
}
