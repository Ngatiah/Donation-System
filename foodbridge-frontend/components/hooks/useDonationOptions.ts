import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

export const useDonationOptions = () => {
  const token = useAuthStore(state => state.token)
  const [foodTypes, setFoodTypes] = useState<string[]>([]);
  const [shelfTypes, setShelfTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch('http://localhost:8003/FoodBridge/donations/donation-options/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        const data = await res.json();
        setFoodTypes(data.food_types || []);
        setShelfTypes(data.shelf_types || []);
      } catch (error) {
        console.error('Failed to fetch donation options:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchOptions();
  }, [token]);

  return { foodTypes, shelfTypes, loading };
};
