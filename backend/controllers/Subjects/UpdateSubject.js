const handleUpdateSubject = (database) => async (req, res) => {
    const { id, subjectName, subjectCode, subjectPicture, subjectSection, numberOfSections, sectionTimes, venue, day } = req.body;

    if(!subjectName && !subjectCode && !subjectPicture&& !subjectSection){
        try{
            // Check if the subject exists
            const existingSubject = await database('subjects')
            .where('id', '=', id)
            .first();

            if (!existingSubject) {
                return res.status(404).json({ error: 'Subject ID not found.' });
            }
            // Check if the new number of sections is less than the existing one
            const prevSection = 
            await database('subjects')
                .where('id', '=', id)
                .select('number_of_sections')
                .first();

            if (prevSection && numberOfSections < prevSection.number_of_sections) {
                // Delete associated records where subject_section is greater than the new number of sections
                await database('lecturer_subjects')
                    .where('subject_id', id)
                    .where('subject_section', '>', numberOfSections)
                    .del();
                
                await database('student_subjects')
                    .where('subject_id', id)
                    .where('subject_section', '>', numberOfSections)
                    .del();

                await database('sections')
                    .where('subject_id', id)
                    .where('section_number', '>', numberOfSections)
                    .del();
            }

            // Update the subject
            await database('subjects')
                .where('id', '=', id)
                .update({
                    number_of_sections: numberOfSections
                });

            // Call update or create section times
            await updateOrCreateSectionTimes(database, id, sectionTimes, venue, day);

            return res.status(200).json({ message: 'Subject and section times updated successfully.' });

        } catch (error) {
            console.error('Error updating subject:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }else{
        try {
            // Check for duplicate subject code
            const sameCode = await database('subjects')
                .where('code', '=', subjectCode)
                .whereNot('id', id)
                .first();

            if (sameCode) {
                return res.status(400).json({ error: 'Subject code already exists.' });
            }

            // Check if the subject exists
            const existingSubject = await database('subjects')
                .where('id', '=', id)
                .first();

            if (!existingSubject) {
                return res.status(404).json({ error: 'Subject ID not found.' });
            }

            const prevSection = 
                await database('subjects')
                    .where('id', '=', id)
                    .select('number_of_sections')
                    .first();

            if (prevSection && numberOfSections < prevSection.number_of_sections) {
                await database('lecturer_subjects')
                    .where('subject_id', id)
                    .where('subject_section', '>', numberOfSections)
                    .del();
                
                await database('student_subjects')
                    .where('subject_id', id)
                    .where('subject_section', '>', numberOfSections)
                    .del();

                await database('sections')
                    .where('subject_id', id)
                    .where('section_number', '>', numberOfSections)
                    .del();
            }

            // Handle increase in sections and ensure sequential numbering
            if (prevSection && numberOfSections > prevSection.number_of_sections) {
                const existingSectionNumbers = await database('sections')
                    .where('subject_id', id)
                    .pluck('section_number');

                const newSections = Array.from(
                    { length: numberOfSections },
                    (_, index) => index + 1
                )
                .filter(sectionNumber => !existingSectionNumbers.includes(sectionNumber))
                .map(sectionNumber => ({
                    subject_id: id,
                    section_number: sectionNumber,
                    start_time: '00:00',
                    end_time: '00:00',
                    day: '',
                    venue: '',
                    max_students: 0
                }));

                // Insert only missing sections to ensure consecutive numbers
                if (newSections.length > 0) {
                    await database('sections').insert(newSections);
                }
            }

            // Update the subject
            const upper_case_subject_code = subjectCode.toUpperCase().replace(/\s+/g, '');

            await database('subjects')
                .where('id', '=', id)
                .update({
                    name: subjectName,
                    code: upper_case_subject_code,
                    profile_picture: subjectPicture,
                    section: subjectSection,
                    number_of_sections: numberOfSections
                });
            return res.status(200).json({ message: 'Subject and section times updated successfully.' });

        } catch (error) {
            console.error('Error updating subject:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    };
}

const updateOrCreateSectionTimes = async (database, subjectId, sectionTimes, venue = [], day = []) => {
    try {
        await database.transaction(async trx => {
            for (const [index, time] of sectionTimes.entries()) {
                const sectionNumber = index + 1;
                const { startTime = '00:00', endTime = '00:00', max_students = 0 } = time;

                const sectionVenue = venue[index] || ''; 
                
                const sectionDay = day[index] === undefined || day[index] === 'undefined' ? '' : day[index]; 

                const parsedMaxStudents = parseInt(max_students, 10);

                const existingSection = await trx('sections')
                    .where({
                        subject_id: subjectId,
                        section_number: sectionNumber
                    })
                    .first();

                if (existingSection) {
                    await trx('sections')
                        .where({
                            subject_id: subjectId,
                            section_number: sectionNumber
                        })
                        .update({
                            start_time: startTime,
                            end_time: endTime,
                            venue: sectionVenue,
                            day: sectionDay,  
                            max_students: isNaN(parsedMaxStudents) ? 0 : parsedMaxStudents
                        });                        
                } else {
                    await trx('sections')
                        .insert({
                            subject_id: subjectId,
                            section_number: sectionNumber,
                            start_time: startTime,
                            end_time: endTime,
                            venue: sectionVenue,
                            day: sectionDay,  
                            max_students: isNaN(parsedMaxStudents) ? 0 : parsedMaxStudents
                        });
                }
            }
        });
    } catch (error) {
        console.error('Error updating or creating section times:', error);
        throw error; 
    }
};

module.exports = { handleUpdateSubject };
