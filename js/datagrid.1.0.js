/*v1.0
1.append many jquery OBJECTs (tds and trs) to generate a table
2.use css1.0
3.stable, but css not available
4.what's new: see #3
*/

//DataGrid
var DataGrid = function (name, dataGridDesign, dataGridSource) {
    this.parentNode = $("div[type='datagrid'][name='" + name + "']");
    this.id = "datagrid_" + name;
    this.dataSource = dataGridSource;
    this.dataColumns = dataGridDesign.dataColumns;
    this.height = dataGridDesign.height;
    this.width = dataGridDesign.width;
    this.dataMode = dataGridDesign.dataMode;
    this.pageSize = dataGridDesign.pageSize;
    this.onAfterNewRow = dataGridDesign.onAfterNewRow;
    this.onNewRow = dataGridDesign.onNewRow;
    this.onLoading = dataGridDesign.onLoading;
    DataGrid._all[name] = this;

    this.parentNode.width(this.width).addClass(gridDivClass);
    var divHead = $("<div></div>").addClass(headDivClass).appendTo(this.parentNode),
        divBody = $("<div></div>").addClass(bodyDivClass).height(this.height).appendTo(this.parentNode);
    this.$ = $("<table><thead></thead><tbody></tbody></table>").attr("id", this.id).appendTo(divBody);
    this.$head = $("<table><thead></thead></table>").appendTo(divHead);
    this.loadRows();
    this.$.addClass(tableClass);
    this.$head.addClass(headTableClass);
    if (this.frozenHead) this._adjustHead();
    if (this.pageSize && this.pageDirection) this._paging();
};

DataGrid._all = {};

DataGrid.init = function () {
    //Blur the active element when resizing.
    $(window).resize(function () {
        var active = $(document.activeElement);
        if (active && active[0] && active[0].tagName && $.inArray(active[0].tagName.toLowerCase(), ["select", "input"]) >= 0)
            active.blur();
    });
};

DataGrid.prototype = {
    id: null,
    parentNode: null,
    _currentNode: null,
    dataColumns: null,
    dataSource: null,
    height: null,
    width: null,
    dataMode: null,
    pageSize: 0,
    pageDirection: 'y',
    currentPage: 0,
    nextPageFunction: null,
    frozenHead: true,
    onAfterNewRow: null,
    onNewRow: null,
    onLoading: null,
    $: null,
    $head: null,

    _adjustHead: function () {
        if (this.height) {//keep head on top of grid <div>
            var d1 = new Date();
            if (this.$.height() > this.height) this.$head.parent().css("margin-right", "16px");
            else this.$head.parent().css("margin-right", "0px");
            var d2 = new Date();
            $("#info4").html((d2-d1));
        }
        else {//keep head on top of screen
            var initOffset = null, datagrid = this;
            $(document).scroll(function () {
                if (datagrid && (!datagrid.height || datagrid.height == "")) {
                    var ct = $(document).scrollTop();
                    if (initOffset == null) initOffset = datagrid.$head.parent().offset().top;
                    datagrid.$head.parent().css({top: ct - initOffset < 0 ? 0 : ct - initOffset});
                }
            })
        }
    },

    _paging: function () {
        var datagrid = this, div = this.$.parent(),
            tableHeight = this.$.height(), divHeight = div.height(), currScrollTop,
            isLoading = false, isEof = false;
        div.scroll(function () {
            if ((div.scrollTop() == currScrollTop) || isLoading || isEof) return;
            currScrollTop = div.scrollTop();
            var bottom = (tableHeight - divHeight <= currScrollTop);
            if (bottom) {
                var tr = datagrid.createContentRow($("<div>&nbsp;</div>").addClass(waitingDivClass));
                isLoading = true;
                var rowsCount = datagrid.dataSource.length;
                if(datagrid.nextPageFunction){
                    datagrid.nextPageFunction(rowsCount, datagrid.pageSize, function(eof){
                        tr.remove();
                        datagrid.loadRows(rowsCount, datagrid.dataSource.length - rowsCount);
                        isLoading = false;
                        isEof = eof;
                        tableHeight = datagrid.$.height();
                    });
                }
            }
        })
    },

    loadRows: function (start, length) {
        if(!length)
            length = this.dataSource.length;
        if(!start){
            start = -2; length += 2;
        }
        for (var i = start; i < (start + length); i++)
            new DataGridRow(this, i);
    },

    createNewRow: function () {
        new DataGridRow(this, this.dataSource.length);
    },

    createContentRow: function(child, position){
        var tr = $("<tr type='content'></tr>"),
            td = $("<td colspan='" + this.dataColumns.length + "'></td>").appendTo(tr);
        if(typeof(child) == "string") tr.html(child);
        else child.appendTo(td);
        if(position) tr.insertBefore(this.$.find("tbody").find("tr").get(position));
        else tr.appendTo(this.$.find("tbody"));
        return tr;
    }
};

//DataGrid-Row
var DataGridRow = function (parentGrid, rowIndex, position) {
    this.parentGrid = parentGrid;
    this.rowIndex = rowIndex;
    var row;
    if (rowIndex == -2) //head in head table
        row = $("<tr></tr>").appendTo(parentGrid.$head.find("thead"));
    else if (rowIndex == -1) //head in body table
        row = $("<tr></tr>").appendTo(parentGrid.$.find("thead"));
    else{ //body
        row = $("<tr></tr>");
        if (position) row.insertBefore(parentGrid.$.find("tbody").find("tr").get(position));
        else row.appendTo(parentGrid.$.find("tbody"));
    }
    this.$ = row;

    if (rowIndex >= parentGrid.dataSource.length) //new row
        parentGrid.dataSource.push({rowstatus: "insert"});
    for (var i = 0; i < this.parentGrid.dataColumns.length; i++) {
        new DataGridCell(this, i);
    }
};

DataGridRow.prototype = {
    parentGrid: null,
    rowIndex: null,
    $: null
};


//DataGrid-Row-Cell
var DataGridCell = function (parentRow, columnIndex) {
    var dataSourceRow, dataColumn, cell;
    dataColumn = parentRow.parentGrid.dataColumns[columnIndex];
    this.parentRow = parentRow;
    this.columnIndex = columnIndex;
    this.cellType = dataColumn.type;
    if (parentRow.rowIndex < 0) {//Head
        cell = $("<th" + (dataColumn.width ? " width=" + dataColumn.width : "") + " class='sorting'></th>").html(dataColumn.caption).appendTo(parentRow.$);
        if (dataColumn.hidden) cell.hide();
        this.$ = cell;
    }
    else {//Body
        dataSourceRow = parentRow.parentGrid.dataSource[parentRow.rowIndex];
        if (dataSourceRow) this.cellValue = this.cellText = dataSourceRow[dataColumn.name];
        cell = $("<td></td>").appendTo(parentRow.$);
        if (dataColumn.hidden) cell.hide();
        this.$ = cell;
        this._createCellElement();
    }
};

DataGridCell.prototype = {
    parentRow: null,
    columnIndex: null,
    cellValue: null,
    cellText: null,
    cellType: null,
    $: null,
    inputObject: null,
    labelObject: null,
    _createCellElement: function () {
        var self = this, cell = this.$, source = this.parentRow.parentGrid.dataSource,
            row = this.parentRow.rowIndex, col = this.columnIndex, type = this.cellType,
            dataColumn = this.parentRow.parentGrid.dataColumns[col], input, label;
        if (type == "datetime") type = "datetime-local";
        if (type == "textfield") type = "textarea";
        if ($.inArray(type, ["text", "date", "datetime-local", "time", "number", "email", "tel", "url",
            "select", "map", "checkbox", "radio", "button", "textarea", "label", "image", "lineno", "link"]) < 0) return;

        //create label
        if ($.inArray(type, ["checkbox", "radio", "image", "link", "button"]) < 0) {
            //var aa = cell.width(), bb = cell.css("width");
            this.labelObject = label = $("<span/>").appendTo(cell).html(this.cellText ? this.cellText : "&nbsp;");
        }
        else {
            switch (type) {
                case "checkbox":
                case "radio":
                    var check = $("<input/>").attr("type", type).attr("name", self.parentRow.parentGrid.id + "_" + dataColumn.name).val(row.rowIndex).appendTo(cell)
                        .click(function () {
                            if (type == "radio")
                                for (var i = 0; i < source.length; i++)
                                    if (source[i][dataColumn.name]) source[i][dataColumn.name] = false;
                            if (source[row])  source[row][dataColumn.name] = check.prop("checked");
                        });
                    if (source[row] && source[row][dataColumn.name]) check.prop("checked", true);
                    cell.addClass(contentTdClass);
                    break;
                case "button":
                    var button = $("<input/>").attr("type", type).val(self.cellValue ? self.cellValue : "Button").appendTo(cell);
                    cell.addClass(inputTdClass);
                    if (dataColumn.onclick) {
                        var parent = self.parentRow;
                        button.click(function () {
                            eval(dataColumn.onclick + "(parent);");
                        });
                    }
                    break;
                case "image":
                    var image = $("<input/>").attr("type", type).attr("src", self.cellValue).appendTo(cell);
                    cell.addClass(contentTdClass);
                    break;
                case "link":
                    var link = $("<a/>").text(dataColumn.alias ? dataColumn.alias : self.cellValue).appendTo(cell);
                    if (dataColumn.onclick) {
                        var parent = self.parentRow;
                        link.click(function () {
                            eval(dataColumn.onclick + "(parent);");
                        });
                    }
                    else link.attr("href", self.cellValue);
                    break;
                case "map":
                    if (dataColumn.option && dataColumn.option.length > 0)
                        for (var i = 0; i < dataColumn.option.length; i++)
                            if (self.cellValue == dataColumn.option[i].value) {
                                self.cellText = dataColumn.option[i].text;
                                break;
                            }
                    break;
                case "lineno":
                    break;
            }
            self.inputObject = input;
        }

        this.$.click(function () {
            //show or create input
            var d1 = new Date();
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
                            .blur(function () {
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
                        var inputShell = $("<input type='text'/>").addClass(shadowInputClass).appendTo(cell);
                        if (dataColumn.option && dataColumn.option.length > 0)
                            for (var i = 0; i < dataColumn.option.length; i++) {
                                var option = $("<option value='" + dataColumn.option[i].value + "'>" + dataColumn.option[i].text + "</option>").appendTo(input);
                                if (self.cellValue == dataColumn.option[i].value) {
                                    self.cellText = dataColumn.option[i].text;
                                    option.prop("selected", true);
                                }
                            }
                        input.focus(function () {
                            if (input.is(":hidden")) return;
                            var p = cell.position();
                            inputShell.css({left: p.left, top: p.top + 1}).width(input.width() - 2).show();
                        }).blur(function () {
                                if (source[row])  source[row][dataColumn.name] = input.find('option:selected').text();
                                cell.removeClass(inputTdClass);
                                inputShell.hide();
                                input.hide();
                                label.html(input.find('option:selected').text()).show();
                            });
                        break;
                }
                self.inputObject = input;
            }
            if (label && input) {
                cell.addClass(inputTdClass);
                input.show().focus();
                label.hide();
            }
            cell.parent().parent().find("." + focusTrClass).removeClass(focusTrClass);
            cell.parent().addClass(focusTrClass);
            var d2 = new Date();
            $("#info2").html(d2-d1);
        });
    }
};

$(document).ready(function () {
    DataGrid.init();
});

//style classes
var gridDivClass = "table-div-grid", headDivClass = "table-div-head", bodyDivClass = "table-div-body",
    tableClass = "table table-striped table-bordered table-condensed tablesorter dataTable",
    headTableClass = "table table-striped table-bordered table-bordered-head table-condensed tablesorter dataTable",
    contentTdClass = "table-td-contentshow", inputTdClass = "table-td-inputshow",
    shadowInputClass = "table-shadowinput", focusTrClass = "table-tr-focus", waitingDivClass = "table-td-div-waiting";