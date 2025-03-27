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
var validLabelResSpecs = {
    "font":{type:"string",gui:true},
    "fontSize":{type:"number", floatType : true,gui:true,step:1,default:12,min:1},
    "fontColor":{type:"color",gui:true},
    "fontOpacity":{type:"number", floatType : true,gui:true,step:0.1,default:1,min:0,max:1},
    "borderThickness":{type:"number", floatType : true,gui:true,step:0.1,default:1,min:0},
    "borderColor":{type:"color",gui:true},
    "borderOpacity":{type:"number", floatType : true,gui:true,step:0.1,default:1,min:0,max:1},
    "backgroundColor":{type:"color",gui:true},
    "backgroundOpacity":{type:"number", floatType : true,gui:true,step:0.1,default:1,min:0,max:1},
    "position":{type:"array",valid:false},
    "inFront":{type:"boolean",gui:true},
    "showBackground":{type:"boolean",gui:true},
    "fixed":{type:"boolean",gui:true},
    "alignment":{validItems:["topLeft","topCenter","topRight","centerLeft","center","centerRight","bottomLeft","bottomCenter","bottomRight"],gui:true},
    "scale":{type:"boolean",gui:false},
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
var enhanceSelection = function (selection) {
    var copiedObject = jQuery.extend(true, {}, selection);
    if (copiedObject.style != undefined) {
        delete copiedObject.style;
    } if (copiedObject.labelres != undefined) {
        delete copiedObject.labelres;
    } if (copiedObject.surface != undefined) {
        delete copiedObject.surface;
    }
    return copiedObject;
}
var keepOnlyValidProperties = function (object) {
    var copy = jQuery.extend(true, {}, object);
    for (var i in object) {
        if (i != "surface" || i != "labelres" || i != "style")
            delete copy[i]
    }
    return copy;
}
Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
var generateAttribute = function (name, value, parent) {
    var attribute = $('<li/>', {
        class: 'attribute'
    });
    var other = false;
    var validNames;
    var type;
    if (parent.type == "line" || parent.type == "stick" || parent.type == "cross" || parent.type == "sphere" || parent.type == "cartoon") {
        type = "style";
        validNames = validAtomStyleSpecs[parent.type].validItems;
        other = false;
    } else if (parent.type.toLowerCase() == "surface") {
        type = "surface";
        validNames = validSurfaceSpecs;
        other = true;
    } else if (parent.type.toLowerCase() == "labelres") {
        type = "labelres";
        validNames = validLabelResSpecs;
        other = true;
    } else if (name != "") {
        return undefined;
    }
    if (validNames[name] == undefined && name != "")
        return undefined
    var attribute_name = $('<select>', {
        class: 'attribute_name',
    }).appendTo(attribute);
    var obj_type = type;
    $.each(validNames, function (key, value) {
        if (value.gui) {
            attribute_name.append($("<option>").attr('value', key).text(key));
        }
    });
    attribute_name.val(name.toString())
    if (name.toString() == "") {
        var list;
        if (type == "style")
            list = query.selections[parent.index][type][parent.type];
        else
            list = query.selections[parent.index][type];
        var index;
        for (var i in validNames) {
            if (validNames[i].gui && list[i] == undefined) {
                index = i;
                break;
            }
        }
        name = index;
        if (name == undefined)
            return;
        attribute_name.val(index)
    }
    var delete_selection = $("<span/>", {
        html: "&#x2715;",
        class: "delete_attribute",
        "data-index": parent.index,
        "data-attr": name,
        "data-type": parent.type.toLowerCase(),
        "click": function () {
            if (other)
                deleteOtherAttribute(this);
            else
                deleteStyleAttribute(this);
        }
    }).appendTo(attribute);
    var itemIsDescrete = function (key) {
        if (key == "")
            return false;
        var type = validNames[key].type;
        return type == "boolean" || type == "color" || type == "colorscheme" || validNames[key].validItems != undefined
    }
    var attribute_value;
    if (itemIsDescrete(name)) {
        var validItemsValue;
        if (validNames[name].type != undefined)
            var type = validNames[name].type.toLowerCase();
        else
            var type = undefined
        if (type == "boolean") {
            validItemsValue = ["false", "true"];
        } else if (type == "colorscheme") {
            validItemsValue = Object.keys($DeMol.builtinColorSchemes).concat(['greenCarbon', 'cyanCarbon', 'yellowCarbon', 'whiteCarbon', 'magentaCarbon']);
        } else if (type == "color") {
            validItemsValue = Object.keys($DeMol.htmlColors);
            if (parent.type == 'cartoon') validItemsValue.unshift('spectrum');
        } else if (type == undefined) {
            validItemsValue = validNames[name].validItems;
        }
        var attribute_value = $('<select/>', {
            class: 'attribute_value',
        }).appendTo(attribute);
        $.each(validItemsValue, function (key, value) {
            attribute_value.append($("<option>").attr('value', value).text(value));
        });
        attribute_value.val(value.toString());
        if (value == "") {
            attribute_value.val(validItemsValue[0])
        }
    } else {
        if (value == "")
            value = validNames[name].default
        attribute_value = $('<input/>', {
            class: 'attribute_value',
            value: value,
        }).appendTo(attribute);
    }
    attribute_name.change(function () {
        var validItemsValue;
        var type = validNames[attribute_name.val()].type
        if (type == "boolean") {
            validItemsValue = ["false", "true"];
        } else if (type == "colorscheme") {
            validItemsValue = undefined;
        } else if (type == "color") {
            validItemsValue = undefined;
        } else if (type == undefined) {
            validItemsValue = validNames[name].validItems;
        }
        var defa = validNames[attribute_name.val()].default;
        var val;
        if (validItemsValue != undefined) {
            val = validItemsValue[0];
        } else {
            val = defa
        }
        if (attribute_value.children()[0] != undefined)
            attribute_value.children()[0].value = val;
        else
            attribute_value.val(val);
        render(obj_type == "surface");
    });
    attribute_value.change(function () {
        render(obj_type == "surface");
    });
    if (name != "" && attribute_value.prop("tagName") == "INPUT" && validNames[name].type == "number") {
        validNames[name].type == "number"
        attribute_value.attr("type", "number")
        attribute_value.attr("step", validNames[name].step)
        attribute_value.addClass("spinner")
        var max = validNames[name].max;
        var min = validNames[name].min;
        if (max != undefined)
            attribute_value.attr("max", max);
        if (min != undefined)
            attribute_value.attr("min", min);
    }
    return attribute;
}
var createOtherModelSpec = function (spec, type, selection_index) {
    var attributes = $('<ul/>', {
        "class": type.toLowerCase() + '_attributes',
    });
    for (var attribute_index in spec) {
        var attribute = generateAttribute(attribute_index, spec[attribute_index], { type: type, index: selection_index })
        if (attribute != undefined)
            attribute.appendTo(attributes);
    }
    var add_attribute = $('<button/>', {
        "class": "add_attribute",
        "text": "Add Attribute",
        "data-index": selection_index,
        "data-type": type,
        "click": function () { addOtherAttribute(this) },
    }).appendTo(attributes);
    return attributes;
}
var createStyleSpec = function (style_spec_object, style_spec_type, model_spec_type, selection_index) {
    var style_spec = $('<li/>', {
        "class": "style_spec",
    });
    var validNames = validAtomStyleSpecs;
    var style_spec_name = $('<select>', {
        class: 'style_spec_name',
    }).appendTo(style_spec);
    style_spec_name.change(function () {
        var obj = query.selections[selection_index]["style"][style_spec_type];
        for (var i in obj) {
            if (!validNames[style_spec_name.val()].validItems.hasOwnProperty(i)) {
                delete query.selections[selection_index]["style"][style_spec_type][i];
            }
        }
        query.selections[selection_index]["style"][style_spec_name.val()] = query.selections[selection_index]["style"][style_spec_type];
        delete query.selections[selection_index]["style"][style_spec_type];
        constructHTMLTree(query)
        render();
    });
    $.each(validNames, function (key, value) {
        if (value.gui) {
            style_spec_name.append($("<option>").attr('value', key).text(key));
        }
    });
    style_spec_name.val(style_spec_type.toString())
    if (style_spec_type == "") {
        var list = query.selections[selection_index].style;
        var index = 0
        for (var i in validNames) {
            if (validNames[i].gui && list[i] == undefined) {
                index = i;
                break;
            }
        }
        if (index == 0)
            return;
        style_spec_name.val(index)
    }
    var delete_selection = $("<span/>", {
        html: "&#x2715;",
        class: "delete_style_spec",
        "data-index": selection_index,
        "data-type": model_spec_type,
        "data-attr": style_spec_type,
        "click": function () { deleteStyleSpec(this) },
    }).appendTo(style_spec);
    var style_spec_attributes = $('<ul/>', {
        class: 'style_spec_attributes',
    }).appendTo(style_spec);
    for (var attribute_index in style_spec_object) {
        var attribute = generateAttribute(attribute_index, style_spec_object[attribute_index], { type: style_spec_type, index: selection_index })
        if (attribute != undefined)
            attribute.appendTo(style_spec_attributes);
    }
    var add_attribute = $('<button/>', {
        "class": "add_attribute",
        "text": "Add Attribute",
        "data-index": selection_index,
        "data-type": model_spec_type,
        "data-styletype": style_spec_type,
        "click": function () { addAttribute(this) },
    }).appendTo(style_spec);
    return style_spec;
}
var createStyle = function (model_spec_object, model_spec_type, selection_index) {
    var style = $('<span/>', {
        "class": "style",
    });
    var style_specs = $('<ul/>', {
        "class": 'style_specs',
    }).appendTo(style);
    for (var attribute_index in model_spec_object) {
        var spec = createStyleSpec(model_spec_object[attribute_index], attribute_index, model_spec_type, selection_index)
        if (spec != undefined)
            spec.appendTo(style_specs);
    }
    var add_style_spec = $('<button/>', {
        "class": "add_style_spec",
        "text": "Add Style Spec",
        "data-index": selection_index,
        "data-type": model_spec_type,
        "click": function () { addStyleSpec(this) },
    }).appendTo(style);
    return style;
}
var validNames = {
    "style": "Style",
    "surface": "Surface",
    "labelres": "LabelRes",
}
var createModelSpecification = function (model_spec_type, model_spec_object, selection_index) {
    var model_specification = null;
    if (model_spec_type == "style") {
        model_specification = createStyle(model_spec_object, model_spec_type, selection_index)
    } else if (model_spec_type == "surface") {
        model_specification = createOtherModelSpec(model_spec_object, "Surface", selection_index)
    } else if (model_spec_type == "labelres") {
        model_specification = createOtherModelSpec(model_spec_object, "LabelRes", selection_index)
    }
    return model_specification;
}
var createSelection = function (spec, object, index, type) {
    var selection = $("<li/>", {
        class: "selection"
    });
    var createHeader = function () {
        var selection_type = $('<p>', {
            class: 'selection_type',
            text: validNames[type],
        }).appendTo(selection);
        var attribute_pairs = [];
        for (var subselection in spec) {
            var obj = spec[subselection];
            if (typeof (obj) === 'object' && Object.keys(obj).length === 0)
                obj = ""; 
            attribute_pairs.push(subselection + ":" + obj);
        }
        var modifier = attribute_pairs.join(";");
        if (modifier == "")
            modifier = "all"
        var selection_spec = $('<input/>', {
            class: 'selection_spec',
            value: modifier,
        }).appendTo(selection);
        selection_spec.change(function () {
            render(type == "surface");
        })
    }
    var delete_selection = $("<div/>", {
        html: "&#x2715;",
        class: "delete_selection",
        "data-index": index,
        "data-type": "",
        "click": function () { deleteSelection(this); }
    }).appendTo(selection);
    createHeader()
    var ret = createModelSpecification(type, object, index);
    delete_selection.attr("data-type", type);
    ret.appendTo(selection);
    return selection;
}
var constructHTMLTree = function (query) {
    var parent = $('#selection_list');
    parent.text("");
    document.getElementById("model_type").value = query.file.type
    $("#model_type").change(function () {
        var val = $("#model_type").val().toUpperCase();
        if (prev_type != val) {
            render(true);
            run();
        }
        prev_type = val
    })
    $("#model_input").attr("value", query.file.path);
    $("#model_input").change(function () {
        var val = $("#model_input").val().toUpperCase();
        if (prev_in != val) {
            if (val.match(/^[1-9][A-Za-z0-9]{3}$/) || $("#model_type").val().toLowerCase() != "pdb") {
                render(true);
                run();
                var width = $("#sidenav").width();
            } else {
                if (prev_in != val)
                    alert("Invalid ProteinFormat")
            }
        }
        prev_in = val;
    })
    var arr = []
    for (var selection_index in query.selections) {
        var selection_object = query.selections[selection_index];
        var aug = enhanceSelection(selection_object);
        if (selection_object.style != undefined) {
            arr.push(createSelection(aug, selection_object.style, selection_index, "style"));
        }
        if (selection_object.surface != undefined) {
            arr.push(createSelection(aug, selection_object.surface, selection_index, "surface"))
        }
        if (selection_object.labelres != undefined) {
            arr.push(createSelection(aug, selection_object.labelres, selection_index, "labelres"))
        }
    }
    for (var i in arr) {
        if (arr[i] != undefined)
            parent.append(arr[i])
    }
}
var queryToURL = function (query) {
    var isSame = function (obj1, obj2) {
        for (var key in obj1) {
            if (Array.isArray(obj1[key])) {
                if (Array.isArray(obj2[key]))
                    return arraysEqual(obj1[key], obj2[key])
                return false;
            }
            if (obj2[key] == undefined || obj2[key] != obj1[key])
                return false;
        }
        return typeof (obj1) == typeof (obj2); 
    }
    var url = "";
    var unpackOther = function (object) {
        var objs = []
        $.each(object, function (key, value) {
            if (isSame(value, {}))
                value = ""
            if (Array.isArray(value)) {
                objs.push(key + ":" + value.join(","));
            } else {
                objs.push(key + ":" + value);
            }
        });
        return objs.join(";");
    }
    var unpackStyle = function (object) {
        var subStyles = []
        $.each(object, function (sub_style, sub_style_object) {
            var string = "";
            string += sub_style;
            if (Object.size(sub_style_object) != 0)
                string += ":";
            var assignments = []
            $.each(sub_style_object, function (key, value) {
                assignments.push(key + "~" + value);
            });
            string += assignments.join(",");
            subStyles.push(string)
        });
        return subStyles.join(";");
    }
    var unpackSelection = function (object) {
        var copiedObject = jQuery.extend(true, {}, object)
        var objs = [];
        var string = "";
        for (var obj in object) {
            if (obj == "style") {
                objs.push("style=" + unpackStyle(object.style))
            } else if (obj == "labelres" || obj == "surface") {
                objs.push(obj + "=" + unpackOther(object[obj]))
            }
        }
        var unpacked = unpackOther(enhanceSelection(object));
        var select = "select=" + unpacked
        if (select == "select=")
            select = "select=all"
        objs.unshift(select);
        return objs.join("&");
    }
    var objects = [];
    var str = query.file.type + "=" + query.file.path;
    if (query.file.helper != "")
        str += "&type=" + query.file.helper
    objects.push(str);
    for (var selection in query.selections) {
        objects.push(unpackSelection(query.selections[selection]))
    }
    return objects.join("&");
}
function File(path, type) {
    this.path = path;
    this.type = type;
    this.helper = "";
}
var Query = function () {
    this.selections = [];
    this.file = new File();
}
function setURL(urlPath) {
    window.history.pushState('page2', "Title", "viewer.html?" + urlPath);
}
var count = 0;
var urlToQuery = function (url) {
    if (url == "" || url.startsWith('session=') || url.startsWith('SESSION='))
        return new Query();
    var query = new Query();
    var tokens = url.split("&");
    function stringType(string) {
        if (string == "select")
            return "select"
        else if (string == "pdb" || string == "cid" || string == "url")
            return "file"
        else if (string == "style" || string == "surface" || string == "labelres") {
            count++;
            return string;
        } else if (string == "type") {
            return string
        }
        throw "Illegal url string : " + string;
        return;
    }
    var currentSelection = null;
    for (var token in tokens) {
        var uri = decodeURIComponent(tokens[token]);
        var i = uri.indexOf('=');
        var left = uri.slice(0, i);
        var type = stringType(left);
        var string = uri.slice(i + 1);
        var object = $DeMol.specStringToObject(string);
        if (type == "file") {
            query.file = new File(string, left);
        } else if (type == "select") {
            currentSelection = object
            query.selections.push(currentSelection);
        } else if (type == "style" || type == "surface" || type == "labelres") {
            if (currentSelection == null) {
                currentSelection = {}
                query.selections.push(currentSelection)
            }
            currentSelection[type] = object;
        } else if (type == type) {
            query.file.helper = string;
        }
    }
    if (query.selections[0] === {})
        delete query.selections[0]
    return query;
}
var updateQueryFromHTML = function () {
    query.file.path = $("#model_input").val();
    query.file.type = $("#model_type").val();
    var updateOther = function (other) {
        var object = {};
        var otherList = $(other).children(".attribute");
        otherList.each(function (li) {
            object[$(otherList[li]).children(".attribute_name")[0].value] = $(otherList[li]).children(".attribute_value")[0].value
        });
        return object;
    }
    var updateStyle = function (styl) {
        var object = {};
        var list = $(styl).children(".style_specs");
        list = $(list).children(".style_spec")
        list.each(function (li) {
            var subtype = $(list[li]).children(".style_spec_name")[0].value;
            object[subtype] = {};
            var otherList = $(list[li]).children(".style_spec_attributes")[0];
            otherList = $(otherList).children(".attribute")
            otherList.each(function (li) {
                var tag = object[subtype][$(otherList[li]).children(".attribute_name")[0].value] = $(otherList[li]).children(".attribute_value")[0].tagName
                object[subtype][$(otherList[li]).children(".attribute_name")[0].value] = $(otherList[li]).children(".attribute_value")[0].value;
            });
        });
        return object;
    }
    var updateSelectionElements = function (selection_string) {
        return $DeMol.specStringToObject(selection_string);
    }
    function arraysEqual(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length != b.length) return false;
        for (var i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
    var isSame = function (obj1, obj2) {
        for (var key in obj1) {
            if (Array.isArray(obj1[key])) {
                if (Array.isArray(obj2[key]))
                    return arraysEqual(obj1[key], obj2[key])
                return false;
            }
            if (obj2[key] == undefined || obj2[key] != obj1[key])
                return false;
        }
        return typeof (obj1) == typeof (obj2); 
    }
    function combine(obj1, src1) {
        for (var key in src1) {
            if (src1.hasOwnProperty(key)) obj1[key] = src1[key];
        }
        return obj1;
    }
    var selects = [];
    var listItems = $(".selection")
    listItems.each(function (index, value) {
        if (listItems.hasOwnProperty(index) && listItems[index].id != "spacer") {
            var getSubObject = function () {
                var attr = $(value);
                var attribute = attr[0]
                var type = $(attribute).children()[1].innerHTML.toLowerCase()
                if (type == "style") {
                    var style = updateStyle($(attribute).children(".style")[0])
                    return { "style": style }
                } else if (type == "surface") {
                    var surface = updateOther($(attribute).children(".surface_attributes")[0])
                    return { "surface": surface }
                } else if (type == "labelres") {
                    var labelres = updateOther($(attribute).children(".labelres_attributes")[0])
                    return { "labelres": labelres }
                }
            }
            var val = getSubObject();
            var selection_spec = $(listItems[index]).children(".selection_spec")[0].value;
            var selection = updateSelectionElements(selection_spec);
            var extended = combine(selection, val)
            selects.push(extended)
        }
    });
    query.selections = selects;
}
var query = urlToQuery(window.location.search.substring(1));
var render = function (surfaceEdited) {
    surfaceEdited = surfaceEdited == undefined ? false : surfaceEdited;
    updateQueryFromHTML();
    var url = queryToURL(query);
    setURL(url);
    constructHTMLTree(query);
    glviewer.setStyle({}, { line: {} });
    runcmds(url.split("&"), glviewer, surfaceEdited);
    glviewer.render();
}
var addSelection = function (type) {
    var surface = type == "surface"
    if (type == "style")
        query.selections.push({ "style": { line: {} } })
    else if (type == "surface")
        query.selections.push({ "surface": {} })
    else if (type == "labelres")
        query.selections.push({ "labelres": {} })
    constructHTMLTree(query);
    render(surface);
}
var deleteSelection = function (spec) {
    delete query.selections[spec.dataset.index][spec.dataset.type];
    if (query.selections[spec.dataset.index].surface == undefined && query.selections[spec.dataset.index].style == undefined && query.selections[spec.dataset.index].labelres == undefined)
        delete query.selections[spec.dataset.index]
    constructHTMLTree(query);
    render(spec.dataset.type == "surface");
}
var addModelSpec = function (type, selection) {
    var current_selection;
    current_selection = query.selections[selection.dataset.index]
    if (type == "style" || type == "surface" || type == "labelres") {
        if (current_selection[type] == null)
            current_selection[type] = {};
        else
            console.err(type + " already defined for selection");
    }
    constructHTMLTree(query);
    render();
}
var addStyleSpec = function (model_spec) {
    var defaultKey = "";
    var defaultValue = {};
    query.selections[model_spec.dataset.index][model_spec.dataset.type][defaultKey] = defaultValue;
    constructHTMLTree(query);
    render();
}
var deleteStyleSpec = function (spec) {
    delete query.selections[spec.dataset.index][spec.dataset.type][spec.dataset.attr]
    constructHTMLTree(query);
    render();
}
var addOtherAttribute = function (spec) {
    var defaultKey = "";
    var defaultValue = "";
    query.selections[spec.dataset.index][spec.dataset.type.toLowerCase()][defaultKey] = defaultValue;
    constructHTMLTree(query);
    render();
}
var deleteOtherAttribute = function (spec) {
    delete query.selections[spec.dataset.index][spec.dataset.type][spec.dataset.attr]
    constructHTMLTree(query);
    render(spec.dataset.type == "surface");
}
var addAttribute = function (style_spec) {
    var defaultKey = "";
    var defaultValue = "";
    query.selections[style_spec.dataset.index][style_spec.dataset.type][style_spec.dataset.styletype][defaultKey] = defaultValue;
    constructHTMLTree(query);
    render();
}
var deleteStyleAttribute = function (spec) {
    delete query.selections[spec.dataset.index]["style"][spec.dataset.type][spec.dataset.attr]
    constructHTMLTree(query);
    render();
}
var center = function () {
    glviewer.center({}, 1000, true);
}
var vrml = function () {
    var filename = "DeMol.wrl";
    var text = glviewer.exportVRML();
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveAs(blob, filename);
}
var savePng = function () {
    var filename = "DeMol.png";
    var text = glviewer.pngURI();
    var ImgData = text;
    var link = document.createElement('a');
    link.href = ImgData;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
var initializeSidebar = function (url) {
    var list = document.createElement('ul')
    document.getElementById('container').appendChild(list);
    $(window).on('popstate', function () {
        query = urlToQuery(window.location.search.substring(1));
        constructHTMLTree(query);
        render(true);
    });
    constructHTMLTree(query);
}
var showCreateSession = function () {
    $('#session_list2').hide();
    $('#session_list1').toggle();
}
var showJoinSession = function () {
    $('#session_list1').hide();
    $('#session_list2').toggle();
}
var toggle = true;
var width = 420;
var prev_in = $("#model_input").val();
var prev_type = $("#model_type").val();
var toggleHide = function () {
    if (toggle) {
        $("#menu").css("display", "none");
        $("#sidenav").css("width", width + "px");
        $('#createSession,#joinSession,#addStyle,#addSurface,#addLabelRes,#centerModel,#savePng,#vrmlExport').css("display", "inline")
        glviewer.translate(width / 2, 0, 400, false);
    } else {
        $("#sidenav").css("width", "0");
        $('#createSession,#joinSession,#addStyle,#addSurface,#addLabelRes,#centerModel,#savePng,#header,#vrmlExport').css("display", "none")
        $("#menu").css("display", "inline");
        width = $("#sidenav").width();
        glviewer.translate(-width / 2, 0, 400, false);
    }
    toggle = !toggle;
}
var glviewer = null;
var runcmds = function (cmds, viewer, renderSurface) {
    renderSurface = renderSurface == undefined ? true : renderSurface;
    if (renderSurface)
        viewer.removeAllSurfaces();
    viewer.removeAllLabels();
    var currentsel = {};
    for (var i = 0; i < cmds.length; i++) {
        var kv = cmds[i].split('=');
        var cmdname = kv[0];
        var cmdobj = $DeMol.specStringToObject(kv[1]);
        if (cmdname == 'select')
            currentsel = cmdobj;
        else if (cmdname == 'surface' && renderSurface) {
            viewer.addSurface($DeMol.SurfaceType.VDW, cmdobj, currentsel,
                currentsel);
        } else if (cmdname == 'style') {
            viewer.setStyle(currentsel, cmdobj);
        } else if (cmdname == 'addstyle') {
            viewer.addStyle(currentsel, cmdobj);
        } else if (cmdname == 'labelres') {
            viewer.addResLabels(currentsel, cmdobj);
        } else if (cmdname == 'colorbyelement') {
            if (typeof ($DeMol.elementColors[cmdobj.colorscheme]) != "undefined")
                viewer.setColorByElement(currentsel,
                    $DeMol.elementColors[cmdobj.colorscheme]);
        } else if (cmdname == 'colorbyproperty') {
            if (typeof (cmdobj.prop) != "undefined"
                && typeof ($DeMol.Gradient[cmdobj.scheme]) != "undefined") {
                viewer.setColorByProperty(currentsel, cmdobj.prop,
                    new $DeMol.Gradient[cmdobj.scheme]());
            }
        }
    }
    let fetchLabel = function(atom) {
      let label = atom.elem;
      if(atom.resn && atom.resi) {
        label = atom.resn+atom.resi+":"+atom.atom
      } 
      return label;
    }
    var hover_label = null;
    viewer.setHoverable({},true, 
        function(atom){  
          if(atom._clicklabel == undefined) {
            label = fetchLabel(atom);
            hover_label = viewer.addLabel(label,
                    {position: atom, fontSize: 12, backgroundColor: "black", backgroundOpacity: 0.5, alignment: "bottomCenter"});
            viewer.render();          
          }
        },
        function(){ 
          if(hover_label) {
           viewer.removeLabel(hover_label);
           viewer.render();
          }
        } 
    );
    var lastclicked = null;
    viewer.setClickable({}, true, function(atom) {      
        if(hover_label) {
         viewer.removeLabel(hover_label);
        }
        if(lastclicked == null) {
        let label = fetchLabel(atom);
        atom._clicklabel =
          viewer.addLabel(label,
                    {position: atom, fontSize: 12, backgroundColor: "blue", backgroundOpacity: 0.75, alignment: "bottomCenter"});
        lastclicked = atom;
      } else {
        viewer.removeLabel(lastclicked._clicklabel);
        lastclicked._clicklabel = null;
        if(lastclicked != atom) {
          let start = new $DeMol.Vector3(lastclicked.x, lastclicked.y, lastclicked.z);
          let end = new $DeMol.Vector3(atom.x, atom.y, atom.z);
          let dlabel = null;
          viewer.addCylinder({
              dashed:true,
              radius:.05,
              dashLength:0.25,
              gapLength:.15,
              start:start,
              end:end,
              fromCap:2,
              toCap:2,
              color:"blue",
              clickable: true,
              callback: function(shape) {
                viewer.removeShape(shape);
                viewer.removeLabel(dlabel);
              }
          });
          let dist = $DeMol.GLShape.distance_from(start,end);
          let mid = start.add(end).multiplyScalar(.5);
          dlabel = viewer.addLabel(dist.toFixed(3),{position: mid, fontSize: 12, backgroundColor: "blue", 
            backgroundOpacity: 0.75, alignment: "bottomCenter"});          
        }
        lastclicked = null;
      }
      viewer.render();
    });
};
function run() {
    try {
        var url = window.location.search.substring(1);
        url = decodeURIComponent(url)
        var cmds = url.split("&");
        var first = cmds.splice(0, 1)[0];
        var pos = first.indexOf('=');
        var src = first.substring(0, pos), data = first
            .substring(pos + 1);
        var type = "pdb";
        if (glviewer === null) {
            glviewer = $DeMol.createViewer("gldiv", {
                defaultcolors: $DeMol.rasmolElementColors
            });
            glviewer.setBackgroundColor(0xffffff);
        } else {
            glviewer.clear();
        }
        if (src == 'session' || src == 'SESSION') {
            joinSession(data);
        }
        if (src == 'pdb') {
            console.log(data)
            data = data.toUpperCase();
            if (!data.match(/^[1-9][A-Za-z0-9]{3}$/)) {
                return;
            }
            data = "https:
                + ".pdb";
            type = "pdb";
        } if (src == 'cif') {
            data = data.toUpperCase();
            if (!data.match(/^[1-9][A-Za-z0-9]{3}$/)) {
                return;
            }
            data = "https:
                + ".cif";
            type = "cif";
        } else if (src == 'cid') {
            type = "sdf";
            data = "https:
                + data + "/StructureDataFormat?record_type=3d";
        } else if (src == 'mmtf') {
            data = data.toUpperCase();
            data = 'https:
            type = 'mmtf';
        } else { 
            type = data.substring(data.lastIndexOf('.') + 1);
            if (type == 'gz') {
                var base = data.substring(0, data.lastIndexOf('.'));
                type = base.substring(base.lastIndexOf('.')) + '.gz';
            }
        }
        if (cmds[0] && cmds[0].indexOf('type=') == 0) {
            type = cmds[0].split('=')[1];
        }
        var start = new Date();
        if (/\.gz$/.test(data) || type == 'mmtf') { 
            $.ajax({
                url: data,
                type: "GET",
                dataType: "binary",
                responseType: "arraybuffer",
                processData: false,
                success: function (ret, txt, response) {
                    console.log("mtf fetch " + (+new Date() - start) + "ms");
                    var time = new Date();
                    glviewer.addModel(ret, type);
                    runcmds(cmds, glviewer);
                    glviewer.zoomTo();
                    glviewer.render();
                    console.log("mtf load " + (+new Date() - time) + "ms");
                }
            }).fail(function () {
                $.ajax({
                    url: "echo.cgi",
                    data: { 'url': data },
                    processData: false,
                    responseType: "arraybuffer",
                    dataType: "binary",
                    success: function (ret, txt, response) {
                        glviewer.addModel(ret, type);
                        runcmds(cmds, glviewer);
                        glviewer.zoomTo();
                        glviewer.render();
                    }
                })
            });
        } else {
            $.get(data, function (ret, txt, response) {
                console.log("alt fetch " + (+new Date() - start) + "ms");
                var time = new Date();
                glviewer.addModel(ret, type);
                runcmds(cmds, glviewer);
                glviewer.zoomTo();
                glviewer.render();
                console.log("alt load " + (+new Date() - time) + "ms");
            }).fail(function () {
                $.post("echo.cgi", {
                    'url': data
                }, function (ret, txt, response) {
                    if (src == 'pdb' && (ret.search("We're sorry, but the requested") >= 0 || ret == "")) {
                        type = 'cif';
                        data = data.replace(/pdb$/, 'cif');
                        $.post("echo.cgi", {
                            'url': data
                        }, function (ret, txt, response) {
                            glviewer.addModel(ret, type);
                            runcmds(cmds, glviewer);
                            glviewer.zoomTo();
                            glviewer.render();
                        })
                    } else {
                        glviewer.addModel(ret, type);
                        runcmds(cmds, glviewer);
                        glviewer.zoomTo();
                        glviewer.render();
                    }
                });
            });
        }
    }
    catch (e) {
        console
            .error("Could not instantiate viewer from supplied url: '"
                + e + "'");
        window.location = "http:
    }
}
$(document).ready(function () {
    var url = window.location.href.substring(window.location.href.indexOf("?") + 1);
    initSessions();
    run();
    var start_width;
    $("#sidenav").resizable({
        handles: 'e',
        minWidth: 300,
        maxWidth: 1000,
        start: function (event, ui) {
            start_width = $("#sidenav").width();
        },
        resize: function (event, ui) {
            glviewer.center();
            glviewer.translate(($("#sidenav").width() - start_width) / 2, 0, 0, false);
            start_width = $("#sidenav").width();
        }
    });
    $("#selection_list").sortable({
        items: ".selection:not(#spacer)",
        update: function (event, ui) {
            render(true);
        },
    });
    $("#selection_list").disableSelection();
    initializeSidebar(url);
});
