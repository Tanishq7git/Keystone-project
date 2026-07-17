-- ============================================================
-- Project KEYSTONE — demo seed data
-- All seed users share the password:  Password123!
-- ============================================================

-- ---------- Customers ----------
INSERT INTO customers (name, contact_email, phone) VALUES
 ('Oakwood Business Park',   'ops@oakwoodpark.example',    '+1-555-0101'),
 ('Riverside Mall Group',    'facilities@riversidemall.example', '+1-555-0102'),
 ('Summit Tower Offices',    'admin@summittower.example',  '+1-555-0103');

-- ---------- Sites ----------
INSERT INTO sites (customer_id, name, address) VALUES
 (1, 'Oakwood - Building A',        '100 Oakwood Ave, Springfield'),
 (1, 'Oakwood - Building B',        '104 Oakwood Ave, Springfield'),
 (2, 'Riverside Mall - East Wing',  '55 Riverside Blvd, Springfield'),
 (2, 'Riverside Mall - West Wing',  '57 Riverside Blvd, Springfield'),
 (3, 'Summit Tower - Floors 1-10',  '900 Summit St, Springfield'),
 (3, 'Summit Tower - Floors 11-20', '900 Summit St, Springfield');

-- ---------- Users (password hash = "Password123!") ----------
INSERT INTO users (name, email, password_hash, role, customer_id) VALUES
 ('Dana Dispatcher', 'dispatcher@keystone.dev', '$2b$10$NVKmIkeK5NzTyRoej5x37eqI/Av/UOfYWw2qK2aeAIIDDkcudxmqK', 'DISPATCHER', NULL),
 ('Morgan Manager',  'manager@keystone.dev',    '$2b$10$NVKmIkeK5NzTyRoej5x37eqI/Av/UOfYWw2qK2aeAIIDDkcudxmqK', 'MANAGER',    NULL),
 ('Alex Rivera',     'tech1@keystone.dev',      '$2b$10$NVKmIkeK5NzTyRoej5x37eqI/Av/UOfYWw2qK2aeAIIDDkcudxmqK', 'TECHNICIAN', NULL),
 ('Sam Chen',        'tech2@keystone.dev',      '$2b$10$NVKmIkeK5NzTyRoej5x37eqI/Av/UOfYWw2qK2aeAIIDDkcudxmqK', 'TECHNICIAN', NULL),
 ('Jordan Blake',    'customer@keystone.dev',   '$2b$10$NVKmIkeK5NzTyRoej5x37eqI/Av/UOfYWw2qK2aeAIIDDkcudxmqK', 'CUSTOMER',   1);

-- ---------- Parts ----------
INSERT INTO parts (name, sku, unit_cost, stock_qty) VALUES
 ('HVAC Air Filter 20x25',      'SKU-HVAC-001', 18.50, 120),
 ('Copper Pipe Fitting 1/2in',  'SKU-PLM-014',  6.75,  300),
 ('Circuit Breaker 20A',        'SKU-ELE-020',  22.00, 60),
 ('Refrigerant R410A (lb)',     'SKU-HVAC-410', 14.25, 200),
 ('Wiring Cable Roll 100ft',    'SKU-ELE-100',  45.00, 40),
 ('Drain Pump Motor',           'SKU-PLM-077',  89.99, 15);

-- ---------- Work Orders ----------
-- #1 URGENT, IN_PROGRESS
INSERT INTO work_orders (code, title, description, priority, status, sla_due_at, customer_id, site_id, assigned_to, created_by, created_at, updated_at) VALUES
 ('WO-2026-00001', 'AC unit not cooling - Floor 3', 'Tenants report the rooftop AC unit serving floor 3 is blowing warm air.', 'URGENT', 'IN_PROGRESS',
  now() - interval '2 hours' + interval '4 hours', 1, 1, 3, 1, now() - interval '2 hours', now() - interval '20 minutes');

-- #2 HIGH, ASSIGNED
INSERT INTO work_orders (code, title, description, priority, status, sla_due_at, customer_id, site_id, assigned_to, created_by, created_at, updated_at) VALUES
 ('WO-2026-00002', 'Leaking pipe under sink - Break room', 'Slow leak under the break-room sink, water pooling on floor.', 'HIGH', 'ASSIGNED',
  now() - interval '5 hours' + interval '24 hours', 1, 2, 4, 1, now() - interval '5 hours', now() - interval '4 hours');

-- #3 MEDIUM, NEW
INSERT INTO work_orders (code, title, description, priority, status, sla_due_at, customer_id, site_id, assigned_to, created_by, created_at, updated_at) VALUES
 ('WO-2026-00003', 'Flickering lights - East wing corridor', 'Overhead lighting in the main east corridor flickers intermittently.', 'MEDIUM', 'NEW',
  now() - interval '1 day' + interval '72 hours', 2, 3, NULL, 1, now() - interval '1 day', now() - interval '1 day');

-- #4 LOW, COMPLETED
INSERT INTO work_orders (code, title, description, priority, status, sla_due_at, customer_id, site_id, assigned_to, created_by, created_at, updated_at, completed_at) VALUES
 ('WO-2026-00004', 'Quarterly HVAC filter replacement', 'Scheduled quarterly filter swap for west wing air handlers.', 'LOW', 'COMPLETED',
  now() - interval '6 days' + interval '168 hours', 2, 4, 3, 2, now() - interval '6 days', now() - interval '1 day', now() - interval '1 day');

-- #5 HIGH, ON_HOLD
INSERT INTO work_orders (code, title, description, priority, status, sla_due_at, customer_id, site_id, assigned_to, created_by, created_at, updated_at) VALUES
 ('WO-2026-00005', 'Circuit breaker tripping repeatedly', 'Panel B breaker 14 trips several times a day, needs investigation.', 'HIGH', 'ON_HOLD',
  now() - interval '2 days' + interval '24 hours', 3, 5, 4, 1, now() - interval '2 days', now() - interval '1 day');

-- #6 MEDIUM, CLOSED
INSERT INTO work_orders (code, title, description, priority, status, sla_due_at, customer_id, site_id, assigned_to, created_by, created_at, updated_at, completed_at, closed_at) VALUES
 ('WO-2026-00006', 'Elevator lobby thermostat malfunction', 'Thermostat in the 15th floor lobby stuck reading 90F.', 'MEDIUM', 'CLOSED',
  now() - interval '10 days' + interval '72 hours', 3, 6, 3, 2, now() - interval '10 days', now() - interval '7 days', now() - interval '8 days', now() - interval '7 days');

-- #7 HIGH, NEW (raised by the customer portal user)
INSERT INTO work_orders (code, title, description, priority, status, sla_due_at, customer_id, site_id, assigned_to, created_by, created_at, updated_at) VALUES
 ('WO-2026-00007', 'Water heater pilot light out', 'Pilot light on the building A water heater will not stay lit.', 'HIGH', 'NEW',
  now() - interval '3 hours' + interval '24 hours', 1, 1, NULL, 5, now() - interval '3 hours', now() - interval '3 hours');

-- #8 LOW, ASSIGNED
INSERT INTO work_orders (code, title, description, priority, status, sla_due_at, customer_id, site_id, assigned_to, created_by, created_at, updated_at) VALUES
 ('WO-2026-00008', 'Emergency generator monthly test', 'Routine monthly run-test of the backup generator.', 'LOW', 'ASSIGNED',
  now() - interval '12 hours' + interval '168 hours', 2, 3, 4, 2, now() - interval '12 hours', now() - interval '10 hours');

-- #9 MEDIUM, CANCELLED
INSERT INTO work_orders (code, title, description, priority, status, sla_due_at, customer_id, site_id, assigned_to, created_by, created_at, updated_at) VALUES
 ('WO-2026-00009', 'Restroom exhaust fan not working', 'Reported fan noise complaint - resolved to be a non-issue, tenant relocated.', 'MEDIUM', 'CANCELLED',
  now() - interval '4 days' + interval '72 hours', 3, 5, NULL, 1, now() - interval '4 days', now() - interval '3 days');

-- #10 URGENT, IN_PROGRESS (near/at breach for demo)
INSERT INTO work_orders (code, title, description, priority, status, sla_due_at, customer_id, site_id, assigned_to, created_by, created_at, updated_at) VALUES
 ('WO-2026-00010', 'Loading dock door sensor fault', 'Dock door 2 safety sensor is not retracting the door, blocking deliveries.', 'URGENT', 'IN_PROGRESS',
  now() - interval '1 hour' + interval '2 hours', 1, 2, 3, 1, now() - interval '1 hour', now() - interval '10 minutes');

-- ---------- Status history ----------
INSERT INTO work_order_status_history (work_order_id, from_status, to_status, changed_by, changed_at, note) VALUES
 (1, NULL, 'NEW',         1, now() - interval '2 hours',            'Reported via dispatcher intake call.'),
 (1, 'NEW', 'ASSIGNED',   1, now() - interval '110 minutes',        'Assigned to Alex Rivera.'),
 (1, 'ASSIGNED', 'IN_PROGRESS', 3, now() - interval '20 minutes',   'On site, starting diagnostics.'),

 (2, NULL, 'NEW',         1, now() - interval '5 hours',            'Logged from break-room report.'),
 (2, 'NEW', 'ASSIGNED',   1, now() - interval '4 hours',            'Assigned to Sam Chen.'),

 (3, NULL, 'NEW',         1, now() - interval '1 day',              'Logged from tenant email.'),

 (4, NULL, 'NEW',         2, now() - interval '6 days',             'Scheduled maintenance created.'),
 (4, 'NEW', 'ASSIGNED',   2, now() - interval '6 days',             'Assigned to Alex Rivera.'),
 (4, 'ASSIGNED', 'IN_PROGRESS', 3, now() - interval '5 days',       'Started filter swap.'),
 (4, 'IN_PROGRESS', 'COMPLETED', 3, now() - interval '1 day',       'All filters replaced, unit tested.'),

 (5, NULL, 'NEW',         1, now() - interval '2 days',             'Logged from facilities call.'),
 (5, 'NEW', 'ASSIGNED',   1, now() - interval '2 days',             'Assigned to Sam Chen.'),
 (5, 'ASSIGNED', 'IN_PROGRESS', 4, now() - interval '2 days',       'Investigating panel B.'),
 (5, 'IN_PROGRESS', 'ON_HOLD', 4, now() - interval '1 day',         'Waiting on replacement breaker part.'),

 (6, NULL, 'NEW',         2, now() - interval '10 days',            'Logged from lobby report.'),
 (6, 'NEW', 'ASSIGNED',   2, now() - interval '10 days',            'Assigned to Alex Rivera.'),
 (6, 'ASSIGNED', 'IN_PROGRESS', 3, now() - interval '9 days',       'Recalibrating thermostat.'),
 (6, 'IN_PROGRESS', 'COMPLETED', 3, now() - interval '8 days',      'Thermostat recalibrated and tested.'),
 (6, 'COMPLETED', 'CLOSED', 2, now() - interval '7 days',           'Signed off, tenant confirmed comfortable temperature.'),

 (7, NULL, 'NEW',         5, now() - interval '3 hours',            'Submitted via customer portal.'),

 (8, NULL, 'NEW',         2, now() - interval '12 hours',           'Scheduled monthly generator test.'),
 (8, 'NEW', 'ASSIGNED',   2, now() - interval '10 hours',           'Assigned to Sam Chen.'),

 (9, NULL, 'NEW',         1, now() - interval '4 days',             'Logged from tenant complaint.'),
 (9, 'NEW', 'CANCELLED',  1, now() - interval '3 days',             'Tenant relocated, issue moot.'),

 (10, NULL, 'NEW',        1, now() - interval '1 hour',             'Logged as urgent - blocking deliveries.'),
 (10, 'NEW', 'ASSIGNED',  1, now() - interval '55 minutes',         'Assigned to Alex Rivera.'),
 (10, 'ASSIGNED', 'IN_PROGRESS', 3, now() - interval '10 minutes',  'On site, inspecting sensor wiring.');

-- ---------- Part usage (transactional line items) ----------
INSERT INTO part_usage (work_order_id, part_id, qty_used, used_at, logged_by) VALUES
 (4, 1, 6, now() - interval '5 days', 3),
 (5, 3, 1, now() - interval '1 day',  4),
 (6, 3, 1, now() - interval '9 days', 3);

UPDATE parts SET stock_qty = stock_qty - 6 WHERE id = 1;
UPDATE parts SET stock_qty = stock_qty - 2 WHERE id = 3;

-- ---------- Time logs ----------
INSERT INTO time_logs (work_order_id, technician_id, minutes, note, logged_at) VALUES
 (1, 3, 25, 'Initial diagnostics on rooftop unit.', now() - interval '15 minutes'),
 (4, 3, 90, 'Filter replacement across all air handlers.', now() - interval '5 days'),
 (5, 4, 40, 'Traced fault to worn breaker.', now() - interval '1 day'),
 (6, 3, 60, 'Recalibrated and load-tested thermostat.', now() - interval '9 days'),
 (10, 3, 15, 'Inspecting dock door sensor wiring.', now() - interval '8 minutes');

-- ---------- Notifications ----------
INSERT INTO notifications (target_role, target_user_id, message, work_order_id, is_read, created_at) VALUES
 ('MANAGER', NULL, 'Work order WO-2026-00010 is approaching its SLA due time.', 10, FALSE, now() - interval '5 minutes'),
 ('MANAGER', NULL, 'Work order WO-2026-00005 is on hold pending parts.', 5, TRUE, now() - interval '1 day');
