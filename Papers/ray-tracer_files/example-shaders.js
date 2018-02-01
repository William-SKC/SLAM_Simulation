// UCLA's Graphics Example Code (Javascript and C++ translations available), by Garett for CS174a.
// example-shaders.js:  Fill in this file with subclasses of Shader, each of which will store and manage a complete GPU program.

// The "vertex_glsl_code" string is loaded by our javascript and then used as the Vertex Shader program.  Our javascript sends this code to the graphics card at runtime, 
// where on each run it gets compiled and linked there.  Thereafter, all of your calls to draw shapes will launch the vertex shader program once per vertex in the shape 
// (three times per triangle), sending results on to the next phase.  The purpose of this program is to calculate the final resting place of vertices in screen coordinates; 
// each of them starts out in local object coordinates.

// Likewise, the "fragment_glsl_code" string is loaded by our javascript and then used as the Fragment Shader program, which gets sent to the graphics card at runtime.
// The fragment shader runs once all vertices in a triangle / element finish their vertex shader programs, and thus have finished finding out where they land on the screen.  
// The fragment shader fills in (shades) every pixel (fragment) overlapping where the triangle landed.  At each pixel it interpolates different values from the three 
// extreme points of the triangle, and uses them in formulas to determine color.  The fragment colors may or may not become final pixel colors; there could already be
// other triangles' fragments occupying the same pixels.  The Z-Buffer test is applied to see if the new triangle is closer to the camera, and even if so, blending settings 
// may interpolate some of the old color into the result.
          

// ******* THE DEFAULT SHADER: Phong Reflection Model with Gouraud option ******* (also see Wikipedia)
Declare_Any_Class( "Phong_Model",
  { 'material'(  color, ambient, diffusivity, shininess, smoothness, texture_object )        // Define the standard settings found in a phong lighting model.
      { return { color, ambient, diffusivity, shininess, smoothness, texture_object, shader: this } },
    'shared_glsl_code'()            // ********* SHARED CODE INCLUDED IN BOTH SHADERS *********
      { return `
          precision mediump float;
          const int N_LIGHTS = 2;                                                         // Be sure to keep this line up to date as you add more lights
          uniform float ambient, diffusivity, shininess, smoothness, animation_time, attenuation_factor[N_LIGHTS];
          uniform bool GOURAUD, COLOR_NORMALS, COLOR_VERTICES, USE_TEXTURE;               // Flags for alternate shading methods
          uniform vec4 lightPosition[N_LIGHTS], lightColor[N_LIGHTS], shapeColor;
          varying vec3 N, E, screen_space_pos;            // Spefifier "varying" means it will be passed from the vertex shader on to the fragment shader, 
          varying vec2 f_tex_coord;                       // then interpolated per-fragment, weighted by the pixel fragment's proximity to each of the 3 vertices.          
          varying vec4 VERTEX_COLOR;
          varying vec3 L[N_LIGHTS], H[N_LIGHTS];
          varying float dist[N_LIGHTS];
          
          vec3 phong_model_lights( vec3 N )
            { vec3 result = vec3(0.0);
              for(int i = 0; i < N_LIGHTS; i++)
                {
                  float attenuation_multiplier = 1.0 / (1.0 + attenuation_factor[i] * (dist[i] * dist[i]));
                  float diffuse  =      max( dot(N, L[i]), 0.0 );
                  float specular = pow( max( dot(N, H[i]), 0.0 ), smoothness );

                  result += attenuation_multiplier * ( shapeColor.xyz * diffusivity * diffuse + lightColor[i].xyz * shininess * specular );
                }
              return result;
            }
          `;
      },
    'vertex_glsl_code'()           // ********* VERTEX SHADER *********
      { return `
          attribute vec4 color;
          attribute vec3 object_space_pos, normal;
          attribute vec2 tex_coord;

          uniform mat4 camera_transform, camera_model_transform, projection_camera_model_transform;
          uniform mat3 inverse_transpose_modelview;

          void main()
          { gl_Position = projection_camera_model_transform * vec4(object_space_pos, 1.0);      // The vertex's final resting place onscreen in normalized coords.
            N = normalize( inverse_transpose_modelview * normal );                              // The final normal vector in screen space.
            f_tex_coord = tex_coord;                                                            // Directly use original texture coords to make a "varying" texture coord.
            
            if( COLOR_NORMALS || COLOR_VERTICES )                                               // Bypass all lighting code if we're lighting up vertices some other way.
            { VERTEX_COLOR   = COLOR_NORMALS ? ( vec4( N[0] > 0.0 ? N[0] : sin( animation_time * 3.0   ) * -N[0],             // In normals mode, rgb color = xyz quantity.  
                                                       N[1] > 0.0 ? N[1] : sin( animation_time * 15.0  ) * -N[1],             // Flash if it's negative.
                                                       N[2] > 0.0 ? N[2] : sin( animation_time * 45.0  ) * -N[2] , 1.0 ) ) : color;
              return;
            }
                                                                                  // The rest of this shader calculates some quantities that the Fragment shader will need:
            screen_space_pos = ( camera_model_transform * vec4(object_space_pos, 1.0) ).xyz;
            E = normalize( -screen_space_pos );

            for( int i = 0; i < N_LIGHTS; i++ )
            {
              L[i] = normalize( ( camera_transform * lightPosition[i] ).xyz - lightPosition[i].w * screen_space_pos );   // Use w = 0 for a directional light source -- a 
              H[i] = normalize( L[i] + E );                                                                              // vector instead of a point.
                                                      // Is it a point light source?  Calculate the distance to it from the object.  Otherwise use some arbitrary distance.
              dist[i]  = lightPosition[i].w > 0.0 ? distance((camera_transform * lightPosition[i]).xyz, screen_space_pos)
                                                  : distance( attenuation_factor[i] * -lightPosition[i].xyz, object_space_pos.xyz );
            }

            if( GOURAUD )         // Gouraud shading mode?  If so, finalize the whole color calculation here in the vertex shader, one per vertex, before we even 
            {                     // break it down to pixels in the fragment shader.   As opposed to Smooth "Phong" Shading, where we do calculate it afterwards.
              VERTEX_COLOR      = vec4( shapeColor.xyz * ambient, shapeColor.w);
              VERTEX_COLOR.xyz += phong_model_lights( N );
            }
          }`;
      },                             // A fragment is a pixel that's overlapped by the current triangle.  Fragments affect the final image or get discarded due to depth.
    'fragment_glsl_code'()           // ********* FRAGMENT SHADER ********* 
      { return `
          uniform sampler2D texture;
          void main()
          {
            if( GOURAUD || COLOR_NORMALS )    // Bypass Smooth "Phong" shading if, as in Gouraud case, we already have final colors to smear (interpolate) across vertices.
            {
              gl_FragColor = VERTEX_COLOR;
              return;
            }                                 // Calculate Smooth "Phong" Shading (not to be confused with the Phong Reflection Model).  As opposed to Gouraud Shading.
            vec4 tex_color = texture2D( texture, f_tex_coord );                         // Use texturing as well
            gl_FragColor      = tex_color * ( USE_TEXTURE ? ambient : 0.0 ) + vec4( shapeColor.xyz * ambient, USE_TEXTURE ? shapeColor.w * tex_color.w : shapeColor.w ) ;
            gl_FragColor.xyz += phong_model_lights( N );
          }`;
      },
      'update_GPU'( g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl )     // Define how to synchronize our javascript's variables to the GPU's:
      { 
        this.update_matrices( g_state, model_transform, gpu, gl );    // (Send the matrices, additionally cache-ing some products of them we know we'll need.)
        gl.uniform1f ( gpu.animation_time_loc, g_state.animation_time / 1000 );

        if( g_state.gouraud === undefined ) { g_state.gouraud = g_state.color_normals = false; }    // (Keep the flags seen by the shader program
        gl.uniform1i( gpu.GOURAUD_loc,        g_state.gouraud       );                              //  up-to-date and make sure they are declared.)
        gl.uniform1i( gpu.COLOR_NORMALS_loc,  g_state.color_normals );

        gl.uniform4fv( gpu.shapeColor_loc,     material.color       );    // (Send the desired shape-wide material qualities to the graphics card)
        gl.uniform1f ( gpu.ambient_loc,        material.ambient     ); 
        gl.uniform1f ( gpu.diffusivity_loc,    material.diffusivity );
        gl.uniform1f ( gpu.shininess_loc,      material.shininess   );
        gl.uniform1f ( gpu.smoothness_loc,     material.smoothness  );

        if( material.texture_object )  // (Omit the texture parameter to signal not to draw a texture.)
        { gpu.shader_attributes[2].enabled = true;
          gl.uniform1f ( gpu.USE_TEXTURE_loc, 1 );
          gl.bindTexture( gl.TEXTURE_2D, material.texture_object.id );
        }
        else  { gl.uniform1f ( gpu.USE_TEXTURE_loc, 0 );   gpu.shader_attributes[2].enabled = false; }

        if( !g_state.lights.length )  return;
        var lightPositions_flattened = [], lightColors_flattened = []; lightAttenuations_flattened = [];
        for( var i = 0; i < 4 * g_state.lights.length; i++ )
          { lightPositions_flattened                  .push( g_state.lights[ Math.floor(i/4) ].position[i%4] );
            lightColors_flattened                     .push( g_state.lights[ Math.floor(i/4) ].color[i%4] );
            lightAttenuations_flattened[ Math.floor(i/4) ] = g_state.lights[ Math.floor(i/4) ].attenuation;
          }
        gl.uniform4fv( gpu.lightPosition_loc,       lightPositions_flattened );
        gl.uniform4fv( gpu.lightColor_loc,          lightColors_flattened );
        gl.uniform1fv( gpu.attenuation_factor_loc,  lightAttenuations_flattened );
      },
    'update_matrices'( g_state, model_transform, gpu, gl )                                                  // Helper function for sending matrices to GPU
      { let [ P, C, M ]    = [ g_state.projection_transform, g_state.camera_transform, model_transform ],   // (PCM will mean Projection * Camera * Model)
              CM           = mult( C,  M ),
              PCM          = mult( P, CM ),                             // Send the current matrices to the shader.  Go ahead and pre-compute the products we'll 
              inv_trans_CM = toMat3( transpose( inverse( CM ) ) );      // need of the of the three special matrices and just cache and send those.  They will be 
                                                                        // the same throughout this draw call & thus across each instance of the vertex shader.
        gl.uniformMatrix4fv( gpu.camera_transform_loc,                  false, flatten(  C  ) );
        gl.uniformMatrix4fv( gpu.camera_model_transform_loc,            false, flatten(  CM ) );
        gl.uniformMatrix4fv( gpu.projection_camera_model_transform_loc, false, flatten( PCM ) );
        gl.uniformMatrix3fv( gpu.inverse_transpose_modelview_loc,       false, flatten( inv_trans_CM ) );       
      },
  }, Shader );      
      
Declare_Any_Class( "Funny_Shader",             // This one borrows its vertex shader from Phong_Model.
  { 'material'() { return { shader: this } },  // Materials here are minimal, without settings
    'update_GPU'( g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl )     // Send javascrpt's variables to the GPU to update its overall state.
        { this.update_matrices( g_state, model_transform, gpu, gl );
          gl.uniform1f ( gpu.animation_time_loc, g_state.animation_time / 1000 );
          gpu.shader_attributes[2].enabled = true;
        },
    'fragment_glsl_code'()           // ********* FRAGMENT SHADER *********
      { return `
          void main()
          { float a = animation_time, u = f_tex_coord.x, v = f_tex_coord.y;

            gl_FragColor = vec4(
              2.0 * u * sin(17.0 * u ) + 3.0 * v * sin(11.0 * v ) + 1.0 * sin(13.0 * a),
              3.0 * u * sin(18.0 * u ) + 4.0 * v * sin(12.0 * v ) + 2.0 * sin(14.0 * a),
              4.0 * u * sin(19.0 * u ) + 5.0 * v * sin(13.0 * v ) + 3.0 * sin(15.0 * a),
              5.0 * u * sin(20.0 * u ) + 6.0 * v * sin(14.0 * v ) + 4.0 * sin(16.0 * a));
          }`;
      }
  }, Phong_Model );
  
Declare_Any_Class( "Fake_Bump_Map",  // Overrides Phong_Model except for one thing                  
  { 'fragment_glsl_code'()           // ********* FRAGMENT SHADER *********
      { return `
          uniform sampler2D texture;          //  Like real bump mapping, but with no separate file for the bump map (instead we'll
          void main()                         //  re-use the colors of the original picture file to disturb the normal vectors)
          {
            if( GOURAUD || COLOR_NORMALS )    // Bypass Smooth "Phong" shading if, as in Gouraud case, we already have final colors to smear (interpolate) across vertices.
            {
              gl_FragColor = VERTEX_COLOR;
              return;
            }                                 // Calculate Smooth "Phong" Shading (not to be confused with the Phong Reflection Model).  As opposed to Gouraud Shading.
            vec4 tex_color = texture2D( texture, f_tex_coord );                         // Use texturing as well
            vec3 bumped_N  = normalize( N + tex_color.rgb - .5*vec3(1,1,1) );           // Slightly disturb normals based on sampling the same texture
            gl_FragColor      = tex_color * ( USE_TEXTURE ? ambient : 0.0 ) + vec4( shapeColor.xyz * ambient, USE_TEXTURE ? shapeColor.w * tex_color.w : shapeColor.w ) ;
            gl_FragColor.xyz += phong_model_lights( bumped_N );
          }`;
      }
  }, Phong_Model );