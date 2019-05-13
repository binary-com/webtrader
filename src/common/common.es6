const trade_types = [{
    api_code: 'CALL',
    name: 'Rise/Higher'
  },
  {
    api_code: 'PUT',
    name: 'Fall/Lower'
  },
  {
    api_code: 'ONETOUCH',
    name: 'Touch'
  },
  {
    api_code: 'NOTOUCH',
    name: 'NoTouch'
  },
  {
    api_code: 'EXPIRYMISS',
    name: 'Ends Outside'
  },
  {
    api_code: 'EXPIRYRANGE',
    name: 'Ends Between'
  },
  {
    api_code: 'DIGITDIFF',
    name: 'Digits Differ'
  },
  {
    api_code: 'DIGITMATCH',
    name: 'Digits Match'
  },
  {
    api_code: 'DIGITOVER',
    name: 'Digits Over'
  },
  {
    api_code: 'DIGITUNDER',
    name: 'Digits Under'
  },
  {
    api_code: 'DIGITODD',
    name: 'Digits Odd'
  },
  {
    api_code: 'DIGITEVEN',
    name: 'Digits Even'
  },
  {
    api_code: 'ASIANU',
    name: 'Asians Up'
  },
  {
    api_code: 'ASIAND',
    name: 'Asians Down'
  },
  {
    api_code: 'RANGE',
    name: 'Stays Between'
  },
  {
    api_code: 'UPORDOWN',
    name: 'Goes Outside'
  }];

const SUPPORTED_CONTRACT_TYPES = Object.freeze([
  'up/down',
  'touch/no touch',
  'in/out',
  'digits',
  'asians',
  'rise/fall equal',
  'lookbacks'
]);

export { trade_types, SUPPORTED_CONTRACT_TYPES };
