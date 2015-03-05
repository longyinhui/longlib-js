//Jquery
$.fn.extend({
    textareaAutoHeight: function (options) {
        this._options = {
            minHeight: 0,
            maxHeight: 1000
        }

        this.init = function () {
            for (var p in options) {
                this._options[p] = options[p];
            }
            if (this._options.minHeight == 0) {
                this._options.minHeight=parseFloat($(this).height());
            }
            for (var p in this._options) {
                if ($(this).attr(p) == null) {
                    $(this).attr(p, this._options[p]);
                }
            }
            $(this).keyup(this.resetHeight).change(this.resetHeight)
                .focus(this.resetHeight);
        }
        this.resetHeight = function () {
            var _minHeight = parseFloat($(this).attr("minHeight"));
            var _maxHeight = parseFloat($(this).attr("maxHeight"));

            //if (!$.browser.msie) {}
            $(this).height(0);
            var h = parseFloat(this.scrollHeight);
            h = h < _minHeight ? _minHeight :
                h > _maxHeight ? _maxHeight : h;
            $(this).height(h).scrollTop(h);
            if (h >= _maxHeight) {
                $(this).css("overflow-y", "scroll");
            }
            else {
                $(this).css("overflow-y", "hidden");
            }
        }
        this.init();
    },

    appendXml: function(strXml) {
        this.each(function() {
            Xml.appendXml(this, strXml);
        });
    },

    /*insertXmlBefore: function(strXml){
        this.each(function(){
            insertXmlBefore(strXml, this);
        });
    },*/

    setXmlNode: function(){},

    setXmlNodeValue: function(nodeName, value){
        var node = this.children(nodeName);
        if(node.length <= 0)
            Xml.appendXml(this, ("<{0}>{1}</{0}>").format(nodeName, value));
        else
            Xml.setInnerXml(node[0], value);
    },

    xml: function(){
        if(!this[0]) return "";
        var objXml = this[0];
        return Xml.toXml(objXml);
    }
});

$.extend({
    isEmpty: function (objCheck) {
        if (typeof(objCheck) == "undefined") {
            return true;
        }
        if (objCheck == null) {
            return true;
        }
        if (objCheck == "") {
            return true;
        }
        if (objCheck == '') {
            return true;
        }
        if (!objCheck) {
            return true;
        }
        return false;
    },

    parseXml: function(strXml){
        var xmlDoc = Xml.parseXml(strXml);
        return $(xmlDoc);
    }
});

//window (global)
window.i18n = {};

window.getRootPath = function () {
    var strFullPath = window.document.location.href;
    var strPath = window.document.location.pathname;
    var pos = strFullPath.indexOf(strPath);
    var prePath = strFullPath.substring(0, pos);
    var postPath = strPath.substring(0, strPath.substr(1).indexOf('/') + 1);
    if (postPath.length > 0)
        if (["/css", "/js", "/report", "/security", "/service", "/system", "/resource"].indexOf(postPath.toLowerCase()) >= 0) postPath = "";
    return (prePath + postPath);
};

window.getBrowser = function () {//multi-browser support
    var ua = navigator.userAgent.toLowerCase(), b, v, s;
    (s = ua.match(/msie ([\d.]+)/)) ? b = "msie" :
        (s = ua.match(/firefox\/([\d.]+)/)) ? b = "firefox" :
            (s = ua.match(/chrome\/([\d.]+)/)) ? b = "chrome" :
                (s = ua.match(/opera.([\d.]+)/)) ? b = "opera" :
                    (s = ua.match(/version\/([\d.]+).*safari/)) ? b = "safari" :
                        (s = ua.match(/rv:([\d.]+)/)) ? b = "msie" : /*ie 11*/
                            0;
    v = s[1];
    document.browser = b;
    document.browserVersion = v;
};

window.loadStyleSheet = function () {
    if (window.nonPublic) return;
    var root = getRootPath();
    document.writeln('<link rel="Stylesheet" href="' + root + '/css/public.css" />');
    if (document.browser == "msie")
        document.writeln('<link rel="Stylesheet" href="' + root + '/css/' + (parseInt(document.browserVersion) < 9 ? 'public_sp_ieu8.css' : 'public_sp_ie.css') + '" />');
};

window.ready = function (fn) {
    if (document.addEventListener)
        document.addEventListener("DOMContentLoaded", fn);
    else
        document.attachEvent("onreadystatechange", function () {
            if (document.readyState === 'interactive')
                fn();
        });
};

window.alertCss = function (cssName, selector_str, attr_str, value_str) {
    if (!selector_str || !attr_str || !value_str) return;
    var type_str;

    if (document.getElementById) type_str = "cssRules";
    else if (document.all) type_str = "rules"; //IE
    else return;

    //lowercasing for webkit
    selector_str = selector_str.toLowerCase();

    for (var j = 0, rules; rules = document.styleSheets[j]; j++) {
        if (!rules.href) continue;
        if (rules.href.indexOf(cssName) >= 0) {
            for (var i = 0, rule; rule = rules[type_str][i]; i++) {
                if (rule.selectorText.toLowerCase() == selector_str) {
                    rule.style[attr_str] = value_str;
                    return;
                }
            }
            return;
        }
    }
};


//Xml
var Xml = {
    parseXml: function (strXml) {
        var objXml;
        if (window.ActiveXObject) {//IE 10-
            objXml = new ActiveXObject("MSXML2.DOMDocument");
            objXml.loadXML(strXml);
        }
        else if (window.DOMParser) {
            var parser = new DOMParser();
            objXml = parser.parseFromString(strXml, "text/xml");
        }
        else objXml = strXml;
        return objXml;
    },

    toXml: function (objXml) {
        var strXml = "";
        if (objXml.outerHTML)
            strXml = objXml.outerHTML;
        else if (objXml.documentElement && objXml.documentElement.outerHTML)
            strXml = objXml.documentElement.outerHTML;
        else if (objXml.xml)//IE 10-
            strXml = objXml.xml;
        else if (window.XMLSerializer)
            strXml = (new XMLSerializer()).serializeToString(objXml);
        return strXml;
    },

    getOuterXml: this.toXml,

    getInnerXml: function (objXml) {
        var strXml = "";
        if (objXml.innerHTML)
            strXml = objXml.innerHTML;
        else {
            strXml = Xml.getOuterXml(objXml);
            if (strXml.length <= 2) strXml = "";
            else strXml = strXml.substring(strXml.indexOf("<", 1), strXml.lastIndexOf(">", strXml.length - 2) + 1);
        }
        return strXml;
    },

    getInnerText: function (objXml) {
        var strXml = "";
        if (objXml.innerText)//Chrome(HTML); IE(HTML)
            strXml = objXml.innerText;
        else if (objXml.text)//IE(XML)
            strXml = objXml.text;
        else if (objXml.textContent)//Chrome(XML) and others
            strXml = objXml.textContent;
        return strXml;
    },

    setInnerXml: function (objXml, strXml) {
        if (objXml.innerHTML != undefined)
            objXml.innerHTML = strXml;
        else if (objXml.documentElement && objXml.documentElement.innerHTML != undefined)
            objXml.documentElement.innerHTML = strXml;
        else if (objXml.nodeName && objXml.firstChild && objXml.removeChild && objXml.appendChild) {
            var nodeName = objXml.nodeName
            //objXml.xml = "<" + nodeName + ">" + strXml + "</"+ nodeName + ">";
            var newNode = Xml.parseXml("<" + nodeName + ">" + strXml + "</" + nodeName + ">").firstChild;
            if (newNode) {
                var i, child, sibling;
                child = objXml.firstChild;
                while (child) {
                    sibling = child.nextSibling;
                    objXml.removeChild(child);
                    child = sibling;
                }
                child = newNode.firstChild;
                while (child) {
                    sibling = child.nextSibling;
                    objXml.appendChild(child);
                    child = sibling;
                }
            }
        }
    },

    setInnerText: function (objXml, text) {
        if (objXml.innerText != undefined)//Chrome(HTML); IE(HTML)
            objXml.innerText = text;
        else if (objXml.text != undefined)//IE(XML)
            objXml.text = text;
        else if (objXml.textContent != undefined)//Chrome(XML), Firefox and others
            objXml.textContent = text;
    },

    appendXml: function (objXml, strXml) {
        if (typeof strXml != "string") return;
        var n = Xml.parseXml(strXml);
        var t = n.firstChild.cloneNode(true);
        if (objXml.lastChild && objXml.lastChild.appendChild && objXml.nodeType == 9)//#document
            objXml.lastChild.appendChild(t);
        else if (objXml.appendChild) objXml.appendChild(t);
    },

    insertXmlBefore: function (strXml, refObjXml) {
        if (typeof strXml != "string") return;
        var n = Xml.parseXml(strXml);
        var t = n.firstChild.cloneNode(true);

        while (refObjXml.nodeType != 1)
            refObjXml = refObjXml.previousSibling;
        if (refObjXml && refObjXml.parentNode && refObjXml.parentNode.insertBefore)
            refObjXml.parentNode.insertBefore(t, refObjXml);
    },

    remove: function (objXml) {
        if (!objXml) return;
        if (objXml.remove) objXml.remove();
        else if (objXml.parentNode) objXml.parentNode.removeChild(objXml);
    }
};


//Dom
var Dom = {
    bind: function (element, event, callback) {
        if (window.addEventListener)
            element.addEventListener(event, callback);
        else if (window.attachEvent)
            element.attachEvent("on" + event, callback);
    },

    remove: function (element){
        if (!element) return;
        if (element.remove) element.remove();
        else if (element.parentNode) element.parentNode.removeChild(element);
    }
};


//String
String.prototype.format = function () {
    var args = arguments;
    return this.replace(/\{(\d+)\}/g,
        function (m, i) {
            return args[i];
        });
};


//Array
Array.prototype.sort2D = function (name, isAsc) {//sort for 2-D array
    var i, j, tempRow;
    if (this.length <= 0) return;

    var compare = function (a, b) {
        if (!a && !b) return false;
        if (!a) return !isAsc;
        if (!b) return isAsc;
        if (!isNaN(a) && !isNaN(b)) {
            a = parseFloat(a);
            b = parseFloat(b);
        }
        else {
            a = a.toLowerCase();
            b = b.toLowerCase();
        }
        return isAsc ? (a > b) : (a < b);
    }

    for (i = 1; i < this.length; i++) {
        j = i - 1;
        tempRow = this[i];
        while (j >= 0 && compare(this[j][name], tempRow[name])) {
            this[j + 1] = this[j];
            j--;
        }
        this[j + 1] = tempRow;
    }
};

Array.prototype.search2D = function (where) {//search for 2-D array
    if (this.length <= 0) return;
    var i, tempRow, rowIndexes = [];
    if (typeof (where) === "string")
        where = where.replace(/\[/g, "tempRow.").replace(/\]/g, "");
    else if (typeof (where) === "object") {
        var tempWhere = "", tempValue;
        for (i in where) {
            tempValue = where[i];
            if (typeof (tempValue) == "string")
                tempValue = "'" + tempValue + "'";
            tempWhere += "tempRow.{0}=={1}&&".format(i, tempValue);
        }
        if (tempWhere.length > 2)
            tempWhere = tempWhere.substr(0, tempWhere.length - 2);
        where = tempWhere;
    }
    else return;
    for (i = 0; i < this.length; i++) {
        tempRow = this[i];
        if (eval(where))
            rowIndexes.push(i);
    }
    return rowIndexes;
};

if(!Array.prototype.indexOf)
    Array.prototype.indexOf = function (item) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] === item)
                return i;
        }
        return -1;
    };


//Object
/*Object.prototype.extend = function(source, replace){
 if(typeof(replace) === "undefined") replace = true;
 for (var property in source) {
 if(typeof(this[property]) != "undefined" && !replace)
 continue;
 this[property] = source[property];
 }
 return this;
 }
Object.prototype.extend = function() {
    var out = this || {};
    for (var i = 0; i < arguments.length; i++) {
        if (!arguments[i]) continue;
        for (var key in arguments[i]) {
            if (arguments[i].hasOwnProperty(key))
                out[key] = arguments[i][key];
        }
    }
    return out;
};*/


//initial
getBrowser();
loadStyleSheet();

//initial - after load
ready(function () {
    //initialize styles
});
