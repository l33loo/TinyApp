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

const users = {
  "l33loo": {
    id: "l33loo",
    email: "l33loo@l33loo.com",
    password: "purple"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

// Database of URL pairs.
const urlDatabase = {

  "b2xVn2": {
    userID: "l33loo",
    url: "http://www.lighthouselabs.ca",
  },
  "9sm5xK": {
    userID: "user2RandomID",
    url: "http://www.google.com"
  }
}

// Generate a random short URL.
function generateRandomString() {
  let randomStr = "";
  let possibleChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    randomStr += possibleChar.charAt(Math.floor(Math.random() * possibleChar.length));
  }
  return randomStr;
}





// HOME PAGE
app.get("/", (req, res) => {
  res.end("Hello!");
});

// Access URL database in JSON format.
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


// REGISTER
app.get("/register", (req, res) => {
  let templateVars = { users: users, user: undefined,
    email: req.body.email, password: req.body.password }
  res.render("registration", templateVars);
});

// Registration handler.
app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (email && password) {
    let emailMatch = 0;
    Object.keys(users).forEach(function(user) {
      if (email === users[user].email) {
        emailMatch++;
      }
    });
    if (emailMatch) {
      res.status(400);
      res.send("This email is already registered.");
      } else {
        let user_id = generateRandomString();
        users[user_id] = {
          id: user_id,
          email: email,
          password: password
        };
        res.cookie("user_id", user_id);
        res.redirect("/urls");
        }
  } else {
    res.status(400);
    res.send("You must enter a valid email and a password to register.");
  }
});




// LOGIN PAGE
app.get("/login", (req, res) => {
  let templateVars = { urls: urlDatabase, users: users,
    user: undefined };
  res.render("login", templateVars);
});

// Add user_id for login via cookie.
app.post("/login", (req, res) => {
  let givenID = req.body.user;
  let givenPassword = req.body.password
  let userMatch = 0;
  Object.keys(users).forEach(function(user) {
    if (givenID === user && users[user].password === givenPassword) {
      userMatch++;
    }
  });

  if (userMatch) {
      res.cookie("user_id", givenID).redirect("/");
  } else {
    res.status(403).send("Wrong username/password combination. Try again.");
  }
  // console.log(req.body.user_id);
});

// Clear user_id cookie.
app.post("/logout", (req, res) => {
  res.clearCookie("user_id").redirect("/login");
});




// URL DIRECTORY
app.get("/urls", (req, res) => {
  if (req.cookies["user_id"]) {
    let userId = req.cookies["user_id"];
    let templateVars = { urls: urlDatabase, users: users,
      user: users[userId].id };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

// Create a new short URL and update the URL database.
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls/" + shortURL);
});






// NEW TINYURL
app.get("/urls/new", (req, res) => {
  let userId = req.cookies["user_id"];
  if (userId) {
    let templateVars = { urls: urlDatabase, users: users,
      user: users[userId].id };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login")
  }
});






// TINY URL
app.get("/urls/:id", (req, res) => {

  let userId = req.cookies["user_id"];

  // Check whether the provided short URL matches anything from the database.
  let urlMatch = 0;
  Object.keys(urlDatabase).forEach(function(key) {

    // Check for match.
    if (key === req.params.id) {
      urlMatch++;
    }
  });

  // If there is a match, redirect.
  if (urlMatch) {
    let templateVars = { urls: urlDatabase, shortURL: req.params.id,
      users: users, user: users[userId].id };
    res.render("urls_show", templateVars);

  // If there is no match, display error.
  } else {
    res.end("<html><body>This TinyURL does not exist. Please try again.</body></html>\n");
  }
});

/* EDIT the long URL associated with a given TinyURL
and update the URL database.*/
app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL;
});

// DELETE a given short URL.
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});






// REDIRECT from TinyURL to target website. Accessible to anyone.
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







// Add event listener to the selected port.
app.listen(PORT, () => {
  console.log(`TinyApp is listening on port ${PORT}!`);
});



