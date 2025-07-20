const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const routes = require('./routes');

const port = 5173;
const app = express();

app.use(
  cors({
    origin: 'http://localhost:' + port,
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

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use('/', routes);

app.listen(port, () => {
  console.log(`Server is running on ${port}.`);
});
