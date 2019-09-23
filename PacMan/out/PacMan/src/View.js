define(["require", "exports", "gl-matrix", "%COMMON/WebGLUtils"], function (require, exports, gl_matrix_1, WebGLUtils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class View {
        constructor(gl) {
            this.gl = gl;
            this.center = gl_matrix_1.vec2.fromValues(250, 100);
            this.motion = gl_matrix_1.vec2.fromValues(4, 4);
            this.radius = 50;
            this.dims = gl_matrix_1.vec2.fromValues(0, 0);
            //Initial the mouth angle as 0 and the max angle is 40
            this.mouthAngle = 0;
            this.maxMouthAngle = 40;
        }
        setDimensions(width, height) {
            this.dims = gl_matrix_1.vec2.fromValues(width, height);
        }
        init(vShaderSource, fShaderSource) {
            //create and set up the shader
            console.log("Vertex shader source:\n" + vShaderSource);
            this.shaderProgram = WebGLUtils.createShaderProgram(this.gl, vShaderSource, fShaderSource);
            //create the data for our circle
            let vData = [];
            let iData = [];
            //create vertices here
            let SLICES = 180;
            //push the center of the circle as the first vertex
            vData.push(gl_matrix_1.vec2.fromValues(0, 0));
            for (let i = 0; i < SLICES; i++) {
                let theta = (i * 2 * Math.PI / SLICES);
                vData.push(gl_matrix_1.vec2.fromValues(Math.cos(theta), Math.sin(theta)));
            }
            //we add the last vertex to make the circle watertight
            vData.push(gl_matrix_1.vec2.fromValues(1, 0));
            /*
            Now we create the indices that will form the pizza slices of the
            circle. Think about what mode you will use, and accordingly push the
            indices
            */
            /* we will use a TRIANGLE_FAN, because this seems tailormade for
            what we want to do here. This mode will use the indices in order
            (0,1,2), (0,2,3), (0,3,4), ..., (0,n-1,n)
            */
            for (let i = 0; i < vData.length; i++) {
                iData.push(i);
            }
            //enable the current program
            this.gl.useProgram(this.shaderProgram);
            let vertexData = new Float32Array(function* () {
                for (let v of vData) {
                    yield v[0];
                    yield v[1];
                }
            }());
            let indexData = Uint8Array.from(iData);
            this.numVertices = vertexData.length / 2;
            this.numIndices = indexData.length;
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
            let positionLocation = this.gl.getAttribLocation(this.shaderProgram, "vPosition");
            //tell webgl that the position attribute can be found as 2-floats-per-vertex with a gap of 20 bytes 
            //(2 floats per position, 3 floats per color = 5 floats = 20 bytes
            this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
            //tell webgl to enable this vertex attribute array, so that when it draws it will use this
            this.gl.enableVertexAttribArray(positionLocation);
            //set the clear color
            this.gl.clearColor(1, 1, 0, 1);
            this.proj = gl_matrix_1.mat4.ortho(gl_matrix_1.mat4.create(), 0, this.dims[0], 0, this.dims[1], -1, 1);
            this.gl.viewport(0, 0, this.dims[0], this.dims[1]);
        }
        draw() {
            //clear the window
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.drawPacManCircle();
            let color = gl_matrix_1.vec4.create();
            color[0] = 1;
            color[1] = 1;
            color[2] = 1;
            let colorLocation = this.gl.getUniformLocation(this.shaderProgram, "vColor");
            this.gl.uniform4fv(colorLocation, color);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([0, 0, 100, 100, 0, 100]), this.gl.STATIC_DRAW);
            this.gl.drawElements(this.gl.TRIANGLES, 3, this.gl.UNSIGNED_BYTE, 0);
        }
        drawPacManCircle() {
            //Set the color of the circle
            let color = gl_matrix_1.vec4.create();
            color[0] = 1;
            color[1] = 0;
            color[2] = 1;
            this.modelView = gl_matrix_1.mat4.create();
            gl_matrix_1.mat4.translate(this.modelView, this.modelView, gl_matrix_1.vec3.fromValues(this.dims[0] / 4, this.dims[1] / 2, 0));
            gl_matrix_1.mat4.scale(this.modelView, this.modelView, gl_matrix_1.vec3.fromValues(this.radius, this.radius, this.radius));
            this.gl.useProgram(this.shaderProgram);
            let projectionLocation = this.gl.getUniformLocation(this.shaderProgram, "proj");
            this.gl.uniformMatrix4fv(projectionLocation, false, this.proj);
            let modelViewLocation = this.gl.getUniformLocation(this.shaderProgram, "modelView");
            this.gl.uniformMatrix4fv(modelViewLocation, false, this.modelView);
            let colorLocation = this.gl.getUniformLocation(this.shaderProgram, "vColor");
            this.gl.uniform4fv(colorLocation, color);
            //Draw with triangle fans
            this.gl.drawElements(this.gl.TRIANGLE_FAN, this.numIndices, this.gl.UNSIGNED_BYTE, 0);
        }
        animate() {
            this.draw();
        }
    }
    exports.View = View;
});
//# sourceMappingURL=View.js.map