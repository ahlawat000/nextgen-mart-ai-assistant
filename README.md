# 🛍️ NextGen Mart - AI Shopping Assistant

An advanced e-commerce platform with AI-powered shopping assistant featuring voice interaction, visual search, and intelligent purchase predictions.

## ✨ Features

- 🎤 **Voice Input** - Speak your questions naturally
- 🔊 **Voice Output** - Hear AI responses read aloud
- 📸 **Visual Search** - Upload images to find similar products
- ⭐ **Quality Ranking** - Transparent AI response scoring (Accuracy, Tone, Safety, Confidence)
- 📊 **Purchase Intent** - Smart detection of buying likelihood
- 👍 **User Feedback** - Rate responses to improve AI
- 🛒 **Smart Cart** - Persistent shopping cart with Supabase
- 🤖 **Gemini AI** - Powered by Google's latest AI model

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Gemini API Key ([Get it here](https://aistudio.google.com/app/apikey))
- Supabase Account ([Sign up](https://supabase.com))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/nextgen-mart-ai-assistant.git
cd nextgen-mart-ai-assistant
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your Gemini API key
npm start
```

3. **Setup Frontend**
```bash
cd frontend
npm install
# Create .env and add Supabase credentials
npm run dev
```

4. **Open browser**
```
http://localhost:5173
```

## 🔧 Configuration

### Backend (.env)
```env
AI_PROVIDER=gemini
AI_MODEL=gemini-1.5-flash
AI_API_KEY=your_key_here
PORT=3000
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_API_URL=http://localhost:3000
```

## 📦 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, Axios
- **AI**: Google Gemini 1.5 Flash
- **Database**: Supabase (PostgreSQL)
- **Voice**: Web Speech API

## 🎯 Architecture
```
Frontend (React) → Backend (Node.js) → Gemini AI
       ↓
   Supabase (Products & Cart)
```

## 🧪 Testing

**Voice Input**: Click 🎤 and speak (Chrome/Edge only)
**Voice Output**: Toggle 🔊 and send a message
**Visual Search**: Click 📸 and upload product image
**Quality Metrics**: Check scores below AI responses
**Purchase Intent**: Try "I need laptop urgently $1000"

## 📝 License

MIT

## 👨‍💻 Author

[Vanshul](https://github.com/ahlawat000)

## 🙏 Acknowledgments

- Google Gemini AI
- Supabase
- Lucide Icons
