/**
 * Created by arnab on 2/21/15.
 */

define(['jquery'], function ($) {

    var aboutDialogObject = null;
    return {

        init : function() {
            if (!aboutDialogObject) {
                $.get('about/about.html', function ($html) {
                    aboutDialogObject = $($html);
                    $("body").append(aboutDialogObject);
                    aboutDialogObject.dialog({
                        autoOpen: false,
                        resizable: false,
                        width: 300,
                        height: 120,
                        my: 'center',
                        at: 'center',
                        of: window,
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
