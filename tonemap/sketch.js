//make global vars for mic and fast fourier transform and how many buckets we want fft to analyze with
let mic, fft;
let BUFFSIZE = 1024;
//make global var for oscillator to send data
let wave;

//this range of frequencies seems to have a stable bucket number with fft
let minFreq = 2200;
let maxFreq = 6840;

//the 8 frequencies that the sender will use, sufficiently far apart from each other
//let freqs = [2400, 2600, 2800, 3000, 3200, 3400, 3600, 3800];
//make them farther apart
let freqs = [2400, 2800, 3200, 3400, 3800, 4200, 4600, 5000];

//first initialize the mic and fft but won't start working until user clicks the page
function setup() {
  createCanvas(BUFFSIZE, 200);
  // Create an Audio input
  noFill();
  mic = new p5.AudioIn();
  // start the Audio Input.
  // By default, it does not .connect() (to the computer speakers)
  mic.start();
  fft = new p5.FFT(0.6,BUFFSIZE);
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

//global variable to the bit string of the message
let msg_bit_string;

//when the user submits what they wrote
function getInput(){
  //get the message
  let text = document.getElementById("address").value;
  //encode it as UTF-8 which I will assume is same as ASCII
  let encoder = new TextEncoder();
  let raw = encoder.encode(text);
  //convert the Uint8Array into one string on bits and add 
  msg_bit_string = uint8tobits(raw);
  console.log("raw message text: " + msg_bit_string);
  //play the bit string
  playRaw(msg_bit_string);
}

//takes an array of uint8s and returns a string of the all the bits concatenated
function uint8tobits(raw){
  let s = "";
  for(let i = 0; i < raw.length; i++){
    s += raw[i].toString(2);
  }
  return s;
}
//async so can play music with specific time intervals
async function playRaw(bitstring) {
  wave = new p5.Oscillator();
  //Options: 'sine' (default), 'triangle', 'sawtooth', 'square' (Optional)
  wave.setType('sine');
  wave.start();

  //starting preamble to get the listener tracking
  changeSound(2200, 1);
  await sleep(1000);

  //calibrate with the 8 info freqs
  for(let i = 0; i < freqs.length; i++){
    changeSound(freqs[i],1);
    await sleep(150);
  }
  
  //play the preamble right after to signify that those in-between frequencies are the info ones
  changeSound(2200, 1);
  await sleep(1000);

  console.log("starting message");

  //this is how much through the bitstring the for loop should increment, it should add three then three then one - repeat
  let incer = 3;
  //counting var to know when to switch incer
  let count = 0;
  //actually should send the characters where each character is sent as three frequencies.  Each ASCII character is seven bits so the first three bits will be frequency A, the second three bits will be frequency B, and the last bit will be either preamble (0) or highest frequency(1).
  for(let i = 0; i < bitstring.length; i+=7){
    let newsound;
    
    newsound = chooseSound(bitstring.substr(i,3));
    changeSound(newsound,1);
    console.log("new sound: " + newsound);
    await sleep(200);
   
    newsound = chooseSound(bitstring.substr(i+3,3));
    changeSound(newsound,1);
    console.log("new sound: " + newsound);
    await sleep(200);
    
    newsound = chooseSound(bitstring.substr(i+6,1));
    changeSound(newsound,1);
    console.log("new sound: " + newsound);
    await sleep(200);
  }

  //ending preamble to tell listener when done
  changeSound(2200, 1);
  await sleep(1000);
  wave.stop();
}


//async so can play music with specific time intervals
//plays the preamble frequency for 2 seconds (2200 Hz) and then the 8 info frequencies in order from lowest to highest, 0.1 seconds on each, then preamble for one second
async function preamble() {
  wave = new p5.Oscillator();
  //Options: 'sine' (default), 'triangle', 'sawtooth', 'square' (Optional)
  wave.setType('sine');
  wave.start();

  //starting preamble to get the listener tracking
  changeSound(2200, 1);
  await sleep(1000);

  //the 8 info freqs
  for(let i = 0; i < freqs.length; i++){
    changeSound(freqs[i],1);
    await sleep(100);
  }
  //play the preamble right after to signify that those in-between frequencies are the info ones
  changeSound(2200, 1);
  await sleep(1000);

  wave.stop();
}

//choose the frequency that plays from the substring
//will deal with endianness here by making the first bits most influential -- check here first if things aren't working, could have screwed this up pretty easily
function chooseSound(substring){
  if(substring.length == 3){
    let index = 0;
    index += parseInt(substring[0],10)*4;
    index += parseInt(substring[1],10)*2;
    index += parseInt(substring[2],10)*1;
    return freqs[index];
  }
  if(substring.length == 1){
    if(substring == "1"){
      return freqs[7];
    }
    else{
      return 2200;
    }
  }
  else{
    console.error("not right length: " + substring);
  }
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
//keep track of which bucket is the preamble
let preamblebucket;

//check a bucket of 20 and if all are the same, assume it is the preamble
function checkBucket() {
  if(prev.length == 20){
    let first_ = prev[0];
    for(let i = 0; i < prev.length; i++) {
      if(prev[i] != first_){
        prev = [];
        return false;
      }
    }
    preamblebucket = first_;
    //console.log("hoi  " + preamblebucket);
    return true;
  }
  return false;
}


//audio context doesn't start so we shouldn't check until it's started
let listening = false;
//if we are listening to the message
let startTracking = false;

//records all the buckets after the preamble
let info = [];
//collect the buckets where the info freqs go in
let myinfobuckets = [];

//fill myinfobuckets with an array of the buckets where the info freqs go - index 0 is preamblebucket
//return the index in info of the first preamble after the info freqs
//here I know that consecutive frequencies are different
function getInfoBuckets(){
  let recognized = [];
  for(let i = 0; i < 150; i++){
    if(Math.abs(info[i] - info[i+1]) < 6){
      recognized.push(Math.round((info[i] + info[i+1])/2));
    }else{
      myinfobuckets.push(roundedAverage(recognized));
      recognized = [];
      if(myinfobuckets.length > 8){
        return i+1;
      }
    }
}
}

//return the rounded average of the list
function roundedAverage(list){
  let sum = 0;
  for(let i = 0; i < list.length; i++){
    sum += list[i];
  }
  return Math.round(sum/list.length);
}


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
      startTime = millis();
    }
  }
  
  if(startTracking){
    //record all the buckets after the preamble
    info.push(bucket);

    //map the bucket number into the ASCII char range
    //let charnum = map(bucket, 104, 316, 32, 126);
    //https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
    //let utf8decoder = new TextDecoder();
    //decode the char number to a character and push it into the array
    //let u8arr = new Uint8Array([round(charnum)]);
    //chars.push(utf8decoder.decode(u8arr));

    if(millis() - startTime > 3000){
      //when hearing ending preamble
      prev.push(bucket);
      if(checkBucket()){
        noLoop();
        startTracking = false;
        listening = false;
        console.log("done listening");
        let leaveoffpoint = getInfoBuckets();
        console.log("my info buckets: " + myinfobuckets);
        //now start at the leaveoffpoint and decode the message! - from buckets to bitstring to full message, can reuse the getInfoBuckets logic
        let bitstring = reConstruct(leaveoffpoint);
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

//hold the decoded bit string
let decodedbitstring;
//hold the bucket parts of the message
let messageparts = [];
//starts at the point in info where left off, then there is more preamble, then the message, then the preamble at the end
function reConstruct(leaveoffpoint){
  let run = 0;
  let recognized = [];
  //here I cannot assume that consecutive frequencies are different
  for(let i = leaveoffpoint; i < info.length; i++){
    if(Math.abs(info[i] - info[i+1]) < 9){
      recognized.push(Math.round((info[i] + info[i+1])/2));
    }else{
      //if consecutive frequencies are more than four apart and the length of recognized is greater than 2
      if(recognized.length > 2){
        //if the run is greater than 
        messageparts.push(roundedAverage(recognized));
        //if there are more than 8 of similar frequency, I will assume it was two consecutive of the same frequency
        if(recognized.length > 8){
          messageparts.push(roundedAverage(recognized));
        }
        recognized = [];
      }
    }
}
  console.log("before trim messageparts: " + messageparts);
  //go through messageparts and remove the elements that are not within 2 of a myinfobuckets and get to an array where all elements can be found in myinfobuckets
  for(let i = messageparts.length - 1; i > 0; i--){
    if(!myinfobuckets.includes(messageparts[i]) && !myinfobuckets.includes(messageparts[i] + 1) && !myinfobuckets.includes(messageparts[i] - 1) && !myinfobuckets.includes(messageparts[i] + 2) && !myinfobuckets.includes(messageparts[i] - 2)){ 
      messageparts.splice(i,1);
    }
  }
  for(let i = 0; i < messageparts.length; i++){
    for(let j = 0; j < myinfobuckets.length; j++){
      if(Math.abs(messageparts[i] - myinfobuckets[j]) <= 2){
        messageparts[i] = myinfobuckets[j];
      }
    }
  }
  console.log("after trim messageparts: " + messageparts);
  
  //hold the single values for the info buckets
  let singles = [];
  let finishedpreamble = false;
  //sometimes I guess it works so we'll go with that
  for(let i = 0; i < messageparts.length; i++){
    //skip over preambles at start
    if(messageparts[i] == myinfobuckets[0] && !finishedpreamble){
      finishedpreamble = true;
    }
    else{
      if(messageparts[i] == messageparts[i+1]){
        //skip one more forward on i
        i++;
        //add it to singles (both are the same)
        singles.push(messageparts[i]);
      }
      else{
        singles.push(messageparts[i]);
      }
    }
  }
  console.log("singles: " + singles);

}


//return the bucket with the frequency that is most prominent
function analyzeFrequency(spectrum) {
  let max = 0;
  for(let i = 0; i < 320; i++){
    if(spectrum[i] > max){
      max = i;
    }
  }
  return max;
}
