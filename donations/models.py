from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from django.conf import settings
from datetime import timedelta
from django.utils import timezone

# Create your models here.
class Donor(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='donor_profile')
    city = models.CharField(max_length=255,default='Unknown')
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    contact_phone = PhoneNumberField(blank=False,null=False)
    available = models.BooleanField(default=True)
    available_from = models.TimeField(null=True, blank=True)
    available_until = models.TimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.name}"

class Recipient(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recipient_profile')
    city = models.CharField(max_length=255)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)

    required_food_type = models.CharField(max_length=255,null=True,blank=True)
    required_quantity = models.FloatField()
    urgency = models.CharField(max_length=50, choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')])
    contact_phone = PhoneNumberField(blank=False,null=False)
    availability = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.name} needs {self.required_food_type} ({self.required_quantity})"


class DonationMatch(models.Model):
    donor = models.ForeignKey('Donor', on_delete=models.CASCADE, related_name='matches')
    recipient = models.ForeignKey('Recipient', on_delete=models.CASCADE, related_name='matches')

    food_type = models.CharField(max_length=255)
    shelf_type = models.CharField(max_length=255, blank=True)  # from shelf_map
    matched_quantity = models.FloatField()
    expiry_date = models.DateField(
    verbose_name="Expiry Date",
    default=timezone.now() + timedelta(days=7),
    help_text="The date when the food will no longer be safe for consumption.",
    null=False,
    blank=False
    )
    food_description = models.TextField(blank=True)
    pickup_time = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Match: {self.donor.user.name} → {self.recipient.user.name} ({self.food_type})"

