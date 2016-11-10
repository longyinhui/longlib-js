/*
 DatePicker Core Library v2.0
 by Long Yinhui, 2016-11-08

 Important Update Log
 2016-13-32: xx
 * */

(function (window, document, undefined) {
    var DatePicker = function (inputs, ext) {
        if (ext) _variables = window.extend(_variables, ext);
        this.init(inputs);
    };

    DatePicker.prototype = {
        id: null,
        $: null,

        init: function (inputs) {

        },

        initEvent: function () {

        }
    };

    var _variables = {};

    window.DatePicker = DatePicker;
    document.writeln('<link rel="stylesheet" href="' + window.getRootPath() + '/css/datepicker.2.0.css" />');

})(window, document);