from django.apps import AppConfig



class DonationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'donations'
    
    # ensuring donation match models only loads on startup NOT on every POST request
    def ready(self):
        from .match_utils import load_models
        load_models()
       
