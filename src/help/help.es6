import $ from 'jquery';
import windows from 'windows/windows';
import rv from 'common/rivetsExtra';
import html from 'text!help/help.html';
import 'css!help/help.css';

"use strict";

var win = null;
const init = () => {
	var $html = $(html);
	win = windows.createBlankWindow($html, {
		title: "Help",
        width: 750,
        height: 400,
        resizable: true,
        minimizable: true,
        maximizable: true,
        modal: false,
        ignoreTileAction:true,
        close: () => {
          win.dialog('destroy');
          win.remove();
          win = null;
        },
        destroy: () => {
          win_view && win_view.unbind();
          win_view = null;
        }
	});

	var state = {
		view: '',
		view2: '',
	};
	var win_view = rv.bind($html[0], state);
    win.dialog('open');
};

export const init_help = (elem) => {
	elem.click(()=>{
		if(!win)
			init();
		else 
			win.moveToTop();
	});
};

export default {
	init_help
}