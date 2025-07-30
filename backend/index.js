const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// SQLite setup
const db = new sqlite3.Database(path.join(__dirname, 'pos.db'));

db.serialize(() => {
  // Users table for authentication
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'cashier')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    image TEXT,
    description TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    visits INTEGER DEFAULT 0,
    free_item_eligible BOOLEAN DEFAULT 0
  )`);

  // Add visits and free_item_eligible columns if they don't exist
  db.run("PRAGMA table_info(customers)", [], (err, rows) => {
    if (err) {
      console.error('Error checking customers table schema:', err);
      return;
    }
    if (rows && Array.isArray(rows)) {
      const hasVisits = rows.some(row => row.name === 'visits');
      const hasFreeItemEligible = rows.some(row => row.name === 'free_item_eligible');
      if (!hasVisits) {
        db.run("ALTER TABLE customers ADD COLUMN visits INTEGER DEFAULT 0");
      }
      if (!hasFreeItemEligible) {
        db.run("ALTER TABLE customers ADD COLUMN free_item_eligible BOOLEAN DEFAULT 0");
      }
    }
  });

  // Rewards system tables
  db.run(`CREATE TABLE IF NOT EXISTS customer_rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER UNIQUE NOT NULL,
    points_balance INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    total_points_redeemed INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'bronze',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS point_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    order_id INTEGER,
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('earned', 'redeemed', 'expired', 'bonus')),
    points INTEGER NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id),
    FOREIGN KEY (order_id) REFERENCES orders (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reward_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    min_points INTEGER DEFAULT 0,
    points_per_rs REAL DEFAULT 1.0,
    redemption_rate REAL DEFAULT 0.01, -- Rs. per point
    discount_percentage REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert default reward tiers
  db.get('SELECT * FROM reward_tiers WHERE name = ?', ['Bronze'], (err, row) => {
    if (!row) {
      db.run(`INSERT INTO reward_tiers (name, min_points, points_per_rs, redemption_rate, discount_percentage) 
              VALUES (?, ?, ?, ?, ?)`, 
        ['Bronze', 0, 1.0, 0.01, 0]);
    }
  });

  db.get('SELECT * FROM reward_tiers WHERE name = ?', ['Silver'], (err, row) => {
    if (!row) {
      db.run(`INSERT INTO reward_tiers (name, min_points, points_per_rs, redemption_rate, discount_percentage) 
              VALUES (?, ?, ?, ?, ?)`, 
        ['Silver', 1000, 1.2, 0.015, 5]);
    }
  });

  db.get('SELECT * FROM reward_tiers WHERE name = ?', ['Gold'], (err, row) => {
    if (!row) {
      db.run(`INSERT INTO reward_tiers (name, min_points, points_per_rs, redemption_rate, discount_percentage) 
              VALUES (?, ?, ?, ?, ?)`, 
        ['Gold', 5000, 1.5, 0.02, 10]);
    }
  });

  db.get('SELECT * FROM reward_tiers WHERE name = ?', ['Platinum'], (err, row) => {
    if (!row) {
      db.run(`INSERT INTO reward_tiers (name, min_points, points_per_rs, redemption_rate, discount_percentage) 
              VALUES (?, ?, ?, ?, ?)`, 
        ['Platinum', 15000, 2.0, 0.025, 15]);
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    table_number TEXT NOT NULL,
    items TEXT NOT NULL, -- JSON string
    total REAL NOT NULL,
    payment TEXT,
    status TEXT,
    service_type TEXT DEFAULT 'take-out',
    discount_amount REAL DEFAULT 0,
    discount_type TEXT DEFAULT 'none', -- 'percentage', 'flat', 'promo'
    promo_code TEXT,
    final_total REAL NOT NULL,
    line_item_discounts TEXT, -- JSON string for line item discounts
    customer_id INTEGER,
    order_notes TEXT, -- Special requests and notes
    is_split_bill BOOLEAN DEFAULT 0, -- Flag for split bills
    parent_order_id INTEGER, -- For split bills, references the original order
    split_number INTEGER, -- Split number (1, 2, 3, etc.)
    FOREIGN KEY (customer_id) REFERENCES customers (id),
    FOREIGN KEY (parent_order_id) REFERENCES orders (id)
  )`);

  // Add discount columns if they don't exist
  db.run("PRAGMA table_info(orders)", [], (err, rows) => {
    if (err) {
      console.error('Error checking table schema:', err);
      return;
    }
    
    if (rows && Array.isArray(rows)) {
      const hasDiscountAmount = rows.some(row => row.name === 'discount_amount');
      const hasDiscountType = rows.some(row => row.name === 'discount_type');
      const hasPromoCode = rows.some(row => row.name === 'promo_code');
      const hasFinalTotal = rows.some(row => row.name === 'final_total');
      const hasLineItemDiscounts = rows.some(row => row.name === 'line_item_discounts');
      const hasCustomerId = rows.some(row => row.name === 'customer_id');
      const hasCustomerName = rows.some(row => row.name === 'customer_name');
      const hasOrderNotes = rows.some(row => row.name === 'order_notes');
      const hasIsSplitBill = rows.some(row => row.name === 'is_split_bill');
      const hasParentOrderId = rows.some(row => row.name === 'parent_order_id');
      const hasSplitNumber = rows.some(row => row.name === 'split_number');
      
      if (!hasDiscountAmount) {
        db.run("ALTER TABLE orders ADD COLUMN discount_amount REAL DEFAULT 0");
      }
      if (!hasDiscountType) {
        db.run("ALTER TABLE orders ADD COLUMN discount_type TEXT DEFAULT 'none'");
      }
      if (!hasPromoCode) {
        db.run("ALTER TABLE orders ADD COLUMN promo_code TEXT");
      }
      if (!hasFinalTotal) {
        db.run("ALTER TABLE orders ADD COLUMN final_total REAL NOT NULL DEFAULT 0");
      }
      if (!hasLineItemDiscounts) {
        db.run("ALTER TABLE orders ADD COLUMN line_item_discounts TEXT");
      }
      if (!hasCustomerId) {
        db.run("ALTER TABLE orders ADD COLUMN customer_id INTEGER");
      }
      if (!hasCustomerName) {
        db.run("ALTER TABLE orders ADD COLUMN customer_name TEXT");
      }
      if (!hasOrderNotes) {
        db.run("ALTER TABLE orders ADD COLUMN order_notes TEXT");
      }
      if (!hasIsSplitBill) {
        db.run("ALTER TABLE orders ADD COLUMN is_split_bill BOOLEAN DEFAULT 0");
      }
      if (!hasParentOrderId) {
        db.run("ALTER TABLE orders ADD COLUMN parent_order_id INTEGER");
      }
      if (!hasSplitNumber) {
        db.run("ALTER TABLE orders ADD COLUMN split_number INTEGER");
      }
    }
  });

  // Line item discount rules table
  db.run(`CREATE TABLE IF NOT EXISTS line_item_discount_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    product_id INTEGER,
    category TEXT,
    discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'flat', 'buy_x_get_y', 'bulk')),
    discount_value REAL NOT NULL,
    min_quantity INTEGER DEFAULT 1,
    max_quantity INTEGER DEFAULT -1,
    valid_from TEXT,
    valid_until TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id)
  )`);

  // Insert some default line item discount rules
  db.get('SELECT * FROM line_item_discount_rules WHERE name = ?', ['Tea Tuesday'], (err, row) => {
    if (!row) {
      db.run(`INSERT INTO line_item_discount_rules (name, category, discount_type, discount_value, min_quantity) 
              VALUES (?, ?, ?, ?, ?)`, 
        ['Tea Tuesday', 'Tea', 'percentage', 15, 1]);
    }
  });

  db.get('SELECT * FROM line_item_discount_rules WHERE name = ?', ['Bulk Coffee'], (err, row) => {
    if (!row) {
      db.run(`INSERT INTO line_item_discount_rules (name, category, discount_type, discount_value, min_quantity) 
              VALUES (?, ?, ?, ?, ?)`, 
        ['Bulk Coffee', 'Coffee', 'bulk', 20, 3]);
    }
  });

  // Promo codes table
  db.run(`CREATE TABLE IF NOT EXISTS promo_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'flat')),
    discount_value REAL NOT NULL,
    min_order_amount REAL DEFAULT 0,
    max_uses INTEGER DEFAULT -1, -- -1 means unlimited
    used_count INTEGER DEFAULT 0,
    valid_from TEXT,
    valid_until TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert some default promo codes
  db.get('SELECT * FROM promo_codes WHERE code = ?', ['WELCOME10'], (err, row) => {
    if (!row) {
      db.run(`INSERT INTO promo_codes (code, discount_type, discount_value, min_order_amount, max_uses) 
              VALUES (?, ?, ?, ?, ?)`, 
        ['WELCOME10', 'percentage', 10, 100, 50]);
    }
  });

  db.get('SELECT * FROM promo_codes WHERE code = ?', ['SAVE50'], (err, row) => {
    if (!row) {
      db.run(`INSERT INTO promo_codes (code, discount_type, discount_value, min_order_amount, max_uses) 
              VALUES (?, ?, ?, ?, ?)`, 
        ['SAVE50', 'flat', 50, 200, 20]);
    }
  });

  // Create default admin user if not exists
  db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
    if (err) {
      console.error('Error checking admin user:', err);
      return;
    }
    if (!row) {
      const hashedPassword = bcrypt.hashSync('myMamu123', 10);
      db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
        ['admin', hashedPassword, 'admin'], (err) => {
        if (err) {
          console.error('Error creating admin user:', err);
        } else {
          console.log('Default admin user created: username=admin, password=myMamu123');
        }
      });
    }
  });

  // Create default cashier user if not exists
  db.get('SELECT * FROM users WHERE username = ?', ['cashier'], (err, row) => {
    if (err) {
      console.error('Error checking cashier user:', err);
      return;
    }
    if (!row) {
      const hashedPassword = bcrypt.hashSync('cashier', 10);
      db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
        ['cashier', hashedPassword, 'cashier'], (err) => {
        if (err) {
          console.error('Error creating cashier user:', err);
        } else {
          console.log('Default cashier user created: username=cashier, password=cashier');
        }
      });
    }
  });

  // Refunds table
  db.run(`CREATE TABLE IF NOT EXISTS refunds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    item_price REAL NOT NULL,
    original_quantity INTEGER NOT NULL,
    refund_quantity INTEGER NOT NULL,
    refund_amount REAL NOT NULL,
    refund_reason TEXT,
    refund_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    refunded_by TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    FOREIGN KEY (order_id) REFERENCES orders (id)
  )`);

  // Table for pending table orders (not yet completed)
  db.run(`CREATE TABLE IF NOT EXISTS pending_table_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER NOT NULL,
    table_name TEXT NOT NULL,
    items TEXT,
    total REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    line_item_discounts TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Authentication middleware
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Simple token validation (in production, use JWT)
    const decoded = Buffer.from(token, 'base64').toString();
    const [username, role] = decoded.split(':');
    
    if (!username || !role) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = { username, role };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// --- Authentication Endpoints ---
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create simple token (in production, use JWT)
    const token = Buffer.from(`${user.username}:${user.role}`).toString('base64');
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  });
});

app.post('/auth/register', authenticateUser, requireRole(['admin']), (req, res) => {
  const { username, password, role } = req.body;
  
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required' });
  }

  if (!['admin', 'cashier'].includes(role)) {
    return res.status(400).json({ error: 'Role must be admin or cashier' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
    [username, hashedPassword, role], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({
      id: this.lastID,
      username,
      role
    });
  });
});

app.get('/auth/me', authenticateUser, (req, res) => {
  res.json({
    username: req.user.username,
    role: req.user.role
  });
});

// --- Product Endpoints ---
app.get('/products', authenticateUser, (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/products', authenticateUser, requireRole(['admin']), (req, res) => {
  const { name, price, category, image, description } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'Name and price are required.' });
  db.run(
    'INSERT INTO products (name, price, category, image, description) VALUES (?, ?, ?, ?, ?)',
    [name, price, category, image, description],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM products WHERE id = ?', [this.lastID], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json(row);
      });
    }
  );
});

app.put('/products/:id', authenticateUser, requireRole(['admin']), (req, res) => {
  const { name, price, category, image, description } = req.body;
  db.run(
    'UPDATE products SET name=?, price=?, category=?, image=?, description=? WHERE id=?',
    [name, price, category, image, description, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
      });
    }
  );
});

app.delete('/products/:id', authenticateUser, requireRole(['admin']), (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- Customer Endpoints ---
app.get('/customers', authenticateUser, (req, res) => {
  db.all('SELECT * FROM customers ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/customers', authenticateUser, (req, res) => {
  const { name, phone } = req.body;
  console.log('Creating customer:', { name, phone });
  
  if (!name || !phone) {
    console.log('Missing required fields');
    return res.status(400).json({ error: 'Name and phone are required.' });
  }
  
  db.run(
    'INSERT INTO customers (name, phone) VALUES (?, ?)',
    [name, phone],
    function (err) {
      if (err) {
        console.error('Database error:', err);
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'A customer with this phone number already exists.' });
        }
        return res.status(500).json({ error: err.message });
      }
      console.log('Customer inserted with ID:', this.lastID);
      db.get('SELECT * FROM customers WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          console.error('Error fetching created customer:', err);
          return res.status(500).json({ error: err.message });
        }
        console.log('Created customer:', row);
        res.status(201).json(row);
      });
    }
  );
});

app.put('/customers/:id', authenticateUser, (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required.' });
  
  db.run(
    'UPDATE customers SET name=?, phone=? WHERE id=?',
    [name, phone, req.params.id],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'A customer with this phone number already exists.' });
        }
        return res.status(500).json({ error: err.message });
      }
      db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
      });
    }
  );
});

app.delete('/customers/:id', authenticateUser, (req, res) => {
  db.run('DELETE FROM customers WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('/customers/:id/orders', authenticateUser, (req, res) => {
  db.all('SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(order => ({ 
      ...order, 
      table: order.table_number,
      items: order.items ? JSON.parse(order.items) : [],
      serviceType: order.service_type,
      discountAmount: order.discount_amount,
      discountType: order.discount_type,
      promoCode: order.promo_code,
      finalTotal: order.final_total,
      lineItemDiscounts: order.line_item_discounts ? JSON.parse(order.line_item_discounts) : [],
      tipAmount: order.tip_amount,
      tipType: order.tip_type
    })));
  });
});

// Redeem free item for customer (reset visits to 0 and free_item_eligible to 0)
app.post('/customers/:id/redeem-free-item', authenticateUser, (req, res) => {
  db.get('SELECT visits, free_item_eligible FROM customers WHERE id = ?', [req.params.id], (err, customer) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    
    if (!customer.free_item_eligible) {
      return res.status(400).json({ error: 'Customer is not eligible for a free item yet' });
    }
    
    db.run('UPDATE customers SET visits = 0, free_item_eligible = 0 WHERE id = ?', [req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      
      db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, updatedCustomer) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
          success: true, 
          message: 'Free item redeemed successfully. Visits reset to 0.',
          customer: updatedCustomer 
        });
      });
    });
  });
});

// Reset all customer visit counters
app.post('/customers/reset-visits', authenticateUser, (req, res) => {
  console.log('Resetting customer visits...');
  
  // First check if the columns exist
  db.all("PRAGMA table_info(customers)", [], (err, rows) => {
    if (err) {
      console.error('Error checking table schema:', err);
      return res.status(500).json({ error: 'Database schema error' });
    }
    
    console.log('Table schema:', rows);
    
    const hasVisits = rows.some(row => row.name === 'visits');
    const hasFreeItemEligible = rows.some(row => row.name === 'free_item_eligible');
    
    if (!hasVisits || !hasFreeItemEligible) {
      console.log('Adding missing columns...');
      if (!hasVisits) {
        db.run("ALTER TABLE customers ADD COLUMN visits INTEGER DEFAULT 0", (err) => {
          if (err) console.error('Error adding visits column:', err);
        });
      }
      if (!hasFreeItemEligible) {
        db.run("ALTER TABLE customers ADD COLUMN free_item_eligible BOOLEAN DEFAULT 0", (err) => {
          if (err) console.error('Error adding free_item_eligible column:', err);
        });
      }
    }
    
    // Now perform the update
    db.run('UPDATE customers SET visits = 0, free_item_eligible = 0', function(err) {
      if (err) {
        console.error('Error updating customers:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log('Successfully reset customer visits');
      
      // Verify the update worked by checking a customer
      db.get('SELECT id, name, visits, free_item_eligible FROM customers LIMIT 1', [], (err, customer) => {
        if (err) {
          console.error('Error verifying update:', err);
        } else {
          console.log('Verification - Customer after reset:', customer);
        }
        
        res.json({ message: 'All customer visit counters have been reset successfully' });
      });
    });
  });
});

// --- Pending Table Orders Endpoints ---
// Get all pending table orders
app.get('/pending-table-orders', authenticateUser, (req, res) => {
  db.all('SELECT * FROM pending_table_orders ORDER BY updated_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Parse JSON fields
    const parsedRows = rows.map(row => ({
      ...row,
      items: row.items ? JSON.parse(row.items) : [],
      lineItemDiscounts: row.line_item_discounts ? JSON.parse(row.line_item_discounts) : {}
    }));
    
    res.json(parsedRows);
  });
});

// Save or update a pending table order
app.post('/pending-table-orders', authenticateUser, (req, res) => {
  const { tableId, tableName, items, total, status, lineItemDiscounts } = req.body;
  
  if (!tableId || !tableName) {
    return res.status(400).json({ error: 'Table ID and table name are required' });
  }
  
  // Check if order already exists for this table
  db.get('SELECT id FROM pending_table_orders WHERE table_id = ?', [tableId], (err, existingOrder) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (existingOrder) {
      // Update existing order
      db.run(
        'UPDATE pending_table_orders SET items = ?, total = ?, status = ?, line_item_discounts = ?, updated_at = CURRENT_TIMESTAMP WHERE table_id = ?',
        [JSON.stringify(items || []), total || 0, status || 'pending', JSON.stringify(lineItemDiscounts || {}), tableId],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Table order updated successfully', tableId });
        }
      );
    } else {
      // Create new order
      db.run(
        'INSERT INTO pending_table_orders (table_id, table_name, items, total, status, line_item_discounts) VALUES (?, ?, ?, ?, ?, ?)',
        [tableId, tableName, JSON.stringify(items || []), total || 0, status || 'pending', JSON.stringify(lineItemDiscounts || {})],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Table order created successfully', tableId });
        }
      );
    }
  });
});

// Delete a pending table order (when table is cleared)
app.delete('/pending-table-orders/:tableId', authenticateUser, (req, res) => {
  const { tableId } = req.params;
  
  db.run('DELETE FROM pending_table_orders WHERE table_id = ?', [tableId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Table order deleted successfully' });
  });
});

// Delete all pending table orders (when resetting sales)
app.delete('/pending-table-orders', authenticateUser, (req, res) => {
  db.run('DELETE FROM pending_table_orders', function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'All pending table orders deleted successfully' });
  });
});

// --- Order Endpoints ---
app.get('/orders', authenticateUser, (req, res) => {
  db.all(`
    SELECT * FROM orders ORDER BY id DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse items JSON for each order and map table_number to table
    res.json(rows.map(order => ({ 
      ...order, 
      table: order.table_number, // Map table_number to table for frontend compatibility
      items: order.items ? JSON.parse(order.items) : [],
      serviceType: order.service_type, // Map service_type to serviceType for frontend compatibility
      discountAmount: order.discount_amount, // Map discount_amount to discountAmount for frontend compatibility
      discountType: order.discount_type, // Map discount_type to discountType for frontend compatibility
      promoCode: order.promo_code, // Map promo_code to promoCode for frontend compatibility
      finalTotal: order.final_total, // Map final_total to finalTotal for frontend compatibility
      lineItemDiscounts: order.line_item_discounts ? JSON.parse(order.line_item_discounts) : [], // Map line_item_discounts to lineItemDiscounts
      customerId: order.customer_id || null,
      customerName: order.customer_name || null,
      orderNotes: order.order_notes || null,
      isSplitBill: order.is_split_bill || false,
      parentOrderId: order.parent_order_id || null,
      splitNumber: order.split_number || null,
      customerPhone: null // Will be populated later when customer functionality is added
    })));
  });
});

app.post('/orders', authenticateUser, (req, res) => {
  const { date, table, items, total, payment, status, serviceType, discountAmount, discountType, promoCode, customerId, lineItemDiscounts, customerName, orderNotes, finalTotal } = req.body;
  if (!date || !table || !items || total == null) return res.status(400).json({ error: 'Missing required fields.' });
  
  // Calculate total with line item discounts applied
  let calculatedTotal = total;
  if (lineItemDiscounts && Array.isArray(items)) {
    calculatedTotal = items.reduce((sum, item) => {
      let itemPrice = item.price || 0;
      const qty = item.qty || 0;
      
      // Apply line item discount if exists
      if (lineItemDiscounts[item.id]) {
        const discount = lineItemDiscounts[item.id];
        if (discount.type === 'percentage') {
          itemPrice = itemPrice * (1 - discount.value / 100);
        } else if (discount.type === 'flat') {
          itemPrice = Math.max(0, itemPrice - discount.value);
        }
      }
      
      return sum + (itemPrice * qty);
    }, 0);
  }
  
  // Use the finalTotal from frontend if provided, otherwise use calculatedTotal
  const finalTotalToSave = finalTotal || calculatedTotal;
  
  db.run(
    'INSERT INTO orders (date, table_number, items, total, payment, status, service_type, discount_amount, discount_type, promo_code, final_total, customer_id, line_item_discounts, customer_name, order_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [date, table, JSON.stringify(items), calculatedTotal, payment, status, serviceType || 'take-out', discountAmount || 0, discountType || 'none', promoCode || null, finalTotalToSave, customerId || null, lineItemDiscounts ? JSON.stringify(lineItemDiscounts) : null, customerName || null, orderNotes || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const orderId = this.lastID;
      
      // Award points to customer if order is completed and customer exists
      if (customerId && status === 'completed') {
        console.log(`Updating customer visits for customer ID: ${customerId}`);
        db.get('SELECT visits, free_item_eligible FROM customers WHERE id = ?', [customerId], (err, customer) => {
          if (!err && customer) {
            let newVisits = customer.visits + 1;
            let eligible = customer.free_item_eligible;
            if (newVisits >= 10 && !eligible) {
              eligible = 1;
            }
            console.log(`Customer ${customerId}: visits ${customer.visits} -> ${newVisits}, eligible: ${eligible}`);
            db.run('UPDATE customers SET visits = ?, free_item_eligible = ? WHERE id = ?', [newVisits, eligible, customerId], function(err) {
              if (err) {
                console.error('Error updating customer visits:', err);
              } else {
                console.log(`Successfully updated customer ${customerId} visits to ${newVisits}`);
              }
            });
          } else {
            console.error('Error finding customer or customer not found:', err, customer);
          }
        });
      } else {
        console.log(`Not updating customer visits - customerId: ${customerId}, status: ${status}`);
      }
      
      db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(500).json({ error: 'Failed to retrieve created order' });
        res.status(201).json({ 
          ...row, 
          table: row.table_number, // Map table_number to table for frontend compatibility
          items: row.items ? JSON.parse(row.items) : [],
          serviceType: row.service_type, // Map service_type to serviceType for frontend compatibility
          discountAmount: row.discount_amount, // Map discount_amount to discountAmount for frontend compatibility
          discountType: row.discount_type, // Map discount_type to discountType for frontend compatibility
          promoCode: row.promo_code, // Map promo_code to promoCode for frontend compatibility
          finalTotal: row.final_total, // Map final_total to finalTotal for frontend compatibility
          lineItemDiscounts: row.line_item_discounts ? JSON.parse(row.line_item_discounts) : [], // Map line_item_discounts to lineItemDiscounts
          customerName: row.customer_name, // Map customer_name to customerName for frontend compatibility
          orderNotes: row.order_notes, // Map order_notes to orderNotes for frontend compatibility
          isSplitBill: row.is_split_bill || false,
          parentOrderId: row.parent_order_id || null,
          splitNumber: row.split_number || null
        });
      });
    }
  );
});

app.put('/orders/:id', authenticateUser, (req, res) => {
  const { items, discountAmount, discountType, promoCode, lineItemDiscounts, customerName, customerId, orderNotes, finalTotal } = req.body;
  if (!items) return res.status(400).json({ error: 'Items are required.' });
  
  // Calculate total with line item discounts applied
  let newTotal = 0;
  if (Array.isArray(items)) {
    newTotal = items.reduce((sum, item) => {
      let itemPrice = item.price || 0;
      const qty = item.qty || 0;
      
      // Apply line item discount if exists
      if (lineItemDiscounts && lineItemDiscounts[item.id]) {
        const discount = lineItemDiscounts[item.id];
        if (discount.type === 'percentage') {
          itemPrice = itemPrice * (1 - discount.value / 100);
        } else if (discount.type === 'flat') {
          itemPrice = Math.max(0, itemPrice - discount.value);
        }
      }
      
      return sum + (itemPrice * qty);
    }, 0);
  }
  
  // Use the finalTotal from frontend if provided, otherwise use newTotal
  const finalTotalToSave = finalTotal || newTotal;
  
  db.run(
    'UPDATE orders SET items=?, total=?, discount_amount=?, discount_type=?, promo_code=?, final_total=?, line_item_discounts=?, customer_name=?, customer_id=?, order_notes=? WHERE id=?',
    [JSON.stringify(items), newTotal, discountAmount || 0, discountType || 'none', promoCode || null, finalTotalToSave, lineItemDiscounts ? JSON.stringify(lineItemDiscounts) : null, customerName || null, customerId || null, orderNotes || null, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Order not found' });
        res.json({ 
          ...row, 
          table: row.table_number, // Map table_number to table for frontend compatibility
          items: row.items ? JSON.parse(row.items) : [],
          serviceType: row.service_type, // Map service_type to serviceType for frontend compatibility
          discountAmount: row.discount_amount, // Map discount_amount to discountAmount for frontend compatibility
          discountType: row.discount_type, // Map discount_type to discountType for frontend compatibility
          promoCode: row.promo_code, // Map promo_code to promoCode for frontend compatibility
          finalTotal: row.final_total, // Map final_total to finalTotal for frontend compatibility
          lineItemDiscounts: row.line_item_discounts ? JSON.parse(row.line_item_discounts) : [], // Map line_item_discounts to lineItemDiscounts
          customerName: row.customer_name, // Map customer_name to customerName for frontend compatibility
          customerId: row.customer_id, // Map customer_id to customerId for frontend compatibility
          orderNotes: row.order_notes, // Map order_notes to orderNotes for frontend compatibility
          isSplitBill: row.is_split_bill || false,
          parentOrderId: row.parent_order_id || null,
          splitNumber: row.split_number || null
        });
      });
    }
  );
});

// Delete all orders and refunds (for reset sales functionality) - Admin only
app.delete('/orders', authenticateUser, requireRole(['admin']), (req, res) => {
  // First delete all refunds (since they reference orders)
  db.run('DELETE FROM refunds', [], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    
    // Then delete all orders
    db.run('DELETE FROM orders', [], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      
      // Reset the auto-increment sequence for orders
      db.run("DELETE FROM sqlite_sequence WHERE name='orders'", [], function (err3) {
        if (err3) return res.status(500).json({ error: err3.message });
        
        // Reset the auto-increment sequence for refunds
        db.run("DELETE FROM sqlite_sequence WHERE name='refunds'", [], function (err4) {
          if (err4) return res.status(500).json({ error: err4.message });
          
          res.json({ 
            success: true, 
            message: 'All orders and refunds deleted, and ID sequences reset successfully' 
          });
        });
      });
    });
  });
});

app.delete('/orders/:id', authenticateUser, (req, res) => {
  db.run('DELETE FROM orders WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- Promo Code Endpoints ---
app.post('/promo/validate', authenticateUser, (req, res) => {
  const { code, orderTotal } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Promo code is required' });
  }

  db.get('SELECT * FROM promo_codes WHERE code = ? AND is_active = 1', [code], (err, promo) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!promo) {
      return res.status(404).json({ error: 'Invalid or inactive promo code' });
    }

    // Check if promo code has reached max uses
    if (promo.max_uses !== -1 && promo.used_count >= promo.max_uses) {
      return res.status(400).json({ error: 'Promo code has reached maximum usage limit' });
    }

    // Check minimum order amount
    if (orderTotal < promo.min_order_amount) {
      return res.status(400).json({ 
        error: `Minimum order amount of Rs. ${promo.min_order_amount} required for this promo code` 
      });
    }

    // Check validity dates
    const now = new Date();
    if (promo.valid_from && new Date(promo.valid_from) > now) {
      return res.status(400).json({ error: 'Promo code is not yet valid' });
    }
    if (promo.valid_until && new Date(promo.valid_until) < now) {
      return res.status(400).json({ error: 'Promo code has expired' });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.discount_type === 'percentage') {
      discountAmount = (orderTotal * promo.discount_value) / 100;
    } else if (promo.discount_type === 'flat') {
      discountAmount = promo.discount_value;
    }

    const finalTotal = Math.max(0, orderTotal - discountAmount);

    res.json({
      success: true,
      promo: {
        code: promo.code,
        discountType: promo.discount_type,
        discountValue: promo.discount_value,
        discountAmount: discountAmount,
        finalTotal: finalTotal
      }
    });
  });
});

// Get all promo codes (Admin only)
app.get('/promo', authenticateUser, requireRole(['admin']), (req, res) => {
  db.all('SELECT * FROM promo_codes ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create new promo code (Admin only)
app.post('/promo', authenticateUser, requireRole(['admin']), (req, res) => {
  const { code, discountType, discountValue, minOrderAmount, maxUses, validFrom, validUntil } = req.body;
  
  if (!code || !discountType || !discountValue) {
    return res.status(400).json({ error: 'Code, discount type, and discount value are required' });
  }

  if (!['percentage', 'flat'].includes(discountType)) {
    return res.status(400).json({ error: 'Discount type must be percentage or flat' });
  }

  db.run(
    `INSERT INTO promo_codes (code, discount_type, discount_value, min_order_amount, max_uses, valid_from, valid_until) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [code, discountType, discountValue, minOrderAmount || 0, maxUses || -1, validFrom || null, validUntil || null],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Promo code already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      
      db.get('SELECT * FROM promo_codes WHERE id = ?', [this.lastID], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json(row);
      });
    }
  );
});

// --- Rewards System Endpoints ---
app.get('/customers-with-rewards', authenticateUser, (req, res) => {
  db.all(`
    SELECT c.id, c.name, c.phone, c.created_at, c.visits, c.free_item_eligible, 
           cr.points_balance, cr.total_points_earned, cr.total_points_redeemed, cr.tier
    FROM customers c
    LEFT JOIN customer_rewards cr ON c.id = cr.customer_id
    ORDER BY c.name
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/reward-tiers', authenticateUser, (req, res) => {
  db.all('SELECT * FROM reward_tiers ORDER BY min_points', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/customers/:id/rewards', authenticateUser, (req, res) => {
  db.get(`
    SELECT c.id, c.name, c.phone, c.created_at, c.visits, c.free_item_eligible,
           cr.points_balance, cr.total_points_earned, cr.total_points_redeemed, cr.tier
    FROM customers c
    LEFT JOIN customer_rewards cr ON c.id = cr.customer_id
    WHERE c.id = ?
  `, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Customer not found' });
    res.json(row);
  });
});

app.get('/customers/:id/transactions', authenticateUser, (req, res) => {
  db.all(`
    SELECT * FROM point_transactions 
    WHERE customer_id = ? 
    ORDER BY created_at DESC
  `, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/customers/:id/redeem-points', authenticateUser, (req, res) => {
  const { pointsToRedeem, orderTotal } = req.body;
  
  if (!pointsToRedeem || pointsToRedeem <= 0) {
    return res.status(400).json({ error: 'Invalid points to redeem' });
  }

  db.get('SELECT * FROM customer_rewards WHERE customer_id = ?', [req.params.id], (err, rewards) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rewards || rewards.points_balance < pointsToRedeem) {
      return res.status(400).json({ error: 'Insufficient points balance' });
    }

    const redemptionValue = pointsToRedeem * (rewards.redemption_rate || 0.01);
    const newBalance = rewards.points_balance - pointsToRedeem;

    db.run('UPDATE customer_rewards SET points_balance = ?, total_points_redeemed = total_points_redeemed + ? WHERE customer_id = ?', 
      [newBalance, pointsToRedeem, req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Record the transaction
      db.run('INSERT INTO point_transactions (customer_id, transaction_type, points, description) VALUES (?, ?, ?, ?)',
        [req.params.id, 'redeemed', -pointsToRedeem, `Redeemed ${pointsToRedeem} points for Rs. ${redemptionValue.toFixed(2)} discount`], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          success: true,
          redemptionValue: redemptionValue,
          newBalance: newBalance,
          message: `Successfully redeemed ${pointsToRedeem} points for Rs. ${redemptionValue.toFixed(2)} discount`
        });
      });
    });
  });
});

// --- Line Item Discount Endpoints ---
// Get all line item discount rules (Admin only)
app.get('/line-item-discounts', authenticateUser, requireRole(['admin']), (req, res) => {
  db.all('SELECT * FROM line_item_discount_rules ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create new line item discount rule (Admin only)
app.post('/line-item-discounts', authenticateUser, requireRole(['admin']), (req, res) => {
  const { name, productId, category, discountType, discountValue, minQuantity, maxQuantity, validFrom, validUntil } = req.body;
  
  if (!name || !discountType || !discountValue) {
    return res.status(400).json({ error: 'Name, discount type, and discount value are required' });
  }

  if (!['percentage', 'flat', 'buy_x_get_y', 'bulk'].includes(discountType)) {
    return res.status(400).json({ error: 'Invalid discount type' });
  }

  db.run(
    `INSERT INTO line_item_discount_rules (name, product_id, category, discount_type, discount_value, min_quantity, max_quantity, valid_from, valid_until) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, productId || null, category || null, discountType, discountValue, minQuantity || 1, maxQuantity || -1, validFrom || null, validUntil || null],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get('SELECT * FROM line_item_discount_rules WHERE id = ?', [this.lastID], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json(row);
      });
    }
  );
});

// Calculate line item discounts for a cart
app.post('/line-item-discounts/calculate', authenticateUser, (req, res) => {
  const { items } = req.body;
  
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Items array is required' });
  }

  // Get all active discount rules
  db.all('SELECT * FROM line_item_discount_rules WHERE is_active = 1', [], (err, rules) => {
    if (err) return res.status(500).json({ error: err.message });

    const now = new Date();
    const activeRules = rules.filter(rule => {
      if (rule.valid_from && new Date(rule.valid_from) > now) return false;
      if (rule.valid_until && new Date(rule.valid_until) < now) return false;
      return true;
    });

    const discountedItems = items.map(item => {
      let itemDiscount = 0;
      let appliedRules = [];

      // Find applicable rules for this item
      const applicableRules = activeRules.filter(rule => {
        if (rule.product_id && rule.product_id !== item.id) return false;
        if (rule.category && rule.category !== item.category) return false;
        if (rule.min_quantity && item.qty < rule.min_quantity) return false;
        if (rule.max_quantity !== -1 && item.qty > rule.max_quantity) return false;
        return true;
      });

      // Apply the best discount rule
      if (applicableRules.length > 0) {
        const bestRule = applicableRules.reduce((best, current) => {
          const currentDiscount = calculateItemDiscount(item, current);
          const bestDiscount = calculateItemDiscount(item, best);
          return currentDiscount > bestDiscount ? current : best;
        });

        itemDiscount = calculateItemDiscount(item, bestRule);
        appliedRules.push(bestRule);
      }

      return {
        ...item,
        originalPrice: item.price,
        discountAmount: itemDiscount,
        discountedPrice: Math.max(0, item.price - itemDiscount),
        appliedRules: appliedRules
      };
    });

    const totalDiscount = discountedItems.reduce((sum, item) => sum + item.discountAmount, 0);
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const finalTotal = discountedItems.reduce((sum, item) => sum + (item.discountedPrice * item.qty), 0);

    res.json({
      items: discountedItems,
      totalDiscount: totalDiscount,
      subtotal: subtotal,
      finalTotal: finalTotal
    });
  });
});

// Helper function to calculate item discount
function calculateItemDiscount(item, rule) {
  const itemTotal = item.price * item.qty;
  
  switch (rule.discount_type) {
    case 'percentage':
      return (itemTotal * rule.discount_value) / 100;
    case 'flat':
      return Math.min(rule.discount_value, itemTotal);
    case 'bulk':
      if (item.qty >= rule.min_quantity) {
        return (itemTotal * rule.discount_value) / 100;
      }
      return 0;
    case 'buy_x_get_y':
      // For buy X get Y, calculate how many free items
      const freeItems = Math.floor(item.qty / (rule.min_quantity + rule.discount_value));
      return freeItems * item.price;
    default:
      return 0;
  }
}

// --- Split Bill Endpoints ---

// Create split bills from an existing order
app.post('/orders/:id/split', authenticateUser, (req, res) => {
  const { splits } = req.body; // Array of { items: [], customerName: '', payment: '' }
  
  if (!splits || !Array.isArray(splits) || splits.length < 2) {
    return res.status(400).json({ error: 'At least 2 splits are required' });
  }

  // First, get the original order
  db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, originalOrder) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!originalOrder) return res.status(404).json({ error: 'Original order not found' });

    // Validate that all items are accounted for
    const originalItems = JSON.parse(originalOrder.items);
    const allSplitItems = splits.flatMap(split => split.items);
    
    // Check if all original items are included in splits
    const originalItemCounts = {};
    originalItems.forEach(item => {
      const key = `${item.name}-${item.price}`;
      originalItemCounts[key] = (originalItemCounts[key] || 0) + item.qty;
    });

    const splitItemCounts = {};
    allSplitItems.forEach(item => {
      const key = `${item.name}-${item.price}`;
      splitItemCounts[key] = (splitItemCounts[key] || 0) + item.qty;
    });

    // Validate item counts match
    for (const key in originalItemCounts) {
      if (originalItemCounts[key] !== splitItemCounts[key]) {
        return res.status(400).json({ error: 'Split items must exactly match original order items' });
      }
    }

    // Create split orders
    const splitOrders = [];
    let splitNumber = 1;

    const createSplitOrder = (split) => {
      return new Promise((resolve, reject) => {
        const splitTotal = split.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        
        db.run(
          'INSERT INTO orders (date, table_number, items, total, payment, status, service_type, customer_name, order_notes, is_split_bill, parent_order_id, split_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            originalOrder.date,
            originalOrder.table_number,
            JSON.stringify(split.items),
            splitTotal,
            split.payment || 'Cash',
            'completed',
            originalOrder.service_type,
            split.customerName || `Split ${splitNumber}`,
            split.orderNotes || '',
            1, // is_split_bill
            originalOrder.id,
            splitNumber
          ],
          function (err) {
            if (err) {
              reject(err);
              return;
            }
            
            const splitOrderId = this.lastID;
            resolve({
              id: splitOrderId,
              splitNumber: splitNumber,
              total: splitTotal,
              items: split.items,
              customerName: split.customerName || `Split ${splitNumber}`,
              payment: split.payment || 'Cash'
            });
          }
        );
      });
    };

    // Create all split orders
    Promise.all(splits.map(split => createSplitOrder(split)))
      .then((results) => {
        // Update original order to mark it as split
        db.run('UPDATE orders SET is_split_bill = 1 WHERE id = ?', [originalOrder.id], (err) => {
          if (err) {
            console.error('Error updating original order:', err);
          }
          
          res.status(201).json({
            success: true,
            originalOrderId: originalOrder.id,
            splitOrders: results,
            message: `Order successfully split into ${splits.length} parts`
          });
        });
      })
      .catch((error) => {
        res.status(500).json({ error: error.message });
      });
  });
});

// Get split bills for an order
app.get('/orders/:id/splits', authenticateUser, (req, res) => {
  db.all('SELECT * FROM orders WHERE parent_order_id = ? ORDER BY split_number', [req.params.id], (err, splits) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const formattedSplits = splits.map(split => ({
      id: split.id,
      splitNumber: split.split_number,
      date: split.date,
      table: split.table_number,
      items: JSON.parse(split.items),
      total: split.total,
      payment: split.payment,
      status: split.status,
      customerName: split.customer_name,
      orderNotes: split.order_notes
    }));
    
    res.json(formattedSplits);
  });
});

// Get all split bills (for management)
app.get('/split-bills', authenticateUser, (req, res) => {
  db.all(`
    SELECT o.*, 
           COUNT(s.id) as split_count,
           SUM(s.total) as total_split_amount
    FROM orders o
    LEFT JOIN orders s ON o.id = s.parent_order_id
    WHERE o.is_split_bill = 1
    GROUP BY o.id
    ORDER BY o.date DESC
  `, [], (err, splitBills) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const formattedSplitBills = splitBills.map(bill => ({
      id: bill.id,
      date: bill.date,
      table: bill.table_number,
      originalTotal: bill.total,
      splitCount: bill.split_count,
      totalSplitAmount: bill.total_split_amount,
      status: bill.status
    }));
    
    res.json(formattedSplitBills);
  });
});

// --- Refund Endpoints ---

// Create a new refund
app.post('/refunds', authenticateUser, requireRole(['admin']), (req, res) => {
  const { 
    orderId, 
    itemName, 
    itemPrice, 
    originalQuantity, 
    refundQuantity, 
    refundReason 
  } = req.body;

  // Validate required fields
  if (!orderId || !itemName || !itemPrice || !originalQuantity || !refundQuantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate refund quantity
  if (refundQuantity > originalQuantity) {
    return res.status(400).json({ error: 'Refund quantity cannot exceed original quantity' });
  }

  // Calculate refund amount
  const refundAmount = itemPrice * refundQuantity;

  // Insert refund record
  db.run(
    'INSERT INTO refunds (order_id, item_name, item_price, original_quantity, refund_quantity, refund_amount, refund_reason, refunded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [orderId, itemName, itemPrice, originalQuantity, refundQuantity, refundAmount, refundReason || 'Customer request', req.user.username],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const refundId = this.lastID;
      
      res.status(201).json({
        success: true,
        refundId: refundId,
        refundAmount: refundAmount,
        message: `Refund processed successfully for ${itemName}`
      });
    }
  );
});

// Get all refunds
app.get('/refunds', authenticateUser, requireRole(['admin']), (req, res) => {
  const { startDate, endDate, orderId } = req.query;
  
  let query = `
    SELECT r.*, o.date as order_date, o.table_number, o.service_type
    FROM refunds r
    LEFT JOIN orders o ON r.order_id = o.id
    WHERE 1=1
  `;
  const params = [];

  if (startDate && endDate) {
    query += ' AND r.refund_date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  if (orderId) {
    query += ' AND r.order_id = ?';
    params.push(orderId);
  }

  query += ' ORDER BY r.refund_date DESC';

  db.all(query, params, (err, refunds) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const formattedRefunds = refunds.map(refund => ({
      id: refund.id,
      orderId: refund.order_id,
      itemName: refund.item_name,
      itemPrice: refund.item_price,
      originalQuantity: refund.original_quantity,
      refundQuantity: refund.refund_quantity,
      refundAmount: refund.refund_amount,
      refundReason: refund.refund_reason,
      refundDate: refund.refund_date,
      refundedBy: refund.refunded_by,
      status: refund.status,
      orderDate: refund.order_date,
      tableNumber: refund.table_number,
      serviceType: refund.service_type
    }));

    res.json(formattedRefunds);
  });
});

// Get refunds for a specific order
app.get('/orders/:id/refunds', authenticateUser, requireRole(['admin']), (req, res) => {
  db.all(
    'SELECT * FROM refunds WHERE order_id = ? ORDER BY refund_date DESC',
    [req.params.id],
    (err, refunds) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const formattedRefunds = refunds.map(refund => ({
        id: refund.id,
        orderId: refund.order_id,
        itemName: refund.item_name,
        itemPrice: refund.item_price,
        originalQuantity: refund.original_quantity,
        refundQuantity: refund.refund_quantity,
        refundAmount: refund.refund_amount,
        refundReason: refund.refund_reason,
        refundDate: refund.refund_date,
        refundedBy: refund.refunded_by,
        status: refund.status
      }));

      res.json(formattedRefunds);
    }
  );
});

// Get refund statistics for dashboard
app.get('/refunds/stats', authenticateUser, requireRole(['admin']), (req, res) => {
  const { period = 'today' } = req.query;
  
  let dateFilter = '';
  const params = [];

  switch (period) {
    case 'today':
      dateFilter = 'WHERE DATE(r.refund_date) = DATE("now")';
      break;
    case 'week':
      dateFilter = 'WHERE r.refund_date >= DATE("now", "-7 days")';
      break;
    case 'month':
      dateFilter = 'WHERE r.refund_date >= DATE("now", "-30 days")';
      break;
    case 'year':
      dateFilter = 'WHERE r.refund_date >= DATE("now", "-365 days")';
      break;
    default:
      dateFilter = 'WHERE DATE(r.refund_date) = DATE("now")';
  }

  const query = `
    SELECT 
      COUNT(*) as total_refunds,
      SUM(refund_amount) as total_refund_amount,
      AVG(refund_amount) as avg_refund_amount
    FROM refunds r
    ${dateFilter}
  `;

  db.get(query, params, (err, stats) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      totalRefunds: stats.total_refunds || 0,
      totalRefundAmount: stats.total_refund_amount || 0,
      avgRefundAmount: stats.avg_refund_amount || 0
    });
  });
});

// Clear all orders (for admin use)
app.delete('/orders/clear', authenticateUser, requireRole(['admin']), (req, res) => {
  db.run('DELETE FROM orders', (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'All orders cleared successfully' });
  });
});

app.get('/', (req, res) => {
  res.send('POS Backend is running');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Network accessible on http://10.0.0.161:${PORT}`);
});
