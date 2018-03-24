const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');
const app = express();

const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

/* Add middleware that automatically parses forms and stores the result
as a dictionary (object) in req.body. */
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

// Database of TinyURL-longURL pairs.
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

// Generate a random TinyURL.
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
    Object.keys(urlDatabase).forEach(function(tinyUrl){
      if (id === urlDatabase[tinyUrl].userID) {
        userUrlDatabase[tinyUrl] = urlDatabase[tinyUrl].url;
      }
    });
  }
  return userUrlDatabase;
}

// HOME PAGE
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});


// REGISTRATION PAGE
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

// Registration handler.
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email && password) {
    let emailMatch = 0;
    Object.keys(users).forEach(function(user) {
      if (email === users[user].email) {
        emailMatch++;
      }
    });
    if (emailMatch) {
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

// LOGIN PAGE
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

// Login handler.
app.post("/login", (req, res) => {
  const givenID = req.body.user;
  const givenPassword = req.body.password;

  // Compare username and password (encrypted or unencrypted) against database.
  let userMatch = 0;
  Object.keys(users).forEach(function(user) {
    if (givenID === users[user].id && (givenPassword === users[user].password ||
        bcrypt.compareSync(givenPassword, users[user].password))) {
      userMatch++;
    }
  });

  // If match:
  if (userMatch) {
    req.session.user_id = givenID;
    res.redirect("/urls");

  // If no match:
  } else {
    res.status(403).send(`<html><body>Wrong username/password combination. <a href="/login">Try again</a>.</body></html>\n`);
  }
});

// LOGOUT -- Clear session cookie.
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

// CREATE A NEW TinyURL
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

// Handler for new TinyURLs
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

// TINY URL DASHBOARD (for a given TinyURL)
app.get("/urls/:id", (req, res) => {
  if (req.session.user_id) {
    const userId = req.session.user_id;

    // Check whether the provided TinyURL matches anything from the database.
    let urlMatch = 0;
    Object.keys(urlDatabase).forEach(function(tinyURL) {
      if (tinyURL === req.params.id) {
        urlMatch++;
      }
    });

    // If there is a match, verify whether the TinyURL is assigned to the user.
    if (urlMatch) {
      userMatch = 0;
      if (userId === urlDatabase[req.params.id].userID) {
          userMatch++;
      }

      // If assigned to the user, render page.
      if (userMatch) {
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

/* EDIT the long URL associated with a given TinyURL
and update the URL database.*/
app.post("/urls/:id", (req, res) => {
  if (req.session.user_id) {
    const userId = req.session.user_id;
    const shortURL = req.params.id;

    // Check whether logged-in user owns the TinyURL.
    userMatch = 0;
    if (userId === urlDatabase[shortURL].userID) {
        userMatch++;
    }
    if (userMatch) {
      urlDatabase[shortURL].url = req.body.longURL;
      res.redirect("/urls");
    } else {
      res.status(403).send("Forbidden.\n");
    }

  } else {
    res.status(401).send("Access denied.\n");
  }
});

// DELETE a given TinyURL.
app.post("/urls/:id/delete", (req, res) => {
  if (req.session.user_id) {
    const userId = req.session.user_id;

    // Allow to delete the TinyURL if assigned to the logged-in user.
    userMatch = 0;
    if (userId === urlDatabase[req.params.id].userID) {
        userMatch++;
    }
    if (userMatch) {
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

  // Check whether the provided short URL matches anything from the database.
  let match = 0;
  Object.keys(urlDatabase).forEach(function(tinyURL) {

    // Check for a match.
    if (tinyURL === req.params.shortURL) {
      match++;
    }
  });

  // If there is a match, redirect.
  if (match) {
    const longURL = urlDatabase[req.params.shortURL].url;
    res.redirect(longURL);

  // If there is no match, display error.
  } else {
    res.status(404).send("<html><body>This TinyURL does not exist. Please try again.</body></html>\n");
  }
});

// Add event listener to the selected port.
app.listen(PORT, () => {
  console.log(`TinyApp is listening on port ${PORT}!`);
});



