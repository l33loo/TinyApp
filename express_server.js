const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');
const app = express();

const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  secret: "fujlsispogksdjg"
}));

// Database of users.
const users = {
  "l33loo": {
    id: "l33loo",
    email: "l33loo@l33loo.com",
    password: "purple"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher"
  }
}

// Database of TinyURLs.
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

function generateRandomString() {
  let randomStr = "";
  const possibleChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    randomStr += possibleChar.charAt(Math.floor(Math.random() * possibleChar.length));
  }
  return randomStr;
}

// Return a database of user's own TinyURLs.
function urlsForUser(id) {
  const userUrlDatabase = new Object();
  if (urlDatabase) {
    Object.keys(urlDatabase).forEach(function(tinyUrl) {
      if (id === urlDatabase[tinyUrl].userID) {
        userUrlDatabase[tinyUrl] = urlDatabase[tinyUrl].url;
      }
    });
  }
  return userUrlDatabase;
}

function matchUser(id, url) {
  if (id === urlDatabase[url].userID) {
    return true;
  }
  return false;
}

function matchTinyURL(givenUrl) {
  Object.keys(urlDatabase).forEach(function(tinyURL) {
    if (tinyURL === givenUrl) {
      return true;
    }
  });
  return false;
}

function checkEmailRegistered(username) {
  Object.keys(users).forEach(function(user) {
    if (username === users[user].email) {
      return true;
    }
  });
  return false;
}

function checkLoginCred(givenID, givenPassword) {
  Object.keys(users).forEach(function(user) {
    if (givenID === users[user].email && (givenPassword === users[user].password ||
        bcrypt.compareSync(givenPassword, users[user].password))) {
      return true;
    }
  });
  return false;
}

function getUserNrFromEmail(email) {
  Object.keys(users).forEach(function(user) {
    if (email === users[user].email) {
      return user;
    }
  });
}

// HOME
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// REGISTRATION
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    let templateVars = {
                          users: users,
                          user: undefined,
                          email: req.body.email,
                          password: req.body.password
                        }
    res.render("registration", templateVars);
  }
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email && password) {
    if (checkEmailRegistered(email)) {
      res.status(400).send(`<html><body>This email is already registered. Please <a href="/login">login</a>.</body></html>\n`);
    } else {
      const user_id = generateRandomString();
      const hashedPassword = bcrypt.hashSync(password, 10);
      users[user_id] = {
        id: user_id,
        email: email,
        password: hashedPassword
      };
      req.session.user_id = user_id;
      res.redirect("/urls");
    }
  } else {
    res.status(400).send(`<html><body>You must enter a valid email and a password to register. <a href="/register">Try again.</a></body></html>\n`);
  }
});

// LOGIN
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/");
  } else {
    const templateVars = {
                          urls: urlDatabase,
                          users: users,
                          user: undefined
                        };
    res.render("login", templateVars);
}
});

app.post("/login", (req, res) => {
  const givenID = req.body.user;
  const givenPassword = req.body.password;
  if (checkLoginCred(givenID, givenPassword)) {
    req.session.user_id = getUserNrFromEmail(givenID);
    res.redirect("/urls");
  } else {
    res.status(403).send(`<html><body>Wrong username/password combination. <a href="/login">Try again</a>.</body></html>\n`);
  }
});

// LOGOUT
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/login");
});

// USER'S URL DIRECTORY
app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    const userId = req.session.user_id;
    const database = urlsForUser(userId);
    const templateVars = {
                            urls: database,
                            users: users,
                            user: userId
                          };
    res.render("urls_index", templateVars);
  } else {
    res.status(401).send(`<html><body>Access denied. Please <a href="/login">login</a> or <a href="/register">register</a> to access this page.</body></html>\n`);
  }
});

// NEW TinyURL
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const userId = req.session.user_id;
    const templateVars = {
                          urls: urlDatabase,
                          users: users,
                          user: userId
                        };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login")
  }
});

app.post("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const userId = req.session.user_id;
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
                              url: req.body.longURL,
                              userID: userId
                            };
    res.redirect("/urls/" + shortURL);
  } else {
    res.status(401).send(`<html><body>Access denied. Please <a href="/login">login</a> or <a href="/register">register</a> to access this page.</body></html>\n`);
  }
});

// TINY URL DASHBOARD
app.get("/urls/:id", (req, res) => {
  if (req.session.user_id) {
    const userId = req.session.user_id;
    if (matchTinyURL(req.params.id)) {

      // If TinyURL assigned to the user, render page.
      if (matchUser(userId, req.params.id)) {
        const templateVars = {
                              urls: urlDatabase,
                              shortURL: req.params.id,
                              users: users,
                              user: userId
                            };
        res.render("urls_show", templateVars);

      // If not assigned to the user:
      } else {
        res.status(403).send(`<html><body>Forbidden. You do not own this TinyURL.</body></html>\n`);
      }

    // If the TinyURL does not exist:
    } else {
      res.status(404).send("<html><body>This TinyURL does not exist. Please try again.</body></html>\n");
    }

  // If the user is not logged in:
  } else {
    res.status(401).send(`<html><body>Access denied. Please <a href="/login">login</a> or <a href="/register">register</a> to access this page.</body></html>\n`);
  }
});

// EDIT long URL
app.post("/urls/:id", (req, res) => {
  if (req.session.user_id) {
    const userId = req.session.user_id;
    const shortURL = req.params.id;
    if (matchUser(userId, req.params.id)) {
      urlDatabase[shortURL].url = req.body.longURL;
      res.redirect("/urls");
    } else {
      res.status(403).send("Forbidden.\n");
    }

  } else {
    res.status(401).send("Access denied.\n");
  }
});

// DELETE TinyURL.
app.post("/urls/:id/delete", (req, res) => {
  if (req.session.user_id) {
    const userId = req.session.user_id;
    if (matchUser(userId, req.params.id)) {
      delete urlDatabase[req.params.id];
      res.redirect("/urls");
    } else {
      res.status(403).send("Forbidden.\n");
    }
  } else {
    res.status(401).send("Access denied.\n");
  }
});

// REDIRECT FROM TinyURL TO TARGET WEBSITE. Accessible to all.
app.get("/u/:shortURL", (req, res) => {
  if (matchTinyURL(req.params.shortURL)) {
    const longURL = urlDatabase[req.params.shortURL].url;
    res.redirect(longURL);
  } else {
    res.status(404).send("<html><body>This TinyURL does not exist. Please try again.</body></html>\n");
  }
});

app.listen(PORT, () => {
  console.log(`TinyApp is listening on port ${PORT}!`);
});



