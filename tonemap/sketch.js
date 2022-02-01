//make global vars for mic and fast fourier transform and how many buckets we want fft to analyze with
let mic, fft;
let BUFFSIZE = 1024;
//make global var for oscillator to send data
let wave;

//this range of frequencies seems to have a stable bucket number with fft
let minFreq = 2200;
let maxFreq = 6840;

//unused
let diff = maxFreq - minFreq;
let stepsize = diff/128;

//first initialize the mic and fft but won't start working until user clicks the page
function setup() {
  createCanvas(BUFFSIZE, 200);
  // Create an Audio input
  noFill();
  mic = new p5.AudioIn();
  // start the Audio Input.
  // By default, it does not .connect() (to the computer speakers)
  mic.start();
  fft = new p5.FFT(0.3,BUFFSIZE);
  fft.setInput(mic);
}

//looks like you have to interact with the browser in order to do audio stuff 
//https://talonendm.github.io/2020-11-16-JStips/
//https://developer.chrome.com/blog/autoplay/#webaudio
function touchStarted() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
  listening = true;
}

//when the user submits what they wrote
function getInput(){
  //get the message
  let text = document.getElementById("address").value;
  //encode it as UTF-8 which I will assume is same as ASCII
  let encoder = new TextEncoder();
  let raw = encoder.encode(text);
  //convert the encoded string to music which will be played
  playRaw(raw);
}

//async so can play music with specific time intervals
async function playRaw(raw) {
  wave = new p5.Oscillator();
  //Options: 'sine' (default), 'triangle', 'sawtooth', 'square' (Optional)
  wave.setType('sine');
  wave.start();

  //starting preamble to get the listener tracking
  changeSound(2164, 0.5);
  await sleep(500);
  //for each ASCII character, I play a specific sound for a constant time
  for(let i = 0; i < raw.length; i++){
    changeSound(chooseSound(raw[i]),0.5);
    await sleep(300);
  }

  //ending preamble to tell listener when done
  changeSound(2164, 0.5);
  await sleep(600);
  wave.stop();
}


//async so can play music with specific time intervals
async function preamble() {
  wave = new p5.Oscillator();
  //Options: 'sine' (default), 'triangle', 'sawtooth', 'square' (Optional)
  wave.setType('sine');
  wave.start();

  //starting preamble to get the listener tracking
  changeSound(2164, 0.5);
  await sleep(10000);
  wave.stop();
}
//choose the frequency to play depending on which seven bit number (ASCII) given
//input ranges from 32 to 126 (for ASCII: SPACE to ~)
//output ranges from minFreq to maxFreq
function chooseSound(byt){
  let hz = map(byt, 32, 126, minFreq, maxFreq);
  return hz;
}

//simple change sound function
function changeSound(freq, amp) {
  wave.freq(freq);
  wave.amp(amp);
}

//sleep function
//https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//an array to keep characters
let chars = [];
//keep track of past buckets to filter out noise and only use sustained bucket
let prev = [];


//if there are ten buckets in the array, average them and if the rounded average is equal to 101 or 102 that will qualify as a preamble
//preamble will be bucket number 102 (2156 Hz)
//same with ending preamble
//problem is when there is too many 100s and then higher value which averages to 102
function checkBucket() {
  if(prev.length == 10){
    let sum = 0;
    let counthundreds = 0;
    for(let i = 0; i < prev.length; i++) {
      sum += prev[i];
      if(prev[i] == 100){
        counthundreds++;
      }
    }
    let avg = round(sum/prev.length);

    if((102 == avg || 101 == avg) && counthundreds < 5){
      startTime = millis();
      return true;
    }else{
      prev = [];
    }
  }
  return false;
}


//audio context doesn't start so we shouldn't check until it's started
let listening = false;
//if we are listening to the message
let startTracking = false;

//solving the start then stop before hearing the message problem: only check for ending preamble if more than 1 second after the beginning preamble
let startTime = 0;
//draw the spectrum accross the frequencies
function draw() {
  background(200);
  
  //analyze the fft
  let spectrum = fft.analyze();
  let bucket = analyzeFrequency(spectrum);
  console.log(bucket);

  if(!startTracking && listening){
    prev.push(bucket);
    if(checkBucket()) {
      startTracking = true;
      console.log("tracking");
      prev = [];
    }
  }
  
  if(startTracking){
    //map the bucket number into the ASCII char range
    let charnum = map(bucket, 104, 316, 32, 126);
    //https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
    let utf8decoder = new TextDecoder();
    //decode the char number to a character and push it into the array
    let u8arr = new Uint8Array([round(charnum)]);
    chars.push(utf8decoder.decode(u8arr));

    if(millis() - startTime > 1000){
      //when hearing ending preamble
      prev.push(bucket);
      if(checkBucket()){
        noLoop();
        startTracking = false;
        listening = false;
        console.log("done listening");
        console.log(chars);
        let reconstructed = reConstruct(chars);
        document.getElementById("recieved").innerHTML = reconstructed;
      }
    }
  }
  //keep track of which frequency it is, check if there are 10 of that same frequency in a row, if there are, push that frequncy to the array



  //draw the frequency graph
  beginShape();
  for (i = 0; i < spectrum.length; i++) {
    vertex(i, map(spectrum[i], 0, 255, height, 0));
  }
  endShape();
  //semi useless lines
  line(50, 0, 50, height);
  line(0, 140, width, 140);
 }

//take in message array of chars and return the most common chars in order which will hopefully be the reconstructed message
//if there are more than or equal to nine in a row then save that as one char
function reConstruct(arr){
  //save unique characters one for each time in a row
  let uniques = [];
  let uindex = -1;
  let streakcount = [];
  for(let i = 0; i < arr.length; i++) {
    if(uniques[uindex] == arr[i]){
      streakcount[uindex]++;
    }
    else{
      uindex++;
      streakcount[uindex] = 0;
      uniques.push(arr[i]);
    }
  }
  let msg = "";
  for(let i = 0; i < uniques.length; i++) {
    if(streakcount[i] >= 9) {
      msg += uniques[i];
    }
  }
  return msg;
}

//return the bucket with the frequency that is most prominent
//buckets range from 104 (2200 Hz) to 316 (6840 Hz)
function analyzeFrequency(spectrum) {
  let max = 0;
  for(let i = 100; i < 320; i++){
    if(spectrum[i] > max){
      max = i;
    }
  }
  return max;
}
