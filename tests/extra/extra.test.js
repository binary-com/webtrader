import { beforeLogin, after } from '../default';
import { help as helpTest } from './helpTest.js';
import { accountSwitch as accountSwitchTest } from './accountSwitchTest';
import { languageChange as languageChangeTest } from './languageChangeTest';

export default {
  before: beforeLogin,
  after: after,
  'Help': helpTest,
  'Switch account': accountSwitchTest,
  'Language change': languageChangeTest,
}
