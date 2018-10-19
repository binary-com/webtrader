// TODO:
// getChartOptions: () => chart_options,
// getSubtitle    : () => txt_subtitle,
// setChartOptions,
// setLabels,
const COMMON_VERTICAL_LINE_STYLE = 'margin-bottom: -3px; margin-left: 10px; height: 15px; width: 5px; border: 0; border-left: 2px; display: inline-block;';
const COMMON_HORIZONTAL_LINE_STYLE = 'margin-bottom: 3px; margin-left: 10px; height: 2; width: 20px; border: 0; border-bottom: 2px; display: inline-block;';

// common chart labels
const get_chart_labels = () => {
    return `<span style="${COMMON_VERTICAL_LINE_STYLE} border-color: #e98024; border-style: solid;"></span> ${'Start Time'.i18n()}
            <span style="${COMMON_HORIZONTAL_LINE_STYLE} border-color: green; border-style: solid;"></span> ${'Barrier'.i18n()}
            <span style="${COMMON_VERTICAL_LINE_STYLE} border-color: #e98024; border-style: dashed;"></span> ${'End Time'.i18n()}`;
};

export { get_chart_labels };