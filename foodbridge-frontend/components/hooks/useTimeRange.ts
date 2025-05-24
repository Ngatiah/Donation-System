import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { fetchTimeRangeOptions } from '../lib/actions/time';

export interface TimeRange {
  label: string;
  from: string;
  until: string;
}


export const useTimeRangeOptions = () => {
  // const token = useAuthStore(state => state.token);
  const token = useAuthStore.getState().token;
  const [timeRangeOptions, setTimeRangeOptions] = useState<TimeRange[]>([]);
  const [loadingTimeRanges, setLoadingTimeRanges] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetchTimeRangeOptions(token);

        if (res.success) {
          setTimeRangeOptions(res.data); 
        } else {
          console.error("Error fetching time range options:", res.error);
        }
      } catch (error) {
        console.error("Failed to fetch time range options:", error);
      } finally {
        setLoadingTimeRanges(false);
      }
    };

    if (token) fetchOptions();
  }, [token]);

  return { timeRangeOptions, loadingTimeRanges };
};
