import type { Message } from "../types";
import { Bot, User, ThumbsUp, ThumbsDown, TrendingUp } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  onRate?: (messageId: string, rating: 'positive' | 'negative') => void;
}

export const ChatMessage = ({ message, onRate }: ChatMessageProps) => {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex gap-3 ${isAssistant ? 'bg-gray-50' : 'bg-white'} p-4 rounded-lg`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isAssistant ? 'bg-blue-500' : 'bg-gray-600'
      }`}>
        {isAssistant ? (
          <Bot className="w-5 h-5 text-white" />
        ) : (
          <User className="w-5 h-5 text-white" />
        )}
      </div>
      <div className="flex-1 pt-1">
        <p className="text-sm font-medium text-gray-900 mb-1">
          {isAssistant ? 'Shopping Assistant' : 'You'}
        </p>
        
        {/* Image Preview for User Messages */}
        {!isAssistant && message.imageData && (
          <img 
            src={message.imageData} 
            alt="Uploaded" 
            className="w-32 h-32 object-cover rounded-lg mb-2 border border-gray-200" 
          />
        )}
        
        {/* Message Content */}
        <div className="text-sm text-gray-700 whitespace-pre-wrap">{message.content}</div>

        {/* Quality Metrics (for assistant messages) */}
        {isAssistant && message.qualityMetrics && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2">Response Quality:</p>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="bg-white rounded-lg p-2 text-center border border-gray-100">
                <div className="text-blue-600 font-semibold mb-1">Accuracy</div>
                <div className="text-lg font-bold text-gray-800">
                  {message.qualityMetrics.accuracy.toFixed(0)}%
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 text-center border border-gray-100">
                <div className="text-green-600 font-semibold mb-1">Tone</div>
                <div className="text-lg font-bold text-gray-800">
                  {message.qualityMetrics.tone.toFixed(0)}%
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 text-center border border-gray-100">
                <div className="text-purple-600 font-semibold mb-1">Safety</div>
                <div className="text-lg font-bold text-gray-800">
                  {message.qualityMetrics.safety.toFixed(0)}%
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 text-center border border-gray-100">
                <div className="text-orange-600 font-semibold mb-1">Confidence</div>
                <div className="text-lg font-bold text-gray-800">
                  {message.qualityMetrics.confidence.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/*Purchase Intent Indicator */}
        {isAssistant && message.purchaseIntent && message.purchaseIntent.score > 30 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-gray-700">Purchase Intent:</span>
              <span className={`px-2 py-1 rounded-full font-bold ${
                message.purchaseIntent.likelihood === 'High' 
                  ? 'bg-red-100 text-red-600' 
                  : message.purchaseIntent.likelihood === 'Medium'
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-green-100 text-green-600'
              }`}>
                {message.purchaseIntent.likelihood} ({message.purchaseIntent.score}%)
              </span>
            </div>
          </div>
        )}

        {/* Rating Buttons (for assistant messages) */}
        {isAssistant && onRate && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => onRate(message.id, 'positive')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-all ${
                message.userRating === 'positive'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-green-50 border border-gray-200'
              }`}
            >
              <ThumbsUp className="w-3 h-3" />
              Helpful
            </button>
            <button
              onClick={() => onRate(message.id, 'negative')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-all ${
                message.userRating === 'negative'
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-red-50 border border-gray-200'
              }`}
            >
              <ThumbsDown className="w-3 h-3" />
              Not Helpful
            </button>
          </div>
        )}
      </div>
    </div>
  );
};