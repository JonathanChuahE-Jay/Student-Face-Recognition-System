const handleValidEmail = (database) => async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json('Email is required.');
    }
  
    try {
      const userEmail = await database('users').select('email').where('email', '=', email).first();
      if (!userEmail) {
        return res.status(404).json('Email not found.');
      } else {
        return res.json(userEmail);
      }
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
  
module.exports = { handleValidEmail };
  