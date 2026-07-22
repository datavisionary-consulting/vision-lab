import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { newCard } from '../lib/sm2';

function loadLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read local progress:', err);
  }
  return { cards: {}, totalAnswered: 0, totalCorrect: 0, streak: 0, lastDate: null };
}

// Keeps whichever card is "more mature" (higher SM-2 interval) per question id
// — used on first login so an existing local device doesn't lose progress to
// an empty or older cloud account.
function mergeCards(localCards, cloudCards) {
  const merged = { ...localCards };
  Object.entries(cloudCards || {}).forEach(([id, cloudCard]) => {
    const localCard = merged[id];
    if (!localCard || (cloudCard.interval || 0) > (localCard.interval || 0)) {
      merged[id] = cloudCard;
    }
  });
  return merged;
}

// Local-storage-backed progress for one course, with optional Firestore
// write-through + first-login merge when signed in. Logged-out behavior is
// unchanged (localStorage only) — auth is purely additive.
export function useCourseProgress(course, questions) {
  const { user } = useAuth();
  const [state, setState] = useState(() => loadLocal(course.storageKey));
  const debounceRef = useRef(null);

  // Ensure every question in the bank has a card, without clobbering existing progress.
  useEffect(() => {
    if (!questions) return;
    setState((prev) => {
      const cards = { ...prev.cards };
      let changed = false;
      questions.forEach((q) => {
        if (!cards[q.id]) {
          cards[q.id] = newCard();
          changed = true;
        }
      });
      return changed ? { ...prev, cards } : prev;
    });
  }, [questions]);

  // Live sync while signed in: subscribe to this course's cloud doc so
  // progress made on another device shows up here automatically, without
  // needing a manual page reload. On each snapshot, keep the more-mature
  // card per question (never let a stale device silently overwrite a more
  // advanced one); if no cloud doc exists yet, seed it from local. Skips
  // the local-echo snapshot of our own pending writes (hasPendingWrites) so
  // it only reacts to genuinely new data — our own or another device's.
  useEffect(() => {
    if (!user) return;

    const ref = doc(firestore, 'users', user.uid, 'progress', course.id);
    let sawFirstSnapshot = false;

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const cloud = snap.data();
          setState((prev) => {
            const merged = {
              ...prev,
              cards: mergeCards(prev.cards, cloud.cards),
              totalAnswered: Math.max(prev.totalAnswered || 0, cloud.totalAnswered || 0),
              totalCorrect: Math.max(prev.totalCorrect || 0, cloud.totalCorrect || 0),
              streak: Math.max(prev.streak || 0, cloud.streak || 0),
            };
            localStorage.setItem(course.storageKey, JSON.stringify(merged));
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
  }, [user, course.id, course.storageKey]);

  const save = useCallback(
    (next) => {
      setState(next);
      localStorage.setItem(course.storageKey, JSON.stringify(next));

      if (user) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          const ref = doc(firestore, 'users', user.uid, 'progress', course.id);
          setDoc(ref, { ...next, updatedAt: serverTimestamp() }).catch((err) =>
            console.error('Firestore write failed:', err)
          );
        }, 2000);
      }
    },
    [course.storageKey, course.id, user]
  );

  const resetProgress = useCallback(() => {
    const cards = {};
    (questions || []).forEach((q) => {
      cards[q.id] = newCard();
    });
    save({ cards, totalAnswered: 0, totalCorrect: 0, streak: 0, lastDate: null });
  }, [questions, save]);

  return { progress: state, saveProgress: save, resetProgress };
}
