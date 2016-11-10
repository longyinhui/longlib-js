/**
 * Created with JetBrains WebStorm.
 * User: Samson
 * Date: 13-8-12
 * Time: 上午11:09
 * To change this template use File | Settings | File Templates.
 */
Form = function (formId, divId, objForm) {
    if (objForm) {
        this.Init(objForm);
        this.DrawHTML(divRoot);
    }
    else {
        var formItself = this,
            divRoot = $("div#" + divId + "[Type=Form]");
        service.serviceStackGet("form", ["GetForm", formId],
            function (objForm) {
                formItself.Init(objForm);
                formItself.DrawHTML(divRoot);
                //divRoot.trigger( "create" );//for jquery-mobile
            }, undefined, true
        );
    }
};

Form.prototype = {
    formId: "",
    occupyFormColumns: 0,
    initScript: "",
    dateFormat: "",
    isEnabled: "",
    type: "",
    cssStyle: "",
    onSubmitScript: "",
    labelWidth: "",
    fieldWidth: "",
    width: "",
    height: "",
    formDetail: null,
    dataareaId: "",

    allFormDetails: {},

    Init: function (objForm) {
        this.formId = objForm.formId;
        this.occupyFormColumns = objForm.occupyFormColumns;
        this.initScript = objForm.initScript;
        this.dateFormat = objForm.dateFormat;
        this.isEnabled = objForm.isEnabled;
        this.type = objForm.type;
        this.cssStyle = objForm.cssStyle;
        this.onSubmitScript = objForm.onSubmitScript;
        this.labelWidth = objForm.labelWidth;
        this.fieldWidth = objForm.fieldWidth;
        this.width = objForm.width;
        this.height = objForm.height;
        this.dataareaId = objForm.dataareaId;
        this.formDetail = objForm.formDetail;
        Form.all[this.formId] = this;
    },

    DrawHTML: function (appendTag) {
        var tableForm = $(("<table id='{0}'></table>").format(this.formId)).appendTo(appendTag),
            trForm, occupyRowCols = 0, objForm = this;
        if (!$.isEmpty(this.Width)) {
            tableForm.css("width", this.Width);
        }
        else {
            tableForm.css("width", "100%");
        }
        if (!$.isEmpty(this.labelWidth) && !$.isEmpty(this.fieldWidth)) {
            trForm = this.CreateTr(tableForm, 'fixedWidth');
        }
        $.each(this.formDetail, function (index) {
            if (occupyRowCols <= 0) {
                occupyRowCols = 2;//objForm.occupyFormColumns;
                trForm = objForm.CreateTr(tableForm, objForm.formId + index);
            }
            var objFormDetail = new FormDetail(this, objForm);
            objForm.allFormDetails[objFormDetail.id] = objFormDetail;
            occupyRowCols = objFormDetail.DrawHTML(index, trForm, occupyRowCols);
        });
    },

    CreateTr: function (appendTag, trId) {
        return $(("<tr id='{0}'></tr>").format(trId)).appendTo(appendTag);
    },

    setValues: function(obj){
        if(!obj) return;
        var detail;
        for(var key in obj){
            detail = this.allFormDetails[this.formId + "_" + key.toUpperCase()];
            if(detail) detail.setValue(obj[key]);
        }
    },

    getDetail: function(id){
        return this.allFormDetails[this.formId + "_" + id.toUpperCase()];
    }
};

Form._getType = function (controlType) {
    switch (controlType) {
        case "TEXT":
            return "text";
        case "PASSWD":
            return "password";
        case "TEXTAREA":
            return "textarea";
        case "DATE":
            return "date";
    }
};

Form.all = {};

FormDetail = function (objFormDetail, objForm) {
    if (objFormDetail) {
        this.form = objForm;
        //this.formId = objFormDetail.formId;
        this.id = objFormDetail.formId + "_" + objFormDetail.dbName;
        this.priority = objFormDetail.priority;
        this.type = objFormDetail.type;
        this.labelCaption = objFormDetail.labelCaption;
        this.dbName = objFormDetail.dbName;
        this.occupyColumns = objFormDetail.occupyColumns;
        this.width = objFormDetail.width;
        this.cssStyle = objFormDetail.cssStyle;
        this.cssClass = objFormDetail.cssClass;
        this.readOnly = objFormDetail.readOnly;
        this.enableLog = objFormDetail.enableLog;
        this.initValue = objFormDetail.initValue;
        this.initValueNull = objFormDetail.initValueNull;
        this.onChange = objFormDetail.onChange;
        this.onSearch = objFormDetail.onSearch;
        this.editMask = objFormDetail.editMask;
        this.requireType = objFormDetail.requireType;
        this.relation = objFormDetail.relation;
        this.fieldOptions = objFormDetail.fieldOptions;
        this.defaultValue = objFormDetail.defaultValue;
    }
};

FormDetail.prototype = {
    form: "",
    //formId: "",
    id: "",
    priority: "",
    type: "",
    labelCaption: "",
    dbName: "",
    occupyColumns: 0,
    width: "",
    cssStyle: "",
    //cssClass: "",
    readOnly: false,
    enableLog: false,
    //initValue: "",
    //initValueNull: "",
    onChange: "",
    //onSearch: "",
    editMask: "",
    //requireType: "",
    fieldOptions: null,
    defaultValue: "",
    relation: "",

    _control:null,

    DrawHTML: function (index, appendTag, occupyRowCols) {
        var tdControl;
        if (!$.isEmpty(this.labelCaption) && !$.isEmpty(this.type) && this.type != "HIDDEN") {
            tdControl = this.CreateTd(appendTag, "tdlbl_" + this.priority, 1);
            tdControl.css("text-align", "left");
            $("<span>" + this.labelCaption + "<span>").appendTo(tdControl);
            occupyRowCols--;
        }
        if (this.occupyColumns > 0) {
            tdControl = this.CreateTd(appendTag, "tdctl_" + this.priority, this.occupyColumns);
            tdControl.css("text-align", "left");
            occupyRowCols = occupyRowCols - this.occupyColumns;
        }
        this.CreateControl(tdControl);
        return occupyRowCols;
    },

    CreateTd: function (appendTag, tdId, occupyColumns) {
        return $(("<td id='{0}' colspan='{1}' style='padding: 5px'></td>").format(tdId, occupyColumns)).appendTo(appendTag);
    },

    CreateControl: function (appendTag) {
        switch (this.type) {
            case "HIDDEN":
                return;
            case "SELECT":
                var ctlSelect = $(("<select id='{0}' dbName='{1}'></select>")
                    .format(this.id, this.dbName)).appendTo(appendTag);
                if (!$.isEmpty(this.readOnly)) {
                    ctlSelect.attr("disabled", "1");
                }
                if (!$.isEmpty(this.enableLog)) {
                    ctlSelect.attr("log", "1");
                }
                if (!$.isEmpty(this.width) && this.width != "0") {
                    //ctlSelect.css("width", this.width + "em");
                }
                if (!$.isEmpty(this.fieldOptions)) {
                    $.each(this.fieldOptions, function (index) {
                        var selOption = $(("<option value='{0}'>{1}</option>").format(this.value, this.text)).appendTo(ctlSelect);
                        if (this.Group) {
                            selOption.attr("group", this.Group);
                        }
                    });
                }
                if (!$.isEmpty(this.defaultValue)) {
                    ctlSelect.val(this.defaultValue);
                }
                if (!$.isEmpty(this.onChange)) {
                    ctlSelect.change(function () {
                        eval(this.onChange)
                    });
                }
                this._control = ctlSelect;
                break;
            case "TEXT":
            case "TEXTAREA":
            case "DATE":
            case "PASSWD":
                var ctlInput = $(("<input type='{0}' id='{1}' name='{2}'/>").format(
                    Form._getType(this.type), this.id, this.dbName)).appendTo(appendTag);
                ctlInput.attr("data-mini", "true");
                if (this.readOnly) {
                    ctlInput.attr("disabled", "disabled");
                }
                if (this.enableLog) {
                    ctlInput.attr("log", "1");
                }
                if (!$.isEmptyObject(this.defaultValue) && this.defaultValue.length > 0) {
                    ctlInput.val(this.defaultValue);
                    ctlInput.blur(function () {
                        if (ctlInput.val().length == 0) {
                            ctlInput.val(this.defaultValue);
                        }
                    })
                }
                if (!$.isEmptyObject(this.relation) && this.relation.length > 0) {
                    ctlInput.attr("relation", this.relation);
                }
                if ($.isEmptyObject(this.onChange)) {
                    ctlInput.change(eval(this.onChange));
                }
                this._control = ctlInput;
                break;
            case "RADIO":
                var ctlRadio;
                if (!$.isEmpty(this.fieldOptions)) {
                    $.each(this.fieldOptions, function (index) {
                        ctlRadio = $(("<input id='{0}' name='{1}' value='{2}'></td>")
                            .format(this.id, this.dbName, this.value)).appendTo(appendTag);
                        if (this.Group) {
                            selOption.attr("group", this.Group);
                        }
                    });
                }
                this._control = ctlRadio;
                break;
            case "LABEL":
            case "CHECK":
            case "MAP":
        }
    },

    setValue: function(value){
        if(!this._control) return;
        switch (this.type) {
            case "HIDDEN":
                break;
            case "SELECT":
                //normal
                //this._control.children("option[value='" + value + "']").prop("selected", true);

                //jquery-mobile
                this._control.val(value);
                this._control.selectmenu('refresh', true);
                break;
            case "TEXT":
            case "TEXTAREA":
            case "DATE":
            case "PASSWD":
            case "LABEL":
                this._control.val(value);
                break;
            case "RADIO":
            case "CHECK":
                this._control.prop("checked", value?true:false);
                break;
            case "MAP":
                //...
                break
        }
    },

    getControl: function(){
        return this._control;
    }
};