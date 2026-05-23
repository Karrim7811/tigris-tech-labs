-- Reconciled from prod 2026-05-23 (originally applied 2026-05-16).
drop view if exists vw_contacts_unified;
create view vw_contacts_unified as
select
  c.id, c.workspace_id, c.full_name, c.emails, c.phones, c.category, c.lifecycle_stage,
  c.tags, c.relationship_score, c.prospect_source, c.source, c.language, c.notes,
  c.last_touch_at, c.created_at,
  c.temperature, c.priority, c.last_activity_at,
  (select count(*) from buyers b where b.contact_id = c.id) as buyer_deals,
  (select count(*) from listings l where l.seller_contact_id = c.id) as seller_listings,
  (select count(*) from grid_signals g where g.contact_id = c.id) as linked_grid_signals,
  (select count(*) from sphere_signals s where s.contact_id = c.id and s.resolved = false) as open_sphere_signals,
  (select count(*) from opportunities o where o.contact_id = c.id and o.stage not in ('won','lost')) as open_opportunities
from contacts c;
