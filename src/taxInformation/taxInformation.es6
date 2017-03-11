import 'css!taxInformation/taxInformation.css';
import rv from 'common/rivetsExtra';
import $ from 'jquery';
import windows from 'windows/windows';
import $html from 'text!./taxInformation.html';
import liveapi from 'websockets/binary_websockets';
import 'common/util';
import 'jquery-growl'
let win = null;
liveapi.events.on("login", (data) => {
    const is_mf = /MF/gi.test(local_storage.get('oauth')[0].id);
    if (is_mf)
        liveapi.send({ "get_account_status": 1 }).then((data) => {
            if (!/crs_tin_information/.test(data.get_account_status.status)) {
                if (win) {
                    win.moveToTop();
                    return;
                }
                Promise.all([liveapi.send({ "get_settings": 1 }), liveapi.send({ residence_list: 1 })]).then((data) => {
                    win = windows.createBlankWindow($($html).i18n(), {
                        title: "Tax Information".i18n(),
                        width: 700,
                        height: 'auto',
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
                            win.dialog('destroy');
                            win = null
                        }
                    });
                    const state = {
                        empty_fields: {
                            show: () => {
                                state.empty_fields.validate = true;
                                state.empty_fields.clear();
                            },
                            clear: _.debounce(function() {
                                state.empty_fields.validate = false;
                            }, 4000),
                            validate: false
                        },
                        place_of_birth: data[1].residence_list[0].value,
                        tax_residence: '',
                        tax_identification_number: null,
                        country_array: data[1].residence_list,
                        submit_disabled: false,
                        cancel: () => {
                            liveapi.invalidate();
                            win.dialog('close');
                        },
                        submit: () => {
                            if (!state.isValid()) {
                                state.empty_fields.show();
                                return;
                            }
                            state.submit_disabled = true;
                            const request = data[0].get_settings;

                            liveapi.send({
                                address_line_1: request.address_line_1,
                                address_city: request.address_city,
                                phone: request.phone,
                                place_of_birth: state.place_of_birth,
                                set_settings: 1,
                                tax_identification_number: state.tax_identification_number,
                                tax_residence: state.tax_residence.join(",")
                            }).then(() => {
                                $.growl.notice({ message: "Tax Information successfully updated".i18n() });
                                win.dialog("close");
                            }).catch((err) => {
                                console.log(err);
                                $.growl.error({ message: err.msg })
                            })
                        },
                        isValid: () => {
                            return state.place_of_birth && state.tax_residence && state.tax_identification_number &&
                                /^[\w-]{0,20}$/.test(state.tax_identification_number)
                        }
                    }
                    rv.bind(win, state);
                    win.dialog("open");
                });
            }
        }).catch((err) => {
            console.log(err);
            $.growl.error({ message: err.msg })
        });
});
