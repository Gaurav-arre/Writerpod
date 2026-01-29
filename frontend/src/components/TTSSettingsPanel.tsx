import React, { useState } from 'react';
import VoiceSelector from './VoiceSelector';
import { Chapter } from '../types';

interface TTSSettingsPanelProps {
  chapter: Chapter;
  onSave: (settings: { voice: string; speed: number; pitch: number }) => void;
}

const TTSSettingsPanel: React.FC<TTSSettingsPanelProps> = ({ chapter, onSave }) => {
  const [selectedVoice, setSelectedVoice] = useState(chapter.audioSettings?.voice || 'default');
  const [speed, setSpeed] = useState(chapter.audioSettings?.speed || 1.0);
  const [pitch, setPitch] = useState(chapter.audioSettings?.pitch || 1.0);

  const handleSave = () => {
    onSave({
      voice: selectedVoice,
      speed,
      pitch
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="pb-5 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Text-to-Speech Settings
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Customize how your chapter sounds when converted to audio
        </p>
      </div>

      <div className="mt-6 space-y-8">
        {/* Voice Selection */}
        <VoiceSelector 
          selectedVoice={selectedVoice} 
          onVoiceChange={setSelectedVoice} 
        />

        {/* Speed Control */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium text-gray-900">Speed</h4>
              <p className="mt-1 text-sm text-gray-500">
                Adjust how fast the narrator speaks
              </p>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {speed.toFixed(1)}x
            </div>
          </div>
          <div className="mt-4">
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Slower</span>
              <span>Normal</span>
              <span>Faster</span>
            </div>
          </div>
        </div>

        {/* Pitch Control */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium text-gray-900">Pitch</h4>
              <p className="mt-1 text-sm text-gray-500">
                Adjust the tone of the voice
              </p>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {pitch.toFixed(1)}
            </div>
          </div>
          <div className="mt-4">
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Lower</span>
              <span>Normal</span>
              <span>Higher</span>
            </div>
          </div>
        </div>

        {/* Background Music */}
        <div>
          <h4 className="text-md font-medium text-gray-900">Background Music</h4>
          <p className="mt-1 text-sm text-gray-500">
            Add background music to your chapter audio
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="relative rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-indigo-600 focus-within:border-indigo-600">
              <div className="flex items-center">
                <input
                  type="radio"
                  name="backgroundMusic"
                  id="music-none"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  defaultChecked
                />
                <label htmlFor="music-none" className="ml-2 block text-sm text-gray-900">
                  None
                </label>
              </div>
            </div>
            <div className="relative rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-indigo-600 focus-within:border-indigo-600">
              <div className="flex items-center">
                <input
                  type="radio"
                  name="backgroundMusic"
                  id="music-ambient"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="music-ambient" className="ml-2 block text-sm text-gray-900">
                  Ambient
                </label>
              </div>
            </div>
            <div className="relative rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-indigo-600 focus-within:border-indigo-600">
              <div className="flex items-center">
                <input
                  type="radio"
                  name="backgroundMusic"
                  id="music-dramatic"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="music-dramatic" className="ml-2 block text-sm text-gray-900">
                  Dramatic
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default TTSSettingsPanel;