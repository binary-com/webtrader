/* Created by Armin on 10/17/2015 */

define(["jquery", "jquery-growl", "slicknav"], function ($) {
	"use strict";

	return {
		init: function(_callback) {
			loadCSS("lib/slicknav/dist/slicknav.min.css");
			loadCSS("navigation/navigation.css");
			
			if($("#nav-menu").length == 0) {
				$.get("navigation/navigation.html", function ($html) {
					$("#nav-container").append($html);

					$("#nav-menu").slicknav({
						label: 'Binary.com',
						prependTo: '#nav-container',
						closeOnClick: true
					});

					if(_callback) {
						_callback();
					}
				});
			}
		}
	};
});