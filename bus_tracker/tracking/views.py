from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.parsers import JSONParser
from .models import BusDriver
from .serializers import DriverSerializer
from django.contrib.auth.hashers import check_password

@api_view(["POST"])
def create_driver(request):
    serializer = DriverSerializer(data=request.data)
    if not serializer.is_valid():
        print("❌ Serializer Errors:", serializer.errors)  
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)





@api_view(["POST"])
def login_view(request):
    email = request.data.get("email")
    password = request.data.get("password")
    
    if not email or not password:
        return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = BusDriver.objects.get(email=email)
        if check_password(password, user.password):
            token, _ = Token.objects.get_or_create(user=user)
            
            bus_details = None
            bus_icon_url = None

            if user.bus:
                bus_details = {
                    "bus_number": user.bus.bus_number,
                    "route_name": user.bus.route_name,
                    "current_lat": user.bus.current_lat,
                    "current_lon": user.bus.current_lon,
                    "last_updated": user.bus.last_updated.isoformat(),  # Convert to string for JSON
                    "from_address": user.bus.from_address,
                    "from_lat": user.bus.from_lat,
                    "from_lng": user.bus.from_lng,
                    "to_address": user.bus.to_address,
                    "to_lat": user.bus.to_lat,
                    "to_lng": user.bus.to_lng,
                }
                # Ensure bus_icon is not None before accessing its URL
                if user.bus.bus_icon:
                    bus_icon_url = request.build_absolute_uri(user.bus.bus_icon.url)

            driver_details = {
                "id": user.id,
                "name": user.username,
                "email": user.email,
                "bus_model": user.bus_model,
                "route_number": user.route_number,
                "bus_details": bus_details,
                "bus_icon": bus_icon_url,  # URL or None
            }
            return Response({
                "token": token.key,
                "message": "Login successful",
                "driver": driver_details
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    except BusDriver.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_401_UNAUTHORIZED)
