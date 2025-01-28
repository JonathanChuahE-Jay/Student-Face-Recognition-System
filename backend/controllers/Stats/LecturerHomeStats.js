const moment = require('moment-timezone');

const handleLecturerHomeStats = (database) => async (req, res) => {
    const { date, subjectsAndSections } = req.body;

    const startOfWeek = moment(date).tz('Asia/Kuala_Lumpur').startOf('week').format('YYYY-MM-DD');
    const endOfWeek = moment(date).tz('Asia/Kuala_Lumpur').endOf('week').set({ hour: 23, minute: 59, second: 59 }).format('YYYY-MM-DD HH:mm:ss');

    try {
        const finalData = await Promise.all(
            subjectsAndSections.map(async (item) => {
                if (!item.subject_id || !item.subject_section) {
                    throw new Error('Invalid subject_id or subject_section.');
                }

                try {
                    const subjectsWithSection = await database('subjects')
                        .select('subjects.name as subject_name')
                        .leftJoin('sections', 'sections.subject_id', '=', item.subject_id)
                        .where('subjects.id', item.subject_id)
                        .andWhere('sections.section_number', item.subject_section);

                    if (subjectsWithSection.length === 0) {
                        throw new Error(`Subject or section not found for subject_id ${item.subject_id} and section_number ${item.subject_section}.`);
                    }

                    // Query to fetch attendance data distinctly per section and subject
                    const rows = await database('attendances')
                        .select(
                            'attendances.status',
                            'sections.section_number',
                            database.raw('COUNT(attendances.id) as total_count')
                        )
                        .leftJoin('sections', 'sections.subject_id', '=', 'attendances.subject_id')
                        .leftJoin('student_subjects', function() {
                            this.on('student_subjects.subject_id', '=', 'attendances.subject_id')
                                .andOn('student_subjects.subject_section', '=', item.subject_section);
                        })
                        .where('attendances.subject_id', item.subject_id)
                        .andWhere('attendances.student_id', '=', database.raw('CAST(student_subjects.student_id AS INTEGER)'))
                        .andWhereBetween('attendances.date', [startOfWeek, endOfWeek])
                        .groupBy('attendances.status', 'sections.section_number');

                    // Process rows to attendance data
                    const attendanceData = {
                        subject_name: subjectsWithSection[0].subject_name,
                        subject_id: item.subject_id,
                        section_number: item.subject_section,
                        Present: 0,
                        Absent: 0,
                        Excused: 0,
                    };

                    // Loop through rows and accumulate attendance counts by section
                    rows.forEach((row) => {
                        if (row.section_number === item.subject_section) {
                            if (row.status === 'Present') {
                                attendanceData.Present += parseInt(row.total_count, 10);
                            } else if (row.status === 'Absent') {
                                attendanceData.Absent += parseInt(row.total_count, 10);
                            } else if (row.status === 'Excused') {
                                attendanceData.Excused += parseInt(row.total_count, 10);
                            }
                        }
                    });

                    return attendanceData;
                } catch (error) {
                    console.error('Error fetching subject or attendance data:', error);
                    return {
                        subject_id: item.subject_id,
                        section_number: item.subject_section,
                        error: 'Failed to fetch data for this subject and section.'
                    };
                }
            })
        );

        res.json({
            weeklyReport: finalData,
            weekRange: { startOfWeek, endOfWeek },
        });
    } catch (error) {
        console.error('Error fetching attendance stats:', error);
        res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
};

module.exports = { handleLecturerHomeStats };
