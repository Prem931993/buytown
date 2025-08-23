export async function seed(knex) {
  await knex('byt_roles').del();
  await knex('byt_roles').insert([
    { id: 1, name: 'admin' },
    { id: 2, name: 'customer' }
  ]);
};