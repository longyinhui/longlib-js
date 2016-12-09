(function (window, document, undefined) {
    var Dialog = function(content,option){
        if(option){
            this.mask = option.mask; if (this.mask == undefined) this.mask = true;
            this.outMask = option.outMask; if (this.outMask == undefined) this.outMask = true;
            if(option.buttons) this.buttons = option.buttons;
            if(option.head) this.head = option.head;
            this.title = option.title ? option.title : "";
            this.height = option.height;
            this.contentHeight = option.contentHeight;
            this.width = option.width?option.width:400;
            this.styles = option.styles;
            this.onHide = option.onHide;
            this.onShow = option.onShow;
            this.opacity = option.opacity ? option.opacity:1;
            this.maskOpacity = option.maskOpacity ? option.maskOpacity:0.5;
            if(option.scope){
                this.scope = option.scope;
                if (!option.sameScope) $("<link rel='stylesheet' type='text/css' href='" + window.getRootPath() + "/css/dialog.css' >").appendTo(option.scope);
                //this.mask = false;
            }
            else this.scope = $(document.body);
        }
        this.content = content;
        this.init();
    }

    Dialog.prototype = {
        //$mask:null,
        $:null,
        $head:null,
        $content:null,
        $buttons:[],

        mask: true,
        head: "",
        content:null,
        buttons:[],

        height: 0,
        contentHeight: 0,
        width: 0,
        maskOpacity: 0,
        opacity: 0,
        title: "",
        styles: null,
        onHide: null,
        onShow: null,
        scope:null,
        init:function(){
            var /*b=$(document.body), */dialog=this, outMain, main, mask, head, content, buttons;

            //mask
            if(this.mask){
                mask = $("<div class='dialog-mask'>&nbsp;</div>")
                    .appendTo(this.scope)
                    .click(function (e) {
                        if (Dialog.clickMaskToHide && e.target.className == 'dialog-mask show') {
                            dialog.hide();
                        }
                    });//.show();
                Dialog.$mask = mask;
            }

            //main
            outMain=$("<div class='dialog dialog-effect'></div>").width(this.width).appendTo(this.scope);
            main = $("<div class='dialog-frame'></div>").appendTo(outMain);
            if(this.styles) outMain.css(this.styles);
            if(this.height) main.height(this.height);
            this.$ = outMain;

            //head
            var head=$("<div style='text-align:center;'>{0}<span class='dialog-head-close'>×</span></div>".format(this.head?("<span class='dialog-head'>" + this.head + "</span>"):"<span class='dialog-nohead'>&nbsp;</span>")).appendTo(main).click(function(e){
                if(e.target.nodeName.toLowerCase() == "span" && e.target.className == "dialog-head-close"){
                    dialog.hide();
                }
            });
            this.$head = head;

            //content
            if(typeof (this.content) == "string")
                content = $("<div class='dialog-content'>" + this.content + "</div>");
            else if(typeof (this.content) == "object") content = this.content.addClass("dialog-content");
            if(content) {
                if(this.contentHeight) content.height(this.contentHeight);
                content.appendTo(main);
            }
            this.$content = content;

            //buttons
            if (this.buttons && this.buttons.length > 0) {
                buttons = $("<div class='dialog-buttons'></div>").appendTo(main);
                var button;
                for(var i=0;i<this.buttons.length;i++){
                    button = this.buttons[i];
                    button = $("<input type ='button' value='{0}'{1}{2}/>".format(button.value?button.value:"Button", button.cssClass?(" class='" + button.cssClass + "'"):"", button.style?(" style='" + button.style + "'"):""))
                        .click(button.onclick?button.onclick:undefined).appendTo(buttons);
                    this.$buttons[i] = button;
                }
            }

            //if(mask) mask.addClass("show");//mask.css({opacity: this.maskOpacity});
            //outMain.addClass("show");
        },
        /*
         close:function(){
         var speed = this.speed
         var dialog = this;
         if(this.$mask)
         this.$mask.fadeOut(speed,function(){
         $(this).remove();
         dialog.$mask = null;
         $(document.body).removeClass("dialog-mask-body");
         });
         if(this.$)
         this.$.fadeOut(speed,function(){
         $(this).remove();
         dialog.$ = null;
         });
         },*/

        show: function () {
            if (Dialog.$mask) Dialog.$mask.addClass("show");
            if (window.top && !window.nonPublic && this.outMask) {
                if (!Dialog.$outMask) {
                    var f = window.top.document.forms[0], h = 0;
                    if (f) h = f.clientHeight;
                    Dialog.$outMask = $("<div id='tempOutMask' style='position:fixed;opacity:0;width:100%;height:" +
                        h + "px;top:0px;left:0px;background-color:#888;opacity:0.5;transition: all 0.3s;'></div>"
                    )
                        .appendTo($(window.top.document.body));
                }
                Dialog.$outMask.css({ visibility: "visible", opacity: 0.5 });
            }

            if (this.$) this.$.addClass("show");
            if (this.onShow) this.onShow();
            Dialog.currentDialog = this;
        },

        hide:function(){
            if (Dialog.$mask) Dialog.$mask.removeClass("show");
            if (window.top) {
                if (Dialog.$outMask) {
                    Dialog.$outMask.css("opacity", 0);
                    setTimeout("Dialog.$outMask.css('visibility', 'hidden');", 300);
                }
            }

            if(this.$) this.$.removeClass("show");
            if(this.onHide) this.onHide();
            Dialog.currentDialog = null;
        },

        showLoad: function () {
            //Hide the Dialog before show "Loading"
            if (this.$) {
                this.$.removeClass("show");
                if (this.onHide) this.onHide();
                Dialog.currentDialog = null;
            }

            if (Dialog.$mask) Dialog.$mask.addClass("show");
            Dialog.clickMaskToHide = false;
            if (window.top) {
                if (Dialog.$outMask) {
                    Dialog.$outMask.css("opacity", 0);
                    setTimeout("Dialog.$outMask.css('visibility', 'hidden');", 300);
                }
            }

            if (Dialog.$load)
                Dialog.$load.css("display", "inline");
            else
                Dialog.$load = $("<div class='dialog-load'><img src='" + window.getRootPath() + "/Include/css/images/report_loader.gif' style='border:0px' /></div>").appendTo(this.scope);
        },

        hideLoad: function () {
            if (Dialog.$load) Dialog.$load.css("display", "none");
            if (Dialog.$mask) Dialog.$mask.removeClass("show");
            Dialog.clickMaskToHide = true;
            if (window.top) {
                if (Dialog.$outMask) {
                    Dialog.$outMask.css("opacity", 0);
                    setTimeout("Dialog.$outMask.css('visibility', 'hidden');", 300);
                }
            }
        },

        setContent: function(content){
            if(typeof (this.content) == "string")
                this.$content.html(content);
            else if(typeof (this.content) == "object")
                content.appendTo(this.$content);
        },

        setHead: function(head){
            var $head = this.$head.find(".dialog-head");
            if($head.length <= 0){
                $head = this.$head.find(".dialog-nohead");
                $head.removeClass("dialog-nohead").addClass("dialog-head");
            }
            $head.html(head);
        }
    }

    Dialog.dialogArguments;
    Dialog.returnValue;
    Dialog.currentDialog;
    Dialog.clickMaskToHide = true;

    window.Dialog = Dialog;
    //document.writeln('<link rel="Stylesheet" href="' + window.getRootPath() + '/Include/css/dialog.css" />');
    var cssLink = document.createElement("link"), head = document.head?document.head:document.getElementsByTagName("head")[0];
    cssLink.rel = "stylesheet";
    cssLink.type = "text/css";
    cssLink.href = window.getRootPath() + "/css/dialog.css";
    head.appendChild(cssLink);

})(window, document);