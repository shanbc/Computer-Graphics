import { View } from "./View"
import * as WebGLUtils from "%COMMON/WebGLUtils"

/**
 * These two global variables count the number of frames since the last count start, and the time 
 * at which the last count was started
 */
var numFrames: number = 0;
var lastTime: number = -1;

function main(): void {
    console.log("Here I am");
    //retrieve <canvas> element
    var canvas: HTMLCanvasElement = <HTMLCanvasElement>document.querySelector("#glCanvas");
    if (!canvas) {
        console.log("Failed to retrieve the <canvas> element");
        return;
    }

    //get the rendering context for webgl
    let gl: WebGLRenderingContext = WebGLUtils.setupWebGL(canvas, { 'antialias': false, 'alpha': false, 'depth': false, 'stencil': false });

    // Only continue if WebGL is available and working
    if (gl == null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }


    let view: View = new View(gl);

    let vShaderSource: string;
    let fShaderSource: string;

    vShaderSource = getVShader();

    fShaderSource = getFShader();



    view.init(vShaderSource, fShaderSource);

    //set up animation callback function

    //first we write the function that will be called at every tick
    var tick = function () {
        if (lastTime == -1) {
            lastTime = new Date().getTime();
        }
        numFrames = numFrames + 1; //increment the frame number
        if (numFrames >= 100) { //if we have counted 100 frames, find out time taken
            let currentTime: number = new Date().getTime();
            let frameRate: number = 1000 * numFrames / (currentTime - lastTime);
            lastTime = currentTime;
            //now display the frame rate
            document.getElementById('frameratedisplay').innerHTML = "Frame rate: " + frameRate.toFixed(1);
            //reset the counter
            numFrames = 0;
        }
        //call the animate function of the view. 
        view.animate();

        // this line sets up the animation (i.e. this sets up the auto-loop of repeatedly calling 
        // tick)
        requestAnimationFrame(tick);
    };

    //call tick the first time
    tick();

}


function init(gl: WebGLRenderingContext) {

}

function draw(gl: WebGLRenderingContext) {

}

function getVShader(): string {
    return `attribute vec4 vPosition;
    attribute vec4 vColor;
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

function getFShader(): string {
    return `precision mediump float;
    varying vec4 outColor;

    void main()
    {
        gl_FragColor = outColor;
    }
    `;
}

main();