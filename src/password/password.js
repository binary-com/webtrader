/*
	Created by Armin on 10/13/2015
*/

define(["jquery", "jquery-ui"], function ($, $ui) {
	"use strict";

	function closeDialog() {
		$(this).dialog("close");
		$(this).find("*").removeClass('ui-state-error');
	}

	return {
		init: function($menuItem) {
			loadCSS("password/password.css");

			$.get("password/password.html", function($html) {
				$($html).css("display", "none").appendTo("body");

				// change password button click handler
				$("#btn-change-pwd").click(function(e) {
					alert("You've clicked the Change Password button");
					e.preventDefault();
				});
			});

			// password menu click handler
			$menuItem.click(function(e) {
				$("#passwordDialog").dialog({
						resizable: false,
						width: 310,
						my: 'center',
						at: 'center',
						of: window,
						closeOnEscape: true
					});

				e.preventDefault();
			});
		}
	};
});