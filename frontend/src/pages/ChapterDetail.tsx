import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { chaptersAPI, storiesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SynchronizedReader from '../components/SynchronizedReader';

const ChapterDetail: React.FC = () => {
  const { storyId, chapterNumber } = useParams<{ storyId: string; chapterNumber: string }>();
  const navigate = useNavigate();

  const [chapter, setChapter] = useState<any>(null);
  const [story, setStory] = useState<any>(null);
  const [allChapters, setAllChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isReadingAloud, setIsReadingAloud] = useState(false);

  const fetchData = React.useCallback(async () => {
    if (!storyId) return;

    try {
      setLoading(true);

      const [storyRes, chaptersRes] = await Promise.all([
        storiesAPI.getStory(storyId),
        chaptersAPI.getChaptersByStory(storyId)
      ]);

      const storyData = storyRes.data.story || storyRes.data;
      setStory(storyData);

      const chaptersData = (chaptersRes.data as any).chapters || chaptersRes.data || [];
      setAllChapters(chaptersData);

      const chapterNum = parseInt(chapterNumber || '1');
      const currentChapter = chaptersData.find((c: any) => c.chapterNumber === chapterNum) || chaptersData[chapterNum - 1];

      if (currentChapter) {
        setChapter({
          ...currentChapter,
          story: storyData
        });
      } else {
        setError('Chapter not found');
      }
    } catch (err) {
      console.error('Error fetching chapter:', err);
      setError('Failed to load chapter');
    } finally {
      setLoading(false);
    }
  }, [storyId, chapterNumber]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleReadAloud = () => {
    setIsReadingAloud(!isReadingAloud);
  };

  const currentChapterIndex = allChapters.findIndex((c: any) =>
    c.chapterNumber === parseInt(chapterNumber || '1') ||
    allChapters.indexOf(c) === parseInt(chapterNumber || '1') - 1
  );

  const hasPrevious = currentChapterIndex > 0;
  const hasNext = currentChapterIndex < allChapters.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) {
      const prevChapter = allChapters[currentChapterIndex - 1];
      navigate(`/story/${storyId}/chapter/${prevChapter.chapterNumber || currentChapterIndex}`);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      const nextChapter = allChapters[currentChapterIndex + 1];
      navigate(`/story/${storyId}/chapter/${nextChapter.chapterNumber || currentChapterIndex + 2}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📖</div>
          <h2 className="text-2xl font-bold text-white mb-2">Chapter Not Found</h2>
          <p className="text-slate-400 mb-6">{error || 'This chapter does not exist.'}</p>
          <button
            onClick={() => navigate(`/story/${storyId}`)}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-semibold"
          >
            Back to Story
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <li className="flex items-center">
              <svg className="flex-shrink-0 h-4 w-4 text-slate-600 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link to={`/story/${storyId}`} className="text-slate-400 hover:text-white transition-colors">
                {story?.title || 'Story'}
              </Link>
            </li>
            <li className="flex items-center">
              <svg className="flex-shrink-0 h-4 w-4 text-slate-600 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-white font-medium">Chapter {chapter.chapterNumber || chapterNumber}</span>
            </li>
          </ol>
        </nav>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold text-slate-400">
                    Chapter {chapter.chapterNumber || chapterNumber}
                  </span>
                  {chapter.status === 'published' && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 rounded text-xs text-emerald-400 border border-emerald-500/20">
                      Published
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-white">
                  {chapter.title}
                </h1>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <Link to={`/user/${story?.author?.username || story?.author}`} className="text-amber-400 hover:text-amber-300 transition-colors">
                    {story?.author?.username || 'Author'}
                  </Link>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">
                    {chapter.publishedAt ? new Date(chapter.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    }) : 'Draft'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={toggleReadAloud}
                  className={`inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isReadingAloud
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/20'
                      : 'bg-white/5 text-slate-300 border border-slate-700 hover:bg-white/10'
                    }`}
                >
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    {isReadingAloud ? (
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 14.828a1 1 0 01-1.414 0A6.97 6.97 0 0011 10a6.97 6.97 0 002.243-4.828 1 1 0 011.414 1.414A4.978 4.978 0 0113 10c0 1.38.56 2.63 1.464 3.536a1 1 0 010 1.414z" clipRule="evenodd" />
                    )}
                  </svg>
                  {isReadingAloud ? 'Stop Audio' : 'Read Aloud'}
                </button>

                <button className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-slate-300 border border-slate-700 hover:bg-white/10 transition-all">
                  <svg className="h-4 w-4 mr-2 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  {chapter.stats?.likes || 0}
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="prose prose-invert prose-lg max-w-none">
              <SynchronizedReader
                content={chapter.content || '<p>No content available.</p>'}
                audioUrl={chapter.audioFile ? `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/${chapter.audioFile}` : undefined}
                isPlaying={isReadingAloud}
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-800 flex justify-between">
            <button
              onClick={goToPrevious}
              disabled={!hasPrevious}
              className={`inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${hasPrevious
                  ? 'bg-white/5 text-slate-300 border border-slate-700 hover:bg-white/10'
                  : 'bg-white/5 text-slate-600 border border-slate-800 cursor-not-allowed'
                }`}
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Previous
            </button>

            <button
              onClick={goToNext}
              disabled={!hasNext}
              className={`inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${hasNext
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-white/5 text-slate-600 border border-slate-800 cursor-not-allowed'
                }`}
            >
              Next
              <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-8 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-white">Comments</h2>
            <p className="text-sm text-slate-500">Join the discussion about this chapter.</p>
          </div>

          <div className="px-6 py-5">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                U
              </div>
              <div className="flex-1">
                <textarea
                  rows={3}
                  className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                  placeholder="Share your thoughts about this chapter..."
                />
                <div className="mt-3 flex justify-end">
                  <button className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-semibold text-sm">
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 px-6 py-5">
            <div className="text-center py-8">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-slate-500">No comments yet. Be the first to share your thoughts!</p>
            </div>
          </div>
        </div>

        {allChapters.length > 1 && (
          <div className="mt-8 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">All Chapters</h2>
            </div>
            <div className="divide-y divide-slate-800">
              {allChapters.map((ch, idx) => (
                <Link
                  key={ch._id || ch.id}
                  to={`/story/${storyId}/chapter/${ch.chapterNumber || idx + 1}`}
                  className={`block px-6 py-4 hover:bg-white/5 transition-colors ${(ch.chapterNumber || idx + 1) === parseInt(chapterNumber || '1') ? 'bg-orange-500/10 border-l-2 border-orange-500' : ''
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 mr-2">Chapter {ch.chapterNumber || idx + 1}</span>
                      <span className="text-white font-medium">{ch.title}</span>
                    </div>
                    {(ch.chapterNumber || idx + 1) === parseInt(chapterNumber || '1') && (
                      <span className="px-2 py-0.5 bg-orange-500/20 rounded text-xs text-orange-400">Reading</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterDetail;
