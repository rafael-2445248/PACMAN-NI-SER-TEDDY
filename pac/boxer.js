// Game Variables
let playerHP = 100;
let enemyHP = 100;
let isDodging = false;
let isEnemyAttacking = false;
let gameOver = false;

// Grab HTML elements
const playerBox = document.getElementById("player");
const enemyBox = document.getElementById("enemy");
const messageText = document.getElementById("message");
const restartBtn = document.getElementById("restart-btn");

// 1. Player Punch Function
function punch() {
    if (gameOver || isDodging) return;

    // Move player forward briefly
    playerBox.style.bottom = "80px";
    setTimeout(() => {
        playerBox.style.bottom = "20px";
    }, 150);

    // Check if enemy is winding up an attack (counter punch!)
    if (isEnemyAttacking) {
        enemyHP -= 15;
        messageText.innerText = "COUNTER PUNCH! Critical hit!";
    } else {
        enemyHP -= 10;
        messageText.innerText = "Nice jab!";
    }

    // Flash enemy white when hit
    enemyBox.style.backgroundColor = "white";
    setTimeout(() => {
        enemyBox.style.backgroundColor = "#e74c3c";
    }, 100);

    updateHealth();
}

// 2. Dodge Functions
function dodgeLeft() {
    if (gameOver || isDodging) return;
    isDodging = true;
    playerBox.style.left = "40px"; // Move left
    
    setTimeout(() => {
        playerBox.style.left = "140px"; // Return to center
        isDodging = false;
    }, 500);
}

function dodgeRight() {
    if (gameOver || isDodging) return;
    isDodging = true;
    playerBox.style.left = "240px"; // Move right
    
    setTimeout(() => {
        playerBox.style.left = "140px"; // Return to center
        isDodging = false;
    }, 500);
}

// 3. Enemy AI Loop (Attacks every 2.5 seconds)
setInterval(() => {
    if (gameOver) return;

    // Step 1: Enemy warns the player (turns yellow)
    isEnemyAttacking = true;
    enemyBox.style.backgroundColor = "yellow";
    messageText.innerText = "Enemy is winding up! DODGE!";

    // Step 2: Enemy swings after 0.8 seconds
    setTimeout(() => {
        if (gameOver) return;
        
        enemyBox.style.top = "120px"; // Lunge forward
        
        // Check if player dodged in time
        if (isDodging) {
            messageText.innerText = "You dodged the attack!";
        } else {
            playerHP -= 20;
            messageText.innerText = "OUCH! You got hit!";
        }
        
        updateHealth();

        // Step 3: Reset enemy position
        setTimeout(() => {
            enemyBox.style.top = "40px";
            enemyBox.style.backgroundColor = "#e74c3c";
            isEnemyAttacking = false;
        }, 300);

    }, 800);

}, 2500);

// 4. Update Health Bars & Check Win/Loss
function updateHealth() {
    if (playerHP < 0) playerHP = 0;
    if (enemyHP < 0) enemyHP = 0;

    document.getElementById("player-hp-text").innerText = playerHP;
    document.getElementById("enemy-hp-text").innerText = enemyHP;

    document.getElementById("player-health").style.width = playerHP + "%";
    document.getElementById("enemy-health").style.width = enemyHP + "%";

    if (enemyHP === 0) {
        messageText.innerText = "KNOCKOUT! YOU WIN!";
        endGame();
    } else if (playerHP === 0) {
        messageText.innerText = "TKO! YOU LOSE!";
        endGame();
    }
}

function endGame() {
    gameOver = true;
    restartBtn.style.display = "inline-block";
}

function restartGame() {
    playerHP = 100;
    enemyHP = 100;
    gameOver = false;
    isDodging = false;
    isEnemyAttacking = false;
    messageText.innerText = "Fight!";
    restartBtn.style.display = "none";
    updateHealth();
}

// 5. Keyboard Controls
document.addEventListener("keydown", (event) => {
    if (event.code === "Space") punch();
    if (event.key === "a" || event.key === "A" || event.key === "ArrowLeft") dodgeLeft();
    if (event.key === "d" || event.key === "D" || event.key === "ArrowRight") dodgeRight();
});