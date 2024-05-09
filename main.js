const audioContext = new AudioContext();
const WIDTH = 800;
const HEIGHT = 200;
const canvas = document.getElementById("oscilloscope");
const canvasCtx = canvas.getContext("2d");
const oscillator = new OscillatorNode(audioContext);
let recifier = undefined;
let comparator = undefined;
const analyser = new AnalyserNode(audioContext);
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
const gainRect = new GainNode(audioContext);
const gainComp = new GainNode(audioContext);
const gainMain = new GainNode(audioContext);
canvas.width = WIDTH;
canvas.height = HEIGHT;

const startAudio = async (context) => {
  await context.audioWorklet.addModule('rectifier.js');
  await context.audioWorklet.addModule('comparator.js');
  rectifier = new AudioWorkletNode(context, 'rectifier');
  comparator = new AudioWorkletNode(context, 'comparator');
  oscillator.type = "sawtooth"
  oscillator.frequency.value = document.getElementById("oscPitch").value
  oscillator.connect(rectifier)
  oscillator.connect(comparator)
  rectifier.connect(gainRect)
  comparator.connect(gainComp)
  gainRect.connect(gainMain)
  gainComp.connect(gainMain)
  gainMain.connect(analyser)
  analyser.connect(context.destination);
  updateWaveform(0.0);
  document.getElementById("waveform").value = 0.0;
  oscillator.start();
  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
  draw();
};

window.addEventListener('load', async () => {
  const buttonEl = document.getElementById('button-start');
  buttonEl.disabled = false;
  buttonEl.addEventListener('click', async () => {
    await startAudio(audioContext);
    audioContext.resume();
    buttonEl.disabled = true;
    buttonEl.textContent = 'Playing...';
  }, false);
});

function draw() {
    const drawVisual = requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);
    
    canvasCtx.fillStyle = "rgb(200, 200, 200)";
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "rgb(0, 0, 0)";
    canvasCtx.beginPath();
    const sliceWidth = WIDTH / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * (HEIGHT / 2);
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
    }
    canvasCtx.lineTo(WIDTH, HEIGHT / 2);
    canvasCtx.stroke();
    

    
}

document.getElementById("oscPitch").oninput =  (evt) => {
    oscillator.frequency.value = evt.target.value;
}

document.getElementById("rectThreshold").oninput = (evt) => {
  const param = rectifier.parameters.get("threshold");
  param.setValueAtTime(evt.target.value, audioContext.currentTime);
}

document.getElementById("compThreshold").oninput = (evt) => {
  const param = comparator.parameters.get("threshold");
  param.setValueAtTime(evt.target.value, audioContext.currentTime);
}

document.getElementById("compGain").oninput = (evt) => {
  const param = gainComp.gain;
  param.setValueAtTime(evt.target.value, audioContext.currentTime);
}

document.getElementById("rectGain").oninput = (evt) => {
  const param = gainRect.gain;
  param.setValueAtTime(evt.target.value, audioContext.currentTime);
}

document.getElementById("mainGain").oninput = (evt) => {
  const param = gainMain.gain;
  param.setValueAtTime(evt.target.value, audioContext.currentTime);
}

const updateWaveform = value => {
  const rectThr = rectifier.parameters.get("threshold");
  const compThr = comparator.parameters.get("threshold");
  const compGain = gainComp.gain;
  const rectGain = gainRect.gain;
  const splitPointA = 0.3;
  const splitPointB = 0.6;
  if (value < splitPointA) {
    compGain.setValueAtTime(0.0, audioContext.currentTime);
    rectGain.setValueAtTime(1.0, audioContext.currentTime);
    compThr.setValueAtTime(0.0, audioContext.currentTime);  // Should this be 0.5??
    const currentSplitPosition = value / splitPointA;
    rectThr.setValueAtTime(currentSplitPosition, audioContext.currentTime);

  } else if (value < splitPointB) {
    compThr.setValueAtTime(0.0, audioContext.currentTime);  // Should this be 0.5??
    const currentSplitPosition = (value - splitPointA) / (splitPointB -  splitPointA);
    compGain.setValueAtTime(currentSplitPosition, audioContext.currentTime);
    rectGain.setValueAtTime((1.0 - currentSplitPosition), audioContext.currentTime);
    rectThr.setValueAtTime(1, audioContext.currentTime);

  } else {
    compGain.setValueAtTime(1.0, audioContext.currentTime);
    rectGain.setValueAtTime(0.0, audioContext.currentTime);
    const currentSplitPosition = (value - splitPointB) / (1.0 -  splitPointB);
    compThr.setValueAtTime(currentSplitPosition, audioContext.currentTime);
    rectThr.setValueAtTime(1, audioContext.currentTime);
  }

  setTimeout( () => {
    document.getElementById("rectGain").value = rectGain.value;
    document.getElementById("compGain").value = compGain.value;
    document.getElementById("compThreshold").value = compThr.value;
    document.getElementById("rectThreshold").value = rectThr.value;
  }, 50)

  
}

document.getElementById("waveform").oninput = (evt) => {
  updateWaveform(evt.target.value);
}