const vertexShaderTxt = `
precision mediump float;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProjection;

attribute vec3 vertPosition;
attribute vec3 vertColor;

varying vec3 fragColor;

void main() {
    fragColor = vertColor;
    gl_Position = mProjection * mView * mWorld * vec4(vertPosition, 1.0);
}
`
const fragmentShaderTxt = `
precision mediump float;

varying vec3 fragColor;

void main() {
    gl_FragColor = vec4(fragColor, 1.0);
}
`

const GenerateCube = function ([x,y,z], size)
{
    const verticesSize = [
        // Front face
        -size / 2, -size / 2, size / 2,
        size / 2, -size / 2, size / 2,
        size / 2, size / 2, size / 2,
        -size / 2, size / 2, size / 2,

        // Back face
        -size / 2, -size / 2, -size / 2,
        -size / 2, size / 2, -size / 2,
        size / 2, size / 2, -size / 2,
        size / 2, -size / 2, -size / 2,

        // Top face
        -size / 2, size / 2, -size / 2,
        -size / 2, size / 2, size / 2,
        size / 2, size / 2, size / 2,
        size / 2, size / 2, -size / 2,

        // Bottom face
        -size / 2, -size / 2, -size / 2,
        size / 2, -size / 2, -size / 2,
        size / 2, -size / 2, size / 2,
        -size / 2, -size / 2, size / 2,

        // Right face
        size / 2, -size / 2, -size / 2,
        size / 2, size / 2, -size / 2,
        size / 2, size / 2, size / 2,
        size / 2, -size / 2, size / 2,

        // Left face
        -size / 2, -size / 2, -size / 2,
        -size / 2, -size / 2, size / 2,
        -size / 2, size / 2, size / 2,
        -size / 2, size / 2, -size / 2,
    ];
    

    const vertices = verticesSize.map((coord, index) => {
        if (index % 3 === 0) {
            return coord + x;
        } else if (index % 3 === 1) {
            return coord + y;
        } else {
            return coord + z;
        }
    });
    
    const indices = [
        0, 1, 2, 0, 2, 3, // Top
        4, 5, 6, 4, 6, 7, // Bottom
        8, 9, 10, 8, 10, 11, // Front
        12, 13, 14, 12, 14, 15, // Back
        16, 17, 18, 16, 18, 19, // Left
        20, 21, 22, 20, 22, 23, // Right
    ];
    

    return { vertices, indices };
}


const mat4 = glMatrix.mat4;

const Init = function () {
    const canvas = document.getElementById('main-canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const gl = canvas.getContext('webgl');
    let canvasColor = [0.1, 0.1, 0.1];

    if (!checkGl(gl)) {
        return;
    }

    gl.clearColor(...canvasColor, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    // Compile shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderTxt);
    gl.shaderSource(fragmentShader, fragmentShaderTxt);

    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    if(!checkShaderCompile(gl, vertexShader) || !checkShaderCompile(gl, fragmentShader)) {
        return;
    }

    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    if (!checkLink(gl, program)) {
        return;
    }

    gl.useProgram(program);

    // Get uniform locations
    const worldMatLoc = gl.getUniformLocation(program, 'mWorld');
    const viewMatLoc = gl.getUniformLocation(program, 'mView');
    const projMatLoc = gl.getUniformLocation(program, 'mProjection');

    const worldMatrix = mat4.create();
    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, [-15, 0, 0], [0, 0, 0], [0, 1, 0]); // Camera setup
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, glMatrix.glMatrix.toRadian(90), canvas.width / canvas.height, 0.1, 1000.0);

    gl.uniformMatrix4fv(worldMatLoc, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(viewMatLoc, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(projMatLoc, gl.FALSE, projectionMatrix);

    // Generate cubes
    const cubes = [];
    const height = 6;
    const radius = 3;
    const cubeSize = 0.4;
    const angleStep = Math.PI / 12;

    for (let y = 0; y < height; y++) {
        for (let angle = 0; angle < 2 * Math.PI; angle += angleStep) {
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            const cube = GenerateCube([x, y * cubeSize, z], cubeSize);
            cubes.push(cube);
        }
    }

    // Create and bind buffers
    const boxVertBuffer = gl.createBuffer();
    const boxIndexBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBuffer);

    // Attribute locations
    const posAttrLoc = gl.getAttribLocation(program, 'vertPosition');
    const colorAttrLoc = gl.getAttribLocation(program, 'vertColor');

    gl.enableVertexAttribArray(posAttrLoc);
    gl.enableVertexAttribArray(colorAttrLoc);

    // Color data
    const colors = new Float32Array([
        1.0, 0.1, 0.0, 1.0, 0.1, 0.0, 1.0, 0.1, 0.0, 1.0, 0.1, 0.0,
        1.0, 0.1, 0.0, 1.0, 0.1, 0.0, 1.0, 0.1, 0.0, 1.0, 0.1, 0.0,
        1.0, 0.1, 0.0, 1.0, 0.1, 0.0, 1.0, 0.1, 0.0, 1.0, 0.1, 0.0,
        1.0, 0.5, 0.0, 1.0, 0.5, 0.0, 1.0, 0.5, 0.0, 1.0, 0.5, 0.0,
        1.0, 0.5, 0.0, 1.0, 0.5, 0.0, 1.0, 0.5, 0.0, 1.0, 0.5, 0.0,
        1.0, 0.5, 0.0, 1.0, 0.5, 0.0, 1.0, 0.5, 0.0, 1.0, 0.5, 0.0
    ]);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    gl.vertexAttribPointer(colorAttrLoc, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT, 0);

    const identityMat = mat4.create();
    let angle = 0;

    const loop = function () {
        angle = performance.now() / 1000 / 2 * Math.PI;
        mat4.rotate(worldMatrix, identityMat, angle, [1, 1, 0]);
        gl.uniformMatrix4fv(worldMatLoc, gl.FALSE, worldMatrix);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        cubes.forEach(cube => {
            gl.bindBuffer(gl.ARRAY_BUFFER, boxVertBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.vertices), gl.STATIC_DRAW);
            gl.vertexAttribPointer(posAttrLoc, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube.indices), gl.STATIC_DRAW);

            gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
        });

        requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
};

// Helper functions
function checkGl(gl) {
    if (!gl) {console.log('WebGL not supported, use another browser'); return false;}
    return true;
}

function checkShaderCompile(gl, shader) {
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('shader not compiled', gl.getShaderInfoLog(shader));
        return false;
    }
    return true;
}

function checkLink(gl, program) {
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(program));
        return false;
    }
    return true;
}