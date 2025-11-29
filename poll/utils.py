from campaign.models import Query

def user_scoped_poll_queryset(user, base_qs):
    # Scope by Query -> Campaign -> user
    return (
        base_qs.select_related("query__campaign", "question")
        .filter(query__campaign__user=user)
    )
