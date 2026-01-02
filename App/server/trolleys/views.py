from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Trolley
from .serializers import TrolleySerializer


class TrolleyListView(APIView):
    """
    GET /api/trolleys
    List all trolleys with their QR code data.
    """
    def get(self, request):
        trolleys = Trolley.objects.all()
        serializer = TrolleySerializer(trolleys, many=True)
        return Response({
            'count': trolleys.count(),
            'trolleys': serializer.data
        })


class TrolleyDetailView(APIView):
    """
    GET /api/trolleys/{trolley_id}
    Get a single trolley by ID with QR code information.
    """
    def get(self, request, trolley_id):
        try:
            trolley = Trolley.objects.get(trolley_id=trolley_id)
            serializer = TrolleySerializer(trolley)
            return Response(serializer.data)
        except Trolley.DoesNotExist:
            return Response(
                {'error': f'Trolley {trolley_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class TrolleyQRCodeView(APIView):
    """
    GET /api/trolleys/{trolley_id}/qr
    Get QR code data for a specific trolley.
    Returns the URL and payload that should be encoded in QR code.
    """
    def get(self, request, trolley_id):
        try:
            trolley = Trolley.objects.get(trolley_id=trolley_id)
            
            if not trolley.is_active:
                return Response(
                    {'error': f'Trolley {trolley_id} is not active'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            qr_payload = trolley.get_qr_payload()
            
            return Response({
                'trolley_id': trolley.trolley_id,
                'qr_code_url': trolley.qr_code_data,
                'qr_payload': qr_payload,
                'instructions': 'Encode qr_code_url in QR code. When scanned, user should be redirected to your web app with trolley_id parameter.',
                'is_active': trolley.is_active,
                'is_locked': trolley.is_locked
            })
        except Trolley.DoesNotExist:
            return Response(
                {'error': f'Trolley {trolley_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
