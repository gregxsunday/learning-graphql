from django.db import models


class Payload(models.Model):

    id = models.AutoField(primary_key=True)
    bug_class = models.CharField(max_length=255)
    payload = models.CharField(max_length=255)

    class Meta:
        db_table = "payload"


class Bounty(models.Model):

    id = models.AutoField(primary_key=True)
    reward = models.IntegerField(null=True, blank=True)
    hunter = models.CharField(max_length=255, null=True, blank=True)
    payload = models.ForeignKey('Payload', on_delete=models.SET_NULL,
                                related_name='bounties', null=True, blank=True)

    class Meta:
        db_table = "bounty"
