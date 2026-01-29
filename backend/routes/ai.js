const express = require('express');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

router.post('/generate-story', protect, async (req, res) => {
  try {
    const { topic, characters, mood, genre, length, additionalPrompt } = req.body;

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const OpenAI = require('openai').default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const characterDescriptions = characters && characters.length > 0
      ? characters.map(c => `${c.name} (${c.role}): ${c.description}`).join('\n')
      : 'Create compelling original characters that fit the story';

    const wordCount = length === 'short' ? '500-800' : length === 'medium' ? '1000-1500' : '2000-3000';

    const systemPrompt = `You are a master storyteller who creates vivid, emotionally engaging stories. Your stories:
- Have rich character development and authentic dialogue
- Build tension and emotional connection
- Use sensory details to immerse readers
- Include realistic conflicts and resolutions
- Feel authentic to real human experiences
- End with satisfying but sometimes unexpected conclusions

Write in a narrative style with proper story structure (beginning, middle, end).`;

    const userPrompt = `Create a ${genre || 'fiction'} story with the following elements:

TOPIC/PREMISE: ${topic}

CHARACTERS:
${characterDescriptions}

MOOD/TONE: ${mood || 'engaging and emotional'}

TARGET LENGTH: ${wordCount} words

${additionalPrompt ? `ADDITIONAL NOTES: ${additionalPrompt}` : ''}

Write the complete story now. Make it emotionally compelling and memorable. Include dialogue where appropriate.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.85
    });

    const generatedStory = completion.choices[0]?.message?.content || '';

    res.json({
      success: true,
      story: generatedStory,
      metadata: {
        topic,
        genre,
        mood,
        wordCount: generatedStory.split(/\s+/).length
      }
    });

  } catch (error) {
    console.error('AI Story Generation Error:', error);
    
    if (error.status === 401) {
      return res.status(500).json({ message: 'OpenAI API key is invalid or not configured' });
    }
    if (error.status === 429) {
      return res.status(429).json({ message: 'AI rate limit exceeded. Please try again later.' });
    }
    
    res.status(500).json({ message: 'Failed to generate story', error: error.message });
  }
});

router.post('/enhance-text', protect, async (req, res) => {
  try {
    const { text, action } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    const OpenAI = require('openai').default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompts = {
      'improve': 'Improve this text while keeping the same meaning and style. Make it more engaging and polished:',
      'expand': 'Expand this text with more details, descriptions, and emotional depth while maintaining the original style:',
      'simplify': 'Simplify this text to be clearer and more accessible while keeping the core message:',
      'dialogue': 'Add or improve dialogue in this text to make it more dynamic and character-driven:',
      'emotional': 'Enhance the emotional impact of this text with more vivid descriptions and deeper character feelings:'
    };

    const systemMessage = prompts[action] || prompts['improve'];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert editor who enhances writing while preserving the author\'s voice.' },
        { role: 'user', content: `${systemMessage}\n\n${text}` }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const enhancedText = completion.choices[0]?.message?.content || text;

    res.json({
      success: true,
      original: text,
      enhanced: enhancedText
    });

  } catch (error) {
    console.error('AI Enhancement Error:', error);
    res.status(500).json({ message: 'Failed to enhance text', error: error.message });
  }
});

router.post('/suggest-title', protect, async (req, res) => {
  try {
    const { content, genre } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const OpenAI = require('openai').default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a creative title generator. Generate exactly 5 compelling, unique story titles.' },
        { role: 'user', content: `Generate 5 compelling titles for this ${genre || 'fiction'} story. Return only the titles, one per line:\n\n${content.substring(0, 2000)}` }
      ],
      max_tokens: 200,
      temperature: 0.9
    });

    const titlesText = completion.choices[0]?.message?.content || '';
    const titles = titlesText.split('\n').filter(t => t.trim()).slice(0, 5);

    res.json({
      success: true,
      titles
    });

  } catch (error) {
    console.error('Title Suggestion Error:', error);
    res.status(500).json({ message: 'Failed to suggest titles', error: error.message });
  }
});

router.get('/search-images', protect, async (req, res) => {
  try {
    const { query, page = 1, per_page = 20 } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    
    if (unsplashKey) {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${per_page}&orientation=landscape`,
        {
          headers: { 'Authorization': `Client-ID ${unsplashKey}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const images = data.results.map(img => ({
          id: img.id,
          url: img.urls.regular,
          thumb: img.urls.small,
          alt: img.alt_description || query,
          photographer: img.user.name,
          source: 'unsplash'
        }));

        return res.json({ success: true, images, total: data.total });
      }
    }

    const placeholderImages = Array.from({ length: 12 }, (_, i) => ({
      id: `placeholder-${i}`,
      url: `https://picsum.photos/seed/${query}-${i}/800/450`,
      thumb: `https://picsum.photos/seed/${query}-${i}/400/225`,
      alt: query,
      photographer: 'Lorem Picsum',
      source: 'picsum'
    }));

    res.json({ success: true, images: placeholderImages, total: 12 });

  } catch (error) {
    console.error('Image Search Error:', error);
    res.status(500).json({ message: 'Failed to search images', error: error.message });
  }
});

router.get('/gravatar/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { size = 200 } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const hash = crypto.createHash('sha256').update(trimmedEmail).digest('hex');
    const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=g`;

    res.json({
      success: true,
      url: gravatarUrl,
      hash
    });

  } catch (error) {
    console.error('Gravatar Error:', error);
    res.status(500).json({ message: 'Failed to get gravatar', error: error.message });
  }
});

module.exports = router;
