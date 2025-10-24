import * as vehicleModel from '../models/vehicle.models.js';

export async function getVehicles(req, res) {
  try {
    const vehicles = await vehicleModel.getAllVehicles();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
}

export async function getVehiclesWithDeliveryPersons(req, res) {
  try {
    const vehicles = await vehicleModel.getVehiclesWithDeliveryPersonCount();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles with delivery persons' });
  }
}

export async function getVehicle(req, res) {
  try {
    const vehicle = await vehicleModel.getVehicleById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
}

export async function createVehicle(req, res) {
  try {
    const [newVehicle] = await vehicleModel.createVehicle(req.body);
    res.status(201).json(newVehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
}

export async function updateVehicle(req, res) {
  try {
    const [updatedVehicle] = await vehicleModel.updateVehicle(req.params.id, req.body);
    if (!updatedVehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(updatedVehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
}

export async function deleteVehicle(req, res) {
  try {
    await vehicleModel.deleteVehicle(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
}

export async function calculateDeliveryCharge(req, res) {
  try {
    const { vehicleId, distanceKm } = req.body;

    if (!vehicleId || !distanceKm) {
      return res.status(400).json({
        error: 'vehicleId and distanceKm are required'
      });
    }

    const chargeDetails = await vehicleModel.calculateDeliveryCharge(vehicleId, parseFloat(distanceKm));
    res.json(chargeDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


