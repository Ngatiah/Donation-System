from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from django.conf import settings
from datetime import timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError


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
        blank=True  # Optional to support more precise availability
    )

    # specific_date = models.DateField(null=True, blank=True)  # Exact date availability
    # start_date = models.DateField(null=True, blank=True)     # Range start
    # end_date = models.DateField(null=True, blank=True)       # Range end
    # available_from = models.TimeField()
    # available_until = models.TimeField()

    class Meta:
        verbose_name_plural = "Availabilities"

    def __str__(self):
        return f"{self.day_of_week.capitalize()}"
        # if self.specific_date:
        #     return f"{self.specific_date} from {self.available_from} to {self.available_until}"
        # elif self.start_date and self.end_date:
        #     return f"{self.start_date}–{self.end_date} from {self.available_from} to {self.available_until}"
        # elif self.day_of_week:
        #     return f"{self.day_of_week.capitalize()} from {self.available_from} to {self.available_until}"
        # return f"Available from {self.available_from} to {self.available_until}"
    
    def clean(self):
        if not self.day_of_week:
            raise ValidationError("You must specify a day of the week.")
        # if not any([self.specific_date, (self.start_date and self.end_date), self.day_of_week]):
        #     raise ValidationError("You must specify either a specific date, a date range, or a day of the week.")



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

    required_food_type = models.CharField(max_length=255,null=True,blank=True)
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

    def __str__(self):
        return f"Donation of {self.food_type} ({self.quantity}) by {self.donor.user.name}"


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
    selected_availability = models.ManyToManyField('Availability', blank=True, related_name='match_availabilities')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Match: {self.donor.user.name} → {self.recipient.user.name} ({self.food_type})"

