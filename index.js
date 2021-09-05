const express = require("express");
const emoticons = require("./emoticons.json");
const domains = require("./domains.json")
const concat = require("concat-stream");
const fs = require("fs")
const checksum = require('checksum');
const Database = require("@replit/database")
const db = new Database()
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
  for (const key of Object.keys(storage_amounts)) {
    let offline = false;
    let response = await fetch(`https://${key.split("_")[1]}.${key.split("_")[0]}.repl.co/ping`).catch(async () => {
      console.log(`Repl ${key} is offline, revoking token and removing from network. - request error`)
      await delete storage_amounts[key]
      //await delete storage_tokens[key]
      await db.delete(`token_${key}`)
      await db.set('storage_amounts', storage_amounts)
      //await db.set('storage_tokens', storage_tokens)
      offline = true;
    })
    if (offline) {continue}
    if (!response.ok) {
      console.log(`Repl ${key} is offline, revoking token and removing from network. - Non ok response`)
      await delete storage_amounts[key]
      //await delete storage_tokens[key]
      await db.delete(`token_${key}`)
      await db.set('storage_amounts', storage_amounts)
      //await db.set('storage_tokens', storage_tokens)
      offline = true;
    }
    if (offline) {continue}
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
  let blacklist = ['five-nine'];
  if (req.params.repl_owner == 'five-nine') {
    res.status(401).send("poop")
  }
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

app.post("/upload", async (req, res) => {
  if (Object.values(storage_tokens).indexOf(req.headers["token"]) < 0) {
    return res.status(401).send("You are unauthenticated!")
  }

  let list_of_servers = Object.keys(storage_amounts).splice('piemadd_RuSXLwR38U3')
  let server_most_available = list_of_servers[0];
  for (let i = 0; i < list_of_servers.length; i++) {
    if (storage_amounts[list_of_servers[i]] < storage_amounts[server_most_available]) {
      server_most_available = list_of_servers[i];
    }
  }

  // server_most_available = 'piemadd_repldb-cdn-storage' // why was this still uncommented lmao

  let server_url = `https://${server_most_available.split('_')[1]}.${server_most_available.split('_')[0]}.repl.co/upload`

  if (req.query["preferredHost"]) {server_url = `https://${req.query["preferredHost"]}.repl.co/upload`}
  
  let server_token = await db.get(`token_${server_most_available}`)

  const filename = req.query["og"];
  const fileext = filename.split(".")[filename.split(".").length - 1];
  
  const base_sites = req.query['baseSite'].split(',')
  const base_site = base_sites[Math.floor(Math.random() * base_sites.length)]

  let data_base64 = await Buffer.from(req.body, "binary").toString("base64")
  let savename = `${server_most_available}_${genFn(data_base64)}.${fileext}`;
  let response = await fetch(server_url, { method: 'POST', body: JSON.stringify({'data': data_base64, 'savename': savename}), headers: { token: server_token, 'content-type': 'application/json' } })
  let response_from_server = await response.text()
  if (response_from_server != 'upload complete') {
    console.log(response_from_server)
    console.log(server_most_available)
    res.status(500).send("There was an error with uploading your image to the target server")
  } else {
    res.send('https://' + base_site + '/' + savename)
  }
});
const confirm_allowed = async (username) => {
  console.log(username)
  if (username == null || username == "") {return false}
  let active_repls_list = Object.keys(storage_tokens)
  for (let i = 0; i < active_repls_list.length; i++) {
    if (active_repls_list[i].indexOf(username) >= 0) {
      return true
    }
  }
  return false
}

app.get("/dashboard", async (req, res) => {
  if (await confirm_allowed(req.headers['x-replit-user-name'])) {
    const user_repls = Object.keys(storage_tokens).filter((repl_id) => repl_id.startsWith(req.headers['x-replit-user-name']));
    res.render(__dirname + "/views/dashboard", {
      repls: user_repls
    })
  } else {
    if (req.headers['x-replit-user-name']) {
      res.status(403).send("<style>body{background:black;color:white;}</style>You don't have a storage repl running, which you can fork from <a href=\"https://replit.com/@piemadd/repldb-cdn-storage\">here</a>.")
    }
    res.render(__dirname + "/views/login")
  }
})

app.get("/dashboard/token/:repl_id", async (req, res) => {
  if (!req.params['repl_id'].startsWith(req.headers['x-replit-user-name'])) {
    res.status(403).send("That isn't your repl!")
  }
  const token = await db.get(`token_${req.params['repl_id']}`)
  return res.render(__dirname + "/views/show_token", {token: token})
})

app.get("/dashboard/regenerate/:repl_id", async (req, res) => {
  if (!req.params['repl_id'].startsWith(req.headers['x-replit-user-name'])) {
    res.status(403).send("That isn't your repl!")
  }
  return res.render(__dirname + "/views/regenerate", {repl_id: req.params['repl_id']})
})

app.get("/dashboard/:application/:repl_id", async (req, res) => {
  if (await confirm_allowed(req.headers['x-replit-user-name'])) {
    if (req.params['repl_id'].startsWith(req.headers['x-replit-user-name'])) {
      res.render(__dirname + "/views/config_gen", {
        domains: domains,
        repl_id: req.params['repl_id'],
        application: req.params['application']
      })
    } else {
      res.status(403).send("That isn't your repl!")
    }
  } else {
    res.status(403).send("<style>body{background:black;color:white;}</style>You are not logged in or don't have a storage repl running. If you don't have a storage repl, you can fork it from <a href=\"https://replit.com/@piemadd/repldb-cdn-storage\">here</a>. If you aren't logged in, you can do so <a href=\"https://shard.pictures/dashboard\">here</a>.")
  }
})

app.get("/sharex/:repl_id", async (req, res) => {
  if (!req.params['repl_id'].startsWith(req.headers['x-replit-user-name'])) {
    res.status(403).send("That isn't your repl!")
  }
  const token = await db.get(`token_${req.params['repl_id']}`)
  const domains_string = JSON.stringify(Object.values(req.query))
  const domains_string_final = domains_string.split("\"").join("").replace("[", "").replace("]", "")
  console.log(domains_string_final)
  let template = JSON.parse(fs.readFileSync('exampleconf.json').toString().replace('PUTSITESHERE', domains_string_final).replace('PUTTOKENHERE', token));
  return res.attachment(`shard_pictures.sxcu`).send(template)
})

app.get("/ksnip/:repl_id", async (req, res) => {
  if (!req.params['repl_id'].startsWith(req.headers['x-replit-user-name'])) {
    res.status(403).send("That isn't your repl!")
  }
  const token = await db.get(`token_${req.params['repl_id']}`)
  const domains_string = JSON.stringify(Object.values(req.query))
  const domains_string_final = domains_string.split("\"").join("").replace("[", "").replace("]", "")
  console.log(domains_string_final)
  let template = fs.readFileSync('exampleconf.sh').toString().replace('PUTSITESHERE', domains_string_final).replace('PUTTOKENHERE', token);
  return res.attachment(`shard_pictures.sh`).send(template)
})

app.get("/regenerate/:repl_id", async (req, res) => {
  if (!req.params['repl_id'].startsWith(req.headers['x-replit-user-name'])) {
    res.status(403).send("That isn't your repl!")
  }
  let repl_owner = req.params['repl_id'].split('_')[0]
  let repl_slug = req.params['repl_id'].split('_')[1]

  let auth_token = await genToken()
  let temp_token = await genToken().substring(0, 6)
  db.set(`token_${repl_owner}_${repl_slug}`, auth_token)
  fetch(`https://${repl_slug}.${repl_owner}.repl.co/newtoken`, { method: 'GET', headers: {'temp_token': temp_token}})
  .then(res => res.text())
  .then(async response_content => {
    console.log(`Successfully updated token for https://${repl_slug}.${repl_owner}.repl.co/`)
  return res.redirect('https://shard.pictures/dashboard')
  })
})

app.get("/dashboard/rolldown/:repl_id", async (req, res) => {
  if (!req.params['repl_id'].startsWith(req.headers['x-replit-user-name'])) {
    res.status(403).send("That isn't your repl!")
  }
  return res.render(__dirname + "/views/rolldown", {repl_id: req.params['repl_id']})
})

app.get("/rolldown/:repl_id", async (req, res) => {
  db.set(`replacements_${req.params['repl_id']}`, [])
  if (!req.params['repl_id'].startsWith(req.headers['x-replit-user-name'])) {
    res.status(403).send("That isn't your repl!")
  }
  let repl_owner = req.params['repl_id'].split('_')[0]
  let repl_slug = req.params['repl_id'].split('_')[1]

  fetch(`https://${repl_slug}.${repl_owner}.repl.co/filenames`)
  .then(res => res.json())
  .then(async files => {
    for (let i = 0; i < files.length; i++) {
      const response = await fetch(`https://${repl_slug}.${repl_owner}.repl.co/${files[i]}`)
      const file_temp = await response.text()

      let list_of_servers = Object.keys(storage_amounts)
      let server_most_available = list_of_servers[0];
      for (let i = 0; i < list_of_servers.length; i++) {
        if (storage_amounts[list_of_servers[i]] < storage_amounts[server_most_available]) {
          server_most_available = list_of_servers[i];
        }
      }

      let server_url = `https://${server_most_available.split('_')[1]}.${server_most_available.split('_')[0]}.repl.co/upload`
      
      let server_token = await db.get(`token_${server_most_available}`)
      
      const filename = files[i];
      let replacements = await db.get(`replacements_${req.params['repl_id']}`)
      replacements[`${req.params['repl_id']}_${filename}`] = `${server_most_available}_${filename}`
      await db.set(`replacements_${req.params['repl_id']}`, replacements)

      const fileext = filename.split(".")[filename.split(".").length - 1];
      
      let savename = `${server_most_available}_${genFn(file_temp)}.${fileext}`;
      await fetch(server_url, { method: 'POST', body: JSON.stringify({'data': file_temp, 'savename': savename}), headers: { token: server_token, 'content-type': 'application/json' } })
    }
    console.log("Rolled down " + req.params['repl_id'])
  })

  delete storage_amounts[req.params['repl_id']]
  delete storage_tokens[req.params['repl_id']]

  db.delete(`token_${req.params['repl_id']}`)

  let auth_token = await genToken()
  let temp_token = await genToken().substring(0, 6)
  db.set(`token_${repl_owner}_${repl_slug}`, auth_token)
  fetch(`https://${repl_slug}.${repl_owner}.repl.co/newtoken`, { method: 'GET', headers: {'temp_token': temp_token}})
  .then(res => res.text())
  .then(async response_content => {
    console.log(`Successfully updated token for https://${repl_slug}.${repl_owner}.repl.co/`)
  return res.redirect('https://shard.pictures/dashboard')
  })
})

app.get("/:imageID", async (req, res) => {
  //piemadd_repldb-cdn-storage_da781c.txt
  let image_id = req.params['imageID'];

  let replacements = await db.get(`${image_id.split("_")[0]}_${image_id.split("_")[1]}`)

  if (replacements != null && replacements.indexOf(image_id) > -1) {
    image_id = replacements[image_id]
  }

  const owner = image_id.split("_")[0] // world's prettiest code hire me mark suckerberg
  const slug = image_id.split("_")[1]
  const fn = image_id.split("_")[2]
  let response = await fetch(`https://${slug}.${owner}.repl.co/${fn}`)
  let val = await response.text()
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

app.listen(3000, () => {
  console.log("server started");
});