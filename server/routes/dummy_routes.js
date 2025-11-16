const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const DUMMY_FILE = path.join(__dirname, '../prisma/2023_2024.json');

function loadDummy() {
  const raw = fs.readFileSync(DUMMY_FILE, 'utf8');
  return JSON.parse(raw);
}

// List dummy school years (currently only one)
router.get('/school-years', (_req, res) => {
  try {
    const data = loadDummy();
    const sy = data.schoolYear || null;
    if (!sy) {
      return res.status(404).json({ error: 'No dummy school years defined' });
    }
    return res.json([sy]);
  } catch (err) {
    console.error('Error reading dummy school years:', err);
    return res.status(500).json({ error: 'Failed to load dummy school years' });
  }
});

// Get full dummy data for a specific school year id
router.get('/school-years/:id', (req, res) => {
  try {
    const data = loadDummy();
    const sy = data.schoolYear || null;
    if (!sy || String(sy.id) !== String(req.params.id)) {
      return res.status(404).json({ error: 'Dummy school year not found' });
    }
    // Return the entire dummy dataset so the client has all related collections
    return res.json(data);
  } catch (err) {
    console.error('Error reading dummy school year detail:', err);
    return res
      .status(500)
      .json({ error: 'Failed to load dummy school year detail' });
  }
});

module.exports = router;


