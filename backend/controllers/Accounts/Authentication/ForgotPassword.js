const handleForgotPassword = (database, bcrypt) => async (req, res) => {
    const { email, newPassword } = req.body;
  
    try {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
  
      const updateCount = await database('users')
        .where('email', '=', email)
        .update({
          password: hashedPassword,
        });
  
      if (updateCount > 0) {
        res.status(200).json('Password updated successfully.');
      } else {
        res.status(400).json('Unable to update password. User not found.');
      }
    } catch (err) {
      console.error(err);
      res.status(500).json('Error updating password.');
    }
  };
  
  module.exports = {
    handleForgotPassword,
  };
  