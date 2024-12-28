const handleShowAllSubjects = (database) => async (req, res) => {
    try {
        const { lecturer_id, id_not_include, student_id } = req.query;

        const role = student_id? "student" : "lecturer"; 
        // Fetch only lecturer's subject if lecturer_id is provided
        let subjectAssignmentsQuery = database.select('*').from(`${role}_subjects`);
        if (lecturer_id) {
            subjectAssignmentsQuery = subjectAssignmentsQuery.where({ lecturer_id });
        } else if (id_not_include) {
            subjectAssignmentsQuery = subjectAssignmentsQuery.whereNot({ lecturer_id: id_not_include });
        }else if (student_id){
            subjectAssignmentsQuery = subjectAssignmentsQuery.where({ student_id });
        }

        // Execute the query to get subject
        const subjectAssignments = await subjectAssignmentsQuery;

        // If `lecturer_id` is provided, get only the relevant subject IDs for the lecturer
        const subjectIds = subjectAssignments.map(assignment => assignment.subject_id);
        
        // Fetch only relevant subjects based on the subject IDs for the lecturer
        const subjectsQuery = database.select('*').from('subjects');
        if (lecturer_id || student_id) {
            subjectsQuery.whereIn('id', subjectIds);
        }
        const subjects = await subjectsQuery;

        // Fetch all sections
        const sections = await database
            .select(
                'sections.*',
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
            .from('sections');

        // Organize sections by subject ID
        const sectionsBySubject = sections.reduce((acc, section) => {
            const [startHours, startMinutes] = section.start_time.split(':').map(Number);
            const [endHours, endMinutes] = section.end_time.split(':').map(Number);

            if (!acc[section.subject_id]) {
                acc[section.subject_id] = [];
            }

            acc[section.subject_id].push({
                ...section,
                startHours,
                startMinutes,
                endHours,
                endMinutes
            });

            return acc;
        }, {});

        // Track assigned sections by subject ID
        const assignedSectionsBySubject = subjectAssignments.reduce((acc, assignment) => {
            if (!acc[assignment.subject_id]) {
                acc[assignment.subject_id] = new Set();
            }
            acc[assignment.subject_id].add(assignment.subject_section);
            return acc;
        }, {});

        // Attach sections and disabled status to subjects
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
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
};

module.exports = { handleShowAllSubjects };
