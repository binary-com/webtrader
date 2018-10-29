// TODO: move chartoptions here -- getChartOptions: () => chart_options,
const COMMON_LINE_STYLE = 'margin-left: 10px; border: 0; display: inline-block;'
const VERTICAL_LINE_STYLE = `${COMMON_LINE_STYLE} margin-bottom: -3px; height: 15px; width: 5px; border-left: 2px; border-color: #e98024;`;
const HORIZONTAL_LINE_STYLE = `${COMMON_LINE_STYLE} margin-bottom: 3px; height: 2; width: 20px; border-bottom: 2px; border-color: green;`;
const SPOT_STYLE = 'margin-left: 10px; margin-right: 5px; display: inline-block; border-radius: 6px;';

const CHART_LABELS = {
    start_time: `<span style="${VERTICAL_LINE_STYLE} border-style: solid;"></span> ${'Start Time'.i18n()}`,
    barrier: `<span style="${HORIZONTAL_LINE_STYLE} border-style: solid;"></span> ${'Barrier'.i18n()}`,
    end_time: `<span style="${VERTICAL_LINE_STYLE} border-style: dashed;"></span> ${'End Time'.i18n()}`,
    entry_spot: `<span style="${SPOT_STYLE} border: 3px solid orange; width: 4px; height: 4px;"></span>${'Entry Spot'.i18n()}&nbsp;`,
    exit_spot: `<span style="${SPOT_STYLE} background-color: orange; width:10px; height: 10px;"></span>${'Exit Spot'.i18n()}&nbsp;`,
};

const getLabels = (labels) => {
    let label_el = '';
    for (const label of labels) {
        if (label && CHART_LABELS[label]) {
            label_el += CHART_LABELS[label];
        }
    }
    return label_el;
};

const getMarkerSettings = (fillColor = 'white') => {
    return { fillColor, lineColor: 'orange', lineWidth: 3, radius: 4, states: { hover: { fillColor, lineColor: 'orange', lineWidth: 3, radius: 4 }}};
};

export { getLabels, getMarkerSettings };