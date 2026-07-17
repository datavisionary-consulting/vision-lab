// Shows a pre-authored, original explanation grounded in the course's source
// book (never a verbatim copy-pasted paragraph) — opt-in via a "Review
// Theory" button, replacing the old always-auto-revealed theory box.
export default function SidePanel({ theory, onClose }) {
  if (!theory) return null;

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <span>📖 Review Theory</span>
        <button onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="side-panel-body">
        <p>{theory.text}</p>
        {theory.image && <img src={theory.image} alt="" />}
      </div>
    </div>
  );
}
