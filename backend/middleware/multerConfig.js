const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.xlsx' || ext === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Only Excel and CSV files are allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter }).single('file');
module.exports = upload;
