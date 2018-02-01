// Google this filename for the complete, commented version.  One javascript warning has been patched.

(function (scope, undefined) {
  var OBJ = {};                         if (typeof module !== 'undefined')  module.exports = OBJ;
                                        else                                scope.OBJ = OBJ;
OBJ.Mesh = function (objectData)
  {  
    var verts = [], vertNormals = [], textures = [], unpacked = {};

    unpacked.verts = [];    unpacked.norms = [];    unpacked.textures = [];   unpacked.hashindices = {};    unpacked.indices = [];  unpacked.index = 0;

    var lines = objectData.split('\n');

    var VERTEX_RE = /^v\s/;    var NORMAL_RE = /^vn\s/;    var TEXTURE_RE = /^vt\s/;    var FACE_RE = /^f\s/;    var WHITESPACE_RE = /\s+/;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      var elements = line.split(WHITESPACE_RE);
      elements.shift();

      if      (VERTEX_RE.test(line))   verts.push.apply(verts, elements);
      else if (NORMAL_RE.test(line))   vertNormals.push.apply(vertNormals, elements);
      else if (TEXTURE_RE.test(line))  textures.push.apply(textures, elements);
      else if (FACE_RE.test(line)) {
        var quad = false;
        for (var j = 0, eleLen = elements.length; j < eleLen; j++)
        {
            if(j === 3 && !quad) {  j = 2;  quad = true;  }
            if(elements[j] in unpacked.hashindices) 
                unpacked.indices.push(unpacked.hashindices[elements[j]]);
            else
            {
                var vertex = elements[ j ].split( '/' );

                unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 0]);   unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 1]);   
                unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 2]);
                
                if (textures.length) 
                  {   unpacked.textures.push(+textures[( (vertex[1] - 1)||vertex[0]) * 2 + 0]);
                      unpacked.textures.push(+textures[( (vertex[1] - 1)||vertex[0]) * 2 + 1]);  }
                
                unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 0]);   unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 1]);
                unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 2]);
                
                unpacked.hashindices[elements[j]] = unpacked.index;
                unpacked.indices.push(unpacked.index);
                unpacked.index += 1;
            }
            if(j === 3 && quad)   unpacked.indices.push( unpacked.hashindices[elements[0]]);
        }
      }
    }
    this.vertices = unpacked.verts;    this.vertexNormals = unpacked.norms;    this.textures = unpacked.textures;    this.indices = unpacked.indices;
  }

  var Ajax = function()
  {
    var _this = this;   this.xmlhttp = new XMLHttpRequest();
    this.get = function(url, callback)  {
      _this.xmlhttp.onreadystatechange = function(){
        if(_this.xmlhttp.readyState === 4){
          callback(_this.xmlhttp.responseText, _this.xmlhttp.status);
        } };
      _this.xmlhttp.overrideMimeType( "application/json" );   _this.xmlhttp.open('GET', url, true);   _this.xmlhttp.send();   // FIXED FROM WEB VERSION
    }
  };

  OBJ.downloadMeshes = function (nameAndURLs, completionCallback, meshes)
  { 
    var semaphore = Object.keys(nameAndURLs).length,  error = false;
    if(meshes === undefined) meshes = {};
    
    for(var mesh_name in nameAndURLs){
      if(nameAndURLs.hasOwnProperty(mesh_name)){
        new Ajax().get(nameAndURLs[mesh_name], (function(name) {
          return function (data, status) {
            if (status === 200) {   meshes[name] = new OBJ.Mesh(data);    }
            else {   error = true;    console.error('An error has occurred and the mesh "' + name + '" could not be downloaded.');  }
            semaphore--;
            if (semaphore === 0) {
              if (error) {
                console.error('An error has occurred and one or meshes has not been downloaded. The execution of the script has terminated.');  throw '';}
              completionCallback(meshes);
            }
          }
        })(mesh_name));
      }
    }
  };

  var _buildBuffer = function( gl, type, data, itemSize ){
    var buffer = gl.createBuffer();
    var arrayView = type === gl.ARRAY_BUFFER ? Float32Array : Uint16Array;
    gl.bindBuffer(type, buffer);    gl.bufferData(type, new arrayView(data),    gl.STATIC_DRAW);
    buffer.itemSize = itemSize;    buffer.numItems = data.length / itemSize;    return buffer;
  }

  OBJ.initMeshBuffers = function( gl, mesh ){
    mesh.normalBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.vertexNormals, 3);  mesh.textureBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.textures, 2);
    mesh.vertexBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.vertices, 3);       mesh.indexBuffer = _buildBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, mesh.indices, 1);
  }

  OBJ.deleteMeshBuffers = function( gl, mesh ){
    gl.deleteBuffer(mesh.normalBuffer);    gl.deleteBuffer(mesh.textureBuffer);    gl.deleteBuffer(mesh.vertexBuffer);    gl.deleteBuffer(mesh.indexBuffer);}
})(this);