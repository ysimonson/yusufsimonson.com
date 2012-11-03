var DEFAULT_SLEEP_RATE = 100;
var TRANSITION_SLEEP_RATE = 30;
var CAMERA_VIEW = new THREE.Vector3(0, 0, 0);
var CUBE_MATERIAL = new THREE.MeshBasicMaterial({
        shading: THREE.FlatShading,
        map: THREE.ImageUtils.loadTexture("/images/square-outline.png")
    });

var GameVisualizer = function(initialCoordinates, initialColor) {
    this.nextGenerations = [];
    this.cubesPool = [];
    this.frameRate = DEFAULT_SLEEP_RATE;

    this.buildScene();
    this.setPos(initialCoordinates);
    this.setColor(initialColor);

    this.cubesLoop();
    this.animate();
};

GameVisualizer.prototype.setTransition = function(color, pos) {
    if(color) {
        this.setColor(color);
    }

    var self = this;
    self.frameRate = TRANSITION_SLEEP_RATE;
    var distance = 0.0;

    for(var axis in pos) {
        var diff = pos[axis] - this.pos[axis];
        distance += diff * diff;
    }

    distance = Math.sqrt(distance);
    var velocity = distance / (250.0 / 30);

    var timer = setInterval(function() {
        if(self.moveCamera(pos, velocity)) {
            clearInterval(timer);
            self.frameRate = DEFAULT_SLEEP_RATE;
        }
    }, 30);
}

GameVisualizer.prototype.buildScene = function() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.CombinedCamera(w, h, 40, 1, 10000, -2000, 10000);
    this.scene.add(this.camera);

    this.plane = new THREE.Mesh(
        new THREE.PlaneGeometry(4000, 4000, 200, 200),
        new THREE.MeshBasicMaterial({ color: 0x222222, wireframe: true })
    );

    this.plane.rotation.x = Math.PI / 2;
    this.scene.add(this.plane);

    this.liveCubes = this.matrix(CUBE_SIZE, CUBE_SIZE);
    this.cubeGeo = new THREE.CubeGeometry(20, 20, 20);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);
    $("body").append(this.renderer.domElement);
};

GameVisualizer.prototype.setPos = function(pos) {
    this.pos = pos;
    this.camera.position.y = this.pos.y;
    this.camera.position.x = this.pos.x * ALPHA;
    this.camera.position.z = this.pos.z * THETA;
    this.camera.lookAt(CAMERA_VIEW);
};

GameVisualizer.prototype.setColor = function(color) {
    this.color = color;

    this.cubeMaterial = CUBE_MATERIAL;
    this.cubeMaterial.color.setRGB(color.r, color.g, color.b);
    this.cubeMaterial.ambient = this.cubeMaterial.color;

    for(var i=0; i<this.cubesPool.length; i++) {
        var cube = this.cubesPool[i];
        cube.material = this.cubeMaterial;
    }
};

GameVisualizer.prototype.drawCell = function(coords) {
    var cube = this.cubesPool.shift() || this.buildCube();
    var size = CUBE_SIZE / 2;

    cube.position.x = (coords[0] - size) * 20 + 10;
    cube.position.y = (coords[1] - size) * 20 + 10;
    cube.position.z = 10;

    cube.visible  = true;
    this.liveCubes[coords[0]][coords[1]] = cube;
};

GameVisualizer.prototype.killCell = function(coords) {
    var cube = this.liveCubes[coords[0]][coords[1]];
    cube.visible = false;
    this.liveCubes[coords[0]][coords[1]] = undefined;
    cube.material = this.cubeMaterial;
    this.cubesPool.push(cube);
};

GameVisualizer.prototype.animate = function() {
    var self = this;

    setTimeout(function() {
        self.animate();
    }, self.frameRate);

    this.renderer.render(this.scene, this.camera);
};

GameVisualizer.prototype.moveCamera = function(transitionPos, velocity) {
    var newPos = {};
    var curPos = this.pos;
    var stillCount = 0;

    for(var axis in curPos) {
        newPos[axis] = curPos[axis];

        var diff = curPos[axis] - transitionPos[axis];
        var absDiff = Math.abs(diff);

        if(absDiff > velocity) {
            newPos[axis] += velocity * (diff > 0 ? -1 : 1);
        } else {
            newPos[axis] = transitionPos[axis];
            stillCount++;
        }
    }

    this.setPos(newPos);
    return stillCount == 3;
};

GameVisualizer.prototype.cubesLoop = function() {
    var self = this;

    setTimeout(function() {
        self.cubesLoop();
    }, 100);

    var gen = this.nextGenerations.shift();
    var i, l;

    if(!gen) return;
    for(i = 0, l = gen.born.length; i < l; i++) this.drawCell(gen.born[i]);
    for(i = 0, l = gen.dead.length; i < l; i++) this.killCell(gen.dead[i]);
};

GameVisualizer.prototype.matrix = function(rows, columns) {
    var grid = new Array(rows);
    for(i = 0; i < rows; i++) grid[i] = new Array(columns);
    return grid;
};

GameVisualizer.prototype.buildCube = function() {
    var cube = new THREE.Mesh(this.cubeGeo, this.cubeMaterial);
    cube.visible = false;
    this.cubesPool.push(cube);
    this.scene.add(cube);
    return cube;
};
