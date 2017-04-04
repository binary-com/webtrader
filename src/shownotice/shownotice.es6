import $ from 'jquery';
import windows from 'windows/windows';

let win = null;

export const init = () => {
    const msg = $("<div class='notice-msg'/>").append($("<span/>", {
        html: "To authenticate your account, kindly email the following to %1:"
            .i18n().replace("%1", "<a href=\"mailto:support@binary.com\">support@binary.com</a>")
    }).append($("<ul class=\"checked\">").append($("<li>", { html: "A scanned copy of your passport, driving licence (provisional or full) or identity card, showing your name and date of birth. Your document must be valid for at least 6 months after this date.".i18n() }),
        $("<li>", { html: "A scanned copy of a utility bill or bank statement (no more than 3 months old).".i18n() })))
    );
    if (win) {
        win.moveToTop();
        return;
    }

    win = windows.createBlankWindow($("<div/>").append(msg).i18n(), {
        title: "Notice Message".i18n(),
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
