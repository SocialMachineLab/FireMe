from django.urls import path, include
from social.views import PlatformViewSet
from rest_framework.routers import DefaultRouter
from poll.views import PollViewSet, PollResultViewSet
from question_answers.views import QuestionViewSet, AnswerViewSet
from campaign.views import CampaignViewSet, QueryViewSet, QueryResultViewSet

router = DefaultRouter()
router.register(r"platforms", PlatformViewSet, basename="platform")
router.register(r"campaigns", CampaignViewSet, basename="campaign")
router.register(r"queries", QueryViewSet, basename="query")
router.register(r"query-results", QueryResultViewSet, basename="QueryResult")
router.register(r"questions", QuestionViewSet, basename="question")
router.register(r"answers", AnswerViewSet, basename="answer")
router.register(r"polls", PollViewSet, basename="poll")
router.register(r"poll-results", PollResultViewSet, basename="PollResult")

urlpatterns = [
    path("", include(router.urls))
]