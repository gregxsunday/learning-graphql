from rest_framework import serializers

from .models import Bounty, Payload


class PayloadSerializer(serializers.ModelSerializer):
    bounties = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Bounty.objects.all(),
        required=False
    )

    class Meta:
        model = Payload
        fields = ['id', 'bug_class', 'payload', 'bounties']


class BountySerializer(serializers.ModelSerializer):
    payload = serializers.PrimaryKeyRelatedField(
        queryset=Payload.objects.all(),
        required=False
    )

    class Meta:
        model = Bounty
        fields = ['id', 'reward', 'hunter', 'payload']
