import { useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../firebase';

// Shared cross-device sync layer for any localStorage-backed progress hook
// (SQL, IELTS Reading/Listening/Writing/Speaking — mirrors what
// useCourseProgress.js does for the spaced-repetition MCQ courses). Kind-
// specific hooks own their own local state, localStorage key, and merge
// rules; this only adds the Firestore read/write plumbing on top.
//
// Subscribes live via onSnapshot (not a one-time getDoc) so progress made
// on another device shows up here automatically without a manual reload.
// Skips the local-echo snapshot of our own pending writes so it doesn't do
// useless work reacting to its own save.
export function useFirestoreSync({ user, courseId, storageKey, setState, mergeFn }) {
  const debounceRef = useRef(null);
  const mergeFnRef = useRef(mergeFn);
  mergeFnRef.current = mergeFn;

  useEffect(() => {
    if (!user) return;

    const ref = doc(firestore, 'users', user.uid, 'progress', courseId);
    let sawFirstSnapshot = false;

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          setState((prev) => {
            const merged = mergeFnRef.current(prev, snap.data());
            localStorage.setItem(storageKey, JSON.stringify(merged));
            return merged;
          });
        } else if (!sawFirstSnapshot) {
          setState((prev) => {
            setDoc(ref, { ...prev, updatedAt: serverTimestamp() }).catch((err) =>
              console.error('Firestore initial upload failed:', err)
            );
            return prev;
          });
        }
        sawFirstSnapshot = true;
      },
      (err) => console.error('Firestore sync failed:', err)
    );

    return unsubscribe;
  }, [user, courseId, storageKey, setState]);

  const writeThrough = (next) => {
    if (!user) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const ref = doc(firestore, 'users', user.uid, 'progress', courseId);
      setDoc(ref, { ...next, updatedAt: serverTimestamp() }).catch((err) =>
        console.error('Firestore write failed:', err)
      );
    }, 2000);
  };

  return { writeThrough };
}
