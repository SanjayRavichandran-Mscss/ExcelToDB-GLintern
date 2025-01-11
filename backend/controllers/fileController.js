const pool = require('../config/db');
const multer = require('../middleware/multerConfig');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Handle file upload and data processing
exports.uploadFile = async (req, res) => {
  multer(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      const filePath = req.file.path;
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // Extract table name from file name (without extension)
      const tableName = req.file.originalname.replace(/\.[^/.]+$/, '');

      // Extract the fields (headers) from the Excel file
      const fields = Object.keys(data[0]);

      // Create the table dynamically based on the Excel file's fields
      let createTableQuery = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        excel_id VARCHAR(255) UNIQUE NOT NULL,`;

      // Add fields dynamically to the table creation query
      fields.forEach((field) => {
        if (field !== 'id') {  // Skip the 'id' field from Excel
          createTableQuery += `\`${field}\` VARCHAR(255),`;
        }
      });

      // Remove the last comma and close the query
      createTableQuery = createTableQuery.slice(0, -1) + ')';

      // Execute the table creation query
      await pool.query(createTableQuery);

      // Fetch existing records from the table to prevent duplicates
      const [existingRecords] = await pool.query(`SELECT excel_id FROM \`${tableName}\``);

      // Map existing records for quick lookup
      const existingExcelIds = new Set(existingRecords.map((record) => record.excel_id));

      // Track new records
      const newRecords = data.filter((row) => !existingExcelIds.has(row.id));

      if (newRecords.length === 0) {
        // No new data; delete the uploaded file
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
        });

        return res.status(200).json({ message: 'No new data found. File deleted.' });
      }

      // Insert new records into the dynamically created table
      for (const row of newRecords) {
        const excelId = row.id;
        const values = fields.map((field) => row[field]);

        // Insert data into the table
        await pool.query(
          `INSERT INTO \`${tableName}\` (excel_id, ${fields.join(', ')}) VALUES (?, ${fields.map(() => '?').join(', ')})`,
          [excelId, ...values]
        );
      }

      res.status(200).json({ message: 'File uploaded and new data stored successfully!' });
    } catch (error) {
      console.error(error);

      // Clean up file in case of error
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
