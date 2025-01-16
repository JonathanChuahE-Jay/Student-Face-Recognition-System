const handleNextSemester = (database) => async (req, res) => {
    try {
        const students = await database('students').select('*');

        const trx = await database.transaction();

        try {
            for (const student of students) {
                const course = await trx('courses')
                    .select('*')
                    .where('code', student.prefix)
                    .first();

                let semester = student.current_semester;
                let year = student.current_year;

                if (semester < course.semesters) {
                    semester += 1;
                } else if (semester >= course.semesters) {
                    if (year < course.years) {
                        year += 1;
                        semester = 1;
                    }
                }

                await trx('students')
                    .where('id', student.id)
                    .update({ current_semester: semester, current_year: year });
            }

            await trx.commit();
            res.status(200).json({ message: 'All students updated to the next semester successfully.' });
        } catch (error) {
            await trx.rollback();
            console.error('Error updating students to next semester:', error);
            res.status(500).json({ error: 'Failed to update students to next semester.' });
        }
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students.' });
    }
};

module.exports = { handleNextSemester };
