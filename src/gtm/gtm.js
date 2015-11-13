define(["jquery"], function ($) {
	"use strict";

	return {
		init: function () {
			require(['text!gtm/gtm.html'], function (html) {
				$("body").append(html);
			});
		}
	};
});