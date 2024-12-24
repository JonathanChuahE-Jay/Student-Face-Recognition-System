const handleAddNewCourse = (database) => async (req, res) => {
    const { courseCode, courseName, courseDescription, subjects, years, semesters, programme } = req.body;
    let { coursePicture } = req.body;

    try {
        // Validate required fields
        if (!courseCode || !courseName) {
            return res.status(400).json({ error: "Course code, and name are required." });
        }

        // Validate years and semesters
        if (isNaN(years) || isNaN(semesters) || years <= 0 || semesters <= 0) {
            return res.status(400).json({ error: "Years and semesters must be valid positive numbers." });
        }

        // Validate subjects
        if (!Array.isArray(subjects) || subjects.length === 0) {
            return res.status(400).json({ error: "At least one subject is required." });
        }
        subjects.forEach((subject, index) => {
            const { year, semester, subjects: subjectList } = subject;
            
            if (!year || !semester || !Array.isArray(subjectList) || subjectList.length === 0) {
                throw new Error(`Invalid subject data in entry ${index + 1}. Year, semester, and a list of subjects are required.`);
            }
        });

        // Use default picture if coursePicture is not provided
        if (!coursePicture) {
            coursePicture = 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg';
        }

        // Convert course code to uppercase and remove spaces
        const upperCaseCourseCode = courseCode.toUpperCase().replace(/\s+/g, '');

        // Check if the course code already exists
        const courseExists = await database('courses').where({ code: upperCaseCourseCode }).first();
        if (courseExists) {
            return res.status(400).json({ error: 'Course code already exists.' });
        }

        // Insert the new course
        const [newCourse] = await database('courses')
            .insert({
                name: courseName,
                code: upperCaseCourseCode,
                date_created: new Date(),
                profile_picture: coursePicture,
                description: courseDescription,
                years,
                semesters,
                programme
            })
            .returning('*');
        // Insert subjects into course_subjects
        await Promise.all(subjects.map(async (subject) => {
            const { year, semester, subjects: subjectList } = subject;
            const subjectIds = subjectList.map(sub => sub.id);

            await Promise.all(subjectIds.map(async (subject_id) => {
                // Check if the entry already exists to avoid duplicates
                const exists = await database('course_subjects')
                    .where({ course_id: newCourse.id, subject_id, year, semester })
                    .first();
                
                if (!exists) {
                    await database('course_subjects').insert({
                        course_id: newCourse.id,
                        subject_id,
                        year,
                        semester
                    });
                }
            }));
        }));

        // Respond with success message and course details
        res.status(201).json({ message: 'Course added successfully', course: newCourse });
    } catch (error) {
        console.error("Error adding new course:", error.message);
        res.status(500).json({ error: `Failed to add new course: ${error.message}` });
    }
};

module.exports = { handleAddNewCourse };
