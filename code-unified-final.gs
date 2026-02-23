/*************************************************
 * 🎁 ART&INK SHOP – UNIFIED BACKEND (GOOGLE APPS SCRIPT)
 * Orders • Newsletter • Admin Dashboard • ImgBB • Turnstile • PromptPay QR
 *************************************************/

const SHEET_ID = "1MAN3a83glO-yst1s1ar0QahYiHCT4Hi1lLK2iJwkNTU";
const SHEET_NAME = "Sheet1";
const NEWSLETTER_SHEET = "Sheet2";

const STORE_NAME = "ART&INK Shop";
const FROM_NAME = "ART&INK Shop Orders";
const PROMPTPAY_ID = "0933372907"; // 🔥 YOUR PROMPTPAY
const ADMIN_EMAIL = "your-email@example.com"; // Replace with your email

// =================================================
// ========== MAIN ENTRY POINTS ==========
function doGet(e) {
  return HtmlService.createHtmlOutput(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ART&INK Admin Dashboard</title>
  <style>
    :root {
      --bg-primary: #0a0a0a;
      --bg-secondary: #1a1a1a;
      --bg-tertiary: #2a2a2a;
      --text-primary: #ffffff;
      --text-secondary: #a0a0a0;
      --accent-blue: #3b82f6;
      --accent-green: #10b981;
      --accent-amber: #f59e0b;
      --accent-purple: #8b5cf6;
      --accent-red: #ef4444;
      --border-color: #333333;
      --gradient-start: #f3a6c8;
      --gradient-end: #3498db;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
    }

    .dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-color);
    }

    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .date-filters {
      display: flex;
      gap: 10px;
    }

    .filter-btn {
      padding: 10px 20px;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-primary);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .filter-btn:hover {
      background: var(--bg-tertiary);
    }

    .filter-btn.active {
      background: var(--accent-blue);
      border-color: var(--accent-blue);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .stat-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .stat-icon.orders { background: rgba(59, 130, 246, 0.2); color: var(--accent-blue); }
    .stat-icon.revenue { background: rgba(16, 185, 129, 0.2); color: var(--accent-green); }
    .stat-icon.products { background: rgba(245, 158, 11, 0.2); color: var(--accent-amber); }
    .stat-icon.customers { background: rgba(139, 92, 246, 0.2); color: var(--accent-purple); }
    .stat-icon.newsletter { background: rgba(243, 166, 200, 0.2); color: var(--gradient-start); }

    .stat-label {
      color: var(--text-secondary);
      font-size: 0.9rem;
      font-weight: 500;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .stat-change {
      font-size: 0.85rem;
      font-weight: 600;
    }

    .stat-change.positive { color: var(--accent-green); }
    .stat-change.negative { color: var(--accent-red); }

    .charts-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 40px;
    }

    .chart-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
    }

    .chart-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .chart-container {
      height: 300px;
      position: relative;
    }

    .orders-table {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 40px;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .search-box {
      padding: 10px 16px;
      border: 1px solid var(--border-color);
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border-radius: 8px;
      width: 300px;
    }

    .orders-table table {
      width: 100%;
      border-collapse: collapse;
    }

    .orders-table th {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-weight: 600;
    }

    .orders-table td {
      padding: 12px;
      border-bottom: 1px solid var(--border-color);
    }

    .orders-table tr:hover {
      background: var(--bg-tertiary);
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .status-badge.pending { background: rgba(245, 158, 11, 0.2); color: var(--accent-amber); }
    .status-badge.completed { background: rgba(16, 185, 129, 0.2); color: var(--accent-green); }
    .status-badge.cancelled { background: rgba(239, 68, 68, 0.2); color: var(--accent-red); }

    .newsletter-section {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 40px;
    }

    .newsletter-controls {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .newsletter-input {
      flex: 1;
      min-width: 300px;
      padding: 12px 16px;
      border: 1px solid var(--border-color);
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border-radius: 8px;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: var(--accent-blue);
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-success {
      background: var(--accent-green);
      color: white;
    }

    .btn-success:hover {
      background: #059669;
    }

    .newsletter-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .newsletter-stat {
      background: var(--bg-tertiary);
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }

    .newsletter-stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--gradient-start);
    }

    .newsletter-stat-label {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--text-secondary);
    }

    .error {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid var(--accent-red);
      color: var(--accent-red);
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .success {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid var(--accent-green);
      color: var(--accent-green);
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    @media (max-width: 768px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
      
      .date-filters {
        flex-wrap: wrap;
      }
      
      .search-box {
        width: 100%;
      }
      
      .newsletter-controls {
        flex-direction: column;
      }
      
      .newsletter-input {
        min-width: auto;
      }
    }
  </style>
</head>
<body>
  <div class="dashboard-container">
    <header class="header">
      <h1>ART&INK Admin Dashboard</h1>
      <div class="date-filters">
        <button class="filter-btn" onclick="loadData('7days')">7 Days</button>
        <button class="filter-btn active" onclick="loadData('30days')">30 Days</button>
        <button class="filter-btn" onclick="loadData('90days')">90 Days</button>
      </div>
    </header>

    <div id="messageContainer"></div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon orders">📦</div>
          <div class="stat-label">Total Orders</div>
        </div>
        <div class="stat-value" id="totalOrders">-</div>
        <div class="stat-change positive" id="ordersChange">+0% from last period</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon revenue">💰</div>
          <div class="stat-label">Revenue</div>
        </div>
        <div class="stat-value" id="totalRevenue">-</div>
        <div class="stat-change positive" id="revenueChange">+0% from last period</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon products">👕</div>
          <div class="stat-label">Products Sold</div>
        </div>
        <div class="stat-value" id="totalProducts">-</div>
        <div class="stat-change negative" id="productsChange">-0% from last period</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon customers">👥</div>
          <div class="stat-label">New Customers</div>
        </div>
        <div class="stat-value" id="totalCustomers">-</div>
        <div class="stat-change positive" id="customersChange">+0% from last period</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-icon newsletter">📧</div>
          <div class="stat-label">Newsletter Subscribers</div>
        </div>
        <div class="stat-value" id="totalSubscribers">-</div>
        <div class="stat-change positive" id="subscribersChange">+0% from last period</div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <h3 class="chart-title">Daily Sales Trend</h3>
        <div class="chart-container">
          <canvas id="salesChart"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <h3 class="chart-title">Sales by Product</h3>
        <div class="chart-container">
          <canvas id="productChart"></canvas>
        </div>
      </div>
    </div>

    <div class="orders-table">
      <div class="table-header">
        <h3 class="chart-title">Recent Orders</h3>
        <input type="text" class="search-box" placeholder="Search orders..." onkeyup="searchOrders(this.value)">
      </div>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Product</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody id="ordersTableBody">
          <tr>
            <td colspan="6" class="loading">Loading orders...</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="newsletter-section">
      <h3 class="chart-title">Newsletter Management</h3>
      <div class="newsletter-controls">
        <input type="text" class="newsletter-input" id="newsletterSubject" placeholder="Email subject">
        <textarea class="newsletter-input" id="newsletterContent" placeholder="Email content" rows="3"></textarea>
        <button class="btn btn-success" onclick="sendNewsletter()">Send to All Subscribers</button>
      </div>
      <div class="newsletter-stats">
        <div class="newsletter-stat">
          <div class="newsletter-stat-value" id="subscriberCount">-</div>
          <div class="newsletter-stat-label">Total Subscribers</div>
        </div>
        <div class="newsletter-stat">
          <div class="newsletter-stat-value" id="recentSubscribers">-</div>
          <div class="newsletter-stat-label">New This Month</div>
        </div>
        <div class="newsletter-stat">
          <div class="newsletter-stat-value" id="newsletterSent">-</div>
          <div class="newsletter-stat-label">Emails Sent</div>
        </div>
        <div class="newsletter-stat">
          <div class="newsletter-stat-value" id="newsletterOpenRate">-</div>
          <div class="newsletter-stat-label">Open Rate</div>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    let salesChart = null;
    let productChart = null;
    let currentFilter = '30days';
    let allOrders = [];

    // Initialize dashboard
    document.addEventListener('DOMContentLoaded', function() {
      loadData('30days');
      initCharts();
    });

    function initCharts() {
      const salesCtx = document.getElementById('salesChart').getContext('2d');
      salesChart = new Chart(salesCtx, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Daily Sales',
            data: [],
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: '#a0a0a0'
              }
            },
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: '#a0a0a0'
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: '#ffffff'
              }
            }
          }
        }
      });

      const productCtx = document.getElementById('productChart').getContext('2d');
      productChart = new Chart(productCtx, {
        type: 'doughnut',
        data: {
          labels: [],
          datasets: [{
            data: [],
            backgroundColor: [
              'rgba(243, 166, 200, 0.8)',
              'rgba(52, 152, 219, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(139, 92, 246, 0.8)'
            ],
            borderColor: [
              'rgba(243, 166, 200, 1)',
              'rgba(52, 152, 219, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(139, 92, 246, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#ffffff'
              }
            }
          }
        }
      });
    }

    async function loadData(period) {
      currentFilter = period;
      
      // Update active filter button
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      event.target.classList.add('active');

      try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbxmkzXhx6o1h2vXjQrQwx4VwxKaSQTy6fxtxwsKOjRn9RKuYJW9Ry-CVb6xCweuTSZxrw/exec', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            action: 'dashboard',
            period: period
          })
        });

        const result = await response.json();
        
        if (result.success) {
          updateStats(result.data.stats);
          updateCharts(result.data.charts);
          updateOrdersTable(result.data.orders);
          updateNewsletterStats(result.data.newsletter);
        } else {
          showMessage(result.message || 'Failed to load dashboard data', 'error');
        }
      } catch (error) {
        console.error('Dashboard error:', error);
        showMessage('Network error. Please try again.', 'error');
      }
    }

    function updateStats(stats) {
      document.getElementById('totalOrders').textContent = stats.totalOrders || '0';
      document.getElementById('totalRevenue').textContent = '฿' + (stats.totalRevenue || '0');
      document.getElementById('totalProducts').textContent = stats.totalProducts || '0';
      document.getElementById('totalCustomers').textContent = stats.totalCustomers || '0';
      document.getElementById('totalSubscribers').textContent = stats.totalSubscribers || '0';

      document.getElementById('ordersChange').textContent = (stats.ordersChange >= 0 ? '+' : '') + stats.ordersChange + '% from last period';
      document.getElementById('ordersChange').className = 'stat-change ' + (stats.ordersChange >= 0 ? 'positive' : 'negative');

      document.getElementById('revenueChange').textContent = (stats.revenueChange >= 0 ? '+' : '') + stats.revenueChange + '% from last period';
      document.getElementById('revenueChange').className = 'stat-change ' + (stats.revenueChange >= 0 ? 'positive' : 'negative');

      document.getElementById('productsChange').textContent = (stats.productsChange >= 0 ? '+' : '') + stats.productsChange + '% from last period';
      document.getElementById('productsChange').className = 'stat-change ' + (stats.productsChange >= 0 ? 'positive' : 'negative');

      document.getElementById('customersChange').textContent = (stats.customersChange >= 0 ? '+' : '') + stats.customersChange + '% from last period';
      document.getElementById('customersChange').className = 'stat-change ' + (stats.customersChange >= 0 ? 'positive' : 'negative');

      document.getElementById('subscribersChange').textContent = (stats.subscribersChange >= 0 ? '+' : '') + stats.subscribersChange + '% from last period';
      document.getElementById('subscribersChange').className = 'stat-change ' + (stats.subscribersChange >= 0 ? 'positive' : 'negative');
    }

    function updateCharts(charts) {
      // Update sales chart
      if (salesChart && charts.salesData) {
        salesChart.data.labels = charts.salesData.labels;
        salesChart.data.datasets[0].data = charts.salesData.values;
        salesChart.update();
      }

      // Update product chart
      if (productChart && charts.productData) {
        productChart.data.labels = charts.productData.labels;
        productChart.data.datasets[0].data = charts.productData.values;
        productChart.update();
      }
    }

    function updateOrdersTable(orders) {
      allOrders = orders || [];
      const tbody = document.getElementById('ordersTableBody');
      
      if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No orders found</td></tr>';
        return;
      }

      tbody.innerHTML = orders.map(order => \`
        <tr>
          <td>\${order.orderId}</td>
          <td>\${order.customer}</td>
          <td>\${order.product}</td>
          <td>฿\${order.amount}</td>
          <td><span class="status-badge \${order.status}">\${order.status}</span></td>
          <td>\${order.date}</td>
        </tr>
      \`).join('');
    }

    function updateNewsletterStats(newsletter) {
      document.getElementById('subscriberCount').textContent = newsletter.totalSubscribers || '0';
      document.getElementById('recentSubscribers').textContent = newsletter.recentSubscribers || '0';
      document.getElementById('newsletterSent').textContent = newsletter.emailsSent || '0';
      document.getElementById('newsletterOpenRate').textContent = newsletter.openRate || '0%';
    }

    function searchOrders(query) {
      const filteredOrders = allOrders.filter(order => 
        order.orderId.toLowerCase().includes(query.toLowerCase()) ||
        order.customer.toLowerCase().includes(query.toLowerCase()) ||
        order.product.toLowerCase().includes(query.toLowerCase())
      );
      updateOrdersTable(filteredOrders);
    }

    async function sendNewsletter() {
      const subject = document.getElementById('newsletterSubject').value.trim();
      const content = document.getElementById('newsletterContent').value.trim();
      
      if (!subject || !content) {
        showMessage('Please enter both subject and content', 'error');
        return;
      }

      try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbxmkzXhx6o1h2vXjQrQwx4VwxKaSQTy6fxtxwsKOjRn9RKuYJW9Ry-CVb6xCweuTSZxrw/exec', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            action: 'sendNewsletter',
            subject: subject,
            content: content
          })
        });

        const result = await response.json();
        
        if (result.success) {
          showMessage(\`Newsletter sent to \${result.sentCount} subscribers!\`, 'success');
          document.getElementById('newsletterSubject').value = '';
          document.getElementById('newsletterContent').value = '';
          loadData(currentFilter); // Refresh data
        } else {
          showMessage(result.message || 'Failed to send newsletter', 'error');
        }
      } catch (error) {
        console.error('Newsletter error:', error);
        showMessage('Network error. Please try again.', 'error');
      }
    }

    function showMessage(message, type) {
      const container = document.getElementById('messageContainer');
      container.innerHTML = \`<div class="\${type}">\${message}</div>\`;
      
      setTimeout(() => {
        container.innerHTML = '';
      }, 5000);
    }
  </script>
</body>
</html>
  `).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const action = String(e.parameter.action || "").trim();
    Logger.log("=== REQUEST RECEIVED ===");
    Logger.log("Action: " + action);

    switch(action) {
      case "newsletter":
        return handleNewsletterSignup(e);
      case "dashboard":
        return handleDashboardData(e);
      case "sendNewsletter":
        return handleSendNewsletter(e);
      case "validateDiscount":
        return handleDiscountValidation(e);
      default:
        return handleOrderSubmission(e);
    }
  } catch (err) {
    Logger.log("Backend error: " + err.message + " Stack: " + err.stack);
    return jsonError("Backend exploded: " + err.message);
  }
}

// =================================================
// ========== NEWSLETTER HANDLING ==========
function handleNewsletterSignup(e) {
  const email = String(e.parameter.email || "").trim();
  Logger.log("=== NEWSLETTER SIGNUP ===");
  Logger.log("Email: " + email);
  
  if (!email || !isValidEmail(email)) {
    return jsonError("Please provide a valid email address");
  }
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NEWSLETTER_SHEET);
  if (!sheet) {
    return jsonError("Newsletter sheet not found");
  }
  
  // Check if email already exists
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === email) {
      return jsonError("Email already subscribed");
    }
  }
  
  // Add new subscriber
  sheet.appendRow([email, new Date(), "Active"]);
  Logger.log("✅ Newsletter subscription successful for: " + email);
  
  return jsonSuccess({
    message: "Successfully subscribed to newsletter!",
    email: email
  });
}

// =================================================
// ========== ADMIN DASHBOARD ==========
function handleDashboardData(e) {
  const period = String(e.parameter.period || "30days");
  Logger.log("=== DASHBOARD DATA REQUEST ===");
  Logger.log("Period: " + period);
  
  try {
    const ordersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const newsletterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NEWSLETTER_SHEET);
    
    if (!ordersSheet || !newsletterSheet) {
      return jsonError("Required sheets not found");
    }
    
    // Get orders data
    const ordersData = ordersSheet.getDataRange().getValues();
    const orders = processOrdersData(ordersData, period);
    
    // Get newsletter data
    const newsletterData = newsletterSheet.getDataRange().getValues();
    const newsletterStats = processNewsletterData(newsletterData, period);
    
    // Calculate stats
    const stats = calculateStats(orders, newsletterStats, period);
    
    // Prepare chart data
    const charts = prepareChartData(orders, period);
    
    Logger.log("✅ Dashboard data prepared successfully");
    
    return jsonSuccess({
      stats: stats,
      charts: charts,
      orders: orders.slice(0, 10), // Return recent 10 orders
      newsletter: newsletterStats
    });
    
  } catch (error) {
    Logger.log("Dashboard error: " + error.toString());
    return jsonError("Failed to load dashboard data: " + error.toString());
  }
}

// =================================================
// ========== NEWSLETTER EMAIL SENDER ==========
function handleSendNewsletter(e) {
  const subject = String(e.parameter.subject || "").trim();
  const content = String(e.parameter.content || "").trim();
  
  Logger.log("=== SEND NEWSLETTER ===");
  Logger.log("Subject: " + subject);
  
  if (!subject || !content) {
    return jsonError("Subject and content are required");
  }
  
  try {
    const newsletterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NEWSLETTER_SHEET);
    if (!newsletterSheet) {
      return jsonError("Newsletter sheet not found");
    }
    
    const data = newsletterSheet.getDataRange().getValues();
    const subscribers = [];
    
    // Get active subscribers (skip header row)
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][2] === "Active") {
        subscribers.push(data[i][0]);
      }
    }
    
    if (subscribers.length === 0) {
      return jsonError("No active subscribers found");
    }
    
    // Send emails
    let sentCount = 0;
    const failedEmails = [];
    
    for (const email of subscribers) {
      try {
        MailApp.sendEmail({
          to: email,
          subject: subject,
          htmlBody: createNewsletterEmail(content),
          replyTo: ADMIN_EMAIL
        });
        sentCount++;
        Logger.log("✅ Newsletter sent to: " + email);
      } catch (emailError) {
        Logger.log("❌ Failed to send to " + email + ": " + emailError.toString());
        failedEmails.push(email);
      }
    }
    
    // Log campaign
    newsletterSheet.appendRow([
      "CAMPAIGN_" + new Date().getTime(),
      new Date(),
      subject,
      sentCount,
      failedEmails.length,
      subscribers.length
    ]);
    
    Logger.log("✅ Newsletter campaign completed. Sent: " + sentCount + ", Failed: " + failedEmails.length);
    
    return jsonSuccess({
      message: "Newsletter sent successfully!",
      sentCount: sentCount,
      failedCount: failedEmails.length,
      totalSubscribers: subscribers.length
    });
    
  } catch (error) {
    Logger.log("Send newsletter error: " + error.toString());
    return jsonError("Failed to send newsletter: " + error.toString());
  }
}

// =================================================
// ========== ORDER SUBMISSION (ORIGINAL) ==========
function handleOrderSubmission(e) {
  const email = String(e.parameter.email || "").trim();
  const phone = String(e.parameter.phone || "").trim();
  const item = String(e.parameter.item || "").trim();
  const price = Number(e.parameter.price);
  const quantity = Number(e.parameter.quantity || 1);
  const size = String(e.parameter.size || "M").trim();
  const base64Image = e.parameter.base64Image;
  const turnstileToken = e.parameter.turnstileToken;

  Logger.log("=== ORDER SUBMISSION ===");
  Logger.log("Email: " + email);
  Logger.log("Phone: " + phone);
  Logger.log("Item: " + item);
  Logger.log("Price: " + price);
  Logger.log("Quantity: " + quantity);
  Logger.log("Size: " + size);
  Logger.log("Has Image: " + (base64Image ? "Yes" : "No"));

  if (!item || price <= 0 || quantity < 1 || quantity > 5) {
    return jsonError("Invalid order data: Maximum 5 items allowed per order");
  }

  const total = Number((price * quantity).toFixed(2));

  // QR MODE (NO IMAGE) - NO TURNSTILE REQUIRED
  if (!base64Image) {
    const payload = generatePromptPayPayload(PROMPTPAY_ID, total);
    const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" + encodeURIComponent(payload);

    return jsonSuccess({
      total,
      promptPayPayload: payload,
      qrImage: qrUrl
    });
  }

  // FINAL SUBMIT MODE - TURNSTILE VERIFICATION
  if (!email || !email.includes("@"))
    return jsonError("Invalid email");

  // Professional Turnstile verification with detailed logging
  const turnstileResult = verifyTurnstileProfessional(turnstileToken);
  if (!turnstileResult.success) {
    Logger.log("Turnstile verification failed: " + turnstileResult.error);
    return jsonError("Bot verification failed. Please refresh the page and try again.");
  }

  const slipUrl = uploadToImgBB(base64Image);

  const sheet = SpreadsheetApp
    .openById(SHEET_ID)
    .getSheetByName(SHEET_NAME);

  const orderId = Utilities.getUuid()
    .slice(0, 8)
    .toUpperCase();

  const timestamp = new Date();
  const status = "Pending";

  sheet.appendRow([
    timestamp, // 1
    orderId,   // 2
    email,     // 3
    phone,     // 4
    item,      // 5
    price,     // 6
    quantity,  // 7
    total,     // 8
    status,    // 9
    slipUrl,   // 10
    size       // 11 - NEW: Add size column
  ]);

  sendOrderConfirmation(email, {
    orderId,
    item: item + " (Size: " + size + ")",
    quantity,
    total
  });

  return jsonSuccess({ orderId, total });
}

// =================================================
// ========== DISCOUNT VALIDATION ==========
function handleDiscountValidation(e) {
  const code = String(e.parameter.code || "").trim().toUpperCase();
  Logger.log("=== DISCOUNT VALIDATION REQUEST ===");
  Logger.log("Received code: " + code);
  
  const discount = validateDiscountCode(code);
  Logger.log("Discount result: " + discount);
  
  if (discount > 0) {
    Logger.log("✅ Returning success with discount: " + discount);
    return jsonSuccess({ discount: discount });
  } else {
    Logger.log("❌ Returning error: Invalid discount code");
    return jsonError("Invalid discount code");
  }
}

// =================================================
// ========== DASHBOARD HELPER FUNCTIONS ==========
function processOrdersData(data, period) {
  const orders = [];
  const daysAgo = getDaysAgo(period);
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] && row[0]) { // Order ID and Date exist
      const orderDate = new Date(row[0]);
      if (orderDate >= daysAgo) {
        orders.push({
          orderId: row[1] || "Unknown",
          customer: row[2] || "Unknown",
          product: row[4] || "Unknown",
          amount: parseFloat(row[7]) || 0,
          status: row[8] || "pending",
          date: orderDate.toLocaleDateString()
        });
      }
    }
  }
  
  return orders.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function processNewsletterData(data, period) {
  const daysAgo = getDaysAgo(period);
  let totalSubscribers = 0;
  let recentSubscribers = 0;
  let emailsSent = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // Email exists
      if (row[0].startsWith("CAMPAIGN_")) {
        emailsSent += parseInt(row[3]) || 0; // Sent count
      } else {
        totalSubscribers++;
        const signupDate = new Date(row[1]);
        if (signupDate >= daysAgo) {
          recentSubscribers++;
        }
      }
    }
  }
  
  return {
    totalSubscribers: totalSubscribers,
    recentSubscribers: recentSubscribers,
    emailsSent: emailsSent,
    openRate: "75%" // Mock data - would need email tracking service
  };
}

function calculateStats(orders, newsletterStats, period) {
  const previousPeriod = getPreviousPeriodData(period);
  
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
  const totalProducts = orders.reduce((sum, order) => sum + (parseInt(order.quantity) || 1), 0);
  const uniqueCustomers = new Set(orders.map(order => order.customer)).size;
  
  return {
    totalOrders: totalOrders,
    totalRevenue: totalRevenue.toFixed(0),
    totalProducts: totalProducts,
    totalCustomers: uniqueCustomers,
    totalSubscribers: newsletterStats.totalSubscribers,
    ordersChange: calculateChange(totalOrders, previousPeriod.orders),
    revenueChange: calculateChange(totalRevenue, previousPeriod.revenue),
    productsChange: calculateChange(totalProducts, previousPeriod.products),
    customersChange: calculateChange(uniqueCustomers, previousPeriod.customers),
    subscribersChange: calculateChange(newsletterStats.totalSubscribers, previousPeriod.subscribers)
  };
}

function prepareChartData(orders, period) {
  // Sales data by day
  const salesByDay = {};
  orders.forEach(order => {
    const date = order.date;
    salesByDay[date] = (salesByDay[date] || 0) + order.amount;
  });
  
  const salesData = {
    labels: Object.keys(salesByDay).slice(-7), // Last 7 days
    values: Object.values(salesByDay).slice(-7)
  };
  
  // Product data
  const productSales = {};
  orders.forEach(order => {
    const product = order.product;
    productSales[product] = (productSales[product] || 0) + 1;
  });
  
  const productData = {
    labels: Object.keys(productSales),
    values: Object.values(productSales)
  };
  
  return {
    salesData: salesData,
    productData: productData
  };
}

function getDaysAgo(period) {
  const days = period === "7days" ? 7 : period === "30days" ? 30 : 90;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function getPreviousPeriodData(period) {
  // Mock previous period data - in real implementation, calculate from historical data
  return {
    orders: Math.floor(Math.random() * 20) + 10,
    revenue: Math.floor(Math.random() * 10000) + 5000,
    products: Math.floor(Math.random() * 30) + 15,
    customers: Math.floor(Math.random() * 15) + 8,
    subscribers: Math.floor(Math.random() * 10) + 5
  };
}

function calculateChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function createNewsletterEmail(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>ART&INK Newsletter</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f3a6c8; margin: 0;">ART&INK</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Where Art Meets Everyday Life</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          ${content.replace(/\n/g, '<br>')}
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            You're receiving this email because you subscribed to ART&INK newsletter.<br>
            <a href="#" style="color: #f3a6c8;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// =================================================
// ========== ORIGINAL FUNCTIONS (UNCHANGED) ==========
function generatePromptPayPayload(id, amount) {
  const formattedID = formatPromptPayID(id);
  const formattedAmount = parseFloat(amount).toFixed(2);

  const AID = "A000000677010111";
  
  // Merchant Account Information (Tag 29)
  const tag00 = "00" + formatLength(AID) + AID;  // AID
  const tag01 = "01" + formatLength(formattedID) + formattedID;  // PromptPay ID
  const merchantInfo = tag00 + tag01;
  const tag29 = "29" + formatLength(merchantInfo) + merchantInfo;
  
  // Merchant Category Code (Tag 52) - Required for PromptPay
  const tag52 = "52" + "04" + "0000";  // Fixed 4-digit length + 0000
  
  // Build payload step by step for debugging
  let payload =
    "00" + "02" + "01" +           // 00: Payload Format Indicator
    "01" + "02" + "12" +           // 01: Point of Initiation (Dynamic)
    tag29 +                         // 29: Merchant Account Information
    tag52 +                         // 52: Merchant Category Code
    "53" + "03" + "764" +           // 53: Currency (THB)
    "54" + formatLength(formattedAmount) + formattedAmount +  // 54: Amount
    "58" + "02" + "TH";            // 58: Country Code

  // Add CRC placeholder and calculate
  payload += "6304";  // CRC tag and length placeholder
  
  // Debug logging
  Logger.log("=== PromptPay Payload Debug ===");
  Logger.log("Formatted ID: " + formattedID);
  Logger.log("Formatted Amount: " + formattedAmount);
  Logger.log("Payload before CRC: " + payload);
  Logger.log("Payload length before CRC: " + payload.length);
  
  const crc = calculateCRC(payload);
  payload += crc;
  
  Logger.log("Final payload: " + payload);
  Logger.log("Final payload length: " + payload.length);
  Logger.log("===============================");

  return payload;
}

function formatPromptPayID(id) {
  id = id.replace(/-/g, "").trim();
  
  Logger.log("Original ID: " + id);
  Logger.log("Original ID length: " + id.length);

  if (id.length === 10 && id.startsWith("0")) {
    const formatted = "0066" + id.substring(1);
    Logger.log("Formatted ID (10->13): " + formatted);
    Logger.log("Formatted ID length: " + formatted.length);
    return formatted;
  }

  if (id.length === 13) {
    Logger.log("ID already 13 digits: " + id);
    return id;
  }

  throw new Error("Invalid PromptPay ID: Must be 10-digit Thai number starting with 0, or 13-digit formatted number");
}

function formatLength(value) {
  return value.length.toString().padStart(2, "0");
}

function calculateCRC(payload) {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;

    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000)
        ? (crc << 1) ^ polynomial
        : crc << 1;

      crc &= 0xFFFF;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function verifyTurnstileProfessional(token) {
  try {
    // Log verification attempt
    Logger.log("=== Turnstile Verification Attempt ===");
    Logger.log("Token provided: " + (token ? "YES" : "NO"));
    Logger.log("Token length: " + (token ? token.length : 0));

    if (!token) {
      return { success: false, error: "No token provided" };
    }

    const secret = PropertiesService
      .getScriptProperties()
      .getProperty("TURNSTILE_SECRET");

    if (!secret) {
      Logger.log("TURNSTILE_SECRET not configured");
      return { success: false, error: "Server configuration error" };
    }

    Logger.log("Secret configured: YES");

    // Prepare verification request
    const payload = {
      secret: secret,
      response: token
    };

    // Add remote IP if available
    if (typeof e !== 'undefined' && e && e.parameters && e.parameters.remoteip) {
      payload.remoteip = e.parameters.remoteip;
    }

    Logger.log("Sending verification request to Cloudflare...");

    const response = UrlFetchApp.fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "post",
        payload: payload,
        muteHttpExceptions: true  // Don't throw on HTTP errors
      }
    );

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log("Response code: " + responseCode);
    Logger.log("Response text: " + responseText);

    if (responseCode !== 200) {
      return { success: false, error: "HTTP error: " + responseCode };
    }

    const result = JSON.parse(responseText);
    
    Logger.log("Verification success: " + result.success);
    if (result.error) {
      Logger.log("Verification error: " + result.error);
    }

    return {
      success: result.success === true,
      error: result.error || "Unknown verification error"
    };

  } catch (err) {
    Logger.log("Turnstile verification exception: " + err.message);
    return { success: false, error: "Verification system error" };
  }
}

function uploadToImgBB(base64Image) {
  const apiKey = PropertiesService
    .getScriptProperties()
    .getProperty("IMGBB_KEY");

  if (!apiKey) throw new Error("IMGBB_KEY not set");

  const response = UrlFetchApp.fetch(
    "https://api.imgbb.com/1/upload?key=" + apiKey,
    {
      method: "post",
      payload: { image: base64Image }
    }
  );

  const result = JSON.parse(response.getContentText());

  if (!result.success)
    throw new Error("ImgBB upload failed");

  return result.data.url;
}

function sendOrderConfirmation(email, order) {
  MailApp.sendEmail({
    to: email,
    subject: `🧾 Order Confirmed – ${order.orderId}`,
    name: FROM_NAME,
    htmlBody: `
    <div style="background:#f4f6f8;padding:40px;font-family:Arial;">
      <div style="max-width:600px;margin:auto;background:#fff;
                  padding:30px;border-radius:14px;
                  box-shadow:0 10px 30px rgba(0,0,0,0.06);">

        <h2 style="margin-top:0;">🎉 Order Received</h2>

        <div style="background:#fafafa;padding:20px;
                    border-radius:10px;margin-top:20px;">

          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Item:</strong> ${order.item}</p>
          <p><strong>Quantity:</strong> ${order.quantity}</p>
          <p style="font-size:18px;">
            <strong>Total: ฿${order.total}</strong>
          </p>

          <span style="
            display:inline-block;
            padding:6px 12px;
            background:#fff3cd;
            border-radius:20px;
            font-size:12px;
            font-weight:bold;">
            ⏳ Payment Verification Pending
          </span>

        </div>

        <p style="margin-top:25px;font-size:13px;color:#666;">
          We are reviewing your payment slip.
          You will receive another email when your order is ready.
        </p>

        <hr style="border:none;border-top:1px solid #eee;margin-top:30px;">
        <small>${STORE_NAME}</small>

      </div>
    </div>
    `
  });
}

function validateDiscountCode(code) {
  // Discount codes stored securely in backend
  const discounts = {
    'SAVE10': 10,
    'SAVE20': 20,
    'WELCOME': 15,
    'ARTINK10': 10,
    'SPECIAL25': 25,
    'FIRSTORDER': 30,
    'SUMMER20': 20,
    'VIP15': 15,
    'NEWYEAR50': 50,
    'FREESHIP': 50,
    'LOYALTY20': 20,
    'FLASH30': 30,
    'STUDENT15': 15,
    'BIRTHDAY25': 25
  };
  
  Logger.log("Discount code validation attempt: " + code);
  
  if (discounts[code]) {
    Logger.log("Valid discount code: " + code + " - ฿" + discounts[code] + " off");
    return discounts[code];
  } else {
    Logger.log("Invalid discount code: " + code);
    return 0;
  }
}

function jsonSuccess(data) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    data: data
  })).setMimeType(ContentService.MimeType.JSON);
}

function jsonError(message) {
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
}

function onEdit(e) {
  const sheet = e.range.getSheet();
  if (sheet.getName() !== SHEET_NAME) return;

  if (e.range.getColumn() !== 9) return; // STATUS column
  if (!e.value || e.value !== "Done") return;

  const row = e.range.getRow();

  const email = sheet.getRange(row, 3).getValue();
  const orderId = sheet.getRange(row, 2).getValue();
  const item = sheet.getRange(row, 5).getValue();
  const quantity = sheet.getRange(row, 7).getValue();

  if (!email) return;

  MailApp.sendEmail({
    to: email,
    subject: `🎉 Your Order is Ready – ${orderId}`,
    name: FROM_NAME,
    htmlBody: `
    <div style="background:#f4f6f8;padding:40px;font-family:Arial;">
      <div style="max-width:600px;margin:auto;background:#fff;
                  padding:30px;border-radius:14px;
                  box-shadow:0 10px 30px rgba(0,0,0,0.06);">

        <h2>🎉 Your Order is Ready!</h2>

        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Item:</strong> ${item}</p>
        <p><strong>Quantity:</strong> ${quantity}</p>

        <div style="background:#f0fdf4;
                    padding:15px;
                    border-radius:10px;
                    margin-top:20px;">
          📍 <strong>Pickup Location:</strong><br>
          2nd floor OpenLab, Building 4
        </div>

        <hr style="border:none;border-top:1px solid #eee;margin-top:30px;">
        <small>${STORE_NAME}</small>

      </div>
    </div>
    `
  });
}

// =================================================
// ========== TEST FUNCTIONS ==========
function testPromptPayQR() {
  try {
    Logger.log("=== TESTING PROMPTPAY QR GENERATION ===");
    
    const testID = "0933372907";  // Your current PromptPay ID
    const testAmount = 590.00;    // Test amount
    
    const payload = generatePromptPayPayload(testID, testAmount);
    
    Logger.log("✅ QR Generated Successfully");
    Logger.log("📱 Test ID: " + testID);
    Logger.log("💰 Test Amount: ฿" + testAmount);
    Logger.log("🔗 Payload: " + payload);
    Logger.log("📏 Payload Length: " + payload.length);
    
    // Expected length for dynamic PromptPay QR: 95-120 characters
    if (payload.length >= 95 && payload.length <= 120) {
      Logger.log("✅ Payload length within expected range");
    } else {
      Logger.log("⚠️ Payload length outside expected range (95-120)");
    }
    
    return payload;
    
  } catch (err) {
    Logger.log("❌ Test Failed: " + err.message);
    throw err;
  }
}

function testTurnstileVerification() {
  Logger.log("=== TURNSTILE CONFIGURATION TEST ===");
  
  const secret = PropertiesService
    .getScriptProperties()
    .getProperty("TURNSTILE_SECRET");
  
  if (secret) {
    Logger.log("✅ TURNSTILE_SECRET is configured");
    Logger.log("Secret length: " + secret.length);
  } else {
    Logger.log("❌ TURNSTILE_SECRET is NOT configured");
    Logger.log("Please set this property in Google Apps Script:");
    Logger.log("PropertiesService.getScriptProperties().setProperty('TURNSTILE_SECRET', 'your_secret_here');");
  }
  
  return secret ? "CONFIGURED" : "NOT CONFIGURED";
}
