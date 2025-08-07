// server.js
import cors from 'cors';
import jsonServer from 'json-server';
import auth from 'json-server-auth';

const app = jsonServer.create();
const router = jsonServer.router('db.json');

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(jsonServer.bodyParser);
app.db = router.db;

const rules = auth.rewriter({
  '/auth/register': '/register',
  '/auth/login': '/login',
  '/auth/users': '/users',
  '/auth/me': '/me',
  '/dashboard/event': '/events',
  '/dashboard/event/:id': '/events/:id',
  '/dashboard/roster': '/roster',
  '/dashboard/roster/:id': '/roster/:id',
  '/general/get_students': '/students',
  '/general/get_student/:id': '/students/:id',
  '/general/search_student': '/students',
  '/general/subjects': '/subjects',
  '/general/subjects/:id': '/subjects/:id',
  '/general/coursemodules': '/coursemodules',
  '/general/coursemodules/:id': '/coursemodules/:id',
});

app.use(rules);
app.use(auth);

router.render = (req, res) => {
  if (req.path === '/login' && res.locals.data.accessToken) {
    return res.status(200).json({
      message: 'Login successful',
      user: res.locals.data.user,
      session: res.locals.data.accessToken,
    });
  }
  res.jsonp(res.locals.data);
};

app.use(router);

app.listen(8000, () => {
  console.log('JSON Server with auth is running on port 8000');
});
