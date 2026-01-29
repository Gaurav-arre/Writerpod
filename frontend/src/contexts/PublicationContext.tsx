import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Publication, Chat, Message, Note } from '../types';
import { publicationsAPI, chatsAPI, messagesAPI, notesAPI } from '../services/api';
import toast from 'react-hot-toast';

interface PublicationState {
  publications: Publication[];
  currentPublication: Publication | null;
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  notes: Note[];
  isLoading: boolean;
  error: string | null;
}

type PublicationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PUBLICATIONS'; payload: Publication[] }
  | { type: 'SET_CURRENT_PUBLICATION'; payload: Publication | null }
  | { type: 'SET_CHATS'; payload: Chat[] }
  | { type: 'SET_CURRENT_CHAT'; payload: Chat | null }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'SET_NOTES'; payload: Note[] }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

interface PublicationContextType extends PublicationState {
  getPublications: (filters?: any) => Promise<void>;
  getPublication: (id: string) => Promise<void>;
  createPublication: (data: Partial<Publication>) => Promise<Publication | null>;
  updatePublication: (id: string, data: Partial<Publication>) => Promise<Publication | null>;
  deletePublication: (id: string) => Promise<void>;
  subscribeToPublication: (id: string) => Promise<void>;
  unsubscribeFromPublication: (id: string) => Promise<void>;
  getChats: (publicationId: string, filters?: any) => Promise<void>;
  getChat: (id: string) => Promise<void>;
  createChat: (data: Partial<Chat>) => Promise<Chat | null>;
  updateChat: (id: string, data: Partial<Chat>) => Promise<Chat | null>;
  deleteChat: (id: string) => Promise<void>;
  likeChat: (id: string) => Promise<void>;
  getMessages: (chatId: string, filters?: any) => Promise<void>;
  createMessage: (data: Partial<Message>) => Promise<Message | null>;
  updateMessage: (id: string, data: Partial<Message>) => Promise<Message | null>;
  deleteMessage: (id: string) => Promise<void>;
  likeMessage: (id: string) => Promise<void>;
  getNotes: (filters?: any) => Promise<void>;
  getNoteFeed: (filters?: any) => Promise<void>;
  createNote: (data: Partial<Note>) => Promise<Note | null>;
  updateNote: (id: string, data: Partial<Note>) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<void>;
  likeNote: (id: string) => Promise<void>;
  repostNote: (id: string, data: { content?: string }) => Promise<Note | null>;
  clearError: () => void;
}

const PublicationContext = createContext<PublicationContextType | undefined>(undefined);

const publicationReducer = (state: PublicationState, action: PublicationAction): PublicationState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_PUBLICATIONS':
      return {
        ...state,
        publications: action.payload,
        isLoading: false,
        error: null,
      };
    case 'SET_CURRENT_PUBLICATION':
      return {
        ...state,
        currentPublication: action.payload,
        isLoading: false,
        error: null,
      };
    case 'SET_CHATS':
      return {
        ...state,
        chats: action.payload,
        isLoading: false,
        error: null,
      };
    case 'SET_CURRENT_CHAT':
      return {
        ...state,
        currentChat: action.payload,
        isLoading: false,
        error: null,
      };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
        isLoading: false,
        error: null,
      };
    case 'SET_NOTES':
      return {
        ...state,
        notes: action.payload,
        isLoading: false,
        error: null,
      };
    case 'ADD_NOTE':
      return {
        ...state,
        notes: [...state.notes, action.payload],
        isLoading: false,
        error: null,
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const initialState: PublicationState = {
  publications: [],
  currentPublication: null,
  chats: [],
  currentChat: null,
  messages: [],
  notes: [],
  isLoading: false,
  error: null,
};

export const PublicationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(publicationReducer, initialState);

  const getPublications = async (filters?: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await publicationsAPI.getPublications(filters);
      dispatch({ type: 'SET_PUBLICATIONS', payload: response.data.publications });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch publications';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const getPublication = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await publicationsAPI.getPublication(id);
      dispatch({ type: 'SET_CURRENT_PUBLICATION', payload: response.data.publication });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch publication';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const createPublication = async (data: Partial<Publication>): Promise<Publication | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await publicationsAPI.createPublication(data);
      toast.success('Publication created successfully');
      return response.data.publication;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create publication';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return null;
    }
  };

  const updatePublication = async (id: string, data: Partial<Publication>): Promise<Publication | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await publicationsAPI.updatePublication(id, data);
      dispatch({ type: 'SET_CURRENT_PUBLICATION', payload: response.data.publication });
      toast.success('Publication updated successfully');
      return response.data.publication;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update publication';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return null;
    }
  };

  const deletePublication = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      await publicationsAPI.deletePublication(id);
      dispatch({ type: 'SET_CURRENT_PUBLICATION', payload: null });
      toast.success('Publication deleted successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete publication';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const subscribeToPublication = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      await publicationsAPI.subscribe(id);
      toast.success('Successfully subscribed to publication');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to subscribe to publication';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const unsubscribeFromPublication = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      await publicationsAPI.unsubscribe(id);
      toast.success('Successfully unsubscribed from publication');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to unsubscribe from publication';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const getChats = async (publicationId: string, filters?: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await chatsAPI.getChats(publicationId, filters);
      dispatch({ type: 'SET_CHATS', payload: response.data.chats });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch chats';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const getChat = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await chatsAPI.getChat(id);
      dispatch({ type: 'SET_CURRENT_CHAT', payload: response.data.chat });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch chat';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const createChat = async (data: Partial<Chat>): Promise<Chat | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await chatsAPI.createChat(data);
      toast.success('Chat created successfully');
      return response.data.chat;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create chat';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return null;
    }
  };

  const updateChat = async (id: string, data: Partial<Chat>): Promise<Chat | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await chatsAPI.updateChat(id, data);
      toast.success('Chat updated successfully');
      return response.data.chat;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update chat';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return null;
    }
  };

  const deleteChat = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      await chatsAPI.deleteChat(id);
      toast.success('Chat deleted successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete chat';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const likeChat = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      await chatsAPI.likeChat(id);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to like chat';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const getMessages = async (chatId: string, filters?: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await messagesAPI.getMessages(chatId, filters);
      dispatch({ type: 'SET_MESSAGES', payload: response.data.messages });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch messages';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const createMessage = async (data: Partial<Message>): Promise<Message | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await messagesAPI.createMessage(data);
      dispatch({ type: 'ADD_MESSAGE', payload: response.data.message });
      return response.data.message;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send message';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return null;
    }
  };

  const updateMessage = async (id: string, data: Partial<Message>): Promise<Message | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await messagesAPI.updateMessage(id, data);
      return response.data.message;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update message';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return null;
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      await messagesAPI.deleteMessage(id);
      toast.success('Message deleted successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete message';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const likeMessage = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      await messagesAPI.likeMessage(id);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to like message';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const getNotes = async (filters?: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await notesAPI.getNotes(filters);
      dispatch({ type: 'SET_NOTES', payload: response.data.notes });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch notes';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const getNoteFeed = async (filters?: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await notesAPI.getNoteFeed(filters);
      dispatch({ type: 'SET_NOTES', payload: response.data.notes });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch note feed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const createNote = async (data: Partial<Note>): Promise<Note | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await notesAPI.createNote(data);
      dispatch({ type: 'ADD_NOTE', payload: response.data.note });
      toast.success('Note created successfully');
      return response.data.note;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create note';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return null;
    }
  };

  const updateNote = async (id: string, data: Partial<Note>): Promise<Note | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await notesAPI.updateNote(id, data);
      toast.success('Note updated successfully');
      return response.data.note;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update note';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return null;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      await notesAPI.deleteNote(id);
      toast.success('Note deleted successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete note';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const likeNote = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      await notesAPI.likeNote(id);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to like note';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const repostNote = async (id: string, data: { content?: string }): Promise<Note | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await notesAPI.repostNote(id, data);
      dispatch({ type: 'ADD_NOTE', payload: response.data.note });
      toast.success('Note reposted successfully');
      return response.data.note;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to repost note';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return null;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: PublicationContextType = {
    ...state,
    getPublications,
    getPublication,
    createPublication,
    updatePublication,
    deletePublication,
    subscribeToPublication,
    unsubscribeFromPublication,
    getChats,
    getChat,
    createChat,
    updateChat,
    deleteChat,
    likeChat,
    getMessages,
    createMessage,
    updateMessage,
    deleteMessage,
    likeMessage,
    getNotes,
    getNoteFeed,
    createNote,
    updateNote,
    deleteNote,
    likeNote,
    repostNote,
    clearError,
  };

  return <PublicationContext.Provider value={value}>{children}</PublicationContext.Provider>;
};

export const usePublication = (): PublicationContextType => {
  const context = useContext(PublicationContext);
  if (context === undefined) {
    throw new Error('usePublication must be used within a PublicationProvider');
  }
  return context;
};