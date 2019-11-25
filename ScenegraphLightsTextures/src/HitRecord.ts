import { vec2, vec3 } from "gl-matrix";
import { Material } from "%COMMON/Material";

export class HitRecord {
    protected t : number;
    protected intersectionPoint : vec3;
    protected normal : vec3;
    protected materials : Material;
    protected textCoord : vec2;
    protected textureName : string;

    public constructor(t : number) {//, intersection : vec3, normal : vec3, materials : Material, textCoord : vec2, textureName : string) {
        this.t = t;
        /*
        this.intersectionPoint = intersection;
        this.normal = normal;
        this.materials = materials;
        this.textCoord = textCoord;
        this.textureName = textureName;
        */
    }

    public setIntersectionPoint(intersection : vec3) : void {
        this.intersectionPoint = intersection;
    }

    public setNormal( normal : vec3) : void {
        this.intersectionPoint = normal;
    }

    public setMaterials(materials : Material): void {
        this.materials = materials;
    }
    
    public getTime() : number {
        return this.t;
    }

}