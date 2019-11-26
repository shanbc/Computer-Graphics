
import { vec3 } from "gl-matrix";
export class Ray {
    protected startPoint : vec3;
    protected direction : vec3;

    public constructor(startPoint : vec3, direction : vec3) {
        this.startPoint = startPoint;
        vec3.normalize(this.direction, direction);
        //this.direction = direction;
    }

    public getStartPoint() : vec3 {
        return this.startPoint;
    }

    public getDirection() : vec3 {
        return this.direction;
    }

}