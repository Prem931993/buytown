import * as deliveryModel from '../models/delivery.models.js';

export async function getDeliverySettings(req, res) {
  try {
    const settings = await deliveryModel.getDeliverySettings();
    res.json(settings || { center_point: '', delivery_radius_km: 10 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch delivery settings' });
  }
}

export async function updateDeliverySettings(req, res) {
  try {
    const [updatedSettings] = await deliveryModel.updateDeliverySettings(req.body);
    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update delivery settings' });
  }
}
