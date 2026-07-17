import { useEffect, useState } from 'react';

export function useCourseData(dataFile) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);

    fetch(dataFile)
      .then((res) => {
        if (!res.ok) throw new Error('Could not load ' + dataFile);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        console.error('Vision Lab data error:', err);
        if (!cancelled) setError(err);
      });

    return () => {
      cancelled = true;
    };
  }, [dataFile]);

  return { data, error };
}
