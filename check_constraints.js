import knex from './src/config/db.js';

async function checkConstraints() {
  try {
    console.log('Checking constraints for byt_products table...');
    
    // Get table information
    const tableInfo = await knex.raw(`
      SELECT column_name, is_nullable, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'byt_products'
      ORDER BY ordinal_position
    `);
    
    console.log('Table columns:');
    console.table(tableInfo.rows);
    
    // Check constraints
    const constraints = await knex.raw(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'byt_products'
      AND constraint_type = 'CHECK'
    `);
    
    console.log('Check constraints:');
    console.table(constraints.rows);
    
    // Get constraint details
    const constraintDetails = await knex.raw(`
      SELECT pgc.conname AS constraint_name,
             pg_get_constraintdef(pgc.oid) AS constraint_definition
      FROM pg_constraint pgc
      JOIN pg_namespace nsp ON nsp.oid = pgc.connamespace
      JOIN pg_class cls ON pgc.conrelid = cls.oid
      WHERE cls.relname = 'byt_products'
      AND pgc.contype = 'c'
    `);
    
    console.log('Constraint details:');
    console.table(constraintDetails.rows);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await knex.destroy();
  }
}

checkConstraints();