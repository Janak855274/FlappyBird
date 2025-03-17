const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const img = new Image();
img.src = "https://i.ibb.co/Q9yv5Jk/flappy-bird-set.png";

// Audio elements
const wingSound = document.getElementById('wingSound');
const pointSound = document.getElementById('pointSound');
const hitSound = document.getElementById('hitSound');
const dieSound = document.getElementById('dieSound');
const swooshSound = document.getElementById('swooshSound');
const musicSound = document.getElementById('musicSound');

// Set volumes
musicSound.volume = 1.0; // Max volume for music
wingSound.volume = 0.5; // Half volume for wing sound
pointSound.volume = 0.5; // Half volume for point sound
hitSound.volume = 0.5; // Half volume for hit sound
dieSound.volume = 0.5; // Half volume for die sound
swooshSound.volume = 0.5; // Half volume for swoosh sound

// Game Over Screen elements
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScore = document.getElementById('finalScore');

// General settings
let gamePlaying = false;
const speed = 6.2; // Constant speed
const gravity = 0.5;
const size = [51, 36];
const jump = -8.5; // Reduced jump height
const cTenth = canvas.width / 10;

let index = 0,
    bestScore = 0,
    flight,
    flyHeight,
    currentScore,
    pipes;

// Pipe settings
const pipeWidth = 78;
const pipeGap = 270;
const pipeLoc = () => Math.random() * (canvas.height - (pipeGap + pipeWidth)) + pipeWidth;

// Delay before pipes start moving (in milliseconds)
const startDelay = 1000; // 1 second delay
let startTime = 0;

const setup = () => {
  currentScore = 0;
  flight = jump;
  startTime = Date.now(); // Record the start time

  // Set initial flyHeight (middle of screen - size of the bird)
  flyHeight = canvas.height / 2 - size[1] / 2;

  // Setup first 3 pipes
  pipes = Array(3)
    .fill()
    .map((a, i) => [canvas.width + i * (pipeGap + pipeWidth), pipeLoc()]);
};

// Time-based animation
let lastTime = 0;
const frameRate = 60; // Target frame rate
const frameDelay = 1000 / frameRate; // Delay between frames

const render = (timestamp) => {
  if (!lastTime) lastTime = timestamp;
  const deltaTime = timestamp - lastTime;

  if (deltaTime >= frameDelay) {
    lastTime = timestamp - (deltaTime % frameDelay);

    // Make the pipe and bird moving
    index++;

    // Background first part
    ctx.drawImage(
      img,
      0,
      0,
      canvas.width,
      canvas.height,
      -((index * (speed / 2)) % canvas.width) + canvas.width,
      0,
      canvas.width,
      canvas.height
    );
    // Background second part
    ctx.drawImage(
      img,
      0,
      0,
      canvas.width,
      canvas.height,
      -(index * (speed / 2)) % canvas.width,
      0,
      canvas.width,
      canvas.height
    );

    // Pipe display
    if (gamePlaying) {
      // Check if the start delay has passed
      if (Date.now() - startTime >= startDelay) {
        pipes.forEach((pipe) => {
          // Pipe moving
          pipe[0] -= speed;

          // Top pipe
          ctx.drawImage(
            img,
            432,
            588 - pipe[1],
            pipeWidth,
            pipe[1],
            pipe[0],
            0,
            pipeWidth,
            pipe[1]
          );
          // Bottom pipe
          ctx.drawImage(
            img,
            432 + pipeWidth,
            108,
            pipeWidth,
            canvas.height - pipe[1] + pipeGap,
            pipe[0],
            pipe[1] + pipeGap,
            pipeWidth,
            canvas.height - pipe[1] + pipeGap
          );

          // Give 1 point & create new pipe
          if (pipe[0] <= -pipeWidth) {
            currentScore++;
            // Check if it's the best score
            bestScore = Math.max(bestScore, currentScore);

            // Play point sound
            if (audioEnabled) {
              pointSound.currentTime = 0;
              pointSound.play();
            }

            // Remove & create new pipe
            pipes = [
              ...pipes.slice(1),
              [pipes[pipes.length - 1][0] + pipeGap + pipeWidth, pipeLoc()],
            ];
          }

          // If hit the pipe, end
          if (
            pipe[0] <= cTenth + size[0] &&
            pipe[0] + pipeWidth >= cTenth &&
            (pipe[1] > flyHeight || pipe[1] + pipeGap < flyHeight + size[1])
          ) {
            // Play hit sound
            if (audioEnabled) {
              hitSound.currentTime = 0;
              hitSound.play();
            }
            gameOver();
          }
        });
      }

      // Check if the bird touches the floor
      if (flyHeight + size[1] >= canvas.height) {
        if (audioEnabled) {
          swooshSound.currentTime = 0; // Reset sound to start
          swooshSound.play(); // Play swoosh sound
        }
        gameOver();
      }
    }

    // Draw bird
    if (gamePlaying) {
      ctx.drawImage(
        img,
        432,
        Math.floor((index % 9) / 3) * size[1],
        ...size,
        cTenth,
        flyHeight,
        ...size
      );
      flight += gravity;
      flyHeight = Math.min(flyHeight + flight, canvas.height - size[1]);
    } else {
      ctx.drawImage(
        img,
        432,
        Math.floor((index % 9) / 3) * size[1],
        ...size,
        canvas.width / 2 - size[0] / 2,
        flyHeight,
        ...size
      );
      flyHeight = canvas.height / 2 - size[1] / 2;

      // Text accueil
      ctx.fillStyle = 'black';
      ctx.font = 'bold 30px Courier';
      ctx.textAlign = 'center';
      ctx.fillText(`Best score: ${bestScore}`, canvas.width / 2, 245);
      ctx.fillText('Press Space or Click', canvas.width / 2, 535);
    }

    document.getElementById('bestScore').innerHTML = `Best : ${bestScore}`;
    document.getElementById('currentScore').innerHTML = `Current : ${currentScore}`;
  }

  // Tell the browser to perform anim
  window.requestAnimationFrame(render);
};

// Game Over function
const gameOver = () => {
  gamePlaying = false;
  if (audioEnabled) {
    dieSound.currentTime = 0; // Reset sound to start
    dieSound.play(); // Play die sound
    musicSound.pause(); // Stop music
  }
  gameOverScreen.style.display = 'flex'; // Use flex to center
  finalScore.textContent = `Score: ${currentScore}`;
};

// Restart game
const restartGame = () => {
  gameOverScreen.style.display = 'none';
  setup();
  gamePlaying = true;

  // Play swoosh sound on restart
  if (audioEnabled) {
    swooshSound.currentTime = 0;
    swooshSound.play();
  }

  // Play music in loop
  if (audioEnabled) {
    musicSound.currentTime = 0;
    musicSound.loop = true;
    musicSound.play();
  }
};

// Start game with Spacebar, click, or touch
const startGame = () => {
  if (!gamePlaying) {
    restartGame();
  }
  flight = jump;
  if (audioEnabled) {
    wingSound.currentTime = 0; // Reset sound to start
    wingSound.play(); // Play wing sound
  }

  // Play swoosh sound on start
  if (audioEnabled) {
    swooshSound.currentTime = 0;
    swooshSound.play();
  }

  // Play music in loop for the first game
  if (audioEnabled && musicSound.paused) {
    musicSound.currentTime = 0;
    musicSound.loop = true;
    musicSound.play();
  }
};

// Ensure audio is allowed to play
let audioEnabled = false;

const enableAudio = () => {
  if (!audioEnabled) {
    // Play and immediately pause to "unlock" audio
    wingSound.play().then(() => {
      wingSound.pause();
      audioEnabled = true;
    }).catch(() => {
      console.log("Audio playback failed. User interaction required.");
    });
  }
};

// Enable audio on user interaction
document.addEventListener('click', enableAudio);
document.addEventListener('touchstart', enableAudio);
document.addEventListener('keydown', enableAudio);

// Event listeners
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    startGame();
  }
});

document.addEventListener('click', startGame);
document.addEventListener('touchstart', startGame);

// Launch setup
setup();
img.onload = () => window.requestAnimationFrame(render);