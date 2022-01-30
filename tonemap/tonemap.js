let mic, fft;

function setup(){
  createCanvas(710,400);
  noFill();
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT(0.8,1024);

}
//looks like you have to interact with the browser in order to do audio stuff 
//https://talonendm.github.io/2020-11-16-JStips/
//https://developer.chrome.com/blog/autoplay/#webaudio
function touchStarted() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
 }
function draw(){
  background(200);

  let spectrum = fft.analyze();
  let nrg = fft.getEnergy(2000);
  console.log(nrg);
  //console.log(spectrum)

  beginShape();
  for (i = 0; i < spectrum.length; i++) {
    vertex(i, map(spectrum[i], 0, 255, height, 0));
  }
  endShape();
}

