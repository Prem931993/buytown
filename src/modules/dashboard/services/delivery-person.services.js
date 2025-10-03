import * as models from '../models/delivery-person.models.js';

export async function getDeliveryPersonProfile(deliveryPersonId) {
  return await models.getDeliveryPersonProfile(deliveryPersonId);
}

export async function updateDeliveryPersonProfile(deliveryPersonId, profileData) {
  return await models.updateDeliveryPersonProfile(deliveryPersonId, profileData);
}

export async function getAvailableVehicles() {
  return await models.getAvailableVehicles();
}
