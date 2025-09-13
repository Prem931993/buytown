import db from '../../../config/db.js';

const TABLE_NAME = 'byt_general_settings';

export const getSettings = async () => {
  return await db(TABLE_NAME).first();
};

export const upsertSettings = async (settingsData) => {
  const existing = await getSettings();
  if (existing) {
    const [updated] = await db(TABLE_NAME)
      .where({ id: existing.id })
      .update({
        ...settingsData,
        updated_at: db.fn.now()
      })
      .returning('*');
    return updated;
  } else {
    const [inserted] = await db(TABLE_NAME)
      .insert(settingsData)
      .returning('*');
    return inserted;
  }
};

export const getCategoriesByIds = async (categoryIds) => {
  if (!categoryIds || categoryIds.length === 0) {
    return [];
  }

  return await db('byt_categories')
    .whereIn('id', categoryIds)
    .select('id', 'name', 'description', 'image')
    .orderBy('name');
};
