// EXTRA API ENDPOINTS VOOR DASHBOARD

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/stats', async (req, res) => {
  try {
    const totalStudents = await prisma.student.count();
    const studentsPresent = await prisma.student.count({
      where: { enrollment_status: true },
    }); 
    const teachersPresent = await prisma.teacher.count({
      where: { is_active: true },
    }); 
    res.json({ totalStudents, studentsPresent, teachersPresent });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/jaarplanning', async (req, res) => {
  try {
    const events = await prisma.events.findMany();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jaarplanning' });
  }
});

router.get('/studenten', async (req, res) => {
  try {
    const students = await prisma.student.findMany();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch studenten' });
  }
});

router.get('/leraren', async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany();
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leraren' });
  }
});

router.get('/personeel', async (req, res) => {
  try {
    const staff = await prisma.admin.findMany();
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch personeel' });
  }
});

router.get('/lessons', async (req, res) => {
  try {
    const lessons = await prisma.subject.findMany();
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

module.exports = router;
