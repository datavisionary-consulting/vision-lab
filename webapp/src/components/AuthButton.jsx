import { useAuth } from '../context/AuthContext';

export default function AuthButton() {
  const { user, authReady, signIn, signOut } = useAuth();

  if (!authReady) return null;

  if (user) {
    return (
      <button className="auth-btn" onClick={signOut} title={`Signed in as ${user.email} — click to sign out`}>
        {user.photoURL && <img src={user.photoURL} alt="" />}
        {user.displayName || user.email}
      </button>
    );
  }

  return (
    <button className="auth-btn" onClick={signIn} title="Sign in with Google to sync progress across devices">
      Sign in
    </button>
  );
}
