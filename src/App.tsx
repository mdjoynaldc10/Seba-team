import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Users, 
  Heart, 
  User, 
  Menu, 
  Moon, 
  Sun, 
  LogOut, 
  Search, 
  ChevronRight, 
  ArrowLeft, 
  Info, 
  FileText, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  Filter,
  X,
  Smartphone,
  Facebook,
  ExternalLink,
  MessageCircle,
  Gamepad2,
  Plus,
  Copy,
  Phone,
  Mail,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { GoogleGenAI } from "@google/genai";

// --- Types ---
interface Member {
  name: string;
  designation: string;
  area: string;
  id: string;
  dob: string;
  bloodGroup: string;
  phone: string;
  email: string;
  joiningDate: string;
  photoId?: string;
  access: string;
}

interface Payment {
  amount: number;
  reason: string;
  date: string;
}

interface Donor {
  group: string;
  name: string;
  district: string;
  thana: string;
  phone: string;
}

interface HomePost {
  title: string;
  date: string;
  content: string;
  photoId?: string;
}

interface Book {
  id: string;
  name: string;
  author: string;
  category: string;
  status: string;
  recipient: string;
  date: string;
  recipientId: string;
  address: string;
  imageUrl?: string;
}

interface DonationProject {
  startDate: string;
  endDate: string;
  name: string;
  accountNo: string;
  accountType: string;
  target: number;
  status: string;
  description?: string;
}

interface DonationTransaction {
  date: string;
  projectName: string;
  donorName: string;
  amount: number;
  method: string;
}

interface Notice {
  title: string;
  message: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
}

// --- Sheets Logic ---
const HOME_SHEET_ID = '1YBSs5w0E5ujQBhCXkO4wtmVWbeEd66O7LJbaMXZAKEE';
const MEMBER_SHEET_ID = '1pJ5Tg-ihE1TQT4VO9wus52o9Rbm7Iv5ck5XMdjvlino';
const BLOOD_SHEET_ID = '1dFO9EhpwS8yV_O98cFDCQje6jXEjnnT2aJ1zhH6slxs';
const BOOKS_SHEET_ID = '1qevkZUndwH7v6QAwjDj56VDNR9dm1sRHYQU2X51MLig';
const DONATION_SHEET_ID = '1NnAsCeuP7Z1D4HKVqV4HjRPys0TJ2NXrpmmryzCEfvg';

const MEMBER_SHEETS = ['Sheet1', 'Sheet2', 'Sheet3', 'Sheet4', 'Sheet5', 'Sheet6', 'Sheet7', 'Sheet8', 'Sheet9', 'Sheet10'];
const PAYMENT_SHEETS = ['Sheet11', 'Sheet12', 'Sheet13', 'Sheet14', 'Sheet15', 'Sheet16', 'Sheet17', 'Sheet18', 'Sheet19', 'Sheet20'];
const BLOOD_SHEETS = ["Sheet1", "Sheet2", "Sheet3", "Sheet4", "Sheet5", "Sheet6"];
const BOOKS_SHEETS = ["Sheet1", "Sheet2", "Sheet3", "Sheet4", "Sheet5", "Sheet6", "Sheet7", "Sheet8"];
const PROJECT_SHEETS = ['Sheet1', 'Sheet2'];
const TRANSACTION_SHEETS = ['Sheet3', 'Sheet4', 'Sheet5', 'Sheet6', 'Sheet7', 'Sheet8', 'Sheet9', 'Sheet10'];

async function fetchHomePosts(): Promise<HomePost[]> {
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${HOME_SHEET_ID}/gviz/tq?tqx=out:json&headers=1`);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    if (!json.table || !json.table.rows) return [];
    return json.table.rows.map((row: any) => {
      const r = row.c;
      return {
        title: r[0]?.v || '',
        date: r[1]?.v || '',
        content: r[2]?.v || '',
        photoId: (r[3]?.v?.match(/[-\w]{25,}/) || [])[0]
      };
    }).reverse();
  } catch (e) {
    console.error("Error fetching home posts:", e);
    return [];
  }
}

async function fetchNotice(): Promise<Notice | null> {
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${HOME_SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=Notice`);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    if (!json.table || !json.table.rows || json.table.rows.length === 0) return null;
    const r = json.table.rows[0].c;
    if (!r || !r[0]?.v || !r[1]?.v) return null;
    return {
      title: String(r[0]?.v || '').trim(),
      message: String(r[1]?.v || '').trim()
    };
  } catch (e) {
    console.error("Error fetching notice:", e);
    return null;
  }
}

async function fetchNotifications(): Promise<Notification[]> {
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${HOME_SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=Notification`);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    if (!json.table || !json.table.rows) return [];
    return json.table.rows.map((row: any) => {
      const r = row.c;
      return {
        id: String(r[0]?.v || '').trim(),
        title: String(r[1]?.v || '').trim(),
        message: String(r[2]?.v || '').trim()
      };
    });
  } catch (e) {
    console.error("Error fetching notifications:", e);
    return [];
  }
}

async function fetchBooks(): Promise<Book[]> {
  try {
    const fetchPromises = BOOKS_SHEETS.map(name =>
      fetch(`https://docs.google.com/spreadsheets/d/${BOOKS_SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(name)}`)
        .then(res => res.text())
        .then(text => {
          const temp = text.substring(47).slice(0, -2);
          const json = JSON.parse(temp);
          if (!json.table || !json.table.rows) return [];
          return json.table.rows.map((row: any) => {
            const c = row.c;
            if (!c || !c[1]?.v) return null;
            return {
              id: String(c[0]?.v || '').trim(),
              name: String(c[1]?.v || '').trim(),
              author: String(c[2]?.v || '').trim(),
              category: String(c[3]?.v || '').trim(),
              status: String(c[4]?.v || '').trim(),
              recipient: String(c[6]?.v || '').trim(),
              date: String(c[7]?.v || '').trim(),
              recipientId: String(c[8]?.v || '').trim(),
              address: String(c[9]?.v || '').trim()
            };
          }).filter(Boolean);
        })
    );
    const allResults = await Promise.all(fetchPromises);
    return allResults.flat();
  } catch (err) {
    console.error("Error fetching books:", err);
    return [];
  }
}

async function loginMember(id: string, phone: string): Promise<Member | null> {
  try {
    const promises = MEMBER_SHEETS.map(async (sheet) => {
      const q = encodeURIComponent(`SELECT * WHERE D = '${id}' AND G CONTAINS '${phone}'`);
      try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${MEMBER_SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${sheet}&tq=${q}`);
        const text = await res.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));
        if (json.table.rows.length) {
          const r = json.table.rows[0].c;
          return {
            name: String(r[0]?.v || '').trim(),
            designation: String(r[1]?.v || '').trim(),
            area: String(r[2]?.v || '').trim(),
            id: String(r[3]?.v || '').trim(),
            dob: String(r[4]?.v || '').trim(),
            bloodGroup: String(r[5]?.v || '').trim(),
            phone: String(r[6]?.v || '').trim(),
            email: String(r[7]?.v || '').trim(),
            joiningDate: String(r[8]?.v || '').trim(),
            photoId: (r[9]?.v?.match(/[-\w]{25,}/) || [])[0],
            access: String(r[10]?.v || '').trim()
          };
        }
        return null;
      } catch (e) {
        return null;
      }
    });
    const results = await Promise.all(promises);
    return results.find(m => m !== null) || null;
  } catch (e) {
    console.error("Error logging in member:", e);
    return null;
  }
}

async function fetchPaymentHistory(id: string, phone: string): Promise<Payment[]> {
  try {
    const promises = PAYMENT_SHEETS.map(async (s) => {
      const q = encodeURIComponent(`SELECT * WHERE A = '${id}' AND B CONTAINS '${phone}'`);
      try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${MEMBER_SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${s}&tq=${q}`);
        const text = await res.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));
        return json.table.rows.map((r: any) => ({
          amount: r.c[2]?.v || 0,
          reason: r.c[3]?.v || '',
          date: r.c[4]?.v || ''
        }));
      } catch (e) {
        return [];
      }
    });
    const results = await Promise.all(promises);
    return results.flat();
  } catch (e) {
    console.error("Error fetching payment history:", e);
    return [];
  }
}

async function fetchAllDonors(): Promise<Donor[]> {
  try {
    const fetchPromises = BLOOD_SHEETS.map(name =>
      fetch(`https://docs.google.com/spreadsheets/d/${BLOOD_SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(name)}`)
        .then(res => res.text())
        .then(text => {
          const temp = text.substring(47).slice(0, -2);
          const json = JSON.parse(temp);
          if (!json.table || !json.table.rows) return [];
          return json.table.rows.map((row: any) => {
            const c = row.c;
            if (!c) return null;
            const group = String(c[0]?.v || '').trim();
            const name = String(c[1]?.v || '').trim();
            const district = String(c[2]?.v || '').trim();
            const thana = String(c[3]?.v || '').trim();
            const phone = String(c[4]?.v || '').trim();

            // Skip header rows or empty rows
            if (!group || !name || !phone || 
                group.toLowerCase().includes('group') || 
                name.toLowerCase().includes('name') ||
                district.toLowerCase() === 'district' ||
                thana.toLowerCase() === 'thana'
            ) return null;

            // Normalize: Trim and Capitalize first letter for consistency (Data Validation)
            const cleanDistrict = district.charAt(0).toUpperCase() + district.slice(1);
            const cleanThana = thana.charAt(0).toUpperCase() + thana.slice(1);

            return { group, name, district: cleanDistrict, thana: cleanThana, phone };
          }).filter(Boolean);
        })
    );
    const allResults = await Promise.all(fetchPromises);
    const uniqueDonors = Array.from(new Map(allResults.flat().map(item => [item.phone, item])).values());
    return uniqueDonors;
  } catch (err) {
    console.error("Error fetching donors:", err);
    return [];
  }
}

async function searchMembers(phone: string): Promise<Member[]> {
  try {
    const fetchPromises = MEMBER_SHEETS.map(async (s) => {
      const q = encodeURIComponent(`SELECT * WHERE G CONTAINS '${phone}' OR D = '${phone}'`);
      try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${MEMBER_SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${s}&tq=${q}`);
        const text = await res.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));
        if (!json.table || !json.table.rows) return [];
        return json.table.rows.map((row: any) => {
          const d = row.c;
          return {
            name: String(d[0]?.v || '').trim(),
            designation: String(d[1]?.v || '').trim(),
            area: String(d[2]?.v || '').trim(),
            id: String(d[3]?.v || '').trim(),
            dob: String(d[4]?.v || '').trim(),
            bloodGroup: String(d[5]?.v || '').trim(),
            phone: String(d[6]?.v || '').trim(),
            email: String(d[7]?.v || '').trim(),
            joiningDate: String(d[8]?.v || '').trim(),
            photoId: (d[9]?.v?.match(/[-\w]{25,}/) || [])[0],
            access: String(d[10]?.v || '').trim()
          };
        });
      } catch (e) {
        return [];
      }
    });
    const allResults = await Promise.all(fetchPromises);
    const flatResults = allResults.flat();
    // Remove duplicates by ID
    return Array.from(new Map(flatResults.map(m => [m.id, m])).values());
  } catch (e) {
    console.error("Error searching members:", e);
    return [];
  }
}

async function fetchAllMembers(): Promise<Member[]> {
  try {
    const fetchPromises = MEMBER_SHEETS.map(sheet =>
      fetch(`https://docs.google.com/spreadsheets/d/${MEMBER_SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${sheet}`)
        .then(res => res.text())
        .then(text => {
          const json = JSON.parse(text.substring(47).slice(0, -2));
          if (!json.table || !json.table.rows) return [];
          return json.table.rows.map((row: any) => {
            const r = row.c;
            if (!r || !r[0]?.v) return null;
            return {
              name: String(r[0]?.v || '').trim(),
              designation: String(r[1]?.v || '').trim(),
              area: String(r[2]?.v || '').trim(),
              id: String(r[3]?.v || '').trim(),
              dob: String(r[4]?.v || '').trim(),
              bloodGroup: String(r[5]?.v || '').trim(),
              phone: String(r[6]?.v || '').trim(),
              email: String(r[7]?.v || '').trim(),
              joiningDate: String(r[8]?.v || '').trim(),
              photoId: (r[9]?.v?.match(/[-\w]{25,}/) || [])[0],
              access: String(r[10]?.v || '').trim()
            };
          }).filter(Boolean);
        })
    );
    const allResults = await Promise.all(fetchPromises);
    const flatResults = allResults.flat();
    // Remove duplicates by ID
    return Array.from(new Map(flatResults.map(m => [m.id, m])).values());
  } catch (e) {
    console.error("Error fetching all members:", e);
    return [];
  }
}

async function fetchDonationProjects(): Promise<DonationProject[]> {
  try {
    const fetchPromises = PROJECT_SHEETS.map(sheet =>
      fetch(`https://docs.google.com/spreadsheets/d/${DONATION_SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${sheet}`)
        .then(res => res.text())
        .then(text => {
          const json = JSON.parse(text.substring(47).slice(0, -2));
          if (!json.table || !json.table.rows) return [];
          return json.table.rows.map((row: any) => {
            const r = row.c;
            if (!r || !r[2]?.v) return null;
            return {
              startDate: String(r[0]?.v || '').trim(),
              endDate: String(r[1]?.v || '').trim(),
              name: String(r[2]?.v || '').trim(),
              accountNo: String(r[3]?.v || '').trim(),
              accountType: String(r[4]?.v || '').trim(),
              target: Number(r[5]?.v || 0),
              status: String(r[6]?.v || '').trim(),
              description: String(r[7]?.v || '').trim()
            };
          }).filter(Boolean);
        })
    );
    const allResults = await Promise.all(fetchPromises);
    const flatResults = allResults.flat() as DonationProject[];
    return flatResults.sort((a, b) => {
      const aActive = a.status.toLowerCase() === 'active';
      const bActive = b.status.toLowerCase() === 'active';
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return 0;
    });
  } catch (e) {
    console.error("Error fetching donation projects:", e);
    return [];
  }
}

async function fetchDonationTransactions(): Promise<DonationTransaction[]> {
  try {
    const fetchPromises = TRANSACTION_SHEETS.map(sheet =>
      fetch(`https://docs.google.com/spreadsheets/d/${DONATION_SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${sheet}`)
        .then(res => res.text())
        .then(text => {
          const json = JSON.parse(text.substring(47).slice(0, -2));
          if (!json.table || !json.table.rows) return [];
          return json.table.rows.map((row: any) => {
            const r = row.c;
            if (!r || !r[1]?.v) return null;
            return {
              date: String(r[0]?.v || '').trim(),
              projectName: String(r[1]?.v || '').trim(),
              amount: Number(r[2]?.v || 0),
              donorName: String(r[3]?.v || '').trim(),
              method: String(r[4]?.v || '').trim()
            };
          }).filter(Boolean);
        })
    );
    const allResults = await Promise.all(fetchPromises);
    return allResults.flat() as DonationTransaction[];
  } catch (e) {
    console.error("Error fetching donation transactions:", e);
    return [];
  }
}

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---
const BookImage = ({ book, isDarkMode, className }: { book: Book, isDarkMode: boolean, className?: string }) => {
  const sizeClasses = className || "w-10 h-14";

  return (
    <div className={cn(sizeClasses, "bg-emerald-100 dark:bg-emerald-900/30 rounded-md flex items-center justify-center text-emerald-500")}>
      <BookOpen className="w-5 h-5" />
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'books' | 'members' | 'blood' | 'profile'>('home');

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('seba_dark_mode') === 'true');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [paymentData, setPaymentData] = useState<Payment[]>([]);
  const [donorData, setDonorData] = useState<Donor[]>([]);
  const [homePosts, setHomePosts] = useState<HomePost[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [donationProjects, setDonationProjects] = useState<DonationProject[]>([]);
  const [donationTransactions, setDonationTransactions] = useState<DonationTransaction[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  
  // Overlays
  const [showInfoPage, setShowInfoPage] = useState(false);
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [showBorrowedBooksPage, setShowBorrowedBooksPage] = useState(false);
  const [showDonationProjectsPage, setShowDonationProjectsPage] = useState(false);
  const [selectedDonationProject, setSelectedDonationProject] = useState<DonationProject | null>(null);
  const [showDonatePopup, setShowDonatePopup] = useState(false);
  const [isNumberCopied, setIsNumberCopied] = useState(false);
  const [showTicTacToe, setShowTicTacToe] = useState(false);
  const [showJoinDonorForm, setShowJoinDonorForm] = useState(false);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<Member | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'info' | 'payments' | 'books'>('info');
  const [memberProfilePayments, setMemberProfilePayments] = useState<Payment[]>([]);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isDonorFabVisible, setIsDonorFabVisible] = useState(true);
  const [isDonorSubmitting, setIsDonorSubmitting] = useState(false);
  const [donorFormMsg, setDonorFormMsg] = useState<{ text: string, type: 'success' | 'error' | 'warning' | null }>({ text: '', type: null });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [showLoginError, setShowLoginError] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showNotice, setShowNotice] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationsPage, setShowNotificationsPage] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [borrowFormData, setBorrowFormData] = useState({
    name: '',
    id: '',
    date: new Date().toISOString().split('T')[0],
    address: ''
  });
  
  // Search states
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [foundMembers, setFoundMembers] = useState<Member[]>([]);
  const [bloodSearchQuery, setBloodSearchQuery] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('সব');
  const [filteredDonors, setFilteredDonors] = useState<Donor[]>([]);
  const [isSearchingDonors, setIsSearchingDonors] = useState(false);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [selectedBookCategory, setSelectedBookCategory] = useState<string>('সব');

  useEffect(() => {
    if (currentUser) {
      setBorrowFormData(prev => ({
        ...prev,
        name: currentUser.name,
        id: currentUser.id,
        address: currentUser.area
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (showLoginError) {
      const timer = setTimeout(() => {
        setShowLoginError(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showLoginError]);

  const handleBorrowRequest = () => {
    if (!selectedBook) return;
    
    const message = `বই সংগ্রহের অনুরোধ:
বইয়ের নাম: ${selectedBook.name}
লেখক: ${selectedBook.author}
গ্রহীতা: ${borrowFormData.name}
আইডি নং: ${borrowFormData.id}
তারিখ: ${borrowFormData.date}
ঠিকানা: ${borrowFormData.address}`;

    // Copy to clipboard
    navigator.clipboard.writeText(message).then(() => {
      // Show tick animation
      setIsRequestSent(true);
      
      // Wait for animation then open messenger
      setTimeout(() => {
        window.open(`https://m.me/100071182715718`, '_blank');
        setShowBorrowForm(false);
        setIsRequestSent(false);
      }, 800);
    }).catch(() => {
      // Fallback if clipboard fails
      window.open(`https://m.me/100071182715718`, '_blank');
      setShowBorrowForm(false);
      setIsRequestSent(false);
    });
  };

  const isInternalNavigation = useRef(false);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        isInternalNavigation.current = true;
        setActiveTab(event.state.tab || 'home');
        setShowInfoPage(!!event.state.showInfoPage);
        setShowPaymentPage(!!event.state.showPaymentPage);
        setShowBorrowedBooksPage(!!event.state.showBorrowedBooksPage);
        setShowDonationProjectsPage(!!event.state.showDonationProjectsPage);
        setSelectedDonationProject(event.state.selectedDonationProject || null);
        setIsMenuOpen(!!event.state.isMenuOpen);
        setShowJoinDonorForm(!!event.state.showJoinDonorForm);
        setShowTicTacToe(!!event.state.showTicTacToe);
        setSelectedBook(event.state.selectedBook || null);
        setSelectedPayment(event.state.selectedPayment || null);
        setSelectedMemberProfile(event.state.selectedMemberProfile || null);
        setShowNotificationsPage(!!event.state.showNotificationsPage);
        setSelectedNotification(event.state.selectedNotification || null);
        setShowDonatePopup(!!event.state.showDonatePopup);
        setShowLoginError(!!event.state.showLoginError);
        setShowBorrowForm(!!event.state.showBorrowForm);
        setShowNotice(!!event.state.showNotice);
        setTimeout(() => {
          isInternalNavigation.current = false;
        }, 50);
      }
    };

    // Initial state
    window.history.replaceState({ 
      tab: activeTab, 
      showInfoPage, 
      showPaymentPage, 
      showBorrowedBooksPage, 
      showDonationProjectsPage,
      selectedDonationProject,
      isMenuOpen,
      showJoinDonorForm,
      showTicTacToe,
      selectedBook,
      selectedPayment,
      selectedMemberProfile,
      showNotificationsPage,
      selectedNotification,
      showDonatePopup,
      showLoginError,
      showBorrowForm,
      showNotice
    }, '');

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Push state when navigation changes
  useEffect(() => {
    if (!isInternalNavigation.current) {
      window.history.pushState({ 
        tab: activeTab, 
        showInfoPage, 
        showPaymentPage, 
        showBorrowedBooksPage, 
        showDonationProjectsPage,
        selectedDonationProject,
        isMenuOpen,
        showJoinDonorForm,
        showTicTacToe,
        selectedBook,
        selectedPayment,
        selectedMemberProfile,
        showNotificationsPage,
        selectedNotification,
        showDonatePopup,
        showLoginError,
        showBorrowForm,
        showNotice
      }, '');
    }
  }, [activeTab, showInfoPage, showPaymentPage, showBorrowedBooksPage, showDonationProjectsPage, selectedDonationProject, isMenuOpen, showJoinDonorForm, showTicTacToe, selectedBook, selectedPayment, selectedMemberProfile, showNotificationsPage, selectedNotification, showDonatePopup, showLoginError, showBorrowForm, showNotice]);

  // Refs for swipe
  const touchStartX = useRef(0);
  const bloodTabRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  const handleBloodScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const st = e.currentTarget.scrollTop;
    // Hide the FAB when scrolled down from the top
    if (st > 10) {
      setIsDonorFabVisible(false);
    } else {
      setIsDonorFabVisible(true);
    }
    lastScrollTop.current = st <= 0 ? 0 : st;
  };

  useEffect(() => {
    if (activeTab === 'blood' && bloodTabRef.current) {
      setIsDonorFabVisible(bloodTabRef.current.scrollTop <= 10);
    }
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('seba_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    loadInitialData();

    // Load saved user from localStorage
    const savedUser = localStorage.getItem('seba_user');
    const savedPayments = localStorage.getItem('seba_payments');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        if (savedPayments) {
          setPaymentData(JSON.parse(savedPayments));
        }
      } catch (e) {
        console.error("Error parsing saved user data:", e);
      }
    }
  }, []);

  useEffect(() => {
    setIsSearchingDonors(true);
    const timer = setTimeout(() => {
      let result = [...donorData];

      // Text search
      if (bloodSearchQuery.trim()) {
        const query = bloodSearchQuery.toLowerCase();
        result = result.filter(d => {
          const name = String(d.name || '').toLowerCase();
          const group = String(d.group || '').toLowerCase();
          const district = String(d.district || '').toLowerCase();
          const thana = String(d.thana || '').toLowerCase();
          const phone = String(d.phone || '');
          
          return name.includes(query) || 
                 group.includes(query) || 
                 district.includes(query) || 
                 thana.includes(query) || 
                 phone.includes(query);
        });
      }

      // Blood Group filter
      if (selectedBloodGroup !== 'সব') {
        result = result.filter(d => d.group === selectedBloodGroup);
      }

      setFilteredDonors(result);
      setIsSearchingDonors(false);
    }, 400); // Simulate system search delay for better UX
    return () => clearTimeout(timer);
  }, [bloodSearchQuery, selectedBloodGroup, donorData]);

  const handleJoinDonorSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const contactNo = formData.get('ContactNo') as string;
    
    const joinedList = JSON.parse(localStorage.getItem('joinedDonors') || "[]");
    if (joinedList.includes(contactNo)) {
      setDonorFormMsg({ text: "আপনি আগে থেকেই Joined আছেন!", type: 'warning' });
      return;
    }

    setIsDonorSubmitting(true);
    setDonorFormMsg({ text: "আপনার তথ্য সংরক্ষণ করা হচ্ছে...", type: null });

    try {
      const scriptURL = 'https://script.google.com/macros/s/AKfycbw7SvFWNmwKLwz-9IUJH3yXhl8Dgt52j4hlRpv-2AW0QRXNEcoNMcLPuMikC6pX6518/exec';
      await fetch(scriptURL, { method: 'POST', body: formData });
      
      joinedList.push(contactNo);
      localStorage.setItem('joinedDonors', JSON.stringify(joinedList));
      
      setDonorFormMsg({ text: "ধন্যবাদ! আপনার তথ্য সফলভাবে সংরক্ষণ করা হয়েছে।", type: 'success' });
      (e.target as HTMLFormElement).reset();
      
      setTimeout(() => {
        setShowJoinDonorForm(false);
        setDonorFormMsg({ text: '', type: null });
      }, 2000);
    } catch (error) {
      setDonorFormMsg({ text: "দুঃখিত! আবার চেষ্টা করুন।", type: 'error' });
    } finally {
      setIsDonorSubmitting(false);
    }
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    const [posts, donors, allBooks, projects, transactions, noticeData, notificationData] = await Promise.all([
      fetchHomePosts(),
      fetchAllDonors(),
      fetchBooks(),
      fetchDonationProjects(),
      fetchDonationTransactions(),
      fetchNotice(),
      fetchNotifications()
    ]);
    setHomePosts(posts);
    setDonorData(donors);
    setBooks(allBooks);
    setDonationProjects(projects);
    setDonationTransactions(transactions);
    setNotifications(notificationData);
    
    if (noticeData && noticeData.title && noticeData.message) {
      setNotice(noticeData);
      setShowNotice(true);
      // Play notification sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.play().catch(e => console.log("Audio play failed:", e));
    }
    
    setIsLoading(false);
  };

  const isSpecialMember = (member: Member | null) => {
    if (!member) return false;
    return member.access === 'Admin';
  };

  useEffect(() => {
    if (activeTab === 'members' && isSpecialMember(currentUser) && allMembers.length === 0) {
      setIsLoading(true);
      fetchAllMembers().then(members => {
        setAllMembers(members);
        setIsLoading(false);
      });
    }
  }, [activeTab, currentUser]);

  const handleMemberClick = async (member: Member) => {
    setSelectedMemberProfile(member);
    setIsProfileLoading(true);
    const payments = await fetchPaymentHistory(member.id, member.phone);
    setMemberProfilePayments(payments);
    setIsProfileLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const id = formData.get('id') as string;
    const phone = formData.get('phone') as string;

    if (!id || !phone) return;

    setIsGlobalLoading(true);
    const member = await loginMember(id, phone);
    if (member) {
      setCurrentUser(member);
      localStorage.setItem('seba_user', JSON.stringify(member));
      const payments = await fetchPaymentHistory(id, phone);
      setPaymentData(payments);
      localStorage.setItem('seba_payments', JSON.stringify(payments));
    } else {
      setLoginErrorMsg("সদস্য পাওয়া যায়নি! আইডি নাম্বারে SF বড় হাতের দিন এবং ফোন নাম্বার শুন্য (০) ছাড়া লিখুন।");
      setShowLoginError(true);
    }
    setIsGlobalLoading(false);
  };

  const handleMemberSearch = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsLoading(true);
      const members = await searchMembers(memberSearchQuery);
      setFoundMembers(members);
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setPaymentData([]);
    localStorage.removeItem('seba_user');
    localStorage.removeItem('seba_payments');
    setIsMenuOpen(false);
    setActiveTab('home');
    setShowInfoPage(false);
    setShowPaymentPage(false);
    setShowBorrowedBooksPage(false);
    setShowJoinDonorForm(false);
    setShowTicTacToe(false);
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'তথ্য নেই';
    let date: Date;
    if (typeof dateValue === 'string') {
      const match = dateValue.match(/Date\((\d+),(\d+),(\d+)\)/);
      date = match ? new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3])) : new Date(dateValue);
    } else {
      date = new Date(dateValue);
    }
    if (isNaN(date.getTime())) return dateValue;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const tabs: ('home' | 'books' | 'members' | 'blood' | 'profile')[] = ['home', 'books', 'members', 'blood', 'profile'];
    const currentIndex = tabs.indexOf(activeTab);

    if (Math.abs(diff) > 100) {
      if (diff > 0 && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      } else if (diff < 0 && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-screen overflow-hidden font-['Hind_Siliguri']",
      isDarkMode ? "bg-slate-900 text-slate-50" : "bg-slate-50 text-slate-900"
    )}
    onTouchStart={handleTouchStart}
    onTouchEnd={handleTouchEnd}
    >
      {/* Global Loader */}
      <AnimatePresence>
        {isGlobalLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
            <p className="text-white font-semibold">যাচাই করা হচ্ছে...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-emerald-500 text-white flex items-center justify-between px-4 shadow-lg z-[1000]">
        <button onClick={() => setIsMenuOpen(true)} className="p-2">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold flex-1 ml-3">সেবা ফাউন্ডেশন</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setActiveTab('profile')} className="p-1">
            {currentUser?.photoId ? (
              <img 
                src={`https://lh3.googleusercontent.com/d/${currentUser.photoId}`} 
                className="w-8 h-8 rounded-full border-2 border-white/80 object-cover"
                alt="Profile"
              />
            ) : (
              <User className="w-6 h-6" />
            )}
          </button>
        </div>
      </header>

      {/* Side Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            key="menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => window.history.back()}
            className="fixed inset-0 bg-black/50 z-[2000]"
          />
        )}
        {isMenuOpen && (
          <motion.div 
            key="menu-content"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className={cn(
              "fixed top-0 left-0 w-[280px] h-full z-[2100] shadow-2xl pt-5",
              isDarkMode ? "bg-slate-800" : "bg-white"
            )}
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 mb-2">
              <h2 className="text-2xl font-bold text-emerald-500">সেবা ফাউন্ডেশন</h2>
            </div>
            <nav className="flex flex-col">
              <MenuLink icon={<Home />} label="হোম" onClick={() => { setActiveTab('home'); setIsMenuOpen(false); }} />
              <MenuLink icon={<BookOpen />} label="বইপুস্তক" onClick={() => { setActiveTab('books'); setIsMenuOpen(false); }} />
              <MenuLink icon={<Users />} label="সদস্যরা" onClick={() => { setActiveTab('members'); setIsMenuOpen(false); }} />
              <MenuLink icon={<Heart />} label="ব্লাড" onClick={() => { setActiveTab('blood'); setIsMenuOpen(false); }} />
              <MenuLink icon={<User />} label="প্রোফাইল" onClick={() => { setActiveTab('profile'); setIsMenuOpen(false); }} />
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-2 mx-6" />
              <MenuLink icon={isDarkMode ? <Sun /> : <Moon />} label={isDarkMode ? "লাইট মোড" : "ডার্ক মোড"} onClick={() => setIsDarkMode(!isDarkMode)} />
              <MenuLink icon={<LogOut />} label="লগআউট" onClick={logout} className="text-red-500" />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 mt-[60px] mb-[65px] relative overflow-hidden">
        <div 
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${['home', 'books', 'members', 'blood', 'profile'].indexOf(activeTab) * 20}%)`, width: '500%' }}
        >
          {/* Home Tab */}
          <div className="w-1/5 h-full overflow-y-auto p-4 max-w-2xl mx-auto scroll-smooth">
            {isLoading && homePosts.length === 0 ? (
              <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
            ) : (
              homePosts.map((post, idx) => (
                <div key={`post-${idx}-${post.title}`} className={cn(
                  "p-4 rounded-xl mb-5 border shadow-sm",
                  isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                )}>
                  <h3 className="text-lg font-bold mb-1">{post.title}</h3>
                  <p className="text-emerald-500 text-xs font-semibold mb-2">{formatDate(post.date)}</p>
                  <p className="text-sm leading-relaxed opacity-90">{post.content}</p>
                  {post.photoId && (
                    <img 
                      src={`https://drive.google.com/thumbnail?id=${post.photoId}&sz=w1000`} 
                      className="w-full rounded-lg mt-3 shadow-sm"
                      alt="Post"
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Books Tab */}
          <div className="w-1/5 h-full overflow-y-auto p-4 max-w-2xl mx-auto no-scrollbar">
            <div className={cn(
              "sticky -mt-4 -mx-4 top-0 z-50 p-4 space-y-3",
              isDarkMode ? "bg-slate-900" : "bg-slate-50"
            )}>
              <div className={cn(
                "flex items-center gap-3 px-4 py-1 rounded-xl border shadow-sm",
                isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
              )}>
                <Search className="w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="বইয়ের নাম, লেখক বা তথ্য দিয়ে খুঁজুন..."
                  className="flex-1 bg-transparent py-2 outline-none text-sm"
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                />
                {bookSearchQuery && (
                  <button onClick={() => setBookSearchQuery('')}>
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['সব', ...Array.from(new Set(books.map(b => b.category || 'অন্যান্য')))].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedBookCategory(cat)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all",
                      selectedBookCategory === cat 
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                        : isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-600"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {isLoading && books.length === 0 ? (
              <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
            ) : (
              <div className="space-y-6 mt-2">
                {(() => {
                  const filtered = books.filter(book => {
                    const query = bookSearchQuery.toLowerCase();
                    const matchesSearch = !query || 
                      (book.name || '').toLowerCase().includes(query) ||
                      (book.author || '').toLowerCase().includes(query) ||
                      (book.category || '').toLowerCase().includes(query) ||
                      (book.recipient || '').toLowerCase().includes(query) ||
                      (book.recipientId || '').toLowerCase().includes(query);
                    
                    const matchesCategory = selectedBookCategory === 'সব' || (book.category || 'অন্যান্য') === selectedBookCategory;
                    
                    return matchesSearch && matchesCategory;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-10 opacity-50">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>কোনো বই পাওয়া যায়নি</p>
                      </div>
                    );
                  }

                  const grouped = filtered.reduce((acc, book) => {
                    const cat = book.category || 'অন্যান্য';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(book);
                    return acc;
                  }, {} as Record<string, Book[]>);

                  return Object.entries(grouped).map(([category, catBooks]) => (
                    <div key={category} className="space-y-3">
                      <h2 className="text-lg font-bold border-l-4 border-emerald-500 pl-3 py-1">{category}</h2>
                      <div className="grid grid-cols-1 gap-3">
                        {(catBooks as Book[]).map((book, idx) => (
                          <button 
                            key={`book-${idx}-${book.name}`}
                            onClick={() => setSelectedBook(book)}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-xl border text-left active:scale-95 transition-transform",
                              isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <BookImage book={book} isDarkMode={isDarkMode} />
                              <div>
                                <span className="block font-bold">{book.name}</span>
                                <span className="text-xs opacity-60">{book.author}</span>
                              </div>
                            </div>
                            <span className={cn(
                              "text-[10px] px-2 py-1 rounded-full font-bold",
                              book.status === 'উপলব্ধ' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                            )}>
                              {book.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Members Tab */}
          <div className="w-1/5 h-full overflow-y-auto p-4 max-w-2xl mx-auto">
            <div className="sticky top-0 z-50 bg-inherit py-2">
              <div className={cn(
                "flex items-center gap-3 px-4 py-1 rounded-xl border shadow-sm",
                isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
              )}>
                <Search className="w-5 h-5 text-slate-400" />
                <input 
                  type={isSpecialMember(currentUser) ? "text" : "password"} 
                  placeholder={isSpecialMember(currentUser) ? "নাম, আইডি বা ফোন নম্বর..." : "কন্টাক্ট নম্বর লিখুন..."} 
                  className="flex-1 py-3 bg-transparent outline-none text-sm"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  onKeyDown={handleMemberSearch}
                />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {(() => {
                if (isSpecialMember(currentUser)) {
                  const query = memberSearchQuery.toLowerCase();
                  const filtered = allMembers.filter(m => 
                    m.name.toLowerCase().includes(query) || 
                    m.id.toLowerCase().includes(query) || 
                    m.phone.includes(query)
                  );

                  if (isLoading && allMembers.length === 0) {
                    return <div className="text-center p-4">সদস্য তালিকা লোড হচ্ছে...</div>;
                  }

                  if (filtered.length === 0) {
                    return <div className="text-center p-10 opacity-50">কোনো সদস্য পাওয়া যায়নি!</div>;
                  }

                  return filtered.map((m, idx) => (
                    <button 
                      key={`member-${idx}-${m.id}`} 
                      onClick={() => handleMemberClick(m)}
                      className={cn(
                        "w-full flex items-center gap-4 p-3 rounded-xl border text-left active:scale-95 transition-transform",
                        isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                      )}
                    >
                      {m.photoId ? (
                        <img 
                          src={`https://lh3.googleusercontent.com/d/${m.photoId}`} 
                          className="w-14 h-14 rounded-lg object-cover"
                          alt={m.name}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                          <User className="w-8 h-8" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold">{m.name}</h4>
                        <p className="text-xs opacity-70">{m.designation}</p>
                      </div>
                    </button>
                  ));
                }

                // Normal member search logic
                if (isLoading && memberSearchQuery) {
                  return <div className="text-center p-4">খোঁজা হচ্ছে...</div>;
                }
                
                if (foundMembers.length > 0) {
                  return foundMembers.map((m, idx) => (
                    <div key={`member-${idx}-${m.id}`} className={cn(
                      "flex items-center gap-4 p-3 rounded-xl border",
                      isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                    )}>
                      {m.photoId ? (
                        <img 
                          src={`https://lh3.googleusercontent.com/d/${m.photoId}`} 
                          className="w-14 h-14 rounded-lg object-cover"
                          alt={m.name}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                          <User className="w-8 h-8" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold">{m.name}</h4>
                        <p className="text-xs opacity-70">{m.designation}</p>
                      </div>
                    </div>
                  ));
                }

                if (memberSearchQuery && !isLoading) {
                  return <div className="text-center p-10 text-red-500">পাওয়া যায়নি!</div>;
                }

                return <div className="text-center p-10 opacity-50">সদস্য খুঁজতে ফোন নম্বর দিন</div>;
              })()}
            </div>
          </div>

          {/* Blood Tab */}
          <div 
            ref={bloodTabRef}
            onScroll={handleBloodScroll}
            className="w-1/5 h-full overflow-y-auto p-4 max-w-2xl mx-auto relative"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold">রক্তদাতার তথ্য খুঁজুন</h2>
              <p className="text-sm opacity-70">সঠিক রক্তের গ্রুপ অথবা ঠিকানা দিয়ে ফিল্টার করুন।</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className={cn(
                "flex items-center gap-3 px-4 py-1 rounded-xl border shadow-sm",
                isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
              )}>
                <Search className="w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="নাম বা ফোন নম্বর দিয়ে খুঁজুন..." 
                  className="flex-1 py-3 bg-transparent outline-none text-sm"
                  value={bloodSearchQuery}
                  onChange={(e) => setBloodSearchQuery(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase opacity-50 ml-2">রক্তের গ্রুপ</label>
                  <select 
                    value={selectedBloodGroup}
                    onChange={(e) => setSelectedBloodGroup(e.target.value)}
                    className={cn(
                      "w-full p-3 rounded-xl border outline-none text-sm appearance-none",
                      isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                    )}
                  >
                    <option value="সব">সব গ্রুপ</option>
                    {Array.from(new Set(donorData.map(d => d.group))).filter(Boolean).sort().map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {isSearchingDonors ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-70">
                <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                <p className="text-sm font-bold animate-pulse">সিস্টেম সার্চ করছে...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDonors.map((donor, idx) => (
                  <div key={`donor-${idx}-${donor.phone}`} className={cn(
                    "p-4 rounded-xl border shadow-sm",
                    isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                  )}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{donor.name}</h3>
                      <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">{donor.group}</span>
                    </div>
                    <p className="text-sm opacity-80 mb-1"><strong>ঠিকানা:</strong> {donor.district}, {donor.thana}</p>
                    <p className="text-sm opacity-80"><strong>মোবাইল:</strong> {donor.phone}</p>
                    <a href={`tel:${donor.phone}`} className="mt-3 flex items-center justify-center gap-2 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold">
                      কল করুন
                    </a>
                  </div>
                ))}
                {filteredDonors.length === 0 && (
                  <div className="text-center p-10 opacity-50">কোনো রক্তদাতা পাওয়া যায়নি</div>
                )}
              </div>
            )}
          </div>

          {/* Profile Tab */}
          <div className="w-1/5 h-full overflow-y-auto p-4 pt-0 max-w-2xl mx-auto">
            {!currentUser ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold">লগইন করুন</h3>
                <form onSubmit={handleLogin} className="w-full space-y-4">
                  <input 
                    name="id"
                    type="text" 
                    placeholder="আইডি" 
                    className={cn(
                      "w-full h-12 px-4 rounded-xl border outline-none focus:border-emerald-500 transition-colors",
                      isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                    )}
                  />
                  <input 
                    name="phone"
                    type="text" 
                    placeholder="ফোন নম্বর" 
                    className={cn(
                      "w-full h-12 px-4 rounded-xl border outline-none focus:border-emerald-500 transition-colors",
                      isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                    )}
                  />
                  <button type="submit" className="w-full h-12 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
                    লগইন
                  </button>
                </form>

                <div className="w-full pt-6 space-y-2">
                  <ProfileMenuLink 
                    icon={<Heart className="w-5 h-5 text-red-500" />} 
                    label="Donation" 
                    onClick={() => setShowDonationProjectsPage(true)} 
                    isDarkMode={isDarkMode}
                  />
                  <ProfileMenuLink 
                    icon={isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />} 
                    label="Dark Mode" 
                    onClick={() => setIsDarkMode(!isDarkMode)} 
                    isDarkMode={isDarkMode}
                    rightElement={<div className={cn("w-10 h-5 rounded-full relative transition-colors", isDarkMode ? "bg-emerald-500" : "bg-slate-300")}><div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", isDarkMode ? "right-1" : "left-1")} /></div>}
                  />
                  <ProfileMenuLink 
                    icon={<Facebook className="w-5 h-5" />} 
                    label="Facebook Page" 
                    onClick={() => window.open('https://www.facebook.com/profile.php?id=100071182715718', '_blank')} 
                    isDarkMode={isDarkMode}
                    rightElement={<ExternalLink className="w-4 h-4 text-slate-300" />}
                  />
                  <ProfileMenuLink 
                    icon={<Facebook className="w-5 h-5" />} 
                    label="Facebook Group" 
                    onClick={() => window.open('https://www.facebook.com/share/g/17BCSBMTA8/', '_blank')} 
                    isDarkMode={isDarkMode}
                    rightElement={<ExternalLink className="w-4 h-4 text-slate-300" />}
                  />
                  <ProfileMenuLink 
                    icon={<MessageCircle className="w-5 h-5 text-emerald-500" />} 
                    label="WhatsApp Channel" 
                    onClick={() => window.open('https://whatsapp.com/channel/0029VbCeAHpJ3juuRp2Dzi3N', '_blank')} 
                    isDarkMode={isDarkMode}
                    rightElement={<ExternalLink className="w-4 h-4 text-slate-300" />}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className={cn(
                  "sticky top-0 z-10 pt-4 pb-2",
                  isDarkMode ? "bg-slate-900" : "bg-slate-50"
                )}>
                  <div className={cn(
                    "text-center p-6 rounded-2xl border shadow-sm relative",
                    isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                  )}>
                    <div className="absolute top-4 right-4">
                      <button 
                        onClick={() => setShowNotificationsPage(true)}
                        className="relative p-2 bg-transparent rounded-full text-white active:scale-95 transition-all"
                        style={{ backgroundColor: '#FFFFFF00' }}
                      >
                        <Bell className={cn("w-6 h-6", isDarkMode ? "text-white" : "text-slate-400")} />
                        {notifications.some(n => n.id === currentUser.id && n.message) && (
                          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
                        )}
                      </button>
                    </div>
                    <div className="relative inline-block">
                      <img 
                        src={currentUser.photoId ? `https://lh3.googleusercontent.com/d/${currentUser.photoId}` : 'https://via.placeholder.com/100'} 
                        className="w-24 h-24 rounded-full border-4 border-emerald-500 object-cover mx-auto"
                        alt={currentUser.name}
                      />
                    </div>
                    <h2 className="text-2xl font-bold mt-4 mb-1">{currentUser.name}</h2>
                    <p className="text-slate-500 font-medium">{currentUser.designation}</p>
                  </div>
                </div>

                <div className="space-y-2 px-1">
                  <ProfileMenuLink 
                    icon={<Info className="w-5 h-5" />} 
                    label="Information" 
                    onClick={() => setShowInfoPage(true)} 
                    isDarkMode={isDarkMode}
                  />
                  <ProfileMenuLink 
                    icon={<FileText className="w-5 h-5" />} 
                    label="Payment History" 
                    onClick={() => setShowPaymentPage(true)} 
                    isDarkMode={isDarkMode}
                  />
                  <ProfileMenuLink 
                    icon={<BookOpen className="w-5 h-5" />} 
                    label="Borrowed Books" 
                    onClick={() => setShowBorrowedBooksPage(true)} 
                    isDarkMode={isDarkMode}
                  />
                  <ProfileMenuLink 
                    icon={<Gamepad2 className="w-5 h-5" />} 
                    label="Play TicTacToe" 
                    onClick={() => setShowTicTacToe(true)} 
                    isDarkMode={isDarkMode}
                  />
                  <ProfileMenuLink 
                    icon={isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />} 
                    label="Dark Mode" 
                    onClick={() => setIsDarkMode(!isDarkMode)} 
                    isDarkMode={isDarkMode}
                    rightElement={<div className={cn("w-10 h-5 rounded-full relative transition-colors", isDarkMode ? "bg-emerald-500" : "bg-slate-300")}><div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", isDarkMode ? "right-1" : "left-1")} /></div>}
                  />
                  <ProfileMenuLink 
                    icon={<Heart className="w-5 h-5 text-red-500" />} 
                    label="Donation" 
                    onClick={() => setShowDonationProjectsPage(true)} 
                    isDarkMode={isDarkMode}
                  />
                  <ProfileMenuLink 
                    icon={<Facebook className="w-5 h-5" />} 
                    label="Facebook Page" 
                    onClick={() => window.open('https://www.facebook.com/profile.php?id=100071182715718', '_blank')} 
                    isDarkMode={isDarkMode}
                    rightElement={<ExternalLink className="w-4 h-4 text-slate-300" />}
                  />
                  <ProfileMenuLink 
                    icon={<Facebook className="w-5 h-5" />} 
                    label="Facebook Group" 
                    onClick={() => window.open('https://www.facebook.com/share/g/17BCSBMTA8/', '_blank')} 
                    isDarkMode={isDarkMode}
                    rightElement={<ExternalLink className="w-4 h-4 text-slate-300" />}
                  />
                  <ProfileMenuLink 
                    icon={<MessageCircle className="w-5 h-5 text-emerald-500" />} 
                    label="WhatsApp Channel" 
                    onClick={() => window.open('https://whatsapp.com/channel/0029VbCeAHpJ3juuRp2Dzi3N', '_blank')} 
                    isDarkMode={isDarkMode}
                    rightElement={<ExternalLink className="w-4 h-4 text-slate-300" />}
                  />
                  <div className="pt-4">
                    <ProfileMenuLink 
                      icon={<LogOut className="w-5 h-5 text-red-500" />} 
                      label="Logout" 
                      onClick={logout} 
                      isDarkMode={isDarkMode}
                      className="border-red-100 dark:border-red-900/30 text-red-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notice Modal */}
        <AnimatePresence>
          {showNotice && notice && (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => window.history.back()}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className={cn(
                  "relative w-full max-w-sm p-6 rounded-3xl shadow-2xl z-10 overflow-hidden",
                  isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"
                )}
              >
                {/* Decorative background element */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
                
                <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-2">
                    <AlertCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-emerald-500">{notice.title}</h3>
                  
                  <div className={cn(
                    "w-full p-4 rounded-2xl text-sm leading-relaxed",
                    isDarkMode ? "bg-slate-900/50" : "bg-slate-50"
                  )}>
                    {notice.message}
                  </div>
                  
                  <button 
                    onClick={() => window.history.back()}
                    className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    বন্ধ করুন
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Donate Popup */}
      <AnimatePresence>
        {showDonatePopup && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => window.history.back()}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={cn(
                "relative w-full max-w-sm p-6 rounded-3xl shadow-2xl z-10",
                isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"
              )}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                </div>
                <h3 className="text-xl font-bold">অনুদান দিন</h3>
                <p className="text-sm leading-relaxed opacity-80">
                  আসসালামু আলাইকুম, আমাদের সেবা ফাউন্ডেশনে অনুদান দিতে নিম্নলিখিত বিকাশ অথবা নগদ নাম্বারে সেন্ড মানি করুন - 
                </p>
                
                <div className={cn(
                  "w-full p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all",
                  isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200",
                  isNumberCopied && "border-emerald-500 bg-emerald-50/10"
                )}>
                  <span className="text-lg font-bold tracking-wider">01821293053</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('01821293053');
                      setIsNumberCopied(true);
                      setTimeout(() => {
                        setShowDonatePopup(false);
                        setTimeout(() => setIsNumberCopied(false), 300);
                      }, 1500);
                    }}
                    className={cn(
                      "p-2 rounded-xl active:scale-90 transition-all",
                      isNumberCopied ? "bg-emerald-500 text-white" : "bg-emerald-500 text-white"
                    )}
                  >
                    {isNumberCopied ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 12 }}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {isNumberCopied && (
                  <motion.p 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-bold text-emerald-500"
                  >
                    নম্বরটি কপি করা হয়েছে!
                  </motion.p>
                )}

                <p className="text-sm font-bold text-emerald-500">ধন্যবাদ!</p>

                <button 
                  onClick={() => window.history.back()}
                  className="w-full py-3 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform mt-2"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login Error Popup */}
      <AnimatePresence>
        {showLoginError && (
          <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => window.history.back()}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={cn(
                "relative w-full max-w-xs p-6 rounded-3xl shadow-2xl z-10 border-2",
                isDarkMode ? "bg-slate-800 border-red-500/30 text-white" : "bg-white border-red-100 text-slate-900"
              )}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-red-500">সতর্কবার্তা!</h3>
                <p className="text-sm leading-relaxed font-medium">
                  {loginErrorMsg}
                </p>
                <button 
                  onClick={() => window.history.back()}
                  className="w-full py-3 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-transform mt-2"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FAB for joining as donor - Moved outside transformed container for visibility */}
        <AnimatePresence>
          {activeTab === 'blood' && isDonorFabVisible && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowJoinDonorForm(true)}
              className="fixed bottom-[85px] right-6 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-2xl flex items-center justify-center z-[2000] transition-all"
            >
              <Plus className="w-8 h-8" />
            </motion.button>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 h-[65px] flex justify-around items-center border-t z-[1000] pb-[env(safe-area-inset-bottom,0px)]",
        isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
      )}>
        <NavItem active={activeTab === 'home'} icon={<Home />} label="হোম" onClick={() => setActiveTab('home')} />
        <NavItem active={activeTab === 'books'} icon={<BookOpen />} label="বইপুস্তক" onClick={() => setActiveTab('books')} />
        <NavItem active={activeTab === 'members'} icon={<Users />} label="সদস্যরা" onClick={() => setActiveTab('members')} />
        <NavItem active={activeTab === 'blood'} icon={<Heart />} label="ব্লাড" onClick={() => setActiveTab('blood')} />
        <NavItem active={activeTab === 'profile'} icon={<User />} label="প্রোফাইল" onClick={() => setActiveTab('profile')} />
      </nav>

      {/* Overlays */}
      <AnimatePresence>
        {showInfoPage && currentUser && (
          <OverlayPage key="info-overlay" title="ব্যবহারকারীর তথ্য" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <div className="space-y-3">
              <InfoItem label="নাম" value={currentUser.name} isDarkMode={isDarkMode} />
              <InfoItem label="পদবী" value={currentUser.designation} isDarkMode={isDarkMode} />
              <InfoItem label="এলাকা" value={currentUser.area} isDarkMode={isDarkMode} />
              <InfoItem label="আইডি" value={currentUser.id} isDarkMode={isDarkMode} />
              <InfoItem label="জন্ম তারিখ" value={formatDate(currentUser.dob)} isDarkMode={isDarkMode} />
              <InfoItem label="রক্তের গ্রুপ" value={currentUser.bloodGroup} isDarkMode={isDarkMode} />
              <InfoItem label="ফোন" value={currentUser.phone} isDarkMode={isDarkMode} />
              <InfoItem label="ইমেইল" value={currentUser.email} isDarkMode={isDarkMode} />
              <InfoItem label="যোগদানের তারিখ" value={currentUser.joiningDate} isDarkMode={isDarkMode} />
            </div>
          </OverlayPage>
        )}

        {showPaymentPage && (
          <OverlayPage key="payment-overlay" title="পেমেন্ট হিস্টোরি" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <div className="space-y-3">
              {paymentData.length === 0 ? (
                <div className="text-center p-10 opacity-50">কোনো পেমেন্ট হিস্টোরি পাওয়া যায়নি</div>
              ) : (
                paymentData.map((p, idx) => (
                  <button 
                    key={`payment-${idx}-${p.date}`} 
                    onClick={() => setSelectedPayment(p)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border text-left",
                      isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block font-bold">{p.reason}</span>
                        <span className="text-[11px] opacity-60">{formatDate(p.date)}</span>
                      </div>
                    </div>
                    <div className="font-bold text-emerald-500">৳{p.amount}</div>
                  </button>
                ))
              )}
            </div>
          </OverlayPage>
        )}

        {showDonationProjectsPage && (
          <OverlayPage key="donation-projects-overlay" title="ডোনেশন প্রজেক্ট" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <div className="space-y-4">
              {donationProjects.length === 0 ? (
                <div className="text-center p-10 opacity-50">কোনো প্রজেক্ট পাওয়া যায়নি</div>
              ) : (
                donationProjects.map((project, idx) => {
                  const raised = donationTransactions
                    .filter(t => t.projectName === project.name)
                    .reduce((sum, t) => sum + t.amount, 0);
                  const remaining = Math.max(0, project.target - raised);
                  const progress = Math.min(100, (raised / project.target) * 100);
                  const isActive = project.status.toLowerCase() === 'active';

                  return (
                    <button 
                      key={`project-${idx}-${project.name}`} 
                      onClick={() => setSelectedDonationProject(project)}
                      className={cn(
                        "w-full p-5 rounded-2xl border text-left transition-all active:scale-[0.98]",
                        isActive 
                          ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20" 
                          : (isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-100 text-slate-900")
                      )}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold leading-tight flex-1 mr-2">{project.name}</h3>
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                          isActive ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-600"
                        )}>
                          {project.status}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold opacity-80">
                          <span>লক্ষ্য: ৳{project.target.toLocaleString()}</span>
                          <span>সংগৃহীত: ৳{raised.toLocaleString()}</span>
                        </div>
                        
                        <div className={cn(
                          "h-2.5 rounded-full overflow-hidden",
                          isActive ? "bg-white/20" : "bg-slate-100 dark:bg-slate-900/50"
                        )}>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={cn(
                              "h-full rounded-full",
                              isActive ? "bg-white" : "bg-emerald-500"
                            )}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold opacity-70">বাকি: ৳{remaining.toLocaleString()}</span>
                          <span className="text-[11px] font-bold">{progress.toFixed(1)}%</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </OverlayPage>
        )}

        {selectedDonationProject && (
          <OverlayPage 
            key="donation-transactions-overlay" 
            title={selectedDonationProject.name} 
            onClose={() => window.history.back()} 
            isDarkMode={isDarkMode}
          >
            <div className="space-y-3">
              {selectedDonationProject.description && (
                <div className={cn(
                  "p-4 rounded-2xl border mb-4",
                  isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-emerald-50 border-emerald-100"
                )}>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">প্রজেক্টের বিবরণ</p>
                  <p className="text-sm opacity-80 leading-relaxed">{selectedDonationProject.description}</p>
                </div>
              )}

              <div className={cn(
                "p-4 rounded-2xl border mb-4 grid grid-cols-2 gap-4",
                isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
              )}>
                <div>
                  <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-0.5">অ্যাকাউন্ট নম্বর</p>
                  <p className="text-sm font-bold">{selectedDonationProject.accountNo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-0.5">অ্যাকাউন্ট টাইপ</p>
                  <p className="text-sm font-bold">{selectedDonationProject.accountType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-0.5">শুরুর তারিখ</p>
                  <p className="text-sm font-bold">{formatDate(selectedDonationProject.startDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-0.5">শেষ তারিখ</p>
                  <p className="text-sm font-bold">{formatDate(selectedDonationProject.endDate)}</p>
                </div>
              </div>

              <h4 className="text-sm font-bold border-l-4 border-emerald-500 pl-3 py-1 mb-2">লেনদেন সমূহ</h4>
              
              {(() => {
                const projectTransactions = donationTransactions.filter(t => t.projectName === selectedDonationProject.name);
                if (projectTransactions.length === 0) {
                  return <div className="text-center p-10 opacity-50">কোনো লেনদেন পাওয়া যায়নি</div>;
                }
                return projectTransactions.map((t, idx) => (
                  <div 
                    key={`trans-${idx}-${t.date}`}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border",
                      isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block font-bold">{t.donorName || 'Anonymous'}</span>
                        <span className="text-[11px] opacity-60">{formatDate(t.date)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-500">৳{t.amount.toLocaleString()}</div>
                      <div className="text-[10px] opacity-50">{t.method || 'N/A'}</div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </OverlayPage>
        )}

        {showBorrowedBooksPage && currentUser && (
          <OverlayPage key="borrowed-books-overlay" title="গৃহীত বইসমূহ" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <div className="space-y-3">
              {(() => {
                const userBooks = books.filter(b => b.recipientId === currentUser.id);
                if (userBooks.length === 0) {
                  return <div className="text-center p-10 opacity-50">কোনো গৃহীত বই পাওয়া যায়নি</div>;
                }
                return userBooks.map((book, idx) => (
                  <div 
                    key={`user-book-${idx}-${book.name}`}
                    className={cn(
                      "p-4 rounded-xl border",
                      isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold">{book.name}</h4>
                        <p className="text-xs opacity-60">{book.author}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-emerald-500 text-white">
                        <span className="block text-white/80 mb-1">গ্রহণের তারিখ</span>
                        <span className="font-bold">{formatDate(book.date)}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-500 text-white">
                        <span className="block text-white/80 mb-1">ধরণ</span>
                        <span className="font-bold">{book.category || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </OverlayPage>
        )}

        {selectedMemberProfile && (
          <OverlayPage 
            key="member-full-profile" 
            title="সদস্য প্রোফাইল" 
            onClose={() => window.history.back()} 
            isDarkMode={isDarkMode}
          >
            <div className="space-y-6 pb-10">
              {/* Profile Header - Sticky */}
              <div className={cn(
                "sticky top-0 z-50 bg-inherit pt-2 pb-4 space-y-4 shadow-sm -mx-4 px-4",
                isDarkMode ? "bg-slate-900" : "bg-slate-50"
              )}>
                <div className="flex flex-col items-center text-center space-y-3">
                  {selectedMemberProfile.photoId ? (
                    <img 
                      src={`https://lh3.googleusercontent.com/d/${selectedMemberProfile.photoId}`} 
                      className="w-24 h-24 rounded-2xl object-cover shadow-xl border-4 border-emerald-500/20"
                      alt={selectedMemberProfile.name}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500 shadow-xl border-4 border-emerald-500/20">
                      <User className="w-12 h-12" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{selectedMemberProfile.name}</h2>
                    <p className="text-sm text-emerald-500 font-bold">{selectedMemberProfile.designation}</p>
                  </div>
                  
                  {/* Call and Mail Buttons - Iconic */}
                  <div className="flex gap-6">
                    <a 
                      href={`tel:${selectedMemberProfile.phone}`} 
                      className="w-12 h-12 flex items-center justify-center bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 active:scale-90 transition-all border-2 border-white/20"
                      title="Call"
                    >
                      <Phone className="w-6 h-6" />
                    </a>
                    <a 
                      href={`mailto:${selectedMemberProfile.email}`} 
                      className="w-12 h-12 flex items-center justify-center bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 active:scale-90 transition-all border-2 border-white/20"
                      title="Mail"
                    >
                      <Mail className="w-6 h-6" />
                    </a>
                  </div>
                </div>

                {/* Tab Navigation Buttons - Sticky with Active/Inactive Effect */}
                <div className="flex gap-2 p-1 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                  <button 
                    onClick={() => setActiveProfileTab('info')} 
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all text-[10px] uppercase tracking-wider",
                      activeProfileTab === 'info' 
                        ? "bg-emerald-500 text-white shadow-md" 
                        : "text-emerald-500/60 hover:text-emerald-500"
                    )}
                  >
                    Information
                  </button>
                  <button 
                    onClick={() => setActiveProfileTab('payments')} 
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all text-[10px] uppercase tracking-wider",
                      activeProfileTab === 'payments' 
                        ? "bg-emerald-500 text-white shadow-md" 
                        : "text-emerald-500/60 hover:text-emerald-500"
                    )}
                  >
                    Payments
                  </button>
                  <button 
                    onClick={() => setActiveProfileTab('books')} 
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all text-[10px] uppercase tracking-wider",
                      activeProfileTab === 'books' 
                        ? "bg-emerald-500 text-white shadow-md" 
                        : "text-emerald-500/60 hover:text-emerald-500"
                    )}
                  >
                    Books
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="space-y-4">
                {activeProfileTab === 'info' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-sm font-bold opacity-50 uppercase tracking-wider ml-1">ব্যক্তিগত তথ্য</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <InfoItem label="আইডি" value={selectedMemberProfile.id} isDarkMode={isDarkMode} />
                      <InfoItem label="এলাকা" value={selectedMemberProfile.area} isDarkMode={isDarkMode} />
                      <InfoItem label="রক্তের গ্রুপ" value={selectedMemberProfile.bloodGroup} isDarkMode={isDarkMode} />
                      <InfoItem label="ফোন" value={selectedMemberProfile.phone} isDarkMode={isDarkMode} />
                      <InfoItem label="ইমেইল" value={selectedMemberProfile.email} isDarkMode={isDarkMode} />
                      <InfoItem label="জন্ম তারিখ" value={formatDate(selectedMemberProfile.dob)} isDarkMode={isDarkMode} />
                      <InfoItem label="যোগদানের তারিখ" value={selectedMemberProfile.joiningDate} isDarkMode={isDarkMode} />
                    </div>
                  </div>
                )}

                {activeProfileTab === 'payments' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-sm font-bold opacity-50 uppercase tracking-wider ml-1">পেমেন্ট হিস্টোরি</h3>
                    {isProfileLoading ? (
                      <div className="text-center p-4">লোড হচ্ছে...</div>
                    ) : memberProfilePayments.length === 0 ? (
                      <div className={cn("p-4 rounded-xl border text-center opacity-50", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100")}>কোনো পেমেন্ট হিস্টোরি পাওয়া যায়নি</div>
                    ) : (
                      <div className="space-y-2">
                        {memberProfilePayments.map((p, idx) => (
                          <div key={`prof-pay-${idx}`} className={cn("flex items-center justify-between p-3 rounded-xl border", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100")}>
                            <div>
                              <span className="block font-bold text-sm">{p.reason}</span>
                              <span className="text-[10px] opacity-60">{formatDate(p.date)}</span>
                            </div>
                            <div className="font-bold text-emerald-500">৳{p.amount}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeProfileTab === 'books' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-sm font-bold opacity-50 uppercase tracking-wider ml-1">গৃহীত বইসমূহ</h3>
                    {(() => {
                      const userBooks = books.filter(b => b.recipientId === selectedMemberProfile.id);
                      if (userBooks.length === 0) {
                        return <div className={cn("p-4 rounded-xl border text-center opacity-50", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100")}>কোনো বই পাওয়া যায়নি</div>;
                      }
                      return (
                        <div className="space-y-2">
                          {userBooks.map((book, idx) => (
                            <div key={`prof-book-${idx}`} className={cn("p-3 rounded-xl border", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100")}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="block font-bold text-sm">{book.name}</span>
                                  <span className="text-[10px] opacity-60">{book.author}</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full font-bold">{formatDate(book.date)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </OverlayPage>
        )}

        {showTicTacToe && (
          <OverlayPage key="tictactoe-overlay" title="TicTacToe Game" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <TicTacToeGame isDarkMode={isDarkMode} />
          </OverlayPage>
        )}

        {showJoinDonorForm && (
          <OverlayPage key="join-donor-overlay" title="রক্তদাতা হিসেবে যোগ দিন" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <div className="space-y-6 pb-10">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">রক্তদাতা হিসেবে যোগ দিন</h2>
                <p className="text-xs text-slate-900 dark:text-white font-medium">সতর্কবার্তা: উন্মুক্ত তথ্য, ব্যাক্তিগত নাম্বার না দিয়ে অভিভাবক অথবা কাছের কারো নাম্বার দিন।</p>
              </div>

              <form onSubmit={handleJoinDonorSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Blood Group</label>
                  <select 
                    name="BloodGroup" 
                    required
                    className={cn(
                      "w-full h-12 px-4 rounded-[15px] border border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all",
                      isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"
                    )}
                  >
                    <option value="">আপনার রক্তের গ্রুপ সিলেক্ট করুন...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Name</label>
                  <input 
                    type="text" 
                    name="Name" 
                    placeholder="সম্পূর্ণ নাম লিখুন (বাংলায়)..." 
                    required
                    className={cn(
                      "w-full h-12 px-4 rounded-[15px] border border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all",
                      isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">District</label>
                  <input 
                    type="text" 
                    name="District" 
                    placeholder="জেলার নাম লিখুন (বাংলায়)..." 
                    required
                    className={cn(
                      "w-full h-12 px-4 rounded-[15px] border border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all",
                      isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">City</label>
                  <input 
                    type="text" 
                    name="City" 
                    placeholder="শহর/উপজেলার নাম লিখুন (বাংলায়)..." 
                    required
                    className={cn(
                      "w-full h-12 px-4 rounded-[15px] border border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all",
                      isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Contact No.</label>
                  <input 
                    type="tel" 
                    name="ContactNo" 
                    id="contactField"
                    placeholder="01XXXXXXXXX" 
                    required
                    className={cn(
                      "w-full h-12 px-4 rounded-[15px] border border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all",
                      isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900"
                    )}
                  />
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <button 
                    type="submit" 
                    disabled={isDonorSubmitting}
                    className="w-full h-14 bg-black hover:bg-emerald-700 text-white rounded-[30px] font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-70"
                  >
                    {isDonorSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> সংরক্ষণ করা হচ্ছে...
                      </>
                    ) : (
                      "যোগ দিন"
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowJoinDonorForm(false);
                      setActiveTab('blood');
                    }}
                    className="w-full h-14 bg-black hover:bg-emerald-700 text-white rounded-[30px] font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    ডোনার খুঁজুন
                  </button>
                </div>
              </form>

              {donorFormMsg.text && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-xl text-center text-sm font-medium",
                    donorFormMsg.type === 'success' ? "bg-emerald-100 text-emerald-600" :
                    donorFormMsg.type === 'error' ? "bg-red-100 text-red-600" :
                    donorFormMsg.type === 'warning' ? "bg-amber-100 text-amber-600" :
                    "bg-slate-100 text-slate-600"
                  )}
                >
                  {donorFormMsg.text}
                </motion.div>
              )}
            </div>
          </OverlayPage>
        )}

        {selectedBook && (
          <OverlayPage key="book-overlay" title="বই গ্রহীতার তথ্য" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <div className="space-y-3 pb-20">
              <div className="flex justify-center mb-6">
                <BookImage book={selectedBook} isDarkMode={isDarkMode} className="w-32 h-44 shadow-xl" />
              </div>
              <InfoItem label="বইয়ের নাম" value={selectedBook.name} isDarkMode={isDarkMode} />
              <InfoItem label="লেখক" value={selectedBook.author} isDarkMode={isDarkMode} />
              <InfoItem label="ধরণ" value={selectedBook.category} isDarkMode={isDarkMode} />
              <InfoItem label="স্ট্যাটাস" value={selectedBook.status} isDarkMode={isDarkMode} />
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-4" />
              <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider">গ্রহীতার তথ্য</h3>
              <InfoItem label="গ্রহীতা" value={selectedBook.recipient || 'N/A'} isDarkMode={isDarkMode} />
              <InfoItem label="আইডি নং" value={selectedBook.recipientId || 'N/A'} isDarkMode={isDarkMode} />
              <InfoItem label="তারিখ" value={formatDate(selectedBook.date)} isDarkMode={isDarkMode} />
              <InfoItem label="ঠিকানা" value={selectedBook.address || 'N/A'} isDarkMode={isDarkMode} />
            </div>

            {/* Floating Borrow Button */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-center">
              <button 
                onClick={() => setShowBorrowForm(true)}
                className="w-full h-14 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <BookOpen className="w-5 h-5" /> Borrow a book
              </button>
            </div>
          </OverlayPage>
        )}

        {showBorrowForm && selectedBook && (
          <OverlayPage key="borrow-form-overlay" title="বই সংগ্রহের ফর্ম" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500 border border-emerald-600 mb-4 text-white shadow-lg shadow-emerald-500/20 flex gap-4 items-center">
                <BookImage book={selectedBook} isDarkMode={isDarkMode} className="w-12 h-16 border-white/20" />
                <div>
                  <p className="text-xs text-white/80 font-medium mb-1">নির্বাচিত বই:</p>
                  <h4 className="font-bold text-lg">{selectedBook.name}</h4>
                  <p className="text-xs text-white/70">{selectedBook.author}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold opacity-60 ml-1">গ্রহীতার নাম</label>
                  <input 
                    type="text" 
                    value={borrowFormData.name}
                    onChange={(e) => setBorrowFormData({...borrowFormData, name: e.target.value})}
                    placeholder="আপনার নাম লিখুন"
                    className={cn(
                      "w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500",
                      isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold opacity-60 ml-1">আইডি নং</label>
                  <input 
                    type="text" 
                    value={borrowFormData.id}
                    onChange={(e) => setBorrowFormData({...borrowFormData, id: e.target.value})}
                    placeholder="আপনার আইডি নম্বর"
                    className={cn(
                      "w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500",
                      isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold opacity-60 ml-1">তারিখ</label>
                  <input 
                    type="date" 
                    value={borrowFormData.date}
                    onChange={(e) => setBorrowFormData({...borrowFormData, date: e.target.value})}
                    className={cn(
                      "w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500",
                      isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold opacity-60 ml-1">ঠিকানা</label>
                  <textarea 
                    value={borrowFormData.address}
                    onChange={(e) => setBorrowFormData({...borrowFormData, address: e.target.value})}
                    placeholder="আপনার বর্তমান ঠিকানা"
                    rows={3}
                    className={cn(
                      "w-full p-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none",
                      isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                    )}
                  />
                </div>
              </div>

              <button 
                onClick={handleBorrowRequest}
                disabled={isRequestSent}
                className={cn(
                  "w-full h-14 rounded-2xl font-bold mt-6 flex items-center justify-center gap-2 active:scale-95 transition-all",
                  isRequestSent ? "bg-emerald-100 text-emerald-500" : "bg-emerald-500 text-white"
                )}
              >
                {isRequestSent ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-6 h-6" /> Request Sent!
                  </motion.div>
                ) : (
                  "Send Request"
                )}
              </button>
            </div>
          </OverlayPage>
        )}
      </AnimatePresence>

        {showNotificationsPage && currentUser && (
          <OverlayPage 
            key="notifications-overlay" 
            title="নোটিফিকেশন" 
            onClose={() => window.history.back()} 
            isDarkMode={isDarkMode}
          >
            <div className="space-y-3">
              {(() => {
                const myNotifications = notifications.filter(n => n.id === currentUser.id && n.message);
                if (myNotifications.length === 0) {
                  return <div className="text-center p-10 opacity-50">কোনো নোটিফিকেশন পাওয়া যায়নি</div>;
                }
                return myNotifications.map((n, idx) => (
                  <button 
                    key={`notif-list-${idx}`}
                    onClick={() => setSelectedNotification(n)}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left active:scale-95 transition-all flex items-center gap-4",
                      isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                    )}
                  >
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500 shrink-0">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate">{n.title}</h4>
                      <p className="text-xs opacity-60 truncate">{n.message}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-30" />
                  </button>
                ));
              })()}
            </div>

            {/* Full Screen Notification Detail */}
            <AnimatePresence>
              {selectedNotification && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={cn(
                    "fixed inset-0 z-[5000] flex flex-col",
                    isDarkMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"
                  )}
                >
                  <div className={cn(
                    "flex items-center gap-4 p-4 border-b",
                    isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                  )}>
                    <button 
                      onClick={() => window.history.back()}
                      className="p-2 rounded-xl active:scale-90 transition-transform"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-lg font-bold">বিস্তারিত</h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-col items-center text-center space-y-6 max-w-lg mx-auto">
                      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <Bell className="w-10 h-10 text-emerald-500" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-emerald-500">{selectedNotification.title}</h3>
                        <div className="h-1 w-20 bg-emerald-500/20 mx-auto rounded-full" />
                      </div>
                      
                      <div className={cn(
                        "w-full p-6 rounded-3xl text-lg leading-relaxed shadow-sm border",
                        isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                      )}>
                        {selectedNotification.message}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </OverlayPage>
        )}

      {/* Invoice Modal - Outside main AnimatePresence to stay on top of background pages */}
      <AnimatePresence>
        {selectedPayment && currentUser && (
          <div key="invoice-modal-overlay" className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              key="invoice-modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-8 relative overflow-hidden text-slate-900"
              id="capture-area"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[100px] font-black text-emerald-500/5 -rotate-45 pointer-events-none">
                SEBA
              </div>
              <div className="relative z-10">
                <div className="text-center border-b-2 border-dashed border-slate-200 pb-6 mb-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h2 className="text-2xl font-bold text-emerald-500">সেবা ফাউন্ডেশন</h2>
                  <p className="text-xs text-slate-400 mt-1">ডিজিটাল রিসিট</p>
                </div>
                
                <div className="space-y-3">
                  <InvoiceRow label="নাম" value={currentUser.name} />
                  <InvoiceRow label="আইডি" value={currentUser.id} />
                  <InvoiceRow label="ফোন" value={currentUser.phone} />
                  <InvoiceRow label="তারিখ" value={formatDate(selectedPayment.date)} />
                  <InvoiceRow label="কারন" value={selectedPayment.reason} />
                  <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-lg font-medium">মোট টাকা:</span>
                    <span className="text-2xl font-bold text-emerald-500">৳{selectedPayment.amount}</span>
                  </div>
                </div>

                <div className="text-center mt-8 pt-4 border-t border-slate-50 text-[10px] text-slate-400">
                  <p>এই রিসিটটি ডিজিটালভাবে তৈরি করা হয়েছে।<br/>© সেবা ফাউন্ডেশন 2020</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2 no-capture">
                <button 
                  onClick={() => window.history.back()}
                  className="w-full h-12 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center flex-1 h-full transition-colors",
        active ? "text-emerald-500" : "text-slate-400"
      )}
    >
      <div className={cn("mb-1", active ? "scale-110" : "scale-100 transition-transform")}>{icon}</div>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

function MenuLink({ icon, label, onClick, className }: { icon: React.ReactNode, label: string, onClick: () => void, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn("flex items-center gap-4 px-6 py-4 font-medium active:bg-slate-100 dark:active:bg-slate-700 transition-colors", className)}
    >
      <span className="text-emerald-500">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ProfileMenuLink({ icon, label, onClick, isDarkMode, rightElement, className }: { icon: React.ReactNode, label: string, onClick: () => void, isDarkMode: boolean, rightElement?: React.ReactNode, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-xl border transition-colors",
        isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-emerald-500">{icon}</span>
        <span className="font-semibold">{label}</span>
      </div>
      {rightElement || <ChevronRight className="w-5 h-5 text-slate-300" />}
    </button>
  );
}

function OverlayPage({ title, onClose, children, isDarkMode }: { title: string, onClose: () => void, children: React.ReactNode, isDarkMode: boolean, key?: string }) {
  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={cn(
        "fixed inset-0 z-[2500] flex flex-col",
        isDarkMode ? "bg-slate-900" : "bg-slate-50"
      )}
    >
      <div className="bg-emerald-500 text-white p-4 flex items-center gap-4 shadow-lg">
        <button onClick={onClose} className="p-1"><ArrowLeft className="w-6 h-6" /></button>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </motion.div>
  );
}

function TicTacToeGame({ isDarkMode }: { isDarkMode: boolean }) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameMode, setGameMode] = useState<'PvP' | 'PvE'>('PvE');
  const [difficulty, setDifficulty] = useState<'Medium' | 'Hard'>('Medium');
  const [winner, setWinner] = useState<string | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    return null;
  };

  const handleClick = (i: number) => {
    if (winner || board[i]) return;
    const newBoard = [...board];
    newBoard[i] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
    
    const winInfo = calculateWinner(newBoard);
    if (winInfo) {
      setWinner(winInfo.winner);
      setWinningLine(winInfo.line);
    } else if (!newBoard.includes(null)) {
      setWinner('Draw');
    }
  };

  useEffect(() => {
    if (gameMode === 'PvE' && !isXNext && !winner) {
      const timer = setTimeout(() => {
        const bestMove = getBestMove(board, difficulty);
        if (bestMove !== -1) {
          handleClick(bestMove);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isXNext, gameMode, winner, board, difficulty]);

  const getBestMove = (squares: (string | null)[], diff: 'Medium' | 'Hard') => {
    if (diff === 'Hard') {
      return minimax(squares, 'O').index;
    } else {
      if (Math.random() > 0.3) {
        return minimax(squares, 'O').index;
      } else {
        const avail = squares.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
        return avail[Math.floor(Math.random() * avail.length)];
      }
    }
  };

  const minimax = (newBoard: (string | null)[], player: string): { score: number, index: number } => {
    const availSpots = newBoard.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
    const winInfo = calculateWinner(newBoard);
    if (winInfo?.winner === 'X') return { score: -10, index: -1 };
    if (winInfo?.winner === 'O') return { score: 10, index: -1 };
    if (availSpots.length === 0) return { score: 0, index: -1 };

    const moves = [];
    for (let i = 0; i < availSpots.length; i++) {
      const move: any = {};
      move.index = availSpots[i];
      newBoard[availSpots[i]] = player;

      if (player === 'O') {
        move.score = minimax(newBoard, 'X').score;
      } else {
        move.score = minimax(newBoard, 'O').score;
      }

      newBoard[availSpots[i]] = null;
      moves.push(move);
    }

    let bestMove = 0;
    if (player === 'O') {
      let bestScore = -10000;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score > bestScore) {
          bestScore = moves[i].score;
          bestMove = i;
        }
      }
    } else {
      let bestScore = 10000;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score < bestScore) {
          bestScore = moves[i].score;
          bestMove = i;
        }
      }
    }
    return moves[bestMove];
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-2 mb-4 w-full">
        <button 
          onClick={() => { setGameMode('PvE'); resetGame(); }}
          className={cn("flex-1 py-2 rounded-xl text-sm font-bold transition-all", gameMode === 'PvE' ? "bg-emerald-500 text-white" : (isDarkMode ? "bg-slate-800" : "bg-slate-100"))}
        >
          Vs Computer
        </button>
        <button 
          onClick={() => { setGameMode('PvP'); resetGame(); }}
          className={cn("flex-1 py-2 rounded-xl text-sm font-bold transition-all", gameMode === 'PvP' ? "bg-emerald-500 text-white" : (isDarkMode ? "bg-slate-800" : "bg-slate-100"))}
        >
          Vs Friend
        </button>
      </div>

      {gameMode === 'PvE' && (
        <div className="flex gap-2 mb-6 w-full">
          <button 
            onClick={() => setDifficulty('Medium')}
            className={cn("flex-1 py-1 rounded-lg text-xs font-bold transition-all", difficulty === 'Medium' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : (isDarkMode ? "bg-slate-800" : "bg-slate-100"))}
          >
            Medium
          </button>
          <button 
            onClick={() => setDifficulty('Hard')}
            className={cn("flex-1 py-1 rounded-lg text-xs font-bold transition-all", difficulty === 'Hard' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : (isDarkMode ? "bg-slate-800" : "bg-slate-100"))}
          >
            Hard
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-6">
        {board.map((square, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className={cn(
              "w-20 h-20 text-3xl font-bold rounded-2xl flex items-center justify-center transition-all active:scale-90",
              isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200",
              winningLine?.includes(i) ? "bg-emerald-500 text-white" : (square === 'X' ? "text-emerald-500" : "text-amber-500")
            )}
          >
            {square}
          </button>
        ))}
      </div>

      <div className="text-center mb-6">
        {winner ? (
          <div className="animate-bounce">
            <p className="text-xl font-bold text-emerald-500">
              {winner === 'Draw' ? "It's a Draw!" : `${winner} Wins!`}
            </p>
          </div>
        ) : (
          <p className="font-bold opacity-60">
            Next Player: <span className={isXNext ? "text-emerald-500" : "text-amber-500"}>{isXNext ? 'X' : 'O'}</span>
          </p>
        )}
      </div>

      <button 
        onClick={resetGame}
        className="w-full py-3 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
      >
        Restart Game
      </button>
    </div>
  );
}

function InfoItem({ label, value, isDarkMode }: { label: string, value: string, isDarkMode: boolean }) {
  return (
    <div className={cn(
      "p-4 rounded-xl border",
      isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
    )}>
      <label className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold mb-1">{label}</label>
      <b className="text-base">{value || 'N/A'}</b>
    </div>
  );
}

function InvoiceRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-400 font-medium">{label}:</span>
      <span className="text-slate-900 font-bold text-right">{value}</span>
    </div>
  );
}
