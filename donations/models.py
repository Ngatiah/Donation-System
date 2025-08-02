from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from django.conf import settings
from datetime import timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
# from django.contrib.postgres.fields import ArrayField # If you are ONLY using PostgreSQL

# Create your models here.
class Availability(models.Model):
    day_of_week = models.CharField(
        max_length=10,
        choices=[
            ('monday', 'Monday'),
            ('tuesday', 'Tuesday'),
            ('wednesday', 'Wednesday'),
            ('thursday', 'Thursday'),
            ('friday', 'Friday'),
            ('saturday', 'Saturday'),
            ('sunday', 'Sunday'),
        ],
        null=True,
        blank=True 
    )

    class Meta:
        verbose_name_plural = "Availabilities"

    def __str__(self):
        return f"{self.day_of_week.capitalize()}"
    
    def clean(self):
        if not self.day_of_week:
            raise ValidationError("You must specify a day of the week.")


class Donor(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='donor_profile')
    city = models.CharField(max_length=255,default='Unknown')
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    contact_phone = PhoneNumberField(blank=False,null=False)
    general_availability = models.ManyToManyField('Availability', blank=True, related_name='donor_availabilities')

    def __str__(self):
        return f"{self.user.name}"

class Recipient(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recipient_profile')
    city = models.CharField(max_length=255)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)

    # required_food_type = models.CharField(max_length=255,null=True,blank=True)
    # multi-selction of food type
    required_food_type = models.JSONField(default=list,blank=True,null=True)
    # required_food_type = ArrayField(models.CharField(max_length=255), default=list, blank=True, null=True)

    required_quantity = models.FloatField()
    urgency = models.CharField(max_length=50, choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')])
    contact_phone = PhoneNumberField(blank=False,null=False)
    # availability = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.name} needs {self.required_food_type} ({self.required_quantity})"
    

class Donation(models.Model):
    donor = models.ForeignKey('Donor', on_delete=models.CASCADE, related_name='donations')
    food_type = models.CharField(max_length=255)
    quantity = models.FloatField()
    expiry_date = models.DateField()
    # available = models.BooleanField(default=True)
    food_description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    availability = models.ManyToManyField('Availability', blank=True, related_name='donation_availabilities')
    is_claimed = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"Donation of {self.food_type} ({self.quantity}) by {self.donor.user.name}"
     
    # class Meta:
    #     ordering = ['-created_at']


class DonationMatch(models.Model):
    donor = models.ForeignKey('Donor', on_delete=models.CASCADE, related_name='matches')
    recipient = models.ForeignKey('Recipient', on_delete=models.CASCADE, related_name='matches')
    donation = models.ForeignKey('Donation', on_delete=models.CASCADE, related_name='matches')
    food_type = models.CharField(max_length=255)
    matched_quantity = models.FloatField()
    expiry_date = models.DateField(
    verbose_name="Expiry Date",
    default=timezone.now() + timedelta(days=7),
    help_text="The date when the food will no longer be safe for consumption.",
    null=False,
    blank=False
    )
    food_description = models.TextField(blank=True)
    selected_availability = models.ManyToManyField('Availability', blank=True, related_name='match_availabilities')
    created_at = models.DateTimeField(auto_now_add=True)
    match_score = models.IntegerField(default=0)
    is_claimed = models.BooleanField(default=False)
    is_missed = models.BooleanField(default=False) 


    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Donation Matches"

    def __str__(self):
        return f"Match: {self.donor.user.name} → {self.recipient.user.name} ({self.food_type})"
    


@receiver(post_save, sender=Donation)
def notify_recipient_on_claim(sender, instance, **kwargs):
    if instance.is_claimed:
        matches = DonationMatch.objects.filter(donation=instance, is_claimed=False, is_missed=False)

        for match in matches:
            recipient_user = match.recipient.user

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{recipient_user.id}",
                {
                    "type": "send_notification",
                    "message": f"Unfortunately, the donation of {instance.food_type} from {instance.donor.user.name} has already been claimed by another recipient.",
                    "notification_type": "match_missed_recipient",
                    "data": {
                        "donation_id": instance.id,
                        "food_type": instance.food_type,
                        "matched_quantity": match.matched_quantity,
                        "donor_name": instance.donor.user.name,
                        "match_id": match.id,
                    }
                }
            )
            # Optionally, update the match state
            match.is_missed = True
            match.save()

            
            
class RecipientNeedLog(models.Model):
    recipient = models.ForeignKey('Recipient', on_delete=models.CASCADE, related_name='need_logs')
    food_type = models.JSONField(default=list, blank=True, null=True)
    quantity = models.FloatField()
    urgency = models.CharField(max_length=50, choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')])
    created_at = models.DateTimeField(auto_now_add=True)


# class Feedback(models.Model):
#     match = models.OneToOneField(DonationMatch, on_delete=models.CASCADE)
#     rating = models.PositiveIntegerField()  # 1–5 stars
#     comment = models.TextField(blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)

