import cron from 'node-cron';
import { generateAllThumbnails } from '../scripts/generate-thumbnails';

let isRunning = false;

export function startThumbnailCron() {
  // Запускаем каждые 10 минут: */10 * * * *
  const cronSchedule = '*/10 * * * *';
  
  console.log('📸 Thumbnail generation cron started');
  console.log(`   Schedule: Every 10 minutes (${cronSchedule})`);
  
  cron.schedule(cronSchedule, async () => {
    if (isRunning) {
      console.log('[Thumbnail Cron] Previous job still running, skipping...');
      return;
    }

    isRunning = true;
    console.log(`\n[Thumbnail Cron] Starting job at ${new Date().toISOString()}`);
    
    try {
      await generateAllThumbnails();
    } catch (error) {
      console.error('[Thumbnail Cron] Job failed:', error);
    } finally {
      isRunning = false;
      console.log(`[Thumbnail Cron] Job finished at ${new Date().toISOString()}\n`);
    }
  });

  // Запускаем сразу при старте сервера
  console.log('   Running initial thumbnail generation...');
  setTimeout(async () => {
    isRunning = true;
    try {
      await generateAllThumbnails();
    } catch (error) {
      console.error('[Thumbnail Cron] Initial generation failed:', error);
    } finally {
      isRunning = false;
    }
  }, 5000); // Задержка 5 секунд после старта
}