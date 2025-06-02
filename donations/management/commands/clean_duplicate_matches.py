from django.core.management.base import BaseCommand
from django.db.models import Count, F # F for database field references
from donations.models import DonationMatch # Adjust import based on your app name
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Deletes duplicate DonationMatch entries, keeping the oldest one for each unique set.'

    def handle(self, *args, **options):
        self.stdout.write("Starting duplicate DonationMatch cleanup...")

        # 1. Identify groups of duplicates
        # Group by the fields that define a unique match
        # Using .annotate() and .filter() to find groups with more than one entry
        duplicates = DonationMatch.objects.values(
            'donor', 'recipient', 'food_type', 'matched_quantity', 'expiry_date'
        ).annotate(
            count=Count('id')
        ).filter(
            count__gt=1
        )

        total_deleted_count = 0

        if not duplicates.exists():
            self.stdout.write(self.style.SUCCESS("No duplicate match groups found. Nothing to delete."))
            return

        self.stdout.write(f"Found {duplicates.count()} groups with duplicate matches.")

        for dup_group in duplicates:
            # Get all matches that fall into this duplicate group
            # Order them by ID to easily identify the oldest (lowest ID)
            # You might want to order by 'created_at' if you have that field and it's more reliable
            # for "oldest"
            matching_entries = DonationMatch.objects.filter(
                donor=dup_group['donor'],
                recipient=dup_group['recipient'],
                food_type=dup_group['food_type'],
                matched_quantity=dup_group['matched_quantity'],
                expiry_date=dup_group['expiry_date'],
            ).order_by('id') # Keeps the one with the lowest ID

            # Keep the first (oldest) entry and delete the rest
            entries_to_keep = matching_entries.first()
            entries_to_delete = matching_entries.exclude(id=entries_to_keep.id)

            deleted_count, _ = entries_to_delete.delete()
            total_deleted_count += deleted_count

            self.stdout.write(
                f"  Deleted {deleted_count} duplicates for "
                f"Donor: {entries_to_keep.donor.user.name}, "
                f"Recipient: {entries_to_keep.recipient.user.name}, "
                f"Food: {entries_to_keep.food_type}"
            )

        self.stdout.write(self.style.SUCCESS(
            f"Duplicate cleanup finished. Total {total_deleted_count} duplicate match entries deleted."
        ))