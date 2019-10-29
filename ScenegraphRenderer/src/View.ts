import { vec4, mat4, vec3, glMatrix } from "gl-matrix";
import * as WebGLUtils from "%COMMON/WebGLUtils";
import { Features } from "./Controller";
import { Stack } from "%COMMON/Stack"
import { Scenegraph } from "./Scenegraph";
import { VertexPNT, VertexPNTProducer } from "./VertexPNT";
import { ShaderLocationsVault } from "%COMMON/ShaderLocationsVault";
import { ScenegraphRenderer } from "./ScenegraphRenderer";
import { Mesh } from "%COMMON/PolygonMesh";
import { ObjImporter } from "%COMMON/ObjImporter"
import { ScenegraphJSONImporter } from "./ScenegraphJSONImporter"
import { LeafNode } from "./LeafNode";
import { TransformNode } from "./TransformNode";
import { SGNode } from "SGNode";
import { Material } from "%COMMON/Material";
import { GroupNode } from "./GroupNode";
import { MeshProperties} from "./meshProperties";
import { RenderableMesh } from "%COMMON/RenderableMesh";

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
    private meshProperties: Map<string, MeshProperties>;
    private renderableMeshes: Map<string, RenderableMesh<VertexPNT>>;

    private time: number;
    private viewType: number;
    private cameraPath: string;
    private frame: number = 0;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
        this.time = 0;
        this.modelview = new Stack<mat4>();
        this.scenegraph = null;
        this.renderableMeshes = new Map<string, RenderableMesh<VertexPNT>>();
        this.meshProperties = new Map<string, MeshProperties>();
        //set the clear color
        this.gl.clearColor(0.9, 0.9, 0.7, 1);
        this.viewType = 0;

        //Our quad is in the range (-100,100) in X and Y, in the "virtual world" that we are drawing. We must specify what part of this virtual world must be drawn. We do this via a projection matrix, set up as below. In this case, we are going to render the part of the virtual world that is inside a square from (-200,-200) to (200,200). Since we are drawing only 2D, the last two arguments are not useful. The default Z-value chosen is 0, which means we only specify the last two numbers such that 0 is within their range (in this case we have specified them as (-100,100))
        this.proj = mat4.ortho(mat4.create(), -100, 100, -100, 100, 0.1, 10000);

        //We must also specify "where" the above part of the virtual world will be shown on the actual canvas on screen. This part of the screen where the above drawing gets pasted is called the "viewport", which we set here. The origin of the viewport is left,bottom. In this case we want it to span the entire canvas, so we start at (0,0) with a width and height of 400 each (matching the dimensions of the canvas specified in HTML)
        this.gl.viewport(0, 0, 400, 400);
        //console.log(this.cameraPath);
    }


    public initShaders(vShaderSource: string, fShaderSource: string) {
        //create and set up the shader
        this.shaderProgram = WebGLUtils.createShaderProgram(this.gl, vShaderSource, fShaderSource);
        //enable the current program
        this.gl.useProgram(this.shaderProgram);

        this.shaderLocations = new ShaderLocationsVault(this.gl, this.shaderProgram);

    }

    public initScenegraph(): void {

        //make scene graph programmatically
        /*  let meshURLs: Map<string, string> = new Map<string, string>();
          meshURLs.set("box", "models/box.obj");
          meshURLs.set("aeroplane", "models/aeroplane.obj");
          ObjImporter.batchDownloadMesh(meshURLs, new VertexPNTProducer(), (meshMap: Map<string, Mesh.PolygonMesh<VertexPNT>>) => {
                  this.scenegraph = new Scenegraph<VertexPNT>();
                  this.scenegraph.addPolygonMesh("box", meshMap.get("box"));
                  this.scenegraph.addPolygonMesh("aeroplane", meshMap.get("aeroplane"));
                  let groupNode: GroupNode = new GroupNode(this.scenegraph, "root");
                  let transformNode: TransformNode = new TransformNode(this.scenegraph, "box-transform");
                  let transform: mat4 = mat4.create();
                  mat4.scale(transform, transform, vec3.fromValues(50, 50, 50));
                  transformNode.setTransform(transform);
                  let child: SGNode = new LeafNode("box", this.scenegraph, "boxnode");
                  let mat: Material = new Material();
                  mat.setAmbient(vec3.fromValues(1, 0, 0));
                  child.setMaterial(mat);
                  transformNode.addChild(child);
                  groupNode.addChild(transformNode);
      
                  transformNode = new TransformNode(this.scenegraph, "aeroplane-transform");
                  transform = mat4.create();
                  mat4.scale(transform, transform, vec3.fromValues(30, 30, 30));
                  mat4.rotate(transform, transform, glMatrix.toRadian(90), vec3.fromValues(1, 0, 0));
                  mat4.rotate(transform, transform, glMatrix.toRadian(180), vec3.fromValues(0, 1, 0));
                  transformNode.setTransform(transform);
                  child = new LeafNode("aeroplane", this.scenegraph, "aeroplane-node");
                  mat = new Material();
                  mat.setAmbient(vec3.fromValues(1, 1, 0));
                  child.setMaterial(mat);
                  transformNode.addChild(child);
                  groupNode.addChild(transformNode);
      
      
      
                  this.scenegraph.makeScenegraph(groupNode);
                  
  
              this.scenegraph = ScenegraphJSONImporter.importJSON()
              //set it up
  
              let shaderVarsToVertexAttribs: Map<string, string> = new Map<string, string>();
              shaderVarsToVertexAttribs.set("vPosition", "position");
              let renderer: ScenegraphRenderer = new ScenegraphRenderer(this.gl, this.shaderLocations, shaderVarsToVertexAttribs);
  
              this.scenegraph.setRenderer(renderer);
          }); */

        ScenegraphJSONImporter.importJSON(new VertexPNTProducer(), this.jsonHogwarts())
            .then((s: Scenegraph<VertexPNT>) => {
                let shaderVarsToVertexAttribs: Map<string, string> = new Map<string, string>();
                shaderVarsToVertexAttribs.set("vPosition", "position");
                let renderer: ScenegraphRenderer = new ScenegraphRenderer(this.gl, this.shaderLocations, shaderVarsToVertexAttribs);
                this.scenegraph = s;
                this.scenegraph.setRenderer(renderer);
            });
        //set it up


    }

    //a JSON representation of a jack-in-the-box
    private json2(): string {
        return `
        {
            "instances": [
                {
                    "name":"sphere",
                    "path":"models/sphere.obj"
                },
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
                }
            ],
            "root": {
                "type":"group",
                "children":[
                {
                    "type":"transform",
                    "transform":[
                        {"scale":[50,5,50]}
                    ],
                    "child": {
                        "type":"object",
                        "instanceof":"box",
                        "material": {
                            "color":[0.5,0.5,0.5]
                        }
                    }
                },
                {
                    "type":"transform",
                    "name":"face",
                    "transform":[
                        {"translate":[0,25,0]}
                    ],        
                    "child": {
                        "type":"group",
                        "children": [
                            {
                                "type":"transform",
                                "name":"actualface",
                                "transform":[
                                    {"scale":[20,25,20]}
                                ],
                                "child": {
                                    "type":"object",
                                    "instanceof":"sphere",
                                    "material": {
                                        "color":[1,1,0.8]
                                    }
                                }
                            },
                            {
                                "type":"transform",
                                "name":"lefteye",
                                "transform":[
                                    {"translate":[7,15,12]},
                                    {"scale":[3,4,3]}
                                ],
                                "child": {
                                    "type":"object",
                                    "instanceof":"sphere",
                                    "material": {
                                        "color":[0,0,0]
                                    }
                                }
                            },
                            {
                                "type":"transform",
                                "name":"righteye",
                                "transform":[
                                    {"translate":[-7,15,12]},
                                    {"scale":[3,4,3]}
                                ],
                                "child": {
                                    "type":"object",
                                    "instanceof":"sphere",
                                    "material": {
                                        "color":[0,0,0]
                                    }
                                }
                            },
                            {
                                "type":"transform",
                                "name":"nose",
                                "transform":[
                                    {"translate":[0,10,10]},
                                    {"rotate":[90,1,0,0]},
                                    {"scale":[5,20,5]}
                                ],
                                "child": {
                                    "type":"object",
                                    "instanceof":"cylinder",
                                    "material": {
                                        "color":[1,0,0]
                                    }
                                }
                            },
                            {
                                "type":"transform",
                                "name":"hat",
                                "transform":[
                                    {"translate":[0,20,0]},
                                    {"scale":[10,25,10]}
                                ],
                                "child": {
                                    "type":"object",
                                    "instanceof":"cone",
                                    "material": {
                                        "color":[1,0,1]
                                    }
                                }
                            }
                        ]
                    }
                }]
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
                "name": "box",
                "path": "models/box.obj"
            },
            {
                "name": "aeroplane",
                "path": "models/aeroplane.obj"
            }
            ],
            "root": {
                "type": "group",
                "name": "root",
                "children": [
                    {
                        "type":"transform",
                        "name": "box-transform",
                        "transform": [
                            {"scale": [50,50,50]}
                        ],
                        "child": {
                            "type": "object",
                            "name": "boxnode",
                            "instanceof": "box",
                            "material": {
                                "color": [1,0,0]
                            }
                        }
                    },
                    {
                        "type":"transform",
                        "name": "aeroplane-transform",
                        "transform": [
                        {"rotate": [180,0,1,0]},
                        {"rotate": [90,1,0,0]},
                        {"scale": [30,30,30]}
                        ],
                        "child": {
                            "type": "object",
                            "name": "aeroplane-node",
                            "instanceof": "aeroplane",
                            "material": {
                                "color": [1,1,0]
                            }
                        }
                    }
                ]
            }
        }
        `;
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
                    "color": [${Math.random()},${Math.random()},${Math.random()}]
                }
            }
        }`;
    }
    private createCone(x: number, y: number, z : number, tX: number, tY : number, tZ : number): string {
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
                    "color": [${Math.random()},${Math.random()},${Math.random()}]
                }
            }
        }`;
    }

    private createCylinder(x: number, y: number, z : number, tX: number, tY : number, tZ : number): string {
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
                    "color": [${Math.random()},${Math.random()},${Math.random()}]
                }
            }
        }`;
    }

    private createTurrets(boxScaleX: number, boxScaleY: number, boxScaleZ: number, cylinderScaleX: number,
         cylinderScaleY: number,  cylinderScaleZ: number, coneScaleX: number, coneScaleY: number, coneScaleZ: number,
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
                    ${this.createBox(boxScaleX,boxScaleY,boxScaleZ,0,0,0)},
                    ${this.createCylinder(cylinderScaleX,cylinderScaleY,cylinderScaleZ,0,boxScaleY,0)},
                    ${this.createCone(coneScaleX,coneScaleY,coneScaleZ,0,boxScaleY + cylinderScaleY,0)}    
                ]
            }
        }`;
    }

    private jsonHogwarts(): string {
        let box1: string = this.createBox(50, 20, -10, 25, 0, -45);
        let box2: string = this.createBox(20, 20, -10, 85, 0, -45);
        let box3: string = this.createBox(20, 20, -10, 121,0,-45);
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
                "children": [${box1}, ${box2}, ${box3}, ${box4}, ${box5}, ${box6}, 
                    ${box7}, ${box8}, ${box9}, ${box10}, ${box11}, ${box12}, ${box13},
                    ${turret1}, ${turret2}, ${turret3}, ${turret4}, ${turret5}, ${turret6}, 
                    ${turret7}, ${turret8}, ${turret9}, ${turret10}, ${quadTurret1}, ${quadTurret2}, ${quadTurret3}, ${minirate1},
                    ${minirate2}, ${minirate3}, ${minirate4}]
            }
        }
        `
    }

    public animate(s: string): void {
        //console.log(s);
        this.time += 1;
        let maxFrame: number = parseInt(s.substring(0, 4));
        this.frame = (this.frame + 1) % maxFrame;

        //console.log(this.getCoordinatesFromLine(this.getLineFromFrame(this.frame, s)));
        this.placeAeroplaneAtCoord(this.getCoordinatesFromLine(this.getLineFromFrame(this.frame, s)));

        if (this.scenegraph != null) {
            this.scenegraph.animate(this.time);
        }
        this.draw();
    }

    public draw(): void {

        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);

        if (this.scenegraph == null) {
            return;
        }

        this.gl.useProgram(this.shaderProgram)

        while (!this.modelview.isEmpty())
            this.modelview.pop();

        this.modelview.push(mat4.create());
        this.modelview.push(mat4.clone(this.modelview.peek()));

        if (this.viewType == 0) {
            mat4.lookAt(this.modelview.peek(), vec3.fromValues(Math.sin(this.time * 0.01) * 200, 50, -Math.cos(this.time * 0.01) * 200), vec3.fromValues(75, 0, -35), vec3.fromValues(0, 1, 0));
        }
        else if (this.viewType == 1) {
            mat4.lookAt(this.modelview.peek(), vec3.fromValues(100, 160, 150), vec3.fromValues(75, 0, -35), vec3.fromValues(0, 1, 0));
        }
        else if (this.viewType == 2) {
            mat4.lookAt(this.modelview.peek(), vec3.fromValues(75, 1200, 0), vec3.fromValues(75, 0, -1), vec3.fromValues(0, 1, 0));
        }
        else {
            //TODO : should modify this method
            mat4.lookAt(this.modelview.peek(), vec3.fromValues(75, 1200, 0), vec3.fromValues(75, 0, -1), vec3.fromValues(0, 1, 0));
        }
        console.log(this.viewType)

        this.gl.uniformMatrix4fv(this.shaderLocations.getUniformLocation("proj"), false, this.proj);

        this.scenegraph.draw(this.modelview);

        for (let [key, value] of this.meshProperties) {
            //save the current modelview
            this.modelview.push(mat4.clone(this.modelview.peek()));

            mat4.multiply(this.modelview.peek()
                , this.modelview.peek()
                , value.getAnimationTransform());

            mat4.multiply(this.modelview.peek()
                , this.modelview.peek()
                , value.getTransform());

            //The total transformation is whatever was passed to it, with its own transformation
            let modelviewLocation: WebGLUniformLocation = this.shaderLocations.getUniformLocation("modelview");
            this.gl.uniformMatrix4fv(modelviewLocation, false, this.modelview.peek());

            //set the color for all vertices to be drawn for this object
            let colorLocation: WebGLUniformLocation = this.shaderLocations.getUniformLocation("vColor");
            this.gl.uniform4fv(colorLocation, value.getColor());
            this.renderableMeshes.get(value.getType()).draw(this.shaderLocations);

            this.modelview.pop();
        }
        this.modelview.pop();
        
    }

    public  setTPerspective() : void{
        this.viewType = 0;
    }

    public setFPerspective() : void{
        this.viewType = 1;
    }
    
    public setOPerspective() : void{
        this.viewType = 2;
    }
        
    

    public getLineFromFrame(frame: number, coords: string): string {
        let lines: string[] = coords.split(/\r?\n/);
        return lines[frame];
    }

    public getCoordinatesFromLine(line: string): number[] {
        let lines: string[] = line.split(" ");
        let coords: number[] = [];
        for (let i: number = 0; i < lines.length; i++) {
            coords[i] = parseFloat(lines[i]);
        }
        return coords;
    }

    public placeAeroplaneAtCoord(coord: number[]): void {
        let animationTransform: mat4;

        animationTransform = mat4.create();
        
    }

    public freeMeshes(): void {
        this.scenegraph.dispose();
    }

    /**
     * this sets up the callbacks for the button used to load a new mesh
     * @param features 
     */
    public setFeatures(features: Features): void {
        window.addEventListener("keydown", ev => features.keyPress(ev.code));
    }


    public setupScene(inputMeshes: Map<string, Mesh.PolygonMesh<VertexPNT>>): void {
        let transform: mat4;
        let animationTransform: mat4;
        let color: vec4;
        let shaderVarsToAttributes = new Map<string, string>();

        shaderVarsToAttributes.set("vPosition", "position");

        //convert all meshes to wireframe and into renderable meshes
        for (let [n, mesh] of inputMeshes) {
            //convert into canonical form
            //now convert to wireframe
            let wireframeMesh: Mesh.PolygonMesh<VertexPNT> = mesh.convertToWireframe();
            //finally create buffers for rendering 
            let renderableMesh: RenderableMesh<VertexPNT> = new RenderableMesh<VertexPNT>(this.gl, n);
            renderableMesh.initMeshForRendering(shaderVarsToAttributes, wireframeMesh);
            this.renderableMeshes.set(n, renderableMesh);

        }

        

        //aeroplane
        color = vec4.fromValues(1, 1, 0, 1);
        transform = mat4.create();
        mat4.rotate(transform, transform, glMatrix.toRadian(90), vec3.fromValues(1, 0, 0));
        mat4.scale(transform, transform, vec3.fromValues(100, 100, 100));
        mat4.rotate(transform, transform, glMatrix.toRadian(180), vec3.fromValues(0, 1, 0));
        mat4.translate(transform, transform, vec3.fromValues(0, -0.5, 0));

        animationTransform = mat4.create();
        this.meshProperties.set('aeroplane', new MeshProperties('aeroplane', color, transform, animationTransform));
    }


}