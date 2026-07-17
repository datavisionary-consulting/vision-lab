import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  const mergedForUidRef = useRef(null);
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

  // One-time merge on sign-in (per uid+course): pull cloud progress, keep the
  // more-mature card per question, upload if no cloud doc exists yet.
  useEffect(() => {
    if (!user) {
      mergedForUidRef.current = null;
      return;
    }
    const mergeKey = `${user.uid}:${course.id}`;
    if (mergedForUidRef.current === mergeKey) return;
    mergedForUidRef.current = mergeKey;

    const ref = doc(firestore, 'users', user.uid, 'progress', course.id);
    getDoc(ref)
      .then((snap) => {
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
        } else {
          setState((prev) => {
            setDoc(ref, { ...prev, updatedAt: serverTimestamp() }).catch((err) =>
              console.error('Firestore initial upload failed:', err)
            );
            return prev;
          });
        }
      })
      .catch((err) => console.error('Firestore initial sync failed:', err));
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
