from django.db import models
from django.contrib.auth.models import AbstractUser

class Bus(models.Model):
    bus_number = models.CharField(max_length=10, unique=True, primary_key=True)
    route_name = models.CharField(max_length=100, null=True, blank=True, default="")
    current_lat = models.FloatField(null=True, blank=True)
    current_lon = models.FloatField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    bus_icon = models.ImageField(
        upload_to='bus_icons/',
        null=True,
        blank=True,
        default=None,
        help_text="Upload an icon/image for this bus"
    )
    from_address = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Starting location address of the bus route"
    )
    from_lat = models.FloatField(
        null=True,
        blank=True,
        help_text="Latitude of the starting location"
    )
    from_lng = models.FloatField(
        null=True,
        blank=True,
        help_text="Longitude of the starting location"
    )
    to_address = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Destination address of the bus route"
    )
    to_lat = models.FloatField(
        null=True,
        blank=True,
        help_text="Latitude of the destination location"
    )
    to_lng = models.FloatField(
        null=True,
        blank=True,
        help_text="Longitude of the destination location"
    )

    def __str__(self):
        return f"{self.bus_number} - {self.route_name or 'No Route'}"

class BusDriver(AbstractUser):
    email = models.EmailField(unique=True)
    bus = models.ForeignKey(
        "Bus",
        to_field="bus_number",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    bus_model = models.CharField(max_length=50, null=True, blank=True)
    route_number = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.bus_model or 'No Model'})"
