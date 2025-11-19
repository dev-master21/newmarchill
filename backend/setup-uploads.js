const fs = require('fs');
const path = require('path');

const baseDir = process.env.NODE_ENV === 'production'
  ? '/var/www/www-root/data/www/market.chillium.asia/backend/uploads'
  : path.join(__dirname, 'uploads');

const dirs = [
  baseDir,
  path.join(baseDir, 'products'),
  path.join(baseDir, 'avatars')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
    
    // Установка прав доступа
    fs.chmodSync(dir, '755');
  } else {
    console.log(`Directory exists: ${dir}`);
  }
});

console.log('Upload directories setup complete!');