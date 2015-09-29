define(['jquery', 'modernizr', 'common/util'], function ($) {

    return {

        init: function( $parentObj ) {

            $.get('settings/settings.html', function ( $html ) {
                $html = $($html);
                password = $html.find('li.password');

                $parentObj.find('button').button("enable").button("refresh").button("widget").click(function(e) {
                  var menu = $(this).closest('div').find("ul").menu();
                  if (menu.is(":visible")) {
                    menu.hide();
                  } else {
                    menu.show();
                  }
                  e.preventDefault();
                  return false;
                }).focusout(function() {
                  $(this).closest('div').find('ul').menu().hide();
                }).append($html);

                require(["charts/chartWindow"], function (chartWindow) {
                  password.click(function(){
                    chartWindow.addNewSmallWindow('Password');
                  });
                });
            });
            return this;
        },

        profile: function() {

        },

        password: function() {

        }

    };

});
