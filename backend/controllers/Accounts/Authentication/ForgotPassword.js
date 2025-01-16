const handleForgotPassword = (database, bcrypt) => async (req, res) => {
    const { email, newPassword } = req.body;
  
    try {
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }
      const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&_*])/;
      if (!passwordRegex.test(newPassword)) {
          return res.status(400).json({ error: "Password must contain at least one number and one special character" });
      }
    
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
  
      const updateCount = await database('users')
        .where('email', '=', email)
        .update({
          password: hashedPassword,
        });
  
      if (updateCount > 0) {
        res.status(200).json({message: 'Password updated successfully.'});
      } else {
        res.status(400).json({error:'Unable to update password. User not found.'});
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({error: 'Error updating password.'});
    }
  };
  
  module.exports = {
    handleForgotPassword,
  };
  