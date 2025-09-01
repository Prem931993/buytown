export async function seed(knex) {
  await knex('byt_roles')
    .insert([
      { id: 1, name: 'admin' },
      { id: 2, name: 'user' },
      { id: 3, name: 'delivery_person' }
    ])
    .onConflict('id')
    .merge();
};
