// UCLA's Graphics Example Code (Javascript and C++ translations available), by Garett for CS174a.
// tinywebgl_ucla.js - A file to show how to organize a complete graphics program.  It wraps common WebGL commands.

function Declare_Any_Class( name, methods, superclass = Object, scope = window )              // (Making javascript behave more like Object Oriented C++)
  { var p_sup = superclass.prototype, p = Object.create( p_sup );                                     // Use prototypes to make the object.  Begin with the superclass's.
    scope[name] = function( args ) { if( this.construct ) this.construct.apply( this, arguments );  } // When new gets called on the class name, call its construct():
    p.constructor = scope[name];                                                                      // Override the prototype so that member functions work.
    p.class_name = name;                                                                              // Let classes be aware of their type name.
    p.subclasses = [];  if( p_sup.subclasses ) p_sup.subclasses.push(p);                              // Let classes be aware of their subclasses.
    p.define_data_members = function( args ) { for( let i in args ) this[i] = args[i]; }              // A style-improving method for all classes
    for ( let i in methods ) p[i] = methods[i];                                                       // Include all the other supplied methods.
    scope[ name ].prototype = p;                                                                      // The class and its prototype are complete.
  }

// *********** SHAPE SUPERCLASS ***********
// Each shape manages lists of its own vertex positions, vertex normals, and texture coordinates per vertex, and can copy them into a buffer in the graphics card's memory.
// IMPORTANT: When you extend the Shape class, you must supply a populate() function that fills in four arrays: One list enumerating all the vertices' (vec3) positions,
// one for their (vec3) normal vectors pointing away from the surface, one for their (vec2) texture coordinates (the vertex's position in an image's coordinate space,
// where the whole picture spans x and y in the range 0.0 to 1.0), and usually one for indices, a list of index triples defining which three vertices
// belong to each triangle.  Call new on a Shape and add it to the shapes_in_use array; it will populate its arrays and the GPU buffers will recieve them.
Declare_Any_Class( "Shape",
  { 'construct'( args )
      { this.define_data_members( { positions: [], normals: [], texture_coords: [], indices: [], indexed: true } );
        this.populate.apply( this, arguments ); // Immediately fill in appropriate vertices via polymorphism, calling whichever sub-class's populate().
      },
    'copy_onto_graphics_card'( gl )
      { this.graphics_card_buffers = [];  // Send the completed vertex and index lists to their own buffers in the graphics card.
        for( var i = 0; i < 4; i++ )      // Memory addresses of the buffers given to this shape in the graphics card.
        { this.graphics_card_buffers.push( gl.createBuffer() );
          gl.bindBuffer(gl.ARRAY_BUFFER, this.graphics_card_buffers[i] );
          switch(i) {
            case 0: gl.bufferData(gl.ARRAY_BUFFER, flatten(this.positions), gl.STATIC_DRAW); break;
            case 1: gl.bufferData(gl.ARRAY_BUFFER, flatten(this.normals), gl.STATIC_DRAW); break;
            case 2: gl.bufferData(gl.ARRAY_BUFFER, flatten(this.texture_coords), gl.STATIC_DRAW); break;  }
        }
        if( this.indexed )
        { gl.getExtension("OES_element_index_uint");
          this.index_buffer = gl.createBuffer();
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices), gl.STATIC_DRAW);
        }
        this.gl = gl;
      },      
    'draw'( graphics_state, model_transform, material, gl = this.gl )                          // The same draw() function is used for every shape -
      { if( !this.gl ) throw "This shape's arrays are not copied over to graphics card yet.";  // these calls produce different results by varying which
        material.shader.activate();                                                            // vertex list in the GPU we consult.
        material.shader.update_GPU( graphics_state, model_transform, material );

        for( let [ i, it ] of material.shader.g_addrs.shader_attributes.entries() )
          if( it.enabled )
          { gl.enableVertexAttribArray( it.index );
            gl.bindBuffer( gl.ARRAY_BUFFER, this.graphics_card_buffers[i] );                            // Activate the correct buffer
            gl.vertexAttribPointer( it.index, it.size, it.type, it.normalized, it.stride, it.pointer ); // Populate this attribute from the active buffer
          }
          else  gl.disableVertexAttribArray( it.index );

        if( this.indexed )
        { gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.index_buffer );                // Run the shaders to draw every triangle now.
          gl.drawElements( gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0 );
        }
        else  gl.drawArrays( gl.TRIANGLES, 0, this.positions.length );   // If no indices were provided, assume the vertices are arranged in triples
      },
    'normalize_positions'()
      { var average_position = vec3(), average_length = 0;
        for( let [i, p] of this.positions.entries() ) average_position  =  add( average_position, scale_vec( 1/this.positions.length, p ) );
        for( let [i, p] of this.positions.entries() ) this.positions[i] =  subtract( p, average_position );
        for( let [i, p] of this.positions.entries() ) average_length    += 1/this.positions.length * length(p);
        for( let [i, p] of this.positions.entries() ) this.positions[i] =  scale_vec( 1/average_length, p );
      },
    'insert_transformed_copy_into'( recipient, args, points_transform = identity() )    // For building compound shapes.
      { var temp_shape = new ( window[ this.class_name ] )( ...args );  // If you try to bypass making a temporary shape and instead directLy insert new data into
                                                                        // the recipient, you'll run into trouble when the recursion tree stops at different depths.
        for( var i = 0; i < temp_shape.indices.length; i++ ) recipient.indices.push( temp_shape.indices[i] + recipient.positions.length );

        for( var i = 0; i < temp_shape.positions.length; i++ )  // Apply points_transform to all points added during this call
          { recipient.positions.push( mult_vec(                     points_transform    , temp_shape.positions[ i ].concat( 1 ) ).slice(0,3) );
            recipient.normals  .push( mult_vec( transpose( inverse( points_transform ) ), temp_shape.normals  [ i ].concat( 1 ) ).slice(0,3) );
          }
        Array.prototype.push.apply( recipient.texture_coords, temp_shape.texture_coords );
      },
    'auto_flat_shaded_version'( args )
      { Declare_Any_Class( this.class_name.concat( "_flat" ), 
        { 'populate': ( function( superclass ) { return function(args)
            { superclass.prototype.populate.apply( this, arguments );  this.duplicate_the_shared_vertices();  this.flat_shade(); }
            } )( window[ this.class_name ] ),
          'duplicate_the_shared_vertices'()
            { // Prepare an indexed shape for flat shading if it is not ready -- that is, if there are any edges where the same vertices are indexed by both the adjacent 
              // triangles, and those two triangles are not co-planar.  The two would therefore fight over assigning different normal vectors to the shared vertices.
              var temp_positions = [], temp_tex_coords = [], temp_indices = [];
              for( let [i, it] of this.indices.entries() )
                { temp_positions.push( this.positions[it] );  temp_tex_coords.push( this.texture_coords[it] );  temp_indices.push( i ); }
              this.positions =  temp_positions;       this.indices = temp_indices;    this.texture_coords = temp_tex_coords;
            },
          'flat_shade'()      // Automatically assign the correct normals to each triangular element to achieve flat shading.  Affect all
            {                 // recently added triangles (those past "offset" in the list).  Assumes that no vertices are shared across seams.        
              for( var counter = 0; counter < (this.indexed ? this.indices.length : this.positions.length); counter += 3 )         // Iterate through appropriate triples
              { var indices = this.indexed ? [ this.indices[ counter ], this.indices[ counter + 1 ], this.indices[ counter + 2 ] ] : [ counter, counter + 1, counter + 2 ];
                var p1 = this.positions[ indices[0] ],     p2 = this.positions[ indices[1] ],      p3 = this.positions[ indices[2] ];
                var n1 = normalize( cross( subtract(p1, p2), subtract(p3, p1) ) );    // Cross two edge vectors of this triangle together to get the normal

                 if( length( add( scale_vec( .1, n1 ), p1 ) ) < length( p1 ) )
                   n1 = scale_vec( -1, n1 );                    // Flip the normal if adding it to the triangle brings it closer to the origin.

                for( let i of indices ) this.normals[ i ] = vec3( n1[0], n1[1], n1[2] );   // Propagate normal to the 3 vertices.
              }
            }
        }, window[this.class_name] );
        return new window[ this.class_name.concat( "_flat" ) ]( ...arguments );
      }
  } );

Declare_Any_Class( "Shortcut_Manager",        // Google shortcut.js for this keyboard library's full documentation; this copy of it is more compact.
  { 'all_shortcuts': {},
    'add'( shortcut_combination, recipient = window, callback, opt )
      { var default_options = { 'type':'keydown', 'propagate':false, 'disable_in_input':true, 'target':document, 'keycode':false }
        if(!opt) opt = default_options;
        else     for(var dfo in default_options) if( typeof opt[dfo] == 'undefined' ) opt[dfo] = default_options[dfo];
        var ele = opt.target == 'string' ? document.getElementById(opt.target) : opt.target;
        shortcut_combination = shortcut_combination.toLowerCase();
        var onkeypress = function(e) // On each keypress, this gets called [# of bound keys] times
          { e = e || window.event;
            if( opt['disable_in_input'] )
            { var element = e.target || e.srcElement || element.parentNode;
              if( element.nodeType == 3 ) element = element.parentNode;
              if( element.tagName == 'INPUT' || element.tagName == 'TEXTAREA' ) return;
            }
            var code = e.keyCode || e.which, character = code == 188 ? "," : ( code == 190 ? "." : String.fromCharCode(code).toLowerCase() );
            var keycombo = shortcut_combination.split("+"), num_pressed = 0;
            var special_keys = {'esc':27,   'escape':27, 'tab':9,     'space':32, 'return' :13, 'enter':13, 'backspace':8,
                                'pause':19, 'break':19,  'insert':45, 'home':36,  'delete':46,  'end':35,   'page_up':33, 'page_down':34,
                                'left':37,   'up':38,    'right':39,  'down':40,
                                'f1':112,'f2':113,'f3':114,'f4':115,'f5':116,'f6':117,'f7':118,'f8':119,'f9':120,'f10':121,'f11':122,'f12':123 }
            var modifiers = { shift: { wanted: false, pressed: e.shiftKey },
                              ctrl : { wanted: false, pressed: e.ctrlKey  },
                              alt  : { wanted: false, pressed: e.altKey   },
                              meta : { wanted: false, pressed: e.metaKey  } }; // ( Mac specific )
            for( let k of keycombo )                                    // Check if current keycombo in consideration matches the actual keypress
            { modifiers.ctrl .wanted |= ( k == 'ctrl' || k == 'control' && ++num_pressed );
              modifiers.shift.wanted |= ( k == 'shift'                  && ++num_pressed );
              modifiers.alt  .wanted |= ( k == 'alt'                    && ++num_pressed );
              modifiers.meta .wanted |= ( k == 'meta'                   && ++num_pressed );
              var shift_nums = {"`":"~","1":"!","2":"@","3":"#","4":"$" ,"5":"%","6":"^","7":"&", "8":"*","9":"(",
                                "0":")","-":"_","=":"+",";":":","'":"\"",",":"<",".":">","/":"?","\\":"|" }
              if     ( k.length > 1   && special_keys[k] == code ) num_pressed++;
              else if( opt['keycode'] && opt['keycode']  == code ) num_pressed++;
              else if( character == k ) num_pressed++; //The special keys did not match
              else if( shift_nums[character] && e.shiftKey ) { character = shift_nums[character]; if(character == k) num_pressed++;   }
            }
            if(num_pressed == keycombo.length && modifiers.ctrl .pressed == modifiers.ctrl .wanted
                                              && modifiers.shift.pressed == modifiers.shift.wanted
                                              && modifiers.alt  .pressed == modifiers.alt  .wanted
                                              && modifiers.meta .pressed == modifiers.meta .wanted )
              { callback.call( recipient, e );          // *** Fire off the function that matched the pressed keys ***********************************
                if(!opt['propagate'])  { e.cancelBubble = true;  e.returnValue = false; if (e.stopPropagation) { e.stopPropagation(); e.preventDefault(); } return; }
              }
          }
        this.all_shortcuts[ shortcut_combination ] = { 'callback':onkeypress, 'target':ele, 'event': opt['type'] };
        if     ( ele.addEventListener ) ele.addEventListener(opt['type'],   onkeypress, false);
        else if( ele.attachEvent )      ele.attachEvent('on'+opt['type'],   onkeypress);
        else                            ele[            'on'+opt['type']] = onkeypress;
      },
    'remove'(shortcut_combination)       // Just specify the shortcut and this will remove the binding
      { shortcut_combination = shortcut_combination.toLowerCase();
        var binding = this.all_shortcuts[shortcut_combination];
        delete(       this.all_shortcuts[shortcut_combination] )
        if( !binding ) return;
        var type = binding[ 'event' ], ele = binding[ 'target' ], callback = binding[ 'callback' ];
        if(ele.detachEvent) ele.detachEvent('on'+type, callback);
        else if(ele.removeEventListener) ele.removeEventListener(type, callback, false);
        else ele['on'+type] = false;
      }
  } );

Declare_Any_Class( "Graphics_State", // The properties of the whole scene
  { 'construct'() { this.set.apply( this, arguments ); },
    'set'(                          camera_transform = identity(), projection_transform = identity(), animation_time = 0  )
      { this.define_data_members( { camera_transform,              projection_transform,              animation_time, animation_delta_time: 0, lights: [] } ); }
  } );
  
Declare_Any_Class( "Light",          // The properties of one light in the scene
  { 'construct'( position, color, size ) { this.define_data_members( { position, color, attenuation: 1/size } ); }  } );
  
function Color( r, g, b, a ) { return vec4( r, g, b, a ); }     // Colors are just special vec4s expressed as: ( red, green, blue, opacity ) each from 0 to 1.

Declare_Any_Class( "Graphics_Addresses",  // Find out the memory addresses internal to the graphics card of each of
  { 'construct'( program, gl )            // its variables, and store them here locally for the Javascript to use.
      { Declare_Any_Class( "Shader_Attribute",
        { 'construct'               (   name,                                         size, type, enabled, normalized, stride, pointer )
          { this.define_data_members( { index: gl.getAttribLocation( program, name ), size, type, enabled, normalized, stride, pointer } ); } } )

        this.shader_attributes = [ new Shader_Attribute( "object_space_pos", 3, gl.FLOAT, true,  false, 0, 0 ),  // Pointers to all shader
                                   new Shader_Attribute( "normal"          , 3, gl.FLOAT, true,  false, 0, 0 ),  // attribute variables
                                   new Shader_Attribute( "tex_coord"       , 2, gl.FLOAT, false, false, 0, 0 ),
                                   new Shader_Attribute( "color"           , 3, gl.FLOAT, false, false, 0, 0 ) ];

        var num_uniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (var i = 0; i < num_uniforms; ++i)
        { var u = gl.getActiveUniform(program, i).name.split('[')[0];    // Retrieve the GPU addresses of each uniform variable in the shader,
          this[ u + "_loc" ] = gl.getUniformLocation( program, u );      // based on their names, and store these pointers for later.
        }
      }
  } );

Declare_Any_Class( "Shader",  // Shader superclass.  Instantiate subclasses that have all methods filled in.  That loads a new vertex & fragment shader onto the GPU.
  { 'construct'( gl )
      { this.define_data_members( { gl, program: gl.createProgram() } );
        var shared = this.shared_glsl_code() || "";
        
        var vertShdr = gl.createShader( gl.VERTEX_SHADER );
        gl.shaderSource( vertShdr, shared + this.vertex_glsl_code() );
        gl.compileShader( vertShdr );
        if ( !gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS)    ) throw "Vertex shader compile error: "   + gl.getShaderInfoLog( vertShdr );

        var fragShdr = gl.createShader( gl.FRAGMENT_SHADER );
        gl.shaderSource( fragShdr, shared + this.fragment_glsl_code() );
        gl.compileShader( fragShdr );
        if ( !gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS)    ) throw "Fragment shader compile error: " + gl.getShaderInfoLog( fragShdr );

        gl.attachShader( this.program, vertShdr );
        gl.attachShader( this.program, fragShdr );
        gl.linkProgram(  this.program );
        if ( !gl.getProgramParameter( this.program, gl.LINK_STATUS) ) throw "Shader linker error: "           + gl.getProgramInfoLog( this.program );
      },
    'activate'(){ this.gl.useProgram( this.program ); this.g_addrs = new Graphics_Addresses( this.program, this.gl ); },
    'material'(){},  'update_GPU'(){},  'shared_glsl_code'(){},  'vertex_glsl_code'(){},  'fragment_glsl_code'(){}   // You have to override these functions
  } );

Declare_Any_Class( "Canvas_Manager",           // This class manages a whole graphics program for one on-page canvas, inclduing its textures, shapes, shaders, and 
  { 'construct'( canvas_id, background_color ) // scenes.  In addition to requesting a WebGL context, it informs the canvas of which functions to call during 
      { var gl, canvas = document.getElementById( canvas_id );                            // events - such as a key getting pressed or it being time to redraw.
        this.define_data_members( { shaders_in_use: {}, shapes_in_use: {}, textures_in_use: {}, scene_components: [], prev_time: 0,
                                    controls: new Shortcut_Manager(),                        // All per-canvas key controls will be stored here.
                                    canvas, width: canvas.clientWidth, height: canvas.clientHeight,
                                    globals: { animate: false, string_map: {}, graphics_state: new Graphics_State() } } );
        for ( let name of [ "webgl", "experimental-webgl", "webkit-3d", "moz-webgl" ] )
          if (  gl = this.gl = this.canvas.getContext( name ) ) break;                       // Get the GPU ready, creating a new WebGL context for this canvas
        if   ( !gl ) throw "Canvas failed to make a WebGL context.";

        gl.clearColor.apply( gl, background_color );    // Tell the GPU which color to clear the canvas with each frame
        gl.viewport( 0, 0, this.width, this.height );   // Build the canvas's matrix for converting -1 to 1 ranged coords to its own pixel coords.
        gl.enable( gl.DEPTH_TEST );   gl.enable( gl.BLEND );            // Enable Z-Buffering test with blending
        gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );           // Specify an interpolation method for blending "transparent" triangles over the existing pixels
      },
    'register_scene_component'( component ) { this.scene_components.push( component );  component.init_keys( this.controls ); },
    'render'( time = 0 )                                                // Animate shapes based upon how much measured real time has transpired.
      {                            this.globals.graphics_state.animation_delta_time = time - this.prev_time;
        if( this.globals.animate ) this.globals.graphics_state.animation_time      += this.globals.graphics_state.animation_delta_time;
        this.prev_time = time;

        for ( let s in this.shapes_in_use ) if( !this.shapes_in_use[s].sent_to_GPU ) this.shapes_in_use[s].copy_onto_graphics_card( this.gl );
        this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);        // Clear the canvas's pixels and z-buffer.           
        for ( let s of this.scene_components )
        { s.display( this.globals.graphics_state );            // Draw each registered animation.
          s.update_strings( this.globals );                    // Update their debug logs.
        }
        window.requestAnimFrame( this.render.bind( this ) );   // Now that this frame is drawn, request that render() happen again 
      }                                                        // as soon as all other web page events are processed.
  } );

Declare_Any_Class( "Texture",                                                             // Wrap a pointer to a new texture buffer along with a new HTML image object.
  { construct(                  gl, filename, bool_mipMap, bool_will_copy_to_GPU = true )
      { this.define_data_members( { filename, bool_mipMap, bool_will_copy_to_GPU,       id: gl.createTexture() } );

        gl.bindTexture(gl.TEXTURE_2D, this.id );
        gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                      new Uint8Array([255, 0, 0, 255]));                          // A single red pixel, as a placeholder image to prevent a console warning.
        this.image          = new Image();
        this.image.onload   = ( function (texture, bool_mipMap)                   // This self-executing anonymous function makes the real onload() function:
          { return function( )      // Instrctions for whenever the real image file is ready
            { gl.pixelStorei  ( gl.UNPACK_FLIP_Y_WEBGL, bool_will_copy_to_GPU );
              gl.bindTexture  ( gl.TEXTURE_2D, texture.id );
              gl.texImage2D   ( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image );
              gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );      // Always use bi-linear sampling when the image will appear magnified.
              if( bool_mipMap )                                                         // When it will appear shrunk, then either use tri-linear sampling of its mip maps:
                { gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.generateMipmap(gl.TEXTURE_2D); }
              else
                  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );   // Or use the worst sampling method, to illustrate the difference.
              texture.loaded = true;
            }
          } ) ( this, bool_mipMap, bool_will_copy_to_GPU );
        if( bool_will_copy_to_GPU ) this.image.src = this.filename;
      } } );

Declare_Any_Class( "Scene_Component",           // Scene_Component Superclass -- Base class for any scene part or code snippet we can add to a canvas
  { 'construct'() {},    'init_keys'() {},    'update_strings'() {},    'display'() {},
    'submit_shapes'( context, shapes )        // Store pointers to the shapes locally.  Also 
    { this.shapes = [];                       // submit them to the outer context.
      for( let s in shapes )
        { if( context.shapes_in_use[s] ) this.shapes[s] = context.shapes_in_use[s];      // If two scenes give any shape the same name as an existing one, the
          else this.shapes[s] = context.shapes_in_use[s] = shapes[s];                    // existing one is used instead and the new shape is thrown out.
        }
    } } );