import joblib
import os
from django.conf import settings


def get_matching_models():
    base_path = os.path.join(settings.BASE_DIR, 'models')

    model_path = os.path.join(base_path, 'match_model_finalee2.pkl')
    # food_encoder_path = os.path.join(base_path, 'food_encoder_finale.pkl')
    food_encoder_path = os.path.join(base_path, 'all_food_types_list_finalee2.pkl')
    # urgency_encoder_path = os.path.join(base_path, 'urgency_encoder_finale.pkl')
    cities_encoder_path = os.path.join(base_path,'all_cities_finale.pkl')
    city_coords_encoder_path = os.path.join(base_path,'all_cities_tocoords_finale.pkl')

    if not all(os.path.exists(p) for p in [model_path, food_encoder_path, cities_encoder_path,city_coords_encoder_path]):
        raise FileNotFoundError("One or more model files not found in 'models/' directory")

    rf_model = joblib.load(model_path)
    le_food = joblib.load(food_encoder_path)
    # urgency_encoder = joblib.load(urgency_encoder_path)
    cities = joblib.load(cities_encoder_path)
    cities_to_coords = joblib.load(city_coords_encoder_path)
    print("LE_FOOD CLASSES:", le_food)

    return rf_model, le_food,cities,cities_to_coords 


