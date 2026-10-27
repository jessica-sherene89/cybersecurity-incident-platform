const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// File filter for forensic evidence
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|webp|svg|pdf|log|txt|doc|docx|csv|json|pcap|pcapng|zip|tar|gz/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

  if (allowedExtensions.test(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Unsupported file format. Allowed: Images, PDF, Log, TXT, DOC, CSV, JSON, PCAP, ZIP.'
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: fileFilter,
});

module.exports = upload;
