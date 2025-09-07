import * as pageService from '../services/page.services.js';

export const getPages = async (req, res) => {
  try {
    const pages = await pageService.getAllPages();
    res.status(200).json({
      success: true,
      pages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getPage = async (req, res) => {
  try {
    const page = await pageService.getPageById(req.params.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Page not found'
      });
    }
    res.status(200).json({
      success: true,
      page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getPageBySlug = async (req, res) => {
  try {
    const page = await pageService.getPageBySlug(req.params.slug);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Page not found'
      });
    }
    res.status(200).json({
      success: true,
      page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createPage = async (req, res) => {
  try {
    const pageData = req.body;
    const page = await pageService.createPage(pageData);
    res.status(201).json({
      success: true,
      message: 'Page created successfully',
      page
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const updatePage = async (req, res) => {
  try {
    const pageData = req.body;
    const page = await pageService.updatePage(req.params.id, pageData);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Page not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Page updated successfully',
      page
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const deletePage = async (req, res) => {
  try {
    const deleted = await pageService.deletePage(req.params.id);
    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        error: 'Page not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Page deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getPublishedPages = async (req, res) => {
  try {
    const pages = await pageService.getPublishedPages();
    res.status(200).json({
      success: true,
      pages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getDraftPages = async (req, res) => {
  try {
    const pages = await pageService.getDraftPages();
    res.status(200).json({
      success: true,
      pages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
