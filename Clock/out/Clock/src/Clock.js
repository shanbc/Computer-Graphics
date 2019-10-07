define(["require", "exports", "./View", "%COMMON/WebGLUtils"], function (require, exports, View_1, WebGLUtils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * These variables keep track of the number of frames since the last count was started, and the
     * time at which the last count was started
     */
    var numFrames = 0;
    var lastTime = -1;
    function main() {
        console.log("Here I am");
        //retrieve <canvas> element
        var canvas = document.querySelector("#glCanvas");
        if (!canvas) {
            console.log("Failed to retrieve the <canvas> element");
            return;
        }
        //make canvas span the entire browser window
        canvas.width = window.innerWidth / 2;
        canvas.height = window.innerHeight / 2;
        //now cover the case where the window is manually resized
        window.addEventListener("resize", (ev) => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            view.setDimensions(canvas.width, canvas.height);
        });
        //get the rendering context for webgl
        let gl = WebGLUtils.setupWebGL(canvas, { 'antialias': false, 'alpha': false, 'depth': false, 'stencil': false });
        // Only continue if WebGL is available and working
        if (gl == null) {
            alert("Unable to initialize WebGL. Your browser or machine may not support it.");
            return;
        }
        let view = new View_1.View(gl);
        let vShaderSource;
        let fShaderSource;
        vShaderSource = getVShader();
        fShaderSource = getFShader();
        let width = Number(canvas.getAttribute("width"));
        let height = Number(canvas.getAttribute("height"));
        view.setDimensions(width, height);
        view.init(vShaderSource, fShaderSource);
        //set up animation callback function
        var tick = function () {
            if (lastTime == -1) {
                lastTime = new Date().getTime();
            }
            numFrames = numFrames + 1;
            if (numFrames >= 100) {
                let currentTime = new Date().getTime();
                let frameRate = 1000 * numFrames / (currentTime - lastTime);
                lastTime = currentTime;
                //document.getElementById('frameratedisplay').innerHTML = "Frame rate: " + frameRate.toFixed(1);
                numFrames = 0;
            }
            view.animate();
            //this line sets up the animation
            requestAnimationFrame(tick);
        };
        //call tick the first time
        tick();
    }
    function init(gl) {
    }
    function draw(gl) {
    }
    function getVShader() {
        return `attribute vec4 vPosition;
    uniform vec4 vColor;
    uniform mat4 proj;
    uniform mat4 modelView;
    varying vec4 outColor;
    
    void main()
    {
        gl_Position = proj * modelView * vPosition;
        outColor = vColor;
    }
    `;
    }
    function getFShader() {
        return `precision mediump float;
    varying vec4 outColor;
    void main()
    {
        gl_FragColor = outColor;
    }
    `;
    }
    main();
});
//# sourceMappingURL=Clock.js.map