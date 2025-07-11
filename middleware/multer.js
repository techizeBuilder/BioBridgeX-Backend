import multer from "multer";
import fs from "fs";
import path from "path";

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public')
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join('./public/uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({ storage });