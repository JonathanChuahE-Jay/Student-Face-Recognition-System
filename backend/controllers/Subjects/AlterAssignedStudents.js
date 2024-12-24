const handleAlterAssignSubjectToStudent = (database) => async (req, res) => {
    const { selectedStudents, mode, subject_id } = req.body;

    if (!selectedStudents || !Array.isArray(selectedStudents)) {
        return res.status(400).json({ error: 'Invalid request data' });
    }
    try {
        if (mode === 'DELETE') {
            for (const student of selectedStudents) {
                const { id: student_id } = student;
                if (!student_id || !subject_id) {
                    continue; 
                }
                await database('student_subjects').where({ student_id, subject_id }).del();
                await database('attendances').where({ student_id, subject_id }).del();
            }
            res.status(200).json({ message: 'Subjects deleted successfully' });
        } else if (mode === 'Assign') {
            const prevStudents = await database('student_subjects').where({ subject_id });
            const prevStudentIds = prevStudents.map(student => student.student_id);
        
            const selectedStudentIds = selectedStudents.map(student => student.id);
            const deletedStudents = prevStudentIds.filter(studentID => !selectedStudentIds.includes(studentID));
        
            if (deletedStudents.length > 0) {
                await Promise.all(
                    deletedStudents.map(async (student) => {
                        await database('student_subjects')
                            .where({ student_id: student })
                            .del();
                    })
                );
            }
        
            const existingAssignments = await Promise.all(
                selectedStudents.map(async (student) => {
                    const { id: student_id, subject_section } = student;
                    return await database('student_subjects')
                        .where({ student_id, subject_id, subject_section })
                        .first() || null; // Ensures `null` instead of `undefined`
                })
            );
        
            const nonExistingStudents = selectedStudents.filter((student, index) => !existingAssignments[index]);
        
            if (nonExistingStudents.length > 0) {
                const updatePromises = selectedStudents.map(async (student) => {
                    const { id: student_id, subject_section } = student;
                    const existingAssignment = existingAssignments.find(assignment => assignment?.student_id === student_id);
                    
                    if (existingAssignment) {
                        await database('student_subjects').update({
                            subject_section,
                            year: student.current_year,
                            semester: student.current_semester
                        }).where({ student_id, subject_id });
                    }
                });
        
                await Promise.all(updatePromises);
        
                const inserts = nonExistingStudents.map(student => ({
                    student_id: student.id,
                    subject_id,
                    subject_section: student.subject_section,
                    year: student.current_year,
                    semester: student.current_semester
                }));
                
                await database('student_subjects').insert(inserts);
            }
        
            res.status(200).json({ message: 'Subjects assigned successfully' });
        }
        else if (mode === 'Alter') {
            for (const student of selectedStudents) {
                const student_id = student.id;
                const subject_section = student.subject_section;
                const year = student.current_year;
                const semester = student.current_semester;

                if (!student_id || !subject_id) {
                    continue; 
                }

                // Fetch existing subjects for the student
                const existingSubjects = await database('student_subjects')
                    .select('subject_id')
                    .where({ student_id });

                const existingSubjectIds = new Set(existingSubjects.map(subject => subject.subject_id));

                // Subjects to update
                const updates = existingSubjects.filter(subject => subject.subject_id === subject_id);
                
                // Determine if we need to insert a new subject
                const insert = !existingSubjectIds.has(subject_id) ? [{
                    student_id,
                    subject_id,
                    subject_section,
                    year,
                    semester
                }] : [];

                // Update existing subjects
                for (const subject of updates) {
                    await database('student_subjects')
                        .where({ student_id, subject_id: subject.subject_id })
                        .update({
                            subject_section,
                            year,
                            semester
                        });
                }

                // Insert new subjects
                if (insert.length > 0) {
                    await database('student_subjects').insert(insert);
                }
            }

            res.status(200).json({ message: 'Subjects updated successfully' });
        } else {
            return res.status(400).json({ error: 'Invalid request data' });
        }

    } catch (error) {
        console.error('Error updating subjects:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to update subjects' });
        }
    }
};

module.exports = { handleAlterAssignSubjectToStudent };
