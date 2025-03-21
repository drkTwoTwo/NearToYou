from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import BusDriver, Bus

class DriverSerializer(serializers.ModelSerializer):
    bus_number = serializers.CharField(write_only=True)
    route_name = serializers.CharField(write_only=True, required=False, allow_null=True)
    bus_icon = serializers.ImageField(write_only=True, required=False, allow_null=True)
    from_address = serializers.CharField(write_only=True, required=True)
    from_lat = serializers.FloatField(write_only=True, required=True)
    from_lng = serializers.FloatField(write_only=True, required=True)
    to_address = serializers.CharField(write_only=True, required=True)
    to_lat = serializers.FloatField(write_only=True, required=True)
    to_lng = serializers.FloatField(write_only=True, required=True)

    class Meta:
        model = BusDriver
        fields = [
            "id", "username", "email", "password", "bus",
            "bus_number", "route_name", "bus_model", "route_number", "bus_icon",
            "from_address", "from_lat", "from_lng", "to_address", "to_lat", "to_lng"
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            "bus": {"read_only": True},
        }

    def to_internal_value(self, data):
        """Map frontend field names to model field names and handle QueryDict lists."""
        print(f"🛠 Before Transformation: {data}")
        mutable_data = dict(data)

        # Extract single values from lists and handle mappings
        mutable_data["username"] = mutable_data.get("name", mutable_data.get("username", [""]))[0]
        mutable_data["email"] = mutable_data.get("email", [""])[0]  # Extract email
        mutable_data["password"] = mutable_data.get("password", [""])[0]  # Extract password
        mutable_data["bus_number"] = mutable_data.get("busId", mutable_data.get("bus_number", [""]))[0]
        mutable_data["route_name"] = mutable_data.get("routeNumber", mutable_data.get("route_name", [""]))[0] if mutable_data.get("routeNumber") else None
        mutable_data["bus_model"] = mutable_data.get("busModel", mutable_data.get("bus_model", [""]))[0]
        mutable_data["route_number"] = mutable_data.get("routeNumber", mutable_data.get("route_number", [""]))[0]
        mutable_data["from_address"] = mutable_data.get("fromAddress", mutable_data.get("from_address", [""]))[0]
        mutable_data["to_address"] = mutable_data.get("toAddress", mutable_data.get("to_address", [""]))[0]

        # Convert string numbers to floats for lat/lng fields
        mutable_data["from_lat"] = float(mutable_data.get("fromLat", mutable_data.get("from_lat", ["0"]))[0])
        mutable_data["from_lng"] = float(mutable_data.get("fromLng", mutable_data.get("from_lng", ["0"]))[0])
        mutable_data["to_lat"] = float(mutable_data.get("toLat", mutable_data.get("to_lat", ["0"]))[0])
        mutable_data["to_lng"] = float(mutable_data.get("toLng", mutable_data.get("to_lng", ["0"]))[0])

        print(f"✅ After Transformation: {mutable_data}")
        return super().to_internal_value(mutable_data)

    def validate_email(self, value):
        """Ensure email is unique."""
        if BusDriver.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email is already registered.")
        return value

    def validate_username(self, value):
        """Ensure username is unique."""
        if BusDriver.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username is already taken.")
        return value

    def validate_bus_icon(self, value):
        """Validate bus icon file."""
        if value:
            max_size = 5 * 1024 * 1024  # 5MB
            if value.size > max_size:
                raise serializers.ValidationError("Bus icon file size must be less than 5MB.")
            allowed_types = ["image/jpeg", "image/png", "image/gif"]
            if value.content_type not in allowed_types:
                raise serializers.ValidationError("Bus icon must be a JPEG, PNG, or GIF image.")
        return value

    def validate(self, data):
        """Custom validation for required fields."""
        required_fields = ["bus_number", "from_address", "from_lat", "from_lng", "to_address", "to_lat", "to_lng"]
        for field in required_fields:
            if field not in data or data[field] is None:
                raise serializers.ValidationError({field: "This field is required."})
        return data

    def create(self, validated_data):
        """Create a new BusDriver and associated Bus instance."""
        print(f"🛠 Validated Data Before Processing: {validated_data}")
        bus_number = validated_data.pop("bus_number")
        route_name = validated_data.pop("route_name", None)
        bus_icon = validated_data.pop("bus_icon", None)
        from_address = validated_data.pop("from_address")
        from_lat = validated_data.pop("from_lat")
        from_lng = validated_data.pop("from_lng")
        to_address = validated_data.pop("to_address")
        to_lat = validated_data.pop("to_lat")
        to_lng = validated_data.pop("to_lng")

        bus_defaults = {
            "route_name": route_name,
            "from_address": from_address,
            "from_lat": from_lat,
            "from_lng": from_lng,
            "to_address": to_address,
            "to_lat": to_lat,
            "to_lng": to_lng,
        }
        if bus_icon:
            bus_defaults["bus_icon"] = bus_icon

        try:
            bus, created = Bus.objects.get_or_create(bus_number=bus_number, defaults=bus_defaults)
            if not created:
                bus.route_name = route_name or bus.route_name
                if bus_icon:
                    bus.bus_icon = bus_icon
                bus.from_address = from_address
                bus.from_lat = from_lat
                bus.from_lng = from_lng
                bus.to_address = to_address
                bus.to_lat = to_lat
                bus.to_lng = to_lng
                bus.save()
                print(f"🛠 Updated existing bus: {bus_number}")

            validated_data["bus"] = bus
            validated_data["password"] = make_password(validated_data["password"])
            driver = BusDriver.objects.create(**validated_data)
            print(f"✅ Driver created: {driver.username}")
            return driver
        except Exception as e:
            print(f"🚨 Creation Error: {e}")
            raise serializers.ValidationError({"error": str(e)})
