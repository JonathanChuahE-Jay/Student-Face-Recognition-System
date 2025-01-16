const moment = require('moment');

const handleShowAllSubjects = (database) => async (req, res) => {
    try {
        const { lecturer_id, id_not_include, student_id } = req.query;

        const role = student_id ? "student" : "lecturer"; 

        let subjectAssignmentsQuery = database.select('*').from(`${role}_subjects`);

        if (lecturer_id) {
            subjectAssignmentsQuery = subjectAssignmentsQuery.where({ lecturer_id });
        } else if (id_not_include) {
            subjectAssignmentsQuery = subjectAssignmentsQuery.whereNot({ lecturer_id: id_not_include });
        } else if (student_id) {
            subjectAssignmentsQuery = subjectAssignmentsQuery
                .where({ 'student_subjects.student_id': student_id }) 
                .leftJoin('students', 'student_subjects.student_id', '=', 'students.id')
                .where('student_subjects.year', database.ref('students.current_year'))
                .where('student_subjects.semester', database.ref('students.current_semester'));
        }

        const subjectAssignments = await subjectAssignmentsQuery;

        const subjectIds = subjectAssignments.map(assignment => assignment.subject_id);

        const subjectsQuery = database.select('*').from('subjects');
        if (lecturer_id || student_id) {
            subjectsQuery.whereIn('id', subjectIds);
        }

        const subjects = await subjectsQuery;

        const today = moment().format('YYYY-MM-DD'); 

        const sections = await database
            .select(
                'sections.*',
                'subjects.*',
                'session_logs.start_time as session_start_time',
                'session_logs.end_time as session_end_time',
                database
                    .count('student_subjects.student_id as total_students')
                    .from('student_subjects')
                    .join('students', 'student_subjects.student_id', '=', 'students.id')
                    .where('student_subjects.subject_id', database.ref('sections.subject_id'))
                    .andWhere('student_subjects.subject_section', database.ref('sections.section_number'))
                    .andWhere('students.current_year', '=', database.ref('student_subjects.year'))
                    .andWhere('students.current_semester', '=', database.ref('student_subjects.semester'))
                    .as('total_students'),
                database
                    .count('lecturer_subjects.subject_id as total_lecturers')
                    .from('lecturer_subjects')
                    .where('lecturer_subjects.subject_id', '=', database.ref('sections.subject_id'))
                    .andWhere('lecturer_subjects.subject_section', '=', database.ref('sections.section_number'))
                    .as('total_lecturers')
            )
            .from('sections')
            .leftJoin('subjects', 'subjects.id', 'sections.subject_id')
            .leftJoin('session_logs', function () {
                this.on('sections.id', '=', 'session_logs.section_id')
                    .andOn('session_logs.created_for', '=', database.raw('?', [today]));
            });

        const sectionsBySubject = sections.reduce((acc, section) => {
            const startTime = section.session_start_time || section.start_time; 
            const endTime = section.session_end_time || section.end_time;

            const [startHours, startMinutes] = startTime.split(':').map(Number);
            const [endHours, endMinutes] = endTime.split(':').map(Number);

            if (!acc[section.subject_id]) {
                acc[section.subject_id] = [];
            }

            acc[section.subject_id].push({
                ...section,
                start_time: startTime,
                end_time: endTime,
                startHours,
                startMinutes,
                endHours,
                endMinutes
            });

            return acc;
        }, {});

        const assignedSectionsBySubject = subjectAssignments.reduce((acc, assignment) => {
            if (!acc[assignment.subject_id]) {
                acc[assignment.subject_id] = new Set();
            }
            acc[assignment.subject_id].add(assignment.subject_section);
            return acc;
        }, {});

        const subjectsWithSections = subjects.map(subject => ({
            ...subject,
            sections: (sectionsBySubject[subject.id] || []).map(section => ({
                ...section,
                isDisabled: assignedSectionsBySubject[subject.id]?.has(section.section_number) || false
            }))
        }));

        res.json(subjectsWithSections);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to retrieve data', details: error.message });
    }
};

module.exports = { handleShowAllSubjects };
