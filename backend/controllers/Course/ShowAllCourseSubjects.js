const handleShowAllCourseSubjects = (database) => async (req, res) => {
    try {
        // Fetch courses with their associated subjects
        const results = await database('courses')
            .leftJoin('course_subjects', 'courses.id', 'course_subjects.course_id')
            .leftJoin('subjects', 'course_subjects.subject_id', 'subjects.id')
            .select(
                'courses.id as course_id',
                'courses.programme as course_programme',
                'courses.name as course_name',
                'courses.code as course_code',
                'courses.description as course_description',
                'courses.date_created as course_date_created',
                'courses.years as course_years',
                'courses.semesters as course_semesters',
                'courses.profile_picture as course_profile_picture',
                'subjects.id as subject_id',
                'subjects.name as subject_name',
                'subjects.profile_picture as subject_profile_picture',
                'subjects.code as subject_code',
                'subjects.section as subject_section',
                'course_subjects.year as course_subject_year',
                'course_subjects.semester as course_subject_semester'
            )
            .orderBy('courses.id', 'asc')
            .orderBy('subjects.name', 'asc');

        // Organize results by course
        const coursesWithSubjects = results.reduce((acc, row) => {
            const {course_programme,course_subject_semester,course_subject_year,course_years,course_semesters, course_id, course_name, course_code, course_description, course_date_created, course_profile_picture, subject_id, subject_name, subject_profile_picture, subject_code, subject_section } = row;
            if (!acc[course_id]) {
                acc[course_id] = {
                    course_id,
                    course_name,
                    course_code,
                    course_description,
                    course_date_created,
                    course_programme,
                    course_profile_picture,
                    course_years,
                    course_semesters,
                    subjects: []
                };
            }
            if (subject_id) {
                acc[course_id].subjects.push({
                    id: subject_id,
                    name: subject_name,
                    profile_picture: subject_profile_picture,
                    year: course_subject_year,
                    semester: course_subject_semester,
                    code: subject_code,
                    section: subject_section
                });
            }
            return acc;
        }, {});

        // Convert to an array of courses with their subjects
        const formattedResults = Object.values(coursesWithSubjects);

        res.status(200).json(formattedResults);
    } catch (error) {
        console.error('Error fetching courses and subjects:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { handleShowAllCourseSubjects };
