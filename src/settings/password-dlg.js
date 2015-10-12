define(['settings/password-dlg'], function ($) {
	return {
		init: function($parentObj) {
			$parentObj.click(function(e) {
				alert("Oh hi!");

				e.preventDefault();
			});
		}
	};
});