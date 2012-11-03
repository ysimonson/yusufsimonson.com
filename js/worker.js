// This Web Worker is in charge of calculating future generations,
// The idea is that these are calculated in the background and then cached,
// so the main GoL widget concentrates only on rendering the cells,
// which is the most demanding task for the cpu.
var GameComputer = function(size) {
    this.size = size;

    this.alive = [];
    this.candidates = [];
    this.dead = [];
    this.born = [];

    this.initializeGrid(this.size, this.size);
    this.randomizeGrid();

    this.run();
};

GameComputer.prototype.initializeGrid = function(rows, columns) {
    var grid = new Array(rows);
    for(i=0; i<rows; i++) grid[i] = new Array(columns);
    this.grid = grid;
};

GameComputer.prototype.randomizeGrid = function() {
    var floor = Math.floor;
    var random = Math.random;
    var limit = this.size * 25;
    var x, y;

    for(i=0; i<limit; i++) {
        x = floor(random() * this.size);
        y = floor(random() * this.size);

        if(this.grid[x][y] != 10) {
            this.grid[x][y] = 10;
            this.alive.push([x,y]);
        }
    }

    // Draw the initial position too.
    postMessage([{ born: this.alive, dead: [] }]);
};

// Calculate 20 generations at a time,
// and pass them to the foreground,
// that way the syncrhonization time between this worker,
// and the main js is reduced to a 1/10th of the time.
GameComputer.prototype.run = function() {
    var self = this;

    setTimeout(function() {
        self.run();
    }, 2000);

    var generations = [], i;

    for(i=0; i<20; i++) {
        this.nextGeneration();
        generations.push({ born: this.born, dead: this.dead });
    }

    postMessage(generations);
};

GameComputer.prototype.nextGeneration = function() {
    var i, x, y, neighbours, candidate;

    this.candidates = this.alive;

    for(i=0, l=this.alive.length; i<l; i++) {
        this.updateNeighbors(this.alive[i]);
    }

    this.alive = [];
    this.born = [];
    this.dead = [];

    for(i=0, l=this.candidates.length; i<l; i++) {
        candidate = this.candidates[i];
        x = candidate[0];
        y = candidate[1];
        neighbours = this.grid[x][y] % 10;

        if(this.grid[x][y] >= 10) {
            if(neighbours < 2 || neighbours > 3) {
                this.dead.push(candidate);
                this.grid[x][y] = undefined;
            } else {
                this.grid[x][y] = 10
                this.alive.push(candidate)
            }
        } else if(this.grid[x][y] == 3) {
            this.grid[x][y] = 10;
          this.born.push(candidate);
          this.alive.push(candidate);
        } else {
            this.grid[x][y] = undefined
        }
    }
}

GameComputer.prototype.updateNeighbors = function(coord) {
    var row = coord[0], column = coord[1];
    var j, x, y;

    var coords = [
        [row - 1, column - 1],
        [row - 1, column],
        [row - 1, column + 1],
        [row, column - 1],
        [row, column + 1],
        [row + 1, column - 1],
        [row + 1, column],
        [row + 1, column + 1]
    ];

    for(j=0; j<8; j++) {
        if(coords[j][0] >= 0 && coords[j][0] < this.size && coords[j][1] >= 0 && coords[j][1] < this.size) {
            x = coords[j][0]; y = coords[j][1];

            if(this.grid[x][y]) {
                this.grid[x][y]++;
            } else {
                this.grid[x][y] = 1;
                this.candidates.push(coords[j])
            }
        }
    }
};

onmessage = function(e) {
    new GameComputer(e.data.size);
};
