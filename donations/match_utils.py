import os
from django.conf import settings
import joblib
MODELS = {}

def load_models():
    global MODELS
    base_path = os.path.join(settings.BASE_DIR, 'models')
    MODELS['rf_model'] = joblib.load(os.path.join(base_path, 'match_model_finale.pkl'))
    MODELS['le_food'] = joblib.load(os.path.join(base_path, 'food_encoder_finale.pkl'))
    # MODELS['urgency_encoder'] = joblib.load(os.path.join(base_path, 'urgency_encoder.pkl'))

def get_models():
    return MODELS['rf_model'], MODELS['le_food']

# , MODELS['urgency_encoder']
