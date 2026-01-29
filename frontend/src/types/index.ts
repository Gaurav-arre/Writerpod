// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  profile: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
    location?: string;
    website?: string;
    fullName: string;
  };
  preferences: {
    preferredVoice: string;
    defaultMusic: string;
    autoPublish: boolean;
  };
  stats: {
    totalStories: number;
    totalChapters: number;
    totalViews: number;
    totalLikes: number;
    followersCount: number;
    followingCount: number;
    totalEarnings: number;
    totalSubscribers: number;
    totalNotes: number;
  };
  followers: User[];
  following: User[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
  subscriptions?: PublicationSubscription[];
  bookmarkedStories?: string[];
  readingList?: ReadingList[];
  chatParticipants?: ChatParticipant[];
}

// Story Types
export interface Story {
  id: string;
  title: string;
  description: string;
  content?: string;
  author: User;
  genre: Genre;
  tags: string[];
  coverImage?: string;
  status: StoryStatus;
  visibility: StoryVisibility;
  language: string;
  settings: {
    allowComments: boolean;
    allowLikes: boolean;
    backgroundMusic: string;
    voiceSettings: {
      voice: string;
      speed: number;
      pitch: number;
    };
    isNewsletter: boolean;
    isPremium: boolean;
    price: number;
  };
  stats: {
    totalChapters: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalEarnings: number;
    averageRating: number;
    totalRatings: number;
  };
  chapters: Chapter[];
  likes: Like[];
  bookmarks: Bookmark[];
  ratings: Rating[];
  publishedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  userInteraction?: {
    isLiked: boolean;
    isBookmarked: boolean;
    userRating: number;
  };
  postType: 'article' | 'note' | 'audio' | 'video' | 'discussion';
  media?: MediaItem[];
  isNote: boolean;
  parentId?: string;
  publication?: string;
  scheduledAt?: string;
  purchases?: Purchase[];
}

// Chapter Types
export interface Chapter {
  id: string;
  _id?: string;
  title: string;
  content: string;
  story: string | Story;
  author: User;
  chapterNumber: number;
  status: ChapterStatus;
  publishFormat?: 'text' | 'audio' | 'both';
  audioFile?: string;
  audioSettings: {
    voice: string;
    speed: number;
    pitch: number;
    stability?: number;
    clarity?: number;
    backgroundMusic: string;
  };
  characterVoices?: Array<{
    characterName: string;
    voiceId: string;
    voiceName?: string;
    color?: string;
  }>;
  backgroundMusic?: {
    trackId: string;
    trackName: string;
    volume: number;
    fadeIn?: boolean;
    fadeOut?: boolean;
    autoDuck?: boolean;
  };
  metadata: {
    wordCount: number;
    estimatedReadTime: number;
    estimatedListenTime: number;
    audioDuration?: number;
  };
  stats: {
    views: number;
    reads?: number;
    listens?: number;
    completionRate?: number;
    likes: number;
    comments: number;
    shares: number;
  };
  likes: Like[];
  comments: Comment[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  userInteraction?: {
    isLiked: boolean;
  };
  postType: 'article' | 'note' | 'audio' | 'video' | 'discussion';
  media?: MediaItem[];
}

// Media Types
export interface MediaItem {
  url: string;
  type: 'image' | 'audio' | 'video';
  caption?: string;
}

// Interaction Types
export interface Like {
  user: string | User;
  createdAt: string;
}

export interface Bookmark {
  user: string | User;
  createdAt: string;
}

export interface Rating {
  user: string | User;
  rating: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  user: User;
  content: string;
  createdAt: string;
}

export interface Purchase {
  user: string | User;
  purchasedAt: string;
  price: number;
}

// Publication Types
export interface Publication {
  id: string;
  name: string;
  description: string;
  owner: User;
  slug: string;
  logo: string;
  headerImage: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  settings: {
    enableComments: boolean;
    enableNewsletter: boolean;
    newsletterFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
    subscriptionPrice: number;
    currency: string;
    enablePayPerPost: boolean;
  };
  stats: {
    subscribers: number;
    totalEarnings: number;
    totalPosts: number;
    totalViews: number;
  };
  subscribers: PublicationSubscriber[];
  subscriptionTiers: SubscriptionTier[];
  payoutSettings: {
    method: 'paypal' | 'bank' | 'stripe';
    email?: string;
    bankDetails?: {
      accountNumber: string;
      routingNumber: string;
      bankName: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface PublicationSubscriber {
  user: User;
  subscriptionType: 'free' | 'paid';
  subscribedAt: string;
  isActive: boolean;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  isActive: boolean;
}

export interface PublicationSubscription {
  publication: string;
  subscriptionId: string;
  subscribedAt: string;
  isActive: boolean;
}

// Chat Types
export interface Chat {
  id: string;
  title: string;
  publication: string;
  author: User;
  content: string;
  media: MediaItem[];
  isPinned: boolean;
  isLocked: boolean;
  visibility: 'subscribers' | 'paid_subscribers';
  stats: {
    messages: number;
    participants: number;
    likes: number;
  };
  participants: ChatParticipant[];
  likes: Like[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipant {
  user: User;
  joinedAt: string;
  lastSeen?: string;
}

export interface Message {
  id: string;
  chat: string;
  author: User;
  content: string;
  media: MediaItem[];
  parentId?: string;
  isReply: boolean;
  mentions: User[];
  hashtags: string[];
  likes: Like[];
  stats: {
    likes: number;
    replies: number;
  };
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: Message[];
}

// Reading List Types
export interface ReadingList {
  id: string;
  name: string;
  stories: string[];
  isPublic: boolean;
  createdAt: string;
}

// Enum Types
export type Genre = 
  | 'fiction' 
  | 'romance' 
  | 'thriller' 
  | 'mystery' 
  | 'horror' 
  | 'fantasy' 
  | 'sci-fi' 
  | 'drama' 
  | 'comedy' 
  | 'biography' 
  | 'memoir' 
  | 'poetry' 
  | 'self-help' 
  | 'educational' 
  | 'other'
  | 'news'
  | 'interview'
  | 'how-to'
  | 'link-roundup'
  | 'discussion'
  | 'audio'
  | 'video'
  | 'note';

export type StoryStatus = 'draft' | 'published' | 'completed' | 'paused';

export type StoryVisibility = 'public' | 'private' | 'followers-only';

export type ChapterStatus = 'draft' | 'published';

// Voice and Audio Types
export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: string;
  description: string;
  preview?: string;
}

export interface BackgroundMusic {
  id: string;
  name: string;
  description: string;
  preview?: string;
}

// Analytics Types
export interface DashboardAnalytics {
  overview: {
    totalStories: number;
    publishedStories: number;
    totalChapters: number;
    publishedChapters: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    recentActivity: {
      storiesThisMonth: number;
      chaptersThisMonth: number;
    };
  };
  topPerformingStories: Pick<Story, 'id' | 'title' | 'stats' | 'createdAt'>[];
}

export interface StoryAnalytics {
  story: Pick<Story, 'id' | 'title' | 'genre' | 'status' | 'publishedAt' | 'stats'>;
  chapters: Pick<Chapter, 'id' | 'title' | 'chapterNumber' | 'stats' | 'publishedAt'>[];
  viewsOverTime: Array<{
    date: string;
    views: number;
  }>;
  genreComparison: {
    avgViews: number;
    avgLikes: number;
    avgRating: number;
  };
  performance: {
    viewsVsGenreAvg: number;
    likesVsGenreAvg: number;
    ratingVsGenreAvg: number;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

// Form Types
export interface LoginForm {
  login: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface StoryForm {
  title: string;
  description: string;
  genre: Genre;
  tags: string[];
  coverImage?: FileList;
  status: StoryStatus;
  visibility: StoryVisibility;
  settings?: {
    allowComments: boolean;
    allowLikes: boolean;
    backgroundMusic: string;
    voiceSettings: {
      voice: string;
      speed: number;
      pitch: number;
    };
  };
}

export interface ChapterForm {
  title: string;
  content: string;
  chapterNumber: number;
  status: ChapterStatus;
  audioSettings?: {
    voice: string;
    speed: number;
    pitch: number;
    backgroundMusic: string;
  };
}

// Search and Filter Types
export interface StoryFilters {
  genre?: string;
  search?: string;
  author?: string;
  sort?: 'newest' | 'oldest' | 'popular' | 'rating' | 'updated';
  page?: number;
  limit?: number;
}

export interface UserFilters {
  search?: string;
  sort?: 'newest' | 'followers' | 'stories' | 'popular';
  page?: number;
  limit?: number;
}

// Note Types
export interface Note {
  id: string;
  content: string;
  author: User;
  media?: MediaItem[];
  stats: {
    likes: number;
    reposts: number;
    comments: number;
    views: number;
  };
  likes: Like[];
  reposts: Repost[];
  mentions: User[];
  hashtags: string[];
  visibility: 'public' | 'followers' | 'private';
  isReply: boolean;
  parentNote?: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Repost {
  user: User;
  originalNote: string;
  createdAt: string;
}