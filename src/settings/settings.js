define(['jquery', 'modernizr', 'common/util'], function ($) {

    return {

        init: function( $parentObj ) {

                var password = $('a.password');

                require(["charts/chartWindow"], function (chartWindow) {
                  password.click(function(){
                    chartWindow.addNewSmallWindow('Password');
                  });
                });
            return this;
        },

    };

});
