const { prisma } = require('../../prisma/connection');

// Create a classroom
exports.create_classroom = async (req, res) => {
    try {
        const {
            name,
            capacity,
            description
        } = req.body;

        const classroom = await prisma.classroom.create({
            data: {
                name,
                capacity,
                 
            },
        });

        res.status(201).json({
            message: 'Classroom created successfully',
            classroom,
        });
    } catch (error) {
        console.error('Error creating classroom:', error);
        res.status(500).json({
            error: 'Failed to create classroom'
        });
    }
};

// Get all classrooms
exports.get_classrooms = async (req, res) => {
    try {
        const classrooms = await prisma.classroom.findMany({
            include: {
                schedules: true,
                rosters: true,
            },
        });

        res.status(200).json(classrooms);
    } catch (error) {
        console.error('Error fetching classrooms:', error);
        res.status(500).json({
            error: 'Failed to fetch classrooms'
        });
    }
};

// Get single classroom by ID
exports.get_classroom = async (req, res) => {
    try {
        const {
            id
        } = req.params;

        const classroom = await prisma.classroom.findUnique({
            where: {
                id: parseInt(id)
            },
            include: {
                schedules: true,
                rosters: true,
            },
        });

        if (!classroom) {
            return res.status(404).json({
                error: 'Classroom not found'
            });
        }

        res.status(200).json(classroom);
    } catch (error) {
        console.error('Error fetching classroom:', error);
        res.status(500).json({
            error: 'Failed to fetch classroom'
        });
    }
};

// Update classroom
exports.update_classroom = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const {
            name,
            capacity,
            description
        } = req.body;

        const updatedClassroom = await prisma.classroom.update({
            where: {
                id: parseInt(id)
            },
            data: {
                name,
                capacity,
                description
            },
        });

        res.status(200).json({
            message: 'Classroom updated successfully',
            updatedClassroom,
        });
    } catch (error) {
        console.error('Error updating classroom:', error);
        res.status(500).json({
            error: 'Failed to update classroom'
        });
    }
};

// Delete classroom
exports.delete_classroom = async (req, res) => {
    try {
        const {
            id
        } = req.params;

        await prisma.classroom.delete({
            where: {
                id: parseInt(id)
            },
        });

        res.status(200).json({
            message: 'Classroom deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting classroom:', error);
        res.status(500).json({
            error: 'Failed to delete classroom'
        });
    }
};