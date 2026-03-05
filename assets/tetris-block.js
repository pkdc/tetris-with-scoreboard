"use strict";
import {nextRound} from './scoreboard.js';
import Block from './block.js';

// Next piece queue
let nextPieceData = null;

class tetrisBlock {
    constructor(x1, y1, x2, y2, x3, y3, x4, y4, blockColour, shape, locked, end) {
        this.blocks = [
          new Block(x1, y1),
          new Block(x2, y2),
          new Block(x3, y3),
          new Block(x4, y4),
        ]
        this.blockColour = blockColour;
        this.shape = shape;
        this.locked = locked;
        this.end = end;
        this.rotation = 0; // 0, 90, 180, 270 degrees
      }

      // get getBlock1() {return {x: _x1, y: _y1};}
      // get getBlock2() {return {x: _x2, y: _y2};}
      // get getBlock3() {return {x: _x3, y: _y3};}
      // get getBlock4() {return {x: _x4, y: _y4};}
      // get getShape() {return _shape;}

      // set setBlock1({x, y}) {
      //   this._x1 = x;
      //   this._y1 = y;
      // }
      // set setBlock2({x, y}) {
      //   this._x2 = x;
      //   this._y2 = y;
      // }
      // set setBlock3({x, y}) {
      //   this._x3 = x;
      //   this._y3 = y;
      // }
      // set setBlock4({x, y}) {
      //   this._x4 = x;
      //   this._y4 = y;
      // }
      // set setCanMove(able) {
      //   this._canMove = able;
      // }

      get endGame() {
        // console.log("get end", this.end);
        return this.end;
      }

      // for optimisation purposes
      get endSoon() {
        return this.soon;
      }

      // slowFall
      fall(curBlocks, gameBoard) {
        let collide = this.blocks.some((block) => {
          let nextBlock = document.querySelector(`.x-${block.x}.y-${block.y+1}`);
          return nextBlock && nextBlock.classList.contains("occupied");
        });

        console.log("collided", collide);

        if (collide && this.blocks.some(block => block.y <= 0)) {
          // end the game
          this.end = true;
          console.log("Game over", "end: ", this.end);
          return;
        }

        if (collide && this.blocks.some(block => block.y === 1)) {
          this.soon = true;
          console.log("ending soon", "soon: ", this.soon);
        }

        // lock the blocks if collided or reached the bottom
        if (this.blocks.some(block => block.y >= gameBoard.getMaxY-1 || collide)) {
          // console.log("can't move");
          this.locked = true;

          this.blocks.forEach((block) => {
            let domBlock = document.querySelector(`.x-${block.x}.y-${block.y}`);
            domBlock.classList.add("occupied");
            domBlock.style.background = this.blockColour;
          });

          // console.log(this.locked);
          const returnBlocks = tetrisBlock.newBlocks(curBlocks, gameBoard);

          return returnBlocks;
        }

        // remove the prev occupied class after moving out the pixel
        // move the blocks down by 1
        this.blocks.forEach((block) => {
          let prevDomBlock = document.querySelector(`.x-${block.x}.y-${block.y}`);
          if (prevDomBlock) {
            prevDomBlock.classList.remove("occupied");
          }
          block.y += 1;
        });

        return;
      }

      // check if there is a wall next to it
      mvRight(maxX) {
        if (this.blocks.some(block => block.x === maxX-1)) {
          return;
        }

        // check if there is another block
        let nextBlockArr = this.blocks.map(block => document.querySelector(`.x-${block.x+1}.y-${block.y}`));

        if (nextBlockArr.some((el) => el.classList.contains("occupied"))) {
          return;
        }

        // move right
        this.blocks.forEach(block => {
          block.x += 1;
        });
      }

      mvLeft() {
        // check if there is a wall next to it
        if (this.blocks.some(block => block.x === 0)) {
          return;
        }

        // check if there is another block
        let nextBlockArr = this.blocks.map(block => document.querySelector(`.x-${block.x-1}.y-${block.y}`))

        if (nextBlockArr.some((el) => el.classList.contains("occupied"))) {
          return;
        }

        // move left
        this.blocks.forEach(block => {
          block.x -= 1;
        });
      }

      erase() {
        // Erase ghost first
        this.eraseGhost();
        this.blocks.forEach((block => {
          let domBlock = document.querySelector(`.x-${block.x}.y-${block.y}`)
          if (domBlock) {
            domBlock.style.background = "var(--grey)";
            domBlock.classList.remove("active-piece");
          }
        }))
      }

      colour() {
        // Draw ghost first (so it's behind)
        this.drawGhost();
        this.blocks.forEach((block) => {
          let domBlock = document.querySelector(`.x-${block.x}.y-${block.y}`);
          if (domBlock) {
            domBlock.style.background = this.blockColour;
            domBlock.classList.add("active-piece");
          }
        });
      }

      // Ghost piece - shows where block will land
      getGhostPositions() {
        let ghostBlocks = this.blocks.map(b => ({x: b.x, y: b.y}));
        let canDrop = true;
        while (canDrop) {
          for (const block of ghostBlocks) {
            const nextY = block.y + 1;
            const nextEl = document.querySelector(`.x-${block.x}.y-${nextY}`);
            if (!nextEl || (nextEl.classList.contains("occupied") && !this.blocks.some(b => b.x === block.x && b.y === nextY))) {
              canDrop = false;
              break;
            }
          }
          if (canDrop) {
            ghostBlocks.forEach(b => b.y += 1);
          }
        }
        return ghostBlocks;
      }

      drawGhost() {
        const ghostPositions = this.getGhostPositions();
        ghostPositions.forEach(pos => {
          const domBlock = document.querySelector(`.x-${pos.x}.y-${pos.y}`);
          if (domBlock && !this.blocks.some(b => b.x === pos.x && b.y === pos.y)) {
            domBlock.classList.add("ghost-piece");
            domBlock.style.setProperty("--ghost-color", this.blockColour);
          }
        });
      }

      eraseGhost() {
        document.querySelectorAll(".ghost-piece").forEach(el => {
          el.classList.remove("ghost-piece");
          el.style.removeProperty("--ghost-color");
          if (!el.classList.contains("occupied") && !el.classList.contains("active-piece")) {
            el.style.background = "var(--grey)";
          }
        });
      }

      rotate(gameBoard) {
        // console.log("in rotate function");
        let canRotate = true;

        // Determine New Positions for the Rectangle
        let newPostions = [];

        if (this.shape === "rect") {
          console.log("try to rotate rect");
          const centreX = Math.floor(this.blocks.reduce((sum, block) => sum + block.x, 0)/4); // AvgX
          const centreY = Math.floor(this.blocks.reduce((sum, block) => sum + block.y, 0)/4); // AvgY

          this.blocks.forEach(block => {
            // rotate from horizontal to vertical
            if (this.rotation === 0 || this.rotation === 180) {
              newPostions.push({x: centreX, y: centreY - (block.x - centreX)});
            } else { // rotate from vertical to horizontal
              newPostions.push({x: centreX - (block.y - centreY), y: centreY});
            }
          });
        } else {
          console.log("try to rotate other shapes");
          const pivotX = this.blocks[1].x;
          const pivotY = this.blocks[1].y;

          newPostions = this.blocks.map(block => {
            // rotate 90 degrees clockwise
            // const xOffset = block.x - pivotX;
            // const yOffset = block.y - pivotY;

            // from simultaneous equation
            // xn = -yo + xp + yp
            // yn = xo - xp + yp
            return {x: -block.y + pivotX + pivotY, y: block.x - pivotX + pivotY};
          });
        }

        // check if the new positions have no collision and out of bounds
        canRotate = newPostions.every(newPos => {
          return (
            newPos.x >= 0 &&
            newPos.x <= gameBoard.getMaxX-1 &&
            newPos.y >= 0 &&
            newPos.y <= gameBoard.getMaxY-1 &&
            !document.querySelector(`.x-${newPos.x}.y-${newPos.y}`).classList.contains("occupied")
          );
        });

        // Apply the rotation
        if (canRotate) {
          this.blocks.forEach((block, i) => {
            block.x = newPostions[i].x;
            block.y = newPostions[i].y;
          });
          this.rotation = (this.rotation + 90) % 360;
        }

        this.erase();
        this.colour();
      }

      // Get the shape data for a given random number (used for preview)
      static getShapeData(rand, maxX) {
        let x1, y1, x2, y2, x3, y3, x4, y4, blockColour, shape;

        switch(rand) {
          case 0: // rectangle (I-piece) - Cyan
            x1 = maxX/2 - 2;
            y1 = 0;
            x2 = maxX/2 - 1;
            y2 = 0;
            x3 = maxX/2;
            y3 = 0;
            x4 = maxX/2 + 1;
            y4 = 0;
            blockColour = "#00CED1";
            shape = "rect";
            break;
          case 1: // sq (O-piece) - Golden Yellow
            x1 = maxX/2 - 1;
            y1 = 0;
            x2 = maxX/2;
            y2 = 0;
            x3 = maxX/2 - 1;
            y3 = 1;
            x4 = maxX/2;
            y4 = 1;
            blockColour = "#FFD700";
            shape = "sq";
            break;
          case 2: // L-piece - Orange
            x1 = maxX/2 - 1;
            y1 = 0;
            x2 = maxX/2 - 1;
            y2 = 1;
            x3 = maxX/2 - 1;
            y3 = 2;
            x4 = maxX/2;
            y4 = 2;
            blockColour = "#FF8C00";
            shape = "L";
            break;
          case 3: // T-piece - Orchid Pink
            x1 = maxX/2 - 1;
            y1 = 0;
            x2 = maxX/2;
            y2 = 0;
            x3 = maxX/2 + 1;
            y3 = 0;
            x4 = maxX/2;
            y4 = 1;
            blockColour = "#DA70D6";
            shape = "T";
            break;
          case 4: // Z-piece - Coral Red
            x1 = maxX/2 - 1;
            y1 = 0;
            x2 = maxX/2;
            y2 = 0;
            x3 = maxX/2;
            y3 = 1;
            x4 = maxX/2 + 1;
            y4 = 1;
            blockColour = "#FF6B6B";
            shape = "Z";
            break;
          case 5: // S-piece - Light Green
            x1 = maxX/2 + 1;
            y1 = 0;
            x2 = maxX/2;
            y2 = 0;
            x3 = maxX/2;
            y3 = 1;
            x4 = maxX/2 - 1;
            y4 = 1;
            blockColour = "#90EE90";
            shape = "S";
            break;
          case 6: // J-piece (L-inverse) - Cornflower Blue
            x1 = maxX/2 + 1;
            y1 = 0;
            x2 = maxX/2 + 1;
            y2 = 1;
            x3 = maxX/2 + 1;
            y3 = 2;
            x4 = maxX/2;
            y4 = 2;
            blockColour = "#6495ED";
            shape = "L-inverse";
            break;
        }
        return {x1, y1, x2, y2, x3, y3, x4, y4, blockColour, shape};
      }

      // Generate a random piece number (0-6, all 7 tetrominos)
      static randomPiece() {
        return Math.floor(Math.random() * 7);
      }

      // generate
      static generateTBlock(gameBoard) {
        nextRound(gameBoard);
        const maxX = gameBoard.getMaxX;
        let locked = false;
        let end = false;

        // Use next piece if available, otherwise generate random
        let rand;
        if (nextPieceData !== null) {
          rand = nextPieceData;
        } else {
          rand = tetrisBlock.randomPiece();
        }

        // Generate next piece for preview
        nextPieceData = tetrisBlock.randomPiece();

        const data = tetrisBlock.getShapeData(rand, maxX);
        return [data.x1, data.y1, data.x2, data.y2, data.x3, data.y3, data.x4, data.y4, data.blockColour, data.shape, locked, end];
      }

      // Get next piece info for preview display
      static getNextPieceInfo() {
        if (nextPieceData === null) return null;
        return tetrisBlock.getShapeData(nextPieceData, 6);
      }

      static newBlocks(curBlocks, gameBoard) {
        curBlocks = new tetrisBlock(...tetrisBlock.generateTBlock(gameBoard));
        curBlocks.colour();
        return curBlocks;
    }
};

export default tetrisBlock;

// tetrisBlock.prototype.slowDrop = function() {

// };
// tetrisBlock.prototype.rotate
// tetrisBlock.prototype.moveRight
// tetrisBlock.prototype.moveLeft
// tetrisBlock.prototype.fastDrop

      // fastFall
      // fastFall(maxY) {
      //   console.log(this);
      //   wait = 1000;
      //   if (this.y1 >= maxY-1 || this.y2 >= maxY-1 || this.y3 >= maxY-1 || this.y4 >= maxY-1) {
      //     console.log("bottom reached");
      //     this.canMove = false;
      //     return;
      //   }
      //   // const bStyles = window.getComputedStyle(this);
      //   // const bBGColour = bStyles.getPropertyValue("background");
      //   // if (bBGColour !== "var(--grey)") {
      //     // console.log("another block reached");
      //   // }
      //   // console.log(this.y1);
      //   this.y1 += 1;
      //   this.y2 += 1;
      //   this.y3 += 1;
      //   this.y4 += 1;
      // }