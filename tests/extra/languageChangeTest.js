export default {

  checkLangOnIndex: (browser) => {
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

  changeLangOnIndex: (browser) => {
    browser
        .click('.languages .ID')
        .waitForElementVisible('body')
        .assert.attributeContains('#select_language .ID', 'class', 'invisible')
        //set back to EN
        .execute('local_storage.set("i18n", { value: "EN" })')
        .refresh();
  },

  changeLangOnMain: (browser) => {
    browser
        .click('#display_language')
        .assert.visible('#select_language')
        .click('#select_language li:nth-child(3)') //Setting to Deutsch
        .waitForElementPresent('body')
        .assert.containsText('.trade', 'Handel')
        //set back to EN
        .execute('local_storage.set("i18n", { value: "EN" })')
        .refresh();
  }

};