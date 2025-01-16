const moment = require('moment-timezone');

const handleAlterSessionLogs = (database) => async (req, res) => {
    const { subject_id, section, user, time, date } = req.body;

    if (!subject_id || !section || !user?.user_id || (time !== 'start' && time !== 'end')) {
        return res.status(400).json({ message: 'Invalid request parameters.' });
    }
    try {
        const malaysiaTimeZone = 'Asia/Kuala_Lumpur';
        const malaysiaDate = moment().tz(malaysiaTimeZone);
        const currentReqDate = moment(date).tz(malaysiaTimeZone);

        const formattedDate = currentReqDate.format('YYYY-MM-DD');
        const formattedTime = malaysiaDate.format('HH:mm:ss');
        const updatedAt = malaysiaDate.format('YYYY-MM-DD HH:mm:ss');

        const sectionNumber = parseInt(section, 10);

        const class_section = await database('sections')
            .where({ subject_id, section_number: sectionNumber })
            .first();

        if (!class_section) {
            return res.status(404).json({ message: 'Section not found.' });
        }

        const section_id = class_section.id;

        const sessionLog = await database('session_logs')
            .where({ section_id, created_for: formattedDate })
            .first();

        if (time === 'start') {
            const endTime = sessionLog && sessionLog.end_time && sessionLog.end_time <= formattedTime
                ? '23:59:59'
                : (class_section.end_time || '23:59:59');

            if (sessionLog) {
                await database('session_logs')
                    .where({ section_id, created_for: formattedDate })
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
            const startTime = sessionLog && sessionLog.start_time && sessionLog.start_time >= formattedTime
                ? '00:00:00'
                : (sessionLog?.start_time || class_section.start_time || '00:00:00');

            if (sessionLog) {
                await database('session_logs')
                    .where({ section_id, created_for: formattedDate })
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
            return res.status(400).json({ message: 'Invalid time parameter.' });
        }

        return res.status(200).json({ message: 'Successfully altered session log' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            message: 'Failed to alter session log',
            error: error.message,
        });
    }
};

module.exports = { handleAlterSessionLogs };
