import db from '../../../config/db.js';

// Get delivery person profile
export async function getDeliveryPersonProfile(deliveryPersonId) {
  try {
    const user = await db('byt_users')
      .select(
        'id',
        'firstname',
        'lastname',
        'email',
        'phone_no',
        'license',
        'role_id',
        'status'
      )
      .where('id', deliveryPersonId)
      .where('role_id', 3) // Assuming role_id 3 is delivery person
      .first();

    if (!user) {
      return { success: false, error: 'Delivery person not found' };
    }

    // Get user's vehicles
    const vehicles = await db('byt_user_vehicle')
      .leftJoin('byt_vehicle_management', 'byt_user_vehicle.vehicle_id', 'byt_vehicle_management.id')
      .select(
        'byt_user_vehicle.id',
        'byt_user_vehicle.vehicle_id',
        'byt_user_vehicle.vehicle_number',
        'byt_vehicle_management.vehicle_type'
      )
      .where('byt_user_vehicle.user_id', deliveryPersonId);

    return {
      success: true,
      profile: {
        ...user,
        vehicles: vehicles
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Update delivery person profile
export async function updateDeliveryPersonProfile(deliveryPersonId, profileData) {
  try {
    const { firstname, lastname, email, license, vehicles } = profileData;

    // Update user profile
    const updateData = {};
    if (firstname !== undefined) updateData.firstname = firstname;
    if (lastname !== undefined) updateData.lastname = lastname;
    if (email !== undefined) updateData.email = email;
    if (license !== undefined) updateData.license = license;

    if (Object.keys(updateData).length > 0) {
      await db('byt_users')
        .where('id', deliveryPersonId)
        .where('role_id', 3)
        .update(updateData);
    }

    // Update vehicles if provided
    if (vehicles && Array.isArray(vehicles)) {
      // First, remove existing vehicles
      await db('byt_user_vehicle').where('user_id', deliveryPersonId).del();

      // Insert new vehicles
      if (vehicles.length > 0) {
        const vehicleInserts = vehicles.map(vehicle => ({
          user_id: deliveryPersonId,
          vehicle_id: vehicle.vehicle_id,
          vehicle_number: vehicle.vehicle_number
        }));

        await db('byt_user_vehicle').insert(vehicleInserts);
      }
    }

    // Return updated profile
    return await getDeliveryPersonProfile(deliveryPersonId);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get all available vehicles
export async function getAvailableVehicles() {
  try {
    const vehicles = await db('byt_vehicle_management')
      .select('id', 'vehicle_type')
      .orderBy('vehicle_type');

    return { success: true, vehicles };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
