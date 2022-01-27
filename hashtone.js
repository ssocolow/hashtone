//max duration in milliseconds
let DUR = 5000;

//https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
async function digestMessage(message) {
  const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
  //first uint8 is red value, next is green, next is blue
  colorHash(hashArray);
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
  return hashHex;
}

let wave;

function getInput() {
  let address = document.getElementById("address").value;
  digestMessage(address).then(hex => playSound(hex));
}

//https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
async function playSound(hex) {
  document.getElementById("hsh").innerHTML = hex;
  wave = new p5.Oscillator();
  //Options: 'sine' (default), 'triangle', 'sawtooth', 'square' (Optional)
  wave.setType('sine');
  wave.start();
  //keep track of how much time music has been playing
  let millistaken = 0;
  for(let i = 0; i < hex.length; i+=2) {
    if(millistaken <= DUR) { 
      changeSound(chooseSound(hex[i]),0.1);
      await sleep(getDuration(hex[i+1]));
    }
    millistaken += getDuration(hex[i+1]);
    console.log(millistaken);
  }
  let fadetime = 0.2
  wave.amp(0,fadetime);
  await sleep(fadetime * 1000);
  wave.stop(1);
}

//calculate the frequency in Hz of the key-th key on an idealized standard piano
//https://en.wikipedia.org/wiki/Piano_key_frequencies
function calcFrequency(key) {
  return Math.pow(2, (key - 49)/12) * 440;
}

//for sound can vary: frequency, amplitude, duration

//returns the base 10 number associated with hex char
function getNum(hex) {
  return parseInt(hex, 16);
}

//return the note's frequency from the hex character
//key range: 37 - 67
//range of frequency: 261.6 - 523.25 
function chooseSound(c){
  let num = getNum(c);
  //num is 0 to 15
  let key = num*2 + 37;
  return calcFrequency(key); 
}

//map function
function map(value, start1, stop1, start2, stop2) {
  const newval = (value - start1) / (stop1 - start1) * (stop2 - start2) + start2;
  return newval;
}
//return the note's duration from the next hex character
//range of duration (milliseconds): 100 - 2000
function getDuration(c) {
  let n = getNum(c);
  let duration = map(n, 0, 15, 50, 800);
  return duration;
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function changeSound(freq, amp) {
  wave.freq(freq);
  wave.amp(amp);
}

//make color for address
function colorHash(ints) {
  let c = document.getElementById("myCanvas");
  let ctx = c.getContext("2d");
  let rgb = [0,0,0];
  console.log(ints); 
  ctx.fillStyle = `rgb(
        ${ints[0]},
        ${ints[1]},
        ${ints[2]})`;
  ctx.fillRect(0,0,c.width,c.height);
}
