# from django.contrib import admin

# Register your models here.

from django.contrib import admin
from .models import JournalEntry


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "title",
        "created_at",
        "updated_at",
    )

    search_fields = (
        "title",
        "content",
        "user__username",
    )
