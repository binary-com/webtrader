/*
	Created by Armin on 10/13/2015
*/

define(["jquery", "jquery-validation", "websockets/binary_websockets"], function ($, jqVal, liveapi) {
	"use strict";

	// webtrader token:
	// COv9jIm99qS2AQ0

	function openDialog() {
		// reset the password form.
		// $("#password-form")[0].reset();
		// var validator = $("#password-form").validate();
		// validator.resetForm();

		$("#passwordDialog").dialog({
				resizable: false,
				width: 310,
				my: 'center',
				at: 'center',
				of: window,
				closeOnEscape: true
			});
	}

	function changePassword() {
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

		liveapi.authenticated.send(requestData)
			.then(function (d) {
				console.warn(d);
				$.growl.notice({ message: 'Password changed successfully' });
			})
			.catch(function (e) {
				console.error(e);
				$.growl.error({ message: e.message });
			});
	}

	return {
		init: function($menuItem) {
			loadCSS("password/password.css");

			$.get("password/password.html", function($html) {
				$($html).css("display", "none").appendTo("body");

				// change password button click handler
				$("#btn-change-pwd").click(function(e) {
					changePassword();
					e.preventDefault();
				});
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
		}
	};
});