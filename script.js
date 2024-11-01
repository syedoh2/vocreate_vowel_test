const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const micIcon = document.getElementById('mic-icon');
const statusLabel = document.getElementById('status');
const visualBar = document.getElementById('mic-input-bar');
const commandHistory = document.getElementById('command-history');

let dotX = canvas.width / 2;
let dotY = canvas.height / 2;
const dotRadius = 10;
const stepSize = 2; // Movement step size
let moveInterval; // Interval for continuous movement

let historyArray = []; // Array to store the last 10 commands

// Resize the canvas to match the viewport size
function resizeCanvas() {
    const aspectRatio = 1 ; // Desired aspect ratio
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;

    // Calculate dimensions while keeping within the max width and height
    if (maxWidth / maxHeight > aspectRatio) {
        canvas.height = maxHeight;
        canvas.width = maxHeight * aspectRatio;
    } else {
        canvas.width = maxWidth;
        canvas.height = maxWidth / aspectRatio;
    }

    // Clear and redraw the dot at the center
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dotX = canvas.width / 2;
    dotY = canvas.height / 2;
    drawDot();
}

// Initial setup
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Set initial canvas size
drawDot(); // Draw initial dot

function drawDot() {
    // Draw the dot
    ctx.beginPath();
    ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.closePath();
}

// Speech recognition setup
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.continuous = true;
recognition.interimResults = true; // Get interim results for continuous feedback

recognition.onstart = function () {
    micIcon.classList.add('active'); // Change mic icon to active
    statusLabel.textContent = 'Listening...';
    console.log("Listening started...");
};

recognition.onend = function () {
    micIcon.classList.remove('active'); // Change mic icon to inactive
    statusLabel.textContent = 'Not Listening';
    console.log("Listening stopped...");
    clearInterval(moveInterval); // Stop movement
};

recognition.onresult = function (event) {
    const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
    console.log("Detected transcript:", transcript);

    // Update history
    updateHistory(transcript);

    if (transcript.includes('reset')) {
        resetDot(); // Center the dot
    } else if (transcript.includes('clear')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        resetDot(); // Center the dot
    } else if (transcript.includes('stop')) {
        clearInterval(moveInterval); // Stop the dot's movement
    } else {
        // Match vowel sound for movement
        const detectedVowel = transcript.match(/[aeiou]/g);
        if (detectedVowel) {
            const vowel = detectedVowel[0];
            startContinuousMovement(vowel);
        } else {
            stopContinuousMovement(); // Stop movement if no vowel detected
        }
    }
};

// Start speech recognition on button click
startBtn.addEventListener('click', () => {
    recognition.start();
    console.log("Voice control started...");
});

// Function to start continuous movement
function startContinuousMovement(vowel) {
    clearInterval(moveInterval); // Clear previous movement
    moveInterval = setInterval(() => {
        moveDot(vowel);
    }, 50); // Move dot every 50ms for smooth movement
}

// Function to move the dot based on the detected vowel
function moveDot(vowel) {
    ctx.beginPath();
    ctx.moveTo(dotX, dotY); // Move to current dot position

    switch (vowel) {
        case 'a': // Move up
            dotY = Math.max(dotY - stepSize, dotRadius);
            break;
        case 'e': // Move right
            dotX = Math.min(dotX + stepSize, canvas.width - dotRadius);
            break;
        case 'o': // Move down
            dotY = Math.min(dotY + stepSize, canvas.height - dotRadius);
            break;
        case 'i': // Move left
            dotX = Math.max(dotX - stepSize, dotRadius);
            break;
    }

    ctx.lineTo(dotX, dotY); // Draw line to new dot position
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2; // Line width
    ctx.stroke();
    ctx.closePath();
}

// Stop the dot's movement
function stopContinuousMovement() {
    clearInterval(moveInterval);
}

// Reset the dot to the center of the canvas
function resetDot() {
    dotX = canvas.width / 2;
    dotY = canvas.height / 2;
    drawDot();
}

// Function to update the command history
function updateHistory(transcript) {
    if (historyArray.length >= 10) {
        historyArray.shift(); // Remove the oldest command if over 10
    }
    historyArray.push(transcript);
    displayHistory();
}

// Function to display the last 10 commands
function displayHistory() {
    commandHistory.innerHTML = historyArray.join('<br>');
}

// Initial setup
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Set initial canvas size
drawDot(); // Draw initial dot

// Setting up microphone input visualizer (Web Audio API setup)
navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function updateVisualBar() {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        visualBar.style.width = average + 'px';
    }

    setInterval(updateVisualBar, 100); // Update visual bar every 100ms
});
