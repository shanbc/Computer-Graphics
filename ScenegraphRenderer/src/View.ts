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
import { RenderableMesh } from "%COMMON/RenderableMesh";
import { IVertexData } from "%COMMON/IVertexData";
import { Light } from "%COMMON/Light";

/**
 * This class encapsulates the "view", where all of our WebGL code resides. This class, for now, also stores all the relevant data that is used to draw. This can be replaced with a more formal Model-View-Controller architecture with a bigger application.
 */
class RenderableMeshInfo {
    renderableMesh: RenderableMesh<IVertexData>;
    transform: mat4;
    material: Material;

    constructor(mesh: RenderableMesh<IVertexData>, transform: mat4, material: Material) {
        this.renderableMesh = mesh;
        this.transform = transform;
        this.material = material;

    }
}

class MeshInfo {
    mesh: Mesh.PolygonMesh<IVertexData>;
    transform: mat4;
    material: Material;

    constructor(mesh: Mesh.PolygonMesh<IVertexData>, transform: mat4, material: Material) {
        this.mesh = mesh;
        this.transform = transform;
        this.material = material;

    }
}

enum LightCoordinateSystem { View, World, Object };

class LightInfo {
    light: Light;
    coordinateSystem: LightCoordinateSystem;

    constructor(light: Light, coordinateSystem: LightCoordinateSystem) {
        this.light = light;
        this.coordinateSystem = coordinateSystem;
    }
}


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
    private viewType: number;
    private cameraPath: string;
    private frame: number = 0;
    private data: string = "";
    private maxFrame: number = 0;


    private lights: LightInfo[];

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
        this.time = 0;
        this.modelview = new Stack<mat4>();
        this.scenegraph = null;
        //set the clear color
        this.gl.clearColor(1, 1, 1, 1);
        this.viewType = 0;

        //Our quad is in the range (-100,100) in X and Y, in the "virtual world" that we are drawing. We must specify what part of this virtual world must be drawn. We do this via a projection matrix, set up as below. In this case, we are going to render the part of the virtual world that is inside a square from (-200,-200) to (200,200). Since we are drawing only 2D, the last two arguments are not useful. The default Z-value chosen is 0, which means we only specify the last two numbers such that 0 is within their range (in this case we have specified them as (-100,100))
        this.proj = mat4.ortho(mat4.create(), -100, 100, -100, 100, 0.1, 10000);

        //We must also specify "where" the above part of the virtual world will be shown on the actual canvas on screen. This part of the screen where the above drawing gets pasted is called the "viewport", which we set here. The origin of the viewport is left,bottom. In this case we want it to span the entire canvas, so we start at (0,0) with a width and height of 400 each (matching the dimensions of the canvas specified in HTML)
        this.gl.viewport(0, 0, 400, 400);
        //console.log(this.cameraPath);
        //Initialize the light
        this.initLights();
    }

    private initLights(): void {
        this.lights = [];
        //This global light may not be used

        let l: Light = new Light();
        l.setAmbient([0.8, 0.8, 0.8]);
        l.setDiffuse([0.8, 0.8, 0.8]);
        l.setSpecular([0.8, 0.8, 0.8]);
        l.setPosition([0, 100, 0]);
        l.setSpotDirection(vec3.fromValues(0,-1,0));
        l.setSpotAngle(25);
        this.lights.push(new LightInfo(l, LightCoordinateSystem.World));

    }

    public getNumberOfLights(): number {
        return this.lights.length;
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
                    "color": [${Math.random()},${Math.random()},${Math.random()}]
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
                    "color": [${Math.random()},${Math.random()},${Math.random()}]
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
                    "color": [${Math.random()},${Math.random()},${Math.random()}]
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
                    "color": [${Math.random()},${Math.random()},${Math.random()}]
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
                "children": [${box1}, ${box2}, ${box3}, ${box4}, ${box5}, ${box6}, 
                    ${box7}, ${box8}, ${box9}, ${box10}, ${box11}, ${box12}, ${box13},
                    ${turret1}, ${turret2}, ${turret3}, ${turret4}, ${turret5}, ${turret6}, 
                    ${turret7}, ${turret8}, ${turret9}, ${turret10}, ${quadTurret1}, ${quadTurret2}, ${quadTurret3}, ${minirate1},
                    ${minirate2}, ${minirate3}, ${minirate4}, ${aeroplane}]
            }
        }
        `
    }

    public animate(s: string): void {
        //console.log(s);
        this.time += 1;
        this.maxFrame = parseInt(s.substring(0, 4));
        this.frame = (this.frame + 1) % this.maxFrame;

        //console.log(this.getCoordinatesFromLine(this.getLineFromFrame(this.frame, s)));

        //animate the world light (light[0])
        this.lights[0].light.setPosition([(20 * Math.sin(0.1 * this.time)), 0, 100, 1]);
        //Note : 
        //this.placeAeroplaneAtCoord(this.getCoordinatesFromLine(this.getLineFromFrame(this.frame, s)), this.getCoordinatesFromLine(this.getLineFromFrame((this.frame + 1), s)));

        if (this.scenegraph != null) {
            this.scenegraph.animate(this.time);
        }
        this.draw();
    }

    public draw(): void {

        this.gl.clearColor(1, 1, 1, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);

        if (this.scenegraph == null) {
            return;
        }
/*
        let i : number;
        //Note : trying to draw the light
        for (i = 0; i < this.lights.length; i++) {
            let ambientLocation: string = "light[" + i + "].ambient";
            let diffuseLocation: string = "light[" + i + "].diffuse";
            let specularLocation: string = "light[" + i + "].specular";
            this.gl.uniform3fv(this.shaderLocations.getUniformLocation(ambientLocation), this.lights[i].light.getAmbient());
            this.gl.uniform3fv(this.shaderLocations.getUniformLocation(diffuseLocation), this.lights[i].light.getDiffuse());
            this.gl.uniform3fv(this.shaderLocations.getUniformLocation(specularLocation), this.lights[i].light.getSpecular());
        }

        //send all the View-space lights to the GPU
        for (i = 0; i < this.lights.length; i++) {

            if (this.lights[i].coordinateSystem == LightCoordinateSystem.View) {
                let lightPositionLocation: string = "light[" + i + "].position";
                this.gl.uniform4fv(this.shaderLocations.getUniformLocation(lightPositionLocation), this.lights[i].light.getPosition());
            }
        }

        this.modelview.push(mat4.lookAt(mat4.create()
            , [0, 0, 80]
            , [0, 0, 0]
            , [0, 1, 0]));


        //send all the World-space lights to the GPU
        for (i = 0; i < this.lights.length; i++) {
            if (this.lights[i].coordinateSystem == LightCoordinateSystem.World) {
                let lightPositionLocation: string = "light[" + i + "].position";
                let result: vec4 = vec4.create();
                vec4.transformMat4(result, this.lights[i].light.getPosition(), this.modelview.peek());
                this.gl.uniform4fv(this.shaderLocations.getUniformLocation(lightPositionLocation), result);
                console.log(this.lights[0]);
                //console.log(this.shaderLocations.getUniformLocation(lightPositionLocation));
            }
        }
        

        //the normal matrix = inverse transpose of modelview
            let normalMatrix: mat4 = mat4.clone(this.modelview.peek());
            mat4.transpose(normalMatrix, normalMatrix);
            mat4.invert(normalMatrix, normalMatrix);

            this.gl.uniformMatrix4fv(this.shaderLocations.getUniformLocation("normalmatrix"), false, normalMatrix);
*/        



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
        else if (this.viewType == 3) {
            //TODO : should modify this method
            mat4.lookAt(this.modelview.peek()
                , vec3.fromValues(0, 0, -0.5)
                , vec3.fromValues(0, 0, 0)
                , vec3.fromValues(this.getCoordinatesFromLine(this.getLineFromFrame(this.time, this.data))[3],
                    this.getCoordinatesFromLine(this.getLineFromFrame(this.time, this.data))[4],
                    this.getCoordinatesFromLine(this.getLineFromFrame(this.time, this.data))[5]));
            //console.log(this.getCoordinatesFromLine(this.getLineFromFrame(this.time,this.data)));

            let aeroPlaneInverse: mat4 = mat4.create();
            //TODO : here to deal with lookAt
            //mat4.invert(aeroPlaneInverse, this.scenegraph.getNodes().get("aeroplane").getAnimationTransform());
            mat4.multiply(this.modelview.peek(), this.modelview.peek(), aeroPlaneInverse);
        }
        else {
            mat4.lookAt(this.modelview.peek(), vec3.fromValues(Math.sin(this.time * 0.01) * 200, 50, -Math.cos(this.time * 0.01) * 200), vec3.fromValues(75, 0, -35), vec3.fromValues(0, 1, 0));
        }
        //console.log(this.viewType)
        //console.log(this.shaderLocations);

        this.gl.uniformMatrix4fv(this.shaderLocations.getUniformLocation("projection"), false, this.proj);

        //this.setLight(); // -> this.lights

        this.scenegraph.draw(this.modelview);
    }
/*
    private setLight() : void {
        this.lights;
        this.scenegraph.getRoot()
    }
*/

    public setData(s: string): void {
        this.data = s;
    }

    public setTPerspective(): void {
        this.viewType = 0;
    }

    public setFPerspective(): void {
        this.viewType = 1;
    }

    public setOPerspective(): void {
        this.viewType = 2;
    }
    public setAPerspective(): void {
        this.viewType = 3;
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

    /**
     * this sets up the callbacks for the button used to load a new mesh
     * @param features 
     */
    public setFeatures(features: Features): void {
        window.addEventListener("keydown", ev => features.keyPress(ev.code));
    }
    /*
            //aeroplane
            color = vec4.fromValues(1, 1, 0, 1);
            transform = mat4.create();
            mat4.rotate(transform, transform, glMatrix.toRadian(90), vec3.fromValues(1, 0, 0));
            mat4.scale(transform, transform, vec3.fromValues(10, 10, 10));
            mat4.translate(transform, transform, vec3.fromValues(0, -0.5, 0));
            mat4.rotate(transform, transform, glMatrix.toRadian(180), vec3.fromValues(0, 1, 0));
            mat4.rotate(transform,transform, glMatrix.toRadian(0), vec3.fromValues(0,0,1));
    */

   private jsonLight(): string {
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
            "color": [
              0.0,
              0.0,
              0.0
            ]
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
                "material": {
                  "color": [
                    0.0,
                    0.0,
                    0.0
                  ]
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
                  "color": [
                    0.0,
                    0.0,
                    0.0
                  ]
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
                  "color": [
                    0.0,
                    0.0,
                    0.0
                  ]
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
                  "color": [
                    0.0,
                    0.0,
                    0.0
                  ]
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
                  "color": [
                    0.0,
                    0.0,
                    0.0
                  ]
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


}