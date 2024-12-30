const handleShowAttendance = (database) => async (req, res) => {
    const { student_id, subject_id, selectedSection, calendarDate } = req.body;

    try {
        if (student_id && !subject_id) {
            const studentAttendance = await database('attendances')
                .where({ student_id })
                .select('*');

            if (studentAttendance.length === 0) {
                return res.status(404).json({ error: 'No attendance records found for this student' });
            }

            // Extract unique subject IDs
            const subjectIds = [...new Set(studentAttendance.map(record => record.subject_id))];

            // Fetch sections and subjects
            const studentSubjects = await database('student_subjects')
                .select('*')
                .where({ student_id });

            // Fetch subject details
            const subjects = await database('subjects')
                .whereIn('id', subjectIds)
                .select('id', 'name');

            // Map subjects for easier lookup
            const subjectMap = subjects.reduce((map, subject) => {
                map[subject.id] = subject.name;
                return map;
            }, {});

            const sectionMap = studentSubjects.reduce((map, section) => {
                map[section.subject_id] = section;
                return map;
            }, {});

            // Attach subject names and sections
            const attendanceWithDetails = studentAttendance.map(record => ({
                ...record,
                subject_name: subjectMap[record.subject_id] || 'Unknown Subject',
                section: sectionMap[record.subject_id] || {}
            }));

            return res.json({
                message: 'Student attendance records fetched successfully',
                studentAttendance: attendanceWithDetails
            });
        } else if (subject_id && selectedSection && calendarDate) {
            // Fetch student-related subjects
            const studentSubjects = await database('student_subjects')
                .leftJoin('students', 'student_subjects.student_id', 'students.id')
                .leftJoin('users', 'students.user_id', 'users.id')
                .where('student_subjects.subject_id', subject_id)
                .where(function() {
                    this.where('students.current_year', '=', database.raw('CAST(student_subjects.year AS INTEGER)'))
                        .orWhereNull('student_subjects.year');
                })
                .where(function() {
                    this.where('students.current_semester', '=', database.raw('CAST(student_subjects.semester AS INTEGER)'))
                        .orWhereNull('student_subjects.semester');
                })
                .whereNotNull('student_subjects.student_id')
                .select(
                    'students.id as id',
                    'student_subjects.student_id',
                    'users.name as student_name',
                    'students.profile_picture as student_profile_picture',
                    'student_subjects.subject_section'
                );

            // Fetch lecturer-related subjects
            const lecturerSubjects = await database('lecturer_subjects')
                .leftJoin('lecturers', 'lecturer_subjects.lecturer_id', 'lecturers.id')
                .leftJoin('users', 'lecturers.user_id', 'users.id')
                .where('lecturer_subjects.subject_id', subject_id)
                .whereNotNull('lecturer_subjects.lecturer_id')
                .select(
                    'lecturer_subjects.lecturer_id',
                    'users.name as lecturer_name',
                    'lecturers.profile_picture as lecturer_profile_picture',
                    'lecturer_subjects.subject_section'
                );

            // Fetch attendance records
            const attendances = await database('attendances')
                .where('attendances.subject_id', subject_id)
                .select(
                    'attendances.*',
                    'attendances.student_id as attendance_student_id'
                );

            // Fetch all sections for the subject
            const sectionTime = await database('sections')
                .where('subject_id', subject_id)
                .select('*');
        
            const date = new Date(calendarDate);
            const formattedDate = date.toISOString().split('T')[0];
            
            // Fetch session logs for each section
            await Promise.all(
                sectionTime.map(async (section) => {
                    const log = await database('session_logs')
                        .where({ created_for: formattedDate, section_id: section.id })
                        .select('start_time', 'end_time')
                        .first();

                    section.start_time = log ? (log.start_time || '00:00:00') : section.start_time || '00:00:00';
                    section.end_time = log ? (log.end_time || '23:59:59') : 
                                        section.end_time >= section.start_time ? section.end_time : '23:59:59';
                })
            );

            // Extract unique dates from attendance records
            const attendanceDates = [...new Set(attendances.map(att => new Date(att.date).toDateString()))];

            // Prepare result for students
            const studentResult = studentSubjects.map(record => {
                const recordsForStudent = attendanceDates.map(date => {
                    const attendanceRecord = attendances.find(att =>
                        att.attendance_student_id === record.student_id &&
                        new Date(att.date).toDateString() === date
                    );

                    return {
                        ...record,
                        status: attendanceRecord ? attendanceRecord.status : null,
                        date: attendanceRecord ? attendanceRecord.date : date
                    };
                });

                return recordsForStudent;
            }).flat();

            // Prepare result for lecturers
            const lecturerResult = lecturerSubjects.map(record => ({
                ...record,
                status: 'N/A',
                date: null
            }));

            // Return both results
            res.json({
                sectionTime,
                showAll: studentSubjects,
                students: studentResult,
                lecturers: lecturerResult
            });
        } else {
            res.status(400).json({ error: 'Either student_id or subject_id is required' });
        }
    } catch (error) {
        console.error('Error fetching attendances:', error);
        res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
};

module.exports = { handleShowAttendance };
