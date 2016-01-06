/* Created by Armin on 10/17/2015 */

define(["jquery", "text!navigation/navigation.html", "css!navigation/navigation.css"], function ($, $navHtml) {
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

			$("#mobile-nav").animate({ left: "+=280" }, 320);
		} else if($menu.hasClass(mobile_class)) {
			// remove mobile navigation
			$("#mobile-nav").animate({ left: "-=280" }, 320, function () {
				$menu.removeClass(mobile_class).addClass(normal_class);
				$menu.unwrap();
			});
		}
	}

	function updateListItemHandlers() {
        $("#nav-menu li > ul li").each(function () {
            var $li = $(this);
            if ($li.hasClass('update-list-item-handlers'))
                return;
            $li.addClass('update-list-item-handlers');
            $li.on("click", function clickHandler() {
                var normal_class = "nav-normal-menu";
                var mobile_class = "nav-mobile-menu";
                var $elem = $(this);
                var $parentUL = $elem.parents("#nav-menu");
                var hasSubMenus = $elem.find("ul").length > 0;
                if ($parentUL.hasClass(normal_class)) {
                    if (!hasSubMenus) {
                        $elem.parent("ul").not("#nav-menu").toggleClass("nav-closed");
                    }
                } else if ($parentUL.hasClass(mobile_class)) {
                    if (!hasSubMenus) {
                        $("#mobile-nav").animate({ left: "-=280" }, 320, function () {
                            $("#nav-toggle").removeClass("nav-toggle-active");
                            toggleMenuStyle();
                        });
                    }
                }
            });
        });
		$("#nav-menu.nav-normal-menu li").each(function () {
			$(this).on("mouseover", function () {
				$(this).find("ul.nav-closed").each(function () {
					$(this).removeClass("nav-closed");
				});
			});
		});
	}

	function updateDropdownToggleHandlers() {
		$("#nav-menu a.nav-dropdown-toggle").each(function () {
			var $anchor = $(this);
			if ($anchor.hasClass('update-dropdown-toggle-handlers'))
			    return;
            $anchor.addClass('update-dropdown-toggle-handlers')
			$anchor.on('click', function (e) {
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
		updateListItemHandlers();
	}

  function initLoginButton(root){
      var login_btn = root.find('.authentication button');
      var loginid = root.find('.authentication span.loginid').hide();
      require(['websockets/binary_websockets'],function(liveapi) {
          liveapi.events.on('logout', function(){
              $('.webtrader-dialog[data-authorized=true]').dialog('close').dialog('destroy').remove(); /* destroy all authorized dialogs */
              login_btn.removeClass('logout').addClass('login')
                .removeAttr('disabled').text('Login');
              loginid.fadeOut();
          });
          liveapi.events.on('login', function(data){
              $('.webtrader-dialog[data-authorized=true]').dialog('close').dialog('destroy').remove(); /* destroy all authorized dialogs */
              login_btn.removeClass('login').addClass('logout')
                .removeAttr('disabled').text('Logout');
              loginid.text(data.authorize.loginid).fadeIn();
          });

          login_btn.on('click', function(){
            login_btn.attr('disabled','disabled');
            var logedin = login_btn.hasClass('logout');
            if(logedin) {
              liveapi.invalidate();
            }
            else {
              liveapi.cached.authorize().catch(function(err) {
                login_btn.removeAttr('disabled');
              });
            }
          });
      });
  }

	return {
		init: function(_callback) {
            var root = $($navHtml);
            $("body").prepend(root);
            initLoginButton(root);

            $("#nav-toggle").on("click", function (e) {
                $("#nav-toggle").toggleClass("nav-toggle-active");
                toggleMenuStyle();

                e.preventDefault();
            });

            updateDropdownToggleHandlers();

            if(_callback) {
                _callback($("#nav-menu"));
            }
		},
        updateDropdownToggles : updateDropdownToggleHandlers
	};
});
