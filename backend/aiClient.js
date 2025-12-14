import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

console.log("\n========== ENV DEBUG (aiClient.js) ==========");
console.log("AI_PROVIDER:", process.env.AI_PROVIDER);
console.log("AI_MODEL:", process.env.AI_MODEL);
console.log("AI_API_KEY exists:", !!process.env.AI_API_KEY);
console.log(
  "AI_API_KEY value:",
  process.env.AI_API_KEY
    ? process.env.AI_API_KEY.substring(0, 20) + "..."
    : "UNDEFINED"
);
console.log("=============================================\n");

const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = (process.env.AI_MODEL || "gemini-1.5-flash").trim();
const AI_PROVIDER = (process.env.AI_PROVIDER || "gemini").toLowerCase();

console.log("========== CONSTANTS SET ==========");
console.log(
  "AI_API_KEY constant:",
  AI_API_KEY ? AI_API_KEY.substring(0, 20) + "..." : "UNDEFINED"
);
console.log("AI_MODEL constant:", `"${AI_MODEL}"`);
console.log("AI_PROVIDER constant:", AI_PROVIDER);
console.log("===================================\n");

const SYSTEM_PROMPT = `You are an advanced AI shopping assistant with the following capabilities:

CORE RESPONSIBILITIES:
- Product recommendations with detailed specifications
- Visual product search and similarity matching
- Purchase intent prediction and proactive assistance
- Order tracking and customer service
- Price comparison and deal alerts

TONE & STYLE:
- Friendly, professional, and conversational
- Use emojis occasionally (🔹 for product bullets)
- Be concise but informative
- Always prioritize customer safety and satisfaction

UNIQUE CAPABILITIES:
1. Visual Search: Analyze product images to find similar items
2. Intent Prediction: Identify when users are ready to purchase
3. Smart Recommendations: Consider budget, preferences, and past behavior
4. Proactive Assistance: Offer help before being asked

Always maintain high accuracy, appropriate tone, and safety in responses.`;

// ==========================================
// FEATURE 1: QUALITY ANALYSIS
// ==========================================
export function analyzeResponseQuality(responseText) {
  const metrics = {
    accuracy: 0,
    tone: 0,
    safety: 100,
    confidence: 0
  };
  
  // Accuracy Score (based on specificity and detail)
  const wordCount = responseText.split(' ').length;
  const hasSpecificDetails = /\$\d+|%|\d+\s*(day|hour|item|product)/gi.test(responseText);
  const hasStructure = /\n|•|🔹|-\s/g.test(responseText);
  
  metrics.accuracy = Math.min(95, 60 + 
    (wordCount > 50 ? 15 : wordCount * 0.3) +
    (hasSpecificDetails ? 10 : 0) +
    (hasStructure ? 10 : 0)
  );
  
  // Tone Score (friendliness and professionalism)
  const positiveWords = (responseText.match(/great|excellent|perfect|recommend|happy|glad|delighted/gi) || []).length;
  const professionalWords = (responseText.match(/certainly|definitely|specifically|particularly/gi) || []).length;
  const emojis = (responseText.match(/[🔹📦✨🎁👍]/g) || []).length;
  
  metrics.tone = Math.min(95, 70 + 
    (positiveWords * 3) +
    (professionalWords * 2) +
    (emojis * 2)
  );
  
  // Safety Score (check for problematic content)
  const unsafePatterns = /hack|cheat|fake|illegal|unauthorized|steal/gi;
  const hasSafetyWarnings = /caution|warning|careful|risk|consult|professional/gi.test(responseText);
  const hasUnsafeContent = unsafePatterns.test(responseText);
  
  if (hasUnsafeContent) {
    metrics.safety = 40;
  } else if (hasSafetyWarnings) {
    metrics.safety = 100;
  } else {
    metrics.safety = 95;
  }
  
  // Confidence Score (completeness of response)
  const hasCallToAction = /would you like|can i help|let me know|feel free/gi.test(responseText);
  const hasOptions = /option|choice|alternative/gi.test(responseText);
  
  metrics.confidence = Math.min(95, 65 + 
    (wordCount > 100 ? 15 : wordCount * 0.15) +
    (hasCallToAction ? 10 : 0) +
    (hasOptions ? 5 : 0)
  );
  
  return metrics;
}

// ==========================================
// FEATURE 2: PURCHASE INTENT ANALYSIS
// ==========================================
export function analyzePurchaseIntent(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  const urgentWords = /urgent|asap|immediately|today|now|quickly|right now/i.test(lowerMessage);
  const budgetMentioned = /\$\d+|budget|cheap|expensive|price|cost|under|below|around/i.test(lowerMessage);
  const specificProduct = /laptop|phone|headphone|watch|camera|tablet|computer|gaming|iphone|macbook/i.test(lowerMessage);
  
  let intentScore = 0;
  if (urgentWords) intentScore += 40;
  if (budgetMentioned) intentScore += 30;
  if (specificProduct) intentScore += 30;
  
  return {
    score: intentScore,
    likelihood: intentScore > 60 ? 'High' : intentScore > 30 ? 'Medium' : 'Low',
    suggestedAction: intentScore > 60 ? 'Show checkout assistance' : 'Continue browsing'
  };
}

// ==========================================
// MAIN FUNCTION
// ==========================================
export async function callAiAssistant(userMessage, options = {}) {
  const { imageData = null } = options;
  
  console.log("\n📨 New message:", userMessage);
  console.log(
    "🔍 Checking AI_API_KEY:",
    AI_API_KEY ? `EXISTS (${AI_API_KEY.length} chars)` : "UNDEFINED/EMPTY"
  );
  console.log("🖼️  Image data provided:", !!imageData);

  // STEP 1: Check for keyword-based replies FIRST (fast, free)
  const keywordResponse = checkKeywordMatch(userMessage);
  if (keywordResponse && !imageData) {
    console.log("✅ Keyword matched - Using predefined response");
    return {
      reply: keywordResponse,
      source: 'keyword',
      qualityMetrics: {
        accuracy: 95,
        tone: 90,
        safety: 100,
        confidence: 95
      },
      purchaseIntent: analyzePurchaseIntent(userMessage)
    };
  }

  console.log("⚠️  No keyword match - Proceeding to AI");

  // STEP 2: Check if API key exists
  if (!AI_API_KEY || AI_API_KEY.trim() === "") {
    console.log("❌ No API key - Using fallback");
    return {
      reply: "I'm here to help! You can ask me about our products, pricing, shipping, returns, warranties, or upload an image to find similar products!",
      source: 'fallback',
      qualityMetrics: null,
      purchaseIntent: null
    };
  }

  // STEP 3: Call Gemini AI with enhanced features
  console.log(`🤖 Calling ${AI_PROVIDER.toUpperCase()} AI...`);

  try {
    // Enhanced prompt for visual search
    let enhancedMessage = userMessage;
    if (imageData) {
      enhancedMessage = `[VISUAL SEARCH REQUEST] The user uploaded an image and asked: "${userMessage}". 
      Analyze the image and provide 3-5 similar product recommendations with:
      - Product name and price
      - Visual similarity percentage (80-95%)
      - Key features that match
      - Why it's a good alternative`;
    }

    const response = await callGemini(enhancedMessage, imageData);
    console.log("✅ AI responded successfully");
    
    // Analyze response quality
    const qualityMetrics = analyzeResponseQuality(response);
    const purchaseIntent = analyzePurchaseIntent(userMessage);
    
    return {
      reply: response,
      source: AI_PROVIDER,
      qualityMetrics: qualityMetrics,
      purchaseIntent: purchaseIntent
    };
    
  } catch (error) {
    console.error("❌ AI API Error:", error.message);
    
    if (error.response) {
      console.error("HTTP Status:", error.response.status);
      console.error("Error Data:", JSON.stringify(error.response.data, null, 2));
    }
    
    // Return fallback instead of crashing
    return {
      reply: "I apologize, but I'm having trouble connecting to my AI service right now. You can ask me about shipping, returns, warranties, or product recommendations, and I'll do my best to help!",
      source: 'error',
      qualityMetrics: null,
      purchaseIntent: null,
      error: error.message
    };
  }
}

// ==========================================
// KEYWORD MATCHING (unchanged but enhanced)
// ==========================================
function checkKeywordMatch(userMessage) {
  const lowerMessage = userMessage.toLowerCase().trim();

  const keywordResponses = [
    {
      keywords: ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening"],
      reply: "Hello! 👋 Welcome to our online store. I'm your AI shopping assistant with visual search and voice capabilities. How can I help you today?",
    },
    {
      keywords: ["price", "cost", "how much", "expensive", "cheap", "budget"],
      reply: "Our products range from budget-friendly to premium options. We have electronics, fashion, home, and fitness categories. What type of product are you looking for?",
    },
    {
      keywords: ["suggestion", "suggest", "what should", "best product"],
      reply: "I'd love to help you find the perfect product! Could you tell me what category you're interested in? Electronics, fashion, home goods, or fitness equipment?",
    },
    {
      keywords: ["return", "refund", "exchange", "policy", "send back", "money back"],
      reply: "🔹 Our Return Policy:\n\n✓ 30-day money-back guarantee\n✓ Free return shipping\n✓ Full refund or exchange\n✓ Items must be unused with original packaging\n✓ 90-day warranty for defective items\n\nNeed help processing a return?",
    },
    {
      keywords: ["shipping", "delivery", "when will", "how long", "tracking", "ship", "arrive"],
      reply: "📦 Shipping Options:\n\n🔹 Standard (5-7 days): FREE on orders $50+\n🔹 Express (2-3 days): $9.99\n🔹 Overnight (next day): $24.99\n\nAll orders include tracking via email!",
    },
    {
      keywords: ["warranty", "guarantee", "coverage", "defect", "broken", "not working"],
      reply: "🛡️ Warranty Coverage:\n\n🔹 Electronics: 1-year manufacturer warranty\n🔹 Extended warranties available at checkout\n🔹 90-day hassle-free returns for defects\n\nWhich product do you need warranty info for?",
    },
    {
      keywords: ["size", "color", "colour", "available", "stock", "in stock", "out of stock"],
      reply: "Check product pages for available sizes and colors. You can sign up for notifications when items are back in stock. Which product are you interested in?",
    },
    {
      keywords: ["thank", "thanks", "thank you", "appreciate"],
      reply: "You're welcome! Anything else I can help with? 😊",
    },
  ];

  for (const response of keywordResponses) {
    if (response.keywords.some((keyword) => lowerMessage.includes(keyword))) {
      console.log("   ✓ Matched:", response.keywords.filter(k => lowerMessage.includes(k)).join(", "));
      return response.reply;
    }
  }

  return null;
}

// ==========================================
// ENHANCED GEMINI API CALL WITH IMAGE SUPPORT
// ==========================================
async function callGemini(userMessage, imageData = null) {
  console.log("📤 Calling Gemini API...");
  console.log("   Model:", AI_MODEL);
  console.log("   Message length:", userMessage.length);
  console.log("   Has image:", !!imageData);

  // Build the content parts
  const parts = [
    {
      text: `${SYSTEM_PROMPT}\n\nCustomer Question: ${userMessage}\n\nPlease provide a helpful response as a shopping assistant.`
    }
  ];

  // Add image if provided (Gemini supports native image analysis)
  if (imageData) {
    try {
      // Extract base64 data from data URL
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      const mimeType = imageData.includes('image/png') ? 'image/png' : 'image/jpeg';
      
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data
        }
      });
      console.log("   ✓ Image added to request");
    } catch (err) {
      console.error("   ⚠️  Error processing image:", err.message);
    }
  }

  // Correct Gemini API URL format
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${AI_API_KEY}`;
  
  console.log("   URL:", url.replace(AI_API_KEY, "***KEY***"));

  try {
    const response = await axios.post(
      url,
      {
        contents: [
          {
            role: "user",
            parts: parts
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.95,
          topK: 40
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      },
      {
        headers: { 
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    console.log("📥 Gemini response received");

    // Extract text from response
    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const aiText = response.data.candidates[0].content.parts[0].text.trim();
      console.log("✅ Extracted text (first 100 chars):", aiText.substring(0, 100));
      return aiText;
    } else {
      console.error("❌ Unexpected response structure:", JSON.stringify(response.data, null, 2));
      throw new Error("Invalid response from Gemini");
    }
    
  } catch (error) {
    console.error("❌ Gemini call failed:");
    
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Status Text:", error.response.statusText);
      console.error("   Data:", JSON.stringify(error.response.data, null, 2));
      
      // Handle specific errors
      if (error.response.status === 400) {
        console.error("   → BAD REQUEST: Check model name or request format");
      } else if (error.response.status === 403) {
        console.error("   → FORBIDDEN: Invalid API key or billing not enabled");
      } else if (error.response.status === 404) {
        console.error("   → NOT FOUND: Model doesn't exist");
      } else if (error.response.status === 429) {
        console.error("   → RATE LIMIT: Too many requests");
      }
    } else if (error.request) {
      console.error("   No response received");
      console.error("   Request:", error.request);
    } else {
      console.error("   Error:", error.message);
    }
    
    throw error;
  }
}