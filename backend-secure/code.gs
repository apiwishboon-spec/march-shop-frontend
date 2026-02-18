/*************************************************
 * 🎁 ART&INK SHOP – BACKEND (GOOGLE APPS SCRIPT)
 * Secure • ImgBB • Turnstile • PromptPay QR
 * Enhanced with Time-Limited QR Security
 *************************************************/

const SHEET_ID = "1MAN3a83glO-yst1s1ar0QahYiHCT4Hi1lLK2iJwkNTU";
const SHEET_NAME = "Sheet1";

const STORE_NAME = "ART&INK Shop";
const FROM_NAME = "ART&INK Shop Orders";
const PROMPTPAY_ID = "0933372907"; // 🔥 YOUR PROMPTPAY

// QR Security Settings
const QR_EXPIRY_MINUTES = 5;
const QR_SALT = "ARTINK_SECURE_QR_2026"; // Security salt

// =================================================
// ========== ENTRY POINT ==========
function doPost(e) {
  try {

    const email = String(e.parameter.email || "").trim();
    const phone = String(e.parameter.phone || "").trim();
    const item = String(e.parameter.item || "").trim();
    const price = Number(e.parameter.price);
    const quantity = Number(e.parameter.quantity || 1);
    const base64Image = e.parameter.base64Image;
    const turnstileToken = e.parameter.turnstileToken;
    const timestamp = e.parameter.timestamp || Date.now().toString();

    if (!item || price <= 0 || quantity < 1) {
      return jsonError("Invalid order data");
    }

    const total = Number((price * quantity).toFixed(2));

    // =================================================
    // QR MODE (NO IMAGE)
    // =================================================
    if (!base64Image) {

      const payload = generateSecurePromptPayPayload(PROMPTPAY_ID, total, timestamp);

      const qrUrl =
        "https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=" +
        encodeURIComponent(payload);

      return jsonSuccess({
        total,
        promptPayPayload: payload,
        qrImage: qrUrl,
        timestamp: timestamp,
        expiresAt: (parseInt(timestamp) + (QR_EXPIRY_MINUTES * 60 * 1000)).toString()
      });
    }

    // =================================================
    // FINAL SUBMIT MODE
    // =================================================

    if (!email || !email.includes("@"))
      return jsonError("Invalid email");

    if (!turnstileToken || !verifyTurnstile(turnstileToken))
      return jsonError("Bot verification failed");

    // Verify QR is not expired
    const qrAge = Date.now() - parseInt(timestamp);
    if (qrAge > (QR_EXPIRY_MINUTES * 60 * 1000)) {
      return jsonError("QR code has expired. Please generate a new one.");
    }

    const slipUrl = uploadToImgBB(base64Image);

    const sheet = SpreadsheetApp
      .openById(SHEET_ID)
      .getSheetByName(SHEET_NAME);

    const orderId = Utilities.getUuid()
      .slice(0, 8)
      .toUpperCase();

    const orderTimestamp = new Date();
    const status = "Pending";

    sheet.appendRow([
      orderTimestamp, // 1
      orderId,       // 2
      email,         // 3
      phone,         // 4
      item,          // 5
      price,         // 6
      quantity,      // 7
      total,         // 8
      status,        // 9
      slipUrl,       // 10
      timestamp,     // 11 - QR timestamp for security
    ]);

    sendOrderConfirmation(email, {
      orderId,
      item,
      quantity,
      total
    });

    return jsonSuccess({ orderId, total });

  } catch (err) {
    return jsonError("Backend exploded: " + err.message);
  }
}

function generateSecurePromptPayPayload(id, amount, timestamp) {
  const formattedID = formatPromptPayID(id);
  const formattedAmount = parseFloat(amount).toFixed(2);
  
  // Create unique transaction reference
  const transactionRef = generateTransactionRef(timestamp);

  // EMVCo PromptPay Dynamic QR Structure with Security
  const AID = "A000000677010111";
  
  // Merchant Account Information (Tag 29)
  const tag00 = "00" + formatLength(AID) + AID;
  const tag01 = "01" + formatLength(formattedID) + formattedID;
  const merchantInfo = tag00 + tag01;
  const tag29 = "29" + formatLength(merchantInfo) + merchantInfo;
  
  // Merchant Category Code (Tag 52)
  const tag52 = "52" + "04" + "0000";
  
  // Additional Data (Tag 62) with transaction reference for security
  const tag62 = "62" + formatLength(transactionRef) + transactionRef;
  
  // Build payload with security features
  let payload =
    "00" + "02" + "01" +           // 00: Payload Format Indicator
    "01" + "02" + "12" +           // 01: Point of Initiation (Dynamic)
    tag29 +                         // 29: Merchant Account Information
    tag52 +                         // 52: Merchant Category Code
    "53" + "03" + "764" +           // 53: Currency (THB)
    "54" + formatLength(formattedAmount) + formattedAmount +  // 54: Amount
    "58" + "02" + "TH" +            // 58: Country Code
    tag62;                          // 62: Additional Data (Transaction Ref)

  // Add CRC placeholder and calculate
  payload += "6304";  // CRC tag and length placeholder
  
  // Debug logging
  Logger.log("=== SECURE PROMPTPAY PAYLOAD DEBUG ===");
  Logger.log("Timestamp: " + timestamp);
  Logger.log("Transaction Ref: " + transactionRef);
  Logger.log("Formatted ID: " + formattedID);
  Logger.log("Formatted Amount: " + formattedAmount);
  Logger.log("Payload before CRC: " + payload);
  Logger.log("Payload length before CRC: " + payload.length);
  
  const crc = calculateCRC(payload);
  payload += crc;
  
  Logger.log("Final payload: " + payload);
  Logger.log("Final payload length: " + payload.length);
  Logger.log("=====================================");

  return payload;
}

function generateTransactionRef(timestamp) {
  // Generate unique transaction reference using timestamp and salt
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, timestamp + QR_SALT);
  const hexHash = Utilities.base64Encode(hash).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  return "TX" + hexHash.toUpperCase();
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

function verifyTurnstile(token) {
  const secret = PropertiesService
    .getScriptProperties()
    .getProperty("TURNSTILE_SECRET");

  if (!secret) throw new Error("TURNSTILE_SECRET not set");

  const response = UrlFetchApp.fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "post",
      payload: { secret: secret, response: token }
    }
  );

  const result = JSON.parse(response.getContentText());
  return result.success === true;
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
function testSecurePromptPayQR() {
  try {
    Logger.log("=== TESTING SECURE PROMPTPAY QR GENERATION ===");
    
    const testID = "0933372907";
    const testAmount = 590.00;
    const testTimestamp = Date.now().toString();
    
    const payload = generateSecurePromptPayPayload(testID, testAmount, testTimestamp);
    
    Logger.log("✅ Secure QR Generated Successfully");
    Logger.log("📱 Test ID: " + testID);
    Logger.log("💰 Test Amount: ฿" + testAmount);
    Logger.log("⏰ Timestamp: " + testTimestamp);
    Logger.log("🔗 Payload: " + payload);
    Logger.log("📏 Payload Length: " + payload.length);
    
    // Expected length for secure dynamic PromptPay QR: 100-130 characters
    if (payload.length >= 100 && payload.length <= 130) {
      Logger.log("✅ Payload length within expected range");
    } else {
      Logger.log("⚠️ Payload length outside expected range (100-130)");
    }
    
    return payload;
    
  } catch (err) {
    Logger.log("❌ Test Failed: " + err.message);
    throw err;
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
