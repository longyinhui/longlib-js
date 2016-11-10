(function (window, document, undefined) {

    var WebService = function () { }

    WebService._defaultErrorCallback = function(result, status, a){
        alert(status + ": " + result.responseText);
    }

    WebService._execute_xml = function(url, callback, data, type, async){
        if(!type) type = "POST";
        if(async == undefined || async == null) async = true;
        $.ajax({
            type: type,
            async: async,
            cache: false,
            url: url,
            data: data,
            dataType: document.browser == "msie" ? "text" : "xml",
            success: callback,
            error: WebService._defaultErrorCallback
        });
    }

    WebService._execute_html = function(url, callback, data, type, async){
        if(!type) type = "POST";
        if(async == undefined || async == null) async = true;
        $.ajax({
            type: type,
            async: async,
            cache: false,
            url: url,
            data: data,
            dataType: "html",
            success: callback,
            error: WebService._defaultErrorCallback
        });
    }

    WebService.execute = function (url, callback, data, type, async) {
        var _callback = function(resultXml){
            if(document.browser == "msie")
                callback(resultXml);
            else
                callback(Xml.toXml(resultXml));
        };
        WebService._execute_xml(url, _callback, data, type, async);
    }

    WebService.getString = function(url, data, type){
        var result = null;
        var callback = function(resultXml){
            if(document.browser == "msie"){
                result = Xml.parseXml(resultXml);
                /*if(result.documentElement && result.documentElement.firstChild)
                    result = result.documentElement.firstChild.xml;*/
                if(result) result = result.text;
            }
            else if(resultXml.innerHTML)
                result = resultXml.innerHTML;
            else if(resultXml.firstChild)
                result = resultXml.firstChild.innerHTML;
        };
        WebService._execute_xml(url, callback, data, type, false);
        return result;
    }

    WebService.getValue = function(url, data, type){
        var result = null;
        var callback = function(resultXml){
            if(document.browser == "msie"){
                result = Xml.parseXml(resultXml);
                if(result.documentElement && result.documentElement)
                    result = result.documentElement.xml;
            }
            else if(resultXml.outerHTML)
                result = resultXml.outerHTML;
            else if(resultXml.firstChild)
                result = resultXml.firstChild.outerHTML;
        };
        WebService._execute_xml(url, callback, data, type, false);
        return result;
    }

    WebService.getHtml = function(url, data, type){
        var result = null;
        var callback = function(resultXml){result = resultXml};
        WebService._execute_html(url, callback, data, type, false);
        return result;
    }

    window.WebService = WebService;


    /*var XmlHelper = function(){
    }

    XmlHelper.loadXml = function(strXml){
        var objXml;
        if(window.ActiveXObject){
            objXml = new ActiveXObject("MSXML2.DOMDocument");
            objXml.loadXML(strXml);
        }
        else  if(window.DOMParser){
            var parser = new DOMParser();
            objXml = parser.parseFromString(strXml, "text/xml");
        }
        else
            objXml = strXml;
        return objXml;
    };

    XmlHelper.toString = function(objXml){
        var strXml = "";
        if(objXml.outerHTML)
            strXml = objXml.outerHTML;
        else if(objXml.xml)
            strXml = objXml.xml;
        else if(objXml.documentElement && objXml.documentElement.outerHTML)
            strXml = objXml.documentElement.outerHTML;
        return strXml;
    }

    window.XmlHelper = XmlHelper;*/
})(window, document);