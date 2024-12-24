const handleAutoSessionLogs = (database) => async (req, res) => {
    try {
        const today = new Date();
        const malaysiaTimeOffset = 8 * 60 * 60 * 1000;

        // Adjust to Malaysia time
        const malaysiaDate = new Date(today.getTime() + malaysiaTimeOffset);

        // Format date and time for Malaysia
        const formattedDate = malaysiaDate.toISOString().split('T')[0];
        const formattedTime = malaysiaDate.toISOString().split('T')[1].slice(0, 8);

        // Fetch sections that have a start time greater than or equal to the formatted time
        const sections = await database('sections')
            .whereRaw('CAST(start_time AS time) <= ? ', [formattedTime]);

        // Fetch session logs for each section
        const sessionLogs = await Promise.all(
            sections.map(async (section) => {
                const log = await database('session_logs')
                    .where({ created_for: formattedDate, section_id: section.id })
                    .first(); 
                return { section_id: section.id, sessionLog: log || null, section };
            })
        );

        // Insert new session logs or update existing ones where necessary
        const insertionMessages = [];
        await Promise.all(
            sessionLogs.map(async (session) => {
                if (session.sessionLog === null) {
                    // Insert a new log
                    await database('session_logs')
                        .insert({
                            section_id: session.section_id,
                            started_by: null, 
                            start_time: session.section.start_time,
                            end_time: session.section.end_time,
                            updated_by: null,
                            updated_at: `${formattedDate} ${formattedTime}`,
                            created_at: `${formattedDate} ${formattedTime}`,
                            created_for: formattedDate
                        });
                    insertionMessages.push(`Successfully inserted for subject ${session.section.subject_id} section ${session.section.section_number}`);
                } else if (session.sessionLog.started_by === null) {
                    // Update the existing log
                    await database('session_logs')
                        .where({ id: session.sessionLog.id , created_for: formattedDate, updated_by: null})
                        .update({
                            started_by: null, 
                            start_time: session.section.start_time,
                            end_time: session.section.end_time,
                            updated_by: null,
                            updated_at: `${formattedDate} ${formattedTime}`
                        });
                    insertionMessages.push(`Successfully updated for subject ${session.section.subject_id} section ${session.section.section_number}`);
                }
            })
        );

        // Send a single response after all operations are completed
        res.status(200).json({ message: insertionMessages.length > 0 ? insertionMessages : 'No new logs inserted.', sections, sessionLogs });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error', error: error.message });
    }
};

module.exports = { handleAutoSessionLogs };
