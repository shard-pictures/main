const Database = require("@replit/database")
const db = new Database()

db.list().then(keys => {
  for (const key in keys) {
    console.log(`${keys[key]}`);
  }
});