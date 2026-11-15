let board;
let container;
const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const boardWidth = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
let context;

const SPRITES = {
    blue:   { U: 'Inky-Up.gif',   D: 'Inky-Down.gif',   L: 'Inky-Left.gif',   R: 'Inky-RIght.gif' },
    orange: { U: 'Clyde-Up.gif',  D: 'Clyde-Down.gif',  L: 'Clyde-Left.gif',  R: 'Clyde-Right.gif' },
    red:    { U: 'Blinky-Up.gif', D: 'Blinky-Down.gif', L: 'Blinky-Left.gif', R: 'Blinky-Right.gif' },
    pink:   { U: 'Pinky-Up.gif',  D: 'Pinky-Down.gif',  L: 'Pinky-Left.gif',  R: 'Pinky-Right.gif' },
    pacman: { U: 'Pac-Man-Up.gif', D: 'Pac-Man - Down.gif', L: 'Pac-Man - left.gif', R: 'Pac-Man - Right.gif' }
};

let wallImg;

const tileMap = [
    "XXXXXXXXXXXXXXXXXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X                 X",
    "X XX X XXXXX X XX X",
    "X    X       X    X",
    "XXXX XXXX XXXX XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXrXX X XXXX",
    "O       bpo       O",
    "XXXX X XXXXX X XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXXXX X XXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X  X     P     X  X",
    "XX X X XXXXX X X XX",
    "X    X   X   X    X",
    "X XXXXXX X XXXXXX X",
    "X                 X",
    "XXXXXXXXXXXXXXXXXXX"
];

const walls = new Set();
const foods = new Set();
const ghosts = new Set();
let pacman;

const directions = ['U', 'D', 'L', 'R'];
let score = 0;
let lives = 3;
let gameOver = false;
let foodEatenCount = 0;

let ghostEatingActive = false;
let ghostEatingTimer = 0;

let ghostBypassActive = false;
let ghostBypassTimer = 0;

let cooldownTimer = 0;

window.onload = function () {
    container = document.getElementById("game-container");
    board = document.getElementById("Board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    wallImg = new Image();
    wallImg.src = 'wall.png';

    layMap();

    for (let ghost of ghosts.values()) {
        const newDirection = directions[Math.floor(Math.random() * 4)];
        ghost.updateDirection(newDirection);
    }

    update();
    document.addEventListener("keydown", handleKeydown);
};

function layMap() {
    document.querySelectorAll('.sprite').forEach(el => el.remove());

    walls.clear();
    foods.clear();
    ghosts.clear();
    foodEatenCount = 0;
    ghostEatingActive = false;
    ghostBypassActive = false;
    cooldownTimer = 0;

    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const tileMapChar = tileMap[r][c];
            const x = c * tileSize;
            const y = r * tileSize;

            if (tileMapChar == 'X') {
                walls.add(new Block(null, x, y, tileSize, tileSize, 'wall'));
            } else if (tileMapChar == 'b') {
                ghosts.add(new Block(SPRITES.blue.U, x, y, tileSize, tileSize, 'blue'));
            } else if (tileMapChar == 'o') {
                ghosts.add(new Block(SPRITES.orange.U, x, y, tileSize, tileSize, 'orange'));
            } else if (tileMapChar == 'p') {
                ghosts.add(new Block(SPRITES.pink.U, x, y, tileSize, tileSize, 'pink'));
            } else if (tileMapChar == 'r') {
                ghosts.add(new Block(SPRITES.red.U, x, y, tileSize, tileSize, 'red'));
            } else if (tileMapChar == 'P') {
                pacman = new Block(SPRITES.pacman.R, x, y, tileSize, tileSize, 'pacman');
            } else if (tileMapChar == ' ') {
                foods.add(new Block(null, x + 14, y + 14, 4, 4, 'food'));
            }
        }
    }
}

function update() {
    if (gameOver) return;
    checkGamepad();
    
    if (ghostEatingActive) {
        ghostEatingTimer--;
        if (ghostEatingTimer <= 0) {
            ghostEatingActive = false;
            cooldownTimer = 200;
            for (let ghost of ghosts.values()) {
                ghost.setSprite(ghost.direction);
            }
        }
    }

    if (ghostBypassActive) {
        ghostBypassTimer--;
        if (ghostBypassTimer <= 0) {
            ghostBypassActive = false;
            cooldownTimer = 200;
        }
    }

    if (!ghostEatingActive && !ghostBypassActive && cooldownTimer > 0) {
        cooldownTimer--;
    }

    move();
    draw();
    setTimeout(update, 50);
}

function draw() {
    context.clearRect(0, 0, board.width, board.height);

    for (let wall of walls.values()) {
        if (wallImg.complete && wallImg.naturalWidth !== 0) {
            context.drawImage(wallImg, wall.x, wall.y, wall.width, wall.height);
        } else {
            context.fillStyle = "#1919A6";
            context.fillRect(wall.x, wall.y, wall.width, wall.height);
        }
    }

    context.fillStyle = "white";
    for (let food of foods.values()) {
        context.fillRect(food.x, food.y, food.width, food.height);
    }

    pacman.syncElement();
    for (let ghost of ghosts.values()) {
        ghost.syncElement();
    }

    context.fillStyle = "white";
    context.font = "16px sans-serif";
    
    if (gameOver) {
        context.fillText("GAME OVER", boardWidth / 2 - 45, boardHeight / 2);
    } else {
        let statusText = `x${lives}  Score: ${score}  Food: ${foodEatenCount}/20`;
        
        if (ghostEatingActive) {
            statusText += ` | Active: Eat Ghosts (${Math.ceil(ghostEatingTimer / 20)}s)`;
        } else if (ghostBypassActive) {
            statusText += ` | Active: Bypass Ghosts (${Math.ceil(ghostBypassTimer / 20)}s)`;
        } else if (cooldownTimer > 0) {
            statusText += ` | Cooldown: ${Math.ceil(cooldownTimer / 20)}s`;
        } else {
            if (foodEatenCount >= 10 && foodEatenCount < 20) {
                statusText += ` | [Press X]`;
            } else if (foodEatenCount >= 20) {
                statusText += ` | [Press X or R1]`;
            }
        }

        context.fillText(statusText, tileSize / 2, tileSize / 2);
    }
}

function move() {
    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;

    if (pacman.x < 0) pacman.x = boardWidth - tileSize;
    else if (pacman.x >= boardWidth) pacman.x = 0;

    for (let wall of walls.values()) {
        if (collision(pacman, wall)) {
            pacman.x -= pacman.velocityX;
            pacman.y -= pacman.velocityY;
            break;
        }
    }

    for (let ghost of ghosts.values()) {
        if (collision(ghost, pacman)) {
            if (ghostEatingActive) {
                ghost.reset();
                score += 200;
            } else if (!ghostBypassActive) {
                lives -= 1;
                if (lives == 0) {
                    gameOver = true;
                    if (pacman.el) {
                        pacman.el.src = 'Pac-Man-Death Animation.gif';
                    }
                    draw();
                    return;
                }
                resetPositions();
            }
        }

        if (ghost.y == tileSize * 9 && ghost.direction != 'U' && ghost.direction != 'D') {
            ghost.updateDirection('U');
        }

        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;

        for (let wall of walls.values()) {
            if (collision(ghost, wall) || ghost.x <= 0 || ghost.x + ghost.width >= boardWidth) {
                ghost.x -= ghost.velocityX;
                ghost.y -= ghost.velocityY;
                const newDirection = directions[Math.floor(Math.random() * 4)];
                ghost.updateDirection(newDirection);
            }
        }
    }

    let foodEaten = null;
    for (let food of foods.values()) {
        if (collision(pacman, food)) {
            foodEaten = food;
            score += 10;
            foodEatenCount++;
            break;
        }
    }
    foods.delete(foodEaten);

    if (foods.size == 0) {
        layMap();
        resetPositions();
    }
}

function triggerGhostEating() {
    if (foodEatenCount >= 10 && !ghostEatingActive && !ghostBypassActive && cooldownTimer <= 0) {
        ghostEatingActive = true;
        ghostEatingTimer = 200;
        for (let ghost of ghosts.values()) {
            if (ghost.el) {
                ghost.el.src = 'Pac-Man - Scared Ghost.gif';
            }
        }
    }
}

function triggerGhostBypass() {
    if (foodEatenCount >= 20 && !ghostEatingActive && !ghostBypassActive && cooldownTimer <= 0) {
        ghostBypassActive = true;
        ghostBypassTimer = 200;
    }
}

function handleKeydown(e) {
    if (gameOver) {
        restartGame();
        return;
    }

    if (e.code == "ArrowUp" || e.code == "KeyW") pacman.updateDirection('U');
    else if (e.code == "ArrowDown" || e.code == "KeyS") pacman.updateDirection('D');
    else if (e.code == "ArrowLeft" || e.code == "KeyA") pacman.updateDirection('L');
    else if (e.code == "ArrowRight" || e.code == "KeyD") pacman.updateDirection('R');
    else if (e.code == "KeyX" || e.code == "Space") triggerGhostEating();
    else if (e.code == "KeyE" || e.code == "KeyR") triggerGhostBypass();
}

let lastButtonState = {};
function checkGamepad() {
    const gamepads = navigator.getGamepads();
    if (!gamepads || !gamepads[0]) return;
    const gp = gamepads[0];
    const threshold = 0.5;

    if (gp.buttons[12].pressed || gp.axes[1] < -threshold) pacman.updateDirection('U');
    else if (gp.buttons[13].pressed || gp.axes[1] > threshold) pacman.updateDirection('D');
    else if (gp.buttons[14].pressed || gp.axes[0] < -threshold) pacman.updateDirection('L');
    else if (gp.buttons[15].pressed || gp.axes[0] > threshold) pacman.updateDirection('R');

    if (gp.buttons[0].pressed) {
        if (!lastButtonState.xPressed) triggerGhostEating();
        lastButtonState.xPressed = true;
    } else {
        lastButtonState.xPressed = false;
    }

    if (gp.buttons[5].pressed) {
        if (!lastButtonState.r1Pressed) triggerGhostBypass();
        lastButtonState.r1Pressed = true;
    } else {
        lastButtonState.r1Pressed = false;
    }

    if (gameOver && (gp.buttons[0].pressed || gp.buttons[9].pressed)) {
        if (!lastButtonState.restartPressed) restartGame();
        lastButtonState.restartPressed = true;
    } else {
        lastButtonState.restartPressed = false;
    }
}

function restartGame() {
    layMap();
    resetPositions();
    lives = 3;
    score = 0;
    gameOver = false;
    update();
}

function collision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function resetPositions() {
    pacman.reset();
    pacman.velocityX = 0;
    pacman.velocityY = 0;
    for (let ghost of ghosts.values()) {
        ghost.reset();
        const newDirection = directions[Math.floor(Math.random() * 4)];
        ghost.updateDirection(newDirection);
    }
}

class Block {
    constructor(spriteSrc, x, y, width, height, type = '') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.startX = x;
        this.startY = y;
        this.direction = 'R';
        this.velocityX = 0;
        this.velocityY = 0;

        if (spriteSrc && SPRITES[type]) {
            this.el = document.createElement('img');
            this.el.src = spriteSrc;
            this.el.className = 'sprite';
            container.appendChild(this.el);
            this.syncElement();
        }
    }

    syncElement() {
        if (this.el) {
            this.el.style.left = this.x + 'px';
            this.el.style.top = this.y + 'px';
        }
    }

    setSprite(dir) {
        if (this.el && SPRITES[this.type] && SPRITES[this.type][dir]) {
            if (this.type !== 'pacman' && ghostEatingActive) {
                this.el.src = 'Pac-Man - Scared Ghost.gif';
                return;
            }
            const nextSrc = SPRITES[this.type][dir];
            if (!this.el.src.endsWith(encodeURI(nextSrc))) {
                this.el.src = nextSrc;
            }
        }
    }

    updateDirection(direction) {
        const prevDirection = this.direction;
        this.direction = direction;
        this.updateVelocity();
        this.x += this.velocityX;
        this.y += this.velocityY;

        for (let wall of walls.values()) {
            if (collision(this, wall)) {
                this.x -= this.velocityX;
                this.y -= this.velocityY;
                this.direction = prevDirection;
                this.updateVelocity();
                return;
            }
        }
        this.setSprite(this.direction);
    }

    updateVelocity() {
        const speed = tileSize / 4;
        if (this.direction == 'U') { this.velocityX = 0; this.velocityY = -speed; }
        else if (this.direction == 'D') { this.velocityX = 0; this.velocityY = speed; }
        else if (this.direction == 'L') { this.velocityX = -speed; this.velocityY = 0; }
        else if (this.direction == 'R') { this.velocityX = speed; this.velocityY = 0; }
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.syncElement();
        if (this.el && SPRITES[this.type]) {
            this.setSprite(this.direction);
        }
    }
}