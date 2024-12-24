const handleUpdateProfile = (database, bcrypt) => async (req, res) => {
    const { name, email, role, profile_picture, current_id, oldPassword, newPassword, confirmPassword, user_id } = req.body;

    // Check for required fields
    if ( !name || !email || !current_id || !user_id) {
        return res.status(400).json({ message: "All required fields must be provided." });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format." });
    }

    try {
        // Find the user by user_id
        const user = await database('users').where('id', user_id).first();
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        let passwordUpdated = false;

        // Password update process
        if (oldPassword && newPassword && confirmPassword) {
            const isValidOldPassword = await bcrypt.compare(oldPassword, user.password);
            if (!isValidOldPassword) {
                return res.status(401).json({ message: "Old password is incorrect." });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({ message: "New password and confirmation do not match." });
            }

            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await database('users')
                .where('id', user_id)
                .update({ password: hashedPassword });

            passwordUpdated = true;
        }

        // Update user's name and email in the 'users' table
        const updatedRows = await database('users')
            .where('id', user_id)
            .update({
                name,
                email
            });

        // Determine the role and appropriate table to update
        let roleTable, idField;
        if(role === 'admin'){
            roleTable = 'admins';
            idField = 'admin_id';
        }else if (role === 'lecturer'){
            roleTable = 'lecturers';
            idField = 'lecturer_id';
        }else if(role === 'student'){
            roleTable = 'students';
            idField = 'student_id';
        }else{
            return res.status(400).json({ message: "Invalid role specified." });
        }

        // Update the profile picture and current_id in the specific role table
        const updatedRole = await database(roleTable)
            .where({user_id})
            .update({
                profile_picture,
                [idField]: current_id 
            });

        // Check if any update has been made
        if (updatedRows || passwordUpdated || updatedRole) {
            return res.status(200).json({ message: "Profile updated successfully." });
        } else {
            return res.status(304).json({ message: "No changes were made." });
        }

    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = { handleUpdateProfile };
