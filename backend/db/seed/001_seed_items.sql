INSERT INTO items (id, name, category, price, in_stock) VALUES
  (1,  'Wireless Mouse',      'Electronics',  19.99, true),
  (2,  'Standing Desk',       'Furniture',   249.00, true),
  (3,  'USB-C Cable',         'Electronics',   9.99, false),
  (4,  'Office Chair',        'Furniture',   189.50, true),
  (5,  'Notebook',            'Stationery',    3.50, true),
  (6,  'Mechanical Keyboard', 'Electronics',  89.99, true),
  (7,  'Desk Lamp',           'Furniture',    34.00, false),
  (8,  'Pen Set',             'Stationery',   12.00, true),
  (9,  'Monitor Stand',       'Furniture',    45.00, true),
  (10, 'Webcam',              'Electronics',  59.99, true),
  (11, 'Sticky Notes',        'Stationery',    4.25, true),
  (12, 'External SSD',        'Electronics', 129.00, true)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('items', 'id'), (SELECT COALESCE(MAX(id), 1) FROM items));
