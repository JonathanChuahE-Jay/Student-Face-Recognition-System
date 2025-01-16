const handleSubjectRegistration = (database) => async (req, res) => {
    const { student_id, role, updateData, subject_id } = req.body;

    const calculateNextSemesterAndYear = (student, course) => {
        let semester = student.current_semester;
        let year = student.current_year;

        if (student.current_semester < course.semesters) {
            semester += 1;
        } else if (student.current_semester >= course.semesters && student.current_year < course.years) {
            year += 1;
            semester = 1;
        }

        return { semester, year };
    };

    try {
        if (!role || !student_id) {
            return res.status(400).json({ error: "Missing required fields: 'role' or 'student_id'" });
        }

        if (role === 'Fetch') {
            const student = await database('students')
                .select('*')
                .where('id', student_id)
                .first();

            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }

            const course = await database('courses')
                .select('*')
                .where('code', student.prefix)
                .first();

            if (!course) {
                return res.status(404).json({ error: 'Course not found' });
            }

            const { semester, year } = calculateNextSemesterAndYear(student, course);

            const student_subjects = await database('student_subjects')
                .select('*')
                .where({ student_id, semester, year })
                .leftJoin('subjects', 'student_subjects.subject_id', 'subjects.id');

            const takenSubjectIds = await database('student_subjects')
                .where('student_id', student_id)
                .pluck('subject_id');

            const availableSubjects = await database('course_subjects')
                .where(function () {
                    this.where('year', '>', student.current_year)
                        .orWhere(function () {
                            this.where('year', '=', student.current_year)
                                .where('semester', '>', student.current_semester);
                        });
                })
                .whereNotIn('course_subjects.subject_id', takenSubjectIds)
                .leftJoin('subjects', 'subjects.id', 'course_subjects.subject_id')
                .leftJoin('sections', 'sections.subject_id', 'course_subjects.subject_id')
                .select(
                    'course_subjects.subject_id',
                    'subjects.*',
                    'sections.section_number',
                    'sections.start_time',
                    'sections.end_time',
                    'sections.day'
                )
                .groupBy(
                    'course_subjects.subject_id',
                    'subjects.id',
                    'sections.section_number',
                    'sections.start_time',
                    'sections.end_time',
                    'sections.day'
                );

            const subjectsWithSections = availableSubjects.reduce((acc, subject) => {
                const { subject_id, name, description, profile_picture, section_number, start_time, end_time, day } = subject;

                if (!acc[subject_id]) {
                    acc[subject_id] = {
                        subject_id,
                        name,
                        description,
                        profile_picture,
                        sections: [],
                    };
                }

                acc[subject_id].sections.push({
                    section_number,
                    start_time,
                    end_time,
                    day,
                });

                return acc;
            }, {});

            res.json({
                student_subjects,
                availableSubjects: Object.values(subjectsWithSections),
            });

        } else if (role === 'Update') {
            if (!updateData || updateData.length === 0) {
                return res.status(400).json({ error: 'No update data provided' });
            }

            const trx = await database.transaction();
            try {
                for (let { subject_id, section } of updateData) {
                    const sectionInt = parseInt(section, 10);
                    await trx('student_subjects')
                        .where({ student_id, subject_id })
                        .update({ subject_section: sectionInt });
                }

                await trx.commit();
                res.status(200).json({ message: 'Subjects updated successfully' });
            } catch (error) {
                await trx.rollback();
                console.error('Error in transaction:', error);
                res.status(500).json({ error: 'Failed to update subjects during transaction' });
            }

        } else if (role === 'Add') {
            const student = await database('students')
                .select('*')
                .where('id', student_id)
                .first();

            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }

            const course = await database('courses')
                .select('*')
                .where('code', student.prefix)
                .first();

            if (!course) {
                return res.status(404).json({ error: 'Course not found' });
            }

            const { semester, year } = calculateNextSemesterAndYear(student, course);

            const trx = await database.transaction();
            try {
                await trx('student_subjects').insert({
                    student_id,
                    subject_id: updateData.subject_id,
                    subject_section: updateData.section,
                    year,
                    semester,
                });

                await trx.commit();
                res.status(200).json({ message: 'Subject added successfully' });
            } catch (error) {
                await trx.rollback();
                console.error('Error adding subject registration:', error);
                res.status(500).json({ error: 'Failed to add subject registration' });
            }

        } else if (role === 'Delete') {
            const trx = await database.transaction();
            try {
                await trx('student_subjects')
                    .where({ student_id, subject_id })
                    .del();
                await trx.commit();
                res.status(200).json({ message: 'Subject deleted successfully' });
            } catch (error) {
                await trx.rollback();
                console.error('Error deleting subject:', error);
                res.status(500).json({ error: 'Failed to delete subject registration' });
            }
        } else {
            res.status(400).json({ error: 'Invalid role specified' });
        }
    } catch (error) {
        console.error('Error handling subject registration:', error);
        res.status(500).json({ error: 'Failed to handle subject registration' });
    }
};

module.exports = { handleSubjectRegistration };
