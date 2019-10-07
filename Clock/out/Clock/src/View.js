define(["require", "exports", "gl-matrix", "%COMMON/WebGLUtils", "%COMMON/Stack"], function (require, exports, gl_matrix_1, WebGLUtils, Stack_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /* In this project, the main method I used is that using draw() function to recalculate the indices for different circles
      While the vertex buffer never changed because of circle are the same, the color and position and size will be decided by the
      scale(), translate() and the colorLoaction. Hence, the only thing we need to consider is which part will be represented on the screen
      by the time.
    */
    class View {
        constructor(gl) {
            this.gl = gl;
            this.outerRadius = 0;
            this.innerRadius = 0;
            this.dims = gl_matrix_1.vec2.fromValues(0, 0);
            this.modelView = new Stack_1.Stack();
        }
        setDimensions(width, height) {
            this.dims = gl_matrix_1.vec2.fromValues(width, height);
            this.outerRadius = this.dims[1] / 2 - 50;
            this.innerRadius = this.outerRadius - this.outerRadius / 20;
        }
        init(vShaderSource, fShaderSource) {
            //create and set up the shader
            console.log("Vertex shader source:\n" + vShaderSource);
            this.shaderProgram = WebGLUtils.createShaderProgram(this.gl, vShaderSource, fShaderSource);
            //create the data for our circle
            let vData = [];
            let iData = [];
            //create vertices here
            let SLICES = 200;
            //push the center of the circle as the first vertex
            vData.push(gl_matrix_1.vec2.fromValues(0, 0));
            for (let i = 0; i < SLICES; i++) {
                let theta = (i * 2 * Math.PI / SLICES);
                vData.push(gl_matrix_1.vec2.fromValues(Math.cos(theta), Math.sin(theta)));
            }
            //we add the last vertex to make the circle watertight
            vData.push(gl_matrix_1.vec2.fromValues(1, 0));
            //enable the current program
            this.gl.useProgram(this.shaderProgram);
            //Put the rectangle vertex data into the vData
            vData.push(gl_matrix_1.vec2.fromValues(0, 0));
            vData.push(gl_matrix_1.vec2.fromValues(0, 1));
            vData.push(gl_matrix_1.vec2.fromValues(1, 0));
            vData.push(gl_matrix_1.vec2.fromValues(1, 1));
            for (let i = 0; i < vData.length; i++) {
                iData.push(i);
            }
            let vertexData = new Float32Array(function* () {
                for (let v of vData) {
                    yield v[0];
                    yield v[1];
                }
            }());
            let indexData = Uint8Array.from(iData);
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
            let positionLocation = this.gl.getAttribLocation(this.shaderProgram, "vPosition");
            //tell webgl that the position attribute can be found as 2-floats-per-vertex with a gap of 20 bytes 
            //(2 floats per position, 3 floats per color = 5 floats = 20 bytes
            this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
            //tell webgl to enable this vertex attribute array, so that when it draws it will use this
            this.gl.enableVertexAttribArray(positionLocation);
            //set the clear color
            this.gl.clearColor(170 / 255, 130 / 255, 51 / 255, 1);
            this.proj = gl_matrix_1.mat4.ortho(gl_matrix_1.mat4.create(), 0, this.dims[0], 0, this.dims[1], -1, 1);
            this.gl.viewport(0, 0, this.dims[0], this.dims[1]);
        }
        draw() {
            //clear the window
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            let blackColor = gl_matrix_1.vec4.fromValues(0, 0, 0, 1);
            let clockColor = gl_matrix_1.vec4.fromValues(1, 1, 204 / 255, 1);
            let whiteColor = gl_matrix_1.vec4.fromValues(1, 1, 1, 1);
            let redColor = gl_matrix_1.vec4.fromValues(1, 0, 0, 1);
            this.gl.useProgram(this.shaderProgram);
            let projectionLocation = this.gl.getUniformLocation(this.shaderProgram, "proj");
            this.gl.uniformMatrix4fv(projectionLocation, false, this.proj);
            this.modelView.push(gl_matrix_1.mat4.create());
            //All the objets should be moved from middle of the canvas
            gl_matrix_1.mat4.translate(this.modelView.peek(), this.modelView.peek(), gl_matrix_1.vec3.fromValues(this.dims[0] / 2, this.dims[1] / 2, 0));
            //Draw two circle, one bigger black at the back and one smaller at the front
            this.drawCircle(this.outerRadius, blackColor);
            this.drawCircle(this.innerRadius, clockColor);
            //Draw the markers
            this.drawMarkers(blackColor);
            //Draw the pointers
            this.drawHourHand(blackColor);
            this.drawMinHand(blackColor);
            this.drawSecHandCircle(redColor);
            this.drawSecHand(redColor);
            this.proj = gl_matrix_1.mat4.ortho(gl_matrix_1.mat4.create(), 0, this.dims[0], 0, this.dims[1], -1, 1);
            this.gl.viewport(0, 0, this.dims[0], this.dims[1]);
        }
        drawSecHand(redColor) {
            this.modelView.push(gl_matrix_1.mat4.clone(this.modelView.peek()));
            let rectangleWidth = this.innerRadius / 30;
            let rectangleHeight = this.innerRadius * 0.95;
            let date = new Date();
            let sec = date.getSeconds() + date.getMilliseconds() / 1000;
            //Create min hand
            this.modelView.push(gl_matrix_1.mat4.clone(this.modelView.peek()));
            gl_matrix_1.mat4.rotate(this.modelView.peek(), this.modelView.peek(), -gl_matrix_1.glMatrix.toRadian(sec * 360.0 / 60), [0, 0, 1]);
            gl_matrix_1.mat4.translate(this.modelView.peek(), this.modelView.peek(), [-rectangleWidth / 2, 0, 0]);
            gl_matrix_1.mat4.scale(this.modelView.peek(), this.modelView.peek(), [rectangleWidth, rectangleHeight, 1]);
            let modelViewLocation = this.gl.getUniformLocation(this.shaderProgram, "modelView");
            this.gl.uniformMatrix4fv(modelViewLocation, false, this.modelView.peek());
            let colorLocation = this.gl.getUniformLocation(this.shaderProgram, "vColor");
            this.gl.uniform4fv(colorLocation, redColor);
            this.gl.drawElements(this.gl.TRIANGLE_STRIP, 4, this.gl.UNSIGNED_BYTE, this.numCircleIndices);
            this.modelView.pop();
        }
        drawSecHandCircle(color) {
            let r = this.innerRadius / 30;
            this.modelView.push(gl_matrix_1.mat4.clone(this.modelView.peek()));
            gl_matrix_1.mat4.scale(this.modelView.peek(), this.modelView.peek(), gl_matrix_1.vec3.fromValues(r, r, r));
            let modelViewLocation = this.gl.getUniformLocation(this.shaderProgram, "modelView");
            this.gl.uniformMatrix4fv(modelViewLocation, false, this.modelView.peek());
            let colorLocation = this.gl.getUniformLocation(this.shaderProgram, "vColor");
            this.gl.uniform4fv(colorLocation, color);
            //Draw with triangle fans
            this.gl.drawElements(this.gl.TRIANGLE_FAN, this.numCircleIndices, this.gl.UNSIGNED_BYTE, 0);
            this.modelView.pop();
        }
        drawMinHand(blackColor) {
            let rectangleWidth = this.innerRadius / 15;
            let rectangleHeight = this.innerRadius * 0.8;
            let date = new Date();
            let min = date.getMinutes() + date.getSeconds() / 60;
            //Create min hand
            this.modelView.push(gl_matrix_1.mat4.clone(this.modelView.peek()));
            gl_matrix_1.mat4.rotate(this.modelView.peek(), this.modelView.peek(), -gl_matrix_1.glMatrix.toRadian(min * 360.0 / 60), [0, 0, 1]);
            gl_matrix_1.mat4.translate(this.modelView.peek(), this.modelView.peek(), [-rectangleWidth / 2, 0, 0]);
            gl_matrix_1.mat4.scale(this.modelView.peek(), this.modelView.peek(), [rectangleWidth, rectangleHeight, 1]);
            let modelViewLocation = this.gl.getUniformLocation(this.shaderProgram, "modelView");
            this.gl.uniformMatrix4fv(modelViewLocation, false, this.modelView.peek());
            let colorLocation = this.gl.getUniformLocation(this.shaderProgram, "vColor");
            this.gl.uniform4fv(colorLocation, blackColor);
            this.gl.drawElements(this.gl.TRIANGLE_STRIP, 4, this.gl.UNSIGNED_BYTE, this.numCircleIndices);
            this.modelView.pop();
        }
        drawHourHand(blackColor) {
            //Get the hour and min and sec info from date
            let date = new Date();
            let hour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
            let rectangleWidth = this.innerRadius / 15;
            let rectangleHeight = this.innerRadius / 2;
            //Create hour hand
            this.modelView.push(gl_matrix_1.mat4.clone(this.modelView.peek()));
            gl_matrix_1.mat4.rotate(this.modelView.peek(), this.modelView.peek(), -gl_matrix_1.glMatrix.toRadian(hour * 360.0 / 12), [0, 0, 1]);
            gl_matrix_1.mat4.translate(this.modelView.peek(), this.modelView.peek(), [-rectangleWidth / 2, 0, 0]);
            gl_matrix_1.mat4.scale(this.modelView.peek(), this.modelView.peek(), [rectangleWidth, rectangleHeight, 1]);
            let modelViewLocation = this.gl.getUniformLocation(this.shaderProgram, "modelView");
            this.gl.uniformMatrix4fv(modelViewLocation, false, this.modelView.peek());
            let colorLocation = this.gl.getUniformLocation(this.shaderProgram, "vColor");
            this.gl.uniform4fv(colorLocation, blackColor);
            this.gl.drawElements(this.gl.TRIANGLE_STRIP, 4, this.gl.UNSIGNED_BYTE, this.numCircleIndices);
            this.modelView.pop();
        }
        drawMarkers(color) {
            let rectangleWidth = 0;
            let rectangleHeight = 0;
            for (let i = 0; i < 60; i++) {
                rectangleWidth = this.innerRadius / 100;
                rectangleHeight = this.innerRadius / 20;
                if (i % 5 == 0) {
                    rectangleWidth = this.innerRadius / 50;
                    rectangleHeight = this.innerRadius / 10;
                }
                if (i % 15 == 0) {
                    rectangleWidth = this.innerRadius / 25;
                    rectangleHeight = this.innerRadius / 5;
                }
                this.modelView.push(gl_matrix_1.mat4.clone(this.modelView.peek()));
                gl_matrix_1.mat4.rotate(this.modelView.peek(), this.modelView.peek(), gl_matrix_1.glMatrix.toRadian(i * 360.0 / 60), [0, 0, 1]);
                gl_matrix_1.mat4.translate(this.modelView.peek(), this.modelView.peek(), [-rectangleWidth / 2, (this.innerRadius - rectangleHeight) * 0.95, 0]);
                gl_matrix_1.mat4.scale(this.modelView.peek(), this.modelView.peek(), [rectangleWidth, rectangleHeight, 1]);
                let modelViewLocation = this.gl.getUniformLocation(this.shaderProgram, "modelView");
                this.gl.uniformMatrix4fv(modelViewLocation, false, this.modelView.peek());
                let colorLocation = this.gl.getUniformLocation(this.shaderProgram, "vColor");
                this.gl.uniform4fv(colorLocation, color);
                //Draw with rectangles
                this.gl.drawElements(this.gl.TRIANGLE_STRIP, 4, this.gl.UNSIGNED_BYTE, this.numCircleIndices);
                this.modelView.pop();
            }
        }
        drawCircle(r, color) {
            this.modelView.push(gl_matrix_1.mat4.clone(this.modelView.peek()));
            ;
            gl_matrix_1.mat4.scale(this.modelView.peek(), this.modelView.peek(), gl_matrix_1.vec3.fromValues(r, r, r));
            let modelViewLocation = this.gl.getUniformLocation(this.shaderProgram, "modelView");
            this.gl.uniformMatrix4fv(modelViewLocation, false, this.modelView.peek());
            let colorLocation = this.gl.getUniformLocation(this.shaderProgram, "vColor");
            this.gl.uniform4fv(colorLocation, color);
            //Draw with triangle fans
            this.gl.drawElements(this.gl.TRIANGLE_FAN, this.numCircleIndices, this.gl.UNSIGNED_BYTE, 0);
            this.modelView.pop();
        }
        animate() {
            this.draw();
        }
    }
    exports.View = View;
});
//# sourceMappingURL=View.js.map