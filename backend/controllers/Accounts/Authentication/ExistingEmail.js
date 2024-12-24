const handleExistingEmail = (database) => async (req, res) => {
    const { email } = req.body;

    try {
        const userExist = await database('users').where({ email }).first();

        if (userExist) {
            return res.status(400).json('Email already exists');
        } else {
            return res.status(200).json('Email is available');
        }
    } catch (err) {
        console.error(err);
        res.status(500).json('Error checking email');
    }
};

module.exports = { handleExistingEmail };
