import { View } from "View"
import { ObjModel } from "ObjModel"

/**
 * This interface represents all the functions that the view can call. All callback functions for various UI elements go here
 */
export interface Features {
    keyPress(keyEvent: string): void;
}

/**
 * This class represents the controller of our web application. It provides all the callbacks 
 * listed above
 */
export class Controller implements Features {
    private view: View;
    private model: ObjModel;

    constructor(model: ObjModel, view: View) {
        this.model = model;
        this.view = view;
        this.view.setFeatures(this);
    }

    /**
     * This function is called at the beginning of the web application (see ObjViewer.ts) to give 
     * control of the application to the controller.
     */
    public go(): void {
        let numLights : number;
        numLights = this.view.getNumberOfLights();
        //get the shaders from the model and pass it to the WebGL-specific view 
        this.view.initShaders(this.model.getPhongVShader(), this.model.getPhongFShader(numLights));
        //this.view.initShaders(this.model.getVShader(), this.model.getFShader());
        //the view is now ready to draw
        this.view.initScenegraph();
        this.view.draw();
    }

    public keyPress(keyEvent: string): void {
        switch (keyEvent) {       
            // case "keyA": {
            //     this.view.setAPerspective();
            //     console.log("U pressed A");
            //     break;
            // }
            case "KeyF": {
                this.view.setFPerspective();
                console.log('keyPressedF');
                break;
            }
            case "KeyO": {
                this.view.setOPerspective();
                console.log("U Pressed U");
                break;
            }
            case "KeyT": {
                this.view.setTPerspective();
                console.log("U Pressed T");
                break;
            }
            case "KeyA": {
                this.view.setAPerspective();
                console.log("U Pressed A");
                break;
            }
        }
    }
}