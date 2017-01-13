define(["jquery","lodash","jquery-ui","color-picker","ddslick"],function(a,b){function c(){a(this).dialog("close"),a(this).find("*").removeClass("ui-state-error")}function d(d,f){require(["css!charts/indicators/sum/sum.css"]);var g=[];require(["text!charts/indicators/sum/sum.html","text!charts/indicators/indicators.json"],function(h,i){var j="#cd0a0a";h=a(h),h.appendTo("body"),i=JSON.parse(i);var k=i.sum;h.attr("title",k.long_display_name),h.find(".sum-description").html(k.description),h.find("input[type='button']").button(),h.find("#sum_stroke").colorpicker({showOn:"click",position:{at:"right+100 bottom",of:"element",collision:"fit"},part:{map:{size:128},bar:{size:128}},select:function(b,c){a("#sum_stroke").css({background:"#"+c.formatted}).val(""),j="#"+c.formatted},ok:function(b,c){a("#sum_stroke").css({background:"#"+c.formatted}).val(""),j="#"+c.formatted}});var l="Solid";a("#sum_dashStyle").ddslick({imagePosition:"left",width:148,background:"white",onSelected:function(b){a("#sum_dashStyle .dd-selected-image").css("max-height","5px").css("max-width","115px"),l=b.selectedData.value}}),a("#sum_dashStyle .dd-option-image").css("max-height","5px").css("max-width","115px");var m=h.find("#sum_levels").DataTable({paging:!1,scrollY:100,autoWidth:!0,searching:!1,info:!1,columnDefs:[{className:"dt-center",targets:[0,1,2,3]}],aoColumnDefs:[{bSortable:!1,aTargets:[1,3]}]});a.each(g,function(b,c){a(m.row.add([c.level,'<div style="background-color: '+c.stroke+';width:100%;height:20px;"></div>',c.strokeWidth,'<div style="width:50px;overflow:hidden;"><img src="images/dashstyle/'+c.dashStyle+'.svg" /></div>']).draw().node()).data("level",c).on("click",function(){a(this).toggleClass("selected")})}),h.find("#sum_level_delete").click(function(){m.rows(".selected").indexes().length<=0?require(["jquery","jquery-growl"],function(a){a.growl.error({message:"Select level(s) to delete!"})}):m.rows(".selected").remove().draw()}),h.find("#sum_level_add").click(function(){require(["indicator_levels"],function(b){b.open(d,function(b){a.each(b,function(b,c){a(m.row.add([c.level,'<div style="background-color: '+c.stroke+';width:100%;height:20px;"></div>',c.strokeWidth,'<div style="width:50px;overflow:hidden;"><img src="images/dashstyle/'+c.dashStyle+'.svg" /></div>']).draw().node()).data("level",c).on("click",function(){a(this).toggleClass("selected")})})})})});var n={autoOpen:!1,resizable:!1,width:350,height:400,modal:!0,my:"center",at:"center",of:window,dialogClass:"sum-ui-dialog",buttons:[{text:"OK",click:function(){var d=a(".sum_input_width_for_period");if(!b.isInteger(b.toNumber(d.val()))||!b.inRange(d.val(),parseInt(d.attr("min")),parseInt(d.attr("max"))+1))return require(["jquery","jquery-growl"],function(a){a.growl.error({message:"Only numbers between "+d.attr("min")+" to "+d.attr("max")+" is allowed for "+d.closest("tr").find("td:first").text()+"!"})}),void d.val(d.prop("defaultValue"));var f=[];a.each(m.rows().nodes(),function(){var b=a(this).data("level");b&&f.push({color:b.stroke,dashStyle:b.dashStyle,width:b.strokeWidth,value:b.level,label:{text:b.level}})});var g={period:parseInt(h.find(".sum_input_width_for_period").val()),stroke:j,strokeWidth:parseInt(h.find("#sum_strokeWidth").val()),dashStyle:l,appliedTo:parseInt(h.find("#sum_appliedTo").val()),levels:f};e&&e(),a(a(".sum").data("refererChartID")).highcharts().series[0].addIndicator("sum",g),c.call(h)}},{text:"Cancel",click:function(){c.call(this)}}],icons:{close:"custom-icon-close",minimize:"custom-icon-minimize",maximize:"custom-icon-maximize"}};h.dialog(n).dialogExtend(b.extend(n,{maximizable:!1,minimizable:!1,collapsable:!1})),h.find("select").each(function(b,c){a(c).selectmenu({width:150}).selectmenu("menuWidget").css("max-height","85px")}),"function"==typeof f&&f(d)})}var e=null;return{open:function(b,c){e=c||e;var f=function(){a(".sum").data("refererChartID",b).dialog("open")};0==a(".sum").length?d(b,this.open):f()}}});