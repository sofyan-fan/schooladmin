import cors from 'cors';
import fs from 'fs';
import jsonServer from 'json-server';
import auth from 'json-server-auth';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'mock_server', 'db.json');

const app = jsonServer.create();
const router = jsonServer.router(dbPath); // Use db.json for the router
const middlewares = jsonServer.defaults();

const enrichClassLayout = (classLayout, db) => {
  if (!classLayout) return null;

  const teachers = db.get('teachers').value();
  const courses = db.get('courses').value();
  const students = db.get('students').value();

  const mentor = teachers.find((t) => t.id === classLayout.mentorId);
  const course = courses.find((c) => c.id === classLayout.courseId);
  const classStudents = (classLayout.studentIds || []).map((studentId) =>
    students.find((s) => s.id === studentId)
  );

  return {
    ...classLayout,
    mentor,
    course,
    students: classStudents.filter(Boolean),
  };
};

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
app.get('/api/courses/modules', (req, res) => {
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
app.get('/api/courses/courses', (req, res) => {
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

app.get('/api/class_layouts', (req, res) => {
  const classLayouts = router.db.get('class_layouts').value();
  const enrichedClassLayouts = classLayouts.map((layout) =>
    enrichClassLayout(layout, router.db)
  );
  res.json(enrichedClassLayouts);
});

// GET /class_layouts/:id (singular - good practice to have)
app.get('/api/class_layouts/:id', (req, res) => {
  const id = Number(req.params.id);
  const classLayout = router.db.get('class_layouts').find({ id }).value();
  if (classLayout) {
    res.json(enrichClassLayout(classLayout, router.db));
  } else {
    res.status(404).json({ message: 'Not found' });
  }
});

app.post('/api/class_layouts', (req, res) => {
  const classData = req.body;
  // json-server-auth will handle ID creation if you let the default router handle it
  // But for consistency, we handle it and enrich the response.
  const collection = router.db.get('class_layouts');
  const newClass = collection.insert(classData).write(); // .insert() is from lowdb, which json-server uses
  res.status(201).json(enrichClassLayout(newClass, router.db));
});

// PUT /class_layouts/:id
app.put('/api/class_layouts/:id', (req, res) => {
  const id = Number(req.params.id);
  const classData = req.body;
  const updatedClass = router.db
    .get('class_layouts')
    .find({ id })
    .assign(classData)
    .write();
  res.json(enrichClassLayout(updatedClass, router.db));
});

// Custom route for enrollment update
app.put('/api/students/:student_id', (req, res) => {
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

app.delete('/api/class_layouts/:id', (req, res) => {
  const id = Number(req.params.id);
  router.db.get('class_layouts').remove({ id }).write();
  res.status(200).json({ id }); // Send back the ID of the deleted item
});

// ROSTER EVENTS API (exposed as /api/rosters)
// Backed by the `roster_events` collection in the mock DB
app.get('/api/rosters', (req, res) => {
  const { classLayoutId, teacherId, classroomId } = req.query;
  let events = router.db.get('roster_events').value() || [];

  const matches = (event, key, value) => {
    if (value === undefined || value === null || value === '') return true;
    const numVal = Number(value);
    return Number(event[key]) === numVal;
  };

  events = events.filter(
    (e) =>
      matches(e, 'classLayoutId', classLayoutId) &&
      matches(e, 'teacherId', teacherId) &&
      matches(e, 'classroomId', classroomId)
  );

  res.json(events);
});

app.post('/api/rosters', (req, res) => {
  const { title, start, end, classLayoutId, teacherId, classroomId } =
    req.body || {};
  if (!title || !start || !end) {
    return res
      .status(400)
      .json({ message: 'title, start and end are required' });
  }

  const collection = router.db.get('roster_events');
  const current = collection.value() || [];
  const newId =
    (current.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) ||
      0) + 1;
  const newEvent = {
    id: newId,
    title,
    start,
    end,
    classLayoutId: classLayoutId ? Number(classLayoutId) : null,
    teacherId: teacherId ? Number(teacherId) : null,
    classroomId: classroomId ? Number(classroomId) : null,
  };
  collection.push(newEvent).write();
  res.status(201).json(newEvent);
});

app.put('/api/rosters/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = router.db.get('roster_events').find({ id }).value();
  if (!existing) return res.status(404).json({ message: 'Not found' });

  const { title, start, end, classLayoutId, teacherId, classroomId } =
    req.body || {};
  const updated = {
    ...existing,
    ...(title !== undefined ? { title } : {}),
    ...(start !== undefined ? { start } : {}),
    ...(end !== undefined ? { end } : {}),
    ...(classLayoutId !== undefined
      ? { classLayoutId: classLayoutId !== null ? Number(classLayoutId) : null }
      : {}),
    ...(teacherId !== undefined
      ? { teacherId: teacherId !== null ? Number(teacherId) : null }
      : {}),
    ...(classroomId !== undefined
      ? { classroomId: classroomId !== null ? Number(classroomId) : null }
      : {}),
  };
  router.db.get('roster_events').find({ id }).assign(updated).write();
  res.json(updated);
});

app.delete('/api/rosters/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = router.db.get('roster_events').find({ id }).value();
  if (!existing) return res.status(404).json({ message: 'Not found' });
  router.db.get('roster_events').remove({ id }).write();
  res.status(200).json({ id });
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
