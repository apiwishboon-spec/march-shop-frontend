/*************************************************
 * 🎁 ART&INK SHOP – BACKEND (GOOGLE APPS SCRIPT)
 * Secure • ImgBB • Turnstile • PromptPay QR
 *************************************************/

const SHEET_ID = "1MAN3a83glO-yst1s1ar0QahYiHCT4Hi1lLK2iJwkNTU";
const SHEET_NAME = "Sheet1";

const STORE_NAME = "ART&INK Shop";
const FROM_NAME = "ART&INK Shop Orders";
const PROMPTPAY_ID = "0933372907"; // 🔥 YOUR PROMPTPAY

// =================================================
// ========== ENTRY POINT ==========
function doPost(e) {
  try {

    const email = String(e.parameter.email || "").trim();
    const phone = String(e.parameter.phone || "").trim();
    const item = String(e.parameter.item || "").trim();
    const price = Number(e.parameter.price);
    const quantity = Number(e.parameter.quantity || 1);
    const size = String(e.parameter.size || "M").trim();
    const base64Image = e.parameter.base64Image;
    const turnstileToken = e.parameter.turnstileToken;
    const action = String(e.parameter.action || "").trim();

    // =================================================
    // DISCOUNT CODE VALIDATION
    // =================================================
    if (action === "validateDiscount") {
      const code = String(e.parameter.code || "").trim().toUpperCase();
      const discount = validateDiscountCode(code);
      
      if (discount > 0) {
        return jsonSuccess({ discount: discount });
      } else {
        return jsonError("Invalid discount code");
      }
    }

    if (!item || price <= 0 || quantity < 1 || quantity > 5) {
      return jsonError("Invalid order data: Maximum 5 items allowed per order");
    }

    const total = Number((price * quantity).toFixed(2));

    // =================================================
    // QR MODE (NO IMAGE) - NO TURNSTILE REQUIRED
    // =================================================
    if (!base64Image) {

      const payload = generatePromptPayPayload(PROMPTPAY_ID, total);

      const qrUrl =
        "https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" +
        encodeURIComponent(payload);

      return jsonSuccess({
        total,
        promptPayPayload: payload,
        qrImage: qrUrl
      });
    }

    // =================================================
    // FINAL SUBMIT MODE - TURNSTILE VERIFICATION
    // =================================================

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

  } catch (err) {
    Logger.log("Backend error: " + err.message + " Stack: " + err.stack);
    return jsonError("Backend exploded: " + err.message);
  }
}

function generatePromptPayPayload(id, amount) {

  const formattedID = formatPromptPayID(id);
  const formattedAmount = parseFloat(amount).toFixed(2);

  // EMVCo PromptPay Dynamic QR Structure
  // 00: Payload Format Indicator (01)
  // 01: Point of Initiation (12 = Dynamic)
  // 29: Merchant Account Information
  //   00: AID (A000000677010111)
  //   01: PromptPay ID (phone number)
  // 52: Merchant Category Code (0000 for personal)
  // 53: Currency (764 = THB)
  // 54: Amount
  // 58: Country Code (TH)
  // 63: CRC

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

// =================================================
// PROFESSIONAL TURNSTILE VERIFICATION
// =================================================
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

// Legacy function for backward compatibility
function verifyTurnstile(token) {
  const result = verifyTurnstileProfessional(token);
  return result.success;
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



// =================================================
// TEST FUNCTION - RUN THIS TO VALIDATE QR STRUCTURE
// =================================================
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

// =================================================
// TURNSTILE TEST FUNCTION
// =================================================
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
    'FREESHIP': 50
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
