/* Created by Armin on 10/17/2015 */

define(["jquery"], function ($) {
	"use strict";

	$(window).resize(function () {
		// media query event handler
		if(matchMedia) {
			var mq = window.matchMedia("(max-width: 699px)");
			mq.addListener(widthChange);
			widthChange(mq);
		} else {
			// TODO: for IE < 11
			var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
		}
	});

	function widthChange(mq) {
		var $menu = $("#nav-menu");
		var $mobileNav = $("#mobile-nav");
		var $navToggle = $("#nav-toggle");
		var normal_class = "nav-normal-menu";
		var mobile_class = "nav-mobile-menu";

		if(mq.matches) {
			// width is less than 700px, toggle mobile menu
			if(!$mobileNav.is(":visible")) {
				$navToggle.removeClass("nav-toggle-active");
			}

			unbindMenusClickAndHoverHandlers();
			bindMobileMenuClickHandlers();
		} else {
			// width is at least 700px, toggle normal menu
			if($menu.hasClass(mobile_class)) {
				$menu.removeClass(mobile_class).addClass(normal_class);	
			}

			if($menu.parents("#mobile-nav").length) {
				$menu.unwrap();
			}

			$menu.find("li > ul").each(function () {
				$(this).removeAttr("style");
			});

			unbindMobileMenuClickHandlers();
			bindMenusClickAndHoverHandlers();
		}
	}

	function toggleMenuStyle() {
		var $menu = $("#nav-menu");
		var normal_class = "nav-normal-menu";
		var mobile_class = "nav-mobile-menu";

		if($menu.hasClass(normal_class)) {
			// add mobile navigation
			$menu.removeClass(normal_class).addClass(mobile_class);
			$menu.wrap("<div id='mobile-nav'></div>");
			
			unbindMenusClickAndHoverHandlers();
			bindMobileMenuClickHandlers();

			$("#mobile-nav").animate({ left: "+=280" }, 320);
		} else if($menu.hasClass(mobile_class)) {
			// remove mobile navigation
			$("#mobile-nav").animate({ left: "-=280" }, 320, function () {
				$menu.removeClass(mobile_class).addClass(normal_class);
				$menu.unwrap();

				unbindMobileMenuClickHandlers();
				bindMenusClickAndHoverHandlers();
			});
		}
	}

	function bindMobileMenuClickHandlers() {
		$("#nav-menu.nav-mobile-menu li > ul li").each(function () {
			$(this).unbind('click');
			$(this).click(function (e) {
				var hasSubMenus = $(this).find("ul").length > 0;
				if(!hasSubMenus) {
					$("#mobile-nav").animate({ left: "-=280" }, 320, function() {
						$("#nav-toggle").removeClass("nav-toggle-active");
						toggleMenuStyle();
					});
				}
			});
		});
	}

	function unbindMobileMenuClickHandlers() {
		$("#nav-menu.nav-mobile-menu li > ul li").each(function () {
			$(this).unbind('click');
		});
	}

	function bindMenusClickAndHoverHandlers() {
		$("#nav-menu.nav-normal-menu li > ul li").each(function() {
			$(this).unbind('click');
			$(this).click(function (e) {
				$(this).parent("ul").not("#nav-menu").toggleClass("nav-closed");
			});
		});

		$("#nav-menu.nav-normal-menu li").each(function () {
			$(this).unbind('mouseover');
			$(this).mouseover(function () {
				$(this).find("ul.nav-closed").each(function() {
					$(this).removeClass("nav-closed");
				});
			});
		});
	}

	function unbindMenusClickAndHoverHandlers() {
		// remove menus click handlers
		$("#nav-menu li > ul li").each(function () {
			$(this).unbind('click');
		});
		// remove menus mouseover handlers
		$("#nav-menu li").each(function() {
			$(this).unbind('mouseover');
		});
	}

	function updateNavClickHandlers() {
		$("#nav-menu a.nav-dropdown-toggle").each(function () {
			var $anchor = $(this);
			$anchor.unbind('click');
			$anchor.click(function (e) {
				var $listItem = $anchor.parent();
				var $parentUL = $listItem.parent();
				
				var isRoot = $parentUL.attr("id") === "nav-menu";
				var mobile_menu_class = "nav-mobile-menu";
				var expanded_class = "submenu-expanded";
				var isMobileMenu = $anchor.parents("#nav-menu").hasClass(mobile_menu_class);
				
				if(isMobileMenu) {
					var $submenu = $anchor.next("ul");
					if($submenu.length > 0) {
						// reset active classes
						if(isRoot) {
							$("#nav-menu.nav-mobile-menu li").each(function () {
								$(this).removeClass("active");
							});
						}
						
						if(isRoot) {
							// close all submenus
							$("#nav-menu li > ul").each(function () {
								$(this).slideUp();
							});	
						} else {
							$("#nav-menu li > ul").each(function () {
								var $elem = $(this);
								// close all submenus that are NOT open
								if(!$elem.hasClass(expanded_class)) {
									$elem.slideUp();
								}

								// close all submenus within current submenu
								$parentUL.find("li > ul").each(function() {
									if(!$(this).is($submenu)) {
										$(this).slideUp();
									}
								});
							});
						}

						if(isRoot) {
							$listItem.toggleClass("nav-toggle-active");
						}

						if($submenu.is(":visible")) {
							$submenu.slideUp();
							$submenu.removeClass(expanded_class);
						} else {
							$submenu.slideDown();
							$submenu.addClass(expanded_class);
						}
					}
				}

				e.preventDefault();
			});
		});

		bindMenusClickAndHoverHandlers();
	}

	return {
		init: function(_callback) {
			loadCSS("navigation/navigation.css");

			$.get("navigation/navigation.html", function ($html) {
				$("body").prepend($html);

				$("#nav-toggle").click(function (e) {
					$("#nav-toggle").toggleClass("nav-toggle-active");
					toggleMenuStyle();

					e.preventDefault();
				});

				updateNavClickHandlers();

				if(_callback) {
					_callback($("#nav-menu"));
				}
			});
		},
		updateToggleHandlers: function() {
			updateNavClickHandlers();
		}
	};
});