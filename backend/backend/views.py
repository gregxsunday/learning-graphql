from rest_framework import viewsets

from .models import Bounty, Payload
from .serializers import BountySerializer, PayloadSerializer


class PayloadViewSet(viewsets.ModelViewSet):
    queryset = Payload.objects.all()
    serializer_class = PayloadSerializer
    permission_classes = []
    filterset_fields = ['id', 'bug_class', 'payload', 'bounties']


class BountyViewSet(viewsets.ModelViewSet):
    queryset = Bounty.objects.all()
    serializer_class = BountySerializer
    permission_classes = []
    filterset_fields = ['id', 'reward', 'hunter', 'payload']
