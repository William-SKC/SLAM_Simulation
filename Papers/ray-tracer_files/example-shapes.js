// UCLA's Graphics Example Code (Javascript and C++ translations available), by Garett for CS174a.
// example_shapes.js is where you can define a number of objects that inherit from class Shape.  All Shapes have certain arrays.  These each manage either
// the shape's 3D vertex positions, 3D vertex normal vectors, 2D texture coordinates, or any other per-vertex quantity.  All subclasses of Shape inherit all these arrays.  
// Upon instantiation, any Shape subclass populates these lists in their own way, so we can then use GL calls -- special kernel functions to copy each of the lists
// one-to-one into new buffers in the graphics card's memory.
// Contents:
// 1.  Some example simple primitives -- really easy shapes are at the beginning of the list just to demonstrate how Shape is used. Mimic these when
//                                       making your own Shapes.  You'll find it much easier to work with than raw GL vertex arrays managed on your own.
//     The tutorial shapes are:    Triangle, Square, Tetrahedron, Windmill
// 2.  More difficult primitives:  Subdivision_Sphere, Shape_From_File (.obj file loaded using the library webgl-obj-loader.js )
//
// 3.  Grid-based primitives:   Surface_of_Revolution, Regular_2D_Polygon, Cylindrical_Tube, Cone_Tip, Torus, Grid_Sphere
//
// 4.  Example compound shapes, built from the above helper shapes:    Closed_Cone, Rounded_Closed_Cone, Capped_Cylinder, Rounded_Capped_Cylinder, 
//                                                                     Cube, Axis_Arrows, Text_Line
// *******************************************************

// 1.  TUTORIAL SHAPES:     ------------------------------------------------------------------------------------------------------------------------------

  // *********** TRIANGLE ***********
Declare_Any_Class( "Triangle",    // First, the simplest possible Shape – one triangle.  It has 3 vertices, each
  { 'populate'()                  // having their own 3D position, normal vector, and texture-space coordinate.
      { this.positions      = [ vec3(0,0,0), vec3(1,0,0), vec3(0,1,0) ];   // Specify the 3 vertices -- the point cloud that our Triangle needs.
        this.normals        = [ vec3(0,0,1), vec3(0,0,1), vec3(0,0,1) ];   // ...
        this.texture_coords = [ vec2(0,0),   vec2(10,0),  vec2(0,10)  ];   // ...
        this.indices        = [ 0, 1, 2 ];                                 // Index into our vertices to connect them into a whole Triangle.
      }         // End of our class Triangle’s list of methods.
  }, Shape )    // Notice we make Triangle a subclass of Shape.

  // *********** SQUARE ***********
Declare_Any_Class( "Square",    // A square, demonstrating shared vertices.  On any planar surface, the interior edges don't make any important seams.
  { 'populate'()                // In these cases there's no reason not to re-use data of the common vertices between triangles.  This makes all the
      {                         // vertex arrays (position, normals, etc) smaller and more cache friendly.
        this.positions     .push( vec3(-1,-1,0), vec3(1,-1,0), vec3(-1,1,0), vec3(1,1,0) ); // Specify the 4 vertices -- the point cloud that our Square needs.
        this.normals       .push( vec3(0,0,1), vec3(0,0,1), vec3(0,0,1), vec3(0,0,1) );     // ...
        this.texture_coords.push( vec2(0,0),   vec2(1,0),   vec2(0,1),   vec2(1,1)   );     // ...
        this.indices       .push( 0, 1, 2,     1, 3, 2 );                                   // Two triangles this time, indexing into four distinct vertices.
      }
  }, Shape )

  // *********** TETRAHEDRON ***********
Declare_Any_Class( "Tetrahedron",              // A demo of flat vs smooth shading.  Also our first 3D, non-planar shape.
  { 'populate'( using_flat_shading ) // Takes a boolean argument
      {
        var a = 1/Math.sqrt(3);
        if( !using_flat_shading )                                         // Method 1:  A tetrahedron with shared vertices.  Compact, performs better,
        {                                                                 // but can't produce flat shading or discontinuous seams in textures.
            this.positions     .push( [ 0, 0, 0], [1,0,0], [0,1,0], [0,0,1] );
            this.normals       .push( [-a,-a,-a], [1,0,0], [0,1,0], [0,0,1] );
            this.texture_coords.push( [ 0, 0   ], [1,0  ], [0,1, ], [1,1  ] );
            this.indices       .push( 0, 1, 2,   0, 1, 3,   0, 2, 3,    1, 2, 3 );  // Vertices are shared multiple times with this method.
        }
        else
        { this.positions.push( [0,0,0], [1,0,0], [0,1,0],         // Method 2:  A tetrahedron with 
                               [0,0,0], [1,0,0], [0,0,1],         // four independent triangles.
                               [0,0,0], [0,1,0], [0,0,1],
                               [0,0,1], [1,0,0], [0,1,0] );

          this.normals.push( [0,0,-1], [0,0,-1], [0,0,-1],        // This here makes Method 2 flat shaded, since
                             [0,-1,0], [0,-1,0], [0,-1,0],        // normal values can be constant per-triangle.
                             [-1,0,0], [-1,0,0], [-1,0,0],        // Repeat them for all three vertices.
                             [ a,a,a], [ a,a,a], [ a,a,a] );

          this.texture_coords.push( [0,0], [1,0], [1,0],    // Each face in Method 2 also gets its own set of texture coords
                                    [0,0], [1,0], [1,0],    //(half the image is mapped onto each face).  We couldn't do this
                                    [0,0], [1,0], [1,0],    // with shared vertices since this features abrupt transitions
                                    [0,0], [1,0], [1,0] );  // when approaching the same point from different directions.

          this.indices.push( 0, 1, 2,    3, 4, 5,    6, 7, 8,    9, 10, 11 );      // Notice all vertices are unique this time.
        }
      }
  }, Shape )

  // *********** WINDMILL ***********
Declare_Any_Class( "Windmill",          // As our shapes get more complicated, we begin using matrices and flow
  { 'populate'( num_blades )            // control (including loops) to generate non-trivial point clouds and connect them.
      {
          for( var i = 0; i < num_blades; i++ )     // A loop to automatically generate the triangles.
          {
              var spin = rotation( i * 360/num_blades, [ 0, 1, 0 ] );     // Rotate around a few degrees in XZ plane to place each new point.
              var newPoint  = mult_vec( spin, [ 1, 0, 0, 1 ] );           // Apply that XZ rotation matrix to point (1,0,0) of the base triangle.
              this.positions.push( [ newPoint[0], 0, newPoint[2] ],       // Store this XZ position.                  This is point 1.
                                   [ newPoint[0], 1, newPoint[2] ],       // Store it again but with higher y coord:  This is point 2.
                                   [ 0, 0, 0                     ] );     // All triangles touch this location.       This is point 3.

              var newNormal = mult_vec( spin, [ 0, 0, 1, 0 ] ).slice(0,3);  // Rotate our base triangle's normal (0,0,1) to get the new one.  Careful!
                                                                            // Normal vectors are not points; their perpendicularity constraint gives them
                                                                            // a mathematical quirk that when applying matrices you have to apply the
              this.normals       .push( newNormal, newNormal, newNormal );  // transposed inverse of that matrix instead.  But right now we've got a pure
              this.texture_coords.push( [ 0, 0 ], [ 0, 1 ], [ 1, 0 ] );     // rotation matrix, where the inverse and transpose operations cancel out.
              this.indices       .push( 3*i,       3*i + 1,  3*i + 2 ); // Procedurally connect the three
          }                                                             // new vertices into triangles.
      }
  }, Shape )

// 2.  MORE DIFFICULT PRIMITIVES:     ------------------------------------------------------------------------------------------------------------------------------

Declare_Any_Class( "Subdivision_Sphere",      // A subdivision surface ( Wikipedia ) is initially simple, then builds itself into a more and more detailed shape of the same
  {                                           // layout.  Each act of subdivision makes it a better approximation of some desired mathematical surface by projecting each new
                                              // point onto that surface's known implicit equation.  For a sphere, we begin with a closed 3-simplex (a tetrahedron).  For 
                                              // each face, connect the midpoints of each edge together to make more faces.  Repeat recursively until the desired level of 
    'populate'( max_subdivisions )            // detail is obtained.  Project all new vertices to unit vectors (onto the unit sphere) and group them into triangles by 
      {                                       // following the predictable pattern of the recursion.
        this.positions.push( [ 0, 0, -1 ], [ 0, .9428, .3333 ], [ -.8165, -.4714, .3333 ], [ .8165, -.4714, .3333 ] );  // Start with this equilateral tetrahedron
        
        this.subdivideTriangle( 0, 1, 2, max_subdivisions);  // Begin recursion.
        this.subdivideTriangle( 3, 2, 1, max_subdivisions);
        this.subdivideTriangle( 1, 0, 3, max_subdivisions);
        this.subdivideTriangle( 0, 2, 3, max_subdivisions); 
        
        for( let p of this.positions )
          { this.normals       .push( p.slice() );    // Each point has a normal vector that simply goes to the point from the origin.  Copy array value using slice().
            this.texture_coords.push( vec2( .5 + Math.atan2( p[2], p[0] ) / 2 / Math.PI, .5 - 2 * Math.asin( p[1] ) / 2 / Math.PI ) ); }
      },
    'subdivideTriangle'( a, b, c, count )   // Recurse through each level of detail by splitting triangle (a,b,c) into four smaller ones.
      { 
        if( count <= 0) { this.indices.push(a,b,c); return; }  // Base case of recursion - we've hit the finest level of detail we want.
                            
        var ab_vert = normalize( mix( this.positions[a], this.positions[b], 0.5) ),     // We're not at the base case.  So,
            ac_vert = normalize( mix( this.positions[a], this.positions[c], 0.5) ),     // build 3 new vertices at midpoints, and extrude them out to
            bc_vert = normalize( mix( this.positions[b], this.positions[c], 0.5) );     // touch the unit sphere (length 1).
              
        var ab = this.positions.push( ab_vert ) - 1,      // Here, push() returns the indices of the three new vertices (plus one).
            ac = this.positions.push( ac_vert ) - 1,  
            bc = this.positions.push( bc_vert ) - 1;  
        
        this.subdivideTriangle( a, ab, ac,  count - 1 );      // Recurse on four smaller triangles, and we're done.
        this.subdivideTriangle( ab, b, bc,  count - 1 );      // Skipping every fourth vertex index in our list takes you down one level of detail, and 
        this.subdivideTriangle( ac, bc, c,  count - 1 );      // so on, due to the way we're building it.
        this.subdivideTriangle( ab, bc, ac, count - 1 );
      }
  }, Shape )
  
Declare_Any_Class( "Shape_From_File",       // A versatile standalone shape that imports all its arrays' data from an
  { populate( filename )                    // .obj file.  See webgl-obj-loader.js for the rest of the relevant code.
      {
        this.filename = filename;
        this.webGLStart = function(meshes)
          {
            for( var j = 0; j < meshes.mesh.vertices.length/3; j++ )
            {
              this.positions.push( vec3( meshes.mesh.vertices[ 3*j ], meshes.mesh.vertices[ 3*j + 1 ], meshes.mesh.vertices[ 3*j + 2 ] ) );
              
              this.normals.push( vec3( meshes.mesh.vertexNormals[ 3*j ], meshes.mesh.vertexNormals[ 3*j + 1 ], meshes.mesh.vertexNormals[ 3*j + 2 ] ) );
              this.texture_coords.push( vec2( meshes.mesh.textures[ 2*j ],meshes.mesh.textures[ 2*j + 1 ]  ));
            }
            this.indices  = meshes.mesh.indices;
            this.normalize_positions();
            this.copy_onto_graphics_card( this.gl );
            this.ready = true;
          }                                                 // Begin downloading the mesh, and once it completes return control to our webGLStart function
        OBJ.downloadMeshes( { 'mesh' : filename }, ( function(self) { return self.webGLStart.bind(self) } ( this ) ) );
      },
    draw( graphics_state, model_transform, material )
      { if( this.ready ) Shape.prototype.draw.call(this, graphics_state, model_transform, material );   }   
  }, Shape )
  
// 3.  GRID-BASED PRIMITIVES:     ------------------------------------------------------------------------------------------------------------------------

  // SURFACE OF REVOLUTION: Produce a curved "sheet" of triangles with rows and columns.  Begin with an input array of points, defining a 1D path curving through 3D space -- 
  // now let each point be a row.  Sweep that whole curve around the Z axis in equal steps, stopping and storing new points along the way; let each step be a column.  Now we
  // have a flexible "generalized cylinder" spanning an area until total_curvature_angle (or if zero was passed in for that angle, we linearly extruded the curve instead,
  // translating up y).  Lastly, connect this curved grid of rows and columns into a tesselation of triangles by generating a certain predictable pattern of indices.
Declare_Any_Class( "Surface_Of_Revolution", 
  { 
    populate( rows, columns, points, total_curvature_angle = 360, texture_coord_range = [ [ 0, 1 ] [ 0, 1 ] ] ) 
      { 
        for( var i = 0; i <= rows; i++ )        // Travel down the curve described by the parameter "points"
        {
          var frac = i / rows * ( points.length - 1 ), alpha = frac - Math.floor( frac ),   // Which points in that array are we between?
              currPoint = add( scale_vec( 1 - alpha, points[ Math.floor( frac ) ] ), scale_vec( alpha, points[ Math.ceil( frac ) ] ) ).concat( 1 ),
              tangent   = frac-1 < 0     ? subtract( points[ 1 ], points[ 0 ] ) : subtract( points[ Math.ceil( frac ) ], points[ Math.ceil( frac - 1 ) ] );
              normal    = normalize( cross( tangent, vec3( 0, 1, 0 ) ) ).concat( 0 ); 
          
          for( var j = 0; j <= columns; j++ )
          {
            var spin = ( total_curvature_angle == 0 ) ? translation( 0, .1*j, 0 ) : rotation( j * total_curvature_angle/columns, 0, 0, 1 );
            this.positions.push( mult_vec( spin, currPoint ).slice(0,3) );           this.normals.push( mult_vec( spin, normal ).slice(0,3) );
            this.texture_coords.push( vec2( j/columns, -i/rows ) );
          }
        }
        for( var h = 0; h < rows; h++ )             // Generate a sequence like this (if #columns is 10):  "1 11 0  11 1 12  2 12 1  12 2 13  3 13 2  13 3 14  4 14 3..." 
          for( var i = 0; i < 2 * columns; i++ )
            for( var j = 0; j < 3; j++ )
              this.indices.push( h * ( columns + 1 ) + columns * ( ( i + ( j % 2 ) ) % 2 ) + ( Math.floor( ( j % 3 ) / 2 ) ? 
                                     ( Math.floor( i / 2 ) + 2 * ( i % 2 ) )       :         ( Math.floor( i / 2 ) + 1 ) ) );
      }
  }, Shape )
  
  //***************************** MORE SHAPES, THAT EXPLOIT THE ABOVE SURFACE_OF_REVOLUTION SHAPE TO CONSTRUCT THEMSELVES: *************
  
Declare_Any_Class( "Regular_2D_Polygon",  // Approximates a flat disk / circle
  { populate( rows, columns )
      { Surface_Of_Revolution.prototype.insert_transformed_copy_into( this, [ rows, columns, [ vec3( 0, 0, 0 ), vec3( 1, 0, 0 ) ] ] ); 
        for( let t in this.texture_coords ) { this.texture_coords[t][0] = this.positions[t][0]/2 + 0.5; this.texture_coords[t][1] = this.positions[t][1]/2 + 0.5; }
      } }, Shape )
  
Declare_Any_Class( "Cylindrical_Tube",    // An open tube shape with equally sized sections, pointing down Z locally.    
  { populate ( rows, columns ) 
      { Surface_Of_Revolution.prototype.insert_transformed_copy_into( this, [ rows, columns, [ vec3( 1, 0, .5 ), vec3( 1, 0, -.5 ) ] ] ); } }, Shape )

Declare_Any_Class( "Cone_Tip",            // Note:  Curves that touch the Z axis degenerate from squares into triangles as they sweep around
  { populate( rows, columns ) 
      { Surface_Of_Revolution.prototype.insert_transformed_copy_into( this, [ rows, columns, [ vec3( 0, 0,  1 ), vec3( 1, 0, -1 ) ] ] ); } }, Shape )

Declare_Any_Class( "Torus",
  { populate( rows, columns )  
      { var circle_points = [];
        for( var i = 0; i <= rows; i++ )   circle_points.push( vec3( 1.5 + Math.cos( i/rows * 2*Math.PI ), 0, -Math.sin( i/rows * 2*Math.PI ) ) );
        
        Surface_Of_Revolution.prototype.insert_transformed_copy_into( this, [ rows, columns, circle_points ] );     
      } }, Shape )
      
Declare_Any_Class( "Grid_Sphere",         // With lattitude / longitude divisions; this means singularities are at 
  { populate( rows, columns )             // the mesh's top and bottom.  Subdivision_Sphere is a better alternative.
      { var circle_points = [];
        for( var i = 0; i <= rows; i++ )   circle_points.push( vec3( -Math.sin( i/rows * Math.PI ), 0, Math.cos( i/rows * Math.PI ) ) );
        
        Surface_Of_Revolution.prototype.insert_transformed_copy_into( this, [ rows, columns, circle_points ] );     
      } }, Shape ) 
      
// 4.  COMPOUND SHAPES, BUILT FROM THE ABOVE HELPER SHAPES      ------------------------------------------------------------------------------------------------------------

Declare_Any_Class( "Closed_Cone",     // Combine a cone tip and a regular polygon to make a closed cone.
  { populate( rows, columns ) 
      { Cone_Tip          .prototype.insert_transformed_copy_into( this, [ rows, columns ] );    
        Regular_2D_Polygon.prototype.insert_transformed_copy_into( this, [ 1, columns ], mult( rotation( 180, 0, 1, 0 ), translation( 0, 0, 1 ) ) ); } }, Shape )

Declare_Any_Class( "Rounded_Closed_Cone",   // An alternative without two separate sections
  { populate( rows, columns )
      { Surface_Of_Revolution.prototype.insert_transformed_copy_into( this, [ rows, columns, [ vec3( 0, 0, 1 ), vec3( 1, 0, -1 ), vec3( 0, 0, -1 )  ] ] ) ; } }, Shape )

Declare_Any_Class( "Capped_Cylinder",   // Combine a tube and two regulra polygons to make a closed cylinder.  Flat shade this to make a prism, where #columns = #sides.
  { populate ( rows, columns )
      { Cylindrical_Tube  .prototype.insert_transformed_copy_into( this, [ rows, columns ] );
        Regular_2D_Polygon.prototype.insert_transformed_copy_into( this, [ 1, columns ],                                 translation( 0, 0, .5 ) );
        Regular_2D_Polygon.prototype.insert_transformed_copy_into( this, [ 1, columns ], mult( rotation( 180, 0, 1, 0 ), translation( 0, 0, .5 ) ) ); }
  }, Shape )
  
Declare_Any_Class( "Rounded_Capped_Cylinder",   // An alternative without three separate sections
  { populate ( rows, columns )
      { Surface_Of_Revolution.prototype.insert_transformed_copy_into( this, 
          [ rows, columns, [ vec3( 0, 0, .5 ), vec3( 1, 0, .5 ), vec3( 1, 0, -.5 ), vec3( 0, 0, -.5 ) ] ] ); } }, Shape ) 
    
Declare_Any_Class( "Cube",    // A cube inserts six square strips into its lists.
  { populate()  
      { for( var i = 0; i < 3; i++ )                    
          for( var j = 0; j < 2; j++ )
          { var square_transform = mult( rotation( i == 0 ? 90 : 0, vec3( 1, 0, 0 ) ), rotation( 180 * j - ( i == 1 ? 90 : 0 ), vec3( 0, 1, 0 ) ) );
                square_transform = mult( square_transform, translation(0, 0, 1) );
            Square.prototype.insert_transformed_copy_into( this, [], square_transform );             
          } 
      } }, Shape )
  
Declare_Any_Class( "Axis_Arrows",   // Made out of a lot of various primitives.
  { populate()  
      { var stack = [];       
        Subdivision_Sphere.prototype.insert_transformed_copy_into( this, [ 3 ], scale(.25, .25, .25) );
        this.drawOneAxis( identity() );
        this.drawOneAxis( mult( rotation(-90, vec3(1,0,0)), scale(1, -1, 1)) );
        this.drawOneAxis( mult( rotation( 90, vec3(0,1,0)), scale(-1, 1, 1)) ); 
      },
    drawOneAxis( object_transform )
      { var original = object_transform;
        object_transform = mult( original, translation(0, 0, 4));
        object_transform = mult( object_transform, scale(.25, .25, .25));
        Closed_Cone.prototype.insert_transformed_copy_into ( this, [ 4, 10 ], object_transform, 0 );
        object_transform = mult( original, translation(.95, .95, .5));
        object_transform = mult( object_transform, scale(.05, .05, .5));
        Cube.prototype.insert_transformed_copy_into( this, [ ], object_transform, 0 );
        object_transform = mult( original, translation(.95, 0, .5));
        object_transform = mult( object_transform, scale(.05, .05, .5));
        Cube.prototype.insert_transformed_copy_into( this, [ ], object_transform, 0 );
        object_transform = mult( original, translation(0, .95, .5));
        object_transform = mult( object_transform, scale(.05, .05, .5));
        Cube.prototype.insert_transformed_copy_into( this, [ ], object_transform, 0 );
        object_transform = mult( original, translation(0, 0, 2));
        object_transform = mult( object_transform, scale(.1, .1, 4));
        Cylindrical_Tube.prototype.insert_transformed_copy_into( this, [ 7, 7 ], object_transform, 0 );
      }
  }, Shape )
  
Declare_Any_Class( "Text_Line", // Draws a rectangle textured with images of ASCII characters textured over each quad, spelling out a string.
  { 'populate'( max_size )    // Each quad is a separate square object.
      { this.max_size = max_size;
        var object_transform = identity();
        for( var i = 0; i < max_size; i++ )
        {
          Square.prototype.insert_transformed_copy_into( this, [], object_transform );
          object_transform = mult( object_transform, translation( 1.5, 0, 0 ));
        }
      },
    'set_string'( line, gl = this.gl )
      { for( var i = 0; i < this.max_size; i++ )
          {
            var row = Math.floor( ( i < line.length ? line.charCodeAt( i ) : ' '.charCodeAt() ) / 16 ),
                col = Math.floor( ( i < line.length ? line.charCodeAt( i ) : ' '.charCodeAt() ) % 16 );

            var skip = 3, size = 32, sizefloor = size - skip;
            var dim = size * 16,  left  = (col * size + skip) / dim,      top    = (row * size + skip) / dim,
                                  right = (col * size + sizefloor) / dim, bottom = (row * size + sizefloor + 5) / dim;

            this.texture_coords[ 4 * i ]     = vec2( left,  1 - bottom );
            this.texture_coords[ 4 * i + 1 ] = vec2( right, 1 - bottom );
            this.texture_coords[ 4 * i + 2 ] = vec2( left,  1 - top );
            this.texture_coords[ 4 * i + 3 ] = vec2( right, 1 - top );
          }
        gl.bindBuffer( gl.ARRAY_BUFFER, this.graphics_card_buffers[2] );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.texture_coords), gl.STATIC_DRAW );
      }
  }, Shape )