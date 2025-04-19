const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const resultText = document.getElementById('result');
const scoreText = document.getElementById('score');
const timerText = document.getElementById('timer');
const leaderboardList = document.getElementById('leaderboardList');
const winSound = document.getElementById('winSound');
const loseSound = document.getElementById('loseSound');
const coinSound = document.getElementById('coinSound');
const bgm = document.getElementById('bgm');
const loadingDiv = document.getElementById('loading');
const continueButton = document.getElementById('continueButton');
const tokenInput = document.getElementById('tokenInput');
const tokenField = document.getElementById('tokenField');
const submitTokenButton = document.getElementById('submitToken');
const gameElements = document.querySelector('.game-elements');

window.mobileCheck = function() {
    if (window.innerWidth <= 600) return true;
    return false;
};

function isMobile() {
    return window.mobileCheck();
}

function resizeCanvas() {
    const padding = 20;
    const maxWidthRatio = 0.95;
    const maxHeightRatio = 0.45; // Changed from 0.6 to 0.45 for smaller height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxWidth = Math.min((viewportWidth * maxWidthRatio) - padding, 1600);
    const maxHeight = viewportHeight * maxHeightRatio;
    const aspectRatio = isMobile() ? 
        (window.innerHeight > window.innerWidth ? 2/3 : 16/9) : 16/9; // Adjusted mobile portrait ratio to 2:3
    let width = maxWidth;
    let height = width / aspectRatio;
    
    if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
    }
    
    canvas.width = width;
    canvas.height = height;
    scaleFactor = width / 1600;
    const baseSize = Math.min(width, height) * 0.01;
    const maxSize = 120;
    const minSize = 60;
    const responsiveSize = Math.min(Math.max(baseSize, minSize), maxSize);
    targetWidth = responsiveSize;
    targetHeight = responsiveSize;
    catWidth = responsiveSize;
    catHeight = responsiveSize;
    targetX = canvas.width - (targetWidth + 30);
    
    // Update cat and target vertical positions to center
    catY = canvas.height / 2 - (catHeight / 2);
    targetY = canvas.height / 2 - (targetHeight / 2);
}
let targetWidth = 100;
let targetHeight = 100;
let catWidth = 100;
let catHeight = 100;

let scaleFactor = 1;
let catX = 0;
let catY = 0; // Will be set properly in resizeCanvas
let catSpeed = 20;
console.log('catSpeed:', catSpeed);
let catFrame = 0;
let catFrameCount = 1;
let catFrameWidth = 120;
let catFrameHeight = 120;
let frameSpeed = 0.2;
let isRunning = false;
let targetX = canvas.width - (100 * scaleFactor + 30);

let bonus = 0;
let tokenBalance = 0;
let timeLeft = 30;
let timerInterval;
let backgroundOffset = 0;
let catVerticalSpeed = 5 * (scaleFactor / 2);
let catDirection = 1;
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 100);
});

const defaultImageUrl = 'https://res.cloudinary.com/dyq7lcx0x/image/upload/v1743845107/lucky-neko_s_scatter_a_krwbwx.png';
const backgroundImage = new Image();

function setBackgroundImage() {
    backgroundImage.src = isMobile() ? '/img/bg2.png' : '/img/bg.png';
}

setBackgroundImage();
window.addEventListener('resize', setBackgroundImage);

const catSprite = new Image();
catSprite.src = '/img/space.png';
const shadowSprite = new Image();
shadowSprite.src = '/img/space.png';

let assetsLoaded = 0;
const totalAssets = 3;
let hasError = false;

const loadingTimeout = setTimeout(() => {
    if (assetsLoaded !== totalAssets) {
        loadingDiv.querySelector('p').textContent = 'Failed to load assets.';
        continueButton.style.display = 'block';
        hasError = true;
    }
}, 10000);

function assetLoaded() {
    assetsLoaded++;
    if (assetsLoaded === totalAssets || hasError) {
        clearTimeout(loadingTimeout);
        loadingDiv.classList.remove('show');
        tokenInput.style.display = 'block';
    }
}

backgroundImage.onload = assetLoaded;
catSprite.onload = assetLoaded;
shadowSprite.onload = assetLoaded;

backgroundImage.onerror = () => {
    console.error('Failed to load background at /img/bg.png');
    assetLoaded();
};
catSprite.onerror = () => {
    console.error('Failed to load catSprite at /img/space.png');
    catSprite.src = defaultImageUrl;
    assetLoaded();
};
shadowSprite.onerror = () => {
    console.error('Failed to load shadowSprite at /img/space.png');
    shadowSprite.src = defaultImageUrl;
    assetLoaded();
};

loadingDiv.classList.add('show');

continueButton.addEventListener('click', () => {
    hasError = true;
    backgroundImage.src = '/img/bg.png';
    catSprite.src = defaultImageUrl;
    shadowSprite.src = defaultImageUrl;
    assetLoaded();
});

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

let adminSettings = {
    100: { reward: 200, probability: 0.001 },
    81: { reward: 100, probability: 0.1 },
    71: { reward: 50, probability: 0.2 },
    61: { reward: 10, probability: 0.3 }
};

let antiPerfectSettings;
fetch('antiPerfect.json').then(response => response.json()).then(data => {antiPerfectSettings = data;}).catch(error => {console.error("Error loading settings:", error);});
submitTokenButton.addEventListener('click', async () => {
    const token = tokenField.value.trim();
    if (!token) {
        Swal.fire({
            title: 'Token Kosong!',
            text: 'Silakan masukkan token terlebih dahulu',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    try {
        Swal.fire({
            title: 'Memproses Token',
            html: 'Mohon tunggu sebentar...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const response = await fetch('token_handler.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'validate',
                token: token
            })
        });
        
        const result = await response.json();
        
        if (result.valid) {
            Swal.fire({
                title: 'Berhasil!',
                text: 'Token valid! Selamat bermain!',
                icon: 'success',
                showConfirmButton: false,
                timer: 1500
            });
            tokenBalance += 1;
            tokenInput.style.display = 'none';
            startButton.disabled = false;
            gameElements.style.display = 'block';
            
            if (result.accuracySettings) {
                adminSettings = result.accuracySettings;
            }
            
            if(result.speed) catSpeed = result.speed * (scaleFactor / 2);
            
            showNotification('Token valid! Selamat bermain!', 'success');
            requestAnimationFrame(animate);
            createConfetti();
        } else {
            Swal.fire({
                title: 'Gagal!',
                text: result.message,
                icon: 'error'
            });
        }
    } catch (error) {
        Swal.fire({
            title: 'Error!',
            text: error,
            icon: 'error'
        });
    }
});

function showNotification(message, type = 'info') {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });

    Toast.fire({
        icon: type,
        title: message
    });
}

function createConfetti() {
    const colors = ['#4a6cf7', '#28a745', '#ffc107', '#dc3545', '#17a2b8'];
    const confettiCount = 100;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.opacity = Math.random();
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

startButton.addEventListener('click', () => {
    if (!isRunning && tokenBalance > 0) {
        isRunning = true;
        catX = 0;
        catSpeed = 12 * scaleFactor;
        level = 1;
        bonus = 0;
        timeLeft = 30;
        if(window.innerWidth <= 400){
            targetHeight = canvas.height / 8;
            targetWidth = canvas.height / 8;
            catWidth = canvas.height / 8;
            catHeight = canvas.height / 8;
        }
        scoreText.textContent = bonus + '%';
        timerText.textContent = timeLeft;
        resultText.textContent = '';
        startButton.textContent = 'Stop';
        tokenBalance -= 1;
        catY = canvas.height / 2 - (catHeight / 2); // Center cat vertically
        catDirection = 1;
        targetY = canvas.height / 2 - (targetHeight / 2); // Center target vertically
        targetX = canvas.width - (targetWidth + 30);
        startTimer();
    } else if (isRunning) {
        stopCat();
    } else {
        alert('Masukkan token terlebih dahulu!');
    }
});

canvas.addEventListener('click', () => {
    if (isRunning) {
        stopCat();
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (isRunning) {
        stopCat();
    }
});

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        timerText.textContent = timeLeft;
        if (timeLeft <= 0) {
            stopCat();
            resultText.textContent = 'Waktu Habis!';
            resultText.style.color = 'red';
            loseSound.play();
            updateLeaderboard();
        }
    }, 1000);
}

function stopCat() {
    const movingRight = catSpeed > 0;
    const catCenter = catX + catWidth / 2;
    const targetCenter = targetX + targetWidth / 2;
    const currentAccuracy = 100 - (Math.abs(catCenter - targetCenter) / (targetWidth / 2) * 100);

    function adjustPosition(offsetMultiplier = 1) {
        if (movingRight) {
            catX = targetX + targetWidth + (antiPerfectSettings.offsets.perfect100 * offsetMultiplier);
        } else {
            catX = targetX - catWidth - (antiPerfectSettings.offsets.perfect100 * offsetMultiplier);
        }
    }

    if (antiPerfectSettings.force0Percent) {
        adjustPosition(antiPerfectSettings.offsets.force0);
    } else if (currentAccuracy >= 99 && antiPerfectSettings.preventPerfect100) {
        adjustPosition(antiPerfectSettings.offsets.perfect100);
    } else if (currentAccuracy >= 81 && antiPerfectSettings.preventPerfect81) {
        adjustPosition(antiPerfectSettings.offsets.perfect81);
    } else if (currentAccuracy >= 71 && antiPerfectSettings.preventPerfect71) {
        adjustPosition(antiPerfectSettings.offsets.perfect71);
    } else if (currentAccuracy >= 61 && antiPerfectSettings.preventPerfect61) {
        adjustPosition(antiPerfectSettings.offsets.perfect61);
    }

    checkAccuracy();
    isRunning = false;
    clearInterval(timerInterval);
    startButton.textContent = 'Start Game';
}

function checkAccuracy() {
    const catCenter = catX + catWidth / 2;
    const targetCenter = targetX + targetWidth / 2;
    const distance = Math.abs(catCenter - targetCenter);
    const maxDistance = targetWidth / 2;
    
    let accuracy = Math.max(0, 100 - (distance / maxDistance) * 100);
    
    resultText.textContent = `Akurasi: ${accuracy.toFixed(2)}%`;
    resultText.style.color = accuracy >= 50 ? 'green' : 'red';

    if (accuracy === 100) {
        bonus = adminSettings[100].reward;
        showNotification('Sempurna! Akurasi 100%!', 'success');
    } else if (accuracy >= 81) {
        bonus = adminSettings[81].reward;
        showNotification('Bagus! Akurasi tinggi!', 'success');
    } else if (accuracy >= 71) {
        bonus = adminSettings[71].reward;
        showNotification('Cukup baik!', 'success');
    } else if (accuracy >= 60) {
        bonus = adminSettings[60].reward;
        showNotification('Hampir!', 'info');
    } else {
        bonus = 0;
        showNotification('Coba lagi!', 'error');
    }

    scoreText.textContent = bonus + '%';
    if (bonus > 0) {
        resultText.textContent += ` - Bonus Saldo: ${bonus}%`;
        winSound.play();
        
        scoreText.classList.add('bonus-animation');
        setTimeout(() => {
            scoreText.classList.remove('bonus-animation');
        }, 1000);
    } else {
        resultText.textContent += ' - Tidak Ada Bonus';
        loseSound.play();
    }

    fetch('save_score.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token: tokenField.value,
            score: bonus
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.leaderboard) {
            updateLeaderboardDisplay(data);
        }
    })
    .catch(error => console.error('Error saving score:', error));
    if (tokenBalance <= 0) {
        updateLeaderboard();
        setTimeout(() => {
            gameElements.style.display = 'none';
            tokenInput.style.display = 'block';
            Swal.fire({
                title: 'bonus!',
                text: `Bonus yang kamu dapatkan ${bonus} %`,
                icon: 'info',
                confirmButtonText: 'OK'  
            });
        }, 2000);
    }
}

function updateLeaderboard() {
    fetch('get-core.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.leaderboard) {
            updateLeaderboardDisplay(data);
        }
    })
    .catch(error => console.error('Error saving score:', error));
}

function updateLeaderboardDisplay(data) {
    leaderboardList.innerHTML = '';
    data.leaderboard.forEach(entry => {
        const li = document.createElement('li');
        const rankClass = entry.rank <= 3 ? ` rank-${entry.rank}` : '';
        
        li.innerHTML = `
            <div class="score-entry">
                <div class="rank${rankClass}">#${entry.rank}</div>
                <div class="score-details">
                    <span class="score-value">${entry.score}%</span>
                    <span class="token-id">${entry.token}</span>
                </div>
                <div class="score-date">${new Date(entry.created_at).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</div>
            </div>
        `;
        leaderboardList.appendChild(li);
    });
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const bgWidth = isMobile() ? backgroundImage.width : canvas.width;
    const bgHeight = isMobile() ? backgroundImage.height : canvas.height;
    ctx.drawImage(backgroundImage, 0, 0, bgWidth, bgHeight);

    ctx.globalAlpha = 0.3;
    ctx.drawImage(shadowSprite, targetX, canvas.height / 2 - (targetHeight / 2), targetWidth, targetHeight);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2 * scaleFactor;
    ctx.strokeRect(targetX, canvas.height / 2 - (targetHeight / 2), targetWidth, targetHeight);

    if (catFrameCount > 1) {
        catFrame += frameSpeed;
        if (catFrame >= catFrameCount) catFrame = 0;
        const frameX = Math.floor(catFrame) * catFrameWidth;
        ctx.drawImage(catSprite, frameX, 0, catFrameWidth, catFrameHeight, catX, catY, catWidth, catHeight);
    } else {
        ctx.drawImage(catSprite, catX, catY, catWidth, catHeight);
    }

    if (isRunning) {
        catX += catSpeed * catDirection;
        console.log('catSpeed:', catSpeed);
        catY = canvas.height / 2 - (catHeight / 2); // Keep cat centered vertically
        
        if (catY > canvas.height - catHeight || catY < 0) {
            catDirection *= -1;
        }
    }

    if (catX > canvas.width) {
        catX = 0;
    }

    requestAnimationFrame(animate);
}
updateLeaderboard();