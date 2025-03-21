import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

class BusLocationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        from .models import Bus  # Lazy import
        self.room_group_name = "bus_tracking"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        print(f"[CONNECT] Client connected: {self.channel_name}")
        await self.accept()

        # Fetch all buses asynchronously
        buses = await sync_to_async(list)(Bus.objects.all())
        bus_data = [
            {
                'bus_number': bus.bus_number,
                'lat': bus.current_lat,
                'lon': bus.current_lon,
                'route_name': bus.route_name,
                'from_address': bus.from_address,
                'from_lat': bus.from_lat,
                'from_lng': bus.from_lng,
                'to_address': bus.to_address,
                'to_lat': bus.to_lat,
                'to_lng': bus.to_lng,
                'last_updated': bus.last_updated.isoformat() if bus.last_updated else None,
            }
            for bus in buses
        ]
        await self.send(text_data=json.dumps(bus_data))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        print(f"[DISCONNECT] Client disconnected: {self.channel_name} with code: {close_code}")

    async def receive(self, text_data):
        from .models import Bus  # Lazy import
        print(f"[RECEIVE] Raw data received: {text_data}")
        try:
            data = json.loads(text_data)
            bus_number = data.get('bus_number')
            lat = data.get('lat')
            lon = data.get('lon')

            if not all([bus_number, lat, lon]):
                print(f"[ERROR] Missing required fields: {data}")
                return

            # Update bus in database asynchronously
            try:
                bus = await sync_to_async(Bus.objects.get)(bus_number=bus_number)
                bus.current_lat = lat
                bus.current_lon = lon
                await sync_to_async(bus.save)()
            except Bus.DoesNotExist:
                print(f"[ERROR] Bus {bus_number} not found")
                return

            print(f"[RECEIVE] Parsed data: bus_number={bus_number}, lat={lat}, lon={lon}")

            # Broadcast updated bus data
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_location',
                    'bus_number': bus_number,
                    'lat': lat,
                    'lon': lon,
                    'route_name': bus.route_name,
                    'from_address': bus.from_address,
                    'from_lat': bus.from_lat,
                    'from_lng': bus.from_lng,
                    'to_address': bus.to_address,
                    'to_lat': bus.to_lat,
                    'to_lng': bus.to_lng,
                    'last_updated': bus.last_updated.isoformat(),
                }
            )
        except json.JSONDecodeError as e:
            print(f"[ERROR] JSON parsing failed: {e}")
        except Exception as e:
            print(f"[ERROR] While processing message: {e}")

    async def send_location(self, event):
        print(f"[SEND] Broadcasting data: {event}")
        await self.send(text_data=json.dumps({
            'bus_number': event['bus_number'],
            'lat': event['lat'],
            'lon': event['lon'],
            'route_name': event['route_name'],
            'from_address': event['from_address'],
            'from_lat': event['from_lat'],
            'from_lng': event['from_lng'],
            'to_address': event['to_address'],
            'to_lat': event['to_lat'],
            'to_lng': event['to_lng'],
            'last_updated': event['last_updated'],
        }))
