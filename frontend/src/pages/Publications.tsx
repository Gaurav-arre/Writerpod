import React, { useState, useEffect } from 'react';
import { usePublication } from '../contexts/PublicationContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Publications = () => {
  const { publications, getPublications, isLoading, error } = usePublication();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getPublications();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Publications</h1>
        <p className="text-gray-600">Discover and subscribe to your favorite publications</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search publications..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publications.map((publication) => (
          <div key={publication.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center mb-4">
                {publication.logo ? (
                  <img src={publication.logo} alt={publication.name} className="w-12 h-12 rounded-full mr-3" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold">{publication.name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{publication.name}</h3>
                  <p className="text-sm text-gray-500">by {publication.owner.username}</p>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {publication.description || 'No description available'}
              </p>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{publication.stats.subscribers} subscribers</span>
                <span>{publication.stats.totalPosts} posts</span>
              </div>
              
              <div className="mt-4">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors">
                  View Publication
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {publications.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No publications</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new publication.</p>
        </div>
      )}
    </div>
  );
};

export default Publications;