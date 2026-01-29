import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePublication } from '../contexts/PublicationContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Notes = () => {
  const { isLoading: authLoading } = useAuth();
  const { notes, getNoteFeed, createNote, isLoading: publicationLoading, error } = usePublication();
  const [newNote, setNewNote] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const isLoading = authLoading || publicationLoading;

  useEffect(() => {
    getNoteFeed();
  }, [getNoteFeed]);

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || isPosting) return;

    setIsPosting(true);
    
    try {
      const result = await createNote({ content: newNote.trim() });
      if (result) {
        setNewNote('');
        // Refresh the feed
        getNoteFeed();
      }
    } catch (error) {
      console.error('Error posting note:', error);
    } finally {
      setIsPosting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notes</h1>
        <p className="text-gray-600">Share quick thoughts and updates with your community</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Create note form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handlePostNote}>
          <div className="mb-4">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="What's happening?"
              className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              maxLength={280}
              disabled={isPosting}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {280 - newNote.length} characters remaining
              </span>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newNote.trim() || isPosting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPosting ? 'Posting...' : 'Post Note'}
            </button>
          </div>
        </form>
      </div>

      {/* Notes feed */}
      <div className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                {note.author.profile.avatar ? (
                  <img 
                    src={note.author.profile.avatar} 
                    alt={note.author.username} 
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {note.author.username.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="font-semibold text-gray-900">{note.author.profile.fullName}</h3>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-gray-500 text-sm">@{note.author.username}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-gray-500 text-sm">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 text-gray-800">{note.content}</p>
                
                <div className="flex items-center mt-4 space-x-6">
                  <button className="flex items-center text-gray-500 hover:text-blue-600 transition-colors">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{note.stats.comments}</span>
                  </button>
                  
                  <button className="flex items-center text-gray-500 hover:text-green-600 transition-colors">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{note.stats.reposts}</span>
                  </button>
                  
                  <button className="flex items-center text-gray-500 hover:text-red-600 transition-colors">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{note.stats.likes}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {notes.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No notes yet</h3>
          <p className="mt-1 text-sm text-gray-500">Be the first to share a note with your community.</p>
        </div>
      )}
    </div>
  );
};

export default Notes;