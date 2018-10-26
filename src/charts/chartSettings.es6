// TODO:
// getChartOptions: () => chart_options,
// getSubtitle    : () => txt_subtitle,
// setChartOptions,
// setLabels,
const COMMON_VERTICAL_LINE_STYLE = 'margin-bottom: -3px; margin-left: 10px; height: 15px; width: 5px; border: 0; border-left: 2px; display: inline-block;';
const COMMON_HORIZONTAL_LINE_STYLE = 'margin-bottom: 3px; margin-left: 10px; height: 2; width: 20px; border: 0; border-bottom: 2px; display: inline-block;';
const COMMON_SPOT_STYLE = 'margin-left: 10px; margin-right: 5px; display: inline-block; border-radius: 6px;';

// common chart labels
const getLabels = (is_viewtrade) => {
    // TODO: move border color to common style
    const labels = `
        <span style="${COMMON_VERTICAL_LINE_STYLE} border-color: #e98024; border-style: solid;"></span> ${'Start Time'.i18n()}
        <span style="${COMMON_HORIZONTAL_LINE_STYLE} border-color: green; border-style: solid;"></span> ${'Barrier'.i18n()}
        <span style="${COMMON_VERTICAL_LINE_STYLE} border-color: #e98024; border-style: dashed;"></span> ${'End Time'.i18n()}`;
    const spot_labels = `
        <span style="${COMMON_SPOT_STYLE} border: 3px solid orange; width: 4px; height: 4px;"></span>${'Entry Spot'.i18n()}&nbsp;
        <span style="${COMMON_SPOT_STYLE} background-color: orange; width:10px; height: 10px;"></span>${'Exit Spot'.i18n()}&nbsp;`;

    return is_viewtrade ? labels + spot_labels : labels;
};

const getMarkerSettings = (fillColor = 'white') => {
    return { fillColor, lineColor: 'orange', lineWidth: 3, radius: 4, states: { hover: { fillColor, lineColor: 'orange', lineWidth: 3, radius: 4 }}};
};

export { getLabels, getMarkerSettings };