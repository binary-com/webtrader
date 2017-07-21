/**
 * Created by Arnab Karmakar on 7/19/17.
 */
export default (browser) => {
    browser.execute("return moment.utc().format('YYYY-MM-DD HH:mm') + ' GMT'", [], (result) => {
        browser
            .assert.containsText('.time', result.value);
    });
};