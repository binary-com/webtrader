import { before, after } from '../default';
import { assetIndex } from './assetIndexTest';
import { tradingTimes } from './tradingTimesTest';
import { viewHistoricalData } from './viewHistoricalDataTest';

export default {
  before: before,
  after: after,
  'Assets Index': assetIndex,
  'Trading Times': tradingTimes,
  'View Historical Data': viewHistoricalData
}
