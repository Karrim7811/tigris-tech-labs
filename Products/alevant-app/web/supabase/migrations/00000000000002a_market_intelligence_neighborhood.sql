alter table if exists grid_signals add column if not exists property_neighborhood text;
create index if not exists grid_signals_neighborhood_idx on grid_signals(property_neighborhood);
