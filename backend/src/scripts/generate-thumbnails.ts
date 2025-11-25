import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

interface Product {
  id: number;
  image: string;
  gallery: string;
}

const UPLOADS_DIR = path.join(__dirname, '../../uploads/products'); // ИСПРАВЛЕНО
const THUMBNAIL_SUFFIX = '_thumb';
const THUMBNAIL_QUALITY = 60;
const THUMBNAIL_WIDTH = 800;

async function generateThumbnail(imagePath: string): Promise<boolean> {
  try {
    // Путь относительно backend/ директории
    const fullPath = path.join(__dirname, '../..', imagePath); // ИСПРАВЛЕНО
    
    if (!fs.existsSync(fullPath)) {
      console.log(`[Skip] Original not found: ${imagePath}`);
      return false;
    }

    const ext = path.extname(imagePath);
    const nameWithoutExt = imagePath.substring(0, imagePath.length - ext.length);
    const thumbPath = `${nameWithoutExt}${THUMBNAIL_SUFFIX}${ext}`;
    const fullThumbPath = path.join(__dirname, '../..', thumbPath); // ИСПРАВЛЕНО

    if (fs.existsSync(fullThumbPath)) {
      console.log(`[Skip] Thumbnail already exists: ${thumbPath}`);
      return false;
    }

    console.log(`[Generate] Creating thumbnail for: ${imagePath}`);
    
    await sharp(fullPath)
      .resize(THUMBNAIL_WIDTH, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: THUMBNAIL_QUALITY, progressive: true })
      .toFile(fullThumbPath);

    const originalSize = fs.statSync(fullPath).size;
    const thumbnailSize = fs.statSync(fullThumbPath).size;
    const reduction = ((1 - thumbnailSize / originalSize) * 100).toFixed(1);

    console.log(`[Success] Generated: ${thumbPath} (${reduction}% smaller)`);
    return true;

  } catch (error) {
    console.error(`[Error] Failed to generate thumbnail for ${imagePath}:`, error);
    return false;
  }
}

async function getAllProductImages(): Promise<string[]> {
  const images: Set<string> = new Set();

  try {
    const [products] = await pool.execute<RowDataPacket[]>(
      'SELECT id, image, gallery FROM products WHERE is_active = 1'
    );

    for (const product of products) {
      if (product.image) {
        images.add(product.image);
      }

      if (product.gallery) {
        try {
          let gallery: string[] = [];
          
          if (typeof product.gallery === 'string') {
            gallery = JSON.parse(product.gallery);
          } else if (Array.isArray(product.gallery)) {
            gallery = product.gallery;
          } else if (Buffer.isBuffer(product.gallery)) {
            gallery = JSON.parse(product.gallery.toString('utf8'));
          }

          if (Array.isArray(gallery)) {
            gallery.forEach(img => {
              if (img && typeof img === 'string') {
                images.add(img);
              }
            });
          }
        } catch (e) {
          console.error(`Failed to parse gallery for product ${product.id}:`, e);
        }
      }
    }

    console.log(`Found ${images.size} unique images across all products`);
    return Array.from(images);

  } catch (error) {
    console.error('Failed to fetch products from database:', error);
    return [];
  }
}

async function generateAllThumbnails() {
  console.log('='.repeat(60));
  console.log('THUMBNAIL GENERATION STARTED');
  console.log('='.repeat(60));
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('');

  const images = await getAllProductImages();
  
  if (images.length === 0) {
    console.log('No images found to process');
    return;
  }

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const imagePath of images) {
    const result = await generateThumbnail(imagePath);
    
    if (result === true) {
      generated++;
    } else {
      const ext = path.extname(imagePath);
      const nameWithoutExt = imagePath.substring(0, imagePath.length - ext.length);
      const thumbPath = `${nameWithoutExt}${THUMBNAIL_SUFFIX}${ext}`;
      const fullThumbPath = path.join(__dirname, '../..', thumbPath);
      
      if (fs.existsSync(fullThumbPath)) {
        skipped++;
      } else {
        failed++;
      }
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('THUMBNAIL GENERATION COMPLETED');
  console.log('='.repeat(60));
  console.log(`Total images: ${images.length}`);
  console.log(`Generated: ${generated}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
}

if (require.main === module) {
  generateAllThumbnails()
    .then(() => {
      console.log('\nScript finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { generateAllThumbnails };