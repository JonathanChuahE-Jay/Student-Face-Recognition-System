const handleAddAttendance = (database) => async (req, res) => {
  const { subject_id, records, date } = req.body;

  if (!subject_id || !date || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Missing required fields or invalid records format' });
  }

  try {
    const parsedDate = new Date(date);
    const startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const recordsToProcess = records.map((record) => {
      const newDate = new Date(date);
      newDate.setHours(new Date().getHours());
      newDate.setMinutes(new Date().getMinutes());
      newDate.setSeconds(new Date().getSeconds());
      newDate.setMilliseconds(0);

      return {
        ...record,
        subject_id,
        date: newDate
      };
    });

    // Fetch all students for the given subject_id
    const allStudentsInSubject = await database('students')
      .leftJoin('student_subjects', function() {
        this.on('students.id', '=', 'student_subjects.student_id')
          .andOn('student_subjects.subject_id', '=', subject_id)
          .andOn('students.current_year', '=', 'student_subjects.year')
          .andOn('students.current_semester', '=', 'student_subjects.semester');
      })
      .whereNotNull('student_subjects.subject_section')
      .select('students.id as student_id');

    // Extract student_ids from the request body records
    const presentStudentIds = records.map(record => record.student_id);

    // Find students who are not in the presentStudentIds list
    const absentStudents = allStudentsInSubject.filter(student =>
      !presentStudentIds.includes(student.student_id)
    );

    // Prepare absent students records with "Absent" status
    const absentRecords = absentStudents.map(student => ({
      student_id: student.student_id,
      subject_id,
      status: 'Absent',
      date: startOfDay
    }));

    // Process present students
    for (const record of recordsToProcess) {
      const { student_id } = record;

      if (!student_id || !record.status) {
        return res.status(400).json({ error: 'Missing student_id or status in records' });
      }

      // Check for existing records
      const existingRecord = await database('attendances')
        .where('student_id', student_id)
        .andWhere('subject_id', subject_id)
        .andWhere('date', '>=', startOfDay)
        .andWhere('date', '<', endOfDay)
        .first();

      if (existingRecord) {
        // Update existing record
        await database('attendances')
          .where('student_id', student_id)
          .andWhere('subject_id', subject_id)
          .andWhere('date', '>=', startOfDay)
          .andWhere('date', '<', endOfDay)
          .update({ status: record.status, date: record.date });
      } else {
        // Insert new record
        await database('attendances').insert(record);
      }
    }

    // Process absent students
    for (const absentRecord of absentRecords) {
      const existingAbsentRecord = await database('attendances')
        .where('student_id', absentRecord.student_id)
        .andWhere('subject_id', subject_id)
        .andWhere('date', '>=', startOfDay)
        .andWhere('date', '<', endOfDay)
        .first();

      if (!existingAbsentRecord) {
        // Insert absent record if not already present
        await database('attendances').insert(absentRecord);
      }
    }

    res.status(201).json({ message: 'Attendance records processed successfully' });
  } catch (error) {
    console.error('Error adding or updating attendance:', error);
    res.status(500).json({ error: 'Failed to process attendance records' });
  }
};

module.exports = { handleAddAttendance };
