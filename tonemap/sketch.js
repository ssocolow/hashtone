let mic, fft;
let BUFFSIZE = 512;
function setup() {
  createCanvas(BUFFSIZE, 200);
  // Create an Audio input
  noFill();
  mic = new p5.AudioIn();
  // start the Audio Input.
  // By default, it does not .connect() (to the computer speakers)
  mic.start();
  fft = new p5.FFT(0.4,BUFFSIZE);
  fft.setInput(mic);
}

//looks like you have to interact with the browser in order to do audio stuff 
//https://talonendm.github.io/2020-11-16-JStips/
//https://developer.chrome.com/blog/autoplay/#webaudio
function touchStarted() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
}


function draw() {
   background(200);

  let spectrum = fft.analyze();

  beginShape();
  for (i = 0; i < spectrum.length; i++) {
    vertex(i, map(spectrum[i], 0, 255, height, 0));
  }
  endShape();
 }

