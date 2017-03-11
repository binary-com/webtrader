import rv from 'common/rivetsExtra';
import $html from 'text!./financialassessment.html'
import $ from 'jquery';
import windows from 'windows/windows';
import _ from 'lodash';
import liveapi from 'websockets/binary_websockets';
import 'common/util';
import 'jquery-growl';
import 'css!./financialassessment.css'

let win = null,
    win_view = null;
liveapi.events.on('login', (data) => {
    const is_mf = /MF/gi.test(local_storage.get('oauth')[0].id);

    // We don't want financial assessment pop-up for mf-clients
    if (!is_mf) {
        liveapi.send({ get_account_status: 1 }).then((data) => {
            const risk = data.get_account_status.risk_classification;
            if (risk === 'high') {
                liveapi.send({ get_financial_assessment: 1 }).then((data) => {
                    if (Object.keys(data.get_financial_assessment).length === 0) {
                        init();
                    }
                });
            }
        });
    }
});

const init = () => {
    if (!win) {
        win = windows.createBlankWindow($($html).i18n(), {
            title: "Financial Assessment".i18n(),
            width: 700,
            height: 500,
            resizable: false,
            collapsable: false,
            minimizable: false,
            maximizable: false,
            closable: false,
            closeOnEscape: false,
            modal: true,
            ignoreTileAction: true,
            'data-authorized': 'true',
            close: () => {
                win_view.unbind();
                win_view = null;
                win.dialog('destroy');
                win = null
            }
        });
        const state = {
            financial: {
                experience_array: ['0-1 year', '1-2 years', 'Over 3 years'],
                frequency_array: ['0-5 transactions in the past 12 months', '6-10 transactions in the past 12 months', '40 transactions or more in the past 12 months'],

                forex_trading_experience: '',
                forex_trading_frequency: '',
                indices_trading_experience: '',
                indices_trading_frequency: '',
                commodities_trading_experience: '',
                commodities_trading_frequency: '',
                stocks_trading_experience: '',
                stocks_trading_frequency: '',
                other_derivatives_trading_experience: '',
                other_derivatives_trading_frequency: '',
                other_instruments_trading_experience: '',
                other_instruments_trading_frequency: '',

                employment_industry_array: ['Construction', 'Education', 'Finance', 'Health', 'Tourism', 'Other'],
                employment_industry: '',
                education_level_array: ['Primary', 'Secondary', 'Tertiary'],
                education_level: '',

                income_source_array: ['Salaried Employee', 'Self-Employed', 'Investments & Dividends', 'Pension', 'Other'],
                income_source: '',

                net_income_array: ['Less than $25,000', '$25,000 - $50,000', '$50,001 - $100,000', '$100,001 - $500,000', 'Over $500,000'],
                net_income: '',

                estimated_worth_array: ['Less than $100,000', '$100,000 - $250,000', '$250,001 - $500,000', '$500,001 - $1,000,000', 'Over $1,000,000'],
                estimated_worth: '',

                occupation_array: ["Chief Executives, Senior Officials and Legislators", "Managers", "Professionals", "Clerks",
                    "Personal Care, Sales and Service Workers", "Agricultural, Forestry and Fishery Workers",
                    "Craft, Metal, Electrical and Electronics Workers", "Plant and Machine Operators and Assemblers",
                    "Mining, Construction, Manufacturing and Transport Workers", "Armed Forces", "Government Officers",
                    "Others"
                ],
                occupation: '',
                disabled: false
            },
            empty_field: false,
            validate: () => {
                return state.financial.forex_trading_experience === '' || state.financial.forex_trading_frequency === '' ||
                    state.financial.indices_trading_experience === '' || state.financial.indices_trading_frequency === '' ||
                    state.financial.commodities_trading_experience === '' || state.financial.commodities_trading_frequency === '' ||
                    state.financial.stocks_trading_experience === '' || state.financial.stocks_trading_frequency === '' ||
                    state.financial.other_derivatives_trading_experience === '' ||
                    state.financial.other_derivatives_trading_frequency === '' ||
                    state.financial.other_instruments_trading_experience === '' ||
                    state.financial.other_instruments_trading_frequency === '' || state.financial.employment_industry === '' ||
                    state.financial.occupation === '' || state.financial.education_level === '' ||
                    state.financial.income_source === '' || state.financial.net_income === '' || state.financial.estimated_worth === '';
            },
        };
        state.submit = () => {
            state.empty_field = state.validate();
            if (state.empty_field) {
                return;
            }
            state.financial.disabled = true;
            const request = {
                set_financial_assessment: 1,
                forex_trading_experience: state.financial.forex_trading_experience,
                forex_trading_frequency: state.financial.forex_trading_frequency,
                indices_trading_experience: state.financial.indices_trading_experience,
                indices_trading_frequency: state.financial.indices_trading_frequency,
                commodities_trading_experience: state.financial.commodities_trading_experience,
                commodities_trading_frequency: state.financial.commodities_trading_frequency,
                stocks_trading_experience: state.financial.stocks_trading_experience,
                stocks_trading_frequency: state.financial.stocks_trading_frequency,
                other_derivatives_trading_experience: state.financial.other_derivatives_trading_experience,
                other_derivatives_trading_frequency: state.financial.other_derivatives_trading_frequency,
                other_instruments_trading_experience: state.financial.other_instruments_trading_experience,
                other_instruments_trading_frequency: state.financial.other_instruments_trading_frequency,
                employment_industry: state.financial.employment_industry,
                education_level: state.financial.education_level,
                income_source: state.financial.income_source,
                net_income: state.financial.net_income,
                estimated_worth: state.financial.estimated_worth,
                occupation: state.financial.occupation
            }
            liveapi.send(request).then((data) => {
                win_view.unbind();
                win_view = null;
                win.dialog("destroy");
                win = null
            }).catch((err) => {
                console.error(err);
            })
        }
        win_view = rv.bind(win, state);
        win.dialog("open");
    } else {
        win.moveToTop();
    }
}
