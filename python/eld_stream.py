import sys
import json
import time
import math
import random
from datetime import datetime

# Real Highway Corridor Waypoints (Chicago -> Dallas -> Atlanta)
TRUCK_ROUTES = {
    "TRK-402": {
        "truckId": "TRK-402",
        "driverName": "Ray Delgado",
        "hosRemainingHours": 7.5,
        "startLat": 41.8781, "startLng": -87.6298, # Chicago
        "endLat": 32.7767, "endLng": -96.7970,   # Dallas
        "reeferSetpointF": 34.0,
        "fuelLevelPct": 88,
        "currentProgress": 0.62
    },
    "TRK-309": {
        "truckId": "TRK-309",
        "driverName": "Dave Cooper",
        "hosRemainingHours": 4.2,
        "startLat": 33.7490, "startLng": -84.3880, # Atlanta
        "endLat": 28.5383, "endLng": -81.3792,   # Orlando
        "reeferSetpointF": 36.0,
        "fuelLevelPct": 74,
        "currentProgress": 0.81
    },
    "TRK-105": {
        "truckId": "TRK-105",
        "driverName": "Sam Vance",
        "hosRemainingHours": 9.0,
        "startLat": 39.7392, "startLng": -104.9903, # Denver
        "endLat": 41.8781, "endLng": -87.6298,    # Chicago
        "reeferSetpointF": 33.5,
        "fuelLevelPct": 92,
        "currentProgress": 0.28
    }
}

def calculate_telemetry(truck_id):
    route = TRUCK_ROUTES.get(truck_id, TRUCK_ROUTES["TRK-402"])

    # Advance progress along vector
    route["currentProgress"] += 0.0012
    if route["currentProgress"] >= 1.0:
        route["currentProgress"] = 0.05

    p = route["currentProgress"]
    lat = route["startLat"] + (route["endLat"] - route["startLat"]) * p + (random.random() - 0.5) * 0.002
    lng = route["startLng"] + (route["endLng"] - route["startLng"]) * p + (random.random() - 0.5) * 0.002

    speed = round(62.0 + (random.random() - 0.5) * 6.0, 1)
    reefer_temp = round(route["reeferSetpointF"] + (random.random() - 0.5) * 0.4, 1)
    fuel_pct = max(10, round(route["fuelLevelPct"] - p * 8, 1))

    # Geofence detection
    if p > 0.95:
        geofence_state = "At Consignee Terminal"
        dwell = int((p - 0.95) * 2000)
    elif p < 0.05:
        geofence_state = "At Shipper Facility"
        dwell = 35
    else:
        geofence_state = "En-Route Highway Corridor"
        dwell = 0

    return {
        "truckId": route["truckId"],
        "driverName": route["driverName"],
        "lat": round(lat, 6),
        "lng": round(lng, 6),
        "speedMph": speed,
        "bearingDegrees": 215,
        "reeferTempF": reefer_temp,
        "fuelLevelPct": fuel_pct,
        "dwellMinutes": dwell,
        "geofenceState": geofence_state,
        "hosRemainingHours": route["hosRemainingHours"],
        "engineStatus": "RUNNING",
        "ignitionOn": True,
        "odometerMiles": 142890 + int(p * 920),
        "timestamp": datetime.now().isoformat()
    }

if __name__ == '__main__':
    truck = sys.argv[1] if len(sys.argv) > 1 else "TRK-402"
    print(json.dumps(calculate_telemetry(truck)))
