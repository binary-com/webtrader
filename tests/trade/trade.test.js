/**
 * Tests for trade dialog
 */
import { beforeLogin, after } from '../default';
import * as UpDownTests from './upDownTradeTest';
import * as TouchNoTouchTests from './touchNoTouchTradeTest';
import * as InOutTests from './inOutTradeTest';
import * as DigitTests from './digitTradeTest';
import * as AsianTests from './asianTradeTest';
import * as tickerTest from './tickerTest';
import { tradeTemplate } from './tradeTemplateTest';

export default {
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
  'Sparkline': tickerTest.ticker,
  'Rise': UpDownTests.rise,
  'Fall': UpDownTests.fall,
  'Higher': UpDownTests.higher,
  'Lower': UpDownTests.lower,
  'Touch': TouchNoTouchTests.touch,
  'No touch': TouchNoTouchTests.noTouch,
  'Out': InOutTests.out,
  'In': InOutTests.in,
  'Matches': DigitTests.matches,
  'Differs': DigitTests.differs,
  'Over': DigitTests.over,
  'Under': DigitTests.under,
  'Even': DigitTests.even,
  'Odd': DigitTests.odd,
  'Asian up': AsianTests.up,
  'Asian down': AsianTests.down,
  'Trade template': tradeTemplate
}
