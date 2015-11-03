define(["jquery", "jquery-growl"], function ($) {
	"use strict";

	return {
		init: function () {
			$.get("gtm/gtm.html", function (html) {
				$("body").append(html);
			});
		}
	}
});