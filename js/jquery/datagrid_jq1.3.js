/*v1.3
1.append STRINGs in 2 jquery objects
2.use css1.3
3.stable, nearly mature
4.what's new: add a lot of function
5.last update:
 */
(function (window, document, undefined) {

//DataGrid
    var DataGrid = function (name, design, source) {
        design.dataSource = source;
        this.init(name, design);
    };

    DataGrid.all = {};

    DataGrid.lock = false;

    DataGrid.prototype = {
        _parentNode: null,

        id: null,
        dataView: null,
        defaultColumn: null,
        dataMode: null,
        height: null,
        onNewRow: null,
        onLoading: null,
        gridActionType: null,
        sortBy: null,
        sortOrder: null,
        pageSize: 0,
        pageNum: 0,
        recordCount: 0,
        width: null,
        onSelect: null,
        disableSorting: null,
        updatable: null,
        dataColumns: null,
        dataSource: null,

        pageDirection: 'y',
        frozenHead: true,
        allCells: {},
        $: null,
        $head: null,

        init: function (name, obj) {
            DataGrid.all[obj.id] = this;

            this.id = obj.id;
            this.dataView = obj.dataView;
            this.defaultColumn = obj.defaultColumn;
            this.dataMode = obj.dataMode;
            this.height = obj.height;
            this.onNewRow = obj.onNewRow;
            this.onLoading = obj.onLoading;
            this.gridActionType = obj.gridActionType;
            this.sortBy = obj.sortBy;
            this.sortOrder = obj.sortOrder;
            this.pageSize = obj.pageSize;
            this.pageNum = obj.pageNum;
            this.recordCount = obj.recordCount;
            this.width = obj.width;
            this.onSelect = obj.onSelect;
            this.disableSorting = obj.disableSorting;
            this.updatable = obj.updatable;
            this.dataColumns = obj.dataColumns;
            this.dataSource = obj.dataSource;

            this._parentNode = $("div[type='datagrid'][name='" + name + "']");
            this._parentNode.width(this.width).addClass(gridDivClass);

            this._initColumns();

            this._load();

            this._initEvents();

            //if (this.frozenHead) this._initHead();
            if (this.pageSize && this.pageDirection) this._initPaging();
        },

        _initColumns: function () {
            if (!this.dataColumns) return;
            var i, j, p;
            for (i = 0; i < this.dataColumns.length; i++) {
                var dataColumn = this.dataColumns[i];
                if (dataColumn.controlProperties){
                    var property = eval("(" + dataColumn.controlProperties + ")");
                    if (property)
                        for(var p in property)
                            dataColumn[p] = property[p];
                }

                //for specific type
                switch (dataColumn.type) {
                    case "button":
                    case "jsonform":
                        dataColumn.buttonsInput = "";
                        if (dataColumn.button) {
                            var value = dataColumn.button.value ? dataColumn.button.value : "Button",
                                click = dataColumn.button.onclick ? dataColumn.button.onclick + "({0})" : "";
                            dataColumn.buttonsInput += ("<input type='" + dataColumn.type + "' value='" + value + "' onclick='" + click + "'/>");

                        }
                        else if (dataColumn.buttons && typeof(dataColumn.buttons) != "string") {
                            var width = (100 / dataColumn.buttons.length), value, click;
                            for (j = 0; j < dataColumn.buttons.length; j++) {
                                if(dataColumn.type == "jsonform"){
                                    value = "...";
                                    click = JsonForm ? "JsonForm.dataGridJsonForm(\"" + this.id + "\",{0},\"" + dataColumn.name + "\")" : "alert(\'Can not find JsonForm function!\')";
                                }
                                else{
                                    value = dataColumn.buttons[j].value ? dataColumn.buttons[j].value : "Button";
                                    click = dataColumn.buttons[j].onclick ? dataColumn.buttons[j].onclick + "({0})" : "";
                                }
                                dataColumn.buttonsInput += ("<input type='button' value='" + value + "' onclick='" + click + "' style='width:calc(" + width + "% - 10px)'/>");
                            }
                        }
                        break;
                    case "select":
                        if (typeof(dataColumn.options) === "object") {
                            dataColumn.select = "<select>";
                            for (i = 0; i < dataColumn.options.length; i++)
                                dataColumn.select += ("<option value='{0}'>{1}</option>").format(dataColumn.options[i].value, dataColumn.options[i].text);
                            dataColumn.select += "</select>";
                        }
                        break;
                    default:
                        break;
                }
            }
        },

        _initHead: function () {
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
        },

        _initPaging: function () {
            var datagrid = this, div = this.$, table = this.$.children("table"),
                tableHeight = table.height(), divHeight = div.height(), currScrollTop,
                isLoading = false, isEof = false;
            div.scroll(function () {
                if ((currScrollTop == div.scrollTop()) || isLoading || isEof) return;
                currScrollTop = div.scrollTop();
                var bottom = (tableHeight - divHeight <= currScrollTop);
                if (bottom) {
                    var tr = datagrid.createContentRow($("<div>&nbsp;</div>").addClass(waitingDivClass));
                    isLoading = true;
                    var rowsCount = datagrid.dataSource.length;

                    /*var strParas = {
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
                    });*/
                    if(datagrid.nextPageFunction)
                        datagrid.nextPageFunction(rowsCount, datagrid.pageSize, function(eof){
                            tr.remove();
                            datagrid.loadRows(rowsCount, datagrid.dataSource.length - rowsCount);
                            isLoading = false;
                            isEof = eof;
                            tableHeight = datagrid.$.height();
                        });
                }
            })
        },

        _generateRows: function (start, length) {
            if (length == undefined)
                length = this.dataSource.length;
            if (start == undefined) {
                start = -1;
                length += 1;
            }
            if (start < -1) start = -1;

            var row, html = "";
            for (var i = start; i < (start + length); i++) {
                row = new DataGridRow(this, i);
                html += row.html;
            }
            return html;
        },

        _load: function () {
            var headRows = this._generateRows(-1, 1),
                bodyRows = this._generateRows(0);

            this.$head = $(("<div class='{0}'><table class='{1}'><thead>{2}</thead></table></div>")
                .format(this.height ? headDivScrollClass : headDivClass, headDataGridClass, headRows)).appendTo(this._parentNode);
            this.$ = $(("<div class='{0}'><table id='{1}' class='{2}'><thead>{3}</thead><tbody>{4}</tbody></table></div>")
                .format(this.height ? bodyDivScrollClass : bodyDivClass, this.id, dataGridClass, headRows, bodyRows)).height(this.height).appendTo(this._parentNode);
        },

        _reload: function(){
            var bodyRows = this._generateRows(0);
            if(this.$) this.$.find("tbody").html(bodyRows);
        },

        _initEvents: function () {
            var datagrid = this, td, cell;
            $("#" + this.id).click(function (e) {
                if(DataGrid.lock) {
                    DataGrid.lock.focus(); return;
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
            });

            this.$head.children("table").click(function(e){
                if(DataGrid.lock) {
                    DataGrid.lock.focus(); return;
                }
                if (e.target.nodeName.toLowerCase() == "th"){
                    cell = datagrid.allCells[e.target.id];
                    var isAsc = e.offsetY < (e.target.clientHeight / 2);
                    datagrid.sort(datagrid.dataColumns[cell.columnIndex].name, isAsc);
                    $("." + ascThClass).attr("class", sortThClass);
                    $("." + descThClass).attr("class", sortThClass);
                    e.target.className = isAsc ? ascThClass : descThClass;
                }
            });

            if(true){
                var getNextInputCell = function(td){
                    var nextTd = td.nextSibling;
                    if(!nextTd && td.parentNode.nextSibling) nextTd = td.parentNode.nextSibling.firstChild;
                    if(!nextTd) return null;
                    cell = datagrid.allCells[nextTd.id];
                    if($.inArray(cell.cellType, operableCellTypes) >= 0 && nextTd.style.display != "none")
                        return nextTd;
                    else return getNextInputCell(nextTd);
                };
                var getPreviousInputCell = function(td){
                    var preTd = td.previousSibling;
                    if(!preTd && td.parentNode.previousSibling) preTd = td.parentNode.previousSibling.lastChild;
                    if(!preTd) return null;
                    cell = datagrid.allCells[preTd.id];
                    if($.inArray(cell.cellType, operableCellTypes) >= 0 && preTd.style.display != "none")
                        return preTd;
                    else return getPreviousInputCell(preTd);
                };

                $("#" + this.id).keydown(function(e){
                    if ($.inArray(e.keyCode, [9,27]) < 0) return;
                    if ($.inArray(e.target.nodeName.toLowerCase(), ["input", "select", "textarea"]) < 0) return;
                    td = e.target.parentNode;
                    cell = datagrid.allCells[td.id];
                    if(cell.inputObject) cell.inputObject.blur();
                    if(DataGrid.lock) {
                        DataGrid.lock.focus(); return false;
                    }

                    switch (e.keyCode) {
                        case 9: // Tab && Shift+Tab
                            td = e.shiftKey ? getPreviousInputCell(td) :getNextInputCell(td);
                            if (td){
                                cell = datagrid.allCells[td.id];
                                cell._onFocus();
                            }
                            break;
                        case 27: // Esc
                            break;
                        /*
                         case 13: // Enter
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

        _onCreateRow: function(tr, speed){
            if(!tr) return;
            if(this.onNewRow)
                this.onNewRow(tr);
            tr.siblings("." + focusTrClass).removeClass(focusTrClass);
            tr.addClass(focusTrClass);
            if(speed){
                tr.css("opacity", 0).animate({opacity: 1}, speed * 3);
                this.$.animate({ scrollTop: (tr[0].offsetTop - headHeight) }, speed);
            }
            else
                this.$.scrollTop(tr[0].offsetTop - headHeight);
        },

        createRows: function(newRowSource, speed){
            newRowSource = [
                {datagridid: "test1", datamode:"entry", dataview:"v1", height:200},
                {datagridid: "test2", datamode:"online", dataview:"v2", height:400},
                {datagridid: "test3", datamode:"fk", dataview:"v1w", height:600}
            ]

            if(!newRowSource || newRowSource.length <= 0) return;
            var start = this.dataSource.length, i, html = "", row, trs, tbody = this.$.find("tbody");
            tbody.children("." + focusTrClass).removeClass(focusTrClass);
            for(i = 0; i < newRowSource.length;i++){
                this.dataSource[start + i] = newRowSource[i];
                this.dataSource[start + i][rowStatus] = "insert";
                row = new DataGridRow(this, start + i);
                html += row.html;
            }
            trs = $(html).appendTo(tbody).addClass(focusTrClass);
            if(this.onNewRow)
                for(i = 0; i < trs.length; i++)
                    this.onNewRow($(trs[i]));
            if(speed){
                trs.css("opacity", 0).animate({opacity: 1}, speed * 3);
                this.$.animate({ scrollTop: (trs[0].offsetTop - headHeight) }, speed);
            }
            else
                this.$.scrollTop(trs[0].offsetTop - headHeight);
        },

        createNewRow: function (speed) {
            var newRow = new DataGridRow(this, this.dataSource.length),
                tr = $(newRow.html).appendTo(this.$.find("tbody"));
            this._onCreateRow(tr, speed);
            return tr
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
            this._onCreateRow(tr, speed);
            return tr;
        },

        deleteRow: function(rowIndex, speed){
            if(this.dataSource[rowIndex])
                this.dataSource[rowIndex][rowStatus] = "delete";
            //this.$.find("tbody").children("tr:eq(" + rowIndex + ")").fadeOut(500, function(){this.remove()});
            this.getCell(rowIndex, 0).parent().fadeOut(speed?speed:0, function(){this.remove()});
        },

        reload: function (where) {
            var strParas = {
                dataView: this.dataView,
                defaultColumn: this.defaultColumn,
                sortBy: this.sortBy,
                sortOrder: this.sortOrder,
                pageSize: this.pageSize,
                pageNum: this.pageNum,
                recordCount: this.recordCount,
                disableSorting: this.disableSorting,
                dataColumns: this.dataColumns,
                callMethod: "GetDataSource",
                where: where
            };
            var datagrid = this;
            service.serviceStackPost("datagrid", strParas, function (datasource) {
                datagrid.dataSource = datasource;
                datagrid._reload();
            });
        },

        getCellId: function(rowIndex, columnIndex){
            if (rowIndex == undefined || columnIndex == undefined) return null;
            if (isNaN(columnIndex))
                for (var i = 0; i < this.dataColumns.length; i++)
                    if (this.dataColumns[i].name.toLowerCase() == columnIndex.toLowerCase()) {
                        columnIndex = i;
                        break;
                    }
            return (this.id + "_" + rowIndex + "_" + columnIndex);
        },

        getCell: function (rowIndex, columnIndex) {
            var cellId = this.getCellId(rowIndex, columnIndex);
            return $("#" + cellId);
        },

        getDataGridCell:function(rowIndex, columnIndex){
            var cellId = this.getCellId(rowIndex, columnIndex);
            return this.allCells[cellId];
        },

        getCellValue: function(rowIndex, columnIndex){
            return this.getDataGridCell(rowIndex, columnIndex).cellValue;
        },

        setCellValue: function(rowIndex, columnIndex, value){
            this.getDataGridCell(rowIndex, columnIndex).setValue(value);
        },

        sort: function(columnName, isAsc){
            var i, j, tempRow;
            var compare = function(a, b){
                if(!a && !b) return false;
                if(!a) return !isAsc;
                if(!b) return isAsc;
                if(!isNaN(a) && !isNaN(b)){
                    a = parseFloat(a);
                    b = parseFloat(b);
                }
                else{
                    a = a.toLowerCase();
                    b= b.toLowerCase();
                }
                return isAsc?(a > b):(a < b);
            }

            for (i=1; i<this.dataSource.length;i++){
                j = i - 1;
                tempRow = this.dataSource[i];
                while(j >= 0 && compare(this.dataSource[j][columnName], tempRow[columnName])){
                    this.dataSource[j + 1] = this.dataSource[j];
                    j--;
                }
                this.dataSource[j + 1] = tempRow;
            }
            this._reload();
        },

        search: function(where){
            var i, tempRow, rowIndexes = [];
            if(typeof(where) === "string")
                where = where.replace(/\[/g, "tempRow.").replace(/\]/g, "");
            else if(typeof(where) === "object"){
                var tempWhere = "", tempValue;
                for(i in where){
                    tempValue = where[i];
                    if(typeof(tempValue) == "string")
                        tempValue = "'" + tempValue + "'";
                    tempWhere += "tempRow.{0}=={1}&&".format(i,tempValue);
                }
                if(tempWhere.length>2)
                    tempWhere = tempWhere.substr(0, tempWhere.length-2);
                where = tempWhere;
            }
            else return;
            for (i=0; i<this.dataSource.length;i++){
                tempRow = this.dataSource[i];
                if(eval(where))
                    rowIndexes.push(i);
            }
            return rowIndexes;
        },

        filter: function(where){
            var newSRows = [], rowIndexes = this.search(where), i;
            if(rowIndexes.length == 0) return;
            for (i=0; i<rowIndexes.length;i++){
                newSRows.push(this.dataSource[rowIndexes[i]]);
            }
            this.dataSource = newSRows;
            this._reload();
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

            if (rowIndex >= parentGrid.dataSource.length) { //new row
                var newrow = {};
                newrow[rowStatus] = "insert";//{rowstatus: "insert"}
                parentGrid.dataSource.push(newrow);
            }
            var cell, cells = "" , row = "<tr{0}>{1}</tr>"
                ,invisible = rowIndex >= 0 && parentGrid.dataSource[rowIndex][rowStatus]=="delete";
            for (var i = 0; i < this.parentGrid.dataColumns.length; i++) {
                cell = new DataGridCell(this, i);
                //DataGridCell.all[cell.id] = cell;
                cells += cell.html;
            }
            this.html = row.format(invisible ? " style='display:none'" : "",cells);
            //this.html = row.format("",cells);
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
        _generateCell: function (parentRow, columnIndex) {
            var dataSourceRow, dataColumn, cell, cellClass;
            dataColumn = parentRow.parentGrid.dataColumns[columnIndex];
            this.parentRow = parentRow;
            this.columnIndex = columnIndex;
            this.id = parentRow.parentGrid.id + "_" + parentRow.rowIndex + "_" + columnIndex;
            this.cellType = dataColumn.type;
            if (parentRow.rowIndex < 0) {//Head
                cell = "<th{0}{1}{2}{3}>{4}</th>";
                this.html = cell.format(dataColumn.width ? " width=" + dataColumn.width : "",
                    dataColumn.hidden ? " style='display:none'" : "",
                    $.inArray(dataColumn.type, ["button", "jsonform", "image"]) < 0 ? " class='" + sortThClass + "'" : "",
                    this.id ? " id='" + this.id + "'" : "",
                    dataColumn.caption);
            }
            else {//Body
                dataSourceRow = parentRow.parentGrid.dataSource[parentRow.rowIndex];
                if (dataSourceRow) this.cellValue = this.cellText = dataSourceRow[dataColumn.name];

                if ($.inArray(this.cellType, ["checkbox", "radio", "image"]) >= 0) cellClass = contentTdClass;
                else if ($.inArray(this.cellType, ["button","jsonform"]) >= 0) cellClass = inputTdClass;
                cell = "<td{0}{1}{2}>{3}</td>";
                this.html = cell.format(dataColumn.hidden ? " style='display:none'" : "",
                    cellClass ? " class='" + cellClass + "'" : "",
                    this.id ? " id='" + this.id + "'" : "",
                    this._generateCellElement());
            }
            parentRow.parentGrid.allCells[this.id] = this;
        },

        _generateCellElement: function () {
            var row = this.parentRow.rowIndex, col = this.columnIndex,
                type = this.cellType, dataColumn = this.parentRow.parentGrid.dataColumns[col],
                element = "", i;
            if (type == "datetime") type = "datetime-local";
            if (type == "textfield") type = "textarea";
            if ($.inArray(type, allCellTypes) < 0) return null;

            //element = generateControl("datagrid", type, this.cellValue, this.parentRow.parentGrid.id, dataColumn, row);
            switch (type) {
                case "checkbox":
                case "radio":
                    element = ("<input type='{0}' name='{1}' value='{2}'{3}/>")
                        .format(type, this.parentRow.parentGrid.id + "_" + dataColumn.name, row.rowIndex, this.cellValue ? " checked='checked'" : "");
                    break;
                case "button":
                case "jsonform":
                    if (!dataColumn.buttonsInput || dataColumn.buttonsInput == "") break;
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
                    element = ("<span>{0}</span>").format(this.cellText ? this.cellText : "&nbsp;");
                    break;
                default :
                    element = ("<span>{0}</span>").format(this.cellValue ? this.cellValue : "&nbsp;");
                    break;
            }
            return element;
        },

        _onClick: function () {
            var input = this.inputObject, type = this.cellType, td = $("#" + this.id), label = td.children("span"), cell = this, i,
                row = this.parentRow.rowIndex, col = this.columnIndex,
                dataColumn = this.parentRow.parentGrid.dataColumns[col], source = this.parentRow.parentGrid.dataSource;
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
                                    td.removeClass(inputTdClass);
                                    input.hide();
                                    label.html(input.val()).show();
                                }
                                //else input.focus();
                            });
                        if (type == "number") {
                            if (dataColumn.max) input.attr("max", dataColumn.max);
                            if (dataColumn.min) input.attr("min", dataColumn.min);
                            if (dataColumn.step) input.attr("step", dataColumn.step);
                        }
                        break;
                    case "textarea":
                        input = $("<textarea></textarea>").text(cell.cellValue ? cell.cellValue : "").hide().appendTo(td)
                            .focus(function () {
                                input.textareaAutoHeight();
                            })
                            .blur(function () {
                                if (cell._setValueByInput(input)) {
                                    td.removeClass(inputTdClass);
                                    input.hide();
                                    label.html(input.val()).show();
                                }
                                //else input.focus();
                            });
                        break;
                    case "select":
                        input = $(dataColumn.select ? dataColumn.select : "<select></select>").appendTo(td)
                            .blur(function () {
                                if (cell._setValueByInput(input.children("option:selected"))) {
                                    td.removeClass(inputTdClass);
                                    input.hide();
                                    label.html(input.children("option:selected").text()).show();
                                }
                                //else input.focus();
                            });
                        input.children("option[value='" + cell.cellValue + "']").prop("selected", true);
                        break;
                    case "checkbox":
                        var checkbox = td.children(":checkbox");
                        //if (source[row]) source[row][dataColumn.name] = checkbox.prop("checked");
                        cell._setValue(checkbox.prop("checked"));
                        break;
                    case "radio":
                        var radio = td.children(":radio");
                        for (i = 0; i < source.length; i++)
                            if (source[i][dataColumn.name]) source[i][dataColumn.name] = false;
                        if (source[row]) source[row][dataColumn.name] = radio.prop("checked");
                        break;
                    default:
                        break;
                }
                cell.inputObject = input;
            }

            if (label && input) {
                td.addClass(inputTdClass);
                input.show();
                input.focus();
                label.hide();
            }
            td.parent().siblings("." + focusTrClass).removeClass(focusTrClass);
            td.parent().addClass(focusTrClass);
        },

        _onFocus: function(){
            if($.inArray(this.cellType, inputCellTypes) >= 0)
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
                source[row][dataColumn.name] = value;
                source[row][rowStatus] = "updated";
            }
            this.cellValue = this.cellText = value;

            //onchange
            if (dataColumn.onchange)
                eval(dataColumn.onchange + "('{0}','{1}','{2}')".format(row, value, oldValue));
        },

        _setValueByInput: function(input){
            var dataColumn = this.parentRow.parentGrid.dataColumns[this.columnIndex];
            //validate
            if (dataColumn.validateFormat && input && dataColumn.validateFormat.indexOf("{")==0){
                var vf = eval("(" + dataColumn.validateFormat + ")");
                //if (!validation.validate(vf, input)){
                if (!input.validate(vf)){
                    DataGrid.lock = input;
                    return false;
                }
            }
            this._setValue(input.val());
            DataGrid.lock = false;
            return true;
        },

        setValue: function (value) {
            if (this.inputObject) {
                this.inputObject.blur();
                this.inputObject.remove();
                this.inputObject = null;
            }
            this._setValue(value);

            switch (this.cellType) {
                case "checkbox":
                case "radio":
                    $("#" + this.id).children("input").prop("checked", value);
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
                    $("#" + this.id).children("span").html(this.cellText ? this.cellText : "&nbsp;");
                    break;
                case "button":
                case "jsonform":
                case "image":
                case "link":
                    break;
                default :
                    $("#" + this.id).children("span").html(value);
                    break;
            }

            //$("#" + this.id).children("span").html(value);
            //this.cellText = value;
        }
    };

    //public variables
    var gridDivClass = "datagridroot-div", headDivClass = "datagridhead-div", headDivScrollClass = "datagridhead-div-y",
        bodyDivClass = "datagridbody-div", bodyDivScrollClass = "datagridbody-div-y",
        dataGridClass = "datagrid", headDataGridClass = "datagrid datagrid-head",
        contentTdClass = "content", inputTdClass = "control", focusTrClass = "focus", waitingDivClass = "waiting",
        sortThClass = "sorting", ascThClass = "sorting_asc", descThClass = "sorting_desc",
        rowStatus = "att_rowStatus",
        inputCellTypes =    ["text", "date", "datetime-local", "time", "number", "email", "tel", "url", "select", "textarea"],
        operableCellTypes = ["text", "date", "datetime-local", "time", "number", "email", "tel", "url", "select", "textarea", "checkbox", "radio", "button", "jsonform"],
        allCellTypes =      ["text", "date", "datetime-local", "time", "number", "email", "tel", "url", "select", "textarea", "checkbox", "radio", "button", "jsonform", "map", "label", "image", "lineno", "link"];


    var headHeight = 34;
    window.DataGrid = DataGrid;
})(window, document);