import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuid } from 'uuid';
import ffmpeg from '../ffmpeg.js';
import { UPLOAD_DIR, OUTPUT_DIR } from '../paths.js';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.mp4';
      cb(null, `${uuid()}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error('Only video files are supported'));
    }
    cb(null, true);
  },
});

function probeDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      resolve(data.format.duration);
    });
  });
}

// Upload a source video, returns an id + duration for the trimmer UI
router.post('/upload', upload.single('video'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }
    const duration = await probeDuration(req.file.path);
    res.json({
      fileId: req.file.filename,
      originalName: req.file.originalname,
      duration,
    });
  } catch (err) {
    next(err);
  }
});

// Trim the previously uploaded video into a clip (video or audio-only for podcasts)
router.post('/trim', async (req, res, next) => {
  try {
    const { fileId, start, end, mode = 'video', name } = req.body;

    if (!fileId) return res.status(400).json({ error: 'fileId is required' });

    const startTime = Number(start);
    const endTime = Number(end);
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
      return res.status(400).json({ error: 'Invalid start/end time' });
    }

    const sourcePath = path.join(UPLOAD_DIR, fileId);
    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({ error: 'Uploaded file not found' });
    }

    const isAudio = mode === 'audio';
    const clipId = uuid();
    const ext = isAudio ? 'mp3' : 'mp4';
    const outputFilename = `${clipId}.${ext}`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);
    const duration = endTime - startTime;

    await new Promise((resolve, reject) => {
      let command = ffmpeg(sourcePath).setStartTime(startTime).setDuration(duration);

      if (isAudio) {
        command = command.noVideo().audioCodec('libmp3lame').format('mp3');
      } else {
        command = command.videoCodec('libx264').audioCodec('aac').format('mp4');
      }

      command
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    res.json({
      id: clipId,
      name: name || `clip-${clipId}`,
      mode: isAudio ? 'audio' : 'video',
      url: `/outputs/${outputFilename}`,
      duration,
    });
  } catch (err) {
    next(err);
  }
});

// List generated clips
router.get('/', (req, res, next) => {
  try {
    const files = fs.readdirSync(OUTPUT_DIR).filter((f) => !f.startsWith('.'));
    const clips = files.map((file) => {
      const stats = fs.statSync(path.join(OUTPUT_DIR, file));
      return {
        id: path.parse(file).name,
        url: `/outputs/${file}`,
        mode: file.endsWith('.mp3') ? 'audio' : 'video',
        createdAt: stats.birthtime,
      };
    });
    clips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(clips);
  } catch (err) {
    next(err);
  }
});

// Delete a generated clip
router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const files = fs.readdirSync(OUTPUT_DIR).filter((f) => path.parse(f).name === id);
    files.forEach((f) => fs.unlinkSync(path.join(OUTPUT_DIR, f)));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
