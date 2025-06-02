from django.utils import timezone
from .models import Donation
from celery import shared_task
import logging

logger = logging.getLogger(__name__)

@shared_task
def cleanup_expired_donations():
    today = timezone.now().date()
    expired_donations = Donation.objects.filter(expiry_date__lt=today, is_claimed=False)
    
    # `delete()` returns a tuple: (number_of_objects_deleted, {app_label.model_name: count})
    count_deleted, _ = expired_donations.delete()

    message = f'Celery cleanup task: Successfully deleted {count_deleted} expired and unclaimed donations.'
    logger.info(message)
    print(message) # Print to console for Celery worker logs

    return message
