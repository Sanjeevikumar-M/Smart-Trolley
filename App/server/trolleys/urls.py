from django.urls import path
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Trolley
from .serializers import TrolleySerializer

app_name = 'trolleys'


class TrolleyListView(APIView):
    """List all trolleys."""
    def get(self, request):
        trolleys = Trolley.objects.all()
        serializer = TrolleySerializer(trolleys, many=True)
        return Response({
            'count': trolleys.count(),
            'trolleys': serializer.data
        })


class TrolleyDetailView(APIView):
    """Get a single trolley by ID."""
    def get(self, request, trolley_id):
        try:
            trolley = Trolley.objects.get(trolley_id=trolley_id)
            serializer = TrolleySerializer(trolley)
            return Response(serializer.data)
        except Trolley.DoesNotExist:
            return Response(
                {'error': f'Trolley {trolley_id} not found'},
                status=404
            )


urlpatterns = [
    path('', TrolleyListView.as_view(), name='trolley-list'),
    path('<str:trolley_id>', TrolleyDetailView.as_view(), name='trolley-detail'),
]
