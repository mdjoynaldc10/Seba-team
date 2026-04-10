import React, { useState, useEffect, useRef, Component, useCallback, useMemo } from 'react';
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
  BadgeCheck,
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
  Bell,
  Database,
  MapPin,
  CheckCircle2,
  Download,
  Calendar,
  Settings,
  Palette,
  Layout,
  ToggleLeft,
  Save,
  Eye,
  EyeOff,
  Lock,
  Key,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Check,
  Unlock,
  MessageSquare,
  ClipboardList,
  UserRoundPen,
  Send,
  Trash2,
  Edit2,
  Megaphone,
  Volume2,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { GoogleGenAI } from "@google/genai";
import { db, auth } from './firebase';
import { doc, setDoc, deleteDoc, onSnapshot, collection, query, where, getDocs, serverTimestamp, getDoc, updateDoc, orderBy } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

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
  isNewSheet?: boolean;
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

interface PostReaction {
  postId: string;
  userId: string;
  userName: string;
  createdAt: any;
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
  returnableDate: string;
  imageUrl?: string;
}

interface BookRequest {
  id: string;
  bookId: string;
  bookName: string;
  bookAuthor: string;
  requesterId: string;
  requesterName: string;
  requesterAddress: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  dueDate?: string;
  approvedBy?: string;
  approvedAt?: string;
}

interface GlobalNotice {
  id: string;
  title: string;
  message: string;
  authorId: string;
  authorName: string;
  createdAt: any;
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
  mobileNumber?: string;
}

interface Notice {
  title: string;
  message: string;
}

interface AdvanceSettings {
  pdfTemplate: string;
  pdfHeaderText: string;
  pdfFooterText: string;
  pdfHeaderColor: string;
  pdfTableHeadBg: string;
  pdfTableHeadText: string;
  pdfFontSize: number;
  pdfLabelMemberName: string;
  pdfLabelMemberId: string;
  pdfLabelArea: string;
  pdfLabelDesignation: string;
  pdfLabelDate: string;
  pdfLabelReason: string;
  pdfLabelAmount: string;
  pdfLabelTotal: string;
  pdfLabelInvoiceTitle: string;
  pdfLabelSubTitle: string;
  pdfBrandText: string;
  pdfBrandFontSize: number;
  pdfBrandColor: string;
  theme: {
    background: string;
    text: string;
    button: string;
    buttonText: string;
  };
  tabNames: {
    home: string;
    books: string;
    members: string;
    blood: string;
    profile: string;
  };
  optionNames: {
    information: string;
    paymentHistory: string;
    borrowedBooks: string;
    findBookshelf: string;
    database: string;
    playTicTacToe: string;
    bloodDonation: string;
    darkMode: string;
    donation: string;
    facebookPage: string;
    facebookGroup: string;
    whatsAppChannel: string;
    logout: string;
  };
  controls: {
    admin: { [key: string]: boolean };
    member: { [key: string]: boolean };
  };
}

// --- Helpers ---
const isVerifiedMember = (member: Member | null) => {
  if (!member) return false;
  return !member.isNewSheet;
};

const isSpecialMember = (member: Member | null) => {
  if (!member) return false;
  return member.access === 'Admin';
};

const isAdmin = (member: Member | null) => {
  if (!member) return false;
  return member.access === 'Admin';
};

const isDeveloper = (member: Member | null) => {
  if (!member) return false;
  return member.designation === 'Developer';
};

interface Notification {
  id: string;
  title: string;
  message: string;
}

interface RealTimeNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'book_request' | 'request_approved' | 'request_rejected' | 'general';
  isRead: boolean;
  createdAt: string;
}

interface AdminDatabaseLink {
  id: string;
  userId: string;
  name: string;
  sheetId: string;
  description: string;
  createdAt: any;
}

interface Bookshelf {
  district: string;
  address: string;
  pinCode: string;
  mapLocation: string;
}

// --- Sheets Logic ---
const HOME_SHEET_ID = '1YBSs5w0E5ujQBhCXkO4wtmVWbeEd66O7LJbaMXZAKEE';
const MEMBER_SHEET_ID = '1pJ5Tg-ihE1TQT4VO9wus52o9Rbm7Iv5ck5XMdjvlino';
const BLOOD_SHEET_ID = '1dFO9EhpwS8yV_O98cFDCQje6jXEjnnT2aJ1zhH6slxs';
const BOOKS_SHEET_ID = '1qevkZUndwH7v6QAwjDj56VDNR9dm1sRHYQU2X51MLig';
const DONATION_SHEET_ID = '1NnAsCeuP7Z1D4HKVqV4HjRPys0TJ2NXrpmmryzCEfvg';
const NEW_MEMBER_SHEET_ID = '1Rk4crZ8HN2DFqWeualTwxjJmtFTs8G_jonYa5lsHodI';
const NEW_PAYMENT_DATA_SHEET_ID = '1TetkWolWcXvl0URf-CeNJdXd9GIAuPNRscTZEYkI834';

const MEMBER_SHEETS = ['Sheet1', 'Sheet2', 'Sheet3', 'Sheet4', 'Sheet5', 'Sheet6', 'Sheet7', 'Sheet8', 'Sheet9', 'Sheet10'];
const REGISTRATION_SHEETS = ['Sheet1', 'Registration', 'Form Responses 1'];
const PAYMENT_SHEETS = ['Sheet11', 'Sheet12', 'Sheet13', 'Sheet14', 'Sheet15', 'Sheet16', 'Sheet17', 'Sheet18', 'Sheet19', 'Sheet20'];
const NEW_PAYMENT_DATA_SHEETS = ['Sheet1', 'Sheet2', 'Sheet3'];
const BLOOD_SHEETS = ["Sheet1", "Sheet2", "Sheet3", "Sheet4", "Sheet5", "Sheet6"];
const BOOKS_SHEETS = ["Sheet1", "Sheet2", "Sheet3", "Sheet4", "Sheet5", "Sheet6", "Sheet7", "Sheet8"];
const PROJECT_SHEETS = ['Sheet1', 'Sheet2'];
const TRANSACTION_SHEETS = ['Sheet3', 'Sheet4', 'Sheet5', 'Sheet6', 'Sheet7', 'Sheet8', 'Sheet9', 'Sheet10'];

async function fetchMemberFromSheet(sheetId: string, sheetName: string, id: string, phone: string, mapping: 'standard' | 'registration'): Promise<Member | null> {
  const idCol = mapping === 'standard' ? 'D' : 'E';
  const phoneCol = mapping === 'standard' ? 'G' : 'F';
  const q = encodeURIComponent(`SELECT * WHERE ${idCol} = '${id}' AND ${phoneCol} CONTAINS '${phone}'`);
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(sheetName)}&tq=${q}`;
  
  try {
    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    if (json.table.rows.length) {
      const r = json.table.rows[0].c;
      if (mapping === 'standard') {
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
          access: String(r[10]?.v || '').trim(),
          isNewSheet: sheetId === NEW_MEMBER_SHEET_ID
        };
      } else {
        // Registration Mapping: A:BG, B:Name, C:Dist, D:City, E:User, F:Phone
        return {
          name: String(r[1]?.v || '').trim(),
          designation: 'Member',
          area: `${r[2]?.v || ''}, ${r[3]?.v || ''}`.trim().replace(/^, |, $/g, ''),
          id: String(r[4]?.v || '').trim(),
          dob: '',
          bloodGroup: String(r[0]?.v || '').trim(),
          phone: String(r[5]?.v || '').trim(),
          email: '',
          joiningDate: new Date().toLocaleDateString(),
          photoId: undefined,
          access: 'User',
          isNewSheet: sheetId === NEW_MEMBER_SHEET_ID
        };
      }
    }
  } catch (e) {}
  return null;
}

async function loginMember(id: string, phone: string): Promise<Member | null> {
  try {
    // 1. Try standard member sheets
    const standardPromises = MEMBER_SHEETS.map(s => fetchMemberFromSheet(MEMBER_SHEET_ID, s, id, phone, 'standard'));
    
    // 2. Try registration sheets (including Sheet1 which is common)
    const regPromises = REGISTRATION_SHEETS.map(s => fetchMemberFromSheet(MEMBER_SHEET_ID, s, id, phone, 'registration'));
    
    // 3. Try the new member sheet (always uses registration mapping)
    const newRegPromises = REGISTRATION_SHEETS.map(s => fetchMemberFromSheet(NEW_MEMBER_SHEET_ID, s, id, phone, 'registration'));

    const results = await Promise.all([...standardPromises, ...regPromises, ...newRegPromises]);
    return results.find(m => m !== null) || null;
  } catch (e) {
    console.error("Error logging in member:", e);
    return null;
  }
}

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
              address: String(c[9]?.v || '').trim(),
              returnableDate: String(c[10]?.v || '').trim()
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

async function fetchBookshelves(): Promise<Bookshelf[]> {
  const SHEETS = ['Sheet9', 'Sheet10'];
  try {
    const fetchPromises = SHEETS.map(name =>
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
              district: String(c[0]?.v || '').trim(),
              address: String(c[1]?.v || '').trim(),
              pinCode: String(c[2]?.v || '').trim(),
              mapLocation: String(c[3]?.v || '').trim()
            };
          }).filter(Boolean);
        })
    );
    const allResults = await Promise.all(fetchPromises);
    return allResults.flat() as Bookshelf[];
  } catch (err) {
    console.error("Error fetching bookshelves:", err);
    return [];
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

    const newPromises = NEW_PAYMENT_DATA_SHEETS.map(async (s) => {
      const q = encodeURIComponent(`SELECT * WHERE A = '${id}'`);
      try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${NEW_PAYMENT_DATA_SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(s)}&tq=${q}`);
        const text = await res.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));
        if (!json.table || !json.table.rows) return [];
        
        const payments: Payment[] = [];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        json.table.rows.forEach((r: any) => {
          const year = r.c[2]?.v || '';
          // Monthly payments (D to O, indices 3 to 14)
          for (let i = 0; i < 12; i++) {
            const amount = r.c[i + 3]?.v;
            if (amount && amount > 0) {
              payments.push({
                amount: Number(amount),
                reason: months[i],
                date: `${year}-${String(i + 1).padStart(2, '0')}-01`
              });
            }
          }
          // Tshirt (P, index 15)
          if (r.c[15]?.v && r.c[15]?.v > 0) {
            payments.push({
              amount: Number(r.c[15]?.v),
              reason: `Tshirt`,
              date: `${year}-01-01`
            });
          }
          // ID Card (Q, index 16)
          if (r.c[16]?.v && r.c[16]?.v > 0) {
            payments.push({
              amount: Number(r.c[16]?.v),
              reason: `ID Card`,
              date: `${year}-01-01`
            });
          }
          // program (R, index 17)
          if (r.c[17]?.v && r.c[17]?.v > 0) {
            payments.push({
              amount: Number(r.c[17]?.v),
              reason: `Program`,
              date: `${year}-01-01`
            });
          }
        });
        return payments;
      } catch (e) {
        return [];
      }
    });

    const results = await Promise.all([...promises, ...newPromises]);
    const allPayments = results.flat();

    // Filter duplicates based on date, reason, and amount to ensure clean history
    const uniquePayments = Array.from(
      new Map(
        allPayments.map((p) => {
          const key = `${p.date}-${p.reason}-${p.amount}`.toLowerCase().trim();
          return [key, p];
        })
      ).values()
    );

    // Sort by date descending
    return uniquePayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
    const allSheets = [
      ...MEMBER_SHEETS.map(s => ({ id: MEMBER_SHEET_ID, name: s })),
      ...REGISTRATION_SHEETS.map(s => ({ id: MEMBER_SHEET_ID, name: s }))
    ];
    
    // Remove duplicate sheet/id pairs
    const uniqueSheets = Array.from(new Set(allSheets.map(s => `${s.id}|${s.name}`)))
      .map(s => {
        const [id, name] = s.split('|');
        return { id, name };
      });

    const fetchPromises = uniqueSheets.map(async (s) => {
      const q = encodeURIComponent(`SELECT * WHERE G CONTAINS '${phone}' OR D = '${phone}' OR E = '${phone}' OR F = '${phone}'`);
      try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${s.id}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(s.name)}&tq=${q}`);
        const text = await res.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));
        if (!json.table || !json.table.rows) return [];
        return json.table.rows.map((row: any) => {
          const d = row.c;
          if (!d) return null;
          
          const name = String(d[1]?.v || '').trim();
          const bloodGroup = String(d[0]?.v || '').trim();
          
          // Skip header rows
          if (name.toLowerCase() === 'name' || name.includes('নাম') || 
              bloodGroup.toLowerCase().includes('blood') || 
              bloodGroup.toLowerCase().includes('রক্তের')) return null;

          // Try to detect mapping by checking column count or specific values
          if (d.length >= 11 && d[3]?.v && d[6]?.v) {
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
          } else if (d.length >= 6 && d[4]?.v && d[5]?.v) {
            return {
              name: String(d[1]?.v || '').trim(),
              designation: 'Member',
              area: `${d[2]?.v || ''}, ${d[3]?.v || ''}`.trim().replace(/^, |, $/g, ''),
              id: String(d[4]?.v || '').trim(),
              dob: '',
              bloodGroup: String(d[0]?.v || '').trim(),
              phone: String(d[5]?.v || '').trim(),
              email: '',
              joiningDate: '',
              photoId: undefined,
              access: 'User'
            };
          }
          return null;
        }).filter(Boolean);
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
    const allSheets = [
      ...MEMBER_SHEETS.map(s => ({ id: MEMBER_SHEET_ID, name: s })),
      ...REGISTRATION_SHEETS.map(s => ({ id: MEMBER_SHEET_ID, name: s }))
    ];
    
    const uniqueSheets = Array.from(new Set(allSheets.map(s => `${s.id}|${s.name}`)))
      .map(s => {
        const [id, name] = s.split('|');
        return { id, name };
      });

    const fetchPromises = uniqueSheets.map(async (s) => {
      try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${s.id}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(s.name)}`);
        const text = await res.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));
        if (!json.table || !json.table.rows) return [];
        return json.table.rows.map((row: any) => {
          const r = row.c;
          if (!r || (!r[0]?.v && !r[1]?.v)) return null;
          
          const name = String(r[1]?.v || '').trim();
          const bloodGroup = String(r[0]?.v || '').trim();

          // Skip header rows
          if (name.toLowerCase() === 'name' || name.includes('নাম') || 
              bloodGroup.toLowerCase().includes('blood') || 
              bloodGroup.toLowerCase().includes('রক্তের')) return null;
          
          if (r.length >= 11 && r[3]?.v) {
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
          } else if (r.length >= 6 && r[4]?.v) {
            return {
              name: String(r[1]?.v || '').trim(),
              designation: 'Member',
              area: `${r[2]?.v || ''}, ${r[3]?.v || ''}`.trim().replace(/^, |, $/g, ''),
              id: String(r[4]?.v || '').trim(),
              dob: '',
              bloodGroup: String(r[0]?.v || '').trim(),
              phone: String(r[5]?.v || '').trim(),
              email: '',
              joiningDate: '',
              photoId: undefined,
              access: 'User'
            };
          }
          return null;
        }).filter(Boolean);
      } catch (e) {
        return [];
      }
    });
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
              method: String(r[4]?.v || '').trim(),
              mobileNumber: String(r[5]?.v || '').trim()
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

// Helper to get donation payments for a user based on phone number
const getDonationPaymentsForUser = (phone: string, transactions: DonationTransaction[]): Payment[] => {
  if (!phone || !transactions.length) return [];
  const normalizedPhone = phone.startsWith('0') ? phone.substring(1) : phone;
  
  return transactions
    .filter(t => {
      if (!t.mobileNumber) return false;
      const tPhone = t.mobileNumber.trim();
      const normalizedTPhone = tPhone.startsWith('0') ? tPhone.substring(1) : tPhone;
      return normalizedTPhone.includes(normalizedPhone) || normalizedPhone.includes(normalizedTPhone);
    })
    .map(t => ({
      amount: t.amount,
      reason: `Donation: ${t.projectName}`,
      date: t.date
    }));
};

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CloudPinSettings {
  pin: string;
  isEnabled: boolean;
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

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

// --- Custom Notification Page ---
const CustomNotificationPage = ({ onClose, isDarkMode, allMembers, onSend }: { 
  onClose: () => void, 
  isDarkMode: boolean, 
  allMembers: Member[],
  onSend: (userId: string, title: string, message: string, type: RealTimeNotification['type']) => Promise<void>
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const filteredMembers = allMembers.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone.includes(searchQuery)
  ).slice(0, 5);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !title || !message) return;

    setIsSending(true);
    setStatus(null);
    try {
      await onSend(selectedMember.id, title, message, 'general');
      setStatus({ type: 'success', text: 'নোটিফিকেশন সফলভাবে পাঠানো হয়েছে!' });
      setTitle('');
      setMessage('');
      setSelectedMember(null);
      setSearchQuery('');
    } catch (error) {
      setStatus({ type: 'error', text: 'পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <OverlayPage title="কাস্টম নোটিফিকেশন" onClose={onClose} isDarkMode={isDarkMode}>
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold opacity-60 ml-1">সদস্য খুঁজুন</label>
            <div className={cn(
              "flex items-center gap-3 px-4 py-1 rounded-xl border",
              isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
            )}>
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="নাম, আইডি বা ফোন নম্বর..." 
                className="flex-1 py-3 bg-transparent outline-none text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {searchQuery && !selectedMember && (
              <div className="mt-2 space-y-2">
                {filteredMembers.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMember(m);
                      setSearchQuery(m.name);
                    }}
                    className={cn(
                      "w-full p-3 rounded-xl border text-left flex items-center gap-3 active:scale-95 transition-all",
                      isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100"
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{m.name}</p>
                      <p className="text-[10px] opacity-50">{m.id} • {m.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedMember && (
            <div className={cn(
              "p-4 rounded-2xl border flex items-center justify-between",
              isDarkMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-600">{selectedMember.name}</p>
                  <p className="text-[10px] opacity-60">নির্বাচিত সদস্য</p>
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} className="text-red-500 p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold opacity-60 ml-1">শিরোনাম</label>
              <input 
                required
                type="text" 
                placeholder="নোটিফিকেশন শিরোনাম"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={cn(
                  "w-full h-12 px-4 rounded-xl border outline-none focus:border-emerald-500 transition-colors",
                  isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                )}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold opacity-60 ml-1">বার্তা</label>
              <textarea 
                required
                placeholder="আপনার বার্তা এখানে লিখুন..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className={cn(
                  "w-full p-4 rounded-xl border outline-none focus:border-emerald-500 transition-colors resize-none",
                  isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                )}
              />
            </div>

            <button 
              type="submit" 
              disabled={isSending || !selectedMember}
              className={cn(
                "w-full h-14 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2",
                (isSending || !selectedMember) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
              পাঠিয়ে দিন
            </button>

            {status && (
              <p className={cn(
                "text-center text-sm font-bold",
                status.type === 'success' ? "text-emerald-500" : "text-red-500"
              )}>
                {status.text}
              </p>
            )}
          </form>
        </div>
      </div>
    </OverlayPage>
  );
};

function CloudPinPage({ 
  currentUser, 
  onClose, 
  isDarkMode 
}: { 
  currentUser: Member, 
  onClose: () => void, 
  isDarkMode: boolean 
}) {
  const [pin, setPin] = useState('');
  const [savedPin, setSavedPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [mode, setMode] = useState<'manage' | 'set' | 'change'>('manage');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [resetRequests, setResetRequests] = useState<any[]>([]);
  const [isRequestsLoading, setIsRequestsLoading] = useState(false);

  useEffect(() => {
    if (isAdmin(currentUser) || isDeveloper(currentUser)) {
      setIsRequestsLoading(true);
      const q = query(collection(db, 'pin_reset_requests'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setResetRequests(reqs);
        setIsRequestsLoading(false);
      }, (err) => {
        console.error("Error fetching reset requests:", err);
        setIsRequestsLoading(false);
      });
      return () => unsub();
    }
  }, [currentUser]);

  const handleApproveRequest = async (request: any) => {
    try {
      // 1. Disable PIN
      await setDoc(doc(db, 'cloud_pins', request.memberId), {
        isEnabled: false
      }, { merge: true });
      
      // 2. Update request status
      await updateDoc(doc(db, 'pin_reset_requests', request.id), {
        status: 'approved',
        updatedAt: serverTimestamp()
      });
      
      alert("অনুরোধটি অনুমোদিত হয়েছে।");
    } catch (e) {
      console.error("Error approving request:", e);
      alert("অনুমোদন করতে সমস্যা হয়েছে।");
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'pin_reset_requests', requestId), {
        status: 'declined',
        updatedAt: serverTimestamp()
      });
      alert("অনুরোধটি বাতিল করা হয়েছে।");
    } catch (e) {
      console.error("Error declining request:", e);
      alert("বাতিল করতে সমস্যা হয়েছে।");
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'cloud_pins', currentUser.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as CloudPinSettings;
          setPin(data.pin);
          setSavedPin(data.pin);
          setIsEnabled(data.isEnabled);
        }
      } catch (e) {
        console.error("Error fetching PIN settings:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [currentUser.id]);

  const handleSave = async () => {
    if (pin.length < 4) {
      alert("পিন কমপক্ষে ৪ সংখ্যার হতে হবে!");
      return;
    }
    if (mode === 'set' || mode === 'change' || mode === 'reset') {
      if (pin !== confirmPin) {
        alert("পিন মেলেনি!");
        return;
      }
    }

    setIsSaving(true);
    try {
      await setDoc(doc(db, 'cloud_pins', currentUser.id), {
        pin,
        isEnabled
      });
      alert("পিন সফলভাবে সংরক্ষিত হয়েছে!");
      setSavedPin(pin);
      setMode('manage');
      setConfirmPin('');
      setIsVerified(false);
      setCurrentPinInput('');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `cloud_pins/${currentUser.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (newVal: boolean) => {
    if (!pin && newVal) {
      setMode('set');
      return;
    }
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'cloud_pins', currentUser.id), {
        pin,
        isEnabled: newVal
      }, { merge: true });
      setIsEnabled(newVal);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `cloud_pins/${currentUser.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (mode !== 'manage') {
      setMode('manage');
      setIsVerified(false);
      setCurrentPinInput('');
      setPin(savedPin);
      setConfirmPin('');
    } else {
      onClose();
    }
  };

  if (isLoading) return (
    <OverlayPage title="Cloud PIN" onClose={handleBack} isDarkMode={isDarkMode}>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    </OverlayPage>
  );

  return (
    <OverlayPage title="Cloud PIN" onClose={handleBack} isDarkMode={isDarkMode}>
      <div className="space-y-6">
        {mode === 'manage' && (
          <div className="space-y-4">
            <div className={cn(
              "p-6 rounded-3xl border-2 flex flex-col items-center text-center space-y-4",
              isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
            )}>
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                isEnabled ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
              )}>
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Cloud PIN Security</h3>
                <p className="text-sm opacity-60">যেকোনো ডিভাইসে লগইন করার সময় পিন কোড দিয়ে সুরক্ষা নিশ্চিত করুন।</p>
              </div>
              
              <div className="flex items-center justify-between w-full p-4 bg-slate-500/5 rounded-2xl border border-slate-500/10">
                <span className="font-bold">Status: {isEnabled ? 'ON' : 'OFF'}</span>
                <button 
                  onClick={() => handleToggle(!isEnabled)}
                  disabled={isSaving}
                  className={cn(
                    "w-12 h-6 rounded-full relative transition-all",
                    isEnabled ? "bg-emerald-500" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    isEnabled ? "right-1" : "left-1"
                  )} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => {
                  if (savedPin) {
                    setMode('change');
                    setIsVerified(false);
                    setPin('');
                    setConfirmPin('');
                  } else {
                    setMode('set');
                    setPin('');
                    setConfirmPin('');
                  }
                }}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl border-2 font-bold transition-all active:scale-95",
                  isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                )}
              >
                <Key className="w-5 h-5 text-emerald-500" />
                {savedPin ? 'পিন পরিবর্তন করুন' : 'পিন সেট করুন'}
              </button>
            </div>
          </div>
        )}

        {(mode === 'set' || mode === 'change') && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-4">
                {mode === 'change' && !isVerified ? (
                  <div className="space-y-4">
                    <div className="text-center space-y-2 mb-4">
                      <h3 className="text-lg font-bold">বর্তমান পিন যাচাই করুন</h3>
                      <p className="text-xs opacity-60">পরিবর্তন করতে আপনার বর্তমান পিন কোডটি দিন।</p>
                    </div>
                    <div className="space-y-3">
                      <div className="relative">
                        <input 
                          type={showCurrentPin ? "text" : "password"} 
                          placeholder="বর্তমান পিন" 
                          value={currentPinInput}
                          onChange={(e) => setCurrentPinInput(e.target.value)}
                          className={cn("w-full p-4 rounded-2xl border outline-none pr-12", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                        />
                        <button 
                          onClick={() => setShowCurrentPin(!showCurrentPin)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showCurrentPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <button 
                        onClick={() => {
                          if (currentPinInput === savedPin) {
                            setIsVerified(true);
                            setPin('');
                            setConfirmPin('');
                          } else {
                            alert("ভুল পিন! আবার চেষ্টা করুন।");
                          }
                        }}
                        className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95"
                      >
                        যাচাই করুন
                      </button>
                      <button onClick={() => setMode('manage')} className="w-full text-center text-slate-500 font-bold text-sm">বাতিল করুন</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center space-y-2 mb-4">
                      <h3 className="text-lg font-bold">{mode === 'set' ? 'নতুন পিন সেট করুন' : mode === 'change' ? 'নতুন পিন দিন' : 'নতুন পিন দিন'}</h3>
                      <p className="text-xs opacity-60">কমপক্ষে ৪ সংখ্যার পিন কোড দিন।</p>
                    </div>
                    <div className="space-y-3">
                      <div className="relative">
                        <input 
                          type={showPin ? "text" : "password"} 
                          placeholder="নতুন পিন" 
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          className={cn("w-full p-4 rounded-2xl border outline-none pr-12", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                        />
                        <button 
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <input 
                        type={showPin ? "text" : "password"} 
                        placeholder="পিন নিশ্চিত করুন" 
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        className={cn("w-full p-4 rounded-2xl border outline-none", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      />
                      <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                        সংরক্ষণ করুন
                      </button>
                      <button onClick={() => setMode('manage')} className="w-full text-center text-slate-500 font-bold text-sm">বাতিল করুন</button>
                    </div>
                  </div>
                )}
              </div>
          </div>
        )}

        {(isAdmin(currentUser) || isDeveloper(currentUser)) && mode === 'manage' && (
          <div className="space-y-4 pt-4 border-t border-slate-500/10">
            <div className="flex items-center gap-2 px-1">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold">PIN Reset Requests</h3>
              {resetRequests.length > 0 && (
                <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                  {resetRequests.length}
                </span>
              )}
            </div>
            
            {isRequestsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : resetRequests.length === 0 ? (
              <div className="text-center py-8 opacity-50 text-sm">
                কোনো অনুরোধ পেন্ডিং নেই
              </div>
            ) : (
              <div className="space-y-3">
                {resetRequests.map((req) => (
                  <motion.div 
                    key={req.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "p-4 rounded-2xl border-2 space-y-3",
                      isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm">{req.memberName}</h4>
                        <p className="text-xs opacity-60">{req.memberId}</p>
                        <p className="text-[10px] opacity-40 mt-1">
                          {req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApproveRequest(req)}
                          className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 active:scale-90 transition-all"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeclineRequest(req.id)}
                          className="p-2 bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20 active:scale-90 transition-all"
                          title="Decline"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-4 text-[10px] opacity-60">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {req.phone}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {req.email}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </OverlayPage>
  );
}

function PinEntryModal({ 
  onSuccess, 
  onCancel, 
  isDarkMode, 
  targetPin,
  pendingMember
}: { 
  onSuccess: () => void, 
  onCancel: () => void, 
  isDarkMode: boolean, 
  targetPin: string,
  pendingMember: Member
}) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [showReset, setShowReset] = useState(false);
  
  // Reset fields
  const [resetId, setResetId] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetExtra, setResetExtra] = useState(''); // Email or DOB
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'pending' | 'approved' | 'declined'>('idle');
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (requestId) {
      const unsub = onSnapshot(doc(db, 'pin_reset_requests', requestId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.status === 'approved') {
            setRequestStatus('approved');
            setTimeout(() => {
              onSuccess();
            }, 2000); // Wait for animation
          } else if (data.status === 'declined') {
            setRequestStatus('declined');
            setResetError("আপনার অনুরোধটি বাতিল করা হয়েছে।");
            setIsResetting(false);
          }
        }
      });
      return () => unsub();
    }
  }, [requestId, onSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === targetPin) {
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
      setInput('');
    }
  };

  const handleReset = async () => {
    const normalizedPhone = pendingMember.phone.startsWith('0') ? pendingMember.phone.substring(1) : pendingMember.phone;
    const inputPhone = resetPhone.startsWith('0') ? resetPhone.substring(1) : resetPhone;

    const isIdMatch = resetId.trim() === pendingMember.id.trim();
    const isPhoneMatch = inputPhone.trim() === normalizedPhone.trim();
    const isExtraMatch = resetExtra.trim() === pendingMember.email.trim() || resetExtra.trim() === pendingMember.dob.trim();

    if (isIdMatch && isPhoneMatch && isExtraMatch) {
      setIsResetting(true);
      try {
        const newRequestId = `${pendingMember.id}_${Date.now()}`;
        await setDoc(doc(db, 'pin_reset_requests', newRequestId), {
          memberId: pendingMember.id,
          memberName: pendingMember.name,
          phone: pendingMember.phone,
          email: pendingMember.email,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setRequestId(newRequestId);
        setRequestStatus('pending');
      } catch (e) {
        console.error("Error creating reset request:", e);
        setResetError("অনুরোধ পাঠাতে সমস্যা হয়েছে।");
        setIsResetting(false);
      }
    } else {
      setResetError("তথ্য মেলেনি! অনুগ্রহ করে সঠিক তথ্য দিন।");
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={cn(
          "relative w-full max-w-sm p-8 rounded-[40px] shadow-2xl z-10",
          isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"
        )}
      >
        {!showReset ? (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <Lock className="w-10 h-10 text-emerald-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Cloud PIN দিন</h3>
              <p className="text-sm opacity-60">আপনার অ্যাকাউন্টের সুরক্ষা নিশ্চিত করতে পিন কোডটি দিন।</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <input 
                autoFocus
                type="password" 
                inputMode="numeric"
                placeholder="••••"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className={cn(
                  "w-full h-16 text-center text-3xl tracking-[1em] rounded-3xl border-2 outline-none transition-all",
                  isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100",
                  error ? "border-red-500 animate-shake" : "focus:border-emerald-500"
                )}
              />
              {error && <p className="text-red-500 text-xs font-bold">ভুল পিন! আবার চেষ্টা করুন।</p>}
              
              <button 
                type="submit"
                className="w-full h-14 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                প্রবেশ করুন
              </button>
              <div className="flex flex-col gap-2">
                <button 
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="text-emerald-500 font-bold text-sm"
                >
                  পিন ভুলে গেছেন?
                </button>
                <button 
                  type="button"
                  onClick={onCancel}
                  className="text-slate-500 font-bold text-sm"
                >
                  বাতিল করুন
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center">
              <RefreshCw className="w-10 h-10 text-orange-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">পিন রিসেট করুন</h3>
              <p className="text-sm opacity-60">আপনার তথ্য যাচাই করে পিন রিসেট করুন।</p>
            </div>

            <div className="w-full space-y-3">
              {requestStatus === 'pending' ? (
                <div className="flex flex-col items-center space-y-6 py-4">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldCheck className="w-10 h-10 text-emerald-500 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-emerald-500">অনুরোধ পাঠানো হয়েছে</h4>
                    <p className="text-sm opacity-60">অনুগ্রহ করে অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করুন।</p>
                  </div>
                  <button 
                    onClick={() => {
                      setRequestStatus('idle');
                      setRequestId(null);
                      setIsResetting(false);
                    }}
                    className="text-slate-500 font-bold text-sm"
                  >
                    অনুরোধ বাতিল করুন
                  </button>
                </div>
              ) : requestStatus === 'approved' ? (
                <div className="flex flex-col items-center space-y-6 py-4 animate-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50">
                    <Unlock className="w-12 h-12 text-white animate-bounce" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-emerald-500">অনুমোদিত হয়েছে!</h4>
                    <p className="text-sm opacity-60">অ্যাকাউন্ট আনলক হচ্ছে...</p>
                  </div>
                </div>
              ) : (
                <>
                  <input 
                    type="text" 
                    placeholder="আইডি (SF-XXXX)" 
                    value={resetId}
                    onChange={(e) => setResetId(e.target.value)}
                    className={cn("w-full p-4 rounded-2xl border outline-none", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200")}
                  />
                  <input 
                    type="tel" 
                    placeholder="ফোন নাম্বার" 
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    className={cn("w-full p-4 rounded-2xl border outline-none", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200")}
                  />
                  <input 
                    type="text" 
                    placeholder="জিমেইল অথবা জন্মতারিখ" 
                    value={resetExtra}
                    onChange={(e) => setResetExtra(e.target.value)}
                    className={cn("w-full p-4 rounded-2xl border outline-none", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200")}
                  />
                  {resetError && <p className="text-red-500 text-xs font-bold">{resetError}</p>}
                  
                  <button 
                    onClick={handleReset}
                    disabled={isResetting}
                    className="w-full h-14 bg-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isResetting && <Loader2 className="w-5 h-5 animate-spin" />}
                    যাচাই করুন
                  </button>
                  <button 
                    onClick={() => setShowReset(false)}
                    className="text-slate-500 font-bold text-sm"
                  >
                    পিছনে যান
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

class ErrorBoundary extends Component<any, any> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) {
          errorMessage = `Firestore Error: ${parsed.error} during ${parsed.operationType} on ${parsed.path}`;
        }
      } catch (e) {
        errorMessage = this.state.error.message || String(this.state.error);
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-slate-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">দুঃখিত, একটি সমস্যা হয়েছে</h1>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              {errorMessage}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// --- Components ---
const LandscapeBlocker = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div className={clsx(
    "landscape-warning fixed inset-0 z-[99999] flex-col items-center justify-center p-6 text-center",
    isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"
  )}>
    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
      <Smartphone className="w-10 h-10 text-emerald-500 rotate-[-90deg]" />
    </div>
    <h2 className="text-2xl font-bold mb-3">অনুগ্রহ করে ফোনটি সোজা করুন</h2>
    <p className="text-slate-500 max-w-xs mx-auto">
      এই অ্যাপটি শুধুমাত্র পোর্ট্রেট মোডে ব্যবহারের জন্য ডিজাইন করা হয়েছে। ভালো অভিজ্ঞতার জন্য ফোনটি সোজা করে ধরুন।
    </p>
    <div className="mt-8 flex items-center gap-2 text-emerald-500 font-medium">
      <RotateCcw className="w-5 h-5 animate-spin-slow" />
      <span>অটো-রোটেশন বন্ধ করুন</span>
    </div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function BookshelfPage({ 
  onClose, 
  isDarkMode, 
  bookshelves 
}: { 
  onClose: () => void, 
  isDarkMode: boolean, 
  bookshelves: Bookshelf[] 
}) {
  return (
    <OverlayPage title="Find Bookshelf" onClose={onClose} isDarkMode={isDarkMode}>
      <div className="space-y-4">
        {bookshelves.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 opacity-50">
            <MapPin className="w-12 h-12 mb-2" />
            <p>কোনো বুকশেলফ পাওয়া যায়নি</p>
          </div>
        ) : (
          bookshelves.map((shelf, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "p-5 rounded-2xl border-2 transition-all",
                "bg-[#FFFFFF00] border-emerald-500/50 hover:border-emerald-500"
              )}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h3 className="font-bold text-emerald-500 text-lg">{shelf.district}</h3>
                  </div>
                  <p className="text-emerald-600/80 text-sm mb-1 leading-relaxed">
                    <span className="font-bold">Address:</span> {shelf.address}
                  </p>
                  <p className="text-emerald-600/80 text-sm">
                    <span className="font-bold">PIN Code:</span> {shelf.pinCode}
                  </p>
                </div>
                <a 
                  href={shelf.mapLocation} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  Go
                </a>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </OverlayPage>
  );
}

const getGreeting = (greetingsData: any) => {
  const hour = new Date().getHours();
  
  const to24h = (h: number, period: string) => {
    let hour24 = Number(h);
    if (period === 'PM' && hour24 < 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    return hour24;
  };

  const checkTime = (timeData: any) => {
    if (!timeData) return false;
    const start = to24h(timeData.startHour, timeData.startPeriod);
    const end = to24h(timeData.endHour, timeData.endPeriod);
    
    if (start < end) {
      return hour >= start && hour < end;
    } else {
      // Handles ranges spanning midnight (e.g., 10 PM to 5 AM)
      return hour >= start || hour < end;
    }
  };

  if (checkTime(greetingsData.morning)) return greetingsData.morning;
  if (checkTime(greetingsData.afternoon)) return greetingsData.afternoon;
  if (checkTime(greetingsData.evening)) return greetingsData.evening;
  if (checkTime(greetingsData.night)) return greetingsData.night;
  return greetingsData.lateNight;
};

const PushNotificationToast = ({ notification, onClose, isDarkMode }: { notification: RealTimeNotification, onClose: () => void, isDarkMode: boolean }) => {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-4 left-4 right-4 z-[9999] flex justify-center pointer-events-none"
    >
      <div 
        onClick={onClose}
        className={cn(
          "max-w-md w-full p-4 rounded-2xl shadow-2xl border flex items-start gap-4 pointer-events-auto cursor-pointer active:scale-95 transition-transform",
          "bg-slate-900 border-slate-800 text-white"
        )}
      >
        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
          <Bell className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm truncate text-white">{notification.title}</h4>
          <p className="text-xs text-white/70 line-clamp-2">{notification.message}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 text-white/50 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

const SplashScreen = React.memo(({ greetingsData }: { greetingsData: any }) => {
  const greeting = getGreeting(greetingsData);
  const [showLoadingBar, setShowLoadingBar] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingBar(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-emerald-500 flex flex-col items-center justify-center text-white p-6"
    >
      <AnimatePresence mode="wait">
        <motion.div 
          key={greeting?.main || 'loading'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-4"
        >
          <div className="bg-white/20 p-6 rounded-full inline-block mb-4 backdrop-blur-sm">
            <Heart className="w-12 h-12 text-white fill-white animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">{greeting?.main}</h1>
            <p className="text-lg opacity-90 font-medium">{greeting?.sub}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showLoadingBar && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute bottom-12 left-0 right-0 px-12 space-y-3"
          >
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-80">
              <span>Loading...</span>
              <span>Please Wait</span>
            </div>
            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "linear" }}
                className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

function AppContent() {
  const [activeTab, setActiveTab] = useState<'home' | 'books' | 'members' | 'blood' | 'profile'>('home');

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('seba_dark_mode') === 'true');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [bloodDonationEnabled, setBloodDonationEnabled] = useState<boolean>(false);
  const [isTogglingBlood, setIsTogglingBlood] = useState(false);
  const [publicDonors, setPublicDonors] = useState<Donor[]>([]);
  const [paymentData, setPaymentData] = useState<Payment[]>([]);
  const [donorData, setDonorData] = useState<Donor[]>([]);
  const [homePosts, setHomePosts] = useState<HomePost[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [bookRequests, setBookRequests] = useState<BookRequest[]>([]);
  const [donationProjects, setDonationProjects] = useState<DonationProject[]>([]);
  const [donationTransactions, setDonationTransactions] = useState<DonationTransaction[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppInitializing, setIsAppInitializing] = useState(true);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('portrait');
        }
      } catch (error) {
        // Many browsers require fullscreen for orientation lock, or don't support it.
        // We'll just log it silently as it's a best-effort feature for web apps.
        console.warn('Orientation lock not supported or failed:', error);
      }
    };

    lockOrientation();
    
    // Fallback: listen for orientation change and try to lock again
    const handleOrientationChange = () => {
      lockOrientation();
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('popstate', handleOrientationChange);
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('popstate', handleOrientationChange);
    };
  }, []);

  const [showBookRequestPage, setShowBookRequestPage] = useState(false);
  const [selectedBookRequest, setSelectedBookRequest] = useState<BookRequest | null>(null);
  const [activeBorrowedTab, setActiveBorrowedTab] = useState<'my-books' | 'requests' | 'history'>('my-books');
  const [dueDate, setDueDate] = useState('');
  const [greetingsData, setGreetingsData] = useState(() => {
    const defaults = {
      morning: { main: "শুভ সকাল", sub: "আপনার দিনটি শুভ হোক!", startHour: 5, startPeriod: "AM", endHour: 12, endPeriod: "PM" },
      afternoon: { main: "শুভ অপরাহ্ন", sub: "আপনার দুপুরটি ভালো কাটুক!", startHour: 12, startPeriod: "PM", endHour: 4, endPeriod: "PM" },
      evening: { main: "শুভ বিকেল", sub: "আপনার বিকেলটি আনন্দময় হোক!", startHour: 4, startPeriod: "PM", endHour: 6, endPeriod: "PM" },
      night: { main: "শুভ সন্ধ্যা", sub: "আপনার সন্ধ্যাটি শান্তিময় হোক!", startHour: 6, startPeriod: "PM", endHour: 10, endPeriod: "PM" },
      lateNight: { main: "শুভ রাত্রি", sub: "আপনার রাতটি সুখের হোক!", startHour: 10, startPeriod: "PM", endHour: 5, endPeriod: "AM" }
    };

    const saved = localStorage.getItem('seba_greetings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all properties exist
        return {
          morning: { ...defaults.morning, ...parsed.morning },
          afternoon: { ...defaults.afternoon, ...parsed.afternoon },
          evening: { ...defaults.evening, ...parsed.evening },
          night: { ...defaults.night, ...parsed.night },
          lateNight: { ...defaults.lateNight, ...parsed.lateNight }
        };
      } catch (e) {
        console.error("Error parsing saved greetings:", e);
      }
    }
    return defaults;
  });
  
  // Overlays
  const [showInfoPage, setShowInfoPage] = useState(false);
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [showBorrowedBooksPage, setShowBorrowedBooksPage] = useState(false);
  const [showDonationProjectsPage, setShowDonationProjectsPage] = useState(false);
  const [selectedDonationProject, setSelectedDonationProject] = useState<DonationProject | null>(null);
  const [showDonatePopup, setShowDonatePopup] = useState(false);
  const [isNumberCopied, setIsNumberCopied] = useState(false);
  const [showTicTacToe, setShowTicTacToe] = useState(false);
  const [showDatabasePage, setShowDatabasePage] = useState(false);
  const [adminDatabaseLinks, setAdminDatabaseLinks] = useState<AdminDatabaseLink[]>([]);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [editingLink, setEditingLink] = useState<AdminDatabaseLink | null>(null);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkSheetId, setNewLinkSheetId] = useState('');
  const [newLinkDesc, setNewLinkDesc] = useState('');
  const [showBookshelfPage, setShowBookshelfPage] = useState(false);
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<Member | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'info' | 'payments' | 'books' | 'database'>('info');
  const [activeBookDetailTab, setActiveBookDetailTab] = useState<'details' | 'borrowers'>('details');
  const [memberProfilePayments, setMemberProfilePayments] = useState<Payment[]>([]);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  
  // Combine member payment history with donation transactions based on phone number
  const allPayments = useMemo(() => {
    if (!currentUser) return paymentData;
    const donationPayments = getDonationPaymentsForUser(currentUser.phone || '', donationTransactions);
    const combined = [...paymentData, ...donationPayments];
    return combined.sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      return dateB - dateA;
    });
  }, [paymentData, donationTransactions, currentUser]);

  const allMemberProfilePayments = useMemo(() => {
    if (!selectedMemberProfile) return memberProfilePayments;
    const donationPayments = getDonationPaymentsForUser(selectedMemberProfile.phone || '', donationTransactions);
    const combined = [...memberProfilePayments, ...donationPayments];
    return combined.sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      return dateB - dateA;
    });
  }, [memberProfilePayments, donationTransactions, selectedMemberProfile]);
  
  // Post Reactions State
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [showLoginError, setShowLoginError] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showNotice, setShowNotice] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [realTimeNotifications, setRealTimeNotifications] = useState<RealTimeNotification[]>([]);
  const [activePushNotification, setActivePushNotification] = useState<RealTimeNotification | null>(null);
  const [showNotificationsPage, setShowNotificationsPage] = useState(false);
  const [showCustomNotificationPage, setShowCustomNotificationPage] = useState(false);
  const [longPressedItem, setLongPressedItem] = useState<{ type: 'notification' | 'member' | 'request', data: any } | null>(null);
  const longPressTimer = useRef<any>(null);

  const handleLongPressStart = (type: 'notification' | 'member' | 'request', data: any) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setLongPressedItem({ type, data });
    }, 600);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDeleteItem = async () => {
    if (!longPressedItem) return;

    const { type, data } = longPressedItem;

    try {
      if (type === 'notification') {
        if (data.isRealTime) {
          await deleteDoc(doc(db, 'notifications', data.id));
          setRealTimeNotifications(prev => prev.filter(n => n.id !== data.id));
        } else {
          setNotifications(prev => prev.filter(n => n.id !== data.id || n.message !== data.message));
        }
      } else if (type === 'request') {
        if (data.isLink) {
          await deleteDoc(doc(db, 'admin_database_links', data.id));
        } else {
          await deleteDoc(doc(db, 'bookRequests', data.id));
          setBookRequests(prev => prev.filter(r => r.id !== data.id));
        }
      } else if (type === 'member') {
        // Deleting from sheet is not supported, so we just hide it locally
        setAllMembers(prev => prev.filter(m => m.id !== data.id));
        setFoundMembers(prev => prev.filter(m => m.id !== data.id));
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
    setLongPressedItem(null);
  };

  const [showAdvanceSettings, setShowAdvanceSettings] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showGreetingsSettings, setShowGreetingsSettings] = useState(false);
  const [globalNotices, setGlobalNotices] = useState<GlobalNotice[]>([]);
  const [showGlobalNoticeManager, setShowGlobalNoticeManager] = useState(false);
  const [activeGlobalNotice, setActiveGlobalNotice] = useState<GlobalNotice | null>(null);
  const [activeGlobalNoticeTab, setActiveGlobalNoticeTab] = useState<'write' | 'history'>('write');
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeMessage, setNewNoticeMessage] = useState('');
  const [isSavingNotice, setIsSavingNotice] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [donationFilterStartDate, setDonationFilterStartDate] = useState('');
  const [donationFilterEndDate, setDonationFilterEndDate] = useState('');
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [showCloudPinPage, setShowCloudPinPage] = useState(false);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pendingLoginMember, setPendingLoginMember] = useState<Member | null>(null);
  const [cloudPinSettings, setCloudPinSettings] = useState<CloudPinSettings | null>(null);

  useEffect(() => {
    if (currentUser && isAdmin(currentUser) && isAuthReady) {
      const q = query(
        collection(db, 'admin_database_links'),
        where('userId', '==', currentUser.id)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const links = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminDatabaseLink));
        // Sort manually since we removed orderBy to avoid index requirement for now
        links.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
        setAdminDatabaseLinks(links);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'admin_database_links');
      });
      return () => unsubscribe();
    } else {
      setAdminDatabaseLinks([]);
    }
  }, [currentUser, isAuthReady]);

  const [advanceSettings, setAdvanceSettings] = useState<AdvanceSettings>({
    pdfTemplate: 'default',
    pdfHeaderText: 'পেমেন্ট হিস্টোরি',
    pdfFooterText: 'এই রিপোর্টটি সেবা অ্যাপ থেকে স্বয়ংক্রিয়ভাবে তৈরি করা হয়েছে।',
    pdfHeaderColor: '#10b981',
    pdfTableHeadBg: '#10b981',
    pdfTableHeadText: '#ffffff',
    pdfFontSize: 14,
    pdfLabelMemberName: 'সদস্যের নাম',
    pdfLabelMemberId: 'আইডি নং',
    pdfLabelArea: 'এলাকা',
    pdfLabelDesignation: 'পদবী',
    pdfLabelDate: 'তারিখ',
    pdfLabelReason: 'বিবরণ',
    pdfLabelAmount: 'পরিমাণ',
    pdfLabelTotal: 'মোট পরিশোধিত',
    pdfLabelInvoiceTitle: 'পেমেন্ট ইনভয়েস',
    pdfLabelSubTitle: 'Seba Member Payment Record',
    pdfBrandText: 'SEBA',
    pdfBrandFontSize: 18,
    pdfBrandColor: '#10b981',
    theme: {
      background: '#f8fafc',
      text: '#1e293b',
      button: '#10b981',
      buttonText: '#ffffff'
    },
    tabNames: {
      home: 'Home',
      books: 'Books',
      members: 'Members',
      blood: 'Blood',
      profile: 'Profile'
    },
    optionNames: {
      information: 'Information',
      paymentHistory: 'Payment History',
      borrowedBooks: 'Borrowed Books',
      findBookshelf: 'Find Bookshelf',
      database: 'Database',
      playTicTacToe: 'Play TicTacToe',
      bloodDonation: 'Blood Donation',
      darkMode: 'Dark Mode',
      donation: 'Donation',
      facebookPage: 'Facebook Page',
      facebookGroup: 'Facebook Group',
      whatsAppChannel: 'WhatsApp Channel',
      logout: 'Logout'
    },
    controls: {
      admin: { 
        database: true, 
        tictactoe: true, 
        donation: true, 
        bloodDonation: true,
        borrowedBooks: true,
        findBookshelf: true
      },
      member: { 
        database: false, 
        tictactoe: true, 
        donation: true, 
        bloodDonation: true,
        borrowedBooks: true,
        findBookshelf: true
      }
    }
  });
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

  const closeAllOverlays = useCallback(() => {
    setShowInfoPage(false);
    setShowPaymentPage(false);
    setShowBorrowedBooksPage(false);
    setShowDonationProjectsPage(false);
    setShowTicTacToe(false);
    setShowDatabasePage(false);
    setShowBookshelfPage(false);
    setSelectedMemberProfile(null);
    setSelectedBook(null);
    setSelectedPayment(null);
    setShowNotificationsPage(false);
    setSelectedNotification(null);
    setShowDonatePopup(false);
    setShowLoginError(false);
    setShowBorrowForm(false);
    setShowNotice(false);
    setShowGlobalNoticeManager(false);
    setActiveBookDetailTab('details');
  }, []);

  useEffect(() => {
    closeAllOverlays();
  }, [activeTab, closeAllOverlays]);

  const isAnyOverlayOpen = showInfoPage || showPaymentPage || showBorrowedBooksPage || 
    showDonationProjectsPage || showTicTacToe || showDatabasePage || showBookshelfPage || 
    selectedMemberProfile !== null || selectedBook !== null || selectedPayment !== null || 
    showNotificationsPage || selectedNotification !== null || showDonatePopup || 
    showBorrowForm || showNotice || showGlobalNoticeManager;

  useEffect(() => {
    if (isAnyOverlayOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isAnyOverlayOpen]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every 1 second
    return () => clearInterval(timer);
  }, []);

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

  const sendOneSignalNotification = async (userId: string, title: string, message: string) => {
    const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
    const apiKey = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) {
      console.warn("OneSignal App ID or API Key missing. Skipping push notification.");
      return;
    }

    try {
      await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": `Basic ${apiKey}`
        },
        body: JSON.stringify({
          app_id: appId,
          include_external_user_ids: [userId],
          headings: { en: title },
          contents: { en: message },
          android_channel_id: "push-notification-channel-id" // Optional: customize channel
        })
      });
    } catch (error) {
      console.error("Error sending OneSignal notification:", error);
    }
  };

  const sendRealTimeNotification = async (userId: string, title: string, message: string, type: RealTimeNotification['type']) => {
    const id = `${userId}_${Date.now()}`;
    const notification: RealTimeNotification = {
      id,
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'notifications', id), notification);
      // Also send via OneSignal
      await sendOneSignalNotification(userId, title, message);
    } catch (error) {
      console.error("Error sending real-time notification:", error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleBorrowRequest = async () => {
    if (!selectedBook || !currentUser) return;

    // Check if user already has this book or a pending request
    const existingRequest = bookRequests.find(r => 
      r.bookId === selectedBook.id && 
      r.requesterId === currentUser.id && 
      (r.status === 'pending' || r.status === 'approved')
    );

    if (existingRequest) {
      alert('আপনি ইতিমধ্যে এই বইটি সংগ্রহের জন্য অনুরোধ করেছেন বা বইটি আপনার কাছে রয়েছে।');
      return;
    }
    
    const requestId = `${currentUser.id}_${selectedBook.id}_${Date.now()}`;
    const requestData: BookRequest = {
      id: requestId,
      bookId: selectedBook.id,
      bookName: selectedBook.name,
      bookAuthor: selectedBook.author,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterAddress: borrowFormData.address,
      requestDate: new Date().toISOString(),
      status: 'pending'
    };

    try {
      await setDoc(doc(db, 'bookRequests', requestId), requestData);
      
      // Notify Admins
      const admins = allMembers.filter(m => m.access === 'Admin' || m.designation === 'Developer');
      for (const admin of admins) {
        await sendRealTimeNotification(
          admin.id,
          'নতুন বইয়ের অনুরোধ',
          `${currentUser.name} '${selectedBook.name}' বইটি সংগ্রহের জন্য অনুরোধ করেছেন।`,
          'book_request'
        );
      }

      setIsRequestSent(true);
      
      setTimeout(() => {
        setShowBorrowForm(false);
        setIsRequestSent(false);
      }, 1500);
    } catch (error) {
      console.error("Error sending borrow request:", error);
      alert('অনুরোধ পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  const approveBookRequest = async (request: BookRequest, dueDate: string) => {
    if (!currentUser || (!isAdmin(currentUser) && !isDeveloper(currentUser))) return;
    if (!dueDate) {
      alert('অনুগ্রহ করে ফেরত দেওয়ার তারিখ নির্ধারণ করুন।');
      return;
    }

    try {
      await updateDoc(doc(db, 'bookRequests', request.id), {
        status: 'approved',
        dueDate: dueDate,
        approvedBy: currentUser.name,
        approvedAt: new Date().toISOString()
      });
      
      // Notify Member
      await sendRealTimeNotification(
        request.requesterId,
        'অনুরোধ গ্রহণ করা হয়েছে',
        `আপনার '${request.bookName}' বইটি সংগ্রহের অনুরোধ গ্রহণ করা হয়েছে। ফেরত দেওয়ার তারিখ: ${formatDate(dueDate)}`,
        'request_approved'
      );
      
      alert('অনুরোধ সফলভাবে গ্রহণ করা হয়েছে।');
      window.history.back();
    } catch (error) {
      console.error("Error approving request:", error);
      alert('অনুরোধ গ্রহণ করতে সমস্যা হয়েছে।');
    }
  };

  const rejectBookRequest = async (requestId: string) => {
    if (!currentUser || (!isAdmin(currentUser) && !isDeveloper(currentUser))) return;
    
    const request = bookRequests.find(r => r.id === requestId);
    if (!request) return;

    try {
      await deleteDoc(doc(db, 'bookRequests', requestId));
      
      // Notify Member
      await sendRealTimeNotification(
        request.requesterId,
        'অনুরোধ বাতিল করা হয়েছে',
        `দুঃখিত, আপনার '${request.bookName}' বইটি সংগ্রহের অনুরোধ বাতিল করা হয়েছে।`,
        'request_rejected'
      );

      alert('অনুরোধ বাতিল করা হয়েছে।');
      window.history.back();
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert('অনুরোধ বাতিল করতে সমস্যা হয়েছে।');
    }
  };

  const returnBookRequest = async (requestId: string) => {
    if (!currentUser || (!isAdmin(currentUser) && !isDeveloper(currentUser))) return;
    
    try {
      await deleteDoc(doc(db, 'bookRequests', requestId));
      alert('বইটি ফেরত নেওয়া হয়েছে।');
      window.history.back();
    } catch (error) {
      console.error("Error returning book:", error);
      alert('বইটি ফেরত নিতে সমস্যা হয়েছে।');
    }
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
        setShowBookshelfPage(!!event.state.showBookshelfPage);
        setShowDonationProjectsPage(!!event.state.showDonationProjectsPage);
        setSelectedDonationProject(event.state.selectedDonationProject || null);
        setIsMenuOpen(!!event.state.isMenuOpen);
        setShowTicTacToe(!!event.state.showTicTacToe);
        setShowDatabasePage(!!event.state.showDatabasePage);
        setSelectedBook(event.state.selectedBook || null);
        setSelectedPayment(event.state.selectedPayment || null);
        setSelectedMemberProfile(event.state.selectedMemberProfile || null);
        setShowNotificationsPage(!!event.state.showNotificationsPage);
        setSelectedNotification(event.state.selectedNotification || null);
        setShowDonatePopup(!!event.state.showDonatePopup);
        setShowLoginError(!!event.state.showLoginError);
        setShowBorrowForm(!!event.state.showBorrowForm);
        setShowNotice(!!event.state.showNotice);
        setShowAdvanceSettings(!!event.state.showAdvanceSettings);
        setShowGreetingsSettings(!!event.state.showGreetingsSettings);
        setShowRegistration(!!event.state.showRegistration);
        setShowCloudPinPage(!!event.state.showCloudPinPage);
        setShowCustomNotificationPage(!!event.state.showCustomNotificationPage);
        setSelectedBookRequest(event.state.selectedBookRequest || null);
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
      showBookshelfPage,
      showDonationProjectsPage,
      selectedDonationProject,
      isMenuOpen,
      showTicTacToe,
      showDatabasePage,
      selectedBook,
      selectedPayment,
      selectedMemberProfile,
      showNotificationsPage,
      selectedNotification,
      showDonatePopup,
      showLoginError,
      showBorrowForm,
      showNotice,
      showAdvanceSettings,
      showGreetingsSettings,
      showRegistration,
      showCloudPinPage,
      showCustomNotificationPage,
      selectedBookRequest
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
        showBookshelfPage,
        showDonationProjectsPage,
        selectedDonationProject,
        isMenuOpen,
        showTicTacToe,
        showDatabasePage,
        selectedBook,
        selectedPayment,
        selectedMemberProfile,
        showNotificationsPage,
        selectedNotification,
        showDonatePopup,
        showLoginError,
        showBorrowForm,
        showNotice,
        showAdvanceSettings,
        showGreetingsSettings,
        showRegistration,
        showCloudPinPage,
        showCustomNotificationPage,
        selectedBookRequest
      }, '');
    }
  }, [activeTab, showInfoPage, showPaymentPage, showBorrowedBooksPage, showBookshelfPage, showDonationProjectsPage, selectedDonationProject, isMenuOpen, showTicTacToe, showDatabasePage, selectedBook, selectedPayment, selectedMemberProfile, showNotificationsPage, selectedNotification, showDonatePopup, showLoginError, showBorrowForm, showNotice, showAdvanceSettings, showGreetingsSettings, showRegistration, showCloudPinPage, showCustomNotificationPage, selectedBookRequest]);

  // Refs for swipe
  const extractSheetId = (input: string) => {
    if (!input) return '';
    // Match pattern like /d/ID/ or just the ID
    const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) return match[1];
    // If it's a full URL but doesn't match the above, try to clean it
    try {
      if (input.includes('http')) {
        const url = new URL(input);
        const pathParts = url.pathname.split('/');
        const dIndex = pathParts.indexOf('d');
        if (dIndex !== -1 && pathParts[dIndex + 1]) {
          return pathParts[dIndex + 1];
        }
      }
    } catch (e) {
      // Not a valid URL, just trim
    }
    return input.trim();
  };

  const getSheetUrl = (sheetId: string) => {
    if (!sheetId) return '#';
    if (sheetId.startsWith('http')) return sheetId;
    return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
  };

  const handleAddAdminLink = async (name: string, sheetId: string, description: string) => {
    if (!currentUser) return;
    const sanitizedId = extractSheetId(sheetId);
    try {
      const newLinkRef = doc(collection(db, 'admin_database_links'));
      await setDoc(newLinkRef, {
        id: newLinkRef.id,
        userId: currentUser.id,
        name,
        sheetId: sanitizedId,
        description,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'admin_database_links');
    }
  };

  const handleUpdateAdminLink = async (id: string, name: string, sheetId: string, description: string) => {
    const sanitizedId = extractSheetId(sheetId);
    try {
      await updateDoc(doc(db, 'admin_database_links', id), {
        name,
        sheetId: sanitizedId,
        description
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `admin_database_links/${id}`);
    }
  };

  const handleDeleteAdminLink = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'admin_database_links', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `admin_database_links/${id}`);
    }
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const pullDistance = useRef(0);
  const [pullOffset, setPullOffset] = useState(0);
  const bloodTabRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  const handleBloodScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const st = e.currentTarget.scrollTop;
    lastScrollTop.current = st <= 0 ? 0 : st;
  };


  useEffect(() => {
    localStorage.setItem('seba_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    loadInitialData();

    // Silent anonymous login to Firebase for Firestore access
    signInAnonymously(auth)
      .then(() => setIsAuthReady(true))
      .catch(err => {
        console.error("Firebase Auth Error:", err);
        // Fallback: set isAuthReady to true anyway so at least some parts of the app work
        // though Firestore operations will likely fail if rules require auth.
        setIsAuthReady(true);
      });

    // Load saved user from localStorage
    const savedUser = localStorage.getItem('seba_user');
    const savedPayments = localStorage.getItem('seba_payments');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        if (savedPayments) {
          setPaymentData(JSON.parse(savedPayments));
        }
        // Refresh payments in background
        fetchPaymentHistory(user.id, user.phone).then(payments => {
          if (payments && payments.length > 0) {
            setPaymentData(payments);
            localStorage.setItem('seba_payments', JSON.stringify(payments));
          }
        });
      } catch (e) {
        console.error("Error parsing saved user data:", e);
      }
    }

    // Simulate app initialization
    const timer = setTimeout(() => {
      if (isAuthReady) {
        setIsAppInitializing(false);
      }
    }, 4000); // Increased minimum time for stable experience
    return () => clearTimeout(timer);
  }, [isAuthReady]);

  // Sync initialization with auth ready
  useEffect(() => {
    if (showPaymentPage && currentUser) {
      fetchPaymentHistory(currentUser.id, currentUser.phone).then(payments => {
        setPaymentData(payments);
        localStorage.setItem('seba_payments', JSON.stringify(payments));
      });
    }
  }, [showPaymentPage, currentUser]);

  useEffect(() => {
    if (isAuthReady) {
      const timer = setTimeout(() => {
        setIsAppInitializing(false);
      }, 1500); // Small buffer after auth is ready
      return () => clearTimeout(timer);
    }
  }, [isAuthReady]);

  // Listen for public donors from Firebase
  useEffect(() => {
    if (!isAuthReady) return;
    const unsubscribe = onSnapshot(collection(db, 'publicDonors'), (snapshot) => {
      const donors: Donor[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.enabled) {
          donors.push({
            name: data.name,
            group: data.group,
            district: data.district,
            thana: '',
            phone: data.phone
          });
        }
      });
      setPublicDonors(donors);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'publicDonors');
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  // Sync current user's donation status from Firebase
  useEffect(() => {
    if (currentUser && isAuthReady) {
      const unsubscribe = onSnapshot(doc(db, 'publicDonors', currentUser.id), (doc) => {
        if (doc.exists()) {
          setBloodDonationEnabled(doc.data().enabled);
        } else {
          setBloodDonationEnabled(false);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `publicDonors/${currentUser.id}`);
      });
      return () => unsubscribe();
    }
  }, [currentUser, isAuthReady]);

  // Global Settings Sync
  useEffect(() => {
    if (!isAuthReady) return;
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.advanceSettings) {
          setAdvanceSettings(data.advanceSettings);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  // Greetings Sync
  useEffect(() => {
    if (!isAuthReady) return;
    const unsubscribe = onSnapshot(doc(db, 'settings', 'greetings'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.greetings) {
          setGreetingsData(data.greetings);
          localStorage.setItem('seba_greetings', JSON.stringify(data.greetings));
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/greetings');
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  // Book Requests Sync
  useEffect(() => {
    if (!isAuthReady) return;
    const unsubscribe = onSnapshot(collection(db, 'bookRequests'), (snapshot) => {
      const requests: BookRequest[] = [];
      snapshot.forEach((doc) => {
        requests.push(doc.data() as BookRequest);
      });
      setBookRequests(requests);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'bookRequests');
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  // Real-time Notifications Listener
  useEffect(() => {
    if (!currentUser || !isAuthReady) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs
        .map(doc => doc.data() as RealTimeNotification)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Check for new unread notifications to show push toast
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const notification = change.doc.data() as RealTimeNotification;
          // Only show toast for notifications created in the last 60 seconds to avoid showing old ones on load
          const createdTime = new Date(notification.createdAt).getTime();
          const now = Date.now();
          if (!notification.isRead && (now - createdTime < 60000)) {
            setActivePushNotification(notification);
            // Auto hide after 5 seconds
            setTimeout(() => setActivePushNotification(null), 5000);
          }
        }
      });

      setRealTimeNotifications(newNotifications);
    }, (error) => {
      console.error("Notifications Listener Error:", error);
    });

    return () => unsubscribe();
  }, [currentUser, isAuthReady]);

  // Global Notices Listener
  useEffect(() => {
    if (!isAuthReady) return;

    const q = query(
      collection(db, 'global_notices'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GlobalNotice));
      setGlobalNotices(notices);
      
      // Show latest notice on startup if user is logged in
      if (notices.length > 0 && currentUser && isAppInitializing) {
        // We only show it once per app load when initialization finishes
        // The actual display logic will be triggered when isAppInitializing becomes false
      }
    }, (error) => {
      console.error("Global Notices Listener Error:", error);
    });

    return () => unsubscribe();
  }, [isAuthReady, currentUser]);

  const handleSaveSettings = async () => {
    if (!currentUser || !isDeveloper(currentUser)) return;
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        advanceSettings,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.id
      });
      alert('সেটিংস সফলভাবে সংরক্ষিত হয়েছে এবং সকল সদস্যদের জন্য আপডেট হয়েছে!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
      alert('সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveGreetings = async () => {
    if (!currentUser || (!isAdmin(currentUser) && !isDeveloper(currentUser))) return;
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'greetings'), {
        greetings: greetingsData,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.id
      });
      localStorage.setItem('seba_greetings', JSON.stringify(greetingsData));
      alert('Greetings সফলভাবে সংরক্ষিত হয়েছে!');
      setShowGreetingsSettings(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/greetings');
      alert('Greetings সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveGlobalNotice = async () => {
    if (!currentUser || (!isAdmin(currentUser) && !isDeveloper(currentUser))) return;
    if (!newNoticeTitle.trim() || !newNoticeMessage.trim()) {
      alert('শিরোনাম এবং বার্তা উভয়ই প্রয়োজন।');
      return;
    }

    setIsSavingNotice(true);
    const id = `notice_${Date.now()}`;
    const noticeData: GlobalNotice = {
      id,
      title: newNoticeTitle,
      message: newNoticeMessage,
      authorId: currentUser.id,
      authorName: currentUser.name,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'global_notices', id), noticeData);
      setNewNoticeTitle('');
      setNewNoticeMessage('');
      setActiveGlobalNoticeTab('history');
      alert('নোটিশ সফলভাবে পাবলিশ করা হয়েছে!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'global_notices');
      alert('নোটিশ পাবলিশ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSavingNotice(false);
    }
  };

  const handleDeleteGlobalNotice = async (id: string) => {
    if (!currentUser || (!isAdmin(currentUser) && !isDeveloper(currentUser))) return;
    if (!window.confirm('আপনি কি নিশ্চিত যে এই নোটিশটি ডিলেট করতে চান?')) return;

    try {
      await deleteDoc(doc(db, 'global_notices', id));
      alert('নোটিশ ডিলেট করা হয়েছে।');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `global_notices/${id}`);
      alert('নোটিশ ডিলেট করতে সমস্যা হয়েছে।');
    }
  };

  const toggleBloodDonation = async () => {
    if (!currentUser || isTogglingBlood) return;
    setIsTogglingBlood(true);
    const newState = !bloodDonationEnabled;
    const path = `publicDonors/${currentUser.id}`;
    try {
      if (newState) {
        await setDoc(doc(db, 'publicDonors', currentUser.id), {
          id: currentUser.id,
          name: currentUser.name,
          group: currentUser.bloodGroup,
          district: currentUser.area,
          phone: currentUser.phone,
          enabled: true,
          updatedAt: new Date().toISOString()
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, `publicDonors/${currentUser.id}`));
      } else {
        await deleteDoc(doc(db, 'publicDonors', currentUser.id))
          .catch(err => handleFirestoreError(err, OperationType.DELETE, `publicDonors/${currentUser.id}`));
      }
      setBloodDonationEnabled(newState);
    } catch (error) {
      console.error("Error toggling blood donation:", error);
    } finally {
      setIsTogglingBlood(false);
    }
  };

  useEffect(() => {
    setIsSearchingDonors(true);
    const timer = setTimeout(() => {
      let result = [...donorData];

      // Add public donors from Firebase
      publicDonors.forEach(pd => {
        if (!result.some(d => d.phone === pd.phone)) {
          result.unshift(pd);
        }
      });

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
  }, [bloodSearchQuery, selectedBloodGroup, donorData, publicDonors]);

  const loadInitialData = async () => {
    setIsLoading(true);
    const [posts, donors, allBooks, projects, transactions, noticeData, notificationData, members] = await Promise.all([
      fetchHomePosts(),
      fetchAllDonors(),
      fetchBooks(),
      fetchDonationProjects(),
      fetchDonationTransactions(),
      fetchNotice(),
      fetchNotifications(),
      fetchAllMembers()
    ]);
    setHomePosts(posts);
    setDonorData(donors);
    setBooks(allBooks);
    setDonationProjects(projects);
    setDonationTransactions(transactions);
    setNotifications(notificationData);
    setAllMembers(members);
    
    if (noticeData && noticeData.title && noticeData.message) {
      setNotice(noticeData);
      setShowNotice(true);
      // Play notification sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.play().catch(e => console.log("Audio play failed:", e));
    }
    
    setIsLoading(false);
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

  const [regFormData, setRegFormData] = useState({
    bloodGroup: '',
    name: '',
    district: '',
    city: '',
    username: '',
    contactNo: ''
  });
  const [regStatus, setRegStatus] = useState<{ text: string, type: 'success' | 'error' | 'loading' | null }>({ text: '', type: null });

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegStatus({ text: 'অপেক্ষা করুন...', type: 'loading' });

    try {
      // Check for uniqueness
      const members = await fetchAllMembers();
      const isUsernameTaken = members.some(m => m.id.toLowerCase() === regFormData.username.toLowerCase());
      const isPhoneTaken = members.some(m => m.phone.includes(regFormData.contactNo));

      if (isUsernameTaken) {
        setRegStatus({ text: 'এই ইউজারনেমটি ইতিমধ্যে ব্যবহার করা হয়েছে।', type: 'error' });
        return;
      }
      if (isPhoneTaken) {
        setRegStatus({ text: 'এই ফোন নম্বরটি ইতিমধ্যে নিবন্ধিত হয়েছে।', type: 'error' });
        return;
      }

      const scriptURL = 'https://script.google.com/macros/s/AKfycbxJ0IvF83hCSCxoJBG3AGUP1Cd7_UakmIqPABtYbxMxUKMUX8hkjdLKH_wgL8Ry9iM/exec';
      const formData = new FormData();
      Object.entries(regFormData).forEach(([key, value]) => formData.append(key, String(value)));

      const response = await fetch(scriptURL, { method: 'POST', body: formData });
      // Google Apps Script usually returns a redirect or success
      setRegStatus({ text: 'সফলভাবে নিবন্ধিত হয়েছে!', type: 'success' });
      setRegFormData({ bloodGroup: '', name: '', district: '', city: '', username: '', contactNo: '' });
      // Refresh members list
      fetchAllMembers().then(setAllMembers);
    } catch (error) {
      setRegStatus({ text: 'দুঃখিত! আবার চেষ্টা করুন।', type: 'error' });
    }
  };

  const completeLogin = async (member: Member) => {
    setCurrentUser(member);
    localStorage.setItem('seba_user', JSON.stringify(member));
    const payments = await fetchPaymentHistory(member.id, member.phone);
    setPaymentData(payments);
    localStorage.setItem('seba_payments', JSON.stringify(payments));
    setShowPinEntry(false);
    setPendingLoginMember(null);
    setCloudPinSettings(null);
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
      // Check for Cloud PIN
      try {
        const pinDoc = await getDoc(doc(db, 'cloud_pins', member.id));
        if (pinDoc.exists()) {
          const pinData = pinDoc.data() as CloudPinSettings;
          if (pinData.isEnabled && pinData.pin) {
            setPendingLoginMember(member);
            setCloudPinSettings(pinData);
            setShowPinEntry(true);
            setIsGlobalLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Error checking Cloud PIN:", e);
      }
      
      await completeLogin(member);
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
    setShowTicTacToe(false);
    setShowDatabasePage(false);
    setShowAdvanceSettings(false);
  };

  const generatePDFContent = (title: string, data: Payment[]) => {
    if (!currentUser) return '';
    const { 
      theme, 
      pdfTemplate, 
      pdfHeaderText, 
      pdfFooterText, 
      pdfHeaderColor, 
      pdfTableHeadBg, 
      pdfTableHeadText, 
      pdfFontSize,
      pdfLabelMemberName,
      pdfLabelMemberId,
      pdfLabelArea,
      pdfLabelDesignation,
      pdfLabelDate,
      pdfLabelReason,
      pdfLabelAmount,
      pdfLabelTotal,
      pdfLabelSubTitle,
      pdfBrandText,
      pdfBrandFontSize,
      pdfBrandColor
    } = advanceSettings;

    const getTemplateStyles = (template: string) => {
      switch (template) {
        case 'modern':
          return `
            .header { text-align: center; flex-direction: column; border-bottom: none; gap: 10px; }
            .header h1 { font-size: 28px; margin-bottom: 5px; }
            .user-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f0fdf4; border-color: #bcf0da; }
            th { border-radius: 5px 5px 0 0; }
            table { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
          `;
        case 'compact':
          return `
            body { padding: 10px; }
            .header { margin-bottom: 10px; padding-bottom: 5px; }
            .user-info { padding: 8px; margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 15px; }
            .user-info p { margin: 0; font-size: 11px; }
            td, th { padding: 6px 8px; font-size: 11px; }
            .footer { margin-top: 20px; }
          `;
        case 'elegant':
          return `
            body { font-family: "Times New Roman", Times, serif; }
            .header { border-bottom: 1px solid #ccc; padding-bottom: 20px; text-align: center; display: block; }
            .header h1 { font-style: italic; font-weight: normal; letter-spacing: 2px; font-size: 32px; }
            .user-info { background: none; border: none; border-bottom: 1px double #ccc; border-radius: 0; padding: 15px 0; display: block; }
            .user-info p { display: inline-block; margin-right: 20px; }
            th { background: none !important; color: ${pdfHeaderColor} !important; border-bottom: 2px solid ${pdfHeaderColor}; text-transform: uppercase; }
            td { border-bottom: 1px solid #eee; }
            .amount { color: #333; }
          `;
        case 'professional':
          return `
            .header { background: ${pdfHeaderColor}; color: white; padding: 25px; border-radius: 8px; border-bottom: none; margin-bottom: 30px; }
            .header h1 { color: white; font-size: 26px; }
            .header p { color: white; opacity: 0.9; }
            .user-info { border-left: 5px solid ${pdfHeaderColor}; border-radius: 0 8px 8px 0; background: #f8fafc; }
            th { text-transform: uppercase; letter-spacing: 1.5px; font-size: 11px; }
            table { margin-top: 25px; }
          `;
        case 'minimal':
          return `
            .header { border-bottom: none; padding-bottom: 0; margin-bottom: 40px; }
            .user-info { background: none; border: none; padding: 0; margin-bottom: 40px; }
            .user-info p { border-bottom: 1px solid #f1f5f9; padding: 8px 0; margin: 0; }
            table { margin-top: 0; }
            th { background: none !important; color: #64748b !important; border-bottom: 2px solid #1e293b; padding-left: 0; }
            td { border-bottom: 1px solid #f1f5f9; padding-left: 0; }
            .footer { border-top: none; opacity: 0.5; }
          `;
        default:
          return '';
      }
    };

    return `
      <!DOCTYPE html>
      <html lang="bn">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title} - ${currentUser.name}</title>
          <style>
            @page {
              margin: 15mm;
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
              padding: 0; 
              color: ${theme.text}; 
              background-color: white;
              line-height: 1.5; 
              font-size: ${pdfFontSize}px;
              margin: 0;
            }
            .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 20px; box-sizing: border-box; }
            .header { 
              border-bottom: 2px solid ${pdfHeaderColor}; 
              padding-bottom: 15px; 
              margin-bottom: 25px; 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
            }
            .header h1 { color: ${pdfHeaderColor}; margin: 0; font-size: 24px; }
            .user-info { 
              margin-bottom: 25px; 
              background: #f8fafc; 
              padding: 20px; 
              border-radius: 12px; 
              border: 1px solid #e2e8f0;
            }
            .user-info p { margin: 6px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
            th { 
              background: ${pdfTableHeadBg}; 
              color: ${pdfTableHeadText}; 
              font-weight: bold; 
              text-align: left; 
              padding: 12px; 
              font-size: 13px; 
            }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; word-wrap: break-word; }
            .amount { font-weight: bold; color: ${theme.button}; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; page-break-inside: avoid; }
            
            ${getTemplateStyles(pdfTemplate)}

            @media print {
              body { padding: 0; background: white; }
              .container { max-width: 100%; padding: 0; }
              .user-info { background: #f8fafc !important; -webkit-print-color-adjust: exact; }
              th { background: ${pdfTableHeadBg} !important; color: ${pdfTableHeadText} !important; -webkit-print-color-adjust: exact; }
              .amount { color: ${theme.button} !important; -webkit-print-color-adjust: exact; }
              tr { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div>
                <h1>${pdfHeaderText}</h1>
                <p style="margin-top: 4px; opacity: 0.8; font-size: 13px;">${pdfLabelSubTitle}</p>
              </div>
              <div style="text-align: right;">
                <p style="font-weight: bold; color: ${pdfBrandColor}; margin: 0; font-size: ${pdfBrandFontSize}px;">${pdfBrandText}</p>
                <p style="font-size: 12px; opacity: 0.7; margin: 0;">${new Date().toLocaleDateString('bn-BD')}</p>
              </div>
            </div>
            
            <div class="user-info">
              <p><strong>${pdfLabelMemberName}:</strong> ${currentUser.name}</p>
              <p><strong>${pdfLabelMemberId}:</strong> ${currentUser.id}</p>
              <p><strong>${pdfLabelArea}:</strong> ${currentUser.area}</p>
              <p><strong>${pdfLabelDesignation}:</strong> ${currentUser.designation}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 25%;">${pdfLabelDate}</th>
                  <th style="width: 50%;">${pdfLabelReason}</th>
                  <th style="width: 25%; text-align: right;">${pdfLabelAmount}</th>
                </tr>
              </thead>
              <tbody>
                ${data.length > 0 ? data.map(p => `
                  <tr>
                    <td>${formatDate(p.date)}</td>
                    <td>${p.reason}</td>
                    <td style="text-align: right;" class="amount">৳${p.amount.toLocaleString()}</td>
                  </tr>
                `).join('') : '<tr><td colspan="3" style="text-align:center">কোনো তথ্য পাওয়া যায়নি</td></tr>'}
              </tbody>
            </table>

            <div style="margin-top: 30px; text-align: right; page-break-inside: avoid;">
              <p style="font-size: 18px; font-weight: bold; margin: 0;">${pdfLabelTotal}: <span style="color: ${theme.button};">৳${data.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</span></p>
            </div>

            <div class="footer">
              <p style="margin: 0;">${pdfFooterText}</p>
              <p style="margin: 6px 0 0 0;">© ${new Date().getFullYear()} Seba Team. All Rights Reserved.</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.onafterprint = function() {
                  if (window.opener) {
                    window.close();
                  }
                };
              }, 500);
            };
          </script>
        </body>
      </html>
    `;
  };

  const generateDonationPDFContent = (project: DonationProject, transactions: DonationTransaction[]) => {
    const { 
      theme, 
      pdfTemplate,
      pdfHeaderColor, 
      pdfTableHeadBg, 
      pdfTableHeadText, 
      pdfFontSize,
      pdfFooterText,
      pdfBrandText,
      pdfBrandFontSize,
      pdfBrandColor,
      pdfLabelSubTitle
    } = advanceSettings;

    const getTemplateStyles = (template: string) => {
      switch (template) {
        case 'modern':
          return `
            .header { text-align: center; flex-direction: column; border-bottom: none; gap: 10px; }
            .header h1 { font-size: 28px; margin-bottom: 5px; }
            .project-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f0fdf4; border-color: #bcf0da; }
            th { border-radius: 5px 5px 0 0; }
            table { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
          `;
        case 'compact':
          return `
            body { padding: 10px; }
            .header { margin-bottom: 10px; padding-bottom: 5px; }
            .project-info { padding: 8px; margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 15px; }
            .project-info p { margin: 0; font-size: 11px; }
            td, th { padding: 6px 8px; font-size: 11px; }
            .footer { margin-top: 20px; }
          `;
        case 'elegant':
          return `
            body { font-family: "Times New Roman", Times, serif; }
            .header { border-bottom: 1px solid #ccc; padding-bottom: 20px; text-align: center; display: block; }
            .header h1 { font-style: italic; font-weight: normal; letter-spacing: 2px; font-size: 32px; }
            .project-info { background: none; border: none; border-bottom: 1px double #ccc; border-radius: 0; padding: 15px 0; display: block; }
            .project-info p { display: inline-block; margin-right: 20px; }
            th { background: none !important; color: ${pdfHeaderColor} !important; border-bottom: 2px solid ${pdfHeaderColor}; text-transform: uppercase; }
            td { border-bottom: 1px solid #eee; }
            .amount { color: #333; }
          `;
        case 'professional':
          return `
            .header { background: ${pdfHeaderColor}; color: white; padding: 25px; border-radius: 8px; border-bottom: none; margin-bottom: 30px; }
            .header h1 { color: white; font-size: 26px; }
            .header p { color: white; opacity: 0.9; }
            .project-info { border-left: 5px solid ${pdfHeaderColor}; border-radius: 0 8px 8px 0; background: #f8fafc; }
            th { text-transform: uppercase; letter-spacing: 1.5px; font-size: 11px; }
            table { margin-top: 25px; }
          `;
        case 'minimal':
          return `
            .header { border-bottom: none; padding-bottom: 0; margin-bottom: 40px; }
            .project-info { background: none; border: none; padding: 0; margin-bottom: 40px; }
            .project-info p { border-bottom: 1px solid #f1f5f9; padding: 8px 0; margin: 0; }
            table { margin-top: 0; }
            th { background: none !important; color: #64748b !important; border-bottom: 2px solid #1e293b; padding-left: 0; }
            td { border-bottom: 1px solid #f1f5f9; padding-left: 0; }
            .footer { border-top: none; opacity: 0.5; }
          `;
        default:
          return '';
      }
    };

    return `
      <!DOCTYPE html>
      <html lang="bn">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ডোনেশন রিপোর্ট - ${project.name}</title>
          <style>
            @page {
              margin: 15mm;
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
              padding: 0; 
              color: ${theme.text}; 
              background-color: white;
              line-height: 1.5; 
              font-size: ${pdfFontSize}px;
              margin: 0;
            }
            .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 20px; box-sizing: border-box; }
            .header { 
              border-bottom: 2px solid ${pdfHeaderColor}; 
              padding-bottom: 15px; 
              margin-bottom: 25px; 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
            }
            .header h1 { color: ${pdfHeaderColor}; margin: 0; font-size: 24px; }
            .project-info { 
              margin-bottom: 25px; 
              background: #f8fafc; 
              padding: 20px; 
              border-radius: 12px; 
              border: 1px solid #e2e8f0;
            }
            .project-info p { margin: 6px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
            th { 
              background: ${pdfTableHeadBg}; 
              color: ${pdfTableHeadText}; 
              font-weight: bold; 
              text-align: left; 
              padding: 12px; 
              font-size: 13px; 
            }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; word-wrap: break-word; }
            .amount { font-weight: bold; color: ${theme.button}; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; page-break-inside: avoid; }
            
            ${getTemplateStyles(pdfTemplate)}

            @media print {
              body { padding: 0; background: white; }
              .container { max-width: 100%; padding: 0; }
              .project-info { background: #f8fafc !important; -webkit-print-color-adjust: exact; }
              th { background: ${pdfTableHeadBg} !important; color: ${pdfTableHeadText} !important; -webkit-print-color-adjust: exact; }
              .amount { color: ${theme.button} !important; -webkit-print-color-adjust: exact; }
              tr { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div>
                <h1>ডোনেশন রিপোর্ট</h1>
                <p style="margin-top: 4px; opacity: 0.8; font-size: 13px;">${project.name}</p>
              </div>
              <div style="text-align: right;">
                <p style="font-weight: bold; color: ${pdfBrandColor}; margin: 0; font-size: ${pdfBrandFontSize}px;">${pdfBrandText}</p>
                <p style="font-size: 12px; opacity: 0.7; margin: 0;">${new Date().toLocaleDateString('bn-BD')}</p>
              </div>
            </div>
            
            <div class="project-info">
              <p><strong>প্রজেক্টের নাম:</strong> ${project.name}</p>
              <p><strong>অ্যাকাউন্ট নম্বর:</strong> ${project.accountNo || 'N/A'}</p>
              <p><strong>টার্গেট:</strong> ৳${project.target.toLocaleString()}</p>
              <p><strong>মোট সংগৃহীত:</strong> ৳${transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 20%;">তারিখ</th>
                  <th style="width: 40%;">ডোনারের নাম</th>
                  <th style="width: 20%;">পদ্ধতি</th>
                  <th style="width: 20%; text-align: right;">পরিমাণ</th>
                </tr>
              </thead>
              <tbody>
                ${transactions.length > 0 ? transactions.map(t => `
                  <tr>
                    <td>${formatDate(t.date)}</td>
                    <td>${t.donorName || 'Anonymous'}</td>
                    <td>${t.method || 'N/A'}</td>
                    <td style="text-align: right;" class="amount">৳${t.amount.toLocaleString()}</td>
                  </tr>
                `).join('') : '<tr><td colspan="4" style="text-align:center">কোনো তথ্য পাওয়া যায়নি</td></tr>'}
              </tbody>
            </table>

            <div style="margin-top: 30px; text-align: right; page-break-inside: avoid;">
              <p style="font-size: 18px; font-weight: bold; margin: 0;">মোট: <span style="color: ${theme.button};">৳${transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</span></p>
            </div>

            <div class="footer">
              <p style="margin: 0;">${pdfFooterText}</p>
              <p style="margin: 6px 0 0 0;">© ${new Date().getFullYear()} Seba Team. All Rights Reserved.</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.onafterprint = function() {
                  if (window.opener) {
                    window.close();
                  }
                };
              }, 500);
            };
          </script>
        </body>
      </html>
    `;
  };

  const downloadAsPDF = async (content: string, filename: string) => {
    // Create a temporary container to render the HTML
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '190mm'; // A4 width minus some margin for safety
    container.innerHTML = content;
    document.body.appendChild(container);

    // Ensure the container has a white background
    const innerContainer = container.querySelector('.container') as HTMLElement;
    if (innerContainer) {
      innerContainer.style.width = '100%';
      innerContainer.style.maxWidth = 'none';
      innerContainer.style.margin = '0';
      innerContainer.style.padding = '0'; // We'll handle margins in jsPDF
      innerContainer.style.backgroundColor = '#ffffff';
    }

    // Remove scripts and print controls
    container.querySelectorAll('script').forEach(s => s.remove());
    const controls = container.querySelector('.print-controls');
    if (controls) controls.remove();

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 190 * 3.78,
        windowWidth: 190 * 3.78
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 15; // 15mm standard margin
      const contentWidth = pdfWidth - (2 * margin);
      const contentHeight = pdfHeight - (2 * margin);
      
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = margin;

      // Add the first page
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= contentHeight;

      // Add subsequent pages if content is longer than one page
      while (heightLeft > 0) {
        pdf.addPage();
        position = (heightLeft - imgHeight) + margin;
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
        heightLeft -= contentHeight;
      }
      
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      // Fallback
      const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      document.body.removeChild(container);
    }
  };

  const printViaIframe = (content: string) => {
    // Detect PWA or Mobile
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // For PWA and Mobile, opening a new window is often more reliable to trigger the system print service
    if (isStandalone || isMobile) {
      const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      // Fallback if window.open is blocked
      if (!printWindow) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${new Date().getTime()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      return;
    }

    // Desktop/Browser fallback using hidden iframe
    const oldIframe = document.getElementById('print-iframe');
    if (oldIframe) {
      document.body.removeChild(oldIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.style.zIndex = '-1';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(content);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Iframe print failed', e);
          const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        }
      }, 500);
    }
  };

  const handleDownloadFullHistory = () => {
    const content = generatePDFContent(advanceSettings.pdfHeaderText || 'Full Payment History', allPayments);
    downloadAsPDF(content, `Full_History_${new Date().getTime()}`);
  };

  const handleDownloadSingleTransaction = (payment: Payment) => {
    const content = generatePDFContent(advanceSettings.pdfLabelInvoiceTitle || 'Payment Invoice', [payment]);
    downloadAsPDF(content, `Invoice_${new Date().getTime()}`);
  };

  const handleDownloadFilteredHistory = () => {
    let filtered = [...allPayments];
    if (filterStartDate) {
      filtered = filtered.filter(p => p.date >= filterStartDate);
    }
    if (filterEndDate) {
      filtered = filtered.filter(p => p.date <= filterEndDate);
    }
    
    const content = generatePDFContent('Filtered Payment History', filtered);
    downloadAsPDF(content, `Filtered_History_${new Date().getTime()}`);
  };

  const toBengaliDigits = (num: number) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().padStart(2, '0').split('').map(d => bengaliDigits[parseInt(d)] || d).join('');
  };

  const parseDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    let date: Date;
    if (typeof dateValue === 'string') {
      const match = dateValue.match(/Date\((\d+),(\d+),(\d+)\)/);
      if (match) {
        date = new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
      } else {
        date = new Date(dateValue);
      }
    } else {
      date = new Date(dateValue);
    }
    return isNaN(date.getTime()) ? null : date;
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'তথ্য নেই';
    try {
      let date: Date;
      if (typeof dateValue === 'string') {
        const match = dateValue.match(/Date\((\d+),(\d+),(\d+)\)/);
        date = match ? new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3])) : new Date(dateValue);
      } else {
        date = new Date(dateValue);
      }
      if (isNaN(date.getTime())) return dateValue;
      return date.toLocaleDateString('bn-BD', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateValue;
    }
  };

  const getDuration = (startDateValue: any) => {
    if (!startDateValue) return null;
    let startDate: Date;
    if (typeof startDateValue === 'string') {
      const match = startDateValue.match(/Date\((\d+),(\d+),(\d+)\)/);
      startDate = match ? new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3])) : new Date(startDateValue);
    } else {
      startDate = new Date(startDateValue);
    }
    if (isNaN(startDate.getTime())) return null;

    const now = new Date();
    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();
    let days = now.getDate() - startDate.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += lastMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const totalMonths = years * 12 + months;
    if (totalMonths === 0 && days === 0) return "আজ";
    
    let result = "";
    if (totalMonths > 0) result += `${totalMonths} মাস `;
    if (days > 0) result += `${days} দিন`;
    return result.trim();
  };

  const getExtraDays = (returnableDateValue: any) => {
    if (!returnableDateValue) return null;
    let returnableDate: Date;
    if (typeof returnableDateValue === 'string') {
      const match = returnableDateValue.match(/Date\((\d+),(\d+),(\d+)\)/);
      returnableDate = match ? new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3])) : new Date(returnableDateValue);
    } else {
      returnableDate = new Date(returnableDateValue);
    }
    if (isNaN(returnableDate.getTime())) return null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    returnableDate.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - returnableDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnyOverlayOpen) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isRefreshing || isAnyOverlayOpen) return;
    
    const currentY = e.touches[0].clientY;
    const diffY = currentY - touchStartY.current;
    
    // Only pull if at the top of the page
    if (diffY > 0 && window.scrollY === 0) {
      // Apply resistance
      const offset = Math.min(diffY * 0.4, 100);
      setPullOffset(offset);
      pullDistance.current = offset;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isAnyOverlayOpen) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const tabs: ('home' | 'books' | 'members' | 'blood' | 'profile')[] = ['home', 'books', 'members', 'blood', 'profile'];
    const currentIndex = tabs.indexOf(activeTab);

    // Horizontal swipe
    if (Math.abs(diffX) > 100 && Math.abs(e.changedTouches[0].clientY - touchStartY.current) < 50) {
      if (diffX > 0 && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      } else if (diffX < 0 && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    }

    // Pull to refresh
    if (pullDistance.current >= 80) {
      setIsRefreshing(true);
      loadInitialData().then(() => {
        setIsRefreshing(false);
        setPullOffset(0);
        pullDistance.current = 0;
      });
    } else {
      setPullOffset(0);
      pullDistance.current = 0;
    }
  };

  return (
    <>
      <LandscapeBlocker isDarkMode={isDarkMode} />
      <AnimatePresence mode="wait">
        {isAppInitializing && <SplashScreen key="splash" greetingsData={greetingsData} />}
      </AnimatePresence>

      <AnimatePresence>
        {activePushNotification && (
          <PushNotificationToast 
            notification={activePushNotification} 
            onClose={() => setActivePushNotification(null)} 
            isDarkMode={isDarkMode} 
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "flex flex-col h-screen overflow-hidden font-['Hind_Siliguri']",
        isDarkMode ? "bg-slate-900 text-slate-50" : "bg-slate-50 text-slate-900"
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      >
      {/* Pull to Refresh Indicator */}
      <div 
        className="fixed top-0 left-0 w-full flex justify-center z-[100] pointer-events-none transition-transform duration-200"
        style={{ transform: `translateY(${pullOffset}px)` }}
      >
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shadow-lg",
          isDarkMode ? "bg-slate-800 text-emerald-500" : "bg-white text-emerald-500"
        )}>
          {isRefreshing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <ArrowLeft className={cn("w-6 h-6 transition-transform", pullOffset > 70 ? "rotate-90" : "rotate-[-90deg]")} />
          )}
        </div>
      </div>
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
            {currentUser?.photoId && !currentUser.isNewSheet ? (
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
            {/* Global Notice Card */}
            {currentUser && globalNotices.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-5 rounded-[2rem] mb-6 border-2 relative overflow-hidden",
                  isDarkMode ? "bg-slate-900 border-emerald-500/30 text-white" : "bg-white border-emerald-100 text-slate-900"
                )}
              >
                {/* Green Reflection Effect */}
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 4, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent skew-x-12 pointer-events-none"
                />
                
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                    <Megaphone className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-emerald-500 mb-1 truncate">{globalNotices[0].title}</h3>
                    <p className="text-sm opacity-80 leading-relaxed">{globalNotices[0].message}</p>
                    <div className="mt-3 flex items-center gap-2 opacity-40">
                      <div className="w-1 h-1 rounded-full bg-current" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {formatDate(globalNotices[0].createdAt)} • {globalNotices[0].authorName}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

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
                  
                  <PostReactionSection 
                    postId={encodeURIComponent(post.title + post.date)}
                    currentUser={currentUser}
                    isDarkMode={isDarkMode}
                    isAuthReady={isAuthReady}
                  />
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
              
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar relative">
                {['সব', ...Array.from(new Set(books.map(b => b.category || 'অন্যান্য')))].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedBookCategory(cat)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all relative z-10",
                      selectedBookCategory === cat 
                        ? "text-white border-emerald-500" 
                        : isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-600"
                    )}
                  >
                    {selectedBookCategory === cat && (
                      <motion.div 
                        layoutId="selectedBookCategoryTab"
                        className="absolute inset-0 bg-emerald-500 rounded-full shadow-md shadow-emerald-500/20"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-20">{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {isLoading && books.length === 0 ? (
              <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
            ) : (
              <div className="space-y-6 mt-2">
                {(() => {
                  const filtered = books.map(book => {
                    // Check if there's an approved request in Firestore for this book
                    const activeRequest = bookRequests.find(r => r.bookId === book.id && r.status === 'approved');
                    if (activeRequest) {
                      return {
                        ...book,
                        status: 'গৃহীত',
                        recipient: activeRequest.requesterName,
                        recipientId: activeRequest.requesterId,
                        date: activeRequest.approvedAt || activeRequest.requestDate,
                        returnableDate: activeRequest.dueDate || '',
                        address: activeRequest.requesterAddress || ''
                      };
                    }
                    return book;
                  }).filter(book => {
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
                      onMouseDown={() => handleLongPressStart('member', m)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                      onTouchStart={() => handleLongPressStart('member', m)}
                      onTouchEnd={handleLongPressEnd}
                      onClick={() => handleMemberClick(m)}
                      className={cn(
                        "w-full flex items-center gap-4 p-3 rounded-xl border text-left active:scale-95 transition-transform",
                        isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                      )}
                    >
                      {m.photoId && !m.isNewSheet ? (
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
                        <div className="flex items-center gap-1">
                          <h4 className="font-bold">{m.name}</h4>
                          {isVerifiedMember(m) && (
                            <BadgeCheck className="w-4 h-4 text-white fill-emerald-500" />
                          )}
                        </div>
                        {!m.isNewSheet && <p className="text-xs opacity-70">{m.designation}</p>}
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
                    <div 
                      key={`member-${idx}-${m.id}`}
                      onMouseDown={() => handleLongPressStart('member', m)}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd}
                      onTouchStart={() => handleLongPressStart('member', m)}
                      onTouchEnd={handleLongPressEnd}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-xl border",
                        isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                      )}
                    >
                      {m.photoId && !m.isNewSheet ? (
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
                        <div className="flex items-center gap-1">
                          <h4 className="font-bold">{m.name}</h4>
                          {isVerifiedMember(m) && (
                            <BadgeCheck className="w-4 h-4 text-white fill-emerald-500" />
                          )}
                        </div>
                        {!m.isNewSheet && <p className="text-xs opacity-70">{m.designation}</p>}
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
                    {Array.from(new Set([...donorData, ...publicDonors].map(d => d.group))).filter(Boolean).sort().map(g => (
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
                      <h3 className="font-bold text-lg">{currentUser ? donor.name : 'রক্তদাতার নাম (লুকানো)'}</h3>
                      <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">{donor.group}</span>
                    </div>
                    <p className="text-sm opacity-80 mb-1">
                      <strong>ঠিকানা:</strong> {currentUser ? `${donor.district}${donor.thana ? `, ${donor.thana}` : ''}` : 'লুকানো'}
                    </p>
                    <p className="text-sm opacity-80"><strong>মোবাইল:</strong> {currentUser ? donor.phone : 'লুকানো'}</p>
                    {currentUser ? (
                      <a href={`tel:${donor.phone}`} className="mt-3 flex items-center justify-center gap-2 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold active:scale-95 transition-all">
                        কল করুন
                      </a>
                    ) : (
                      <button 
                        onClick={() => setActiveTab('profile')}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-semibold active:scale-95 transition-all"
                      >
                        বিস্তারিত দেখতে লগইন করুন
                      </button>
                    )}
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
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 py-10">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-emerald-500" />
                </div>
                
                {!showRegistration ? (
                  <>
                    <h3 className="text-xl font-bold">লগইন করুন</h3>
                    <form onSubmit={handleLogin} className="w-full space-y-4">
                      <input 
                        name="id"
                        type="text" 
                        placeholder="ইউজারনেম / আইডি" 
                        className={cn(
                          "w-full h-12 px-4 rounded-xl border outline-none focus:border-emerald-500 transition-colors",
                          isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                        )}
                        required
                      />
                      <input 
                        name="phone"
                        type="text" 
                        placeholder="ফোন নম্বর" 
                        className={cn(
                          "w-full h-12 px-4 rounded-xl border outline-none focus:border-emerald-500 transition-colors",
                          isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                        )}
                        required
                      />
                      <button type="submit" className="w-full h-12 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
                        লগইন
                      </button>
                    </form>
                    <button 
                      onClick={() => setShowRegistration(true)}
                      className="text-emerald-500 font-bold text-sm"
                    >
                      নিবন্ধন নেই? এখানে নিবন্ধন করুন
                    </button>
                  </>
                ) : (
                  <div className={cn(
                    "w-full p-6 rounded-3xl border text-left space-y-4",
                    isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100 shadow-xl"
                  )}>
                    <div className="flex items-center gap-4 mb-4">
                      <button 
                        onClick={() => setShowRegistration(false)}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-xl font-bold">নিবন্ধন ফর্ম</h2>
                    </div>
                    <form onSubmit={handleRegistration} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold opacity-60 ml-1">রক্তের গ্রুপ</label>
                        <select 
                          required
                          value={regFormData.bloodGroup}
                          onChange={(e) => setRegFormData({...regFormData, bloodGroup: e.target.value})}
                          className={cn(
                            "w-full h-12 px-4 rounded-xl border outline-none focus:border-emerald-500 transition-colors appearance-none",
                            isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"
                          )}
                        >
                          <option value="">নির্বাচন করুন</option>
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
                        <label className="text-xs font-bold opacity-60 ml-1">নাম</label>
                        <input 
                          required
                          type="text" 
                          placeholder="আপনার পূর্ণ নাম"
                          value={regFormData.name}
                          onChange={(e) => setRegFormData({...regFormData, name: e.target.value})}
                          className={cn(
                            "w-full h-12 px-4 rounded-xl border outline-none focus:border-emerald-500 transition-colors",
                            isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold opacity-60 ml-1">জেলা</label>
                          <input 
                            required
                            type="text" 
                            placeholder="জেলার নাম"
                            value={regFormData.district}
                            onChange={(e) => setRegFormData({...regFormData, district: e.target.value})}
                            className={cn(
                              "w-full h-12 px-4 rounded-xl border outline-none focus:border-emerald-500 transition-colors",
                              isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"
                            )}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold opacity-60 ml-1">শহর</label>
                          <input 
                            required
                            type="text" 
                            placeholder="উপজেলার নাম"
                            value={regFormData.city}
                            onChange={(e) => setRegFormData({...regFormData, city: e.target.value})}
                            className={cn(
                              "w-full h-12 px-4 rounded-xl border outline-none focus:border-emerald-500 transition-colors",
                              isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold opacity-60 ml-1">ইউজারনেম / username</label>
                        <input 
                          required
                          type="text" 
                          placeholder="ইউজার নাম (উদাঃ abc123)"
                          value={regFormData.username}
                          onChange={(e) => setRegFormData({...regFormData, username: e.target.value})}
                          className={cn(
                            "w-full h-12 px-4 rounded-xl border outline-none focus:border-emerald-500 transition-colors",
                            isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"
                          )}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold opacity-60 ml-1">কন্টাক্ট নাম্বার / Contact No</label>
                        <input 
                          required
                          type="tel" 
                          placeholder="18XXXXXXXX"
                          value={regFormData.contactNo}
                          onChange={(e) => setRegFormData({...regFormData, contactNo: e.target.value})}
                          className={cn(
                            "w-full h-12 px-4 rounded-xl border outline-none focus:border-emerald-500 transition-colors",
                            isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"
                          )}
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={regStatus.type === 'loading'}
                        className={cn(
                          "w-full h-12 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2",
                          regStatus.type === 'loading' && "opacity-70 cursor-not-allowed"
                        )}
                      >
                        {regStatus.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
                        নিবন্ধন করুন
                      </button>

                      {regStatus.text && (
                        <p className={cn(
                          "text-center text-sm font-bold",
                          regStatus.type === 'success' ? "text-emerald-500" : "text-red-500"
                        )}>
                          {regStatus.text}
                        </p>
                      )}

                      <button 
                        type="button"
                        onClick={() => setShowRegistration(false)}
                        className="w-full text-center text-slate-500 font-bold text-sm pt-2"
                      >
                        ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন
                      </button>
                    </form>
                  </div>
                )}

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
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <button 
                        onClick={() => setShowNotificationsPage(true)}
                        className="relative p-2 bg-transparent rounded-full text-white active:scale-95 transition-all"
                        style={{ backgroundColor: '#FFFFFF00' }}
                      >
                        <Bell className={cn("w-6 h-6", isDarkMode ? "text-white" : "text-slate-400")} />
                        {(notifications.some(n => n.id === currentUser.id && n.message) || realTimeNotifications.some(n => !n.isRead)) && (
                          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
                        )}
                      </button>
                      {(isAdmin(currentUser) || isDeveloper(currentUser)) && (
                        <button 
                          onClick={() => setShowCustomNotificationPage(true)}
                          className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full text-emerald-500 active:scale-95 transition-all"
                        >
                          <UserRoundPen className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                    <div className="relative inline-block">
                      <img 
                        src={(currentUser.photoId && !currentUser.isNewSheet) ? `https://lh3.googleusercontent.com/d/${currentUser.photoId}` : 'https://via.placeholder.com/100'} 
                        className="w-24 h-24 rounded-full border-4 border-emerald-500 object-cover mx-auto"
                        alt={currentUser.name}
                      />
                    </div>
                      <div className="flex items-center justify-center gap-1.5 mt-4 mb-1">
                        <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                        {isVerifiedMember(currentUser) && (
                          <BadgeCheck className="w-6 h-6 text-white fill-emerald-500" />
                        )}
                      </div>
                    {!currentUser.isNewSheet && <p className="text-slate-500 font-medium">{currentUser.designation}</p>}
                  </div>
                </div>

                <div className="space-y-2 px-1">
                  <ProfileMenuLink 
                    icon={<Lock className="w-5 h-5 text-emerald-500" />} 
                    label="Cloud PIN" 
                    onClick={() => setShowCloudPinPage(true)} 
                    isDarkMode={isDarkMode}
                  />
                  <ProfileMenuLink 
                    icon={<Info className="w-5 h-5" />} 
                    label={advanceSettings.optionNames.information} 
                    onClick={() => setShowInfoPage(true)} 
                    isDarkMode={isDarkMode}
                  />
                  <ProfileMenuLink 
                    icon={<FileText className="w-5 h-5" />} 
                    label={advanceSettings.optionNames.paymentHistory} 
                    onClick={() => setShowPaymentPage(true)} 
                    isDarkMode={isDarkMode}
                  />
                  {((isAdmin(currentUser) && advanceSettings.controls.admin.borrowedBooks) || 
                    (!isAdmin(currentUser) && advanceSettings.controls.member.borrowedBooks)) && (
                    <ProfileMenuLink 
                      icon={<BookOpen className="w-5 h-5" />} 
                      label={advanceSettings.optionNames.borrowedBooks} 
                      onClick={() => {
                        if (isAdmin(currentUser) || isDeveloper(currentUser)) {
                          setActiveBorrowedTab('requests');
                        } else {
                          setActiveBorrowedTab('my-books');
                        }
                        setShowBorrowedBooksPage(true);
                      }} 
                      isDarkMode={isDarkMode}
                    />
                  )}
                  {((isAdmin(currentUser) && advanceSettings.controls.admin.findBookshelf) || 
                    (!isAdmin(currentUser) && advanceSettings.controls.member.findBookshelf)) && (
                    <ProfileMenuLink 
                      icon={<MapPin className="w-5 h-5" />} 
                      label={advanceSettings.optionNames.findBookshelf} 
                      onClick={() => {
                        setShowBookshelfPage(true);
                        if (bookshelves.length === 0) {
                          setIsLoading(true);
                          fetchBookshelves().then(data => {
                            setBookshelves(data);
                            setIsLoading(false);
                          });
                        }
                      }} 
                      isDarkMode={isDarkMode}
                    />
                  )}
                  {((isAdmin(currentUser) && advanceSettings.controls.admin.database) || 
                    (!isAdmin(currentUser) && advanceSettings.controls.member.database)) && (
                    <ProfileMenuLink 
                      icon={<Database className="w-5 h-5" />} 
                      label={advanceSettings.optionNames.database} 
                      onClick={() => setShowDatabasePage(true)} 
                      isDarkMode={isDarkMode}
                    />
                  )}
                  {((isAdmin(currentUser) && advanceSettings.controls.admin.tictactoe) || 
                    (!isAdmin(currentUser) && advanceSettings.controls.member.tictactoe)) && (
                    <ProfileMenuLink 
                      icon={<Gamepad2 className="w-5 h-5" />} 
                      label={advanceSettings.optionNames.playTicTacToe} 
                      onClick={() => setShowTicTacToe(true)} 
                      isDarkMode={isDarkMode}
                    />
                  )}
                  {((isAdmin(currentUser) && advanceSettings.controls.admin.bloodDonation) || 
                    (!isAdmin(currentUser) && advanceSettings.controls.member.bloodDonation)) && (
                    <ProfileMenuLink 
                      icon={isTogglingBlood ? <Loader2 className="w-5 h-5 animate-spin text-red-500" /> : <Heart className={cn("w-5 h-5", bloodDonationEnabled ? "text-red-500" : "text-slate-400")} />} 
                      label={advanceSettings.optionNames.bloodDonation} 
                      onClick={toggleBloodDonation} 
                      isDarkMode={isDarkMode}
                      rightElement={
                        <div className={cn(
                          "w-10 h-5 rounded-full relative transition-colors", 
                          bloodDonationEnabled ? "bg-red-500" : "bg-slate-300",
                          isTogglingBlood && "opacity-50"
                        )}>
                          <div className={cn(
                            "absolute top-1 w-3 h-3 bg-white rounded-full transition-all", 
                            bloodDonationEnabled ? "right-1" : "left-1"
                          )} />
                        </div>
                      }
                    />
                  )}
                  <ProfileMenuLink 
                    icon={isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />} 
                    label={advanceSettings.optionNames.darkMode} 
                    onClick={() => setIsDarkMode(!isDarkMode)} 
                    isDarkMode={isDarkMode}
                    rightElement={<div className={cn("w-10 h-5 rounded-full relative transition-colors", isDarkMode ? "bg-emerald-500" : "bg-slate-300")}><div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", isDarkMode ? "right-1" : "left-1")} /></div>}
                  />
                  {((isAdmin(currentUser) && advanceSettings.controls.admin.donation) || 
                    (!isAdmin(currentUser) && advanceSettings.controls.member.donation)) && (
                    <ProfileMenuLink 
                      icon={<Heart className="w-5 h-5 text-red-500" />} 
                      label={advanceSettings.optionNames.donation} 
                      onClick={() => setShowDonationProjectsPage(true)} 
                      isDarkMode={isDarkMode}
                    />
                  )}
                  {(isAdmin(currentUser) || isDeveloper(currentUser)) && (
                    <ProfileMenuLink 
                      icon={<ClipboardList className="w-5 h-5 text-emerald-500" />} 
                      label="Requests" 
                      onClick={() => {
                        setActiveBorrowedTab('requests');
                        setShowBorrowedBooksPage(true);
                      }} 
                      isDarkMode={isDarkMode}
                      rightElement={
                        bookRequests.filter(r => r.status === 'pending').length > 0 ? (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {bookRequests.filter(r => r.status === 'pending').length}
                          </span>
                        ) : undefined
                      }
                    />
                  )}
                  {(isAdmin(currentUser) || isDeveloper(currentUser)) && (
                    <ProfileMenuLink 
                      icon={<Bell className="w-5 h-5 text-emerald-500" />} 
                      label="Greetings" 
                      onClick={() => setShowGreetingsSettings(true)} 
                      isDarkMode={isDarkMode}
                    />
                  )}
                  {(isAdmin(currentUser) || isDeveloper(currentUser)) && (
                    <ProfileMenuLink 
                      icon={<Megaphone className="w-5 h-5 text-emerald-500" />} 
                      label="Global Notice" 
                      onClick={() => setShowGlobalNoticeManager(true)} 
                      isDarkMode={isDarkMode}
                    />
                  )}
                  {isDeveloper(currentUser) && (
                    <ProfileMenuLink 
                      icon={<Bell className="w-5 h-5 text-emerald-500" />} 
                      label="Test Notification" 
                      onClick={() => sendRealTimeNotification(currentUser.id, 'টেস্ট নোটিফিকেশন', 'এটি একটি টেস্ট পুশ নোটিফিকেশন।', 'general')} 
                      isDarkMode={isDarkMode}
                    />
                  )}
                  {isDeveloper(currentUser) && (
                    <ProfileMenuLink 
                      icon={<Settings className="w-5 h-5 text-slate-500" />} 
                      label="Advance settings" 
                      onClick={() => setShowAdvanceSettings(true)} 
                      isDarkMode={isDarkMode}
                    />
                  )}
                  <ProfileMenuLink 
                    icon={<Facebook className="w-5 h-5" />} 
                    label={advanceSettings.optionNames.facebookPage} 
                    onClick={() => window.open('https://www.facebook.com/profile.php?id=100071182715718', '_blank')} 
                    isDarkMode={isDarkMode}
                    rightElement={<ExternalLink className="w-4 h-4 text-slate-300" />}
                  />
                  <ProfileMenuLink 
                    icon={<Facebook className="w-5 h-5" />} 
                    label={advanceSettings.optionNames.facebookGroup} 
                    onClick={() => window.open('https://www.facebook.com/share/g/17BCSBMTA8/', '_blank')} 
                    isDarkMode={isDarkMode}
                    rightElement={<ExternalLink className="w-4 h-4 text-slate-300" />}
                  />
                  <ProfileMenuLink 
                    icon={<MessageCircle className="w-5 h-5 text-emerald-500" />} 
                    label={advanceSettings.optionNames.whatsAppChannel} 
                    onClick={() => window.open('https://whatsapp.com/channel/0029VbCeAHpJ3juuRp2Dzi3N', '_blank')} 
                    isDarkMode={isDarkMode}
                    rightElement={<ExternalLink className="w-4 h-4 text-slate-300" />}
                  />
                  <div className="pt-4">
                    <ProfileMenuLink 
                      icon={<LogOut className="w-5 h-5 text-red-500" />} 
                      label={advanceSettings.optionNames.logout} 
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

      {/* Pin Entry Modal */}
      <AnimatePresence>
        {showPinEntry && cloudPinSettings && pendingLoginMember && (
          <PinEntryModal 
            targetPin={cloudPinSettings.pin}
            pendingMember={pendingLoginMember}
            isDarkMode={isDarkMode}
            onSuccess={() => completeLogin(pendingLoginMember)}
            onCancel={() => {
              setShowPinEntry(false);
              setPendingLoginMember(null);
              setCloudPinSettings(null);
            }}
          />
        )}
      </AnimatePresence>

      </main>

      {/* Bottom Nav */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 h-[65px] flex justify-around items-center border-t z-[1000] pb-[env(safe-area-inset-bottom,0px)]",
        isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
      )}>
        <NavItem active={activeTab === 'home'} icon={<Home />} label={advanceSettings.tabNames.home} onClick={() => setActiveTab('home')} />
        <NavItem active={activeTab === 'books'} icon={<BookOpen />} label={advanceSettings.tabNames.books} onClick={() => setActiveTab('books')} />
        <NavItem active={activeTab === 'members'} icon={<Users />} label={advanceSettings.tabNames.members} onClick={() => setActiveTab('members')} />
        <NavItem active={activeTab === 'blood'} icon={<Heart />} label={advanceSettings.tabNames.blood} onClick={() => setActiveTab('blood')} />
        <NavItem active={activeTab === 'profile'} icon={<User />} label={advanceSettings.tabNames.profile} onClick={() => setActiveTab('profile')} />
      </nav>

      {/* Overlays */}
      <AnimatePresence>
        {showInfoPage && currentUser && (
          <OverlayPage key="info-overlay" title="ব্যবহারকারীর তথ্য" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <div className="space-y-3">
              <div className={cn(
                "p-4 rounded-xl border flex items-center justify-between",
                isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
              )}>
                <div>
                  <label className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold mb-1">নাম</label>
                  <b className="text-base">{currentUser.name}</b>
                </div>
                {isVerifiedMember(currentUser) && <BadgeCheck className="w-5 h-5 text-white fill-emerald-500" />}
              </div>
              {!currentUser.isNewSheet && <InfoItem label="পদবী" value={currentUser.designation} isDarkMode={isDarkMode} />}
              <InfoItem label="এলাকা" value={currentUser.area} isDarkMode={isDarkMode} />
              <InfoItem label="আইডি" value={currentUser.id} isDarkMode={isDarkMode} />
              {!currentUser.isNewSheet && <InfoItem label="জন্ম তারিখ" value={formatDate(currentUser.dob)} isDarkMode={isDarkMode} />}
              <InfoItem label="রক্তের গ্রুপ" value={currentUser.bloodGroup} isDarkMode={isDarkMode} />
              <InfoItem label="ফোন" value={currentUser.phone} isDarkMode={isDarkMode} />
              {!currentUser.isNewSheet && <InfoItem label="ইমেইল" value={currentUser.email} isDarkMode={isDarkMode} />}
              <InfoItem label="যোগদানের তারিখ" value={currentUser.joiningDate} isDarkMode={isDarkMode} />
            </div>
          </OverlayPage>
        )}

        {showCloudPinPage && currentUser && (
          <CloudPinPage 
            currentUser={currentUser} 
            onClose={() => window.history.back()} 
            isDarkMode={isDarkMode} 
          />
        )}

        {showPaymentPage && (
          <OverlayPage key="payment-overlay" title="পেমেন্ট হিস্টোরি" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <div className="space-y-3 pb-24">
              {allPayments.length === 0 ? (
                <div className="text-center p-10 opacity-50">কোনো পেমেন্ট হিস্টোরি পাওয়া যায়নি</div>
              ) : (
                allPayments.map((p, idx) => (
                  <div 
                    key={`payment-${idx}-${p.date}`} 
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
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-emerald-500">৳{p.amount}</div>
                      <button 
                        onClick={() => handleDownloadSingleTransaction(p)}
                        className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 hover:bg-emerald-100 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Floating Buttons */}
            {allPayments.length > 0 && (
              <div className="fixed bottom-8 right-8 z-[3000] flex flex-col gap-4">
                <motion.button 
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsFilterOpen(true)}
                  className="w-14 h-14 bg-slate-800 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:bg-slate-900 group"
                  title="Filter History"
                >
                  <Filter className="w-6 h-6" />
                </motion.button>
                <motion.button 
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDownloadFullHistory}
                  className="w-16 h-16 bg-emerald-500 text-white rounded-full shadow-2xl shadow-emerald-500/40 flex items-center justify-center transition-all hover:bg-emerald-600 group"
                  title="Download History as PDF"
                >
                  <Download className="w-7 h-7 group-hover:animate-bounce" />
                </motion.button>
              </div>
            )}
          </OverlayPage>
        )}

        {/* Filter Modal */}
        <AnimatePresence>
          {isFilterOpen && (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFilterOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className={cn(
                  "relative w-full max-w-sm p-6 rounded-3xl shadow-2xl z-10 border",
                  isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-100 text-slate-900"
                )}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">ফিল্টার করুন</h3>
                  <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold opacity-60 ml-1">শুরু তারিখ</label>
                    <input 
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className={cn(
                        "w-full h-12 px-4 rounded-xl border outline-none focus:border-emerald-500 transition-colors",
                        isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold opacity-60 ml-1">শেষ তারিখ</label>
                    <input 
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className={cn(
                        "w-full h-12 px-4 rounded-xl border outline-none focus:border-emerald-500 transition-colors",
                        isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                      )}
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      onClick={() => {
                        setFilterStartDate('');
                        setFilterEndDate('');
                      }}
                      className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold active:scale-95 transition-transform"
                    >
                      রিসেট
                    </button>
                    <button 
                      onClick={() => {
                        handleDownloadFilteredHistory();
                        setIsFilterOpen(false);
                      }}
                      className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
                    >
                      ডাউনলোড PDF
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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

        {showGreetingsSettings && (isAdmin(currentUser) || isDeveloper(currentUser)) && (
          <OverlayPage key="greetings-settings-overlay" title="Greetings Settings" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <div className="space-y-6 pb-24">
              <div className="space-y-4">
                <h3 className="text-sm font-bold opacity-50 uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4" /> Edit Greetings & Wishes
                </h3>
                
                <div className={cn("p-4 rounded-2xl border space-y-6", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100")}>
                  <div className={cn("flex items-center justify-between p-3 rounded-xl border mb-2", isDarkMode ? "bg-slate-900/50 border-slate-700" : "bg-emerald-50 border-emerald-100")}>
                    <span className={cn("text-xs font-bold", isDarkMode ? "text-emerald-400" : "text-emerald-700")}>সিস্টেমের বর্তমান সময়:</span>
                    <span className={cn("text-xs font-bold", isDarkMode ? "text-emerald-400" : "text-emerald-700")}>
                      {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </span>
                  </div>

                  {/* Morning */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">সকাল</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] opacity-50">শুরু:</span>
                          <div className={cn("flex items-center border rounded overflow-hidden", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}>
                            <input 
                              type="number" min="1" max="12"
                              value={greetingsData.morning.startHour ?? 1}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 1 : parseInt(e.target.value);
                                setGreetingsData({...greetingsData, morning: {...greetingsData.morning, startHour: isNaN(val) ? 1 : val}});
                              }}
                              className={cn("w-10 p-1 text-[10px] text-center bg-transparent outline-none", isDarkMode ? "text-white" : "text-slate-900")}
                            />
                            <select 
                              value={greetingsData.morning.startPeriod}
                              onChange={(e) => setGreetingsData({...greetingsData, morning: {...greetingsData.morning, startPeriod: e.target.value}})}
                              className="text-[10px] bg-emerald-500 text-white p-1 outline-none cursor-pointer"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] opacity-50">শেষ:</span>
                          <div className={cn("flex items-center border rounded overflow-hidden", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}>
                            <input 
                              type="number" min="1" max="12"
                              value={greetingsData.morning.endHour ?? 1}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 1 : parseInt(e.target.value);
                                setGreetingsData({...greetingsData, morning: {...greetingsData.morning, endHour: isNaN(val) ? 1 : val}});
                              }}
                              className={cn("w-10 p-1 text-[10px] text-center bg-transparent outline-none", isDarkMode ? "text-white" : "text-slate-900")}
                            />
                            <select 
                              value={greetingsData.morning.endPeriod}
                              onChange={(e) => setGreetingsData({...greetingsData, morning: {...greetingsData.morning, endPeriod: e.target.value}})}
                              className="text-[10px] bg-emerald-500 text-white p-1 outline-none cursor-pointer"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <input 
                        type="text" 
                        value={greetingsData.morning.main}
                        onChange={(e) => setGreetingsData({...greetingsData, morning: {...greetingsData.morning, main: e.target.value}})}
                        placeholder="Main Greeting"
                        className={cn("w-full p-3 rounded-xl border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      />
                      <input 
                        type="text" 
                        value={greetingsData.morning.sub}
                        onChange={(e) => setGreetingsData({...greetingsData, morning: {...greetingsData.morning, sub: e.target.value}})}
                        placeholder="Sub Wish"
                        className={cn("w-full p-3 rounded-xl border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      />
                    </div>
                  </div>

                  {/* Afternoon */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">দুপুর</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] opacity-50">শুরু:</span>
                          <div className={cn("flex items-center border rounded overflow-hidden", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}>
                            <input 
                              type="number" min="1" max="12"
                              value={greetingsData.afternoon.startHour ?? 1}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 1 : parseInt(e.target.value);
                                setGreetingsData({...greetingsData, afternoon: {...greetingsData.afternoon, startHour: isNaN(val) ? 1 : val}});
                              }}
                              className={cn("w-10 p-1 text-[10px] text-center bg-transparent outline-none", isDarkMode ? "text-white" : "text-slate-900")}
                            />
                            <select 
                              value={greetingsData.afternoon.startPeriod}
                              onChange={(e) => setGreetingsData({...greetingsData, afternoon: {...greetingsData.afternoon, startPeriod: e.target.value}})}
                              className="text-[10px] bg-emerald-500 text-white p-1 outline-none cursor-pointer"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] opacity-50">শেষ:</span>
                          <div className={cn("flex items-center border rounded overflow-hidden", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}>
                            <input 
                              type="number" min="1" max="12"
                              value={greetingsData.afternoon.endHour ?? 1}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 1 : parseInt(e.target.value);
                                setGreetingsData({...greetingsData, afternoon: {...greetingsData.afternoon, endHour: isNaN(val) ? 1 : val}});
                              }}
                              className={cn("w-10 p-1 text-[10px] text-center bg-transparent outline-none", isDarkMode ? "text-white" : "text-slate-900")}
                            />
                            <select 
                              value={greetingsData.afternoon.endPeriod}
                              onChange={(e) => setGreetingsData({...greetingsData, afternoon: {...greetingsData.afternoon, endPeriod: e.target.value}})}
                              className="text-[10px] bg-emerald-500 text-white p-1 outline-none cursor-pointer"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <input 
                        type="text" 
                        value={greetingsData.afternoon.main}
                        onChange={(e) => setGreetingsData({...greetingsData, afternoon: {...greetingsData.afternoon, main: e.target.value}})}
                        placeholder="Main Greeting"
                        className={cn("w-full p-3 rounded-xl border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      />
                      <input 
                        type="text" 
                        value={greetingsData.afternoon.sub}
                        onChange={(e) => setGreetingsData({...greetingsData, afternoon: {...greetingsData.afternoon, sub: e.target.value}})}
                        placeholder="Sub Wish"
                        className={cn("w-full p-3 rounded-xl border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      />
                    </div>
                  </div>

                  {/* Evening */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">বিকেল</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] opacity-50">শুরু:</span>
                          <div className={cn("flex items-center border rounded overflow-hidden", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}>
                            <input 
                              type="number" min="1" max="12"
                              value={greetingsData.evening.startHour ?? 1}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 1 : parseInt(e.target.value);
                                setGreetingsData({...greetingsData, evening: {...greetingsData.evening, startHour: isNaN(val) ? 1 : val}});
                              }}
                              className={cn("w-10 p-1 text-[10px] text-center bg-transparent outline-none", isDarkMode ? "text-white" : "text-slate-900")}
                            />
                            <select 
                              value={greetingsData.evening.startPeriod}
                              onChange={(e) => setGreetingsData({...greetingsData, evening: {...greetingsData.evening, startPeriod: e.target.value}})}
                              className="text-[10px] bg-emerald-500 text-white p-1 outline-none cursor-pointer"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] opacity-50">শেষ:</span>
                          <div className={cn("flex items-center border rounded overflow-hidden", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}>
                            <input 
                              type="number" min="1" max="12"
                              value={greetingsData.evening.endHour ?? 1}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 1 : parseInt(e.target.value);
                                setGreetingsData({...greetingsData, evening: {...greetingsData.evening, endHour: isNaN(val) ? 1 : val}});
                              }}
                              className={cn("w-10 p-1 text-[10px] text-center bg-transparent outline-none", isDarkMode ? "text-white" : "text-slate-900")}
                            />
                            <select 
                              value={greetingsData.evening.endPeriod}
                              onChange={(e) => setGreetingsData({...greetingsData, evening: {...greetingsData.evening, endPeriod: e.target.value}})}
                              className="text-[10px] bg-emerald-500 text-white p-1 outline-none cursor-pointer"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <input 
                        type="text" 
                        value={greetingsData.evening.main}
                        onChange={(e) => setGreetingsData({...greetingsData, evening: {...greetingsData.evening, main: e.target.value}})}
                        placeholder="Main Greeting"
                        className={cn("w-full p-3 rounded-xl border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      />
                      <input 
                        type="text" 
                        value={greetingsData.evening.sub}
                        onChange={(e) => setGreetingsData({...greetingsData, evening: {...greetingsData.evening, sub: e.target.value}})}
                        placeholder="Sub Wish"
                        className={cn("w-full p-3 rounded-xl border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      />
                    </div>
                  </div>

                  {/* Night */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">সন্ধ্যা</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] opacity-50">শুরু:</span>
                          <div className={cn("flex items-center border rounded overflow-hidden", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}>
                            <input 
                              type="number" min="1" max="12"
                              value={greetingsData.night.startHour ?? 1}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 1 : parseInt(e.target.value);
                                setGreetingsData({...greetingsData, night: {...greetingsData.night, startHour: isNaN(val) ? 1 : val}});
                              }}
                              className={cn("w-10 p-1 text-[10px] text-center bg-transparent outline-none", isDarkMode ? "text-white" : "text-slate-900")}
                            />
                            <select 
                              value={greetingsData.night.startPeriod}
                              onChange={(e) => setGreetingsData({...greetingsData, night: {...greetingsData.night, startPeriod: e.target.value}})}
                              className="text-[10px] bg-emerald-500 text-white p-1 outline-none cursor-pointer"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] opacity-50">শেষ:</span>
                          <div className={cn("flex items-center border rounded overflow-hidden", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}>
                            <input 
                              type="number" min="1" max="12"
                              value={greetingsData.night.endHour ?? 1}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 1 : parseInt(e.target.value);
                                setGreetingsData({...greetingsData, night: {...greetingsData.night, endHour: isNaN(val) ? 1 : val}});
                              }}
                              className={cn("w-10 p-1 text-[10px] text-center bg-transparent outline-none", isDarkMode ? "text-white" : "text-slate-900")}
                            />
                            <select 
                              value={greetingsData.night.endPeriod}
                              onChange={(e) => setGreetingsData({...greetingsData, night: {...greetingsData.night, endPeriod: e.target.value}})}
                              className="text-[10px] bg-emerald-500 text-white p-1 outline-none cursor-pointer"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <input 
                        type="text" 
                        value={greetingsData.night.main}
                        onChange={(e) => setGreetingsData({...greetingsData, night: {...greetingsData.night, main: e.target.value}})}
                        placeholder="Main Greeting"
                        className={cn("w-full p-3 rounded-xl border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      />
                      <input 
                        type="text" 
                        value={greetingsData.night.sub}
                        onChange={(e) => setGreetingsData({...greetingsData, night: {...greetingsData.night, sub: e.target.value}})}
                        placeholder="Sub Wish"
                        className={cn("w-full p-3 rounded-xl border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      />
                    </div>
                  </div>

                  {/* Late Night */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">রাত</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] opacity-50">শুরু:</span>
                          <div className={cn("flex items-center border rounded overflow-hidden", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}>
                            <input 
                              type="number" min="1" max="12"
                              value={greetingsData.lateNight.startHour ?? 1}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 1 : parseInt(e.target.value);
                                setGreetingsData({...greetingsData, lateNight: {...greetingsData.lateNight, startHour: isNaN(val) ? 1 : val}});
                              }}
                              className={cn("w-10 p-1 text-[10px] text-center bg-transparent outline-none", isDarkMode ? "text-white" : "text-slate-900")}
                            />
                            <select 
                              value={greetingsData.lateNight.startPeriod}
                              onChange={(e) => setGreetingsData({...greetingsData, lateNight: {...greetingsData.lateNight, startPeriod: e.target.value}})}
                              className="text-[10px] bg-emerald-500 text-white p-1 outline-none cursor-pointer"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] opacity-50">শেষ:</span>
                          <div className={cn("flex items-center border rounded overflow-hidden", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}>
                            <input 
                              type="number" min="1" max="12"
                              value={greetingsData.lateNight.endHour ?? 1}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 1 : parseInt(e.target.value);
                                setGreetingsData({...greetingsData, lateNight: {...greetingsData.lateNight, endHour: isNaN(val) ? 1 : val}});
                              }}
                              className={cn("w-10 p-1 text-[10px] text-center bg-transparent outline-none", isDarkMode ? "text-white" : "text-slate-900")}
                            />
                            <select 
                              value={greetingsData.lateNight.endPeriod}
                              onChange={(e) => setGreetingsData({...greetingsData, lateNight: {...greetingsData.lateNight, endPeriod: e.target.value}})}
                              className="text-[10px] bg-emerald-500 text-white p-1 outline-none cursor-pointer"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <input 
                        type="text" 
                        value={greetingsData.lateNight.main}
                        onChange={(e) => setGreetingsData({...greetingsData, lateNight: {...greetingsData.lateNight, main: e.target.value}})}
                        placeholder="Main Greeting"
                        className={cn("w-full p-3 rounded-xl border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      />
                      <input 
                        type="text" 
                        value={greetingsData.lateNight.sub}
                        onChange={(e) => setGreetingsData({...greetingsData, lateNight: {...greetingsData.lateNight, sub: e.target.value}})}
                        placeholder="Sub Wish"
                        className={cn("w-full p-3 rounded-xl border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Save Button */}
            <div className="absolute bottom-6 left-6 right-6">
              <button 
                onClick={handleSaveGreetings}
                disabled={isSavingSettings}
                className="w-full h-14 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSavingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Greetings
              </button>
            </div>
          </OverlayPage>
        )}

        {showAdvanceSettings && isDeveloper(currentUser) && (
          <OverlayPage key="advance-settings-overlay" title="Advance Settings" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <div className="space-y-6 pb-24">
              {/* PDF Settings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold opacity-50 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4" /> PDF Customization
                  </h3>
                  <button 
                    onClick={() => setShowPdfPreview(!showPdfPreview)}
                    className="text-xs font-bold text-emerald-500 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full"
                  >
                    {showPdfPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showPdfPreview ? 'Hide Preview' : 'Live Preview'}
                  </button>
                </div>

                {showPdfPreview && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-6 rounded-2xl border shadow-inner mb-4 overflow-hidden",
                      isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"
                    )}
                    style={{ fontSize: `${advanceSettings.pdfFontSize * 0.6}px` }}
                  >
                    <div className={cn(
                      "bg-white text-slate-900 p-4 rounded shadow-sm min-h-[300px] flex flex-col transition-all duration-300",
                      advanceSettings.pdfTemplate === 'elegant' && "font-serif",
                      advanceSettings.pdfTemplate === 'modern' && "items-center text-center",
                      advanceSettings.pdfTemplate === 'compact' && "p-2"
                    )}>
                      <div className={cn(
                        "flex justify-between items-center border-b pb-2 mb-4 w-full",
                        advanceSettings.pdfTemplate === 'modern' && "flex-col border-none gap-2",
                        advanceSettings.pdfTemplate === 'elegant' && "flex-col border-b-2",
                        advanceSettings.pdfTemplate === 'professional' && "bg-slate-900 text-white p-4 rounded-lg border-none mb-6",
                        advanceSettings.pdfTemplate === 'minimal' && "border-none mb-8"
                      )} style={{ borderColor: advanceSettings.pdfHeaderColor, backgroundColor: advanceSettings.pdfTemplate === 'professional' ? advanceSettings.pdfHeaderColor : undefined }}>
                        <div className={cn(advanceSettings.pdfTemplate === 'modern' && "text-center")}>
                          <h4 className="font-bold m-0" style={{ color: advanceSettings.pdfTemplate === 'professional' ? 'white' : advanceSettings.pdfHeaderColor, fontSize: '1.2em' }}>{advanceSettings.pdfHeaderText}</h4>
                          <p className="text-[0.7em] opacity-60">{advanceSettings.pdfLabelSubTitle}</p>
                        </div>
                        <div className={cn("text-right", advanceSettings.pdfTemplate === 'modern' && "text-center")}>
                          <p className="font-bold" style={{ color: advanceSettings.pdfTemplate === 'professional' ? 'white' : advanceSettings.pdfBrandColor, fontSize: `${advanceSettings.pdfBrandFontSize * 0.05}em` }}>{advanceSettings.pdfBrandText}</p>
                          <p className="text-[0.6em] opacity-50">{new Date().toLocaleDateString('bn-BD')}</p>
                        </div>
                      </div>

                      <div className={cn(
                        "bg-slate-50 p-2 rounded mb-4 space-y-1 w-full",
                        advanceSettings.pdfTemplate === 'modern' && "grid grid-cols-2 gap-2 bg-emerald-50 border border-emerald-100",
                        advanceSettings.pdfTemplate === 'professional' && "border-l-4 rounded-l-none",
                        advanceSettings.pdfTemplate === 'minimal' && "bg-transparent p-0 border-none",
                        advanceSettings.pdfTemplate === 'elegant' && "bg-transparent border-b-2 border-double rounded-none px-0"
                      )} style={{ borderLeftColor: advanceSettings.pdfTemplate === 'professional' ? advanceSettings.pdfHeaderColor : undefined }}>
                        <p className="text-[0.7em]"><strong>{advanceSettings.pdfLabelMemberName}:</strong> John Doe</p>
                        <p className="text-[0.7em]"><strong>{advanceSettings.pdfLabelMemberId}:</strong> SF-001</p>
                      </div>

                      <table className={cn(
                        "w-full text-[0.7em] border-collapse",
                        advanceSettings.pdfTemplate === 'modern' && "border rounded-lg overflow-hidden"
                      )}>
                        <thead>
                          <tr style={{ background: advanceSettings.pdfTemplate === 'minimal' || advanceSettings.pdfTemplate === 'elegant' ? 'transparent' : advanceSettings.pdfTableHeadBg, color: advanceSettings.pdfTemplate === 'minimal' || advanceSettings.pdfTemplate === 'elegant' ? '#1e293b' : advanceSettings.pdfTableHeadText }}>
                            <th className={cn("p-1 text-left", (advanceSettings.pdfTemplate === 'minimal' || advanceSettings.pdfTemplate === 'elegant') && "border-b-2 border-slate-900")}>{advanceSettings.pdfLabelDate}</th>
                            <th className={cn("p-1 text-left", (advanceSettings.pdfTemplate === 'minimal' || advanceSettings.pdfTemplate === 'elegant') && "border-b-2 border-slate-900")}>{advanceSettings.pdfLabelReason}</th>
                            <th className={cn("p-1 text-right", (advanceSettings.pdfTemplate === 'minimal' || advanceSettings.pdfTemplate === 'elegant') && "border-b-2 border-slate-900")}>{advanceSettings.pdfLabelAmount}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-1">01/01/2024</td>
                            <td className="p-1">Monthly Fee</td>
                            <td className="p-1 text-right font-bold" style={{ color: advanceSettings.theme.button }}>৳500</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="mt-auto pt-4 text-right">
                        <p className="font-bold">{advanceSettings.pdfLabelTotal}: <span style={{ color: advanceSettings.theme.button }}>৳500</span></p>
                      </div>

                      <div className={cn(
                        "mt-4 pt-2 border-t text-center text-[0.6em] opacity-40",
                        advanceSettings.pdfTemplate === 'minimal' && "border-none"
                      )}>
                        <p>{advanceSettings.pdfFooterText}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className={cn("p-4 rounded-2xl border space-y-4", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100")}>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[10px] font-bold opacity-60 block mb-1 uppercase">Header Text</label>
                      <input 
                        type="text" 
                        value={advanceSettings.pdfHeaderText}
                        onChange={(e) => setAdvanceSettings({...advanceSettings, pdfHeaderText: e.target.value})}
                        className={cn("w-full p-2 rounded-lg border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold opacity-60 block mb-1 uppercase">Sub-Title Text</label>
                      <input 
                        type="text" 
                        value={advanceSettings.pdfLabelSubTitle}
                        onChange={(e) => setAdvanceSettings({...advanceSettings, pdfLabelSubTitle: e.target.value})}
                        className={cn("w-full p-2 rounded-lg border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-bold opacity-60 block mb-1 uppercase">Brand Text</label>
                        <input 
                          type="text" 
                          value={advanceSettings.pdfBrandText}
                          onChange={(e) => setAdvanceSettings({...advanceSettings, pdfBrandText: e.target.value})}
                          className={cn("w-full p-2 rounded-lg border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold opacity-60 block mb-1 uppercase">Brand Size</label>
                        <input 
                          type="number" 
                          value={advanceSettings.pdfBrandFontSize}
                          onChange={(e) => setAdvanceSettings({...advanceSettings, pdfBrandFontSize: parseInt(e.target.value)})}
                          className={cn("w-full p-2 rounded-lg border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold opacity-60 block mb-1 uppercase">Brand Color</label>
                        <div className="flex gap-2">
                          <input 
                            type="color" 
                            value={advanceSettings.pdfBrandColor}
                            onChange={(e) => setAdvanceSettings({...advanceSettings, pdfBrandColor: e.target.value})}
                            className="w-10 h-9 p-0 border-0 bg-transparent cursor-pointer"
                          />
                          <input 
                            type="text" 
                            value={advanceSettings.pdfBrandColor}
                            onChange={(e) => setAdvanceSettings({...advanceSettings, pdfBrandColor: e.target.value})}
                            className={cn("flex-1 p-2 rounded-lg border text-[10px] font-mono uppercase", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold opacity-60 block mb-1 uppercase">Footer Text</label>
                      <textarea 
                        value={advanceSettings.pdfFooterText}
                        onChange={(e) => setAdvanceSettings({...advanceSettings, pdfFooterText: e.target.value})}
                        className={cn("w-full p-2 rounded-lg border text-sm h-20", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold opacity-60 block mb-1 uppercase">Template</label>
                      <select 
                        value={advanceSettings.pdfTemplate}
                        onChange={(e) => setAdvanceSettings({...advanceSettings, pdfTemplate: e.target.value})}
                        className={cn("w-full p-2 rounded-lg border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      >
                        <option value="default">Default</option>
                        <option value="modern">Modern</option>
                        <option value="compact">Compact</option>
                        <option value="elegant">Elegant</option>
                        <option value="professional">Professional</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold opacity-60 block mb-1 uppercase">Font Size (px)</label>
                      <input 
                        type="number" 
                        value={advanceSettings.pdfFontSize}
                        onChange={(e) => setAdvanceSettings({...advanceSettings, pdfFontSize: parseInt(e.target.value)})}
                        className={cn("w-full p-2 rounded-lg border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold opacity-60 block mb-1 uppercase">Header Color</label>
                      <input 
                        type="color" 
                        value={advanceSettings.pdfHeaderColor}
                        onChange={(e) => setAdvanceSettings({...advanceSettings, pdfHeaderColor: e.target.value})}
                        className="w-full h-10 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold opacity-60 block mb-1 uppercase">Table Head Bg</label>
                      <input 
                        type="color" 
                        value={advanceSettings.pdfTableHeadBg}
                        onChange={(e) => setAdvanceSettings({...advanceSettings, pdfTableHeadBg: e.target.value})}
                        className="w-full h-10 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold opacity-60 block mb-1 uppercase">Table Head Text</label>
                      <input 
                        type="color" 
                        value={advanceSettings.pdfTableHeadText}
                        onChange={(e) => setAdvanceSettings({...advanceSettings, pdfTableHeadText: e.target.value})}
                        className="w-full h-10 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold opacity-60 block uppercase border-b pb-1">PDF Labels (Edit All Text)</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Member Name', key: 'pdfLabelMemberName' },
                        { label: 'Member ID', key: 'pdfLabelMemberId' },
                        { label: 'Area', key: 'pdfLabelArea' },
                        { label: 'Designation', key: 'pdfLabelDesignation' },
                        { label: 'Date', key: 'pdfLabelDate' },
                        { label: 'Reason', key: 'pdfLabelReason' },
                        { label: 'Amount', key: 'pdfLabelAmount' },
                        { label: 'Total', key: 'pdfLabelTotal' },
                        { label: 'Invoice Title', key: 'pdfLabelInvoiceTitle' }
                      ].map((item) => (
                        <div key={item.key}>
                          <label className="text-[9px] font-bold opacity-40 block mb-0.5 uppercase">{item.label}</label>
                          <input 
                            type="text" 
                            value={(advanceSettings as any)[item.key]}
                            onChange={(e) => setAdvanceSettings({...advanceSettings, [item.key]: e.target.value})}
                            className={cn("w-full p-2 rounded-lg border text-xs", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Settings */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold opacity-50 uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Theme Change
                </h3>
                <div className={cn("p-4 rounded-2xl border space-y-4", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100")}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold opacity-60 block mb-1 uppercase">Background</label>
                      <input 
                        type="color" 
                        value={advanceSettings.theme.background}
                        onChange={(e) => setAdvanceSettings({...advanceSettings, theme: {...advanceSettings.theme, background: e.target.value}})}
                        className="w-full h-10 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold opacity-60 block mb-1 uppercase">Text Color</label>
                      <input 
                        type="color" 
                        value={advanceSettings.theme.text}
                        onChange={(e) => setAdvanceSettings({...advanceSettings, theme: {...advanceSettings.theme, text: e.target.value}})}
                        className="w-full h-10 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold opacity-60 block mb-1 uppercase">Button Color</label>
                      <input 
                        type="color" 
                        value={advanceSettings.theme.button}
                        onChange={(e) => setAdvanceSettings({...advanceSettings, theme: {...advanceSettings.theme, button: e.target.value}})}
                        className="w-full h-10 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold opacity-60 block mb-1 uppercase">Button Text</label>
                      <input 
                        type="color" 
                        value={advanceSettings.theme.buttonText}
                        onChange={(e) => setAdvanceSettings({...advanceSettings, theme: {...advanceSettings.theme, buttonText: e.target.value}})}
                        className="w-full h-10 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab & Options Name Change */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold opacity-50 uppercase tracking-wider flex items-center gap-2">
                  <Layout className="w-4 h-4" /> Tab & Options Name
                </h3>
                <div className={cn("p-4 rounded-2xl border space-y-4", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100")}>
                  <div className="space-y-3">
                    <label className="text-xs font-bold opacity-60 block uppercase">Tabs</label>
                    {Object.entries(advanceSettings.tabNames).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold opacity-40 w-16 uppercase">{key}</span>
                        <input 
                          type="text" 
                          value={value}
                          onChange={(e) => setAdvanceSettings({
                            ...advanceSettings, 
                            tabNames: {...advanceSettings.tabNames, [key]: e.target.value}
                          })}
                          className={cn("flex-1 p-2 rounded-lg border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold opacity-50 uppercase tracking-wider flex items-center gap-2">
                  <ToggleLeft className="w-4 h-4" /> Options Control
                </h3>
                <div className={cn("p-4 rounded-2xl border space-y-6", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100")}>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-emerald-500 block uppercase">Admin Controls</label>
                    {Object.entries(advanceSettings.controls.admin).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{key}</span>
                        <button 
                          onClick={() => setAdvanceSettings({
                            ...advanceSettings,
                            controls: {
                              ...advanceSettings.controls,
                              admin: {...advanceSettings.controls.admin, [key]: !value}
                            }
                          })}
                          className={cn("w-10 h-5 rounded-full relative transition-colors", value ? "bg-emerald-500" : "bg-slate-300")}
                        >
                          <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", value ? "right-1" : "left-1")} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-amber-500 block uppercase">Member Controls</label>
                    {Object.entries(advanceSettings.controls.member).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{key}</span>
                        <button 
                          onClick={() => setAdvanceSettings({
                            ...advanceSettings,
                            controls: {
                              ...advanceSettings.controls,
                              member: {...advanceSettings.controls.member, [key]: !value}
                            }
                          })}
                          className={cn("w-10 h-5 rounded-full relative transition-colors", value ? "bg-emerald-500" : "bg-slate-300")}
                        >
                          <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", value ? "right-1" : "left-1")} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform disabled:opacity-50"
                >
                  {isSavingSettings ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Global Settings
                </button>
                <p className="text-[10px] text-center mt-2 opacity-40">
                  Saving will update settings for all members immediately.
                </p>
              </div>
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

              {(isAdmin(currentUser) || isDeveloper(currentUser)) && (
                <div className={cn(
                  "p-4 rounded-2xl border mb-4 space-y-4",
                  isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-emerald-50/30 border-emerald-100"
                )}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">অ্যাডমিন টুলস</h4>
                    <button 
                      onClick={() => {
                        const projectTransactions = donationTransactions.filter(t => t.projectName === selectedDonationProject.name);
                        const filtered = projectTransactions.filter(t => {
                          if (!donationFilterStartDate && !donationFilterEndDate) return true;
                          const tDate = parseDate(t.date);
                          if (!tDate) return true;
                          const start = donationFilterStartDate ? new Date(donationFilterStartDate) : null;
                          const end = donationFilterEndDate ? new Date(donationFilterEndDate) : null;
                          if (start) start.setHours(0, 0, 0, 0);
                          if (end) end.setHours(23, 59, 59, 999);
                          return (!start || tDate >= start) && (!end || tDate <= end);
                        });
                        const content = generateDonationPDFContent(selectedDonationProject, filtered);
                        downloadAsPDF(content, `Donation_${selectedDonationProject.name}`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold active:scale-95 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF রিপোর্ট
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold opacity-50 uppercase flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" /> শুরুর তারিখ
                      </label>
                      <input 
                        type="date" 
                        value={donationFilterStartDate}
                        onChange={(e) => setDonationFilterStartDate(e.target.value)}
                        className={cn(
                          "w-full p-2 rounded-lg border text-xs",
                          isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                        )}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold opacity-50 uppercase flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" /> শেষ তারিখ
                      </label>
                      <input 
                        type="date" 
                        value={donationFilterEndDate}
                        onChange={(e) => setDonationFilterEndDate(e.target.value)}
                        className={cn(
                          "w-full p-2 rounded-lg border text-xs",
                          isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                        )}
                      />
                    </div>
                  </div>
                  {(donationFilterStartDate || donationFilterEndDate) && (
                    <button 
                      onClick={() => {
                        setDonationFilterStartDate('');
                        setDonationFilterEndDate('');
                      }}
                      className="w-full py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      ফিল্টার মুছুন
                    </button>
                  )}
                </div>
              )}

              <h4 className="text-sm font-bold border-l-4 border-emerald-500 pl-3 py-1 mb-2">লেনদেন সমূহ</h4>
              
              {(() => {
                let projectTransactions = donationTransactions.filter(t => t.projectName === selectedDonationProject.name);
                
                // Apply filters
                if (donationFilterStartDate || donationFilterEndDate) {
                  projectTransactions = projectTransactions.filter(t => {
                    const tDate = parseDate(t.date);
                    if (!tDate) return true;
                    const start = donationFilterStartDate ? new Date(donationFilterStartDate) : null;
                    const end = donationFilterEndDate ? new Date(donationFilterEndDate) : null;
                    if (start) start.setHours(0, 0, 0, 0);
                    if (end) end.setHours(23, 59, 59, 999);
                    return (!start || tDate >= start) && (!end || tDate <= end);
                  });
                }

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
                        <div className="flex items-center gap-1">
                          <span className="block font-bold">{t.donorName || 'Anonymous'}</span>
                        </div>
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
          <OverlayPage key="borrowed-books-overlay" title="বই সংগ্রহ ও অনুরোধ" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <div className="space-y-6">
              {/* Tabs for Admin/Dev */}
              {(isAdmin(currentUser) || isDeveloper(currentUser)) && (
                <div className="flex gap-2 p-1 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-2xl border border-emerald-500/20 relative">
                  <button 
                    onClick={() => setActiveBorrowedTab('requests')} 
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all text-[10px] uppercase tracking-wider relative z-10",
                      activeBorrowedTab === 'requests' ? "text-white" : "text-emerald-500/60 hover:bg-emerald-500/5"
                    )}
                  >
                    {activeBorrowedTab === 'requests' && (
                      <motion.div 
                        layoutId="activeBorrowedTab"
                        className="absolute inset-0 bg-emerald-500 rounded-xl shadow-md"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-20">অনুরোধ</span>
                    {bookRequests.filter(r => r.status === 'pending').length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 z-30">
                        {bookRequests.filter(r => r.status === 'pending').length}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => setActiveBorrowedTab('history')} 
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all text-[10px] uppercase tracking-wider relative z-10",
                      activeBorrowedTab === 'history' ? "text-white" : "text-emerald-500/60 hover:bg-emerald-500/5"
                    )}
                  >
                    {activeBorrowedTab === 'history' && (
                      <motion.div 
                        layoutId="activeBorrowedTab"
                        className="absolute inset-0 bg-emerald-500 rounded-xl shadow-md"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-20">ইতিহাস</span>
                  </button>
                </div>
              )}

              {/* Tab Content */}
              <div className="space-y-4">
                {/* Member View: All in one list */}
                {!(isAdmin(currentUser) || isDeveloper(currentUser)) && (
                  <div className="space-y-6">
                    {/* Approved Books Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest px-1 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> আমার বই
                      </h3>
                      {(() => {
                        const sheetBooks = books.filter(b => b.recipientId === currentUser.id);
                        const approvedRequests = bookRequests.filter(r => r.requesterId === currentUser.id && r.status === 'approved');
                        
                        const allUserBooks = [
                          ...sheetBooks.map(b => ({ ...b, source: 'sheet' })),
                          ...approvedRequests.map(r => ({
                            id: r.bookId,
                            name: r.bookName,
                            author: r.bookAuthor,
                            date: r.approvedAt || r.requestDate,
                            returnableDate: r.dueDate || '',
                            recipientId: r.requesterId,
                            source: 'firestore'
                          }))
                        ];

                        if (allUserBooks.length === 0) {
                          return <div className="text-center p-6 opacity-50 text-sm italic">কোনো গৃহীত বই পাওয়া যায়নি</div>;
                        }

                        return allUserBooks.map((book, idx) => {
                          const borrowDate = parseDate(book.date);
                          const returnDate = parseDate(book.returnableDate);
                          
                          let progress = 0;
                          let isOverdue = false;
                          let timeText = '';

                          if (borrowDate && returnDate) {
                            const total = returnDate.getTime() - borrowDate.getTime();
                            const elapsed = currentTime.getTime() - borrowDate.getTime();
                            progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
                            isOverdue = currentTime > returnDate;

                            const diff = isOverdue 
                              ? currentTime.getTime() - returnDate.getTime()
                              : returnDate.getTime() - currentTime.getTime();
                            
                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                            timeText = `${toBengaliDigits(days)} দিন: ${toBengaliDigits(hours)} ঘন্টা: ${toBengaliDigits(minutes)} মিনিট: ${toBengaliDigits(seconds)} সেকেন্ড`;
                          }

                          return (
                            <div 
                              key={`user-book-${idx}-${book.name}`}
                              className="bg-emerald-500 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                              
                              <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex-1">
                                    <h4 className="text-lg font-bold leading-tight mb-1">{book.name}</h4>
                                    <p className="text-sm text-white/80 italic">{book.author}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-5">
                                  <div>
                                    <span className="block text-[10px] uppercase tracking-widest opacity-70 mb-1">গ্রহণ তারিখ</span>
                                    <span className="text-sm font-bold">{formatDate(book.date)}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="block text-[10px] uppercase tracking-widest opacity-70 mb-1">ফেরতযোগ্য তারিখ</span>
                                    <span className="text-sm font-bold">{formatDate(book.returnableDate)}</span>
                                  </div>
                                </div>

                                <div className="space-y-1 mb-2">
                                  <div className="flex flex-col gap-1">
                                    <span className={cn("text-[10px] uppercase tracking-widest font-bold", isOverdue ? "text-red-200" : "text-white/70")}>
                                      {isOverdue ? "সময় অতিবাহিত হয়েছে" : "সময় বাকি আছে"}
                                    </span>
                                    <span className={cn("text-sm font-bold", isOverdue ? "text-red-100" : "text-white")}>
                                      {timeText}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/10 overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  className={cn(
                                    "h-full transition-all duration-1000",
                                    isOverdue ? "bg-red-500" : "bg-white",
                                    (progress >= 100 || isOverdue) ? "opacity-30" : "opacity-100"
                                  )}
                                />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Pending Requests Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest px-1 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" /> পেন্ডিং অনুরোধ
                      </h3>
                      {(() => {
                        const pendingRequests = bookRequests.filter(r => r.requesterId === currentUser.id && r.status === 'pending');
                        
                        if (pendingRequests.length === 0) {
                          return <div className="text-center p-6 opacity-50 text-sm italic">কোনো পেন্ডিং অনুরোধ নেই</div>;
                        }

                        return pendingRequests.map((req) => (
                          <div 
                            key={req.id} 
                            onMouseDown={() => handleLongPressStart('request', req)}
                            onMouseUp={handleLongPressEnd}
                            onMouseLeave={handleLongPressEnd}
                            onTouchStart={() => handleLongPressStart('request', req)}
                            onTouchEnd={handleLongPressEnd}
                            className={cn(
                              "p-4 rounded-2xl border flex items-center justify-between gap-4",
                              isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold truncate">{req.bookName}</h4>
                              <p className="text-xs opacity-60 truncate">{req.bookAuthor}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                                  পেন্ডিং
                                </span>
                                <span className="text-[10px] opacity-40">{formatDate(req.requestDate)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] opacity-50">অবস্থা</p>
                              <p className="text-xs font-bold text-amber-500">অপেক্ষমান</p>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Admin/Dev View: Tabs */}
                {activeBorrowedTab === 'requests' && (isAdmin(currentUser) || isDeveloper(currentUser)) && (
                  <div className="space-y-3">
                    {bookRequests.filter(r => r.status === 'pending').length === 0 ? (
                      <div className="text-center p-10 opacity-50">কোনো নতুন অনুরোধ নেই</div>
                    ) : (
                      bookRequests.filter(r => r.status === 'pending').map((req) => (
                        <div 
                          key={req.id}
                          onMouseDown={() => handleLongPressStart('request', req)}
                          onMouseUp={handleLongPressEnd}
                          onMouseLeave={handleLongPressEnd}
                          onTouchStart={() => handleLongPressStart('request', req)}
                          onTouchEnd={handleLongPressEnd}
                          className={cn(
                            "p-4 rounded-2xl border flex items-center justify-between gap-4",
                            isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold truncate">{req.bookName}</h4>
                            <p className="text-xs opacity-60 truncate">{req.requesterName} (ID: {req.requesterId})</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                                পেন্ডিং
                              </span>
                              <p className="text-[10px] opacity-40">{formatDate(req.requestDate)}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setSelectedBookRequest(req)}
                            className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
                          >
                            যাচাই করুন
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeBorrowedTab === 'history' && (isAdmin(currentUser) || isDeveloper(currentUser)) && (
                  <div className="space-y-3">
                    {(() => {
                      const filteredRequests = bookRequests.filter(r => r.status === 'approved' || r.status === 'rejected');

                      if (filteredRequests.length === 0) {
                        return <div className="text-center p-10 opacity-50">কোনো তথ্য পাওয়া যায়নি</div>;
                      }

                      return filteredRequests.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()).map((req) => (
                        <div 
                          key={req.id}
                          onMouseDown={() => handleLongPressStart('request', req)}
                          onMouseUp={handleLongPressEnd}
                          onMouseLeave={handleLongPressEnd}
                          onTouchStart={() => handleLongPressStart('request', req)}
                          onTouchEnd={handleLongPressEnd}
                          className={cn(
                            "p-4 rounded-2xl border flex items-center justify-between gap-4",
                            isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold truncate">{req.bookName}</h4>
                            <p className="text-xs opacity-60 truncate">{req.requesterName} (ID: {req.requesterId})</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                req.status === 'approved' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                              )}>
                                {req.status === 'approved' ? 'গৃহীত' : 'বাতিল'}
                              </span>
                              <span className="text-[10px] opacity-40">{formatDate(req.requestDate)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {req.status === 'approved' && (
                              <div className="text-right">
                                <p className="text-[10px] opacity-50">ফেরত তারিখ</p>
                                <p className="text-xs font-bold text-emerald-500">{formatDate(req.dueDate)}</p>
                              </div>
                            )}
                            <button 
                              onClick={() => setSelectedBookRequest(req)}
                              className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-emerald-500 hover:text-white transition-all"
                            >
                              বিস্তারিত
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          </OverlayPage>
        )}

        {selectedBookRequest && (
          <OverlayPage key="request-details-overlay" title="অনুরোধ যাচাই" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <div className="space-y-6">
              <div className={cn(
                "p-5 rounded-3xl border",
                isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
              )}>
                <h3 className="text-lg font-bold mb-4 border-b pb-2">বইয়ের তথ্য</h3>
                <div className="space-y-2">
                  <p className="text-sm"><span className="opacity-60">বইয়ের নাম:</span> <span className="font-bold">{selectedBookRequest.bookName}</span></p>
                  <p className="text-sm"><span className="opacity-60">লেখক:</span> <span className="font-bold">{selectedBookRequest.bookAuthor}</span></p>
                </div>
                
                <h3 className="text-lg font-bold mt-6 mb-4 border-b pb-2">সদস্যের তথ্য</h3>
                <div className="space-y-2">
                  <p className="text-sm"><span className="opacity-60">নাম:</span> <span className="font-bold">{selectedBookRequest.requesterName}</span></p>
                  <p className="text-sm"><span className="opacity-60">আইডি:</span> <span className="font-bold">{selectedBookRequest.requesterId}</span></p>
                  <p className="text-sm"><span className="opacity-60">ঠিকানা:</span> <span className="font-bold">{selectedBookRequest.requesterAddress}</span></p>
                </div>
              </div>

              {selectedBookRequest.status === 'pending' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold opacity-60 mb-2 uppercase tracking-widest">ফেরত দেওয়ার তারিখ নির্ধারণ করুন</label>
                    <input 
                      type="date" 
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={cn(
                        "w-full p-4 rounded-2xl border font-bold",
                        isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                      )}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => rejectBookRequest(selectedBookRequest.id)}
                      className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-transform"
                    >
                      বাতিল করুন
                    </button>
                    <button 
                      onClick={() => approveBookRequest(selectedBookRequest, dueDate)}
                      className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
                    >
                      অনুমোদন দিন
                    </button>
                  </div>
                </div>
              ) : selectedBookRequest.status === 'approved' ? (
                <div className="space-y-4">
                  <div className={cn(
                    "p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5",
                    isDarkMode ? "text-emerald-400" : "text-emerald-600"
                  )}>
                    <p className="text-sm font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> এই অনুরোধটি ইতিমধ্যে গ্রহণ করা হয়েছে।
                    </p>
                    <p className="text-xs opacity-80 mt-1">ফেরত দেওয়ার তারিখ: {formatDate(selectedBookRequest.dueDate)}</p>
                  </div>
                  <button 
                    onClick={() => returnBookRequest(selectedBookRequest.id)}
                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" /> বই ফেরত নিন (Return)
                  </button>
                </div>
              ) : null}
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
                  {selectedMemberProfile.photoId && !selectedMemberProfile.isNewSheet ? (
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
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-xl font-bold">{selectedMemberProfile.name}</h2>
                      {isVerifiedMember(selectedMemberProfile) && (
                        <BadgeCheck className="w-5 h-5 text-white fill-emerald-500" />
                      )}
                    </div>
                    {!selectedMemberProfile.isNewSheet && <p className="text-sm text-emerald-500 font-bold">{selectedMemberProfile.designation}</p>}
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
                    {!selectedMemberProfile.isNewSheet && (
                      <a 
                        href={`mailto:${selectedMemberProfile.email}`} 
                        className="w-12 h-12 flex items-center justify-center bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 active:scale-90 transition-all border-2 border-white/20"
                        title="Mail"
                      >
                        <Mail className="w-6 h-6" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Tab Navigation Buttons - Sticky with Active/Inactive Effect */}
                <div className="flex gap-2 p-1 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-2xl border border-emerald-500/20 relative">
                  <button 
                    onClick={() => setActiveProfileTab('info')} 
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all text-[10px] uppercase tracking-wider relative z-10",
                      activeProfileTab === 'info' ? "text-white" : "text-emerald-500/60 hover:text-emerald-500"
                    )}
                  >
                    {activeProfileTab === 'info' && (
                      <motion.div 
                        layoutId="activeProfileTab"
                        className="absolute inset-0 bg-emerald-500 rounded-xl shadow-md"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-20">Information</span>
                  </button>
                  <button 
                    onClick={() => setActiveProfileTab('payments')} 
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all text-[10px] uppercase tracking-wider relative z-10",
                      activeProfileTab === 'payments' ? "text-white" : "text-emerald-500/60 hover:text-emerald-500"
                    )}
                  >
                    {activeProfileTab === 'payments' && (
                      <motion.div 
                        layoutId="activeProfileTab"
                        className="absolute inset-0 bg-emerald-500 rounded-xl shadow-md"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-20">Payments</span>
                  </button>
                  <button 
                    onClick={() => setActiveProfileTab('books')} 
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all text-[10px] uppercase tracking-wider relative z-10",
                      activeProfileTab === 'books' ? "text-white" : "text-emerald-500/60 hover:text-emerald-500"
                    )}
                  >
                    {activeProfileTab === 'books' && (
                      <motion.div 
                        layoutId="activeProfileTab"
                        className="absolute inset-0 bg-emerald-500 rounded-xl shadow-md"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-20">Books</span>
                  </button>
                  {isSpecialMember(currentUser) && isSpecialMember(selectedMemberProfile) && (
                    <button 
                      onClick={() => setActiveProfileTab('database')} 
                      className={cn(
                        "flex-1 py-3 rounded-xl font-bold transition-all text-[10px] uppercase tracking-wider relative z-10",
                        activeProfileTab === 'database' ? "text-white" : "text-emerald-500/60 hover:text-emerald-500"
                      )}
                    >
                      {activeProfileTab === 'database' && (
                        <motion.div 
                          layoutId="activeProfileTab"
                          className="absolute inset-0 bg-emerald-500 rounded-xl shadow-md"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-20">Database</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tab Content */}
              <div className="space-y-4">
                {activeProfileTab === 'info' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-sm font-bold opacity-50 uppercase tracking-wider ml-1">ব্যক্তিগত তথ্য</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <div className={cn(
                        "p-4 rounded-xl border flex items-center justify-between",
                        isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                      )}>
                        <div>
                          <label className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold mb-1">আইডি</label>
                          <b className="text-base">{selectedMemberProfile.id}</b>
                        </div>
                        {isVerifiedMember(selectedMemberProfile) && <BadgeCheck className="w-5 h-5 text-white fill-emerald-500" />}
                      </div>
                      <InfoItem label="এলাকা" value={selectedMemberProfile.area} isDarkMode={isDarkMode} />
                      <InfoItem label="রক্তের গ্রুপ" value={selectedMemberProfile.bloodGroup} isDarkMode={isDarkMode} />
                      <InfoItem label="ফোন" value={selectedMemberProfile.phone} isDarkMode={isDarkMode} />
                      {!selectedMemberProfile.isNewSheet && <InfoItem label="ইমেইল" value={selectedMemberProfile.email} isDarkMode={isDarkMode} />}
                      {!selectedMemberProfile.isNewSheet && <InfoItem label="জন্ম তারিখ" value={formatDate(selectedMemberProfile.dob)} isDarkMode={isDarkMode} />}
                      <InfoItem label="যোগদানের তারিখ" value={selectedMemberProfile.joiningDate} isDarkMode={isDarkMode} />
                    </div>
                  </div>
                )}

                {activeProfileTab === 'payments' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-sm font-bold opacity-50 uppercase tracking-wider ml-1">পেমেন্ট হিস্টোরি</h3>
                    {isProfileLoading ? (
                      <div className="text-center p-4">লোড হচ্ছে...</div>
                    ) : allMemberProfilePayments.length === 0 ? (
                      <div className={cn("p-4 rounded-xl border text-center opacity-50", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100")}>কোনো পেমেন্ট হিস্টোরি পাওয়া যায়নি</div>
                    ) : (
                      <div className="space-y-2">
                        {allMemberProfilePayments.map((p, idx) => (
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

                {activeProfileTab === 'database' && isSpecialMember(currentUser) && isSpecialMember(selectedMemberProfile) && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold opacity-50 uppercase tracking-wider ml-1">Database Management</h3>
                      {currentUser.id === selectedMemberProfile.id && (
                        <button 
                          onClick={() => setShowDatabasePage(true)}
                          className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"
                        >
                          <Settings className="w-3 h-3" />
                          ম্যানেজ করুন
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {adminDatabaseLinks.length === 0 ? (
                        <div className="text-center py-6 opacity-50 text-xs">কোনো সংরক্ষিত লিংক নেই</div>
                      ) : (
                        adminDatabaseLinks.map((link) => (
                          <div 
                            key={`prof-db-link-${link.id}`} 
                            className={cn(
                              "p-4 rounded-2xl border flex flex-col gap-3 transition-all",
                              isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <Database className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate">{link.name}</h4>
                                <p className="text-[10px] opacity-60 line-clamp-1">{link.description || 'কোনো বর্ণনা নেই'}</p>
                              </div>
                            </div>
                            <a 
                              href={getSheetUrl(link.sheetId)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                            >
                              <ExternalLink className="w-4 h-4" />
                              শীট ওপেন করুন
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </OverlayPage>
        )}

        {showTicTacToe && (
          <OverlayPage key="tictactoe-overlay" title="TicTacToe Game" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <TicTacToeGame isDarkMode={isDarkMode} allMembers={allMembers} isAuthReady={isAuthReady} />
          </OverlayPage>
        )}

        {showDatabasePage && isSpecialMember(currentUser) && (
          <OverlayPage key="database-overlay" title="Database Management" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <div className="space-y-6 pb-10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold opacity-50 uppercase tracking-wider">আপনার সংরক্ষিত লিংকসমূহ</h3>
              </div>

              <AnimatePresence mode="wait">
              {(isAddingLink || editingLink) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className={cn(
                    "p-4 rounded-2xl border space-y-4",
                    isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200 shadow-xl"
                  )}
                >
                  <h4 className="font-bold text-sm">{editingLink ? 'লিংক ইডিট করুন' : 'নতুন লিংক যুক্ত করুন'}</h4>
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="লিংকের নাম (যেমন: মেম্বার শীট)" 
                      className={cn("w-full p-3 rounded-xl border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      value={newLinkName}
                      onChange={(e) => setNewLinkName(e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="গুগল শীট আইডি বা ফুল লিংক" 
                      className={cn("w-full p-3 rounded-xl border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      value={newLinkSheetId}
                      onChange={(e) => setNewLinkSheetId(e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="সংক্ষিপ্ত বর্ণনা (ঐচ্ছিক)" 
                      className={cn("w-full p-3 rounded-xl border text-sm", isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200")}
                      value={newLinkDesc}
                      onChange={(e) => setNewLinkDesc(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        if (!newLinkName || !newLinkSheetId || !currentUser?.id) return;
                        if (editingLink) {
                          await handleUpdateAdminLink(editingLink.id, newLinkName, newLinkSheetId, newLinkDesc);
                        } else {
                          await handleAddAdminLink(newLinkName, newLinkSheetId, newLinkDesc);
                        }
                        setIsAddingLink(false);
                        setEditingLink(null);
                        setNewLinkName('');
                        setNewLinkSheetId('');
                        setNewLinkDesc('');
                      }}
                      className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold active:scale-95 transition-all"
                    >
                      সংরক্ষণ করুন
                    </button>
                    <button 
                      onClick={() => {
                        setIsAddingLink(false);
                        setEditingLink(null);
                      }}
                      className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold"
                    >
                      বাতিল
                    </button>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>

              <div className="grid grid-cols-1 gap-3">
                {adminDatabaseLinks.length === 0 ? (
                  <div className="text-center py-10 opacity-50 flex flex-col items-center gap-3">
                    <Database className="w-12 h-12 opacity-20" />
                    <p className="text-sm">আপনার কোনো সংরক্ষিত লিংক নেই।</p>
                  </div>
                ) : (
                  adminDatabaseLinks.map((link) => (
                    <div 
                      key={link.id} 
                      className={cn(
                        "p-4 rounded-2xl border flex flex-col gap-3 transition-all",
                        isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Database className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate">{link.name}</h4>
                            <p className="text-[10px] opacity-60 line-clamp-1">{link.description || 'কোনো বর্ণনা নেই'}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => {
                              setEditingLink(link);
                              setNewLinkName(link.name);
                              setNewLinkSheetId(link.sheetId);
                              setNewLinkDesc(link.description);
                              setIsAddingLink(false);
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setLongPressedItem({ type: 'request', data: { id: link.id, name: link.name, isLink: true } });
                            }}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <a 
                        href={getSheetUrl(link.sheetId)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                      >
                        <ExternalLink className="w-4 h-4" />
                        শীট ওপেন করুন
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Floating Action Button */}
            <button 
              onClick={() => {
                setIsAddingLink(true);
                setEditingLink(null);
                setNewLinkName('');
                setNewLinkSheetId('');
                setNewLinkDesc('');
              }}
              className="fixed bottom-8 right-6 w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all z-[2600] hover:bg-emerald-600"
            >
              <Plus className="w-8 h-8" />
            </button>
          </OverlayPage>
        )}

        {showGlobalNoticeManager && (isAdmin(currentUser) || isDeveloper(currentUser)) && (
          <OverlayPage key="global-notice-overlay" title="Global Notice" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <div className="space-y-6 pb-10">
              {/* Tab Navigation */}
              <div className={cn(
                "flex p-1 rounded-2xl mb-6 relative",
                isDarkMode ? "bg-slate-800" : "bg-slate-100"
              )}>
                <button 
                  onClick={() => setActiveGlobalNoticeTab('write')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-bold transition-all relative z-10",
                    activeGlobalNoticeTab === 'write' ? "text-white" : "text-slate-500"
                  )}
                >
                  {activeGlobalNoticeTab === 'write' && (
                    <motion.div 
                      layoutId="activeGlobalNoticeTab"
                      className="absolute inset-0 bg-emerald-500 rounded-xl shadow-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-20 flex items-center justify-center gap-2">
                    <Edit2 className="w-4 h-4" />
                    নোটিশ লিখুন
                  </span>
                </button>
                <button 
                  onClick={() => setActiveGlobalNoticeTab('history')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-bold transition-all relative z-10",
                    activeGlobalNoticeTab === 'history' ? "text-white" : "text-slate-500"
                  )}
                >
                  {activeGlobalNoticeTab === 'history' && (
                    <motion.div 
                      layoutId="activeGlobalNoticeTab"
                      className="absolute inset-0 bg-emerald-500 rounded-xl shadow-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-20 flex items-center justify-center gap-2">
                    <History className="w-4 h-4" />
                    ইতিহাস
                  </span>
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activeGlobalNoticeTab === 'write' ? (
                  <motion.div 
                    key="write-tab"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-bold opacity-50 ml-1">নোটিশের শিরোনাম</label>
                      <input 
                        type="text" 
                        placeholder="শিরোনাম লিখুন..." 
                        className={cn("w-full p-4 rounded-2xl border text-sm font-bold", isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 shadow-sm")}
                        value={newNoticeTitle}
                        onChange={(e) => setNewNoticeTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold opacity-50 ml-1">নোটিশের বার্তা</label>
                      <textarea 
                        placeholder="বার্তা লিখুন..." 
                        rows={6}
                        className={cn("w-full p-4 rounded-2xl border text-sm resize-none", isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 shadow-sm")}
                        value={newNoticeMessage}
                        onChange={(e) => setNewNoticeMessage(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={handleSaveGlobalNotice}
                      disabled={isSavingNotice}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      {isSavingNotice ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      পাবলিশ করুন
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="history-tab"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    {globalNotices.length === 0 ? (
                      <div className="text-center py-20 opacity-50 flex flex-col items-center gap-3">
                        <History className="w-12 h-12 opacity-20" />
                        <p className="text-sm">কোনো নোটিশের ইতিহাস পাওয়া যায়নি।</p>
                      </div>
                    ) : (
                      globalNotices.map((notice) => (
                        <div 
                          key={notice.id} 
                          className={cn(
                            "p-4 rounded-2xl border space-y-3 transition-all",
                            isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-emerald-500">{notice.title}</h4>
                              <p className="text-[10px] opacity-50">{formatDate(notice.createdAt)} • {notice.authorName}</p>
                            </div>
                            <button 
                              onClick={() => handleDeleteGlobalNotice(notice.id)}
                              className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs opacity-80 leading-relaxed line-clamp-3">{notice.message}</p>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </OverlayPage>
        )}


        {selectedBook && (
          <OverlayPage key="book-overlay" title="বইয়ের বিস্তারিত তথ্য" onClose={() => window.history.back()} isDarkMode={isDarkMode}>
            <div className="space-y-4 pb-24">
              {/* Tab Navigation */}
              <div className={cn(
                "flex p-1 rounded-2xl mb-6 relative",
                isDarkMode ? "bg-slate-800" : "bg-slate-100"
              )}>
                <button 
                  onClick={() => setActiveBookDetailTab('details')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-bold transition-all relative z-10",
                    activeBookDetailTab === 'details' ? "text-white" : "text-slate-500"
                  )}
                >
                  {activeBookDetailTab === 'details' && (
                    <motion.div 
                      layoutId="activeBookDetailTab"
                      className="absolute inset-0 bg-emerald-500 rounded-xl shadow-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-20">বিস্তারিত</span>
                </button>
                <button 
                  onClick={() => setActiveBookDetailTab('borrowers')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-sm font-bold transition-all relative z-10",
                    activeBookDetailTab === 'borrowers' ? "text-white" : "text-slate-500"
                  )}
                >
                  {activeBookDetailTab === 'borrowers' && (
                    <motion.div 
                      layoutId="activeBookDetailTab"
                      className="absolute inset-0 bg-emerald-500 rounded-xl shadow-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-20">গ্রহণকারীগণ</span>
                </button>
              </div>

              {activeBookDetailTab === 'details' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex justify-center mb-6">
                    <BookImage book={selectedBook} isDarkMode={isDarkMode} className="w-32 h-44 shadow-xl" />
                  </div>
                  
                  <div className="space-y-3">
                    <InfoItem label="বইয়ের নাম" value={selectedBook.name} isDarkMode={isDarkMode} />
                    <InfoItem label="লেখক" value={selectedBook.author} isDarkMode={isDarkMode} />
                    <InfoItem label="ধরণ" value={selectedBook.category} isDarkMode={isDarkMode} />
                    <InfoItem label="স্ট্যাটাস" value={selectedBook.status} isDarkMode={isDarkMode} />
                  </div>

                  {/* Back Button at bottom of content */}
                  <button 
                    onClick={() => window.history.back()}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 mt-8 transition-all active:scale-95",
                      isDarkMode ? "bg-slate-800 text-white border border-slate-700" : "bg-white text-slate-600 border border-slate-200 shadow-sm"
                    )}
                  >
                    <ArrowLeft className="w-5 h-5" /> ফিরে যান
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className="text-sm font-bold opacity-50 uppercase tracking-wider">বর্তমান গ্রহণকারীগণ</h3>
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {bookRequests.filter(r => r.bookId === selectedBook.id && r.status === 'approved').length} জন
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {bookRequests.filter(r => r.bookId === selectedBook.id && r.status === 'approved').length === 0 ? (
                      <div className={cn(
                        "p-10 rounded-3xl border text-center space-y-3",
                        isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-100"
                      )}>
                        <User className="w-10 h-10 mx-auto opacity-20" />
                        <p className="text-sm opacity-50">বর্তমানে কেউ বইটি সংগ্রহ করেনি</p>
                      </div>
                    ) : (
                      bookRequests.filter(r => r.bookId === selectedBook.id && r.status === 'approved').map((borrower, idx) => (
                        <div key={`borrower-${idx}`} className={cn(
                          "p-4 rounded-2xl border flex flex-col gap-3",
                          isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100 shadow-sm"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                              <User className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">{borrower.requesterName}</p>
                              <p className="text-[11px] opacity-60 truncate">{borrower.requesterAddress}</p>
                            </div>
                          </div>
                          <div className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold",
                            isDarkMode ? "bg-slate-900/50" : "bg-slate-50"
                          )}>
                            <span className="opacity-60 uppercase tracking-wider">ফেরত প্রদানের তারিখ:</span>
                            <span className="text-emerald-500">{formatDate(borrower.dueDate)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Back Button at bottom of content */}
                  <button 
                    onClick={() => window.history.back()}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 mt-8 transition-all active:scale-95",
                      isDarkMode ? "bg-slate-800 text-white border border-slate-700" : "bg-white text-slate-600 border border-slate-200 shadow-sm"
                    )}
                  >
                    <ArrowLeft className="w-5 h-5" /> ফিরে যান
                  </button>
                </div>
              )}
            </div>

            {/* Floating Borrow Button */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-center">
              {(() => {
                const existingRequest = bookRequests.find(r => r.bookId === selectedBook.id && r.requesterId === currentUser?.id && (r.status === 'pending' || r.status === 'approved'));
                const isAlreadyBorrowed = books.some(b => b.id === selectedBook.id && b.recipientId === currentUser?.id);

                if (isAlreadyBorrowed || (existingRequest && existingRequest.status === 'approved')) {
                  return (
                    <div className="w-full h-14 bg-emerald-100 text-emerald-600 rounded-2xl font-bold flex items-center justify-center gap-2 border border-emerald-200">
                      <CheckCircle2 className="w-5 h-5" /> আপনি এই বইটি নিয়েছেন
                    </div>
                  );
                }

                if (existingRequest && existingRequest.status === 'pending') {
                  return (
                    <div className="w-full h-14 bg-amber-100 text-amber-600 rounded-2xl font-bold flex items-center justify-center gap-2 border border-amber-200">
                      <Loader2 className="w-5 h-5 animate-spin" /> অনুরোধ পেন্ডিং আছে
                    </div>
                  );
                }

                return (
                  <button 
                    onClick={() => setShowBorrowForm(true)}
                    className="w-full h-14 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <BookOpen className="w-5 h-5" /> Borrow a book
                  </button>
                );
              })()}
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

        {showBookshelfPage && (
          <BookshelfPage 
            onClose={() => window.history.back()} 
            isDarkMode={isDarkMode} 
            bookshelves={bookshelves} 
          />
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
                const mySheetNotifications = notifications.filter(n => n.id === currentUser.id && n.message);
                const allNotifs = [
                  ...realTimeNotifications.map(n => ({ ...n, isRealTime: true })),
                  ...mySheetNotifications.map(n => ({ ...n, isRealTime: false }))
                ].sort((a, b) => {
                  const dateA = a.isRealTime ? new Date(a.createdAt).getTime() : 0;
                  const dateB = b.isRealTime ? new Date(b.createdAt).getTime() : 0;
                  return dateB - dateA;
                });

                if (allNotifs.length === 0) {
                  return <div className="text-center p-10 opacity-50">কোনো নোটিফিকেশন পাওয়া যায়নি</div>;
                }

                return allNotifs.map((n: any, idx) => (
                  <button 
                    key={`notif-list-${idx}`}
                    onMouseDown={() => handleLongPressStart('notification', n)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart('notification', n)}
                    onTouchEnd={handleLongPressEnd}
                    onClick={() => {
                      if (n.isRealTime) {
                        markNotificationAsRead(n.id);
                        setSelectedNotification({ id: n.id, title: n.title, message: n.message });
                      } else {
                        setSelectedNotification(n);
                      }
                    }}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left active:scale-95 transition-all flex items-center gap-4 relative overflow-hidden",
                      "bg-slate-900 border-slate-800 text-white",
                      n.isRealTime && !n.isRead && "border-emerald-500/50 bg-emerald-500/10"
                    )}
                  >
                    {n.isRealTime && !n.isRead && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    )}
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      n.isRealTime && !n.isRead ? "bg-emerald-500 text-white" : "bg-emerald-900/30 text-emerald-400"
                    )}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold truncate text-white">{n.title}</h4>
                        {n.isRealTime && (
                          <span className="text-[10px] text-white/40 shrink-0">
                            {new Date(n.createdAt).toLocaleDateString('bn-BD')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/60 truncate">{n.message}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/30" />
                  </button>
                ));
              })()}
            </div>

            {/* Delete Confirmation Slide-up */}
            <AnimatePresence>
              {longPressedItem && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setLongPressedItem(null)}
                    className="fixed inset-0 bg-black/60 z-[6000] backdrop-blur-[2px]"
                  />
                  <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className={cn(
                      "fixed bottom-0 left-0 right-0 z-[6001] p-6 rounded-t-[32px] shadow-2xl border-t",
                      "bg-slate-900 border-slate-800 text-white"
                    )}
                  >
                    <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6 opacity-50" />
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {longPressedItem.data.isLink ? 'লিংক মুছুন?' : 
                           longPressedItem.type === 'notification' ? 'নোটিফিকেশন মুছুন?' : 
                           longPressedItem.type === 'member' ? 'সদস্য লুকান?' : 'অনুরোধ মুছুন?'}
                        </h3>
                        <p className="text-sm text-white/60 mt-1">
                          আপনি কি নিশ্চিত যে আপনি এটি {longPressedItem.type === 'member' ? 'লুকাতে' : 'মুছে ফেলতে'} চান?
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <button 
                          onClick={() => setLongPressedItem(null)}
                          className="py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all active:scale-95"
                        >
                          বাতিল
                        </button>
                        <button 
                          onClick={handleDeleteItem}
                          className="py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95"
                        >
                          {longPressedItem.type === 'member' ? 'লুকান' : 'মুছে ফেলুন'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

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
                    "bg-slate-900 text-white"
                  )}
                >
                  <div className={cn(
                    "flex items-center gap-4 p-4 border-b",
                    "bg-slate-800 border-slate-700"
                  )}>
                    <button 
                      onClick={() => setSelectedNotification(null)}
                      className="p-2 rounded-xl active:scale-90 transition-transform text-white"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-lg font-bold text-white">বিস্তারিত</h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-col items-center text-center space-y-6 max-w-lg mx-auto">
                      <div className="w-20 h-20 bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <Bell className="w-10 h-10 text-emerald-500" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-emerald-400">{selectedNotification.title}</h3>
                        <div className="h-1 w-20 bg-emerald-500/20 mx-auto rounded-full" />
                      </div>
                      
                      <div className={cn(
                        "w-full p-6 rounded-3xl text-lg leading-relaxed shadow-sm border",
                        "bg-slate-800 border-slate-700 text-white"
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

        <AnimatePresence>
          {showCustomNotificationPage && (isAdmin(currentUser) || isDeveloper(currentUser)) && (
            <CustomNotificationPage 
              onClose={() => window.history.back()} 
              isDarkMode={isDarkMode} 
              allMembers={allMembers}
              onSend={sendRealTimeNotification}
            />
          )}
        </AnimatePresence>

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
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-slate-400">নাম:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-slate-700">{currentUser.name}</span>
                      {isVerifiedMember(currentUser) && <BadgeCheck className="w-3.5 h-3.5 text-white fill-emerald-500" />}
                    </div>
                  </div>
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
    </>
  );
}

function PostReactionSection({ postId, currentUser, isDarkMode, isAuthReady }: { 
  postId: string, 
  currentUser: Member | null, 
  isDarkMode: boolean,
  isAuthReady: boolean
}) {
  const [reactions, setReactions] = useState<PostReaction[]>([]);
  const [isReacting, setIsReacting] = useState(false);

  useEffect(() => {
    if (!postId || !isAuthReady) return;
    const q = query(collection(db, 'post_reactions'), where('postId', '==', postId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as PostReaction);
      setReactions(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `post_reactions?postId=${postId}`);
    });
    return () => unsubscribe();
  }, [postId, isAuthReady]);

  const hasReacted = currentUser && reactions.some(r => r.userId === currentUser.id);

  const toggleReact = async () => {
    if (!currentUser) {
      alert("রিঅ্যাক্ট দিতে লগইন করুন");
      return;
    }
    
    setIsReacting(true);
    const reactId = `${postId}_${currentUser.id}`;
    
    try {
      if (hasReacted) {
        await deleteDoc(doc(db, 'post_reactions', reactId))
          .catch(err => handleFirestoreError(err, OperationType.DELETE, `post_reactions/${reactId}`));
      } else {
        await setDoc(doc(db, 'post_reactions', reactId), {
          postId,
          userId: currentUser.id,
          userName: currentUser.name,
          createdAt: serverTimestamp()
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, `post_reactions/${reactId}`));
      }
    } catch (error) {
      console.error("Error toggling react:", error);
    } finally {
      setIsReacting(false);
    }
  };

  return (
    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100/50">
      <div className="flex items-center gap-1.5">
        <button 
          onClick={toggleReact}
          disabled={isReacting}
          className={cn(
            "p-2 rounded-full transition-all active:scale-90",
            hasReacted ? "bg-red-500/10 text-red-500" : "hover:bg-slate-100 text-slate-400"
          )}
        >
          <Heart className={cn("w-5 h-5", hasReacted && "fill-red-500")} />
        </button>
        <span className="text-sm font-bold opacity-70">{reactions.length}</span>
      </div>
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

function WinEffect() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.2, 1], opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-20"
    >
      WINNER!
    </motion.div>
  );
}

function TicTacToeGame({ isDarkMode, allMembers, isAuthReady }: { isDarkMode: boolean, allMembers: Member[], isAuthReady: boolean }) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameMode, setGameMode] = useState<'PvP' | 'PvE' | 'vs-member'>('PvE');
  const [difficulty, setDifficulty] = useState<'Medium' | 'Hard'>('Medium');
  const [winner, setWinner] = useState<string | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [showWinEffect, setShowWinEffect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Member IDs for vs-member mode
  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');
  const [p1Info, setP1Info] = useState<Member | null>(null);
  const [p2Info, setP2Info] = useState<Member | null>(null);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [gameId, setGameId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

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

  // Sync with Firestore for vs-member mode
  useEffect(() => {
    if (gameMode === 'vs-member' && gameId && isAuthReady) {
      const unsubscribe = onSnapshot(doc(db, 'tictactoe_games', gameId), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setBoard(data.board);
          setIsXNext(data.isXNext);
          setWinner(data.winner);
          setWinningLine(data.winningLine);
          
          if (data.winner && data.winner !== 'Draw' && !showWinEffect) {
            setShowWinEffect(true);
            setScores(prev => ({
              ...prev,
              [data.winner]: prev[data.winner as keyof typeof prev] + 1
            }));
            setTimeout(() => setShowWinEffect(false), 2000);
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `tictactoe_games/${gameId}`);
      });
      return () => unsubscribe();
    }
  }, [gameMode, gameId, isAuthReady]);

  const connectGame = async () => {
    setError(null);
    if (!p1Id || !p2Id) {
      setError("উভয় প্লেয়ারের আইডি দিন");
      return;
    }

    setIsConnecting(true);
    
    let members = allMembers;
    if (members.length === 0) {
      try {
        members = await fetchAllMembers();
      } catch (e) {
        console.error("Failed to fetch members", e);
      }
    }

    const m1 = members.find(m => m.id === p1Id);
    const m2 = members.find(m => m.id === p2Id);

    if (!m1 || !m2) {
      setError("সঠিক আইডি দিন");
      setIsConnecting(false);
      return;
    }

    setP1Info(m1);
    setP2Info(m2);

    const id = [p1Id, p2Id].sort().join('_');
    setGameId(id);
    
    try {
      const gameDoc = doc(db, 'tictactoe_games', id);
      // Initialize game if it doesn't exist
      await setDoc(gameDoc, {
        board: Array(9).fill(null),
        isXNext: true,
        winner: null,
        winningLine: null,
        player1Id: p1Id,
        player2Id: p2Id,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `tictactoe_games/${id}`));
      setIsConnecting(false);
    } catch (error) {
      console.error("Error connecting game:", error);
      setIsConnecting(false);
      alert("কানেক্ট করতে সমস্যা হয়েছে");
    }
  };

  const handleClick = async (i: number) => {
    if (winner || board[i]) return;
    
    const newBoard = [...board];
    newBoard[i] = isXNext ? 'X' : 'O';
    
    const winInfo = calculateWinner(newBoard);
    let currentWinner = null;
    let currentWinningLine = null;
    
    if (winInfo) {
      currentWinner = winInfo.winner;
      currentWinningLine = winInfo.line;
      setShowWinEffect(true);
      setScores(prev => ({
        ...prev,
        [currentWinner]: prev[currentWinner as keyof typeof prev] + 1
      }));
      setTimeout(() => setShowWinEffect(false), 2000);
    } else if (!newBoard.includes(null)) {
      currentWinner = 'Draw';
    }

    if (gameMode === 'vs-member' && gameId) {
      try {
        await setDoc(doc(db, 'tictactoe_games', gameId), {
          board: newBoard,
          isXNext: !isXNext,
          winner: currentWinner,
          winningLine: currentWinningLine,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `tictactoe_games/${gameId}`));
      } catch (error) {
        console.error("Error updating game:", error);
      }
    } else {
      setBoard(newBoard);
      setIsXNext(!isXNext);
      setWinner(currentWinner);
      setWinningLine(currentWinningLine);
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

  const resetGame = async () => {
    if (gameMode === 'vs-member' && gameId) {
      try {
        await setDoc(doc(db, 'tictactoe_games', gameId), {
          board: Array(9).fill(null),
          isXNext: true,
          winner: null,
          winningLine: null,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error("Error resetting game:", error);
      }
    } else {
      setBoard(Array(9).fill(null));
      setIsXNext(true);
      setWinner(null);
      setWinningLine(null);
    }
    setShowWinEffect(false);
  };

  return (
    <div className="flex flex-col items-center relative min-h-[500px]">
      {/* Opponent Info (Top Left) */}
      {gameMode === 'vs-member' && p2Info && gameId && (
        <div className="absolute top-0 left-0 flex items-center gap-3 p-2">
          <div className="relative">
            <div className={cn(
              "w-12 h-12 rounded-full border-2 border-amber-500 flex items-center justify-center overflow-hidden",
              isDarkMode ? "bg-slate-800" : "bg-slate-100"
            )}>
              {p2Info.photoId && !p2Info.isNewSheet ? (
                <img 
                  src={`https://lh3.googleusercontent.com/d/${p2Info.photoId}`} 
                  alt={p2Info.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <AnimatePresence>
              {winner === 'O' && showWinEffect && <WinEffect />}
            </AnimatePresence>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold truncate max-w-[80px]">{p2Info.name}</span>
              {isVerifiedMember(p2Info) && <BadgeCheck className="w-3 h-3 text-white fill-emerald-500" />}
            </div>
            <span className="text-lg font-black text-amber-500">{scores.O}</span>
          </div>
        </div>
      )}

      {/* Self Info (Top Right) */}
      {gameMode === 'vs-member' && p1Info && gameId && (
        <div className="absolute top-0 right-0 flex items-center gap-3 p-2 flex-row-reverse">
          <div className="relative">
            <div className={cn(
              "w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center overflow-hidden",
              isDarkMode ? "bg-slate-800" : "bg-slate-100"
            )}>
              {p1Info.photoId && !p1Info.isNewSheet ? (
                <img 
                  src={`https://lh3.googleusercontent.com/d/${p1Info.photoId}`} 
                  alt={p1Info.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <AnimatePresence>
              {winner === 'X' && showWinEffect && <WinEffect />}
            </AnimatePresence>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              {isVerifiedMember(p1Info) && <BadgeCheck className="w-3 h-3 text-white fill-emerald-500" />}
              <span className="text-xs font-bold truncate max-w-[80px]">{p1Info.name}</span>
            </div>
            <span className="text-lg font-black text-emerald-500">{scores.X}</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4 w-full mt-20 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl relative">
        <button 
          onClick={() => { setGameMode('PvE'); resetGame(); setError(null); }}
          className={cn(
            "flex-1 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all relative z-10",
            gameMode === 'PvE' ? "text-white" : (isDarkMode ? "text-slate-400" : "text-slate-600")
          )}
        >
          {gameMode === 'PvE' && (
            <motion.div 
              layoutId="gameModeTab"
              className="absolute inset-0 bg-emerald-500 rounded-xl shadow-md"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-20">Vs Computer</span>
        </button>
        <button 
          onClick={() => { setGameMode('PvP'); resetGame(); setError(null); }}
          className={cn(
            "flex-1 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all relative z-10",
            gameMode === 'PvP' ? "text-white" : (isDarkMode ? "text-slate-400" : "text-slate-600")
          )}
        >
          {gameMode === 'PvP' && (
            <motion.div 
              layoutId="gameModeTab"
              className="absolute inset-0 bg-emerald-500 rounded-xl shadow-md"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-20">Vs Friend</span>
        </button>
        <button 
          onClick={() => { setGameMode('vs-member'); resetGame(); setError(null); }}
          className={cn(
            "flex-1 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all relative z-10",
            gameMode === 'vs-member' ? "text-white" : (isDarkMode ? "text-slate-400" : "text-slate-600")
          )}
        >
          {gameMode === 'vs-member' && (
            <motion.div 
              layoutId="gameModeTab"
              className="absolute inset-0 bg-emerald-500 rounded-xl shadow-md"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-20">Vs Seba member</span>
        </button>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center"
        >
          {error}
        </motion.div>
      )}

      {gameMode === 'vs-member' && !gameId && (
        <div className="w-full space-y-3 mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold opacity-60">আপনার আইডি (X)</label>
              <input 
                type="text" 
                value={p1Id}
                onChange={(e) => setP1Id(e.target.value)}
                placeholder="ID 1"
                className={cn("w-full h-10 px-3 rounded-xl text-sm font-bold border focus:ring-2 focus:ring-emerald-500 outline-none", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold opacity-60">বিপরীত আইডি (O)</label>
              <input 
                type="text" 
                value={p2Id}
                onChange={(e) => setP2Id(e.target.value)}
                placeholder="ID 2"
                className={cn("w-full h-10 px-3 rounded-xl text-sm font-bold border focus:ring-2 focus:ring-emerald-500 outline-none", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}
              />
            </div>
          </div>
          <button 
            onClick={connectGame}
            disabled={isConnecting}
            className="w-full h-10 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "কানেক্ট করুন"}
          </button>
        </div>
      )}

      {gameMode === 'PvE' && (
        <div className="flex gap-2 mb-6 w-full p-1 bg-slate-100 dark:bg-slate-800 rounded-xl relative">
          <button 
            onClick={() => setDifficulty('Medium')}
            className={cn(
              "flex-1 py-1 rounded-lg text-xs font-bold transition-all relative z-10",
              difficulty === 'Medium' ? "text-emerald-600" : (isDarkMode ? "text-slate-400" : "text-slate-600")
            )}
          >
            {difficulty === 'Medium' && (
              <motion.div 
                layoutId="difficultyTab"
                className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-20">Medium</span>
          </button>
          <button 
            onClick={() => setDifficulty('Hard')}
            className={cn(
              "flex-1 py-1 rounded-lg text-xs font-bold transition-all relative z-10",
              difficulty === 'Hard' ? "text-emerald-600" : (isDarkMode ? "text-slate-400" : "text-slate-600")
            )}
          >
            {difficulty === 'Hard' && (
              <motion.div 
                layoutId="difficultyTab"
                className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-20">Hard</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-6">
        {board.map((square, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className={cn(
              "w-20 h-20 text-3xl font-bold rounded-2xl flex items-center justify-center transition-all active:scale-90 border-2",
              gameMode === 'vs-member' 
                ? "bg-emerald-500 border-emerald-400" 
                : (isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"),
              winningLine?.includes(i) ? "bg-emerald-600 text-white scale-105" : (
                gameMode === 'vs-member'
                  ? (square === 'X' ? "text-white" : "text-black")
                  : (square === 'X' ? "text-emerald-500" : "text-amber-500")
              )
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
