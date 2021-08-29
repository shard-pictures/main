const Database = require("@replit/database")
const db = new Database()

db.list().then(keys => {
  console.log(keys)
  for (const key in keys) {
    db.delete(keys[key]).then(() => {console.log(`deleted ${keys[key]}`)});
  }
});