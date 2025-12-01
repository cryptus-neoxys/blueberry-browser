const { Trie } = require("@kamilmielnik/trie");

const trie = new Trie();
const words = ["hello", "help", "world"];

console.log("Adding words...");
// Try fromArray if it exists
if (typeof trie.fromArray === "function") {
  trie.fromArray(words);
  console.log("Used fromArray");
} else {
  words.forEach((w) => trie.add(w));
  console.log("Used add loop");
}

console.log('Searching "hel"...');
const result = trie.find("hel");
console.log("Result type:", typeof result);
console.log("Result:", result);

if (result) {
  console.log("Keys:", Object.keys(result));
  // Check if it has children or similar
}
