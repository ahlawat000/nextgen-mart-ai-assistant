const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// response interface
interface ChatResponse {
  reply: string;
  source?: string;
  qualityMetrics?: {
    accuracy: number;
    tone: number;
    safety: number;
    confidence: number;
  };
  purchaseIntent?: {
    score: number;
    likelihood: 'High' | 'Medium' | 'Low';
    suggestedAction: string;
  };
}

// Now returns ChatResponse object with all features
export async function sendChatMessage(
  message: string, 
  imageData?: string | null
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      message,
      imageData: imageData || undefined
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Return enhanced response
  return {
    reply: data.reply,
    source: data.source,
    qualityMetrics: data.qualityMetrics,
    purchaseIntent: data.purchaseIntent,
  };
}

// Send feedback for rating system
export async function sendFeedback(
  messageId: string, 
  rating: 'positive' | 'negative'
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageId, rating }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}