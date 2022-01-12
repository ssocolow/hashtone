
const text = 'An obscure body in the S-K System, your majesty. The inhabitants refer to it as the planet Earth.';

async function digestMessage(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return hash;
}

let h = digestMessage(text);
console.log(h);

function getInput() {
  let address = document.getElementById("address").value;
  console.log(address);
}
