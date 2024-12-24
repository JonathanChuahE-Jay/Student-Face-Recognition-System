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

const handleLecturerRegister = (database, bcrypt) => async (req, res) => {
    const { lecturer_id, name, email, password, contact_number } = req.body;
    let { profile_picture } = req.body;

    // Trim the email to remove any leading or trailing spaces
    const trimmedEmail = email.trim();

    // Validate required fields
    if (!lecturer_id || !name || !trimmedEmail || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Default profile picture if not provided
    if (!profile_picture) {
        profile_picture = 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg';
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    try {
        const hash = bcrypt.hashSync(password, 10);

        // Check if the email already exists across all relevant tables
        const emailExist = await database('users').where({ email: trimmedEmail }).first();

        if (emailExist) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const upper_case_lecturer_id = lecturer_id.toUpperCase().replace(/\s+/g, '');
        const formattedContactNumber = formatContactNumber(contact_number);

        // Check if the lecturer ID already exists
        const IDExist = await database('lecturers').where('lecturer_id', '=', upper_case_lecturer_id).first();
        if (IDExist) {
            return res.status(400).json({ message: 'Lecturer ID already exists' });
        }

        // Insert new lecturer record into the database
        await database.transaction(async (trx) => {
            const [newUser] = await trx('users')
                .insert({
                    name,
                    email: trimmedEmail,
                    password: hash,
                    role: 'lecturer',
                    created_at: new Date(),
                })
                .returning('*');

            const [newLecturer]  = await trx('lecturers')
                .insert({
                    user_id: newUser.id,
                    lecturer_id: upper_case_lecturer_id,
                    contact_number: formattedContactNumber,
                    profile_picture,
                    joined_date: new Date(),
                })
                .returning('*');

            res.status(201).json({ message: 'User registered successfully', user: newLecturer });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to register user', error: err.message });
    }
};

module.exports = { handleLecturerRegister };
