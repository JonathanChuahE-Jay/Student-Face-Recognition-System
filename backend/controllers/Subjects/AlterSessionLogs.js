const handleAlterSessionLogs = (database) => async (req, res) => {
    const { subject_id, section, user, time, date } = req.body;

    if (!subject_id || !section || !user?.user_id || (time !== 'start' && time !== 'end')) {
        return res.status(400).json({ message: 'Invalid request parameters.' });
    }

    try {
        const currentReqDate = new Date(date);
        const currentDate = new Date();
        const malaysiaTimeOffset = 8 * 60 * 60 * 1000;

        const malaysiaDate = new Date(currentDate.getTime() + malaysiaTimeOffset);
        const malaysiaReqDate = new Date(currentReqDate.getTime() + malaysiaTimeOffset);

        const formattedDate = malaysiaReqDate.toISOString().split('T')[0];
        const formattedTime = malaysiaDate.toISOString().split('T')[1].slice(0, 8);
        const updatedAt = malaysiaDate.toISOString().slice(0, 19).replace('T', ' ');
        const sectionNumber = parseInt(section, 10);

        const class_section = await database('sections')
            .where({ subject_id, section_number: sectionNumber })
            .first();

        if (!class_section) {
            return res.status(404).json({ message: 'Section not found.' });
        }

        const section_id = class_section.id;

        const sessionLog = await database('session_logs')
            .where({ section_id })
            .whereRaw(`date_trunc('day', created_for) = ?`, [formattedDate])
            .first();

            if (time === 'start') {
                const endTime = sessionLog && sessionLog.end_time <= formattedTime 
                    ? '23:59:59' 
                    : class_section.end_time;
            
                if (sessionLog) {
                    await database('session_logs')
                        .where({ section_id })
                        .update({
                            start_time: formattedTime,
                            end_time: endTime,
                            updated_by: user.user_id,
                            updated_at: updatedAt,
                        });
                } else {
                    await database('session_logs').insert({
                        section_id,
                        started_by: user.user_id,
                        start_time: formattedTime,
                        end_time: endTime,
                        updated_by: user.user_id,
                        updated_at: updatedAt,
                        created_for: formattedDate,
                    });
                }
            } else if (time === 'end') {
                const startTime = sessionLog && sessionLog.start_time >= formattedTime 
                    ? '00:00:00' 
                    : (sessionLog.start_time || class_section.start_time);
            
                if (sessionLog) {
                    await database('session_logs')
                        .where({ section_id })
                        .update({
                            start_time: startTime,
                            end_time: formattedTime,
                            updated_by: user.user_id,
                            updated_at: updatedAt,
                        });
                } else {
                    await database('session_logs').insert({
                        section_id,
                        started_by: user.user_id,
                        start_time: startTime,
                        end_time: formattedTime,
                        updated_by: user.user_id,
                        updated_at: updatedAt,
                        created_for: formattedDate,
                    });
                }
            } else {
                return res.status(400).json({ message: 'Time error' });
            }
            

        return res.status(200).json({ message: 'Successfully altered session log' });
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to alter session log',
            error: error.message,
        });
    }
};

module.exports = { handleAlterSessionLogs };
