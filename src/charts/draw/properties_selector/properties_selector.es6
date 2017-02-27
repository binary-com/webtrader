/**
 * Created by apoorv on 10/06/16
 */

import $ from "jquery";
import windows from "windows/windows";
import html from "text!./properties_selector.html";

let win = null;

export const open = (options, callback) => {
   const $html = $(html);
   const table = $html.find("table");
   options.inputValues.forEach(function(input) {
      let ele, inputElement;
      if (input.type === "colorpicker") {
         inputElement = $("<input type='button' value='" + input.default+"' class='csspopup_input_width'" +
            "id='" + input.id + "' style = 'width:100px;background:" + input.default+"; color:" + input.default+"' />");
         inputElement.colorpicker({
            showOn: 'click',
            position: {
               at: "right+100 bottom",
               of: "element",
               collision: "fit"
            },
            part: {
               map: { size: 128 },
               bar: { size: 128 }
            },
            select: function(event, color) {
               const c = "#" + color.formatted;
               $(inputElement).css({
                  background: c,
                  color: c
               }).val(c);
            },
            ok: function(event, color) {
               const c = "#" + color.formatted;
               $(inputElement).css({
                  background: c,
                  color: c
               }).val(c);
            }
         });
      } else {
         inputElement = $("<input type='" + input.type + "' value='" + input.default+"' class='csspopup_input_width' style = 'width:100px;'" +
            " id='" + input.id + "' name='" + input.name + "'/>");
      }
      if (input.min && input.max) {
         inputElement.attr("min", input.min);
         inputElement.attr("max", input.max);
      }
      ele = $("<tr><td><strong>" + input.name + "</strong></td><td></td></tr>");
      inputElement.appendTo(ele.find('td')[1]);
      $(ele).i18n().appendTo(table);
   });
   win = windows.createBlankWindow($html, {
      title: options.title,
      width: 240,
      height: 200,
      resizable: false,
      collapsable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      closeOnEscape: false,
      modal: true,
      ignoreTileAction: true,
      destroy: function() {
         win = null;
      },
      buttons: {
         Ok: function() {
            let css = {},
               error = false;
            $html.find('input').each(function(index, ele) {
               const id = $(ele).attr('id');
               let value = $(ele).val();
               if ($(ele).attr('type') === 'number') {
                  const max = parseInt($(ele).attr('max')),
                     min = parseInt($(ele).attr('min')),
                     name = $(ele).attr('name');
                  value = parseInt(value);
                  if (value > max || value < min) {
                     $.growl.error({
                        message: 'Please enter a value for "'.i18n() + name + '" between '.i18n() +
                           min + ' and '.i18n() + max + "."
                     });
                     error = true;
                  }
               }
               css[id] = value;
            });
            if (!error) {
               $(this).dialog('close');
               $(this).dialog("destroy");
               callback(css);
            }
         },
         Cancel: function() {
            $(this).dialog('close');
            $(this).dialog("destroy");
            return {};
         }
      }
   });
   win.dialog('open');
}

export default {
   open
}
