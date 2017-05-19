import { before, after } from './default';
import { chartTemplateTest } from './chartTemplateTest';
import { chartFunctionTest } from './chartFunctionTest';


export default {
  before: before,
  after: after,
  'Chart functions': chartFunctionTest,
  'Chart template': chartTemplateTest,
}
