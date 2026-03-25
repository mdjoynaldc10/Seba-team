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
  Download,
  CheckCircle2,
  Loader2,
  BookOpen,
  Filter,
  X,
  Smartphone,
  Facebook,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
}

// --- Sheets Logic ---
const HOME_SHEET_ID = '1YBSs5w0E5ujQBhCXkO4wtmVWbeEd66O7LJbaMXZAKEE';
const MEMBER_SHEET_ID = '1pJ5Tg-ihE1TQT4VO9wus52o9Rbm7Iv5ck5XMdjvlino';
const BLOOD_SHEET_ID = '1dFO9EhpwS8yV_O98cFDCQje6jXEjnnT2aJ1zhH6slxs';
const BOOKS_SHEET_ID = '1qevkZUndwH7v6QAwjDj56VDNR9dm1sRHYQU2X51MLig';

const MEMBER_SHEETS = ['Sheet1', 'Sheet2', 'Sheet3', 'Sheet4', 'Sheet5', 'Sheet6', 'Sheet7', 'Sheet8', 'Sheet9', 'Sheet10'];
const PAYMENT_SHEETS = ['Sheet11', 'Sheet12', 'Sheet13', 'Sheet14', 'Sheet15', 'Sheet16', 'Sheet17', 'Sheet18', 'Sheet19', 'Sheet20'];
const BLOOD_SHEETS = ["Sheet1", "Sheet2", "Sheet3", "Sheet4", "Sheet5", "Sheet6"];
const BOOKS_SHEETS = ["Sheet1", "Sheet2", "Sheet3", "Sheet4", "Sheet5", "Sheet6", "Sheet7", "Sheet8"];

async function fetchHomePosts(): Promise<HomePost[]> {
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${HOME_SHEET_ID}/gviz/tq?tqx=out:json`);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
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
              id: String(c[0]?.v || ''),
              name: String(c[1]?.v || ''),
              author: String(c[2]?.v || ''),
              category: String(c[3]?.v || ''),
              status: String(c[4]?.v || ''),
              recipient: String(c[6]?.v || ''),
              date: String(c[7]?.v || ''),
              recipientId: String(c[8]?.v || ''),
              address: String(c[9]?.v || '')
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
    for (const sheet of MEMBER_SHEETS) {
      const q = encodeURIComponent(`SELECT * WHERE D = '${id}' AND G CONTAINS '${phone}'`);
      const res = await fetch(`https://docs.google.com/spreadsheets/d/${MEMBER_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheet}&tq=${q}`);
      const text = await res.text();
      const json = JSON.parse(text.substring(47).slice(0, -2));
      if (json.table.rows.length) {
        const r = json.table.rows[0].c;
        return {
          name: r[0]?.v || '',
          designation: r[1]?.v || '',
          area: r[2]?.v || '',
          id: r[3]?.v || '',
          dob: r[4]?.v || '',
          bloodGroup: r[5]?.v || '',
          phone: r[6]?.v || '',
          email: r[7]?.v || '',
          joiningDate: r[8]?.v || '',
          photoId: (r[9]?.v?.match(/[-\w]{25,}/) || [])[0]
        };
      }
    }
    return null;
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
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${MEMBER_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${s}&tq=${q}`);
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
            return {
              group: String(c[0]?.v || ''),
              name: String(c[1]?.v || ''),
              district: String(c[2]?.v || ''),
              thana: String(c[3]?.v || ''),
              phone: String(c[4]?.v || '')
            };
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
    let allFound: Member[] = [];
    for (const s of MEMBER_SHEETS) {
      const q = encodeURIComponent(`SELECT * WHERE G CONTAINS '${phone}'`);
      const res = await fetch(`https://docs.google.com/spreadsheets/d/${MEMBER_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${s}&tq=${q}`);
      const text = await res.text();
      const json = JSON.parse(text.substring(47).slice(0, -2));
      if (json.table.rows.length) {
        const members = json.table.rows.map((row: any) => {
          const d = row.c;
          return {
            name: d[0]?.v || '',
            designation: d[1]?.v || '',
            area: d[2]?.v || '',
            id: d[3]?.v || '',
            dob: d[4]?.v || '',
            bloodGroup: d[5]?.v || '',
            phone: d[6]?.v || '',
            email: d[7]?.v || '',
            joiningDate: d[8]?.v || '',
            photoId: (d[9]?.v?.match(/[-\w]{25,}/) || [])[0]
          };
        });
        allFound = [...allFound, ...members];
      }
    }
    return allFound;
  } catch (e) {
    console.error("Error searching members:", e);
    return [];
  }
}

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'books' | 'members' | 'blood' | 'profile'>('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [paymentData, setPaymentData] = useState<Payment[]>([]);
  const [donorData, setDonorData] = useState<Donor[]>([]);
  const [homePosts, setHomePosts] = useState<HomePost[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  
  // Overlays
  const [showInfoPage, setShowInfoPage] = useState(false);
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // Search states
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [foundMembers, setFoundMembers] = useState<Member[]>([]);
  const [bloodSearchQuery, setBloodSearchQuery] = useState('');
  const [filteredDonors, setFilteredDonors] = useState<Donor[]>([]);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [selectedBookCategory, setSelectedBookCategory] = useState<string>('সব');

  // Refs for swipe
  const touchStartX = useRef(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (bloodSearchQuery.trim()) {
      const query = bloodSearchQuery.toLowerCase();
      setFilteredDonors(donorData.filter(d => {
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
      }));
    } else {
      setFilteredDonors([]);
    }
  }, [bloodSearchQuery, donorData]);

  const loadInitialData = async () => {
    setIsLoading(true);
    const [posts, donors, allBooks] = await Promise.all([
      fetchHomePosts(),
      fetchAllDonors(),
      fetchBooks()
    ]);
    setHomePosts(posts);
    setDonorData(donors);
    setBooks(allBooks);
    setIsLoading(false);
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
      const payments = await fetchPaymentHistory(id, phone);
      setPaymentData(payments);
    } else {
      alert("সদস্য পাওয়া যায়নি!");
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
    setIsMenuOpen(false);
    setActiveTab('home');
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
    return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  const downloadInvoice = async () => {
    const area = document.getElementById('capture-area');
    if (!area) return;
    
    const canvas = await html2canvas(area, {
      scale: 2,
      backgroundColor: '#ffffff',
    });
    const link = document.createElement('a');
    link.download = `Seba_Invoice_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
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
            onClick={() => setIsMenuOpen(false)}
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
                              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500">
                                <BookOpen className="w-5 h-5" />
                              </div>
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
                  type="password" 
                  placeholder="কন্টাক্ট নম্বর লিখুন..." 
                  className="flex-1 py-3 bg-transparent outline-none text-sm"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  onKeyDown={handleMemberSearch}
                />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {isLoading && memberSearchQuery ? (
                <div className="text-center p-4">খোঁজা হচ্ছে...</div>
              ) : foundMembers.length > 0 ? (
                foundMembers.map((m, idx) => (
                  <div key={`member-${idx}-${m.id}`} className={cn(
                    "flex items-center gap-4 p-3 rounded-xl border",
                    isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                  )}>
                    <img 
                      src={m.photoId ? `https://lh3.googleusercontent.com/d/${m.photoId}` : 'https://via.placeholder.com/60'} 
                      className="w-14 h-14 rounded-lg object-cover"
                      alt={m.name}
                    />
                    <div>
                      <h4 className="font-bold">{m.name}</h4>
                      <p className="text-xs opacity-70">{m.designation}</p>
                    </div>
                  </div>
                ))
              ) : memberSearchQuery && !isLoading ? (
                <div className="text-center p-10 text-red-500">পাওয়া যায়নি!</div>
              ) : (
                <div className="text-center p-10 opacity-50">সদস্য খুঁজতে ফোন নম্বর দিন</div>
              )}
            </div>
          </div>

          {/* Blood Tab */}
          <div className="w-1/5 h-full overflow-y-auto p-4 max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-bold">রক্তদাতার তথ্য খুঁজুন</h2>
              <p className="text-sm opacity-70">সঠিক রক্তের গ্রুপ অথবা ফোন নম্বর ইংরেজিতে লিখে সার্চ করুন।</p>
            </div>
            <div className={cn(
              "flex items-center gap-3 px-4 py-1 rounded-xl border shadow-sm mb-6",
              isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
            )}>
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="নাম, রক্তের গ্রুপ, জেলা বা থানা..." 
                className="flex-1 py-3 bg-transparent outline-none text-sm"
                value={bloodSearchQuery}
                onChange={(e) => setBloodSearchQuery(e.target.value)}
              />
            </div>
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
              {bloodSearchQuery && filteredDonors.length === 0 && (
                <div className="text-center p-10 opacity-50">কোনো রক্তদাতা পাওয়া যায়নি</div>
              )}
            </div>
          </div>

          {/* Profile Tab */}
          <div className="w-1/5 h-full overflow-y-auto p-4 max-w-2xl mx-auto">
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
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className={cn(
                  "text-center p-6 rounded-2xl border",
                  isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                )}>
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

                <div className="space-y-2">
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
      <AnimatePresence mode="wait">
        {showInfoPage && currentUser && (
          <OverlayPage key="info-overlay" title="ব্যবহারকারীর তথ্য" onClose={() => setShowInfoPage(false)} isDarkMode={isDarkMode}>
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
          <OverlayPage key="payment-overlay" title="পেমেন্ট হিস্টোরি" onClose={() => setShowPaymentPage(false)} isDarkMode={isDarkMode}>
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

        {selectedBook && (
          <OverlayPage key="book-overlay" title="বই গ্রহীতার তথ্য" onClose={() => setSelectedBook(null)} isDarkMode={isDarkMode}>
            <div className="space-y-3">
              <InfoItem label="বইয়ের নাম" value={selectedBook.name} isDarkMode={isDarkMode} />
              <InfoItem label="লেখক" value={selectedBook.author} isDarkMode={isDarkMode} />
              <InfoItem label="ধরণ" value={selectedBook.category} isDarkMode={isDarkMode} />
              <InfoItem label="স্ট্যাটাস" value={selectedBook.status} isDarkMode={isDarkMode} />
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-4" />
              <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider">গ্রহীতার তথ্য</h3>
              <InfoItem label="গ্রহীতা" value={selectedBook.recipient} isDarkMode={isDarkMode} />
              <InfoItem label="আইডি নং" value={selectedBook.recipientId} isDarkMode={isDarkMode} />
              <InfoItem label="তারিখ" value={selectedBook.date} isDarkMode={isDarkMode} />
              <InfoItem label="ঠিকানা" value={selectedBook.address} isDarkMode={isDarkMode} />
            </div>
          </OverlayPage>
        )}

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
                  <h2 className="text-2xl font-bold text-emerald-500">পেমেন্ট ইনভয়েস</h2>
                  <p className="text-xs text-slate-400 mt-1">সেবা ফাউন্ডেশন - ডিজিটাল রিসিট</p>
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
                  <div className="text-[10px] text-slate-400 flex justify-between pt-2">
                    <span>ট্রানজ্যাকশন আইডি:</span>
                    <span>TXN{Math.floor(Math.random() * 900000 + 100000)}</span>
                  </div>
                </div>

                <div className="text-center mt-8 pt-4 border-t border-slate-50 text-[10px] text-slate-400">
                  <p>এই রিসিটটি ডিজিটালভাবে তৈরি করা হয়েছে।<br/>© সেবা ফাউন্ডেশন 2020</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2 no-capture">
                <button 
                  onClick={downloadInvoice}
                  className="w-full h-12 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" /> ইমেজ ডাউনলোড করুন
                </button>
                <button 
                  onClick={() => setSelectedPayment(null)}
                  className="w-full h-10 text-slate-400 font-medium"
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
