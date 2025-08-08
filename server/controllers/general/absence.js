const {
    PrismaClient
} = require('@prisma/client');
const prisma = new PrismaClient();

// Create an absence
exports.create_absence = async (req, res) => {
    try {
        const {
            student_id,
            teacher_id,
            date,
            reason
        } = req.body;

        const absence = await prisma.absence.create({
            data: {
                student_id,
                teacher_id,
                date: new Date(date),
                reason,
            },
        });

        res.status(201).json(absence);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to create absence'
        });
    }
};

// Get all absences
exports.get_all_absences = async (req, res) => {
    try {
        const absences = await prisma.absence.findMany({
            include: {
                student: true,
                teacher: true,
            },
        });

        res.status(200).json(absences);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to fetch absences'
        });
    }
};

// Get absence by ID
exports.get_absence_by_id = async (req, res) => {
    try {
        const {
            id
        } = req.params;

        const absence = await prisma.absence.findUnique({
            where: {
                id: Number(id)
            },
            include: {
                student: true,
                teacher: true,
            },
        });

        if (!absence) {
            return res.status(404).json({
                error: 'Absence not found'
            });
        }

        res.status(200).json(absence);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to fetch absence'
        });
    }
};

// Update an absence
exports.update_absence = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const {
            student_id,
            teacher_id,
            date,
            reason
        } = req.body;

        const updatedAbsence = await prisma.absence.update({
            where: {
                id: Number(id)
            },
            data: {
                student_id,
                teacher_id,
                date: date ? new Date(date) : undefined,
                reason,
            },
        });

        res.status(200).json(updatedAbsence);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to update absence'
        });
    }
};

// Delete an absence
exports.delete_absence = async (req, res) => {
    try {
        const {
            id
        } = req.params;

        await prisma.absence.delete({
            where: {
                id: Number(id)
            },
        });

        res.status(200).json({
            message: 'Absence deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to delete absence'
        });
    }
};