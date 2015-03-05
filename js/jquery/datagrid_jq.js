(function (window, document, undefined) {
    /*DataGird Core Library
    * Json+jQuery version
    * Date: 2014-7-26
    * */
    //DataGrid
    var d1=0,d2,d3,d4=0,d5=0,d6,d7,d8,d9=0,d10=0,d11=0,d12=0;
    var DataGrid = function (id, div, design, source, ext, theme) {
        if (ext)
            DataGrid._variables = $.extend({}, DataGrid._variables||{}, ext);
        if (theme)
            switch (theme){
                case "simplified":
                    DataGrid._variables = $.extend({}, DataGrid._variables||{}, _ext_variables_simplifiedCss);
                    break;
            }
        if (typeof(design) === "string")
            design = JSON.parse(design);
        if (typeof(source) === "string")
            source = JSON.parse(source);
        this.init(id, div, design, source);
    };

    DataGrid.all = {};

    DataGrid.lock = false;

    DataGrid.prototype = {
        _parentNode: null,
        _editable: false,

        id: null,
        lineNoColumn: null,
        width: null,
        height: null,
        onNewRow: null,
        onSelect: null,
        enableRowStatus: true,//disableRowStatus: null,
        enableSorting: true,//disableSorting: null,
        sortBy: null,
        sortOrder: null,
        pagingType: null,
        pageSize: 0,
        pageNum: 0,
        pageDirection: "x",
        recordCount: 0,
        frozenHead: true,

        dataColumns: null,
        dataSource: null,
        buttons: null,
        allCells: {},
        $: null,
        $head: null,
        $foot: null,
        $top: null,
        $bottom: null,
        $paging:null,

        init: function (id, div, design, source) {
            DataGrid.all[id] = this;

            this.id = id;

            this.width = design.width;
            this.height = design.height;
            this.onNewRow = design.onNewRow;
            this.onSelect = design.onSelect;
            this.enableRowStatus = (typeof(design.enableRowStatus) === "undefined") ? true:design.enableRowStatus;
            this.enableSorting = (typeof(design.enableSorting) === "undefined") ? true:design.enableSorting;
            this.pagingType = design.pagingType;
            this.pageSize = design.pageSize;
            this.pageDirection = design.pageDirection ? design.pageDirection : "x";

            this.dataColumns = design.dataColumns;
            this.dataSource = source;
            this.buttons = design.buttons;

            this._parentNode = $("#" + div).width(this.width).addClass(DataGrid._variables.gridDivClass);

            this._initColumns();
            this._initHeight();
            this._initPaging();
            this._load();
            this._initEvents();
            //this._initHead();
            this._initGridButtons();
        },

        _initColumns: function () {
            if (!this.dataColumns || this.dataColumns.length <= 0) return;
            var i, j, dataColumn;
            for (i = 0; i < this.dataColumns.length; i++) {
                dataColumn = this.dataColumns[i];
                //type="lineno"
                if (dataColumn.type == "lineno") {
                    this.lineNoColumn = dataColumn.name;
                    continue;
                }
                switch (dataColumn.type) {//for specific type
                    case "button":
                    case "jsonform":
                        var buttonInputs = "", style, value, click;

                        if (dataColumn.buttons && typeof(dataColumn.buttons) != "string") {
                            style = "width:" + (90/dataColumn.buttons.length) + "%";
                            for (j = 0; j < dataColumn.buttons.length; j++) {
                                if(dataColumn.type == "jsonform"){
                                    value = "...";
                                    click = JsonForm ? "JsonForm.dataGridJsonForm(\"" + this.id + "\",{0},\"" + dataColumn.name + "\")" : "alert(\'Can not find JsonForm function!\')";
                                }
                                else{
                                    value = dataColumn.buttons[j].value ? dataColumn.buttons[j].value : "Button";
                                    click = dataColumn.buttons[j].onclick ? dataColumn.buttons[j].onclick + "({0})" : "";
                                }
                                if(dataColumn.buttons[j].width)
                                    style = "width:" + dataColumn.buttons[j].width + "px";
                                buttonInputs += ("<input type='button' value='" + value + "' onclick='" + click + "' style='" + style + "'/>");
                            }
                        }
                        else if(dataColumn.button) {
                            style = "width:90%"
                            value = dataColumn.button.value ? dataColumn.button.value : "Button";
                            click = dataColumn.button.onclick ? dataColumn.button.onclick + "({0})" : "";
                            buttonInputs += ("<input type='button' value='" + value + "' onclick='" + click + "' style='" + style + "'/>");

                        }
                        dataColumn.buttonInputs = buttonInputs;
                        break;
                    case "hidden":
                        dataColumn.type = "label";
                        dataColumn.hidden = 1;
                        break;
                    case "select":
                        if (typeof(dataColumn.options) === "object") {
                            dataColumn.select = "<select>";
                            for (j = 0; j < dataColumn.options.length; j++)
                                dataColumn.select += ("<option value='{0}'>{1}</option>").format(dataColumn.options[j].value, dataColumn.options[j].text);
                            dataColumn.select += "</select>";
                        }
                        break;
                    default:
                        break;
                }
                if(!this._editable){
                    switch (dataColumn.type) {//for specific type["text", "date", "datetime-local", "time", "number", "email", "tel", "url", "select", "textarea", "checkbox", "radio", "button", "map", "label", "image", "lineno", "link", "progress", "detail"];
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
            }
        },

        _initHeight:function(){
            if (this.height == "auto"){
                //window.document.body.clientHeight;
                var height, top = this._parentNode.offset().top;
                if(window.top.calcFrameHeight) height = window.top.calcFrameHeight();
                else height = $(window).height();
                this.height = height - top - DataGrid._variables.autoBottomMargin;
            }
        },

        _initPaging: function () {
            if(!this.pageSize) return;
            this.pageSize = parseInt(this.pageSize);
            if(!this.pageSize || isNaN(this.pageSize)) return;
            if(!this.pagingType) this.pagingType = "online";
            if(this.pageDirection == "y"){
                /*var datagrid = this, div = this.$, table = this.$.children("table"), tableHeight = table.height(), divHeight = div.height(), currScrollTop,
                 isLoading = false, isEof = false;
                 div.scroll(function () {
                 if ((currScrollTop == div.scrollTop()) || isLoading || isEof) return;
                 currScrollTop = div.scrollTop();
                 var bottom = (tableHeight - divHeight <= currScrollTop);
                 if (bottom) {
                 var tr = datagrid.createContentRow($("<div>&nbsp;</div>").addClass(DataGrid._variables.waitingDivClass));
                 isLoading = true;
                 var rowsCount = datagrid.dataSource.length;

                 var strParas = {
                 dataView: datagrid.dataView,
                 defaultColumn: datagrid.defaultColumn,
                 sortBy: datagrid.sortBy,
                 sortOrder: datagrid.sortOrder,
                 pageSize: datagrid.pageSize,
                 pageNum: datagrid.pageNum++,
                 recordCount: datagrid.recordCount,
                 disableSorting: datagrid.disableSorting,
                 dataColumns: datagrid.dataColumns,
                 callMethod: "GetDataSource"
                 };
                 service.serviceStackPost("datagrid", strParas, function (datasource) {
                 tr.remove();
                 for (var i = 0; i < datasource.length; i++) {
                 datagrid.dataSource[rowsCount + i] = datasource[i];
                 }
                 var html = datagrid._generateRows(rowsCount, datagrid.dataSource.length - rowsCount);
                 $(html).appendTo(table);
                 isLoading = false;
                 isEof = (datagrid.pageSize * datagrid.pageNum >= datagrid.recordCount);
                 tableHeight = table.height();
                 });
                 }
                 })*/
            }
            else{
                this.$paging = $("<div class='" + DataGrid._variables.bottomDivClass + "'></div>");//.appendTo(this._parentNode);
                //<ROWS pageno="1" totalpages="2" totalrows="11"></ROWS>
                if(this.pagingType == "online"){
                    /*this.pageNum = parseInt(this.dataSourceSet.attr("pageno"));
                    this.pageCount = parseInt(this.dataSourceSet.attr("totalpages"));
                    this.recordCount = parseInt(this.dataSourceSet.attr("totalrows"));*/
                }
                else{
                    this.pageNum = 1;
                    this.pageCount = Math.ceil(this.dataSource.length/this.pageSize);
                    this.recordCount = this.dataSource.length;
                }

                var datagrid = this;
                var gotoPage = function(newPageNo){
                    newPageNo = parseInt(newPageNo);
                    if(isNaN(newPageNo) || newPageNo < 1 || newPageNo > datagrid.pageCount) return;
                    if(datagrid.pagingType == "online"){
                        var form = document.forms[0];
                        if (!form.pageno){ alert("pageno field is not defined in form."); return; }
                        form.pageno.value = newPageNo;
                        form.submit();
                    }
                    else{//offline
                        datagrid.pageNum = newPageNo;
                        $("#" + datagrid.id + "_paginglinks").html(generatePagingLinks(datagrid.pageCount, DataGrid._variables.adjPageLinkCount, newPageNo)).find("a").click(function(e){
                            gotoPage(e.target.innerHTML);
                        });
                        $("#" + datagrid.id + "_paginginput").val(newPageNo);
                        datagrid._reload();
                    }
                };
                var generatePagingLinks = function(t, a, p){
                    var r=[], html="", ha, i;
                    ha = Math.floor(a/2);
                    if(t <= a+1) for(i=1;i<=t;i++) r.push(i);
                    else if (p<=(ha + 1)) for(i=1;i<=a;i++) r.push(i);
                    else if (p<=t-ha) for(i=p-ha;i<=p+ha;i++) r.push(i);
                    else for(i=t-a+1;i<=t;i++) r.push(i);
                    if(r.length==0) return;
                    for(i=0;i< r.length;i++){
                        if(r[i] == p) html+= "<span>{0}</span> ".format(r[i]);
                        else html +=("<a>{0}</a> ".format(r[i]));
                    }
                    if(r[0]>2) html = "... " + html;
                    if(r[0]>1) html = "<a>1</a> " + html;
                    if(r[r.length - 1]<t-1) html+= "... ";
                    if(r[r.length - 1]<t) html += "<a>{0}</a> ".format(t);
                    return html;
                };

                var t = this.pageCount, a = DataGrid._variables.adjPageLinkCount, p = this.pageNum, html;
                if(isNaN(t) || isNaN(a) || isNaN(p)) return;
                html = "<span id='{0}'>{1}</span>".format(datagrid.id + "_paginglinks", generatePagingLinks(t, a, p));
                html = "<span id='{0}' class='{1}' {2}>&nbsp;</span> ".format(datagrid.id + "_pagingprev", DataGrid._variables.prevPageClass, /*p==1?"style='display:none'":*/"") + html;
                html += "<span id='{0}' class='{1}' {2}>&nbsp;</span> ".format(datagrid.id + "_pagingnext", DataGrid._variables.nextPageClass, /*p==t?"style='display:none'":*/"");
                //if(t>a+2)
                html+="<input id='{0}' type='text' value={1}> / {2} ".format(datagrid.id + "_paginginput", p, t);//<input type='button' value='GO'>
                html = "<div class='{0}' unselectable='none' onselectstart='return false;'>{1}</div>".format(DataGrid._variables.pagingClass ,html);

                this.$paging.html(html);
                this.$paging.find("a").click(function(e){
                    gotoPage(e.target.innerHTML);
                });
                this.$paging.find("span[class]").click(function(e){
                    var newPageNo;
                    if(e.target.id == datagrid.id + "_pagingprev") newPageNo = datagrid.pageNum-1;
                    else if(e.target.id == datagrid.id + "_pagingnext") newPageNo = datagrid.pageNum+1;
                    else return;
                    gotoPage(newPageNo);
                });
                this.$paging.find("#" + this.id + "_paginginput").keydown(function(e){
                    if (e.keyCode == 13) {
                        var newPageNo = parseInt(this.value);
                        if(isNaN(newPageNo) || newPageNo < 1 || newPageNo > this.pageCount){e.value = ""; return;}
                        gotoPage(newPageNo);
                    }
                });
            }
        },

        _initEvents: function () {
            var datagrid = this, tables, td, cell;

            //on click cells
            //if(this._editable)
            $("#" + this.id).click(function (e) {
                if (DataGrid.lock) {
                    DataGrid.lock.focus();
                    return;
                }
                if (e.target.nodeName.toLowerCase() == "span")
                    td = e.target.parentNode;
                else if (e.target.nodeName.toLowerCase() == "input" && (e.target.type == "radio" || e.target.type == "checkbox"))
                    td = e.target.parentNode;
                else if (e.target.nodeName.toLowerCase() == "td")
                    td = e.target;
                else return;
                cell = datagrid.allCells[td.id];
                cell._onClick();

                //onSelect
                if(datagrid.onSelect && cell)
                    eval(datagrid.onSelect + "(" + cell.parentRow.rowIndex + ")")
            });

            //on click head
            this.$head.children("table").click(function (e) {
                if (DataGrid.lock) {
                    DataGrid.lock.focus();
                    return;
                }
                var nodeName = e.target.nodeName.toLowerCase();
                if (nodeName == "th" || nodeName == "span") {
                    var th = (nodeName == "span") ? e.target.parentNode : e.target, thSibling = th.parentNode.childNodes, i;
                    if(th.className == "") return;
                    cell = datagrid.allCells[th.id];
                    var isAsc = e.offsetY < (th.clientHeight / 2);
                    datagrid.sort(datagrid.dataColumns[cell.columnIndex].name, isAsc);
                    $("." + DataGrid._variables.ascThClass).attr("class", DataGrid._variables.sortThClass);
                    $("." + DataGrid._variables.descThClass).attr("class", DataGrid._variables.sortThClass);
                    th.className = isAsc ? DataGrid._variables.ascThClass : DataGrid._variables.descThClass;
                }
                else if(nodeName == "input" && e.target.type.toLowerCase() == "checkbox"){
                    var i, value, rowCell, checkboxName;
                    cell = datagrid.allCells[e.target.parentNode.parentNode.id];
                    if(!cell) return;
                    value = (e.target.checked ? "1" : "0");
                    for (i = 0; i<datagrid.dataSource.length; i++){
                        rowCell = datagrid.getDataGridCell(i, cell.columnIndex);
                        if(rowCell) rowCell._setValue(value);
                    }
                    checkboxName = datagrid.id + "_" + datagrid.dataColumns[cell.columnIndex].name;
                    $("input[type='checkbox'][name='" + checkboxName + "']").prop("checked", e.target.checked);
                }
            });


            //on key down
            if (this._editable) {
                var getNextInputCell = function (td) {
                    var nextTd = td.nextSibling;
                    if (!nextTd && td.parentNode.nextSibling) nextTd = td.parentNode.nextSibling.firstChild;
                    if (!nextTd) return null;
                    cell = datagrid.allCells[nextTd.id];
                    if ($.inArray(cell.cellType, _operableCellTypes) >= 0 && nextTd.style.display != "none" && (!datagrid.dataColumns[cell.columnIndex].isPk || datagrid.PKEditable))
                        return nextTd;
                    else return getNextInputCell(nextTd);
                };
                var getPreviousInputCell = function (td) {
                    var preTd = td.previousSibling;
                    if (!preTd && td.parentNode.previousSibling) preTd = td.parentNode.previousSibling.lastChild;
                    if (!preTd) return null;
                    cell = datagrid.allCells[preTd.id];
                    if ($.inArray(cell.cellType, _operableCellTypes) >= 0 && preTd.style.display != "none" && !datagrid.dataColumns[cell.columnIndex].isPk || datagrid.PKEditable)
                        return preTd;
                    else return getPreviousInputCell(preTd);
                };

                $("#" + this.id).keydown(function (e) {
                    if ($.inArray(e.keyCode, [13, 27]) < 0) return;
                    if ($.inArray(e.target.nodeName.toLowerCase(), ["input", "select", "textarea"]) < 0) return;
                    td = e.target.parentNode;
                    cell = datagrid.allCells[td.id];
                    if (cell.inputObject)
                        cell.inputObject.blur();
                    if (DataGrid.lock) {
                        DataGrid.lock.focus();
                        return false;
                    }

                    switch (e.keyCode) {
                        case 13:
                            td = e.shiftKey ? getPreviousInputCell(td) : getNextInputCell(td);
                            if (td) {
                                cell = datagrid.allCells[td.id];
                                cell.focus();
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
            if (this.frozenHead){
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

        _initGridButtons: function(){
            if(!this.buttons || this.buttons.length <= 0) return;
            var i, location, caption, onclick, onclickFn, div;
            for (i=0;i<this.buttons.length;i++){
                location = this.buttons[i].location;
                caption = this.buttons[i].value;
                onclick = this.buttons[i].onclick;
                if(location == "top"){
                    if(this.$top == null) this.$top = $("<div></div>").prependTo(this._parentNode);
                    div = this.$top;
                }
                else{
                    if(this.$bottom == null) this.$bottom = $("<div class='" + DataGrid._variables.bottomDivClass + "'></div>").appendTo(this._parentNode);
                    div = this.$bottom;
                }
                /*onclickFn = function(){
                    var datagrid = this;
                    eval(onclick + "(datagrid)");
                }*/
                if(onclick && onclick.length > 0 && onclick.indexOf("(") < 0)
                    onclick += ("(DataGrid.all[\"{0}\"])").format(this.id);
                $("<input type='button' value='" + caption + "' onclick='" + onclick + "'>").appendTo(div);
            }
        },

        _load: function () {
            if (this.lineNoColumn)
                this._allocLineNo();//this._sortDataSource(this.lineNoColumn, true);

            var headRows = this._generateHeadRows(),
                bodyRows = this._generateBodyRows();

            this.$head = $(("<div class='{0}'><table class='{1}'><thead>{2}</thead></table></div>")
                .format(this.height ? DataGrid._variables.headDivScrollClass : DataGrid._variables.headDivClass, DataGrid._variables.headDataGridClass, headRows)).appendTo(this._parentNode);
            this.$ = $(("<div class='{0}'><table id='{1}' class='{2}'><thead>{3}</thead><tbody>{4}</tbody></table></div>")
                .format(this.height ? DataGrid._variables.bodyDivScrollClass : DataGrid._variables.bodyDivClass, this.id, (this._editable?"": DataGrid._variables.autoHeightClass + " ") + DataGrid._variables.dataGridClass, headRows, bodyRows)).css("max-height", this.height).appendTo(this._parentNode);
            if(this.$paging) this.$paging.appendTo(this._parentNode);
        },

        _reload: function () {
            this.allCells = null; this.allCells = {};
            var headRows = this._generateHeadRows(),
                bodyRows = this._generateBodyRows();
            if (this.$) this.$.find("tbody").html(bodyRows);
        },

        reload: function (newSource) {
            var objSource = newSource;
            if (typeof(objSource) === "string")
                objSource = JSON.parse(objSource);
            this.dataSource = objSource
            this._reload();
        },

        _generateRowCells: function (rowIndex) {
            var row = new DataGridRow(this, rowIndex), html = row.html;
            if (!html) return null;
            return html.substring(html.indexOf("<td"), html.lastIndexOf("</td>") + 4);
        },

        _generateHeadRows: function(){
            return this._generateRows(-1, 1);
        },

        _generateBodyRows: function(){
            if(this.pageSize && !isNaN(this.pageSize) && this.pagingType == "offline"){
                var start = (this.pageNum - 1) * this.pageSize, length = this.pageSize, maxNum = Math.ceil(this.dataSource.length/this.pageSize);
                if(this.pageNum > maxNum) return "";
                if(this.pageNum == maxNum) length = this.dataSource.length - ((maxNum-1)*this.pageSize);
                return this._generateRows(start, length);
            }
            return this._generateRows(0, this.dataSource.length);
        },

        _generateRows: function (start, length) {
            //if (start == undefined || start < -1 || start > this.dataSource.length) return "";
            //if (length == undefined) length = this.dataSource.length - start;
            var row, html = "";
            for (var i = start; i < (start + length); i++) {
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
            var start = this.dataSource.length, i, html = "", row, trs, tbody = this.$.find("tbody");
            tbody.children("." + DataGrid._variables.focusTrClass).removeClass(DataGrid._variables.focusTrClass);
            for (i = 0; i < newRowSource.length; i++) {
                this.dataSource[start + i] = newRowSource[i];
                this.dataSource[start + i][_rowStatus] = "insert";
                row = new DataGridRow(this, start + i);
                html += row.html;
            }
            trs = $(html).appendTo(tbody).addClass(DataGrid._variables.focusTrClass);
            if (this.onNewRow)
                for (i = 0; i < trs.length; i++)
                    eval(this.onNewRow + "($(trs[i]))");
            if (speed) {
                trs.css("opacity", 0).animate({opacity: 1}, speed * 3);
                this.$.animate({ scrollTop: (trs[0].offsetTop - DataGrid._variables.headHeight) }, speed);
            }
            else
                this.$.scrollTop(trs[0].offsetTop - DataGrid._variables.headHeight);
        },*/

        /*create a new row at the bottom; if [position] is not null, move the new row to that position
        * position: the target position of the new row;
        * speed: the speed of jQuery animation
        * */
        createNewRow: function (position, speed) {
            var rowXml = "", i, newRow, newRowSource = {}, tr ,tb;
            if(this.lineNoColumn){
                var newLineNo = 1;
                for (i=0;i<this.dataSource.length;i++)
                    if(this.dataSource[i][_rowStatus] != "delete")
                        newLineNo++;
                newRowSource[this.lineNoColumn] = newLineNo;
            }
            for(i=0; i<this.dataColumns.length; i++){//set default values
                if(this.dataColumns[i].default)
                    newRowSource[this.dataColumns[i].name] = this.dataColumns[i].default;
                else if(this.dataColumns[i].type == "checkbox")
                    newRowSource[this.dataColumns[i].name] = 0;
            }
           newRowSource[_rowStatus] = "insert";

            if(position == undefined || position > this.dataSource.length || isNaN(position))
                position = this.dataSource.length;
            else if (position < 0) position = 0;

            this.dataSource.push(newRowSource);

            newRow = new DataGridRow(this, this.dataSource.length - 1), tb = this.$.find("tbody");
            tr = $(newRow.html).appendTo(tb);

            if(position < this.dataSource.length - 1){
                this.moveRowTo(this.dataSource.length - 1, position);
                tr = $(tb.find("tr")[position]);
            }

            this._onCreateRow(position, tr, speed);
            return position;
        },

        /*create a new row, and insert to a certain position
        * position: the target position of the new row;
        * speed: the speed of jQuery animation
        * */
        createNewRow1: function(position, speed){
            //reload, but not move row,
        },

        createContentRow: function (child, position, speed) {
            var tr = $("<tr type='content'></tr>"),
                td = $("<td colspan='" + this.dataColumns.length + "'></td>").appendTo(tr);
            if (child)
                child.appendTo(td);
            if (position)
                tr.insertBefore(this.getCell(position, 0).parent()[0]);
            else
                tr.appendTo(this.$.find("tbody"));
            this._onCreateRow(position, tr, speed);
            return tr;
        },

        _onCreateRow: function (position, tr, speed) {
            if (!tr) return;
            if(!speed) speed = 300;
            if (this.onNewRow)
                eval(this.onNewRow + "(position, tr)");
            tr.siblings("." + DataGrid._variables.focusTrClass).removeClass(DataGrid._variables.focusTrClass);
            tr.addClass(DataGrid._variables.focusTrClass);
            if (speed) {
                tr.css("opacity", 0).animate({opacity: 1}, speed * 3);
                this.$.animate({ scrollTop: (tr[0].offsetTop - DataGrid._variables.headHeight) }, speed);
            }
            else
                this.$.scrollTop(tr[0].offsetTop - DataGrid._variables.headHeight);
        },

        _findRows: function(columnIndex, value, firstN){//Find rows in data source layer;
            var i, rowIndexes=[], cellValue;
            if (!isNaN(columnIndex)) columnIndex = this.dataColumns[columnIndex].name;
            if(columnIndex)
                for (i = 0; i < this.dataSource.length; i++) {
                    if(this.getRowStatus(i) == "delete") continue;
                    cellValue = this.dataSource[i][columnIndex];
                    if(cellValue == value){
                        rowIndexes.push(i);
                        if(firstN && rowIndexes.length >= firstN) break;
                    }
                }
            return rowIndexes;
        },

        findRows: function(columnIndex, value, firstN){//Find rows in business layer;
            var i, rowIndexes=[];
            if (isNaN(columnIndex))
                columnIndex = this.getColumnIndexByName(columnIndex);
            if(columnIndex >= 0)
                for (i = 0; i < this.dataSource.length; i++) {
                    if(this.getRowStatus(i) == "delete") continue;
                    if(this.getCellValue(i, columnIndex) == value){
                        rowIndexes.push(i);
                        if(firstN && rowIndexes.length >= firstN) break;
                    }
                }
            return rowIndexes;
        },

        findRowsByWhere: function (where, firstN) {//Not recommended; Find rows in presentation layer; where's sample: "[name1]>=value1 && ([name2]==value2 || [name3]==value3)";
            var i, j, clauseTemplate = where, tempColumns = [], wColumns = [], columnIndexes=[], rowIndexes = [];
            if(typeof(where) != "string") return null;
            tempColumns = where.split("[");
            for (i = 0;i<tempColumns.length;i++){
                if(tempColumns[i].length <= 0) continue;
                if(tempColumns[i].indexOf("]") <= 0) continue;
                var columnName = tempColumns[i].substr(0, tempColumns[i].indexOf("]"));
                wColumns.push(columnName);
            }
            for (i = 0;i<wColumns.length;i++){//do not use "this.getCellValue()" to avoid multi-loop
                var columnIndex = wColumns[i];
                if (isNaN(columnIndex))
                    columnIndex = this.getColumnIndexByName(columnIndex);
                /*for (j = 0; j < this.dataColumns.length; j++)
                 if (this.dataColumns[j].name.toLowerCase() == wColumns[i].toLowerCase()) {
                 //columnIndexes.push(j);
                 columnIndex = j;
                 break;
                 }*/
                clauseTemplate = clauseTemplate.replace(wColumns[i], columnIndex);
            }
            for (i = 0; i < this.dataSource.length; i++) {
                //if(tempColumns[i].indexOf("]") <= 0) continue;
                var preCellID = this.id + "_" + i + "_"
                var clause = clauseTemplate.replace(/\[/g, "$(\"#" + preCellID).replace(/\]/g, "\").text()");
                if(eval(clause)){
                    rowIndexes.push(i);
                    if(firstN && rowIndexes.length >= firstN) break;
                }
            }
            //this.id + "_" + rowIndex + "_" + columnIndex
            return rowIndexes;
        },

        findDuplicateRow: function(columnIndexes, spliter){//Find duplicate rows in business layer;
            if(!columnIndexes || columnIndexes.length <=0) return null;
            var columns, rowValues = [], rowValue, cellValue, i, j;
            if(!spliter) spliter = "|";
            if(typeof(columnIndexes) === "string") columns = columnIndexes.split(spliter);
            else columns = columnIndexes;
            for (i=0; i < columns.length; i++)
                if (isNaN(columns[i]))
                    columns[i] = this.getColumnIndexByName(columns[i]);
            for (i=0; i < this.dataSource.length; i++){
                if(this.getRowStatus(i) == "delete") continue;
                rowValue = "";
                for (j=0; j < columns.length; j++){
                    cellValue = this.getCellValue(i, columns[j]);
                    if(cellValue) rowValue += ((cellValue?cellValue:"") + spliter);
                }
                if($.inArray(rowValue, rowValues) < 0)
                    rowValues.push(rowValue);
                else return i;
            }
            return null;
        },

        getFocusedRow: function(){
            var td = this.$.find("." + DataGrid._variables.focusTrClass + " td"), cell, row;
            if(td.length <= 0) return null;
            cell = this.allCells[td[0].id];
            if(cell) row = cell.parentRow;
            if(row) return row.rowIndex;
            return null;
        },

        getRowStatus: function(rowIndex){
            //return this.getCell(rowIndex, 0).parent().attr(_rowStatus); not work
            if(this.dataSource[rowIndex])
                return this.dataSource[rowIndex][_rowStatus];
            return null;
        },

        deleteRow: function (rowIndex, speed) {
            if (!this.dataSource[rowIndex]) return;
            this.dataSource[rowIndex][_rowStatus] = "delete";
            var datagrid = this;
            //this.$.find("tbody").children("tr:eq(" + rowIndex + ")").fadeOut(500, function(){this.remove()});
            this.getCell(rowIndex, 0).parent().fadeOut(speed ? speed : 0, function () {
                Xml.remove(this);
                if(datagrid.lineNoColumn) datagrid.allocLineNo();
            });
        },

        deleteRows: function (rowIndexes, speed){
            if (typeof(rowIndexes) === "string")
                rowIndexes = rowIndexes.split(",");
            if(!this.lineNoColumn)
                for (var i = 0; i<rowIndexes.length; i++)
                    this.deleteRow(rowIndexes[i], speed);
            else{//if lino No column exists, should allocate line No after deleting.
                for (var i = 0; i<rowIndexes.length; i++){
                    if (!this.dataSource[rowIndexes[i]]) return;
                    this.dataSource[rowIndexes[i]][_rowStatus] =  "delete";
                    Xml.remove(this.getCell(rowIndexes[i], 0).parent());
                }
                this.allocLineNo();
            }
        },

        deleteRowsByWhere: function(where, speed){//Not recommended; Find rows in presentation layer and delete them;
            var rowIndexes = this.findRowsByWhere(where);
            if(rowIndexes)
                this.deleteRows(rowIndexes, speed);
        },

        filterRows: function (columnIndex, value, iterative) {//iterative - false: base on all data source; true: base on last filter result
            if(!iterative && this.initDataSource){
                this.dataSource = JSON.parse(this.initDataSource);
                //this._reload(); //need not _reload() if using _findRows() instead of findRows()
            }
            if(!this.initDataSource)
                this.initDataSource = JSON.stringify(this.dataSource);
            var newSourceRows = [], i, rowIndexes = this._findRows(columnIndex, value);//this.findRows(columnIndex, value);
            if(!rowIndexes) return;
            for (i = 0; i < rowIndexes.length; i++)
                newSourceRows.push(this.dataSource[rowIndexes[i]]);
            this.dataSource = newSourceRows;
            this._reload();
        },

        filterRowsByWhere: function(where){

        },

        disableRowsCell:function(rowIndexes, columnIndex){
            if(!rowIndexes) return;
            if (isNaN(columnIndex))
                columnIndex = this.getColumnIndexByName(columnIndex);
            var i, j, td, inputs;
            for (i = 0; i < rowIndexes.length; i++){
                td = document.getElementById(this.getCellId(rowIndexes[i], columnIndex));
                if(!td || td.childNodes.length <= 0) continue;
                inputs = td.getElementsByTagName("input");
                if(inputs.length <= 0) continue;
                for(j=0;j<inputs.length;j++){
                    inputs[j].disabled = true;
                }
            }
        },

        clearAllRows: function(){
            this.dataSource = {};
            this._reload();
        },

        _exchange2Rows: function(rowIndex1, rowIndex2, ignoreLineNo){
            if (rowIndex1 < 0 || rowIndex1 > this.dataSource.length - 1 || rowIndex2 < 0 || rowIndex2 > this.dataSource.length - 1)
                return;
            var lineNo = this.lineNoColumn, tempRow1 = this.dataSource[rowIndex1], tempRow1LineNo, tempRow2LineNo,
                tempRow1Status = this.dataSource[rowIndex1][_rowStatus], tempRow2Status = this.dataSource[rowIndex2][_rowStatus];
            if(!ignoreLineNo && lineNo){
                tempRow1LineNo = this.dataSource[rowIndex1][lineNo];
                tempRow2LineNo = this.dataSource[rowIndex2][lineNo];
            }
            this.dataSource[rowIndex1] = this.dataSource[rowIndex2];
            if(tempRow2Status) this.dataSource[rowIndex1][_rowStatus] = tempRow2Status;
            else this.dataSource[rowIndex1][_rowStatus] = undefined;

            this.dataSource[rowIndex2] = tempRow1;
            if(tempRow1Status) this.dataSource[rowIndex2][_rowStatus] = tempRow1Status;
            else this.dataSource[rowIndex2][_rowStatus] = undefined;
            if(!ignoreLineNo && lineNo){
                if (tempRow1LineNo) this.dataSource[rowIndex1][lineNo] = tempRow1LineNo;
                if (tempRow2LineNo) this.dataSource[rowIndex2][lineNo] = tempRow2LineNo;
                tempRow1Status = this.dataSource[rowIndex1][_rowStatus];
                tempRow2Status = this.dataSource[rowIndex2][_rowStatus];
                if(tempRow1Status != "insert" && tempRow1Status != "delete")
                    this.dataSource[rowIndex1][_rowStatus] = "update";
                if(tempRow2Status != "insert" && tempRow1Status != "delete")
                    this.dataSource[rowIndex2][_rowStatus] = "update";
            }
        },

        exchange2Rows: function (rowIndex1, rowIndex2, speed) {
            if (this.dataSource[rowIndex1][_rowStatus] == "delete" || this.dataSource[rowIndex2][_rowStatus] == "delete") {
                //alert("one of the 2 rows has been deleted");
                return;
            }
            if(!speed) speed = 0;
            var datagrid = this, tr1 = this.getCell(rowIndex1, 0).parent(), tr2 = this.getCell(rowIndex2, 0).parent();
            this._exchange2Rows(rowIndex1, rowIndex2);
            tr2.siblings("." + DataGrid._variables.focusTrClass).removeClass(DataGrid._variables.focusTrClass);
            tr1.animate({opacity: 0}, speed);
            tr2.animate({opacity: 0}, speed, function () {
                tr1.html(datagrid._generateRowCells(rowIndex1)).animate({opacity: 1}, speed);
                tr2.html(datagrid._generateRowCells(rowIndex2)).addClass(DataGrid._variables.focusTrClass).animate({opacity: 1}, speed);
            })
        },

        moveRow: function(rowIndex, step){
            if(rowIndex < 0 || rowIndex >= this.dataSource.length || !step || step == 0) return;
            var direction = (step > 0 ? 1 : -1), base = rowIndex, target = rowIndex + direction, tr;
            while(this.dataSource[target] && Math.abs(step) > 0){
                if(this.dataSource[target][_rowStatus] != "delete"){
                    this._exchange2Rows(base, target);
                    this.getCell(base, 0).parent().html(this._generateRowCells(base));
                    step = step - direction;
                    base = target;
                }
                target = target + direction;
            }
            if(!this.dataSource[base])
                base = base - direction;
            tr = this.getCell(base, 0).parent();
            tr.siblings("." + DataGrid._variables.focusTrClass).removeClass(DataGrid._variables.focusTrClass);
            tr.html(this._generateRowCells(base)).addClass(DataGrid._variables.focusTrClass);
        },

        moveRow1: function(){
            //not exchange source, use insertXmlBefore and reload;
        },

        moveRowTo: function(startRowIndex, endRowIndex){
            if(isNaN(startRowIndex) || isNaN(endRowIndex)) return;
            if (this.dataSource[endRowIndex][_rowStatus] == "delete" || this.dataSource[startRowIndex][_rowStatus] == "delete") return;
            var direction = ((endRowIndex - startRowIndex) > 0 ? 1 : -1), base = startRowIndex, target = base+ direction, tr;
            while(this.dataSource[target] && base != endRowIndex){
                if(this.dataSource[target][_rowStatus] != "delete"){
                    this._exchange2Rows(base, target);
                    this.getCell(base, 0).parent().html(this._generateRowCells(base));
                    base = target;
                }
                target = target + direction;
            }
            if(!this.dataSource[base])
                base = base - direction;
            tr = this.getCell(base, 0).parent();
            tr.siblings("." + DataGrid._variables.focusTrClass).removeClass(DataGrid._variables.focusTrClass);
            tr.html(this._generateRowCells(base)).addClass(DataGrid._variables.focusTrClass);
        },

        getColumnIndexByName: function(columnName){
            var name;
            for (var i = 0; i < this.dataColumns.length; i++){
                name = this.dataColumns[i].name;
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
            return $("#" + cellId);
        },

        getDataGridCell: function (rowIndex, columnIndex) {
            var cellId = this.getCellId(rowIndex, columnIndex);
            return this.allCells[cellId];
        },

        getCellValue: function (rowIndex, columnIndex) {
            var cell = this.getDataGridCell(rowIndex, columnIndex);
            if(cell) return cell.cellValue;
            else return undefined;
        },

        setCellValue: function (rowIndex, columnIndex, value) {
            var cell = this.getDataGridCell(rowIndex, columnIndex);
            if(cell) cell.setValue(value);
        },

        setRowsCellValue: function (rowIndexes, columnIndex, value){
            if (typeof(rowIndexes) === "string")
                rowIndexes = rowIndexes.split(",");
            if (isNaN(columnIndex))
                columnIndex = this.getColumnIndexByName(columnIndex);
            if(columnIndex >= 0)
                for (var i = 0; i<rowIndexes.length; i++){
                    var cell = this.getDataGridCell(rowIndexes[i], columnIndex);
                    if(cell) cell.setValue(value);
                }
        },

        setAllRowsCellValue: function(columnIndex, value){
            if (isNaN(columnIndex))
                columnIndex = this.getColumnIndexByName(columnIndex);
            for (var i = 0; i<this.dataSource.length; i++){
                var cell = this.getDataGridCell(i, columnIndex);
                if(cell) cell.setValue(value);
            }
        },

        setRowsCellValueByWhere: function(where, columnIndex, value){//Not recommended; Find rows in presentation layer and set their value;
            var rowIndexes = this.findRowsByWhere(where);
            if (isNaN(columnIndex))
                columnIndex = this.getColumnIndexByName(columnIndex);
            if(rowIndexes)
                this.setRowsCellValue(rowIndexes, columnIndex, value);
        },

        focusCell: function(rowIndexes, columnIndex){
            var cell = this.getDataGridCell(rowIndexes, columnIndex);
            if(cell) cell.focus();
        },

        _sort: function (columnIndex, isAsc) {
            var compare = function (a, b) {
                if (!a && !b) return false;
                if (!a) return !isAsc;
                if (!b) return isAsc;
                if(a==b) return false;
                if (!isNaN(a) && !isNaN(b)) {
                    a = parseFloat(a);
                    b = parseFloat(b);
                }
                else {
                    a = a.toLowerCase();
                    b = b.toLowerCase();
                }
                return isAsc ? (a > b) : (a < b);
            };

            if (!isNaN(columnIndex))
                columnIndex = this.dataColumns[columnIndex].name;
            if (!columnIndex) return;

            var i, j, tempRow;
            for (i=1; i<this.dataSource.length;i++){
                j = i - 1;
                tempRow = this.dataSource[i];
                while(j >= 0 && compare(this.dataSource[j][columnIndex], tempRow[columnIndex])){
                    this.dataSource[j + 1] = this.dataSource[j];
                    j--;
                }
                this.dataSource[j + 1] = tempRow;
            }
        },

        sort: function (columnName, isAsc) {
            //var d1 = new Date();
            this._sort(columnName, isAsc);
            this._allocLineNo();
            this._reload();
            //var 24 = new Date();alert(d2-d1);

        },

        _allocLineNo: function (startRow, startNo) {
            if (!this.lineNoColumn) return;
            if (startRow == undefined || startRow < 0) startRow = 0;
            if (startNo == undefined) startNo = startRow + 1;
            var i, lnColumn, currNo = startNo;
            for (i = startRow; i < this.dataSource.length; i++){
                if(this.dataSource[i][_rowStatus] == "delete") continue;
                this.dataSource[i][this.lineNoColumn] = currNo++;
            };
        },

        allocLineNo: function (startRow, startNo){
            if (!this.lineNoColumn) return;
            if (startRow == undefined || startRow < 0) startRow = 0;
            if (startNo == undefined) startNo = startRow + 1;
            //this._allocLineNo(startRow, startNo);

            var columnIndex = this.getColumnIndexByName(this.lineNoColumn),
                i, cell, cellDom, currNo = startNo;

            for (i = startRow; i < this.dataSource.length; i++){
                if(this.dataSource[i][_rowStatus] == "delete") continue;
                cell = this.getDataGridCell(i, columnIndex);
                cell.setValue(currNo++);
            };

        },

        refreshColumn: function(columnIndex, startRow, length){


        },

        getDataSource: function (root){
            return JSON.stringify(this.dataSource);
        },

        save: function(){
            /*var changedRows = [], i, status;
            for(i=0;i<this.dataSource.length;i++){
                status = this.dataSource[i][_rowStatus];
                if(status == "insert" || status == "delete" || status == "update")
                    changedRows.push(this.dataSource[i]);
            }
            var strParas = {
                dataView: this.dataView,
                dataColumns: this.dataColumns,
                callMethod: "Save",
                dataSource: changedRows
            };
            var datagrid = this;
            service.serviceStackPost("datagrid", strParas, function (datasource) {

                datagrid._reload();
            });*/
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
            this.parentGrid = parentGrid;
            this.rowIndex = rowIndex;

            var dataColumns = parentGrid.dataColumns;
            if (rowIndex >= parentGrid.dataSource.length) { //new row
                /*var newRow = "", i;
                if(parentGrid.lineNoColumn){//alloc new line No.
                    var maxNo = parentGrid.dataSource[parentGrid.dataSource.length - 1][parentGrid.lineNoColumn];
                    maxNo = parseInt(maxNo);
                    if(isNaN(maxNo)) maxNo = 0;
                    newHtml += ("<{0}>{1}</{0}>").format(parentGrid.lineNoColumn, maxNo + 1);
                }
                for(i=0; i<dataColumns.length; i++){//set default values
                    if(dataColumns[i].default)
                        newHtml += ("<{0}>{1}</{0}>").format(dataColumns[i].name, dataColumns[i].default);
                    else if(dataColumns[i].type == "checkbox")
                        newHtml += ("<{0}>{1}</{0}>").format(dataColumns[i].name, "0");
                }
                parentGrid.dataSourceSet.appendXml(("<{0} {1}='insert'>{2}</{0}>").format(DataGrid._variables.defaultRowTag, _rowStatus, newHtml));//"<ROW " + _rowStatus + "='insert'></ROW>"
                parentGrid.dataSource = parentGrid.dataSourceSet.find(DataGrid._variables.defaultRowTag);
                */
            }
            var cell, cells = "" , row = "<tr{0}>{1}</tr>"
                , invisible = (rowIndex >= 0 && parentGrid.dataSource.length > 0 && parentGrid.dataSource[rowIndex][_rowStatus] == "delete");
            for (var i = 0; i < dataColumns.length; i++) {
                cell = new DataGridCell(this, i);
                cells += cell.html;
            }
            this.html = row.format(invisible ? " style='display:none'" : "", cells);
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
        _generateCell: function (parentRow, columnIndex) {//caution: this is core iteration function, we should use as less JQuery selectors and functions as we can
            var dataSourceRow, dataColumn, cell, cellClass, cellStyle="", sorting;
            dataColumn = parentRow.parentGrid.dataColumns[columnIndex];
            sorting = parentRow.parentGrid.enableSorting;
            this.parentRow = parentRow;
            this.columnIndex = columnIndex;
            this.id = parentRow.parentGrid.id + "_" + parentRow.rowIndex + "_" + columnIndex;
            this.cellType = dataColumn.type;
            if (parentRow.rowIndex < 0) {//Head
                cell = "<th{0}{1}{2}{3}{4}><span>{5}{6}</span></th>";
                if(dataColumn.hidden) cellStyle+="display:none;";
                this.html = cell.format(dataColumn.width ? " width=" + dataColumn.width : "",
                    cellStyle=="" ? "" : " style='" + cellStyle + "'",
                    ($.inArray(this.cellType, ["button", "image"]) < 0 && sorting) ? " class='" + DataGrid._variables.sortThClass + "'" : "",
                    this.id ? " id='" + this.id + "'" : "",
                    dataColumn.caption ? " title='" + dataColumn.caption + "'" : "",
                    (this.cellType == "checkbox" && dataColumn.selectall == 1) ? "<input type='checkbox' style='position:relative;top:3px;' />" : "",
                    dataColumn.caption ? dataColumn.caption : "&nbsp;");
            }
            else {//Body
                var tempCells;
                dataSourceRow = parentRow.parentGrid.dataSource[parentRow.rowIndex];
                if (dataSourceRow && dataColumn.name)
                    this.cellValue = this.cellText = dataSourceRow[dataColumn.name];

                if ($.inArray(this.cellType, ["checkbox", "radio", "image"]) >= 0)
                    cellClass = DataGrid._variables.contentTdClass;
                else if ($.inArray(this.cellType, ["button", "jsonform"]) >= 0)
                    cellClass = DataGrid._variables.inputTdClass;
                cell = "<td{0}{1}{2}>{3}</td>";
                if(dataColumn.hidden) cellStyle += "display:none;";
                if(dataColumn.align) cellStyle += "text-align:" + dataColumn.align;
                this.html = cell.format(cellStyle=="" ? "" : " style='" + cellStyle + "'",
                    cellClass ? " class='" + cellClass + "'" : "",
                    this.id ? " id='" + this.id + "'" : "",
                    this._generateCellElement());
            }
            parentRow.parentGrid.allCells[this.id] = this;
        },

        _generateCellElement: function () {//caution: this is core iteration function, we should use as less JQuery selectors and functions as we can
            var row = this.parentRow.rowIndex, col = this.columnIndex,
                type = this.cellType, dataColumn = this.parentRow.parentGrid.dataColumns[col],
                element = "", i;
            if (type == "datetime") type = "datetime-local";
            if (type == "textfield") type = "textarea";
            if ($.inArray(type, _allCellTypes) < 0) return null;

            //element = generateControl("datagrid", type, this.cellValue, this.parentRow.parentGrid.id, dataColumn, row);
            switch (type) {
                case "checkbox":
                case "radio":
                    element = ("<input type='{0}' name='{1}' value='{2}'{3}/>")
                        .format(type, this.parentRow.parentGrid.id + "_" + dataColumn.name, row, this.cellValue == "1" ? " checked='checked'" : "");
                    break;
                case "button":
                case "jsonform":
                    if (dataColumn.buttonsInput)
                        element = dataColumn.buttonsInput.format(row);
                    break;
                case "image":
                    element = ("<input type='{0}' src='{1}' />").format(type, this.cellValue);
                    break;
                case "link":
                    var text = dataColumn.alias ? dataColumn.alias : (this.cellValue ? this.cellValue : "&nbsp;")
                    if (dataColumn.onclick)
                        element = ("<a onclick='{0}'>{1}</a>").format(dataColumn.onclick + "(" + row + ")", text);
                    else
                        element = ("<a href='{0}'>{1}</a>").format(this.cellValue, text);
                    break;
                case "map":
                case "select":
                    if (dataColumn.options && dataColumn.options.length > 0)
                        for (i = 0; i < dataColumn.options.length; i++)
                            if (this.cellValue == dataColumn.options[i].value) {
                                this.cellText = dataColumn.options[i].text;
                                break;
                            }
                    //can be optimized: change options to a key-value object
                    element = ("<span>{0}</span>").format(this.cellText ? this.cellText : "&nbsp;");
                    break;
                case "progress":
                    var percent = parseFloat(this.cellValue), percent_s, percentHtml, pClass;
                    if(isNaN(percent)) percent = 0;
                    percent = Math.round(percent * 100);
                    percent_s = percent;
                    if(percent_s > 100) percent_s = 100;
                    else if(percent_s < 0) percent_s = 0;
                    pClass = (percent > 0 && percent <= 10)?DataGrid._variables.emptyProClass:(percent<=30?DataGrid._variables.warningProClass:DataGrid._variables.enoughProClass);
                    percentHtml = "<span class='{0}' style='width:{1}'>&nbsp;</span><span class='{2}' style='width:{3}'>&nbsp;</span><span class='{4}'>{5}</span>"
                        .format(pClass, percent_s+"%", DataGrid._variables.restProClass, (100-percent_s) + "%", DataGrid._variables.proTitleClass, percent + "%");
                    element = "<span class='{0}' title='{1}'>{2}</span>".format(DataGrid._variables.proClass, percent + "%", percentHtml);
                    break;
                case "label":
                    element = ("<span title='{0}'>{0}</span>").format(this.cellValue ? this.cellValue : "&nbsp;");
                    break;
                default:
                    element = ("<span>{0}</span>").format(this.cellValue ? this.cellValue : "&nbsp;");
                    break;
            }
            return element;
        },

        _onClick: function () {
            var input = this.inputObject, type = this.cellType, td = $("#" + this.id), label = td.children("span"), cell = this, i,
                row = this.parentRow.rowIndex, col = this.columnIndex,
                dataColumn = this.parentRow.parentGrid.dataColumns[col], source = this.parentRow.parentGrid.dataSource;
            if(!this.parentRow.parentGrid.PKEditable && dataColumn.isPk) {alert("Can't edit Primary Key");return;}

            if (!input) {
                switch (type) {
                    case "text":
                    case "date":
                    case "datetime-local":
                    case "time":
                    case "number":
                    case "email":
                    case "tel":
                    case "url":
                        input = $("<input/>").attr("type", type).val(cell.cellValue ? cell.cellValue : "").appendTo(td)
                            .blur(function () {
                                if (cell._setValueByInput(input)) {
                                    td.removeClass(DataGrid._variables.inputTdClass);
                                    input.hide();
                                    label.text(input.val()).show();
                                }
                                //else input.focus();
                            });
                        break;
                    case "textarea":
                        input = $("<textarea></textarea>").text(cell.cellValue ? cell.cellValue : "").hide().appendTo(td)
                            .focus(function () {
                                input.textareaAutoHeight();
                            })
                            .blur(function () {
                                if (cell._setValueByInput(input)) {
                                    td.removeClass(DataGrid._variables.inputTdClass);
                                    input.hide();
                                    label.text(input.val()).show();
                                }
                                //else input.focus();
                            });
                        break;
                    case "select":
                        input = $(dataColumn.select ? dataColumn.select : "<select></select>").appendTo(td)
                            .blur(function () {
                                if (cell._setValueByInput(input.children(":selected"))) {
                                    td.removeClass(DataGrid._variables.inputTdClass);
                                    input.hide();
                                    label.text(input.children(":selected").text()).show();
                                }
                                //else input.focus();
                            });
                        input.children("[value='" + cell.cellValue + "']").prop("selected", true);
                        break;
                    case "checkbox":
                        var checkbox = td.children(":checkbox");
                        cell._setValue(checkbox.prop("checked") ? "1" : "0");
                        break;
                    case "radio":
                        /*
                        var radio = td.children(":radio");
                        for (i = 0; i < source.length; i++)
                            if (source[i][dataColumn.name]) source[i][dataColumn.name] = false;
                        if (source[row]) source[row][dataColumn.name] = radio.prop("checked");*/
                        break;
                    default:
                        break;
                }
                cell.inputObject = input;
            }

            if (label && input) {
                td.addClass(DataGrid._variables.inputTdClass);
                input.show();
                input.focus();
                label.hide();
            }
            td.parent().siblings("." + DataGrid._variables.focusTrClass).removeClass(DataGrid._variables.focusTrClass);
            td.parent().addClass(DataGrid._variables.focusTrClass);
        },

        focus: function () {
            if ($.inArray(this.cellType, _inputCellTypes) >= 0)
                this._onClick();
            else
                $("#" + this.id)[0].firstChild.focus();
            //$("#" + this.id).children(":eq(0)").focus();
        },

        _setValue: function (value) {
            var row = this.parentRow.rowIndex, col = this.columnIndex, oldValue = this.cellValue,
                dataColumn = this.parentRow.parentGrid.dataColumns[col], source = this.parentRow.parentGrid.dataSource;

            if (this.cellValue == value)
                return;

            if (source[row]) {
                var status = source[row][_rowStatus];
                source[row][dataColumn.name] = value;
                if(status != "insert" && status != "delete")
                    source[row][_rowStatus] = "updated";
            }
            this.cellValue = this.cellText = value;

            //onchange
            var onchange = dataColumn.onchange;
            if (onchange && onchange != "")
                eval(onchange + "({0},'{1}','{2}')".format(row, value, oldValue));
        },

        _setValueByInput: function (input) {
            var dataColumn = this.parentRow.parentGrid.dataColumns[this.columnIndex], inputValue = input.val();

            /*//validate by validation.js
            var validateFormat = dataColumn.validateFormat;
            if (validateFormat && input && validateFormat.indexOf("{") == 0) {
                var vf = eval("(" + validateFormat + ")");
                //if (!validation.validate(vf, input)){
                if (!input.validate(vf)) {
                    DataGrid.lock = input;
                    return false;
                }
            }*/

            //validate by validate function
            var validateFunction = dataColumn.validatefunc;
            if(validateFunction && validateFunction!= "")
                if(eval("typeof(" + validateFunction + ")") != "undefined")
                    if(!eval(validateFunction + "(" + this.parentRow.rowIndex + ", inputValue)")){
                        DataGrid.lock = input;
                        return false;
                    }
            this._setValue(inputValue);
            DataGrid.lock = false;
            return true;
        },

        _render: function(value){
            var temp;
            switch (this.cellType) {
                case "checkbox":
                case "radio":
                    /*temp = document.getElementById(this.id).getElementsByTagName("input");
                    if(temp.length>0) temp.checked = value;*/
                    break;
                case "map":
                case "select":
                    var dataColumn = this.parentRow.parentGrid.dataColumns[this.columnIndex];
                    if (dataColumn.options && dataColumn.options.length > 0)
                        for (var i = 0; i < dataColumn.options.length; i++)
                            if (this.cellValue == dataColumn.options[i].value) {
                                this.cellText = dataColumn.options[i].text;
                                break;
                            }
                    temp = document.getElementById(this.id);
                    if(temp) temp = temp.getElementsByTagName("span");
                    if(temp.length>0) temp[0].innerHTML = (this.cellText ? this.cellText : "&nbsp;");
                    break;
                case "button":
                case "jsonform":
                case "image":
                case "link":
                    break;
                default :
                    //$("#" + this.id).children("span").html(value);
                    temp = document.getElementById(this.id);
                    if(temp) temp = temp.getElementsByTagName("span");
                    if(temp.length>0) temp[0].innerHTML = (this.cellText ? this.cellText : "&nbsp;");
                    break;
            }
        },

        setValue: function (value) {
            if (this.inputObject) {
                this.inputObject.blur();
                this.inputObject.remove();
                this.inputObject = null;
            }
            this._setValue(value);
            this._render(value);
            //$("#" + this.id).children("span").html(value);
            //this.cellText = value;
        }
    };

    //public variables
    DataGrid._variables = {
            gridDivClass: "datagridroot-div", headDivClass: "datagridhead-div", headDivScrollClass: "datagridhead-div-y",
            bodyDivClass: "datagridbody-div", bodyDivScrollClass: "datagridbody-div-y",
            bottomDivClass: "datagridbottom-div",
            dataGridClass: "datagrid", headDataGridClass: "datagrid datagrid-head", autoHeightClass:"autoheightrow",
            contentTdClass: "content", inputTdClass: "control", focusTrClass: "focus", waitingDivClass: "waiting",
            sortThClass: "sorting", ascThClass: "sorting_asc", descThClass: "sorting_desc",
            proClass:"progress", emptyProClass: "progress-empty", warningProClass:"progress-warning", enoughProClass:"progress-enough", restProClass:"progress-rest", proTitleClass:"progress-title",
            pagingClass: "datagridpaging", nextPageClass:"nextpage", prevPageClass:"prevpage",
            defaultSourceRoot: "DATAGRID", defaultRowsTag: "ROWS", defaultRowTag: "ROW", defaultColumnTag: "COLUMN", defaultAttrTag: "ATTRIBUTE", defaultButtonsTag: "BUTTONS", defaultButtonTag: "BUTTON", defaultOptionTag: "OPTION",
            autoBottomMargin: 40, headHeight: 34,
            adjPageLinkCount: 5
        };
    var _ext_variables_simplifiedCss = {
            bodyDivClass: "datagridbody-div-s", bodyDivScrollClass: "datagridbody-div-y-s",
            dataGridClass: "datagrid-s datagrid", headDataGridClass: "datagrid-s datagrid datagrid-head"
        },
        hashTableCache = {},
        _rowStatus = "rowstatus",
        _inputCellTypes = ["text", "date", "datetime-local", "time", "number", "email", "tel", "url", "select", "textarea"],
        _operableCellTypes = ["text", "date", "datetime-local", "time", "number", "email", "tel", "url", "select", "textarea", "checkbox", "radio", "button"],
        _nonSortCellTypes = ["image", "button", "detail"],
        _allCellTypes = ["text", "date", "datetime-local", "time", "number", "email", "tel", "url", "select", "textarea", "checkbox", "radio", "button", "map", "label", "image", "lineno", "link", "progress", "detail"];

    window.DataGrid = DataGrid;
    document.writeln('<link rel="Stylesheet" href="' + window.getRootPath() + '/css/datagrid.css" />');

})(window, document);