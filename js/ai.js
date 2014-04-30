globals = {animationDelay: 100, minSearchTime: 100, depth: 2, simulations: 7 };
debug = {iterations: 0};

function AI(grid) {
  debug.grid = grid;
  this.grid = grid;
}

AI.prototype.score = function() {
  debug.iterations++;
  var total = 0;
  var maxes = [{value:0}, {value:0}, {value:0}, {value:0}, {value:0}, {value:0}, {value:0}, {value:0}];
  var maxcell;
  var v = [[],[],[],[]];
  
  for (var i=0; i<4; i++) {
      for (var j=0; j<4; j++) {
          // Nonempty cell values are copied to a 2D array.
          if (this.grid.cellOccupied(this.grid.indexes[i][j])) {
              var cell = this.grid.cellContent(this.grid.indexes[i][j]);
              v[i][j] = cell.value;

              // Keep track of the max in each column and row for later.
              if (cell.value > maxes[i].value) maxes[i] = cell;
              if (cell.value > maxes[4 + j].value) maxes[j] = cell;

              // Keep track of the max cell
              if (typeof maxcell === 'undefined' || maxcell.value < cell.value) {
                  maxcell = cell;
              }
              //total += cell.value;
          // Empty cells get a score of 10000
          } else {
              v[i][j] = 0;
              total += 10000;
          }

      }
  }
  
  for (var k=0; k<4; k++) {
      if (maxes[k].x == 3) total += 20000;
      if (maxes[4+k].y == 0) total += 20000;
      
      if (((v[k][0] <= v[k][1]) && (v[k][1] <= v[k][2]) && (v[k][2] <= v[k][3])) || 
          ((v[k][0] >= v[k][1]) && (v[k][1] >= v[k][2]) && (v[k][2] >= v[k][3]))) 
        total += 10000

      if (((v[0][k] <= v[1][k]) && (v[1][k] <= v[2][k]) && (v[2][k] <= v[3][k])) || 
          ((v[0][k] >= v[1][k]) && (v[1][k] >= v[2][k]) && (v[2][k] >= v[3][k]))) 
        total += 10000
      
  }
  if ((maxcell.x == 0 || maxcell.x == 3) && (maxcell.y == 0 || maxcell.y == 3)) total += 40000;
  //if ((maxcell.x == 3) && (maxcell.y == 0)) total += 320000;
  return total;
}

// expectimaxsearch --- ----
AI.prototype.expectimaxsearch = function(depth) {
  var bestScore;
  var bestMove = -1;

  for (var direction in [0, 1, 2, 3]) {
      var newGrid = this.grid.clone();
      var simulation = GameManager._instance.simulate(newGrid, direction);

      if (simulation.moved) {
          newGrid.addRandomTile();
          if (newGrid.isWin()) { return { move: direction, score: Infinity } }
          var newAI = new AI(newGrid);
          var score = newAI.score();

          if (depth > 0) {
            var result = newAI.expectimaxsearch(depth-1);
            score += result.score;
          }

          if (typeof bestScore === "undefined" || score > bestScore) {
              bestScore = score;
              bestMove = direction;
          }
      }
  }

  if (bestMove == -1) return { move: 3, score: 0, positions: 0, cutoffs: 0 };
  return { move: bestMove, score: bestScore, positions: 0, cutoffs: 0 };

};

// randomwalk search (MCMC)
AI.prototype.randomwalksearch = function(depth, size) {
  var bestScore = 0;
  var bestMove = -1;

  for (var direction in [0, 1, 2, 3]) {
      var sumScore = 0;
      var averageScore;
      
      for (var i=0; i < size; i++) {
          var newGrid = this.grid.clone();
          var simulation = GameManager._instance.simulate(newGrid, direction);

          if (simulation.moved) {
              //if (newGrid.isWin()) { return { move: direction, score: Infinity}; }
              //newGrid.addRandomTile();
              var newAI = new AI(newGrid);
              sumScore += newAI.score() + simulation.score;
      
              if (depth > 0) {
                  var result = newAI.randomwalksearch(depth-1, size);
                  if (result.score == 0) sumScore = 0;
                  sumScore += result.score;
              }
          }
      }
      averageScore = sumScore / size;

      if (averageScore > bestScore) {
          bestScore = averageScore;
          bestMove = direction;
      }
  }

  if (bestMove == -1) return { move: 3, score: 0};
  return { move: bestMove, score: bestScore};
};

// performs a search and returns the best move
AI.prototype.getBest = function() {
  //return this.iterativeDeep();
  //return this.expectimaxsearch(6);
  var best = this.randomwalksearch(globals.depth, globals.simulations);
  //if (best.move == 3) window.alert('move left!');
  return best;
}

// performs iterative deepening over the alpha-beta search
AI.prototype.iterativeDeep = function() {
  var start = (new Date()).getTime();
  var depth = 5;
  var best;
  do {
    var newBest = this.expectimaxsearch(depth, -10000, 10000, 0 ,0);
    if (newBest.move == -1) {
      //console.log('BREAKING EARLY');
      break;
    } else {
      best = newBest;
    }
    depth++;
  } while ( (new Date()).getTime() - start < globals.minSearchTime);
  //console.log('depth', --depth);
  //console.log(this.translate(best.move));
  //console.log(best);
  return best;
}

AI.prototype.translate = function(move) {
 return {
    0: 'up',
    1: 'right',
    2: 'down',
    3: 'left'
  }[move];
}

