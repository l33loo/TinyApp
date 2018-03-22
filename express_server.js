var express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
var app = express();

// Connect to my environment's default port. If that fails, use port 8080.
var PORT = process.env.PORT || 8080;

// Use ejs as view engine.
app.set("view engine", "ejs");

/* Add middleware that automatically parses forms and stores the result
as a dictionary (object) in req.body. */
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());

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

// Access home page.
app.get("/", (req, res) => {
  res.end("Hello!");
});

// Access URL database in JSON format.
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Access Hello page.
app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

// Access URL directory webpage.
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

// Access webpage where the user can create a new short URL.
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

/* Access webpage that displays the long URL of a given short one
(like a search engine). */
app.get("/urls/:id", (req, res) => {

  // Check whether the provided short URL matches anything from the database.
  let match = 0;
  Object.keys(urlDatabase).forEach(function(key) {

    // Check for match.
    if (key === req.params.id) {
      match++;
    }
  });

  // If there is a match, redirect.
  if (match) {
    let templateVars = { urls: urlDatabase, shortURL: req.params.id, username: req.cookies["username"] };
    res.render("urls_show", templateVars);

  // If there is no match, display error.
  } else {
    res.end("<html><body>This TinyURL does not exist. Please try again.</body></html>\n");
  }
});

// Access webpage that redirects from short URL to the target website.
app.get("/u/:shortURL", (req, res) => {

  // Check whether the provided short URL matches anything from the database.
  let match = 0;
  Object.keys(urlDatabase).forEach(function(key) {

    // Check for a match.
    if (key === req.params.shortURL) {
      match++;
    }
  });

  // If there is a match, redirect.
  if (match) {
    let longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);

  // If there is no match, display error.
  } else {
    res.end("<html><body>This TinyURL does not exist. Please try again.</body></html>\n");
  }
});

// Clear username cookie.
app.post("/logout", (req, res) => {
  let username = req.cookies["username"];
  res.clearCookie("username");
  res.redirect("/urls");
});

// Add username for login via cookie.
app.post("/login", (req, res) => {
  let username = req.cookies["username"];
  res.cookie("username", username);
  res.redirect("/urls");
  // console.log(req.body.username);
});

/* Change the long URL associated with a given TinyURL
and update the URL database.*/
app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL;
});

// Create a new short URL and update the URL database.
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls/" + shortURL);
});

// Delete a given short URL.
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// Add event listener to the selected port.
app.listen(PORT, () => {
  console.log(`TinyApp is listening on port ${PORT}!`);
});



