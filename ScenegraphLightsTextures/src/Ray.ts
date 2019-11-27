
import { vec3 } from "gl-matrix";
export class Ray {
    protected startPoint : vec3 = vec3.create();
    protected direction : vec3 = vec3.create();

    public constructor(startPoint : vec3, direction : vec3) {
        this.startPoint = startPoint;
        this.direction = direction;
    }

    public getStartPoint() : vec3 {
        return this.startPoint;
    }

    public getDirection() : vec3 {
        return this.direction;
    }

}