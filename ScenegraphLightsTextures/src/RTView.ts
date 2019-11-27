import { vec3 } from "gl-matrix";

export class RTView {
    private canvas: HTMLCanvasElement;
    constructor() {
        this.canvas = <HTMLCanvasElement>document.querySelector("#raytraceCanvas");
        if (!this.canvas) {
            console.log("Failed to retrieve the <canvas> element");
            return;
        }
        //button clicks
        let button: HTMLButtonElement = <HTMLButtonElement>document.querySelector("#savebutton");
        button.addEventListener("click", ev => this.saveCanvas());
    }

    private saveCanvas(): void {
        let link = document.createElement('a');
        link.href = this.canvas.toDataURL('image/png');
        link.download = "result.png";
        link.click();
    }

    public fillCanvas(colors : vec3[], w : number, h : number): void {
        let width: number = Number(this.canvas.getAttribute("width"));
        let height: number = Number(this.canvas.getAttribute("height"));
        //console.log(w,h);
        let imageData: ImageData = this.canvas.getContext('2d').createImageData(w, h);

        for (let i: number = 0; i < h; i++) {
            for (let j: number = 0; j < w; j++) {
                 
                imageData.data[4 * (i * w + j)] = colors[i * w + j][0] * 255;//Math.random() * 255;
                imageData.data[4 * (i * w + j) + 1] = colors[i * w + j][1] * 255;//Math.random() * 255;
                imageData.data[4 * (i * w + j) + 2] = colors[i * w + j][2] * 255;//Math.random() * 255;
                imageData.data[4 * (i * w + j) + 3] = 255;
                
            }
        }
        this.canvas.getContext('2d').putImageData(imageData, 0, 0);

        //let context: CanvasRenderingContext2D = this.canvas.getContext('2d')
        //context.fillStyle = 'red';
        //context.fillRect(100, 100, 200, 100);
    }
}