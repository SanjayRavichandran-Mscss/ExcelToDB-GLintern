const pool = require('../config/db');
const multer = require('../middleware/multerConfig');
const xlsx = require('xlsx');
const { processFileData } = require('../models/fileModel');

exports.uploadFile = async (req, res) => {
  multer(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      const filePath = req.file.path;
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (data.length === 0) return res.status(400).json({ error: 'File is empty or invalid.' });

      const tableName = req.file.originalname.replace(/\.[^/.]+$/, '');

      // Process file data and store in the database
      const result = await processFileData(data, tableName);
      res.status(200).json({ message: result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
