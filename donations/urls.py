# urls.py
from django.urls import path
from .views import *
# ,GenerateDonationReportView
# ,VerifyEmailView

urlpatterns = [
    path('', Dashboard.as_view(), name='home'),
    path('register/', UserRegistration.as_view(), name='register'),
    path('login/', UserLogin.as_view(), name='login'),
    path('logout/', UserLogout.as_view(), name='logout'),
    path('create-donations/', CreateOrListDonation.as_view(), name='create-donations'),
    path('update-donations/<int:pk>/', RetrieveUpdateDestroyDonation.as_view(), name='update-donations'),
    path('donation-matches/', DonationsMatch.as_view(), name='donation-matches'),
    path('donation-options/', DonationOptions.as_view(), name='donation-options'),
    path('donation-history/', DonationsHistory.as_view(), name='donation-history'),
    path('view-profile/', UserProfile.as_view(), name='view-profile'),
    path('view-profile/<int:user_id>/', view_user_profile,name='view-other-user-profile'),
    path('edit-profile/', EditProfile.as_view(), name='edit-profile'),
    path('switch-role/', switch_role, name='switch-role'),
    path('availabilities/', AvailabilityListAPIView.as_view(), name='availability-list'),
    path('time-range-options/', TimeRangeOptionsView.as_view(), name='time-range-options'),
    path('cities/', CityOptions.as_view(), name='cities'),
    path('top-users/', TopUsers.as_view(), name='top-users'), 
    path('statistics/', DonationStatisticsView.as_view(), name='donation-statistics'),

    # recipients claiming donation matches
    path('matches/<int:match_id>/claim/',ClaimDonationMatchView.as_view() , name='claim-donation'),

    # recipient monthy needs update : food type and quantity
    # path("recipient-need-update/", RecipientNeedUpdate.as_view(), name="recipient-need-update")


    # EMAIL VERIFICATION
    # path('verify-email/<uidb64>/<token>/', VerifyEmailView.as_view(), name='verify-email')

    # password-reset and confirm views
    path('request-password-reset/', RequestPasswordResetView.as_view(), name='request-password-reset'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),

    # generate donation report
    # path('generate-report/', GenerateDonationReportView.as_view(), name='donation-report'),

]
