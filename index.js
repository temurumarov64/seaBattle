let userName = prompt("Ваше имя?");
let userNameId = document.getElementById("userName");
const node = document.createTextNode(`Welcome, ${userName}`);
userNameId.appendChild(node);
class SeaBattle {
  constructor(gameAreaId) {
    this.gameGrid = document.getElementById(gameAreaId);

    this.boarderWidth = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    this.boarderHeight = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

    this.CELL_OCCUPIED = 1;
    this.CELL_EMPTY = 0;
    this.pcShotDelay = 1500;

    this.shipsConfiguration = [
      { maxShips: 1, pointCount: 4 },
      { maxShips: 2, pointCount: 3 },
      { maxShips: 3, pointCount: 2 },
      { maxShips: 4, pointCount: 1 },
    ];

    this.requiredHits = this.shipsConfiguration.reduce((total, config) => {
      return total + config.maxShips * config.pointCount;
    }, 0);
  }

  run() {
    this.buildToolbar();
    this.buildGameFields();
    this.buildFooter();
    this.startNewGame();
  }

  buildToolbar() {
    this.toolbar = document.createElement("div");
    this.difficultybar = document.createElement("div");
    this.toolbar.setAttribute("class", "toolbar");
    this.gameGrid.appendChild(this.toolbar);
  }

  buildGameFields() {
    let userGameArea = document.createElement("div");
    userGameArea.setAttribute("class", "userGameArea");
    this.gameGrid.appendChild(userGameArea);

    let pcGameArea = document.createElement("div");
    pcGameArea.setAttribute("class", "pcGameArea");
    this.gameGrid.appendChild(pcGameArea);

    this.pcStatus = document.createElement("div");
    pcGameArea.appendChild(this.pcStatus);

    this.userStatus = document.createElement("div");
    userGameArea.appendChild(this.userStatus);

    this.pcGameField = document.createElement("div");
    this.pcGameField.setAttribute("class", "gameField");
    this.userGameField = document.createElement("div");
    this.userGameField.setAttribute("class", "gameField");
    pcGameArea.appendChild(this.pcGameField);
    userGameArea.appendChild(this.userGameField);
  }

  buildFooter() {
    let footer = document.createElement("div");
    footer.setAttribute("class", "footer");

    this.startGameButton = document.createElement("button");
    this.startGameButton.innerHTML = "Start Game";
    this.startGameButton.addEventListener("click", () => this.startNewGame());

    footer.appendChild(this.startGameButton);
    this.gameGrid.appendChild(footer);
  }

  startNewGame() {
    this.startGameButton.innerHTML = "Новая игра";
    this.pcStatus.innerHTML = "Поле соперника";
    this.userStatus.innerHTML = "Ваше поле";

    this._pcShipGrid = this.generateRandomShipMap();
    this._userShipGrid = this.generateRandomShipMap();

    this._pcShotMap = this.generateShotMap();
    this._userHits = 0;
    this._pcHits = 0;
    this._gameStopped = false;
    this._pcGoing = false;

    this.drawGameCells();
    this.updateToolbar();
  }

  stopGame() {
    this._gameStopped = true;
    this._pcGoing = false;
    this.startGameButton.innerHTML = "Сыграть еще раз";
    this.updateToolbar();
  }

  isGameStopped() {
    return this._gameStopped;
  }

  getFireSuccessTemplate() {
    return "X";
  }

  getFireFailTemplate() {
    return "O";
  }

  drawGameCells() {
    for (let rowIndex = 0; rowIndex < this.boarderHeight.length; rowIndex++) {
      for (
        let columnIndex = 0;
        columnIndex < this.boarderWidth.length;
        columnIndex++
      ) {
        const pcFieldSquare = this.obtainOrCreateBlock(rowIndex, columnIndex);
        pcFieldSquare.onclick = (e) => {
          this.userFire(e);
        };
        const userFieldSquare = this.obtainOrCreateBlock(
          rowIndex,
          columnIndex,
          "user"
        );
        if (this._userShipGrid[rowIndex][columnIndex] === this.CELL_OCCUPIED) {
          userFieldSquare.setAttribute("class", "ship");
        }
      }
    }
  }

  obtainOrCreateBlock(rowIndex, columnIndex, type) {
    const id = this.getPointBlockIdByCoords(rowIndex, columnIndex, type);

    let block = document.getElementById(id);

    if (block) {
      block.innerHTML = "";
      block.setAttribute("class", "");
    } else {
      block = document.createElement("div");
      block.setAttribute("id", id);
      block.setAttribute("data-x", columnIndex);
      block.setAttribute("data-y", rowIndex);
      if (type && type === "user") {
        this.userGameField.appendChild(block);
      } else {
        this.pcGameField.appendChild(block);
      }
    }

    block.style.width = `${100 / this.boarderHeight.length}%`;

    if (!this._blockHeight) {
      this._blockHeight = block.clientWidth;
    }

    block.style.height = `${this._blockHeight}px`;
    block.style.lineHeight = `${this._blockHeight}px`;
    block.style.fontSize = `${this._blockHeight}px`;

    return block;
  }

  getPointBlockIdByCoords(rowIndex, columnIndex, type) {
    const prefix = type && type === "user" ? "user" : "pc";

    return `${prefix}_x${columnIndex}_y${rowIndex}`;
  }

  generateShotMap() {
    const map = [];

    for (let rowIndex = 0; rowIndex < this.boarderHeight.length; rowIndex++) {
      for (
        let columnIndex = 0;
        columnIndex < this.boarderWidth.length;
        columnIndex++
      ) {
        map.push({ y: rowIndex, x: columnIndex });
      }
    }
    return map;
  }

  generateRandomShipMap() {
    const map = [];

    for (
      let rowIndex = -1;
      rowIndex < this.boarderHeight.length + 1;
      rowIndex++
    ) {
      map[rowIndex] = [];
      for (
        let columnIndex = -1;
        columnIndex < this.boarderWidth.length + 1;
        columnIndex++
      ) {
        map[rowIndex][columnIndex] = this.CELL_EMPTY;
      }
    }
    const shipsConfiguration = JSON.parse(
      JSON.stringify(this.shipsConfiguration)
    );

    for (const shipConfig of shipsConfiguration) {
      for (let i = 0; i < shipConfig.maxShips; i++) {
        let shipPlaced = false;

        while (!shipPlaced) {
          const columnIndex = this.getRandomInt(0, this.boarderWidth.length);
          const rowIndex = this.getRandomInt(0, this.boarderHeight.length);

          if (this.isPointFree(map, columnIndex, rowIndex)) {
            const pointCount = shipConfig.pointCount;

            if (
              this.canPutHorizontal(
                map,
                columnIndex,
                rowIndex,
                pointCount,
                this.boarderWidth.length
              )
            ) {
              for (let j = 0; j < pointCount; j++) {
                map[rowIndex][columnIndex + j] = this.CELL_OCCUPIED;
              }
              shipPlaced = true;
            } else if (
              this.canPutVertical(
                map,
                columnIndex,
                rowIndex,
                pointCount,
                this.boarderHeight.length
              )
            ) {
              for (let j = 0; j < pointCount; j++) {
                map[rowIndex + j][columnIndex] = this.CELL_OCCUPIED;
              }
              shipPlaced = true;
            }
          }
        }
      }
    }

    return map;
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  isPointFree(map, columnIndex, rowIndex) {
    const surroundingCoordinates = [
      { x: columnIndex, y: rowIndex },
      { x: columnIndex - 1, y: rowIndex },
      { x: columnIndex - 1, y: rowIndex + 1 },
      { x: columnIndex, y: rowIndex + 1 },
      { x: columnIndex + 1, y: rowIndex + 1 },
      { x: columnIndex + 1, y: rowIndex },
      { x: columnIndex + 1, y: rowIndex - 1 },
      { x: columnIndex, y: rowIndex - 1 },
      { x: columnIndex - 1, y: rowIndex - 1 },
    ];

    for (const { x, y } of surroundingCoordinates) {
      if (map[y][x] !== this.CELL_EMPTY) {
        return false;
      }
    }

    return true;
  }

  canPutHorizontal(map, columnIndex, rowIndex, shipLength, coordLength) {
    let freePoints = 0;

    for (let x = columnIndex; x < coordLength; x++) {
      const surroundingCoordinates = [
        { x: x, y: rowIndex },
        { x: x, y: rowIndex - 1 },
        { x: x + 1, y: rowIndex - 1 },
        { x: x + 1, y: rowIndex },
        { x: x + 1, y: rowIndex + 1 },
        { x: x, y: rowIndex + 1 },
      ];

      let isFree = true;
      for (const { x, y } of surroundingCoordinates) {
        if (map[y][x] !== this.CELL_EMPTY) {
          isFree = false;
          break;
        }
      }

      if (isFree) {
        freePoints++;
      } else {
        break;
      }
    }

    return freePoints >= shipLength;
  }

  canPutVertical(map, columnIndex, rowIndex, shipLength, coordLength) {
    let freePoints = 0;

    for (let y = rowIndex; y < coordLength; y++) {
      const surroundingCoordinates = [
        { x: columnIndex, y: y },
        { x: columnIndex + 1, y: y },
        { x: columnIndex + 1, y: y + 1 },
        { x: columnIndex, y: y + 1 },
        { x: columnIndex - 1, y: y },
        { x: columnIndex - 1, y: y - 1 },
      ];

      let isFree = true;
      for (const { x, y } of surroundingCoordinates) {
        if (map[y][x] !== this.CELL_EMPTY) {
          isFree = false;
          break;
        }
      }

      if (isFree) {
        freePoints++;
      } else {
        break;
      }
    }

    return freePoints >= shipLength;
  }

  userFire(event) {
    if (this.isGameStopped() || this.isPCGoing()) {
      return;
    }

    const { target } = event;
    const x = target.dataset.x;
    const y = target.dataset.y;

    if (this._pcShipGrid[y][x] === this.CELL_EMPTY) {
      target.innerHTML = this.getFireFailTemplate();
      this.prepareToPcFire();
    } else {
      target.innerHTML = this.getFireSuccessTemplate();
      target.classList.add("ship");
      this._userHits++;
      this.updateToolbar();

      if (this._userHits >= this.requiredHits) {
        this.stopGame();
      }
    }
    target.onclick = null;
  }

  isPCGoing() {
    return this._pcGoing;
  }

  prepareToPcFire() {
    this._pcGoing = true;
    this.updateToolbar();
    setTimeout(() => {
      this.pcFire();
    }, this.pcShotDelay);
  }

  takeRandomShot() {
    const randomShotIndex = this.getRandomInt(0, this._pcShotMap.length);
    const nextShot = this._pcShotMap[randomShotIndex];
    this._pcShotMap.splice(randomShotIndex, 1);
    return nextShot;
  }

  pcFire() {
    if (this.isGameStopped()) {
      return;
    }

    let nextShot;

    if (!this._previousHit) {
      nextShot = this.takeRandomShot();
    } else {
      const { y, x } = this._previousHit;
      const neighbors = [];
      const possibleNeighbors = [
        { y: y - 1, x },
        { y: y + 1, x },
        { y, x: x - 1 },
        { y, x: x + 1 },
      ];

      for (const neighbor of possibleNeighbors) {
        if (
          this._pcShotMap.some(
            (coord) => coord.y === neighbor.y && coord.x === neighbor.x
          )
        ) {
          neighbors.push(neighbor);
        }
      }

      if (neighbors.length > 0) {
        const randomNeighborIndex = this.getRandomInt(0, neighbors.length);
        nextShot = neighbors[randomNeighborIndex];
        const nextShotIndex = this._pcShotMap.findIndex(
          (coord) => coord.y === nextShot.y && coord.x === nextShot.x
        );
        this._pcShotMap.splice(nextShotIndex, 1);
      } else {
        this._previousHit = null;
        nextShot = this.takeRandomShot();
      }
    }

    const firedEl = document.getElementById(
      this.getPointBlockIdByCoords(nextShot.y, nextShot.x, "user")
    );

    if (this._userShipGrid[nextShot.y][nextShot.x] === this.CELL_EMPTY) {
      this._pcGoing = false;
      this.updateToolbar();
      firedEl.innerHTML = this.getFireFailTemplate();
    } else {
      firedEl.innerHTML = this.getFireSuccessTemplate();
      this._previousHit = nextShot;

      const diagonalCells = [
        { y: nextShot.y - 1, x: nextShot.x - 1 },
        { y: nextShot.y - 1, x: nextShot.x + 1 },
        { y: nextShot.y + 1, x: nextShot.x - 1 },
        { y: nextShot.y + 1, x: nextShot.x + 1 },
      ];

      for (const cell of diagonalCells) {
        const cellIndex = this._pcShotMap.findIndex(
          (coord) => coord.y === cell.y && coord.x === cell.x
        );
        if (cellIndex !== -1) {
          this._pcShotMap.splice(cellIndex, 1);
        }
      }

      this._pcHits++;
      this.updateToolbar();

      if (this._pcHits >= this.requiredHits) {
        this.stopGame();
      } else {
        this.prepareToPcFire();
      }
    }
  }

  updateToolbar() {
    this.toolbar.innerHTML = `Счет - ${this._userHits} : ${this._pcHits}`;
    if (this.isGameStopped()) {
      if (this._userHits >= this.requiredHits) {
        this.toolbar.innerHTML += ", Вы победили!";
      } else {
        this.toolbar.innerHTML += ", Вы проиграли...";
      }
    } else if (this.isPCGoing()) {
      this.toolbar.innerHTML += ", ход соперника.";
    } else {
      this.toolbar.innerHTML += ",  ваш ход.";
    }
  }
}
