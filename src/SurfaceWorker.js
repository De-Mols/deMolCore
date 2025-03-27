$DeMol.workerString = function(){
    self.onmessage = function(oEvent) {
        var obj = oEvent.data;
        var type = obj.type;
        if (type < 0) 
        {
            self.atomData = obj.atoms;
            self.volume = obj.volume;
            self.ps = new ProteinSurface();  
        } else {
            var ps = self.ps;
            ps.initparm(obj.expandedExtent, (type == 1) ? false : true, self.volume);
            ps.fillvoxels(self.atomData, obj.extendedAtoms);
            ps.buildboundary();
            if (type === 4 || type === 2) {
                ps.fastdistancemap();
                ps.boundingatom(false);
                ps.fillvoxelswaals(self.atomData, obj.extendedAtoms);    
            }        
            ps.marchingcube(type);  
            var VandF = ps.getFacesAndVertices(obj.atomsToShow);
            self.postMessage(VandF);
        }
    };
}.toString().replace(/(^.*?\{|\}$)/g, "");
$DeMol.workerString += ";\nfunction _classCallCheck() {};"; 
$DeMol.workerString += ";\n"+$DeMol.Vector3.toString();
$DeMol.workerString += ";\n"+$DeMol.MarchingCubeInitializer.toString()+";\n\n";
$DeMol.workerString += ";\n"+$DeMol.PointGrid.toString()+";\n";
$DeMol.workerString += ";\nvar ProteinSurface = "+$DeMol.ProteinSurface.toString()+";\n";
$DeMol.SurfaceWorker = window.URL ? window.URL.createObjectURL(new Blob([$DeMol.workerString],{type: 'text/javascript'})) : undefined;
