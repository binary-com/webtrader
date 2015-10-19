/* Created by Armin on 10/17/2015 */

define(["jquery"], function ($) {
	"use strict";

	return {
		init: function(_callback) {
			loadCSS("navigation/navigation.css");

			$.get("navigation/navigation.html", function ($html) {
				$("body").prepend($html);

				if(_callback) {
					_callback($("#nav-menu"));
				}
			});
		}
	};
});