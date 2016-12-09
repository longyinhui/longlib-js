/*
 DatePicker Core Library v2.0
 by Long Yinhui, 2016-11-08

 Important Update Log
 2016-13-32: xx
 * */

(function (window, document, undefined) {
    var DatePicker = function (id, input, ext) {
        if (ext) _variables = window.extend(_variables, ext);
        if (typeof(input) === "string") input = document.getElementById(input);

        window.i18n.dataPicker = _l10n_en;

        this.init(id, input);
    };

    DatePicker.prototype = {
        id: null,
        $: null,
        $dates: null,
        $months: null,
        $years: null,
        $shell: null,
        $title: null,
        $titleShell: null,
        $input: null,
        i10n: null,
        date: null,
        today: null,
        selectedDate: null,
        selectedMonth: null,
        selectedYear: null,
        weekStartDay: null,
        weekNames: [],
        monthNames: [],
        currentView: 0, //0: date; 1: month; 2: year
        animation: true,


        init: function (id, input) {
            var attributes = window.i18n.dataPicker;

            this.id = id;
            this.date = new Date();//test
            this.today = new Date();
            this.weekNames = [attributes.sunday, attributes.monday, attributes.tuesday, attributes.wednesday, attributes.thursday, attributes.friday, attributes.saturday];
            this.monthNames = [attributes.january, attributes.february, attributes.march, attributes.april, attributes.may, attributes.june, attributes.july, attributes.august, attributes.september, attributes.october, attributes.november, attributes.december];
            /*Year: new Date().getFullYear(), //default year
            Month: new Date().getMonth() + 1, //default month
            Day: new Date().getDate(), //default date
            today: new Date(),
            btnOk: i18n.datepicker.ok,
            btnCancel: i18n.datepicker.cancel,
            btnToday: i18n.datepicker.today,
            inputDate: null,
            onReturn: false,
            version: "1.1",
            applyrule: false, //function(){};return rule={startdate,endate};
            showtarget: null,
            picker: "<img class='picker' align='middle' src='" + getRootPath() +  "/Include/css/images/calb.gif' alt=''/>"
             */
            this.$input = input;

            //Load
            this._load();
            this._initEvents();
        },

        _load: function () {
            var root, html;
            root = document.createElement("div");
            root.id = this.id;
            root.className = "dp";
            this.$input.parentNode.insertBefore(root, this.$input);
            this.$ = root;

            html =
                "<div id='" + this.id + "_top" + "' class='dp-t'></div>" +
                "<div id='" + this.id + "_dates" + "' class='dp-d'></div>" +
                "<div id='" + this.id + "_months" + "' class='dp-m'></div>" +
                "<div id='" + this.id + "_years" + "' class='dp-y'></div>";
            if (this.animation) html += "<div id='" + this.id + "_shell" + "' class='dp-s'></div>";
            this.$.innerHTML = html;
            this._generateTop();

            this.$dates = document.getElementById(this.id + "_dates");
            this.$months = document.getElementById(this.id + "_months");
            this.$years = document.getElementById(this.id + "_years");
            this.$title = document.getElementById(this.id + "_top_title_t");

            if (this.animation) {
                this.$shell = document.getElementById(this.id + "_shell");
                this.$titleShell = document.getElementById(this.id + "_top_title_s");
            }

            this._loadDate();
        },

        _loadDate: function(){
            this._generateDates();
            this._generateMonths();
            this._generateYears();
        },

        _generateTop: function(){
            var html = "";

            html += "<table class='dp-t-table'><tr>";
            html += "<td id='" + this.id + "_top_prev' class='dp-t-td_left'><div class='dp-t-button'>\u2190</div></td>";/*<span class='dp-t-prev'></span>*/
            html += "<td id='" + this.id + "_top_title' class='dp-t-td_center'><div id='" + this.id + "_top_title_t' class='dp-t-title'>";
            html += this.monthNames[this.date.getMonth()] + " " + this.date.getFullYear();
            html += "</div>";
            if (this.animation) html += "<div id='" + this.id + "_top_title_s' class='dp-t-title-s'></div>";
            html += "</td>";
            html += "<td id='" + this.id + "_top_next' class='dp-t-td_right'><div class='dp-t-button'>\u2192</div></td>";/*<span class='dp-t-next'></span>*/
            html += "</tr></table>";
            document.getElementById(this.id + "_top").innerHTML = html;
        },

        _generateDates: function () {
            var firstDate, diffDay, startDate, endDate, tdDate, tdClass;
            var year = this.date.getFullYear(), month = this.date.getMonth(), date = this.date.getDate(), temMonth, temDate;
            var i, html;

            firstDate = new Date(year, month, 1);
            diffDay = _variables.weekStartDay - firstDate.getDay();
            if (diffDay > 0) diffDay -= 7;
            startDate = _dateAdd(firstDate, "d", diffDay);
            endDate = _dateAdd(startDate, "d", 42);

            html = "<table class='dp-d-table'><thead><tr>";
            for (i = 0; i < 7; i++){
                html += "<th class='dp-d-th'>" + this.weekNames[i] + "</th>";
            }
            html += "</tr></thead><tbody>";

            for (i = 1; i <= 42; i++){
                if (i % 7 == 1) html += "<tr>";
                tdDate = _dateAdd(startDate, "d", i - 1);
                temMonth = tdDate.getMonth();
                temDate = tdDate.getDate();
                tdClass = ["dp-d-td"];
                if (temMonth != month) tdClass.push("dp-td_out");
                if (temDate == date && temMonth == month) tdClass.push("dp-td_selected");
                if (temDate == this.today.getDate() && temMonth == this.today.getMonth()) tdClass.push("dp-td_today");

                html += "<td class='";
                html += tdClass.join(" ");
                html += "' title='";
                html += (temMonth + temDate);
                html += "'>";
                html += temDate;
                html += "</td>";

                if (i % 7 == 0) html += "</tr>";
            }
            html += "</tbody></table>";
            this.$dates.innerHTML = html;
        },

        _generateMonthsYears: function () {

        },

        _generateMonths: function () {
            var html, i;

            html = "<table class='dp-m-table'>";
            for (i = 0; i < 12; i++){
                if (i % 3 == 0) html += "<tr>";
                html += "<td class='dp-m-td";
                html += (this.date.getMonth() == i ? " dp-td_selected" : "");
                html += "' dp-month='" + i + "'>";
                html += this.monthNames[i];
                html += "</td>";
                if (i % 3 == 2) html += "</tr>";
            }
            html += "<table>";
            this.$months.innerHTML = html;
        },

        _generateYears: function () {
            var temYear, year;
            var html, i;

            year = this.date.getFullYear();
            temYear = year - (year % 10) - 1;

            html = "<table class='dp-y-table'>";
            for (i = 0; i < 12; i++){
                if (i % 4 == 0) html += "<tr>";
                html += "<td class='dp-y-td";
                html += (year == temYear ? " dp-td_selected" : "");
                html += (i == 0 || i == 11 ? " dp-td_out" : "");
                html += "'>" + temYear + "</td>";
                if (i % 4 == 3) html += "</tr>";
                temYear++;
            }
            html += "<table>";
            html += "<div class='dp-y-choose'><input type='range' max='2099' min='1900' step='10' ></div>"
            this.$years.innerHTML = html;
        },

        _initEvents: function () {
            var prev, next, title, dates, months, years, yearRange;
            var dp = this;

            prev = document.getElementById(this.id + "_top_prev");
            next = document.getElementById(this.id + "_top_next");
            title = document.getElementById(this.id + "_top_title");
            dates = document.getElementById(this.id + "_dates");
            months = document.getElementById(this.id + "_months");
            years = document.getElementById(this.id + "_years");
            //yearRange = document.getElementById(this.id + "_top_prev");
            prev.bind("click", function(){
                switch (dp.currentView) {
                    case 0:
                        dp.addMonth(-1);
                        break;
                    case 1:
                        dp.addYear(-1);
                        break;
                    case 2:
                        dp.addYears(-1);
                        break;
                }
            });
            next.bind("click", function(){
                switch (dp.currentView) {
                    case 0:
                        dp.addMonth(1);
                        break;
                    case 1:
                        dp.addYear(1);
                        break;
                    case 2:
                        dp.addYears(1);
                        break;
                }
            });
            title.bind("click", function(){
                if (dp.currentView < 0 || dp.currentView > 1) return;
                dp.switchView();
                dp._setTitle("up");
            });
            dates.bind("click", function(){
                alert("D");
            });
            months.bind("click", function(e){
                var target = e.srcElement ? e.srcElement : e.target, nodeName = target.nodeName.toLowerCase(), month;
                if (nodeName != "td") return;
                month = target.getAttribute("dp-month");
                dp.selectMonth(month);
            });
            years.bind("click", function(e){
                var target = e.srcElement ? e.srcElement : e.target, nodeName = target.nodeName.toLowerCase(), year;
                if (nodeName != "td") return;
                year = target.innerHTML;
                dp.selectYear(year);
            });
        },

        _setTitle: function (direction) {
            var dp = this;
            var text = "", animateClass = "", y, n0y, n9y;

            this.$titleShell.innerHTML = this.$title.innerHTML;
            this.$titleShell.style.visibility = "visible";
            //this.$title.innerHTML = "New";
            switch (this.currentView) {
                case 0:
                    text = this.monthNames[this.date.getMonth()] + " " + this.date.getFullYear();
                    break;
                case 1:
                    text = this.date.getFullYear();
                    break;
                case 2:
                    y = this.date.getFullYear();
                    n0y = y - y%10;
                    n9y = n0y + 9;
                    text = n0y + "-" + n9y;
                    break;
            }
            this.$title.innerHTML = text;

            if (direction == undefined) direction = "up";
            if (direction == "left")  animateClass = "dp-t-left";
            else if (direction == "right")  animateClass = "dp-t-right";
            else if (direction == "up")  animateClass = "dp-t-up";
            else if (direction == "down")  animateClass = "dp-t-down";
            this.$titleShell.className = "dp-t-title-s " + animateClass;
            window.setTimeout(function(){
                dp.$titleShell.style.visibility = "hidden";
                dp.$titleShell.className = "dp-t-title-s";
            }, _variables.duration);
        },

        addMonth: function (value) {
            var dp = this;

            /*simple version without animation
            this.date = _dateAdd(this.date, "m", value);
            this._loadDate();*/

            this.$shell.innerHTML = this.$dates.innerHTML;
            this.$shell.style.visibility = "visible";
            this.date = _dateAdd(this.date, "m", value);
            this._loadDate();
            this.$shell.className = "dp-s " + (value > 0 ? "dp-s-right" : "dp-s-left");
            window.setTimeout(function(){
                dp.$shell.style.visibility = "hidden";
                dp.$shell.className = "dp-s";//dp.$shell.style.left = "0px";
            }, _variables.duration);

            this._setTitle(value > 0 ? "right" : "left");
        },

        addYear: function (value) {
            this.date = _dateAdd(this.date, "y", value);
            this._setTitle(value > 0 ? "right" : "left");
        },

        addYears: function (value) {
            this.date = _dateAdd(this.date, "y", value*10);
            this._generateYears();
            this._setTitle(value > 0 ? "right" : "left");
        },

        selectDate: function(){

        },

        selectMonth: function(newMonth){
            this.date.setMonth(newMonth);
            this._loadDate();
            this.switchView(0);
            this._setTitle("down");
        },

        selectYear: function(newYear){
            this.date.setFullYear(newYear);
            this.switchView(1);
            this._setTitle("down");
            this._generateYears();
        },

        switchView: function (view) {
            if (view == undefined)
                view = this.currentView + 1;
            switch (view) {
                case 0:
                    this.$dates.className = "dp-d";
                    this.$months.className = "dp-m";
                    break;
                case 1:
                    this.$dates.className = "dp-d dp-d-up";
                    this.$months.className = "dp-m";
                    break;
                case 2:
                    this.$dates.className = "dp-d dp-d-up";
                    this.$months.className = "dp-m dp-m-up";
                    break;
            }
            this.currentView = view;
        }
    };

    var _variables = {
        weekStartDay: 0,
        duration : 400/*millisecond*/
    };

    var _l10n_en = {
        dateFormat:"yyyymmdd", separator: "/",
        yearIndex: 0, monthIndex: 1, dayIndex: 2,
        sunday: "Su", monday: "Mo", tuesday: "Tu", wednesday: "We", thursday: "Th", friday: "Fr", saturday: "Sa",
        january: "Jan", february: "Feb", march: "Mar", april: "Apr", may: "May", june: "Jun", july: "Jul", august: "Aug", september: "Sep", october: "Oct", november: "Nov", december: "Dec", monthPostfix: "",
        ok: " Ok ", cancel: "Cancel", today: "Today",
        prevMonthTitle: "prev month",
        nextMonthTitle: "next month",
        prevYearsTitle: "prev 10 years",
        nextYearsTitle: "next 10 years"
    };

    var _l10n_zh = {
        dateFormat:"yyyymmdd", separator: "/",
        yearIndex: 0, monthIndex: 1, dayIndex: 2,
        weekName: {sunday: "日", monday: "一", tuesday: "二", wednesday: "三", thursday: "四", friday: "五", saturday: "六"},
        monthName: {january: "一月", february: "二月", march: "三月", april: "四月", may: "五月", june: "六月", july: "七月", august: "八月", september: "九月", october: "十月", november: "十一", december: "十二", monthPostfix: ""},
        ok: "确定", cancel: "取消", today: "今日",
        prevMonthTitle: "上一月",
        nextMonthTitle: "下一月",
        prevYearsTitle: "前十年",
        nextYearsTitle: "后十年"
    };

    var _dateAdd = function (date, type, value) {
        var newDate;
        value = parseInt(value);
        if (value == 0) return date;

        newDate = new Date(date);
        switch (type.toLowerCase()) {
            case "y":
                newDate.setFullYear(newDate.getFullYear() + value);
                break;
            case "m":
                newDate.setMonth(newDate.getMonth() + value);
                break;
            case "d":
                newDate.setDate(newDate.getDate() + value);
                break;
            //case "w": newDate.setDate(newDate.getDate() + 7 * value); break;
            case "h":
                newDate.setHours(newDate.getHours() + value);
                break;
            case "n":
                newDate.setMinutes(newDate.getMinutes() + value);
                break;
            case "s":
                newDate.setSeconds(newDate.getSeconds() + value);
                break;
            //case "l": newDate.setMilliseconds(newDate.getMilliseconds() + value); break;
        }
        return newDate;
    };

    window.DatePicker = DatePicker;
    document.writeln('<link rel="stylesheet" href="' + window.getRootPath() + '/css/datepicker.2.0.css" />');

})(window, document);