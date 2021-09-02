const express = require("express");
const tokens = process.env["tokens"].split(",");
const emoticons = require("./emoticons.json");
const concat = require("concat-stream");
const fs = require("fs")
const base85 = require("base85");
const checksum = require('checksum');
const Database = require("@replit/database")
const db = new Database()
const domains = process.env["domains"].split(",");
const bent = require('bent');
const RandExp = require("randexp");
const fetch = require('node-fetch');

var storage_tokens = {}
var storage_amounts = {}

var total_db_size_used = 0;

const ping = async (token=0) => {
  if (token !== process.env["ping_token"]) {
    return "<style>body{background:black;color:white;}</style>You are unauthenticated!";
  }
  total_db_size_used = 0;
  for (const key of Object.keys(storage_tokens)) {
    let response = await fetch(`https://${key.split("_")[1]}.${key.split("_")[0]}.repl.co/ping`)
    if (!response.ok) {
      console.log(`Repl ${key} is offline, revoking token and removing from network.`)
      delete storage_amounts[key]
      delete storage_tokens[key]
      db.delete(`token_${key}`)
    }
    storage_amounts[key] = await response.text()
    storage_tokens[key] = await db.get(`token_${key}`)
    console.log(`Pinged ${key.split("_")[1]}.${key.split("_")[0]}.repl.co`);
    total_db_size_used += parseInt(storage_amounts[key])
  }
  db.set('storage_tokens', storage_tokens)
  db.set('storage_amounts', storage_amounts)
  console.log("Synced active repls database")
  let total_db_size_used_mb = total_db_size_used/1048576;
  let total_db_size_mb = ((Object.keys(storage_amounts).length)*52428800)/1048576;
  console.log(`The total database size is: ${total_db_size_used/1048576}/${((Object.keys(storage_amounts).length)*52428800)/1048576}MB (${total_db_size_used_mb/total_db_size_mb}%)`)
  return "<style>body{background:black;color:white;}</style>done";
}

db.get("storage_tokens").then(value => {
  storage_tokens = value;
  db.get("storage_amounts").then(value => {
    storage_amounts = value;
      ping(process.env['ping_token']).then(() => {
        console.log("Currnently active repls: ")
        console.log(Object.keys(storage_tokens))
      })
  });
});

const genFn = ((base64) => {
  return checksum(base64).substring(0,6) 
})

// remake  this - done
const genToken = () => {
  return new RandExp("[A-Za-z]{26}\\.\\d{5}\\.[a-z]{3}h[a-z]{16}\\.[A-Z]{24}h[A-Z]{3}[A-Za-z]{50}").gen()
}

const app = express();

app.use(express.static(__dirname + "/static"));
app.use((req, res, next) => {req.pipe(concat(function(data){req.body = data;next()}))});
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render(__dirname + "/views/index", {emote1: emoticons[Math.floor(Math.random() * emoticons.length)], emote2: emoticons[Math.floor(Math.random() * emoticons.length)]});
})


app.get("/ping", async (req, res) => {
  console.log("Pinging Repls")
  let resp = await ping(req.headers["token"])
  return res.send(resp)
})

app.get("/imalive/:repl_owner/:repl_slug", async (req, res) => {
  let auth_token;
  try {
    auth_token = await db.get(`token_${req.params.repl_owner}_${req.params.repl_slug}`)
    .then(async token => {
      if (token == null) {
        throw Error;
      }
      console.log(`Successfully synced https://${req.params.repl_slug}.${req.params.repl_owner}.repl.co/`)
    })
  } catch {
    auth_token = await genToken()
    let temp_token = await genToken().substring(0, 6)
    db.set(`token_${req.params.repl_owner}_${req.params.repl_slug}`, auth_token)
    fetch(`https://${req.params.repl_slug}.${req.params.repl_owner}.repl.co/newtoken`, { method: 'GET', headers: {'temp_token': temp_token}})
    .then(res => res.text())
    .then(async response_content => {
      console.log(`Successfully updated token for https://${req.params.repl_slug}.${req.params.repl_owner}.repl.co/`)
    })
    db.set(`temp_${req.params.repl_owner}_${req.params.repl_slug}`, temp_token)
  }
  storage_tokens[`${req.params.repl_owner}_${req.params.repl_slug}`] = auth_token
  db.set('storage_tokens', storage_tokens)

  //let storage_amounts = await db.get('storage_amounts');
  storage_amounts[`${req.params.repl_owner}_${req.params.repl_slug}`] = await fetch(`https://${req.params.repl_slug}.${req.params.repl_owner}.repl.co/ping`) 
  db.set('storage_amounts', storage_amounts)
  res.send("success!")
})

app.get('/retrieveToken', async (req, res) => {
  let temp_token = req.headers['temp_token'];
  let repl_owner = req.headers['repl_owner'];
  let repl_slug = req.headers['repl_slug'];
  let resulting_token = await db.get(`token_${repl_owner}_${repl_slug}`)
  let temp_token_db = await db.get(`temp_${repl_owner}_${repl_slug}`);
  if (temp_token != temp_token_db) {
    res.send("Temporary token incorrect!")
  } else {
    res.send(resulting_token)
  }
  return
})

app.get("/:imageID", async (req, res) => {
  db.get(req.query['imageID']).then((val) => {
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

app.post("/upload", async (req, res) => {
  if (tokens.indexOf(req.headers["token"]) < 0) {
    return res.status(401).send("You are unauthenticated!")
  }

  let list_of_servers = Object.keys(storage_amounts)
  let server_most_available = list_of_servers[0];
  for (let i = 0; i < list_of_servers.length; i++) {
    if (storage_amounts[list_of_servers[i]] < storage_amounts[server_most_available]) {
      server_most_available = list_of_servers[i];
    }
  }

  let server_url = `https://${server_most_available.split('_')[1]}.${server_most_available.split('_')[0]}.repl.co/upload`
  const filename = req.query["og"];
  const fileext = "." + filename.split(".")[filename.split(".").length - 1];

  //example name:
  //piemadd_storagerepl_n23e8n.png
  
  let data_base64 = await Buffer.from(req.body, "binary").toString("base64")
  let savename = `${server_most_available}_${genFn(data_base64)}.${fileext}`;
  let post = bent(server_url, 'POST', 'json', 200);
  let response = await fetch(server_url, { method: 'POST', body: {'data': data_base64, 'savename': savename} })
  if (response.text() != 'upload complete') {
    response.error("There was an error with uploading your image to the target server")
  } else {
    response.send(req.query['base_site'] + savename)
  }
}); 

app.listen(3000, () => {
  console.log("server started");
});