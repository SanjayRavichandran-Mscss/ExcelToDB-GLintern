const multer = require('../middleware/multerConfig');
const xlsx = require('xlsx');
const fs = require('fs');
const { createTableIfNotExists, insertNewRecords } = require('../models/fileModel');

// Controller to handle file upload and processing
exports.uploadFile = async (req, res) => {
  multer(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      const filePath = req.file.path; // Path to the uploaded file
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (data.length === 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: 'Uploaded file is empty.' });
      }

      // Extract table name from file name (without extension)
      const tableName = req.file.originalname.replace(/\.[^/.]+$/, '');

      // Extract fields (headers) from the Excel file
      const fields = Object.keys(data[0]);

      // Check if `excel_id` is present in the fields
      if (!fields.includes('excel_id')) {
        fs.unlinkSync(filePath); // Clean up the uploaded file
        return res.status(400).json({ error: 'Excel file must contain an `excel_id` field.' });
      }

      // Create the table dynamically
      await createTableIfNotExists(tableName, fields);

      // Insert only new records into the table based on `excel_id`
      const newRecordsCount = await insertNewRecords(tableName, data, fields);

      // Delete the uploaded file after processing
      fs.unlinkSync(filePath);

      if (newRecordsCount === 0) {
        return res.status(200).json({ message: 'No new records to insert.' });
      }

      res
        .status(200)
        .json({ message: `${newRecordsCount} new records inserted successfully.` });
    } catch (error) {
      console.error(error);

      // Clean up file in case of error
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
