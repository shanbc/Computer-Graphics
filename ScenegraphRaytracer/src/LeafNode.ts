import { SGNode } from "./SGNode"
import { Scenegraph } from "./Scenegraph";
import { Material } from "%COMMON/Material";
import { Stack } from "%COMMON/Stack";
import { ScenegraphRenderer } from "./ScenegraphRenderer";
import { mat4, vec4, vec3 } from "gl-matrix";
import { IVertexData } from "%COMMON/IVertexData";
import { Ray } from "./Ray";
import { HitRecord } from "./HitRecord";

/**
 * This node represents the leaf of a scene graph. It is the only type of node that has
 * actual geometry to render.
 * @author Amit Shesh
 */

export class LeafNode extends SGNode {

    /**
      * The name of the object instance that this leaf contains. All object instances are stored
      * in the scene graph itself, so that an instance can be reused in several leaves
      */
    protected meshName: string;
    /**
     * The material associated with the object instance at this leaf
     */
    protected material: Material;

    protected textureName: string;

    public constructor(instanceOf: string, graph: Scenegraph<IVertexData>, name: string) {
        super(graph, name);
        this.meshName = instanceOf;
    }



    /*
	 *Set the material of each vertex in this object
	 */
    public setMaterial(mat: Material): void {
        this.material = mat;
    }

    /**
     * Set texture ID of the texture to be used for this leaf
     * @param name
     */
    public setTextureName(name: string): void {
        this.textureName = name;
    }

    /*
     * gets the material
     */
    public getMaterial(): Material {
        return this.material;
    }

    public clone(): SGNode {
        let newclone: SGNode = new LeafNode(this.meshName, this.scenegraph, this.name);
        newclone.setMaterial(this.getMaterial());
        return newclone;
    }


    /**
     * Delegates to the scene graph for rendering. This has two advantages:
     * <ul>
     *     <li>It keeps the leaf light.</li>
     *     <li>It abstracts the actual drawing to the specific implementation of the scene graph renderer</li>
     * </ul>
     * @param context the generic renderer context {@link sgraph.IScenegraphRenderer}
     * @param modelView the stack of modelview matrices
     * @throws IllegalArgumentException
     */
    public draw(context: ScenegraphRenderer, modelView: Stack<mat4>): void {
        if (this.meshName.length > 0) {
            context.drawMesh(this.meshName, this.material, this.textureName, modelView.peek());
        }
    }

    public intersect(rayView: Ray, modelview: Stack<mat4>): HitRecord {
        let rayObject: Ray = new Ray();
        let hitRecord: HitRecord = new HitRecord();
        let leafToView: mat4 = mat4.clone(modelview.peek());
        let viewToLeaf: mat4 = mat4.invert(mat4.create(), leafToView);
        let invTranspose: mat4 = mat4.transpose(mat4.create(), viewToLeaf);
        rayObject.start = vec4.clone(rayView.start);
        rayObject.direction = vec4.clone(rayView.direction);
        let hitPointLeafToView : vec4 = vec4.create();
        //console.log("StartPoint :" + rayObject.start);
        //console.log("Direction:" + rayObject.direction);
        


        rayObject.start = vec4.transformMat4(vec4.create(), rayObject.start, viewToLeaf);
        rayObject.direction = vec4.transformMat4(vec4.create(), rayObject.direction, viewToLeaf);

        //console.log("StartPoint :" + rayObject.start);
        //console.log("Direction:" + rayObject.direction);
        rayObject.direction[3] = 0;
        if (this.meshName == "sphere") {
            
            //    console.log("In sphere");
            let a: number;
            let b: number;
            let c: number;

            a = vec4.squaredLength(rayObject.direction);
            b = 2 * vec4.dot(rayObject.start, rayObject.direction);
            c = vec4.squaredLength(rayObject.start) - 1 - 1; //extra 1 because start has h=1

            if ((b * b - 4 * a * c) >= 0) {
                let t1: number = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
                let t2: number = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);

                let t: number;
                if (t1 >= 0) {
                    if (t2 >= 0) {
                        t = Math.min(t1, t2);
                    } else {
                        t = t1;
                    }
                } else {
                    if (t2 >= 0)
                        t = t2;
                    else
                        return new HitRecord();
                }
                //console.log("StartPoint :" + rayObject.start);
                
                //console.log("Direction :" + rayView.direction);
                //console.log("Direction :" + rayObject.direction);
                //console.log("Time:" + t);

                hitRecord.time = t;
                hitRecord.point = vec4.scaleAndAdd(hitRecord.point, rayView.start, rayView.direction, t);
                hitRecord.normal = vec4.scaleAndAdd(hitRecord.normal, rayObject.start, rayObject.direction, t);
                hitRecord.normal[3] = 0;
                hitRecord.normal = vec4.transformMat4(hitRecord.normal, hitRecord.normal, invTranspose);
                hitRecord.normal[3] = 0;
                vec4.normalize(hitRecord.normal, hitRecord.normal);

                hitRecord.material = this.material;

                hitRecord.textureName = this.textureName;
                hitPointLeafToView = vec4.scaleAndAdd(vec4.create(), rayObject.start, rayObject.direction, t);
                //vec4.transformMat4(hitPointLeafToView, hitPointLeafToView, invTranspose);
                console.log(hitPointLeafToView);
                //hitPointLeafToView = vec4.clone(hitRecord.point);
                
                let x : number = hitPointLeafToView[0];
                let y : number = hitPointLeafToView[1];
                let z : number = hitPointLeafToView[2];
                
                let latitude : number = Math.atan2(z, Math.sqrt(x*x + y * y) );
                let longtitude : number = Math.atan2(y, x);
                
                let xC : number = 0.5 + Math.atan2(z, x) / (2 * Math.PI);
                let yC : number = 0.5 - Math.asin(y) / Math.PI;
                hitRecord.texcoord[0] = xC;
                hitRecord.texcoord[1] = yC;
                //console.log(xC, yC);
            }
            else {
                return new HitRecord();
            }
        } else if (this.meshName == "box") {
            //    console.log("In box");
            let tmax: vec3 = vec3.create();
            let tmin: vec3 = vec3.create();
            hitRecord.textureName = this.textureName;

            for (let i: number = 0; i < 3; i++) {
                if (Math.abs(rayObject.direction[i]) < 0.0001) {
                    if ((rayObject.start[i] > 0.5) || (rayObject.start[i] < -0.5)) {
                        return new HitRecord();
                    }
                    else {
                        tmin[i] = Number.NEGATIVE_INFINITY;
                        tmax[i] = Number.POSITIVE_INFINITY;
                    }
                } else {
                    let t1: number = (-0.5 - rayObject.start[i]) / rayObject.direction[i];
                    let t2: number = (0.5 - rayObject.start[i]) / rayObject.direction[i];
                    tmin[i] = Math.min(t1, t2);
                    tmax[i] = Math.max(t1, t2);
                }
            }

            let minimum: number;
            let maximum: number;

            minimum = Math.max(tmin[0], Math.max(tmin[1], tmin[2]));
            maximum = Math.min(tmax[0], Math.min(tmax[1], tmax[2]));
            //console.log(minimum, maximum);


            if ((minimum > maximum) || (maximum < 0)) {
                return new HitRecord();
            }

            if (minimum > 0)
                hitRecord.time = minimum;
            else
                hitRecord.time = maximum;


            hitRecord.point = vec4.scaleAndAdd(hitRecord.point, rayView.start, rayView.direction, hitRecord.time);

            let pointInLeaf: vec4 = vec4.scaleAndAdd(vec4.create(), rayObject.start, rayObject.direction, hitRecord.time);

            for (let i: number = 0; i < 3; i++) {
                if (Math.abs(pointInLeaf[i] - 0.5) < 0.001) {
                    hitRecord.normal[i] = 1;
                } else if (Math.abs(pointInLeaf[i] + 0.5) < 0.001) {
                    hitRecord.normal[i] = -1;
                } else hitRecord.normal[i] = 0;
            }
            let x :number = pointInLeaf[0];
            let y : number = pointInLeaf[1];
            let z : number = pointInLeaf[2];
            let xC : number = 0;
            let yC : number = 0;
            if((Math.abs(x) -0.5)< 0.001) {
                xC = (z + 0.5) / 2;
                yC = (y + 0.5) / 2;
            } 
            else if(Math.abs(y) - 0.5 < 0.001) {
                xC = (x + 0.5) / 2;
                yC = (z + 0.5) / 2;
            }
            else {
                xC = (x + 0.5) / 2;
                yC = (y + 0.5) / 2;
            }
            hitRecord.texcoord[0] = xC;
            hitRecord.texcoord[1] = yC;

            hitRecord.normal[3] = 0;
            vec4.normalize(hitRecord.normal, hitRecord.normal);
            hitRecord.normal = vec4.transformMat4(hitRecord.normal, hitRecord.normal, invTranspose);
            hitRecord.normal[3] = 0;
            vec4.normalize(hitRecord.normal, hitRecord.normal);

            hitRecord.material = this.material;
        }
        else {
            return new HitRecord();
        }


        return hitRecord;
    }

}