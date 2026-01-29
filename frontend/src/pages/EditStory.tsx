import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storiesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const EditStory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [storyData, setStoryData] = useState({
    title: "",
    description: "",
    genre: "fiction",
    status: "draft",
    tags: ""
  });
  
  const [chapters, setChapters] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  useEffect(() => {
    const fetchStory = async () => {
      try {
        if (!id) return;
        const response = await storiesAPI.getStory(id);
        const story = response.data.story;
        
        setStoryData({
          title: story.title,
          description: story.description,
          genre: story.genre,
          status: story.status,
          tags: story.tags.join(', ')
        });
        
        // Set chapters data
        setChapters(story.chapters || []);
      } catch (error: any) {
        console.error('Error fetching story:', error);
        // Show error message to user
        alert(error.response?.data?.message || 'Failed to load story. Please try again.');
        // Navigate back to studio if we can't load the story
        navigate('/studio');
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchStory();
  }, [id, navigate]);

  const genres = [
    'fiction', 'romance', 'thriller', 'mystery', 'horror', 'fantasy', 
    'sci-fi', 'drama', 'comedy', 'biography', 'memoir', 'poetry', 
    'self-help', 'educational', 'other'
  ];

  const statuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'completed', label: 'Completed' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStoryData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!storyData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (storyData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (storyData.title.length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters';
    }
    
    if (!storyData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (storyData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (storyData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Prepare data for API call
      const data: any = {
        ...storyData,
        tags: storyData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      };
      
      const response = await storiesAPI.updateStory(id!, data);
      const updatedStory = response.data.story;
      
      // Show success message and navigate back to story detail
      navigate(`/story/${updatedStory.id}`);
    } catch (error: any) {
      console.error('Error updating story:', error);
      // Show error message to user
      alert(error.response?.data?.message || 'Failed to update story. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => window.history.back()} 
            className="mr-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Edit Story
            </h2>
          </div>
        </div>
      </div>
      
      {isFetching ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <>


      <div className="mt-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <div className="flex items-center">
                <Link to="/studio" className="text-gray-500 hover:text-gray-700 cursor-pointer">
                  Studio
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <Link to={`/story/${id}`} className="ml-2 text-gray-500 hover:text-gray-700 cursor-pointer">
                  {isFetching ? 'Loading...' : storyData.title}
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 text-gray-500" aria-current="page">
                  Edit
                </span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Story Details</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Edit the information about your story.</p>
        </div>
        <div className="border-t border-gray-200">
          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={storyData.title}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder="Enter story title"
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div className="col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={storyData.description}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder="Briefly describe your story"
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="genre" className="block text-sm font-medium text-gray-700">
                  Genre
                </label>
                <select
                  id="genre"
                  name="genre"
                  value={storyData.genre}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={storyData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-6">
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  id="tags"
                  value={storyData.tags}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Comma-separated tags"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Add tags to help readers discover your story
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(`/story/${id}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <LoadingSpinner size="small" color="text-white" />
                    <span className="ml-2">Saving...</span>
                  </span>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Chapters</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage the chapters in your story.</p>
              </div>
              <Link
                to={`/story/${id}/create-chapter`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Chapter
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {chapters.length === 0 ? (
                <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No chapters yet. <Link to={`/story/${id}/create-chapter`} className="text-indigo-600 hover:text-indigo-500 cursor-pointer">Add your first chapter</Link>.
                </li>
              ) : (
                chapters.map((chapter) => (
                  <li key={chapter._id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Link to={`/chapter/${chapter._id}/edit`} className="text-lg font-medium text-indigo-600 hover:text-indigo-500 truncate cursor-pointer">
                          Chapter {chapter.chapterNumber}: {chapter.title}
                        </Link>
                        <div className="ml-2 flex flex-shrink-0">
                          <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            chapter.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {chapter.status.charAt(0).toUpperCase() + chapter.status.slice(1)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {chapter.metadata?.wordCount ? `${chapter.metadata.wordCount.toLocaleString()} words` : '0 words'}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <Link to={`/chapter/${chapter._id}/edit`} className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer">
                            Edit
                          </Link>
                          <span className="mx-2 text-gray-300">|</span>
                          <button className="font-medium text-red-600 hover:text-red-500 cursor-pointer">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default EditStory;