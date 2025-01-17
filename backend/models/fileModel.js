const pool = require('../config/db');

// Function to create a table dynamically with `excel_id` as primary key
exports.createTableIfNotExists = async (tableName, fields) => {
  let createTableQuery = `
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      excel_id INT PRIMARY KEY,
  `;

  // Dynamically add other fields from the Excel file as columns
  fields.forEach((field) => {
    if (field !== 'excel_id') {
      createTableQuery += `\`${field}\` VARCHAR(255),`;
    }
  });

  createTableQuery = createTableQuery.slice(0, -1) + ')'; // Remove trailing comma and close the query
  await pool.query(createTableQuery);
};

// Function to insert only new records into the table based on `excel_id`
exports.insertNewRecords = async (tableName, data, fields) => {
  // Fetch existing records to avoid duplicates based on `excel_id`
  const [existingRecords] = await pool.query(`SELECT excel_id FROM \`${tableName}\``);

  // Create a Set of existing `excel_id` values for fast lookup
  const existingExcelIds = new Set(existingRecords.map((record) => record.excel_id));

  // Filter out rows that already exist in the database (based on `excel_id`)
  const newRecords = data.filter((row) => !existingExcelIds.has(row.excel_id));

  if (newRecords.length === 0) {
    return 0; // No new records to insert
  }

  // Insert new records into the table
  const placeholders = fields.filter((field) => field !== 'excel_id').map(() => '?').join(', ');
  const query = `INSERT INTO \`${tableName}\` (excel_id, ${fields.filter((field) => field !== 'excel_id').join(', ')}) VALUES (?, ${placeholders})`;

  for (const row of newRecords) {
    const values = [row.excel_id, ...fields.filter((field) => field !== 'excel_id').map((field) => row[field])];
    await pool.query(query, values);
  }

  return newRecords.length; // Return the count of inserted records
};
