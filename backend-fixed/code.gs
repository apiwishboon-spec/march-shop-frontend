/*************************************************
 * 🔒 SECURE ART&INK SHOP BACKEND (GOOGLE APPS SCRIPT)
 * 
 * SECURITY PRINCIPLES:
 * - Never trust client data
 * - Server is single source of truth
 * - All inputs validated and sanitized
 * - Rate limiting and session management
 * - Comprehensive error handling
 *************************************************/

// =================================================
// CONFIGURATION & CONSTANTS
// =================================================
const SHEET_ID = "1MAN3a83glO-yst1s1ar0QahYiHCT4Hi1lLK2iJwkNTU";
const SHEET_NAME = "Sheet1";
const NEWSLETTER_SHEET = "Sheet2";

// Secure admin password from Script Properties
const ADMIN_PASSWORD = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');

// Store configuration
const STORE_NAME = "ART&INK Shop";
const FROM_NAME = "ART&INK Shop Orders";
const PROMPTPAY_ID = "0933372907";

// =================================================
// SERVER-SIDE PRODUCT CATALOG (SECURITY: Never trust client prices)
// =================================================
const PRODUCTS = {
  "Abstract Line Art Tee": 290,
  "Cyber Geometry Tee": 350,
  "Vintage Wave Tee": 320,
  "Nature Sketch Tee": 280,
  "Urban Typography Tee": 340,
  "Test Product": 1,
  "Cosmic Dreams Tee": 330,
  "Tropical Paradise Tee": 310,
  "Minimalist Grid Tee": 295
};

// =================================================
// SERVER-SIDE DISCOUNT CODES (SECURITY: Never trust client amounts)
// =================================================
const DISCOUNT_CODES = {
  "WELCOME10": 10,
  "ARTINK15": 15,
  "SPECIAL20": 20
};

// =================================================
// SESSION MANAGEMENT
// =================================================
const SESSION_DURATION = 3600000; // 1 hour in milliseconds

// =================================================
// RATE LIMITING
// =================================================
const RATE_LIMIT_WINDOW = 300000; // 5 minutes in milliseconds
const MAX_ORDERS_PER_WINDOW = 3;

// =================================================
// GOOGLE AUTH VERIFICATION
// =================================================
function verifyGoogleToken(idToken) {
  var url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + idToken;
  try {
    var response = UrlFetchApp.fetch(url);
    var tokenInfo = JSON.parse(response.getContentText());
    
    // Verify audience matches your Client ID
    if (tokenInfo.aud === '292346174128-fk8na6afbrb07q2v1oqc193j83idtjuh.apps.googleusercontent.com') {
      return { success: true, email: tokenInfo.email, name: tokenInfo.name };
    }
    return { success: false, error: "Invalid audience" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// =================================================
// MAIN ENTRY POINT
// =================================================
function doPost(e) {
  try {
    // Log all requests for security monitoring
    Logger.log("=== REQUEST RECEIVED ===");
    Logger.log("Action: " + (e.parameter.action || "none"));
    Logger.log("Remote IP: " + (e.parameters.remoteip || "unknown"));
    Logger.log("User Agent: " + (e.parameters.useragent || "unknown"));
    
    const action = String(e.parameter.action || "").trim();
    
    // Route to appropriate handler
    switch (action) {
      case "adminLogin":
        return handleAdminLogin(e);
      case "adminData":
        return handleAdminData(e);
      case "getOrders":
        return handleGetOrders(e);
      case "markOrderDone":
        return handleMarkOrderDone(e);
      case "sendCustomNewsletter":
        return handleSendCustomNewsletter(e);
      case "newsletter":
        return handleNewsletterSubscription(e);
      case "validateDiscount":
        return handleDiscountValidation(e);
      case "order":
        return handleOrderSubmission(e);
      case "sendReadyEmails":
        return handleSendReadyEmails(e);
      case "getSubscribers":
        return handleGetSubscribers(e);
      default:
        Logger.log("❌ Invalid action: " + action);
        return jsonError("Invalid request");
    }
    
  } catch (error) {
    // Security: Never expose internal errors to client
    Logger.log("❌ INTERNAL ERROR: " + error.toString());
    Logger.log("Stack trace: " + error.stack);
    return jsonError("Internal server error");
  }
}

// =================================================
// ADMIN LOGIN HANDLER (SECURITY: Session-based authentication)
// =================================================
function handleAdminLogin(e) {
  const password = String(e.parameter.password || "").trim();
  
  // Technical data for security purposes
  const userAgent = String(e.parameter.useragent || "").trim();
  const timestamp = String(e.parameter.timestamp || "").trim();
  const remoteIP = String(e.parameters.remoteip || "unknown").trim();
  
  Logger.log("=== ADMIN LOGIN ATTEMPT ===");
  Logger.log("Password provided: " + (password ? "YES" : "NO"));
  
  // Log technical data for security
  Logger.log("=== SECURITY DATA ===");
  Logger.log("Remote IP: " + remoteIP);
  Logger.log("User Agent: " + userAgent);
  Logger.log("Timestamp: " + timestamp);
  
  // Validate password server-side
  if (!password || password !== ADMIN_PASSWORD) {
    Logger.log("❌ Admin login failed: Invalid password from IP: " + remoteIP);
    return jsonError("Invalid credentials");
  }
  
  // Generate secure session token
  const sessionToken = Utilities.getUuid();
  
  // Store session with expiration
  const sessionData = {
    token: sessionToken,
    timestamp: Date.now(),
    purpose: "admin"
  };
  
  PropertiesService.getScriptProperties()
    .setProperty("admin_session_" + sessionToken, JSON.stringify(sessionData));
  
  Logger.log("✅ Admin login successful");
  return jsonSuccess({ 
    message: "Login successful",
    token: sessionToken
  });
}

// =================================================
// ADMIN DATA HANDLER (SECURITY: Token validation required)
// =================================================
function handleAdminData(e) {
  const token = String(e.parameter.token || "").trim();
  
  // Validate admin session
  if (!validateAdminSession(token)) {
    Logger.log("❌ Unauthorized admin data request");
    return jsonError("Unauthorized");
  }
  
  Logger.log("=== ADMIN DATA REQUEST (AUTHORIZED) ===");
  
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Calculate metrics securely
    let totalOrders = 0;
    let totalRevenue = 0;
    let productsSold = 0;
    const customerEmails = new Set();
    
    // Skip header row, process data
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[8] === "Done") { // Status column
        totalOrders++;
        totalRevenue += Number(row[7]) || 0; // Total (column H, index 7)
        productsSold += Number(row[6]) || 0; // Quantity (column G, index 6)
        customerEmails.add(row[3]); // Email (column D, index 3)
      }
    }
    
    // Get newsletter count
    const newsletterSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(NEWSLETTER_SHEET);
    const newsletterData = newsletterSheet.getDataRange().getValues();
    const subscriberCount = newsletterData.length - 1; // Subtract header
    
    Logger.log("✅ Admin data retrieved successfully");
    return jsonSuccess({
      orders: totalOrders,
      revenue: totalRevenue,
      productsSold: productsSold,
      newCustomers: customerEmails.size,
      subscribers: subscriberCount
    });
    
  } catch (error) {
    Logger.log("❌ Error retrieving admin data: " + error.toString());
    return jsonError("Failed to load data");
  }
}

// =================================================
// GET ALL ORDERS (Admin only)
// =================================================
function handleGetOrders(e) {
  const token = String(e.parameter.token || "").trim();
  if (!validateAdminSession(token)) return jsonError("Unauthorized");

  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    const orders = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      orders.push({
        rowIndex: i + 1, // 1-based row number for later updates
        timestamp:  row[0],
        orderId:    row[1],
        email:      row[2],
        phone:      row[3],
        item:       row[4],
        unitPrice:  row[5],
        qty:        row[6],
        total:      row[7],
        status:     row[8],  // I — Pending / Done
        slipUrl:    row[9],  // J
        size:       row[10], // K
        name:       row[11]  // L
      });
    }

    return jsonSuccess({ orders });
  } catch (err) {
    Logger.log("❌ getOrders error: " + err.toString());
    return jsonError("Failed to load orders");
  }
}

// =================================================
// MARK ORDER AS DONE (Admin only — writes 'Done' to column I)
// =================================================
function handleMarkOrderDone(e) {
  const token    = String(e.parameter.token    || "").trim();
  const rowIndex = parseInt(e.parameter.rowIndex || "0", 10);

  if (!validateAdminSession(token)) return jsonError("Unauthorized");
  if (!rowIndex || rowIndex < 2)    return jsonError("Invalid row");

  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    sheet.getRange(rowIndex, 9).setValue("Done"); // Column I (1-based = 9)
    Logger.log("✅ Row " + rowIndex + " marked as Done");
    return jsonSuccess({ rowIndex });
  } catch (err) {
    Logger.log("❌ markOrderDone error: " + err.toString());
    return jsonError("Failed to update order");
  }
}

// =================================================
// GET SUBSCRIBERS (Admin only)
// =================================================
function handleGetSubscribers(e) {
  const token = String(e.parameter.token || "").trim();
  
  // Validate admin session
  if (!validateAdminSession(token)) {
    Logger.log("❌ Unauthorized getSubscribers request");
    return jsonError("Unauthorized");
  }
  
  Logger.log("=== GET SUBSCRIBERS REQUEST (AUTHORIZED) ===");
  
  try {
    const newsletterSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(NEWSLETTER_SHEET);
    const data = newsletterSheet.getDataRange().getValues();
    
    const subscribers = [];
    
    // Skip header row, process data
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && isValidEmail(row[0])) { // Email validation
        subscribers.push({
          email: row[0],     // Column A - Email
          date: row[1] || '' // Column B - Timestamp
        });
      }
    }
    
    Logger.log("✅ Retrieved " + subscribers.length + " subscribers");
    return jsonSuccess({ 
      subscribers: subscribers 
    });
    
  } catch (error) {
    Logger.log("❌ Error retrieving subscribers: " + error.toString());
    return jsonError("Failed to load subscribers");
  }
}

// =================================================
// CUSTOM NEWSLETTER HANDLER (SECURITY: Token validation required)
// =================================================
function handleSendCustomNewsletter(e) {
  const token = String(e.parameter.token || "").trim();
  const subject = String(e.parameter.subject || "").trim();
  const htmlContent = String(e.parameter.content || "").trim();
  
  // Validate admin session
  if (!validateAdminSession(token)) {
    Logger.log("❌ Unauthorized newsletter send attempt");
    return jsonError("Unauthorized");
  }
  
  // Validate inputs
  if (!subject || !htmlContent) {
    Logger.log("❌ Missing newsletter content");
    return jsonError("Subject and content are required");
  }
  
  if (subject.length > 200) {
    Logger.log("❌ Subject too long: " + subject.length);
    return jsonError("Subject too long");
  }
  
  if (htmlContent.length > 50000) {
    Logger.log("❌ Content too long: " + htmlContent.length);
    return jsonError("Content too long");
  }
  
  Logger.log("=== SENDING CUSTOM NEWSLETTER ===");
  
  try {
    const newsletterSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(NEWSLETTER_SHEET);
    const data = newsletterSheet.getDataRange().getValues();
    
    const emails = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && isValidEmail(data[i][0])) {
        emails.push(data[i][0]);
      }
    }
    
    if (emails.length === 0) {
      Logger.log("❌ No valid subscribers found");
      return jsonError("No subscribers found");
    }
    
    // Send to subscribers
    let sentCount = 0;
    emails.forEach(email => {
      try {
        MailApp.sendEmail({
          to: email,
          subject: subject,
          name: FROM_NAME,
          htmlBody: htmlContent
        });
        sentCount++;
      } catch (mailErr) {
        Logger.log("⚠️ Failed to send to " + email + ": " + mailErr.message);
      }
    });
    
    Logger.log("✅ Custom newsletter sent to " + sentCount + " subscribers");
    return jsonSuccess({ 
      message: "Newsletter sent successfully", 
      sentTo: sentCount 
    });
    
  } catch (error) {
    Logger.log("❌ Error sending newsletter: " + error.toString());
    return jsonError("Failed to send newsletter");
  }
}

// =================================================
// NEWSLETTER SUBSCRIPTION
// =================================================
function handleNewsletterSubscription(e) {
  const email = String(e.parameter.email || "").trim();
  
  // Technical data for security purposes
  const userAgent = String(e.parameter.useragent || "").trim();
  const timestamp = String(e.parameter.timestamp || "").trim();
  const remoteIP = String(e.parameters.remoteip || "unknown").trim();
  
  Logger.log("=== NEWSLETTER SUBSCRIPTION ===");
  Logger.log("Email: " + email);
  
  // Log technical data for security
  Logger.log("=== SECURITY DATA ===");
  Logger.log("Remote IP: " + remoteIP);
  Logger.log("User Agent: " + userAgent);
  Logger.log("Timestamp: " + timestamp);
  Logger.log("Email Domain: " + (email.includes('@') ? email.split('@')[1] : 'invalid'));
  
  // Validate email format
  if (!email || !isValidEmail(email)) {
    Logger.log("❌ Invalid email format: " + email);
    return jsonError("Invalid email format");
  }
  
  // Rate limiting: Check recent subscriptions
  if (isRateLimited(email, "newsletter")) {
    Logger.log("❌ Rate limited newsletter subscription: " + email);
    return jsonError("Too many subscription attempts. Please try again later.");
  }
  
  try {
    const newsletterSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(NEWSLETTER_SHEET);
    const data = newsletterSheet.getDataRange().getValues();
    
    // Check for existing subscription
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === email) {
        Logger.log("❌ Email already subscribed: " + email);
        return jsonError("Email already subscribed");
      }
    }
    
    // Add new subscriber
    const timestamp = new Date().toISOString();
    newsletterSheet.appendRow([email, timestamp]);
    
    // Send welcome newsletter email
    sendNewsletterWelcome(email);
    
    Logger.log("✅ Successfully subscribed: " + email);
    return jsonSuccess({ message: "Successfully subscribed!" });
    
  } catch (error) {
    Logger.log("❌ Error subscribing: " + error.toString());
    return jsonError("Subscription failed");
  }
}

// =================================================
// DISCOUNT VALIDATION (SECURITY: Server-side validation only)
// =================================================
function handleDiscountValidation(e) {
  const code = String(e.parameter.code || "").trim().toUpperCase();
  
  Logger.log("=== DISCOUNT VALIDATION ===");
  Logger.log("Code: " + code);
  
  // Rate limiting
  if (isRateLimited("discount_code_" + code, "discount")) {
    Logger.log("❌ Rate limited discount validation: " + code);
    return jsonError("Too many validation attempts");
  }
  
  // Validate discount code server-side
  const discountAmount = DISCOUNT_CODES[code] || 0;
  
  if (discountAmount > 0) {
    Logger.log("✅ Valid discount code: " + code + " (฿" + discountAmount + ")");
    return jsonSuccess({ discount: discountAmount });
  } else {
    Logger.log("❌ Invalid discount code: " + code);
    return jsonError("Invalid discount code");
  }
}

// =================================================
// READY TO PICKUP EMAILS
// FIX #2: Added admin token authentication to prevent unauthorized mass email sends
// =================================================
function handleSendReadyEmails(e) {
  // FIX #2: Validate admin session before sending emails
  const token = String(e.parameter.token || "").trim();
  if (!validateAdminSession(token)) {
    Logger.log("❌ Unauthorized sendReadyEmails request");
    return jsonError("Unauthorized");
  }

  Logger.log("=== SENDING READY TO PICKUP EMAILS ===");
  
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    let sentCount = 0;
    
    // Skip header row, process data
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const orderId = row[1];         // Column B
      const email = row[3];           // Column D (email is at index 3 per appendRow order)
      const itemId = row[4];          // Column E
      const status = row[8];          // Column I
      const pickupEmailSent = row[9]; // Column J
      
      // Send email if status is "Done" and pickup email not yet sent
      if (status === "Done" && (!pickupEmailSent || pickupEmailSent !== "sent")) {
        try {
          sendReadyToPickupEmail(email, {
            orderId,
            item: itemId,
            email
          });
          
          // Mark as sent in column J
          sheet.getRange(i + 1, 10).setValue("sent");
          sentCount++;
          
          Logger.log("✅ Sent ready email for order: " + orderId);
        } catch (emailErr) {
          Logger.log("⚠️ Failed to send ready email for " + orderId + ": " + emailErr.message);
        }
      }
    }
    
    Logger.log("📧 Ready to pickup emails sent: " + sentCount);
    return jsonSuccess({ 
      message: `Sent ${sentCount} ready to pickup emails`,
      sentCount: sentCount
    });
    
  } catch (error) {
    Logger.log("❌ Error sending ready emails: " + error.toString());
    return jsonError("Failed to send ready emails");
  }
}

// =================================================
// ORDER SUBMISSION (SECURITY: Complete server-side validation)
// =================================================
// Handle contact form submission
function handleContactSubmission(e) {
  const name = String(e.parameter.name || "").trim();
  const email = String(e.parameter.email || "").trim();
  const phone = String(e.parameter.phone || "").trim();
  const subject = String(e.parameter.subject || "").trim();
  const message = String(e.parameter.message || "").trim();
  
  Logger.log("=== CONTACT SUBMISSION DEBUG ===");
  Logger.log("Name: " + name);
  Logger.log("Email: " + email);
  Logger.log("Phone: " + phone);
  Logger.log("Subject: " + subject);
  Logger.log("Message: " + message);
  
  // Validate required fields
  if (!name) {
    Logger.log("❌ Name is required");
    return jsonError("Name is required");
  }
  
  if (!email || !isValidEmail(email)) {
    Logger.log("❌ Invalid email: " + email);
    return jsonError("Valid email is required");
  }
  
  if (!subject) {
    Logger.log("❌ Subject is required");
    return jsonError("Subject is required");
  }
  
  if (!message || message.length < 10) {
    Logger.log("❌ Message too short: " + message.length);
    return jsonError("Message must be at least 10 characters");
  }
  
  Logger.log("✅ Contact form validation passed");
  
  try {
    // Send email notification to admin
    const adminEmail = "support@art-ink.com"; // Replace with actual admin email
    const emailSubject = "New Contact Form Submission: " + subject;
    const emailBody = `
New contact form submission from ART&INK website:

Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}
Subject: ${subject}

Message:
${message}

---
Submitted: ${new Date().toISOString()}
    `.trim();
    
    MailApp.sendEmail({
      to: adminEmail,
      subject: emailSubject,
      body: emailBody,
      name: "ART&INK Website"
    });
    
    // Send confirmation email to customer
    const confirmationSubject = "Thank you for contacting ART&INK";
    const confirmationBody = `
Dear ${name},

Thank you for reaching out to ART&INK! We've received your message and will get back to you within 24 hours.

Your message:
Subject: ${subject}
${message}

If you have any urgent questions, please don't hesitate to contact us directly.

Best regards,
The ART&INK Team
support@art-ink.com
    `.trim();
    
    MailApp.sendEmail({
      to: email,
      subject: confirmationSubject,
      body: confirmationBody,
      name: "ART&INK"
    });
    
    Logger.log("✅ Contact emails sent successfully");
    
    return jsonSuccess({
      message: "Contact form submitted successfully"
    });
    
  } catch (error) {
    Logger.log("❌ Error sending contact email: " + error.toString());
    return jsonError("Failed to send message. Please try again later.");
  }
}

function handleOrderSubmission(e) {
  const email = String(e.parameter.email || "").trim();
  const phone = String(e.parameter.phone || "").trim();
  const itemId = String(e.parameter.itemId || "").trim();
  const quantity = Number(e.parameter.quantity) || 0;
  const size = String(e.parameter.size || "M").trim();
  const discountCode = String(e.parameter.discountCode || "").trim();
  const base64Image = e.parameter.base64Image;
  const turnstileToken = e.parameter.turnstileToken;
  const googleToken = String(e.parameter.googleToken || "").trim();
  
  // Technical data for security purposes
  const userAgent = String(e.parameter.useragent || "").trim();
  const timestamp = String(e.parameter.timestamp || "").trim();
  const remoteIP = String(e.parameters.remoteip || "unknown").trim();
  
  // Debug: Log individual parameters
  Logger.log("Email: " + email);
  Logger.log("Phone: " + phone);
  Logger.log("Item ID: " + itemId);
  Logger.log("Quantity: " + quantity);
  Logger.log("Size: " + size);
  Logger.log("Discount Code: " + discountCode);
  Logger.log("Google Token: " + (googleToken ? "Present" : "Not Present"));
  Logger.log("Base64 Image: " + (base64Image ? "Present" : "Not Present"));
  Logger.log("Turnstile Token: " + (turnstileToken ? "Present" : "Not Present"));
  
  // Log technical data for security
  Logger.log("=== SECURITY DATA ===");
  Logger.log("Remote IP: " + remoteIP);
  Logger.log("User Agent: " + userAgent);
  Logger.log("Timestamp: " + timestamp);
  Logger.log("Email Domain: " + (email.includes('@') ? email.split('@')[1] : 'invalid'));
  
  // Google Auth Verification (If provided via UI)
  let finalVerifiedEmail = email;
  let userRealName = "Manual Entry";
  
  if (googleToken) {
    var authResult = verifyGoogleToken(googleToken);
    
    if (!authResult.success) {
      Logger.log("❌ Authentication failed: " + authResult.error);
      return jsonError("Authentication failed. Please log in again.");
    }
    
    Logger.log("✅ Google Auth Verified! Email: " + authResult.email);
    finalVerifiedEmail = authResult.email; // Override whatever email they sent with the mathematically verified one
    userRealName = authResult.name;
  }
  
  // Validate email
  if (!finalVerifiedEmail || !isValidEmail(finalVerifiedEmail)) {
    Logger.log("❌ Invalid email: " + finalVerifiedEmail);
    return jsonError("Invalid email format");
  }
  
  // Validate phone
  if (!phone || phone.length < 10 || phone.length > 15) {
    Logger.log("❌ Invalid phone: " + phone);
    return jsonError("Invalid phone number");
  }
  
  // Validate item ID against whitelist
  if (!itemId || !PRODUCTS[itemId]) {
    Logger.log("❌ Invalid item ID: " + itemId);
    Logger.log("Available items: " + Object.keys(PRODUCTS).join(", "));
    return jsonError("Invalid product");
  }
  
  // Validate quantity (server-side limits)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) {
    Logger.log("❌ Invalid quantity: " + quantity);
    return jsonError("Invalid quantity (1-5 items allowed)");
  }
  
  // =================================================
  // SERVER-SIDE CALCULATIONS (SECURITY: Never trust client prices)
  // =================================================
  
  // Get price from server-side PRODUCTS object
  const unitPrice = PRODUCTS[itemId];
  let subtotal = unitPrice * quantity;
  
  Logger.log("Server unit price: ฿" + unitPrice);
  Logger.log("Calculated subtotal: ฿" + subtotal);
  
  // Apply discount server-side if valid
  let discountAmount = 0;
  if (discountCode) {
    discountAmount = DISCOUNT_CODES[discountCode.toUpperCase()] || 0;
    if (discountAmount > 0) {
      subtotal = Math.max(0, subtotal - discountAmount); // Prevent negative total
      Logger.log("✅ Discount applied: " + discountCode + " (฿" + discountAmount + ")");
    }
  }
  
  const total = Math.round(subtotal * 100) / 100; // Round to 2 decimal places
  
  Logger.log("✅ Order calculated: ฿" + total);
  
  // =================================================
  // QR CODE GENERATION MODE (No image upload)
  // FIX: Rate limit is NOT applied here — QR fetch is step 1 of a 2-step checkout.
  // Applying rate limit here would block users from completing their order in step 2.
  // =================================================
  if (!base64Image) {
    const payload = generatePromptPayPayload(PROMPTPAY_ID, total);
    Logger.log("Generated PromptPay payload: " + payload);
    
    // FIX: Added &ecc=M (Error Correction Level Medium).
    // PromptPay spec (Bank of Thailand) requires ECC level M minimum.
    // Default level L (7%) causes scan failures on Thai banking apps (KBank, SCB, BBL).
    const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=450x450&ecc=M&data=" + 
                  encodeURIComponent(payload);
    Logger.log("QR URL generated: " + qrUrl);
    
    return jsonSuccess({
      total: total,
      promptPayPayload: payload,
      qrImage: qrUrl,
      itemId: itemId,
      quantity: quantity,
      unitPrice: unitPrice
    });
  }
  
  // =================================================
  // FINAL ORDER SUBMISSION (With image)
  // Rate limiting applied HERE only — on actual order completion, not QR generation.
  // =================================================
  if (isRateLimited(finalVerifiedEmail, "order")) {
    Logger.log("❌ Rate limited order: " + finalVerifiedEmail);
    return jsonError("Too many orders. Please wait before placing another order.");
  }

  // Validate base64 image size (prevent abuse)
  if (base64Image.length > 2000000) { // ~2MB limit
    Logger.log("❌ Image too large: " + base64Image.length);
    return jsonError("Image too large");
  }
  
  // Verify Turnstile token
  const turnstileResult = verifyTurnstileProfessional(turnstileToken, e);
  if (!turnstileResult.success) {
    Logger.log("❌ Turnstile verification failed: " + turnstileResult.error);
    return jsonError("Bot verification failed");
  }
  
  try {
    // Upload image
    const slipUrl = uploadToImgBB(base64Image);
    Logger.log("Slip URL uploaded: " + slipUrl);
    
    // Generate order ID
    const orderId = Utilities.getUuid().slice(0, 8).toUpperCase();
    Logger.log("Generated order ID: " + orderId);

    // FIX #1: Define timestamp before using it in appendRow
    const timestamp = new Date().toISOString();
    
    // Save to spreadsheet
    // Column layout: A=timestamp, B=orderId, C=email(*), D=email, E=phone, F=itemId, G=unitPrice, H=quantity, I=total, J=status, K=slipUrl, L=size, M=GoogleName
    // NOTE: handleAdminData and handleSendReadyEmails read based on this order — keep in sync.
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    sheet.appendRow([
      timestamp,           // A - Timestamp
      orderId,             // B - Order ID
      finalVerifiedEmail,  // C - Email (Verified override if using Google)
      phone,               // D - Phone
      itemId,              // E - Item ID
      unitPrice,           // F - Unit Price (server-calculated)
      quantity,            // G - Quantity
      total,               // H - Total (server-calculated)
      "Pending",           // I - Status
      slipUrl,             // J - Slip image URL
      size,                // K - Size
      userRealName         // L - Google Real Name (if applicable)
    ]);
    
    // Send confirmation
    sendOrderConfirmation(finalVerifiedEmail, {
      orderId,
      item: itemId + " (Size: " + size + ")",
      quantity,
      total
    });
    
    Logger.log("✅ Order submitted successfully: " + orderId);
    return jsonSuccess({ orderId, total });
    
  } catch (error) {
    Logger.log("❌ Order submission failed: " + error.toString());
    return jsonError("Order submission failed");
  }
}

// =================================================
// SESSION VALIDATION
// =================================================
function validateAdminSession(token) {
  if (!token) return false;
  
  try {
    const sessionData = PropertiesService.getScriptProperties()
      .getProperty("admin_session_" + token);
    
    if (!sessionData) return false;
    
    const session = JSON.parse(sessionData);
    const now = Date.now();
    
    // Check session expiration
    if (now - session.timestamp > SESSION_DURATION) {
      // Clean up expired session
      PropertiesService.getScriptProperties()
        .deleteProperty("admin_session_" + token);
      return false;
    }
    
    // Refresh session timestamp
    session.timestamp = now;
    PropertiesService.getScriptProperties()
      .setProperty("admin_session_" + token, JSON.stringify(session));
    
    return true;
    
  } catch (error) {
    Logger.log("❌ Session validation error: " + error.toString());
    return false;
  }
}

// =================================================
// RATE LIMITING
// =================================================
function isRateLimited(identifier, type) {
  const cache = CacheService.getScriptCache();
  const key = "rate_limit_" + type + "_" + identifier;
  const cached = cache.get(key);
  
  if (cached) {
    const data = JSON.parse(cached);
    const now = Date.now();
    
    // Check if within rate limit window
    if (now - data.timestamp < RATE_LIMIT_WINDOW) {
      if (data.count >= MAX_ORDERS_PER_WINDOW) {
        return true; // Rate limited
      }
      // Increment count
      data.count++;
      data.timestamp = now;
      cache.put(key, JSON.stringify(data), RATE_LIMIT_WINDOW / 1000);
      return false;
    }
  }
  
  // Set new rate limit entry
  cache.put(key, JSON.stringify({
    count: 1,
    timestamp: Date.now()
  }), RATE_LIMIT_WINDOW / 1000);
  
  return false;
}

// =================================================
// INPUT VALIDATION HELPERS
// =================================================
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// =================================================
// PROMPTPAY PAYLOAD GENERATION
// =================================================

function generatePromptPayPayload(id, amount) {
  const formattedID = formatPromptPayID(id);
  const formattedAmount = parseFloat(amount).toFixed(2);

  const AID = "A000000677010111";
  
  const tag00 = "00" + formatLength(AID) + AID;
  const tag01 = "01" + formatLength(formattedID) + formattedID;
  const merchantInfo = tag00 + tag01;
  const tag29 = "29" + formatLength(merchantInfo) + merchantInfo;
  const tag52 = "52" + "04" + "0000";
  
  let payload =
    "00" + "02" + "01" +
    "01" + "02" + "12" +
    tag29 +
    tag52 +
    "53" + "03" + "764" +
    "54" + formatLength(formattedAmount) + formattedAmount +
    "58" + "02" + "TH";

  payload += "6304";
  
  const crc = calculateCRC(payload);
  payload += crc;
  
  return payload;
}

function formatPromptPayID(id) {
  id = id.replace(/-/g, "").trim();
  
  if (id.length === 10 && id.startsWith("0")) {
    return "0066" + id.substring(1);
  }

  if (id.length === 13) {
    return id;
  }

  throw new Error("Invalid PromptPay ID");
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

// =================================================
// TURNSTILE VERIFICATION
// =================================================
function verifyTurnstileProfessional(token, e) {
  try {
    if (!token) {
      return { success: false, error: "No token provided" };
    }

    const secret = PropertiesService
      .getScriptProperties()
      .getProperty("TURNSTILE_SECRET");

    if (!secret) {
      return { success: false, error: "Server configuration error" };
    }

    const payload = {
      secret: secret,
      response: token
    };

    if (e && e.parameters && e.parameters.remoteip) {
      payload.remoteip = e.parameters.remoteip;
    }

    const response = UrlFetchApp.fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "post",
        payload: payload,
        muteHttpExceptions: true
      }
    );

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      return { success: false, error: "Verification service error" };
    }

    const result = JSON.parse(response.getContentText());
    return {
      success: result.success === true,
      error: result.error || "Verification failed"
    };

  } catch (err) {
    Logger.log("Turnstile verification exception: " + err.message);
    return { success: false, error: "Verification system error" };
  }
}

// =================================================
// IMAGE UPLOAD
// =================================================
function uploadToImgBB(base64Image) {
  const apiKey = PropertiesService
    .getScriptProperties()
    .getProperty("IMGBB_KEY");

  if (!apiKey) throw new Error("IMGBB_KEY not configured");

  const response = UrlFetchApp.fetch(
    "https://api.imgbb.com/1/upload?key=" + apiKey,
    {
      method: "post",
      payload: { image: base64Image }
    }
  );

  const result = JSON.parse(response.getContentText());

  if (!result.success) {
    throw new Error("Image upload failed");
  }

  return result.data.url;
}

// =================================================
// ORDER CONFIRMATION EMAIL
// =================================================
function sendOrderConfirmation(email, order) {
  MailApp.sendEmail({
    to: email,
    subject: `Order Confirmed – ${order.orderId}`,
    name: FROM_NAME,
    htmlBody: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Order Confirmed - ART&INK</title>
</head>

<body style="margin:0; padding:0; background-color:#f3f6fb; font-family:Arial, Helvetica, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0; background-color:#f3f6fb;">
<tr>
<td align="center">

<table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; text-align:center;">

<!-- Header -->
<tr>
<td style="padding:40px 20px; background:linear-gradient(90deg, #f8a5c2, #87cefa);">
<h1 style="margin:0; font-size:38px; color:#ffffff; letter-spacing:2px;">
ART&INK
</h1>
<p style="margin:10px 0 0; font-size:16px; color:#ffffff;">
Crafted to Be Seen
</p>
</td>
</tr>

<!-- Content -->
<tr>
<td style="padding:35px 30px; color:#333333; font-size:16px; line-height:1.7; text-align:left;">

<h2 style="margin-top:0; font-size:22px; color:#333333; text-align:center;">
🎉 Order Received
</h2>

<div style="background:#fafafa;padding:20px;border-radius:10px;margin-top:20px;">

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

</td>
</tr>

<!-- CTA -->
<tr>
<td style="padding-bottom:40px;">
<a href="https://art-ink-pages.dev/"
style="
background:#87cefa;
color:#ffffff;
text-decoration:none;
padding:14px 32px;
border-radius:25px;
font-size:15px;
display:inline-block;
font-weight:bold;">
View More Products
</a>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background:#fafafa; padding:25px; font-size:12px; color:#999999; text-align:center; line-height:1.6;">

<p style="margin:0 0 10px 0; font-size:13px; color:#777777;">
Thank you for choosing ART&INK! 🎨<br>
Questions? Reply to this email anytime.
</p>

<p style="margin:0;">
© 2026 ART&INK<br>
<a href="https://art-ink.pages.dev/" style="color:#8fa6e6; text-decoration:none;">
art-ink.pages.dev
</a>
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`
  });
}

// =================================================
// NEWSLETTER WELCOME EMAIL
// =================================================
function sendNewsletterWelcome(email) {
  MailApp.sendEmail({
    to: email,
    subject: "Welcome to ART&INK!",
    name: FROM_NAME,
    htmlBody: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Welcome to ART&INK</title>
</head>

<body style="margin:0; padding:0; background-color:#f3f6fb; font-family:Arial, Helvetica, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0; background-color:#f3f6fb;">
<tr>
<td align="center">

<table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; text-align:center;">

<!-- Header -->
<tr>
<td style="padding:40px 20px; background:linear-gradient(90deg, #f8a5c2, #87cefa);">
<h1 style="margin:0; font-size:38px; color:#ffffff; letter-spacing:2px;">
ART&INK
</h1>
<p style="margin:10px 0 0; font-size:16px; color:#ffffff;">
Crafted to Be Seen
</p>
</td>
</tr>

<!-- Content -->
<tr>
<td style="padding:35px 30px; color:#333333; font-size:16px; line-height:1.7; text-align:left;">

<h2 style="margin-top:0; font-size:22px; color:#333333; text-align:center;">
Thank You for Subscribing! 🎉
</h2>

<p>
Welcome to the ART&INK newsletter. We're excited to have you in our creative circle.
</p>

<p>
Here's what you'll get as a subscriber:
</p>

<ul style="padding-left:20px; margin-top:10px;">
<li>🎨 Early access to new product drops</li>
<li>🖌 Behind-the-scenes creative updates</li>
<li>✨ Special announcements before anyone else</li>
</ul>

<p style="margin-top:20px;">
Our goal is simple — to create designs that are crafted to be seen.
And now, you'll always be first in line.
</p>

</td>
</tr>

<!-- CTA -->
<tr>
<td style="padding-bottom:40px;">
<a href="https://art-ink.pages.dev/"
style="
background:#87cefa;
color:#ffffff;
text-decoration:none;
padding:14px 32px;
border-radius:25px;
font-size:15px;
display:inline-block;
font-weight:bold;">
Visit ART&INK
</a>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background:#fafafa; padding:25px; font-size:12px; color:#999999; text-align:center; line-height:1.6;">

<p style="margin:0 0 10px 0; font-size:13px; color:#777777;">
You're receiving this email because you subscribed to the ART&INK newsletter.
</p>

<p style="margin:0;">
© 2026 ART&INK<br>
<a href="https://art-ink.pages.dev/" style="color:#8fa6e6; text-decoration:none;">
art-ink.pages.dev
</a>
</p>

<p style="margin:10px 0 0 0;">
<a href="mailto:apiwish.boon@gmail.com?subject=Unsubscribe%20Request&body=Please%20remove%20me%20from%20the%20ART%26INK%20newsletter.%20Now%20plese%20click%20sent."
style="color:#8fa6e6; text-decoration:none;">
Unsubscribe
</a>
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`
  });
}

// =================================================
// READY TO PICKUP EMAIL
// =================================================
function sendReadyToPickupEmail(email, order) {
  MailApp.sendEmail({
    to: email,
    subject: `Order Ready for Pickup – ${order.orderId}`,
    name: FROM_NAME,
    htmlBody: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Order Ready for Pickup - ART&INK</title>
</head>

<body style="margin:0; padding:0; background-color:#f3f6fb; font-family:Arial, Helvetica, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0; background-color:#f3f6fb;">
<tr>
<td align="center">

<table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; text-align:center;">

<!-- Header -->
<tr>
<td style="padding:40px 20px; background:linear-gradient(90deg, #f8a5c2, #87cefa);">
<h1 style="margin:0; font-size:38px; color:#ffffff; letter-spacing:2px;">
ART&INK
</h1>
<p style="margin:10px 0 0; font-size:16px; color:#ffffff;">
Crafted to Be Seen
</p>
</td>
</tr>

<!-- Content -->
<tr>
<td style="padding:35px 30px; color:#333333; font-size:16px; line-height:1.7; text-align:left;">

<h2 style="margin-top:0; font-size:22px; color:#333333; text-align:center;">
🎉 Your Order is Ready!
</h2>

<div style="background:#d4edda;padding:20px;border-radius:10px;margin-top:20px;">

<p><strong>Order ID:</strong> ${order.orderId}</p>
<p><strong>Item:</strong> ${order.item}</p>

<span style="
display:inline-block;
padding:6px 12px;
background:#28a745;
color:white;
border-radius:20px;
font-size:12px;
font-weight:bold;">
✅ Ready for Pickup
</span>

</div>

<div style="background:#fff3cd;padding:20px;border-radius:10px;margin:20px 0;">
<h3 style="margin-top:0;">📍 Pickup Information</h3>
<p><strong>Location:</strong> Building:4 (Sala Phra Sadet Building) Sirindhorn Planetarium</p>
<p><strong>Hours:</strong> lunch time</p>
<p><strong>Phone:</strong> 093-337-2907</p>
</div>

<p style="margin-top:25px;font-size:13px;color:#666;">
Please bring your order ID and a valid ID for pickup.<br>
Your order will be held for 7 days.
</p>

</td>
</tr>

<!-- CTA -->
<tr>
<td style="padding-bottom:40px;">
<a href="https://art-ink-pages.dev/"
style="
background:#87cefa;
color:#ffffff;
text-decoration:none;
padding:14px 32px;
border-radius:25px;
font-size:15px;
display:inline-block;
font-weight:bold;">
View More Products
</a>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background:#fafafa; padding:25px; font-size:12px; color:#999999; text-align:center; line-height:1.6;">

<p style="margin:0 0 10px 0; font-size:13px; color:#777777;">
Thank you for choosing ART&INK! 🎨<br>
Questions? Reply to this email anytime.
</p>

<p style="margin:0;">
© 2026 ART&INK<br>
<a href="https://art-ink.pages.dev/" style="color:#8fa6e6; text-decoration:none;">
art-ink.pages.dev
</a>
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`
  });
}

// =================================================
// RESPONSE HELPERS
// =================================================
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

// =================================================
// SETUP FUNCTIONS
// =================================================
function setAdminPassword() {
  const password = "YOUR_SECURE_PASSWORD_HERE";
  if (password === "YOUR_SECURE_PASSWORD_HERE") {
    throw new Error("Please replace placeholder with actual password");
  }
  PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD', password);
  Logger.log("✅ Admin password configured");
}

function testSecurity() {
  Logger.log("=== SECURITY TEST ===");
  Logger.log("Products available: " + Object.keys(PRODUCTS).length);
  Logger.log("Discount codes available: " + Object.keys(DISCOUNT_CODES).length);
  Logger.log("Admin password configured: " + (ADMIN_PASSWORD ? "YES" : "NO"));
  
  const secret = PropertiesService.getScriptProperties().getProperty("TURNSTILE_SECRET");
  Logger.log("Turnstile configured: " + (secret ? "YES" : "NO"));
  
  const imgbbKey = PropertiesService.getScriptProperties().getProperty("IMGBB_KEY");
  Logger.log("ImgBB configured: " + (imgbbKey ? "YES" : "NO"));
}