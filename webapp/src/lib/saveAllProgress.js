import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../firebase';
import { COURSES } from '../data/courses';

// Manual, explicit "save game" action: pushes every course's current
// localStorage progress up to Firestore right now, immediately, instead of
// relying on the automatic debounced write (which silently does nothing
// visible, and can miss the very last update if the tab closes within the
// debounce window). One button, one clear result, video-game style.
export async function saveAllProgress(uid) {
  const results = await Promise.allSettled(
    COURSES.map(async (course) => {
      const raw = localStorage.getItem(course.storageKey);
      if (!raw) return { courseId: course.id, skipped: true };
      let data;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        console.error(`Skipping ${course.id}, corrupt local data:`, err);
        return { courseId: course.id, skipped: true };
      }
      const ref = doc(firestore, 'users', uid, 'progress', course.id);
      await setDoc(ref, { ...data, updatedAt: serverTimestamp() });
      return { courseId: course.id, skipped: false };
    })
  );

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length) {
    failed.forEach((f) => console.error('Save failed for a course:', f.reason));
    throw new Error(`${failed.length} course(s) failed to save`);
  }

  return results.filter((r) => r.status === 'fulfilled' && !r.value.skipped).length;
}
