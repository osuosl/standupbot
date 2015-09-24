exports.up = function(knex) {
  return knex.schema.createTable('stats', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.timestamp('time').notNullable();
    table.boolean('finished').notNullable();
    table.boolean('inprogress').notNullable();
    table.boolean('impediments').notNullable();
  }).createTable('statuses', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.timestamp('time').notNullable();
    table.integer('state').notNullable();
    table.string('status').notNullable();
    table.integer('stats').references('id').inTable('stats').notNullable();
  });
};

exports.down = function(knex) {
  knex.schema.dropTable('stats');
  knex.schema.dropTable('statuses');
};