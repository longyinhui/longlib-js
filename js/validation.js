(function (window, document, undefined) {

    var Validation = function () {
    }

    Validation.prototype = {
        _validate:function(rules, messages, input){
            var value = input.val(), self = this;
            if(!rules)
                return true;
            if (!rules["required"] && (!value || value === '' || value === undefined))
                return true;

            for (var rule in rules) {
                var param = rules[rule],valid = true;

                if (typeof this._hooks[rule] === 'function') {
                    if(!param) continue;
                    valid = this._hooks[rule].apply(this, [input[0], param]);
                } else if (rule.substring(0, 9) === 'callback_') {}
                if (!valid) {
                    var message = messages[rule] || defaults.messages[rule];
                    if (message) {
                        message = message.replace('%s', value);
                        if (param)
                            message = message.replace('%s', param);
                    }
                    else
                        message = 'An error has occurred with the ' + value + ' field.';

                    this._errors.push({
                         id: input[0].id,
                         message: message,
                         rule: rule
                     });

                    input.addClass("invalid")
                        .mouseenter(function(){
                            self._showTooltip(input, message);
                        })
                        .mouseleave(function(){
                            self._hideTooltip();
                        });
                    return false;
                }
                else{
                    input.removeClass("invalid").unbind("mouseenter mouseleave");
                }
            }
            return true;
        },
        validate: function (validateFormat, input) {
            var rules = validateFormat["rules"], messages=validateFormat["messages"];
            this._errors = [];
            return this._validate(rules, messages, input);
        },
        /*
         {
         rules: {
         name1: {
         required: true,
         minlength: 2
         },
         name2: {
         required: true,
         minlength: 2
         }
         },
         messages: {
         name: {
         required: "We need your email address to contact you",
         minlength: jQuery.format("At least {0} characters required!")
         }
         }*/
        validateForm: function(validateFormat, form, trueCallback, falseCallback){
            var allRules = validateFormat["rules"], allMessages=validateFormat["messages"], method=validateFormat["method"]
                rules, messages, input, result=true, valid=true;
            this._errors = [];
            for(var id in allRules){
                rules = allRules[id];
                messages = allMessages[id];
                input = form.find("#" + id);
                result = this._validate(rules, messages, input);
                valid = result && valid;
            }
            result?trueCallback():falseCallback(this._errors);
            return result;
        },
        _errors:[],
        _showTooltip: function (control, html, duration) {
            //clearTimeout(this._tooltipTimer);
            if(!this._tooltip)
                this._tooltip = $("<div class='tooltip'></div>").appendTo("body");
            var tooltip = this._tooltip;
            tooltip.html(html);

            var pos = control.offset();
            tooltip[0].style.left = pos.left + "px";
            tooltip[0].style.top = (pos.top + control[0].offsetHeight + 10) + "px";
            tooltip.show();

            var a = $("#infor2");
            a.html(a.html() + "@");
            //this.messageDiv_JQ[0].style.left = pos.left + "px";
            //this.messageDiv_JQ[0].style.top = (pos.top-2.5) + "px";
            //this.messageDiv_JQ.show();
            /*
            if (duration == undefined)
                duration = 4;
            if (duration > 0)
                this._tooltipTimer = window.setTimeout(close, duration * 1000);
            function close() {
                //if (tooltip.is(":visible")) tooltip.fadeOut();
            }*/
        },
        _hideTooltip:function(){
            if (this._tooltip.is(":visible")) this._tooltip.hide();
        },
        _removeTooltip: function(){

        },
        _tooltip: null,
        _tooltipTimer: null,
        _hooks: {
            required: function (field) {
                var value = field.value;
                if ((field.type === 'checkbox') || (field.type === 'radio')) {
                    return (field.checked === true);
                }
                return (value !== null && value !== '');
            },

            matches: function (field, matchName) {
                var el = this.form[matchName];

                if (el) {
                    return field.value === el.value;
                }

                return false;
            },

            valid_email: function (field) {
                return emailRegex.test(field.value);
            },

            valid_emails: function (field) {
                var result = field.value.split(",");

                for (var i = 0; i < result.length; i++) {
                    if (!emailRegex.test(result[i])) {
                        return false;
                    }
                }

                return true;
            },

            min_length: function (field, length) {
                if (!numericRegex.test(length)) {
                    return false;
                }

                return (field.value.length >= parseInt(length, 10));
            },

            max_length: function (field, length) {
                if (!numericRegex.test(length)) {
                    return false;
                }

                return (field.value.length <= parseInt(length, 10));
            },

            exact_length: function (field, length) {
                if (!numericRegex.test(length)) {
                    return false;
                }

                return (field.value.length === parseInt(length, 10));
            },

            greater_than: function (field, param) {
                if (!decimalRegex.test(field.value)) {
                    return false;
                }

                return (parseFloat(field.value) > parseFloat(param));
            },

            less_than: function (field, param) {
                if (!decimalRegex.test(field.value)) {
                    return false;
                }

                return (parseFloat(field.value) < parseFloat(param));
            },

            alpha: function (field) {
                return (alphaRegex.test(field.value));
            },

            alpha_numeric: function (field) {
                return (alphaNumericRegex.test(field.value));
            },

            alpha_dash: function (field) {
                return (alphaDashRegex.test(field.value));
            },

            numeric: function (field) {
                return (decimalRegex.test(field.value));
            },

            integer: function (field) {
                return (integerRegex.test(field.value));
            },

            decimal: function (field) {
                return (decimalRegex.test(field.value));
            },

            is_natural: function (field) {
                return (naturalRegex.test(field.value));
            },

            is_natural_no_zero: function (field) {
                return (naturalNoZeroRegex.test(field.value));
            },

            valid_ip: function (field) {
                return (ipRegex.test(field.value));
            },

            valid_base64: function (field) {
                return (base64Regex.test(field.value));
            },

            valid_url: function (field) {
                return (urlRegex.test(field.value));
            },

            valid_credit_card: function (field) {
                // Luhn Check Code from https://gist.github.com/4075533
                // accept only digits, dashes or spaces
                if (!numericDashRegex.test(field.value)) return false;

                // The Luhn Algorithm. It's so pretty.
                var nCheck = 0, nDigit = 0, bEven = false;
                var strippedField = field.value.replace(/\D/g, "");

                for (var n = strippedField.length - 1; n >= 0; n--) {
                    var cDigit = strippedField.charAt(n);
                    nDigit = parseInt(cDigit, 10);
                    if (bEven) {
                        if ((nDigit *= 2) > 9) nDigit -= 9;
                    }

                    nCheck += nDigit;
                    bEven = !bEven;
                }

                return (nCheck % 10) === 0;
            },

            is_file_type: function (field, type) {
                if (field.type !== 'file') {
                    return true;
                }

                var ext = field.value.substr((field.value.lastIndexOf('.') + 1)),
                    typeArray = type.split(','),
                    inArray = false,
                    i = 0,
                    len = typeArray.length;

                for (i; i < len; i++) {
                    if (ext == typeArray[i]) inArray = true;
                }

                return inArray;
            }
        }
    }

    var defaults = {
        messages: {
            required: 'The %s field is required.',
            matches: 'The %s field does not match the %s field.',
            valid_email: 'The %s field must contain a valid email address.',
            valid_emails: 'The %s field must contain all valid email addresses.',
            min_length: 'The %s field must be at least %s characters in length.',
            max_length: 'The %s field must not exceed %s characters in length.',
            exact_length: 'The %s field must be exactly %s characters in length.',
            greater_than: 'The %s field must contain a number greater than %s.',
            less_than: 'The %s field must contain a number less than %s.',
            alpha: 'The %s field must only contain alphabetical characters.',
            alpha_numeric: 'The %s field must only contain alpha-numeric characters.',
            alpha_dash: 'The %s field must only contain alpha-numeric characters, underscores, and dashes.',
            numeric: 'The %s field must contain only numbers.',
            integer: 'The %s field must contain an integer.',
            decimal: 'The %s field must contain a decimal number.',
            is_natural: 'The %s field must contain only positive numbers.',
            is_natural_no_zero: 'The %s field must contain a number greater than zero.',
            valid_ip: 'The %s field must contain a valid IP.',
            valid_base64: 'The %s field must contain a base64 string.',
            valid_credit_card: 'The %s field must contain a vaild credit card number',
            is_file_type: 'The %s field must contain only %s files.',
            valid_url: 'The %s field must contain a valid URL.'
        },
        callback: function (errors) {

        }
    };

    var numericRegex = /^[0-9]+$/,
        integerRegex = /^\-?[0-9]+$/,
        decimalRegex = /^\-?[0-9]*\.?[0-9]+$/,
        emailRegex = /^[a-zA-Z0-9.!#$%&amp;'*+\-\/=?\^_`{|}~\-]+@[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*$/,
        alphaRegex = /^[a-z]+$/i,
        alphaNumericRegex = /^[a-z0-9]+$/i,
        alphaDashRegex = /^[a-z0-9_\-]+$/i,
        naturalRegex = /^[0-9]+$/i,
        naturalNoZeroRegex = /^[1-9][0-9]*$/i,
        ipRegex = /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/i,
        base64Regex = /[^a-zA-Z0-9\/\+=]/i,
        numericDashRegex = /^[\d\-\s]+$/,
        urlRegex = /^((http|https):\/\/(\w+:{0,1}\w*@)?(\S+)|)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;

    window.validation = new Validation();
})(window, document);

(function($, window) {
    $.extend($.fn, {
        validate: function(validateFormat) {
            return window.validation.validate(validateFormat, this);
        },
        validateForm: function(validateFormat, trueCallback, falseCallback){
            return window.validation.validateForm(validateFormat, this, trueCallback, falseCallback);
        }
    });
}(jQuery, window));