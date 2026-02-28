import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storiesAPI, chaptersAPI, ttsAPI } from '../services/api';
import toast from 'react-hot-toast';

export function StoryEditor() {
  const { storyId, episodeId } = useParams();
  const navigate = useNavigate();


  const [story, setStory] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<any>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [publishFormat, setPublishFormat] = useState<string>('both');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState('');

  useEffect(() => {
    if (!storyId || storyId === 'undefined' || storyId === 'null') {
      toast.error('No story selected. Redirecting to studio...');
      navigate('/writerpod-studio');
    }
  }, [storyId, navigate]);

  const fetchStory = useCallback(async () => {
    if (!storyId || storyId === 'undefined' || storyId === 'null') return;
    try {
      setLoading(true);
      const [storyRes, chaptersRes] = await Promise.all([
        storiesAPI.getStory(storyId),
        chaptersAPI.getChaptersByStory(storyId)
      ]);
      setStory(storyRes.data.story);
      const fetchedEpisodes = (chaptersRes.data as any).chapters || (chaptersRes.data as any).data || [];
      setEpisodes(fetchedEpisodes);

      if (episodeId) {
        const ep = fetchedEpisodes.find((e: any) => e._id === episodeId);
        if (ep) {
          setCurrentEpisode(ep);
          setTitle(ep.title);
          setContent(ep.content);
          setPublishFormat((ep as any).publishFormat || 'both');
        }
      } else if (fetchedEpisodes.length > 0) {
        // If no episodeId is provided but episodes exist, select the first one
        const ep = fetchedEpisodes[0];
        setCurrentEpisode(ep);
        setTitle(ep.title);
        setContent(ep.content);
        setPublishFormat((ep as any).publishFormat || 'both');
        // Update URL to include the episode ID without full refresh
        window.history.replaceState(null, '', `/studio/story/${storyId}/episode/${ep._id}`);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to load story data');
    } finally {
      setLoading(false);
    }
  }, [storyId, episodeId]);

  useEffect(() => {
    fetchStory();
  }, [fetchStory]);

  const handleSave = async (status: 'draft' | 'published' = 'draft') => {
    if (!storyId || storyId === 'undefined' || storyId === 'null') {
      toast.error('No story selected. Please go back and select a story.');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter an episode title');
      return;
    }

    setSaving(true);
    const savePromise = (async () => {
      if (currentEpisode) {
        const res = await chaptersAPI.updateChapter(currentEpisode._id, { title, content, status } as any);
        setCurrentEpisode(res.data.chapter);
        setEpisodes(prev => prev.map(ep => ep._id === res.data.chapter._id ? res.data.chapter : ep));
        return res.data;
      } else {
        const { data: numData } = await chaptersAPI.getNextChapterNumber(storyId);
        const nextNum = numData.nextNumber;

        const res = await chaptersAPI.createChapter({
          title,
          content,
          story: storyId,
          chapterNumber: nextNum,
          status
        } as any);

        setCurrentEpisode(res.data.chapter);
        setEpisodes(prev => [...prev, res.data.chapter]);
        // Update URL without full refresh to include the new episode ID
        window.history.replaceState(null, '', `/studio/story/${storyId}/episode/${res.data.chapter._id}`);
        return res.data;
      }
    })();

    toast.promise(savePromise, {
      loading: status === 'published' ? 'Publishing...' : 'Saving draft...',
      success: (data) => status === 'published' ? 'Episode published successfully!' : 'Draft saved!',
      error: (err) => `Failed to ${status === 'published' ? 'publish' : 'save'}: ${err.response?.data?.message || err.message}`
    });

    try {
      await savePromise;
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const createNewEpisode = () => {
    if (content.trim() && !currentEpisode) {
      if (!window.confirm('You have unsaved changes. Create new episode anyway?')) {
        return;
      }
    }
    setCurrentEpisode(null);
    setTitle('');
    setContent('');
    setPublishFormat('both');
    setGeneratedAudioUrl('');
    // Clear episode ID from URL
    window.history.replaceState(null, '', `/studio/story/${storyId}/edit`);
    toast.success('Ready for new episode');
  };

  const selectEpisode = (ep: any) => {
    setCurrentEpisode(ep);
    setTitle(ep.title);
    setContent(ep.content);
    setPublishFormat((ep.publishFormat || 'both') as any);
    setGeneratedAudioUrl('');
  };

  const wordCount = content.trim().split(/\s+/).filter(w => w).length;
  const readTime = Math.ceil(wordCount / 250);
  const listenTime = Math.ceil(wordCount / 180);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500/30 rounded-full animate-spin border-t-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950">
      <div className="flex h-screen">
        <aside className="w-72 bg-black/30 border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <button onClick={() => navigate('/writerpod-studio')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Studio
            </button>
            <h2 className="font-bold text-white truncate">{story?.title}</h2>
            <p className="text-xs text-slate-500 capitalize">{story?.genre} • {story?.status}</p>
          </div>

          <div className="p-4 border-b border-white/5">
            <button
              onClick={createNewEpisode}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg font-medium text-white text-sm hover:shadow-lg hover:shadow-orange-500/20 transition-all"
            >
              + New Episode
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <div className="text-xs text-slate-500 uppercase tracking-wider px-2 mb-2">Episodes</div>
            {episodes.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No episodes yet</div>
            ) : (
              <div className="space-y-1">
                {episodes.map((ep) => (
                  <button
                    key={ep._id}
                    onClick={() => selectEpisode(ep)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${currentEpisode?._id === ep._id
                        ? 'bg-orange-500/20 border border-orange-500/30'
                        : 'hover:bg-white/5 border border-transparent'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">Episode {ep.chapterNumber}</span>
                      <span className={`w-2 h-2 rounded-full ${ep.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    </div>
                    <div className="font-medium text-white text-sm truncate">{ep.title || 'Untitled'}</div>
                    <div className="text-xs text-slate-500 mt-1">{ep.metadata?.wordCount || 0} words</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-black/20 border-b border-white/5 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Episode title..."
                  className="text-xl font-bold bg-transparent border-none text-white placeholder-slate-600 focus:outline-none focus:ring-0 w-96"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                  {(['text', 'audio', 'both'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setPublishFormat(fmt)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${publishFormat === fmt
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                          : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      {fmt === 'text' ? '📖 Text' : fmt === 'audio' ? '🎧 Audio' : '📖🎧 Both'}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowVoicePanel(!showVoicePanel)}
                  className={`p-2.5 rounded-lg transition-all ${showVoicePanel ? 'bg-orange-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>

                <button
                  onClick={() => setShowAIAssistant(!showAIAssistant)}
                  className={`p-2.5 rounded-lg transition-all ${showAIAssistant ? 'bg-violet-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </button>

                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`p-2.5 rounded-lg transition-all ${showPreview ? 'bg-cyan-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>

                <div className="h-6 w-px bg-white/10" />

                <button
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="px-4 py-2 bg-white/5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>

                <button
                  onClick={() => handleSave('published')}
                  disabled={saving || !title || !content}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg text-sm font-medium text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  Publish
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <div className={`flex-1 overflow-y-auto ${showVoicePanel || showAIAssistant || showPreview ? 'pr-0' : ''}`}>
              <div className="w-full px-8 py-8">
                <div className="flex items-center gap-4 mb-6 text-sm text-slate-500">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{readTime} min read</span>
                  <span>•</span>
                  <span>{listenTime} min listen</span>
                </div>

                <div className="mb-4 flex gap-2 flex-wrap">
                  {[
                    { icon: 'B', cmd: 'bold', label: 'Bold' },
                    { icon: 'I', cmd: 'italic', label: 'Italic' },
                    { icon: 'U', cmd: 'underline', label: 'Underline' },
                    { icon: '—', cmd: 'insertHorizontalRule', label: 'Divider' },
                    { icon: '"', cmd: 'formatBlock', val: 'blockquote', label: 'Quote' },
                    { icon: 'H1', cmd: 'formatBlock', val: 'h1', label: 'Heading 1' },
                    { icon: 'H2', cmd: 'formatBlock', val: 'h2', label: 'Heading 2' },
                  ].map((btn) => (
                    <button
                      key={btn.cmd + (btn.val || '')}
                      onClick={() => document.execCommand(btn.cmd, false, btn.val)}
                      className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded text-slate-400 hover:text-white text-sm font-medium transition-colors"
                      title={btn.label}
                    >
                      {btn.icon}
                    </button>
                  ))}
                </div>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your episode here..."
                  className="min-h-[60vh] w-full bg-white/5 border border-white/10 rounded-xl p-6 text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                  style={{ fontFamily: 'Georgia, serif', fontSize: '18px', lineHeight: '1.8' }}
                />

                <div className="mt-4 text-xs text-slate-600">
                  Tip: Use quotes for dialogue. Add [PAUSE] for audio pauses. Mark character names in CAPS for character voices.
                </div>
              </div>
            </div>

            {showVoicePanel && (
              <VoicePanel
                episodeId={currentEpisode?._id}
                content={content}
                onClose={() => setShowVoicePanel(false)}
                onAudioGenerated={setGeneratedAudioUrl}
              />
            )}

            {showAIAssistant && (
              <AIAssistantPanel
                content={content}
                onInsert={(text) => setContent(content + '\n\n' + text)}
                onClose={() => setShowAIAssistant(false)}
              />
            )}

            {showPreview && (
              <PreviewPanel
                title={title}
                content={content}
                publishFormat={publishFormat}
                audioUrl={generatedAudioUrl}
                onClose={() => setShowPreview(false)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function VoicePanel({ episodeId, content, onClose, onAudioGenerated }: { episodeId?: string; content: string; onClose: () => void; onAudioGenerated: (url: string) => void }) {
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('narrator-warm');
  const [speed, setSpeed] = useState(1.0);
  const [stability, setStability] = useState(0.5);
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  const [backgroundMusic, setBackgroundMusic] = useState<any[]>([]);
  const [selectedMusic, setSelectedMusic] = useState('none');
  const [musicVolume, setMusicVolume] = useState(0.15);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [voicesRes, musicRes] = await Promise.all([
          ttsAPI.getVoices(),
          ttsAPI.getBackgroundMusic()
        ]);
        setVoices(voicesRes.data.voices || []);
        setBackgroundMusic(musicRes.data.backgroundMusic || []);
        if (voicesRes.data.defaultVoice) {
          setSelectedVoice(voicesRes.data.defaultVoice);
        }
      } catch (err) {
        console.error('Error fetching voice data:', err);
      }
    };
    fetchData();
  }, []);

  const generateAudio = async () => {
    if (!content) {
      setError('Please write some content first');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const text = content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      if (!text) {
        setError('No text content to generate audio from');
        setGenerating(false);
        return;
      }
      const res = await ttsAPI.generateAudio(text, { voice: selectedVoice, speed, stability });
      const fullUrl = res.data.audioUrl;
      setAudioUrl(fullUrl);
      onAudioGenerated(fullUrl);
    } catch (err: any) {
      console.error('TTS error:', err);
      setError(err.response?.data?.message || 'Failed to generate audio. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <aside className="w-80 bg-black/30 border-l border-white/5 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span className="text-lg">🎙️</span> Voice Studio
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Narrator Voice</label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            {voices.length > 0 ? voices.map((v) => (
              <option key={v.id} value={v.id} className="bg-slate-900">
                {v.name} ({v.tone}, {v.accent})
              </option>
            )) : (
              <option value="narrator-warm" className="bg-slate-900">Rachel (warm, American)</option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Speed: {speed.toFixed(1)}x</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full accent-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Voice Stability: {Math.round(stability * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={stability}
            onChange={(e) => setStability(parseFloat(e.target.value))}
            className="w-full accent-orange-500"
          />
        </div>

        <div className="border-t border-white/5 pt-4">
          <label className="block text-sm text-slate-400 mb-2">Background Music</label>
          <select
            value={selectedMusic}
            onChange={(e) => setSelectedMusic(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            {backgroundMusic.length > 0 ? backgroundMusic.map((m) => (
              <option key={m.id} value={m.id} className="bg-slate-900">
                {m.name}
              </option>
            )) : (
              <option value="none" className="bg-slate-900">No Music</option>
            )}
          </select>
        </div>

        {selectedMusic !== 'none' && (
          <div>
            <label className="block text-sm text-slate-400 mb-2">Music Volume: {Math.round(musicVolume * 100)}%</label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={musicVolume}
              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={generateAudio}
          disabled={generating || !content}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-orange-500/20 transition-all disabled:opacity-50"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 rounded-full animate-spin border-t-white" />
              Generating...
            </span>
          ) : (
            'Generate Audio'
          )}
        </button>

        {audioUrl && (
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-2">Preview</div>
            <audio controls src={audioUrl} className="w-full" />
            <p className="text-xs text-emerald-400 mt-2">Audio generated successfully!</p>
          </div>
        )}
      </div>
    </aside>
  );
}

function AIAssistantPanel({ content, onInsert, onClose }: { content: string; onInsert: (text: string) => void; onClose: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const generateSuggestion = async () => {
    if (!prompt) return;
    setLoading(true);
    setTimeout(() => {
      const mockSuggestions = [
        "Suddenly, a mysterious voice echoed through the studio, 'Your story is just beginning...'",
        "The writer paused, looking at the glowing screen. The WriterPod Studio was more than just a tool; it was a companion in their creative journey.",
        "With a single click, the text transformed into a rich, emotive voice that filled the room with magic.",
        "They realized that every story had two souls: one made of ink, and one made of sound."
      ];
      const randomSuggestion = mockSuggestions[Math.floor(Math.random() * mockSuggestions.length)];
      setSuggestions([randomSuggestion]);
      setLoading(false);
    }, 1500);
  };

  const quickActions = [
    { label: 'Continue story', prompt: 'Continue this story naturally' },
    { label: 'Add dialogue', prompt: 'Add engaging dialogue between characters' },
    { label: 'Describe scene', prompt: 'Add vivid scene description' },
    { label: 'Build tension', prompt: 'Add suspense and tension' },
    { label: 'Add emotion', prompt: 'Deepen emotional impact' },
    { label: 'Fix pacing', prompt: 'Improve story pacing' },
  ];

  return (
    <aside className="w-80 bg-black/30 border-l border-white/5 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span className="text-lg">✨</span> AI Assistant
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Quick Actions</label>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => setPrompt(action.prompt)}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300 text-left transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Custom Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI to help with your story..."
            className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
          />
        </div>

        <button
          onClick={generateSuggestion}
          disabled={!prompt || loading}
          className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-violet-500/20 transition-all disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Get Suggestions'}
        </button>

        {suggestions.length > 0 && (
          <div className="space-y-3 mt-4">
            <label className="block text-sm text-slate-400">Suggestions</label>
            {suggestions.map((s, i) => (
              <div key={i} className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg text-sm text-slate-200">
                <p className="mb-2 italic">"{s}"</p>
                <button
                  onClick={() => {
                    onInsert(s);
                    setSuggestions([]);
                    setPrompt('');
                  }}
                  className="text-xs text-violet-400 hover:text-violet-300 font-medium"
                >
                  + Insert into story
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-slate-500 text-center">
          AI suggestions are tools to assist your creativity, not replace it.
        </div>
      </div>
    </aside>
  );
}

function PreviewPanel({ title, content, publishFormat, audioUrl, onClose }: { title: string; content: string; publishFormat: string; audioUrl: string; onClose: () => void }) {
  const [mode, setMode] = useState<'read' | 'listen' | 'both'>('read');

  return (
    <aside className="w-96 bg-black/30 border-l border-white/5 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span className="text-lg">👁️</span> Preview
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 border-b border-white/5">
        <div className="flex bg-white/5 rounded-lg p-1">
          {(['read', 'listen', 'both'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all capitalize ${mode === m ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <h4 className="text-lg font-semibold text-white mb-4">{title || 'Untitled Episode'}</h4>

        {mode === 'read' ? (
          <div
            className="prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: content || '<p class="text-slate-500">Start writing to see preview...</p>' }}
          />
        ) : mode === 'listen' ? (
          <div className="space-y-4">
            {audioUrl ? (
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 14.828a1 1 0 01-1.414 0A6.97 6.97 0 0011 10a6.97 6.97 0 002.243-4.828 1 1 0 011.414 1.414A4.978 4.978 0 0113 10c0 1.38.56 2.63 1.464 3.536a1 1 0 010 1.414zM17.485 17.657a1 1 0 01-1.414 0A10.97 10.97 0 0013 10a10.97 10.97 0 003.071-7.657 1 1 0 011.414 1.414A8.971 8.971 0 0115 10c0 2.485 1.01 4.735 2.643 6.364a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">{title || 'Untitled Episode'}</p>
                    <p className="text-xs text-slate-400">Audio Preview</p>
                  </div>
                </div>
                <audio controls src={audioUrl} className="w-full" />
              </div>
            ) : (
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 14.828a1 1 0 01-1.414 0A6.97 6.97 0 0011 10a6.97 6.97 0 002.243-4.828 1 1 0 011.414 1.414A4.978 4.978 0 0113 10c0 1.38.56 2.63 1.464 3.536a1 1 0 010 1.414zM17.485 17.657a1 1 0 01-1.414 0A10.97 10.97 0 0013 10a10.97 10.97 0 003.071-7.657 1 1 0 011.414 1.414A8.971 8.971 0 0115 10c0 2.485 1.01 4.735 2.643 6.364a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-sm">No Audio Generated</p>
                  <p className="text-xs text-slate-500 mt-1">Open Voice Studio and click "Generate Audio"</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {audioUrl ? (
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <audio controls src={audioUrl} className="w-full mb-4" />
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-400">
                Generate audio in Voice Studio to enable synchronized playback
              </div>
            )}
            <div className="border-t border-white/5 pt-4">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">Synchronized Text</div>
              <div
                className="prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content || '<p class="text-slate-500">Start writing...</p>' }}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default StoryEditor;
