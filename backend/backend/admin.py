from django.contrib import admin

from .models import Bounty, Payload

admin.site.register(Payload)
admin.site.register(Bounty)
