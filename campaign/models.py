from django.db import models
from django.db.models import Q
from django.conf import settings
from core.models import SoftDeleteModel
from django.db.models.functions import Lower
from django.core.exceptions import ValidationError


# Create your models here.
class Campaign(SoftDeleteModel):

    campaign_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE, related_name="campaigns", null = False, blank = False)
    plt = models.ForeignKey('social.Platform', on_delete=models.PROTECT, related_name="campaigns")
    name = models.CharField(max_length = 200)
    
    # Removing the following fields as the start and end date should be concerned with Poll 
    # and not a general Query / Campaign as a campaign can have many queries and a query can
    # have many polls 
    # 
    # duration = models.PositiveBigIntegerField()
    # start_date = models.DateField(null = True, blank = True)
    # end_date = models.DateField(null = True, blank = True)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "plt", "name", "is_active"])]

        constraints = [
            models.UniqueConstraint (
                fields=["user", "plt", "name"],
                condition=Q(is_active=True),
                name="uq_active_campaign_name_per_user_platform"
            ),
        ]


    def __str__(self):
        return self.name[:80]

class Query(SoftDeleteModel):
    query_id = models.BigAutoField(primary_key=True)
    campaign = models.ForeignKey(Campaign, on_delete = models.CASCADE, related_name="queries")
    search_term = models.TextField(null = False, blank = False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["campaign", "search_term", "created_at"])]

        constraints = [
            models.UniqueConstraint(
                Lower('search_term'), 'campaign',
                condition=Q(is_active=True),
                name='uq_active_query_per_campaign',
            ),
        ]
    
    def __str__(self):
        return self.search_term[:80]


class QueryResults(SoftDeleteModel):
    qres_id = models.BigAutoField(primary_key=True)
    query = models.ForeignKey(Query, on_delete=models.PROTECT, related_name="records")
    plt = models.ForeignKey("social.Platform", on_delete=models.PROTECT, related_name="results")
    poll_result = models.ForeignKey("poll.PollResult", on_delete=models.SET_NULL, related_name="query_results",
                                    blank=True, null=True)
    user_data = models.JSONField(blank=True, null=True)
    source_id = models.CharField(max_length=255, db_index=True)
    firescore = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)

    def clean(self):
        
        if self.poll_result_id:
            pr = self.poll_result
            if pr.poll.query_id != self.query_id:
                raise ValidationError("poll_result.poll.query must match QueryResult.query.")


