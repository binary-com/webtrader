// TODO: move chartoptions here -- getChartOptions: () => chart_options,
const COMMON_LINE_STYLE     = 'margin-left: 10px; border: 0; display: inline-block;';
const VERTICAL_LINE_STYLE   = `${COMMON_LINE_STYLE} margin-bottom: -3px; height: 15px; width: 5px; border-left: 2px; border-color: #e98024;`;
const HORIZONTAL_LINE_STYLE = `${COMMON_LINE_STYLE} margin-bottom: 3px; height: 2; width: 20px; border-bottom: 2px; border-color: green;`;
const SPOT_STYLE            = 'margin: 3px 5px 0 10px; display: inline-block; border-radius: 6px;';

const CHART_LABEL_ELS = {
    purchase_time   : `<span style="${VERTICAL_LINE_STYLE} border-color: #7cb5ec; border-style: solid;"></span>${'Purchase Time'.i18n()}`,
    start_time      : `<span style="${VERTICAL_LINE_STYLE} border-style: solid;"></span> ${'Start Time'.i18n()}`,
    barrier         : `<span style="${HORIZONTAL_LINE_STYLE} border-style: solid;"></span> ${'Barrier'.i18n()}`,
    barrier_dotted  : `<span style="${HORIZONTAL_LINE_STYLE} border-style: dotted;"></span> ${'Barrier'.i18n()}`,
    end_time        : `<span style="${VERTICAL_LINE_STYLE} border-style: dashed;"></span> ${'End Time'.i18n()}`,
    entry_spot      : `<span style="${SPOT_STYLE} border: 3px solid orange; width: 4px; height: 4px;"></span>${'Entry Spot'.i18n()}`,
    exit_spot       : `<span style="${SPOT_STYLE} background-color: orange; width:10px; height: 10px;"></span>${'Exit Spot'.i18n()}`,
    entry_spot_tick : `<span style="${VERTICAL_LINE_STYLE} border-style: solid;"></span> ${'Entry Spot'.i18n()}`,
    exit_spot_tick  : `<span style="${VERTICAL_LINE_STYLE} border-style: dashed;"></span> ${'Exit Spot'.i18n()}`,
};

const getLabelEl = (labels) => {
    let label_el = '';
    for (const label of labels) {
        if (label && CHART_LABEL_ELS[label]) {
            label_el += CHART_LABEL_ELS[label];
        }
    }
    return `<div>${label_el}</div>`;
};

const getMarkerSettings = (fillColor = 'white') => {
    return { enabled: true, fillColor, lineColor: 'orange', lineWidth: 3, radius: 4, states: { hover: { fillColor, lineColor: 'orange', lineWidth: 3, radius: 4 }}};
};

const getChartLabels = (proposal_open_contract) => {
    const { tick_count, date_start, purchase_time, is_sold_before_expiry, is_path_dependent, contract_type } = proposal_open_contract;
    let chart_labels = ['start_time', 'entry_spot', 'barrier_dotted', 'exit_spot', 'end_time'];

    if (tick_count) {
        let tick_labels = getTickLabels(contract_type);
        return tick_labels;
    }

    if (is_sold_before_expiry && !is_path_dependent) chart_labels = chart_labels.filter((label) => label !== 'exit_spot');
    if (date_start > purchase_time) chart_labels.unshift('purchase_time');

    return chart_labels;
};

const getTickLabels = (contract_type) => {
    let tick_chart_labels = ['entry_spot_tick', 'barrier', 'exit_spot_tick'];
    if (contract_type.includes('DIGIT')) tick_chart_labels = tick_chart_labels.filter((label) => label !== 'barrier');
    return tick_chart_labels;
}

export { getLabelEl, getMarkerSettings, getChartLabels };