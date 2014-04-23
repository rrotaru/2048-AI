var debug = {start: null, stop: null, done: null, iterations: 0}

function AI(grid) {
  this.grid = grid;
}

AI.prototype.score = function() {
  debug.iterations++;
  var total = 0;
  var maxes = [0, 0, 0, 0, 0, 0, 0, 0];
  var v = [[],[],[],[]];
  
  for (var i=0; i<4; i++) {
      for (var j=0; j<4; j++) {
          // Nonempty cells get a score of their value.
          if (this.grid.cellOccupied(this.grid.indexes[i][j])) {
              var cell = this.grid.cellContent(this.grid.indexes[i][j]);
              // Create an array 
              v[i][j] = cell.value;

              // Keep track of the max in each column and row for later.
              if (cell.value > maxes[i]) maxes[i] = cell;
              if (cell.value > maxes[4 + j]) maxes[j] = cell;

              total += cell.value;

          // Empty cells get a score of 10000
          } else {
              total += 10000;
          }

      }
  }
  for (var k=0; k<4; k++) {
      if (maxes[k].x == 0 || maxes[k].x == 3) total += 20000;
      if (maxes[4+k].y == 0 || maxes[4+k].y == 3) total += 20000;
  
      if (((v[k][0] < v[k][1]) && (v[k][1] < v[k][2]) && (v[k][2] < v[k][3])) || 
          ((v[k][0] > v[k][1]) && (v[k][1] > v[k][2]) && (v[k][2] > v[k][3]))) 
        total += 10000

      if (((v[0][k] < v[1][k]) && (v[1][k] < v[2][k]) && (v[2][k] < v[3][k])) || 
          ((v[0][k] > v[1][k]) && (v[1][k] > v[2][k]) && (v[2][k] > v[3][k]))) 
        total += 10000
  }
  return total;
}

// expectimaxsearch --- ----
AI.prototype.expectimaxsearch = function(depth) {
  var bestScore;
  var bestMove = -1;

  for (var direction in [0, 1, 2, 3]) {
      var newGrid = this.grid.clone();

      if (newGrid.move(direction).moved) {
          newGrid.addRandomTile();
          //if (newGrid.isWin()) { return { move: direction } }
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




// static evaluation function
AI.prototype.eval = function() {
  var emptyCells = this.grid.availableCells().length;

  var smoothWeight = 0.1,
      //monoWeight   = 0.0,
      //islandWeight = 0.0,
      mono2Weight  = 1.0,
      emptyWeight  = 2.7,
      maxWeight    = 1.0;

  return this.grid.smoothness() * smoothWeight
       //+ this.grid.monotonicity() * monoWeight
       //- this.grid.islands() * islandWeight
       + this.grid.monotonicity2() * mono2Weight
       + Math.log(emptyCells) * emptyWeight
       + this.grid.maxValue() * maxWeight;
};

//AI.prototype.cache = {}

// alpha-beta depth first search
AI.prototype.search = function(depth, alpha, beta, positions, cutoffs) {
  var bestScore;
  var bestMove = -1;
  var result;
  // the maxing player
  if (this.grid.playerTurn) {
    bestScore = alpha;
    for (var direction in [0, 1, 2]) {
      var newGrid = this.grid.clone();
      if (newGrid.move(direction).moved) {
        positions++;
        if (newGrid.isWin()) {
          return { move: direction, score: 10000, positions: positions, cutoffs: cutoffs };
        }
        var newAI = new AI(newGrid);

        if (depth == 0) {
          result = { move: direction, score: newAI.eval() };
        } else {
          result = newAI.search(depth-1, bestScore, beta, positions, cutoffs);
          if (result.score > 9900) { // win
            result.score--; // to slightly penalize higher depth from win
          }
          positions = result.positions;
          cutoffs = result.cutoffs;
        }

        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = direction;
        }
        if (bestScore > beta) {
          cutoffs++
          return { move: bestMove, score: beta, positions: positions, cutoffs: cutoffs };
        }
      }
    }
  }

  else { // computer's turn, we'll do heavy pruning to keep the branching factor low
    bestScore = beta;

    // try a 2 and 4 in each cell and measure how annoying it is
    // with metrics from eval
    var candidates = [];
    var cells = this.grid.availableCells();
    var scores = { 2: [], 4: [] };
    for (var value in scores) {
      for (var i in cells) {
        scores[value].push(null);
        var cell = cells[i];
        var tile = new Tile(cell, parseInt(value, 10));
        this.grid.insertTile(tile);
        scores[value][i] = -this.grid.smoothness() + this.grid.islands();
        this.grid.removeTile(cell);
      }
    }



    
    /*
    var candidates = [];
    var cells = this.grid.availableCells();
    var scores = {2:[], 4:[]};
    var i = 0;
    for (var value in scores) {
      for (var i=0; i<cells.length; i++) {
        scores[value].push(0);
        var cell = cells[i];
        for (var direction in [0,1,2,3]) {
          var vector = this.grid.getVector(direction);
          var target = this.grid.findFarthestPosition(cell, vector);
          if (this.grid.cellOccupied(target.next)) {
            var targetValue = this.grid.cells[target.next.x][target.next.y].value; 
            if (targetValue == value) {
              scores[value][i] -= 4;
            } else {
              scores[value][i] += Math.log(value) / Math.log(2);
            }
          }
        }
      }
    }
    //*/

    // now just pick out the most annoying moves
    var maxScore = Math.max(Math.max.apply(null, scores[2]), Math.max.apply(null, scores[4]));
    for (var value in scores) { // 2 and 4
      for (var i=0; i<scores[value].length; i++) {
        if (scores[value][i] == maxScore) {
          candidates.push( { position: cells[i], value: parseInt(value, 10) } );
        }
      }
    }

    // search on each candidate
    for (var i=0; i<candidates.length; i++) {
      var position = candidates[i].position;
      var value = candidates[i].value;
      var newGrid = this.grid.clone();
      var tile = new Tile(position, value);
      newGrid.insertTile(tile);
      newGrid.playerTurn = true;
      positions++;
      newAI = new AI(newGrid);
      result = newAI.search(depth, alpha, bestScore, positions, cutoffs);
      positions = result.positions;
      cutoffs = result.cutoffs;

      if (result.score < bestScore) {
        bestScore = result.score;
      }
      if (bestScore < alpha) {
        cutoffs++;
        return { move: null, score: alpha, positions: positions, cutoffs: cutoffs };
      }
    }
    //*/
        
    /*
    for (var samples=0; samples<4; samples++) {
      var newGrid = this.grid.clone();
      newGrid.computerMove();
      newAI = new AI(newGrid);
      result = newAI.search(depth, alpha, bestScore, positions, cutoffs);
      positions = result.positions;
      cutoffs = result.cutoffs;

      if (result.score < bestScore) {
        bestScore = result.score;
      }
      if (bestScore < alpha) {
        //console.log('cutoff')
        cutoffs++;
        return { move: bestMove, score: bestScore, positions: positions, cutoffs: cutoffs };
      }

    }
    //*/
    /*
    for (var x=0; x<4; x++) {
      for (var y=0; y<4; y++) {
        var position = {x:x, y:y};
        if (this.grid.cellAvailable(position)) {
          for (var value in [2, 4]) {
          //for (var value in [2]) {
            var newGrid = this.grid.clone();
            var tile = new Tile(position, value);
            newGrid.insertTile(tile);
            newGrid.playerTurn = true;
            positions++;
            newAI = new AI(newGrid);
            //console.log('inserted tile, players turn is', newGrid.playerTurn);
            result = newAI.search(depth, alpha, bestScore, positions, cutoffs);
            positions = result.positions;
            cutoffs = result.cutoffs;

            if (result.score < bestScore) {
              bestScore = result.score;
            }
            if (bestScore < alpha) {
              //console.log('cutoff')
              cutoffs++;
              return { move: bestMove, score: bestScore, positions: positions, cutoffs: cutoffs };
            }
          }
        }
      }
    }
    //*/
  }

  return { move: bestMove, score: bestScore, positions: positions, cutoffs: cutoffs };
}

// performs a search and returns the best move
AI.prototype.getBest = function() {
  //return this.iterativeDeep();
  return this.expectimaxsearch(6);
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
  } while ( (new Date()).getTime() - start < minSearchTime);
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

