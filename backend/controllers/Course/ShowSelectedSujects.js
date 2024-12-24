const handleShowSelectedSubjects = (database) => async (req, res) => {
    try {
        const { subject_ids, assignedYear, assignedSemester } = req.body;

        if (!Array.isArray(subject_ids) || subject_ids.length === 0) {
            return res.status(400).json({ error: 'An array of subject_ids is required' });
        }

        // Fetch subjects based on the provided subject_ids
        const subjects = await database("subjects")
            .select('*')
            .from('subjects')
            .whereIn('id', subject_ids);

        if (subjects.length === 0) {
            return res.status(404).json({ error: 'No subjects found' });
        }

        // Add assignedYear and assignedSemester to each subject object
        const enrichedSubjects = subjects.map(subject => ({
            ...subject,
            year: assignedYear,
            semester: assignedSemester
        }));

        // Return subjects with assignedYear and assignedSemester included
        res.json(enrichedSubjects);
    } catch (error) {
        console.error("Error fetching subjects:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { handleShowSelectedSubjects };
