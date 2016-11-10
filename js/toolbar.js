(function (window, document, undefined) {

    var Toolbar = function (div, obj) {
        var objXml = obj;
        if (typeof(objXml) === "string"){
            objXml = $.parseXml(objXml);
        }
        this.init(div, objXml);
    };

    Toolbar.prototype = {
        _parentNode: null,
        id: null,
        dataSource: null,
        $:null,
        init: function(div, obj){
            this._parentNode = $("div[type='toolbar'][id='" + div + "']");
            this.dataSources = obj.find("MENULIST");
            this.dataSource = this.dataSources.find("MENU");
            this._load();
            this._initEvent();
        },
        _load: function(){
            var groups = this._generateGroup();
            this.$ = $("<div class='" + toolBarClass + "'><table><tbody><tr>" + groups + "</tr></tbody></table></div>").appendTo(this._parentNode);
        },
        _generateGroup: function(){
            var groups = [], groupHtml = "";
            for (var i = 0; i < this.dataSource.length; i++) {
                var group = this.dataSource[i].getAttribute("groupname");
                if ($.inArray(group, groups) >= 0)
                    continue;
                groups.push(group);
            }
            for (var i=0;i<groups.length;i++){
                if(groupHtml.length > 0 && toolBarSplit)
                    groupHtml += "<td class='" + toolBarSplit + "'></td>";
                groupHtml += ("<td id='" + groups[i] +"'><a>" + groups[i] + "</a></td>");
            }
            return groupHtml;
        },
        _initEvent: function(){
            var toolbar = this;

            this.$.click(function (e) {
                var a=null, td=null, ul=null, groupname = "", tag = e.target.nodeName.toLowerCase(), liHtml="",
                    outTd = false, outUl = true;
                if (tag == "a"){
                    a = $(e.target);
                    td = a.parent();
                    groupname = a.text();
                }
                else if(tag == "td"){
                    td = $(e.target);
                    a = td.find("a");
                    groupname = a.text();
                }
                if(groupname == "") return;

                var aoffset = a.offset(), awidth = a.width(), ulwidth, ulleft;
                ul = td.find("ul");

                if(ul.length > 0){//not first time click
                    ulwidth = ul.width(); ulleft = aoffset.left + awidth/2 - ulwidth/2;
                    ul.css({top:ulOffsetTop, left: ulleft}).fadeIn();
                    return;
                }

                //first time click
                for (var i = 0; i < toolbar.dataSource.length; i++)
                    if (toolbar.dataSource[i].getAttribute("groupname") == groupname){
                        var name = toolbar.dataSource[i].getAttribute("menuname"),
                            url = toolbar.dataSource[i].getAttribute("menuurl");
                        liHtml += "<li url='" + url + "'>" + name + "</li>"
                    }
                var ul = $("<ul>" + liHtml + "</ul>").hide().appendTo(td);
                ulwidth = ul.width(); ulleft = aoffset.left + awidth/2 - ulwidth/2;
                ul.offset({top:ulOffsetTop, left: ulleft}).fadeIn();

                ul.click(function(ule){
                    var liTag = ule.target.nodeName.toLowerCase(), url;
                    if(liTag != "li") return;
                    url = ule.target.getAttribute("url");
                    if(url){
                        redirect(url);
                        setTimeout(function(){ul.fadeOut()}, ulFadeTime);
                    }
                })
                td.mouseleave(function(e){
                    outTd = true;
                    setTimeout(function(){if(outTd && outUl) ul.fadeOut()}, ulFadeTime);
                }).mouseenter(function(){
                        outTd = false;
                    });
            });
        }
    };

    var toolBarClass = "topNav", toolBarSplit = "topNavSplit";
    var ulOffsetTop = 97, ulFadeTime = 450;
    var redirect = function(url){
        $("#mainFrame").attr("src", url);
    }

    window.Toolbar = Toolbar;
})(window, document);