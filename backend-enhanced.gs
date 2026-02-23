// Enhanced Google Apps Script Backend for ART&INK
// Handles orders, newsletter, and admin dashboard

// Configuration
const PROMPTPAY_ID = "0947145939"; // Your PromptPay number
const ADMIN_EMAIL = "your-email@example.com"; // Replace with your email

// Main doPost function - handles all requests
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
      default:
        return handleOrderSubmission(e);
    }
  } catch (error) {
    Logger.log("ERROR: " + error.toString());
    return jsonError("Internal server error: " + error.toString());
  }
}

// Handle newsletter signup
function handleNewsletterSignup(e) {
  const email = String(e.parameter.email || "").trim();
  Logger.log("=== NEWSLETTER SIGNUP ===");
  Logger.log("Email: " + email);
  
  if (!email || !isValidEmail(email)) {
    return jsonError("Please provide a valid email address");
  }
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet2");
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

// Handle dashboard data request
function handleDashboardData(e) {
  const period = String(e.parameter.period || "30days");
  Logger.log("=== DASHBOARD DATA REQUEST ===");
  Logger.log("Period: " + period);
  
  try {
    const ordersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
    const newsletterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet2");
    
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

// Handle send newsletter
function handleSendNewsletter(e) {
  const subject = String(e.parameter.subject || "").trim();
  const content = String(e.parameter.content || "").trim();
  
  Logger.log("=== SEND NEWSLETTER ===");
  Logger.log("Subject: " + subject);
  
  if (!subject || !content) {
    return jsonError("Subject and content are required");
  }
  
  try {
    const newsletterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet2");
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
    
    // Log the campaign
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

// Process orders data
function processOrdersData(data, period) {
  const orders = [];
  const daysAgo = getDaysAgo(period);
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] && row[5]) { // Order ID and Date exist
      const orderDate = new Date(row[5]);
      if (orderDate >= daysAgo) {
        orders.push({
          orderId: row[0] || "Unknown",
          customer: row[1] || "Unknown",
          product: row[2] || "Unknown",
          amount: parseFloat(row[3]) || 0,
          status: row[4] || "pending",
          date: orderDate.toLocaleDateString()
        });
      }
    }
  }
  
  return orders.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Process newsletter data
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

// Calculate dashboard stats
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

// Prepare chart data
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

// Helper functions
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

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

// Original order handling functions
function handleOrderSubmission(e) {
  const email = String(e.parameter.email || "").trim();
  const phone = String(e.parameter.phone || "").trim();
  const item = String(e.parameter.item || "").trim();
  const price = Number(e.parameter.price);
  const quantity = Number(e.parameter.quantity || 1);
  const size = String(e.parameter.size || "M").trim();
  const base64Image = e.parameter.base64Image;
  const turnstileToken = e.parameter.turnstileToken;
  const action = String(e.parameter.action || "").trim();

  Logger.log("=== ORDER SUBMISSION ===");
  Logger.log("Email: " + email);
  Logger.log("Phone: " + phone);
  Logger.log("Item: " + item);
  Logger.log("Price: " + price);
  Logger.log("Quantity: " + quantity);
  Logger.log("Size: " + size);
  Logger.log("Has Image: " + (base64Image ? "Yes" : "No"));
  Logger.log("Action: " + action);

  // Validate required fields
  if (!email || !phone || !item || price <= 0 || quantity < 1 || quantity > 5) {
    return jsonError("Invalid order data: Maximum 5 items allowed per order");
  }

  const total = Number((price * quantity).toFixed(2));

  // QR Mode (no image) - no turnstile required
  if (!base64Image) {
    const payload = generatePromptPayPayload(PROMPTPAY_ID, total);
    const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" + encodeURIComponent(payload);
    
    return jsonSuccess({
      total: total,
      promptPayPayload: payload,
      qrImage: qrUrl
    });
  }

  // Final Submit Mode - turnstile verification
  if (!turnstileToken) {
    return jsonError("Please complete the bot verification");
  }

  // Verify turnstile token (you'll need to implement this)
  if (!verifyTurnstileToken(turnstileToken)) {
    return jsonError("Bot verification failed");
  }

  // Convert image to blob and save
  try {
    const imageBlob = base64ToBlob(base64Image);
    const imageUrl = saveImageToDrive(imageBlob, email + "_" + Date.now());
    
    // Save order to spreadsheet
    saveOrderToSheet({
      orderId: generateOrderId(),
      email: email,
      phone: phone,
      item: item,
      price: price,
      quantity: quantity,
      size: size,
      total: total,
      imageUrl: imageUrl,
      timestamp: new Date(),
      status: "pending"
    });
    
    // Send confirmation email
    sendOrderConfirmation(email, item, total, generateOrderId());
    
    Logger.log("✅ Order processed successfully");
    
    return jsonSuccess({
      message: "Order submitted successfully!",
      orderId: generateOrderId()
    });
    
  } catch (error) {
    Logger.log("❌ Order processing error: " + error.toString());
    return jsonError("Order processing failed: " + error.toString());
  }
}

function generatePromptPayPayload(promptPayId, amount) {
  const payload = "00020101021129370016A000000677010001021300011668000000010973000685866666666666666011506" +
                  promptPayId +
                  "5802TH" +
                  "5303764" +
                  "540" + amount.toFixed(2).replace('.', '') +
                  "6304";
  
  const crc = calculateCRC16(payload);
  return payload + crc;
}

function calculateCRC16(data) {
  // Simplified CRC16 calculation - you may need to implement proper CRC16
  return "1234";
}

function base64ToBlob(base64Data) {
  const base64 = base64Data.split(',')[1];
  const bytes = Utilities.base64Decode(base64);
  return Utilities.newBlob(bytes, 'image/jpeg', 'payment_slip.jpg');
}

function saveImageToDrive(blob, filename) {
  const folder = DriveApp.getFolderById("YOUR_FOLDER_ID"); // Replace with your folder ID
  const file = folder.createFile(blob);
  return file.getUrl();
}

function saveOrderToSheet(orderData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  if (!sheet) {
    throw new Error("Orders sheet not found");
  }
  
  sheet.appendRow([
    orderData.orderId,
    orderData.email,
    orderData.phone,
    orderData.item,
    orderData.price,
    orderData.quantity,
    orderData.size,
    orderData.total,
    orderData.imageUrl,
    orderData.timestamp,
    orderData.status
  ]);
}

function generateOrderId() {
  return "ORD" + Date.now() + Math.floor(Math.random() * 1000);
}

function sendOrderConfirmation(email, item, total, orderId) {
  const subject = "Order Confirmation - ART&INK";
  const body = `
    Thank you for your order!
    
    Order ID: ${orderId}
    Product: ${item}
    Total: ฿${total}
    
    We'll process your order and send updates via email.
    
    Best regards,
    ART&INK Team
  `;
  
  MailApp.sendEmail(email, subject, body);
}

function verifyTurnstileToken(token) {
  // Implement turnstile verification
  // You'll need to make a request to Cloudflare's verification endpoint
  return true; // Placeholder
}

// Utility functions
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
