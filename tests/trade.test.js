/**
 * Tests for trade dialog
 */
import { beforeLogin, after } from './default';
import * as UpDownTests from './upDownTradeTest';
import * as TouchNoTouchTests from './touchNoTouchTradeTest';
import { tradeTemplate } from './tradeTemplateTest';
module.exports = {
  before: (browser) => {
    beforeLogin(browser);
    browser
      // Open volatility 10 index dialog
      .click('.trade')
      .waitForElementVisible('.trade > ul > li:last-of-type')
      .click('.trade > ul > li:last-of-type')
      .waitForElementVisible('.trade > ul > li:last-of-type > ul > li:first-of-type')
      .click('.trade > ul > li:last-of-type > ul > li:first-of-type')
      .waitForElementVisible('.trade > ul > li:last-of-type > ul > li:first-of-type > ul > li:first-of-type')
      .click('.trade > ul > li:last-of-type > ul > li:first-of-type > ul > li:first-of-type')
      .waitForElementPresent('.trade-dialog')
  },
  after: after,
  'Rise': UpDownTests.rise,
  'Fall': UpDownTests.fall,
  'Higher': UpDownTests.higher,
  'Lower': UpDownTests.lower,
  'Touch': TouchNoTouchTests.touch,
  'Trade template': tradeTemplate
}
