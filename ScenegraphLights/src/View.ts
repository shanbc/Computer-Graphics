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

  private frame: number = 0;
  private data: string = "";
  private maxFrame: number = 0;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.time = 0;
    this.modelview = new Stack<mat4>();
    this.scenegraph = null;
    //set the clear color
    this.gl.clearColor(0.9, 0.9, 0.7, 1);


    //Our quad is in the range (-100,100) in X and Y, in the "virtual world" that we are drawing. We must specify what part of this virtual world must be drawn. We do this via a projection matrix, set up as below. In this case, we are going to render the part of the virtual world that is inside a square from (-200,-200) to (200,200). Since we are drawing only 2D, the last two arguments are not useful. The default Z-value chosen is 0, which means we only specify the last two numbers such that 0 is within their range (in this case we have specified them as (-100,100))
    this.proj = mat4.ortho(mat4.create(), -100, 100, -100, 100, 0.1, 10000);

    //this.proj = mat4.perspective(this.proj, glMatrix.toRadian(60), 1, 0.1, 10000);

    //We must also specify "where" the above part of the virtual world will be shown on the actual canvas on screen. This part of the screen where the above drawing gets pasted is called the "viewport", which we set here. The origin of the viewport is left,bottom. In this case we want it to span the entire canvas, so we start at (0,0) with a width and height of 400 each (matching the dimensions of the canvas specified in HTML)
    this.gl.viewport(0, 0, 400, 400);
  }

  public getNumLights(): number {
    return this.scenegraph.getNumLights();
  }

  public initShaders(vShaderSource: string, fShaderSource: string) {
    //create and set up the shader
    this.shaderProgram = WebGLUtils.createShaderProgram(this.gl, vShaderSource, fShaderSource);
    //enable the current program
    this.gl.useProgram(this.shaderProgram);
    //this.shaderVarsToAttributes.set("vTexCoord", "texcoord");

    this.shaderLocations = new ShaderLocationsVault(this.gl, this.shaderProgram);

  }

  public initRenderer(): void {
    let shaderVarsToVertexAttribs: Map<string, string> = new Map<string, string>();
    shaderVarsToVertexAttribs.set("vPosition", "position");
    shaderVarsToVertexAttribs.set("vNormal", "normal");
    shaderVarsToVertexAttribs.set("vTexCoord", "texcoord");
    
    let renderer: ScenegraphRenderer = new ScenegraphRenderer(this.gl, this.shaderLocations, shaderVarsToVertexAttribs);
    this.scenegraph.setRenderer(renderer);
  }

  public initScenegraph(): Promise<void> {
    return new Promise<void>((resolve) => {
      ScenegraphJSONImporter.importJSON(new VertexPNTProducer(), this.jsonTexture())
        .then((s: Scenegraph<VertexPNT>) => {
          this.scenegraph = s;
          resolve();
        });
    });
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
                    "ambient": [${Math.random()},${Math.random()},${Math.random()}, ${Math.random()}]
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
                "material": {
                    "ambient": [${Math.random()},${Math.random()},${Math.random()}, ${Math.random()}]
                }
            }
        }`;
  }
  private createCone(x: number, y: number, z: number, tX: number, tY: number, tZ: number): string {
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
                "material": {
                    "ambient": [${Math.random()},${Math.random()},${Math.random()}, ${Math.random()}]
                }
            }
        }`;
  }

  private createCylinder(x: number, y: number, z: number, tX: number, tY: number, tZ: number): string {
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
                "material": {
                    "ambient": [${Math.random()},${Math.random()},${Math.random()}, ${Math.random()}]
                }
            }
        }`;
  }

  private createTurrets(boxScaleX: number, boxScaleY: number, boxScaleZ: number, cylinderScaleX: number,
    cylinderScaleY: number, cylinderScaleZ: number, coneScaleX: number, coneScaleY: number, coneScaleZ: number,
    tX: number, tY: number, tZ: number): string {
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
                    ${this.createCylinder(cylinderScaleX, cylinderScaleY, cylinderScaleZ, 0, boxScaleY, 0)},
                    ${this.createCone(coneScaleX, coneScaleY, coneScaleZ, 0, boxScaleY + cylinderScaleY, 0)}    
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
    let turret1: string = this.createTurrets(10, 50, -10, 5, 5, -5, 5, 10, -5, 0, 0, 0);
    let turret2: string = this.createTurrets(10, 50, -10, 5, 5, -5, 5, 10, -5, 15, 0, 0);
    let turret3: string = this.createTurrets(10, 50, -10, 5, 5, -5, 5, 10, -5, 75, 0, 0);
    let turret4: string = this.createTurrets(15, 50, -15, 7.5, 10, -7.5, 7.5, 10, -7.5, 40, 0, -10);
    let turret5: string = this.createTurrets(10, 50, -10, 5, 5, -5, 5, 10, -5, 65, 0, -10);
    let turret6: string = this.createTurrets(10, 50, -10, 5, 5, -5, 5, 10, -5, 121, 0, -20);
    let turret7: string = this.createTurrets(10, 50, -10, 5, 5, -5, 5, 10, -5, 65, 0, -35);
    let turret8: string = this.createTurrets(10, 50, -10, 5, 5, -5, 5, 10, -5, 131, 0, -37);
    let turret9: string = this.createTurrets(10, 50, -10, 5, 5, -5, 5, 10, -5, 75, 0, -45);
    let turret10: string = this.createTurrets(0, 0, 0, 12.5, 40, -12.5, 12.5, 50, -12.5, 100.5, 0, -37.5);
    let quadTurret1: string = this.createTurrets(25, 20, -25, 0, 0, 0, 0, 0, 0, 0, 0, -45);
    let quadTurret2: string = this.createTurrets(0, 0, 0, 11, 25, -11, 0, 0, 0, 1.5, 20, -46.5);
    let quadTurret3: string = this.createTurrets(0, 0, 0, 10, 40, -10, 10, 20, -10, 2.5, 45, -47.5);
    let minirate1: string = this.createTurrets(0, 0, 0, 4, 30, -4, 4, 10, -4, 0, 30, -53);
    let minirate2: string = this.createTurrets(0, 0, 0, 4, 30, -4, 4, 10, -4, 17, 30, -53);
    let minirate3: string = this.createTurrets(0, 0, 0, 4, 30, -4, 4, 10, -4, 8.5, 30, -45);
    let minirate4: string = this.createTurrets(0, 0, 0, 4, 30, -4, 4, 10, -4, 8.5, 30, -62);
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
                    "spotcutoff": 25.0
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

  /*public animate(): void {
    this.time += 1;
    if (this.scenegraph != null) {
      this.scenegraph.animate(this.time);
    }
    this.draw();
  }*/

  public animate(s: string): void {
    //console.log(s);
    this.time += 1;
    this.maxFrame = parseInt(s.substring(0, 4));
    this.frame = (this.frame + 1) % this.maxFrame;

    if (this.scenegraph != null) {
      this.scenegraph.animate(this.time);
    }
    //this.placeAeroplaneAtCoord(this.getCoordinatesFromLine(this.getLineFromFrame(this.frame, s)), this.getCoordinatesFromLine(this.getLineFromFrame((this.frame + 1), s)));

    this.draw();
  }

  public getLineFromFrame(frame: number, coords: string): string {
    let lines: string[] = coords.split(/\r?\n/);
    let num: number = frame % this.maxFrame;
    return lines[num];
  }

  public getCoordinatesFromLine(line: string): number[] {
    let lines: string[] = line.split(" ");
    let coords: number[] = [];
    for (let i: number = 0; i < lines.length; i++) {
      coords[i] = parseFloat(lines[i]);
    }
    return coords;
  }

  public setData(s: string): void {
    this.data = s;
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
    mat4.lookAt(this.modelview.peek(), vec3.fromValues(200, 200, 300), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));

/*
    // These two lines are for mipmapping. Asking for usage.
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
*/

    this.gl.uniformMatrix4fv(this.shaderLocations.getUniformLocation("projection"), false, this.proj);



    this.scenegraph.draw(this.modelview);
  }

  public placeAeroplaneAtCoord(coord: number[], nextCoord: number[]): void {
    let animationTransform: mat4;
    animationTransform = mat4.create();
    mat4.translate(animationTransform, animationTransform, vec3.fromValues(coord[0], coord[1], coord[2]));

    let angleZ: number = Math.atan2((nextCoord[1] - coord[1]), (nextCoord[0] - coord[0])) % Math.PI;
    let angleX: number = Math.atan2((nextCoord[2] - coord[2]), (nextCoord[1] - coord[1])) % Math.PI;
    let angleY: number = Math.atan2((nextCoord[0] - coord[0]), (nextCoord[2] - coord[2])) % Math.PI;
    //mat4.rotateX(animationTransform,animationTransform, angleX - Math.PI / 2 );
    mat4.rotateY(animationTransform, animationTransform, angleY);
    mat4.rotateZ(animationTransform, animationTransform, angleZ);
    this.scenegraph.getNodes().get("aeroplane-transform").setAnimationTransform(animationTransform);

    //console.log(this.scenegraph.getNodes().get("aeroplane-transform"));
  }

  public freeMeshes(): void {
    this.scenegraph.dispose();
  }

  public setFeatures(features: Features): void {
  }

  public jsonTexture(): string {
    return `{
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
            "spotcutoff": 90.0
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
                        0.0,
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
                    "texture": "checkerboard",
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

}