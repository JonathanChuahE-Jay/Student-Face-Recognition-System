const handleLogin = (database, bcrypt) => async (req, res) => {
  const { email, password } = req.body;  

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });  
  }

  try {
    const userData = await database('users')
      .select('*')
      .where('email', '=', email)
      .first();

    if (!userData) {
      return res.status(404).json({ message: "User not found" }); 
    }

    const isValidPassword = bcrypt.compareSync(password, userData.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid password" });  
    }

    const role = userData.role === 'admin'
      ? 'admins'
      : userData.role === 'lecturer'
      ? 'lecturers'
      : userData.role === 'student'
      ? 'students'
      : null;

    if (!role) {
      return res.status(401).json({ message: "Invalid role" });
    }

    const roleSpecificData = await database(role)
      .select('*')
      .where('user_id', userData.id)
      .first();

    if (!roleSpecificData) {
      return res.status(404).json({ message: `No additional data found for role ${userData.role}` });
    }

    const current_id = role === 'admins'
      ? roleSpecificData.admin_id
      : role === 'lecturers'
      ? roleSpecificData.lecturer_id
      : role === 'students'
      ? roleSpecificData.student_id
      : null;

    let subjectsData = [];
    if (userData.role !== 'admin') {
      subjectsData = await database(`${userData.role}_subjects`)
        .where(`${userData.role}_id`, roleSpecificData.id)
        .then(rows => rows.map(row => {
          return {
            subject_id: row.subject_id,
            subject_section: row.subject_section
          };
        }));
    }

    for (let i = 0; i < subjectsData.length; i++) {
      const subject = subjectsData[i];

      const section = await database('sections')
        .where('subject_id', subject.subject_id)
        .andWhere('section_number', subject.subject_section)
        .first();

      const subjectDetails = await database('subjects')
        .where('id', subject.subject_id)
        .first();
      if (section) {
        subjectsData[i] = {
          ...subject,
          subject_name: subjectDetails.name,
          start_time: section.start_time,
          end_time: section.end_time,
          venue: section.venue,
          day: section.day,
          max_students: section.max_students,
          current_lecturers: section.current_lecturers,
          current_students: section.current_students
        };
      }
    }

    const currentUser = {
      ...userData,
      ...roleSpecificData,
      current_id, 
      subjectsData
    };

    res.json(currentUser);  
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" }); 
  }
};

module.exports = { handleLogin };
