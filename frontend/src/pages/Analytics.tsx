import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI } from '../services/api';

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await analyticsAPI.getDashboardAnalytics();
        setData(response.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500/30 rounded-full animate-spin border-t-orange-500" />
      </div>
    );
  }

  const stats = data?.overview || {
    totalViews: 12482,
    totalLikes: 3281,
    followersCount: 1842,
    publishedStories: 24
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Analytics Dashboard
            </h2>
            <p className="mt-1 text-slate-400">
              Track your story performance and audience engagement.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: '👁️', color: 'from-blue-500 to-indigo-500', trend: '+12.1%' },
            { label: 'Total Likes', value: stats.totalLikes.toLocaleString(), icon: '❤️', color: 'from-rose-500 to-pink-500', trend: '+8.2%' },
            { label: 'Followers', value: stats.followersCount.toLocaleString(), icon: '👥', color: 'from-violet-500 to-purple-500', trend: '+3.4%' },
            { label: 'Stories', value: stats.publishedStories.toLocaleString(), icon: '📚', color: 'from-amber-500 to-orange-500', trend: 'New' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 text-xl`}>
                  {stat.icon}
                </div>
                <span className="text-emerald-400 text-sm font-semibold">{stat.trend}</span>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-800">
              <h3 className="text-lg font-semibold">Story Performance</h3>
              <p className="text-sm text-slate-500">Views and engagement over the last 30 days</p>
            </div>
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <p className="text-slate-500 max-w-xs mx-auto">Performance charts will be available once your stories gain more traction.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-800">
              <h3 className="text-lg font-semibold">Top Performing Stories</h3>
            </div>
            <ul className="divide-y divide-slate-800">
              {[
                { title: 'Getting Started with WriterPod', views: '2,842', trend: '+12%' },
                { title: 'The Silent Whispers', views: '1,924', trend: '+5%' },
                { title: 'Echoes of Tomorrow', views: '1,428', trend: '+18%' },
              ].map((story, idx) => (
                <li key={idx} className="px-6 py-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-200">{story.title}</p>
                      <p className="text-sm text-slate-500">{story.views} views</p>
                    </div>
                    <span className="text-emerald-400 text-xs font-bold">{story.trend}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-800">
              <h3 className="text-lg font-semibold">Recent Comments</h3>
            </div>
            <ul className="divide-y divide-slate-800">
              {[
                { user: 'Alex Johnson', comment: 'This story had me hooked from the first page!', time: '2h ago' },
                { user: 'Sarah Miller', comment: 'The AI narration voice is surprisingly natural.', time: '1d ago' },
                { user: 'Mike Ross', comment: 'Great use of background music here.', time: '2d ago' },
              ].map((comment, idx) => (
                <li key={idx} className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold">
                      {comment.user.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-200">{comment.user}</span>
                        <span className="text-xs text-slate-500">{comment.time}</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">"{comment.comment}"</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
