// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
const mongo = require('mongodb').MongoClient;
// regex to check if we receive a valid http or https url
const expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
const URLregex = new RegExp(expression);

const dbURL = "mongodb://" + process.env.USERNAME + ":" + process.env.PASSWORD + "@ds159024.mlab.com:59024/tiny-url";
let db;
let listener;

mongo.connect(dbURL, (err, database) => {
  if (err) return console.log(err)
  db = database;
  listener = app.listen(process.env.PORT, function () {
    console.log('Your app is listening on port ' + listener.address().port);
  });
})


app.use(express.static('public'));

app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/:urlCode", function (req, res) {
  if (req.params.urlCode && req.params.urlCode.match(/[0-9]{7}/)) {
    let code = req.params.urlCode;
    db.collection('urls').find({'urlCode': code}).toArray((err, data) => {
      if (err) console.log(err);
      if (data.length !== 0) {
        console.log("data", data[0].url); 
        res.setHeader('Content-Type', 'application/json');
        res.redirect(data[0].url);
      } else {
        console.log("No data found");
        res.send(JSON.stringify({"error": "no data found"}));
      }
    })
  } else {
    console.log("invalid search query")
    res.send(JSON.stringify({"error": "invalid query"}));
  }
});

app.get('/new/*', (req, res) => {
  let url = req.params[0];
  let newCode = Math.floor(Math.random() * 10000000).toString();
  let newUrl = { "url": url, "urlCode": newCode};
  
  db.collection('urls').find({'url': url}).toArray((err, data) => {
    if (err) console.log(err);
    if (data.length !== 0) {
      console.log("this does already exist", data[0]); 
      res.send(JSON.stringify({"error": "already exists", "original_url": data[0].url, 
                               "short_url": "https://curse-forger.glitch.me/" + data[0].urlCode}));
    } else {
      if (url.match(URLregex)) {
    db.collection('urls').save(newUrl, (err, result) => {
      if (err) return console.log(err);
      let urlJSON = {"original_url": url, "short_url": "https://curse-forger.glitch.me/" + newCode};
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(urlJSON));
      })
        console.log("url:", req.params.url);
      } else {
        res.send(JSON.stringify({"error": "link already exists"}));
      }
    }
  });
});