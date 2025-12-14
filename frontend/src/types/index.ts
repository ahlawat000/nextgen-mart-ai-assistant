export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  
  imageData?: string;
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
  userRating?: 'positive' | 'negative';
}

export interface Conversation {
  id: string;
  session_id: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  session_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
}
