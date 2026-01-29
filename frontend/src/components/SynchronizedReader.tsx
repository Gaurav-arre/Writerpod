import React, { useState, useRef, useEffect } from 'react';

interface SynchronizedReaderProps {
  content: string;
  audioUrl?: string;
  isPlaying: boolean;
  onTimeUpdate?: (currentTime: number) => void;
}

const SynchronizedReader: React.FC<SynchronizedReaderProps> = ({
  content,
  audioUrl,
  isPlaying,
  onTimeUpdate
}) => {
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Split content into paragraphs for synchronization
  // In a real app, we might have precise timings per paragraph from the TTS engine
  // For this demo, we'll estimate based on average reading speed or use provided timings
  const paragraphs = content.split(/<\/p>|<br\s*\/?>/).filter(p => p.trim() !== '').map(p => p.replace(/<p>/g, '').trim());

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback failed", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    
    const currentTime = audioRef.current.currentTime;
    const duration = audioRef.current.duration;
    
    if (onTimeUpdate) onTimeUpdate(currentTime);
    
    if (duration > 0) {
      // Estimate which paragraph we are on based on duration
      // This is a simplified version. A robust version would use word-level timestamps.
      const progress = currentTime / duration;
      const index = Math.floor(progress * paragraphs.length);
      if (index !== currentParagraphIndex && index < paragraphs.length) {
        setCurrentParagraphIndex(index);
      }
    }
  };

  return (
    <div className="synchronized-reader space-y-4">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          className="hidden"
        />
      )}
      
      <div className="content-area prose prose-indigo max-w-none">
        {paragraphs.map((para, index) => (
          <p
            key={index}
            className={`transition-all duration-500 rounded px-2 py-1 ${
              index === currentParagraphIndex
                ? 'bg-indigo-100 border-l-4 border-indigo-500 text-gray-900 font-medium'
                : 'text-gray-700'
            }`}
            dangerouslySetInnerHTML={{ __html: para }}
          />
        ))}
      </div>
    </div>
  );
};

export default SynchronizedReader;
