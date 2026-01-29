import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { storiesAPI, chaptersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const StoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [story, setStory] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const genreIcons: Record<string, string> = {
    fiction: '📚', romance: '💕', thriller: '🔪', mystery: '🔍',
    horror: '👻', fantasy: '🐉', 'sci-fi': '🚀', drama: '🎭',
    comedy: '😂', biography: '📖', memoir: '✍️', poetry: '🌸',
  };

  useEffect(() => {
    const fetchStoryData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const [storyRes, chaptersRes] = await Promise.all([
          storiesAPI.getStory(id),
          chaptersAPI.getChaptersByStory(id)
        ]);
        
        setStory(storyRes.data.story || storyRes.data);
        setChapters((chaptersRes.data as any).chapters || chaptersRes.data || []);
      } catch (err: any) {
        console.error('Error fetching story:', err);
        setError(err.response?.data?.message || 'Failed to load story');
      } finally {
        setLoading(false);
      }
    };

    fetchStoryData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500/30 rounded-full animate-spin border-t-orange-500" />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-white mb-2">Story Not Found</h2>
          <p className="text-slate-400 mb-6">{error || 'The story you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-semibold"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user && story.author && (story.author._id === user.id || story.author === user.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Explore
        </button>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="relative">
            <div className="aspect-[21/9] bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
              {story.coverImage ? (
                <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-9xl opacity-30">{genreIcons[story.genre] || '📖'}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-xs font-bold text-white capitalize">
                  {story.genre}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  story.status === 'published' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  {story.status?.charAt(0).toUpperCase() + story.status?.slice(1)}
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">{story.title}</h1>
              
              <div className="flex items-center gap-4">
                <Link 
                  to={`/user/${story.author?.username || story.author}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg font-bold text-white">
                    {(story.author?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{story.author?.username || 'Unknown Author'}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(story.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <p className="text-lg text-slate-300 leading-relaxed mb-8">{story.description}</p>
            
            <div className="flex flex-wrap gap-6 py-6 border-t border-b border-slate-800">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-white font-semibold">{(story.stats?.totalViews || 0).toLocaleString()}</span>
                <span className="text-slate-500">views</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-semibold">{(story.stats?.totalLikes || 0).toLocaleString()}</span>
                <span className="text-slate-500">likes</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="text-white font-semibold">{story.stats?.totalChapters || chapters.length}</span>
                <span className="text-slate-500">chapters</span>
              </div>
            </div>

            {isOwner && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => navigate(`/studio/story/${story._id || story.id}/edit`)}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-orange-500/20 transition-all"
                >
                  Edit Story
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Chapters</h2>
            <span className="px-4 py-2 bg-slate-800 rounded-full text-sm font-medium text-slate-300">
              {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'}
            </span>
          </div>

          {chapters.length > 0 ? (
            <div className="space-y-4">
              {chapters.map((chapter, index) => (
                <Link
                  key={chapter._id || chapter.id}
                  to={`/story/${id}/chapter/${chapter.chapterNumber || index + 1}`}
                  className="block bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-orange-500/30 hover:bg-slate-800/50 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold text-slate-400">
                          Chapter {chapter.chapterNumber || index + 1}
                        </span>
                        {chapter.status === 'published' && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 rounded text-xs text-emerald-400">
                            Published
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
                        {chapter.title}
                      </h3>
                      {chapter.content && (
                        <p className="text-slate-400 mt-2 line-clamp-2">
                          {chapter.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                        </p>
                      )}
                    </div>
                    <svg className="w-6 h-6 text-slate-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800">
                    <span className="text-xs text-slate-500">
                      {chapter.publishedAt ? new Date(chapter.publishedAt).toLocaleDateString('en-US', { 
                        month: 'short', day: 'numeric', year: 'numeric' 
                      }) : 'Not published'}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {chapter.stats?.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        {chapter.stats?.likes || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-white mb-2">No chapters yet</h3>
              <p className="text-slate-400">
                {isOwner ? 'Start writing to add chapters to your story!' : 'This story has no published chapters yet.'}
              </p>
              {isOwner && (
                <button
                  onClick={() => navigate(`/studio/story/${story._id || story.id}/edit`)}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-semibold"
                >
                  Write First Chapter
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryDetail;
