/*
DataGird Core Library v3.0
Json version
by Long Yinhui, 2015-01-20

Important Update Log
2014-12-18: improve loading speed by avoiding string.format function
2014-12-27: [beta]if(!concurMode): after sorting, creating, moving and exchanging rows, the position of <tr> (the rowIndex of a <table>) won't always match the rowIndex of the DataGrid object.
2015-01-20: remove multiple level css. also refer to datagrid.3.0.css
* */

(function (window, document, undefined) {
    //DataGrid
    var d1 = 0, d2, d3, d4 = 0, d5 = 0, d6, d7, d8, d9 = 0, d10 = 0, d11 = 0, d12 = 0;
    var DataGrid = function (id, div, design, source, ext, theme) {
        if (ext) _variables = window.extend(_variables, ext);
        if (theme)
            switch (theme) {
                case "simplified":
                    _variables = window.extend(_variables, _ext_variables_simplifiedCss);
                    break;
            }
        if (typeof (design) === "string")
            design = JSON.parse(design);
        if (typeof (source) === "string")
            source = JSON.parse(source);
        this.init(id, div, design, source);
    };

    DataGrid.all = {};

    DataGrid.lock = false;

    DataGrid.prototype = {
        _parentNode: null,
        _editable: false,
        enabled: true,
        id: null,
        lineNoColumn: null,
        width: null,
        height: null,
        onBeforeNewRow: null,
        onNewRow: null,
        onSelect: null,
        enableRowStatus: true,//disableRowStatus: null,
        enableSorting: true,//disableSorting: null,
        sortBy: null,
        sortOrder: null,
        pagingType: null,
        goToPage: null,
        pageSize: 0,
        pageNum: 0,
        pageDirection: "x",
        recordCount: 0,
        frozenHead: true,
        PKEditable: false,
        concurMode: true,

        columns: null,
        rows: null,
        buttons: null,

        allCells: {},
        $: null,
        $head: null,
        $foot: null,
        $top: null,
        $bottom: null,
        $paging: null,

        init: function (id, div, design, source) {
            DataGrid.all[id] = this;
            this.id = id;

            var attributes = design[_variables.defaultAttributes];
            this.width = attributes.width;
            this.height = attributes.height;
            this.onBeforeNewRow = attributes.onBeforeNewRow;
            this.onNewRow = attributes.onNewRow;
            this.onSelect = attributes.onSelect;
            this.pagingType = attributes.pagingType;
            this.pageSize = attributes.pageSize;
            this.pageDirection = attributes.pageDirection ? attributes.pageDirection : "x";
            this.goToPage = attributes.goToPage;
            this.enableSorting = (typeof (attributes.enableSorting) === "undefined") ? true : attributes.enableSorting;
            this.enableRowStatus = (typeof (attributes.enableRowStatus) === "undefined") ? true : attributes.enableRowStatus;

            this.buttons = design[_variables.defaultButtons];
            this.columns = design[_variables.defaultColumns];
            this.rows = source;//source[_variables.defaultRows];

            this._parentNode = document.getElementById(div);
            if (!this._parentNode) return;
            if (this.width) this._parentNode.style.width = this.width;
            this._parentNode.className = _variables.gridDivClass;

            this._initColumns();
            this._initHeight();
            this._load();
            this._initPaging();
            this._initEvents();
            //this._initHead();
            this._initGridButtons();
        },

        _initColumns: function () {   
            if (!this.columns || this.columns.length <= 0) return;
            var i, j, column, type;
            for (i = 0; i < this.columns.length; i++) {
                column = this.columns[i];
                type = column.type;
                if (typeof(column.enableSorting) === "undefined")
                    column.enableSorting = true;
                if (type == "lineno") {
                    this.lineNoColumn = column.name;
                    column.enableSorting = false;
                    continue;
                }
                switch (type) {//for specific type
                    case "button":
                    case "jsonform":
                        var buttonInputs = "", style, value, click;
                        if (column.buttons && typeof (column.buttons) != "string") {
                            style = "width:" + (90 / column.buttons.length) + "%";
                            for (j = 0; j < column.buttons.length; j++) {
                                if (type == "jsonform") {
                                    value = "...";
                                    click = window.JsonForm ? "JsonForm.dataGridJsonForm(\"" + this.id + "\",{0},\"" + column.name + "\")" : "alert(\'Can not find JsonForm function!\')";
                                }
                                else {
                                    value = column.buttons[j].caption ? column.buttons[j].caption : "Button";
                                    click = column.buttons[j].onclick ? column.buttons[j].onclick + "(#)" : "";
                                }
                                if (column.buttons[j].width)
                                    style = "width:" + column.buttons[j].width + "px";
                                buttonInputs += ("<input class='dg-button' type='button' value='" + value + "' onclick='" + click + "' style='" + style + "'/>");
                            }
                        }
                        else{
                            style = "width:90%";
                            value = column.caption ? column.caption : "Button";
                            click = column.onclick ? column.onclick + "(#)" : "";
                            buttonInputs += "<input class='dg-button' type='button' value='" + value + "' onclick='" + click + "' style='" + style + "'/>";
                        }
                        column.enableSorting = false;
                        column.buttons = buttonInputs;
                        break;
                    case "hidden":
                        column.type = "label";
                        column.hidden = 1;
                        break;
                    case "select":
                        var selectInput = "";
                        if (typeof(column.options) === "object") {
                            selectInput = "<select>";
                            for (j = 0; j < column.options.length; j++)
                                selectInput += ("<option value='" + column.options[j].value + "'>" + column.options[j].text + "</option>");
                            selectInput += "</select>";
                            column.select = selectInput;
                        }
                        break;
                    default:
                        break;
                }
                if (!this._editable) {
                    switch (type) {//for specific type["text", "date", "datetime-local", "time", "number", "email", "tel", "url", "select", "textarea", "checkbox", "radio", "button", "map", "label", "image", "lineno", "link", "progress", "detail"];
                        case "text":
                        case "date":
                        case "datetime-local":
                        case "time":
                        case "number":
                        case "email":
                        case "tel":
                        case "url":
                        case "select":
                        case "textarea":
                        case "checkbox":
                        case "radio":
                            this._editable = true;
                            break;
                        default:
                            break;
                    }
                }
                if (column.validate) this._initColumnValidation(i);
            }
        },

        _initHeight: function () {
            if (this.height == "auto") {
                //window.document.body.clientHeight;
                var height, top = this._parentNode.getBoundingClientRect().top + document.body.scrollTop;
                if (window.top.calcFrameHeight) height = window.top.calcFrameHeight();
                else height = window.offsetHeight; //$(window).height();
                this.height = height - top - _variables.autoBottomMargin;
            }
        },

        _initPaging: function () {
            if (!this.pageSize) return;
            this.pageSize = parseInt(this.pageSize);
            if (!this.pageSize || isNaN(this.pageSize)) return;
            if (this.goToPage) this.pagingType = "custom";
            if (!this.pagingType) this.pagingType = "online";
            if (this.pageDirection == "y") {
                /*var datagrid = this, div = this.$, table = this.$.children("table"), tableHeight = table.height(), divHeight = div.height(), currScrollTop,
                 isLoading = false, isEof = false;
                 div.scroll(function () {
                 if ((currScrollTop == div.scrollTop()) || isLoading || isEof) return;
                 currScrollTop = div.scrollTop();
                 var bottom = (tableHeight - divHeight <= currScrollTop);
                 if (bottom) {
                 var tr = datagrid.createContentRow($("<div>&nbsp;</div>").addClass(_variables.waitingDivClass));
                 isLoading = true;
                 var rowsCount = datagrid.rows.length;

                 var strParas = {
                 dataView: datagrid.dataView,
                 defaultColumn: datagrid.defaultColumn,
                 sortBy: datagrid.sortBy,
                 sortOrder: datagrid.sortOrder,
                 pageSize: datagrid.pageSize,
                 pageNum: datagrid.pageNum++,
                 recordCount: datagrid.recordCount,
                 disableSorting: datagrid.disableSorting,
                 columns: datagrid.columns,
                 callMethod: "GetDataSource"
                 };
                 service.serviceStackPost("datagrid", strParas, function (datasource) {
                 tr.remove();
                 for (var i = 0; i < datasource.length; i++) {
                 datagrid.rows[rowsCount + i] = datasource[i];
                 }
                 var html = datagrid._generateRows(rowsCount, datagrid.rows.length - rowsCount);
                 $(html).appendTo(table);
                 isLoading = false;
                 isEof = (datagrid.pageSize * datagrid.pageNum >= datagrid.recordCount);
                 tableHeight = table.height();
                 });
                 }
                 })*/
            }
            else {
                this.$paging = document.createElement("div");
                this.$paging.className = _variables.bottomDivClass;
                if (this.pagingType == "online" || this.pagingType == "custom") {
                    this.pageNum = parseInt(this.rows.pageno);
                    this.pageCount = parseInt(this.rows.totalpages);
                    this.recordCount = parseInt(this.rows.totalrows);
                    if (isNaN(this.pageNum)) this.pageNum = 0;
                    if (isNaN(this.pageCount)) this.pageCount = 0;
                    if (isNaN(this.recordCount)) this.recordCount = 0;
                }
                else {//offline
                    this.pageNum = 1;
                    this.pageCount = Math.ceil(this.rows.length / this.pageSize);
                    this.recordCount = this.rows.length;
                }

                var datagrid = this;
                function _goToPage(newPageNo) {
                    newPageNo = parseInt(newPageNo);
                    if (isNaN(newPageNo) || newPageNo < 1 || newPageNo > datagrid.pageCount) return;
                    if (datagrid.pagingType != "offline"){//online & custom
                        var form = document.forms[0];
                        if (!form["pageno"]) { alert("pageno field is not defined in form."); return; }
                        form["pageno"].value = newPageNo;
                    }
                    if (datagrid.pagingType == "online")
                        form.submit();
                    if(datagrid.pagingType == "custom")
                        if(datagrid.goToPage) eval(datagrid.goToPage + "(" + newPageNo + ")");
                    if(datagrid.pagingType != "online") {//custom & offline
                        datagrid.pageNum = newPageNo;
                        var links = document.getElementById(datagrid.id + "_paginglinks");
                        links.innerHTML = _generatePagingLinks(datagrid.pageCount, _variables.adjPageLinkCount, newPageNo);
                        links.bind("click", function(e){
                            var link = e.srcElement ? e.srcElement : e.target;
                            _goToPage(link.textContent);
                        });
                        document.getElementById(datagrid.id + "_paginginput").value = newPageNo;
                    }
                    if(datagrid.pagingType == "offline")
                        datagrid._reload();
                };
                function _generatePagingLinks(t, a, p) {
                    var r = [], html = "", ha, i;
                    ha = Math.floor(a / 2);
                    if (t <= a + 1) for (i = 1; i <= t; i++) r.push(i);
                    else if (p <= (ha + 1)) for (i = 1; i <= a; i++) r.push(i);
                    else if (p <= t - ha) for (i = p - ha; i <= p + ha; i++) r.push(i);
                    else for (i = t - a + 1; i <= t; i++) r.push(i);
                    if (r.length == 0) return;
                    for (i = 0; i < r.length; i++) {
                        if (r[i] == p) html += "<span>" + r[i] + "</span> ";
                        else html += "<a>" + r[i] + "</a> ";
                    }
                    if (r[0] > 2) html = "... " + html;
                    if (r[0] > 1) html = "<a>1</a> " + html;
                    if (r[r.length - 1] < t - 1) html += "... ";
                    if (r[r.length - 1] < t) html += "<a>" + t + "</a> ";
                    return html;
                };

                var t = this.pageCount, a = _variables.adjPageLinkCount, p = this.pageNum, html;
                if (isNaN(t) || isNaN(a) || isNaN(p)) return;
                html = "<span id='" + datagrid.id + "_paginglinks" + "'>" + _generatePagingLinks(t, a, p) + "</span>";
                html = "<span id='" + datagrid.id + "_pagingprev" + "' class='" + _variables.prevPageClass + "'>&nbsp;</span> " + html;
                html += "<span id='" + datagrid.id + "_pagingnext" + "' class='" + _variables.nextPageClass + "'>&nbsp;</span> ";
                //if(t>a+2)
                html += "<input id='" + datagrid.id + "_paginginput" + "' type='text' value=" + p + "> / " + t + " ";
                html = "<div class='" + _variables.pagingClass + "' unselectable='none' onselectstart='return false;'>" + html + "</div>";
                this.$paging.innerHTML = html;
                this._parentNode.appendChild(this.$paging);

                document.getElementById(datagrid.id + "_paginglinks").bind("click", function(e){
                    var target = e.srcElement ? e.srcElement : e.target;
                    _goToPage(target.textContent);
                });
                document.getElementById(this.id + "_paginginput").bind("keydown", function(e){
                    var newPageNo, keyCode = e.keyCode ? e.keyCode : e.which;
                    if (keyCode == 13) {
                        newPageNo = parseInt(this.value);
                        if (isNaN(newPageNo) || newPageNo < 1 || newPageNo > this.pageCount) { this.value = ""; return; }
                        _goToPage(newPageNo);
                    }
                });
                document.getElementById(datagrid.id + "_pagingprev").onclick = function(){
                    _goToPage(datagrid.pageNum - 1);
                };
                document.getElementById(datagrid.id + "_pagingnext").onclick = function(){
                    _goToPage(datagrid.pageNum + 1);
                };
            }
        },

        _initEvents: function () {
            var datagrid = this, tables, td, cell;

            //on click cells
            //if(this._editable)
            this.$.bind("click", function (e) {
                if (!datagrid.enabled) return;
                if (DataGrid.lock) {
                    if(DataGrid.lock.focus) DataGrid.lock.focus();
                    return;
                }
                var target = e.srcElement ? e.srcElement : e.target, nodeName = target.nodeName.toLowerCase();
                if (nodeName == "span")
                    td = target.parentNode;
                else if (nodeName == "input" && (target.type.toLowerCase() == "radio" || target.type.toLowerCase() == "checkbox"))
                    td = target.parentNode;
                else if (nodeName == "td")
                    td = target;
                else return;
                cell = datagrid.allCells[td.id];
                cell._onClick();

                //onSelect
                if (datagrid.onSelect && cell)
                    eval(datagrid.onSelect + "(" + cell.parentRow.rowIndex + ")");
            });

            //on click head
            this.$head.bind("click", function (e) {
                if (!datagrid.enabled) return;
                if (DataGrid.lock) {
                    if(DataGrid.lock.focus) DataGrid.lock.focus();
                    return;
                }
                var target = e.srcElement ? e.srcElement : e.target, nodeName = target.nodeName.toLowerCase(), i;
                if (nodeName == "th") {
                    var th = target, thSiblings = th.parentNode.childNodes, isAsc = e.offsetY < (th.clientHeight / 2);
                    if (!th.className || th.className == "dg-th") return;
                    cell = datagrid.allCells[th.getAttribute("name")];
                    if (!cell) return;
                    datagrid.sort(datagrid.columns[cell.columnIndex].name, isAsc);
                    for (i = 0; i < thSiblings.length; i++)
                        if (thSiblings[i].className && thSiblings[i].className.indexOf("dg-th_sort") >= 0)
                            thSiblings[i].className = "dg-th dg-th_sort";
                    th.className = "dg-th dg-th_sort " + (isAsc ? "dg-th_asc" : "dg-th_desc");
                }
                else if (nodeName == "input" && target.type.toLowerCase() == "checkbox") {
                    var value, rowCell, checkboxes, checkboxName;
                    cell = datagrid.allCells[target.parentNode.getAttribute("name")];
                    if (!cell) return;
                    value = target.checked;
                    for (i = 0; i < datagrid.rows.length; i++) {
                        rowCell = datagrid.getDataGridCell(i, cell.columnIndex);
                        if (rowCell) rowCell._setValue(value);
                    }
                    checkboxName = datagrid.id + "_" + datagrid.columns[cell.columnIndex].name;
                    checkboxes = document.getElementsByName(checkboxName);
                    for (i = 0; i < checkboxes.length; i++) {
                        if (checkboxes[i].type != "checkbox") continue;
                        checkboxes[i].checked = target.checked;
                    }
                }
            });

            //on key down
            if (this._editable) {
                function _getNextInputCell(td) {
                    var nextTd = td.nextSibling;
                    if (!nextTd && td.parentNode.nextSibling) nextTd = td.parentNode.nextSibling.firstChild;
                    if (!nextTd) return null;
                    cell = datagrid.allCells[nextTd.id];
                    if (_operableCellTypes.indexOf(cell.cellType) >= 0 && nextTd.style.display != "none" && (!datagrid.columns[cell.columnIndex].isPk || datagrid.PKEditable))
                        return nextTd;
                    else return _getNextInputCell(nextTd);
                }
                function _getPreviousInputCell(td) {
                    var preTd = td.previousSibling;
                    if (!preTd && td.parentNode.previousSibling) preTd = td.parentNode.previousSibling.lastChild;
                    if (!preTd) return null;
                    cell = datagrid.allCells[preTd.id];
                    if (_operableCellTypes.indexOf(cell.cellType) >= 0 && preTd.style.display != "none" && !datagrid.columns[cell.columnIndex].isPk || datagrid.PKEditable)
                        return preTd;
                    else return _getPreviousInputCell(preTd);
                }

                document.getElementById(this.id).bind("keydown", function (e) {
                    if (!datagrid.enabled) return;
                    if (DataGrid.lock) {
                        if(DataGrid.lock.focus) DataGrid.lock.focus();
                        return;
                    }
                    var keyCode = e.keyCode ? e.keyCode : e.which, target = e.srcElement ? e.srcElement : e.target;
                    if ([13,27].indexOf(keyCode) < 0) return;
                    if (["input", "select", "textarea"].indexOf(target.nodeName.toLowerCase()) < 0) return;
                    td = target.parentNode;
                    cell = datagrid.allCells[td.id];
                    if (cell.inputObject)
                        cell.inputObject.blur();

                    switch (keyCode) {
                        case 13:
                            td = e.shiftKey ? _getPreviousInputCell(td) : _getNextInputCell(td);
                            if (td) {
                                cell = datagrid.allCells[td.id];
                                if(cell) cell.focus();
                            }
                            break;
                        case 27:
                            break;
                            /*
                             case 9: // Tab
                             case 13: // Enter
                             case 27: // Esc
                             case 37: // Left
                             case 38: // Up
                             case 39: // Right
                             case 40: // Down
                             break;
                             */
                    }
                    return false;
                })
            }
        },

        _initHead: function () {
            if (this.frozenHead) {
                if (!this.height) {//keep head on top of screen
                    /*var initOffset = null, datagrid = this;
                     $(document).scroll(function () {
                     if (datagrid && (!datagrid.height || datagrid.height == "")) {
                     var ct = $(document).scrollTop();
                     if (initOffset == null) initOffset = datagrid.$head.parent().offset().top;
                     datagrid.$head.parent().css({top: ct - initOffset < 0 ? 0 : ct - initOffset});
                     }
                     })*/
                }
            }
        },

        _initGridButtons: function () {
            if(!this.buttons || this.buttons.length <= 0) return;
            var i, location, caption, onclick, div, input, topHtml = "", bottomHtml = "";
            for (i = 0; i < this.buttons.length; i++) {
                location = this.buttons[i].location;
                caption = this.buttons[i].caption ? this.buttons[i].caption : this.buttons[i].value;
                onclick = this.buttons[i].onclick;
                if (onclick && onclick.length > 0 && onclick.indexOf("(") < 0)
                    onclick += "(DataGrid.all[\"" + this.id + "\"])";
                if (location == "top" && !this.$top) {
                    if (!this.$top){
                        this.$top = document.createElement("div");
                        this._parentNode.insertBefore(this.$top, this._parentNode.firstChild);
                    }
                    topHtml += "<input type='button' value='" + caption + "' onclick='" + onclick + "'>";
                }
                else {
                    if (!this.$bottom) {
                        this.$bottom = document.createElement("div");
                        this.$bottom.className = _variables.bottomDivClass;
                        this._parentNode.appendChild(this.$bottom);
                    }
                    bottomHtml += "<input type='button' value='" + caption + "' onclick='" + onclick + "'>";
                }
            }
            if (this.$top) this.$top.innerHTML = topHtml;
            if (this.$bottom) this.$bottom.innerHTML = bottomHtml;
        },

        _load: function () {
            if (this.lineNoColumn)
                this._allocLineNo();
            var headRows, bodyRows, headHtml, bodyHtml;
            headRows = this._generateHeadRows();
            bodyRows = this._generateBodyRows();

            /*headHtml = "<div class='{0}'><table id='{1}' class='{2}'><thead>{3}</thead></table></div>".format(
                this.height ? _variables.headDivScrollClass : _variables.headDivClass,
                this.id + "_head",
                _variables.headDataGridClass,
                headRows);*/
            headHtml = "<div class='";
            headHtml += this.height ? _variables.headDivScrollClass : _variables.headDivClass;
            headHtml += "'><table id='";
            headHtml += this.id;
            headHtml += "_head' class='";
            headHtml += _variables.headDataGridClass;
            headHtml += "'><thead>";
            headHtml += headRows;
            headHtml += "</thead></table></div>";

            /*bodyHtml = "<div class='{0}'{1}><table id='{2}' class='{3}'><thead>{4}</thead><tbody>{5}</tbody></table></div>".format(
                this.height ? _variables.bodyDivScrollClass : _variables.bodyDivClass,
                this.height ? " style='max-height:" + this.height + "px'" : "",
                this.id,
                (this._editable ? "" : _variables.autoHeightClass + " ") + _variables.dataGridClass,
                headRows,
                bodyRows);*/
            bodyHtml = "<div class='";
            bodyHtml += this.height ? _variables.bodyDivScrollClass : _variables.bodyDivClass;
            bodyHtml += this.height ? "' style='max-height:" + this.height + "px'>" : "'>";
            bodyHtml += "<table id='";
            bodyHtml += this.id;
            bodyHtml += "' class='";
            bodyHtml += this._editable ? "dg'><thead>" : "dg-autoheight dg'><thead>";
            bodyHtml += headRows;
            bodyHtml += "</thead><tbody>";
            bodyHtml += bodyRows;
            bodyHtml += "</tbody></table></div>";

            this._parentNode.innerHTML = headHtml + bodyHtml;
            this.$head = document.getElementById(this.id + "_head");
            this.$ = document.getElementById(this.id);
        },

        _reload: function () {
            var bodyRows, tb;
            if (!this.$) return;
            this.allCells = null; this.allCells = {};
            this._generateHeadRows();
            bodyRows = this._generateBodyRows();
            tb = this.$.tBodies[0];
            if(tb) tb.innerHTML = bodyRows;
        },

        reload: function (newSource) {
            var source = newSource ? newSource : [];
            if (typeof(source) === "string")
                source = JSON.parse(source);
            this.rows = source;
            this._reload();
        },

        _generateRowCells: function (rowIndex) {
            var row = new DataGridRow(this, rowIndex), html = row.html;
            if (!html) return null;
            return html.substring(html.indexOf("<td"), html.lastIndexOf("</td>") + 4);
        },

        _generateHeadRows: function () {
            return this._generateRows(-1, 1);
        },

        _generateBodyRows: function () {
            if (this.pageSize && !isNaN(this.pageSize) && this.pagingType == "offline") {
                var start = (this.pageNum - 1) * this.pageSize, length = this.pageSize, maxNum = Math.ceil(this.rows.length / this.pageSize);
                if (this.pageNum > maxNum) return "";
                if (this.pageNum == maxNum) length = this.rows.length - ((maxNum - 1) * this.pageSize);
                return this._generateRows(start, length);
            }
            return this._generateRows(0, this.rows.length);
        },

        _generateRows: function (start, length) {
            var row, html = "";
            for (var i = start; i < (start + length) ; i++) {
                row = new DataGridRow(this, i);
                html += row.html;
            }
            return html;
        },

        /*
        createRows: function (newRowSource, speed) {
            newRowSource = [
                {datagridid: "test1", datamode: "entry", dataview: "v1", height: 200},
                {datagridid: "test2", datamode: "online", dataview: "v2", height: 400},
                {datagridid: "test3", datamode: "fk", dataview: "v1w", height: 600}
            ]

            if (!newRowSource || newRowSource.length <= 0) return;
            var start = this.rows.length, i, html = "", row, trs, tbody = this.$.find("tbody");
            tbody.children("." + _variables.focusTrClass).removeClass(_variables.focusTrClass);
            for (i = 0; i < newRowSource.length; i++) {
                this.rows[start + i] = newRowSource[i];
                this.rows[start + i][_variables.rowStatus] = "insert";
                row = new DataGridRow(this, start + i);
                html += row.html;
            }
            trs = $(html).appendTo(tbody).addClass(_variables.focusTrClass);
            if (this.onNewRow)
                for (i = 0; i < trs.length; i++)
                    eval(this.onNewRow + "($(trs[i]))");
            if (speed) {
                trs.css("opacity", 0).animate({opacity: 1}, speed * 3);
                this.$.animate({ scrollTop: (trs[0].offsetTop - _variables.headHeight) }, speed);
            }
            else
                this.$.scrollTop(trs[0].offsetTop - _variables.headHeight);
        },*/

        /* Create a new row
         * position: the target position of the new row;
         * speed: the speed of jQuery animation
         * */
        createNewRow: function (position, speed) {
            var i, newRow, newRowSource = {}, tr, tb;

            if (this.onBeforeNewRow)
                if(!eval(this.onBeforeNewRow + "(rowSource)")) return;

            if (position > this.rows.length || isNaN(position))
                position = this.rows.length;
            else if (position < 0) position = 0;

            tb = this.$.tBodies[0];
            if (!tb) return;

            newRow = new DataGridRow(this, this.rows.length);
            if (position == this.rows.length - 1) {
                tb.insertAdjacentHTML("beforeend", newRow.html);
            }
            else if (this.concurMode){
                //1. create a new row at the bottom, and move the new row to position
                tb.insertAdjacentHTML("beforeend", newRow.html);
                this.moveRowTo(this.rows.length - 1, position);

                //or 2. create a new row in certain position of source layer, and re-render the business and presentation layers
                /*this.rows.splice(position, 0, this.rows[this.rows.length - 1]);
                this.rows.pop();
                this._reload();*/

                //todo: need to investigate which one of above 2 methods is more efficient
            }
            else{
                tb.rows[position].insertAdjacentHTML("beforebegin", newRow.html);
                if (this.lineNoColumn)
                    this.allocLineNo(position);
            }

            tr = tb.rows[position];
            this._onCreateRow(position, tr, speed);
            return position;
        },

        createContentRow: function (child, position, speed) {
            var tb, tr, td;
            if (position > this.rows.length || isNaN(position))
                position = this.rows.length;
            else if (position < 0) position = 0;

            if (position < this.rows.length - 1)
                this.$.rows[position].insertAdjacentHTML("beforebegin", "<tr type='content'><td colspan='" + this.columns.length + "'></td></tr>");
            else
                this.$.tBodies[0].insertAdjacentHTML("beforeend", "<tr type='content'><td colspan='" + this.columns.length + "'></td></tr>");

            tr = this.$.rows[position];
            if (child){
                td = tr.cells[0];
                if (typeof(child) === "string") td.innerHTML = child;
                else td.appendChild(child);
            }

            this._onCreateRow(position, tr, speed);
            return tr;
        },

        _onCreateRow: function (position, tr, speed) {
            if (!tr) return;
            if (!speed) speed = 300;
            if (this.onNewRow)
                eval(this.onNewRow + "(position, tr)");
            this._focusRow(tr)

            if (speed) {
                tr.style.display = "none";
                tr.style.opacity = 0.1;
                tr.style.display = "";
                this.$.parentNode.animate({scrollTop: tr.offsetTop - _variables.headHeight}, speed, function(){
                    tr.style.opacity = 1;
                });
            }
            else
                this.$.parentNode.scrollTop = tr.offsetTop - _variables.headHeight;
        },

        /* Find rows in data source layer */
        _findRows: function (columnIndex, value, firstN) {
            var i, rowIndexes = [], cellValue;
            if (!isNaN(columnIndex)) columnIndex = this.columns[columnIndex].name;
            if (columnIndex)
                for (i = 0; i < this.rows.length; i++) {
                    if (this.getRowStatus(i) == "delete") continue;
                    cellValue = this.rows[i][columnIndex];
                    if(cellValue == value){
                        rowIndexes.push(i);
                        if(firstN && rowIndexes.length >= firstN) break;
                    }
                }
            return rowIndexes;
        },

        /* Find rows in business layer */
        findRows: function (columnIndex, value, firstN) {
            var i, rowIndexes = [];
            if (isNaN(columnIndex))
                columnIndex = this.getColumnIndexByName(columnIndex);
            if (columnIndex >= 0)
                for (i = 0; i < this.rows.length; i++) {
                    if (this.getRowStatus(i) == "delete") continue;
                    if (this.getCellValue(i, columnIndex) == value) {
                        rowIndexes.push(i);
                        if (firstN && rowIndexes.length >= firstN) break;
                    }
                }
            return rowIndexes;
        },

        /* Find rows in presentation layer
         * where's sample: "[name1]>=value1 && ([name2]==value2 || [name3]==value3)";
         * */
        findRowsByWhere: function (where, firstN) {
            var i, j, clauseTemplate = where, tempColumns = [], wColumns = [], rowIndexes = [],
                columnName, columnIndex, preCellID, clause;
            if (typeof (where) != "string") return null;
            tempColumns = where.split("[");
            for (i = 0; i < tempColumns.length; i++) {
                if (tempColumns[i].length <= 0) continue;
                if (tempColumns[i].indexOf("]") <= 0) continue;
                columnName = tempColumns[i].substr(0, tempColumns[i].indexOf("]"));
                wColumns.push(columnName);
            }
            for (i = 0; i < wColumns.length; i++) {
                columnIndex = wColumns[i];
                if (isNaN(columnIndex))
                    columnIndex = this.getColumnIndexByName(columnIndex);
                clauseTemplate = clauseTemplate.replace(wColumns[i], columnIndex);
            }
            for (i = 0; i < this.rows.length; i++) {
                preCellID = this.id + "_" + i + "_";
                //clause = clauseTemplate.replace(/\[/g, "$(\"#" + preCellID).replace(/\]/g, "\").text()");
                clause = clauseTemplate.replace(/\[/g, "document.getElementById(\"" + preCellID).replace(/\]/g, "\").textContent");
                if (eval(clause)) {
                    rowIndexes.push(i);
                    if (firstN && rowIndexes.length >= firstN) break;
                }
            }
            return rowIndexes;
        },

        /* Find duplicate rows in business layer
         * columnIndexes' samples: "column1, column2" or ["column1", "column2"];
         * */
        findDuplicateRow: function (columnIndexes, spliter) {
            if (!columnIndexes || columnIndexes.length <= 0) return null;
            var columns, rowValues = [], rowValue, cellValue, i, j;
            if (!spliter) spliter = "|";
            if (typeof (columnIndexes) === "string") columns = columnIndexes.split(spliter);
            else columns = columnIndexes;
            for (i = 0; i < columns.length; i++)
                if (isNaN(columns[i]))
                    columns[i] = this.getColumnIndexByName(columns[i]);
            for (i = 0; i < this.rows.length; i++) {
                if (this.getRowStatus(i) == "delete") continue;
                rowValue = "";
                for (j = 0; j < columns.length; j++) {
                    cellValue = this.getCellValue(i, columns[j]);
                    if (cellValue) rowValue += ((cellValue ? cellValue : "") + spliter);
                }
                if (rowValues.index(rowValue) < 0)
                    rowValues.push(rowValue);
                else return i;
            }
            return null;
        },

        _blurRow: function(){
            var trs = [], i;
            if (document.getElementsByClassName)
                trs = this.$.getElementsByClassName("dg-tr_focus");
            else if (document.querySelectorAll)
                trs = this.$.querySelectorAll(".dg-tr_focus");
            else
                trs = this.$.getElementsByTagName("tr");
            for (i = 0; i < trs.length; i++)
                trs[i].className = "dg-tr";
        },

        _focusRow: function(tr){
            this._blurRow();
            tr.className = "dg-tr dg-tr_focus";

        },

        getFocusedRow: function () {
            var tr, td, row, cell;
            if (document.getElementsByClassName){
                tr = this.$.getElementsByClassName("dg-tr_focus")[0];
                if (tr) td = tr.firstChild;
            }
            else if (document.querySelector)
                td = this.$.querySelector(".dg-tr_focus td");
            else{
                tr = this.$.getElementsByTagName("tr");
                for (var i = 0; i < tr.length; i++)
                    if (tr[i].className.indexOf("dg-tr_focus") >= 0) {
                        td = tr[i].firstChild;
                        break;
                    }
            }

            if (!td) return null;
            cell = this.allCells[td.id];
            if (cell) row = cell.parentRow;
            if (row) return row.rowIndex;
            return null;
        },

        getRowStatus: function (rowIndex) {
            if(this.rows[rowIndex])
                return this.rows[rowIndex][_variables.rowStatus];
            return null;
        },

        deleteRow: function (rowIndex, speed) {
            if (!this.rows[rowIndex]) return;
            var datagrid = this, td = this.getCell(rowIndex, 0), tr;
            if (!td) return;
            tr = td.parentNode;

            this.rows[rowIndex][_variables.rowStatus] = "delete";
            if (speed){
                tr.style.opacity = 0;
                setTimeout(function(){
                    tr.remove();
                    if (datagrid.lineNoColumn) datagrid.allocLineNo();
                }, speed);
            }
            else{
                tr.remove();
                if (datagrid.lineNoColumn) datagrid.allocLineNo();
            }
        },

        deleteRows: function (rowIndexes, speed) {
            var i;
            if (typeof (rowIndexes) === "string")
                rowIndexes = rowIndexes.split(",");
            if (!this.lineNoColumn)
                for (i = 0; i < rowIndexes.length; i++)
                    this.deleteRow(rowIndexes[i], speed);
            else {//if line Number column exists, should allocate line Numbers after deleting.
                for (i = 0; i < rowIndexes.length; i++) {
                    if (!this.rows[rowIndexes[i]]) return;
                    this.rows[rowIndexes[i]][_variables.rowStatus] = "delete";
                    this.getCell(rowIndexes[i], 0).parentNode.remove();
                }
                this.allocLineNo();
            }
        },

        /* Find rows in presentation layer and delete them */
        deleteRowsByWhere: function (where, speed) {
            var rowIndexes = this.findRowsByWhere(where);
            if (rowIndexes)
                this.deleteRows(rowIndexes, speed);
        },

        /* Filter rows
         * iterative: whether filter iteratively. false - base on all data source; true - base on last filter result;
         * */
        filterRows: function (columnIndex, value, iterative) {
            var newSourceRows = [], i, rowIndexes = this._findRows(columnIndex, value);
            if(!iterative && this.initRows)
                this.rows = JSON.parse(this.initRows);
            if(!this.initRows)
                this.initRows = JSON.stringify(this.rows);
            if(!rowIndexes) return;
            for (i = 0; i < rowIndexes.length; i++)
                newSourceRows.push(this.rows[rowIndexes[i]]);
            this.rows = newSourceRows;
            this._reload();
        },

        filterRowsByWhere: function (where) {

        },

        disableCell: function (rowIndexes, columnIndex) {
            this.setRowsCellEnabled(rowIndexes, columnIndex, false);
        },

        setRowsCellEnabled: function(rowIndexes, columnIndex, enabled){
            if (rowIndexes == undefined) return;
            if (isNaN(columnIndex))
                columnIndex = this.getColumnIndexByName(columnIndex);
            var i, j, id, cell, td, inputs;
            if (typeof (rowIndexes) === "string")
                rowIndexes = rowIndexes.split(",");
            for (i = 0; i < rowIndexes.length; i++){
                id = this.getCellId(rowIndexes[i], columnIndex);
                cell = this.getDataGridCell(id);
                if(cell) cell.enabled = enabled;
                td = document.getElementById(id);
                if (!td || td.childNodes.length <= 0) continue;
                inputs = td.getElementsByTagName("input");
                for (j = 0; j < inputs.length; j++)
                    inputs[j].disabled = !enabled;
            }
        },

        clearAllRows: function () {
            this.rows = {};
            this._reload();
        },

        _exchange2Rows: function (rowIndex1, rowIndex2, ignoreLineNo) {
            if (rowIndex1 < 0 || rowIndex1 > this.rows.length - 1 || rowIndex2 < 0 || rowIndex2 > this.rows.length - 1)
                return;
            var lineNo = this.lineNoColumn, tempRow1 = this.rows[rowIndex1], tempRow1LineNo, tempRow2LineNo,
                tempRow1Status = this.rows[rowIndex1][_variables.rowStatus], tempRow2Status = this.rows[rowIndex2][_variables.rowStatus];
            if(!ignoreLineNo && lineNo != null){
                tempRow1LineNo = this.rows[rowIndex1][lineNo];
                tempRow2LineNo = this.rows[rowIndex2][lineNo];
            }
            this.rows[rowIndex1] = this.rows[rowIndex2];
            /*if(tempRow2Status) this.rows[rowIndex1][_variables.rowStatus] = tempRow2Status;
            else this.rows[rowIndex1][_variables.rowStatus] = undefined;*/

            this.rows[rowIndex2] = tempRow1;
            /*if(tempRow1Status) this.rows[rowIndex2][_variables.rowStatus] = tempRow1Status;
            else this.rows[rowIndex2][_variables.rowStatus] = undefined;*/
            if(!ignoreLineNo && lineNo){
                if (tempRow1LineNo) this.rows[rowIndex1][lineNo] = tempRow1LineNo;
                if (tempRow2LineNo) this.rows[rowIndex2][lineNo] = tempRow2LineNo;
                tempRow1Status = this.rows[rowIndex1][_variables.rowStatus];
                tempRow2Status = this.rows[rowIndex2][_variables.rowStatus];
                if(tempRow1Status != "insert" && tempRow1Status != "delete")
                    this.rows[rowIndex1][_variables.rowStatus] = "update";
                if(tempRow2Status != "insert" && tempRow1Status != "delete")
                    this.rows[rowIndex2][_variables.rowStatus] = "update";
            }
        },

        exchange2Rows: function (rowIndex1, rowIndex2, speed) {
            if (this.rows[rowIndex1][_variables.rowStatus] == "delete" || this.rows[rowIndex2][_variables.rowStatus] == "delete") {
                //alert("one of the 2 rows has been deleted");
                return;
            }
            if (!speed) speed = 0;
            var datagrid = this, tr1 = this.getCell(rowIndex1, 0).parentNode, tr2 = this.getCell(rowIndex2, 0).parentNode;
            this._exchange2Rows(rowIndex1, rowIndex2);

            if (speed){
                tr1.style.opacity = 0;
                tr2.style.opacity = 0;
                setTimeout(function(){
                    tr1.innerHTML = datagrid._generateRowCells(rowIndex1);
                    tr2.innerHTML = datagrid._generateRowCells(rowIndex2);
                    datagrid._focusRow(tr2);
                    tr1.style.opacity = 1;
                    tr2.style.opacity = 1;
                }, speed);
            }
            else{
                tr1.innerHTML = datagrid._generateRowCells(rowIndex1);
                tr2.innerHTML = datagrid._generateRowCells(rowIndex2);
                datagrid._focusRow(tr2);
            }
        },

        moveRow: function (rowIndex, step) {
            //if(abs(step) > xx) {this.moveRow1();return;}
            if (rowIndex < 0 || rowIndex >= this.rows.length || !step || step == 0) return;
            var direction = (step > 0 ? 1 : -1), base = rowIndex, target = rowIndex + direction, tr;
            while (this.rows[target] && Math.abs(step) > 0) {
                if (this.rows[target][_variables.rowStatus] != "delete") {
                    this._exchange2Rows(base, target);
                    this.getCell(base, 0).parentNode.innerHTML = this._generateRowCells(base);
                    step = step - direction;
                    base = target;
                }
                target = target + direction;
            }
            if (!this.rows[base])
                base = base - direction;
            tr = this.getCell(base, 0).parentNode;
            tr.innerHTML = this._generateRowCells(base);
            this._focusRow(tr);
        },

        moveRow1: function () {
            //not exchange source, use insertXmlBefore and reload;
        },

        moveRowTo: function (startRowIndex, endRowIndex) {
            this.moveRow(startRowIndex, endRowIndex - startRowIndex);
        },

        getColumnIndexByName: function (columnName) {
            var name, i;
            for (i = 0; i < this.columns.length; i++) {
                name = this.columns[i].name;
                if (name && name.toLowerCase() == columnName.toLowerCase())
                    return i;
            }
            return -1;
        },

        getCellId: function (rowIndex, columnIndex) {
            if (rowIndex == undefined || columnIndex == undefined) return null;
            if (isNaN(columnIndex))
                columnIndex = this.getColumnIndexByName(columnIndex);
            return (this.id + "_" + rowIndex + "_" + columnIndex);
        },

        getCell: function (rowIndex, columnIndex) {
            var cellId = this.getCellId(rowIndex, columnIndex);
            return document.getElementById(cellId);
        },

        getDataGridCell: function (rowIndex, columnIndex) {
            var cellId = this.getCellId(rowIndex, columnIndex);
            return this.allCells[cellId];
        },

        getCellValue: function (rowIndex, columnIndex) {
            var cell = this.getDataGridCell(rowIndex, columnIndex);
            if (cell) return cell.cellValue;
            else return null;
        },

        setCellValue: function (rowIndex, columnIndex, value, ignoreOnchange) {
            var cell = this.getDataGridCell(rowIndex, columnIndex);
            if (cell) cell.setValue(value, ignoreOnchange);
        },

        setRowsCellValue: function (rowIndexes, columnIndex, value) {
            if (typeof (rowIndexes) === "string")
                rowIndexes = rowIndexes.split(",");
            if (isNaN(columnIndex))
                columnIndex = this.getColumnIndexByName(columnIndex);
            if (columnIndex >= 0)
                for (var i = 0; i < rowIndexes.length; i++) {
                    var cell = this.getDataGridCell(rowIndexes[i], columnIndex);
                    if (cell) cell.setValue(value);
                }
        },

        setAllRowsCellValue: function (columnIndex, value) {
            var cell, i;
            if (isNaN(columnIndex))
                columnIndex = this.getColumnIndexByName(columnIndex);
            for (i = 0; i < this.rows.length; i++) {
                cell = this.getDataGridCell(i, columnIndex);
                if (cell) cell.setValue(value);
            }
        },

        /* Find rows in presentation layer and set their values */
        setRowsCellValueByWhere: function (where, columnIndex, value) {
            var rowIndexes = this.findRowsByWhere(where);
            if (isNaN(columnIndex))
                columnIndex = this.getColumnIndexByName(columnIndex);
            if (rowIndexes)
                this.setRowsCellValue(rowIndexes, columnIndex, value);
        },

        focusCell: function (rowIndexes, columnIndex) {
            var cell = this.getDataGridCell(rowIndexes, columnIndex);
            if (cell) cell.focus();
        },

        _sort: function (columnIndex, isAsc) {
            function _compare(a, b) {
                if (!a && !b) return false;
                if (!a) return !isAsc;
                if (!b) return isAsc;
                if (a == b) return false;
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

            if (!isNaN(columnIndex))
                columnIndex = this.columns[columnIndex].name;
            if (!columnIndex) return;

            var i, j, tempRow;
            for (i = 1; i < this.rows.length; i++){
                j = i - 1;
                tempRow = this.rows[i];
                while(j >= 0 && _compare(this.rows[j][columnIndex], tempRow[columnIndex])){
                    this.rows[j + 1] = this.rows[j];
                    j--;
                }
                this.rows[j + 1] = tempRow;
            }
        },

        sort: function (columnName, isAsc) {
            this._sort(columnName, isAsc);
            this._allocLineNo();
            this._reload();
        },

        _allocLineNo: function (startRow, startNo) {
            if (!this.lineNoColumn) return;
            if (startRow == undefined || startRow < 0) startRow = 0;
            if (startNo == undefined) startNo = startRow + 1;
            var i, lnColumn, currNo = startNo;
            for (i = startRow; i < this.rows.length; i++){
                if(this.rows[i][_variables.rowStatus] == "delete") continue;
                this.rows[i][this.lineNoColumn] = currNo++;
            }
        },

        allocLineNo: function (startRow, startNo) {
            if (!this.lineNoColumn) return;
            if (startRow == undefined || startRow < 0) startRow = 0;
            if (startNo == undefined) startNo = startRow + 1;
            var columnIndex = this.getColumnIndexByName(this.lineNoColumn),
                i, cell, tb, rowIndex, currNo = startNo;
            if (this.concurMode)
                for (i = startRow; i < this.rows.length; i++) {
                    if (this.rows[i][_variables.rowStatus] == "delete") continue;
                    cell = this.getDataGridCell(i, columnIndex);
                    cell.setValue(currNo++);
                }
            else {
                tb = this.$.tBodies[0];
                for (i = startRow; i < tb.rows.length; i++) {
                    rowIndex = parseInt(tb.rows[i].cells[0].id.slice(-3,-2));
                    if (this.rows[rowIndex][_variables.rowStatus] == "delete") continue;
                    cell = this.getDataGridCell(rowIndex, columnIndex);
                    cell.setValue(currNo++);
                }
            }
        },



        refreshColumn: function (columnIndex, startRow, length) {
        },

        setColumnAttribute: function(columnIndex, name, value){
            if (isNaN(columnIndex))
                columnIndex = this.getColumnIndexByName(columnIndex);
            if (columnIndex < 0) return;

            this.columns[columnIndex][name] = value;
            this._initColumns();
            this._reload();
        },

        /* Set columns' attributes in JSON format
         * attributes' sample: [{name: "column1", type: "label", width: 200}, {index: 2, type: "select"}];
         * */
        setColumnsAttributes: function(attributes){
            if(!attributes || attributes.length <= 0) return;
            var i, j;
            for (i = 0; i < attributes.length; i++){
                var columnIndex = null, key, value;
                if (attributes[i].index)  columnIndex = attributes[i].index;
                else if(attributes[i].name) columnIndex = this.getColumnIndexByName(attributes[i].name);
                else continue;
                if (columnIndex < 0) continue;
                for (j in attributes[i]){
                    if(j == "index" || j == "name") continue;
                    this.columns[columnIndex][j] = attributes[i][j];
                }
            }
            this._initColumns();
            this._reload();
        },

        setColumnOptions: function(columnIndex, options){
            if (!options) return;
            if (isNaN(columnIndex))
                columnIndex = this.getColumnIndexByName(columnIndex);
            if (columnIndex < 0) return;
            var type = this.columns[columnIndex].type;
            if (type != "select" && type != "map") return;
            if (typeof(options) === "string")
                options = JSON.parse(options);
            this.columns[columnIndex].options = options;
            hashTableCache["$" + this.id + "_" + columnIndex] = null;
            this._initColumns();
            this._reload();
        },

        setCellOptions: function(rowIndex, columnIndex, options){
            var type = this.columns[columnIndex].type, selectInput, i, cell;
            if (!options) return;
            if (isNaN(columnIndex))
                columnIndex = this.getColumnIndexByName(columnIndex);
            if (columnIndex < 0) return;
            if (type != "select" && type != "map") return;
            if (typeof(options) === "string")
                options = JSON.parse(options);
            selectInput = "<select>";
            for (i = 0; i < options.length; i++)
                selectInput += ("<option value='" + options[i].value + "'>" + options[i].text + "</option>");
            selectInput += "</select>";
            cell = this.getDataGridCell(rowIndex, columnIndex);
            if(cell) {
                cell.cellOptions = options;
                cell.cellSelect = selectInput;
            }
        },

        getDataSource: function () {
            if (!this.enableRowStatus){
                var i, rows = JSON.parse(JSON.stringify(this.rows));
                for (i = 0; i < rows.length; i++)
                    if (rows[i][_variables.rowStatus] == "delete")
                        rows.splice(i--, 1);
                return JSON.stringify(rows);
            }
            return JSON.stringify(this.rows);
        },

        getRows: this.getDataSource,

        save: function () {
            /*var changedRows = [], i, status;
            for(i=0;i<this.rows.length;i++){
                status = this.rows[i][_variables.rowStatus];
                if(status == "insert" || status == "delete" || status == "update")
                    changedRows.push(this.rows[i]);
            }
            var strParas = {
                dataView: this.dataView,
                columns: this.columns,
                callMethod: "Save",
                rows: changedRows
            };
            var datagrid = this;
            service.serviceStackPost("datagrid", strParas, function () {

                datagrid._reload();
            });*/
        },

        /* Init validation in column (Non-Core) */
        _initColumnValidation: function (columnIndex) {
            var code, message, label, regexCode = "", regexMessage = "",
                column, type, left, mid, right, ops, s, n1, n2, validatename;

            column = this.columns[columnIndex];
            code = column[_variables.validateCode];
            if (!code) return null;
            message = column[_variables.validateMessage];
            if (code && code.substr(0, 1) == "%") {// Pre-defined Validation Codes (%I, %F, %C, %D)
                label = column.caption;
                if (!label) label = column.name;
                type = code.substr(1, 1);
                if (type == "I") {// Integers
                    left = code.indexOf("(");
                    right = code.indexOf(")");
                    if (left < 0) ops = code.substring(2);
                    else ops = code.substring(2, left);

                    if (ops.indexOf("n") >= 0) regexCode += "^$|";
                    if (ops.indexOf("+") >= 0) {
                        regexCode += "^[1-9]";
                        regexMessage = label + ": Positive Integer";
                    }
                    else if (ops.indexOf("0") >= 0) {
                        regexCode += "^0$|^[1-9]";
                        regexMessage = label + ": Non-Negative Integer";
                    }
                    else {
                        regexCode += "^[+-]?[0-9]";
                        regexMessage = label + ": Integer";
                    }
                    if (left < 0 || right < 0) {
                        regexCode += "[0-9]*";
                    }
                    else {
                        n1 = parseInt(code.substring(left + 1, right), 10);
                        if (n1 > 1) regexCode += "[0-9]{0," + (n1 - 1).toString() + "}";
                        regexMessage += " (Precision:" + n1.toString() + ")";
                    }
                    regexCode += "$";
                    regexMessage += " required.";
                }
                else if (type == "F") {// Floats
                    left = code.indexOf("(");
                    right = code.indexOf(")");
                    if (left < 0) ops = code.substring(2); else ops = code.substring(2, left);
                    if (ops.indexOf("n") >= 0) regexCode += "^$|";
                    if (ops.indexOf("+") >= 0 || ops.indexOf("0") >= 0) {
                        regexCode += "^";
                        regexMessage = label + ": Positive Float";
                    }
                    else {
                        regexCode += "^[+-]?";
                        regexMessage = label + ": Float";
                    }
                    if (left < 0 || right < 0) regexCode += "[0-9]*(\\.[0-9]+)?";
                    else {
                        s = code.substring(left + 1, right);
                        mid = s.indexOf(".");
                        if (mid < 0) {
                            n1 = parseInt(s, 10);
                            n2 = 0;
                        }
                        else {
                            n1 = parseInt(s.substring(0, mid), 10);
                            n2 = parseInt(s.substring(mid + 1), 10);
                        }
                        if (n1 >= 1) {
                            if (n1 > 1) regexCode += "[0-9]{0," + (n1 - 1).toString() + "}";
                            regexMessage += " (Precision: " + n1.toString();
                        }
                        else {
                            regexCode += "[0-9]*";
                            regexMessage += " (Precision: unlimit";
                        }
                        if (n2 > 0) {
                            regexCode += "(\\.[0-9]{1," + n2.toString() + "})?";
                            regexMessage += ", Scale: " + n2.toString() + ")";
                        }
                        else {
                            regexCode += "(\\.[0-9]+)?";
                            regexMessage += ", Scale: unlimit)";
                        }
                    }
                    regexCode += "$";
                    regexMessage += " required.";
                }
                else if (type == "C") {// Characters
                    left = code.indexOf("(");
                    right = code.indexOf(")");
                    if (left >= 0 && right > 0) {
                        s = code.substring(left + 1, right);
                        mid = s.indexOf("-");
                        if (mid < 0) {
                            n1 = 0;
                            n2 = parseInt(s, 10);
                        }
                        else {
                            n1 = parseInt(s.substring(0, mid), 10);
                            if (mid + 1 == right) n2 = 0;
                            else n2 = parseInt(s.substring(mid + 1), 10);
                        }
                        regexCode = "^.{" + n1.toString() + "," + (n2 > 0 ? n2.toString() : "") + "}$";
                        regexMessage = label + ": " + n1.toString() + "-" + (n2 > 0 ? n2.toString() : "unlimit") + " characters.";
                    }
                }

                if (type == "D") regexMessage = "Date required.";
                else {
                    code = regexCode;
                    column[_variables.validateCode] = regexCode;
                }

                if (!message) {
                    message = regexMessage;
                    column[_variables.validateMessage] = regexMessage;
                }
            }
        },

        /* Non-instantaneous validation (Non-Core) */
        validate: function (validateAll) {
            var i, j, cell, toValidateColumns = [], validateCode, result, fCells = [];

            for (i = 0; i < this.columns.length; i++) {
                validateCode = this.columns[i][_variables.validateCode];
                if (validateCode && validateCode.length > 0) toValidateColumns.push(i);
            }
            if (!toValidateColumns.length) return true;
            for (i = 0; i < this.rows.length; i++) {
                if (this.rows[i][_variables.rowStatus] == "delete") continue;
                for (j = 0; j < toValidateColumns.length; j++) {
                    cell = this.getDataGridCell(i, toValidateColumns[j]);
                    result = cell.validate(undefined, !validateAll);
                    if (!result && !validateAll) {
                        //alert(i + "," + j);
                        return false;
                    }
                    if (!result) fCells.push(cell);
                }
            }
            if (fCells.length > 0) {
                alert(fCells.length + " fail");
                return false;
            }
            else return true;
        }
    };


    //DataGrid-Row
    var DataGridRow = function (parentGrid, rowIndex) {
        this._generateRow(parentGrid, rowIndex)
    };

    DataGridRow.prototype = {
        parentGrid: null,
        rowIndex: null,
        html: null,
        _generateRow: function (parentGrid, rowIndex) {
            var columns = parentGrid.columns, newRow = {}, preRow, maxNo, cell, cells = "", html, invisible, i;
            this.parentGrid = parentGrid;
            this.rowIndex = rowIndex;

            if (rowIndex >= parentGrid.rows.length) {//new row
                newRow[_variables.rowStatus] = "insert";
                if (parentGrid.lineNoColumn) {//alloc new line No.
                    maxNo = 0;
                    for (i = parentGrid.rows.length - 1; i > 0 ; i--)
                        if (parentGrid.rows[i][_variables.rowStatus] != "delete"){
                            maxNo = parseInt(parentGrid.rows[i][parentGrid.lineNoColumn]);
                            if (isNaN(maxNo)) maxNo = 0;
                            break;
                        }
                    newRow[parentGrid.lineNoColumn] = maxNo + 1;
                }
                for (i = 0; i < columns.length; i++) {//set default values
                    if (columns[i]["default"])
                        newRow[columns[i].name] = columns[i]["default"];
                    else if (columns[i].type == "checkbox")
                        newRow[columns[i].name] = false;
                }
                parentGrid.rows.push(newRow);
            }
            invisible = rowIndex >= 0 && parentGrid.rows.length > 0 && parentGrid.rows[rowIndex][_variables.rowStatus] == "delete";
            for (i = 0; i < columns.length; i++) {
                cell = new DataGridCell(this, i);
                cells += cell.html;
            }
            /*this.html = "<tr{0}>{1}</tr>".format(invisible ? " style='display:none'" : "", cells);*/
            html = "<tr class='dg-tr'";
            html += invisible ? " style='display:none'>" : ">";
            html += cells;
            html += "</tr>";
            this.html = html;
        }
    };


    //DataGrid-Row-Cell
    var DataGridCell = function (parentRow, columnIndex) {
        this._generateCell(parentRow, columnIndex);
    };

    DataGridCell.prototype = {
        parentRow: null,
        columnIndex: null,
        cellValue: null,
        cellText: null,
        cellType: null,
        id: null,
        html: null,
        inputObject: null,
        labelObject: null,
        enabled: true,
        _generateCell: function (parentRow, columnIndex) {
            var row, column, cell, cellClass, cellStyle = "";
            column = parentRow.parentGrid.columns[columnIndex];
            this.parentRow = parentRow;
            this.columnIndex = columnIndex;
            this.id = parentRow.parentGrid.id + "_" + parentRow.rowIndex + "_" + columnIndex;
            this.cellType = column.type;
            if (column.hidden) cellStyle += "display:none;";

            if (parentRow.rowIndex < 0) {//Head
                if (column.width) cellStyle += "width:" + column.width + ";";
                /*cell = "<th{0}{1}{2}{3}{4}><span>{5}{6}</span></th>";
                this.html = cell.format(column.width ? " width=" + column.width : "",
                    cellStyle == "" ? "" : " style='" + cellStyle + "'",
                    (["button", "image"].indexOf(this.cellType) < 0 && parentRow.parentGrid.enableSorting) ? " class='" + _variables.sortThClass + "'" : "",
                    this.id ? " id='" + this.id + "'" : "",
                    column.caption ? " title='" + column.caption + "'" : "",
                    (this.cellType == "checkbox" && column.selectall == 1) ? "<input type='checkbox' style='position:relative;top:3px;' />" : "",
                    column.caption ? column.caption : "&nbsp;");*/
                cell = "<th class='dg-th";
                cell += column.enableSorting ? " dg-th_sort'" : "'";
                cell += cellStyle == "" ? "" : " style='" + cellStyle + "'";
                cell += this.id ? " name='" + this.id + "'" : "";
                cell += column.caption ? " title='" + column.caption + "'>" : ">";
                cell += (this.cellType == "checkbox" && column.selectall == 1) ? "<input type='checkbox' class='dg-th-checkbox'>" : "";
                cell += column.caption ? column.caption : "&nbsp;";
                cell += "</th>";
                this.html = cell;
            }
            else {//Body
                row = parentRow.parentGrid.rows[parentRow.rowIndex];
                if (column.onrender)
                    eval(column.onrender + "(" + parentRow.rowIndex +", parentRow.parentGrid)");
                if (row && column.name)
                    this.cellValue = this.cellText = row[column.name];
                if (this.cellValue == 0 || this.cellValue == false)
                    this.cellValue = this.cellValue.toString();
                if (column.align) cellStyle += "text-align:" + column.align;
                cell = "<td class='dg-td";
                cell += cellClass ? " " + cellClass + "'" : "'";
                cell += cellStyle == "" ? "" : " style='" + cellStyle + "'";
                cell += this.id ? " id='" + this.id + "'" : "";
                cell += (this.cellType == "label") ? " title='" + this.cellValue + "'>" : ">";
                cell += this._generateCellElement();
                cell += "</td>";
                this.html = cell;
            }
            parentRow.parentGrid.allCells[this.id] = this;
        },

        _generateCellElement: function () {
            var rowIndex = this.parentRow.rowIndex, type = this.cellType, column = this.parentRow.parentGrid.columns[this.columnIndex], element = "", i;
            if (type == "datetime") type = "datetime-local";
            if (type == "textfield") type = "textarea";
            //if (_allCellTypes.indexOf(type) < 0) return null;

            switch (type) {
                case "checkbox":
                case "radio":
                    //element = ("<input type='{0}' name='{1}' value='{2}'{3}/>").format(type, this.parentRow.parentGrid.id + "_" + column.name, rowIndex, this.cellValue == "1" ? " checked='checked'" : "");
                    element = "<input type='";
                    element += type;
                    element += "' name='";
                    element += this.parentRow.parentGrid.id + "_" + column.name;
                    element += "' value='";
                    element += rowIndex;
                    element += this.cellValue == "1" ? "' checked='checked'/>" : "'/>";
                    break;
                case "button":
                case "jsonform":
                    if (column.buttons)
                        element = column.buttons.replace(/#/g, rowIndex);
                    break;
                case "image":
                    //element = ("<input type='{0}' src='{1}' />").format(type, this.cellValue);
                    element = "<input type='";
                    element += type;
                    element += "' src='";
                    element += this.cellValue;
                    element += "' class='dg-image' />";
                    break;
                case "link":
                    var text = column.alias ? column.alias : (this.cellValue ? this.cellValue : "&nbsp;")
                    if (column.onclick){
                        //element = ("<a onclick='{0}'>{1}</a>").format(column.onclick + "(" + rowIndex + ")", text);
                        element = "<a onclick='";
                        element += column.onclick;
                        element += "(" + rowIndex + ")' class='dg-a'>";
                        element += text;
                        element += "</a>";
                    }
                    else{
                        //element = ("<a href='{0}'>{1}</a>").format(this.cellValue, text);
                        element = "<a href='";
                        element += this.cellValue;
                        element += "' class='dg-a'>";
                        element += text;
                        element += "</a>";
                    }
                    break;
                case "map":
                case "select":
                    var options = this.cellOptions ? this.cellOptions : column.options;
                    if (options && options.length > 0)
                        for (i = 0; i < options.length; i++)
                            if (this.cellValue == options[i].value) {
                                this.cellText = options[i].text;
                                break;
                            }
                    //can be optimized: change options to a key-value object
                    //element = ("<span>{0}</span>").format(this.cellText ? this.cellText : "&nbsp;");
                    element = this.cellText ? this.cellText : "&nbsp;";
                    break;
                case "progress":
                    var percent = parseFloat(this.cellValue), percent_s, percentHtml, pClass;
                    if (isNaN(percent)) percent = 0;
                    percent = Math.round(percent * 100);
                    percent_s = percent;
                    if (percent_s > 100) percent_s = 100;
                    else if (percent_s < 0) percent_s = 0;
                    pClass = (percent > 0 && percent <= 10) ? _variables.emptyProClass : (percent <= 30 ? _variables.warningProClass : _variables.enoughProClass);
                    /*percentHtml = "<span class='{0}' style='width:{1}'>&nbsp;</span><span class='{2}' style='width:{3}'>&nbsp;</span><span class='{4}'>{5}</span>"
                        .format(pClass, percent_s + "%", _variables.restProClass, (100 - percent_s) + "%", _variables.proTitleClass, percent + "%");
                    element = "<span class='{0}' title='{1}'>{2}</span>".format(_variables.proClass, percent + "%", percentHtml);*/
                    percentHtml = "<span class='" + pClass + "' style='width:" + percent_s + "%" + "'>&nbsp;</span><span class='" + _variables.restProClass
                        + "' style='width:" + (100 - percent_s) + "%" + "'>&nbsp;</span><span class='" + _variables.proTitleClass + "'>" + percent + "%</span>";
                    element = "<span class='";
                    element += _variables.proClass;
                    element += "' title='";
                    element += percent + "%" + "'>";
                    element += percentHtml;
                    element += "</span>";
                    break;
                default:
                    //element = ("<span>{0}</span>").format(this.cellValue ? this.cellValue : "&nbsp;");
                    element = this.cellValue ? this.cellValue : "&nbsp;";
                    break;
            }
            return element;
        },

        _onClick: function () {
            var type = this.cellType, td = document.getElementById(this.id), tr, input, label, cell = this, i, refresh = false, column;

            if (!td) return;
            this.parentRow.parentGrid._focusRow(td.parentNode);
            if (_operableCellTypes.indexOf(type) < 0 || !this.enabled) return;

            input = this.inputObject;
            label = this.labelObject;
            column = this.parentRow.parentGrid.columns[this.columnIndex];
            if (!this.parentRow.parentGrid.PKEditable && column.isPk) { alert("Can't edit Primary Key"); return; }
            if(this.cellOptions || false) refresh = true;

            if (!input || refresh) {
                switch (type) {
                    case "text":
                    case "date":
                    case "datetime-local":
                    case "time":
                    case "number":
                    case "email":
                    case "tel":
                    case "url":
                        td.innerHTML = "<span></span>";
                        label = td.firstChild;
                        input = document.createElement("input");
                        input.type = type;
                        input.className = "dg-input";
                        input.value = cell.cellValue ? cell.cellValue : "";
                        td.appendChild(input);
                        input.bind("blur", function(){
                            if (cell._setValueByInput(input)) {
                                input.style.display = "none";
                                label.textContent = input.value;
                                label.style.display = "";
                                td.className = "dg-td";
                            }
                            //else input.focus();
                        });
                        break;
                    case "textarea":
                        td.innerHTML = "<span></span>";
                        label = td.firstChild;
                        input = document.createElement("textarea");
                        input.value = cell.cellValue ? cell.cellValue : "";
                        input.className = "dg-textarea";
                        td.appendChild(input);
                        input.onfocus = function(){ input.autoHeight(); };
                        input.onchange = function(){ input.autoHeight(); };
                        input.onkeyup = function(){ input.autoHeight(); };
                        input.onblur = function(){
                            if (cell._setValueByInput(input)) {
                                input.style.display = "none";
                                label.textContent = input.value;
                                label.style.display = "";
                                td.className = "dg-td";
                            }
                        };
                        break;
                    case "select":
                        var select = cell.cellSelect ? cell.cellSelect : (column.select ? column.select : "<select></select>");
                        td.innerHTML = "<span></span>";
                        label = td.firstChild;
                        td.insertAdjacentHTML("beforeend", select);
                        input = td.getElementsByTagName("select")[0];
                        input.className = "dg-select";
                        input.bind("blur", function(){
                            if (cell._setValueByInput(input.options[input.selectedIndex])) {
                                input.style.display = "none";
                                label.textContent = input.options[input.selectedIndex].text;
                                label.style.display = "";
                                td.className = "dg-td";
                            }
                        });
                        input.value = cell.cellValue;
                        break;
                    case "checkbox":
                        var checkbox = td.getElementsByTagName("input")[0];
                        if (checkbox)
                            cell._setValue(checkbox.checked);
                        break;
                    case "radio":
                        var radio = td.getElementsByTagName("input")[0], rows = this.parentRow.parentGrid.rows;
                        for (i = 0; i < rows.length; i++)
                            if (rows[i][column.name]) rows[i][column.name] = false;
                        if (rows[this.parentRow.rowIndex]) rows[this.parentRow.rowIndex][column.name] = radio.checked;
                        break;
                    default:
                        break;
                }
                cell.inputObject = input;
                cell.labelObject = label;
            }

            if (label && input) {
                input.style.display = "";
                input.focus();
                label.style.display = "none";
                td.className = "dg-td dg-td_inputting";
            }
        },

        focus: function () {
            if (_inputCellTypes.indexOf(this.cellType) >= 0)
                this._onClick();
            else {
                var td = document.getElementById(this.id);
                if(td.firstChild) td.firstChild.focus();
            }
        },
        
        setValue: function (value, ignoreOnChange) {
            if (this.inputObject) {
                this.inputObject.blur();
                this.inputObject.remove();
                this.inputObject = null;
            }
            this._setValue(value, ignoreOnChange);
            this._render(value);
            /*todo*/
            //todo exchange _render and _setvalue?
        },
        
        _setValue: function (value, ignoreOnChange) {
            var rowIndex = this.parentRow.rowIndex, column = this.parentRow.parentGrid.columns[this.columnIndex], rows = this.parentRow.parentGrid.rows, status, onchange;

            if (this.cellValue == value)
                return;

            if (rows[rowIndex]) {
                status = rows[rowIndex][_variables.rowStatus];
                rows[rowIndex][column.name] = value;
                if(status != "insert" && status != "delete")
                    rows[rowIndex][_variables.rowStatus] = "updated";
            }
            this.cellValue = this.cellText = value;

            //onchange
            if(!ignoreOnChange) {
                var onchange = column.onchange;
                if (onchange)
                    eval(onchange + "(" + rowIndex + ",'" + value + "','" + this.cellValue + "')");
            }
        },

        _setValueByInput: function (input) {
            //instantaneous validation
            if(!this.validate(input.value, true)){
                DataGrid.lock = input;
                return false;
            }

            this._setValue(input.value);
            DataGrid.lock = false;
            return true;
        },

        _render: function (value) {
            var td, input, label;
            switch (this.cellType) {
                case "checkbox":
                case "radio":
                    td = document.getElementById(this.id);
                    if (td) input = td.getElementsByTagName("input")[0];
                    if (input) input.checked = (value && value != "0");
                    break;
                case "map":
                case "select":
                    var i, column = this.parentRow.parentGrid.columns[this.columnIndex],
                        options = this.cellOptions ? this.cellOptions : column.options;
                    if (options)
                        for (i = 0; i < options.length; i++)
                            if (this.cellValue == options[i].value) {
                                this.cellText = options[i].text;
                                break;
                            }
                    td = document.getElementById(this.id);
                    if (td) {
                        label = td.getElementsByTagName("span")[0];
                        if (label) label.innerHTML = (this.cellText ? this.cellText : "&nbsp;");
                        else td.innerHTML = (this.cellText ? this.cellText : "&nbsp;");
                    }
                    break;
                case "button":
                case "image":
                case "link":
                    break;
                default:
                    td = document.getElementById(this.id);
                    if (td) {
                        label = td.getElementsByTagName("span")[0];
                        if (label) label.innerHTML = (this.cellText ? this.cellText : "&nbsp;");
                        else td.innerHTML = (this.cellText ? this.cellText : "&nbsp;");
                    }
                    break;
            }
        },

        /*DataGrid Cell validation (Non-Core)*/
        validate: function(value, showAlert){
            var column, validateFunction, validateCode, regexp, dateFormat, message;

            if(value == null || value == undefined) value = this.cellValue;
            column = this.parentRow.parentGrid.columns[this.columnIndex];
            validateCode = column[_variables.validateCode];
            validateFunction = column[_variables.validateFunction];
            message = column[_variables.validateMessage];

            //validate by validation.js
            /*var validateFormat = column.getAttribute("validateFormat")
             if (validateFormat && input && validateFormat.indexOf("{") == 0) {
             var vf = eval("(" + validateFormat + ")");
             //if (!validation.validate(vf, input))
             if (!input.validate(vf)) return false;
             }*/
            function _getDateValue(date, format, part) {
                var i, v;
                i = format.indexOf(part);
                if (i < 0) return -1;
                v = parseInt(date.substr(i, part.length), 10);
                if (isNaN(v)) return -1;
                return v;
            }

            function _parseDate(date, format){
                var dt, intYear, intMonth, intDay, intMaxDays;

                intYear = _getDateValue(date, format, "YYYY");
                if (intYear < 0){
                    intYear = _getDateValue(date, format, "YY");
                    if (intYear < 0) return null;
                    intYear += 2000;
                }

                intMonth = _getDateValue(date, format, "MM");
                if (intMonth < 1 || intMonth > 12) return null;
                intDay = _getDateValue(date, format, "DD");
                if (intDay < 1) return null;

                intMaxDays = 31;
                if (intMonth == 2){
                    intMaxDays = 28;
                    if (intYear % 4 == 0 && intYear % 100 != 0 || intYear % 400 == 0) intMaxDays = 29;
                }
                else if (intMonth == 2 || intMonth == 4 || intMonth == 6 || intMonth == 9 || intMonth == 11) intMaxDays = 30;

                if (intDay > intMaxDays) return null;
                dt = new Date(intYear, intMonth - 1, intDay);
                return dt;
            }

            //validate by function
            if(validateFunction)
                if(eval("typeof(" + validateFunction + ")") != "undefined")
                    if(!eval(validateFunction + "(" + this.parentRow.rowIndex + ", value)")){
                        if(message && showAlert) {alert(message); this.focus();}
                        return false;
                    }

            //validate by code
            if(validateCode) {
                if (validateCode.substr(0, 2) == "%D") {//Date validation (%D), not using RegExp
                    if (validateCode.substr(0, 3) == "%DN" && (value == null || value == "")) {;}
                    else {
                        dateFormat = validateCode.substring(validateCode.indexOf("(") + 1, validateCode.lastIndexOf(")"));
                        if (_parseDate(value, dateFormat) == null) {
                            if (message && showAlert) { alert(message); this.focus(); }
                            return false;
                        }
                    }
                }
                else {
                    regexp = new RegExp(validateCode);
                    if (!regexp.exec(value)){
                        if (message && showAlert) { alert(message); this.focus(); }
                        return false;
                    }
                }
            }
            return true;
        }
    };

    //public variables[classes variables are not used]
    var _variables = {
        gridDivClass: "dgroot-div", headDivClass: "dghead-div", headDivScrollClass: "dghead-div-y",
        bodyDivClass: "dgbody-div", bodyDivScrollClass: "dgbody-div-y",
        bottomDivClass: "dgbottom-div",
        dataGridClass: "dg", headDataGridClass: "dg dg-head", autoHeightClass: "autoheightrow",
        headTrClass: "dg-h-tr", bodyTrClass: "dg-tr", focusTrClass: "dg-tr_focus",
        thClass: "dg-th", sortThClass: "dg-th_sort", ascThClass: "dg-th_asc", descThClass: "dg-th_desc",
        tdClass:"dg-td", contentTdClass: "dg-td_content", inputTdClass: "dg-td_ctrl", waitingDivClass: "dg-td_wait",
        inputClass: "dg-input", textClass: "dg-text", CheckClass:"dg-checkbox", radioClass:"dg-radio", imageClass:"dg-image", buttonClass:"dg-button",
        selectClass:"dg-select", textareaClass:"dg-textarea", aClass:"dg-a", spanClass:"dg-span",
        thSpanClass: "dg-th-span",
        proClass: "dg-span_pro", emptyProClass: "dg-span_pro_alert", warningProClass: "dg-span_pro_warn", enoughProClass: "dg-span_pro_regular", restProClass: "dg-span_pro_rest", proTitleClass: "dg-span_pro_title",
        pagingClass: "datagridpaging", nextPageClass: "nextpage", prevPageClass: "prevpage",
        //defaultSourceRoot: "DATAGRID", defaultRowsTag: "ROWS", defaultRowTag: "ROW", defaultColumnTag: "COLUMN", defaultAttrTag: "ATTRIBUTE", defaultButtonsTag: "BUTTONS", defaultButtonTag: "BUTTON", defaultOptionTag: "OPTION",
        defaultColumns: "columns", defaultButtons: "buttons", defaultAttributes: "attributes", defaultRows: "rows", rowStatus: "rowstatus",
        validateFunction: "validatefunc", validateCode: "validate", validateMessage: "validatemsg", 
        autoBottomMargin: 40, headHeight: 34,
        adjPageLinkCount: 5
    },
    _ext_variables_simplifiedCss = {
        bodyDivClass: "datagridbody-div-s", bodyDivScrollClass: "datagridbody-div-y-s",
        dataGridClass: "datagrid-s datagrid", headDataGridClass: "datagrid-s datagrid datagrid-head"
    },
    hashTableCache = {},
    _inputCellTypes = ["text", "date", "datetime-local", "time", "number", "email", "tel", "url", "select", "textarea"],
    _operableCellTypes = ["text", "date", "datetime-local", "time", "number", "email", "tel", "url", "select", "textarea", "checkbox", "radio", "button"],
    _nonSortCellTypes = ["image", "button", "detail"],
    _allCellTypes = ["text", "date", "datetime-local", "time", "number", "email", "tel", "url", "select", "textarea", "checkbox", "radio", "button", "map", "label", "image", "lineno", "link", "progress", "detail"];

    window.DataGrid = DataGrid;
    document.writeln('<link rel="Stylesheet" href="' + window.getRootPath() + '/css/datagrid.3.0.css" />');

})(window, document);