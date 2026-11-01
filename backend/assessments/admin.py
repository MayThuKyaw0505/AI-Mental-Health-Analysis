# from django.contrib import admin

# Register your models here.

from django.contrib import admin
from .models import Questionnaire, Question, Assessment, Response

admin.site.register(Questionnaire)
admin.site.register(Question)
admin.site.register(Assessment)
admin.site.register(Response)
