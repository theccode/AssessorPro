import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function syncMediaFiles() {
  console.log('Starting media synchronization for assessment 3...');
  
  const assessmentId = 3;
  const uploadPath = path.join(__dirname, 'uploads', 'assessments', assessmentId.toString());
  
  if (!fs.existsSync(uploadPath)) {
    console.log('Upload path does not exist:', uploadPath);
    return;
  }
  
  // Get existing media records for assessment 3
  const existingMedia = await pool.query(
    'SELECT file_path FROM assessment_media WHERE assessment_id = $1',
    [assessmentId]
  );
  
  const existingPaths = new Set(existingMedia.rows.map(row => row.file_path));
  console.log('Existing database records:', existingPaths.size);
  
  // Scan all files in the assessment directory
  const sections = fs.readdirSync(uploadPath);
  let totalFiles = 0;
  let insertedFiles = 0;
  
  for (const section of sections) {
    const sectionPath = path.join(uploadPath, section);
    if (!fs.statSync(sectionPath).isDirectory()) continue;
    
    const files = fs.readdirSync(sectionPath);
    
    for (const fileName of files) {
      const filePath = path.join(sectionPath, fileName);
      const relativePath = `uploads/assessments/${assessmentId}/${section}/${fileName}`;
      
      totalFiles++;
      
      // Skip if already in database
      if (existingPaths.has(relativePath)) {
        console.log('Already exists in DB:', fileName);
        continue;
      }
      
      // Get file stats
      const stats = fs.statSync(filePath);
      const ext = path.extname(fileName).toLowerCase();
      
      // Determine mime type
      let mimeType = null;
      let fileType = 'other';
      
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        mimeType = `image/${ext.slice(1) === 'jpg' ? 'jpeg' : ext.slice(1)}`;
        fileType = 'image';
      } else if (['.mov', '.mp4', '.avi', '.mkv'].includes(ext)) {
        mimeType = `video/${ext.slice(1)}`;
        fileType = 'video';
      } else if (['.mp3', '.wav', '.ogg'].includes(ext)) {
        mimeType = `audio/${ext.slice(1)}`;
        fileType = 'audio';
      } else if (['.pdf'].includes(ext)) {
        mimeType = 'application/pdf';
        fileType = 'document';
      }
      
      // Extract field name from filename (remove timestamp prefix)
      const cleanFileName = fileName.replace(/^\d+-\d+-/, '');
      const fieldName = cleanFileName.split('.')[0].toLowerCase().replace(/\s+/g, '');
      
      // Insert into database
      try {
        await pool.query(`
          INSERT INTO assessment_media 
          (assessment_id, section_type, field_name, file_name, file_type, file_size, file_path, mime_type, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `, [
          assessmentId,
          section.replace(/-/g, '_'), // Convert kebab-case to snake_case
          fieldName,
          cleanFileName,
          fileType,
          stats.size,
          relativePath,
          mimeType
        ]);
        
        insertedFiles++;
        console.log('Inserted:', cleanFileName);
        
      } catch (error) {
        console.error('Error inserting:', fileName, error.message);
      }
    }
  }
  
  console.log(`\nSynchronization complete:`);
  console.log(`Total files found: ${totalFiles}`);
  console.log(`Files inserted: ${insertedFiles}`);
  console.log(`Files already in DB: ${totalFiles - insertedFiles}`);
  
  await pool.end();
}

syncMediaFiles().catch(console.error);