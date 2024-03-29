import { vec4, mat4, vec3, glMatrix } from "gl-matrix";
import * as WebGLUtils from "%COMMON/WebGLUtils";
import { Features } from "./Controller";
import { Stack } from "%COMMON/Stack"
import { Scenegraph } from "./Scenegraph";
import { VertexPNT, VertexPNTProducer } from "./VertexPNT";
import { ShaderLocationsVault } from "%COMMON/ShaderLocationsVault";
import { Light } from "%COMMON/Light"
import { ScenegraphRenderer } from "./ScenegraphRenderer";
import { ScenegraphJSONImporter } from "./ScenegraphJSONImporter"
import {Ray} from "./Ray"
import { HitRecord } from "HitRecord";
import { RTView } from "./RTView";



/**
 * This class encapsulates the "view", where all of our WebGL code resides. This class, for now, also stores all the relevant data that is used to draw. This can be replaced with a more formal Model-View-Controller architecture with a bigger application.
 */


export class View {
  //the webgl rendering context. All WebGL functions will be called on this object
  private gl: WebGLRenderingContext;
  //an object that represents a WebGL shader
  private shaderProgram: WebGLProgram;

  //a projection matrix, that encapsulates how what we draw corresponds to what is seen
  private proj: mat4;

  //a modelview matrix, that encapsulates all the transformations applied to our object
  private modelview: Stack<mat4>;

  private scenegraph: Scenegraph<VertexPNT>;
  private shaderLocations: ShaderLocationsVault;

  private time: number;

  private rayTraceView : RTView;

  //trackball transform
  private trackballTransform: mat4;
  private trackBallOn: number;

  constructor(gl: WebGLRenderingContext, rayTraceView : RTView) {
    this.gl = gl;
    this.time = 0;
    this.modelview = new Stack<mat4>();
    this.scenegraph = null;
    this.rayTraceView = rayTraceView;
    //set the clear color
    this.gl.clearColor(0.9, 0.9, 0.7, 1);


    //Our quad is in the range (-100,100) in X and Y, in the "virtual world" that we are drawing. We must specify what part of this virtual world must be drawn. We do this via a projection matrix, set up as below. In this case, we are going to render the part of the virtual world that is inside a square from (-200,-200) to (200,200). Since we are drawing only 2D, the last two arguments are not useful. The default Z-value chosen is 0, which means we only specify the last two numbers such that 0 is within their range (in this case we have specified them as (-100,100))
    //this.proj = mat4.ortho(mat4.create(), -60, 60, -100, 100, 0.1, 10000);
    this.proj = mat4.perspective(mat4.create(), 1, glMatrix.toRadian(60), 0.1, 10000);

    //this.proj = mat4.perspective(this.proj, glMatrix.toRadian(60), 1, 0.1, 10000);

    //We must also specify "where" the above part of the virtual world will be shown on the actual canvas on screen. This part of the screen where the above drawing gets pasted is called the "viewport", which we set here. The origin of the viewport is left,bottom. In this case we want it to span the entire canvas, so we start at (0,0) with a width and height of 400 each (matching the dimensions of the canvas specified in HTML)
    this.gl.viewport(0, 0, 800, 800);
  }

  public getNumLights(): number {
    return this.scenegraph.getNumLights();
  }

  public initShaders(vShaderSource: string, fShaderSource: string) {
    //create and set up the shader
    this.shaderProgram = WebGLUtils.createShaderProgram(this.gl, vShaderSource, fShaderSource);
    //enable the current program
    this.gl.useProgram(this.shaderProgram);

    this.shaderLocations = new ShaderLocationsVault(this.gl, this.shaderProgram);

  }

  public initRenderer(): void {
    let shaderVarsToVertexAttribs: Map<string, string> = new Map<string, string>();
    shaderVarsToVertexAttribs.set("vPosition", "position");
    shaderVarsToVertexAttribs.set("vNormal", "normal");
    let renderer: ScenegraphRenderer = new ScenegraphRenderer(this.gl, this.shaderLocations, shaderVarsToVertexAttribs);
    this.scenegraph.setRenderer(renderer);
  }

  public initScenegraph(): Promise<void> {
    return new Promise<void>((resolve) => {
      ScenegraphJSONImporter.importJSON(new VertexPNTProducer(), this.json())
        .then((s: Scenegraph<VertexPNT>) => {
          this.scenegraph = s;
          resolve();
        });
    });
  }

  private face(): string {
    return `
    {
      "instances": [
        {
          "name": "sphere",
          "path": "models/sphere.obj"
        },
        {
          "name": "box",
          "path": "models/box.obj"
        },
        {
          "name": "cylinder",
          "path": "models/cylinder.obj"
        },
        {
          "name": "cone",
          "path": "models/cone.obj"
        }
      ],
      "images": [
        {
          "name": "checkerboard",
          "path": "textures/checkerboard.png"
        },
        {
          "name": "earth",
          "path": "textures/earthmap.png"
        },
        {
          "name": "white",
          "path": "textures/white.png"
        }
      ],
      "root": {
        "type": "group",
        "name": "Root of scene graph",
        "lights": [
          {
            "ambient": [
              0.8,
              0.8,
              0.8
            ],
            "diffuse": [
              0.8,
              0.8,
              0.8
            ],
            "specular": [
              0.8,
              0.8,
              0.8
            ],
            "position": [
              0.0,
              100.0,
              0.0,
              1.0
            ],
            "spotdirection": [
              0.0,
              -1.0,
              0.0,
              0.0
            ],
            "spotcutoff": 25.0
          }
        ],
        "children": [
          {
            "type": "transform",
            "transform": [
              {
                "scale": [
                  200.0,
                  5.0,
                  200.0
                ]
              }
            ],
            "child": {
              "type": "object",
              "instanceof": "box",
              "material": {
                "ambient": [
                  0.2,
                  0.2,
                  0.2,
                  1.0
                ],
                "diffuse": [
                  0.8,
                  0.8,
                  0.8,
                  1.0
                ],
                "specular": [
                  0.8,
                  0.8,
                  0.8,
                  1.0
                ],
                "emission": [
                  0.0,
                  0.0,
                  0.0,
                  1.0
                ],
                "shininess": 100.0,
                "absorption": 1.0,
                "reflection": 0.0,
                "transparency": 0.0,
                "refractive_index": 0.0
              }
            }
          },
          {
            "type": "transform",
            "transform": [
              {
                "translate": [
                  0.0,
                  25.0,
                  0.0
                ]
              }
            ],
            "child": {
              "type": "group",
              "name": "face",
              "children": [
                {
                  "type": "transform",
                  "name": "actualface",
                  "lights": [
                    {
                      "ambient": [
                        0.4,
                        0.4,
                        0.4
                      ],
                      "diffuse": [
                        0.4,
                        0.4,
                        0.4
                      ],
                      "specular": [
                        0.4,
                        0.4,
                        0.4
                      ],
                      "position": [
                        0.0,
                        100.0,
                        100.0,
                        1.0
                      ],
                      "spotdirection": [
                        0.0,
                        0.0,
                        1.0,
                        0.0
                      ],
                      "spotcutoff": 180.0
                    }
                  ],
                  "transform": [
                    {
                      "scale": [
                        20.0,
                        25.0,
                        20.0
                      ]
                    }
                  ],
                  "child": {
                    "type": "object",
                    "instanceof": "sphere",
                    "texture": "earth",
                    "material": {
                      "ambient": [
                        0.2,
                        0.2,
                        0.1,
                        1.0
                      ],
                      "diffuse": [
                        0.8,
                        0.8,
                        0.6,
                        1.0
                      ],
                      "specular": [
                        0.8,
                        0.8,
                        0.6,
                        1.0
                      ],
                      "emission": [
                        0.0,
                        0.0,
                        0.0,
                        1.0
                      ],
                      "shininess": 100.0,
                      "absorption": 1.0,
                      "reflection": 0.0,
                      "transparency": 0.0,
                      "refractive_index": 0.0
                    }
                  }
                },
                {
                  "type": "transform",
                  "name": "lefteye",
                  "transform": [
                    {
                      "translate": [
                        7.0,
                        15.0,
                        12.0
                      ]
                    },
                    {
                      "scale": [
                        3.0,
                        4.0,
                        3.0
                      ]
                    }
                  ],
                  "child": {
                    "type": "object",
                    "instanceof": "sphere",
                    "material": {
                      "ambient": [
                        0.1,
                        0.1,
                        0.1,
                        1.0
                      ],
                      "diffuse": [
                        0.2,
                        0.2,
                        0.2,
                        1.0
                      ],
                      "specular": [
                        0.9,
                        0.9,
                        0.9,
                        1.0
                      ],
                      "emission": [
                        0.0,
                        0.0,
                        0.0,
                        1.0
                      ],
                      "shininess": 100.0,
                      "absorption": 1.0,
                      "reflection": 0.0,
                      "transparency": 0.0,
                      "refractive_index": 0.0
                    }
                  }
                },
                {
                  "type": "transform",
                  "name": "righteye",
                  "transform": [
                    {
                      "translate": [
                        -7.0,
                        15.0,
                        12.0
                      ]
                    },
                    {
                      "scale": [
                        3.0,
                        4.0,
                        3.0
                      ]
                    }
                  ],
                  "child": {
                    "type": "object",
                    "instanceof": "sphere",
                    "material": {
                      "ambient": [
                        0.1,
                        0.1,
                        0.1,
                        1.0
                      ],
                      "diffuse": [
                        0.2,
                        0.2,
                        0.2,
                        1.0
                      ],
                      "specular": [
                        0.9,
                        0.9,
                        0.9,
                        1.0
                      ],
                      "emission": [
                        0.0,
                        0.0,
                        0.0,
                        1.0
                      ],
                      "shininess": 100.0,
                      "absorption": 1.0,
                      "reflection": 0.0,
                      "transparency": 0.0,
                      "refractive_index": 0.0
                    }
                  }
                },
                {
                  "type": "transform",
                  "name": "nose",
                  "transform": [
                    {
                      "translate": [
                        0.0,
                        10.0,
                        10.0
                      ]
                    },
                    {
                      "rotate": [
                        90.0,
                        1.0,
                        0.0,
                        0.0
                      ]
                    },
                    {
                      "scale": [
                        5.0,
                        20.0,
                        5.0
                      ]
                    }
                  ],
                  "child": {
                    "type": "object",
                    "instanceof": "cylinder",
                    "material": {
                      "ambient": [
                        0.2,
                        0.0,
                        0.0,
                        1.0
                      ],
                      "diffuse": [
                        0.8,
                        0.0,
                        0.0,
                        1.0
                      ],
                      "specular": [
                        0.8,
                        0.0,
                        0.0,
                        1.0
                      ],
                      "emission": [
                        0.0,
                        0.0,
                        0.0,
                        1.0
                      ],
                      "shininess": 100.0,
                      "absorption": 1.0,
                      "reflection": 0.0,
                      "transparency": 0.0,
                      "refractive_index": 0.0
                    }
                  }
                },
                {
                  "type": "transform",
                  "name": "hat",
                  "transform": [
                    {
                      "translate": [
                        0.0,
                        20.0,
                        0.0
                      ]
                    },
                    {
                      "scale": [
                        10.0,
                        25.0,
                        10.0
                      ]
                    }
                  ],
                  "child": {
                    "type": "object",
                    "instanceof": "cone",
                    "material": {
                      "ambient": [
                        0.1,
                        0.0,
                        0.1,
                        1.0
                      ],
                      "diffuse": [
                        0.8,
                        0.0,
                        0.8,
                        1.0
                      ],
                      "specular": [
                        0.8,
                        0.0,
                        0.8,
                        1.0
                      ],
                      "emission": [
                        0.0,
                        0.0,
                        0.0,
                        1.0
                      ],
                      "shininess": 100.0,
                      "absorption": 1.0,
                      "reflection": 0.0,
                      "transparency": 0.0,
                      "refractive_index": 0.0
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    }
    
    
    `;
  }

  //a JSON representation of a jack-in-the-box
  private json2(): string {
    return `
        {
            "instances": [
            {
                "name": "box",
                "path": "models/box.obj"
            }
            ],
            "root": {
                "type": "group",
                "name": "root",
                "lights": [
          {
            "ambient": [
              0.8,
              0.8,
              0.8
            ],
            "diffuse": [
              0.8,
              0.8,
              0.8
            ],
            "specular": [
              0.8,
              0.8,
              0.8
            ],
            "position": [
              0.0,
              100.0,
              0.0,
              1.0
            ],
            "spotdirection": [
              0.0,
              -1.0,
              0.0,
              0.0
            ],
            "spotcutoff": 50.0
          }
        ],
                "children": [
                    {
                        "type":"transform",
                        "name": "box-transform",
                        "transform": [
                            {"scale": [50,50,-50]}
                        ],
                        "child": {
                            "type": "object",
                            "name": "boxnode",
                            "instanceof": "box",
                            "material": 
                            {
                              "ambient": [
                                0.1,
                                0.0,
                                0.1,
                                1.0
                              ],
                              "diffuse": [
                                0.8,
                                0.0,
                                0.8,
                                1.0
                              ],
                              "specular": [
                                0.8,
                                0.0,
                                0.8,
                                1.0
                              ],
                              "emission": [
                                0.0,
                                0.0,
                                0.0,
                                1.0
                              ],
                              "shininess": 100.0,
                              "absorption": 1.0,
                              "reflection": 0.0,
                              "transparency": 0.0,
                              "refractive_index": 0.0
                            }
                        }
                    }
                ]
            }
        }
        `;
  }

  //a JSON representation of a simple scene graph
  private json(): string {
    return `
        {
            "instances": [
            {
                "name": "sphere",
                "path": "models/sphere.obj"
            }
            ],
            "root": {
                "type": "group",
                "name": "root",
                "lights": [
          {
            "ambient": [
              0.8,
              0.8,
              0.8
            ],
            "diffuse": [
              0.8,
              0.8,
              0.8
            ],
            "specular": [
              0.8,
              0.8,
              0.8
            ],
            "position": [
              0.0,
              100.0,
              0.0,
              1.0
            ],
            "spotdirection": [
              0.0,
              -1.0,
              0.0,
              0.0
            ],
            "spotcutoff": 50.0
          }
        ],
                "children": [
                    {
                        "type":"transform",
                        "name": "sphere-transform",
                        "transform": [
                            {"scale": [50,50,-50]}
                        ],
                        "child": {
                            "type": "object",
                            "name": "spherenode",
                            "instanceof": "sphere",
                            "material": 
                            {
                              "ambient": [
                                0.1,
                                0.0,
                                0.1,
                                1.0
                              ],
                              "diffuse": [
                                0.8,
                                0.0,
                                0.8,
                                1.0
                              ],
                              "specular": [
                                0.8,
                                0.0,
                                0.8,
                                1.0
                              ],
                              "emission": [
                                0.0,
                                0.0,
                                0.0,
                                1.0
                              ],
                              "shininess": 100.0,
                              "absorption": 1.0,
                              "reflection": 0.0,
                              "transparency": 0.0,
                              "refractive_index": 0.0
                            }
                        }
                    }
                ]
            }
        }
        `;
  }

  public animate(): void {
    this.time += 1;
    if (this.scenegraph != null) {
      this.scenegraph.animate(this.time);
    }
    this.draw();
  }

  public draw(): void {

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST);

    if (this.scenegraph == null) {
      return;
    }

    this.gl.useProgram(this.shaderProgram)

    while (!this.modelview.isEmpty())
      this.modelview.pop();

    /*
     *In order to change the shape of this triangle, we can either move the vertex positions above, or "transform" them
     * We use a modelview matrix to store the transformations to be applied to our triangle.
     * Right now this matrix is identity, which means "no transformations"
     */
    this.modelview.push(mat4.create());
    this.modelview.push(mat4.clone(this.modelview.peek()));
    let cameraPos : vec3 = vec3.fromValues(0, 0, 500);
    let position : vec3 = vec3.create();
    // This is for simple objects
    mat4.lookAt(this.modelview.peek(),cameraPos , vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
    //console.log(this.modelview.peek());
    //Calculate the ray trace here by the model view stack from the camere
    mat4.getTranslation(position, this.modelview.peek());
    //console.log(position[0],position[1],position[2]);
    let colors : vec3[] = [];
    let w : number = 800;
    let h : number = 800;
    colors = this.rayTrace(w,h,this.modelview,cameraPos);
    //This is for hogwarts model 
    //mat4.lookAt(this.modelview.peek(), vec3.fromValues(100, 100, 150), vec3.fromValues(75, 50, 0), vec3.fromValues(0, 1, 0));

    this.gl.uniformMatrix4fv(this.shaderLocations.getUniformLocation("projection"), false, this.proj);
    this.rayTraceView.fillCanvas(colors,w,h);



    this.scenegraph.draw(this.modelview);
  }

  public rayTrace(width : number, height : number, modelview : Stack<mat4>, cameraPos : vec3) : vec3[]{
    let i : number;
    let j : number;
    let colors : vec3[] = [];
    // go through the row first then to the column
    for( i= -height / 2; i < height / 2; i ++) {
      for(j = -width / 2; j < width / 2; j ++) {
        let pixel : vec3 = vec3.fromValues(cameraPos[0] + j, cameraPos[1] + i, 0);
        let d : vec3 = vec3.create();
        let u : vec3 = vec3.create();
        let v : vec3 = vec3.create();
        //TODO:
        //Not sure the sign of this ray at z axis
        vec3.scale(d, vec3.fromValues(0,0,1), cameraPos[2]);
        vec3.scale(u, vec3.fromValues(1,0,0), pixel[0]);
        vec3.scale(v, vec3.fromValues(0,1,0), pixel[1]);
        let direction : vec3 = vec3.create();
        vec3.add(direction, d,u);
        vec3.add(direction, direction, v);
        //vec3.normalize(direction,direction);

        let ray : Ray = new Ray(cameraPos, direction);
        //console.log(ray.getDirection()[0], ray.getDirection()[1], ray.getDirection()[2]);
        let color : vec3 = this.rayCast(ray, modelview);
        //console.log(colors);
        colors.push(color);
      }
    }
    //console.log(colors);
    return colors;
  }

  public rayCast(ray : Ray, modelview : Stack<mat4>) : vec3 {
    let blackColor : vec3 = vec3.fromValues(0,0,0);
    let redColor : vec3 = vec3.fromValues(1,0,0);
    let whiteColor : vec3 = vec3.fromValues(1,1,1);
    let color : vec3 = vec3.create();
    let hitRecord : HitRecord = this.scenegraph.closest_intersection(ray, modelview);
    //console.log(hitRecord.getTime());
    if(hitRecord.getTime() < Infinity) {
      //console.log(hitRecord.getTime());
      return whiteColor;
    }
    else {
      return blackColor;
    }
  }

  public freeMeshes(): void {
    this.scenegraph.dispose();
  }

  public setFeatures(features: Features): void {
    /*
    window.addEventListener("keydown", ev => features.keyPress(ev.code));
        //mouse events
        let canvas: HTMLCanvasElement = <HTMLCanvasElement>document.querySelector("#glCanvas");
        let canvasBounds: ClientRect = canvas.getBoundingClientRect();
        let width: number = Number(canvas.getAttribute("width"));
        let height: number = Number(canvas.getAttribute("height"));

        canvas.addEventListener("mousedown", ev => features.mousePress(ev.x - canvasBounds.left, (ev.y) + canvasBounds.top));
        canvas.addEventListener("mouseup", ev => features.mouseRelease(ev.x - canvasBounds.left, (ev.y) + canvasBounds.top));
        canvas.addEventListener("mousemove", ev => features.mouseDragged(ev.x - canvasBounds.left, (ev.y) + canvasBounds.top));
        */
  }

  private createAeroplane(x: number, y: number, z: number): string {
    return `{
            "type":"transform",
            "name": "aeroplane-transform",
            "transform": [
                {"rotate": [90,1,0,0]},
                {"scale": [${x},${y},${z}]},
                {"translate":[0,0,0]}
            ],
            "child": {
                "type": "object",
                "name": "aeroplanenode",
                "instanceof": "aeroplane",
                "material": {
                    "ambient": [${Math.random()},${Math.random()},${Math.random()}, ${Math.random()}],
                    "diffuse": [
                      0.8,
                      0.8,
                      0.8,
                      1.0
                    ],
                    "specular": [
                      0.8,
                      0.8,
                      0.8,
                      1.0
                    ],
                    "emission": [
                      0.0,
                      0.0,
                      0.0,
                      1.0
                    ],
                    "shininess": 25.0,
                    "absorption": 1.0,
                    "reflection": 0.0,
                    "transparency": 0.0,
                    "refractive_index": 0.0
                }
            }
        }`;
  }

  private createBox(x: number, y: number, z: number, tX: number, tY: number, tZ: number): string {
    return `{
            "type":"transform",
            "name": "box-transform",
            "transform": [
                {"translate": [${tX + x / 2},${tY + y / 2},${tZ + z / 2}]},
                {"scale": [${x},${y},${z}]}
            ],
            "child": {
                "type": "object",
                "name": "boxnode",
                "instanceof": "box",
                "texture": "white",
                "material": {
                  "ambient": [${Math.random()},${Math.random()},${Math.random()}, ${Math.random()}],
                  "diffuse": [
                    0.8,
                    0.8,
                    0.8,
                    1.0
                  ],
                  "specular": [
                    0.8,
                    0.8,
                    0.8,
                    1.0
                  ],
                  "emission": [
                    0.0,
                    0.0,
                    0.0,
                    1.0
                  ],
                  "shininess": 25.0,
                  "absorption": 1.0,
                  "reflection": 0.0,
                  "transparency": 0.0,
                  "refractive_index": 0.0
                }
            }
        }`;
  }
  private createCone(x: number, y: number, z: number, tX: number, tY: number, tZ: number, texture: string): string {
    return `{
            "type":"transform",
            "name": "cone-transform",
            "transform": [
                {"translate": [${tX + x},${tY},${tZ + z}]},
                {"scale": [${x},${y},${z}]}
            ],
            "child": {
                "type": "object",
                "name": "conenode",
                "instanceof": "cone",
                "texture": "${texture}",
                "material": {
                    "ambient": [1,1,1,1],
                    "diffuse": [
                      0.8,
                      0.8,
                      0.8,
                      1.0
                    ],
                    "specular": [
                      0.8,
                      0.8,
                      0.8,
                      1.0
                    ],
                    "emission": [
                      0.0,
                      0.0,
                      0.0,
                      1.0
                    ],
                    "shininess": 25.0,
                    "absorption": 1.0,
                    "reflection": 0.0,
                    "transparency": 0.0,
                    "refractive_index": 0.0
                }
            }
        }`;
  }

  private createCylinder(x: number, y: number, z: number, tX: number, tY: number, tZ: number, textureName: string): string {
    if (textureName == "") {
      return `{
        "type":"transform",
        "name": "cylinder-transform",
        "transform": [
            {"translate": [${tX + x},${tY},${tZ + z}]},
            {"scale": [${x},${y},${z}]}
        ],
        "child": {
            "type": "object",
            "name": "cylindernode",
            "instanceof": "cylinder",
            "texture": "white",
            "material": {
                "ambient": [${Math.random()},${Math.random()},${Math.random()}, ${Math.random()}],
                "diffuse": [
                  0.8,
                  0.8,
                  0.8,
                  1.0
                ],
                "specular": [
                  0.8,
                  0.8,
                  0.8,
                  1.0
                ],
                "emission": [
                  0.0,
                  0.0,
                  0.0,
                  1.0
                ],
                "shininess": 25.0,
                "absorption": 1.0,
                "reflection": 0.0,
                "transparency": 0.0,
                "refractive_index": 0.0
            }
        }
    }`;
    }
    else {
      return `{
            "type":"transform",
            "name": "cylinder-transform",
            "transform": [
                {"translate": [${tX + x},${tY},${tZ + z}]},
                {"scale": [${x},${y},${z}]}
            ],
            "child": {
                "type": "object",
                "name": "cylindernode",
                "instanceof": "cylinder",
                "texture" : "${textureName}",
                "material": {
                    "ambient": [1,1,1,1],
                "diffuse": [
                  0.8,
                  0.8,
                  0.8,
                  1.0
                ],
                "specular": [
                  0.8,
                  0.8,
                  0.8,
                  1.0
                ],
                "emission": [
                  0.0,
                  0.0,
                  0.0,
                  1.0
                ],
                "shininess": 25.0,
                "absorption": 1.0,
                "reflection": 0.0,
                "transparency": 0.0,
                "refractive_index": 0.0
                }
            }
        }`;
    }
  }

  private createTurrets(boxScaleX: number, boxScaleY: number, boxScaleZ: number, cylinderScaleX: number,
    cylinderScaleY: number, cylinderScaleZ: number, coneScaleX: number, coneScaleY: number, coneScaleZ: number,
    tX: number, tY: number, tZ: number, texture: string, isLarge: boolean): string {
    let textureName: string = "";
    if (isLarge) {
      textureName = texture;
    }
    return `{
            "type":"transform",
            "name": "box-transform",
            "transform": [
                {"translate": [${tX},${tY},${tZ}]}
            ],
            "child": {
                "type": "group",
                "children" : [
                    ${this.createBox(boxScaleX, boxScaleY, boxScaleZ, 0, 0, 0)},
                    ${this.createCylinder(cylinderScaleX, cylinderScaleY, cylinderScaleZ, 0, boxScaleY, 0, textureName)},
                    ${this.createCone(coneScaleX, coneScaleY, coneScaleZ, 0, boxScaleY + cylinderScaleY, 0, "checkerboard")}    
                ]
            }
        }`;
  }

  private jsonHogwarts(): string {
    let box1: string = this.createBox(50, 20, -10, 25, 0, -45);
    let box2: string = this.createBox(20, 20, -10, 85, 0, -45);
    let box3: string = this.createBox(20, 20, -10, 121, 0, -45);
    let box4: string = this.createBox(15, 20, -35, 5, 0, -10);
    let box5: string = this.createBox(20, 20, -35, 20, 0, -10);
    let box6: string = this.createBox(15, 20, -20, 40, 0, -25);
    let box7: string = this.createBox(10, 20, -35, 55, 0, -10);
    let box8: string = this.createBox(10, 20, -15, 65, 0, -20);
    let box9: string = this.createBox(10, 20, -35, 75, 0, -10);
    let box10: string = this.createBox(36, 20, -10, 85, 0, -22);
    let box11: string = this.createBox(10, 20, -15, 131, 0, -22);
    let box12: string = this.createBox(5, 20, -10, 10, 0, 0);
    let box13: string = this.createBox(15, 20, -10, 25, 0, 0);
    let turret1: string = this.createTurrets(10, 50, -10, 5, 5, -5, 5, 10, -5, 0, 0, 0, "", false);
    let turret2: string = this.createTurrets(10, 50, -10, 5, 5, -5, 5, 10, -5, 15, 0, 0, "", false);
    let turret3: string = this.createTurrets(10, 50, -10, 5, 5, -5, 5, 10, -5, 75, 0, 0, "", false);
    let turret4: string = this.createTurrets(15, 50, -15, 7.5, 10, -7.5, 7.5, 10, -7.5, 40, 0, -10, "", false);
    let turret5: string = this.createTurrets(10, 50, -10, 5, 5, -5, 5, 10, -5, 65, 0, -10, "", false);
    let turret6: string = this.createTurrets(10, 50, -10, 5, 5, -5, 5, 10, -5, 121, 0, -20, "", false);
    let turret7: string = this.createTurrets(10, 50, -10, 5, 5, -5, 5, 10, -5, 65, 0, -35, "", false);
    let turret8: string = this.createTurrets(10, 50, -10, 5, 5, -5, 5, 10, -5, 131, 0, -37, "", false);
    let turret9: string = this.createTurrets(10, 50, -10, 5, 5, -5, 5, 10, -5, 75, 0, -45, "brick2", false);
    let turret10: string = this.createTurrets(0, 0, 0, 12.5, 40, -12.5, 12.5, 50, -12.5, 100.5, 0, -37.5, "wall", true);
    let quadTurret1: string = this.createTurrets(25, 20, -25, 0, 0, 0, 0, 0, 0, 0, 0, -45, "wall", true);
    let quadTurret2: string = this.createTurrets(0, 0, 0, 11, 25, -11, 0, 0, 0, 1.5, 20, -46.5, "wall", true);
    let quadTurret3: string = this.createTurrets(0, 0, 0, 10, 40, -10, 10, 20, -10, 2.5, 45, -47.5, "wall", true);
    let minirate1: string = this.createTurrets(0, 0, 0, 4, 30, -4, 4, 10, -4, 0, 30, -53, "wall", true);
    let minirate2: string = this.createTurrets(0, 0, 0, 4, 30, -4, 4, 10, -4, 17, 30, -53, "wall", true);
    let minirate3: string = this.createTurrets(0, 0, 0, 4, 30, -4, 4, 10, -4, 8.5, 30, -45, "wall", true);
    let minirate4: string = this.createTurrets(0, 0, 0, 4, 30, -4, 4, 10, -4, 8.5, 30, -62, "wall", true);
    let aeroplane: string = this.createAeroplane(1, 1, 1);
    //Create the custom quad-turret thingy.
    return `
        {
            "scaleinstances":"false",
            "instances": [
                {
                    "name":"box",
                    "path":"models/box.obj"
                },
                {
                    "name":"cylinder",
                    "path":"models/cylinder.obj"
                },
                {
                    "name":"cone",
                    "path":"models/cone.obj"
                },
                {
                    "name":"aeroplane",
                    "path":"models/aeroplane.obj"
                }
            ],
            "images": [
              {
                "name": "surface",
                "path": "textures/checkerboard.png"
              },
              {
                "name": "metal",
                "path": "textures/checkerboard.png"
              },
              {
                "name" : "wall",
                "path" : "textures/brick1.png"
              },
              {
                "name" : "brick2",
                "path" : "textures/brick2.png"
              },
              {
                "name" : "earth",
                "path" : "textures/earthmap.png"
              },
              {
                "name" : "checkerboard",
                "path" : "textures/checkerboard.png"
              },
              {
                "name" : "white",
                "path" : "textures/checkerboard.png"
              }
            ],
            "root": {
                "type": "group",
                "name": "root",
                "lights": [
                  {
                    "ambient": [
                      0.5,
                      0.5,
                      0.5
                    ],
                    "diffuse": [
                      0.8,
                      0.8,
                      0.8
                    ],
                    "specular": [
                      0.8,
                      0.8,
                      0.8
                    ],
                    "position": [
                      0.0,
                      100.0,
                      0.0,
                      1.0
                    ],
                    "spotdirection": [
                      0.0,
                      -1.0,
                      0.0,
                      0.0
                    ],
                    "spotcutoff": 90.0
                  }
                ],
                "children": [${box1}, ${box2}, ${box3}, ${box4}, ${box5}, ${box6}, 
                    ${box7}, ${box8}, ${box9}, ${box10}, ${box11}, ${box12}, ${box13},
                    ${turret1}, ${turret2}, ${turret3}, ${turret4}, ${turret5}, ${turret6}, 
                    ${turret7}, ${turret8}, ${turret9}, ${turret10}, ${quadTurret1}, ${quadTurret2}, ${quadTurret3}, ${minirate1},
                    ${minirate2}, ${minirate3}, ${minirate4}, ${aeroplane}]
            }
        }
        `
  }

}