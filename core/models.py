from django.db import models
from django.db.models import Q
from django.utils import timezone


# The models in this app are common to all the other apps 
# and this project itself.

#THis model is to add the date created and modified fields to all the
#respective models where it is required.
class TimeStampedModel(models.Model):

    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        #Setting this to True allows no separate database table to be created
        #This also means that other models will be inheriting this model for
        #their use.
        abstract = True 


# This model is for fetching the data with the is active flag
# It is to allow soft delete functionality using is active flag
#in our app
class SoftDeleteQuerySet(models.QuerySet):
    
    #Sending active rows only
    def alive(self):
        return self.filter(is_active = True)
    
    #Sending inactive rows only
    def dead(self):
        return self.filter(is_active = False)

    def delete(self):
        return super().update(is_active = False, modified_at=timezone.now())
    
    def hard_delete(self):
        return super().delete()
    
    def restore(self):
        return self.update(is_active = True, modified_at=timezone.now())
    

class SoftDeleteManager(models.Manager):

    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)
    
    def alive(self): return self.get_queryset()
    def dead(self): return self.model.all_objects.dead()


class SoftDeleteModel(TimeStampedModel):
    is_active = models.BooleanField(default=True)

    objects = SoftDeleteManager()
    all_objects = SoftDeleteQuerySet.as_manager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        """Instance soft-delete."""
        if not self.is_active:
            return
        self.is_active = False
        self.save(update_fields=["is_active", "modified_at"])

    def hard_delete(self, using=None, keep_parents=False):
        """Permanent delete—use sparingly."""
        return super(models.Model, self).delete(using=using, keep_parents=keep_parents)

    def restore(self):
        if self.is_active:
            return
        self.is_active = True
        self.save(update_fields=["is_active", "modified_at"])