import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { chaptersAPI, ttsAPI } from '../services/api';
import { Chapter } from '../types';
import TTSPlayer from '../components/TTSPlayer';
import TTSSettingsPanel from '../components/TTSSettingsPanel';
import AudioPlayer from '../components/AudioPlayer';
import LoadingSpinner from '../components/LoadingSpinner';

const TTSDashboard: React.FC = () => {
  const { chapterId } = useParams<{ chapterId: string }>();

  
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchChapter = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await chaptersAPI.getChapter(chapterId!);
      setChapter(response.data.chapter);
    } catch (err) {
      console.error('Error fetching chapter:', err);
      setError('Failed to load chapter');
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    fetchChapter();
  }, [fetchChapter]);

  const handleSaveSettings = async (settings: { voice: string; speed: number; pitch: number }) => {
    try {
      setLoading(true);
      // Update chapter with new settings
      await chaptersAPI.updateChapter(chapterId!, {
        audioSettings: {
          ...settings,
          backgroundMusic: chapter?.audioSettings?.backgroundMusic || 'none'
        }
      });
      
      // Update local state
      if (chapter) {
        setChapter({
          ...chapter,
          audioSettings: {
            ...settings,
            backgroundMusic: chapter.audioSettings?.backgroundMusic || 'none'
          }
        });
      }
      
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAudio = async () => {
    try {
      setLoading(true);
      const response = await ttsAPI.generateChapterAudio(chapterId!, {
        voice: chapter?.audioSettings?.voice || 'default',
        speed: chapter?.audioSettings?.speed || 1.0,
        pitch: chapter?.audioSettings?.pitch || 1.0
      });
      
      // Update chapter with new audio file
      if (chapter) {
        setChapter({
          ...chapter,
          audioFile: response.data.chapter.audioFile
        });
      }
      
      setSuccessMessage('Audio generated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error generating audio:', err);
      setError('Failed to generate audio');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !chapter) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
              <div className="mt-2 text-sm text-red-700">
                <button
                  onClick={fetchChapter}
                  className="font-medium text-red-800 hover:text-red-900"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Chapter not found</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>The requested chapter could not be found.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Message */}
      {successMessage && (
        <div className="rounded-md bg-green-50 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Text-to-Speech Dashboard
          </h2>
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Chapter {chapter.chapterNumber}: {chapter.title}
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to={`/story/${chapter.story}/chapter/${chapter.chapterNumber}`}
            className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            View Chapter
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Settings */}
        <div className="lg:col-span-1">
          <TTSSettingsPanel 
            chapter={chapter} 
            onSave={handleSaveSettings} 
          />
        </div>

        {/* Right Column - Player and Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* TTS Player */}
          <TTSPlayer 
            chapterId={chapterId!}
            content={chapter.content}
            initialAudioFile={chapter.audioFile}
            initialAudioSettings={chapter.audioSettings}
          />

          {/* Audio Player */}
          {chapter.audioFile && (
            <AudioPlayer 
              audioUrl={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001'}/uploads/${chapter.audioFile}`}
              title={chapter.title}
            />
          )}

          {/* Action Buttons */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerateAudio}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Generate Audio'
                )}
              </button>
              
              {chapter.audioFile && (
                <button
                  onClick={() => {
                    if (chapter) {
                      setChapter({
                        ...chapter,
                        audioFile: ''
                      });
                    }
                  }}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
                >
                  Clear Audio
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TTSDashboard;