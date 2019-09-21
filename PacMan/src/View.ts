import { vec3, vec4, mat4, glMatrix } from "gl-matrix";
import * as WebGLUtils from "%COMMON/WebGLUtils"


export class View {
    private gl: WebGLRenderingContext;
    private shaderProgram: WebGLShader;
    private vbo: WebGLBuffer;
    private ibo: WebGLBuffer;
    private numVertices: number;
    private numIndices: number;
    private proj: mat4;
    private modelView: mat4;
    private time: number;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
        this.time = 0;
    }


    public init(vShaderSource: string, fShaderSource: string): void {
        //create and set up the shader
        this.shaderProgram = WebGLUtils.createShaderProgram(this.gl, vShaderSource, fShaderSource);

        //create the data for our quad
        let vertexData = new Float32Array([-100, -100, 1, 0, 0,
            100, -100, 0, 1, 0,
            100, 100, 0, 0, 1,
        -100, 100, 1, 1, 1]);
        let indexData = new Uint8Array([0, 1, 2, 0, 2, 3]);
        this.numVertices = vertexData.length / 2;
        this.numIndices = indexData.length;
        //enable the current program
        this.gl.useProgram(this.shaderProgram);



        //create a vertex buffer object
        this.vbo = this.gl.createBuffer();
        //bind the buffer to GL_ARRAY_BUFFER
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
        //copy over the vertex data
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexData, this.gl.STATIC_DRAW);

        //create a vertex buffer object for indices
        this.ibo = this.gl.createBuffer();
        //bind the buffer to GL_INDEX_BUFFER
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
        //copy over the index data
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indexData, this.gl.STATIC_DRAW);


        //get the location of the vPosition attribute in the shader program
        let positionLocation: number = this.gl.getAttribLocation(this.shaderProgram, "vPosition");

        //tell webgl that the position attribute can be found as 2-floats-per-vertex with a gap of 20 bytes 
        //(2 floats per position, 3 floats per color = 5 floats = 20 bytes
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 20, 0);
        //tell webgl to enable this vertex attribute array, so that when it draws it will use this
        this.gl.enableVertexAttribArray(positionLocation);

        let colorLocation: number = this.gl.getAttribLocation(this.shaderProgram, "vColor");

        //tell webgl that the position attribute can be found as 3-floats-per-color with a gap of 20 bytes 
        //(2 floats per position, 3 floats per color = 5 floats = 20 bytes
        //since the array specifies position and then color, start reading with an offset of 8 bytes (the 2 floats for the first vertex)
        this.gl.vertexAttribPointer(colorLocation, 3, this.gl.FLOAT, true, 20, 8);
        //tell webgl to enable this vertex attribute array, so that when it draws it will use this
        this.gl.enableVertexAttribArray(colorLocation);

        //set the clear color
        this.gl.clearColor(1, 1, 0, 1);


        this.proj = mat4.ortho(mat4.create(), -200, 200, -200, 200, -100, 100);
        this.gl.viewport(0, 0, 400, 400);

    }

    public draw(): void {
        //clear the window
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        //we use the current time as the angle of rotation in degrees
        this.modelView = mat4.rotate(mat4.create(), mat4.create(), glMatrix.toRadian(this.time % 360), vec3.fromValues(0, 0, 1));


        this.gl.useProgram(this.shaderProgram);

        let projectionLocation: WebGLUniformLocation = this.gl.getUniformLocation(this.shaderProgram, "proj");
        this.gl.uniformMatrix4fv(projectionLocation, false, this.proj);

        let modelViewLocation: WebGLUniformLocation = this.gl.getUniformLocation(this.shaderProgram, "modelView");
        this.gl.uniformMatrix4fv(modelViewLocation, false, this.modelView);
        this.gl.drawElements(this.gl.TRIANGLES, this.numIndices, this.gl.UNSIGNED_BYTE, 0);

    }

    /**
     * This function is called at every frame. See WebGLAnimation.ts for the call
     */
    public animate(): void {
        this.time += 1; //increment the angle of rotation. In general this should increment a tick
        //logic to prevent overflow
        if (this.time == Number.MAX_SAFE_INTEGER) {
            this.time = 0;
        }
        //draw the frame now
        this.draw();
    }

}