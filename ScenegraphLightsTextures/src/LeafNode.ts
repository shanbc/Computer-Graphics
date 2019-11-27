import { SGNode } from "./SGNode"
import { Scenegraph } from "./Scenegraph";
import { Material } from "%COMMON/Material";
import { Stack } from "%COMMON/Stack";
import { ScenegraphRenderer } from "./ScenegraphRenderer";
import { vec4, mat4 , vec3} from "gl-matrix";
import { IVertexData } from "%COMMON/IVertexData";
import { HitRecord } from "./HitRecord";
import {Ray} from "./Ray";

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

    public calculateHitInfo(ray : Ray, modelview : Stack<mat4>, hitRecord : HitRecord) : void{
        if (this.meshName.length > 0) {
            if(this.meshName == "sphere") {
                this.calculateHitInfoSphere(ray, modelview, hitRecord);
            }
            if(this.meshName == "box") {
                this.calculateHitInfoBox(ray, modelview, hitRecord);
            }
        }
    }

    public calculateHitInfoSphere(ray : Ray, modelview : Stack<mat4>, hitRecord : HitRecord) : void{
        //console.log(ray.getDirection()[0], ray.getDirection()[1], ray.getDirection()[2]);
        let transformation : mat4 = modelview.peek();
        //console.log(ray.getDirection());
        let rayPos : vec4= vec4.fromValues(ray.getStartPoint()[0],ray.getStartPoint()[1],ray.getStartPoint()[2], 1);
        let rayDir : vec4 = vec4.fromValues(ray.getDirection()[0],ray.getDirection()[1],ray.getDirection()[2], 1);
        let translation  : vec3 = vec3.create();
        mat4.getTranslation(translation,transformation);
        vec4.transformMat4(rayPos, rayPos, transformation);
        //vec4.transformMat4(rayDir, rayDir, transformation);
        //console.log(rayDir[0], rayDir[1],rayDir[2], rayDir[3]);
        //console.log(rayPos[0], rayPos[1],rayPos[2], rayPos[3]);
        let scale : vec3 = vec3.create();
        mat4.getScaling(scale, transformation);
        //console.log(scale);
        let v : vec4 = rayDir;
        let s : vec4 = rayPos;
        let v_x : number = v[0];
        let v_y : number = v[1];
        let v_z : number = v[2];
        let s_x : number = s[0];
        let s_y : number = s[1];
        let s_z : number = s[2];
        let r : number = scale[0];
        let A : number = Math.pow(v_x, 2) + Math.pow(v_y , 2) + Math.pow(v_z, 2);
        let B : number = 2 * (v_x* (s_x - r) + v_y * (s_y - r)+ v_z * (s_z - r));
        let C : number = Math.pow(s_x, 2) + Math.pow(s_y , 2) + Math.pow(s_z, 2) - Math.pow(r, 2);
        //console.log(A,B,C);

        let currentShortestTime : number = Infinity;
        let t1 : number = (-B + Math.sqrt(Math.pow(B, 2) - 4 * A * C)) / (2 * A);
        let t2 : number = (-B - Math.sqrt(Math.pow(B, 2) - 4 * A * C)) / (2 * A);
        //console.log((Math.pow(B, 2) - 4 * A * C));
        //console.log(t1,t2);
        if(t1 >= 0) {
            currentShortestTime = t1;
        }
        if(t2 >= 0) {
            if(t2 < t1) {
                currentShortestTime = t2;
            }
        }

        let recordShortestTime : number = hitRecord.getTime();
        if(currentShortestTime < recordShortestTime) {
            //Update everything.
            hitRecord.setTime(currentShortestTime);
            let intersection : vec4 = vec4.create();
            let distance : vec4 = vec4.create();
            vec4.scale(distance, rayDir, currentShortestTime);
            vec4.add(intersection, rayPos, distance);
            hitRecord.setIntersectionPoint(intersection);
            //console.log(translation[0],translation[1],translation[2]);
            //console.log(currentShortestTime, intersection[0],intersection[1],intersection[2])
           //console.log(hitRecord.getTime());
           //console.log(rayPos[0],rayPos[1],rayPos[2]);
        }
        //console.log(rayPos[0],rayPos[1],rayPos[2]);

    }

    public calculateHitInfoBox(ray : Ray, modelview : Stack<mat4>, hitRecord : HitRecord) : void{
        //console.log(ray.getDirection()[0], ray.getDirection()[1], ray.getDirection()[2]);
        let transformation : mat4 = modelview.peek();
        //console.log(ray.getDirection());
        let rayPos : vec4= vec4.fromValues(ray.getStartPoint()[0],ray.getStartPoint()[1],ray.getStartPoint()[2], 1);
        let rayDir : vec4 = vec4.fromValues(ray.getDirection()[0],ray.getDirection()[1],ray.getDirection()[2], 1);
        let translation  : vec3 = vec3.create();
        mat4.getTranslation(translation,transformation);
        vec4.transformMat4(rayPos, rayPos, transformation);
        //vec4.transformMat4(rayDir, rayDir, transformation);
        console.log(rayDir[0], rayDir[1],rayDir[2], rayDir[3]);
        //console.log(rayPos[0], rayPos[1],rayPos[2], rayPos[3]);
        let scale : vec3 = vec3.create();
        mat4.getScaling(scale, transformation);
        //console.log(scale);
        let v : vec4 = rayDir;
        let s : vec4 = rayPos;
        let v_x : number = v[0];
        let v_y : number = v[1];
        let v_z : number = v[2];
        let s_x : number = s[0];
        let s_y : number = s[1];
        let s_z : number = s[2];

        let txMin : number = Infinity;
        let txMax : number = Infinity;
        let tyMin : number = Infinity;
        let tyMax : number = Infinity;
        let tzMin : number = Infinity;
        let tzMax : number = Infinity;

        txMin   = (- 0.5 - s_x) / v_x;
        txMax   = (0.5 - s_x) / v_x;
        tyMin   = (- 0.5 - s_y) / v_y;
        tyMax   = (0.5 - s_y) / v_y;
        tzMin   = (- 0.5 - s_z) / v_z;
        tzMax   = (0.5 - s_z) / v_z;

        

        let time : number[] = [txMin, txMax, tyMin, tyMax, tzMin, tzMax];
        
        let currentShortestTime = Infinity;
        for(let i : number = 0; i < 6; i ++) {
            if(time[i] > 0) {
                if(time[i] < currentShortestTime) {
                    currentShortestTime = time[i];
                }
            }
            else {
                time[i] = Infinity;
            }
        }
        //console.log(time);

        let recordShortestTime : number = hitRecord.getTime();
        if(currentShortestTime < recordShortestTime) {
            //Update everything.
            hitRecord.setTime(currentShortestTime);
            let intersection : vec4 = vec4.create();
            let distance : vec4 = vec4.create();
            vec4.scale(distance, rayDir, currentShortestTime);
            vec4.add(intersection, rayPos, distance);
            hitRecord.setIntersectionPoint(intersection);
            //console.log(translation[0],translation[1],translation[2]);
            //console.log(currentShortestTime, intersection[0],intersection[1],intersection[2])
           //console.log(hitRecord.getTime());
           //console.log(rayPos[0],rayPos[1],rayPos[2]);
        }
    }


}