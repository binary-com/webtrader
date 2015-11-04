define(["jquery"], function ($) {
	"use strict";

	return {
		init: function () {
			$.get("gtm/gtm.html", function (html) {
				$("body").prepend(html);
			});
		}
	};
});