import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { fetchCity } from '../lib/actions/city';

export const useCity = () => {
  const token = useAuthStore(state => state.token);

  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetchCity(token);

        if (res.success && res.data?.cities) {
          setCities(res.data.cities);
        } else {
          console.error("Error fetching cities:", res.error);
        }
      } catch (error) {
        console.error("Failed to fetch cities:", error);
      } finally {
        setLoadingCities(false);
      }
    };

    fetchOptions();
  }, [token]);

  return { cities, loadingCities };
};
