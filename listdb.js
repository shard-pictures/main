const Database = require("@replit/database")
const db = new Database()

db.list().then(keys => {console.log(keys)});