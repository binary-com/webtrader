const trade_types = [{
    api_code: 'CALL',
    name: 'Rise',
    code: 'rise'
  }, {
    api_code: 'CALL',
    name: 'Higher',
    code: 'higher'
  },
  {
    api_code: 'PUT',
    name: 'Fall',
    code: 'fall'
  },
  {
    api_code: 'PUT',
    name: 'Lower',
    code: 'lower'
  },
  {
    api_code: 'ONETOUCH',
    name: 'Touch',
    code: 'touch'
  },
  {
    api_code: 'NOTOUCH',
    name: 'NoTouch',
    code: 'notouch'
  },
  {
    api_code: 'EXPIRYMISS',
    name: 'Ends Outside',
    code: 'endsoutside'
  },
  {
    api_code: 'EXPIRYRANGE',
    name: 'Ends Between',
    code: 'endsbetween'
  },
  {
    api_code: 'DIGITDIFF',
    name: 'Digits Differ',
    code: 'digitsdiffer'
  },
  {
    api_code: 'DIGITMATCH',
    name: 'Digits Match',
    code: 'digitsmatch'
  },
  {
    api_code: 'DIGITOVER',
    name: 'Digits Over',
    code: 'digitsover'
  },
  {
    api_code: 'DIGITUNDER',
    name: 'Digits Under',
    code: 'digitsunder'
  },
  {
    api_code: 'DIGITODD',
    name: 'Digits Odd',
    code: 'digitsodd'
  },
  {
    api_code: 'DIGITEVEN',
    name: 'Digits Even',
    code: 'digitseven'
  },
  {
    api_code: 'ASIANU',
    name: 'Asians Up',
    code: 'asiansup'
  },
  {
    api_code: 'ASIAND',
    name: 'Asians Down',
    code: 'asiansdown'
  },
  {
    api_code: 'RANGE',
    name: 'Stays Between',
    code: 'staysbetween'
  },
  {
    api_code: 'UPORDOWN',
    name: 'Goes Outside',
    code: 'goesoutside'
  }];

const financial_account_opening = {
  financial_information_select_data: {
    income_source_array: ['Salaried Employee', 'Self-Employed', 'Investments & Dividends', 'Pension', 'Other'],
    employment_status_array: ["Employed", "Pensioner", "Self-Employed", "Student", "Unemployed"],
    employment_industry_array: ['Construction', 'Education', 'Finance', 'Health', 'Tourism', 'Other'],
    occupation_array: ["Chief Executives, Senior Officials and Legislators", "Managers", "Professionals", "Clerks",
      "Personal Care, Sales and Service Workers", "Agricultural, Forestry and Fishery Workers",
      "Craft, Metal, Electrical and Electronics Workers", "Plant and Machine Operators and Assemblers",
      "Mining, Construction, Manufacturing and Transport Workers", "Armed Forces", "Government Officers",
      "Others"],
    source_of_wealth_array: ["Accumulation of Income/Savings", "Cash Business", "Company Ownership", "Divorce Settlement", "Inheritance", "Investment Income", "Sale of Property", "Other"],
    education_level_array: ['Primary', 'Secondary', 'Tertiary'],
    net_income_array: ['Less than $25,000', '$25,000 - $50,000', '$50,001 - $100,000', '$100,001 - $500,000', 'Over $500,000'],
    estimated_worth_array: ['Less than $100,000', '$100,000 - $250,000', '$250,001 - $500,000', '$500,001 - $1,000,000', 'Over $1,000,000'],
    account_turnover_array: ['Less than $25,000', '$25,000 - $50,000', '$50,001 - $100,000', '$100,001 - $500,000', 'Over $500,000'],
  },
  trading_experience_select_data: {
    experience_array: ['0-1 year', '1-2 years', 'Over 3 years'],
    frequency_array: ['0-5 transactions in the past 12 months', '6-10 transactions in the past 12 months', '40 transactions or more in the past 12 months'],
  },
};

export { trade_types, financial_account_opening };
