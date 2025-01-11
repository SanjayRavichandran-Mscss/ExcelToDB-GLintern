require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fileRoutes = require('./routes/fileRoutes');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use('/api/files', fileRoutes);

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
