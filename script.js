// ===== Плавное появление секций при скролле =====
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ===== ИГРА: Бесконечный раннер =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('scoreValue');
const gameOverScreen = document.getElementById('gameOverScreen');
const startScreen = document.getElementById('startScreen');
const restartBtn = document.getElementById('restartBtn');
const startBtn = document.getElementById('startBtn');

// Настройка размера канваса
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Переменные игры
let gameRunning = false;
let gameOver = false;
let score = 0;
let frameCount = 0;
let gameSpeed = 4.5;

// Игрок (Кубик) - РАЗМЕР УВЕЛИЧЕН для заметности
const player = {
    x: 60,
    y: 0,
    width: 60,  
    height: 60, 
    vy: 0,
    gravity: 0.65,
    jumpPower: -13, 
    grounded: false,
    image: new Image()
};

// Загрузка изображения игрока
player.image.src = 'https://github.com/vasiilisaax/Scrambled/blob/main/%D0%BA%D1%83%D0%B1%D0%B8%D0%BA%20%D1%80%D1%83%D0%B1%D0%B8%D0%BA%20%D0%BC%D0%B0%D0%BB%D0%B5%D0%BD%D1%8C%D0%BA%D0%B8%D1%86-no-bg-preview%20(carve.photos).png?raw=true';

player.image.onload = () => {
    player.imageLoaded = true;
};
player.image.onerror = () => {
    player.imageLoaded = false;
};

// Препятствия
let obstacles = [];
const groundHeight = 50;

function resetGame() {
    player.y = canvas.height - groundHeight - player.height;
    player.vy = 0;
    player.grounded = true;
    obstacles = [];
    score = 0;
    frameCount = 0;
    gameSpeed = 4.5;
    gameOver = false;
    gameRunning = true;
    scoreEl.textContent = score;
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'none';
    requestAnimationFrame(gameLoop);
}

function jump() {
    if (!gameRunning || gameOver) return;
    if (player.grounded) {
        player.vy = player.jumpPower;
        player.grounded = false;
    }
}

// Управление
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!gameRunning && !gameOver && startScreen.style.display !== 'none') {
            resetGame();
        } else {
            jump();
        }
    }
});

canvas.addEventListener('click', jump);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
}, { passive: false });

startBtn.addEventListener('click', resetGame);
restartBtn.addEventListener('click', resetGame);

function spawnObstacle() {
    // РАЗМЕР ПРЕПЯТСТВИЙ УВЕЛИЧЕН пропорционально игроку
    const size = 45 + Math.random() * 25; 
    obstacles.push({
        x: canvas.width,
        y: canvas.height - groundHeight - size,
        width: size,
        height: size,
        passed: false
    });
}

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем землю
    ctx.fillStyle = '#e4d6b8';
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
    
    // Линия земли
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - groundHeight);
    ctx.lineTo(canvas.width, canvas.height - groundHeight);
    ctx.strokeStyle = 'rgba(90, 70, 50, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Физика игрока
    player.vy += player.gravity;
    player.y += player.vy;

    const groundY = canvas.height - groundHeight - player.height;
    if (player.y >= groundY) {
        player.y = groundY;
        player.vy = 0;
        player.grounded = true;
    }

    // Рисуем игрока с эффектом свечения
    ctx.save();
    ctx.shadowColor = 'rgba(212, 165, 116, 0.9)';
    ctx.shadowBlur = 20; 
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;
    
    if (player.imageLoaded && player.image.complete) {
        ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = '#c9975f';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    ctx.restore();

    // Управление препятствиями
    const spawnRate = Math.max(60, Math.floor(1200 / (gameSpeed * 1.5)));
    if (frameCount % spawnRate === 0) {
        spawnObstacle();
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= gameSpeed;

        // Рисуем препятствие (цвет фона + лёгкая обводка, чтобы было видно)
        ctx.fillStyle = '#fdfbf7'; 
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        
        ctx.strokeStyle = 'rgba(90, 70, 50, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

        // Проверка столкновений (с небольшим допуском для честной игры)
        const padding = 8; 
        if (
            player.x + padding < obs.x + obs.width - padding &&
            player.x + player.width - padding > obs.x + padding &&
            player.y + padding < obs.y + obs.height - padding &&
            player.y + player.height - padding > obs.y + padding
        ) {
            gameOver = true;
            gameRunning = false;
            gameOverScreen.style.display = 'block';
        }

        // Подсчёт очков
        if (!obs.passed && obs.x + obs.width < player.x) {
            score++;
            scoreEl.textContent = score;
            obs.passed = true;
            // Постепенное увеличение сложности
            if (score % 5 === 0) {
                gameSpeed += 0.4;
            }
        }

        // Удаление ушедших за экран препятствий
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
        }
    }

    frameCount++;
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// Инициализация начального состояния
player.y = canvas.height - groundHeight - player.height;