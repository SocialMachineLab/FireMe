from django.db import models

from django.contrib.auth.models import AbstractUser
from .manager import UserManager

# Create your models here.
class FireMeUser(AbstractUser):
    institution = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    def __str__(self):
        return self.username
    
    def deactivate(self):
        if self.is_active:
            self.is_active = False
            self.save(update_fields=["is_active", "modified_at"])
