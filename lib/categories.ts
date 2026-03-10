/**
 * Indian Expense Categories Configuration
 */

import { ExpenseCategory } from '@prisma/client';

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  FOOD_DINING: 'Food & Dining',
  GROCERIES: 'Groceries',
  TRAVEL_FUEL: 'Travel & Fuel',
  RENT: 'Rent',
  ELECTRICITY_GAS: 'Electricity & Gas',
  MOBILE_INTERNET: 'Mobile & Internet',
  SHOPPING: 'Shopping',
  SUBSCRIPTIONS: 'Subscriptions',
  MEDICAL: 'Medical',
  EDUCATION: 'Education',
  MISCELLANEOUS: 'Miscellaneous',
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  FOOD_DINING: '#FF6B6B',
  GROCERIES: '#4ECDC4',
  TRAVEL_FUEL: '#FFE66D',
  RENT: '#A8E6CF',
  ELECTRICITY_GAS: '#95E1D3',
  MOBILE_INTERNET: '#6C5CE7',
  SHOPPING: '#FD79A8',
  SUBSCRIPTIONS: '#FDCB6E',
  MEDICAL: '#74B9FF',
  EDUCATION: '#A29BFE',
  MISCELLANEOUS: '#DFE6E9',
};

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  FOOD_DINING: '🍽️',
  GROCERIES: '🛒',
  TRAVEL_FUEL: '🚗',
  RENT: '🏠',
  ELECTRICITY_GAS: '⚡',
  MOBILE_INTERNET: '📱',
  SHOPPING: '🛍️',
  SUBSCRIPTIONS: '📺',
  MEDICAL: '💊',
  EDUCATION: '📚',
  MISCELLANEOUS: '💳',
};

// Indian merchant keywords for AI categorization
export const INDIAN_MERCHANT_PATTERNS: Record<ExpenseCategory, string[]> = {
  FOOD_DINING: [
    'swiggy', 'zomato', 'uber eats', 'dunzo', 'blinkit', 'zepto',
    'restaurant', 'cafe', 'dhaba', 'hotel', 'food', 'dining',
    'dominos', 'pizza hut', 'mcdonalds', 'kfc', 'subway', 'starbucks',
    'chaayos', 'haldirams', 'bikanervala',
  ],
  GROCERIES: [
    'big bazaar', 'reliance fresh', 'more', 'dmart', 'spencer',
    'grofers', 'bigbasket', 'jiomart', 'amazon fresh', 'flipkart grocery',
    'supermarket', 'kirana', 'vegetables', 'fruits',
  ],
  TRAVEL_FUEL: [
    'uber', 'ola', 'rapido', 'indian railways', 'irctc', 'redbus',
    'makemytrip', 'goibibo', 'indigo', 'spicejet', 'vistara',
    'petrol', 'diesel', 'fuel', 'bp', 'indian oil', 'bharat petroleum',
    'toll', 'parking', 'metro', 'auto',
  ],
  RENT: [
    'rent', 'lease', 'housing', 'apartment', 'flat',
    'nobroker', 'magicbricks', 'housing.com',
  ],
  ELECTRICITY_GAS: [
    'electricity', 'power', 'bescom', 'adani', 'tata power',
    'gas', 'lpg', 'indane', 'bharat gas', 'hp gas',
  ],
  MOBILE_INTERNET: [
    'jio', 'airtel', 'vodafone', 'bsnl', 'vi', 'idea',
    'recharge', 'mobile', 'internet', 'broadband', 'wifi',
    'act fibernet', 'hathway', 'tikona',
  ],
  SHOPPING: [
    'amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho',
    'snapdeal', 'shopclues', 'paytm mall', 'tata cliq',
    'lifestyle', 'pantaloons', 'westside', 'max fashion',
    'shopping', 'mall', 'store',
  ],
  SUBSCRIPTIONS: [
    'netflix', 'amazon prime', 'hotstar', 'disney', 'sonyliv',
    'zee5', 'voot', 'spotify', 'youtube premium', 'apple music',
    'gaana', 'jio saavn', 'subscription', 'membership',
  ],
  MEDICAL: [
    'apollo', 'max', 'fortis', 'medanta', 'manipal',
    'pharmacy', 'medplus', 'netmeds', 'pharmeasy', '1mg',
    'doctor', 'hospital', 'clinic', 'medical', 'medicine',
    'health', 'lab', 'test', 'diagnostics',
  ],
  EDUCATION: [
    'school', 'college', 'university', 'course', 'tuition',
    'byju', 'unacademy', 'upgrad', 'coursera', 'udemy',
    'books', 'stationery', 'fees', 'education',
  ],
  MISCELLANEOUS: [],
};

export function getCategoryLabel(category: ExpenseCategory): string {
  return CATEGORY_LABELS[category];
}

export function getCategoryColor(category: ExpenseCategory): string {
  return CATEGORY_COLORS[category];
}

export function getCategoryIcon(category: ExpenseCategory): string {
  return CATEGORY_ICONS[category];
}

export function getAllCategories(): ExpenseCategory[] {
  return Object.keys(CATEGORY_LABELS) as ExpenseCategory[];
}
