//run this file if there is an update available for the storage repl
//can be run in the shell without stopping index.js

//might have to run 2 or three times to make sure the other repls update and start back up properly

const fetch = require('node-fetch');
const Database = require("@replit/database")
const db = new Database()

db.get("storage_tokens").then(tokens => {
  let list_of_repls = Object.keys(tokens)
  for (let i = 0; i < list_of_repls.length; i++) {
    let repl = list_of_repls[i].split("_")
    if (repl[0] == 'five-nine') {
      continue;
    } 
    console.log(`Updating for @${repl[0]}/${repl[1]}`)
    fetch(`https://${repl[1]}.${repl[0]}.repl.co/update`, { method: 'GET', headers: { token: tokens[list_of_repls[i]] }})
  }
});
