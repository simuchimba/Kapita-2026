import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';

const DB_NAME = 'kapita_offline.db';

let db: SQLite.SQLiteDatabase | null = null;
let sqliteUnavailable = false;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (sqliteUnavailable) throw new Error('SQLite not available in Expo Go');
  if (db) return db;

  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeDatabase();
    return db;
  } catch (err) {
    sqliteUnavailable = true;
    throw err;
  }
};

const initializeDatabase = async () => {
  if (!db) return;
  
  // Products table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      category TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'synced',
      server_id INTEGER
    );
  `);

  // Sales table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER,
      product_id INTEGER NOT NULL,
      customer_id INTEGER,
      quantity INTEGER NOT NULL,
      total REAL NOT NULL,
      sale_date TEXT NOT NULL,
      payment_type TEXT,
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT,
      updated_at TEXT
    );
  `);

  // Customers table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'synced',
      server_id INTEGER
    );
  `);

  // Credits table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER,
      customer_id INTEGER NOT NULL,
      amount_owed REAL NOT NULL,
      amount_paid REAL DEFAULT 0,
      borrow_date TEXT NOT NULL,
      due_date TEXT,
      notes TEXT,
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT,
      updated_at TEXT
    );
  `);

  // Credit payments table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS credit_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER,
      credit_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      notes TEXT,
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT
    );
  `);

  // Expenses table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      date TEXT NOT NULL,
      notes TEXT,
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT,
      updated_at TEXT
    );
  `);

  // Reinvestments table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reinvestments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER,
      amount REAL NOT NULL,
      purpose TEXT NOT NULL,
      date TEXT NOT NULL,
      expected_margin REAL,
      projected_profit REAL,
      projected_return REAL,
      notes TEXT,
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT,
      updated_at TEXT
    );
  `);

  // Suppliers table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'synced',
      server_id INTEGER
    );
  `);

  // Purchase orders table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER,
      supplier_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      expected_delivery_date TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT,
      updated_at TEXT
    );
  `);

  // Sync queue table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      table_name TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      last_error TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_metadata (
      id INTEGER PRIMARY KEY,
      timestamp TEXT
    );
  `);

  // Create indexes for better performance
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_products_sync ON products(sync_status);
    CREATE INDEX IF NOT EXISTS idx_sales_sync ON sales(sync_status);
    CREATE INDEX IF NOT EXISTS idx_customers_sync ON customers(sync_status);
    CREATE INDEX IF NOT EXISTS idx_credits_sync ON credits(sync_status);
    CREATE INDEX IF NOT EXISTS idx_expenses_sync ON expenses(sync_status);
    CREATE INDEX IF NOT EXISTS idx_reinvestments_sync ON reinvestments(sync_status);
    CREATE INDEX IF NOT EXISTS idx_suppliers_sync ON suppliers(sync_status);
    CREATE INDEX IF NOT EXISTS idx_purchase_orders_sync ON purchase_orders(sync_status);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);
  `);
};

// Secure storage for sensitive data
export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  
  async getItem(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  },
  
  async deleteItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};

// Database operations helpers
export const dbOperations = {
  // Products
  async insertProduct(product: any): Promise<number> {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO products (name, price, stock, category, created_at, updated_at, sync_status, server_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.name,
        product.price,
        product.stock,
        product.category || null,
        product.created_at || new Date().toISOString(),
        product.updated_at || new Date().toISOString(),
        product.sync_status || 'pending',
        product.server_id || null
      ]
    );
    return result.lastInsertRowId;
  },

  async getProducts(): Promise<any[]> {
    const database = await getDatabase();
    return await database.getAllAsync('SELECT * FROM products ORDER BY created_at DESC');
  },

  async getProductById(id: number): Promise<any> {
    const database = await getDatabase();
    return await database.getFirstAsync('SELECT * FROM products WHERE id = ?', [id]);
  },

  async updateProduct(id: number, updates: any): Promise<void> {
    const database = await getDatabase();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    await database.runAsync(`UPDATE products SET ${fields}, updated_at = ? WHERE id = ?`, 
      [...values, new Date().toISOString(), id] as any);
  },

  // Sales
  async insertSale(sale: any): Promise<number> {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO sales (server_id, product_id, customer_id, quantity, total, sale_date, payment_type, sync_status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sale.server_id || null,
        sale.product_id,
        sale.customer_id || null,
        sale.quantity,
        sale.total,
        sale.sale_date,
        sale.payment_type || null,
        sale.sync_status || 'pending',
        sale.created_at || new Date().toISOString()
      ]
    );
    return result.lastInsertRowId;
  },

  async getSales(): Promise<any[]> {
    const database = await getDatabase();
    return await database.getAllAsync('SELECT * FROM sales ORDER BY sale_date DESC');
  },

  // Customers
  async insertCustomer(customer: any): Promise<number> {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO customers (name, phone, email, address, created_at, updated_at, sync_status, server_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer.name,
        customer.phone || null,
        customer.email || null,
        customer.address || null,
        customer.created_at || new Date().toISOString(),
        customer.updated_at || new Date().toISOString(),
        customer.sync_status || 'pending',
        customer.server_id || null
      ]
    );
    return result.lastInsertRowId;
  },

  async getCustomers(): Promise<any[]> {
    const database = await getDatabase();
    return await database.getAllAsync('SELECT * FROM customers ORDER BY created_at DESC');
  },

  // Sync Queue
  async addToSyncQueue(operation: string, tableName: string, data: any): Promise<number> {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO sync_queue (operation, table_name, data, created_at) VALUES (?, ?, ?, ?)`,
      [operation, tableName, JSON.stringify(data), new Date().toISOString()]
    );
    return result.lastInsertRowId;
  },

  async getSyncQueue(): Promise<any[]> {
    const database = await getDatabase();
    return await database.getAllAsync('SELECT * FROM sync_queue ORDER BY created_at ASC');
  },

  async removeFromSyncQueue(id: number): Promise<void> {
    const database = await getDatabase();
    await database.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
  },

  async updateSyncQueueRetry(id: number, error: string): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      'UPDATE sync_queue SET retry_count = retry_count + 1, last_error = ? WHERE id = ?',
      [error, id]
    );
  },

  // Get pending items for sync
  async getPendingItems(tableName: string): Promise<any[]> {
    const database = await getDatabase();
    return await database.getAllAsync(
      `SELECT * FROM ${tableName} WHERE sync_status = 'pending' ORDER BY created_at ASC`
    );
  },

  // Mark item as synced
  async markAsSynced(tableName: string, id: number, serverId: number): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE ${tableName} SET sync_status = 'synced', server_id = ? WHERE id = ?`,
      [serverId, id]
    );
  },

  // Expenses
  async insertExpense(expense: any): Promise<number> {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO expenses (server_id, title, amount, category, date, notes, sync_status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expense.server_id || null,
        expense.title,
        expense.amount,
        expense.category || null,
        expense.date,
        expense.notes || null,
        expense.sync_status || 'pending',
        expense.created_at || new Date().toISOString()
      ]
    );
    return result.lastInsertRowId;
  },

  // Credits
  async insertCredit(credit: any): Promise<number> {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO credits (server_id, customer_id, amount_owed, borrow_date, due_date, notes, sync_status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        credit.server_id || null,
        credit.customer_id,
        credit.amount_owed,
        credit.borrow_date,
        credit.due_date || null,
        credit.notes || null,
        credit.sync_status || 'pending',
        credit.created_at || new Date().toISOString()
      ]
    );
    return result.lastInsertRowId;
  },

  // Reinvestments
  async insertReinvestment(reinvestment: any): Promise<number> {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO reinvestments (server_id, amount, purpose, date, expected_margin, projected_profit, projected_return, notes, sync_status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reinvestment.server_id || null,
        reinvestment.amount,
        reinvestment.purpose,
        reinvestment.date,
        reinvestment.expected_margin || null,
        reinvestment.projected_profit || null,
        reinvestment.projected_return || null,
        reinvestment.notes || null,
        reinvestment.sync_status || 'pending',
        reinvestment.created_at || new Date().toISOString()
      ]
    );
    return result.lastInsertRowId;
  },

  // Suppliers
  async insertSupplier(supplier: any): Promise<number> {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO suppliers (name, contact_person, phone, email, address, created_at, updated_at, sync_status, server_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        supplier.name,
        supplier.contact_person || null,
        supplier.phone || null,
        supplier.email || null,
        supplier.address || null,
        supplier.created_at || new Date().toISOString(),
        supplier.updated_at || new Date().toISOString(),
        supplier.sync_status || 'pending',
        supplier.server_id || null
      ]
    );
    return result.lastInsertRowId;
  },

  // Purchase Orders
  async insertPurchaseOrder(order: any): Promise<number> {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO purchase_orders (server_id, supplier_id, product_id, quantity, expected_delivery_date, status, notes, sync_status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.server_id || null,
        order.supplier_id,
        order.product_id,
        order.quantity,
        order.expected_delivery_date || null,
        order.status || 'pending',
        order.notes || null,
        order.sync_status || 'pending',
        order.created_at || new Date().toISOString()
      ]
    );
    return result.lastInsertRowId;
  },
};

export default getDatabase;
