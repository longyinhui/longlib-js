(function (window, document, undefined) {

    var Menu = function (div, source, ext) {
        if (ext) _variables = window.extend(_variables, ext);
        if (typeof(source) === "string"){
            source = JSON.parse(source);
        }
        this.init(div, source);
    };

    Menu.prototype = {
        _parentNode: null,
        id: null,
        type: "TM",
        dataSource: null,
        $:null,

        init: function(div, source){
            this._parentNode = document.getElementById(div);
            if (!this._parentNode) return;
            this._parentNode.className = _variables.menuDivClass;
            this.dataSource = source;
            this.load();

        },

        load: function(){
            if (this.type == "TM") {
                this._parentNode.innerHTML = this._generateTM_l1();
                this._parentNode.insertAdjacentHTML("afterend", "<div id='nav_substitute' style='display:none'></div>");
                this.$ = this._parentNode.getElementsByTagName("table")[0];
                this._initTMEvent();
            }
            else if (this.type == "DM"){
                ;
            }
            else;
        },

        //Triple-level Menu
        _generateTM_l1: function(){
            var l1, html = "<table class='" + _variables.menuTableClass + "'><tr>", i, menus = this.dataSource;
            for (i = 0; i < menus.length; i++) {
                l1 = menus[i];
                //html += "<td class='TdClass' id='id'><a>caption</a>[l2]</td>";
                html += "<td class='";
                html += _variables.menuL1TdClass;
                html += (l1.class ? (" " + l1.class) : "");
                html += "' id='";
                html += l1.name;
                html += "'><a>";
                html += l1.caption;
                html += "</a>";
                html += this._generateTM_l2(l1.submenu);
                html += "</td>";
            }
            html += "</tr></table>";
            //html += "<div class='" + _variables.menuBackUlDivClass + "'><div class='" + _variables.menuBackInnerClass + "'></div></div>"
            return html;
        },

        _generateTM_l2: function(menus) {
            var l2, html = "<div class='" + _variables.menuL1UlDivClass + "'>", i;
            for (i = 0; i < menus.length; i++) {
                l2 = menus[i];
                //html += "<ul class='UlClass'><li class='Li2Class'>caption</li>[l3]</ul>";
                html += "<ul class='";
                html += _variables.menuL1UlClass;
                html += "'><li class='";
                html += _variables.menuL2LiClass;
                html += "'>";
                html += l2.caption;
                html += "</li>";
                html += this._generateTM_l3(l2.submenu);
                html += "</ul>";
            }
            html += "</div><div class='" + _variables.menuBackUlDivClass + "'><div class='" + _variables.menuBackInnerClass + "'></div></div>";
            return html;
        },

        _generateTM_l3: function(menus){
            var l3, html = "", i;
            for (i = 0; i < menus.length; i++) {
                l3 = menus[i];
                //html += "<li class='Li3Class'>caption</li>";
                html += "<li><a class='";
                html += _variables.menuL3AClass;
                html += l3.url ? "' href='" + l3.url + "'" : "'";
                html += l3.onclick ? " onclick=\"" + l3.onclick + "\"" : "";
                html += ">";
                html += l3.caption;
                html += "</li>";
            }
            return html;
        },

        _initTMEvent: function(){
            var nav = this._parentNode, substitute = document.getElementById("nav_substitute"),
                last = 0, current = 0, critical = nav.offsetTop;
            Dom.bind(window, "scroll", function(){
                if (document.body.scrollHeight < _variables.totalHeight) return;
                current = document.body.scrollTop;
                if (current == last) return;
                else if (current > last){
                    if (last < critical && current >= critical) {
                        nav.className = "fixed nav";
                        substitute.style.display = "block";
                    }
                }
                else {//current < last
                    if (last > critical && current <= critical) {
                        nav.className = "nav";
                        substitute.style.display = "none";
                    }
                }
                last = current;
            });
        }
    };
    var _variables = {
        menuDivClass: "nav", menuDivFixedClass: "fixed", menuTableClass: "nav-table",
        menuL1TdClass: "nav-table-td1", menuL1UlDivClass: "nav-uls", menuL1UlClass: "nav-ul",
        menuL2LiClass: "nav-ul-li2", menuL3AClass: "nav-ul-li3-a",
        menuBackUlDivClass: "nav-ulsback", menuBackInnerClass: "nav-ulsback-in",
        alwaysVisible: true, totalHeight: 35+368
    };
    var menuRedirect = function(url){
        $("#mainFrame").attr("src", url);
    };

    window.Menu = Menu;
})(window, document);