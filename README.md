# DomainLookup

A modern AI-powered domain name finder that helps you discover available domain names for your next project. Built with Next.js 15, TypeScript, and powered by Google Gemini AI with Namecheap domain availability checking.

![Domain Lookup Demo](https://img.shields.io/badge/Next.js-15.3.3-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Google AI](https://img.shields.io/badge/Google_AI-Gemini-green?style=for-the-badge&logo=google)
![Namecheap API](https://img.shields.io/badge/Namecheap-API-orange?style=for-the-badge)

## ✨ Features

- 🤖 **AI-Powered Suggestions**: Uses Google Gemini AI to generate creative domain names based on your project description
- 🌐 **Real-time Availability**: Checks domain availability using Namecheap's production API
- 🎯 **Multiple TLD Support**: Check .com, .net, .org, and other popular extensions
- 🔄 **Smart Fallbacks**: Multiple API fallback systems for maximum reliability
- 📱 **Responsive Design**: Beautiful UI that works on desktop and mobile
- ⚡ **Fast Performance**: Built with Next.js 15 and Turbopack for lightning-fast development

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Namecheap Account** - [Sign up here](https://www.namecheap.com/)
- **Google AI Studio Account** - [Get API key here](https://ai.google.dev/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DandanITman/DomainLookup.git
   cd DomainLookup
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create `.env.local` file in the root directory:
   ```bash
   # Google AI (Gemini) API key for domain name generation
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Namecheap API credentials for domain availability checking
   NAMECHEAP_API_KEY=your_namecheap_api_key
   NAMECHEAP_API_USER=your_namecheap_username
   NAMECHEAP_USERNAME=your_namecheap_username
   NAMECHEAP_CLIENT_IP=your_whitelisted_ip_address
   NAMECHEAP_SANDBOX=false
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:9002`

## 🔧 API Setup Guide

### Google Gemini AI Setup

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Create a new project or select existing one
4. Generate an API key
5. Copy the key (starts with "AIza...")

### Namecheap API Setup

1. **Create Namecheap Account**: [Sign up here](https://www.namecheap.com/)

2. **Enable API Access**:
   - Login to your Namecheap account
   - Go to Profile > Tools > Namecheap API Access
   - Toggle API access ON
   - Accept Terms of Service

3. **Get Your API Key**:
   - Your API key will be generated automatically
   - Your Namecheap username serves as both API user and username

4. **Whitelist Your IP Address**:
   - In the same API Access section
   - Click "Edit" next to Whitelisted IPs
   - Add your current IP address
   - Save changes

5. **Production vs Sandbox**:
   - Set `NAMECHEAP_SANDBOX=false` for production API
   - Set `NAMECHEAP_SANDBOX=true` for testing (requires sandbox account)

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + Radix UI components
- **Language**: TypeScript for type safety
- **AI Integration**: Google Gemini via Genkit
- **Domain API**: Namecheap production API
- **Development**: Turbopack for fast builds

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── actions.ts         # Server actions for domain operations
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Main page
├── components/            # React components
│   ├── domain-finder.tsx # Main domain search component
│   ├── api-debug-panel.tsx # API diagnostics
│   └── ui/               # Reusable UI components
├── services/             # API integrations
│   ├── domain-api-namecheap.ts    # Namecheap API service
│   ├── domain-api-alternative.ts  # DNS/HTTP fallback
│   └── domain-api-mock.ts         # Mock service for development
├── ai/                   # AI integration
│   ├── genkit.ts        # Genkit configuration
│   └── flows/           # AI flow definitions
└── lib/                 # Utilities and constants
```

### API Flow

1. **User Input**: User describes their project
2. **AI Generation**: Google Gemini generates domain name suggestions
3. **Domain Checking**: Namecheap API checks availability in real-time
4. **Fallback System**: If Namecheap fails, falls back to DNS/HTTP checking
5. **Results Display**: Shows available domains with copy/purchase options

## 🔧 Development

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript checks
```

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google AI API key | Yes | `AIzaSyA...` |
| `NAMECHEAP_API_KEY` | Namecheap API key | Yes | `928a7b82...` |
| `NAMECHEAP_API_USER` | Namecheap username | Yes | `yourusername` |
| `NAMECHEAP_USERNAME` | Namecheap username | Yes | `yourusername` |
| `NAMECHEAP_CLIENT_IP` | Your whitelisted IP | Yes | `192.168.1.1` |
| `NAMECHEAP_SANDBOX` | Use sandbox API | No | `false` |

## 🐛 Bug Fixes & Improvements

### Recent Updates

**v2.0.0 - Namecheap Integration**
- ✅ **FIXED**: Replaced unreliable GoDaddy API with Namecheap production API
- ✅ **IMPROVED**: Added comprehensive error handling and fallback systems
- ✅ **ENHANCED**: Real-time domain availability checking with better accuracy
- ✅ **ADDED**: DNS/HTTP alternative checking for maximum reliability
- ✅ **OPTIMIZED**: Faster response times and better user experience

**Previous Issues Resolved:**
- ❌ GoDaddy API 403 "ACCESS_DENIED" errors → ✅ Namecheap API working perfectly
- ❌ Inconsistent domain availability results → ✅ Accurate real-time checking
- ❌ Limited error handling → ✅ Comprehensive fallback systems
- ❌ Mock-only development mode → ✅ Production-ready API integration

## 🚦 Troubleshooting

### Common Issues

**1. Namecheap API "Access Denied"**
- Ensure API access is enabled in your Namecheap account
- Verify your IP address is whitelisted
- Check that all environment variables are set correctly

**2. Google AI API Errors**
- Verify your Gemini API key is valid and active
- Check API quotas and billing in Google Cloud Console
- Ensure the key starts with "AIza"

**3. Application Not Starting**
- Run `npm install` to ensure all dependencies are installed
- Check that Node.js version is 18 or higher
- Verify `.env.local` file exists and contains required variables

**4. Domain Results Not Showing**
- Check browser console for JavaScript errors
- Verify API keys are working in the terminal output
- Try refreshing the page or clearing browser cache

### Debug Mode

The application includes comprehensive logging. Check the terminal output for detailed API calls and responses:

```bash
🔍 Namecheap credentials check: ✅ Valid
📡 Namecheap API Request URL: https://api.namecheap.com/xml.response
✅ Namecheap found 8 available domains: [...]
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔗 Links

- [Live Demo](https://your-domain-lookup.vercel.app) (Coming Soon)
- [GitHub Repository](https://github.com/DandanITman/DomainLookup)
- [Namecheap API Docs](https://www.namecheap.com/support/api/)
- [Google AI Studio](https://ai.google.dev/)

---

**Made with ❤️ by [DandanITman](https://github.com/DandanITman)**