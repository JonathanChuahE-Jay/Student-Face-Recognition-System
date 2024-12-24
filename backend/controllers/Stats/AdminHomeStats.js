const { startOfWeek, endOfWeek, subWeeks } = require('date-fns');

const handleAdminHomeStats = (database) => async (req, res) => {
  try {
    const today = new Date();

    // Define start and end of current and previous weeks
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const previousWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
    const previousWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });

    // Current and previous week attendance
    const [currentWeekAttendance, previousWeekAttendance] = await Promise.all([
      database('attendances').whereBetween('date', [currentWeekStart, currentWeekEnd]),
      database('attendances').whereBetween('date', [previousWeekStart, previousWeekEnd])
    ]);

    // Calculate attendance percentages
    const calculatePercentage = (attendance) => {
      const total = attendance.length;
      const presentCount = attendance.filter(att => att.status === 'Present').length;
      return total > 0 ? (presentCount / total) * 100 : 0;
    };

    const currentWeekPercentage = calculatePercentage(currentWeekAttendance);
    const previousWeekPercentage = calculatePercentage(previousWeekAttendance);

    // Total students
    const { count: totalStudents } = await database('students').count('* as count').first();

    // Function to get top and bottom subjects
    const getSubjectAttendance = async (start, end, order) => {
      return await database('attendances')
        .select('subjects.name')
        .count('attendances.subject_id as count')
        .leftJoin('subjects', 'attendances.subject_id', 'subjects.id')
        .whereBetween('attendances.date', [start, end])
        .andWhere('attendances.status', 'Present')
        .groupBy('attendances.subject_id', 'subjects.name')
        .orderBy('count', order)
        .first();
    };

    const [topSubjectsCurrentWeek, bottomSubjectsCurrentWeek, topSubjectsPreviousWeek, bottomSubjectsPreviousWeek] = await Promise.all([
      getSubjectAttendance(currentWeekStart, currentWeekEnd, 'desc'),
      getSubjectAttendance(currentWeekStart, currentWeekEnd, 'asc'),
      getSubjectAttendance(previousWeekStart, previousWeekEnd, 'desc'),
      getSubjectAttendance(previousWeekStart, previousWeekEnd, 'asc')
    ]);

    // Respond with stats
    res.json({
      attendance: {
        currentWeekPercentage: currentWeekPercentage.toFixed(2),
        previousWeekPercentage: previousWeekPercentage.toFixed(2),
      },
      totalStudents,
      topSubjects: {
        currentWeek: topSubjectsCurrentWeek ? topSubjectsCurrentWeek.name : 'No data',
        previousWeek: topSubjectsPreviousWeek ? topSubjectsPreviousWeek.name : 'No data',
      },
      bottomSubjects: {
        currentWeek: bottomSubjectsCurrentWeek ? bottomSubjectsCurrentWeek.name : 'No data',
        previousWeek: bottomSubjectsPreviousWeek ? bottomSubjectsPreviousWeek.name : 'No data',
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate attendance stats' });
  }
};

module.exports = { handleAdminHomeStats };
