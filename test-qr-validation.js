// Test script to validate PromptPay QR generation
// Copy this function to your Google Apps Script and run testPromptPayQR()

function testPromptPayQRValidation() {
  try {
    // Test with your actual PromptPay ID
    const testID = "0933372907";
    const testAmount = 590.00;
    
    Logger.log("=== PROMPTPAY QR VALIDATION TEST ===");
    Logger.log("Test ID: " + testID);
    Logger.log("Test Amount: ฿" + testAmount);
    
    // This should match the generatePromptPayPayload function in your backend
    const payload = generateTestPayload(testID, testAmount);
    
    Logger.log("Generated Payload: " + payload);
    Logger.log("Payload Length: " + payload.length);
    
    // Validation checks
    if (payload.startsWith("000201")) {
      Logger.log("✅ Correct Payload Format Indicator");
    } else {
      Logger.log("❌ Wrong Payload Format Indicator");
    }
    
    if (payload.includes("010212")) {
      Logger.log("✅ Correct Dynamic QR Point of Initiation");
    } else {
      Logger.log("❌ Wrong Point of Initiation");
    }
    
    if (payload.includes("52040000")) {
      Logger.log("✅ Correct Merchant Category Code");
    } else {
      Logger.log("❌ Missing or wrong Merchant Category Code");
    }
    
    if (payload.includes("0066933372907")) {
      Logger.log("✅ Correct PromptPay ID formatting");
    } else {
      Logger.log("❌ Wrong PromptPay ID formatting");
    }
    
    Logger.log("=== TEST COMPLETE ===");
    return payload;
    
  } catch (err) {
    Logger.log("❌ Test Failed: " + err.message);
  }
}

function generateTestPayload(id, amount) {
  // Copy of the fixed generatePromptPayPayload function
  const formattedID = formatTestPromptPayID(id);
  const formattedAmount = parseFloat(amount).toFixed(2);

  const AID = "A000000677010111";
  
  // Merchant Account Information (Tag 29)
  const tag00 = "00" + formatLength(AID) + AID;
  const tag01 = "01" + formatLength(formattedID) + formattedID;
  const merchantInfo = tag00 + tag01;
  const tag29 = "29" + formatLength(merchantInfo) + merchantInfo;
  
  // Merchant Category Code (Tag 52)
  const tag52 = "52" + "04" + "0000";
  
  // Build payload
  let payload =
    "00" + "02" + "01" +           // 00: Payload Format Indicator
    "01" + "02" + "12" +           // 01: Point of Initiation (Dynamic)
    tag29 +                         // 29: Merchant Account Information
    tag52 +                         // 52: Merchant Category Code
    "53" + "03" + "764" +           // 53: Currency (THB)
    "54" + formatLength(formattedAmount) + formattedAmount +  // 54: Amount
    "58" + "02" + "TH";            // 58: Country Code

  payload += "6304";  // CRC placeholder
  const crc = calculateTestCRC(payload);
  payload += crc;

  return payload;
}

function formatTestPromptPayID(id) {
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

function calculateTestCRC(payload) {
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
