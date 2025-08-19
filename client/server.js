import cors from 'cors';
import fs from 'fs';
import jsonServer from 'json-server';
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
};

// Create db.json if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify(dbFiles));
}

const server = jsonServer.create();
const router = jsonServer.router(dbPath); // Use db.json for the router
const middlewares = jsonServer.defaults();

// Allow frontend at 5173 and credentials like the real backend
server.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Custom route to combine module and subject details
server.get('/courses/modules', (req, res) => {
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
server.get('/courses/courses', (req, res) => {
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

// The rewriter should come after custom routes
const routes = JSON.parse(fs.readFileSync(path.join(__dirname, 'routes.json')));
const rewriter = jsonServer.rewriter(routes);
server.use(rewriter);

// Custom route for enrollment update (needs to be after rewriter to use resource ID)
server.put('/students/:student_id', (req, res) => {
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

// Fallback to default router for standard CRUD
server.use(router);

const port = 8000;
server.listen(port, () => {
  console.log(`Mock API (json-server) running on http://localhost:${port}`);
});
