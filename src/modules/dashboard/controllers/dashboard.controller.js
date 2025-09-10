import * as services from '../services/dashboard.services.js';

export async function getDashboardSummary(req, res) {
  try {
    const result = await services.getDashboardSummary();

    if (result.success) {
      res.json({
        success: true,
        data: {
          summary: result.summary
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getOrdersAwaitingConfirmationCount(req, res) {
  try {
    const result = await services.getOrdersAwaitingConfirmationCount();

    if (result.success) {
      res.json({
        success: true,
        data: {
          count: result.count
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getOrdersAwaitingConfirmationList(req, res) {
  try {
    const result = await services.getOrdersAwaitingConfirmationList();

    if (result.success) {
      res.json({
        success: true,
        data: {
          orders: result.orders
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getLowStockProducts(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await services.getLowStockProducts(limit);

    if (result.success) {
      res.json({
        success: true,
        data: {
          products: result.products
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getRecentSales(req, res) {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await services.getRecentSales(days);

    if (result.success) {
      res.json({
        success: true,
        data: {
          sales: result.sales
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getPopularProducts(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await services.getPopularProducts(limit);

    if (result.success) {
      res.json({
        success: true,
        data: {
          products: result.products
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getMostUsedDeliveryVehicles(req, res) {
  try {
    const result = await services.getMostUsedDeliveryVehicles();

    if (result.success) {
      res.json({
        success: true,
        data: {
          vehicles: result.vehicles
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getTotalProductsCount(req, res) {
  try {
    const result = await services.getTotalProductsCount();

    if (result.success) {
      res.json({
        success: true,
        count: result.count
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getTotalOrdersCount(req, res) {
  try {
    const result = await services.getTotalOrdersCount();

    if (result.success) {
      res.json({
        success: true,
        count: result.count
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getTotalUsersCount(req, res) {
  try {
    const result = await services.getTotalUsersCount();

    if (result.success) {
      res.json({
        success: true,
        count: result.count
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getTotalRevenue(req, res) {
  try {
    const result = await services.getTotalRevenue();

    if (result.success) {
      res.json({
        success: true,
        revenue: result.revenue
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getMonthlyRevenue(req, res) {
  try {
    const result = await services.getMonthlyRevenue();

    if (result.success) {
      res.json({
        success: true,
        revenue: result.revenue
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getOrderStatistics(req, res) {
  try {
    const result = await services.getOrderStatistics();

    if (result.success) {
      res.json({
        success: true,
        stats: result.stats
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getTopCustomers(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await services.getTopCustomers(limit);

    if (result.success) {
      res.json({
        success: true,
        customers: result.customers
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function getAllCustomersWithOrders(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await services.getAllCustomersWithOrders(limit);

    if (result.success) {
      res.json({
        success: true,
        customers: result.customers
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
