//make global vars for mic and fft to analyze mic
let mic, fft;

//only start the mic and fft once the Listen button is clicked
//looks like you have to interact with the browser in order to do audio stuff 
//https://talonendm.github.io/2020-11-16-JStips/
//https://developer.chrome.com/blog/autoplay/#webaudio
function TouchStarted() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT(0.8,1024);
  fft.setInput(mic);
}

function touchStarted() {
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT(0.8,1024);
  fft.setInput(mic);
}
