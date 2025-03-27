$DeMol.StateManager = (function(){
  function States(glviewer, config){
    config = config || glviewer.getConfig();
    config.ui = true;
    var canvas = $(glviewer.getCanvas());
    var parentElement = $(glviewer.container);
    var height = parentElement.height();
    var width = parentElement.width();
    var offset = canvas.offset();
    var uiOverlayConfig = {
      height : height,
      width : width,
      offset : offset,
      ui : config.ui || undefined
    }
    var selections = {};
    var surfaces = {};
    var labels = {};
    var atomLabel = {};
    this.addSelection = function(spec, sid = null){
      var id = sid || makeid(4);
      var selectionSpec = {
        spec : spec,
        styles : {},
        hidden : false
      };
      if(sid == null)
        selections[id] = selectionSpec;
      else 
        selections[id].spec = selectionSpec.spec;
      render();
      return id;
    }
    this.checkAtoms = function(sel){
      var atoms = glviewer.selectedAtoms(sel);
      if( atoms.length > 0)
        return true
      return false;
    }
    this.toggleHide = function(sid){
      selections[sid].hidden = !selections[sid].hidden;
      render();
    }
    this.removeSelection = function(id) {
      delete selections[id];
      render();
    }
    this.addStyle = function( spec, sid, stid = null){
      var selection = selections[sid];
      var styleSpec = {
        spec : spec,
        hidden : false
      }
      var id = null; 
      if(stid == null) {
        id = makeid(4);
        selection.styles[id] = styleSpec
      }
      else {
        id = stid;
        selection.styles[id].spec = spec;
      }
      render();
      return id;
    }
    this.removeStyle = function(sid, stid){
      delete selections[sid].styles[stid];
      render();
    }
    this.toggleHideStyle = function(sid, stid){
      selections[sid].styles[stid].hidden = !selections[sid].styles[stid].hidden;
      render();
    }
    this.addSurface = function(property, callback){
      var id = makeid(4);
      property.id = id;
      var style = property.surfaceStyle.value;
      if(style == null)
        style = {};
      var sel = (property.surfaceFor.value == 'all') ? { spec : {} } : selections[property.surfaceFor.value];
      var generatorAtom = (property.surfaceOf.value == 'self')? sel.spec : {};
      glviewer.addSurface(
        $DeMol.SurfaceType[property.surfaceType.value],
        style,
        sel.spec,
        generatorAtom
      ).then((surfParam)=>{
        surfaces[id] = surfParam[0];
        if(callback != undefined)
          callback(id, surfParam[0]);
      }, ()=>{
      });
      return id;
    }
    this.removeSurface = function(id){
      glviewer.removeSurface(surfaces[id])
      delete surfaces[id];
    }
    this.editSurface = function(surfaceProperty){
      var style = surfaceProperty.surfaceStyle.value || {}
      var sel = (surfaceProperty.surfaceFor.value == 'all') ? { spec : {} } : selections[surfaceProperty.surfaceFor.value];
      var generatorAtom = (surfaceProperty.surfaceOf.value == 'self')? sel.spec : {};
      glviewer.removeSurface(surfaces[surfaceProperty.id]);
      glviewer.addSurface(
        $DeMol.SurfaceType[surfaceProperty.surfaceType.value],
        style,
        sel.spec,
        generatorAtom
      ).then((surfId)=>{
        surfaces[surfaceProperty.id] = surfId[0];
      });
    }
    this.getSelectionList = function(){
      return Object.keys(selections);
    }
    this.openContextMenu = function(atom, x, y){ 
      var atomExist = false;
      if(atom){
        atomExist = Object.keys(atomLabel).find((i)=>{
          if (i == atom.index)
            return true;
          else 
            return false;
        });
        if(atomExist != undefined )
          atomExist = true;
        else 
          atomExist = false;
      }
      if(this.ui) this.ui.tools.contextMenu.show(x, y, atom, atomExist);    
    }
    glviewer.userContextMenuHandler = this.openContextMenu.bind(this);
    this.addLabel = function(labelValue){
      labels[labelValue.sel.value] = labels[labelValue.sel.value] || [];
      var labelProp = $DeMol.labelStyles[labelValue.style.value];
      var selection = selections[labelValue.sel.value];
      var offset = labels[labelValue.sel.value].length;
      labelProp['screenOffset'] = new $DeMol.Vector2(0, -1*offset*35);
      labels[labelValue.sel.value].push(glviewer.addLabel(labelValue.text.value, labelProp, selection.spec));
      this.ui.tools.contextMenu.hide();
    }
    this.addAtomLabel = function(labelValue, atom, styleName='milk'){
      var atomExist = Object.keys(atomLabel).find((i)=>{
        if (i == atom.index)
          return true;
        else 
          return false;
      });
      if(atomExist != undefined )
        atomExist = true;
      else 
        atomExist = false;
      if(atomExist){
        this.removeAtomLabel(atom);
      }
      atomLabel[atom.index] = atomLabel[atom.index] || null;
      var labelProp = $DeMol.deepCopy($DeMol.labelStyles[styleName]);
      labelProp.position = {
        x : atom.x, y : atom.y, z : atom.z
      }
      var labelText = [];
      for (let key in labelValue){
        labelText.push(`${key} : ${labelValue[key]}`);
      }
      labelText = labelText.join('\n');
      atomLabel[atom.index] = glviewer.addLabel(labelText, labelProp);
    }
    this.exitContextMenu = function(processContextMenu = false){
        if(this.ui) {
            this.ui.tools.contextMenu.hide(processContextMenu);
        }
    }
    glviewer.container.addEventListener('wheel', this.exitContextMenu.bind(this), { passive: false });
    this.removeLabel = function(){
      this.ui.tools.contextMenu.hide();
    }
    this.removeAtomLabel = function(atom){
      var label = atomLabel[atom.index];
      glviewer.removeLabel(label);
      delete atomLabel[atom.index]; 
      this.ui.tools.contextMenu.hide();
    }
    this.addModel = function(modelDesc){
      glviewer.removeAllModels();
      glviewer.removeAllSurfaces();
      glviewer.removeAllLabels();
      glviewer.removeAllShapes();
      var query = modelDesc.urlType.value + ':' + modelDesc.url.value;
      $DeMol.download(query, glviewer, {}, ()=>{
        this.ui.tools.modelToolBar.setModel(modelDesc.url.value.toUpperCase());
      });
      selections = {};
      surfaces = {};
      atomLabel = {};
      labels = {};
      this.ui.tools.selectionBox.empty();
      this.ui.tools.surfaceMenu.empty();
    }
    function findSelectionBySpec(spec){
      var ids = Object.keys(selections);
      var matchingObjectIds = null;
      for(var i = 0; i < ids.length; i++){
        var lookSelection = selections[ids[i]].spec;
        var match = true;
        var parameters = Object.keys(spec);
        if( Object.keys(lookSelection).length == parameters.length){
          for(var j = 0; j < parameters.length; j++){
            if( lookSelection[parameters[j]] != spec[parameters[j]]){
              match = false;
              break;
            }
          }
        } else {
          match = false;
        }
        if(match){
          matchingObjectIds = ids[i];
          break;
        }
      }
      return matchingObjectIds;
    }
    this.createSelectionAndStyle = function(selSpec, styleSpec){
      var selId = findSelectionBySpec(selSpec);
      if(selId == null){
        selId = this.addSelection(selSpec);
      }
      var styleId = null;
      if(Object.keys(styleSpec).length != 0){
        styleId = this.addStyle(styleSpec, selId);
      }
      this.ui.tools.selectionBox.editSelection(selId, selSpec, styleId, styleSpec);
    };
    this.createSurface = function(surfaceType, sel, style, sid){
      var selId = findSelectionBySpec(sel);
      if(selId == null){
        selId = this.addSelection();
      }
      this.ui.tools.selectionBox.editSelection(selId, sel, null);
      surfaceType = Object.keys(style)[0];
      var surfaceInput = {
        surfaceType : {
          value : surfaceType
        },
        surfaceStyle : {
          value : style[surfaceType],
        },
        surfaceOf : {
          value : 'self'
        },
        surfaceFor : {
          value : selId
        }
      }
      var surfId = makeid(4);
      surfaces[surfId] = sid;
      this.ui.tools.surfaceMenu.addSurface(surfId, surfaceInput);
    };
    this.setModelTitle = function(title){
      this.ui.tools.modelToolBar.setModel(title);
    }
    canvas.on('click', ()=>{
      if(this.ui && this.ui.tools.contextMenu.hidden == false){
        this.ui.tools.contextMenu.hide();
      }
    });
    this.showUI = function(){
      var ui = new $DeMol.UI(this, uiOverlayConfig, parentElement);  
      return ui;
    };
    if(config.ui == true){
     this.ui = this.showUI(); 
    }
    this.initiateUI = function(){
      this.ui = new $DeMol.UI(this, uiOverlayConfig, parentElement);
      render();
    }
    this.updateUI = function(){
      if(this.ui){
        this.ui.resize();
      }
    };
    window.addEventListener("resize",this.updateUI.bind(this));
    if (typeof (window.ResizeObserver) !== "undefined") {
        this.divwatcher = new window.ResizeObserver(this.updateUI.bind(this));
        this.divwatcher.observe(glviewer.container);
    }
    function render(){
      glviewer.setStyle({});
      let selList = Object.keys(selections);
      selList.forEach( (selKey) =>{
        var sel = selections[selKey];
        if( !sel.hidden ) {
          var styleList = Object.keys(sel.styles);
          styleList.forEach((styleKey)=>{
            var style = sel.styles[styleKey];
            if( !style.hidden){
              glviewer.addStyle(sel.spec, style.spec);
            }
          });
          glviewer.setClickable(sel.spec, true, ()=>{});
          glviewer.enableContextMenu(sel.spec, true);
        }
        else {
          glviewer.setClickable(sel.spec, false, ()=>{});
          glviewer.enableContextMenu(sel.spec, false);
        }
      })
      glviewer.render();
    }
    function makeid(length) {
      var result           = '';
      var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      var charactersLength = characters.length;
      for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
     }
     return result;
    }
  }
  return States;
})()
