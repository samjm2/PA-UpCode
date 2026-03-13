from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from geopy.geocoders import Nominatim

app = Flask(__name__)

# Load the csv
df = pd.read_csv("data/public-schools.csv")

# Convert to radians
df["lat_rad"] = np.radians(df["Latitude"])
df["lon_rad"] = np.radians(df["Longitude"])

# Haversine formula to calculate distance between two lat/lon points
def haversine(lat1, lon1, lat2, lon2):
    # Earth radius in miles
    R = 3958.8
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = np.sin(dlat / 2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2)**2
    c = 2 * np.arcsin(np.sqrt(a))
    
    return R * c

# Function to find schools within a certain radius of an address
def find_nearby_schools(address, radius_miles):
    # Geocode the address to get latitude and longitude
    geolocator = Nominatim(user_agent="school_finder")
    location = geolocator.geocode(address)
    # Verify if the geocoding was successful
    if not location:
        return []

    lat = np.radians(location.latitude)
    lon = np.radians(location.longitude)
    distances = haversine(lat, lon, df["lat_rad"].values, df["lon_rad"].values)
    df["Distance_Miles"] = distances
    nearby = df[df["Distance_Miles"] <= radius_miles].sort_values("Distance_Miles")
    return nearby[["School Name", "State Name", "Total Students", "Distance_Miles"]].to_dict(orient="records")

# API endpoint
@app.route("/api/find-schools", methods=["GET"])
def api_find_schools():
    address = request.args.get("address")
    radius = float(request.args.get("radius", 5))
    if not address:
        return jsonify({"error": "Address is required"}), 400

    try:
        schools = find_nearby_schools(address, radius)
        return jsonify(schools)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)