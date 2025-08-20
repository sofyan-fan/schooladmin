import cors from 'cors';
import fs from 'fs';
import jsonServer from 'json-server';
import auth from 'json-server-auth';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockDir = path.join(__dirname, 'mock');
const dbPath = path.join(mockDir, 'db.json'); // Corrected path to db.json

const dbFiles = {
  users: JSON.parse(fs.readFileSync(path.join(mockDir, 'users.json'))),
  teachers: JSON.parse(fs.readFileSync(path.join(mockDir, 'teachers.json'))),
  students: JSON.parse(fs.readFileSync(path.join(mockDir, 'students.json'))),
  events: JSON.parse(fs.readFileSync(path.join(mockDir, 'events.json'))),
  subjects: JSON.parse(fs.readFileSync(path.join(mockDir, 'subjects.json'))),
  modules: JSON.parse(fs.readFileSync(path.join(mockDir, 'modules.json'))),
  courses: JSON.parse(fs.readFileSync(path.join(mockDir, 'courses.json'))),
  classes: JSON.parse(fs.readFileSync(path.join(mockDir, 'classes.json'))),
  tests: JSON.parse(fs.readFileSync(path.join(mockDir, 'tests.json'))),
  exams: JSON.parse(fs.readFileSync(path.join(mockDir, 'exams.json'))),
  rosters: JSON.parse(fs.readFileSync(path.join(mockDir, 'rosters.json'))),
  classrooms: JSON.parse(
    fs.readFileSync(path.join(mockDir, 'classrooms.json'))
  ),
};

// Create db.json if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify(dbFiles));
}

const app = jsonServer.create();
const router = jsonServer.router(dbPath); // Use db.json for the router
const middlewares = jsonServer.defaults();

// Allow frontend at 5173 and credentials like the real backend
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(middlewares);
app.use(jsonServer.bodyParser);

// Custom route to combine module and subject details
app.get('/courses/modules', (req, res) => {
  const modules = router.db.get('modules').value();
  const subjects = router.db.get('subjects').value();

  const enrichedModules = modules.map((module) => {
    const enrichedSubjects = module.subjects.map((moduleSubject) => {
      const subjectDetails = subjects.find(
        (s) => s.id === moduleSubject.subjectId
      );
      return {
        ...moduleSubject,
        subjectName: subjectDetails ? subjectDetails.name : 'Unknown Subject',
      };
    });
    return { ...module, subjects: enrichedSubjects };
  });

  res.json(enrichedModules);
});

// Custom route to combine course and module details
app.get('/courses/courses', (req, res) => {
  const courses = router.db.get('courses').value();
  const modules = router.db.get('modules').value();

  const enrichedCourses = courses.map((course) => {
    const courseModules = course.moduleIds
      .map((moduleId) => modules.find((m) => m.id === moduleId))
      .filter(Boolean); // Filter out undefined if a module isn't found
    return { ...course, modules: courseModules };
  });

  res.json(enrichedCourses);
});

// Custom route for enrollment update
app.put('/students/:student_id', (req, res) => {
  const studentId = Number(req.params.student_id);
  const { enrollment_status } = req.body || {};
  const student = router.db.get('students').find({ id: studentId }).value();
  if (!student) return res.status(404).json({ message: 'Not found' });
  const updated = { ...student, enrollment_status: Boolean(enrollment_status) };
  router.db.get('students').find({ id: studentId }).assign(updated).write();
  res.status(200).json({
    message: 'Enrollment status updated successfully',
    student: updated,
  });
});

const routes = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes.json')));

// Bind the router db to the app
app.db = router.db;

const rules = auth.rewriter(routes);

app.use(rules);
app.use(auth);
app.use(router);

const port = 8000;
app.listen(port, () => {
  console.log(`Mock API (json-server) running on http://localhost:${port}`);
});
