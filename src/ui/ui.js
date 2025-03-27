$DeMol.UI = (function () {
  var validAtomSpecs = {
    "resn": { type: "string", valid: true, prop: true, gui: true }, 
    "x": { type: "number", floatType: true, valid: false, step: 0.1, prop: true }, 
    "y": { type: "number", floatType: true, valid: false, step: 0.1, prop: true }, 
    "z": { type: "number", floatType: true, valid: false, step: 0.1, prop: true }, 
    "color": { type: "color", gui: false }, 
    "surfaceColor": { type: "color", gui: false }, 
    "elem": { type: "element", gui: true, prop: true }, 
    "hetflag": { type: "boolean", valid: false, gui: true }, 
    "chain": { type: "string", gui: true, prop: true }, 
    "resi": { type: "array_range", gui: true }, 
    "icode": { type: "number", valid: false, step: 0.1 },
    "rescode": { type: "number", valid: false, step: 0.1, prop: true },
    "serial": { type: "number", valid: false, step: 0.1 }, 
    "atom": { type: "string", valid: false, gui: true, prop: true }, 
    "bonds": { type: "array", valid: false }, 
    "ss": { type: "string", valid: false }, 
    "singleBonds": { type: "boolean", valid: false }, 
    "bondOrder": { type: "array", valid: false }, 
    "properties": { type: "properties", valid: false }, 
    "b": { type: "number", floatType: true, valid: false, step: 0.1, prop: true }, 
    "pdbline": { type: "string", valid: false }, 
    "clickable": { type: "boolean", valid: false, gui: false }, 
    "contextMenuEnabled": { type: "boolean", valid: false, gui: false }, 
    "callback": { type: "function", valid: false }, 
    "invert": { type: "boolean", valid: false }, 
    "reflectivity": { type: "number", floatType: true, gui: false, step: 0.1 }, 
    "altLoc": { type: "invalid", valid: false }, 
    "sym": { type: 'number', gui: false }, 
  };
  var validExtras = {  
    "model": { type: "string", valid: false }, 
    "bonds": { type: "number", valid: false, gui: true }, 
    "predicate": { type: "string", valid: false }, 
    "invert": { type: "boolean", valid: false, gui: true }, 
    "byres": { type: "boolean", valid: false, gui: true }, 
    "expand": { type: "number", valid: false, gui: false }, 
    "within": { type: "string", valid: false }, 
    "and": { type: "string", valid: false }, 
    "or": { type: "string", valid: false }, 
    "not": { type: "string", valid: false }, 
  };
  var validAtomSelectionSpecs = $DeMol.extend({}, validAtomSpecs);
  validAtomSelectionSpecs = $DeMol.extend(validAtomSelectionSpecs, validExtras);
  var validLineSpec = {
    "hidden": { type: "boolean", gui: true },
    "linewidth": { type: "number", floatType: true, gui: true, step: 0.1, default: 1.0 },
    "colorscheme": { type: "colorscheme", gui: true },
    "color": { type: "color", gui: true },
    "opacity": { type: "number", floatType: true, gui: true, step: 0.1, default: 1, min: 0, max: 1 },
  };
  var validCrossSpec = {
    "hidden": { type: "boolean", gui: true },
    "linewidth": { type: "number", floatType: true, gui: false, step: 0.1, default: 1.0, min: 0 },
    "colorscheme": { type: "colorscheme", gui: true },
    "color": { type: "color", gui: true },
    "radius": { type: "number", floatType: true, gui: true, step: 0.1, default: 1, min: 0.1 },
    "scale": { type: "number", floatType: true, gui: true, step: 0.1, default: 1, min: 0 },
    "opacity": { type: "number", floatType: true, gui: true, step: 0.1, default: 1, min: 0, max: 1 },
  };
  var validStickSpec = {
    "hidden": { type: "boolean", gui: true },
    "colorscheme": { type: "colorscheme", gui: true },
    "color": { type: "color", gui: true },
    "radius": { type: "number", floatType: true, gui: true, step: 0.1, default: 0.25, min: 0.1 },
    "singleBonds": { type: "boolean", gui: true },
    "opacity": { type: "number", floatType: true, gui: true, step: 0.1, default: 1, min: 0, max: 1 },
  };
  var validSphereSpec = {
    "hidden": { type: "boolean", gui: false }, 
    "singleBonds": { type: "boolean", gui: true },
    "colorscheme": { type: "colorscheme", gui: true },
    "color": { type: "color", gui: true },
    "radius": { type: "number", floatType: true, gui: true, step: 0.1, default: 1.5, min: 0 },
    "scale": { type: "number", floatType: true, gui: true, step: 0.1, default: 1.0, min: 0.1 },
    "opacity": { type: "number", floatType: true, gui: true, step: 0.1, default: 1, min: 0, max: 1 },
  };
  var validCartoonSpec = {
    "style": { validItems: ["trace", "oval", "rectangle", "parabola", "edged"], gui: true },
    "color": { type: "color", gui: true, spectrum: true },
    "arrows": { type: "boolean", gui: true },
    "ribbon": { type: "boolean", gui: true },
    "hidden": { type: "boolean", gui: true },
    "tubes": { type: "boolean", gui: true },
    "thickness": { type: "number", floatType: true, gui: true, step: 0.1, default: 1, min: 0 },
    "width": { type: "number", floatType: true, gui: true, step: 0.1, default: 1, min: 0 },
    "opacity": { type: "number", floatType: true, gui: true, step: 0.1, default: 1, min: 0, max: 1 },
  };
  var validAtomStyleSpecs = {
    "line": { validItems: validLineSpec, type: "form", gui: true }, 
    "cross": { validItems: validCrossSpec, type: "form", gui: true }, 
    "stick": { validItems: validStickSpec, type: "form", gui: true }, 
    "sphere": { validItems: validSphereSpec, type: "form", gui: true }, 
    "cartoon": { validItems: validCartoonSpec, type: "form", gui: true }, 
    "colorfunc": { validItems: null, type: "js", valid: false },
    "clicksphere": { validItems: validSphereSpec, type: "form" } 
  };
  var validSurfaceSpecs = {
    "opacity": { type: "number", floatType: true, gui: true, step: 0.01, default: 1, min: 0, max: 1 },
    "colorscheme": { type: "colorscheme", gui: true },
    "color": { type: "color", gui: true },
    "voldata": { type: "number", floatType: true, gui: false },
    "volscheme": { type: "number", floatType: true, gui: false },
    "map": { type: "number", gui: false }
  };
  function UI(stateManager, config, parentElement) {
    config = config || {}
    var icons = new $DeMol.UI.Icons();
    var _editingForm = null;
    var mainParent = $(parentElement[0]);
    var HEIGHT = config.height;
    this.tools = generateUI(config);
    function generateUI() {
      var modelToolBar = new ModelToolbar();
      mainParent.append(modelToolBar.ui);
      setLocation(mainParent, modelToolBar.ui, 'left', 'top');
      var contextMenu = new ContextMenu();
      mainParent.append(contextMenu.ui);
      setPosition(contextMenu.ui, 100, 100)
      var surfaceMenu = new SurfaceMenu();
      mainParent.append(surfaceMenu.ui);
      setLocation(mainParent, surfaceMenu.ui, 'right', 'top', 0, modelToolBar.ui.height() + 5);
      var selectionBox = new SelectionBox(icons.select);
      mainParent.append(selectionBox.ui);
      setLocation(mainParent, selectionBox.ui, 'left', 'top', 0, modelToolBar.ui.height() + 5);
      selectionBox.ui.on('mousedown', () => {
        stateManager.exitContextMenu();
      });
      surfaceMenu.ui.on('mousedown', () => {
        stateManager.exitContextMenu();
      });
      return {
        modelToolBar: modelToolBar,
        selectionBox: selectionBox,
        contextMenu: contextMenu,
        surfaceMenu: surfaceMenu
      }
    }
    this.resize = function () {
      var selectionBox = this.tools.selectionBox;
      var surfaceMenu = this.tools.surfaceMenu;
      var modelToolBar = this.tools.modelToolBar;
      var HEIGHT = mainParent.height();
      setLocation(mainParent, modelToolBar.ui, 'left', 'top');
      setLocation(mainParent, selectionBox.ui, 'left', 'top', 0, modelToolBar.ui.height() + 5);
      selectionBox.updateScrollBox(HEIGHT);
      setLocation(mainParent, surfaceMenu.ui, 'right', 'top', 0, modelToolBar.ui.height() + 5);
      surfaceMenu.updateScrollBox(HEIGHT);
    }
    function ModelToolbar() {
      var boundingBox = this.ui = $('<div></div>');
      boundingBox.css({
        'position': 'relative',
        'min-width': '150px'
      });
      var modelButton = new button(icons.molecule, 20, { tooltip: 'Toggle Model Selection Bar' });
      boundingBox.append(modelButton.ui);
      modelButton.ui.css({
        'display': 'inline-block',
        'top': '3px',
      });
      var control = {
        urlType: {
          active: true,
          value: null,
          key: 'Model type'
        },
        url: {
          active: true,
          value: null,
          key: 'Url'
        },
      };
      var surroundingBox = $('<div></div>');
      surroundingBox.css({
        'display': 'inline-block',
        'background': '#e4e4e4',
        'padding': '2px',
        'border-radius': '3px',
      });
      boundingBox.append(surroundingBox);
      var currentModelBox = $('<div></div>');
      currentModelBox.css({
      });
      var currentModel = $('<div></div>');
      currentModel.css({
        'display': 'inline-block',
        'font-family': 'Arial',
        'font-size': '12px',
        'font-weight': 'bold',
      });
      currentModelBox.append(currentModel);
      var changeButton = new button(icons.change, 16, { tooltip: 'Change Model', backgroundColor: 'white', bfr: 0.5 });
      changeButton.ui.css({
        'display': 'inline-block',
        'margin-left': '4px',
      });
      currentModelBox.append(changeButton.ui);
      currentModelBox.hide();
      surroundingBox.append(currentModelBox);
      var formBox = $('<div></div>');
      surroundingBox.append(formBox);
      var dbs = 'pdb,mmtf,cid'.split(',');
      var list = this.list = new $DeMol.UI.Form.ListInput(control.urlType, dbs);
      list.showAlertBox = false;
      list.ui.css({
        'display': 'inline-block',
      })
      formBox.append(list.ui);
      var input = this.url = new $DeMol.UI.Form.Input(control.url);
      formBox.append(input.ui);
      input.ui.css({
        'display': 'inline-block',
        'width': '125px'
      });
      var submitButton = new button(icons.tick, 16, { bfr: 0.5, backgroundColor: 'lightgreen', tooltip: 'Add Model' });
      submitButton.ui.css({
        'margin': '0px'
      })
      formBox.append(submitButton.ui);
      this.updateInputLength = function () {
      }
      modelButton.ui.on('click', () => {
        surroundingBox.toggle();
      });
      submitButton.ui.on('click', function () {
        var validateDb = list.validate();
        var validateId = input.validate();
        if (validateId && validateDb) {
          stateManager.addModel(control);
        }
      });
      this.setModel = function (heading) {
        currentModel.text(heading);
        currentModelBox.show();
        formBox.hide();
      }
      changeButton.ui.on('click', function () {
        currentModelBox.hide();
        formBox.show();
        input.setValue('');
      });
      boundingBox.on('keypress', function (e) {
        if (e.key == 'Enter' || e.key == 'Return') {
          submitButton.ui.trigger('click')
        }
      });
    }
    function SelectionBox(icon, side = 'left') {
      var selectionBox = this.ui = $('<div></div>');
      _editingForm = false;
      var selectionObjects = [];
      var selections = $('<div></div>');
      var scrollBox = $('<div></div>');
      selections.css('opacity', '0.9');
      var showArea = $('<div></div>');
      var addArea = $('<div></div>');
      var plusButton = new button(icons.plus, 20, { tooltip: 'Add New Selection' });
      plusButton.ui.css('margin', '0px');
      var hideButton = new button(icon, 20, { tooltip: 'Toggle Selection Menu' });
      this.selectionObjects = [];
      selectionBox.append(hideButton.ui);
      selectionBox.append(showArea);
      selectionBox.css('position', 'absolute');
      scrollBox.append(selections);
      showArea.append(scrollBox);
      addArea.append(plusButton.ui);
      var alertBox = new AlertBox();
      showArea.append(alertBox.ui);
      showArea.append(addArea);
      alertBox.ui.css('width', 162);
      if (side == 'left') {
        selectionBox.css('text-align', 'left');
      }
      else if (side == 'right') {
        selectionBox.css('text-align', 'right');
      }
      else {
        selectionBox.css('text-align', 'right');
      }
      showArea.css('box-sizing', 'border-box');
      showArea.css('padding', '3px');
      scrollBox.css('max-height', HEIGHT * 0.8);
      scrollBox.css('overflow-y', 'auto');
      scrollBox.css('overflow-x', 'visible');
      selections.css('box-sizing', 'content-box');
      this.updateScrollBox = function (height) {
        scrollBox.css('max-height', height * 0.8);
      }
      var hidden = true;
      showArea.hide();
      hideButton.ui.click(toggleHide);
      function toggleHide() {
        if (hidden) {
          showArea.show(100);
        }
        else {
          showArea.hide(100);
        }
        hidden = !hidden;
      }
      function Selection() {
        var boundingBox = this.ui = $('<div></div>');
        var sid = this.id = null;
        selectionObjects.push(this);
        boundingBox.css({
          'background': '#e8e8e8',
          'padding': '4px 4px 2px 4px',
          'border-radius': '6px',
          'margin-bottom': '3px',
          'position': 'relative',
          'width': '156px'
        });
        var header = $('<div></div>');
        boundingBox.append(header);
        var heading = $('<div></div>');
        var controls = $('<div></div>');
        header.append(heading, controls);
        heading.css({
          'font-family': 'Arial',
          'font-weight': 'bold',
          'font-size': '12px',
          'display': 'inline-block',
          'width': '60px'
        });
        controls.css({
          'display': 'inline-block'
        });
        header.hide();
        controls.editMode = false;
        var removeButton = new button(icons.minus, 16, { bfr: 0.5, backgroundColor: '#f06f6f', tooltip: 'Remove Selection' });
        var editButton = new button(icons.pencil, 16, { tooltip: 'Edit Selection' });
        var visibleButton = new button(icons.visible, 16, { tooltip: 'Show / Hide Selection' });
        controls.append(removeButton.ui)
        controls.append(editButton.ui);
        controls.append(visibleButton.ui);
        var parameters = $('<div></div>');
        boundingBox.append(parameters);
        var styleHolder = $('<div></div>');
        removeButton.ui.on('click', function () {
          stateManager.removeSelection(sid);
          boundingBox.detach();
        });
        editButton.ui.on('click', function () {
          parameters.toggle();
        });
        var hidden = false;
        visibleButton.ui.on('click', () => {
          stateManager.toggleHide(sid);
          if (hidden) {
            hidden = false;
            visibleButton.setSVG(icons.visible);
          }
          else {
            hidden = true;
            visibleButton.setSVG(icons.invisible);
          }
        });
        var styleBox = new StyleBox();
        styleHolder.append(styleBox.ui);
        styleBox.ui.css({
          'position': 'static',
          'width': 'px',
          'border-radius': '4px'
        });
        styleBox.ui.hide();
        var allControl = this.allSelector = {
          key: 'Select All Atom',
          value: null,
          active: true
        }
        var allCheckBox = new $DeMol.UI.Form.Checkbox(allControl);
        parameters.append(allCheckBox.ui);
        var selectionFormControl = this.selectionValue = {
          key: 'Selection Spec',
          value: null,
          active: true
        }
        var selectionSpecForm = new $DeMol.UI.Form(validAtomSelectionSpecs, selectionFormControl);
        parameters.append(selectionSpecForm.ui);
        var submitControls = $('<div></div>');
        var submit = new button(icons.tick, 16, { backgroundColor: 'lightgreen', tooltip: 'Submit' });
        var cancel = new button(icons.cross, 16, { backgroundColor: 'lightcoral', tooltip: 'Cancel' });
        submitControls.append(submit.ui, cancel.ui);
        var alertBox = new AlertBox();
        parameters.append(alertBox.ui);
        parameters.append(submitControls);
        boundingBox.append(styleHolder);
        allCheckBox.update = function () {
          selectionSpecForm.ui.toggle();
        }
        function finalizeSelection(id) {
          header.show();
          controls.editMode = true;
          sid = this.id = id;
          heading.text('Sel#' + id);
          boundingBox.attr('data-id', id);
          parameters.hide();
          styleBox.setSid(id);
          styleBox.ui.show();
        }
        function checkAndAddSelection(sid = null) {
          var validate = selectionSpecForm.validate();
          if (validate) {
            selectionSpecForm.getValue();
            var checkAtoms = stateManager.checkAtoms(selectionFormControl.value);
            if (Object.keys(selectionFormControl.value).length == 0) {
              alertBox.error('Please enter some input');
            }
            else {
              if (checkAtoms) {
                var id = stateManager.addSelection(selectionFormControl.value, sid);
                finalizeSelection(id);
                if (sid == null) _editingForm = false;
              }
              else {
                alertBox.error('No atom selected');
              }
            }
          }
          else {
            alertBox.error('Invalid Input');
          }
        }
        function removeSelf() {
        }
        submit.ui.on('click', () => {
          if (controls.editMode == false) {
            if (allControl.value) {
              let id = stateManager.addSelection({});
              finalizeSelection(id);
              _editingForm = false;
            }
            else {
              checkAndAddSelection();
            }
          }
          else {
            if (allControl.value) {
              let id = sid;
              stateManager.addSelection({}, id);
              finalizeSelection(id);
            }
            else {
              let id = sid;
              checkAndAddSelection(id);
            }
          }
        });
        var self = this;
        cancel.ui.on('click', () => {
          if (controls.editMode) {
            parameters.hide();
          }
          else {
            boundingBox.detach();
            removeSelf(self);
            _editingForm = false;
          }
        });
        boundingBox.on('keyup', (e) => {
          if (e.key == 'Enter') {
            submit.ui.trigger('click');
          }
        });
        this.setProperty = function (id, specs) {
          if (Object.keys(specs).length == 0) {
            allCheckBox.setValue(true)
          } else {
            selectionSpecForm.setValue(specs);
          }
          finalizeSelection(id);
        }
        this.addStyle = function (selId, styleId, styleSpecs) {
          styleBox.addStyle(selId, styleId, styleSpecs);
        }
      }
      plusButton.ui.on('click', () => {
        if (!_editingForm) {
          var newSelection = new Selection();
          selections.append(newSelection.ui);
          _editingForm = true;
        } else {
          alertBox.warning('Please complete the previous form');
        }
      });
      this.empty = function () {
        selections.empty();
        _editingForm = false;
      }
      this.editSelection = function (id, selSpec, styleId, styleSpec) {
        var selectionUI = selections.children('[data-id=' + id + ']');
        if (selectionUI.length == 0) {
          var selection = new Selection();
          selection.setProperty(id, selSpec);
          selections.append(selection.ui);
          if (styleId != null) {
            selection.addStyle(id, styleId, styleSpec);
          }
        }
      }
    }
    function StyleBox(selId, side = 'left') {
      var styleBox = this.ui = $('<div></div>');
      _editingForm = false;
      var sid = this.sid = selId; 
      this.setSid = function (id) {
        sid = this.sid = id;
      }
      var styles = $('<div></div>');
      var scrollBox = $('<div></div>');
      styles.css('opacity', '0.9');
      var showArea = $('<div></div>');
      var addArea = $('<div></div>');
      addArea.css('text-align', 'center');
      var plusButton = new button(icons.plus, 20, { tooltip: 'Add New Style' });
      plusButton.ui.css('margin', '0px');
      this.selectionObjects = [];
      styleBox.append(showArea);
      styleBox.css('position', 'absolute');
      scrollBox.append(styles);
      showArea.append(scrollBox);
      var alertBox = new AlertBox();
      showArea.append(alertBox.ui);
      addArea.append(plusButton.ui);
      showArea.append(addArea);
      if (side == 'left') {
        styleBox.css('text-align', 'left');
      }
      else if (side == 'right') {
        styleBox.css('text-align', 'right');
      }
      else {
        styleBox.css('text-align', 'right');
      }
      showArea.css('box-sizing', 'border-box');
      showArea.css('padding', '3px');
      showArea.css('background-color', '#a4a4a4')
      showArea.css('border-radius', '4px');
      scrollBox.css('overflow', 'hidden');
      styles.css('box-sizing', 'content-box');
      function Style(sid) {
        var boundingBox = this.ui = $('<div></div>');
        var stid = this.id = null; 
        boundingBox.css({
          'background': '#e8e8e8',
          'padding': '4px 4px 2px 4px',
          'border-radius': '6px',
          'margin-bottom': '3px',
          'position': 'relative'
        });
        var header = $('<div></div>');
        boundingBox.append(header);
        var heading = $('<div></div>');
        var controls = $('<div></div>');
        header.append(heading, controls);
        heading.css({
          'font-family': 'Arial',
          'font-weight': 'bold',
          'font-size': '12px',
          'display': 'inline-block',
          'width': '60px'
        });
        controls.css({
          'display': 'inline-block'
        });
        header.hide();
        controls.editMode = false;
        var removeButton = new button(icons.minus, 16, { bfr: 0.5, backgroundColor: '#f06f6f', tooltip: 'Remove Style' });
        var editButton = new button(icons.pencil, 16, { tooltip: 'Edit Style' });
        var visibleButton = new button(icons.visible, 16, { tooltip: 'Show / Hide Style' });
        controls.append(removeButton.ui)
        controls.append(editButton.ui);
        controls.append(visibleButton.ui);
        var parameters = $('<div></div>');
        boundingBox.append(parameters);
        removeButton.ui.on('click', { parent: this, stid: stid }, function () {
          stateManager.removeStyle(sid, stid);
          boundingBox.detach();
        });
        editButton.ui.on('click', function () {
          parameters.toggle();
        });
        var hidden = false;
        visibleButton.ui.on('click', () => {
          stateManager.toggleHideStyle(sid, stid);
          if (hidden) {
            hidden = false;
            visibleButton.setSVG(icons.visible);
          }
          else {
            hidden = true;
            visibleButton.setSVG(icons.invisible);
          }
        });
        var styleFormControl = this.selectionValue = {
          key: 'Style Spec',
          value: null,
          active: true
        }
        var styleSpecForm = new $DeMol.UI.Form(validAtomStyleSpecs, styleFormControl);
        parameters.append(styleSpecForm.ui);
        var submitControls = $('<div></div>');
        var submit = new button(icons.tick, 16, { backgroundColor: 'lightgreen', tooltip: 'Submit' });
        var cancel = new button(icons.cross, 16, { backgroundColor: 'lightcoral', tooltip: 'Cancel' });
        submitControls.append(submit.ui, cancel.ui);
        var alertBox = new AlertBox();
        parameters.append(alertBox.ui);
        parameters.append(submitControls);
        function finalizeStyle(id) {
          header.show();
          controls.editMode = true;
          stid = id;
          heading.text('Sty#' + id);
          parameters.hide();
        }
        function checkAndAddStyle(stid = null) {
          var validate = styleSpecForm.validate();
          if (validate) {
            styleSpecForm.getValue();
            if (Object.keys(styleFormControl.value).length == 0) {
              alertBox.error('Please enter some value');
            }
            else {
              var id = stateManager.addStyle(styleFormControl.value, sid, stid);
              finalizeStyle(id);
              if (stid == null) _editingForm = false;
            }
          }
          else {
            alertBox.error('Invalid Input');
          }
        }
        submit.ui.on('click', () => {
          if (controls.editMode == false) {
            checkAndAddStyle();
          }
          else {
            var id = stid
            styleSpecForm.getValue();
            if (Object.keys(styleFormControl.value).length == 0) {
              alertBox.error('Please enter some value');
            }
            else {
              checkAndAddStyle(id);
            }
          }
        });
        cancel.ui.on('click', () => {
          if (controls.editMode) {
            parameters.hide();
          }
          else {
            boundingBox.detach();
          }
        });
        boundingBox.on('keyup', (e) => {
          if (e.key == 'Enter') {
            submit.ui.trigger('click');
          }
        });
        this.updateStyle = function (styleId, styleSpec) {
          styleSpecForm.setValue(styleSpec);
          finalizeStyle(styleId);
        }
      }
      plusButton.ui.on('click', () => {
        if (!_editingForm) {
          var newStyle = new Style(sid);
          styles.append(newStyle.ui);
          _editingForm = true;
        }
        else {
          alertBox.warning('Please complete editing the current form');
        }
      });
      this.addStyle = function (selectionId, styleId, styleSpecs) {
        var style = new Style(selectionId);
        styles.append(style.ui);
        style.updateStyle(styleId, styleSpecs);
      }
    }
    function AlertBox(config) {
      var boundingBox = this.ui = $('<div></div>');
      config = config || {}
      var delay = config.delay || 5000;
      var autohide = (config.autohide == undefined) ? true : config.autohide;
      boundingBox.css({
        'font-family': 'Arial',
        'font-size': '14px',
        'padding': '3px',
        'border-radius': '4px',
        'margin-top': '2px',
        'margin-bottm': '2px',
        'font-weight': 'bold',
        'text-align': 'center',
      });
      boundingBox.hide();
      function hide() {
        if (autohide) {
          setTimeout(() => {
            boundingBox.hide();
          }, delay);
        }
      }
      this.error = function (msg) {
        boundingBox.css({
          'background': 'lightcoral',
          'color': 'darkred',
          'border': '1px solid darkred'
        });
        boundingBox.text(msg);
        boundingBox.show();
        hide();
      }
      this.warning = function (msg) {
        boundingBox.css({
          'background': '#fff3cd',
          'color': '#856409',
          'border': '1px solid #856409'
        });
        boundingBox.text(msg);
        boundingBox.show();
        hide();
      }
      this.message = function (msg) {
        boundingBox.css({
          'background': 'lightgreen',
          'color': 'green',
          'border': '1px solid green'
        });
        boundingBox.text(msg);
        boundingBox.show();
        hide();
      }
    }
    function ContextMenu() {
      var boundingBox = this.ui = $('<div></div>');
      boundingBox.css('position', 'absolute');
      boundingBox.css('border-radius', '3px');
      boundingBox.css('background', '#f1f1f1');
      boundingBox.css('z-index', 99);
      var contentBox = $('<div></div>');
      contentBox.css('position', 'relative');
      boundingBox.css('opacity', '0.85');
      boundingBox.append(contentBox);
      contentBox.css({
        'background': '#f1f1f1',
        'border-radius': '4px',
        'padding': '4px',
        'width': '140px'
      });
      var labelMenuStyle = {
        'background': '#d3e2ee',
        'padding': '2px',
        'font-family': 'Arial',
        'font-weight': 'bold',
        'font-size': '12px',
        'border-radius': '2px',
      }
      var removeLabelMenu = $('<div></div>');
      removeLabelMenu.text('Remove Label');
      removeLabelMenu.css(labelMenuStyle);
      removeLabelMenu.css('margin-bottom', '3px');
      contentBox.append(removeLabelMenu);
      removeLabelMenu.hide();
      var propertyKeys = Object.keys(validAtomSpecs);
      var propertyList = [];
      var propertyObjectList = [];
      propertyKeys.forEach((prop) => {
        var propObj = validAtomSpecs;
        if (propObj[prop].prop === true) {
          propertyList.push(prop);
        }
      });
      var propertyMenu = $('<div></div>');
      contentBox.append(propertyMenu);
      function Property(key, value) {
        this.row = $('<tr></tr>');
        var propLabelValue = this.control = {
          key: '',
          value: null,
          active: true,
          name: key,
        }
        this.key = key;
        this.value = value;
        var checkbox = new $DeMol.UI.Form.Checkbox(propLabelValue);
        var checkboxHolder = $('<td></td>');
        checkboxHolder.append(checkbox.ui);
        var keyHolder = $('<td></td>');
        var separatorHolder = $('<td></td>').text(':');
        var valueHolder = $('<td></td>');
        this.row.append(checkboxHolder, keyHolder, separatorHolder, valueHolder);
        keyHolder.text(key);
        if (typeof (value) == "number") {
          valueHolder.text(value.toFixed(2));
        } else {
          valueHolder.text(value.replace(/\^/g, ''));
        }
      }
      function setProperties(atom) {
        propertyMenu.empty();
        propertyObjectList = [];
        var propertyTable = $('<table></table>');
        propertyList.forEach((prop) => {
          var propObj = new Property(prop, atom[prop]);
          propertyTable.append(propObj.row);
          propertyObjectList.push(propObj);
        });
        propertyMenu.append(propertyTable);
        var labelStyleHolder = $('<div><div>');
        var labelStyle = $('<div><div>');
        labelStyle.text('Style');
        labelStyle.css({
          'display': 'inline-block',
          'font-family': 'Arial',
          'font-size': '14px',
          'margin-right': '6px',
          'margin-left': '6px'
        });
        var stylesForLabel = new $DeMol.UI.Form.ListInput(labelStyle, Object.keys($DeMol.labelStyles));
        stylesForLabel.ui.css({
          'display': 'inline-block'
        });
        stylesForLabel.setValue('milk');
        labelStyleHolder.append(labelStyle, stylesForLabel.ui);
        propertyMenu.append(labelStyleHolder);
        var submit = new button(icons.tick, 18, { backgroundColor: 'lightgreen', tooltip: 'Submit' });
        var cancel = new button(icons.cross, 18, { backgroundColor: 'lightcoral', tooltip: 'Cancel' });
        var controlButtons = $('<div></div>');
        controlButtons.append(submit.ui, cancel.ui);
        var alertBox = new AlertBox();
        propertyMenu.append(alertBox.ui);
        propertyMenu.append(controlButtons);
        submit.ui.on('click', () => {
          var props = processPropertyList();
          var labelStyleValidation = stylesForLabel.validate();
          if (props != null) {
            if (labelStyleValidation) {
              stateManager.addAtomLabel(props, atom, stylesForLabel.getValue().value);
              stateManager.exitContextMenu(false);
            }
            else {
              alertBox.error('Select style for label');
            }
          }
          else {
            alertBox.error('No value selected for label');
          }
        });
        cancel.ui.on('click', () => {
          stateManager.exitContextMenu();
        });
      }
      var labelHolder = $('<div></div>');
      contentBox.append(labelHolder);
      var addMenu = $('<div></div>');
      contentBox.append(addMenu);
      addMenu.css('width', '100%');
      var addLabelMenu = $('<div></div>');
      addMenu.append(addLabelMenu);
      addLabelMenu.text('Add Label');
      addLabelMenu.css(labelMenuStyle);
      addLabelMenu.css('margin-bottom', '3px');
      addLabelMenu.hide();
      var editMenu = $('<div></div>');
      contentBox.append(editMenu);
      contentBox.css({
        'position': 'relative',
      });
      editMenu.css({
        'background': '#dfdfdf',
        'border-radius': '3px',
        'font-family': 'Arial',
        'font-weight': 'bold',
        'font-size': '12px',
        'box-sizing': 'border-box',
        'width': '100%',
      });
      editMenu.hide();
      var alertBox = new AlertBox({ autohide: false });
      contentBox.append(alertBox.ui);
      function generateAddLabelForm() {
        var addLabelForm = $('<div></div>');
        var addLabelValue = {
          text: {
            key: 'Label Text',
            value: null,
            active: true,
          },
          style: {
            key: 'Style',
            value: null,
            active: true,
          },
          sel: {
            key: 'Selection',
            value: null,
            active: true,
          }
        }
        var formModifierControl = $('<div></div>');
        var removeButton = new button(icons.minus, 16);
        var tick = new button(icons.tick, 16, { backgroundColor: 'lightgreen', tooltip: 'Submit' });
        var cross = new button(icons.cross, 16, { backgroundColor: 'lightcoral', tooltip: 'Cancel' });
        formModifierControl.append(removeButton.ui, tick.ui, cross.ui);
        removeButton.ui.hide();
        addLabelForm.append(formModifierControl);
        var addLabelTextBox = $('<div></div>');
        var lt = $('<div></div>').text('Label Text');
        var addLabelTextInput = new $DeMol.UI.Form.Input(addLabelValue.text);
        addLabelTextBox.append(lt, addLabelTextInput.ui);
        var width = 126
        addLabelTextInput.setWidth(width);
        addLabelForm.append(addLabelTextBox);
        var addLabelStyleBox = $('<div></div>');
        var ls = $('<div></div>').text('Label Style');
        var addLabelStyleInput = new $DeMol.UI.Form.ListInput(addLabelValue.style, Object.keys($DeMol.labelStyles));
        addLabelStyleInput.setValue('milk');
        addLabelStyleBox.append(ls, addLabelStyleInput.ui);
        addLabelForm.append(addLabelStyleBox);
        var selectionList = stateManager.getSelectionList();
        var addLabelSelectionBox = $('<div></div>');
        var lsl = $('<div></div>').text('Label Selection');
        var addLabelSelectionInput = new $DeMol.UI.Form.ListInput(addLabelValue.sel, selectionList);
        addLabelSelectionBox.append(lsl, addLabelSelectionInput.ui);
        addLabelForm.append(addLabelSelectionBox);
        addLabelForm.css({
          'padding': '2px',
        });
        tick.ui.on('click', () => {
          var validate = true;
          if (!addLabelStyleInput.validate())
            validate = false;
          if (!addLabelTextInput.validate())
            validate = false;
          if (!addLabelSelectionInput.validate())
            validate = false;
          if (validate) {
            stateManager.addLabel(addLabelValue);
          }
        });
        cross.ui.on('click', () => {
          stateManager.exitContextMenu();
        });
        removeButton.ui.on('click', () => {
          stateManager.removeLabel()
        });
        addLabelForm.on('keyup', (e) => {
          if (e.key == 'Enter') {
            tick.ui.trigger('click');
          }
        });
        return {
          boundingBox: addLabelForm,
          text: addLabelTextInput,
          style: addLabelStyleInput,
          selection: addLabelSelectionInput,
          editMode: function () {
            removeButton.ui.show();
          }
        }
      }
      function processPropertyList() {
        var propsForLabel = {};
        propertyObjectList.forEach((propObj) => {
          if (propObj.control.value === true) {
            propsForLabel[propObj.key] = propObj.value;
          }
        });
        if (Object.keys(propsForLabel).length != 0) {
          return propsForLabel
        }
        else {
          return null;
        }
      }
      boundingBox.hide();
      this.hidden = true;
      this.atom = null;
      removeLabelMenu.on('click', { atom: this.atom }, function () {
        stateManager.removeAtomLabel(removeLabelMenu.atom);
      });
      this.show = function (x, y, atom, atomExist) {
        if (atomExist) {
          removeLabelMenu.show();
          removeLabelMenu.atom = atom;
        }
        else {
          removeLabelMenu.hide();
          removeLabelMenu.atom = null;
        }
        alertBox.ui.hide();
        addLabelMenu.hide();
        if (stateManager.getSelectionList().length == 0) {
          alertBox.message('Please create selections before adding label');
        } else {
          addLabelMenu.show();
        }
        unsetForm();
        setPosition(boundingBox, x, y);
        boundingBox.show();
        this.hidden = false;
        if (atom) {
          setProperties(atom);
          this.atom = atom;
        }
        else {
          propertyMenu.empty();
        }
      }
      this.hide = function (processContextMenu) {
        if (processContextMenu) {
          var propsForLabel = processPropertyList();
          if (propsForLabel != null) {
            stateManager.addAtomLabel(propsForLabel, this.atom);
          }
        }
        boundingBox.hide();
        this.hidden = true;
        unsetForm();
      }
      addLabelMenu.on('click', function () {
        var addLabelMenuForm = generateAddLabelForm();
        setForm(addLabelMenuForm);
      });
      function setForm(form) {
        editMenu.children().detach();
        editMenu.append(form.boundingBox);
        editMenu.show();
      }
      function unsetForm() {
        editMenu.children().detach();
        editMenu.hide();
      }
    }
    function SurfaceMenu() {
      var boundingBox = this.ui = $('<div></div>');
      var _editingForm = false;
      boundingBox.css({
        'position': 'absolute',
        'width': '140px',
        'text-align': 'right'
      });
      var surfaceButton = new button(icons.surface, 20, { tooltip: 'Toggle Surface Menu' });
      boundingBox.append(surfaceButton.ui);
      var displayBox = $('<div></div>');
      boundingBox.append(displayBox);
      boundingBox.css({
        'overflow': 'visible',
      });
      var newSurfaceSpace = $('<div></div>');
      newSurfaceSpace.css({
        'max-height': HEIGHT * 0.8,
        'overflow-y': 'auto',
        'overflow-x': 'hidden'
      });
      this.updateScrollBox = function (height) {
        newSurfaceSpace.css('max-height', height * 0.8);
      }
      displayBox.append(newSurfaceSpace);
      var alertBox = new AlertBox();
      displayBox.append(alertBox.ui);
      var addArea = $('<div></div>');
      var addButton = new button(icons.plus, 20, { tooltip: 'Add New Surface' });
      addArea.append(addButton.ui);
      displayBox.append(addArea);
      displayBox.hide();
      var surfaces = this.surfaces = [];
      function Surface() {
        var control = {
          surfaceType: {
            key: 'Surface Type',
            value: null
          },
          surfaceStyle: {
            key: 'Surface Style',
            value: null
          },
          surfaceFor: {
            key: 'Selection Atoms',
            value: null
          },
          surfaceOf: {
            key: 'Surface Generating Atoms',
            value: null,
          },
        };
        var surfaceBox = this.ui = $('<div></div>');
        surfaceBox.css({
          'margin-top': '3px',
          'padding': '6px',
          'border-radius': '3px',
          'background-color': '#e8e8e8',
          'width': '100%',
          'box-sizing': 'border-box',
          'opacity': 0.9,
          'text-align': 'left'
        });
        var heading = this.heading = $('<div></div>');
        var header = $('<div></div>');
        header.css({
          'text-align': 'right'
        })
        var toolButtons = $('<div></div>');
        var editButton = new button(icons.pencil, 16, { tooltip: 'Edit Surface' });
        var removeButton = new button(icons.minus, 16, { bfr: 0.5, backgroundColor: '#f06f6f' });
        toolButtons.append(removeButton.ui);
        toolButtons.append(editButton.ui);
        toolButtons.editButton = editButton;
        toolButtons.removeButton = removeButton;
        toolButtons.editMode = false;
        var defaultTextStyle = {
          'font-weight': 'bold',
          'font-family': 'Arial',
          'font-size': '12px'
        }
        heading.css('display', 'inline-block');
        heading.css(defaultTextStyle);
        toolButtons.css('display', 'inline-block');
        header.hide();
        header.append(heading, toolButtons);
        surfaceBox.append(header);
        var surfacePropertyBox = $('<div></div>');
        surfaceBox.append(surfacePropertyBox);
        var surfaceType = $('<div></div>');
        var labelSurfaceType = $('<div></div>');
        labelSurfaceType.text('Surface Type');
        labelSurfaceType.css(defaultTextStyle);
        var listSurfaceType = new $DeMol.UI.Form.ListInput(control.surfaceType, Object.keys($DeMol.SurfaceType));
        surfaceType.append(labelSurfaceType, listSurfaceType.ui);
        surfacePropertyBox.append(surfaceType);
        listSurfaceType.setValue(Object.keys($DeMol.SurfaceType)[0]);
        var surfaceStyle = $('<div></div>');
        var labelSurfaceStyle = $('<div></div>');
        var formSurfaceStyle = new $DeMol.UI.Form(validSurfaceSpecs, control.surfaceStyle);
        surfaceStyle.append(labelSurfaceStyle, formSurfaceStyle.ui);
        surfacePropertyBox.append(surfaceStyle);
        var surfaceOf = $('<div></div>');
        var labelSurfaceOf = $('<div></div>');
        labelSurfaceOf.text('Surface Atoms');
        labelSurfaceOf.css(defaultTextStyle);
        var surfaceGeneratorAtomType = ['self', 'all'];
        var surfaceGeneratorDesc = {
          'self': 'Atoms in the selections will be used to generate the surface',
          'all': 'All the atoms will be used to generate the surface'
        }
        var listSurfaceOf = new $DeMol.UI.Form.ListInput(control.surfaceOf, surfaceGeneratorAtomType);
        var hintbox = $('<div></div>');
        hintbox.css({
          'background-color': '#e4e4e4',
          'border': '1px solid grey',
          'color': 'grey',
          'padding': '2px',
          'border-radius': '3px',
          'font-family': 'Arial',
          'font-size': '12px',
          'font-weight': 'bold',
          'margin-top': '3px'
        });
        hintbox.hide();
        listSurfaceOf.update = function (control) {
          if (control.value == 'self') {
            hintbox.show();
            hintbox.text(surfaceGeneratorDesc['self']);
          }
          else if (control.value == 'all') {
            hintbox.show();
            hintbox.text(surfaceGeneratorDesc['all']);
          }
          else {
            hintbox.hide();
          }
        }
        listSurfaceOf.setValue('all');
        surfaceOf.append(labelSurfaceOf, listSurfaceOf.ui, hintbox);
        surfacePropertyBox.append(surfaceOf);
        var selectionListElement = ['all'].concat(stateManager.getSelectionList());
        var surfaceFor = $('<div></div>');
        var labelSurfaceFor = $('<div></div>');
        labelSurfaceFor.text('Show Atoms');
        labelSurfaceFor.css(defaultTextStyle);
        var listSurfaceFor = new $DeMol.UI.Form.ListInput(control.surfaceFor, selectionListElement);
        listSurfaceFor.setValue('all');
        surfaceFor.append(labelSurfaceFor, listSurfaceFor.ui);
        surfacePropertyBox.append(surfaceFor);
        var alertBox = new AlertBox();
        surfacePropertyBox.append(alertBox.ui);
        var controlButton = $('<div></div>');
        var submit = new button(icons.tick, 16, { backgroundColor: 'lightgreen', tooltip: 'Submit' });
        var cancel = new button(icons.cross, 16, { backgroundColor: 'lightcoral', tooltip: 'Cancel' });
        controlButton.append(submit.ui);
        controlButton.append(cancel.ui);
        surfacePropertyBox.append(controlButton);
        removeButton.ui.on('click', { surfaceBox: surfaceBox }, function (e) {
          var id = e.data.surfaceBox.data('surf-id');
          surfaceBox.remove();
          stateManager.removeSurface(id);
        });
        editButton.ui.on('click', function () {
          surfacePropertyBox.toggle();
        });
        var validateInput = this.validateInput = function () {
          var validated = true;
          if (!listSurfaceFor.validate()) {
            validated = false;
          }
          if (!listSurfaceOf.validate()) {
            validated = false;
          }
          if (!listSurfaceType.validate()) {
            validated = false;
          }
          if (!formSurfaceStyle.validate()) {
            validated = false;
          }
          return validated;
        }
        function finalize(id) {
          surfaceBox.data('surf-id', id);
          heading.text('surf#' + id);
          header.show();
          toolButtons.editMode = true;
          surfacePropertyBox.hide();
        }
        submit.ui.on('click', {}, function () {
          listSurfaceFor.getValue();
          listSurfaceOf.getValue();
          listSurfaceType.getValue();
          formSurfaceStyle.getValue();
          if (validateInput()) {
            if (toolButtons.editMode === false) {
              var id = stateManager.addSurface(control);
              control.id = id;
              finalize(id);
              surfaces.push(this);
              _editingForm = false;
            }
            else {
              formSurfaceStyle.getValue();
              control.id = surfaceBox.data('surf-id');
              stateManager.editSurface(control); 
              surfacePropertyBox.hide();
            }
          }
          else {
            alertBox.error('Invalid Input');
          }
        });
        cancel.ui.on('click', {}, function () {
          if (toolButtons.editMode == false) {
            surfaceBox.detach();
            surfaceBox.remove();
            _editingForm = false;
          }
          else {
            surfacePropertyBox.hide();
            toolButtons.editMode = false;
          }
        });
        surfaceBox.on('keyup', (e) => {
          if (e.key == 'Enter') {
            submit.ui.trigger('click');
          }
        });
        this.editSurface = function (id, surfaceSpec) {
          finalize(id);
          listSurfaceType.setValue(surfaceSpec.surfaceType.value);
          formSurfaceStyle.setValue(surfaceSpec.surfaceStyle.value);
          listSurfaceOf.setValue(surfaceSpec.surfaceOf.value);
          listSurfaceFor.setValue(surfaceSpec.surfaceFor.value);
          listSurfaceFor.getValue();
          listSurfaceOf.getValue();
          listSurfaceType.getValue();
          formSurfaceStyle.getValue();
        }
      }
      addButton.ui.on('click', { surfaces: this }, function () {
        if (!_editingForm) {
          var newSurface = new Surface();
          newSurfaceSpace.append(newSurface.ui);
          _editingForm = true;
        } else {
          alertBox.warning('Please complete the previous form first');
        }
      });
      surfaceButton.ui.on('click', () => {
        displayBox.toggle();
      });
      this.empty = function () {
        newSurfaceSpace.empty();
        _editingForm = false;
      }
      this.addSurface = function (id, surfaceSpec) {
        var newSurface = new Surface();
        newSurfaceSpace.append(newSurface.ui);
        newSurface.editSurface(id, surfaceSpec);
      }
    }
    function setPosition(ele, left, top) {
      ele.css('left', left);
      ele.css('top', top);
    }
    function setLocation(parent, child, x_type = 'left', y_type = 'top', x_offset = 0, y_offset = 0) {
      child.css('z-index', 99);
      var p_width = getWidth(parent);
      var p_height = getHeight(parent);
      var c_width = child.outerWidth(); 
      var c_height = child.outerHeight(); 
      var padding = parseInt(parent.css('padding').replace('px', ''));
      padding = (padding) ? padding : 0;
      var c_position = {
        left: 0,
        top: 0
      };
      if (x_type == 'left') {
        c_position.left = padding + x_offset;
      }
      else if (x_type == 'center') {
        c_position.left = p_width / 2 - c_width / 2 + x_offset;
      }
      else if (x_type == 'right') {
        c_position.left = p_width - c_width - padding + x_offset;
      }
      else {
        c_position.left = x_offset + padding;
      }
      if (y_type == 'top') {
        c_position.top = y_offset + padding;
      }
      else if (y_type == 'center') {
        c_position.top = p_height / 2 - c_height / 2 + y_offset;
      }
      else if (y_type == 'bottom') {
        c_position.top = p_height - c_height - y_offset - padding;
      }
      else {
        c_position.top = y_offset + padding;
      }
      setPosition(child, c_position.left, c_position.top);
    }
    function getRect(container) {
      let div = container[0];
      let rect = div.getBoundingClientRect();
      if (rect.width == 0 && rect.height == 0 && div.style.display === 'none') {
        let oldpos = div.style.position;
        let oldvis = div.style.visibility;
        div.style.display = 'block';
        div.style.visibility = 'hidden';
        div.style.position = 'absolute';
        rect = div.getBoundingClientRect();
        div.style.display = 'none';
        div.style.visibility = oldvis;
        div.style.position = oldpos;
      }
      return rect;
    }
    function getHeight(container) {
      return getRect(container).height;
    }
    function getWidth(container) {
      return getRect(container).width;
    }
    function button(svg, height, config) {
      config = config || {};
      var borderRadius = config.bfr * height || (height / 4); 
      var bgColor = config.backgroundColor || 'rgb(177, 194, 203)';
      var color = config.color || 'black';
      var hoverable = config.hoverable || 'true';
      var tooltipText = config.tooltip || null;
      var button = this.ui = $('<div></div>');
      var innerButton = $('<div></div>');
      button.append(innerButton);
      button.css('box-sizing', 'border-box');
      button.css('display', 'inline-block');
      button.css('margin', '3px');
      button.css('height', height);
      button.css('width', height);
      button.css('border-radius', borderRadius + 'px');
      button.css('color', color);
      button.css('background', bgColor);
      innerButton.css('display', 'flex');
      innerButton.css('justify-content', 'center');
      innerButton.css('align-items', 'center');
      innerButton.css('padding', '2px');
      this.setSVG = function (svg) {
        innerButton.empty();
        var formatted_content = $(svg);
        innerButton.append(formatted_content);
      }
      this.setSVG(svg);
      button.css({
        'position': 'relative'
      });
      if (tooltipText != null) {
        button.attr('title', tooltipText);
      }
      if (hoverable == 'true') {
        button.on('mouseenter',
          () => {
            button.css('box-shadow', '0px 0px 3px black');
          }).on('mouseleave',
            () => {
              button.css('box-shadow', 'none');
            }
          );
        button.on('mousedown', () => {
          button.css('box-shadow', '0px 0px 1px black');
        });
        button.on('mouseup', () => {
          button.css('box-shadow', '0px 0px 3px black');
        });
        button.on('mousemove', () => {
        });
      }
    }
  }
  return UI;
})();
