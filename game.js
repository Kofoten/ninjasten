(function() {
    const canvas = document.getElementById("gameCanvas");
    const scorePoints = document.getElementById("scorePoints");
    const context = canvas.getContext("2d");

    const gameSize = 1024;
    canvas.width = gameSize;
    canvas.height = gameSize;

    const baseWaitTime = 300;
    const angryWaitTime = 50;
    const minWaitTime = 1000;
    const baseMoveSpeed = 100;
    const angryMoveSpeed = 50;
    const angerDuration = 1000;
    const scoreTextFloatSpeed = 100;

    const stoneSize = 64;
    const stonePath = new Path2D();
    stonePath.arc(stoneSize, stoneSize, stoneSize / 2, 0, 2 * Math.PI);

    let lastFrameTime = null;

    let score = 0;

    let currentX = 0;
    let currentY = 0;
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    let shadowX = 0;
    let shadowY = 0;
    let shadowOpacity = 0;

    let scoreTextX = 0;
    let scoreTextY = 0;

    let isMoving = false;
    let moveProgress = 1;
    let waitTimer = 0;

    let isAngry = false;
    let angerTimer = 0;

    function loadScore() {
        const scoreStr = localStorage.getItem("score");
        if (scoreStr !== undefined && scoreStr !== null) {
            score = parseInt(scoreStr, 10);
        }
        scorePoints.textContent = score;
    }

    function saveScore() {
        score++;
        localStorage.setItem("score", score);
        scorePoints.textContent = score;
    }

    function easeInOutQuad(t) {
        if (t < 0.5) {
            return 2 * t * t;
        } else {
            return 1 - Math.pow(-2 * t + 2, 2) * .5;
        }
    }

    function startMoving() {
        startX = currentX;
        startY = currentY;

        const maxX = Math.max(0, canvas.width - (stoneSize * 2)); 
        const maxY = Math.max(0, canvas.height - (stoneSize * 2));

        endX = Math.floor(Math.random() * maxX);
        endY = Math.floor(Math.random() * maxY);

        moveProgress = 0;
        isMoving = true;
    }

    function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (isAngry) {
            context.save();
            context.translate(shadowX, shadowY);
            context.globalAlpha = shadowOpacity;
            context.fillStyle = "#7F8C8D";
            context.fill(stonePath);
            context.restore();
        }

        context.save();
        context.translate(currentX, currentY);
        context.fillStyle = "#7F8C8D";
        context.fill(stonePath);
        context.lineWidth = 2;
        context.strokeStyle = "#BDC3C7";
        context.stroke(stonePath);
        context.restore();

        if (isAngry) {
            context.save();
            context.fillStyle = "#2ecc71";
            context.font = "bold 32px Verdana";
            context.textAlign = "center";
            context.fillText("+1", scoreTextX, scoreTextY);
            context.restore();
        }
    }

    function gameLoop(timestamp) {
        requestAnimationFrame(gameLoop);

        if (!lastFrameTime) {
            lastFrameTime = timestamp;
        }
        
        const deltaTime = timestamp - lastFrameTime;
        lastFrameTime = timestamp;

        if (isAngry) {
            angerTimer -= deltaTime;
            shadowOpacity = angerTimer / angerDuration;
            scoreTextY -= scoreTextFloatSpeed / angerTimer;

            if (angerTimer <= 0) {
                angerTimer = 0;
                isAngry = false;
            }
        }

        if (isMoving) {
            if (isAngry) {
                moveProgress += deltaTime / angryMoveSpeed;
            } else {
                moveProgress += deltaTime / baseMoveSpeed;
            }

            if (moveProgress >= 1) {
                moveProgress = 1;
                isMoving = false;

                if (isAngry) {
                    waitTimer = Math.random() * angryWaitTime;
                } else {
                    waitTimer = minWaitTime + Math.random() * baseWaitTime;
                }
            }

            const eased = easeInOutQuad(moveProgress);
            currentX = startX + (endX - startX) * eased;
            currentY = startY + (endY - startY) * eased;
        } else {
            waitTimer -= deltaTime;
            if (waitTimer <= 0) {
                startMoving();
            }
        }

        draw();
    }

    canvas.addEventListener("mousedown", function(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const internalX = (e.clientX - rect.left) * scaleX;
        const internalY = (e.clientY - rect.top) * scaleY;

        const mouseX = internalX - currentX;
        const mouseY = internalY - currentY;

        if (context.isPointInPath(stonePath, mouseX, mouseY) && !isAngry) {
            saveScore();

            shadowX = currentX;
            shadowY = currentY;
            shadowOpacity = 1.0;

            scoreTextX = internalX;
            scoreTextY = internalY;
            scoreTextFloat = 0;

            angerTimer = angerDuration;
            isAngry = true;

            startMoving();
        }
    });

    loadScore();
    startMoving();
    requestAnimationFrame(gameLoop);
})();