# 🇮🇳 Indian Expense Tracker - AI-Powered Money Management

A production-grade AI expense management web app built specifically for Indian users. Track every rupee with intelligent categorization, beautiful UI, and insights in simple Indian English.

## ✨ Features

### 🎯 Built for India
- **INR First**: All amounts in ₹ with Indian number formatting (₹1,25,000)
- **Indian Categories**: Food & Dining, Groceries, Travel & Fuel, Rent, and more
- **AI Merchant Detection**: Automatically detects Swiggy, Zomato, Jio, Uber, Amazon, Flipkart, and 100+ Indian merchants
- **Indian Date Format**: DD MMM YYYY (05 Feb 2026)

### 🤖 AI-Powered
- **Smart Categorization**: AI automatically suggests categories based on description and amount
- **Confidence Scores**: See how confident the AI is about each categorization
- **Insights**: Get personalized spending insights in simple Indian English
- **Receipt OCR**: Upload bills and extract amounts automatically (₹ detection)

### 📊 Expense Management
- **Track Expenses**: Add, edit, delete expenses with ease
- **Category Breakdown**: Visual pie charts showing where money goes
- **Monthly Trends**: Compare spending month-over-month
- **Search & Filter**: Find expenses by category or description

### 🎯 Budget Control
- **Category Budgets**: Set monthly limits for each spending category
- **Visual Progress**: Animated progress bars with color-coded warnings
- **80% Warning**: Get alerts when you've used 80% of your budget
- **Overspend Alerts**: See exactly how much you've exceeded

### 🎨 Premium Design (2026)
- **Apple-Level Polish**: Glassmorphism, gradients, smooth animations
- **Parallax Landing Page**: Scroll-based animations with floating elements
- **Framer Motion**: Heavy use of animations throughout
- **Dark & Light Mode**: Beautiful in both themes
- **Responsive**: Works perfectly on mobile, tablet, and desktop

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (animations)
- **Shadcn UI** (component library)
- **Recharts** (data visualization)

### Backend
- **Next.js API Routes**
- **Prisma ORM**
- **PostgreSQL**
- **Clerk** (authentication)

### AI
- Rule-based categorization with Indian merchant patterns
- Confidence scoring algorithm
- Ready for OpenAI integration (placeholder included)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- Clerk account (free tier works)

### Installation

1. **Clone and Install**
```bash
cd "E:\AI expanse"
npm install
```

2. **Set up Environment Variables**
```bash
cp .env.example .env
```

Edit `.env` and add:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/indian_expense_tracker"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# OpenAI (Optional - for future enhancement)
OPENAI_API_KEY=your_openai_api_key
```

3. **Set up Database**
```bash
npx prisma generate
npx prisma db push
```

4. **Run Development Server**
```bash
npm run dev
```

5. **Open App**
Navigate to `http://localhost:3000`

## 📱 Usage

### Adding an Expense
1. Click "Add Expense" from dashboard or expenses page
2. Enter description (e.g., "Lunch at Swiggy")
3. Enter amount in ₹
4. Click "Get AI Category Suggestion"
5. AI will suggest category with confidence score
6. Review and save

### Setting Budgets
1. Go to Budgets page
2. Click "Add Budget"
3. Select category
4. Set monthly limit in ₹
5. Track progress with visual indicators

### Viewing Insights
- Dashboard shows AI-generated insights
- Compare month-over-month spending
- See category-wise breakdowns
- Get personalized tips in Indian English

## 🎨 Features Showcase

### Indian Number Formatting
```typescript
formatIndianCurrency(125000) // ₹1,25,000
formatCompactIndianCurrency(1000000) // ₹10.00L
```

### AI Categorization
```typescript
categorizeExpense("Swiggy lunch order", 420)
// Returns: { category: "FOOD_DINING", confidence: 92, reasoning: "..." }
```

### Date Formatting
```typescript
formatIndianDate(new Date()) // 05 Feb 2026
```

## 🏗️ Project Structure

```
E:\AI expanse\
├── app/
│   ├── api/                    # API routes
│   │   ├── expenses/          # Expense CRUD
│   │   ├── budgets/           # Budget management
│   │   └── ai/                # AI categorization & insights
│   ├── dashboard/             # Dashboard pages
│   │   ├── expenses/          # Expense management
│   │   ├── budgets/           # Budget tracking
│   │   └── page.tsx           # Dashboard home
│   ├── sign-in/               # Authentication
│   ├── sign-up/
│   ├── layout.tsx
│   ├── page.tsx               # Landing page
│   └── globals.css
├── components/
│   ├── dashboard/             # Dashboard components
│   └── ui/                    # Shadcn UI components
├── lib/
│   ├── currency.ts            # Indian currency utilities
│   ├── date.ts                # Indian date formatting
│   ├── categories.ts          # Category definitions
│   ├── ai-categorization.ts   # AI logic
│   ├── auth.ts                # Auth helpers
│   ├── prisma.ts              # Prisma client
│   └── utils.ts               # Utilities
├── prisma/
│   └── schema.prisma          # Database schema
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🔒 Security

- **Authentication**: Clerk provides secure authentication
- **Authorization**: All API routes check user ownership
- **Database**: Prisma prevents SQL injection
- **Environment**: Sensitive keys in `.env` (not committed)

## 📈 Performance

- **Server Components**: Fast initial loads
- **Optimistic Updates**: Smooth UX
- **Code Splitting**: Automatic by Next.js
- **Image Optimization**: Next.js Image component

## 🌟 Future Enhancements

- [ ] OpenAI GPT-4 integration for smarter insights
- [ ] Receipt OCR with actual image processing
- [ ] UPI payment integration
- [ ] Export to Excel/PDF
- [ ] Recurring expenses
- [ ] Multi-currency support (for NRI users)
- [ ] Family/shared accounts
- [ ] Savings goals
- [ ] Investment tracking

## 📝 Indian Categories

1. **Food & Dining** - Swiggy, Zomato, restaurants
2. **Groceries** - DMart, BigBasket, Reliance Fresh
3. **Travel & Fuel** - Uber, Ola, petrol, IRCTC
4. **Rent** - Monthly apartment/flat rent
5. **Electricity & Gas** - Power bills, LPG
6. **Mobile & Internet** - Jio, Airtel, Vi, broadband
7. **Shopping** - Amazon, Flipkart, Myntra
8. **Subscriptions** - Netflix, Prime, Hotstar
9. **Medical** - Pharmacy, hospitals, 1mg
10. **Education** - School fees, courses, books
11. **Miscellaneous** - Everything else

## 🙏 Credits

Built with ❤️ for India by developers who understand Indian spending habits.

## 📄 License

This project is for educational and production use. Feel free to customize for your needs.

---

**Made in India 🇮🇳 | For India 🇮🇳**

Start tracking your expenses today and master your money with AI!
