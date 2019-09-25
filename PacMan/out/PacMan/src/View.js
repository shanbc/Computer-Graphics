define(["require", "exports", "gl-matrix", "%COMMON/WebGLUtils"], function (require, exports, gl_matrix_1, WebGLUtils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class View {
        constructor(gl) {
            this.gl = gl;
            this.radius = 50;
            this.dims = gl_matrix_1.vec2.fromValues(0, 0);
            //Initial the mouth angle as 0 and the max angle is 40
            this.mouthAngle = 0;
            this.mouthAngleSpeed = 1;
            //Set the initial rate to be 1 / 360 angle, which will take up 2 pieces of triangles
            //Initially show full ring and disapper at the start
            this.disappearRate = -1;
            this.currentDisapperAngle = 360;
            this.ringState = -1;
        }
        setDimensions(width, height) {
            this.dims = gl_matrix_1.vec2.fromValues(width, height);
            this.radius = this.dims[1] / 8;
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
            //this.drawPacManCircle();
            if (this.mouthAngle < 0 || this.mouthAngle > 40) {
                this.mouthAngleSpeed = -this.mouthAngleSpeed;
            }
            this.mouthAngle += this.mouthAngleSpeed;
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
            iData.push(0);
            for (let i = this.mouthAngle / 2; i < vData.length - this.mouthAngle / 2; i++) {
                iData.push(i);
            }
            let indexData = Uint8Array.from(iData);
            this.numIndices = indexData.length;
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indexData, this.gl.STATIC_DRAW);
            this.drawPacManCircle();
            let iData2 = [];
            let iData3 = [];
            //After finish the drawing of pacman, start calculating another index for big circles of ring
            if (this.ringState == 1) {
                //If the ring state is disappering, then reduce the indices per frame
                //but remember pushing 0 point always.
                iData2.push(0);
                for (let i = this.currentDisapperAngle / 2; i < vData.length; i++) {
                    iData2.push(i);
                }
                indexData = Uint8Array.from(iData2);
            }
            if (this.ringState == -1) {
                for (let i = 0; i < vData.length - this.currentDisapperAngle / 2; i++) {
                    iData3.push(i);
                }
                iData3.push(vData.length);
                indexData = Uint8Array.from(iData3);
            }
            if (this.currentDisapperAngle < 0 || this.currentDisapperAngle > 360) {
                this.disappearRate = -this.disappearRate;
                this.ringState = -this.ringState;
            }
            this.currentDisapperAngle += this.disappearRate;
            this.numIndices = indexData.length;
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indexData, this.gl.STATIC_DRAW);
            this.drawLargeCircle();
            for (let i = 0; i < vData.length; i++) {
                iData.push(i);
            }
            indexData = Uint8Array.from(iData);
            this.numIndices = indexData.length;
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indexData, this.gl.STATIC_DRAW);
            this.drawSmallCircle();
            this.proj = gl_matrix_1.mat4.ortho(gl_matrix_1.mat4.create(), 0, this.dims[0], 0, this.dims[1], -1, 1);
            this.gl.viewport(0, 0, this.dims[0], this.dims[1]);
        }
        drawSmallCircle() {
            //Set the color of the circle
            let color = gl_matrix_1.vec4.create();
            color[0] = 1; //this.a %  2;
            color[1] = 1; //this.a %  2;
            color[2] = 0; //this.a %  2;
            this.modelView = gl_matrix_1.mat4.create();
            gl_matrix_1.mat4.translate(this.modelView, this.modelView, gl_matrix_1.vec3.fromValues(this.dims[0] * 3 / 4, this.dims[1] / 2, 0));
            gl_matrix_1.mat4.scale(this.modelView, this.modelView, gl_matrix_1.vec3.fromValues(this.radius / 2, this.radius / 2, this.radius / 2));
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
        drawLargeCircle() {
            //Set the color of the circle
            let color = gl_matrix_1.vec4.create();
            color[0] = 1; //this.a %  2;
            color[1] = 1; //this.a %  2;
            color[2] = 1; //this.a %  2;
            this.modelView = gl_matrix_1.mat4.create();
            gl_matrix_1.mat4.translate(this.modelView, this.modelView, gl_matrix_1.vec3.fromValues(this.dims[0] * 3 / 4, this.dims[1] / 2, 0));
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
        drawPacManCircle() {
            //Set the color of the circle
            let color = gl_matrix_1.vec4.create();
            color[0] = 1; //this.a %  2;
            color[1] = 0; //this.a %  2;
            color[2] = 1; //this.a %  2;
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