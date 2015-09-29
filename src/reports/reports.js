define(['jquery', 'modernizr', 'common/util'], function ($) {

    return {

        init: function( $parentObj ) {

            $.get('reports/reports.html', function ( $html ) {
                $html = $($html);

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
            });
            return this;
        },

    };

});
