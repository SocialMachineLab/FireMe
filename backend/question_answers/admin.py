from django.contrib import admin
from .models import Question, Answer

# Register your models here.
@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):

    list_display = ("question_id", "question", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("question",)

    def get_queryset(self, request):
        # show all (active + inactive) in admin
        return Question.all_objects.all()
    

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):

    list_display = ("answer_id", "question", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("answer",)

    def get_queryset(self, request):
        return Answer.all_objects.select_related("question")