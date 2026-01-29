import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, analyticsAPI } from '../services/api';

interface RecentStory {
  _id: string;
  title: string;
  genre: string;
  status: string;
  stats: { totalViews: number; totalLikes: number };
  chapters: any[];
  updatedAt: string;
}

interface Analytics {
  overview: {
    totalStories: number;
    publishedStories: number;
    totalChapters: number;
    publishedChapters: number;
    totalViews: number;
    totalLikes: number;
    recentActivity: { storiesThisMonth: number; chaptersThisMonth: number };
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<RecentStory[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storiesRes, analyticsRes] = await Promise.all([
          usersAPI.getMyStories(),
          analyticsAPI.getDashboardAnalytics().catch(() => ({ data: null }))
        ]);
        setStories((storiesRes.data as any).data || (storiesRes.data as any).stories || []);
        if (analyticsRes?.data) setAnalytics(analyticsRes.data as any);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = analytics?.overview || {
    totalStories: stories.length,
    publishedStories: stories.filter(s => s.status === 'published').length,
    totalChapters: stories.reduce((acc, s) => acc + (s.chapters?.length || 0), 0),
    publishedChapters: 0,
    totalViews: stories.reduce((acc, s) => acc + (s.stats?.totalViews || 0), 0),
    totalLikes: stories.reduce((acc, s) => acc + (s.stats?.totalLikes || 0), 0),
    recentActivity: { storiesThisMonth: 0, chaptersThisMonth: 0 }
  };

  const genreIcons: Record<string, string> = {
    fiction: '📚', romance: '💕', thriller: '🔪', mystery: '🔍',
    horror: '👻', fantasy: '🐉', 'sci-fi': '🚀', drama: '🎭',
    comedy: '😂', biography: '📖', memoir: '✍️', poetry: '🌸',
  };

  const recentStories = [...stories]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 w-full px-4 py-8">
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center">
            <button 
              onClick={() => window.history.back()} 
              className="mr-4 flex items-center text-slate-300 hover:text-white"
            >
              <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome back, <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">{user?.username}</span>
              </h1>
              <p className="text-slate-400 mt-1">Here's what's happening with your stories</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link
              to="/writerpod-studio"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Story
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-500/30 rounded-full animate-spin border-t-orange-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Stories', value: stats.totalStories, icon: '📚', color: 'from-blue-500 to-indigo-500' },
                { label: 'Published', value: stats.publishedStories, icon: '✅', color: 'from-emerald-500 to-teal-500' },
                { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: '👁️', color: 'from-purple-500 to-pink-500' },
                { label: 'Total Likes', value: stats.totalLikes.toLocaleString(), icon: '❤️', color: 'from-rose-500 to-red-500' },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{stat.icon}</span>
                    <span className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} opacity-20`} />
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Recent Stories</h2>
                  <Link to="/writerpod-studio" className="text-sm text-amber-400 hover:text-amber-300">
                    View All →
                  </Link>
                </div>
                
                {recentStories.length > 0 ? (
                  <div className="divide-y divide-slate-700/30">
                    {recentStories.map((story) => (
                      <Link
                        key={story._id}
                        to={`/studio/story/${story._id}/edit`}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-slate-700/20 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-2xl">
                          {genreIcons[story.genre] || '📖'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">{story.title}</div>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span className="capitalize">{story.genre}</span>
                            <span>•</span>
                            <span>{story.chapters?.length || 0} chapters</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            story.status === 'published' 
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {story.status}
                          </span>
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {story.stats?.totalViews || 0}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <div className="text-5xl mb-4">📝</div>
                    <h3 className="text-lg font-semibold text-white mb-2">No stories yet</h3>
                    <p className="text-slate-400 mb-4">Start writing your first story!</p>
                    <Link
                      to="/writerpod-studio"
                      className="inline-flex px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all"
                    >
                      Create Your First Story
                    </Link>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Writerpod Studio', icon: '🎙️', to: '/writerpod-studio', color: 'hover:bg-orange-500/10 hover:border-orange-500/30' },
                      { label: 'Analytics', icon: '📊', to: '/analytics', color: 'hover:bg-blue-500/10 hover:border-blue-500/30' },
                      { label: 'My Profile', icon: '👤', to: '/profile', color: 'hover:bg-purple-500/10 hover:border-purple-500/30' },
                      { label: 'Notes', icon: '📝', to: '/notes', color: 'hover:bg-emerald-500/10 hover:border-emerald-500/30' },
                    ].map((action, idx) => (
                      <Link
                        key={idx}
                        to={action.to}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-700/50 bg-slate-800/30 transition-all ${action.color}`}
                      >
                        <span className="text-xl">{action.icon}</span>
                        <span className="text-white font-medium">{action.label}</span>
                        <svg className="w-4 h-4 text-slate-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-500/20 rounded-xl p-6">
                  <div className="text-3xl mb-3">💡</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Writing Tip</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    "The first draft is just you telling yourself the story." — Terry Pratchett
                  </p>
                  <p className="text-xs text-slate-500 mt-3">
                    Don't worry about perfection — focus on getting your ideas down first!
                  </p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">This Month</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Stories Created</span>
                      <span className="text-white font-semibold">{stats.recentActivity?.storiesThisMonth || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Chapters Written</span>
                      <span className="text-white font-semibold">{stats.recentActivity?.chaptersThisMonth || 0}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                        style={{ width: `${Math.min((stats.recentActivity?.storiesThisMonth || 0) * 20, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">Goal: 5 stories this month</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;