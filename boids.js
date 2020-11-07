
class Boid {
    
    constructor(x, y, speed, angle, size) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.angle = angle;
        this.size = size;
        this.r = Math.random() * 255;
        this.g = Math.random() * 255;
        this.b = Math.random() * 255;
    }

    move(speedMultiplier) {
        let dx = this.speed * Math.cos(this.angle) * speedMultiplier;
        let dy = this.speed * Math.sin(this.angle) * speedMultiplier;
        this.x = (this.x + dx + canvas.width) % canvas.width;
        this.y = (this.y + dy + canvas.height) % canvas.height;
    }

    distance(otherBoid, squared=false) {
        let dist = (this.x - otherBoid.x) ** 2 + (this.y - otherBoid.y) ** 2;
        if (squared) {
            return dist;
        } else {
            return Math.sqrt(dist);
        }
    }

    inNeighborhoodOf(otherBoid, distanceThreshold, angleThreshold, squared=false) {
        let d = this.distance(otherBoid, squared);
        if (d <= distanceThreshold) {
            let deltaX = this.x - otherBoid.x;
            let deltaY = this.y - otherBoid.y;
            let deltaAngle = cartesianToPolarAngle(deltaX, deltaY);
            if (otherBoid.angle - angleThreshold <= deltaAngle && deltaAngle <= otherBoid.angle + angleThreshold) {
                return true;
            }
        }
        return false;
    }

    draw(ctx, shadows=false, black=true) {

        const widthAngle = Math.PI / 2.5;

        let angleC = this.angle + widthAngle + Math.PI / 2;
        let CdeltaX = this.size * Math.cos(angleC);
        let CdeltaY = this.size * Math.sin(angleC);
        let Cx = this.x + CdeltaX;
        let Cy = this.y + CdeltaY;

        let angleA = angleC + 2 * (Math.PI / 2 - widthAngle);
        let AdeltaX = this.size * Math.cos(angleA);
        let AdeltaY = this.size * Math.sin(angleA);
        let Ax = this.x + AdeltaX;
        let Ay = this.y + AdeltaY;

        if (shadows) {
            ctx.shadowOffsetX = 6;
            ctx.shadowOffsetY = 6;
            ctx.shadowBlur = 2;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        } else {
            ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        }

        if (black) {
            ctx.fillStyle = "rgb(0,0,0)";
        } else {
            ctx.fillStyle = "rgb(" + this.r + "," + this.g + "," + this.b + ")";
        }

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(Ax, Ay);
        ctx.lineTo(Cx, Cy);
        ctx.fill();
    }
}

function initializeBoids(numBoids, minSize=25, sizeVariance=10, minSpeed=0.5, maxSpeed=7) {
    let boids = [];
    for (let i = 0; i < numBoids; i++) {
        let x0 = Math.floor(Math.random() * canvas.width);
        let y0 = Math.floor(Math.random() * canvas.height);
        let speed0 = minSpeed + Math.random() * (maxSpeed - minSpeed);
        let angle0 = Math.random() * 2 * Math.PI;
        let size = minSize + Math.floor(Math.random() * sizeVariance);
        
        let boid = new Boid(x0, y0, speed0, angle0, size);
        boids.push(boid);
    }
    return boids;
}

function drawBoids(ctx, boids, shadows, colorBoidsBlack) {
    boids.forEach(boid => boid.draw(ctx, shadows, colorBoidsBlack));
}

function moveBoids(boids, speedMultiplier) {
    boids.forEach(boid => boid.move(speedMultiplier));
}

function averageOfAngles(angles, weights=[]) {
    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < angles.length; i++) {
        let v = polarAngleToCartesian(angles[i]);
        let w = 1;
        if (weights.length === angles.length) {
            w = weights[i];
        }
        sumX += v[0] * w;
        sumY += v[1] * w;
    }
    let avgAngle = cartesianToPolarAngle(sumX, sumY);
    return avgAngle;
}

function flockSingleBoid(idx, neighbors, boids, weight=0.01) {
    if (neighbors.length > 0) {
        let boid = boids[idx];
        let avgSpeed = 0;
        let angles = [];
        
        neighbors.forEach(neighbor => {
            avgSpeed += neighbor.speed;
            angles.push(neighbor.angle);
        });
        avgSpeed /= neighbors.length;

        let neighborAvgAngle = averageOfAngles(angles);
        let newAngle = averageOfAngles([neighborAvgAngle, boid.angle], [weight, 1-weight]);
        let newSpeed = weight * avgSpeed + (1 - weight) * boid.speed;
        boid.speed = newSpeed;
        boid.angle = newAngle;
    }
}

function flockBoids(boids, flockingRadius, flockingWeight, sizeMultiplier) {
    const influenceAngle = (4/5) * Math.PI;
    const squared = true;
    const distanceThreshold = squared ? (flockingRadius*sizeMultiplier)**2 : (flockingRadius*sizeMultiplier);
    
    for (let i = 0; i < boids.length; i++) {
        let neighbors = [];
        for (let j = 0; j < boids.length; j++) {
            if (i != j) {
                let isNeighbor = boids[j].inNeighborhoodOf(boids[i], distanceThreshold, influenceAngle, squared);
                if (isNeighbor) {
                    neighbors.push(boids[j]);
                }
            }
        }
        flockSingleBoid(i, neighbors, boids, flockingWeight);
    }
}

function cartesianToPolarAngle(x, y) {
    let angle90 = Math.atan(Math.abs(y / x));
    let angle = 0;
    if (x >= 0) {
        if (y >= 0) {
            angle = angle90;
        } else {
            angle = 2 * Math.PI - angle90;
        }
    } 
    else {
        if (y >= 0) {
            angle = Math.PI - angle90;
        } else {
            angle = Math.PI + angle90;
        }
    }
    return angle;
}

function polarAngleToCartesian(angle) {
    let x = Math.cos(angle);
    let y = Math.sin(angle);
    return [x, y];
}

function radToDeg(angle) {
    return (angle / (2*Math.PI)) * 360;
}

function drawCircle(ctx, x, y, radius, fill=true, color="rgb(0, 0, 0)") {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (fill) {
        ctx.fill();
    } else {
        ctx.stroke();
    }
}

function clearCanvas(ctx, alpha=1.0) {
    if (alpha === 1.0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    else {
        ctx.fillStyle = "rgb(255, 255, 255, " + alpha + ")";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}


/////////////////////  Main  ///////////////////////

const canvas = document.getElementById("mycanvas")
const ctx = canvas.getContext("2d")

const numBoidsElem = document.getElementById("numBoids");
const boidsizeElem = document.getElementById("boidsize");
const resetButton = document.getElementById("reset");
const disruptButton = document.getElementById("disrupt");
const colorCheckbox = document.getElementById("color");
const trailsSlider = document.getElementById("trails");
const speedSlider = document.getElementById("speed");
const radiusSlider = document.getElementById("flockingradius");
const strengthSlider = document.getElementById("flockingstrength");


// ---- Parameters & initialization ---- //

let numBoids = numBoidsElem.value;

let sizeMultiplier = boidsizeElem.value;
let minSize = 10 * (sizeMultiplier / 2);
let sizeVariance = 5 * (sizeMultiplier / 2);

let speedMultiplier = speedSlider.value;
let minSpeed = 0.5;
let maxSpeed = 1.5;

let flockingRadius = radiusSlider.value;
let flockingStrength = strengthSlider.value;

let drawShadows = false;
let colorBoidsBlack = !colorCheckbox.checked;
let alpha = 1.0;

let boids = initializeBoids(numBoids, minSize, sizeVariance, minSpeed, maxSpeed);


// ---- Controls ---- //

resetButton.onclick = function() {
    numBoids = numBoidsElem.value;
    sizeMultiplier = boidsizeElem.value;
    minSize = 10 * (sizeMultiplier / 2);
    sizeVariance = 5 * (sizeMultiplier / 2);
    boids = initializeBoids(numBoids, minSize, sizeVariance, minSpeed, maxSpeed);
}
disruptButton.onclick = function() {
    boids.forEach(boid => {
        let randomAngle = 5 * Math.random();
        let randomSpeed = 0.5 * Math.random();
        boid.angle = (boid.angle + randomAngle) % (2*Math.PI);
        boid.speed = boid.speed + randomSpeed;
    });
}
colorCheckbox.onclick = function() {
    colorBoidsBlack = !colorCheckbox.checked;
}
trailsSlider.oninput = function() {
    alpha = (1 - this.value) ** 4;
}
speedSlider.oninput = function() {
    speedMultiplier = speedSlider.value;
}
radiusSlider.oninput = function() {
    flockingRadius = radiusSlider.value;
}
strengthSlider.oninput = function() {
    flockingStrength = strengthSlider.value;
}


// ---- Animation ---- //

function drawCanvas() {
    clearCanvas(ctx, alpha);
    moveBoids(boids, speedMultiplier);
    flockBoids(boids, flockingRadius, flockingStrength, sizeMultiplier);
    drawBoids(ctx, boids, drawShadows, colorBoidsBlack);
    window.requestAnimationFrame(drawCanvas);
}

drawCanvas();














// ---- Tests ---- //

function test_cartesianToPolarAngle() {
    let vals = [-1, 0, 1];
    for (let i = 0; i < vals.length; i++) {
        for (let j = 0; j < vals.length; j++) {
            let x = vals[i];
            let y = vals[j];
            let angle = cartesianToPolarAngle(x, y);
            console.log([x, y, radToDeg(angle)]);
        }
    }
}

function test_angleAverage(randomAngles=true) {

    let trials = 30;
    let right = 0;
    let left = 0;

    for (let i = 0; i < trials; i++) {
        let numAngles = 100;
        let angles = [];

        for (let i = 0; i < numAngles; i++) {
            let angle = Math.random() * 2 * Math.PI;
            if (!randomAngles) {
                while (angle > Math.PI/2 && angle < 3*Math.PI/2) {
                    angle = Math.random() * 2 * Math.PI;
                }
            }
            angles.push(angle);
        }

        let avgX = 0;
        let avgY = 0;
        
        angles.forEach(angle => {
            let v = polarAngleToCartesian(angle);
            let x = v[0];
            let y = v[1];
            avgX += x;
            avgY += y;
        });

        let avgAngle = radToDeg(cartesianToPolarAngle(avgX, avgY));
        let toTheRight = (avgAngle < 90 || avgAngle > 270);
        if (toTheRight) {
            right += 1;
        } else {
            left += 1;
        }
        console.log([avgAngle, toTheRight]);
    }
    console.log(["right:", right])
    console.log(["left:", left])
}

// test_cartesianToPolarAngle();
// test_angleAverage();
