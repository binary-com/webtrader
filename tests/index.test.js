module.exports = {
  'Index file': function (browser) {
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
  'Check current language': (browser) => {
    browser.execute('return local_storage.get("i18n")', [], (result) => {
      const lang = result.value.value.toUpperCase();
      browser
        .waitForElementVisible('.languages')
        .click('.languages')
        .waitForElementVisible('#select_language')
        .assert.visible('#select_language')
        .assert.attributeContains('#select_language .' + lang, 'class', 'invisible');
    });
  },
  'Change current language': (browser) => {
    browser
      .click('.languages .ID')
      .assert.urlContains('lang=id')
      .waitForElementVisible('body')
      .execute('return local_storage.get("i18n").value', [], (result) => {
        result.value = result.value.toUpperCase();
        browser
          .assert.attributeContains('#select_language .' + result.value, 'class', 'invisible');
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
