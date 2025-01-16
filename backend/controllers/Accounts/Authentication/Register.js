const handleRegister = (database, bcrypt) => async (req, res) => {
    const { username, email, password, profilePicture, programme,prefix } = req.body;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }
    
    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&_*])/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ error: "Password must contain at least one number and one special character" });
    }
    
    if (!username || !email || !password || !programme || !prefix) {
        return res.status(400).json({ error: "Please enter all information" });
    }
    const generateRandomStudentId = (prefix) => {
        const length = 8;
        let studentId = '';
        for (let i = 0; i < length; i++) {
            studentId += Math.floor(Math.random() * 10);
        }
        return prefix + studentId;
    };

    const generateUniqueStudentId = async (prefix) => {
        let uniqueId = generateRandomStudentId(prefix);
        let exists = await database('students').where('student_id', uniqueId).first();
        while (exists) {
            uniqueId = generateRandomStudentId(prefix);
            exists = await database('students').where('student_id', uniqueId).first();
        }
        return uniqueId;
    };

    try {
        const hash = bcrypt.hashSync(password, 10);

        const student_id = await generateUniqueStudentId(prefix)

        const userExist = await database('users').where({ email }).first();
        if (userExist) {
            return res.status(400).json({ error: "Email already exists" });
        }
        const profile_picture = profilePicture || 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg';

        await database.transaction(async (trx) => {
            const [user] = await trx('users')
                .insert({
                    name: username,
                    password: hash,
                    email,
                    created_at: new Date(),
                    role: 'student'
                })
                .returning('*');

            await trx('students').insert({
                profile_picture,
                joined_date: new Date(),
                current_year: 1,
                current_semester: 1,
                facial_path: "",
                prefix,
                student_id,
                programme,
                user_id: user.id
            });

            res.status(201).json({ message: 'User registered successfully', user });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json("Failed to register user");
    }
};

module.exports = { handleRegister };
