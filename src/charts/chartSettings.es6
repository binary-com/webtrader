// TODO: move chartoptions here -- getChartOptions: () => chart_options,
const COMMON_LINE_STYLE = 'margin-left: 10px; border: 0; display: inline-block;';
const VERTICAL_LINE_STYLE = `${COMMON_LINE_STYLE} margin-bottom: -3px; height: 15px; width: 5px; border-left: 2px; border-color: #e98024;`;
const HORIZONTAL_LINE_STYLE = `${COMMON_LINE_STYLE} margin-bottom: 3px; height: 2; width: 20px; border-bottom: 2px; border-color: green;`;
const SPOT_STYLE = 'margin: 3px 5px 0 10px; display: inline-block; border-radius: 6px;';

const CHART_LABELS = {
    purchase_time: `<span style="${VERTICAL_LINE_STYLE} border-color: #7cb5ec; border-style: solid;"></span>${'Purchase Time'.i18n()}`,
    start_time: `<span style="${VERTICAL_LINE_STYLE} border-style: solid;"></span> ${'Start Time'.i18n()}`,
    barrier: `<span style="${HORIZONTAL_LINE_STYLE} border-style: solid;"></span> ${'Barrier'.i18n()}`,
    barrier_dotted: `<span style="${HORIZONTAL_LINE_STYLE} border-style: dotted;"></span> ${'Barrier'.i18n()}`,
    end_time: `<span style="${VERTICAL_LINE_STYLE} border-style: dashed;"></span> ${'End Time'.i18n()}`,
    entry_spot: `<span style="${SPOT_STYLE} border: 3px solid orange; width: 4px; height: 4px;"></span>${'Entry Spot'.i18n()}`,
    exit_spot: `<span style="${SPOT_STYLE} background-color: orange; width:10px; height: 10px;"></span>${'Exit Spot'.i18n()}`,
};

const getLabelEl = (labels) => {
    let label_el = '';
    for (const label of labels) {
        if (label && CHART_LABELS[label]) {
            label_el += CHART_LABELS[label];
        }
    }
    return `<div>${label_el}</div>`;
};

const getMarkerSettings = (fillColor = 'white') => {
    return { fillColor, lineColor: 'orange', lineWidth: 3, radius: 4, states: { hover: { fillColor, lineColor: 'orange', lineWidth: 3, radius: 4 }}};
};

const getChartLabels = ({ tick_count, date_start, purchase_time, is_sold_before_expiry, is_path_dependent }) => {
    let chart_labels = ['start_time', 'entry_spot', 'barrier_dotted', 'exit_spot', 'end_time'];
    const tick_chart_labels = ['start_time', 'barrier', 'end_time'];

    if (tick_count) return tick_chart_labels;
    if (is_sold_before_expiry && !is_path_dependent) chart_labels = chart_labels.filter((label) => label !== 'exit_spot');
    if (date_start > purchase_time) chart_labels.unshift('purchase_time');

    return chart_labels;
};

export { getLabelEl, getMarkerSettings, getChartLabels };