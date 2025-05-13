from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, name, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        
        email = self.normalize_email(email)

        # ensuring only one role is  active
        if extra_fields.get('is_donor', False) == extra_fields.get('is_recipient', False):
            raise ValueError("User must be either donor or recipient, not both or neither.")

        user = self.model(name=name, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, name, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        # default role for superuser
        # extra_fields.setdefault('role', 'donor')
        extra_fields.setdefault('is_donor', True) 
        return self.create_user(name, email, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('donor', 'Donor'),
        ('recipient', 'Recipient'),
    )

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    # role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='donor')
    is_donor = models.BooleanField(default=False)
    is_recipient = models.BooleanField(default=False)
     

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return self.email
    
    @property
    def role(self):
        if self.is_donor:
            return 'donor'
        elif self.is_recipient:
            return 'recipient'
        return None

    
    
