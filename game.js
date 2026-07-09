(function() {
    const canvas = document.getElementById("gameCanvas");
    const scorePoints = document.getElementById("scorePoints");
    const context = canvas.getContext("2d");

    const stoneColorBase = "#7F8C8D";
    const stoneEdgeColor = "#BDC3C7";
    const scoreTextColor = "#2ECC71";
    const angerColor = "#FF8C8D";
    const angerTint = "#FF0000"

    const inv255 = 1 / 255;
    const gameSize = 1024;
    canvas.width = gameSize;
    canvas.height = gameSize;

    const difficultyDecayFactor = 0.98;
    const variableWaitTimeLimit = 200;
    const minWaitTimeLimit = 100;
    const angryWaitTime = 50;
    const baseMoveSpeed = 100;
    const angryMoveSpeed = 50;
    const angerDuration = 1000;
    const scoreTextFloatSpeed = 100;

    const stoneSize = 64;
    const stonePath = new Path2D();
    stonePath.arc(stoneSize, stoneSize, stoneSize / 2, 0, 2 * Math.PI);

    let lastFrameTime = null;

    let variableWaitTime = 700;
    let minWaitTime = 300;
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
    let invAngerLevel = 1;
    let stoneColor = stoneColorBase;

    function rgbFromHex(hexColor) {
        const c = parseInt(hexColor.slice(-6), 16);
        return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
    }

    function rgbToHex(rgbColor) {
        const c = (Math.floor(rgbColor[0]) << 16) + (Math.floor(rgbColor[1]) << 8) + Math.floor(rgbColor[2]);
        return c.toString(16).padStart(6, "0").padStart(7, "#");
    }

    function tint(baseColor, tintColor, tintWeight) {
        var tintValues = rgbFromHex(tintColor);
        var baseValues = rgbFromHex(baseColor);

        const r = baseValues[0] + tintValues[0] * (1 - baseValues[0] * inv255) * tintWeight;
        const g = baseValues[1] + tintValues[1] * (1 - baseValues[1] * inv255) * tintWeight;
        const b = baseValues[2] + tintValues[2] * (1 - baseValues[2] * inv255) * tintWeight;

        return rgbToHex([Math.min(255, r), Math.min(255, g), Math.min(255, b)]);
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
            context.fillStyle = stoneColor;
            context.fill(stonePath);
            context.restore();
        }

        context.save();
        context.translate(currentX, currentY);
        if (isAngry) {
            context.fillStyle = angerColor;
        } else {
            context.fillStyle = stoneColor;
        }
        context.fill(stonePath);
        context.lineWidth = 2;
        context.strokeStyle = stoneEdgeColor;
        context.stroke(stonePath);
        context.restore();

        if (isAngry) {
            context.save();
            context.fillStyle = scoreTextColor;
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
            scoreTextY -= scoreTextFloatSpeed / Math.max(8, angerTimer);

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
                    waitTimer = minWaitTime + Math.random() * variableWaitTime;
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
            score++;
            scorePoints.textContent = score;

            variableWaitTime = variableWaitTimeLimit + (variableWaitTime - variableWaitTimeLimit) * difficultyDecayFactor;
            minWaitTime = minWaitTimeLimit + (minWaitTime - minWaitTimeLimit) * difficultyDecayFactor;

            shadowX = currentX;
            shadowY = currentY;
            shadowOpacity = 1.0;

            scoreTextX = internalX;
            scoreTextY = internalY;

            angerTimer = angerDuration;
            isAngry = true;

            invAngerLevel = invAngerLevel * difficultyDecayFactor;
            stoneColor = tint(stoneColorBase, angerTint, 1 - invAngerLevel);

            console.log({ variableWaitTime, minWaitTime, stoneColor });

            startMoving();
        }
    });

    startMoving();
    requestAnimationFrame(gameLoop);
})();