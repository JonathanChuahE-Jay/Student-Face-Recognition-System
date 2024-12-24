const moment = require('moment');
const handleShowUser = (database) => async (req, res) => {
    const { user , currentDate} = req.body;

    try {
        const userId = user?.user_id;  
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const role = user?.role === 'admin' ? 'admins' :
                     user?.role === 'lecturer' ? 'lecturers' :
                     user?.role === 'student' ? 'students' : null;

        if (!role) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const userDetails = await database('users').where({ id: userId }).first();
        if (!userDetails) {
            return res.status(404).json({ error: 'User not found' });
        }

        const roleDetails = await database(role).select('*').where({ user_id: userId }).first();
        if (!roleDetails) {
            return res.status(404).json({ error: `${role} details not found for the user` });
        }

        const current_id = role === 'admins' ? roleDetails.admin_id :
                           role === 'lecturers' ? roleDetails.lecturer_id :
                           role === 'students' ? roleDetails.student_id : null;

        if (!current_id) {
            return res.status(400).json({ error: 'Invalid role ID' });
        }

        let subjectsData = [];
        if (user.role !== 'admin') {
            subjectsData = await database(`${user.role}_subjects`)
                .where(`${user.role}_id`, roleDetails.id)
                .then(rows => rows.map(row => {
                    return {
                        subject_id: row.subject_id,
                        subject_section: row.subject_section
                    };
                }));
        }
        for (let i = 0; i < subjectsData.length; i++) {
            const subject = subjectsData[i];

            const section = await database('sections')
                .where('subject_id', subject.subject_id)
                .andWhere('section_number', subject.subject_section)
                .first();

            let current_session = null;

            if (section) {
                const session = await database('session_logs')
                .where('section_id', section.id) // fix this
                .andWhereRaw(`created_for >= ? AND created_for < ?`, [
                    moment(currentDate).startOf('day').toDate(),
                    moment(currentDate).endOf('day').toDate()
                ])
                .first();

                current_session = session ? session : null;
            }
            const subjectDetails = await database('subjects')
                .where('id', subject.subject_id)
                .first();
            if (section) {
                subjectsData[i] = {
                    subject_id: subject.subject_id,
                    subject_section: subject.subject_section,
                    subject_name: subjectDetails.name,
                    start_time: current_session? current_session.start_time : section.start_time,
                    end_time:  current_session? current_session.end_time : section.end_time,
                    venue: section.venue,
                    day: section.day,
                    max_students: section.max_students,
                    current_lecturers: section.current_lecturers,
                    current_students: section.current_students
                };
            }
        }

        const combinedUserDetails = {
            ...userDetails,
            current_id, 
            ...roleDetails,
            subjectsData
        };
        return res.status(200).json(combinedUserDetails);
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ error: 'An error occurred while fetching the user' });
    }
};

module.exports = { handleShowUser };
