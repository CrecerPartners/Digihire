// Mock data for the Volt Student Dashboard

export const currentUser = {
  id: "usr_001",
  name: "Chidera Okafor",
  email: "chidera@unilag.edu.ng",
  avatar: "",
  university: "University of Lagos",
  referralCode: "VOLT-CHID23",
  referralLink: "https://talents.digihire.io/join-now?ref=VOLT-CHID23",
  whatsapp: "+2348012345678",
  bankName: "GTBank",
  accountNumber: "0123456789",
  tier: "Silver",
  joinedDate: "2025-09-15",
};

export const dashboardStats = {
  totalEarnings: 47500,
  pendingPayout: 12300,
  totalSales: 34,
  referralCount: 12,
  conversionRate: 18.5,
  weeklyGrowth: 23,
};

export const earningsData = [
  { week: "W1", earnings: 3200 },
  { week: "W2", earnings: 5400 },
  { week: "W3", earnings: 4100 },
  { week: "W4", earnings: 7800 },
  { week: "W5", earnings: 6200 },
  { week: "W6", earnings: 9500 },
  { week: "W7", earnings: 8300 },
  { week: "W8", earnings: 11200 },
];

export const recentActivity = [
  { id: 1, type: "sale", description: "Sold MTN 2GB Data Bundle", amount: 450, date: "2026-02-28", status: "confirmed" },
  { id: 2, type: "referral", description: "Bola joined via your link", amount: 200, date: "2026-02-27", status: "confirmed" },
  { id: 3, type: "bonus", description: "Weekly performance bonus", amount: 1000, date: "2026-02-27", status: "paid" },
  { id: 4, type: "sale", description: "Sold PiggyVest signup", amount: 800, date: "2026-02-26", status: "pending" },
  { id: 5, type: "sale", description: "Sold Campus Connect ticket", amount: 300, date: "2026-02-25", status: "confirmed" },
];

export type ProductCategory = "physical" | "digital" | "fintech" | "events";

export interface ProductAssets {
  images: string[];
  videoUrl?: string;
  whatsappMessage: string;
  instagramCaption: string;
  twitterCaption: string;
  sellingTips: string[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  commissionRate: number;
  price: number;
  image: string;
  description: string;
  assets: ProductAssets;
}

export const products: Product[] = [
  { id: "p1", name: "Wireless Earbuds Pro", brand: "TechZone", category: "physical", commissionRate: 15, price: 12000, image: "🎧", description: "Premium wireless earbuds with noise cancellation", assets: { images: ["https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400", "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400"], whatsappMessage: "🎧 Check out these Wireless Earbuds Pro! Premium noise cancellation at just ₦12,000. Order now 👉", instagramCaption: "🎧 Level up your audio game! Wireless Earbuds Pro with noise cancellation. Link in bio! #TechDeals #CampusLife", twitterCaption: "🎧 Noise-cancelling Wireless Earbuds Pro at ₦12,000 — your study sessions will never be the same! Grab yours 👇", sellingTips: ["Highlight the noise cancellation for studying in noisy dorms", "Compare favorably to AirPods at a fraction of the price", "Offer to demo them — sound quality sells itself"] } },
  { id: "p2", name: "Smart Watch Lite", brand: "TechZone", category: "physical", commissionRate: 12, price: 25000, image: "⌚", description: "Affordable smartwatch with fitness tracking", assets: { images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400", "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400"], whatsappMessage: "⌚ Smart Watch Lite — fitness tracking, notifications & more for just ₦25,000! DM to order 🔥", instagramCaption: "⌚ Stay connected & fit with the Smart Watch Lite! ₦25,000 only. #SmartWatch #FitnessTech", twitterCaption: "⌚ Fitness tracking + notifications on your wrist for just ₦25,000. Smart Watch Lite is a steal!", sellingTips: ["Focus on fitness tracking — very popular with students", "Show off notification mirroring feature", "Great gift idea for birthdays"] } },
  { id: "p3", name: "Campus Hoodie", brand: "UniWear", category: "physical", commissionRate: 20, price: 8500, image: "👕", description: "Premium quality campus branded hoodie", assets: { images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400", "https://images.unsplash.com/photo-1578768079470-f851e00fbe8b?w=400"], whatsappMessage: "👕 Rep your campus in style! Premium Campus Hoodie for just ₦8,500. Limited stock! 🔥", instagramCaption: "👕 Campus drip alert! Premium quality hoodie at ₦8,500. Don't sleep on this 🔥 #CampusFashion #UniWear", twitterCaption: "👕 Campus drip! Premium hoodie at ₦8,500 — limited stock, grab yours before it's gone 🔥", sellingTips: ["Show it being worn — lifestyle selling works best", "Emphasize limited stock to create urgency", "Great for group orders with friends"] } },
  { id: "p4", name: "LED Desk Lamp", brand: "BrightLife", category: "physical", commissionRate: 18, price: 5500, image: "💡", description: "USB rechargeable study lamp", assets: { images: ["https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400", "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400"], whatsappMessage: "💡 Study smarter with this USB rechargeable LED Desk Lamp! Only ₦5,500. Perfect for late-night reading 📚", instagramCaption: "💡 Late night study sessions just got better! USB LED Desk Lamp ₦5,500 #StudyEssentials #CampusLife", twitterCaption: "💡 USB rechargeable desk lamp for ₦5,500 — no more studying in the dark! Perfect for night owls 📚", sellingTips: ["Perfect for exam season — time your promotions", "Highlight USB rechargeable — no NEPA needed", "Bundle suggestion: pair with earbuds for a study kit"] } },
  { id: "p5", name: "MTN 2GB Data Bundle", brand: "MTN", category: "digital", commissionRate: 8, price: 1200, image: "📱", description: "30-day data plan", assets: { images: ["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400", "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400"], videoUrl: "", whatsappMessage: "📱 Get 2GB MTN Data for 30 days at ₦1,200! Stay connected 🌐 Click my link to buy 👇", instagramCaption: "📱 Never run out of data! 2GB MTN bundle for ₦1,200. Link in bio! #DataDeals #StayConnected", twitterCaption: "📱 2GB MTN data for 30 days — only ₦1,200. Stay connected without breaking the bank! 🌐", sellingTips: ["Everyone needs data — easiest product to sell", "Promote during start of month when people reload", "Offer to help with the purchase process"] } },
  { id: "p6", name: "Spotify Premium 3mo", brand: "Spotify", category: "digital", commissionRate: 25, price: 4500, image: "🎵", description: "3-month premium subscription", assets: { images: ["https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400", "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=400"], videoUrl: "", whatsappMessage: "🎵 Spotify Premium for 3 months at just ₦4,500! No ads, offline downloads. Use my link 👇", instagramCaption: "🎵 Upgrade your music game! Spotify Premium 3 months — ₦4,500. No ads ever! #SpotifyPremium #Music", twitterCaption: "🎵 3 months of Spotify Premium for ₦4,500 — no ads, offline mode, pure vibes. Cop it 👇", sellingTips: ["25% commission is one of the highest — push this one!", "Play music during hangouts, then mention the deal", "Great for music lovers — know your audience"] } },
  { id: "p7", name: "Coursera Plus Annual", brand: "Coursera", category: "digital", commissionRate: 30, price: 35000, image: "📚", description: "Unlimited access to 7,000+ courses", assets: { images: ["https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400", "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400"], videoUrl: "", whatsappMessage: "📚 Unlock 7,000+ courses on Coursera Plus for ₦35,000/year! Invest in yourself 🚀 Link below 👇", instagramCaption: "📚 Level up your skills! Coursera Plus gives you unlimited courses for one price. #LearnOnline #SkillUp", twitterCaption: "📚 7,000+ courses for one price — Coursera Plus at ₦35,000/yr. Best investment you'll make this year 🚀", sellingTips: ["30% commission = ₦10,500 per sale — your highest earner!", "Target students looking for internships/skills", "Share your own learning experience if you use it"] } },
  { id: "p8", name: "Netflix Student Plan", brand: "Netflix", category: "digital", commissionRate: 10, price: 2900, image: "🎬", description: "Monthly student subscription", assets: { images: ["https://images.unsplash.com/photo-1574375927938-d5a98e8d7e28?w=400", "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400"], videoUrl: "", whatsappMessage: "🎬 Netflix Student Plan at just ₦2,900/month! Binge your faves. Sign up here 👇", instagramCaption: "🎬 Movie nights sorted! Netflix Student Plan ₦2,900/mo. #Netflix #StudentLife", twitterCaption: "🎬 Netflix for ₦2,900/mo with the student plan — binge guilt-free. Sign up 👇", sellingTips: ["Promote around new show releases", "Everyone watches Netflix — easy conversation starter", "Mention the student discount angle"] } },
  { id: "p9", name: "PiggyVest Signup", brand: "PiggyVest", category: "fintech", commissionRate: 20, price: 0, image: "🐷", description: "Free signup — earn on each new user", assets: { images: ["https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400", "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400"], videoUrl: "", whatsappMessage: "🐷 Start saving smartly with PiggyVest — it's FREE to sign up! Join using my link 👇", instagramCaption: "🐷 Save smarter, not harder! PiggyVest is free to join. Start your savings journey today! #PiggyVest #Savings", twitterCaption: "🐷 PiggyVest is free to join and makes saving effortless. Start today 👇", sellingTips: ["Free signup = zero friction for customers", "Share your own savings progress as social proof", "Target students who want to build financial habits"] } },
  { id: "p10", name: "Kuda Bank Account", brand: "Kuda", category: "fintech", commissionRate: 15, price: 0, image: "🏦", description: "Free digital bank account signup", assets: { images: ["https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400", "https://images.unsplash.com/photo-1616514197671-15d99ce7a6f8?w=400"], videoUrl: "", whatsappMessage: "🏦 Open a free Kuda Bank account — no charges, free transfers! Sign up here 👇", instagramCaption: "🏦 Bank smarter with Kuda! Free account, free transfers. #KudaBank #FintechNigeria", twitterCaption: "🏦 Free bank account, free transfers — Kuda makes banking simple. Sign up 👇", sellingTips: ["Highlight free transfers — students love saving money", "Show the app interface — it's sleek and modern", "Mention the spending analytics feature"] } },
  { id: "p11", name: "Cowrywise Investment", brand: "Cowrywise", category: "fintech", commissionRate: 22, price: 0, image: "📈", description: "Investment platform signup", assets: { images: ["https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400", "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=400"], videoUrl: "", whatsappMessage: "📈 Start investing with as little as ₦100 on Cowrywise! Join free 👇", instagramCaption: "📈 Your money should work for you! Start investing on Cowrywise today. #Investing #WealthBuilding", twitterCaption: "📈 Invest from ₦100 with Cowrywise — your money should be working for you. Start free 👇", sellingTips: ["Emphasize you can start with just ₦100", "22% commission is excellent for a free signup", "Target financially-conscious students"] } },
  { id: "p12", name: "Campus Connect 2026", brand: "Volt Events", category: "events", commissionRate: 10, price: 3000, image: "🎉", description: "Biggest campus networking event", assets: { images: ["https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400", "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400"], videoUrl: "", whatsappMessage: "🎉 Campus Connect 2026 tickets are live! ₦3,000 only. Don't miss out! Get yours 👇", instagramCaption: "🎉 The biggest campus event of the year! Campus Connect 2026 — ₦3,000. #CampusConnect #Networking", twitterCaption: "🎉 Campus Connect 2026 is here! ₦3,000 for the biggest networking event on campus. Don't miss out 👇", sellingTips: ["Create FOMO — limited tickets available", "Share speaker lineup and past event highlights", "Offer group discounts for friend groups"] } },
  { id: "p13", name: "Tech Career Fair", brand: "Volt Events", category: "events", commissionRate: 12, price: 2000, image: "💼", description: "Connect with top tech companies", assets: { images: ["https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400", "https://images.unsplash.com/photo-1559223607-a43c990c692c?w=400"], videoUrl: "", whatsappMessage: "💼 Land your dream tech job! Tech Career Fair tickets at ₦2,000. Register now 👇", instagramCaption: "💼 Meet top tech companies at the Career Fair! ₦2,000 — your future self will thank you. #TechCareers", twitterCaption: "💼 Tech Career Fair — meet top companies, land your dream job. Only ₦2,000. Register 👇", sellingTips: ["Target final year students and job seekers", "Mention specific companies attending", "12% commission on volume sales adds up fast"] } },
  { id: "p14", name: "Music Festival Pass", brand: "CampusFest", category: "events", commissionRate: 8, price: 5000, image: "🎤", description: "All-access weekend music festival", assets: { images: ["https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400", "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400"], videoUrl: "", whatsappMessage: "🎤 All-access Music Festival Pass for ₦5,000! A whole weekend of vibes 🔥 Get yours 👇", instagramCaption: "🎤 Weekend vibes loading! All-access Music Festival Pass ₦5,000 #MusicFestival #CampusFest", twitterCaption: "🎤 All-access Music Festival Pass — a whole weekend of live music for ₦5,000. Get yours 👇🔥", sellingTips: ["Share artist lineup to build excitement", "Promote early — festival tickets sell best 2 weeks before", "Use stories and reels for maximum reach"] } },
];

export interface Transaction {
  id: string;
  date: string;
  type: "commission" | "referral_bonus" | "signup_bonus" | "performance_bonus" | "payout" | "manual_sale";
  description: string;
  amount: number;
  status: "pending" | "paid" | "processing";
  proofFileName?: string;
}

export const transactions: Transaction[] = [
  { id: "t1", date: "2026-02-28", type: "commission", description: "MTN Data Bundle sale", amount: 96, status: "pending" },
  { id: "t2", date: "2026-02-27", type: "referral_bonus", description: "Bola Adeyemi joined", amount: 200, status: "paid" },
  { id: "t3", date: "2026-02-27", type: "performance_bonus", description: "Weekly top seller bonus", amount: 1000, status: "paid" },
  { id: "t4", date: "2026-02-26", type: "commission", description: "PiggyVest signup", amount: 800, status: "pending" },
  { id: "t5", date: "2026-02-25", type: "commission", description: "Campus Connect ticket", amount: 300, status: "paid" },
  { id: "t6", date: "2026-02-24", type: "payout", description: "Weekly payout — Friday", amount: -15000, status: "paid" },
  { id: "t7", date: "2026-02-22", type: "commission", description: "Wireless Earbuds Pro", amount: 1800, status: "paid" },
  { id: "t8", date: "2026-02-21", type: "signup_bonus", description: "Welcome bonus", amount: 500, status: "paid" },
  { id: "t9", date: "2026-02-20", type: "referral_bonus", description: "Tunde Balogun joined", amount: 200, status: "paid" },
  { id: "t10", date: "2026-02-19", type: "commission", description: "Smart Watch Lite", amount: 3000, status: "paid" },
];

export const walletSummary = {
  availableBalance: 35200,
  pendingEarnings: 12300,
  totalEarned: 47500,
  totalPaidOut: 15000,
};

export interface Referral {
  id: string;
  name: string;
  date: string;
  status: "signed_up" | "active" | "earned";
  earnings: number;
}

export const referrals: Referral[] = [
  { id: "r1", name: "Bola Adeyemi", date: "2026-02-27", status: "active", earnings: 200 },
  { id: "r2", name: "Tunde Balogun", date: "2026-02-20", status: "earned", earnings: 450 },
  { id: "r3", name: "Fatima Yusuf", date: "2026-02-15", status: "earned", earnings: 380 },
  { id: "r4", name: "Emeka Nwankwo", date: "2026-02-10", status: "active", earnings: 200 },
  { id: "r5", name: "Aisha Mohammed", date: "2026-02-05", status: "signed_up", earnings: 0 },
  { id: "r6", name: "David Okonkwo", date: "2026-01-28", status: "earned", earnings: 520 },
  { id: "r7", name: "Grace Eze", date: "2026-01-20", status: "active", earnings: 150 },
];

export interface Sale {
  id: string;
  date: string;
  product: string;
  customer: string;
  amount: number;
  commission: number;
  status: "confirmed" | "pending" | "cancelled";
  category: ProductCategory;
}

export const sales: Sale[] = [
  { id: "s1", date: "2026-02-28", product: "MTN 2GB Data Bundle", customer: "Cust***01", amount: 1200, commission: 96, status: "pending", category: "digital" },
  { id: "s2", date: "2026-02-27", product: "PiggyVest Signup", customer: "Cust***02", amount: 0, commission: 800, status: "pending", category: "fintech" },
  { id: "s3", date: "2026-02-25", product: "Campus Connect 2026", customer: "Cust***03", amount: 3000, commission: 300, status: "confirmed", category: "events" },
  { id: "s4", date: "2026-02-22", product: "Wireless Earbuds Pro", customer: "Cust***04", amount: 12000, commission: 1800, status: "confirmed", category: "physical" },
  { id: "s5", date: "2026-02-20", product: "Smart Watch Lite", customer: "Cust***05", amount: 25000, commission: 3000, status: "confirmed", category: "physical" },
  { id: "s6", date: "2026-02-18", product: "Spotify Premium 3mo", customer: "Cust***06", amount: 4500, commission: 1125, status: "confirmed", category: "digital" },
  { id: "s7", date: "2026-02-15", product: "Kuda Bank Account", customer: "Cust***07", amount: 0, commission: 500, status: "confirmed", category: "fintech" },
  { id: "s8", date: "2026-02-12", product: "Campus Hoodie", customer: "Cust***08", amount: 8500, commission: 1700, status: "cancelled", category: "physical" },
];

export interface LeaderboardEntry {
  rank: number;
  name: string;
  university: string;
  earnings: number;
  sales: number;
  isCurrentUser?: boolean;
}

export const leaderboardCampus: LeaderboardEntry[] = [
  { rank: 1, name: "Adaeze Obi", university: "University of Lagos", earnings: 82000, sales: 56 },
  { rank: 2, name: "Chidera Okafor", university: "University of Lagos", earnings: 47500, sales: 34, isCurrentUser: true },
  { rank: 3, name: "Olumide Akin", university: "University of Lagos", earnings: 41200, sales: 29 },
  { rank: 4, name: "Kemi Fashola", university: "University of Lagos", earnings: 35800, sales: 24 },
  { rank: 5, name: "Samuel Ibe", university: "University of Lagos", earnings: 28900, sales: 20 },
];

export const leaderboardNational: LeaderboardEntry[] = [
  { rank: 1, name: "Ngozi Okafor", university: "University of Ibadan", earnings: 152000, sales: 98 },
  { rank: 2, name: "Ahmed Musa", university: "ABU Zaria", earnings: 134500, sales: 87 },
  { rank: 3, name: "Blessing Eze", university: "UNIBEN", earnings: 121000, sales: 76 },
  { rank: 7, name: "Chidera Okafor", university: "University of Lagos", earnings: 47500, sales: 34, isCurrentUser: true },
];

export const tiers = [
  { name: "Bronze", minEarnings: 0, color: "hsl(30 60% 50%)" },
  { name: "Silver", minEarnings: 25000, color: "hsl(0 0% 65%)" },
  { name: "Gold", minEarnings: 75000, color: "hsl(45 90% 50%)" },
  { name: "Platinum", minEarnings: 150000, color: "hsl(207 90% 54%)" },
];

export const formatNaira = (amount: number) => {
  return `₦${Math.abs(amount).toLocaleString()}`;
};


