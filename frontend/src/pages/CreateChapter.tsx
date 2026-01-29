import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storiesAPI, chaptersAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const CreateChapter: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  
  const [chapterData, setChapterData] = useState({
    title: '',
    content: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [story, setStory] = useState<any>(null);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        if (!storyId) return;
        const response = await storiesAPI.getStory(storyId);
        setStory(response.data.story);
      } catch (error) {
        console.error('Error fetching story:', error);
        // Handle error (show notification, etc.)
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchStory();
  }, [storyId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChapterData(prev => ({
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
    if (!chapterData.title.trim()) {
      newErrors.title = 'Chapter title is required';
    } else if (chapterData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (chapterData.title.length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters';
    }
    
    if (!chapterData.content.trim()) {
      newErrors.content = 'Chapter content is required';
    } else if (chapterData.content.length < 50) {
      newErrors.content = 'Content must be at least 50 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getAllChaptersForStory = async (): Promise<any[]> => {
    try {
      const allChapters: any[] = [];
      let page = 1;
      let hasMore = true;
      
      // Fetch all chapters by iterating through all pages
      while (hasMore) {
        const response = await chaptersAPI.getChaptersByStory(storyId!, page);
        const { data, pagination } = response.data;
        
        allChapters.push(...data);
        
        // Check if there are more pages
        if (page >= pagination.pages) {
          hasMore = false;
        } else {
          page++;
        }
      }
      
      return allChapters;
    } catch (error) {
      console.error('Error fetching all chapters:', error);
      throw error;
    }
  };

  const getNextChapterNumber = async (): Promise<number> => {
    try {
      // Fetch ALL existing chapters for this story
      const chapters = await getAllChaptersForStory();
      
      // Find the highest chapter number and add 1
      if (chapters.length === 0) {
        return 1;
      }
      
      const maxChapterNumber = Math.max(...chapters.map((chapter: any) => chapter.chapterNumber));
      return maxChapterNumber + 1;
    } catch (error) {
      console.error('Error calculating next chapter number:', error);
      // Default to 1 if we can't fetch chapters
      return 1;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Get the next chapter number from the backend
      const { data } = await chaptersAPI.getNextChapterNumber(storyId!);
      const nextChapterNumber = data.nextNumber;
      
      const response = await chaptersAPI.createChapter({
        ...chapterData,
        story: storyId!,
        chapterNumber: nextChapterNumber,
        status: 'draft' // Default to draft when creating a new chapter
      });
      const newChapter = response.data.chapter;
      
      // Navigate to the story detail page
      navigate(`/story/${storyId}`);
    } catch (error: any) {
      console.error('Error creating chapter:', error);
      // Show error message to user
      alert(error.response?.data?.message || 'Failed to create chapter. Please try again.');
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
              Create New Chapter
            </h2>
          </div>
        </div>
      </div>
      
      {isFetching ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <div>
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
                    <Link to={`/story/${storyId}`} className="ml-2 text-gray-500 hover:text-gray-700 cursor-pointer">
                      {story?.title || 'Loading...'}
                    </Link>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 text-gray-500" aria-current="page">
                      New Chapter
                    </span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Chapter Details</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Write and publish a new chapter for your story.</p>
            </div>
            <div className="border-t border-gray-200">
              <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Chapter Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={chapterData.title}
                      onChange={handleChange}
                      className={`mt-1 block w-full border ${
                        errors.title ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                      placeholder="Enter chapter title"
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-600">{errors.title}</p>
                    )}
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                      Content
                    </label>
                    <textarea
                      id="content"
                      name="content"
                      rows={20}
                      value={chapterData.content}
                      onChange={handleChange}
                      className={`mt-1 block w-full border ${
                        errors.content ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                      placeholder="Write your chapter content here..."
                    />
                    {errors.content && (
                      <p className="mt-2 text-sm text-red-600">{errors.content}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      You can use basic HTML formatting in your content.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/story/${storyId}`)}
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
                        <span className="ml-2">Publishing...</span>
                      </span>
                    ) : (
                      <span>Publish Chapter</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateChapter;