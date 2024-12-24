const handleDisplayAssignedSubject = (database) => async (req, res) => {
    const { lecturer_id, student_id } = req.body;

    if (!lecturer_id && !student_id) {
        return res.status(400).json({ error: 'Either lecturer_id or student_id is required' });
    }

    try {
        // Initialize query for fetching registered subjects
        let registeredSubjectsQuery = database
            .select('subject_id', 'subject_section')
            .from('lecturer_subjects'); 

        if (student_id) {
            registeredSubjectsQuery = database
                .select('subject_id', 'subject_section', 'year', 'semester')
                .from('student_subjects')
                .where('student_id', '=', student_id);
        } else {
            registeredSubjectsQuery = registeredSubjectsQuery
                .where('lecturer_id', '=', lecturer_id);
        }

        const registeredSubjects = await registeredSubjectsQuery;

        if (registeredSubjects.length === 0) {
            return res.json({ time_and_venue: [], subjectData: [] });
        }

        // Extract subject IDs from registered subjects
        const subjectIds = registeredSubjects.map(item => item.subject_id);

        // Fetch subject details
        const subjectDetails = await database
            .select('id', 'name', 'code', 'number_of_sections')
            .from('subjects')
            .whereIn('id', subjectIds);

        // Fetch time and venue details
        const time_and_venue = await database   
            .select('subject_id', 'section_number', 'start_time', 'end_time', 'venue','day')
            .from('sections')
            .whereIn('subject_id', subjectIds);

        // Combine registered subjects with subject details
        const subjectData = registeredSubjects.map(regSub => {
            const details = subjectDetails.find(subDetail => subDetail.id === regSub.subject_id);
            
            return {
                ...regSub,
                name: details ? details.name : 'Unknown Subject',
                code: details ? details.code : 'Unknown Code',
                section: regSub.subject_section 
            };
        });

        res.json({
            time_and_venue,
            subjectData
        });

    } catch (err) {
        console.error('Error fetching assigned subjects:', err);
        res.status(500).json({ error: 'Failed to fetch assigned subjects' });
    }
};

module.exports = { handleDisplayAssignedSubject };
