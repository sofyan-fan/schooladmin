const { prisma } = require('../../prisma/connection');

exports.create_roster = async (req, res) => {
  try {
    // Support both old format (with days array) and new format (single roster)
    const {
      class_id,
      classLayoutId, // Support client field name
      subject_id,
      subjectId, // Support client field name
      teacher_id,
      teacherId, // Support client field name
      classroom_id,
      classroomId, // Support client field name
      days,
      // For single roster creation
      day_of_week,
      start_time,
      end_time,
      start, // FullCalendar format
      end, // FullCalendar format
      title,
    } = req.body;

    // Normalize field names
    const normalizedClassId = class_id || classLayoutId;
    const normalizedSubjectId = subject_id || subjectId;
    const normalizedTeacherId = teacher_id || teacherId;
    const normalizedClassroomId = classroom_id || classroomId;

    if (days && Array.isArray(days)) {
      // Original format with multiple days
      const data = days.map((day) => ({
        class_id: normalizedClassId,
        subject_id: normalizedSubjectId,
        teacher_id: normalizedTeacherId,
        day_of_week: day.day_of_week,
        start_time: day.start_time,
        end_time: day.end_time,
        classroom_id: day.classroom_id || normalizedClassroomId,
      }));

      const newRoster = await prisma.roster.createMany({
        data,
      });

      res.status(201).json({
        message: 'Roster created',
        newRoster,
      });
    } else {
      // Single roster creation (from FullCalendar)
      let dayOfWeek = day_of_week;
      let startTime = start_time;
      let endTime = end_time;

      // Convert from ISO date strings if provided
      if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const days = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];
        dayOfWeek = days[startDate.getDay()];
        startTime = startDate.toTimeString().slice(0, 5); // HH:MM format
        endTime = endDate.toTimeString().slice(0, 5);
      }

      const newRoster = await prisma.roster.create({
        data: {
          class_id: normalizedClassId,
          subject_id: normalizedSubjectId,
          teacher_id: normalizedTeacherId,
          classroom_id: normalizedClassroomId,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
        },
        include: {
          class_layout: true,
          subject: true,
          teacher: true,
          classroom: true,
        },
      });

      // Transform for client compatibility
      const transformedRoster = {
        ...newRoster,
        classLayoutId: newRoster.class_id,
        subjectId: newRoster.subject_id,
        teacherId: newRoster.teacher_id,
        classroomId: newRoster.classroom_id,
        title: title || newRoster.subject?.name,
        start: start || `${dayOfWeek} ${startTime}`,
        end: end || `${dayOfWeek} ${endTime}`,
      };

      res.status(201).json(transformedRoster);
    }
  } catch (error) {
    console.error('Error creating roster:', error);
    res.status(500).json({
      error: 'Failed to create roster',
    });
  }
};

exports.get_roster = async (req, res) => {
  try {
    // Support filtering by query parameters
    const {
      classLayoutId,
      teacherId,
      classroomId,
      subjectId,
      class_id,
      teacher_id,
      classroom_id,
      subject_id,
    } = req.query;

    // Build where clause for filtering
    const where = {};
    if (classLayoutId || class_id) {
      where.class_id = parseInt(classLayoutId || class_id);
    }
    if (teacherId || teacher_id) {
      where.teacher_id = parseInt(teacherId || teacher_id);
    }
    if (classroomId || classroom_id) {
      where.classroom_id = parseInt(classroomId || classroom_id);
    }
    if (subjectId || subject_id) {
      where.subject_id = parseInt(subjectId || subject_id);
    }

    const rosters = await prisma.roster.findMany({
      where,
      include: {
        class_layout: true,
        subject: true,
        teacher: true,
        classroom: true,
      },
      orderBy: {
        day_of_week: 'asc',
      },
    });

    // Transform data for client compatibility
    const transformedRosters = rosters.map((roster) => {
      // Calculate ISO date strings for current week
      const today = new Date();
      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

      const dayMap = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };

      const dayOffset = dayMap[roster.day_of_week] || 0;
      const rosterDate = new Date(currentWeekStart);
      rosterDate.setDate(currentWeekStart.getDate() + dayOffset);

      // Parse time strings
      const [startHour, startMin] = roster.start_time.split(':').map(Number);
      const [endHour, endMin] = roster.end_time.split(':').map(Number);

      const startDateTime = new Date(rosterDate);
      startDateTime.setHours(startHour, startMin, 0, 0);

      const endDateTime = new Date(rosterDate);
      endDateTime.setHours(endHour, endMin, 0, 0);

      return {
        ...roster,
        classLayoutId: roster.class_id,
        subjectId: roster.subject_id,
        teacherId: roster.teacher_id,
        classroomId: roster.classroom_id,
        title: roster.subject?.name || 'Lesson',
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
      };
    });

    res.status(200).json(transformedRosters);
  } catch (error) {
    console.error('Error fetching rosters:', error);
    res.status(500).json({
      error: 'Failed to fetch rosters',
    });
  }
};

exports.update_roster = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      day_of_week,
      start_time,
      end_time,
      subject_id,
      subjectId,
      class_id,
      classLayoutId,
      teacher_id,
      teacherId,
      classroom_id,
      classroomId,
      start,
      end,
      title,
    } = req.body;

    // Normalize field names
    const normalizedClassId = class_id || classLayoutId;
    const normalizedSubjectId = subject_id || subjectId;
    const normalizedTeacherId = teacher_id || teacherId;
    const normalizedClassroomId = classroom_id || classroomId;

    let dayOfWeek = day_of_week;
    let startTime = start_time;
    let endTime = end_time;

    // Convert from ISO date strings if provided
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const days = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      dayOfWeek = days[startDate.getDay()];
      startTime = startDate.toTimeString().slice(0, 5);
      endTime = endDate.toTimeString().slice(0, 5);
    }

    const updateData = {};
    if (dayOfWeek) updateData.day_of_week = dayOfWeek;
    if (startTime) updateData.start_time = startTime;
    if (endTime) updateData.end_time = endTime;
    if (normalizedSubjectId) updateData.subject_id = normalizedSubjectId;
    if (normalizedClassId) updateData.class_id = normalizedClassId;
    if (normalizedTeacherId) updateData.teacher_id = normalizedTeacherId;
    if (normalizedClassroomId) updateData.classroom_id = normalizedClassroomId;

    const updatedRoster = await prisma.roster.update({
      where: {
        id: parseInt(id),
      },
      data: updateData,
      include: {
        class_layout: true,
        subject: true,
        teacher: true,
        classroom: true,
      },
    });

    // Transform for client compatibility
    const transformedRoster = {
      ...updatedRoster,
      classLayoutId: updatedRoster.class_id,
      subjectId: updatedRoster.subject_id,
      teacherId: updatedRoster.teacher_id,
      classroomId: updatedRoster.classroom_id,
      title: title || updatedRoster.subject?.name,
      start: start,
      end: end,
    };

    res.status(200).json(transformedRoster);
  } catch (error) {
    console.error('Error updating roster:', error);
    res.status(500).json({
      error: 'Failed to update roster',
    });
  }
};

exports.delete_roster = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.roster.delete({
      where: {
        id: parseInt(id),
      },
    });

    res.status(200).json({
      message: 'Roster deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting roster:', error);
    res.status(500).json({
      error: 'Failed to delete roster',
    });
  }
};
