import { mat4, vec4 } from "gl-matrix"

export enum CameraMode { Global, FirstPerson };
export class MeshProperties {
    private transform: mat4;
    private animationTransform: mat4;
    private color: vec4;
    private type: string;



    constructor(type: string, color: vec4, transform: mat4, animationTransform: mat4) {
        this.type = type;
        this.color = color;

        this.transform = transform;
        this.animationTransform = animationTransform;
    }

    setColor(color: vec4): void {
        this.color = color;
    }

    setTransform(transform: mat4): void {
        this.transform = transform;
    }

    setAnimationTransform(anim: mat4): void {
        this.animationTransform = anim;
    }

    getTransform(): mat4 {
        return this.transform;
    }

    getAnimationTransform(): mat4 {
        return this.animationTransform;
    }

    getColor(): vec4 {
        return this.color;
    }

    getType(): string {
        return this.type;
    }
}
