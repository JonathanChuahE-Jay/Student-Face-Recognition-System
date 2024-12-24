const fs = require('fs');
const path = require('path');

const handleUpload = (database) => async (req, res) => { 
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        let { path: filePath } = req.file;
        filePath = path.normalize(filePath);

        filePath = filePath.replace(/^uploads[\/\\]/, '');

        const userId = req.body.user_id; 
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await database('students')
            .select('facial_path')
            .where('user_id', userId)
            .first();

        if (user && user.facial_path) {
            const oldImagePath = path.join(__dirname, '..', '..', 'uploads', user.facial_path);

            if (fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        console.error(`Error deleting old image at path ${oldImagePath}:`, err);
                    } else {
                        console.log(`Old image at path ${oldImagePath} deleted successfully.`);
                    }
                });
            } else {
                console.warn(`File not found at path: ${oldImagePath}`);
            }
        }

        await database('students')
            .where('user_id', userId)
            .update({ facial_path: filePath });

        res.json({ message: 'Image uploaded and updated successfully', filePath });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { handleUpload };
