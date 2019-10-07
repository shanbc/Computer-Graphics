import { vec3, vec4, mat4, glMatrix, vec2 } from "gl-matrix";
import * as WebGLUtils from "%COMMON/WebGLUtils"
import { Stack } from "%COMMON/Stack"

/* In this project, the main method I used is that using draw() function to recalculate the indices for different circles
  While the vertex buffer never changed because of circle are the same, the color and position and size will be decided by the
  scale(), translate() and the colorLoaction. Hence, the only thing we need to consider is which part will be represented on the screen
  by the time.
*/

export class View {
    private gl: WebGLRenderingContext;
    private shaderProgram: WebGLProgram;
    private vbo: WebGLBuffer;
    private ibo: WebGLBuffer;
    //The number of the circle indices
    private numCircleIndices: number;
    //The number of the rectangle indices
    private numRectangleIndices: number;

    private proj: mat4;
    private modelView: Stack<mat4>;
    
    private dims: vec2;

    //The outer circle radius
    private outerRadius: number;
    //The inner circle radius
    private innerRadius: number;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
        this.outerRadius = 0;
        this.innerRadius = 0;
        this.dims = vec2.fromValues(0, 0);
        this.modelView = new Stack<mat4>();
        
    }

    public setDimensions(width: number, height: number): void {
        this.dims = vec2.fromValues(width, height);
        this.outerRadius = this.dims[1] / 2 - 50;
        this.innerRadius = this.outerRadius - this.outerRadius / 20;
    }


    public init(vShaderSource: string, fShaderSource: string): void {
        //create and set up the shader
        console.log("Vertex shader source:\n" + vShaderSource);
        this.shaderProgram = WebGLUtils.createShaderProgram(this.gl, vShaderSource, fShaderSource);

        //create the data for our circle
        let vData: vec2[] = [];
        let iData: number[] = [];

        //create vertices here
        let SLICES: number = 200;

        //push the center of the circle as the first vertex
        vData.push(vec2.fromValues(0, 0));
        for (let i: number = 0; i < SLICES; i++) {
            let theta: number = (i * 2 * Math.PI / SLICES);
            vData.push(vec2.fromValues(
                Math.cos(theta), Math.sin(theta)));
        }
        //we add the last vertex to make the circle watertight
        vData.push(vec2.fromValues(1, 0));        

        //enable the current program
        this.gl.useProgram(this.shaderProgram);

        //Put the rectangle vertex data into the vData
        vData.push(vec2.fromValues(0,0));
        vData.push(vec2.fromValues(0,1));
        vData.push(vec2.fromValues(1,0));
        vData.push(vec2.fromValues(1,1));


        for (let i: number = 0; i < vData.length; i++) {
            iData.push(i);
        }


        let vertexData: Float32Array = new Float32Array(function* () {
            for (let v of vData) {
                yield v[0];
                yield v[1];
            }
        }());

        let indexData: Uint8Array = Uint8Array.from(iData);
        //Generate the number of indices for circle and rectangle
        this.numCircleIndices = indexData.length - 4;
        this.numRectangleIndices = 4;

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
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        //tell webgl to enable this vertex attribute array, so that when it draws it will use this
        this.gl.enableVertexAttribArray(positionLocation);

        //set the clear color
        this.gl.clearColor(170/255,130/255,51/255, 1);


        this.proj = mat4.ortho(mat4.create(), 0, this.dims[0], 0, this.dims[1], -1, 1);
        this.gl.viewport(0, 0, this.dims[0], this.dims[1]);

    }

    public draw(): void {
        
        //clear the window
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        let blackColor: vec4 = vec4.fromValues(0,0,0,1);
        let clockColor : vec4 = vec4.fromValues(1,1,204/255,1);
        let whiteColor: vec4 = vec4.fromValues(1,1,1,1);

        this.modelView.push(mat4.create());
        this.drawCircle(this.outerRadius, blackColor);
        this.modelView.pop();


        this.drawCircle(this.innerRadius, clockColor);
        this.modelView.pop();
        let time :number = 10;
        this.drawRectangle(blackColor, time);
        time += 1;


        this.proj = mat4.ortho(mat4.create(), 0, this.dims[0], 0, this.dims[1], -1, 1);
        this.gl.viewport(0, 0, this.dims[0], this.dims[1]);
    }

    private drawRectangle(color: vec4, time: number) : void {

        this.gl.useProgram(this.shaderProgram);
        let projectionLocation: WebGLUniformLocation = this.gl.getUniformLocation(this.shaderProgram, "proj");
        this.gl.uniformMatrix4fv(projectionLocation, false, this.proj);
        this.modelView.push(mat4.clone(this.modelView.peek()));
        mat4.translate(this.modelView.peek(), this.modelView.peek(), vec3.fromValues(this.dims[0] / 2, this.dims[1] / 2, 0));
        let rectangleWidth: number = 0;
        let rectangleHeight:number = 0;


        for(let i : number = 0; i < 60; i ++) {
            rectangleWidth = this.innerRadius / 100;
            rectangleHeight = this.innerRadius / 20;
            if(i % 5 == 0) {
                rectangleWidth = this.innerRadius / 50;
                rectangleHeight = this.innerRadius / 10;
            }
            if(i % 15 == 0) {
                rectangleWidth = this.innerRadius / 25;
                rectangleHeight = this.innerRadius / 5;
            }



            this.modelView.push(mat4.clone(this.modelView.peek()));
            mat4.rotate(this.modelView.peek(),this.modelView.peek(), glMatrix.toRadian(i * 360.0 / 60), [0,0,1]);
            
            mat4.translate(this.modelView.peek(), this.modelView.peek(), [-rectangleWidth / 2, (this.innerRadius - rectangleHeight) * 0.95,0]);
            mat4.scale(this.modelView.peek(),this.modelView.peek(), [rectangleWidth,rectangleHeight,1]);


            let modelViewLocation: WebGLUniformLocation = this.gl.getUniformLocation(this.shaderProgram, "modelView");
            this.gl.uniformMatrix4fv(modelViewLocation, false, this.modelView.peek());
            let colorLocation: WebGLUniformLocation = this.gl.getUniformLocation(this.shaderProgram, "vColor");
            this.gl.uniform4fv(colorLocation, color);
            //Draw with rectangles
            this.gl.drawElements(this.gl.TRIANGLE_STRIP, 4, this.gl.UNSIGNED_BYTE, this.numCircleIndices); 
            this.modelView.pop();


        }   
        this.modelView.pop();     
    }

    public drawCircle(r : number, color: vec4) : void {

        this.modelView.push(mat4.clone(this.modelView.peek()));;
        mat4.translate(this.modelView.peek(), this.modelView.peek(), vec3.fromValues(this.dims[0] / 2, this.dims[1] / 2, 0));
        mat4.scale(this.modelView.peek(), this.modelView.peek(), vec3.fromValues(r, r, r));
        this.gl.useProgram(this.shaderProgram);
        let projectionLocation: WebGLUniformLocation = this.gl.getUniformLocation(this.shaderProgram, "proj");
        this.gl.uniformMatrix4fv(projectionLocation, false, this.proj);
        let modelViewLocation: WebGLUniformLocation = this.gl.getUniformLocation(this.shaderProgram, "modelView");
        this.gl.uniformMatrix4fv(modelViewLocation, false, this.modelView.peek());
        let colorLocation: WebGLUniformLocation = this.gl.getUniformLocation(this.shaderProgram, "vColor");
        this.gl.uniform4fv(colorLocation, color);
        //Draw with triangle fans
        this.gl.drawElements(this.gl.TRIANGLE_FAN, this.numCircleIndices, this.gl.UNSIGNED_BYTE,0);
    }

    public animate(): void {


        this.draw();
    }
}