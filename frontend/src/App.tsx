import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PublicationProvider } from './contexts/PublicationContext';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StoryDetail from './pages/StoryDetail';
import ChapterDetail from './pages/ChapterDetail';
import CreateStory from './pages/CreateStory';
import EditStory from './pages/EditStory';
import CreateChapter from './pages/CreateChapter';
import EditChapter from './pages/EditChapter';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Analytics from './pages/Analytics';
import Studio from './pages/Studio';
import Publications from './pages/Publications';
import Chat from './pages/Chat';
import Notes from './pages/Notes';
import TTSDashboard from './pages/TTSDashboard';
import WriterpodStudio from './pages/WriterpodStudio';
import CreateStoryStudio from './pages/CreateStoryStudio';
import StoryEditor from './pages/StoryEditor';

import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/writerpod-studio" element={
          <ProtectedRoute>
            <WriterpodStudio />
          </ProtectedRoute>
        } />
        <Route path="/studio/create" element={
          <ProtectedRoute>
            <CreateStoryStudio />
          </ProtectedRoute>
        } />
        <Route path="/studio/story/:storyId/edit" element={
          <ProtectedRoute>
            <StoryEditor />
          </ProtectedRoute>
        } />
        <Route path="/studio/story/:storyId/episode/:episodeId" element={
          <ProtectedRoute>
            <StoryEditor />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={
          <>
            <Navbar />
            <main className="w-full min-h-[calc(100-64px)]">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
                <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
                <Route path="/story/:id" element={<StoryDetail />} />
                <Route path="/story/:storyId/chapter/:chapterNumber" element={<ChapterDetail />} />
                <Route path="/user/:username" element={<UserProfile />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/create-story" element={<ProtectedRoute><CreateStory /></ProtectedRoute>} />
                <Route path="/story/:id/edit" element={<ProtectedRoute><EditStory /></ProtectedRoute>} />
                <Route path="/story/:storyId/create-chapter" element={<ProtectedRoute><CreateChapter /></ProtectedRoute>} />
                <Route path="/chapter/:id/edit" element={<ProtectedRoute><EditChapter /></ProtectedRoute>} />
                <Route path="/publications" element={<ProtectedRoute><Publications /></ProtectedRoute>} />
                <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
                <Route path="/tts/:chapterId" element={<ProtectedRoute><TTSDashboard /></ProtectedRoute>} />
                <Route path="*" element={
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
                    <p className="text-gray-600">The page you're looking for doesn't exist.</p>
                  </div>
                } />
              </Routes>
            </main>
          </>
        } />
      </Routes>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <PublicationProvider>
          <AppContent />
        </PublicationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;