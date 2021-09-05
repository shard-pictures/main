const Database = require("@replit/database")
const db = new Database()

let repl_owner = "five-nine" //put the name of the repl owner here
let repl_slug = "GNqyu6VL91s" //put the slug of the repl here (name)

console.log("Deleting token")
db.delete(`token_${repl_owner}_${repl_slug}`).then(() => {
  console.log("Deleted token")
});

db.get("storage_amounts").then(async value => {
  console.log("Deleting from storage amounts")
  await delete value[`${repl_owner}_${repl_slug}`]
  console.log("Deleted from storage amounts")
  db.set("storage_amounts", value).then(() => {console.log("Updated db")})
});

db.get("storage_tokens").then(async value => {
  console.log("Deleting from storage tokens")
  await delete value[`${repl_owner}_${repl_slug}`]
  console.log("Deleted from storage tokens")
  db.set("storage_tokens", value).then(() => {console.log("Updated db")})
});

db.get("storage_tokens").then(value => {});