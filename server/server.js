const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');

const port = 3000;
const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173', // or your client's address
    credentials: true,
  })
);

app.use(
  session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

//sets up a middleware function so the server can use the JSON from requests
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// It sets up all the routes with the correct controller
app.use('/', require('./router.js'));

app.listen(port, () => {
  console.log(`Server is running on ${port}.`);
});
