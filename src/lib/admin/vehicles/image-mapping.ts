/**
 * Vehicle Image Mapping
 * Maps vehicle names to image URLs using Unsplash placeholder images
 * These are high-quality placeholder images that match vehicle types
 */

export const VEHICLE_IMAGE_MAP: Record<string, string> = {
  // Buses
  "DAEWOO BUS": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop",
  "MAXIMA BUS": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop",
  "VOLVO BUS": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop",
  "NEW ROSA": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop",
  "OLD ROSA": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop",
  "BUS 1": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop",
  "SCHOOL BUS 01": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop",
  "SCHOOL BUS 02": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop",
  
  // Vans
  "ISUZU ELF": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
  "ISUZU TRAVIS": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
  "TOYOTA COASTER": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
  "STAREX GOLD": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
  "TOYOTA GRANDIA": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
  "TOYOTA HIACE": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
  "MITSUBISHI ADVENTURE": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
  "NISSAN URVAN": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
  "ISUZU CROSSWIND": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
  "VAN 1": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
  "VAN 2": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
  
  // Cars
  "INNOVA RED": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop",
  "INNOVA WHITE": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop",
  "INNOVA BLACKISH RED": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop",
  "INNOVA SILVER": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop",
  "TOYOTA ZENIX": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop",
  "CAR 3": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop",
  
  // Generic fallbacks by type
  "BUS": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop",
  "VAN": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
  "CAR": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop",
  "SUV": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop",
  "MOTORCYCLE": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=600&fit=crop",
};

/**
 * Get image URL for a vehicle based on its name
 */
export function getVehicleImageUrl(vehicleName: string, vehicleType?: string): string {
  // Try exact match first
  if (VEHICLE_IMAGE_MAP[vehicleName]) {
    return VEHICLE_IMAGE_MAP[vehicleName];
  }
  
  // Try case-insensitive match
  const upperName = vehicleName.toUpperCase();
  if (VEHICLE_IMAGE_MAP[upperName]) {
    return VEHICLE_IMAGE_MAP[upperName];
  }
  
  // Try partial match (e.g., "DAEWOO" in "DAEWOO BUS")
  for (const [key, url] of Object.entries(VEHICLE_IMAGE_MAP)) {
    if (upperName.includes(key) || key.includes(upperName)) {
      return url;
    }
  }
  
  // Fallback to type-based default
  if (vehicleType) {
    const typeUpper = vehicleType.toUpperCase();
    if (VEHICLE_IMAGE_MAP[typeUpper]) {
      return VEHICLE_IMAGE_MAP[typeUpper];
    }
  }
  
  // Ultimate fallback
  return "/vehicles/default-vehicle.jpg";
}

/**
 * Generate image URLs for all vehicles in database
 * Returns SQL UPDATE statements
 */
export function generateVehicleImageUpdates(vehicles: Array<{ id: string; vehicle_name: string; type: string }>): string {
  const updates = vehicles.map(v => {
    const imageUrl = getVehicleImageUrl(v.vehicle_name, v.type);
    return `UPDATE vehicles SET photo_url = '${imageUrl}' WHERE id = '${v.id}';`;
  });
  return updates.join('\n');
}

