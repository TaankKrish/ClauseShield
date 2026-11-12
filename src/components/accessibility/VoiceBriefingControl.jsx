import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '../common/Button.jsx';
import { speechService } from '../../modules/speech/speech-synthesizer.js';

export function VoiceBriefingControl({ clauses = [], language = 'en' }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleSpeech = () => {
    if (isPlaying) {
      speechService.stop();
      setIsPlaying(false);
      return;
    }

    const script = speechService.generateBriefingScript(clauses, language);
    speechService.speak(script, language, {
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  return (
    <Button
      variant="outline"
      onClick={toggleSpeech}
      className="text-xs"
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-3.5 h-3.5 mr-1.5 text-red-400" />
          <span>Stop Briefing</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
          <span>{language === 'hi' ? 'ऑडियो ब्रीफिंग सुनें' : 'Audio Briefing'}</span>
        </>
      )}
    </Button>
  );
}

