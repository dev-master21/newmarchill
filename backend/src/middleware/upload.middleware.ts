import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ВАЖНО: Используем путь относительно корня проекта, а не скомпилированных файлов
// __dirname в dist будет указывать на dist/src/middleware
// Поэтому поднимаемся на 3 уровня вверх к корню backend
const uploadDir = process.env.NODE_ENV === 'production'
  ? '/var/www/www-root/data/www/market.chillium.asia/backend/uploads'
  : path.join(__dirname, '../../../uploads'); // из dist/src/middleware в backend/uploads

console.log('Upload directory configured:', uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'products';
    
    if (file.fieldname === 'avatar') {
      folder = 'avatars';
    }
    
    const dir = path.join(uploadDir, folder);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('Created directory:', dir);
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    console.log('Saving file as:', filename);
    cb(null, filename);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  },
  fileFilter
});