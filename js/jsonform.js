(function ($) {
    $.fn.extend({
        displayer: function (flag) { //show() + hide()
            if (flag || flag == null) $(this).show(); //undefined will do show()
            else $(this).hide();

            return this;
        },
        classer: function (class_str, flag) { //addClass() + removeClass()
            if (flag || flag == null) $(this).addClass(class_str);  //undefined will do addClass()
            else $(this).removeClass(class_str);

            return this;
        }
    });
}(jQuery));

(function (window, document, undefined) {
    var JsonForm = function (div, readonly) {
        if (readonly) this.readonly = true;
        this.id = JsonForm.all.length;
        this.div = div;
        JsonForm.all[this.id] = this;
        var self = this, msgDiv;
        div.addClass("JsonForm");
        this.jsonFormDIV_JQ = $("<div></div>").appendTo(div);
        this.jsonFormDIV_JQ.click(function (e) {
            self.formClicked(e);
        }); //not delegate, want to capture all clicks

        this.messageDiv_JQ = msgDiv = $("<div class='messageDIV'></div>").appendTo(div);
        this.messageDiv_JQ.hide();
        this.messageClose_img_el = $("<a class='jf-ui-icon jf-ui-icon-close' style='margin-left:95%;'>Close</a>").click(function () {
            msgDiv.hide();
        }).appendTo(this.messageDiv_JQ)[0];
        this.messageDivContent_JQ = $("<div></div>").appendTo(this.messageDiv_JQ);
    }

    JsonForm.all = [];

    JsonForm.prototype = {
        id: null,
        div: null,
        readonly: false,
        json_obj: null,
        json_string: "",
        xml_flag: null,
        xml_doctype_str: "",
        xml_root_str: "",
        jsonFormDIV_JQ: null,
        jsonFormDataDIV_JQ: null,
        format_str_arr: ["JSON", "Formatted JSON", "XML"],

        //jsonToForm_end_hook:
        jsonToForm: function (json_string) {
            //this.jsonFormDIV_JQ.html("<span class='red'>Processing..</span>");
            this.json_obj = null;
            this.jsonFormDataDIV_JQ = null;
            this.xml_flag = false;
            this.xml_doctype_str = "";
            $("IMG.pasteIMG").hide()//this.alterCSS("IMG.pasteIMG", "display", "none");
            $("IMG.pasteChildnodesIMG").hide()//this.alterCSS("IMG.pasteChildnodesIMG", "display", "none");
            $("IMG.pasteAttributesIMG").hide()//this.alterCSS("IMG.pasteAttributesIMG", "display", "none");
            this.json_string = json_string;

            var msg_str = "", source_str = jQuery.trim(this.json_string);
            if (source_str) {
                if (source_str.indexOf("<") == 0) { //xml
                    this.json_obj = this.xmlToJs(source_str);

                } else { //json
                    source_str = source_str.replace(/\n/g, "");
                    try {
                        this.json_obj = eval("(" + source_str + ")")
                    } catch (e) {
                        msg_str = "JS " + e.name + ": " + e.message;
                        this.json_obj = null;
                    }
                }
                if (this.json_obj && typeof(this.json_obj) != "object") {
                    msg_str = this.json_obj;
                    this.json_obj = null;
                }
            }

            if (this.json_obj) {
                var flag = this.json_obj.length != undefined;
                var html_str = this.xml_flag ? "XML Root:<br><input id='xmlRootINPUT' value='" + this.xml_root_str + "'> " : "";
                /*html_str +=
                 "Form | <span onclick='JsonForm.all[" + this.id + "].expandCollapseAllFormItems(true); ' class='clickable'>Expand all nodes</span> | "
                 + "<span onclick='JsonForm.all[" + this.id + "].expandCollapseAllFormItems(false); ' class='clickable'>Collapse all nodes</span>";*/
                html_str += "<br/><div id='jsonFormDataDIV_" + this.id + "'>" + this.jsonToForm_step("", this.json_obj, flag) + "</div><br/>";

                /*disable the buttons
                 for (var L = this.format_str_arr.length, i = 0; i < L; i++) {
                 if (i < 2 || this.xml_flag) html_str += "<input type='button' class='buttonINPUT' onclick='JsonForm.all[" + this.id + "].formToJson(" + i + "); ' value='Convert Form to " + this.format_str_arr[i] + "'> ";
                 }
                 html_str += "<br/><textarea id='newJsonTEXTAREA' style='width:90%' rows='10'></textarea>";
                 html_str += "<br/><input id='evalButtonINPUT' type='button' class='buttonINPUT' onclick='JsonForm.all[" + this.id + "].evalNewJson(); ' value='Eval' style='display:none; '> ";
                 */
                this.jsonFormDIV_JQ.html(html_str);
                this.jsonFormDataDIV_JQ = this.jsonFormDIV_JQ.find("#jsonFormDataDIV_" + this.id);
                ;

            } else {
                this.jsonFormDIV_JQ.text("");
                alert("Source was invalid.\n\n" + msg_str);
            }
        },
        clipboard: {},
        activeLi_JQ: null,
        jsonToForm_step: function (a, b, c) {
            if (typeof(b) != "object") return "NOT AN OBJECT";
            var d = false;
            if (b) d = b.length != undefined;
            var e;
            if (c) e = "arrayIndex"
            else if (d) e = "arrayNameINPUT"
            else if (typeof(b) == "object") e = "objectNameINPUT"
            else e = "nameINPUT"

            var f = this.xml_flag ? this.get_readonly_flag(a) : false;
            var g = this.input_html(a, "leftINPUT " + e, true, f);
            g += "<ol" + (d ? " class='arrayOL'" : "") + ">" + this.addActions_html(a, d);
            for (var a in b) {
                if(!b.hasOwnProperty(a)) continue;
                if (typeof(b[a]) == "object" && b[a] != null) {
                    if (b[a].length == undefined) {
                        g += "<li>"
                    } else {
                        g += "<li class='arrayLI'>"
                    }
                    g += this.jsonToForm_step(a, b[a], d);
                } else {
                    g += "<li>";
                    var e;
                    if (d) {
                        e = "arrayIndex";
                    } else {
                        e = "nameINPUT";
                    }
                    var h = typeof(b[a]) == "string" ? "stringTEXTAREA" : "";
                    var f = this.xml_flag ? this.get_readonly_flag(a) : false;
                    var i = b[a];
                    if (typeof(i) === "undefined") i = "undefined";
                    else if (typeof(i) == "number" && !i) i = "0";
                    else if (i === null) i = "null";
                    else if (i === false) i = "false";
                    g += this.input_html(a, "leftINPUT " + e, false, f) + ":" + this.input_html(i, "rightTEXTAREA " + h);
                }
                g += "</li>\n";
            }
            return g + "</ol>\n";
        },
        input_html: function (a, b, c, d) {
            if (b.indexOf("arrayIndex") >= 0) {
                return this.leftActions_html(b, this.xml_flag ? false : c) + "<input type='hidden' class='leftINPUT'><span class='indexSPAN'>[" + a + "]</span>";
            } else {
                var e = b;
                if (d) e += " readonlyINPUT";
                var f = e ? (" class='" + e + "'") : "";
                if (!a && b.indexOf("objectNameINPUT") >= 0) {
                    return "<input type='hidden' " + f + ">";
                } else {
                    if (b.indexOf("leftINPUT") >= 0) {
                        if (d) f += " readonly";
                        return this.leftActions_html(b, c) + "<input value='" + a + "'" + f + "><span class='indexSPAN'></span>";
                    } else {
                        return this.textarea_html(a) + this.checkbox_html(b);
                    }
                }
            }
        },
        leftActions_html: function (a, b) {
            if (!a) a = "";
            var html_str = "";

            if (b) html_str += "<div class='leftFloat clickable jf-ui-icon jf-ui-icon-triangle-1-n' data-a='x' title='Expand/Collapse Node'>&nbsp;</div> ";
            else html_str += "<div class='leftFloat clickable jf-ui-icon jf-ui-icon-blank' title=''>&nbsp;</div> ";

            if (!this.readonly && (!this.xml_flag || a.indexOf("arrayIndex") >= 0)) {
                html_str += "<a class='rightFloat clickable jf-ui-icon jf-ui-icon-arrowthick-1-n' data-a='u' title='Move Node Up'>UP</a>"
                    + " <a class='rightFloat clickable jf-ui-icon jf-ui-icon-arrowthick-1-s' data-a='d' title='Move Node Down'>DOWN</a>"
                    + " <a class='rightFloat clickable jf-ui-icon jf-ui-icon-copy' data-a='c' title='Copy Node'>COPY</a>"
                    + " <a class='rightFloat clickable jf-ui-icon jf-ui-icon-trash' data-a='r' title='Delete Node (Safe)'>DELETE</a>";
            }
            return html_str;
        },
        textarea_html: function (str) {
            if (!str) str = "";
            return "<textarea class='rightTEXTAREA'>" + str + "</textarea>";
        },
        checkbox_html: function (a) {
            var b = "";
            if (!this.xml_flag) {
                b = "<label><input type='checkbox' class='checkbox'";
                if (a && a.indexOf("stringTEXTAREA") >= 0) b += " checked ";
                b += "><i>string</i></label>";
            }
            return b;
        },
        addActions_html: function (a, b) {
            var c = "";
            var d = "";
            if (!this.xml_flag) {
                var e = b ? "" : "";
                if (!this.readonly)
                    d = "<span class='atitle leftFloat clickable jf-ui-icon jf-ui-icon-plusthick' style='margin-left:20px'>ADD</span>"
                        + "<a class='leftFloat clickable' data-a='a' data-b='" + b + "' data-c='0'>" + e + "Value</a>"
                        + "<a class='leftFloat clickable' data-a='a' data-b='" + b + "' data-c='1'>" + e + "Object</a>"
                        + "<a class='leftFloat clickable' data-a='a' data-b='" + b + "' data-c='2'>" + e + "Array</a>";
            } else {
                if (a == "attributes" || a == "childNodes") {
                    d = "<div class='clickable'>&nbsp;</div> ";
                    if (a == "attributes") {
                        c = " pasteAttributesIMG";
                        d += "<span class='clickable' data-a='a' data-c='0'>Name:Value</span>";
                    } else {
                        c = " pasteChildnodesIMG";
                        d +=
                            "<span class='clickable' data-a='a' data-c='1'>Name:Object</span>"
                                + " | <span class='clickable' data-a='a' data-c='3'>TextNodeValue</span>"
                        ;
                    }
                }
            }
            if (d) d += "<span class='leftFloat'>|</span><a class='leftFloat clickable jf-ui-icon jf-ui-icon-clipboard' data-a='p' title='Paste'>PASTE</a>&nbsp;";
            return d;
        },

        xmlToJs: function (a) {
            var b;
            if (window.ActiveXObject) {
                b = new ActiveXObject("Microsoft.XMLDOM");
                b.async = "false";
                b.loadXML(a);
                if (b.parseError.errorCode) {
                    return "Microsoft.XMLDOM XML Parsing Error: " + b.parseError.reason + "Line Number " + b.parseError.line + ", " + "Column " + b.parseError.linepos + ":" + "\n\n" + b.parseError.srcText;
                }
            } else {
                b = (new DOMParser()).parseFromString(a, "text/xml");
            }
            var c = b.documentElement;
            if (c.tagName == "parserError" || c.namespaceURI == "http://www.mozilla.org/newlayout/xml/parsererror.xml") {
                return "DOMParser " + c.childNodes[0].nodeValue + "\n\n" + c.childNodes[1].childNodes[0].nodeValue;
            }
            this.xml_flag = true;
            this.xml_root_str = c.tagName;
            if (a.indexOf("<?xml ") == 0) {
                var L = a.indexOf("?>");
                if (L > 0) this.xml_doctype_str = a.substr(0, L + 2);
            }
            return this.xmlToJs_step(c);
        },
        xmlToJs_step: function (a) {
            var b = {};
            if (a.attributes) {
                b.attributes = [];
                if (a.attributes.length > 0) {
                    for (var i = 0, xmlChildObj; xmlChildObj = a.attributes[i]; i++) {
                        if (xmlChildObj = a.attributes[i]) {
                            if (xmlChildObj.nodeName != undefined) {
                                e = {};
                                e[xmlChildObj.nodeName] = xmlChildObj.value;
                                b.attributes.push(e);
                            }
                        }
                    }
                }
            }
            if (a.childNodes) {
                b.childNodes = [];
                if (a.childNodes.length > 0) {
                    for (var i = 0, xmlChildObj; xmlChildObj = a.childNodes[i]; i++) {
                        var c = xmlChildObj.nodeName;
                        if (c == "#text") {
                            var d = jQuery.trim(xmlChildObj.nodeValue);
                            if (d) {
                                e = {
                                    textNode: d
                                };
                                b.childNodes.push(e);
                            }
                        } else if (c != undefined) {
                            var e = {};
                            e[c] = this.xmlToJs_step(xmlChildObj);
                            b.childNodes.push(e);
                        }
                    }
                }
            }
            return b;
        },

        expandCollapseAllFormItems: function (flag) {
            $("IMG.expandCollapseIMG", this.jsonFormDataDIV_JQ).each(function (i, el) {
                this.expandCollapseFormItem($(el), flag);
            });
        },
        expandCollapseFormItem: function (img_JQ, flag) {
            var ol_JQ = img_JQ.siblings("OL");
            if (ol_JQ.length) {
                var el = img_JQ[0];
                if (flag == undefined) flag = el.className.indexOf("jf-ui-icon-triangle-1-n") < 0;
                ol_JQ.displayer(flag);
                el.className = (flag ? "leftFloat clickable jf-ui-icon jf-ui-icon-triangle-1-n" : "leftFloat clickable jf-ui-icon jf-ui-icon-triangle-1-s");
            }
        },
        /*
         expandCollapseTextarea: function (img_JQ) {
         var ta_JQ = img_JQ.siblings("TEXTAREA");
         if (ta_JQ.length) {
         var el = img_JQ[0];
         var flag = el.src.indexOf("collapse") < 0;
         ta_JQ.classer("expandedTEXTAREA", flag);
         el.className = (flag ? "clickable icon-deduct" : "clickable icon-add");
         }
         },*/
        deleteFormItem: function (img_JQ) {
            var li_JQ = this.activeLi_JQ;
            if (li_JQ && li_JQ.length) {
                if (li_JQ.hasClass("deleted")) {
                    this.globalRestoreLI_JQ = li_JQ;
                    var html_str =
                            "<input type='button' class='buttonINPUT' onclick='JsonForm.all[" + this.id + "].restoreFormItem(); ' value='Restore THIS Node'>"
                                + "<br/><input class='removeAllDeletedINPUT' type='button' onclick='JsonForm.all[" + this.id + "].allDeletedFormItems(); ' value='Remove ALL Marked Nodes'>"
                        ;
                    this.messageRight(img_JQ, html_str, 0);
                } else {
                    li_JQ.removeClass("activeLI")
                    li_JQ.addClass("deleted");
                }
            }
        },
        restoreFormItem: function () {
            this.globalRestoreLI_JQ.removeClass("deleted");
            this.messageClose();
        },
        allDeletedFormItems: function () {
            this.jsonFormDataDIV_JQ.find("LI.deleted").each(function (i, el) {
                el.parentNode.removeChild(el);
            });
            this.messageClose();
        },
        addFormItem: function (span_JQ) {
            var ol_JQ = span_JQ.closest("OL");
            if (ol_JQ.length) {
                var b = span_JQ.data("b");
                var c = span_JQ.data("c");

                var li_JQ = $("<LI>");
                var f = false;
                var g = true;
                var h;
                if (c == 0 || c == 3) {
                    g = false;
                    h = "nameINPUT";
                    if (c == 3) f = true;
                } else if (c == 1) {
                    h = "objectNameINPUT";
                } else {
                    h = "arrayNameINPUT";
                }
                if (b) h = "arrayIndex";
                var html_str = this.input_html((c == 3 ? "textNode" : "*"), "leftINPUT " + h, g, f) + ":";
                if (c == 0 || c == 3) {
                    html_str += this.textarea_html() + this.checkbox_html("stringTEXTAREA");
                } else {
                    if (c == 2) {
                        html_str += "<ol class='arrayOL'>" + this.addActions_html("", true) + "</ol>"
                    } else {
                        if (this.xml_flag) {
                            var xmlDefaultNodesStr =
                                    "<li>" + this.leftActions_html("", true) + "<input class='leftINPUT objectNameINPUT readonlyINPUT' readonly='' value='attributes'/>:"
                                        + " <ol class='arrayOL'>" + this.addActions_html("attributes") + " </ol>" + "</li>"
                                        + "<li>" + this.leftActions_html("", true) + "<input class='leftINPUT objectNameINPUT readonlyINPUT' readonly='' value='childNodes'/>:"
                                        + " <ol class='arrayOL'>" + this.addActions_html("childNodes") + " </ol></li>"
                                ;
                            html_str += "<ol>" + this.addActions_html() + xmlDefaultNodesStr + "</ol>";
                        } else {
                            html_str += "<ol>" + this.addActions_html("", false) + "</ol>";
                        }
                    }
                }
                if (this.xml_flag) html_str = this.leftActions_html("arrayIndex", false) + "<input type='hidden' class='leftINPUT'>[*]:<ol><li>" + html_str + "</li></ol>"

                if (c == 2) li_JQ.addClass("arrayLI");
                li_JQ.html(html_str);
                this.liNew(li_JQ, ol_JQ);
            }
        },
        moveFormItem: function (img_JQ, after_flag) {
            var li_JQ = this.activeLi_JQ;
            var JQ = after_flag ? li_JQ.next("LI") : li_JQ.prev("LI");
            if (!JQ.length) {
                var OL_JQ = li_JQ.closest("OL");
                JQ = after_flag ? OL_JQ.children("LI:first") : OL_JQ.children("LI:last");
                if (JQ[0] == li_JQ[0]) return; //--> only 1 item in list
                after_flag = !after_flag;
            }
            if (after_flag) li_JQ.insertAfter(JQ);
            else li_JQ.insertBefore(JQ);
        },
        copyFormItem: function (img_JQ) {
            var li_JQ = this.activeLi_JQ;
            if (li_JQ) {
                var ol_JQ = li_JQ.closest("OL");
                if (ol_JQ.length) {
                    this.clipboard.li_JQ = li_JQ.clone(); //copy to clipboard
                    this.clipboard.ol_class_str = ol_JQ.attr("class");
                    this.clipboard.li_JQ.removeClass("deleted");
                    var ar_flag = ol_JQ.attr("class") == "arrayOL";

                    var JQ;
                    if (!this.xml_flag) {
                        JQ = li_JQ;
                    } else {
                        JQ = li_JQ.children("OL:first");
                        if (JQ.length) JQ = JQ.children("LI:first"); //children or find????
                    }

                    var html_str = "";
                    if (JQ.length) {
                        var input_JQ = JQ.find("INPUT.leftINPUT:first");
                        if (input_JQ.length) {
                            if (input_JQ.attr("type") == "hidden") html_str += "#";
                            else html_str += '"' + input_JQ.val() + '"';
                            html_str += ":";

                            var ta_JQ = JQ.children("TEXTAREA:first");
                            if (ta_JQ.length) html_str += '"' + ta_JQ.val() + '"';
                            else html_str += JQ.hasClass("arrayLI") ? "[]" : "{}";
                        }
                    }
                    this.messageRight(img_JQ, "<b>" + (ar_flag ? "Array item" : "Object") + " copied:</b><br>" + html_str);
                    var str = "none";
                    if (!this.xml_flag) {
                        str = "pasteIMG";
                        $("IMG.pasteIMG").show();//this.alterCSS("IMG.pasteIMG", "display", "inline");

                    } else {
                        var p_li_JQ = ol_JQ.closest("LI");
                        if (p_li_JQ.length) {
                            var input_JQ = p_li_JQ.children("INPUT.leftINPUT:first");
                            if (input_JQ.length) {
                                var at_flag = input_JQ.val() == "attributes";
                                str = at_flag ? "pasteAttributesIMG" : "pasteChildnodesIMG";
                                var i_str = at_flag ? "pasteChildnodesIMG" : "pasteAttributesIMG";
                                $("IMG." + str).show();//this.alterCSS("IMG." + str, "display", "inline");
                                $("IMG." + i_str).hide();//this.alterCSS("IMG." + i_str, "display", "none");
                            }
                        }
                    }
                    this.jsonFormDataDIV_JQ.find("IMG." + str).each(function (i, el) {
                        el.title = "Paste: " + html_str.replace('"', "'", "g");
                    });
                }
            }
        },

        pasteFormItem: function (img_JQ) {
            if (this.clipboard.li_JQ) {
                var ol_JQ = img_JQ.closest("OL");
                if (ol_JQ.length) {
                    var li_JQ = this.clipboard.li_JQ.clone(); //copy from clipboard
                    this.liNew(li_JQ, ol_JQ);

                    if (ol_JQ.attr("class") != this.clipboard.ol_class_str) {
                        var input_JQ = li_JQ.find("INPUT.leftINPUT:first");
                        var span_JQ = li_JQ.find("SPAN.indexSPAN:first");
                        if (ol_JQ.attr("class") == "arrayOL") {
                            span_JQ.html("[*]");
                            input_JQ[0].type = "hidden"; //skip jQ for this

                        } else {
                            span_JQ.html("");
                            input_JQ[0].type = "text"; //skip jQ for this
                            if (!input_JQ.val()) input_JQ.val("*");
                        }
                    }
                    var html_str = img_JQ[0].title.replace("Paste: ", "<b>Pasted:</b><br>");
                    this.messageRight(img_JQ, html_str);
                }
            } else {
                this.messageRight(img_JQ, "</b>Nothing in clipboard.</b>");
            }
        },
        formClicked: function (evt) {
            var el = evt.target;
            var JQ = $(el);
            this.liActive(JQ.closest("LI"));

            if (JQ.hasClass("clickable")) {
                var a = JQ.data("a");
                var aa = this.liActions[JQ.data("a")];
                this.liActions[JQ.data("a")](JQ, this);
            }
        },
        liActions: {
            x: function (JQ, scope) {
                scope.expandCollapseFormItem(JQ);
            }, //expand/collapse
            u: function (JQ, scope) {
                scope.moveFormItem(JQ, 0);
            }, //up
            d: function (JQ, scope) {
                scope.moveFormItem(JQ, 1);
            }, //down
            c: function (JQ, scope) {
                scope.copyFormItem(JQ);
            }, //copy
            r: function (JQ, scope) {
                scope.deleteFormItem(JQ);
            }, //remove
            t: function (JQ, scope) {
                scope.expandCollapseTextarea(JQ);
            }, //textarea expand/collapsetitle
            p: function (JQ, scope) {
                scope.pasteFormItem(JQ);
            }, //paste
            a: function (JQ, scope) {
                scope.addFormItem(JQ);
            } //add
        },
        liNew: function (li_JQ, ol_JQ) {
            var first_li_JQ = ol_JQ.children("LI:first");
            if (first_li_JQ.length) li_JQ.insertBefore(first_li_JQ);
            else li_JQ.appendTo(ol_JQ);

            this.liActive(li_JQ);
        },
        liActive: function (JQ) {
            if (this.activeLi_JQ) this.activeLi_JQ.removeClass("activeLI");
            if (!JQ.length) return; //-->

            if (!JQ.hasClass("deleted"))
                JQ.addClass("activeLI");
            this.activeLi_JQ = JQ;
        },
        get_readonly_flag: function (a) {
            return (a == "attributes" || a == "childNodes" || a == "textNode");
        },
        format_num: 0,
        linebreak_str: "",
        error_ct: [],
        error1_msg: "",

        formToJson: function (format_num) {
            if (format_num == undefined)
                format_num = 0;
            this.error_ct = [0, 0];
            this.error1_msg = "";
            this.format_num = format_num;
            this.linebreak_str = format_num ? "\n" : "";
            var f_div_JQ = this.jsonFormDataDIV_JQ;
            //var ta_JQ = $("#newJsonTEXTAREA");
            //ta_JQ.val("Processing..");
            if (format_num == 2) this.xml_root_str = $("#xmlRootINPUT").val();
            var html_str = "";
            var flag = 0;
            if (format_num == 2) {
                flag = 1;
                if (this.xml_doctype_str) html_str += this.xml_doctype_str + this.linebreak_str;
                html_str += "<" + this.xml_root_str;
            }
            html_str += this.formToJson_step(f_div_JQ, flag, "");

            if (format_num == 2) html_str += "</" + this.xml_root_str + ">";
            //ta_JQ.val(html_str);
            //if(html_str) alert(html_str);
            //$("#evalButtonINPUT").displayer(format_num < 2);
            var msg_str = "";
            if (this.error_ct[0]) msg_str = this.get_plural_str(this.error_ct[0], 'name') + 'left empty, replaced by "undefined".\n';
            if (this.error_ct[1]) msg_str += this.get_plural_str(this.error_ct[1], 'nonstring value') + "left empty, replaced by 0 in " + this.error1_msg.substr(0, this.error1_msg.length - 2) + ".";
            if (msg_str) {
                msg_str = "\n\nWarning:\n" + msg_str;
                alert("Form convert to " + this.format_str_arr[format_num] + "." + msg_str);
            }
            return html_str;
        },

        formToJson_step: function (JQ, e, f, g) {
            var input_JQ = JQ.find("input"), self = this;
            if (input_JQ.length) {
                var j = "";
                var k = "";
                var str = processText(input_JQ[0].value);
                var m = false;
                if (input_JQ[0].type != "hidden") {
                    if (!str || str == "*") {
                        this.error_ct[0]++;
                        str = "undefined";
                        input_JQ[0].value = str;
                    }
                    if (this.format_num == 2) { //xml
                        m = (str == "attributes" || str == "childNodes");
                        k = "";
                        if (!m && str != "textNode") {
                            if (g == "attributes") j += " " + str + "=";
                            else j += pad_html("<" + str, e);
                        }
                    } else {
                        k = '"' + str + '":';
                    }
                }
                if (this.format_num < 2) j += pad_html(k, e);
                var ol_JQ = JQ.children("OL:first");
                if (ol_JQ.length) {
                    var ar_flag = ol_JQ.hasClass("arrayOL");
                    if (this.format_num < 2) j += (ar_flag ? "[" : "{") + this.linebreak_str;
                    var LIs_JQ = ol_JQ.children("LI");
                    if (LIs_JQ.length) {
                        var ct = 0, li_JQ;
                        LIs_JQ.each(function (i, el) {
                            li_JQ = $(el)
                            if (!li_JQ.hasClass("deleted")) {
                                ct++;
                                var r = "";
                                var s;
                                if (self.format_num == 2) { //xml
                                    r = str;
                                    s = e;
                                    if (r == "") r = g;
                                    else if (!m) s = e + 1;
                                } else {
                                    s = e + 1;
                                }
                                j += self.formToJson_step(li_JQ, s, ",", r); //recurse
                            }
                        });

                        if (this.format_num < 2 && ct) {
                            var L = j.lastIndexOf(",");
                            j = j.substring(0, L) + j.substring(L + 1);
                        }
                    }
                    if (this.format_num == 2) { //xml
                        if (str == "attributes") j += ">" + this.linebreak_str;
                        k = "";
                        if (str != "attributes" && str != "childNodes" && str != "textNode" && str != "") {
                            k = "</" + str + ">" + this.linebreak_str;
                        }
                    } else {
                        k = ar_flag ? "]" : "}";
                    }
                    if (k) j += pad_html(k, e);

                } else {
                    var t = JQ.find("INPUT:checked").length; //is name-value, has no nodes below
                    if (this.format_num == 2 && g != "attributes") t = 0;
                    var u = t ? '"' : "";
                    var ta_JQ = JQ.children("TEXTAREA:first");
                    if (ta_JQ.length) {
                        k = ta_JQ.val();
                        if (this.format_num < 2) k = processText(k);
                        else k = jQuery.trim(k);
                    }
                    if (!k && !t && this.format_num < 2) {
                        k = "0";
                        ta_JQ.val(k);
                        this.error_ct[1]++;
                        this.error1_msg += (l ? "'" + l + "'" : "[array item]") + ", ";
                    }
                    k = u + k + u;
                    if (this.format_num == 2 && g != "attributes") k = pad_html(k, e) + this.linebreak_str; //xml
                    j += k
                }
                if (this.format_num < 2) j = j + f + this.linebreak_str;
                return j;
            }
            function processText(a) {
                return jQuery.trim(a.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n"));
            }

            function pad_html(a, b) {
                if (!this.format_num) return a;
                var c = "";
                while (b > 0) {
                    c += "\t";
                    b--;
                }
                return c + a;
            }
        },
        evalNewJson: function () {
            var ta_JQ = $("#newJsonTEXTAREA");
            var str = jQuery.trim(ta_JQ.val());
            if (str) {
                var b = "Eval OK";
                try {
                    this.json_obj = eval("(" + str + ")");
                } catch (e) {
                    b = "Invalid.\n\nJS " + e.name + ": " + e.message;
                } finally {
                    alert(b);
                }
            }
        },
        alterCSS: function (selector_str, attr_str, value_str) { //is this really faster? dont remember testing - in theory it probably is faster //done mostly as goof
            if (!selector_str || !attr_str || !value_str) return;
            var type_str;

            if (document.getElementById) type_str = "cssRules";
            else if (document.all) type_str = "rules"; //IE
            else return;

            //lowercasing for webkit
            selector_str = selector_str.toLowerCase();

            var rules = document.styleSheets[0][type_str];
            for (var i = 0, rule; rule = rules[i]; i++) {
                if (rule.selectorText.toLowerCase() == selector_str) {
                    rule.style[attr_str] = value_str;
                    break;
                }
            }
        },

        //growl-ish messenger
        messageDiv_JQ: null,
        messageClose_img_el: null,
        messageDivContent_JQ: null,
        message_timer: null,
        messageRight: function (img_JQ, html_str, fade_sec) {
            clearTimeout(this.message_timer);
            this.messageDivContent_JQ.html(html_str);

            var pos = img_JQ.offset(), self = this;
            pos.left += img_JQ[0].offsetWidth;
            this.messageDiv_JQ[0].style.left = pos.left + "px";
            this.messageDiv_JQ[0].style.top = (pos.top - 2.5) + "px";
            this.messageDiv_JQ.show();
            if (fade_sec == undefined) fade_sec = 2;
            if (fade_sec > 0) this.message_timer = window.setTimeout(delayedClose, fade_sec * 1000);
            //this.messageDiv_JQ.classer("messageAutoCloseDIV", fade_sec > 0);
            //this.messageClose_img_el.src = "../image/jsonform/" + (fade_sec > 0 ? "countdown" : "popupClose") + ".gif";

            function delayedClose() {
                if (self.messageDiv_JQ.is(":visible")) self.messageDiv_JQ.fadeOut();
            }
        },
        messageClose: function () {
            clearTimeout(this.message_timer);
            this.messageDiv_JQ.hide();
        },

        get_readonly_flag: function (a, b) {
            return a + " " + b + (a != 1 ? "s" : "") + " ";
        },
        get_plural_str: function (a, b) {
            return a + " " + b + (a != 1 ? "s" : "") + " ";
        }
    };

    window.JsonForm = JsonForm;

    /*var _dataGridJsonForm;
    window.dataGridJsonForm = function(dataGridId, rowIndex, columnIndex){
        if(!_dataGridJsonForm){
            var div = $("<div></div>");
            _dataGridJsonForm = new JsonForm(div);
        }
        var json = DataGrid.all[dataGridId].dataSource[rowIndex][columnIndex], newJson, JF = _dataGridJsonForm;
        JF.jsonToForm(json);
        JF.dataGridId = dataGridId;
        JF.rowIndex = rowIndex;
        JF.columnIndex = columnIndex;

        var diaConfig = {
            head: "Json To Form",
            buttons:[{
                value: "Get Json",
                onclick: function(){
                    newJson = JF.formToJson();
                    var cell = DataGrid.all[JF.dataGridId].getDataGridCell(JF.rowIndex, JF.columnIndex);
                    if(cell) cell.setValue(newJson);
                    JF.dialog.hide();
                }
            },{
                value: "Cancel",
                onclick: function(){
                    JF.dialog.hide();
                }
            }]
        }

        if(!JF.dialog){
            JF.dialog = new Dialog(JF.div, diaConfig);
            JF.dialog.open();
        }
        else
            JF.dialog.show();
    };*/

    JsonForm._jsonFrom;

    JsonForm.open = function(json, diaConfig){
        if(!JsonForm._jsonFrom){
            var div = $("<div></div>");
            JsonForm._jsonFrom = new JsonForm(div);
        }
        var JF = JsonForm._jsonFrom;
        JF.jsonToForm(json);
        if(!diaConfig)
            diaConfig = {
                head: "Json To Form",
                buttons:[{
                    value: "Close",
                    onclick: function(){
                        JF.dialog.hide();
                    }
                }]
            };
        if(!JF.dialog){
            JF.dialog = new Dialog(JF.div, diaConfig);
            JF.dialog.open();
        }
        else
            JF.dialog.show();
    };

    //Json Form for DataGrid (need to include datagrid.js)
    JsonForm.openDataGridCell = function(dataGridId, rowIndex, columnIndex){
        var json = DataGrid.all[dataGridId].dataSource[rowIndex][columnIndex],JF = JsonForm._jsonFrom;

        var diaConfig = {
            head: "Json To Form",
            buttons:[{
                value: "Get Json",
                onclick: function(){
                    if(!JsonForm._jsonFrom) return;
                    var newJson = JsonForm._jsonFrom.formToJson();
                    var cell = DataGrid.all[dataGridId].getDataGridCell(rowIndex, columnIndex);
                    if(cell) cell.setValue(newJson);
                    JsonForm._jsonFrom.dialog.hide();
                }
            },{
                value: "Cancel",
                onclick: function(){
                    if(JsonForm._jsonFrom)
                        JsonForm._jsonFrom.dialog.hide();
                }
            }]
        }

        JsonForm.open(json, diaConfig);
    };

    /*function jsonDialog(str_json){
        var div = $("<div></div>");
        jf = new JsonForm(div);
        jf.jsonToForm(str_json);

        var diaConfig = {
            head: "Json To Form",
            buttons: [
                {
                    value: "Get Json",
                    onclick: function () {
                        trans = jf.formToJson();
                        var cell = DataGrid.all["DataGridDesignerDetail"].getCell(row, "controlproperties");
                        if (cell) cell.setValue(trans);
                        dl.close();
                    }
                },
                {
                    value: "Close",
                    onclick: function () {
                        dl.close();
                    }
                }
            ]
        }
        dl = new Dialog(div, diaConfig);
        dl.open();
    }*/
})(window, document);