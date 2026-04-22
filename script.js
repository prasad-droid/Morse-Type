// ================== SETTINGS ==================
let settings = {
  numbers: false,
  punctuation: false,
  mode: "time",
  time: 30
};

// ================== STATE ==================
let targetText = "";
let index = 0;
let currentSymbol = "";
let userText = "";
let startTime = null;
let errors = 0;
let timerInterval = null;
let timeLeft = 0;

// ================== MORSE ==================
const morseCode = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
  G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
  M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  " ": "/",
  0: "-----", 1: ".----", 2: "..---", 3: "...--",
  4: "....-", 5: ".....", 6: "-....", 7: "--...",
  8: "---..", 9: "----."
};

const reverseMorse = Object.fromEntries(
  Object.entries(morseCode).map(([k, v]) => [v, k])
);

// ================== SOUND ==================
const ctx = new (window.AudioContext || window.webkitAudioContext)();
function beep(d) {
  let o = ctx.createOscillator();
  o.connect(ctx.destination);
  o.start();
  setTimeout(() => o.stop(), d);
}

// ================== WORD GENERATION ==================
const words = ["hello","world","code","morse","train","speed","learn","signal"];
const numbersList = ["1","2","3","4","5","6","7","8","9","0"];
const punctuationList = [".", ",", "?", "/"];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateText() {
  let pool = [...words];

  if (settings.numbers) pool = pool.concat(numbersList);
  if (settings.punctuation) pool = pool.concat(punctuationList);

  let result = [];

  let count = settings.mode === "time" ? 30 : 10;

  for (let i = 0; i < count; i++) {
    result.push(randomItem(pool));
  }

  targetText = result.join(" ").toUpperCase();

  resetTest();
  updateDisplay();
}

// ================== TIMER ==================
function startTimer() {
  if (settings.mode !== "time") return;

  timeLeft = settings.time;
  document.getElementById("time").innerText = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("time").innerText = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endTest();
    }
  }, 1000);
}

// ================== TAP INPUT ==================
let pressStart = 0;
let isRight = false;

const tapArea = document.getElementById("tapArea");

tapArea.addEventListener("mousedown", (e) => {
  if (e.button === 2) {
    isRight = true;
    return;
  }

  isRight = false;
  pressStart = Date.now();

  if (!startTime) {
    startTime = Date.now();
    startTimer();
  }
});

tapArea.addEventListener("mouseup", (e) => {
  if (isRight || e.button === 2) return;

  let duration = Date.now() - pressStart;

  if (duration < 200) {
    currentSymbol += ".";
    beep(100);
  } else {
    currentSymbol += "-";
    beep(300);
  }
});

// RIGHT CLICK = END LETTER
tapArea.addEventListener("contextmenu", (e) => {
  e.preventDefault();

  let char = reverseMorse[currentSymbol] || "?";
  userText += char;

  checkAccuracy(char);

  currentSymbol = "";
  updateDisplay();
});

// ================== LOGIC ==================
function checkAccuracy(char) {
  if (char !== targetText[index]) errors++;
  index++;
}

// ================== UI ==================
function updateDisplay() {
  document.getElementById("userText").innerText = userText;

  let display = "";

  for (let i = 0; i < targetText.length; i++) {
    let char = targetText[i];

    if (i === index) {
      // CURRENT CURSOR POSITION
      display += `<span class="current">${char}</span>`;
    } 
    else if (i < userText.length) {
      display += `<span class="${char === userText[i] ? "correct" : "wrong"}">${char}</span>`;
    } 
    else {
      display += `<span class="pending">${char}</span>`;
    }
  }

  document.getElementById("textDisplay").innerHTML = display;
}

// ================== STATS ==================
function updateStats() {
  if (!startTime) return;

  let time = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
  document.getElementById("time").innerText = settings.mode === "time" ? timeLeft : time;

  let cpm = Math.floor((userText.length / time) * 60);
  document.getElementById("wpm").innerText = cpm;

  let acc = Math.max(0, Math.floor(((userText.length - errors) / userText.length) * 100)) || 100;
  document.getElementById("acc").innerText = acc;
}

// ================== RESET ==================
function resetTest() {
  clearInterval(timerInterval);

  index = 0;
  currentSymbol = "";
  userText = "";
  errors = 0;
  startTime = null;

  document.getElementById("userText").innerText = "";
  document.getElementById("wpm").innerText = "0";
  document.getElementById("acc").innerText = "100";

  if (settings.mode === "time") {
    document.getElementById("time").innerText = settings.time;
  } else {
    document.getElementById("time").innerText = "0";
  }
}

// ================== END ==================
function endTest() {
  alert("Test Completed!");
}

// ================== OPTIONS ==================
function toggleOption(opt, el) {
  settings[opt] = !settings[opt];

  el.classList.toggle("active");

  generateText();
}

function setMode(mode, el) {
  settings.mode = mode;

  document.querySelectorAll("[onclick^='setMode']").forEach(btn => {
    btn.classList.remove("active");
  });

  el.classList.add("active");

  generateText();
}

function setTime(t, el) {
  settings.time = t;

  document.querySelectorAll("[onclick^='setTime']").forEach(btn => {
    btn.classList.remove("active");
  });

  el.classList.add("active");

  generateText();
}

// ================== INIT ==================
generateText();

const morseGrid = document.getElementById("morseGrid");

morseGrid.innerHTML = Object.entries(morseCode)
  .filter(([k]) => k !== " ") // remove space
  .map(
    ([letter, code]) => `
        <div class="morseBox" onclick="playGuide('${code}')">
            <strong>${letter}</strong><br>
            <small>${code}</small>
        </div>
    `,
  )
  .join("");

function playGuide(code) {
  let t = 0;

  code.split("").forEach((symbol) => {
    if (symbol === ".") {
      setTimeout(() => beep(100), t);
      t += 200;
    } else if (symbol === "-") {
      setTimeout(() => beep(300), t);
      t += 400;
    }
  });
}
