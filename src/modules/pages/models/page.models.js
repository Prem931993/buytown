import db from '../../../config/db.js';

const TABLE_NAME = 'byt_pages';

export const getAllPages = async () => {
  return await db(TABLE_NAME).select('*').orderBy('created_at', 'desc');
};

export const getPageById = async (id) => {
  return await db(TABLE_NAME).where({ id }).first();
};

export const getPageBySlug = async (slug) => {
  return await db(TABLE_NAME).where({ slug }).first();
};

export const createPage = async (pageData) => {
  const [result] = await db(TABLE_NAME).insert(pageData).returning('*');
  return result;
};

export const updatePage = async (id, pageData) => {
  const [result] = await db(TABLE_NAME).where({ id }).update({
    ...pageData,
    updated_at: db.fn.now()
  }).returning('*');
  return result;
};

export const deletePage = async (id) => {
  return await db(TABLE_NAME).where({ id }).del();
};

export const getPublishedPages = async () => {
  return await db(TABLE_NAME).where({ status: 'published' }).select('*').orderBy('created_at', 'desc');
};

export const getDraftPages = async () => {
  return await db(TABLE_NAME).where({ status: 'draft' }).select('*').orderBy('created_at', 'desc');
};
