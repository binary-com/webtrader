import rv from 'common/rivetsExtra';
import $ from 'jquery';
import windows from 'windows/windows';
import liveapi from 'websockets/binary_websockets';
import 'common/util';
import 'jquery-growl';

liveapi.events.on("login", () => { init("event").catch((err) => { console.error(err.msg) }) });
liveapi.events.on("buy", () => { init("event").catch((err) => { console.error(err.msg) }) });
let win = null;
//Triggered by is used to determine which fucntion invokes it.
export const init = (triggered_by) => {
    let account_status = '';
    return new Promise((resolve, reject) => {
        liveapi.send({ get_account_status: 1 }).then((data) => {
            const status = data.get_account_status.status;
            let msg = '';
            if ($.inArray("authenticated", status) !== -1) {
                if ($.inArray("unwelcome", status) !== -1) {
                    account_status = "withdrawal_allowed";
                    msg = $("<span/>", {
                        html: "Your account is currently suspended. Only withdrawals are now permitted. For further information, please contact %1."
                            .i18n().replace("%1", "<a href=\"mailto:support@binary.com\">support@binary.com</a>")
                    });
                } else if ($.inArray("cashier_locked", status) !== -1) {
                    account_status = "cashier_locked";
                    msg = $("<span/>", {
                        html: "Deposits and withdrawal for your account is not allowed at this moment. Please contact %1 to unlock it."
                            .i18n().replace("%1", "<a href=\"mailto:support@binary.com\">support@binary.com</a>")
                    });
                } else if ($.inArray("withdrawal_locked", status) !== -1) {
                    account_status = "withdrawal_locked";
                    msg = $("<span/>", {
                        html: "Withdrawal for your account is not allowed at this moment. Please contact %1 to unlock it."
                            .i18n().replace("%1", "<a href=\"mailto:support@binary.com\">support@binary.com</a>")
                    });
                }
            } else if ($.inArray("unwelcome", status) !== -1) {
                account_status = "locked"
                msg = $("<span/>", {
                    html: "To authenticate your account, kindly email the following to %1:"
                        .i18n().replace("%1", "<a href=\"mailto:support@binary.com\">support@binary.com</a>")
                });
                msg.append($("<ul class=\"checked\">").append($("<li>", { html: "A scanned copy of your passport, driving licence (provisional or full) or identity card, showing your name and date of birth. Your document must be valid for at least 6 months after this date.".i18n() }),
                    $("<li>", { html: "A scanned copy of a utility bill or bank statement (no more than 3 months old).".i18n() })));
            }
            if (msg) {
                if (win) {
                    win.moveToTop();
                    reject({ msg: "Problem with account" });
                    return;
                }
                msg = $("<div class='notice-msg' />").append(msg);
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
                    close: () => {
                        win.dialog('destroy');
                        win = null;
                    }
                });
                if (triggered_by === "event" && (account_status === "locked" || account_status === "withdrawal_allowed")) {
                    win.dialog("open");
                    reject({ message: "Problem with account" });
                }
                if (triggered_by === "withdrawal" && account_status !== "withdrawal_allowed") {
                    win.dialog("open");
                    reject({ message: "Withdrawal not allowed" });
                }
                if (triggered_by === "deposit" && (account_status === "locked" || account_status === "cashier_locked")) {
                    win.dialog("open");
                    reject({ message: "Deposit not allowed" });
                }
            } else {
                resolve();
            }
        });
    });
}

export default {
    init
}
