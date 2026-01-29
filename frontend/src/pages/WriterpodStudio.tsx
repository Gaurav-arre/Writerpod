import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usersAPI } from '../services/api';

export function WriterpodStudio() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'drafts' | 'published'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getMyStories();
      setStories(response.data.data || []);
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const filteredStories = stories.filter((story: any) => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'drafts' && story.status === 'draft') ||
      (activeTab === 'published' && story.status === 'published');
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: stories.length,
    drafts: stories.filter((s: any) => s.status === 'draft').length,
    published: stories.filter((s: any) => s.status === 'published').length,
    totalViews: stories.reduce((acc: number, s: any) => acc + (s.stats?.totalViews || 0), 0),
    totalLikes: stories.reduce((acc: number, s: any) => acc + (s.stats?.totalLikes || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
      
      <div className="relative">
          <header className="border-b border-white/5 backdrop-blur-xl bg-black/20">
            <div className="w-full px-4 py-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => navigate('/')} 
                    className="mr-2 flex items-center text-slate-300 hover:text-white transition-colors"
                  >
                    <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Home
                  </button>
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-950" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-amber-100 to-orange-200 bg-clip-text text-transparent tracking-tight">
                    Writerpod Studio
                  </h1>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/studio/create')}
                className="group relative px-6 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-xl font-semibold text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Story
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="w-full px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            {[
              { label: 'Total Stories', value: stats.total, icon: '📚', color: 'from-violet-500 to-purple-600' },
              { label: 'Drafts', value: stats.drafts, icon: '✏️', color: 'from-amber-500 to-orange-600' },
              { label: 'Published', value: stats.published, icon: '🚀', color: 'from-emerald-500 to-teal-600' },
              { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: '👁️', color: 'from-blue-500 to-cyan-600' },
              { label: 'Total Likes', value: stats.totalLikes.toLocaleString(), icon: '❤️', color: 'from-rose-500 to-pink-600' }
            ].map((stat, i) => (
              <div key={i} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl" style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors">
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search your stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 pl-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              {(['all', 'drafts', 'published'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg font-medium transition-all capitalize ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-orange-500/30 rounded-full animate-spin border-t-orange-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
                <svg className="w-12 h-12 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No stories yet</h3>
              <p className="text-slate-400 mb-6">Start your creative journey by writing your first story</p>
              <button
                onClick={() => navigate('/studio/create')}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold text-white shadow-lg hover:shadow-orange-500/30 transition-all"
              >
                Create Your First Story
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStories.map((story) => (
                <StoryCard key={story._id} story={story} />
              ))}
            </div>
          )}

          <section className="mt-16">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm">🛠️</span>
              Studio Tools
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Voice Studio', desc: 'Convert stories to audio with AI voices', icon: '🎙️', href: '/studio/voices', color: 'from-rose-500 to-pink-600' },
                { title: 'AI Assistant', desc: 'Get writing help and suggestions', icon: '✨', href: '/studio/ai-assistant', color: 'from-violet-500 to-purple-600' },
                { title: 'Sound Library', desc: 'Add music & effects to stories', icon: '🎵', href: '/studio/sounds', color: 'from-cyan-500 to-blue-600' },
                { title: 'Analytics', desc: 'Track your story performance', icon: '📊', href: '/analytics', color: 'from-emerald-500 to-teal-600' }
              ].map((tool, i) => (
                <Link
                  key={i}
                  to={tool.href}
                  className="group relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  <div className="text-3xl mb-4">{tool.icon}</div>
                  <h3 className="font-semibold text-white mb-1">{tool.title}</h3>
                  <p className="text-sm text-slate-400">{tool.desc}</p>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function StoryCard({ story }: { story: any }) {
  const navigate = useNavigate();
  
  const statusColors = {
    draft: 'from-amber-500 to-orange-500',
    published: 'from-emerald-500 to-teal-500',
    completed: 'from-blue-500 to-cyan-500',
    paused: 'from-slate-500 to-slate-600'
  };

  return (
    <div 
      onClick={() => navigate(`/studio/story/${story._id}/edit`)}
      className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative h-32 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
        {story.coverImage ? (
          <img src={story.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl opacity-20">📖</div>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${statusColors[story.status as keyof typeof statusColors] || statusColors.draft}`}>
            {story.status}
          </span>
        </div>
      </div>
      
      <div className="relative p-5">
        <h3 className="font-semibold text-white mb-1 line-clamp-1 group-hover:text-orange-300 transition-colors">
          {story.title}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-2 mb-4">{story.description}</p>
        
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {story.stats?.totalViews || 0}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {story.stats?.totalLikes || 0}
            </span>
          </div>
          <span className="px-2 py-1 bg-white/5 rounded-md capitalize">{story.genre}</span>
        </div>
      </div>
    </div>
  );
}

export default WriterpodStudio;