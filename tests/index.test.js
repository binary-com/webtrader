//var moment = require('moment');

module.exports = { // adapted from: https://git.io/vodU0
  'Index file': function (browser) {
    //console.dir(browser);
    browser
      .url('http://localhost:9001')
      .waitForElementVisible('body')
      .assert.title('Binary.com : Webtrader');
  },
  'Check current time': (browser) => {
    browser.execute("return moment.utc().format('YYYY-MM-DD HH:mm') + ' GMT'", [], (result) => {
      browser
        .assert.containsText('.time', result.value);
    });
  },
  'Check language': (browser) => {
    browser.execute('return local_storage.get("i18n")', [], (result) => {
      const lang = result.value.value.toUpperCase();
      browser
        .click('.languages')
        .assert.visible('#select_language')
        .assert.attributeContains('#select_language .' + lang, 'class', 'invisible');
    });
  },
  'Navigate to trading page': (browser) => {
    browser
      .waitForElementVisible('button')
      .click('button')
      .assert.urlContains('main.html');

  },
  'End': (browser) => {
    browser.end();
  }
};
