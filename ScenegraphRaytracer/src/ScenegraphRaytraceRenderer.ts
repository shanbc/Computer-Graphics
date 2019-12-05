import { IVertexData } from "%COMMON/IVertexData";
import { Mesh } from "%COMMON/PolygonMesh"
import { SGNode } from "SGNode";
import { Stack } from "%COMMON/Stack";
import { mat4, vec4, glMatrix, vec3 } from "gl-matrix";
import { Material } from "%COMMON/Material";
import { Light } from "%COMMON/Light";
import { ScenegraphRenderer } from "./ScenegraphRenderer";
import { Scenegraph } from "./Scenegraph";
import { RTTextureObject } from "./RTTextureObject";
import { Ray } from "./Ray";
import { HitRecord } from "./HitRecord";

/**
 * This is a scene graph renderer implementation that works as a ray tracer.
 * @author Amit Shesh
 */
export class ScenegraphRaytraceRenderer implements ScenegraphRenderer {
    protected textures: Map<string, RTTextureObject>;
    private scenegraph: Scenegraph<IVertexData>;
    private imageData: number[];
    private width: number;
    private height: number;
    private FOV: number;
    private background: vec4;


    public constructor(width: number, height: number, FOV: number, background: vec4) {
        this.textures = new Map<string, RTTextureObject>();
        this.width = width;
        this.height = height;
        this.FOV = FOV;
        this.background = background;
        this.imageData = [];
        for (let i: number = 0; i < 4 * width * height; i++) {
            this.imageData.push(1);
        }
    }

    public setScenegraph(scenegraph: Scenegraph<IVertexData>): Promise<void> {
        return new Promise<void>((resolve) => {
            this.scenegraph = scenegraph;
            let promises: Promise<void>[] = [];
            scenegraph.getTextures().forEach((url: string, name: string, map: Map<string, string>) => {
                promises.push(this.addTexture(name, url));
            });

            Promise.all(promises).then(() => resolve());
        })

    }

    public getImage(): number[] {
        return this.imageData;
    }


    public addMesh<K extends IVertexData>(meshName: string, mesh: Mesh.PolygonMesh<K>): void {
        throw new Error("Operation not supported");
    }

    public addTexture(name: string, path: string): Promise<void> {
        let image: RTTextureObject;
        image = new RTTextureObject(name);
        return image.init(path)
            .then(() => {
                this.textures.set(name, image);
            });
    }

    /**
     * Begin rendering of the scene graph from the root
     * @param root
     * @param modelView
     */
    public draw(modelView: Stack<mat4>): Promise<void> {
        return new Promise<void>((resolve) => {
            let root: SGNode = this.scenegraph.getRoot();
            let lights: Light[] = root.getLights(modelView);
            let rayView: Ray = new Ray();


            rayView.start = vec4.fromValues(0, 0, 0, 1);
            for (let i: number = 0; i < this.height; i++) {
                for (let j = 0; j < this.width; j++) {
                    /*
                     create ray in view coordinates
                     start point: 0,0,0 always!
                     going through near plane pixel (i,j)
                     So 3D location of that pixel in view coordinates is
                     x = j-width/2
                     y = i-height/2
                     z = -0.5*height/tan(FOV/2)
                    */
                    if (i == this.height / 2 && j == this.width / 2) {
                        console.log("here");
                        console.log("here too");
                    }
                    rayView.direction = vec4.fromValues(j - 0.5 * this.width,
                        i - 0.5 * this.height,
                        -0.5 * this.height / Math.tan(glMatrix.toRadian(0.5 * this.FOV)),
                        0.0);

                    let hitR: HitRecord;
                    hitR = this.raycast(rayView, root, modelView);
                    let color: vec4 = this.getRaytracedColor(hitR, lights, modelView,rayView);
                    for (let k: number = 0; k < 3; k++) {
                        this.imageData[4 * (i * this.width + j) + k] = color[k];
                    }
                    //   console.log("x:" + j + ",y:" + i);
                }
            }
            resolve();
        });
    }

    private raycast(rayView: Ray, root: SGNode, modelview: Stack<mat4>): HitRecord {
            return root.intersect(rayView, modelview);
    }

    private getRaytracedColor(hitRecord: HitRecord, lights: Light[], modelview: Stack<mat4>, rayView : Ray): vec4 {
        if (hitRecord.intersected()) {
            return this.shade(hitRecord.point, hitRecord.normal, hitRecord.material, hitRecord.textureName, hitRecord.texcoord, lights, modelview, rayView);
        }
        else {
            return this.background;
        }
    }

    private shade(point: vec4, normal: vec4, material: Material,
        textureName: string, texcoord: vec4, lights: Light[], modelview: Stack<mat4>, rayView : Ray): vec4 {
        let color: vec3 = vec3.fromValues(0, 0, 0);
        let shadowRay: Ray = new Ray();
        let inShadow : boolean = false;
        let textureObject : RTTextureObject = this.textures.get(textureName);
        let texColor : vec4 = vec4.fromValues(255,255,255,1);
        if(textureName != "white") {
            texColor = textureObject.getColor(texcoord[0], texcoord[1]);
            //console.log(textureName);
        }

        lights.forEach((light: Light) => {
            inShadow = false;
            let lightVec: vec4;
            let spotdirection: vec4 = light.getSpotDirection();
            spotdirection[3] = 0;
            

            if (vec4.length(spotdirection) > 0) {
                spotdirection = vec4.normalize(spotdirection, spotdirection);
            }

            if (light.getPosition()[3] != 0) {
                lightVec = vec4.subtract(vec4.create(), light.getPosition(), point);
            }
            else {
                lightVec = vec4.negate(vec4.create(), light.getPosition());
            }
            lightVec[3] = 0;
            vec4.normalize(lightVec, lightVec);

            //Set shadow ray at point
            shadowRay.start = point;

            shadowRay.start[1] += 1;

            //Point it towards the light
            vec4.subtract(shadowRay.direction, light.getPosition(), point);

            //vec4.normalize(shadowRay.direction, shadowRay.direction);
            //vec4.inverse(shadowRay.direction, light.getSpotDirection());

            let fudgeVec : vec4 = vec4.create();

            fudgeVec[0] = Math.random() * 1;
            fudgeVec[1] = Math.random() * 1;
            fudgeVec[2] = Math.random() * 1;

            vec4.subtract(shadowRay.direction, shadowRay.direction, fudgeVec);

            let hitR: HitRecord = this.raycast(shadowRay, this.scenegraph.getRoot(), modelview);

            //TODO:
            inShadow = hitR.intersected();

            /* if point is not in the light cone of this light, move on to next light */
            if ((vec4.dot(vec4.negate(vec4.create(), lightVec), spotdirection) > Math.cos(glMatrix.toRadian(light.getSpotCutoff())))
            && !inShadow) {

                let normalView: vec4 = vec4.normalize(vec4.create(), normal);

                let nDotL: number = vec4.dot(normalView, lightVec);

                let viewVec: vec4 = vec4.negate(vec4.create(), point);
                viewVec[3] = 0;
                vec4.normalize(viewVec, viewVec);

                let reflectVec: vec4 = vec4.subtract(vec4.create(), vec4.scale(vec4.create(), normalView, 2 * nDotL), lightVec);
                reflectVec[3] = 0;
                vec4.normalize(reflectVec, reflectVec);

                let rDotV = Math.max(vec4.dot(reflectVec, viewVec), 0.0);

                let ambient: vec3 = vec3.mul(vec3.create(), material.getAmbient(), light.getAmbient());

                let diffuse: vec3 =
                    vec3.scale(vec3.create(),
                        vec3.mul(vec3.create(), material.getDiffuse(), light.getDiffuse()),
                        Math.max(nDotL, 0));
                let specular: vec3;
                if (nDotL > 0) {
                    specular = vec3.scale(vec3.create(),
                        vec3.mul(vec3.create(), material.getSpecular(), light.getSpecular()),
                        Math.pow(rDotV, material.getShininess()));
                }
                else {
                    specular = vec3.create();
                }

                vec3.add(color, color, vec3.add(
                    vec3.create(), vec3.add(
                        vec3.create(), ambient,
                        diffuse),
                    specular));
            }
        });

        for (let i: number = 0; i < 3; i++) {
            color[i] = Math.max(0, Math.min(color[i], 1)); 4
        }
        vec3.multiply(color, color, vec3.fromValues(texColor[0]/255,texColor[1]/255,texColor[2]/255));


        let reflection : number = material.getReflection();
        let reflectionColor : vec4 = vec4.create();
        
        if(reflection > 0) {            
            this.raycast(rayView, this.scenegraph.getRoot(), modelview);
        }
/*
        //After this line is reflection and tranparency 
        let reflection : number = material.getReflection();
        let tranparency : number = material.getTransparency();
        let absortption : number = material.getAbsorption();
        let reflectionColor : vec4 = vec4.create();
        let tranparencyColor : vec4 = vec4.create();
        let relfectHitRecord : HitRecord = new HitRecord();
        let bounce : number = 3;
        let count : number = 0;
        let reflectRay : Ray = new Ray();
        let intersectPoint : vec4 = vec4.clone(point);
        let incomingDirection : vec4 = vec4.clone(rayView.direction);
        let reflectiveNormal : vec4 = vec4.clone(normal);
        do {
                reflectRay.start = intersectPoint;
                let reflectionDirection : vec4 =vec4.subtract(vec4.create(),incomingDirection,vec4.scale(vec4.create(),reflectiveNormal, 2 *vec4.dot(reflectiveNormal, incomingDirection))); 
                reflectRay.direction = vec4.clone(reflectionDirection);
                relfectHitRecord = this.raycast(reflectRay, this.scenegraph.getRoot(), modelview);
                intersectPoint = vec4.clone(relfectHitRecord.point);
                reflectiveNormal = vec4.clone(relfectHitRecord.normal);
                incomingDirection = vec4.clone(reflectionDirection);
                reflection = relfectHitRecord.material.getReflection();
                reflectionColor = 
                count += 1;
        }
        while(count < bounce && relfectHitRecord.intersected() && reflection > 0);
        */
            



            


        return vec4.fromValues(color[0], color[1], color[2], 1);
    }

    public dispose(): void {
    }

    /**
     * Draws a specific mesh.
     * If the mesh has been added to this renderer, it delegates to its correspond mesh renderer
     * This function first passes the material to the shader. Currently it uses the shader variable
     * "vColor" and passes it the ambient part of the material. When lighting is enabled, this 
     * method must be overriden to set the ambient, diffuse, specular, shininess etc. values to the 
     * shader
     * @param name
     * @param material
     * @param transformation
     */
    public drawMesh(meshName: string, material: Material, textureName: string, transformation: mat4): void {
        throw new Error("Operation not supported");
    }
}