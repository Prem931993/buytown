import * as deliveryModel from '../models/delivery.models.js';

export async function getAllDeliverySettings(req, res) {
  try {
    const settings = await deliveryModel.getAllDeliverySettings();
    res.json({ settings, statusCode: 200 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch delivery settings', statusCode: 500 });
  }
}

export async function getDeliverySettings(req, res) {
  try {
    const settings = await deliveryModel.getDeliverySettings();
    res.json(settings || { center_point: '', delivery_radius_km: 10 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch delivery settings' });
  }
}

export async function createDeliverySetting(req, res) {
  try {
    const { center_point, delivery_radius_km } = req.body;

    if (!center_point || !delivery_radius_km) {
      return res.status(400).json({
        error: 'center_point and delivery_radius_km are required',
        statusCode: 400
      });
    }

    const [newSetting] = await deliveryModel.createDeliverySetting({
      center_point,
      delivery_radius_km,
      is_active: true
    });

    res.status(201).json({ setting: newSetting, statusCode: 201 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create delivery setting', statusCode: 500 });
  }
}

export async function updateDeliverySetting(req, res) {
  try {
    const { id } = req.params;
    const { center_point, delivery_radius_km, is_active } = req.body;

    if (!center_point || !delivery_radius_km) {
      return res.status(400).json({
        error: 'center_point and delivery_radius_km are required',
        statusCode: 400
      });
    }

    const updateData = {
      center_point,
      delivery_radius_km,
      updated_at: new Date()
    };

    // Include is_active in update if provided
    if (typeof is_active === 'boolean') {
      updateData.is_active = is_active;
    }

    const [updatedSetting] = await deliveryModel.updateDeliverySetting(id, updateData);

    if (!updatedSetting) {
      return res.status(404).json({ error: 'Delivery setting not found', statusCode: 404 });
    }

    res.json({ setting: updatedSetting, statusCode: 200 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update delivery setting', statusCode: 500 });
  }
}

export async function deleteDeliverySetting(req, res) {
  try {
    const { id } = req.params;
    const [deletedSetting] = await deliveryModel.deleteDeliverySetting(id);

    if (!deletedSetting) {
      return res.status(404).json({ error: 'Delivery setting not found', statusCode: 404 });
    }

    res.json({ message: 'Delivery setting deleted successfully', statusCode: 200 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete delivery setting', statusCode: 500 });
  }
}

export async function updateDeliverySettings(req, res) {
  try {
    const settings = req.body;

    if (!Array.isArray(settings)) {
      return res.status(400).json({ error: 'Settings must be an array', statusCode: 400 });
    }

    const updatedSettings = await deliveryModel.updateDeliverySettings(settings);
    res.json({ settings: updatedSettings, statusCode: 200 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update delivery settings', statusCode: 500 });
  }
}
