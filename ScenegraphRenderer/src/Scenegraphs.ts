import { View } from "./View"
import * as WebGLUtils from "%COMMON/WebGLUtils"
import { Controller } from "./Controller";
import { ObjImporter } from "%COMMON/ObjImporter";
import { VertexPNTProducer, VertexPNT } from "./VertexPNT";
import { Mesh } from "%COMMON/PolygonMesh";
import { ObjModel } from "./ObjModel";

var numFrames: number = 0;
var lastTime: number = -1;

/**
 * This is the main function of our web application. This function is called at the end of this file. In the HTML file, this script is loaded in the head so that this function is run.
 */
function main(): void {
    let gl: WebGLRenderingContext;
    let view: View;
    let controller: Controller;

    let producer: VertexPNTProducer = new VertexPNTProducer();
    let model : ObjModel;

    window.onload = ev => {
        console.log("Here I am");


        //retrieve <canvas> element
        var canvas: HTMLCanvasElement = <HTMLCanvasElement>document.querySelector("#glCanvas");
        if (!canvas) {
            console.log("Failed to retrieve the <canvas> element");
            return;
        }
            //get the rendering context for webgl
            gl = WebGLUtils.setupWebGL(canvas, { 'antialias': false, 'alpha': false, 'depth': true, 'stencil': false });

            // Only continue if WebGL is available and working
            if (gl == null) {
                alert("Unable to initialize WebGL. Your browser or machine may not support it.");
                return;
            }
            //create the view
            view = new View(gl);
            //create the model
            model = new ObjModel();
            controller = new Controller(model, view);
            controller.go();


        var tick = function () {
            if (lastTime == -1) {
                lastTime = new Date().getTime();
            }
            numFrames = numFrames + 1;
            if (numFrames >= 100) {
                let currentTime: number = new Date().getTime();
                let frameRate: number = 1000 * numFrames / (currentTime - lastTime);
                lastTime = currentTime;
                document.getElementById('frameratedisplay').innerHTML = "Frame rate: " + frameRate.toFixed(1);
                numFrames = 0;
            }
            fetch("src/camerapath.txt")
            .then(response => response.text())
            .then(data => {
                view.animate(data);
                view.setData(data);
                //console.log(data);
            });
            view.draw();

            //this line sets up the animation
            requestAnimationFrame(tick);
        };

        //call tick the first time
        tick();
    };

    window.onbeforeunload = ev => view.freeMeshes();
}

function init(gl: WebGLRenderingContext) {

}

function draw(gl: WebGLRenderingContext) {

}
main();