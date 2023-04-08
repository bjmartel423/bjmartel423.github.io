import { Component } from '@angular/core';

export interface Tile {
  color: string;
  click: boolean;
}

export interface Position {
  row: number;
  column: number;
}

export interface Cluster {
  positions: Position[];
}

export enum Direction {
  UP, DOWN, LEFT, RIGHT
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title = 'poppitSolver';
  public rows = 4;
  public columns = 4;
  public mode = 'Edit';
  public notMode = 'Solve';
  public poppitHeight = 200;
  public poppitWidth = 200;
  public selectedColor = 'grey';
  public solution: Tile[][][] = new Array();
  public solutionIndex = 0;
  public editTiles: Tile[] = [
    { color: 'lightgreen', click: false },
    { color: 'lightblue', click: false  },
    { color: 'pink', click: false  },
    { color: 'purple', click: false  },
    { color: 'lightgreen', click: false  },
    { color: 'lightblue', click: false  },
    { color: 'pink', click: false  },
    { color: 'purple', click: false  },
    { color: 'lightgreen', click: false  },
    { color: 'lightblue', click: false  },
    { color: 'pink', click: false  },
    { color: 'purple', click: false  },
    { color: 'lightgreen', click: false  },
    { color: 'lightblue', click: false  },
    { color: 'pink', click: false  },
    { color: 'purple', click: false  },
  ];
  public display: Tile[] = this.editTiles;

  onWindowUpdate() {
    this.poppitHeight = (this.rows * 50);
    this.poppitWidth = (this.columns * 50);
    this.editTiles = resetTiles(this.rows, this.columns);
    this.display = this.editTiles;
  }

  onBackButton() {
    this.solutionIndex--;
    this.display = convertGridToTile(this.solution[this.solutionIndex]);
  }

  onNextButton() {
    this.solutionIndex++;
    this.display = convertGridToTile(this.solution[this.solutionIndex]);
  }

  onChangeMode() {
    if (this.mode === 'Edit') {
      this.mode = 'Solve';
      this.notMode = 'Edit';
      this.solution = solve(this.editTiles, this.rows, this.columns);
      this.solutionIndex = 0;
      this.display = convertGridToTile(this.solution[this.solutionIndex]);
    } else {
      this.mode = 'Edit';
      this.notMode = 'Solve';
      this.display = this.editTiles;
    }
  }

  onClickTile(index: number) {
    this.editTiles[index].color = this.selectedColor;
  }

  onClickSelectColor(color: string) {
    this.selectedColor = color;
  }
}

function resetTiles(rows: number, columns: number): Tile[] {
  let numTiles = rows * columns;
  let tiles = new Array(numTiles);
  for (let i = 0; i < numTiles; i++) {
    tiles[i] = { color: 'grey', click: false};
  }
  return tiles;
}

function solve(tiles: Tile[], rows: number, columns: number): Tile[][][] {
  let solution: Tile[][][] = [];
  let solutionFound = false;
  let storeIndex = 0;
  let originalGrid = convertTileToGrid(tiles, rows, columns);
  let tileGrid = cloneGrid(convertTileToGrid(tiles, rows, columns));
  while (!solutionFound) {
    solution = [];
    tileGrid = cloneGrid(originalGrid);
    let possibleMoves = calculateClickables(tileGrid);
    storeIndex = 0;
    while (possibleMoves.length != 0) {
      let index = Math.floor(Math.random() * possibleMoves.length);
      let randomPosition = possibleMoves[index];
      storeSolution(solution, tileGrid, storeIndex, randomPosition);
      storeIndex++;
      clickSolution(tileGrid, randomPosition);
      recalculateGrid(tileGrid);
      possibleMoves = calculateClickables(tileGrid);
    }
    solutionFound = gridCleared(tileGrid);
  }
  storeFinal(solution, tileGrid, storeIndex);
  console.log(solution);
  return solution;
}

function gridCleared(tileGrid: Tile[][]) {
  return tileGrid[tileGrid.length - 1][tileGrid[0].length - 1].color == 'grey';
}

function recalculateGrid(tileGrid: Tile[][]) {
  removeHoles(tileGrid);
  removeEmptyColumns(tileGrid);
}

function removeHoles(tileGrid: Tile[][]) {
  for (var i = tileGrid.length - 1; i >= 0; i--) {
    for (var j = 0; j < tileGrid[i].length; j++) {
      let tile = getTileFromIndecies(i, j, tileGrid);
      if (tile.color === 'grey') {
        dropColors(i, j, tileGrid);
      }
    }
  }
}

function dropColors(row: number, column: number, tileGrid: Tile[][]) {
  let nextColor = 'grey';
  let offset = 1;
  while (nextColor === 'grey' && row - offset >= 0) {
    let testTile = getTileFromIndecies(row - offset, column, tileGrid);
    if (testTile.color != 'grey') {
      getTileFromIndecies(row, column, tileGrid).color = structuredClone(testTile.color);
      testTile.color = 'grey';
      break;
    } else {
      offset++;
    }
  }
}

function removeEmptyColumns(tileGrid: Tile[][]) {
  for (var column = tileGrid[0].length - 1; column >= 0; column--) {
    let row = tileGrid.length - 1;
    if (getTileFromIndecies(row, column, tileGrid).color == 'grey') {
      fillColumn(row, column, tileGrid);
    }
  }
}

function fillColumn(row: number, column: number, tileGrid: Tile[][]) {
  for (var newColumn = column - 1; newColumn >= 0; newColumn--) {
    if (getTileFromIndecies(row, newColumn, tileGrid).color != 'grey') {
      shiftColumn(newColumn, column, tileGrid);
      break;
    }
  }
}

function shiftColumn(newColumn: number, column: number, tileGrid: Tile[][]) {
  for (var row = 0; row < tileGrid.length; row++) {
    let newColumnColor = getTileFromIndecies(row, newColumn, tileGrid).color;
    getTileFromIndecies(row, column, tileGrid).color = structuredClone(newColumnColor);
    getTileFromIndecies(row, newColumn, tileGrid).color = 'grey';
  }
}

function clickSolution(tileGrid: Tile[][], position: Position) {
  let cluster = calculateCluster(position, tileGrid);
  cluster.positions.forEach(pos => {
    getTileFromPosition(pos, tileGrid).color = 'grey';
  });
}

function storeSolution(solution: Tile[][][], tileGrid: Tile[][], index: number, randomPosition: Position) {
  solution[index] = cloneGrid(tileGrid);
  if(randomPosition != null) {
  getTileFromPosition(randomPosition, solution[index]).click = true;
  }
}

function storeFinal(solution: Tile[][][], tileGrid: Tile[][], index: number) {
  solution[index] = cloneGrid(tileGrid);
}

function calculateClickables(tileGrid: Tile[][]): Position[] {
  let positions: Position[] = [];
  for (var i = 0; i < tileGrid.length; i++) {
    for (var j = 0; j < tileGrid[i].length; j++) {
      let position = { row: i, column: j, checked: false };
      if (isFilled(position, tileGrid) && hasAnyLink(position, tileGrid)) {
        positions.push(position);
      }
    }
  }
  return positions;
}

function isFilled(position: Position, tileGrid: Tile[][]) {
  return getTileFromPosition(position, tileGrid).color != 'grey';
}

function hasAnyLink(position: Position, tileGrid: Tile[][]): boolean {
  return hasLink(position, tileGrid, Direction.UP)
    || hasLink(position, tileGrid, Direction.DOWN)
    || hasLink(position, tileGrid, Direction.LEFT)
    || hasLink(position, tileGrid, Direction.RIGHT);
}

function hasLink(position: Position, tileGrid: Tile[][], direction: Direction): boolean {
  if (directionExists(position, tileGrid, direction)) {
    if (linkExists(position, tileGrid, direction)) {
      return true;
    }
  }
  return false;
}

function directionExists(position: Position, tileGrid: Tile[][], direction: Direction): boolean {
  switch (direction) {
    case Direction.UP: {
      return !topRow(position.row);
    }
    case Direction.DOWN: {
      return !bottomRow(position.row, tileGrid.length);
    }
    case Direction.LEFT: {
      return !firstColumn(position.column);
    }
    case Direction.RIGHT: {
      return !lastColumn(position.column, tileGrid[0].length);
    }
  }
}

function linkExists(position: Position, tileGrid: Tile[][], direction: Direction): boolean {
  let baseColor = tileGrid[position.row][position.column].color;
  switch (direction) {
    case Direction.UP: {
      return colorMatches(baseColor, tileGrid[position.row - 1][position.column]);
    }
    case Direction.DOWN: {
      return colorMatches(baseColor, tileGrid[position.row + 1][position.column]);
    }
    case Direction.LEFT: {
      return colorMatches(baseColor, tileGrid[position.row][position.column - 1]);
    }
    case Direction.RIGHT: {
      return colorMatches(baseColor, tileGrid[position.row][position.column + 1]);
    }
  }
}

function colorMatches(baseColor: string, tile: Tile): boolean {
  return baseColor === tile.color;
}

function calculateCluster(position: Position, tileGrid: Tile[][]): Cluster {
  let cluster = { positions: new Array() };
  let uncheckedPosition: Position[] = [];
  cluster.positions.push(position);
  uncheckedPosition.push(position);
  while (uncheckedPosition.length > 0) {
    let tile = uncheckedPosition.pop();
    if (tile) {
      if (hasNewLink(tile, tileGrid, cluster, Direction.UP)) {
        let pos = { row: tile.row - 1, column: tile.column };
        if (!clusterContains(pos, cluster)) {
          uncheckedPosition.push(pos);
          cluster.positions.push(pos);
        }
      }
      if (hasNewLink(tile, tileGrid, cluster, Direction.DOWN)) {
        let pos = { row: tile.row + 1, column: tile.column };
        if (!clusterContains(pos, cluster)) {
          uncheckedPosition.push(pos);
          cluster.positions.push(pos);
        }
      }
      if (hasNewLink(tile, tileGrid, cluster, Direction.LEFT)) {
        let pos = { row: tile.row, column: tile.column - 1 };
        if (!clusterContains(pos, cluster)) {
          uncheckedPosition.push(pos);
          cluster.positions.push(pos);
        }
      }
      if (hasNewLink(tile, tileGrid, cluster, Direction.RIGHT)) {
        let pos = { row: tile.row, column: tile.column + 1 };
        if (!clusterContains(pos, cluster)) {
          uncheckedPosition.push(pos);
          cluster.positions.push(pos);
        }
      }
    }
  }
  return cluster;
}

function hasNewLink(position: Position, tileGrid: Tile[][], cluster: Cluster, direction: Direction) {
  let newLink = hasLink(position, tileGrid, direction);
  return newLink;
}

function getTileFromIndecies(row: number, column: number, tileGrid: Tile[][]): Tile {
  return tileGrid[row][column];
}

function getTileFromPosition(position: Position, tileGrid: Tile[][]): Tile {
  return tileGrid[position.row][position.column];
}


function convertTileToGrid(tileList: Tile[], rows: number, columns: number): Tile[][] {
  let tileGrid: Tile[][] = [];
  for (var i = 0; i < rows; i++) {
    tileGrid[i] = [];
    for (var j = 0; j < columns; j++) {
      tileGrid[i][j] = tileList[i * columns + j];
    }
  }
  return tileGrid;
}

function convertGridToTile(tileGrid: Tile[][]): Tile[] {
  let tileList: Tile[] = [];
  for (var i = 0; i < tileGrid.length; i++) {
    for (var j = 0; j < tileGrid[i].length; j++) {
      tileList[i * tileGrid[i].length + j] = tileGrid[i][j];
    }
  }
  return tileList;
}

function cloneGrid(tileGrid: Tile[][]): Tile[][] {
  let clonedGrid: Tile[][] = [];
  for (var i = 0; i < tileGrid.length; i++) {
    clonedGrid[i] = [];
    for (var j = 0; j < tileGrid[i].length; j++) {
      clonedGrid[i][j] = { color: tileGrid[i][j].color, click: false }
    }
  }
  return clonedGrid;
}

function colorCluster(tileGrid: Tile[][], cluster: Cluster, color: string) {
  cluster.positions.forEach(position => {
    tileGrid[position.row][position.column].color = color;
  });
}

function topRow(row: number) {
  return row == 0;
}

function bottomRow(row: number, max: number) {
  return row == (max - 1);
}

function firstColumn(column: number) {
  return column == 0;
}

function lastColumn(column: number, max: number) {
  return column == (max - 1);
}

function clusterContains(position: Position, cluster: Cluster) {
  for (var clust in cluster.positions) {
    if (cluster.positions[clust].row === position.row && cluster.positions[clust].column === position.column) {
      return true;
    }
  }
  return false;
}

