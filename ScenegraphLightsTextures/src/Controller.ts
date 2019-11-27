import { View } from "View"
import * as OBJ from "webgl-obj-loader";
import { vec2,mat4 } from "gl-matrix";
import { Material } from "%COMMON/Material";
import {RTView} from "./RTView";
import {vec3} from "gl-matrix";

export interface Features {
    /*mousePress(x: number, y: number): void;
    mouseRelease(x: number, y: number): void;
    mouseDragged(x: number, y: number): void;
    */
}
export class Controller implements Features {
    private view: View;
    private mousePos: vec2;
    private dragged: boolean;

    constructor(view: View) {
        this.view = view;
        this.view.setFeatures(this);
    }

    public go(): void {
        this.view.initScenegraph()
            .then(() => {
                let numLights: number = this.view.getNumLights();

                this.view.initShaders(this.getPhongVShader(), this.getPhongFShader(numLights));
                this.view.initRenderer();
                this.view.draw();
            });
    }
/*
    public mousePress(x: number, y: number): void {
        this.mousePos = vec2.fromValues(x, y);
        this.dragged = true;
    }
    public mouseRelease(x: number, y: number): void {
        let delta: vec2 = vec2.fromValues(x - this.mousePos[0], y - this.mousePos[1]);
        this.view.trackball(delta);
        this.mousePos = vec2.fromValues(x, y);
        this.dragged = false;
    }
    public mouseDragged(x: number, y: number): void {
        if (this.dragged) {
            let delta: vec2 = vec2.fromValues(x - this.mousePos[0], y - this.mousePos[1]);
            this.view.trackball(delta);
            this.mousePos = vec2.fromValues(x, y);
        }
    }
    */

    public getPhongVShader(): string {
        return `
        attribute vec4 vPosition;
        attribute vec4 vNormal;
        
        uniform mat4 projection;
        uniform mat4 modelview;
        uniform mat4 normalmatrix;
        varying vec3 fNormal;
        varying vec4 fPosition;
        
        void main()
        {
            vec3 lightVec,viewVec,reflectVec;
            vec3 normalView;
            vec3 ambient,diffuse,specular;
        
            fPosition = modelview * vPosition;
            gl_Position = projection * fPosition;
        
        
            vec4 tNormal = normalmatrix * vNormal;
            fNormal = normalize(tNormal.xyz);
        }
        
    `;
    }

    public getPhongFShader(numLights: number): string {
        return `precision mediump float;

        struct MaterialProperties
        {
            vec3 ambient;
            vec3 diffuse;
            vec3 specular;
            float shininess;
        };
        
        struct LightProperties
        {
            vec3 ambient;
            vec3 diffuse;
            vec3 specular;
            vec4 position;
            vec4 spotDirection;
            float spotCutoff;
        };
        
        
        varying vec3 fNormal;
        varying vec4 fPosition;

        
        
        
        uniform MaterialProperties material;
        uniform LightProperties light[`+ numLights + `];
        
        
        void main()
        {
            vec3 lightVec,viewVec,reflectVec;
            vec3 normalView;
            vec3 ambient,diffuse,specular;
            float nDotL,rDotV;
            vec4 result;
        
        
            result = vec4(0,0,0,1);
        `
            + `for (int i=0;i<` + numLights + `;i++)
            {
                if (light[i].position.w!=0.0)
                    lightVec = normalize(light[i].position.xyz - fPosition.xyz);
                else
                    lightVec = normalize(-light[i].position.xyz);
        
                vec3 tNormal = fNormal;
                normalView = normalize(tNormal.xyz);
                nDotL = dot(normalView,lightVec);
        
                viewVec = -fPosition.xyz;
                viewVec = normalize(viewVec);
        
                reflectVec = reflect(-lightVec,normalView);
                reflectVec = normalize(reflectVec);
        
                rDotV = max(dot(reflectVec,viewVec),0.0);
        
                vec3 spotDirection = normalize(light[i].spotDirection.xyz);
                
                if (dot(spotDirection,-lightVec)>light[i].spotCutoff) {
                    ambient = material.ambient * light[i].ambient;
                    diffuse = material.diffuse * light[i].diffuse * max(nDotL,0.0);
                    if (nDotL>0.0)
                        specular = material.specular * light[i].specular * pow(rDotV,material.shininess);
                    else
                        specular = vec3(0,0,0);
                    result = result + vec4(ambient+diffuse+specular,1.0);  
                }  
            }
            gl_FragColor = result;
        }
        
    `;
    }



}