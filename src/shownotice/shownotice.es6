import $ from 'jquery';
import windows from 'windows/windows';

let win = null;

export const init = () => {
    const msg = $("<div class='notice-msg'/>").append($("<span/>", {
        html: "Authenticate your account now by verifying your identity and address. To proceed, simply send the following documents to %1:"
            .i18n().replace("%1", "<a href=\"mailto:support@binary.com\">support@binary.com</a>")
    }).append($("<ul class=\"checked\">").append($("<li>", { html: "Proof of identity – A scanned copy of your passport, driving license (either provisional or full), or identity card that shows your full name and date of birth.".i18n() }),
        $("<li>", { html: "Proof of address – A scanned copy of a utility bill or bank statement that’s not more than three months old. Your proof of address must contain your name, address, date of issue, and the name of the issuing organisation.".i18n() })))
    );
    if (win) {
        win.moveToTop();
        return;
    }

    win = windows.createBlankWindow($("<div/>").append(msg).i18n(), {
        title: "Account authentication".i18n(),
        dialogClass: "dialog-message",
        width: 700,
        height: 'auto',
        resizable: false,
        collapsable: false,
        minimizable: false,
        maximizable: false,
        closable: true,
        closeOnEscape: false,
        modal: true,
        ignoreTileAction: true,
        "data-authorized": "true",
        close: () => {
            win.dialog('destroy');
            win = null;
        }
    });
    win.dialog("open");
}

export default {
    init
}
