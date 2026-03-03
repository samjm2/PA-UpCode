import pandas as pd
import numpy as np
from geopy.geocoders import Nominatim

# Load once (outside the function)
df = pd.read_csv("data/public-schools.csv")

# Convert to radians once
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
def find_nearby_schools(address, radius_miles=5):
    # Geocode the address to get latitude and longitude
    geolocator = Nominatim(user_agent="school_finder")
    location = geolocator.geocode(address)
    # Verify if the geocoding was successful
    if not location:
        print("Address not found.")
        return pd.DataFrame()

    lat = np.radians(location.latitude)
    lon = np.radians(location.longitude)

    # Calculate distances to all schools
    distances = haversine(
        lat,
        lon,
        df["lat_rad"].values,
        df["lon_rad"].values
    )
    # Add distances to the DataFrame
    df["Distance_Miles"] = distances

    # Filter schools within the specified radius and sort by distance
    return (
        df[df["Distance_Miles"] <= radius_miles]
        .sort_values("Distance_Miles")
        [["School Name", "State Name", "Total Students", "Distance_Miles"]]
    )

# Example usage
address = input("Enter an address: ")
result = find_nearby_schools(address)
if not result.empty:
    print(f"\nFound {len(result)} schools within 5 miles.")
    # Save to CSV
    csv = "nearby-schools.csv"
    result.to_csv(csv, index=False)
    print(f"Results saved to {csv}")
else:
    print("No schools found within the radius.")