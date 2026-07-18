import { useEffect, useMemo, useRef, useState } from 'react';

const PITCHES = [1, 1.3, 0.8, 1.15];
const RATES = [0.8, 1, 1.2];

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Plays a { speaker, text }[] script turn-by-turn via the browser's built-in
// SpeechSynthesis API. There is no audio-recording or TTS-service capability
// available to author real IELTS-style recordings, so this uses the
// browser's native voice as a practical, license-free substitute — quality
// varies by browser/OS, closest to real on Chrome/Edge desktop.
export default function AudioPlayer({ script, onComplete }) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [status, setStatus] = useState('idle'); // idle | playing | paused | done
  const [turnIndex, setTurnIndex] = useState(0);
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState([]);
  const rateRef = useRef(rate);
  const stoppedRef = useRef(false);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [supported]);

  const speakerVoice = useMemo(() => {
    const speakers = [...new Set(script.map((t) => t.speaker))];
    const map = {};
    speakers.forEach((sp, i) => {
      const idx = voices.length ? hashString(sp) % voices.length : 0;
      map[sp] = { voice: voices[idx] || null, pitch: PITCHES[i % PITCHES.length] };
    });
    return map;
  }, [script, voices]);

  const speakTurn = (index) => {
    if (stoppedRef.current) return;
    if (index >= script.length) {
      setStatus('done');
      onComplete && onComplete();
      return;
    }
    setTurnIndex(index);
    const turn = script[index];
    const utter = new SpeechSynthesisUtterance(turn.text);
    const sv = speakerVoice[turn.speaker];
    if (sv?.voice) utter.voice = sv.voice;
    utter.pitch = sv?.pitch || 1;
    utter.rate = rateRef.current;
    utter.onend = () => {
      if (!stoppedRef.current) speakTurn(index + 1);
    };
    utter.onerror = () => {
      if (!stoppedRef.current) speakTurn(index + 1);
    };
    window.speechSynthesis.speak(utter);
  };

  const play = () => {
    stoppedRef.current = false;
    window.speechSynthesis.cancel();
    setStatus('playing');
    speakTurn(0);
  };

  const pause = () => {
    window.speechSynthesis.pause();
    setStatus('paused');
  };

  const resume = () => {
    window.speechSynthesis.resume();
    setStatus('playing');
  };

  const stop = () => {
    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    setStatus('idle');
    setTurnIndex(0);
  };

  if (!supported) {
    return (
      <div className="audio-player unsupported">
        Your browser doesn't support built-in audio playback for this section — try Chrome or Edge on desktop.
      </div>
    );
  }

  return (
    <div className="audio-player">
      <div className="audio-controls">
        {status === 'idle' && <button className="btn-primary audio-play-btn" onClick={play}>▶ Play Audio</button>}
        {status === 'playing' && <button className="btn-secondary" onClick={pause}>⏸ Pause</button>}
        {status === 'paused' && <button className="btn-secondary" onClick={resume}>▶ Resume</button>}
        {status === 'done' && <button className="btn-secondary" onClick={play}>🔁 Replay</button>}
        {(status === 'playing' || status === 'paused') && (
          <button className="btn-ghost" onClick={stop}>■ Stop</button>
        )}
        <select className="audio-rate-select" value={rate} onChange={(e) => setRate(Number(e.target.value))} disabled={status === 'playing' || status === 'paused'}>
          {RATES.map((r) => <option key={r} value={r}>{r}x speed</option>)}
        </select>
      </div>
      <div className="audio-progress">
        {status === 'idle' && 'Not started'}
        {status === 'playing' && `Playing… turn ${turnIndex + 1} of ${script.length}`}
        {status === 'paused' && `Paused at turn ${turnIndex + 1} of ${script.length}`}
        {status === 'done' && `Finished (${script.length} turns) — replay allowed for practice, the real exam only plays once`}
      </div>
    </div>
  );
}
