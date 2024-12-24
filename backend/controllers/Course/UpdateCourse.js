const handleUpdateCourse = (database) => async (req, res) => {
    const {
        course_id,
        course_code,
        course_description,
        course_name,
        course_profile_picture,
        course_years,
        course_semesters,
        subjects,
        course_programme,
    } = req.body;

    try {
        // Update course details
        await database('courses')
            .where({ id: course_id })
            .update({
                name: course_name,
                code: course_code,
                description: course_description,
                profile_picture: course_profile_picture,
                years: course_years,
                semesters: course_semesters,
                programme: course_programme
            });

        // Delete old subjects and insert new ones
        await database.transaction(async (trx) => {
            await trx('course_subjects')
                .where({ course_id })
                .del();

            if (subjects && subjects.length > 0) {
                await trx('course_subjects')
                    .insert(subjects.map(subject => ({
                        course_id,
                        subject_id: subject.id,
                        year: subject.year,
                        semester: subject.semester,
                    })));
            }
        });

        res.status(200).json({ message: 'Course updated successfully' });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ error: 'Failed to update course' });
    }
};

module.exports = { handleUpdateCourse };

