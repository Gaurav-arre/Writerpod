import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { usePublication } from '../contexts/PublicationContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Chat = () => {
  const { id } = useParams();
  const { 
    currentChat, 
    messages, 
    getChat, 
    getMessages, 
    createMessage,
    isLoading, 
    error 
  } = usePublication();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      getChat(id);
      getMessages(id);
    }
  }, [id, getChat, getMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;

    const messageData = {
      chat: id,
      content: newMessage.trim()
    };

    const result = await createMessage(messageData);
    if (result) {
      setNewMessage('');
    }
  };

  if (isLoading && !currentChat) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {currentChat ? currentChat.title : 'Chat'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Chat header */}
        {currentChat && (
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-900">{currentChat.title}</h2>
              {currentChat.isPinned && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Pinned
                </span>
              )}
            </div>
            {currentChat.content && (
              <p className="mt-1 text-sm text-gray-600">{currentChat.content}</p>
            )}
          </div>
        )}

        {/* Messages container */}
        <div className="h-96 overflow-y-auto p-4 bg-gray-50">
          {messages.map((message) => (
            <div key={message.id} className="mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {message.author.profile.avatar ? (
                    <img 
                      src={message.author.profile.avatar} 
                      alt={message.author.username} 
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-medium">
                        {message.author.username.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <div className="flex items-baseline">
                    <span className="text-sm font-medium text-gray-900">
                      {message.author.username}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-700">
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="border-t border-gray-200 px-4 py-3 bg-white">
          <form onSubmit={handleSubmit} className="flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;