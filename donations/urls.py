# urls.py
from django.urls import path
from .views import UserLogin,UserRegistration,DonationsMatch,UserLogout,UserProfile,switch_role,Dashboard,DonationOptions,CreateOrListDonation,EditProfile,TimeRangeOptionsView,AvailabilityListAPIView

urlpatterns = [
    path('', Dashboard.as_view(), name='home'),
    path('donation-matches/', DonationsMatch.as_view(), name='donation-matches'),
    path('register/', UserRegistration.as_view(), name='register'),
    path('login/', UserLogin.as_view(), name='login'),
    path('logout/', UserLogout.as_view(), name='logout'),
    path('create-donations/', CreateOrListDonation.as_view(), name='create-donations'),
    path('donation-options/', DonationOptions.as_view(), name='donation-options'),
    path('view-profile/', UserProfile.as_view(), name='view-profile'),
    path('edit-profile/', EditProfile.as_view(), name='edit-profile'),
    path('switch-role/', switch_role, name='switch-role'),
    path('availabilities/', AvailabilityListAPIView.as_view(), name='availability-list'),
    path('time-range-options/', TimeRangeOptionsView.as_view(), name='time-range-options'),

]
