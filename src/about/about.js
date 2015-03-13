/**
 * Created by arnab on 2/21/15.
 */

define(['jquery'], function ($) {

    var aboutDialogObject = null;
    return {

        init : function() {
            if (!aboutDialogObject) {
                loadCSS('about/about.css');
                $.get('about/about.html', function ($html) {
                    aboutDialogObject = $($html).dialog({
                        autoOpen: false,
                        resizable: false,
                        width: 330,
                        height: 120,
                        title: 'About'
                    });
                    aboutDialogObject.dialog('open');
                });
            }
        },

        open : function() {
            if (!aboutDialogObject)
            {
                this.init();
            }
            else
            {
                aboutDialogObject.dialog('open');
            }
        }

    };

});
