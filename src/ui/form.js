$DeMol.UI.Form = (function () {
    Form.Color = function (outerControl) {
        var redDot = $('<div></div>');
        redDot.height(10);
        redDot.width(10);
        redDot.css('border-radius', '50%');
        redDot.css('background', 'red');
        redDot.css('margin-right', '3px');
        var blueDot = redDot.clone();
        blueDot.css('background', 'blue');
        var greenDot = redDot.clone();
        greenDot.css('background', 'green');
        var control = this.control = {
            R: {
                value: 0,
                min: 0,
                max: 255,
                label: redDot
            },
            G: {
                value: 0,
                min: 0,
                max: 255,
                label: greenDot
            },
            B: {
                value: 0,
                min: 0,
                max: 255,
                label: blueDot
            },
        };
        var surroundingBox = this.ui = $('<div></div>')
        var boundingBox = $('<div></div>');
        surroundingBox.append(boundingBox);
        var spectrumControl = {
            key: 'Spectrum',
            value: null
        }
        var spectrum = new Form.Checkbox(spectrumControl);
        boundingBox.append(spectrum.ui);
        spectrum.ui.css({
            'margin-left': '2px'
        })
        var RValue = new Form.Slider(control.R);
        var GValue = new Form.Slider(control.G);
        var BValue = new Form.Slider(control.B);
        var sliders = $('<div></div>');
        sliders.append(RValue.ui, GValue.ui, BValue.ui);
        var color = $('<div></div>');
        boundingBox.append(sliders);
        boundingBox.append(color);
        RValue.slide.css('color', 'red');
        GValue.slide.css('color', 'green');
        BValue.slide.css('color', 'blue');
        color.height(15);
        color.css('margin-top', '6px');
        color.css('margin-bottom', '6px');
        color.css('border', '1px solid grey');
        color.css('border-radius', '500px');
        this.update = function () {};
        var self = this;
        function updatePreview() {
            var c = `rgb(${control.R.value}, ${control.G.value}, ${control.B.value})`;
            color.css('background', c);
            outerControl.value = c;
            self.update(control);
        }
        RValue.update = GValue.update = BValue.update = updatePreview;
        updatePreview();
        spectrum.update = function (v) {
            sliders.toggle();
            if (v.value) {
                color.css({
                    'background': 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)'
                });
                outerControl.value = 'spectrum';
            } else {
                updatePreview();
            }
        }
        this.getValue = function () {
            return outerControl;
        }
        this.validate = function () {
            return true;
        }
        this.setValue = function (colorValue) {
            if (colorValue == 'spectrum') {
                spectrum.setValue(true);
                spectrum.update(spectrumControl);
                sliders.hide();
                outerControl.value = 'spectrum';
            }
        }
        spectrum.ui.hide();
        this.enableSpectrum = function () {
            spectrum.ui.show();
        }
    }
    Form.ListInput = function (control, listElements) {
        var surroundingBox = this.ui = $('<div></div>');
        var boundingBox = $('<div></div>');
        var itemList = listElements;
        surroundingBox.append(boundingBox);
        var select = $('<select></select>');
        select.css($DeMol.defaultCSS.ListInput.select);
        boundingBox.append(select);
        this.showAlertBox = true;
        var failMessage = $('<div></div>');
        failMessage.text('Please select some value');
        failMessage.css({
            'color': 'crimson',
            'font-family': 'Arial',
            'font-weight': 'bold',
            'font-size': '10px'
        });
        failMessage.hide();
        boundingBox.append(failMessage);
        this.update = function () {}
        select.on('click', {
            parent: this
        }, (event) => {
            control.value = select.children('option:selected').val();
            event.data.parent.update(control);
        });
        this.getValue = () => {
            return control;
        }
        this.validate = function () {
            if (control.value == 'select' || control.value == null) {
                (this.showAlertBox) ? failMessage.show(): null;
                select.css({
                    'box-shadow': '0px 0px 2px red'
                });
                return false;
            } else {
                failMessage.hide();
                boundingBox.css({
                    'box-shadow': 'none'
                });
                return true;
            }
        }
        this.setValue = function (val) {
            if (listElements.indexOf(val) != -1) {
                select.empty();
                var defaultOption = $('<option></option>');
                defaultOption.text('select');
                itemList.forEach((item) => {
                    var option = $('<option></option>');
                    option.text(item);
                    option.attr('value', item);
                    select.append(option);
                    if (val == item) {
                        option.prop('selected', true);
                    }
                });
                control.value = select.children('option:selected').val();
            } else {
                console.error('UI::Form::ListInput:incorrect value', val);
            }
        }
        this.updateList = function (newList) {
            select.empty();
            var defaultOption = $('<option></option>');
            defaultOption.text('select');
            defaultOption.attr('value', 'select');
            select.append(defaultOption);
            itemList = newList;
            itemList.forEach((item) => {
                var option = $('<option></option>');
                option.text(item);
                option.attr('value', item);
                select.append(option);
            });
        }
        this.updateList(itemList);
    }
    Form.Input = function (control) {
        var surroundingBox = this.ui = $('<div></div>');
        var boundingBox = $('<div></div>');
        surroundingBox.append(boundingBox);
        var validationType = this.validationType = 'text';
        surroundingBox.css({
            'width': '100%',
            'box-sizing': 'border-box'
        })
        var input = this.domElement = $('<input type="text">');
        boundingBox.append(input);
        var alertBox = $('<div></div>');
        alertBox.css({
            'border': '1px solid darkred',
            'border-radius': '3px',
            'font-family': 'Arial',
            'font-size': '10px',
            'font-weight': 'bold',
            'margin': '2px',
            'margin-left': '4px',
            'padding': '2px',
            'color': 'darkred',
            'background': 'lightcoral'
        });
        var alertMessage = {
            'invalid-input': 'Invalid input please check the value entered',
        }
        boundingBox.append(alertBox);
        alertBox.hide();
        this.setWidth = function (width) {
            input.width(width - 6);
        }
        this.setWidth(75);
        input.css({
        });
        this.update = function () {
        }
        input.on('change', {
            parent: this,
            control: control
        }, (event) => {
            let inputString = input.val();
            if (inputString[inputString.length - 1] == ',') {
                inputString = inputString.slice(0, -1);
            }
            if (validationType == 'range') {
                control.value = inputString.split(',');
            } else {
                control.value = inputString;
            }
            event.data.parent.update(control);
        });
        input.on('select', () => {
        });
        this.getValue = () => {
            return control;
        }
        var error = this.error = function (msg) {
            alertBox.show();
            alertBox.text(msg)
        }
        this.setValue = function (val) {
            if (validationType == 'range') {
                var text = val.join(',');
                input.val(text);
            } else {
                input.val(val);
            }
            control.value = val;
        }
        function checkInputFloat() {
            var inputString = input.val();
            var dots = inputString.match(/\./g) || [];
            var checkString = inputString.replaceAll(/\./g, '').replaceAll(/[0-9]/g, '');
            if (dots.length > 1) {
                return false
            }
            if (checkString != '') return false;
            if (isNaN(parseFloat(inputString))) {
                return false;
            } else {
                return true;
            }
        }
        function checkInputNumber() {
            var inputString = input.val();
            var checkString = inputString.replaceAll(/[0-9]/g, '');
            if (checkString != '') return false;
            if (isNaN(parseInt(inputString))) {
                return false;
            } else {
                return true;
            }
        }
        function checkRangeTokens(inputString) {
            var finalString = inputString.replaceAll(',', '').replaceAll('-', '').replaceAll(/[0-9]/g, '').replaceAll(' ', '');
            if (finalString == '')
                return true;
            else
                return false;
        }
        function checkList(inputString) {
            inputString = inputString.replaceAll(' ', '');
            if (inputString[inputString.length - 1] == ',') {
                inputString = inputString.slice(0, -1);
            }
            var rangeList = inputString.split(',');
            if (/,,/g.exec(inputString)) return false;
            if (isNaN(parseInt(rangeList[0]))) return false;
            var validRangeList = rangeList.map((rangeInput) => {
                return checkRangeInput(rangeInput);
            });
            return validRangeList.find((e) => {
                return e == false
            }) == undefined ? true : false;
        }
        function checkRangeInput(inputString) {
            var rangeInputs = inputString.split('-');
            if (rangeInputs.length > 2) {
                return false;
            } else {
                if (rangeInputs.length == 0) {
                    return true;
                } else if (rangeInputs.length == 1) {
                    if (isNaN(parseInt(rangeInputs[0])))
                        return false;
                    else
                        return true;
                } else if (rangeInputs.length == 2) {
                    if (isNaN(parseInt(rangeInputs[0])) || isNaN(parseInt(rangeInputs[1])))
                        return false;
                    else
                        return true;
                } else
                    return false;
            }
        }
        var checkInput = this.checkInput = function () {
            var inputString = input.val();
            if (validationType == 'number') {
                if (checkInputNumber()) {
                    alertBox.hide();
                    return true;
                } else {
                    error(alertMessage['invalid-input']);
                    return false;
                }
            } else if (validationType == 'float') {
                if (checkInputFloat()) {
                    alertBox.hide();
                    return true;
                } else {
                    error(alertMessage['invalid-input']);
                    return false;
                }
            } else if (validationType == 'range') {
                if (checkRangeTokens(inputString)) {
                    if (checkList(inputString)) {
                        alertBox.hide();
                        return true;
                    } else {
                        error(alertMessage['invalid-input']);
                        return false;
                    }
                } else {
                    error(alertMessage['invalid-input']);
                    return false;
                }
            } else {
                return true;
            }
        }
        this.validateOnlyNumber = function (floatType = false) {
            if (floatType) {
                validationType = 'float';
            } else {
                validationType = 'number';
            }
            input.on('keydown keyup paste cut', function () {
                checkInput();
            });
        }
        this.validateInputRange = function () {
            validationType = 'range';
            input.on('keydown keyup paste cut', () => {
                checkInput();
            });
        }
        this.isEmpty = function () {
            if (control.value == "") {
                return true;
            }
        }
        this.validate = function () {
            if ((control.active == true && control.value != null && control.value != "" && checkInput()) || (control.active == false)) {
                input.css('box-shadow', 'none');
                return true
            } else {
                input.css('box-shadow', '0px 0px 2px red');
                return false;
            }
        }
        input.css($DeMol.defaultCSS.Input.input);
        boundingBox.css($DeMol.defaultCSS.Input.boundingBox);
    }
    Form.Checkbox = function (control) {
        var label = $('<div></div>');
        label.text(control.key);
        label.css($DeMol.defaultCSS.TextDefault);
        var surroundingBox = this.ui = $('<div></div>');
        var boundingBox = $('<div></div>');
        surroundingBox.append(boundingBox);
        surroundingBox.append(label);
        var checkbox = $('<input type="checkbox" />');
        boundingBox.append(checkbox);
        this.click = () => {};
        this.update = function () {
        }
        this.getValue = () => {
            return control;
        }
        checkbox.on('click', {
            parent: this
        }, (event) => {
            control.value = checkbox.prop('checked');
            event.data.parent.update(control);
        });
        label.css('display', 'inline-block');
        boundingBox.css('display', 'inline-block')
        this.validate = function () {
            return true;
        }
        this.setValue = function (val) {
            checkbox.prop('checked', val);
            this.update(control);
            control.value = val;
        }
    }
    Form.Slider = function (control) {
        var surroundingBox = this.ui = $('<div></div>');
        var boundingBox = $('<div></div>');
        surroundingBox.append(boundingBox);
        boundingBox.css('display', 'flex');
        var slide = this.slide = $('<input type="range">');
        slide.css('width', '100%');
        var min = control.min || 0;
        var max = control.max || 100;
        var step = control.step || 1;
        var defaultValue = control.default || min;
        var labelContent = control.label || '';
        var label = $('<div></div>');
        label.append(labelContent);
        boundingBox.append(label);
        slide.attr('min', min);
        slide.attr('max', max);
        slide.attr('step', step);
        slide.attr('value', defaultValue);
        control.value = defaultValue;
        boundingBox.append(slide);
        var setValue = false;
        this.update = function () {
        };
        this.getValue = () => {
            return control;
        }
        slide.on('mousedown', () => {
            setValue = true;
        });
        slide.on('mousemove', {
            parent: this
        }, (event) => {
            if (setValue) {
                control.value = slide.val();
                event.data.parent.update(control);
            }
        });
        slide.on('mouseup', () => {
            setValue = false;
        });
        boundingBox.css('align-items', 'center');
        boundingBox.height('21px');
        slide.css('padding', '0px');
        slide.css('margin', '0px');
        this.validate = function () {
            return true;
        }
        this.setValue = function (val) {
            slide.val(val);
            control.value = slide.val();
        }
    }
    Form.EmptyElement = function (control) {
        this.ui = $('<div></div>');
        this.onUpdate = () => {
        }
        this.getValue = () => {
            return control;
        }
        this.validate = function () {
            return true;
        }
    }
    function Form(specs, mainControl) {
        specs = specs || {};
        var boundingBox = this.ui = $('<div></div>');
        var heading = $('<div></div>');
        heading.text(mainControl.key);
        heading.css({
            'border-bottom': '1px solid black',
            'font-family': 'Arial',
            'font-size': '14px',
            'font-weight': 'bold',
            'padding-top': '2px',
            'padding-bottom': '4px'
        });
        boundingBox.append(heading);
        boundingBox.addClass('form');
        var inputs = this.inputs = [];
        var keys = Object.keys(specs);
        keys.forEach((key) => {
            if (specs[key].gui) {
                var prop = new Property(key, specs[key].type);
                inputs.push(prop);
                boundingBox.append(prop.ui);
            }
        });
        this.update = function () {}
        var update = () => {
        };
        inputs.forEach((input) => {
            input.update = update;
        })
        this.getValue = function () {
            mainControl.value = {};
            inputs.forEach((input) => {
                var inputValue = input.getValue();
                if (inputValue.active) {
                    mainControl.value[inputValue.key] = inputValue.value;
                }
            });
            return mainControl;
        }
        var updateValues = function (inputControl) {
            mainControl.value[inputControl.key] = mainControl.value; 
            update(mainControl);
        }
        this.validate = function () {
            var validations = inputs.map((i) => {
                if (i.active.getValue().value) {
                    return i.placeholder.validate();
                } else {
                    return true;
                }
            });
            if (validations.find(e => e == false) == undefined)
                return true;
            else {
                return false;
            }
        }
        this.setValue = function (val) {
            var keys = Object.keys(val);
            for (var i = 0; i < keys.length; i++) {
                var input = inputs.find((e) => {
                    if (e.control.key == keys[i])
                        return e;
                });
                input.placeholder.setValue(val[keys[i]]);
                input.active.setValue(true);
                input.placeholder.ui.show();
                input.control.active = true;
            }
            this.update(mainControl);
            this.getValue();
        }
        this.getInputs = function () {
            return inputs;
        }
        function Property(key, type) {
            var control = this.control = {
                value: null,
                type: type,
                key: key,
                active: false
            };
            var boundingBox = this.ui = $('<div></div>');
            this.placeholder = {
                ui: $('<div></div>')
            }; 
            this.active = new Form.Checkbox({
                value: false,
                key: key
            });
            if (specs[key].type == 'string' || specs[key].type == 'element') {
                this.placeholder = new Form.Input(control);
                this.placeholder.ui.attr('type', 'text');
            } else if (specs[key].type == 'number') {
                var slider = false;
                if (specs[key].min != undefined && specs[key].max != undefined && specs[key].default != undefined) {
                    slider = true;
                }
                if (slider) {
                    control.min = specs[key].min;
                    control.max = specs[key].max;
                    control.default = specs[key].default;
                    control.step = specs[key].step || ((control.max - control.max) / 1000);
                    this.placeholder = new Form.Slider(control);
                } else {
                    this.placeholder = new Form.Input(control);
                    this.placeholder.ui.attr('type', 'text');
                    this.placeholder.validateOnlyNumber(specs[key].floatType);
                }
            } else if (specs[key].type == 'array_range') {
                this.placeholder = new Form.Input(control);
                this.placeholder.ui.attr('type', 'text');
                this.placeholder.validateInputRange();
            } else if (specs[key].type == 'color') {
                this.placeholder = new Form.Color(control);
                if (specs[key].spectrum) {
                    this.placeholder.enableSpectrum();
                }
            } else if (specs[key].type == 'boolean') {
                this.placeholder = new Form.Checkbox(control);
            } else if (specs[key].type == 'properties') {
                this.placeholder = new Form.Input(control);
                this.placeholder.ui.attr('type', 'text');
            } else if (specs[key].type == 'colorscheme') {
                this.placeholder = new Form.ListInput(control, Object.keys($DeMol.builtinColorSchemes));
                this.placeholder.ui.attr('type', 'text');
            } else if (specs[key].type == undefined) {
                if (specs[key].validItems) {
                    this.placeholder = new Form.ListInput(control, specs[key].validItems);
                }
            } else if (specs[key].type == 'form') {
                this.placeholder = new Form(specs[key].validItems, control);
                this.placeholder.ui.append($('<div></div>').css($DeMol.defaultCSS.LinkBreak));
            } else {
                this.placeholder = new Form.EmptyElement(control);
            }
            this.getValue = function () {
                if (this.placeholder.getValue)
                    return this.placeholder.getValue();
                else
                    return null;
            }
            var placeholder = this.placeholder;
            if (type != 'boolean') {
                placeholder.ui.hide();
                boundingBox.append(this.active.ui);
                this.active.update = function (c) {
                    (c.value) ? placeholder.ui.show(): placeholder.ui.hide();
                    control.active = c.value;
                }
            } else {
                this.placeholder.update = function (c) {
                    control.active = c.value;
                }
            }
            boundingBox.append(this.placeholder.ui);
            if (this.placeholder.onUpdate)
                this.placeholder.onUpdate(updateValues);
        }
    }
    return Form;
})();
