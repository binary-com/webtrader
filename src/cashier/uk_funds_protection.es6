import windows from 'windows/windows';
import rv from 'common/rivetsExtra';
import liveapi from 'websockets/binary_websockets';
import html from 'text!cashier/uk_funds_protection.html';

export const init_win = () => new Promise((resolve, reject) => {
    const $html = $(html).i18n();
    const win = windows.createBlankWindow($html, {
    	title: "Funds Protection",
        dialogClass: "dialog-confirm",
        width: 700,
        height: 300,
        resizable: false,
        collapsable: false,
        minimizable: false,
        maximizable: false,
        modal: true,
        ignoreTileAction: true,
        close: function() {
            reject({ message: "Please accept funds protection." });
        }
    });
    const state = {};
    state.accept = () => {
        liveapi.send({
            "tnc_approval": 1,
            "ukgc_funds_protection": 1
        }).then(resolve,reject).then(()=>{
            win.dialog("close");
        });
    };

    state.cancel = () => {
    	win.dialog("close");
    	reject({ message: "Please accept funds protection." });
    }

    rv.bind($html[0], state);
    win.dialog('open');
});

export default {
    init_win
}
