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
      .insert({
        ...settingsData,
        selected_categories: settingsData.selected_categories || []
      })
      .returning('*');
    return inserted;
  }
};

export const getCategoriesByIds = async (categoryIds) => {
  if (!categoryIds || categoryIds.length === 0) {
    return [];
  }

  // Use CASE statement to maintain the order of categoryIds (PostgreSQL compatible)
  const whenClauses = categoryIds.map((id, index) =>
    `WHEN id = ${id} THEN ${index}`
  ).join(' ');

  const idsList = categoryIds.join(',');

  const query = `
    SELECT id, name, description, image
    FROM byt_categories
    WHERE id IN (${idsList})
    ORDER BY CASE ${whenClauses} END
  `;

  const result = await db.raw(query);
  return result.rows || [];
};
