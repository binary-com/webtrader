/*
	Created by Armin on 10/13/2015
*/

define(["jquery", "jquery-validation", "websockets/binary_websockets"], function ($, jqVal, liveapi) {
	"use strict";

	function closeDialog() {
		$("#passwordDialog").dialog("close");
		$("#passwordDialog").find("*").removeClass('ui-state-error');
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

	function changePassword($elem) {
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
		var _oldPassword = $("#password-form #current-pwd").val();
		var _newPassword = $("#password-form #new-pwd").val();
		var requestData = {
			"change_password": "1",
			"old_password": _oldPassword,
			"new_password": _newPassword
		};

		var normal_text = $elem.text();
		var loading_text = "Working...";
		$elem.prop("disabled", true);
		$elem.text(loading_text);

		liveapi.authenticated.send(requestData)
			.then(function (d) {
				console.warn(d);
				
				$elem.prop("disabled", false);
				$elem.text(normal_text);

				var message = "Password changed successfully";
				$.growl.notice({ message: message });

				closeDialog();
			})
			.catch(function (e) {
				console.error(e);
				
				$elem.prop("disabled", false);
				$elem.text(normal_text);

				if(e.code == 'InputValidationFailed') {
					var title = "Input Validation Failed";
					var message = "Passwords should contain 5 to 25 alphanumeric characters";
					
					$.growl.warning({ title: title, message: message });
				} else {
					$.growl.error({ message: e.message });
				}
			});
	}

	return {
		init: function($menuItem) {
			loadCSS("password/password.css");

			$.get("password/password.html", function($html) {
				$($html).css("display", "none").appendTo("body");

				// change password button click handler
				$("#btn-change-pwd").click(function(e) {
					var $elem = $(this);
					changePassword($elem);
					e.preventDefault();
				});

				// password menu click handler
				$menuItem.click(function (e) {
					var requestData = { trading_times: '2015-5-5' };
					liveapi.authenticated.send(requestData)
						.then(function (d) {
							console.warn(d);
							openDialog();
						})
						.catch(function (e) {
							console.error(e)
							$.growl.error({ message: e.message });
						});

					e.preventDefault();
				});

				openDialog();
			});
		}
	};
});