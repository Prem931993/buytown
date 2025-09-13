import * as pageModel from '../models/page.models.js';

export const getAllPages = async () => {
  return await pageModel.getAllPages();
};

export const getPageById = async (id) => {
  return await pageModel.getPageById(id);
};

export const getPageBySlug = async (slug) => {
  return await pageModel.getPageBySlug(slug);
};

export const getPublishedPageBySlug = async (slug) => {
  return await pageModel.getPublishedPageBySlug(slug);
};

export const createPage = async (pageData) => {
  // Validate required fields
  if (!pageData.title || !pageData.content) {
    throw new Error('Title and content are required');
  }

  // Generate slug from title if not provided
  if (!pageData.slug) {
    pageData.slug = generateSlug(pageData.title);
  }

  // Ensure slug is unique
  const existingPage = await pageModel.getPageBySlug(pageData.slug);
  if (existingPage) {
    // Append timestamp to make slug unique
    pageData.slug = `${pageData.slug}-${Date.now()}`;
  }

  // Set default status if not provided
  if (!pageData.status) {
    pageData.status = 'draft';
  }

  return await pageModel.createPage(pageData);
};

export const updatePage = async (id, pageData) => {
  // Validate required fields
  if (!pageData.title || !pageData.content) {
    throw new Error('Title and content are required');
  }

  // Generate new slug if title changed and slug not provided
  if (!pageData.slug && pageData.title) {
    pageData.slug = generateSlug(pageData.title);

    // Ensure slug is unique (excluding current page)
    const existingPage = await pageModel.getPageBySlug(pageData.slug);
    if (existingPage && existingPage.id !== parseInt(id)) {
      pageData.slug = `${pageData.slug}-${Date.now()}`;
    }
  }

  return await pageModel.updatePage(id, pageData);
};

export const deletePage = async (id) => {
  return await pageModel.deletePage(id);
};

export const getPublishedPages = async () => {
  return await pageModel.getPublishedPages();
};

export const getDraftPages = async () => {
  return await pageModel.getDraftPages();
};

// Helper function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};
