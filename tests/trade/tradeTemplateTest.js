export default {
  tradeTemplate: (browser) => {
    browser
      .click('.trade-fields .categories-row .trade-template-manager > .img')
      .assert.visible('.trade-fields .categories-row .trade-template-manager-root')
      .click('.trade-fields .categories-row .trade-template-manager-root .button-secondary[rv-on-click="menu.save_as"]')
      .assert.visible('.trade-fields .categories-row .trade-template-manager-root .save-as')
      .setValue('.trade-fields .categories-row .trade-template-manager-root .save-as form > input', '(Some)')
      .click('.trade-fields .categories-row .trade-template-manager-root .save-as form > button')
      .assert.visible('.trade-fields .categories-row .trade-template-manager-root .menu')
      .click('.trade-fields .categories-row .trade-template-manager-root .menu [rv-on-click="menu.templates"]')
      .assert.visible('.trade-fields .categories-row .trade-template-manager-root .templates')
      .assert.containsText('.trade-fields .categories-row .trade-template-manager-root .templates > div > .template .name', 'Asians Asian down(So')
  }
}
