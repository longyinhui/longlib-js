/*v0.9
1.append many jquery OBJECTs (tds and trs) to generate a table
2.use old css
3.have some bug, not stable
4.first version
*/

var DataGrid = function (name, dataGridDesign, dataGridSource) {
    this.init(name, dataGridDesign, dataGridSource);
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
    defaultColumn: null,
    dataSource: null,
    height: null,
    dataMode: null,
    pageSize: 0,
    pageNum: 0,
    recordCount: 0,
    frozenHead: true,
    onAfterNewRow: null,
    onNewRow: null,
    onLoading: null,
    disableSorting: null,
    updatable: null,
    gridActionType: null,
    sortBy: null,
    onSelect: null,
    sortOrder: null,
    dataGrid: null,
    $: null,
    $head: null,

    init: function (name, dgObject, source) {
        this.parentNode = $("div[type='datagrid'][name='" + name + "']");
        this.id = "datagrid_" + name;
        this.dataSource = source;
        this.dataColumns = dgObject.dataColumns;
        this.defaultColumn = dgObject.defaultColumn;
        this.height = dgObject.height;
        this.dataMode = dgObject.dataMode;
        this.pageSize = dgObject.pageSize;
        this.pageNum = dgObject.pageNum;
        this.recordCount = dgObject.recordCount;
        this.onAfterNewRow = dgObject.onAfterNewRow;
        this.onNewRow = dgObject.onNewRow;
        this.onLoading = dgObject.onLoading;
        this.onSelect = dgObject.onSelect;
        this.disableSorting = dgObject.disableSorting;
        this.updatable = dgObject.updatable;
        this.gridActionType = dgObject.gridActionType;
        this.sortBy = dgObject.sortBy;
        this.sortOrder = dgObject.sortOrder;
        DataGrid._all[name] = this;

        var divHead = $("<div></div>").addClass("table-div-head").appendTo(this.parentNode),
            divBody = $("<div></div>").addClass("table-div-body").height(this.height).appendTo(this.parentNode),
            head = $("<table><thead></thead></table>").appendTo(divHead);
        this.$ = $("<table><thead></thead><tbody></tbody></table>").attr("id", this.id).appendTo(divBody);
        this.$head = head;
        this.loadRows();
        this.$.addClass("table table-striped table-bordered table-condensed tablesorter dataTable");
        this.$head.addClass("table table-striped table-bordered table-bordered-head table-condensed tablesorter dataTable");
        if (this.frozenHead) this._adjustHead();
    },
    _adjustHead: function () {
        if (this.height) {//keep head on top of grid <div>
            if (this.$.height() > this.height) this.$head.parent().css("margin-right", "16px");
            else this.$head.parent().css("margin-right", "0px");
        }
        else {//keep head on top of screen
            var initOffset = null, datagrid = this;
            $(document).scroll(function () {
                if (!datagrid || datagrid.height != "") return;
                var ct = $(document).scrollTop();
                if (initOffset == null) initOffset = datagrid.$head.parent().offset().top;
                datagrid.$head.parent().css({top: ct - initOffset < 0 ? 0 : ct - initOffset});
            })
        }
    },

    loadRows: function () {
        new DataGridRow(this, -1, true);
        for (var i = -1; i < this.dataSource.length; i++) {
            new DataGridRow(this, i, undefined);
        }
    },

    createNewRow: function () {
        new DataGridRow(this, this.dataSource.length, undefined);
        this._adjustHead();
    }
};

//DataGrid-Row
var DataGridRow = function (parentGrid, rowIndex, isHead) {
    this.parentGrid = parentGrid;
    this.rowIndex = rowIndex;
    var row;
    if (rowIndex == -1) {//head
        var parentNode = isHead ? parentGrid.$head : parentGrid.$;
        row = $("<tr></tr>").appendTo(parentNode.find("thead"));
    }
    else row = $("<tr></tr>").appendTo(parentGrid.$.find("tbody"));
    //var row = $("<tr></tr>").appendTo(parentGrid.$.find(rowIndex == -1 ? "thead" : "tbody"));
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
    if (parentRow.rowIndex == -1) {//Head
        cell = $("<th" + (dataColumn.width ? " width=" + dataColumn.width : "") + " class='sorting'></th>").html(dataColumn.caption).appendTo(parentRow.$);
        if (dataColumn.hidden) cell.hide();
        this.$ = cell;
    }
    else {//Body
        dataSourceRow = parentRow.parentGrid.dataSource[parentRow.rowIndex];
        if (dataSourceRow) this.cellValue = this.cellText = dataSourceRow[dataColumn.name];
        cell = $("<td></td>").appendTo(parentRow.$);
        //if (dataColumn.width) cell.width(dataColumn.width);
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
                    cell.addClass("table-td-contentshow");
                    break;
                case "button":
                    var button = $("<input/>").attr("type", type).val(self.cellValue ? self.cellValue : "Button").appendTo(cell);
                    cell.addClass("table-td-inputshow");
                    if (dataColumn.onclick) {
                        var parent = self.parentRow;
                        button.click(function () {
                            eval(dataColumn.onclick + "(parent);");
                        });
                    }
                    break;
                case "image":
                    var image = $("<input/>").attr("type", type).attr("src", self.cellValue).appendTo(cell);
                    cell.addClass("table-td-contentshow");
                    break;
                case "link":
                    var link = $("<a/>").text(dataColumn.alias ? dataColumn.alias : self.cellValue).appendTo(cell);
                    if (dataColumn.onclick) {
                        //var parent = self.parentRow;
                        link.click(function () {
                            eval(dataColumn.onclick + "(parent);");
                        });
                    } else link.attr("href", self.cellValue);
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
                                cell.removeClass("table-td-inputshow");
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
                                input.textareaAutoHeight(undefined);
                            })
                            .blur(function () {
                                if (source[row])  source[row][dataColumn.name] = input.val();
                                cell.removeClass("table-td-inputshow");
                                input.hide();
                                label.html(input.val()).show();
                            });
                        break;
                    case "select":
                        input = $("<select></select>").appendTo(cell);
                        var inputShell = $("<input type='text'/>").addClass("table-shadowinput").appendTo(cell);
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
                                cell.removeClass("table-td-inputshow");
                                inputShell.hide();
                                input.hide();
                                label.html(input.find('option:selected').text()).show();
                            });
                        break;
                }
                self.inputObject = input;
            }
            if (label && input) {
                cell.addClass("table-td-inputshow");
                input.show().focus();
                label.hide();
            }
            cell.parent().parent().find(".table-tr-focus").removeClass("table-tr-focus");
            cell.parent().addClass("table-tr-focus");
        });
    }
};

$(document).ready(function () {
    DataGrid.init();
});