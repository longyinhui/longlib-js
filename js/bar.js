(function (window, document, undefined) {
    var Bar = function(option){
        if(option){
            if(option.height) this.height = option.height;
            if(option.position) this.position = option.position;
            if(option.holdTime) this.timer = option.holdTime;
        }
        this._init();
        Bar._current = this;
    }

    Bar.prototype = {
        $:null,
        position: null,
        height: 40,
        holdTime: 3000,

        _timer: null,
        _hiding:false,

        _init:function(){
            var main = document.createElement("div"), b = this;
            main.className = "bar";
            main.style.minHeight = this.height + "px";
            main.style.top = (0-this.height) + "px";
            document.body.appendChild(main);
            this.$ = main;

            main.bind("mouseover", function(e){
                b._stopHide();
            });
            main.bind("mouseout", function(e){
                b._startHide();
            })
        },

        _startHide: function(){
            var b = this;
            if(!this._timer) this._timer = setTimeout("Bar._current.hide();", this.holdTime);
        },

        _stopHide: function(){
            if(this._timer){
                clearTimeout(this._timer);
                this._timer = undefined;
            }
        },

        hide:function(){
            this.$.className = "bar";
            this._timer = undefined;
        },

        show: function(){
            this.$.className = "bar-show bar";
            this._startHide();
        },

        toggle: function(){
            if(this.$.className == "bar-show bar") this.hide();
            else this.show();
        },

        setContent: function(content){
            if(!this.$ || !content) return;
            if(typeof(content) === "string")
                this.$.innerHTML = content;
            else this.$.appendChild(content);
            this.$.style.top = (0 -this.$.clientHeight) + "px";
        },

        setHead: function(head){
        }
    }

    Bar._current = {};

    window.Bar = Bar;
    //document.writeln('<link rel="Stylesheet" href="' + window.getRootPath() + '/Include/css/dialog.css" />');
    var cssLink = document.createElement("link"), head = document.head?document.head:document.getElementsByTagName("head")[0];
    cssLink.rel = "stylesheet";
    cssLink.type = "text/css";
    cssLink.href = window.getRootPath() + "/css/bar.css";
    head.appendChild(cssLink);

})(window, window.top?window.top.document:document);