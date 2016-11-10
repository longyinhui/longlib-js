/*v1.2
1.append STRINGs in 2 jquery objects
2.use css1.0
3.stable
4.what's new: change some function[tiny revise]
5.last update: before Aug1
 */

//DataGrid
var DataGrid = function (name, design, source) {
    design.dataSource = source;
    this.init(name, design);
};

DataGrid._all = {};

DataGrid.init = function () {
};

DataGrid.prototype = {
    id: null,
    dataView: null,
    defaultColumn: null,
    dataMode: null,
    width: null,
    height: null,
    sortBy: null,
    sortOrder: null,
    pageSize: 0,
    pageNum: 0,
    recordCount: 0,
    dataColumns: null,
    dataSource: null,
    _parentNode: null,
    pageDirection: 'y',
    frozenHead: true,
    $: null,
    $head: null,

    init: function (div, obj) {
        DataGrid._all[obj.id] = this;

        this.id = obj.id;
        this.dataView = obj.dataView;
        this.defaultColumn = obj.defaultColumn;
        this.dataMode = obj.dataMode;
        this.width = obj.width;
        this.height = obj.height;
        this.sortBy = obj.sortBy;
        this.sortOrder = obj.sortOrder;
        this.pageSize = obj.pageSize;
        this.pageNum = obj.pageNum;
        this.recordCount = obj.recordCount;
        this.dataColumns = obj.dataColumns;
        this.dataSource = obj.dataSource;

        this._parentNode = $("div[type='datagrid'][name='" + div + "']");
        this._parentNode.width(this.width).addClass(gridDivClass);

        this._initColumns();

        this._load();

        $("#" + this.id).click(function (e) {
            var td, cell;
            if (e.target.nodeName.toLowerCase() == "span")
                td = e.target.parentNode;
            else if (e.target.nodeName.toLowerCase() == "input" && (e.target.type == "radio" || e.target.type == "checkbox"))
                td = e.target.parentNode;
            else if (e.target.nodeName.toLowerCase() == "td")
                td = e.target;
            else return;
            cell = DataGridCell.all[td.id];
            cell._onClick(td.id);
        });

        //if (this.frozenHead) this._adjustHead();
        if (this.pageSize && this.pageDirection) this._initPaging();
    },
    _initColumns: function(){
        if(!this.dataColumns) return;
        var i,j;
        for (i = 0; i<this.dataColumns.length; i++){
            var dataColumn = this.dataColumns[i];
            /*switch (dataColumn.type){
                case "button":
                    if(dataColumn.initValue){
                        dataColumn.buttons = "";
                        var btns = dataColumn.initValue.split(";"), btnc, width= (100/btns.length), value, click;
                        for (j = 0; j < btns.length; j++){
                            if(!btns[j]) continue;
                            btnc = btns[j].split(",");
                            value = btnc[1] ? btnc[1] : "Button";
                            click = btnc[0] ? btnc[0] + "({0})":"";
                            dataColumn.buttons += ("<input type='" + dataColumn.type + "' value='" + value + "' onclick='"+ click + "' style='width:calc("+width+"% - 10px)'/>");
                            //.format(dataColumn.type, , btnc[0]? btnc[0] + "(" + row + ")":"", "calc("+width+"% - 10px)");
                        }
                    }
                    //else if(dataColumn.)
                    break;
                case "select":
                    if(dataColumn.initValue.indexOf("ENUM:") < 0) break;
                    var enumtypeid = dataColumn.initValue.substr(5);
                    if(!enumtypeid) break;
                    service.serviceStackGet("enumtype", enumtypeid, function (obj) {
                        var aa= obj;
                    }, "http://" + config.webServerHost + "/" + config.api)

            }*/
        }
    },
    _adjustHead: function () {
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
        var datagrid = this, div = this.$, table = div.find("table");
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

    _generateRowsHtml: function (start, length) {
        if (length == undefined) length = this.dataSource.length;
        if (start == undefined) {
            start = -1;
            length += 1;
        }
        if(start< -1) start = -1;

        var row, html = "";
        for (var i = start; i < (start + length); i++) {
            row = new DataGridRow(this, i);
            html += row.html;
        }
        return html;
    },

    _load: function(){
        var htrs = "", btrs = "";
        htrs = this._generateRowsHtml(-1, 1);
        btrs = this._generateRowsHtml(0);

        this.$head = $(("<div class='{0}'><table class='{1}'><thead>{2}</thead></table></div>")
            .format(this.height ? headDivScrollClass : headDivClass, headDatagridClass, htrs)).appendTo(this._parentNode);
        this.$ = $(("<div class='{0}'><table id='{1}' class='{2}'><thead>{3}</thead><tbody>{4}</tbody></table></div>")
            .format(this.height ? bodyDivScrollClass : bodyDivClass, this.id, datagridClass, htrs, btrs)).height(this.height).appendTo(this._parentNode);
    },

    createNewRow: function () {
        var tr = new DataGridRow(this, this.dataSource.length);
        var bd = this.$.find("table").find("tbody");
        var trr = $(tr.html).appendTo(this.$.find("tbody"));
    },

    createContentRow: function (child, position) {
        var tr = $("<tr type='content'></tr>"),
            td = $("<td colspan='" + this.dataColumns.length + "'></td>").appendTo(tr);
        if (typeof(child) == "string") tr.html(child);
        else child.appendTo(td);
        if (position) tr.insertBefore(this.$.find("tbody").find("tr").get(position));
        else tr.appendTo(this.$.find("tbody"));
        return tr;
    }
};

//DataGrid-Row
var DataGridRow = function (parentGrid, rowIndex) {
    this.parentGrid = parentGrid;
    this.rowIndex = rowIndex;

    if (rowIndex >= parentGrid.dataSource.length) //new row
        parentGrid.dataSource.push({rowstatus: "insert"});
    var cell, cells = "" , row = "<tr id='{0}'>{1}</tr>";
    for (var i = 0; i < this.parentGrid.dataColumns.length; i++) {
        cell = new DataGridCell(this, i);
        DataGridCell.all[cell.id] = cell;
        cells += cell.html;
    }
    this.html = row.format(rowIndex, cells);
};

DataGridRow.prototype = {
    parentGrid: null,
    rowIndex: null,
    html: null
};


//DataGrid-Row-Cell
var DataGridCell = function (parentRow, columnIndex) {
    var dataSourceRow, dataColumn, cell, cellClass;
    dataColumn = parentRow.parentGrid.dataColumns[columnIndex];
    this.parentRow = parentRow;
    this.columnIndex = columnIndex;
    this.id = parentRow.parentGrid.id + "_" + parentRow.rowIndex + "_" + columnIndex;
    this.cellType = dataColumn.type;
    if (parentRow.rowIndex < 0) {//Head
        cell = "<th class='sorting'{0}{1}>{2}</th>";
        this.html = cell.format(dataColumn.width ? " width=" + dataColumn.width : "", dataColumn.hidden ? " style='display:none'" : "",dataColumn.caption);
    }
    else {//Body
        dataSourceRow = parentRow.parentGrid.dataSource[parentRow.rowIndex];
        if (dataSourceRow) this.cellValue = this.cellText = dataSourceRow[dataColumn.name];

        if($.inArray(this.cellType, ["checkbox", "radio", "image"]) >= 0) cellClass = contentTdClass;
        else if($.inArray(this.cellType, ["button"]) >= 0) cellClass = inputTdClass;
        cell = "<td{0}{1}{2}>{3}</td>";
        this.html = cell.format(dataColumn.hidden ? " style='display:none'" : "", cellClass ? " class='" + cellClass +"'" : "", this.id ? " id='" + this.id + "'" : "",this._createCellElement());
    }
};

DataGridCell.all = {};

DataGridCell.prototype = {
    parentRow: null,
    columnIndex: null,
    cellValue: null,
    cellText: null,
    cellType: null,
    id: null,
    html: null,
    _createCellElement: function () {
        var self = this,
            //cell = this.$,
            //source = this.parentRow.parentGrid.dataSource,
            row = this.parentRow.rowIndex,
            col = this.columnIndex,
            type = this.cellType,
            dataColumn = this.parentRow.parentGrid.dataColumns[col],
            //input,
            //label,
            element;
        if (type == "datetime") type = "datetime-local";
        if (type == "textfield") type = "textarea";
        if ($.inArray(type, ["text", "date", "datetime-local", "time", "number", "email", "tel", "url",
            "select", "map", "checkbox", "radio", "button", "textarea", "label", "image", "lineno", "link"]) < 0) return null;

        switch (type) {
            case "checkbox":
            case "radio":
                /*var check = $("<input/>").attr("type", type).attr("name", self.parentRow.parentGrid.id + "_" + dataColumn.name).val(row.rowIndex).appendTo(cell)
                    .click(function () {
                        if (type == "radio")
                            for (var i = 0; i < source.length; i++)
                                if (source[i][dataColumn.name]) source[i][dataColumn.name] = false;
                        if (source[row])  source[row][dataColumn.name] = check.prop("checked");
                    });
                if (source[row] && source[row][dataColumn.name]) check.prop("checked", true);
                cell.addClass(contentTdClass);*/
                element = ("<input type='{0}' name='{1}' value='{2}'{3}/>")
                    .format(type, self.parentRow.parentGrid.id + "_" + dataColumn.name, row.rowIndex, this.cellValue ? " checked='checked'" : "");
                break;
            case "button":
                /*var button = $("<input/>").attr("type", type).val(self.cellValue ? self.cellValue : "Button").appendTo(cell);
                cell.addClass(inputTdClass);
                if (dataColumn.onclick) {
                    var parent = self.parentRow;
                    button.click(function () {
                        eval(dataColumn.onclick + "(parent);");
                    });
                }*/
                element = ("<input type='{0}' value='{1}' onclick='{2}' />")
                    .format(type, self.cellValue ? self.cellValue : "Button", dataColumn.onclick + "(" + row + ")");//.attr("type", type).val().appendTo(cell);
                break;
            case "image":
                element = ("<input type='{0}' src='{1}' />").format(type, self.cellValue);
                break;
            case "link":
                //var link = $("<a/>").text(dataColumn.alias ? dataColumn.alias : self.cellValue).appendTo(cell);
                var text;
                dataColumn.alias ? text = dataColumn.alias : (self.cellValue ? text = self.cellValue : text = "&nbsp;");
                if (dataColumn.onclick)
                    element = ("<a onclick='{0}'>{1}</a>")
                        .format(dataColumn.onclick + "(" + row + ")", text);
                else
                    element = ("<a href='{0}'>{1}</a>")
                    .format(self.cellValue, text);
                break;
            case "map":
            case "select":
                if (dataColumn.option && dataColumn.option.length > 0)
                    for (var i = 0; i < dataColumn.option.length; i++)
                        if (self.cellValue == dataColumn.option[i].value) {
                            self.cellText = dataColumn.option[i].text;
                            break;
                        }
                element = ("<span>{0}</span>").format(this.cellText ? this.cellText : "&nbsp;");
                break;
            default :
                element = ("<span>{0}</span>").format(this.cellText ? this.cellText : "&nbsp;");
                break;
        }
        return element;
    },

    _onClick: function(id){
        var input = this.inputObject, type = this.cellType, cell = $("#" + id), label = cell.find("span"), self = this, i,
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
                    input = $("<input/>").attr("type", type).val(self.cellValue ? self.cellValue : "").appendTo(cell)
                        .blur(function (e) {
                            if (source[row])  source[row][dataColumn.name] = input.val();
                            cell.removeClass(inputTdClass);
                            input.hide();
                            label.html(input.val()).show();
                        });
                    if (type == "number") {
                        if (dataColumn.max) input.attr("max", dataColumn.max);
                        if (dataColumn.min) input.attr("min", dataColumn.min);
                        if (dataColumn.step) input.attr("step", dataColumn.step);
                    }
                    break;
                case "textarea":
                    input = $("<textarea></textarea>").text(self.cellValue ? self.cellValue : "").hide().appendTo(cell)
                        .focus(function () {
                            input.textareaAutoHeight();
                        })
                        .blur(function () {
                            if (source[row])  source[row][dataColumn.name] = input.val();
                            cell.removeClass(inputTdClass);
                            input.hide();
                            label.html(input.val()).show();
                        });
                    break;
                case "select":
                    input = $("<select></select>").appendTo(cell);
                    //var inputShell = $("<input type='text'/>").addClass(shadowInputClass).appendTo(cell);
                    if (dataColumn.option && dataColumn.option.length > 0)
                        for (i = 0; i < dataColumn.option.length; i++) {
                            var option = $("<option value='" + dataColumn.option[i].value + "'>" + dataColumn.option[i].text + "</option>").appendTo(input);
                            if (self.cellValue == dataColumn.option[i].value) {
                                self.cellText = dataColumn.option[i].text;
                                option.prop("selected", true);
                            }
                        }
                    input.blur(function () {
                            if (source[row])  source[row][dataColumn.name] = input.find("option:selected").val();
                            cell.removeClass(inputTdClass);
                            //inputShell.hide();
                            input.hide();
                            label.html(input.find("option:selected").text()).show();
                        });
                    break;
                case "checkbox":
                    var checkbox = cell.find(":checkbox");
                    if (source[row]) source[row][dataColumn.name] = checkbox.prop("checked");
                    break;
                case "radio":
                    var radio = cell.find(":radio");
                    for (i = 0; i < source.length; i++)
                        if (source[i][dataColumn.name]) source[i][dataColumn.name] = false;
                    if (source[row]) source[row][dataColumn.name] = radio.prop("checked");
                    break;
                default:
                    break;
            }
            self.inputObject = input;
        }

        if (label && input) {
            cell.addClass(inputTdClass);
            input.show();
            input.focus();
            label.hide();
        }
        cell.parent().parent().find("." + focusTrClass).removeClass(focusTrClass);
        cell.parent().addClass(focusTrClass);
    }
};

$(document).ready(function () {
    DataGrid.init();
});

//style classes
var gridDivClass = "datagridroot-div", headDivClass = "datagridhead-div", headDivScrollClass = "datagridhead-div-y",
    bodyDivClass = "datagridbody-div", bodyDivScrollClass = "datagridbody-div-y",
    datagridClass = "datagrid", headDatagridClass = "datagrid datagrid-head",
    contentTdClass = "content", inputTdClass = "control",
    focusTrClass = "focus", waitingDivClass = "waiting";