import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storiesAPI, aiAPI } from '../services/api';
import toast from 'react-hot-toast';

const genres = [
  { id: 'fiction', name: 'Fiction', icon: '📖', desc: 'General fiction stories' },
  { id: 'romance', name: 'Romance', icon: '💕', desc: 'Love and relationships' },
  { id: 'thriller', name: 'Thriller', icon: '🔪', desc: 'Suspense and excitement' },
  { id: 'mystery', name: 'Mystery', icon: '🔍', desc: 'Puzzles and detective stories' },
  { id: 'horror', name: 'Horror', icon: '👻', desc: 'Scary and supernatural' },
  { id: 'fantasy', name: 'Fantasy', icon: '🧙', desc: 'Magic and otherworldly' },
  { id: 'sci-fi', name: 'Sci-Fi', icon: '🚀', desc: 'Science fiction futures' },
  { id: 'drama', name: 'Drama', icon: '🎭', desc: 'Emotional human stories' },
  { id: 'comedy', name: 'Comedy', icon: '😂', desc: 'Humor and light-hearted' },
  { id: 'memoir', name: 'Memoir', icon: '📝', desc: 'Personal life stories' },
  { id: 'poetry', name: 'Poetry', icon: '🎨', desc: 'Poetic expressions' },
  { id: 'other', name: 'Other', icon: '✨', desc: 'Unique and uncategorized' },
];

const moods = [
  { id: 'dramatic', name: 'Dramatic', emoji: '🎭' },
  { id: 'romantic', name: 'Romantic', emoji: '💕' },
  { id: 'suspenseful', name: 'Suspenseful', emoji: '😰' },
  { id: 'heartwarming', name: 'Heartwarming', emoji: '🥰' },
  { id: 'dark', name: 'Dark', emoji: '🌑' },
  { id: 'humorous', name: 'Humorous', emoji: '😄' },
  { id: 'inspirational', name: 'Inspirational', emoji: '✨' },
  { id: 'melancholic', name: 'Melancholic', emoji: '😢' },
];

export function CreateStoryStudio() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [generatingStory, setGeneratingStory] = useState(false);
  const [searchingImages, setSearchingImages] = useState(false);
  const [imageResults, setImageResults] = useState<any[]>([]);
  const [imageSearch, setImageSearch] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    tags: '',
    coverImage: '',
    storyType: 'serial' as 'serial' | 'oneshot',
    defaultFormat: 'both' as 'text' | 'audio' | 'both'
  });

  const [aiWizardData, setAIWizardData] = useState({
    topic: '',
    mood: 'dramatic',
    length: 'medium' as 'short' | 'medium' | 'long',
    characters: [{ name: '', role: 'protagonist', description: '' }],
    additionalPrompt: ''
  });

  const [generatedContent, setGeneratedContent] = useState('');

  const handleSearchImages = async () => {
    if (!imageSearch.trim()) return;
    setSearchingImages(true);
    try {
      const response = await aiAPI.searchImages(imageSearch);
      setImageResults(response.data.images || []);
    } catch (err) {
      console.error('Error searching images:', err);
      toast.error('Failed to search images');
    } finally {
      setSearchingImages(false);
    }
  };

  const handleGenerateStory = async () => {
    if (!aiWizardData.topic.trim()) {
      toast.error('Please enter a story topic');
      return;
    }
    
    setGeneratingStory(true);
    try {
      const response = await aiAPI.generateStory({
        topic: aiWizardData.topic,
        characters: aiWizardData.characters.filter(c => c.name.trim()),
        mood: aiWizardData.mood,
        genre: formData.genre,
        length: aiWizardData.length,
        additionalPrompt: aiWizardData.additionalPrompt
      });
      
      setGeneratedContent(response.data.story);
      toast.success('Story generated successfully!');
    } catch (err: any) {
      console.error('Error generating story:', err);
      toast.error(err.response?.data?.message || 'Failed to generate story');
    } finally {
      setGeneratingStory(false);
    }
  };

  const addCharacter = () => {
    setAIWizardData({
      ...aiWizardData,
      characters: [...aiWizardData.characters, { name: '', role: 'supporting', description: '' }]
    });
  };

  const updateCharacter = (index: number, field: string, value: string) => {
    const newChars = [...aiWizardData.characters];
    (newChars[index] as any)[field] = value;
    setAIWizardData({ ...aiWizardData, characters: newChars });
  };

  const removeCharacter = (index: number) => {
    setAIWizardData({
      ...aiWizardData,
      characters: aiWizardData.characters.filter((_, i) => i !== index)
    });
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.description || !formData.genre) return;
    setLoading(true);
    try {
      const response = await storiesAPI.createStory({
        title: formData.title,
        description: formData.description,
        genre: formData.genre as any,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        coverImage: formData.coverImage,
        status: 'draft',
        visibility: 'public'
      } as any);
      const storyId = (response.data.story as any)._id || response.data.story.id;
      
      if (generatedContent) {
        localStorage.setItem(`story_${storyId}_generated_content`, generatedContent);
      }
      
      navigate(`/studio/story/${storyId}/edit`);
    } catch (err) {
      console.error('Error creating story:', err);
      toast.error('Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
      
      <div className="relative w-full px-6 py-12">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/writerpod-studio')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Studio
          </button>
        </div>

        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create New Story</h1>
          <p className="text-slate-400">Start your next creative masterpiece</p>
          
          <button
            onClick={() => setShowAIWizard(!showAIWizard)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 rounded-full text-violet-300 hover:bg-violet-500/30 transition-all"
          >
            <span className="text-lg">✨</span>
            {showAIWizard ? 'Hide AI Story Wizard' : 'Use AI Story Wizard'}
          </button>
        </div>

        {showAIWizard && (
          <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">✨</span> AI Story Wizard
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Story Topic / Premise *</label>
                <textarea
                  value={aiWizardData.topic}
                  onChange={(e) => setAIWizardData({ ...aiWizardData, topic: e.target.value })}
                  placeholder="e.g., A young musician discovers she can hear the thoughts of anyone who listens to her play..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Mood / Tone</label>
                <div className="grid grid-cols-4 gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => setAIWizardData({ ...aiWizardData, mood: mood.id })}
                      className={`p-2 rounded-lg text-center transition-all text-xs ${
                        aiWizardData.mood === mood.id
                          ? 'bg-violet-500/30 border border-violet-500/50'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-lg">{mood.emoji}</div>
                      <div className="text-white mt-1">{mood.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-slate-400">Characters</label>
                <button
                  onClick={addCharacter}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  + Add Character
                </button>
              </div>
              
              <div className="space-y-3">
                {aiWizardData.characters.map((char, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <input
                      type="text"
                      value={char.name}
                      onChange={(e) => updateCharacter(index, 'name', e.target.value)}
                      placeholder="Name"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                    <select
                      value={char.role}
                      onChange={(e) => updateCharacter(index, 'role', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    >
                      <option value="protagonist">Protagonist</option>
                      <option value="antagonist">Antagonist</option>
                      <option value="supporting">Supporting</option>
                      <option value="love-interest">Love Interest</option>
                      <option value="mentor">Mentor</option>
                    </select>
                    <input
                      type="text"
                      value={char.description}
                      onChange={(e) => updateCharacter(index, 'description', e.target.value)}
                      placeholder="Brief description..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                    {aiWizardData.characters.length > 1 && (
                      <button
                        onClick={() => removeCharacter(index)}
                        className="text-rose-400 hover:text-rose-300 p-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Story Length</label>
                <div className="flex gap-2">
                  {(['short', 'medium', 'long'] as const).map((len) => (
                    <button
                      key={len}
                      onClick={() => setAIWizardData({ ...aiWizardData, length: len })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        aiWizardData.length === len
                          ? 'bg-violet-500 text-white'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {len === 'short' ? '500-800' : len === 'medium' ? '1000-1500' : '2000+'} words
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Additional Instructions (optional)</label>
                <input
                  type="text"
                  value={aiWizardData.additionalPrompt}
                  onChange={(e) => setAIWizardData({ ...aiWizardData, additionalPrompt: e.target.value })}
                  placeholder="e.g., Include a plot twist at the end..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-slate-500">AI will generate a complete story based on your inputs</p>
              <button
                onClick={handleGenerateStory}
                disabled={generatingStory || !aiWizardData.topic.trim() || !formData.genre}
                className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-violet-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {generatingStory ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 rounded-full animate-spin border-t-white" />
                    Generating...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Generate Story
                  </>
                )}
              </button>
            </div>

            {generatedContent && (
              <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white">Generated Story Preview</h4>
                  <span className="text-xs text-slate-500">{generatedContent.split(/\s+/).length} words</span>
                </div>
                <div className="max-h-60 overflow-y-auto text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {generatedContent.substring(0, 1000)}...
                </div>
                <p className="text-xs text-emerald-400 mt-3">This content will be added to your first episode after creating the story.</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-center mb-10">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                    : 'bg-white/5 text-slate-500'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div className={`w-16 h-1 mx-2 rounded ${step > s ? 'bg-orange-500' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-6">Choose Your Genre</h2>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => setFormData({ ...formData, genre: genre.id })}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      formData.genre === genre.id
                        ? 'bg-orange-500/20 border-orange-500/50 ring-2 ring-orange-500/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-2xl mb-2">{genre.icon}</div>
                    <div className="font-medium text-white text-sm">{genre.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{genre.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-6">Story Details</h2>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Story Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter a captivating title..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell readers what your story is about..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="adventure, magic, coming-of-age..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-6">Cover Image (Thumbnail)</h2>
              
              <div className="flex gap-4">
                <input
                  type="text"
                  value={imageSearch}
                  onChange={(e) => setImageSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchImages()}
                  placeholder="Search for cover images (e.g., fantasy landscape, romantic sunset...)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
                <button
                  onClick={handleSearchImages}
                  disabled={searchingImages}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold text-white disabled:opacity-50"
                >
                  {searchingImages ? 'Searching...' : 'Search'}
                </button>
              </div>

              {formData.coverImage && (
                <div className="relative inline-block">
                  <img src={formData.coverImage} alt="Selected cover" className="h-32 rounded-xl object-cover" />
                  <button
                    onClick={() => setFormData({ ...formData, coverImage: '' })}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full text-white flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <span className="block text-xs text-emerald-400 mt-2">Selected cover image</span>
                </div>
              )}

              {imageResults.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-2">
                  {imageResults.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setFormData({ ...formData, coverImage: img.url })}
                      className={`relative group rounded-xl overflow-hidden aspect-video ${
                        formData.coverImage === img.url ? 'ring-2 ring-orange-500' : ''
                      }`}
                    >
                      <img src={img.thumb} alt={img.alt} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs">Select</span>
                      </div>
                      {formData.coverImage === img.url && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="text-center text-slate-500 text-sm">
                <p>Or paste an image URL directly:</p>
                <input
                  type="text"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="mt-2 w-full max-w-md bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-6">Publishing Preferences</h2>
              
              <div>
                <label className="block text-sm text-slate-400 mb-3">Story Type</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'serial', name: 'Serial Story', desc: 'Multiple episodes released over time', icon: '📚' },
                    { id: 'oneshot', name: 'One-Shot', desc: 'Complete story in one episode', icon: '📄' }
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setFormData({ ...formData, storyType: type.id as 'serial' | 'oneshot' })}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        formData.storyType === type.id
                          ? 'bg-orange-500/20 border-orange-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="font-medium text-white">{type.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-3">Default Publishing Format</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'text', name: 'Text Only', icon: '📖' },
                    { id: 'audio', name: 'Audio Only', icon: '🎧' },
                    { id: 'both', name: 'Text + Audio', icon: '📖🎧' }
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setFormData({ ...formData, defaultFormat: fmt.id as 'text' | 'audio' | 'both' })}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        formData.defaultFormat === fmt.id
                          ? 'bg-orange-500/20 border-orange-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xl mb-1">{fmt.icon}</div>
                      <div className="text-sm text-white">{fmt.name}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4 mt-6">
                <h4 className="font-medium text-white mb-2">Story Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-500">Title:</span> <span className="text-white">{formData.title || 'Not set'}</span></div>
                  <div><span className="text-slate-500">Genre:</span> <span className="text-white capitalize">{formData.genre || 'Not set'}</span></div>
                  <div><span className="text-slate-500">Type:</span> <span className="text-white capitalize">{formData.storyType}</span></div>
                  <div><span className="text-slate-500">Format:</span> <span className="text-white capitalize">{formData.defaultFormat}</span></div>
                  {generatedContent && (
                    <div className="col-span-2"><span className="text-emerald-400">AI-generated content will be added to first episode</span></div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={(step === 1 && !formData.genre) || (step === 2 && (!formData.title || !formData.description))}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-orange-500/20 transition-all disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={loading || !formData.title || !formData.description}
                className="px-8 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 rounded-full animate-spin border-t-white" />
                    Creating...
                  </span>
                ) : (
                  'Create Story'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateStoryStudio;
