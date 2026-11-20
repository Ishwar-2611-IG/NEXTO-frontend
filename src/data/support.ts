import { IMG, unsplash } from '../constants/images';
import type { FaqItem } from '../types';

export const FAQS: FaqItem[] = [
  { question: 'How can I track my order?', answer: 'You can track your order in real-time from your Account Dashboard under Orders or via the Track Order link in the footer.' },
  { question: 'What is your return and refund policy?', answer: 'We offer hassle-free returns within 7 days of delivery for all unworn items in original packaging.' },
  { question: 'How long does delivery take?', answer: 'Standard delivery takes 3-5 business days across India. Express shipping options are available at checkout.' },
  { question: 'Do you offer international shipping?', answer: 'Yes! We ship to over 10+ countries worldwide with calculated duties at checkout.' },
  { question: 'How do I find the right size?', answer: 'Check out our detailed Size Guide available on every product page for precise measurements.' },
  { question: 'What payment methods do you accept?', answer: 'We accept UPI, Credit/Debit Cards, Net Banking, and popular wallets like Paytm.' },
  { question: 'How can I apply a discount code?', answer: 'You can enter your discount code in the Shopping Cart or Checkout summary box before placing your order.' },
  { question: 'How can I contact customer support?', answer: 'You can reach us via live chat, email at support@nexto.com, or call us at +91 1800 123 4567.' },
];

export const SUPPORT_QUICK_LINKS = [
  { icon: 'package', title: 'Track My Order', desc: 'Check your delivery status' },
  { icon: 'refresh-cw', title: 'Returns & Refunds', desc: 'Start a return or refund' },
  { icon: 'truck', title: 'Shipping Information', desc: 'Delivery timelines & charges' },
  { icon: 'ruler', title: 'Size Guide', desc: 'Find your perfect fit' },
  { icon: 'credit-card', title: 'Payment Help', desc: 'Payment methods & issues' },
  { icon: 'user-round', title: 'Account Support', desc: 'Login, profile & more' },
];

export const SUPPORT_SUBJECTS = [
  'Order Status & Tracking',
  'Returns & Exchanges',
  'Sizing & Fit',
  'Payment Issue',
  'Other',
];

export const SUPPORT_CONTACTS = [
  { icon: 'mail', title: 'Email Us', value: 'support@nexto.com', note: 'We usually respond within 24 hours.', valueClass: 'text-[#7E7C77] font-mono' },
  { icon: 'phone', title: 'Call Us', value: '+91 1800 123 4567', note: 'Mon – Sat, 9AM – 7PM (IST)', valueClass: 'text-[#7E7C77] font-mono' },
  { icon: 'message-circle', title: 'Live Chat', value: 'Not connected yet', note: 'Please use the contact form on this page.', valueClass: 'text-[#6B7B6E] font-mono' },
];

export const SUPPORT_TOPICS = [
  { title: 'SHIPPING POLICY', desc: 'Delivery timelines, charges and locations.', img: unsplash(IMG.clothingRack, 600) },
  { title: 'RETURNS & REFUNDS', desc: 'Hassle-free returns within 7 days.', img: unsplash(IMG.womensStyle, 600) },
  { title: 'SIZE GUIDE', desc: 'Find the perfect fit for your style.', img: unsplash(IMG.mensStreetwear, 600) },
  { title: 'PAYMENT METHODS', desc: 'UPI, Cards, Net Banking and more.', img: unsplash(IMG.footwearEditorial, 600) },
  { title: 'ORDER TRACKING', desc: 'Track your order in real-time.', img: unsplash(IMG.minimalistWardrobe, 600) },
];
