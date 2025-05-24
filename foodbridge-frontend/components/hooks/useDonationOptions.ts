import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { fetchFoodTypeOptions } from '../lib/actions/food';

export const useDonationOptions = () => {
  const token = useAuthStore(state => state.token);
  // const token = useAuthStore.getState().token;

  const [foodTypes, setFoodTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetchFoodTypeOptions(token);

        if (res.success && res.data?.required_food_types) {
          setFoodTypes(res.data.required_food_types);
        } else {
          console.error("Error fetching food types:", res.error);
        }
      } catch (error) {
        console.error("Failed to fetch donation options:", error);
      } finally {
        setLoading(false);
      }
    };

    // if (token) 
    fetchOptions();
  }, [token]);

  return { foodTypes, loading };
};
