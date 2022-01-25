let mic;

function setup(){
  mic = new p5.AudioIn();
  mic.start();
}

function draw(){
  console.log(mic.getLevel());
}
