exports.up = function(knex) {
  return knex.schema.createTable('stats', function(table) {
    table.increments('id').primary();
    table.integer('user').references('id').inTable('users').notNullable();
    table.timestamp('time').notNullable();
    table.boolean('finished').notNullable();
    table.boolean('inprogress').notNullable();
    table.boolean('impediments').notNullable();
  }).createTable('statuses', function(table) {
    table.increments('id').primary();
    table.integer('user').references('id').inTable('users').notNullable();
    table.timestamp('time').notNullable();
    table.integer('state').notNullable();
    table.string('status').notNullable();
    table.integer('stats').references('id').inTable('stats').notNullable();
  }).createTable('users', function(table) {
    table.increments('id').primary();
    table.string('nick').unique().notNullable();
    table.string('real_name').notNullable();
    table.boolean('disabled').defaultTo(0).notNullable();
  }).createTable('areas', function(table) {
    table.increments('id').primary();
    table.integer('user').unique().references('id').inTable('users').notNullable();
  }).createTable('calendar_today', function(table) {
    table.increments('id').primary();
    table.integer('user').references('id').inTable('users').notNullable();
    table.time('in_time');
    table.time('out_time');
    table.boolean('modified').notNullable();
    table.string('reason');
  }).createTable('mod_queue', function(table) {
    table.increments('id').primary();
    table.integer('user').references('id').inTable('users').notNullable();
    table.date('day').notNullable();
    table.time('in_time');
    table.time('out_time');
    table.boolean('absent');
    table.string('reason');
  });
};

exports.down = function(knex) {
  knex.schema.dropTable('stats');
  knex.schema.dropTable('statuses');
  knex.schema.dropTable('users');
};
