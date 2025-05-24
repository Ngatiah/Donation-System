import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { fetchAvailabilitiesOptions } from '../lib/actions/availability';

export const useAvailabilityOptions = () => {
  // const token = useAuthStore(state => state.token);
  const token = useAuthStore.getState().token;

  const [availabilityOptions, setAvailabilityOptions] = useState<{label :string,value : string}[]>([]);
  const [loadingAvailability, setLoadingAvaialbility] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetchAvailabilitiesOptions(token);

        // if (res.success ) {
        //   setAvailabilityOptions(res.data);
        // } else {
        //   console.error("Error fetching time range options:", res.error);
        // }
        if (res.success) {
          // Convert plain strings to { label, value } objects
          const mapped = res.data.map((item: string) => ({
            label: item,
            value: item,
          }));
          setAvailabilityOptions(mapped);
        }
        else {
          console.error("Error fetching available days in a week:", res.error);
        }
      } catch (error) {
        console.error("Failed to fetch time range options:", error);
      } finally {
        setLoadingAvaialbility(false);
      }
    };

    if (token) fetchOptions();
  }, [token]);

  return { availabilityOptions, loadingAvailability };
};
