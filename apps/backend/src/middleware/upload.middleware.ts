import multer from 'multer';

// Use memory storage to process files directly into buffers and upload to Supabase
const storage = multer.memoryStorage();

export const uploadMedia = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB limit for files (video/pdf)
  },
  fileFilter: (req, file, cb) => {
    // Accept images, videos, and PDFs
    if (
      file.mimetype.startsWith('image/') || 
      file.mimetype.startsWith('video/') ||
      file.mimetype === 'application/pdf'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and PDFs are allowed.'));
    }
  }
});
