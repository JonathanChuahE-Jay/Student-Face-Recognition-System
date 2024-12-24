const handleAddNewSubject = (database) => async (req, res) => {
    const { subjectCode, subjectName, subjectSection, numberOfSections, sectionTimes } = req.body;
    let { subjectPicture } = req.body;

    try {
        // Check if subjectName and subjectCode are provided
        if (!subjectName || !subjectCode) {
            return res.status(400).json({ error: "Subject name and subject code are required" });
        }
        
        // Use default picture if subjectPicture is not provided
        if (!subjectPicture) {
            subjectPicture = 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg';
        }

        // Normalize subjectCode: uppercase and remove spaces
        const upperCaseSubjectCode = subjectCode.toUpperCase().replace(/\s+/g, '');

        // Check if the subject code already exists
        const subjectExists = await database('subjects').where({ code: upperCaseSubjectCode }).first();
        if (subjectExists) {
            return res.status(400).json({ error: 'Subject Code already exists' });
        }

        // Insert the new subject
        const [newSubject] = await database('subjects')
            .insert({
                name: subjectName,
                code: upperCaseSubjectCode,
                time_added: new Date(),
                profile_picture: subjectPicture,
                section: subjectSection,
                number_of_sections: numberOfSections
            })
            .returning('*');

        // Process section times
        if (sectionTimes && sectionTimes.length > 0) {
            const sectionEntries = sectionTimes.map((time, index) => ({
                subject_id: newSubject.id,
                section_number: index + 1,
                start_time: time.startTime || '00:00',
                end_time: time.endTime || '00:00',
                day: time.day || 'Monday',
                venue: time.venue || '',
                max_students: Number(time.maxStudents) || 0
            }));

            await database('sections').insert(sectionEntries);
        } else {
            // Handle case where sectionTimes is empty
            const defaultSectionEntries = Array.from({ length: numberOfSections }, (_, index) => ({
                subject_id: newSubject.id,
                section_number: index + 1,
                start_time: '00:00',
                end_time: '00:00',
                day: '',
                venue: '',
                max_students: 0
            }));

            await database('sections').insert(defaultSectionEntries);
        }

        res.status(201).json({ message: 'Subject added successfully', subject: newSubject });
    } catch (error) {
        console.error('Error adding new subject:', error);
        res.status(500).json({ error: "Failed to add new subject" });
    }
};

module.exports = { handleAddNewSubject };
