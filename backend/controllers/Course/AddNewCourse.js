const handleAddNewCourse = (database) => async (req, res) => {
    const { courseCode, courseName, courseDescription, subjects, years, semesters, programme } = req.body;
    let { coursePicture } = req.body;

    try {
        if (!courseCode || !courseName) {
            return res.status(400).json({ error: "Course code, and name are required." });
        }

        if (isNaN(years) || isNaN(semesters) || years <= 0 || semesters <= 0) {
            return res.status(400).json({ error: "Years and semesters must be valid positive numbers." });
        }

        if (!Array.isArray(subjects) || subjects.length === 0) {
            return res.status(400).json({ error: "At least one subject is required." });
        }
        subjects.forEach((subject, index) => {
            const { year, semester, subjects: subjectList } = subject;
            
            if (!year || !semester || !Array.isArray(subjectList) || subjectList.length === 0) {
                throw new Error(`Invalid subject data in entry ${index + 1}. Year, semester, and a list of subjects are required.`);
            }
        });

        if (!coursePicture) {
            coursePicture = 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg';
        }

        const upperCaseCourseCode = courseCode.toUpperCase().replace(/\s+/g, '');

        const courseCodeExists = await database('courses').where({ code: upperCaseCourseCode }).first();
        if (courseCodeExists) {
            return res.status(400).json({ error: 'Course code already exists.' });
        }

        const courseNameExists = await database('courses').where({ name:courseName  }).first();
        if (courseNameExists) {
            return res.status(400).json({ error: 'Course name already exists.' });
        }

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
        await Promise.all(subjects.map(async (subject) => {
            const { year, semester, subjects: subjectList } = subject;
            const subjectIds = subjectList.map(sub => sub.id);

            await Promise.all(subjectIds.map(async (subject_id) => {
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

        res.status(201).json({ message: 'Course added successfully', course: newCourse });
    } catch (error) {
        console.error("Error adding new course:", error.message);
        res.status(500).json({ error: `Failed to add new course: ${error.message}` });
    }
};

module.exports = { handleAddNewCourse };
