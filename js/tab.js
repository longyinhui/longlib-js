(function (window, document, undefined) {
    /*
     * Tab control Core Library
     * Date: 2014-5-19
     */
    var Tab = function (id, div, defaultTab) {
        this.init(id, div, defaultTab);
    };

    Tab.all = {};

    Tab.prototype = {
        $: null,
        subTabs: [],
        navs: [],
        current: null,

        init: function (id, div, defaultsub) {
            var i, children, defaultNav;
            Tab.all[id] = this;
            this.id = id;
            this.$ = document.getElementById(div);
            this.$.className = tabClass;

            children = this.$.children ? this.$.children : this.$.childNodes;
            for (i = 0; i < children.length; i++)
                if (children[i].nodeName.toLowerCase() == "div") {
                    this.subTabs.push(children[i]);
                    children[i].style.display = "none";
                }

            this._generateNav();

            if (!defaultsub) defaultsub = 0;
            this.select(defaultsub)
        },

        _generateNav: function () {
            var i, id, caption, tab = this, nav;
            for (i = this.subTabs.length - 1; i >= 0; i--) {
                caption = this.subTabs[i].getAttribute("caption");
                id = this.subTabs[i].id;

                nav = document.createElement("input");
                this.$.insertBefore(nav, this.$.firstChild);
                nav.type = "button";
                nav.setAttribute("target", id);
                nav.value = caption ? caption : id;
                nav.onclick = function(){
                    var j, sub = document.getElementById(this.getAttribute("target"));
                    for (j = 0; j < tab.subTabs.length; j++)
                        tab.subTabs[j].style.display = "none";
                    if (sub) sub.style.display = "";

                    for (j = 0; j < tab.navs.length; j++)
                        tab.navs[j].className = "";
                    this.className = focusedNavClass;
                };
                this.navs.unshift(nav);
            }
        },

        select: function (id) {
            var i, nav, children = this.$.children ? this.$.children : this.$.childNodes;
            if (isNaN(id)) {
                for (i = 0; i < children.length; i++)
                    if (children[i].nodeName.toLowerCase() == "input" && children[i].getAttribute("target") == id) {
                        nav = children[i];
                        break;
                    }
            }
            else if (id >= 0 && id < this.navs.length)
                nav = this.navs[id];
            if (nav) {
                nav.click();
                this.current = nav.getAttribute("target");
            }
        },

        getSelected: function () {
            return this.current;
        }

    };

    var tabClass = "tab", focusedNavClass = "focusedNav";

    window.Tab = Tab;

    document.writeln('<link rel="Stylesheet" href="' + window.getRootPath() + '/css/tab.css" />');
})(window, document);