/**
 * AI Categorization Logic for Indian Merchants
 * Uses word-boundary matching + weighted confidence scoring
 */

import { ExpenseCategory } from '@prisma/client';

interface CategorizationResult {
  category: ExpenseCategory;
  confidence: number;
  reasoning: string;
}

/* ──────────── Pattern Definition ──────────── */

interface Pattern {
  keyword: string;
  /** Weight: 1=generic, 2=moderate, 3=strong brand/specific */
  weight: number;
  /** If true, must match as a whole word (not substring) */
  wholeWord?: boolean;
}

const PATTERNS: Record<ExpenseCategory, Pattern[]> = {
  FOOD_DINING: [
    // Strong brands
    { keyword: 'swiggy', weight: 3, wholeWord: true },
    { keyword: 'zomato', weight: 3, wholeWord: true },
    { keyword: 'uber eats', weight: 3 },
    { keyword: 'dunzo food', weight: 3 },
    { keyword: 'blinkit food', weight: 3 },
    { keyword: 'dominos', weight: 3, wholeWord: true },
    { keyword: 'domino\'s', weight: 3 },
    { keyword: 'pizza hut', weight: 3 },
    { keyword: 'mcdonalds', weight: 3, wholeWord: true },
    { keyword: 'mcdonald\'s', weight: 3 },
    { keyword: 'kfc', weight: 3, wholeWord: true },
    { keyword: 'subway', weight: 2, wholeWord: true },
    { keyword: 'starbucks', weight: 3, wholeWord: true },
    { keyword: 'chaayos', weight: 3, wholeWord: true },
    { keyword: 'haldirams', weight: 3, wholeWord: true },
    { keyword: 'bikanervala', weight: 3, wholeWord: true },
    { keyword: 'burger king', weight: 3 },
    { keyword: 'pizza', weight: 2, wholeWord: true },
    { keyword: 'biryani', weight: 2 },
    { keyword: 'chai', weight: 1, wholeWord: true },
    { keyword: 'coffee', weight: 2, wholeWord: true },
    // Generic terms
    { keyword: 'restaurant', weight: 2 },
    { keyword: 'cafe', weight: 2, wholeWord: true },
    { keyword: 'dhaba', weight: 2, wholeWord: true },
    { keyword: 'food order', weight: 2 },
    { keyword: 'dining', weight: 2, wholeWord: true },
    { keyword: 'lunch', weight: 2, wholeWord: true },
    { keyword: 'dinner', weight: 2, wholeWord: true },
    { keyword: 'breakfast', weight: 2, wholeWord: true },
    { keyword: 'snacks', weight: 1, wholeWord: true },
    { keyword: 'meal', weight: 1, wholeWord: true },
  ],
  GROCERIES: [
    { keyword: 'big bazaar', weight: 3 },
    { keyword: 'reliance fresh', weight: 3 },
    { keyword: 'dmart', weight: 3, wholeWord: true },
    { keyword: 'd-mart', weight: 3 },
    { keyword: 'spencer', weight: 2, wholeWord: true },
    { keyword: 'bigbasket', weight: 3, wholeWord: true },
    { keyword: 'big basket', weight: 3 },
    { keyword: 'grofers', weight: 3, wholeWord: true },
    { keyword: 'blinkit', weight: 2, wholeWord: true },
    { keyword: 'zepto', weight: 2, wholeWord: true },
    { keyword: 'jiomart', weight: 3, wholeWord: true },
    { keyword: 'amazon fresh', weight: 3 },
    { keyword: 'flipkart grocery', weight: 3 },
    { keyword: 'instamart', weight: 3, wholeWord: true },
    { keyword: 'supermarket', weight: 2 },
    { keyword: 'kirana', weight: 2, wholeWord: true },
    { keyword: 'groceries', weight: 2 },
    { keyword: 'grocery', weight: 2 },
    { keyword: 'vegetables', weight: 2 },
    { keyword: 'fruits', weight: 1, wholeWord: true },
    { keyword: 'milk', weight: 1, wholeWord: true },
    { keyword: 'rations', weight: 1, wholeWord: true },
  ],
  TRAVEL_FUEL: [
    { keyword: 'uber ride', weight: 3 },
    { keyword: 'uber cab', weight: 3 },
    { keyword: 'uber auto', weight: 3 },
    { keyword: 'ola ride', weight: 3 },
    { keyword: 'ola cab', weight: 3 },
    { keyword: 'ola auto', weight: 3 },
    { keyword: 'rapido', weight: 3, wholeWord: true },
    { keyword: 'indian railways', weight: 3 },
    { keyword: 'irctc', weight: 3, wholeWord: true },
    { keyword: 'redbus', weight: 3, wholeWord: true },
    { keyword: 'makemytrip', weight: 3, wholeWord: true },
    { keyword: 'goibibo', weight: 3, wholeWord: true },
    { keyword: 'indigo flight', weight: 3 },
    { keyword: 'spicejet', weight: 3, wholeWord: true },
    { keyword: 'vistara', weight: 3, wholeWord: true },
    { keyword: 'air india', weight: 3 },
    { keyword: 'flight', weight: 2, wholeWord: true },
    { keyword: 'train ticket', weight: 3 },
    { keyword: 'bus ticket', weight: 3 },
    { keyword: 'cab ride', weight: 3 },
    { keyword: 'petrol', weight: 3, wholeWord: true },
    { keyword: 'diesel', weight: 3, wholeWord: true },
    { keyword: 'fuel', weight: 2, wholeWord: true },
    { keyword: 'indian oil', weight: 3 },
    { keyword: 'bharat petroleum', weight: 3 },
    { keyword: 'hp petrol', weight: 3 },
    { keyword: 'toll', weight: 2, wholeWord: true },
    { keyword: 'toll plaza', weight: 3 },
    { keyword: 'parking', weight: 2, wholeWord: true },
    { keyword: 'metro card', weight: 3 },
    { keyword: 'metro recharge', weight: 3 },
    { keyword: 'travel', weight: 1, wholeWord: true },
  ],
  RENT: [
    { keyword: 'rent', weight: 3, wholeWord: true },
    { keyword: 'house rent', weight: 3 },
    { keyword: 'room rent', weight: 3 },
    { keyword: 'flat rent', weight: 3 },
    { keyword: 'apartment rent', weight: 3 },
    { keyword: 'lease', weight: 2, wholeWord: true },
    { keyword: 'nobroker', weight: 3, wholeWord: true },
    { keyword: 'magicbricks', weight: 3, wholeWord: true },
    { keyword: 'housing.com', weight: 3 },
    { keyword: 'landlord', weight: 2, wholeWord: true },
    { keyword: 'pg rent', weight: 3 },
    { keyword: 'hostel', weight: 2, wholeWord: true },
  ],
  ELECTRICITY_GAS: [
    { keyword: 'electricity bill', weight: 3 },
    { keyword: 'electricity', weight: 2 },
    { keyword: 'power bill', weight: 3 },
    { keyword: 'bescom', weight: 3, wholeWord: true },
    { keyword: 'adani electricity', weight: 3 },
    { keyword: 'tata power', weight: 3 },
    { keyword: 'reliance energy', weight: 3 },
    { keyword: 'gas bill', weight: 3 },
    { keyword: 'lpg', weight: 3, wholeWord: true },
    { keyword: 'cylinder', weight: 2, wholeWord: true },
    { keyword: 'indane gas', weight: 3 },
    { keyword: 'bharat gas', weight: 3 },
    { keyword: 'hp gas', weight: 3 },
    { keyword: 'piped gas', weight: 3 },
    { keyword: 'water bill', weight: 2 },
  ],
  MOBILE_INTERNET: [
    { keyword: 'jio recharge', weight: 3 },
    { keyword: 'jio plan', weight: 3 },
    { keyword: 'airtel recharge', weight: 3 },
    { keyword: 'airtel plan', weight: 3 },
    { keyword: 'vodafone', weight: 2, wholeWord: true },
    { keyword: 'bsnl', weight: 3, wholeWord: true },
    { keyword: 'mobile recharge', weight: 3 },
    { keyword: 'phone recharge', weight: 3 },
    { keyword: 'recharge', weight: 2, wholeWord: true },
    { keyword: 'internet bill', weight: 3 },
    { keyword: 'broadband', weight: 3, wholeWord: true },
    { keyword: 'wifi bill', weight: 3 },
    { keyword: 'act fibernet', weight: 3 },
    { keyword: 'hathway', weight: 3, wholeWord: true },
    { keyword: 'mobile bill', weight: 3 },
    { keyword: 'phone bill', weight: 3 },
    { keyword: 'sim card', weight: 2 },
    { keyword: 'data pack', weight: 2 },
  ],
  SHOPPING: [
    { keyword: 'amazon', weight: 2, wholeWord: true },
    { keyword: 'flipkart', weight: 3, wholeWord: true },
    { keyword: 'myntra', weight: 3, wholeWord: true },
    { keyword: 'ajio', weight: 3, wholeWord: true },
    { keyword: 'nykaa', weight: 3, wholeWord: true },
    { keyword: 'meesho', weight: 3, wholeWord: true },
    { keyword: 'snapdeal', weight: 3, wholeWord: true },
    { keyword: 'tata cliq', weight: 3 },
    { keyword: 'croma', weight: 3, wholeWord: true },
    { keyword: 'reliance digital', weight: 3 },
    { keyword: 'lifestyle', weight: 2, wholeWord: true },
    { keyword: 'pantaloons', weight: 3, wholeWord: true },
    { keyword: 'westside', weight: 3, wholeWord: true },
    { keyword: 'max fashion', weight: 3 },
    { keyword: 'zara', weight: 2, wholeWord: true },
    { keyword: 'h&m', weight: 2, wholeWord: true },
    { keyword: 'shopping', weight: 2, wholeWord: true },
    { keyword: 'clothes', weight: 1, wholeWord: true },
    { keyword: 'shoes', weight: 1, wholeWord: true },
    { keyword: 'online order', weight: 1 },
  ],
  SUBSCRIPTIONS: [
    { keyword: 'netflix', weight: 3, wholeWord: true },
    { keyword: 'amazon prime', weight: 3 },
    { keyword: 'prime video', weight: 3 },
    { keyword: 'hotstar', weight: 3, wholeWord: true },
    { keyword: 'disney+', weight: 3 },
    { keyword: 'sonyliv', weight: 3, wholeWord: true },
    { keyword: 'zee5', weight: 3, wholeWord: true },
    { keyword: 'spotify', weight: 3, wholeWord: true },
    { keyword: 'youtube premium', weight: 3 },
    { keyword: 'apple music', weight: 3 },
    { keyword: 'gaana', weight: 2, wholeWord: true },
    { keyword: 'jio saavn', weight: 3 },
    { keyword: 'jio cinema', weight: 3 },
    { keyword: 'subscription', weight: 2 },
    { keyword: 'membership', weight: 2, wholeWord: true },
    { keyword: 'renewal', weight: 1, wholeWord: true },
    { keyword: 'monthly plan', weight: 2 },
    { keyword: 'annual plan', weight: 2 },
    { keyword: 'premium', weight: 1, wholeWord: true },
  ],
  MEDICAL: [
    { keyword: 'apollo pharmacy', weight: 3 },
    { keyword: 'apollo hospital', weight: 3 },
    { keyword: 'fortis hospital', weight: 3 },
    { keyword: 'medanta', weight: 3, wholeWord: true },
    { keyword: 'manipal hospital', weight: 3 },
    { keyword: 'max hospital', weight: 3 },
    { keyword: 'pharmeasy', weight: 3, wholeWord: true },
    { keyword: 'netmeds', weight: 3, wholeWord: true },
    { keyword: '1mg', weight: 3, wholeWord: true },
    { keyword: 'medplus', weight: 3, wholeWord: true },
    { keyword: 'pharmacy', weight: 3, wholeWord: true },
    { keyword: 'medicine', weight: 2, wholeWord: true },
    { keyword: 'medical', weight: 2, wholeWord: true },
    { keyword: 'doctor', weight: 2, wholeWord: true },
    { keyword: 'hospital', weight: 2, wholeWord: true },
    { keyword: 'clinic', weight: 2, wholeWord: true },
    { keyword: 'health checkup', weight: 3 },
    { keyword: 'blood test', weight: 3 },
    { keyword: 'x-ray', weight: 2, wholeWord: true },
    { keyword: 'diagnostics', weight: 2, wholeWord: true },
    { keyword: 'dentist', weight: 2, wholeWord: true },
    { keyword: 'eye checkup', weight: 3 },
    { keyword: 'prescription', weight: 2 },
  ],
  EDUCATION: [
    { keyword: 'school fees', weight: 3 },
    { keyword: 'college fees', weight: 3 },
    { keyword: 'tuition', weight: 3, wholeWord: true },
    { keyword: 'tuition fees', weight: 3 },
    { keyword: 'university', weight: 2, wholeWord: true },
    { keyword: 'byju', weight: 3, wholeWord: true },
    { keyword: 'byjus', weight: 3, wholeWord: true },
    { keyword: 'unacademy', weight: 3, wholeWord: true },
    { keyword: 'upgrad', weight: 3, wholeWord: true },
    { keyword: 'coursera', weight: 3, wholeWord: true },
    { keyword: 'udemy', weight: 3, wholeWord: true },
    { keyword: 'skillshare', weight: 3, wholeWord: true },
    { keyword: 'online course', weight: 3 },
    { keyword: 'coaching', weight: 2, wholeWord: true },
    { keyword: 'classes', weight: 1, wholeWord: true },
    { keyword: 'education', weight: 2, wholeWord: true },
    { keyword: 'books', weight: 1, wholeWord: true },
    { keyword: 'stationery', weight: 2, wholeWord: true },
    { keyword: 'exam fees', weight: 3 },
  ],
  MISCELLANEOUS: [],
};

/* ──────────── Matching Engine ──────────── */

function matchesKeyword(text: string, pattern: Pattern): boolean {
  const lowerText = text.toLowerCase();
  const lowerKeyword = pattern.keyword.toLowerCase();

  if (pattern.wholeWord) {
    // Word boundary matching: keyword must be a standalone word
    const regex = new RegExp(`(^|[\\s,;:!?.()\\-/])${escapeRegex(lowerKeyword)}($|[\\s,;:!?.()\\-/])`, 'i');
    return regex.test(lowerText);
  }

  return lowerText.includes(lowerKeyword);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ──────────── Main Categorization ──────────── */

export function categorizeExpense(description: string, amount?: number): CategorizationResult {
  const scores: { category: ExpenseCategory; score: number; matches: string[] }[] = [];

  for (const [category, patterns] of Object.entries(PATTERNS)) {
    const matches: string[] = [];
    let score = 0;

    for (const pattern of patterns) {
      if (matchesKeyword(description, pattern)) {
        matches.push(pattern.keyword);
        score += pattern.weight;
      }
    }

    if (score > 0) {
      scores.push({ category: category as ExpenseCategory, score, matches });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  if (scores.length > 0) {
    const winner = scores[0];
    const secondBest = scores[1]?.score || 0;

    // Confidence calculation:
    // - High gap between top and second = high confidence
    // - Multiple matches = higher confidence
    const gapRatio = winner.score / (winner.score + secondBest);
    const matchBonus = Math.min(winner.matches.length * 5, 15);
    const confidence = Math.min(Math.round(gapRatio * 80) + matchBonus, 95);

    // Only return if we have meaningful confidence
    if (confidence >= 30) {
      return {
        category: winner.category,
        confidence,
        reasoning: `Matched: ${winner.matches.slice(0, 3).join(', ')}. This looks like a ${getCategoryName(winner.category)} expense.`,
      };
    }
  }

  // Amount-based heuristics (only when keyword matching fails)
  if (amount) {
    if (amount >= 8000 && amount <= 60000) {
      return {
        category: 'RENT',
        confidence: 30,
        reasoning: 'Amount range (₹8,000–60,000) is typical for monthly rent in Indian cities.',
      };
    }
    if (amount >= 30 && amount <= 800) {
      return {
        category: 'FOOD_DINING',
        confidence: 25,
        reasoning: 'Small amount range suggests a food/dining expense.',
      };
    }
  }

  // Default fallback — low confidence
  return {
    category: 'MISCELLANEOUS',
    confidence: 15,
    reasoning: 'Could not confidently categorize. Please select a category manually.',
  };
}

function getCategoryName(category: ExpenseCategory): string {
  const names: Record<ExpenseCategory, string> = {
    FOOD_DINING: 'Food & Dining',
    GROCERIES: 'Groceries',
    TRAVEL_FUEL: 'Travel & Fuel',
    RENT: 'Rent',
    ELECTRICITY_GAS: 'Electricity & Gas',
    MOBILE_INTERNET: 'Mobile & Internet',
    SHOPPING: 'Shopping',
    SUBSCRIPTIONS: 'Subscription',
    MEDICAL: 'Medical',
    EDUCATION: 'Education',
    MISCELLANEOUS: 'Miscellaneous',
  };
  return names[category];
}
