const moment = require('moment-timezone');
const handleDisplayDailyReport = (database) => async (req, res) => {
    const { date, subjectsAndSections } = req.body;

    try {
        const formattedDate = moment(date).tz('Asia/Kuala_Lumpur').format('YYYY-MM-DD');

        const attended = await database('attendances')
            .select(
                'attendances.*',
                'student_subjects.subject_section as section_number',
                'subjects.id as subject_id'
            )
            .leftJoin('student_subjects', function () {
                this.on('student_subjects.student_id', '=', 'attendances.student_id')
                    .andOn('student_subjects.subject_id', '=', 'attendances.subject_id');
            })
            .leftJoin('subjects', 'subjects.id', 'attendances.subject_id')
            .leftJoin('students', 'students.id', 'attendances.student_id')
            .where('students.current_year', '=', database.raw('CAST(student_subjects.year AS INTEGER)'))
            .where('students.current_semester', '=', database.raw('CAST(student_subjects.semester AS INTEGER)'))
            .where('attendances.status', 'Present')
            .whereRaw('DATE(attendances.date) = ?', [formattedDate]);

        const attendanceCountMap = attended.reduce((acc, record) => {
            const key = `${record.subject_id}-${record.section_number}`;
            if (!acc[key]) acc[key] = 0;
            acc[key] += 1;
            return acc;
        }, {});

        const subjects = await database('subjects').select('*').orderBy('id', 'asc');
        const sections = await database('sections').select('*');
        const lecturers = await database('lecturer_subjects').select('*');

        const totalStudentsMap = await database('student_subjects')
            .select('student_subjects.subject_id', 'student_subjects.subject_section as section_number')
            .count('* as total_students')
            .leftJoin('students', 'students.id', 'student_subjects.student_id') 
            .where('students.current_year', '=', database.raw('CAST(student_subjects.year AS INTEGER)'))
            .where('students.current_semester', '=', database.raw('CAST(student_subjects.semester AS INTEGER)'))
            .groupBy('student_subjects.subject_id', 'student_subjects.subject_section')
            .then((rows) =>
                rows.reduce((acc, row) => {
                    const key = `${row.subject_id}-${row.section_number}`;
                    acc[key] = row.total_students;
                    return acc;
                }, {})
        );

        const sectionsMap = sections.reduce((acc, section) => {
            if (!acc[section.subject_id]) acc[section.subject_id] = [];
            acc[section.subject_id].push(section);
            return acc;
        }, {});

        const lecturersMap = lecturers.reduce((acc, lecturer) => {
            const key = `${lecturer.subject_id}-${lecturer.subject_section}`;
            acc[key] = lecturer;
            return acc;
        }, {});

        const subjectsWithSectionsAndLecturers = subjects.map((subject) => {
            const subjectSections = sectionsMap[subject.id] || [];
            const sectionsWithLecturers = subjectSections.map((section) => {
                const key = `${subject.id}-${section.section_number}`;
                return {
                    ...section,
                    lecturer: lecturersMap[key] || null,
                    totalAttendance: attendanceCountMap[key] || 0,
                    totalStudents: totalStudentsMap[key] || 0,
                };
            });
            return { ...subject, sections: sectionsWithLecturers };
        });

        let result = await database('attendances')
            .select(
                'attendances.*',
                'users.name as student_name',
                'subjects.name as subject_name',
                'subjects.code as subject_code',
                'student_subjects.subject_section as section_number',
                'students.student_id as student_id'
            )
            .leftJoin('subjects', 'subjects.id', 'attendances.subject_id')
            .leftJoin('students', 'students.id', 'attendances.student_id')
            .leftJoin('users', 'users.id', 'students.user_id')
            .leftJoin('student_subjects', function () {
                this.on('student_subjects.subject_id', '=', 'attendances.subject_id')
                    .andOn('student_subjects.student_id', '=', 'attendances.student_id');
            })
            .where('students.current_year', '=', database.raw('CAST(student_subjects.year AS INTEGER)'))
            .where('students.current_semester', '=', database.raw('CAST(student_subjects.semester AS INTEGER)'))
            .whereRaw('DATE(attendances.date) = ?', [formattedDate]);

            if (result.length === 0) {
                if (subjectsAndSections && subjectsAndSections.length > 0) {
                    try {
                        let result = [];
                        for (const { subject_id, subject_section } of subjectsAndSections) {
                            const studentsInSection = await database('student_subjects')
                                .select(
                                    'students.student_id',
                                    'users.name as student_name',
                                    'student_subjects.subject_section as section_number',
                                    'student_subjects.subject_id'
                                )
                                .leftJoin('students', 'students.id', 'student_subjects.student_id')
                                .leftJoin('users', 'users.id', 'students.user_id')
                                .where('students.current_year', '=', database.raw('CAST(student_subjects.year AS INTEGER)'))
                                .where('students.current_semester', '=', database.raw('CAST(student_subjects.semester AS INTEGER)'))
                                .where({ subject_id, subject_section });
            
                            const absentStudents = studentsInSection.map(student => ({
                                student_id: student.student_id,
                                student_name: student.student_name,
                                section_number: student.section_number,
                                subject_id: student.subject_id,
                                subject_section,
                                status: 'Absent', 
                            }));

                            result = result.concat(absentStudents);
                        }
            
                        return res.status(200).json({
                            message: 'No attendance records found for the specified date. All students have been marked as Absent.',
                            result,
                            subjectsWithSectionsAndLecturers,
                        });
                    } catch (error) {
                        console.error('Database query error for lecturer subjects:', error);
                        return res.status(500).json({ error: 'Error fetching lecturer subject data' });
                    }
                } else {
                    return res.status(404).json({
                        error: 'No records found.',
                    });
                }
            }
            
        res.json({ result, subjectsWithSectionsAndLecturers });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { handleDisplayDailyReport };
