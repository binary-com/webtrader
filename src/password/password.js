/*
	Created by Armin on 10/13/2015
*/

define(["jquery", "jquery-ui", "jquery-validation"], function ($, $ui, $validation) {
	"use strict";

	function closeDialog() {
		$(this).dialog("close");
		$(this).find("*").removeClass('ui-state-error');
	}

	function openDialog() {
		// reset the password form.
		$("#password-form")[0].reset();
		var validator = $("#password-form").validate();
		validator.resetForm();

		$("#passwordDialog").dialog({
				resizable: false,
				width: 310,
				my: 'center',
				at: 'center',
				of: window,
				closeOnEscape: true
			});
	}

	return {
		init: function($menuItem) {
			loadCSS("password/password.css");

			$.get("password/password.html", function($html) {
				$($html).css("display", "none").appendTo("body");

				// change password button click handler
				$("#btn-change-pwd").click(function(e) {
					// validate the password form.
					var isValid = $("#password-form").validate().form();
					if(!isValid) {
						$.growl.error({
							title: "Validation failed",
							message: "Please correct your errors and try again"
						});
						return false;
					}

					// if we reach here, the form is valid.
					$.growl.notice({ message: "The Password API hasn't been released yet." });

					e.preventDefault();
				});

				openDialog();
			});

			// password menu click handler
			$menuItem.click(function(e) {
				openDialog();
				e.preventDefault();
			});
		}
	};
});