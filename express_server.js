var express = require("express");
const bodyParser = require("body-parser");
var app = express();

// Port 80 or the one my environment is using?
var PORT = process.env.PORT || 8080;

// Use ejs view engine.
app.set("view engine", "ejs");

// Parse POST requests.
app.use(bodyParser.urlencoded({extended: true}));

// Database of URL pairs.
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Generate a random short URL.
function generateRandomString() {
  let randomStr = "";
  let possibleChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    randomStr += possibleChar.charAt(Math.floor(Math.random() * possibleChar.length));
  }
  return randomStr;
}

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

/* URL directory webpage. */
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// Webpage where the user can create a new short URL.
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

/* Webpage that displays the long URL of a given short one
(i.e., equivalent to a search engine). */
app.get("/urls/:id", (req, res) => {
  let templateVars = { urls: urlDatabase, shortURL: req.params.id };
  res.render("urls_show", templateVars);
});

// Webpage that redirects from short URL to the target website.
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// Process POST requests. Redirects to a page that displays the new URL pair.
app.post("/urls", (req, res) => {
  console.log(req.body);
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls/" + shortURL);
})

// Add event listener to the selected port.
app.listen(PORT, () => {
  console.log(`TinyApp is listening on port ${PORT}!`);
});



