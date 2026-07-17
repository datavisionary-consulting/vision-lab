import { useEffect, useRef, useState } from 'react';

// sql.js is loaded globally via a <script> tag in index.html (window.initSqlJs),
// same CDN approach as the legacy vanilla app — an in-memory SQLite DB seeded
// with a fixed schema shared by every SQL problem.
const SEED_SQL = `
  CREATE TABLE customers (customer_id INTEGER PRIMARY KEY, customer_name TEXT, country TEXT, signup_date TEXT);
  CREATE TABLE products (product_id INTEGER PRIMARY KEY, product_name TEXT, category TEXT, price REAL);
  CREATE TABLE orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER, order_date TEXT, status TEXT);
  CREATE TABLE order_items (item_id INTEGER PRIMARY KEY, order_id INTEGER, product_id INTEGER, quantity INTEGER, unit_price REAL);
  CREATE TABLE employees (employee_id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, department TEXT, hire_date TEXT, manager_id INTEGER);
  CREATE TABLE salaries (salary_id INTEGER PRIMARY KEY, employee_id INTEGER, amount REAL, from_date TEXT, to_date TEXT);
  INSERT INTO customers VALUES (1,'Alice Corp','US','2022-01-15'),(2,'Beta Ltd','UK','2022-03-20'),(3,'Gamma SA','ES','2022-06-01'),(4,'Delta Inc','US','2023-01-10'),(5,'Omega GmbH','DE','2023-02-28');
  INSERT INTO products VALUES (1,'Laptop Pro','Electronics',1200.00),(2,'Wireless Mouse','Electronics',45.00),(3,'Standing Desk','Furniture',350.00),(4,'Monitor 27"','Electronics',399.00),(5,'USB-C Hub','Electronics',59.00),(6,'Office Chair','Furniture',275.00),(7,'Notebook Set','Stationery',18.00),(8,'Pen Pack','Stationery',8.00);
  INSERT INTO orders VALUES (101,1,'2023-01-05','completed'),(102,1,'2023-02-12','completed'),(103,2,'2023-01-20','completed'),(104,2,'2023-03-08','cancelled'),(105,3,'2023-02-25','completed'),(106,3,'2023-04-15','completed'),(107,4,'2023-03-01','completed'),(108,4,'2023-04-20','pending'),(109,1,'2023-05-10','completed'),(110,2,'2023-05-22','completed');
  INSERT INTO order_items VALUES (1,101,1,1,1200.00),(2,101,2,2,45.00),(3,102,4,1,399.00),(4,102,5,3,59.00),(5,103,3,1,350.00),(6,103,6,1,275.00),(7,104,1,1,1200.00),(8,105,2,4,45.00),(9,105,7,2,18.00),(10,106,4,2,399.00),(11,106,8,5,8.00),(12,107,1,1,1200.00),(13,107,5,2,59.00),(14,108,3,1,350.00),(15,109,6,1,275.00),(16,109,2,1,45.00),(17,110,4,1,399.00),(18,110,5,1,59.00);
  INSERT INTO employees VALUES (1,'Sarah','Connor','Engineering','2019-03-01',NULL),(2,'John','Smith','Engineering','2020-06-15',1),(3,'Maria','Garcia','Engineering','2021-01-10',1),(4,'David','Lee','Marketing','2019-08-20',NULL),(5,'Emma','Wilson','Marketing','2021-05-01',4),(6,'James','Brown','Sales','2020-02-14',NULL),(7,'Lisa','Davis','Sales','2022-03-10',6),(8,'Tom','Taylor','Sales','2022-07-01',6);
  INSERT INTO salaries VALUES (1,1,95000,'2019-03-01','2021-12-31'),(2,1,110000,'2022-01-01',NULL),(3,2,72000,'2020-06-15','2022-05-31'),(4,2,85000,'2022-06-01',NULL),(5,3,78000,'2021-01-10',NULL),(6,4,88000,'2019-08-20','2022-03-31'),(7,4,95000,'2022-04-01',NULL),(8,5,65000,'2021-05-01',NULL),(9,6,82000,'2020-02-14','2021-09-30'),(10,6,92000,'2021-10-01',NULL),(11,7,70000,'2022-03-10',NULL),(12,8,68000,'2022-07-01',NULL);
`;

export function useSqlDb() {
  const dbRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    window
      .initSqlJs({ locateFile: (f) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${f}` })
      .then((SQL) => {
        if (cancelled) return;
        const db = new SQL.Database();
        db.run(SEED_SQL);
        dbRef.current = db;
        setReady(true);
      })
      .catch((err) => {
        console.error('sql.js failed:', err);
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { db: dbRef, ready, error };
}
