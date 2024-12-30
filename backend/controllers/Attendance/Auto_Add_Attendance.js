const handleAutoAddAttendance = (database) => async (req, res) => {
    const today = new Date();
    const malaysiaTimeOffset = 8 * 60 * 60 * 1000;

    const malaysiaDate = new Date(today.getTime() + malaysiaTimeOffset);
    const formattedDate = malaysiaDate.toISOString().split('T')[0];
    const formattedTime = malaysiaDate.toISOString().split('T')[1].slice(0, 8);

    const currentDay = malaysiaDate.toLocaleString('en-US', { weekday: 'long' });

    try {
        const sessionLog = await database('session_logs')
            .where({ created_for: formattedDate })
            .whereRaw('start_time <= ?', [formattedTime])
            .andWhereRaw('end_time >= ?', [formattedTime]);

        for (const session of sessionLog) {
            const section = await database('sections')
                .where('id', session.section_id)
                .andWhere('day', currentDay) 
                .first(); 

            if (section) {
                await markStudentsAbsent(database, section.subject_id, section.section_number, today);
            } else {
                console.warn(`No section found for session ID: ${session.id}`);
            }
        }

        res.status(200).json({ message: 'Attendance auto-update completed successfully.' });
    } catch (error) {
        console.error('Error in auto-adding attendance:', error);
        res.status(500).json({ error: 'Failed to auto-add attendance.' });
    }
};

const markStudentsAbsent = async (database, subject_id, section_number, today) => {
    try {
        const studentsInSection = await database('students')
            .leftJoin('student_subjects', function () {
                this.on('students.id', '=', 'student_subjects.student_id')
                    .andOn('student_subjects.subject_section', '=', section_number)
                    .andOn('student_subjects.subject_id', '=', subject_id)
                    .andOn('students.current_year', '=', 'student_subjects.year')
                    .andOn('students.current_semester', '=', 'student_subjects.semester');
            })
            .whereNotNull('student_subjects.subject_section')
            .select('students.id');

        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        for (const student of studentsInSection) {
            const existingRecord = await database('attendances')
                .where('student_id', student.id)
                .andWhere('subject_id', subject_id)
                .andWhere('date', '>=', startOfDay)
                .andWhere('date', '<', endOfDay)
                .first();

            if (!existingRecord) {
                await database('attendances')
                    .insert({
                        student_id: student.id,
                        subject_id: subject_id,
                        status: 'Absent',
                        date: startOfDay
                    });
            }
        }
    } catch (error) {
        console.error('Error marking students as absent:', error);
    }
};

module.exports = { handleAutoAddAttendance };
