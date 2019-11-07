/**
 * This interface represents the model
 */
export interface ModelInterface {
}

export class ObjModel implements ModelInterface {

    constructor() {
    }


    //get the vertex shader code
    public getVShader(): string {
        return `attribute vec4 vPosition;
    uniform vec4 vColor;
    uniform mat4 proj;
    uniform mat4 modelview;
    varying vec4 outColor;
    
    void main()
    {
        gl_Position = proj * modelview * vPosition;
        outColor = vColor;
    }
    `;
    }

    //get the fragment shader code
    public getFShader(): string {
        return `precision mediump float;
    varying vec4 outColor;

    void main()
    {
        gl_FragColor = outColor;
    }
    `;
    }

    public getPhongVShader(): string {
        return `
        attribute vec4 vPosition;
        attribute vec4 vNormal;
        
        uniform mat4 projection;
        uniform mat4 modelview;
        uniform mat4 normalmatrix;
        varying vec3 fNormal;
        varying vec4 fPosition;
        
        void main()
        {
            vec3 lightVec,viewVec,reflectVec;
            vec3 normalView;
            vec3 ambient,diffuse,specular;
        
            fPosition = modelview * vPosition;
            gl_Position = projection * fPosition;
        
        
            vec4 tNormal = normalmatrix * vNormal;
            fNormal = normalize(tNormal.xyz);
        
        //    fTexCoord = texturematrix * vec4(vTexCoord.s,vTexCoord.t,0,1);
        
        }
        
    `;
    }

    public getPhongFShader(numLights: number): string {
        return `precision mediump float;

        struct MaterialProperties
        {
            vec3 ambient;
            vec3 diffuse;
           vec3 specular;
            float shininess;
        };
        
        struct LightProperties
        {
            vec3 ambient;
            vec3 diffuse;

            vec3 specular;
            vec4 position;
        };
        
        
        varying vec3 fNormal;
        varying vec4 fPosition;
        //varying vec4 fTexCoord;
        
        
        uniform MaterialProperties material;
        uniform LightProperties light[`+ numLights + `];
        
        /* texture */
        //uniform sampler2D image;
        
        void main()
        {
            vec3 lightVec,viewVec,reflectVec;
            vec3 normalView;
            vec3 ambient,diffuse,specular;
            float nDotL,rDotV;
            vec4 result;
        
        
            result = vec4(0,0,0,1);
        `
            + `for (int i=0;i<` + numLights + `;i++)
            {
                if (light[i].position.w!=0.0)
                    lightVec = normalize(light[i].position.xyz - fPosition.xyz);
                else
                    lightVec = normalize(-light[i].position.xyz);
        
                vec3 tNormal = fNormal;
                normalView = normalize(tNormal.xyz);
                nDotL = dot(normalView,lightVec);
        
                viewVec = -fPosition.xyz;
                viewVec = normalize(viewVec);
        
                reflectVec = reflect(-lightVec,normalView);
                reflectVec = normalize(reflectVec);
        
                rDotV = max(dot(reflectVec,viewVec),0.0);
        
                ambient = material.ambient * light[i].ambient;
                diffuse = material.diffuse * light[i].diffuse * max(nDotL,0.0);
                if (nDotL>0.0)
                    specular = material.specular * light[i].specular * pow(rDotV,material.shininess);
                else
                    specular = vec3(0,0,0);
                result = result + vec4(ambient+diffuse+specular,1.0);    
            }
            //WE have changed something here
            //result = result * texture2D(image,fTexCoord.st);
            gl_FragColor = result;
        }
        
    `;
    }
}