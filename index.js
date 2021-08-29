const express = require("express");
const tokens = process.env["tokens"].split(",");
const emoticons = require("./emoticons.json");
const concat = require("concat-stream");
const fs = require("fs")
const base85 = require("base85");
const Database = require("@replit/database")
const db = new Database()
const domains = process.env["domains"].split(",");

// db.list().then(keys => {
//   console.log(keys)
//   for (const key in keys) {
//     db.delete(keys[key]).then(() => {console.log(`deleted ${keys[key]}`)});
//   }
// });


const genFn = () => {  
  return require('crypto')
    .randomBytes(7)
    .toString('base64')
    .slice(0, 7)
}

const app = express();

app.use(express.static(__dirname + "/static"));
app.use((req, res, next) => {req.pipe(concat(function(data){req.body = data;next()}))});
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render(__dirname + "/views/index", {emote1: emoticons[Math.floor(Math.random() * emoticons.length)], emote2: emoticons[Math.floor(Math.random() * emoticons.length)]});
})

app.get("/*", (req, res) => {
  // if (fs.existsSync(__dirname + "/uploads/" + req.path)) {
  //   return res.sendFile(__dirname + "/uploads" + req.path)
  // }
  // console.log(req.path.substring(1))
  db.get(req.path.substring(1)).then((val) => {
    // if (val == null) {return res.status(404).send("File not found (；′⌒`)");}
    if (val == null) {
      fs.readFile(__dirname + "/static/fileNotFound.png", (err, data) => {
        if(err) {
          console.log(err);
          return
        }
        res.status(307).write(data);
        return res.end();
      })
    } else {
      res.write(Buffer.from(val, "base64"));
      res.end();
    }
  })
})

app.post("/upload", (req, res) => {
  if (tokens.indexOf(req.headers["token"]) < 0) {
    return res.status(401).send("You are unauthenticated!")
  }
  const filename = req.query["og"];
  const fileext = "." + filename.split(".")[filename.split(".").length - 1];
  const savename = genFn() + fileext;
  // const savename = "favicon.ico"; // to force a filename
  db.set(savename, Buffer.from(req.body, "binary").toString("base64")).then(() => {
    return res.send(`https://${domains[Math.floor(Math.random() * (domains.length - 1))]}/${savename}`);
  });
  // fs.writeFile(__dirname + '/uploads/' + savename, Buffer.from(req.body), err => {
  //   if (err) {
  //     return res.status(500).send(err);
  //   }
  // })
});

app.listen(3000, () => {
  console.log("server started");
});