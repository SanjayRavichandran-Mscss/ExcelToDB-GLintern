const pool = require('../config/db');

exports.processFileData = async (data, tableName) => {
  // Create table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      excel_id VARCHAR(255) UNIQUE,
      name VARCHAR(255),
      course VARCHAR(255),
      college VARCHAR(255),
      city VARCHAR(255),
      state VARCHAR(255),
      country VARCHAR(255)
    )
  `);

  let newRecords = 0;

  for (const row of data) {
    const { id: excel_id, name, course, college, city, state, country } = row;

    if (!excel_id) continue; // Skip rows without an ID

    // Check if record already exists
    const [existing] = await pool.query(
      `SELECT 1 FROM \`${tableName}\` WHERE excel_id = ?`,
      [excel_id]
    );

    if (existing.length === 0) {
      // Insert new record
      await pool.query(
        `INSERT INTO \`${tableName}\` (excel_id, name, course, college, city, state, country)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [excel_id, name, course, college, city, state, country]
      );
      newRecords++;
    }
  }

  return `${newRecords} new records inserted.`;
};
