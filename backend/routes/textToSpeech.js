const express = require('express');
const { body, validationResult } = require('express-validator');
const Chapter = require('../models/Chapter');
const { protect } = require('../middleware/auth');
const path = require('path');
const fs = require('fs').promises;
const { ElevenLabsClient } = require('elevenlabs');

const router = express.Router();

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

const VOICE_LIBRARY = {
  'narrator-warm': { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'female', tone: 'warm', accent: 'American' },
  'narrator-confident': { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'female', tone: 'confident', accent: 'American' },
  'narrator-soft': { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'female', tone: 'soft', accent: 'American' },
  'storyteller-deep': { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', gender: 'male', tone: 'narrative', accent: 'American' },
  'dramatic-male': { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', tone: 'dramatic', accent: 'American' },
  'calm-female': { id: 'jsCqWAovK2LkecY7zXl4', name: 'Freya', gender: 'female', tone: 'calm', accent: 'American' },
  'suspense-male': { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', gender: 'male', tone: 'suspenseful', accent: 'British' },
  'young-narrator': { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', gender: 'female', tone: 'youthful', accent: 'American' },
  'wise-elder': { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', gender: 'male', tone: 'wise', accent: 'American' }
};

const BACKGROUND_MUSIC_LIBRARY = [
  { id: 'none', name: 'No Music', mood: 'none', description: 'Pure voice narration' },
  { id: 'ambient-calm', name: 'Peaceful Ambient', mood: 'calm', description: 'Soft, peaceful ambient sounds for reflective moments' },
  { id: 'suspense-tension', name: 'Dark Suspense', mood: 'suspense', description: 'Mysterious tension-building for thrillers' },
  { id: 'dramatic-cinematic', name: 'Epic Dramatic', mood: 'dramatic', description: 'Emotional cinematic swells for climactic scenes' },
  { id: 'romantic-gentle', name: 'Tender Romance', mood: 'romance', description: 'Gentle melodies for love stories' },
  { id: 'adventure-epic', name: 'Adventure Quest', mood: 'adventure', description: 'Upbeat heroic themes for action' },
  { id: 'fantasy-magical', name: 'Enchanted Realm', mood: 'fantasy', description: 'Magical ethereal sounds for fantasy worlds' },
  { id: 'horror-dread', name: 'Creeping Dread', mood: 'horror', description: 'Unsettling ambience for horror stories' },
  { id: 'mystery-intrigue', name: 'Shadowed Mystery', mood: 'mystery', description: 'Intriguing tones for detective stories' },
  { id: 'scifi-ambient', name: 'Cosmic Drift', mood: 'sci-fi', description: 'Futuristic electronic ambience' },
  { id: 'melancholy-piano', name: 'Tearful Piano', mood: 'sad', description: 'Emotional piano for heartfelt moments' },
  { id: 'uplifting-hope', name: 'Rising Hope', mood: 'inspirational', description: 'Uplifting tones for triumphant moments' }
];

const SOUND_EFFECTS_LIBRARY = [
  { id: 'rain-soft', name: 'Soft Rain', category: 'weather' },
  { id: 'thunder-distant', name: 'Distant Thunder', category: 'weather' },
  { id: 'wind-howling', name: 'Howling Wind', category: 'weather' },
  { id: 'door-creak', name: 'Creaky Door', category: 'ambient' },
  { id: 'footsteps-wood', name: 'Wooden Footsteps', category: 'ambient' },
  { id: 'heartbeat', name: 'Heartbeat', category: 'dramatic' },
  { id: 'clock-ticking', name: 'Clock Ticking', category: 'ambient' },
  { id: 'fire-crackling', name: 'Crackling Fire', category: 'ambient' },
  { id: 'ocean-waves', name: 'Ocean Waves', category: 'nature' },
  { id: 'birds-morning', name: 'Morning Birds', category: 'nature' },
  { id: 'crowd-murmur', name: 'Crowd Murmur', category: 'ambient' },
  { id: 'glass-shatter', name: 'Shattering Glass', category: 'dramatic' }
];

const uploadsDir = process.env.NODE_ENV === 'production'
  ? '/tmp'
  : path.join(__dirname, '../uploads');

const ensureUploadsDir = async () => {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
};

const generateDemoAudio = async () => {
  await ensureUploadsDir();

  const audioFileName = `tts_demo_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
  const audioPath = path.join(uploadsDir, audioFileName);

  const silentMp3 = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x6E, 0x66, 0x6F, 0x00, 0x00, 0x00, 0x0F, 0x00, 0x00, 0x00, 0x01,
    0x00, 0x00, 0x01, 0xA4, 0x00, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
    0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
    0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);

  const frames = [];
  for (let i = 0; i < 100; i++) {
    frames.push(silentMp3);
  }

  await fs.writeFile(audioPath, Buffer.concat(frames));
  return audioFileName;
};

const generateSpeech = async (text, voice = 'narrator-warm', settings = {}) => {
  await ensureUploadsDir();
  const voiceConfig = VOICE_LIBRARY[voice] || VOICE_LIBRARY['narrator-warm'];
  const { speed = 1.0, pitch = 1.0, stability = 0.5, clarity = 0.75 } = settings;

  try {
    const audio = await elevenlabs.generate({
      voice: voiceConfig.id,
      text: text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: stability,
        similarity_boost: clarity,
        style: 0.5,
        use_speaker_boost: true
      }
    });

    const audioFileName = `tts_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
    const audioPath = path.join(uploadsDir, audioFileName);

    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length < 100) {
      throw new Error(`Generated audio buffer is too small (${buffer.length} bytes).`);
    }

    await fs.writeFile(audioPath, buffer);

    return { audioFileName, error: null };
  } catch (error) {
    let errorDetail = error.message;
    console.error('ElevenLabs TTS error details:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      errorDetail = `${error.message} (Status: ${error.response.status})`;
      try {
        const errorData = JSON.stringify(error.response.data);
        console.error('Data:', errorData);
        errorDetail += ` - ${errorData}`;
      } catch (e) { }
    }
    console.log('Falling back to demo audio (silent MP3)...');
    const demoFileName = await generateDemoAudio();
    return { audioFileName: demoFileName, error: errorDetail };
  }
};

router.post('/generate', protect, [
  body('text').isLength({ min: 1, max: 10000 }).withMessage('Text must be 1-10,000 characters'),
  body('voice').optional().isString(),
  body('speed').optional().isFloat({ min: 0.5, max: 2.0 }),
  body('pitch').optional().isFloat({ min: 0.5, max: 2.0 }),
  body('stability').optional().isFloat({ min: 0, max: 1 }),
  body('clarity').optional().isFloat({ min: 0, max: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { text, voice = 'narrator-warm', speed = 1.0, pitch = 1.0, stability = 0.5, clarity = 0.75 } = req.body;

    const { audioFileName, error: ttsError } = await generateSpeech(text, voice, { speed, pitch, stability, clarity });

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'];
    const absoluteAudioUrl = `${protocol}://${host}/api/tts/audio/${audioFileName}`;

    res.json({
      message: ttsError ? 'Generated with fallback due to error' : 'Audio generated successfully',
      audioFile: audioFileName,
      audioUrl: absoluteAudioUrl,
      error: ttsError,
      settings: { voice, speed, pitch, stability, clarity, duration: Math.ceil(text.length / 180) * 60 }
    });

  } catch (error) {
    console.error('Generate TTS error:', error.message);
    res.status(500).json({ message: 'Server error generating audio' });
  }
});

router.post('/chapter/:id', protect, [
  body('voice').optional().isString(),
  body('speed').optional().isFloat({ min: 0.5, max: 2.0 }),
  body('pitch').optional().isFloat({ min: 0.5, max: 2.0 }),
  body('stability').optional().isFloat({ min: 0, max: 1 }),
  body('clarity').optional().isFloat({ min: 0, max: 1 }),
  body('saveVersion').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    if (chapter.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only generate audio for your own chapters.' });
    }

    const { voice, speed, pitch, stability, clarity, saveVersion = true } = req.body;

    const audioSettings = {
      voice: voice || chapter.audioSettings.voice || 'narrator-warm',
      speed: speed || chapter.audioSettings.speed || 1.0,
      pitch: pitch || chapter.audioSettings.pitch || 1.0,
      stability: stability || chapter.audioSettings.stability || 0.5,
      clarity: clarity || chapter.audioSettings.clarity || 0.75
    };

    const { audioFileName, error: ttsError } = await generateSpeech(chapter.content, audioSettings.voice, audioSettings);

    if (saveVersion && chapter.audioFile) {
      const nextVersion = (chapter.audioVersionHistory?.length || 0) + 1;
      chapter.audioVersionHistory = chapter.audioVersionHistory || [];
      chapter.audioVersionHistory.push({
        audioFile: chapter.audioFile,
        version: nextVersion,
        settings: { ...chapter.audioSettings, backgroundMusic: chapter.backgroundMusic?.trackId }
      });
    }

    chapter.audioFile = audioFileName;
    chapter.audioSettings = audioSettings;
    await chapter.save();

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'];
    const absoluteAudioUrl = `${protocol}://${host}/api/tts/audio/${audioFileName}`;

    res.json({
      message: ttsError ? 'Generated with fallback due to error' : 'Chapter audio generated successfully',
      error: ttsError,
      chapter: {
        id: chapter._id,
        title: chapter.title,
        audioFile: audioFileName,
        audioUrl: absoluteAudioUrl,
        audioSettings,
        versionHistory: chapter.audioVersionHistory
      }
    });

  } catch (error) {
    console.error('Generate chapter TTS error:', error.message);
    res.status(500).json({ message: 'Server error generating chapter audio' });
  }
});

router.put('/chapter/:id/settings', protect, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    if (chapter.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { audioSettings, backgroundMusic, characterVoices, soundEffects } = req.body;

    if (audioSettings) {
      chapter.audioSettings = { ...chapter.audioSettings, ...audioSettings };
    }
    if (backgroundMusic) {
      chapter.backgroundMusic = { ...chapter.backgroundMusic, ...backgroundMusic };
    }
    if (characterVoices) {
      chapter.characterVoices = characterVoices;
    }
    if (soundEffects) {
      chapter.soundEffects = soundEffects;
    }

    await chapter.save();

    res.json({
      message: 'Audio settings updated',
      chapter: {
        id: chapter._id,
        audioSettings: chapter.audioSettings,
        backgroundMusic: chapter.backgroundMusic,
        characterVoices: chapter.characterVoices,
        soundEffects: chapter.soundEffects
      }
    });

  } catch (error) {
    console.error('Update audio settings error:', error.message);
    res.status(500).json({ message: 'Server error updating settings' });
  }
});

router.get('/chapter/:id/versions', protect, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'];

    res.json({
      currentAudio: chapter.audioFile ? { audioFile: chapter.audioFile, audioUrl: `${protocol}://${host}/api/tts/audio/${chapter.audioFile}`, settings: chapter.audioSettings } : null,
      versionHistory: chapter.audioVersionHistory || []
    });

  } catch (error) {
    console.error('Get audio versions error:', error.message);
    res.status(500).json({ message: 'Server error fetching versions' });
  }
});

router.post('/chapter/:id/restore/:version', protect, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    if (chapter.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const versionNum = parseInt(req.params.version);
    const versionToRestore = chapter.audioVersionHistory?.find(v => v.version === versionNum);

    if (!versionToRestore) {
      return res.status(404).json({ message: 'Version not found' });
    }

    if (chapter.audioFile) {
      const nextVersion = (chapter.audioVersionHistory?.length || 0) + 1;
      chapter.audioVersionHistory.push({
        audioFile: chapter.audioFile,
        version: nextVersion,
        settings: chapter.audioSettings
      });
    }

    chapter.audioFile = versionToRestore.audioFile;
    chapter.audioSettings = versionToRestore.settings || chapter.audioSettings;
    await chapter.save();

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'];

    res.json({
      message: 'Audio version restored',
      chapter: {
        id: chapter._id,
        audioFile: chapter.audioFile,
        audioUrl: `${protocol}://${host}/api/tts/audio/${chapter.audioFile}`,
        audioSettings: chapter.audioSettings
      }
    });

  } catch (error) {
    console.error('Restore audio version error:', error.message);
    res.status(500).json({ message: 'Server error restoring version' });
  }
});

router.get('/voices', protect, async (req, res) => {
  try {
    const voices = Object.entries(VOICE_LIBRARY).map(([id, config]) => ({
      id,
      name: config.name,
      gender: config.gender,
      tone: config.tone,
      accent: config.accent,
      description: `${config.tone} ${config.accent} ${config.gender} voice`,
      elevenLabsId: config.id
    }));

    const groupedVoices = {
      narrators: voices.filter(v => v.id.includes('narrator')),
      storytellers: voices.filter(v => v.id.includes('storyteller') || v.id.includes('wise')),
      dramatic: voices.filter(v => v.id.includes('dramatic') || v.id.includes('suspense')),
      special: voices.filter(v => v.id.includes('calm') || v.id.includes('young'))
    };

    res.json({ voices, groupedVoices, defaultVoice: 'narrator-warm' });

  } catch (error) {
    console.error('Get voices error:', error.message);
    res.status(500).json({ message: 'Server error fetching voices' });
  }
});

router.get('/background-music', protect, async (req, res) => {
  try {
    const groupedMusic = {
      none: BACKGROUND_MUSIC_LIBRARY.filter(m => m.mood === 'none'),
      atmospheric: BACKGROUND_MUSIC_LIBRARY.filter(m => ['calm', 'ambient', 'sad'].includes(m.mood)),
      tension: BACKGROUND_MUSIC_LIBRARY.filter(m => ['suspense', 'horror', 'mystery'].includes(m.mood)),
      emotional: BACKGROUND_MUSIC_LIBRARY.filter(m => ['dramatic', 'romance', 'inspirational'].includes(m.mood)),
      adventure: BACKGROUND_MUSIC_LIBRARY.filter(m => ['adventure', 'fantasy', 'sci-fi'].includes(m.mood))
    };

    res.json({ backgroundMusic: BACKGROUND_MUSIC_LIBRARY, groupedMusic, defaultMusic: 'none' });

  } catch (error) {
    console.error('Get background music error:', error.message);
    res.status(500).json({ message: 'Server error fetching background music' });
  }
});

router.get('/sound-effects', protect, async (req, res) => {
  try {
    const groupedEffects = {
      weather: SOUND_EFFECTS_LIBRARY.filter(e => e.category === 'weather'),
      ambient: SOUND_EFFECTS_LIBRARY.filter(e => e.category === 'ambient'),
      nature: SOUND_EFFECTS_LIBRARY.filter(e => e.category === 'nature'),
      dramatic: SOUND_EFFECTS_LIBRARY.filter(e => e.category === 'dramatic')
    };

    res.json({ soundEffects: SOUND_EFFECTS_LIBRARY, groupedEffects });

  } catch (error) {
    console.error('Get sound effects error:', error.message);
    res.status(500).json({ message: 'Server error fetching sound effects' });
  }
});

router.delete('/chapter/:id/audio', protect, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    if (chapter.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!chapter.audioFile) {
      return res.status(404).json({ message: 'No audio file found for this chapter' });
    }

    const audioPath = path.join(uploadsDir, chapter.audioFile);
    try {
      await fs.unlink(audioPath);
    } catch (fileError) {
      console.error('Error deleting audio file:', fileError.message);
    }

    chapter.audioFile = '';
    await chapter.save();

    res.json({ message: 'Audio file deleted successfully' });

  } catch (error) {
    console.error('Delete chapter audio error:', error.message);
    res.status(500).json({ message: 'Server error deleting audio' });
  }
});

router.get('/audio/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadsDir, filename);
  res.sendFile(filePath);
});

module.exports = router;