const Database = require("@replit/database")
const db = new Database()

db.list().then(keys => {
  for (let i = 0; i < keys.length; i++) {
    if (!keys[i].startsWith('token')) {
      console.log('deleting ' + keys[i])
      db.delete(keys[i])
    } else {
      console.log('  skipping ' + keys[i])
    }
  }
});