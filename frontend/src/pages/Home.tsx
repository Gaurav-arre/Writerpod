import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { storiesAPI } from '../services/api';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [featuredStories, setFeaturedStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        // Fetch published stories for the explore section (API defaults to published/public)
        const publishedStories = await storiesAPI.getStories({ 
          limit: 6, 
          sort: 'popular' 
        });
        setFeaturedStories(publishedStories.data.stories || []);
      } catch (err) {
        console.error('Error fetching stories:', err);
        setFeaturedStories([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  const genreIcons: Record<string, string> = {
    fiction: '📚', romance: '💕', thriller: '🔪', mystery: '🔍',
    horror: '👻', fantasy: '🐉', 'sci-fi': '🚀', drama: '🎭',
    comedy: '😂', biography: '📖', memoir: '✍️', poetry: '🌸',
  };

  const genres = [
    { name: 'Fiction', slug: 'fiction', color: 'from-blue-500 to-indigo-600' },
    { name: 'Romance', slug: 'romance', color: 'from-pink-500 to-rose-600' },
    { name: 'Thriller', slug: 'thriller', color: 'from-red-500 to-orange-600' },
    { name: 'Mystery', slug: 'mystery', color: 'from-purple-500 to-violet-600' },
    { name: 'Fantasy', slug: 'fantasy', color: 'from-emerald-500 to-teal-600' },
    { name: 'Sci-Fi', slug: 'sci-fi', color: 'from-cyan-500 to-blue-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        
        <div className="w-full px-4 pt-20 pb-32 relative">
          <div className="text-center w-full">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Your Stories, Your Voice
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight">
              <span className="text-white">Write Stories.</span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                Create Audio.
              </span>
              <br />
              <span className="text-white">Inspire Millions.</span>
            </h1>
            
            <p className="mt-8 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Transform your stories into immersive audio experiences. 
              <span className="text-slate-300"> Write, narrate with AI voices, add music, and publish</span> — all in one powerful platform.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/writerpod-studio"
                    className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-bold text-lg shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transform hover:-translate-y-1 transition-all duration-300"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Open Studio
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </Link>
                  <Link
                    to="/dashboard"
                    className="px-8 py-4 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl text-white font-semibold text-lg backdrop-blur-sm transition-all"
                  >
                    View Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-bold text-lg shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transform hover:-translate-y-1 transition-all duration-300"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Start Writing Free
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </Link>
                  <Link
                    to="/login"
                    className="px-8 py-4 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl text-white font-semibold text-lg backdrop-blur-sm transition-all"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
            
            <div className="mt-16 flex items-center justify-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>10+ AI Voices</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Unlimited Stories</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute -bottom-px left-0 right-0 h-24 bg-gradient-to-t from-slate-900 to-transparent" />
      </section>

      <section className="py-24 bg-slate-900">
        <div className="w-full px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need to Create
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Professional tools for writers who want to reach audiences through both text and audio.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '✍️',
                title: 'Rich Text Editor',
                description: 'Beautiful writing experience with formatting, chapters, and auto-save.',
                gradient: 'from-blue-500 to-indigo-500'
              },
              {
                icon: '🎙️',
                title: 'AI Voice Narration',
                description: 'Convert stories to audio with 10+ natural-sounding voices.',
                gradient: 'from-amber-500 to-orange-500'
              },
              {
                icon: '🎵',
                title: 'Background Music',
                description: 'Add mood-setting music that auto-ducks during narration.',
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                icon: '👥',
                title: 'Character Voices',
                description: 'Assign different voices to characters for immersive stories.',
                gradient: 'from-emerald-500 to-teal-500'
              },
              {
                icon: '📊',
                title: 'Analytics Dashboard',
                description: 'Track reads, listens, engagement, and audience growth.',
                gradient: 'from-cyan-500 to-blue-500'
              },
              {
                icon: '🌍',
                title: 'Dual Publishing',
                description: 'Publish as text, audio, or both — reaching every reader.',
                gradient: 'from-rose-500 to-red-500'
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:border-slate-600/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} text-2xl mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="w-full px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Explore Stories</h2>
              <p className="text-slate-400">Discover amazing stories from our community</p>
            </div>
          </div>

          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {genres.map((genre) => (
              <button
                key={genre.slug}
                onClick={() => navigate(`/?genre=${genre.slug}`)}
                className={`flex-shrink-0 px-5 py-2.5 bg-gradient-to-r ${genre.color} rounded-full text-white font-medium text-sm hover:shadow-lg transition-all`}
              >
                {genreIcons[genre.slug]} {genre.name}
              </button>
            ))}
          </div>
          
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-orange-500/30 rounded-full animate-spin border-t-orange-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredStories.map((story) => (
                <Link
                  key={story._id || story.id}
                  to={`/story/${story._id || story.id}`}
                  className="group bg-slate-800/30 border border-slate-700/30 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10"
                >
                  <div className="aspect-[16/9] bg-gradient-to-br from-slate-700 to-slate-800 relative overflow-hidden">
                    {story.coverImage ? (
                      <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-6xl">
                        {genreIcons[story.genre] || '📖'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs font-medium text-white capitalize">
                        {story.genre}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                      {story.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{story.description}</p>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center text-xs font-bold text-white">
                          {story.author.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-400">{story.author.username}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {story.stats?.totalViews || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          {story.stats?.totalLikes || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {!loading && featuredStories.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-white mb-2">No stories yet</h3>
              <p className="text-slate-400 mb-6">Be the first to publish a story!</p>
              <Link
                to={isAuthenticated ? "/writerpod-studio" : "/register"}
                className="inline-flex px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all"
              >
                Start Writing
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="py-24 bg-slate-950">
        <div className="w-full px-4">
          <div className="relative bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-500/20 rounded-3xl p-12 sm:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23F97316%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
            
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Share Your Story?
              </h2>
              <p className="text-lg text-slate-300 max-w-xl mx-auto mb-8">
                Join thousands of writers creating immersive audio stories. Start free, no credit card required.
              </p>
              
              <Link
                to={isAuthenticated ? "/writerpod-studio" : "/register"}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-bold text-lg shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transform hover:-translate-y-1 transition-all duration-300"
              >
                {isAuthenticated ? 'Open Studio' : 'Get Started Free'}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-slate-950 border-t border-slate-800">
        <div className="w-full px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                WriterPod
              </span>
            </div>
            <div className="text-sm text-slate-500">
              © 2025 WriterPod. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;