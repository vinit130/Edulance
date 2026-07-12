import * as Location from "expo-location";

/**
 * Ask user for location permission
 */
export async function requestLocationPermission() {
  const { status } =
    await Location.requestForegroundPermissionsAsync();

  return status === "granted";
}

/**
 * Get current GPS coordinates
 */
export async function getCurrentLocation() {
  const hasPermission = await requestLocationPermission();

  if (!hasPermission) {
    throw new Error("Location permission denied");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

/**
 * Convert latitude & longitude to readable address
 */
export async function getAddressFromCoordinates(
  latitude,
  longitude
) {
  try {
    const address =
      await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

    if (address.length === 0) {
      return {
        city: "",
        address: "",
      };
    }

    const place = address[0];

    return {
      city:
        place.city ||
        place.subregion ||
        place.region ||
        "",

      address: [
        place.name,
        place.street,
        place.city,
        place.region,
      ]
        .filter(Boolean)
        .join(", "),
    };
  } 
  
  catch (error) {
    return {
      city: "",
      address: "",
    };
  }
}

/**
 * Distance between two locations (KM)
 */
export function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}