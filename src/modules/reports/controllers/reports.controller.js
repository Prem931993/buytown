// Get top products
export async function getTopProducts(req, res) {
  try {
    const { limit = 10, timeRange = 'last30days' } = req.query;

    const result = await import('../services/reports.services.js').then(module =>
      module.getTopProductsService({ limit: parseInt(limit), timeRange })
    );

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      products: result.products
    });
  } catch (error) {
    console.error('Error in getTopProducts:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get top categories
export async function getTopCategories(req, res) {
  try {
    const { limit = 10, timeRange = 'last30days' } = req.query;

    const result = await import('../services/reports.services.js').then(module =>
      module.getTopCategoriesService({ limit: parseInt(limit), timeRange })
    );

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      categories: result.categories
    });
  } catch (error) {
    console.error('Error in getTopCategories:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get sales by region
export async function getSalesByRegion(req, res) {
  try {
    const { limit = 10, timeRange = 'last30days' } = req.query;

    const result = await import('../services/reports.services.js').then(module =>
      module.getSalesByRegionService({ limit: parseInt(limit), timeRange })
    );

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      regions: result.regions
    });
  } catch (error) {
    console.error('Error in getSalesByRegion:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get dashboard summary
export async function getDashboardSummary(req, res) {
  try {
    const { timeRange = 'last30days' } = req.query;

    const result = await import('../services/reports.services.js').then(module =>
      module.getDashboardSummaryService({ timeRange })
    );

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      summary: result.summary
    });
  } catch (error) {
    console.error('Error in getDashboardSummary:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get payment methods distribution
export async function getPaymentMethodsDistribution(req, res) {
  try {
    const { timeRange = 'last30days' } = req.query;

    const result = await import('../services/reports.services.js').then(module =>
      module.getPaymentMethodsDistributionService({ timeRange })
    );

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      paymentMethods: result.paymentMethods
    });
  } catch (error) {
    console.error('Error in getPaymentMethodsDistribution:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get order status distribution
export async function getOrderStatusDistribution(req, res) {
  try {
    const { timeRange = 'last30days' } = req.query;

    const result = await import('../services/reports.services.js').then(module =>
      module.getOrderStatusDistributionService({ timeRange })
    );

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      orderStatuses: result.orderStatuses
    });
  } catch (error) {
    console.error('Error in getOrderStatusDistribution:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}

// Get comprehensive reports data
export async function getComprehensiveReports(req, res) {
  try {
    const { timeRange = 'last30days', limit = 10 } = req.query;

    const result = await import('../services/reports.services.js').then(module =>
      module.getComprehensiveReportsService({ timeRange, limit: parseInt(limit) })
    );

    if (result.error) {
      return res.status(result.status).json({ statusCode: result.status, error: result.error });
    }

    res.status(result.status).json({
      statusCode: result.status,
      reports: result.reports
    });
  } catch (error) {
    console.error('Error in getComprehensiveReports:', error);
    res.status(500).json({ statusCode: 500, error: 'Internal server error' });
  }
}
