(function (window, undefined) {

    var generateControl = function (mode, type, value, modeid, design, index) {
        var element = "";
        switch (type) {
            case "checkbox":
            case "radio":
                element = ("<input type='{0}' name='{1}' value='{2}'{3}/>")
                    .format(type, modeid + "_" + design.name, index, value ? " checked='checked'" : "");
                break;
            case "button":
                if(mode == "datagrid"){
                    if (!design.buttons || design.buttons == "") break;
                    element = design.buttons.format(index);
                }
                else if(mode == "form"){
                    element = ("<input type='{0}' value='{1}' onclick='{2}'/>").format(type, value, design.onclick);
                }
                break;
            case "image":
                element = ("<input type='{0}' src='{1}' />").format(type, value);
                break;
            case "link":
                var text;
                design.alias ? text = design.alias : (value ? text = value : text = "&nbsp;");
                if (design.onclick)
                    element = ("<a onclick='{0}'>{1}</a>")
                        .format(design.onclick + "(" + index + ")", text);
                else
                    element = ("<a href='{0}'>{1}</a>")
                        .format(self.cellValue, text);
                break;
            case "map":
                var text;
                if (design.options && design.options.length > 0)
                    for (i = 0; i < design.options.length; i++)
                        if (value == design.options[i].value) {
                            text = design.options[i].text;
                            break;
                        }
                element = ("<span>{0}</span>").format(text ? text : "&nbsp;");
                break;
            case "select":
                if(mode == "datagrid"){
                    var text;
                    if (design.options && design.options.length > 0)
                        for (i = 0; i < design.options.length; i++)
                            if (value == design.options[i].value) {
                                text = design.options[i].text;
                                break;
                            }
                    element = ("<span>{0}</span>").format(text ? text : "&nbsp;");
                }
                else if(mode == "form"){
                    if (typeof(design.options) === "string" && design.options.indexOf("ENUM:") >= 0) {

                    }
                    else if (typeof(design.options) === "object") {
                        element = "<select>";
                        for (i = 0; i < design.options.length; i++)
                            element += ("<option value='{0}'>{1}</option>").format(design.options[i].value, design.options[i].text);
                        element += "</select>";
                    }
                }
            default :
                if(mode == "datagrid"){
                    element = ("<span>{0}</span>").format(value ? value : "&nbsp;");
                }
                else if(mode == "form"){
                    element = ("<input type='{0}'>{1}</input>").format(type ,value? value : "&nbsp;");
                }
                break;
        }
        return element;
    }

    window.generateControl = generateControl;
})(window);