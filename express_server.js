var express = require("express");
const bodyParser = require("body-parser");
var app = express();

// Parse POST requests.
app.use(bodyParser.urlencoded({extended: true}));

// Port 80 or the one my environment is using?
var PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

/* Pass the URL data into the TinyApp URL directory
(i.e., urls_index.ejs template).
*/
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// Display a single URL and its shortened form.
app.get("/urls/:id", (req, res) => {
  let templateVars = { urls: urlDatabase, shortURL: req.params.id };
  res.render("urls_show", templateVars);
});

//
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// Process POST requests.
app.post("/urls", (req, res) => {
  console.log(req.body);
  res.send("Ok");
});

app.listen(PORT, () => {
  console.log(`TinyApp is listening on port ${PORT}!`);
});

