import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


const Profile: React.FC = () => {
  const { user, updateUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    bio: user?.profile?.bio || '',
    location: user?.profile?.location || '',
    website: user?.profile?.website || ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (profileData.bio.length > 500) {
      newErrors.bio = 'Bio cannot exceed 500 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await updateUser({
        ...user!,
        profile: {
          ...user!.profile,
          ...profileData
        }
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setProfileData({
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      bio: user?.profile?.bio || '',
      location: user?.profile?.location || '',
      website: user?.profile?.website || ''
    });
    setIsEditing(false);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Your Profile
            </h2>
            <p className="mt-1 text-slate-400">
              Manage your personal information and preferences.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Profile Information</h3>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-orange-500/20 transition-all text-sm"
              >
                Edit Profile
              </button>
            )}
          </div>
          
          <div className="p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-400 mb-2">
                      First name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={profileData.firstName}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-400 mb-2">
                      Last name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={profileData.lastName}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="bio" className="block text-sm font-medium text-slate-400 mb-2">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      value={profileData.bio}
                      onChange={handleChange}
                      placeholder="Tell the community about yourself..."
                      className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none"
                    />
                    {errors.bio && (
                      <p className="mt-2 text-sm text-rose-500">{errors.bio}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-slate-400 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      id="location"
                      value={profileData.location}
                      onChange={handleChange}
                      placeholder="City, Country"
                      className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-slate-400 mb-2">
                      Website
                    </label>
                    <input
                      type="text"
                      name="website"
                      id="website"
                      value={profileData.website}
                      onChange={handleChange}
                      placeholder="https://yourwebsite.com"
                      className="w-full bg-white/5 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-emerald-500/20 transition-all text-sm disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 rounded-full animate-spin border-t-white" />
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                <div>
                  <dt className="text-sm font-medium text-slate-500 mb-1">Username</dt>
                  <dd className="text-lg font-medium text-white">{user?.username}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 mb-1">Email</dt>
                  <dd className="text-lg font-medium text-white">{user?.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 mb-1">First name</dt>
                  <dd className="text-lg font-medium text-white">{user?.profile?.firstName || <span className="text-slate-600 italic">Not provided</span>}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 mb-1">Last name</dt>
                  <dd className="text-lg font-medium text-white">{user?.profile?.lastName || <span className="text-slate-600 italic">Not provided</span>}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-slate-500 mb-1">Bio</dt>
                  <dd className="text-lg text-slate-200 leading-relaxed">{user?.profile?.bio || <span className="text-slate-600 italic">No bio provided yet. Tell your readers something about yourself!</span>}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 mb-1">Location</dt>
                  <dd className="text-lg text-slate-200">{user?.profile?.location || <span className="text-slate-600 italic">Not provided</span>}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 mb-1">Website</dt>
                  <dd className="text-lg">
                    {user?.profile?.website ? (
                      <a href={user.profile.website} className="text-amber-400 hover:text-amber-300 transition-colors underline decoration-amber-400/30 underline-offset-4" target="_blank" rel="noopener noreferrer">
                        {user.profile.website}
                      </a>
                    ) : (
                      <span className="text-slate-600 italic">Not provided</span>
                    )}
                  </dd>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center">
            <div className="text-2xl font-bold text-white">{user?.stats?.totalStories || 0}</div>
            <div className="text-sm text-slate-500 mt-1">Stories Created</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center">
            <div className="text-2xl font-bold text-white">{user?.stats?.totalChapters || 0}</div>
            <div className="text-sm text-slate-500 mt-1">Chapters Written</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center">
            <div className="text-2xl font-bold text-white">{user?.stats?.followersCount || 0}</div>
            <div className="text-sm text-slate-500 mt-1">Followers</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
