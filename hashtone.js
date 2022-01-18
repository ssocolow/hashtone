//https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
async function digestMessage(message) {
  const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
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
  console.log(hex);
  wave = new p5.Oscillator();
  wave.setType('sine');
  wave.start();
  for(let i = 0; i < hex.length; i++) {
    changeSound(chooseSound(hex[i]),1);
    await sleep(100);
  }
  wave.stop();
}

function chooseSound(c){
  if(c === '0'){
    return 440;
  }if(c === '1'){
    return 466;
  }if(c === '2'){
    return 493;
  }if(c === '3'){
    return 523;
  }if(c === '4'){
    return 554;
  }if(c === '5'){
    return 587;
  }if(c === '6'){
    return 622;
  }if(c === '7'){
    return 659;
  }if(c === '8'){
    return 698;
  }if(c === '9'){
    return 740;
  }if(c === 'a'){
    return 784;
  }if(c === 'b'){
    return 830;
  }if(c === 'c'){
    return 880;
  }if(c === 'd'){
    return 932;
  }if(c === 'e'){
    return 988;
  }if(c === 'f'){
    return 1046.5;
  }else{
    console.error(c + ' is not in hexadecimal format');
  }
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function changeSound(freq, amp) {
  wave.freq(freq);
  wave.amp(amp);
}
