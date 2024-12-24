const formatContactNumber = (contactNumber) => {
    // Remove all non-numeric characters
    const cleaned = contactNumber.replace(/\D/g, '');

    // Remove leading '0' if present
    const withoutLeadingZero = cleaned.startsWith('0') ? cleaned.substring(1) : cleaned;

    // Add the +60 prefix if missing
    const formattedNumber = withoutLeadingZero.startsWith('60')
        ? withoutLeadingZero
        : '60' + withoutLeadingZero;

    // Insert hyphen after the first 2 digits and ensure the rest is either 7 or 8 digits
    return formattedNumber.length >= 9
        ? '+60 ' + formattedNumber.slice(2, 4) + '-' + formattedNumber.slice(4)
        : '+60 ' + formattedNumber.slice(2);
};

// Helper function to validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const handleUpdateLecturer = (database) => async (req, res) => {
    const { id, lecturer_id, name, profile_picture, email, contact_number } = req.body;

    // Trim and validate email
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return res.status(400).json({ error: 'Email cannot be left empty' });
    if (!isValidEmail(trimmedEmail)) return res.status(400).json({ error: 'Invalid email format' });

    // Validate required fields
    if (!name) return res.status(400).json({ error: 'Name cannot be left empty' });
    if (!lecturer_id) return res.status(400).json({ error: 'Lecturer ID cannot be left empty' });

    // Default profile picture if not provided
    const defaultProfilePicture = 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg';
    const updatedProfilePicture = profile_picture || defaultProfilePicture;

    try {
        const user = await database('lecturers').where({ id }).first();
        if (!user) {
            return res.status(404).json({ error: 'Lecturer not found' });
        }

        // Check if the email already exists in another user's account
        const existingEmail = await database('users')
            .where('email', trimmedEmail)
            .whereNot('id', user.user_id)
            .first();
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Check if the lecturer ID already exists in another record
        const existingLecturerId = await database('lecturers')
            .where('lecturer_id', lecturer_id.toUpperCase().replace(/\s+/g, ''))
            .whereNot('id', id)
            .first();
        if (existingLecturerId) {
            return res.status(400).json({ error: 'Lecturer ID already exists' });
        }

        // Update the user's name and email in the 'users' table
        await database('users')
            .where('id', user.user_id)
            .update({
                name,
                email: trimmedEmail
            });

        // Update the lecturer details in the 'lecturers' table
        await database('lecturers')
            .where('id', id)
            .update({
                contact_number: formatContactNumber(contact_number),
                lecturer_id: lecturer_id.toUpperCase().replace(/\s+/g, ''),
                profile_picture: updatedProfilePicture
            });

        res.status(200).json({ message: 'Lecturer updated successfully' });
    } catch (error) {
        console.error('Error updating lecturer:', error);
        res.status(500).json({ error: 'Error updating lecturer', details: error.message });
    }
};

module.exports = { handleUpdateLecturer };
