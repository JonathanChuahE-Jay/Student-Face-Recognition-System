const handleRegister = (database, bcrypt) => async (req, res) => {
    const { username, email, password, profilePicture } = req.body;

    try {
        const hash = bcrypt.hashSync(password, 10);

        const userExist = await database('users').where({ email }).first();

        if (userExist) {
            return res.status(400).json("Email already exists");
        }

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
                profile_picture: profilePicture,
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
