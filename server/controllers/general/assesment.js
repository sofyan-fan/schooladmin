const {
    PrismaClient
} = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new assessment
exports.create_assessment = async (req, res) => {
    try {
        const {
            type,
            name,
            class_id,
            subject_id,
            leverage,
            date,
            is_central,
            description
        } = req.body;

        const newAssessment = await prisma.assessment.create({
            data: {
                type,
                name,
                class_id,
                subject_id,
                leverage: leverage || 1,
                date: new Date(date),
                is_central,
                description,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Assessment created successfully',
            data: newAssessment,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message,
        });
    }
};

// Get all assessments
exports.get_all_assessments = async (req, res) => {
    try {
        const assessments = await prisma.assessment.findMany({
            include: {
                class_layout: true,
                subject: true,
                results: true,
            },
        });

        return res.status(200).json({
            success: true,
            data: assessments,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message,
        });
    }
};

// Get a single assessment by ID
exports.get_assessment_by_id = async (req, res) => {
    try {
        const {
            id
        } = req.params;

        const assessment = await prisma.assessment.findUnique({
            where: {
                id: parseInt(id)
            },
            include: {
                class_layout: true,
                subject: true,
                results: true,
            },
        });

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: 'Assessment not found',
            });
        }

        return res.status(200).json({
            success: true,
            data: assessment,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message,
        });
    }
};

// Update an assessment
exports.update_assessment = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const {
            type,
            name,
            class_id,
            subject_id,
            leverage,
            date,
            is_central,
            description
        } = req.body;

        const updatedAssessment = await prisma.assessment.update({
            where: {
                id: parseInt(id)
            },
            data: {
                type,
                name,
                class_id,
                subject_id,
                leverage,
                date: date ? new Date(date) : undefined,
                is_central,
                description,
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Assessment updated successfully',
            data: updatedAssessment,
        });
    } catch (error) {
        console.error(error);
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Assessment not found',
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message,
        });
    }
};

// Delete an assessment
exports.delete_assessment = async (req, res) => {
    try {
        const {
            id
        } = req.params;

        await prisma.assessment.delete({
            where: {
                id: parseInt(id)
            },
        });

        return res.status(200).json({
            success: true,
            message: 'Assessment deleted successfully',
        });
    } catch (error) {
        console.error(error);
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Assessment not found',
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message,
        });
    }
};