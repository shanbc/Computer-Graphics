/**
 * This interface represents the model
 */
export interface ModelInterface {
}

export class ObjModel implements ModelInterface {

    constructor() {
    }


    //get the vertex shader code
    public getVShader(): string {
        return `attribute vec4 vPosition;
    uniform vec4 vColor;
    uniform mat4 proj;
    uniform mat4 modelview;
    varying vec4 outColor;
    
    void main()
    {
        gl_Position = proj * modelview * vPosition;
        outColor = vColor;
    }
    `;
    }

    //get the fragment shader code
    public getFShader(): string {
        return `precision mediump float;
    varying vec4 outColor;

    void main()
    {
        gl_FragColor = outColor;
    }
    `;
    }
}