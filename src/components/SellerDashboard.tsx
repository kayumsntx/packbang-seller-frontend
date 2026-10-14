import React, { useState, useEffect } from 'react';

export interface SellerProfile {
  id: string;
  phone: string;
  shopName: string;
  email?: string;
  tier?: string;
}

interface SellerDashboardProps {
  seller: SellerProfile;
  currentLang: 'en' | 'bn';
  onLogout: () => void;
  onGoLanding: () => void;
  onLangChange: (lang: 'en' | 'bn') => void;
}

interface ProductItem {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  stock: number;
  moq: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface OrderItem {
  orderId: string;
  buyerShop: string;
  items: string;
  amount: number;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered';
  courier: string;
}

interface CustomBidRequest {
  id: string;
  buyer: string;
  location: string;
  requestText: string;
  quantity: number;
  targetBudget: string;
  bidPlaced?: number;
  deadline?: string;
  images?: string[];
}

export default function SellerDashboard({
  seller,
  currentLang,
  onLogout,
  onGoLanding,
  onLangChange
}: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'bids' | 'settings'>('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [bidModalItem, setBidModalItem] = useState<CustomBidRequest | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoadingBids, setIsLoadingBids] = useState(false);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);

  // Store API base URL for live bidding sync
  const storeApiUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:8000'
    : 'https://packbang.com';

  const fetchApprovedOrders = async () => {
    setIsLoadingBids(true);
    try {
      const res = await fetch(`${storeApiUrl}/api/public/approved-custom-orders`);
      if (!res.ok) throw new Error('Failed to fetch approved orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
        const liveOrders: CustomBidRequest[] = data.orders.map((o: any) => {
          const existingBid = o.bids?.find(
            (b: any) => b.sellerId === seller.id || b.sellerName === seller.shopName
          );
          return {
            id: o.id,
            buyer: o.customerName || 'PackBang Customer',
            location: o.customerPhone ? 'Verified Phone' : 'Bangladesh',
            requestText: (o.title ? `${o.title} - ` : '') + (o.description || 'Custom packaging printing order'),
            quantity: o.quantity || 1,
            targetBudget: o.budget ? `৳ ${o.budget}` : 'Negotiable',
            bidPlaced: existingBid ? existingBid.amount : undefined,
            deadline: o.deadline ? new Date(o.deadline).toLocaleDateString() : undefined,
            images: o.images || []
          };
        });
        setBids(liveOrders);
      }
    } catch (err) {
      console.warn('Live order sync note:', err);
    } finally {
      setIsLoadingBids(false);
    }
  };

  useEffect(() => {
    fetchApprovedOrders();
  }, [activeTab]);

  // Initial Packaging Inventory
  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: 'PK-101',
      name: 'Black Courier Poly Mailers (10" x 14" with POD Pocket)',
      category: 'Courier Poly',
      unitPrice: 4.80,
      stock: 18500,
      moq: 100,
      status: 'in_stock'
    },
    {
      id: 'PK-102',
      name: '2-Layer Premium Air Bubble Wrap Roll (100m x 1.2m)',
      category: 'Bubble Wrap',
      unitPrice: 1450.00,
      stock: 64,
      moq: 1,
      status: 'in_stock'
    },
    {
      id: 'PK-103',
      name: '3-Ply Corrugated Shipping Carton (8" x 6" x 4")',
      category: 'Carton Boxes',
      unitPrice: 16.50,
      stock: 3200,
      moq: 50,
      status: 'in_stock'
    },
    {
      id: 'PK-104',
      name: 'Custom Branded Security Fragile Tape (2 Inch x 65M)',
      category: 'Stickers & Tape',
      unitPrice: 85.00,
      stock: 12,
      moq: 6,
      status: 'low_stock'
    },
    {
      id: 'PK-105',
      name: 'Kraft Paper Boutique Gift Shopping Bags (Medium)',
      category: 'Gift Packets',
      unitPrice: 22.00,
      stock: 2400,
      moq: 50,
      status: 'in_stock'
    }
  ]);

  // Initial Orders
  const [orders] = useState<OrderItem[]>([// setOrders reserved
    {
      orderId: 'ORD-8924',
      buyerShop: 'Aarong Crafts Partner',
      items: '1,000x Courier Poly 10x14',
      amount: 4800,
      date: 'Today, 01:20 PM',
      status: 'Processing',
      courier: 'Steadfast Courier'
    },
    {
      orderId: 'ORD-8919',
      buyerShop: 'Dhaka Gadget Store',
      items: '2x Bubble Wrap 100M Roll',
      amount: 2900,
      date: 'Yesterday',
      status: 'Shipped',
      courier: 'Steadfast Courier'
    },
    {
      orderId: 'ORD-8904',
      buyerShop: 'Chaldal Merchant Supply',
      items: '500x 3-Ply Cartons',
      amount: 8250,
      date: '12 Oct 2026',
      status: 'Delivered',
      courier: 'RedX Logistics'
    }
  ]);

  // Wholesale Custom Bids from Dhaka Stores
  const [bids, setBids] = useState<CustomBidRequest[]>([
    {
      id: 'REQ-441',
      buyer: 'Zara Fashion Hub',
      location: 'Dhanmondi, Dhaka',
      requestText: 'Need 10,000 custom logo printed pink courier poly bags (11x15 inch) with waterproof seal.',
      quantity: 10000,
      targetBudget: '৳ 4.50 / pc',
      bidPlaced: 4.25
    },
    {
      id: 'REQ-442',
      buyer: 'Sweet Treats Bakery',
      location: 'Uttara Sector 7, Dhaka',
      requestText: 'Custom luxury pastry cake boxes with golden foil logo stamping & food-grade lamination.',
      quantity: 2000,
      targetBudget: '৳ 35.00 / box'
    },
    {
      id: 'REQ-443',
      buyer: 'Apex Footwear Outlet Partner',
      location: 'Chawkbazar, Old Dhaka',
      requestText: 'Heavy duty 5-ply corrugated carton boxes (14x10x8 inch) for bulk warehouse shipping.',
      quantity: 3500,
      targetBudget: '৳ 38.00 / box'
    }
  ]);

  // Form state for adding product
  const [newProductName, setNewProductName] = useState('');
  const [newCategory, setNewCategory] = useState('Courier Poly');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newMoq] = useState('50');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newPrice || !newStock) return;

    const item: ProductItem = {
      id: 'PK-' + Math.floor(100 + Math.random() * 900),
      name: newProductName,
      category: newCategory,
      unitPrice: parseFloat(newPrice),
      stock: parseInt(newStock),
      moq: parseInt(newMoq) || 1,
      status: parseInt(newStock) > 20 ? 'in_stock' : 'low_stock'
    };

    setProducts([item, ...products]);
    setShowAddModal(false);
    setNewProductName('');
    setNewPrice('');
    setNewStock('');
    showToast(currentLang === 'bn' ? 'নতুন প্যাকেজিং আইটেম সফলভাবে যোগ করা হয়েছে!' : 'New packaging product added successfully!');
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidModalItem || !bidAmount) return;

    setIsSubmittingBid(true);
    const amountNum = parseFloat(bidAmount);

    try {
      await fetch(`${storeApiUrl}/api/public/custom-order/${bidModalItem.id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: seller.id || ('SELLER-' + (seller.phone || Date.now())),
          sellerName: seller.shopName || 'Verified Packaging Supplier',
          amount: amountNum,
          deliveryTime: '3-5 Days',
          note: `Factory quotation from ${seller.shopName || 'packaging manufacturer'}`
        })
      });
    } catch (err) {
      console.warn('Bid submission sync note:', err);
    } finally {
      setBids(bids.map(b => b.id === bidModalItem.id ? { ...b, bidPlaced: amountNum } : b));
      setBidModalItem(null);
      setBidAmount('');
      setIsSubmittingBid(false);
      showToast(currentLang === 'bn' ? 'পাইকারি অর্ডারে আপনার কোটেশন জমা হয়েছে!' : 'Wholesale quotation bid submitted successfully!');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'inherit' }}>
      
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 22px',
          borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          fontSize: '14px',
          borderLeft: '4px solid #FF5A1F'
        }}>
          <span>✅</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header style={{
        background: '#0F172A',
        color: '#FFFFFF',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={onGoLanding}>
            <div style={{
              width: '38px',
              height: '38px',
              background: '#FF5A1F',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '18px',
              color: '#fff'
            }}>
              📦
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px', color: '#FFFFFF' }}>
                PACKBANG <span style={{ color: '#FF5A1F' }}>SELLER CENTER</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                {currentLang === 'bn' ? 'সাপ্লায়ার ও ম্যানুফ্যাকচারার পোর্টাল' : 'B2B Packaging Supplier Hub'}
              </div>
            </div>
          </div>

          <span style={{
            background: 'rgba(255, 90, 31, 0.2)',
            color: '#FF8A00',
            border: '1px solid rgba(255, 90, 31, 0.4)',
            fontSize: '11px',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%' }}></span>
            {seller.shopName}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Language Switch */}
          <button
            onClick={() => onLangChange(currentLang === 'en' ? 'bn' : 'en')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {currentLang === 'en' ? 'বাংলা' : 'English'}
          </button>

          {/* View Public Portal */}
          <button
            onClick={onGoLanding}
            style={{
              background: 'transparent',
              color: '#E2E8F0',
              border: '1px solid #475569',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ← {currentLang === 'bn' ? 'ওয়েবসাইট দেখুন' : 'Public Page'}
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            style={{
              background: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              padding: '7px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {currentLang === 'bn' ? 'লগআউট' : 'Logout'}
          </button>
        </div>
      </header>

      {/* Dashboard Body */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>

        {/* Welcome Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#FFFFFF',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', background: '#059669', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                ✓ VERIFIED MANUFACTURER
              </span>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>Seller ID: {seller.id || 'PB-8942'}</span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 6px 0', color: '#FFFFFF' }}>
              {currentLang === 'bn' ? `স্বাগতম, ${seller.shopName}!` : `Welcome back, ${seller.shopName}!`}
            </h1>
            <p style={{ margin: 0, color: '#CBD5E1', fontSize: '14px' }}>
              {currentLang === 'bn'
                ? 'আপনার কারখানা ও প্যাকেজিং স্টক প্রস্তুত রাখুন। প্রতিদিন দেশজুড়ে ডেলিভারি যাচ্ছে।'
                : 'Manage your packaging stock, view merchant bulk orders, and bid on custom carton print requests.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: '#FF5A1F',
                color: '#fff',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(255, 90, 31, 0.4)'
              }}
            >
              + {currentLang === 'bn' ? 'প্যাকেজিং পণ্য যোগ করুন' : 'Add Packaging Item'}
            </button>
            <button
              onClick={() => setActiveTab('bids')}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
                padding: '12px 18px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              ⚡ {currentLang === 'bn' ? 'পাইকারি রিকোয়েস্ট দেখুন' : 'Wholesale Bids (3)'}
            </button>
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          marginBottom: '28px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700, marginBottom: '8px' }}>
              📦 {currentLang === 'bn' ? 'মোট ডেলিভারিকৃত ইউনিট' : 'Total Units Supplied'}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', marginBottom: '4px' }}>
              48,500 <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>pcs</span>
            </div>
            <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 700 }}>
              ↑ +18.4% {currentLang === 'bn' ? 'গত মাসের চেয়ে বৃদ্ধি' : 'growth this month'}
            </div>
          </div>

          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700, marginBottom: '8px' }}>
              💰 {currentLang === 'bn' ? 'মোট বিক্রি (রেভিনিউ)' : 'Total Revenue'}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#FF5A1F', marginBottom: '4px' }}>
              ৳ 2,45,800
            </div>
            <div style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>
              ✓ {currentLang === 'bn' ? 'সাপ্তাহিক ব্যাংক পে-আউট সক্রিয়' : 'Weekly Bank Settlement Active'}
            </div>
          </div>

          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700, marginBottom: '8px' }}>
              ⚡ {currentLang === 'bn' ? 'কাস্টম পাইকারি বিড' : 'Custom Wholesale Bids'}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#2563EB', marginBottom: '4px' }}>
              3 <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>pending</span>
            </div>
            <div style={{ fontSize: '12px', color: '#2563EB', fontWeight: 700 }}>
              Dhaka Boutique Stores Waiting
            </div>
          </div>

          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700, marginBottom: '8px' }}>
              🚚 {currentLang === 'bn' ? 'লজিস্টিক ও কুরিয়ার পার্টনার' : 'Active Shipments'}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', marginBottom: '4px' }}>
              18 <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>parcels</span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
              Tracked via Steadfast Courier
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #E2E8F0',
          marginBottom: '24px',
          gap: '8px'
        }}>
          {[
            { id: 'overview', label: currentLang === 'bn' ? 'ওভারভিউ ও অর্ডার' : 'Overview & Orders', icon: '📊' },
            { id: 'products', label: currentLang === 'bn' ? 'প্যাকেজিং ইনভেন্টরি' : 'Packaging Inventory', icon: '📦' },
            { id: 'bids', label: currentLang === 'bn' ? 'পাইকারি কোটেশন বিড' : 'Wholesale Bids', icon: '⚡' },
            { id: 'settings', label: currentLang === 'bn' ? 'ফ্যাক্টরি প্রোফাইল' : 'Factory Profile', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '12px 20px',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                color: activeTab === tab.id ? '#FF5A1F' : '#64748B',
                borderBottom: activeTab === tab.id ? '3px solid #FF5A1F' : '3px solid transparent',
                marginBottom: '-2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & RECENT ORDERS */}
        {activeTab === 'overview' && (
          <div>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                  {currentLang === 'bn' ? 'সাম্প্রতিক প্যাকেজিং অর্ডারসমূহ' : 'Recent Packaging Orders'}
                </h3>
                <span style={{ fontSize: '13px', color: '#64748B' }}>Showing last 3 bulk shipments</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
                      <th style={{ padding: '12px 16px' }}>Order ID</th>
                      <th style={{ padding: '12px 16px' }}>Buyer Store</th>
                      <th style={{ padding: '12px 16px' }}>Item Specifications</th>
                      <th style={{ padding: '12px 16px' }}>Amount</th>
                      <th style={{ padding: '12px 16px' }}>Date</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.orderId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#FF5A1F' }}>{o.orderId}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 700 }}>{o.buyerShop}</td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>{o.items}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 800 }}>৳ {o.amount.toLocaleString()}</td>
                        <td style={{ padding: '14px 16px', color: '#64748B', fontSize: '13px' }}>{o.date}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 800,
                            background: o.status === 'Delivered' ? '#DEF7EC' : o.status === 'Shipped' ? '#E1EFFE' : '#FEF08A',
                            color: o.status === 'Delivered' ? '#03543F' : o.status === 'Shipped' ? '#1E429F' : '#854D0E'
                          }}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PACKAGING INVENTORY */}
        {activeTab === 'products' && (
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0' }}>
                  {currentLang === 'bn' ? 'কারখানা স্টক ও আইটেম তালিকা' : 'Packaging Factory Inventory'}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                  Total {products.length} active wholesale listings
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  background: '#FF5A1F',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                + {currentLang === 'bn' ? 'নতুন আইটেম যোগ করুন' : 'Add Item'}
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>SKU</th>
                    <th style={{ padding: '12px 16px' }}>Item Name</th>
                    <th style={{ padding: '12px 16px' }}>Category</th>
                    <th style={{ padding: '12px 16px' }}>Unit Price</th>
                    <th style={{ padding: '12px 16px' }}>Stock Available</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#64748B' }}>{p.id}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>{p.name}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                          {p.category}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#FF5A1F' }}>
                        ৳ {p.unitPrice.toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                        {p.stock.toLocaleString()} pcs
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 800,
                          background: p.status === 'in_stock' ? '#DEF7EC' : '#FDE8E8',
                          color: p.status === 'in_stock' ? '#03543F' : '#9B1C1C'
                        }}>
                          {p.status === 'in_stock' ? 'In Stock' : 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM WHOLESALE BIDS */}
        {activeTab === 'bids' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{currentLang === 'bn' ? 'লাইভ পাইকারি ও কাস্টম প্রিন্টিং রিকোয়েস্ট' : 'Live Wholesale & Custom Printing Requests'}</span>
                  <span style={{ background: '#FF5A1F', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                    {bids.length} Active
                  </span>
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                  Online stores in Bangladesh are requesting bulk quotes. Submit your factory prices directly.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchApprovedOrders}
                disabled={isLoadingBids}
                style={{
                  background: '#EFF6FF',
                  color: '#1D4ED8',
                  border: '1px solid #BFDBFE',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🔄 {isLoadingBids ? (currentLang === 'bn' ? 'লোড হচ্ছে...' : 'Refreshing...') : (currentLang === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh Requests')}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bids.map(b => (
                <div key={b.id} style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '15px' }}>{b.buyer}</span>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>• 📍 {b.location}</span>
                      <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                        {b.id}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155', lineHeight: '1.4' }}>
                      "{b.requestText}"
                    </p>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748B' }}>
                      <span>Quantity: <strong style={{ color: '#0F172A' }}>{b.quantity.toLocaleString()} pcs</strong></span>
                      <span>Target Budget: <strong style={{ color: '#059669' }}>{b.targetBudget}</strong></span>
                    </div>
                  </div>

                  <div>
                    {b.bidPlaced ? (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#059669', fontWeight: 800, marginBottom: '4px' }}>
                          ✓ Quotation Submitted
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#FF5A1F' }}>
                          ৳ {b.bidPlaced.toFixed(2)} / pc
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setBidModalItem(b); setBidAmount(''); }}
                        style={{
                          background: '#FF5A1F',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(255, 90, 31, 0.3)'
                        }}
                      >
                        ⚡ Submit Factory Bid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: FACTORY PROFILE & SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '28px',
            border: '1px solid #E2E8F0',
            maxWidth: '700px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0' }}>
              {currentLang === 'bn' ? 'কারখানা প্রোফাইল ও পে-আউট তথ্য' : 'Packaging Factory Profile & Payout Info'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Shop Name</label>
                <input type="text" readOnly value={seller.shopName} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Registered Phone</label>
                <input type="text" readOnly value={seller.phone} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Manufacturing Hub Address</label>
                <input type="text" defaultValue="Armanitola / Chawkbazar Packaging Cluster, Dhaka" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Bank Account for Weekly Settlements</label>
                <input type="text" defaultValue="Dutch-Bangla Bank (Agent / Current A/C) - Verified" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
              </div>
            </div>

            <button
              onClick={() => showToast('Profile settings saved successfully.')}
              style={{
                marginTop: '20px',
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Save Profile Changes
            </button>
          </div>
        )}

      </div>

      {/* Modal: Add Product */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '28px',
            width: '90%',
            maxWidth: '480px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 800 }}>Add Packaging Product</h3>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700 }}>Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. 5-Ply Corrugated Box (12x10x6)"
                  required
                  value={newProductName}
                  onChange={e => setNewProductName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700 }}>Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                >
                  <option value="Courier Poly">Courier Poly</option>
                  <option value="Bubble Wrap">Bubble Wrap</option>
                  <option value="Carton Boxes">Carton Boxes</option>
                  <option value="Stickers & Tape">Stickers & Tape</option>
                  <option value="Gift Packets">Gift Packets</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: 700 }}>Unit Price (৳)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 8.5"
                    required
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: 700 }}>Stock Qty</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    required
                    value={newStock}
                    onChange={e => setNewStock(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#FF5A1F', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Submit Bid */}
      {bidModalItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '28px',
            width: '90%',
            maxWidth: '460px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800 }}>Submit Wholesale Quotation</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748B' }}>
              Buyer: <strong>{bidModalItem.buyer}</strong> ({bidModalItem.quantity.toLocaleString()} pcs)
            </p>

            <form onSubmit={handlePlaceBid}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Your Factory Price Per Unit (৳)
                </label>
                <input
                  type="number"
                  step="0.05"
                  required
                  placeholder="e.g. 4.10"
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '16px' }}
                />
                <span style={{ fontSize: '12px', color: '#059669', display: 'block', marginTop: '4px' }}>
                  Target Budget: {bidModalItem.targetBudget}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setBidModalItem(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBid}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#FF5A1F', color: '#fff', cursor: 'pointer', fontWeight: 700, opacity: isSubmittingBid ? 0.7 : 1 }}
                >
                  {isSubmittingBid ? 'Submitting...' : 'Submit Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
