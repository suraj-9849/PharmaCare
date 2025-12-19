/**
 * @swagger
 * /drugs:
 *   get:
 *     summary: Get all drugs
 *     description: Retrieve paginated list of drugs with optional search
 *     tags:
 *       - Drugs
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by brand name, generic name, or SKU
 *     responses:
 *       200:
 *         description: Drugs retrieved successfully
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create new drug
 *     description: Add a new drug to the system
 *     tags:
 *       - Drugs
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brandName:
 *                 type: string
 *               genericName:
 *                 type: string
 *               category:
 *                 type: string
 *               manufacturer:
 *                 type: string
 *               requiresPrescription:
 *                 type: boolean
 *               reorderLevel:
 *                 type: number
 *     responses:
 *       201:
 *         description: Drug created successfully
 *       400:
 *         description: Invalid request
 *
 * /drugs/{id}:
 *   get:
 *     summary: Get drug by ID
 *     tags:
 *       - Drugs
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Drug retrieved successfully
 *       404:
 *         description: Drug not found
 *   put:
 *     summary: Update drug
 *     tags:
 *       - Drugs
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Drug updated successfully
 *   delete:
 *     summary: Delete drug
 *     tags:
 *       - Drugs
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Drug deleted successfully
 *
 * /drugs/categories:
 *   get:
 *     summary: Get drug categories
 *     description: Retrieve all available drug categories
 *     tags:
 *       - Drugs
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *
 * /drugs/low-stock:
 *   get:
 *     summary: Get low stock drugs
 *     description: Retrieve drugs below reorder level
 *     tags:
 *       - Drugs
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock drugs retrieved successfully
 */

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Get all inventory batches
 *     description: Retrieve paginated list of inventory batches
 *     tags:
 *       - Inventory
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *       - in: query
 *         name: drugId
 *         schema:
 *           type: string
 *         description: Filter by drug ID
 *     responses:
 *       200:
 *         description: Batches retrieved successfully
 *   post:
 *     summary: Create new inventory batch
 *     description: Add new stock/batch to inventory
 *     tags:
 *       - Inventory
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               drugId:
 *                 type: string
 *               supplierId:
 *                 type: string
 *               batchNumber:
 *                 type: string
 *               quantity:
 *                 type: number
 *               costPrice:
 *                 type: number
 *               sellPrice:
 *                 type: number
 *               expiryDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Batch created successfully
 *
 * /inventory/{id}:
 *   get:
 *     summary: Get batch by ID
 *     tags:
 *       - Inventory
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batch retrieved successfully
 *   put:
 *     summary: Update batch
 *     tags:
 *       - Inventory
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batch updated successfully
 *
 * /inventory/summary:
 *   get:
 *     summary: Get stock summary
 *     description: Retrieve summary of stock by drug
 *     tags:
 *       - Inventory
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Stock summary retrieved successfully
 *
 * /inventory/expiring:
 *   get:
 *     summary: Get expiring batches
 *     description: Retrieve batches expiring within specified days
 *     tags:
 *       - Inventory
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 30
 *     responses:
 *       200:
 *         description: Expiring batches retrieved successfully
 *
 * /inventory/expired:
 *   get:
 *     summary: Get expired batches
 *     description: Retrieve all expired batches
 *     tags:
 *       - Inventory
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Expired batches retrieved successfully
 *
 * /inventory/drug/{drugId}/available:
 *   get:
 *     summary: Get available batches for drug
 *     description: Retrieve available batches for a specific drug (for sales)
 *     tags:
 *       - Inventory
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: drugId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Available batches retrieved successfully
 */

/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Get all sales
 *     description: Retrieve paginated list of sales with optional date filtering
 *     tags:
 *       - Sales
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Sales retrieved successfully
 *   post:
 *     summary: Create new sale
 *     description: Record a new sale transaction
 *     tags:
 *       - Sales
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     drugId:
 *                       type: string
 *                     batchId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, CARD, UPI, CREDIT]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sale created successfully
 *
 * /sales/{id}:
 *   get:
 *     summary: Get sale by ID
 *     tags:
 *       - Sales
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sale retrieved successfully
 *
 * /sales/{id}/cancel:
 *   post:
 *     summary: Cancel sale
 *     description: Cancel an existing sale and restore inventory
 *     tags:
 *       - Sales
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sale cancelled successfully
 *
 * /sales/today:
 *   get:
 *     summary: Get today's sales summary
 *     description: Retrieve sales statistics for today
 *     tags:
 *       - Sales
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Today's summary retrieved successfully
 *
 * /sales/stats:
 *   get:
 *     summary: Get sales statistics
 *     description: Retrieve sales stats for specified period
 *     tags:
 *       - Sales
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *     responses:
 *       200:
 *         description: Sales statistics retrieved successfully
 */

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers
 *     description: Retrieve paginated list of customers
 *     tags:
 *       - Customers
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *   post:
 *     summary: Create new customer
 *     tags:
 *       - Customers
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               age:
 *                 type: number
 *     responses:
 *       201:
 *         description: Customer created successfully
 *
 * /customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags:
 *       - Customers
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *   put:
 *     summary: Update customer
 *     tags:
 *       - Customers
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *   delete:
 *     summary: Delete customer
 *     tags:
 *       - Customers
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *
 * /customers/search:
 *   get:
 *     summary: Search customers
 *     tags:
 *       - Customers
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Get all suppliers
 *     description: Retrieve paginated list of suppliers
 *     tags:
 *       - Suppliers
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Suppliers retrieved successfully
 *   post:
 *     summary: Create new supplier
 *     tags:
 *       - Suppliers
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *
 * /suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     tags:
 *       - Suppliers
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supplier retrieved successfully
 *   put:
 *     summary: Update supplier
 *     tags:
 *       - Suppliers
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *   delete:
 *     summary: Delete supplier
 *     tags:
 *       - Suppliers
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supplier deleted successfully
 *
 * /suppliers/simple:
 *   get:
 *     summary: Get all suppliers (simple)
 *     description: Get suppliers for dropdown list
 *     tags:
 *       - Suppliers
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Suppliers list retrieved successfully
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Retrieve comprehensive dashboard metrics and KPIs
 *     tags:
 *       - Dashboard
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 todaySales:
 *                   type: number
 *                 todayRevenue:
 *                   type: number
 *                 totalProducts:
 *                   type: number
 *                 totalSales:
 *                   type: number
 *                 totalRevenue:
 *                   type: number
 *                 lowStockCount:
 *                   type: number
 *                 expiringCount:
 *                   type: number
 *                 expiredCount:
 *                   type: number
 *
 * /dashboard/chart:
 *   get:
 *     summary: Get sales chart data
 *     description: Retrieve sales data for chart visualization
 *     tags:
 *       - Dashboard
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 7
 *     responses:
 *       200:
 *         description: Chart data retrieved successfully
 *
 * /dashboard/top-selling:
 *   get:
 *     summary: Get top selling drugs
 *     description: Retrieve top selling drugs by quantity
 *     tags:
 *       - Dashboard
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 5
 *     responses:
 *       200:
 *         description: Top selling drugs retrieved successfully
 */
