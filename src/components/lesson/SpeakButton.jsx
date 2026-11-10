import React from 'react';
import { Volume2 } from 'lucide-react';

// The one play control used across the site. Stops the click so a card behind it does not flip.
export default function SpeakButton({ onSpeak, label = '播放發音', small = false, className = '' }) {
  return <button type="button" className={`speak-btn${small ? ' is-small' : ''}${className ? ` ${className}` : ''}`} aria-label={label} title={label}
    onClick={event => { event.stopPropagation(); onSpeak(); }}>
    <Volume2 size={small ? 16 : 20} aria-hidden="true"/>
  </button>;
}
