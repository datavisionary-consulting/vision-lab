import { useEffect, useRef, useState } from 'react';

// Lets the user record their own spoken answer for self-review — there is
// no speech-to-text or automated grading capability available, so this is
// a self-listening aid, not a scored feature. Recording is entirely
// optional: if the microphone is unavailable or permission is denied
// (e.g. no mic present), the rest of the practice flow still works fully
// without it.
export default function AudioRecorder({ autoStopAfterSec, onRecordingComplete }) {
  const [status, setStatus] = useState('idle'); // idle | recording | recorded | unsupported | denied
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const autoStopTimeoutRef = useRef(null);

  const supported = typeof navigator !== 'undefined' && navigator.mediaDevices && typeof window.MediaRecorder !== 'undefined';

  useEffect(() => {
    return () => {
      clearTimeout(autoStopTimeoutRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    if (!supported) {
      setStatus('unsupported');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        stream.getTracks().forEach((t) => t.stop());
        setStatus('recorded');
        onRecordingComplete && onRecordingComplete();
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setStatus('recording');
      if (autoStopAfterSec) {
        autoStopTimeoutRef.current = setTimeout(() => stopRecording(), autoStopAfterSec * 1000);
      }
    } catch {
      setStatus('denied');
    }
  };

  const stopRecording = () => {
    clearTimeout(autoStopTimeoutRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const discard = () => {
    setAudioURL(null);
    setStatus('idle');
  };

  if (status === 'unsupported') {
    return <p className="assess-warning">Audio recording isn't supported in this browser — you can still practice and self-assess without it.</p>;
  }
  if (status === 'denied') {
    return (
      <div>
        <p className="assess-warning">Microphone access wasn't available — you can still practice and self-assess without recording.</p>
        <button className="btn-secondary" onClick={startRecording}>🎙 Try Again</button>
      </div>
    );
  }

  return (
    <div className="audio-recorder">
      {status === 'idle' && <button className="btn-primary audio-play-btn" onClick={startRecording}>🎙 Start Recording</button>}
      {status === 'recording' && (
        <div className="recording-indicator">
          <span className="recording-dot" /> Recording…
          <button className="btn-secondary" onClick={stopRecording}>⏹ Stop</button>
        </div>
      )}
      {status === 'recorded' && (
        <div className="recording-playback">
          <audio controls src={audioURL} />
          <button className="btn-secondary" onClick={discard}>🔁 Record Again</button>
        </div>
      )}
    </div>
  );
}
