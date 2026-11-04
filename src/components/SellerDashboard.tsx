import React, { useState, useEffect } from 'react';

export interface SellerProfile {
  id: string;
  phone: string;
  shopName: string;
  email?: string;
  tier?: string;
  ownerName?: string;
  tradeLicenseNumber?: string;
  tradeLicenseImage?: string;
  nidNumber?: string;
  nidFrontImage?: string;
  nidBackImage?: string;
  kycStatus?: 'unverified' | 'pending_verification' | 'verified' | 'rejected';
  kycSubmittedAt?: string;
  status?: 'pending_approval' | 'approved' | 'active' | 'pending' | 'rejected' | 'suspended' | 'banned';
  rejectionReason?: string;
  suspendedUntil?: string;
  suspensionReason?: string;
  banReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    branchName?: string;
    bkashNumber?: string;
  };
  warehouseAddress?: {
    division?: string;
    city?: string;
    fullAddress?: string;
  };
}

interface SellerDashboardProps {
  seller: SellerProfile;
  currentLang: 'en' | 'bn';
  onLogout: () => void;
  onGoLanding: () => void;
  onLangChange: (lang: 'en' | 'bn') => void;
  onSellerUpdate?: (updated: SellerProfile) => void;
}

interface ProductItem {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  originalPrice?: number;
  stock: number;
  moq: number;
  unit?: string;
  imagePath?: string;
  images?: string[];
  description?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  isActive?: boolean;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  rejectionReason?: string;
}

interface OrderItem {
  orderId: string;
  type?: 'direct_sale' | 'custom_order' | string;
  buyerShop: string;
  items: string;
  amount: number;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered';
  courier: string;
}

interface CustomBidRequest {
  id: string;
  title?: string;
  buyer: string;
  location: string;
  requestText: string;
  quantity: number;
  unit?: string;
  unitPrice?: number;
  targetBudget: string;
  targetBudgetRaw?: number;
  bidPlaced?: number;
  deadline?: string;
  images?: string[];
}

export default function SellerDashboard({
  seller,
  currentLang,
  onLogout,
  onGoLanding,
  onLangChange,
  onSellerUpdate
}: SellerDashboardProps) {
  const [currentSeller, setCurrentSeller] = useState<SellerProfile>(seller);
  useEffect(() => {
    setCurrentSeller(seller);
  }, [seller]);

  // Seller Approval Status Checks
  const isApproved = currentSeller.status === 'approved' || currentSeller.status === 'active';
  const isSuspended = currentSeller.status === 'suspended';
  const isBanned = currentSeller.status === 'banned';
  const isRejected = currentSeller.status === 'rejected';
  const isPendingApproval = !isApproved && !isSuspended && !isBanned && !isRejected;

  const hasRequiredKyc = Boolean(
    currentSeller.ownerName &&
    (currentSeller.tradeLicenseNumber || currentSeller.tradeLicenseImage) &&
    currentSeller.nidFrontImage &&
    currentSeller.nidBackImage
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'bids' | 'reports' | 'settings'>('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [bidModalItem, setBidModalItem] = useState<CustomBidRequest | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidDeliveryTime, setBidDeliveryTime] = useState('3-5 Working Days');
  const [bidNote, setBidNote] = useState('');
  const [bidTermsAccepted, setBidTermsAccepted] = useState(false);
  const [showSellerTermsModal, setShowSellerTermsModal] = useState(false);
  const [sellerTermsData, setSellerTermsData] = useState<{ title: string; content: string; updatedAt?: string } | null>(null);
  const [isLoadingSellerTerms, setIsLoadingSellerTerms] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoadingBids, setIsLoadingBids] = useState(false);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [sellerChatModalItem, setSellerChatModalItem] = useState<CustomBidRequest | null>(null);
  const [sellerChatMessages, setSellerChatMessages] = useState<any[]>([]);
  const [chatMessageText, setChatMessageText] = useState('');
  const [chatFilterWarning, setChatFilterWarning] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; title: string } | null>(null);
  const [previewImageRotation, setPreviewImageRotation] = useState<number>(0);

  // Sales Report Filter States
  const [reportSaleType, setReportSaleType] = useState<'all' | 'regular' | 'custom'>('all');
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');
  const [reportSortBy, setReportSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // UI state for Modern Humanized Seller Layout (Matching Photo)
  const [salesOverviewPeriod, setSalesOverviewPeriod] = useState<'7D' | '30D' | '90D'>('30D');
  const [dateRangeFilter, setDateRangeFilter] = useState('Last 30 Days');
  const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [activeChartPoint, setActiveChartPoint] = useState<number>(3);

  // Store API base URL for live marketplace sync
  const storeApiUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:8000'
    : 'https://packbang.com';

  const sellerBackendApiUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:5000'
    : 'https://packbang-seller-backend.onrender.com';

  // Profile & Verification (KYC) state
  const [profileShopName, setProfileShopName] = useState(currentSeller.shopName || '');
  const [profileOwnerName, setProfileOwnerName] = useState(currentSeller.ownerName || '');
  const [profileEmail, setProfileEmail] = useState(currentSeller.email || '');
  const [profileTradeLicenseNumber, setProfileTradeLicenseNumber] = useState(currentSeller.tradeLicenseNumber || '');
  const [profileTradeLicenseImage, setProfileTradeLicenseImage] = useState(currentSeller.tradeLicenseImage || '');
  const [profileNidNumber, setProfileNidNumber] = useState(currentSeller.nidNumber || '');
  const [profileNidFrontImage, setProfileNidFrontImage] = useState(currentSeller.nidFrontImage || '');
  const [profileNidBackImage, setProfileNidBackImage] = useState(currentSeller.nidBackImage || '');
  const [profileAddress, setProfileAddress] = useState(currentSeller.warehouseAddress?.fullAddress || '');
  const [profileDivision, setProfileDivision] = useState(currentSeller.warehouseAddress?.division || 'Dhaka');
  const [profileCity, setProfileCity] = useState(currentSeller.warehouseAddress?.city || 'Dhaka');
  const [profileBankName, setProfileBankName] = useState(currentSeller.bankDetails?.bankName || '');
  const [profileAccountNumber, setProfileAccountNumber] = useState(currentSeller.bankDetails?.accountNumber || '');
  const [profileAccountHolderName, setProfileAccountHolderName] = useState(currentSeller.bankDetails?.accountHolderName || '');
  const [profileBranchName, setProfileBranchName] = useState(currentSeller.bankDetails?.branchName || '');
  const [profileBkashNumber, setProfileBkashNumber] = useState(currentSeller.bankDetails?.bkashNumber || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [uploadingDocType, setUploadingDocType] = useState<'tradeLicense' | 'nidFront' | 'nidBack' | null>(null);

  // Sync profile form state when currentSeller updates
  useEffect(() => {
    setProfileShopName(currentSeller.shopName || '');
    setProfileOwnerName(currentSeller.ownerName || '');
    setProfileEmail(currentSeller.email || '');
    setProfileTradeLicenseNumber(currentSeller.tradeLicenseNumber || '');
    setProfileTradeLicenseImage(currentSeller.tradeLicenseImage || '');
    setProfileNidNumber(currentSeller.nidNumber || '');
    setProfileNidFrontImage(currentSeller.nidFrontImage || '');
    setProfileNidBackImage(currentSeller.nidBackImage || '');
    setProfileAddress(currentSeller.warehouseAddress?.fullAddress || '');
    setProfileDivision(currentSeller.warehouseAddress?.division || 'Dhaka');
    setProfileCity(currentSeller.warehouseAddress?.city || 'Dhaka');
    setProfileBankName(currentSeller.bankDetails?.bankName || '');
    setProfileAccountNumber(currentSeller.bankDetails?.accountNumber || '');
    setProfileAccountHolderName(currentSeller.bankDetails?.accountHolderName || '');
    setProfileBranchName(currentSeller.bankDetails?.branchName || '');
    setProfileBkashNumber(currentSeller.bankDetails?.bkashNumber || '');
  }, [currentSeller]);

  const fetchApprovedOrders = async () => {
    setIsLoadingBids(true);
    try {
      const res = await fetch(`${storeApiUrl}/api/public/approved-custom-orders`);
      if (!res.ok) throw new Error('Failed to fetch approved orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
        const liveOrders: CustomBidRequest[] = data.orders.map((o: any) => {
          const existingBid = o.bids?.find(
            (b: any) => b.sellerId === currentSeller.id || b.sellerName === currentSeller.shopName
          );
          const qty = Number(o.quantity) || 1;
          const budgetNum = Number(o.budget) || 0;
          const unitName = o.unit || 'Pcs';
          const calculatedUnitRate = o.unitPrice || (budgetNum > 0 && qty > 0 ? Math.round((budgetNum / qty) * 100) / 100 : 0);

          return {
            id: o.id,
            title: o.title || '',
            buyer: o.customerName || 'PackBang Customer',
            location: o.customerPhone ? 'Verified Buyer' : 'Bangladesh',
            requestText: (o.title ? `${o.title} — ` : '') + (o.description || 'Custom packaging printing order'),
            quantity: qty,
            unit: unitName,
            unitPrice: calculatedUnitRate,
            targetBudget: budgetNum > 0 ? `৳ ${budgetNum.toLocaleString()}` : (o.budget ? `৳ ${o.budget}` : 'Negotiable'),
            targetBudgetRaw: budgetNum,
            bidPlaced: existingBid ? (existingBid.unitPrice || existingBid.amount) : undefined,
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

  
  const fetchSellerProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch(`${storeApiUrl}/api/seller/products?sellerId=${encodeURIComponent(currentSeller.id)}&sellerPhone=${encodeURIComponent(currentSeller.phone)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          const mapped: ProductItem[] = data.products.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category || 'General',
            unitPrice: p.price || 0,
            originalPrice: p.originalPrice || undefined,
            stock: p.stock || 0,
            moq: p.moq || 1,
            unit: p.unit || 'pcs',
            imagePath: p.imagePath || (p.images && p.images[0]) || '/uploads/default.jpg',
            images: p.images || [],
            description: p.description || '',
            status: p.stock > 10 ? 'in_stock' : (p.stock > 0 ? 'low_stock' : 'out_of_stock'),
            isActive: p.isActive !== false,
            approvalStatus: p.approvalStatus || (p.isActive ? 'approved' : 'pending'),
            rejectionReason: p.rejectionReason || ''
          }));
          setProducts(mapped);
        }
      }
    } catch (err) {
      console.warn('Live products sync warning:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchSellerOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch(`${storeApiUrl}/api/seller/orders?sellerId=${encodeURIComponent(currentSeller.id)}&sellerPhone=${encodeURIComponent(currentSeller.phone)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      }
    } catch (err) {
      console.warn('Live seller orders sync warning:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchSellerMetrics = async () => {
    try {
      const res = await fetch(`${storeApiUrl}/api/seller/metrics?sellerId=${encodeURIComponent(currentSeller.id)}&sellerPhone=${encodeURIComponent(currentSeller.phone)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSellerMetrics({
            totalStock: data.totalStock || 0,
            totalListings: data.totalListings || 0,
            totalRevenue: data.totalRevenue || 0,
            activeShipments: data.activeShipments || 0,
            bidsPlaced: data.bidsPlaced || 0
          });
        }
      }
    } catch (err) {
      console.warn('Live seller metrics sync warning:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${storeApiUrl}/api/seller/categories`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
          const names = Array.from(new Set(data.categories.map((c: any) => c.name).filter(Boolean))) as string[];
          if (names.length > 0) setCategoriesList(names);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchApprovedOrders();
    fetchSellerProducts();
    fetchSellerOrders();
    fetchSellerMetrics();
    fetchCategories();
  }, [activeTab, currentSeller.id, currentSeller.phone]);

  // Live Marketplace Products Integration
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [categoriesList, setCategoriesList] = useState<string[]>([
    'Courier Poly',
    'Bubble Wrap',
    'Carton Boxes',
    'Stickers & Tape',
    'Gift Packets',
    'Security Seals',
    'Mailing Bags'
  ]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form Fields for Add Product
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newUnit, setNewUnit] = useState('pcs');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrls, setNewImageUrls] = useState<string[]>([]);
  const [imageInputVal, setImageInputVal] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Individual Seller Packaging Inventory (Isolated to logged-in supplier)
  const [products, setProducts] = useState<ProductItem[]>([]);

  // Individual Seller Orders (Isolated to logged-in supplier)
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [sellerMetrics, setSellerMetrics] = useState({
    totalStock: 0,
    totalListings: 0,
    totalRevenue: 0,
    activeShipments: 0,
    bidsPlaced: 0
  });

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
  const [newMoq, setNewMoq] = useState('50');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: 'tradeLicense' | 'nidFront' | 'nidBack') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocType(docType);
    try {
      const formData = new FormData();
      formData.append('productImages', file);
      const res = await fetch(`${storeApiUrl}/api/seller/products/upload-image`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.urls) && data.urls.length > 0) {
        const uploadedUrl = data.urls[0];
        if (docType === 'tradeLicense') {
          setProfileTradeLicenseImage(uploadedUrl);
          showToast(currentLang === 'bn' ? 'ট্রেড লাইসেন্স ডকুমেন্ট আপলোড হয়েছে' : 'Trade License uploaded successfully');
        } else if (docType === 'nidFront') {
          setProfileNidFrontImage(uploadedUrl);
          showToast(currentLang === 'bn' ? 'এনআইডি সামনের অংশ আপলোড হয়েছে' : 'NID front part uploaded successfully');
        } else if (docType === 'nidBack') {
          setProfileNidBackImage(uploadedUrl);
          showToast(currentLang === 'bn' ? 'এনআইডি পেছনের অংশ আপলোড হয়েছে' : 'NID back part uploaded successfully');
        }
      } else {
        showToast(currentLang === 'bn' ? 'ডকুমেন্ট আপলোড ব্যর্থ হয়েছে' : 'Document upload failed');
      }
    } catch (err) {
      console.error('Doc upload error:', err);
      showToast(currentLang === 'bn' ? 'আপলোড সংযোগ ত্রুটি' : 'Document upload network error');
    } finally {
      setUploadingDocType(null);
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileOwnerName.trim()) {
      showToast(currentLang === 'bn' ? 'অনুগ্রহ করে সেলারের নাম (মালিকের নাম) দিন' : 'Seller Legal Name is required');
      return;
    }

    setIsSavingProfile(true);
    try {
      const token = localStorage.getItem('packbang_seller_token');
      const payload = {
        shopName: profileShopName.trim() || currentSeller.shopName,
        ownerName: profileOwnerName.trim(),
        email: profileEmail.trim(),
        warehouseAddress: {
          division: profileDivision,
          city: profileCity,
          fullAddress: profileAddress
        },
        tradeLicenseNumber: profileTradeLicenseNumber.trim(),
        tradeLicenseImage: profileTradeLicenseImage,
        nidNumber: profileNidNumber.trim(),
        nidFrontImage: profileNidFrontImage,
        nidBackImage: profileNidBackImage,
        bankDetails: {
          bankName: profileBankName.trim(),
          accountNumber: profileAccountNumber.trim(),
          accountHolderName: profileAccountHolderName.trim(),
          branchName: profileBranchName.trim(),
          bkashNumber: profileBkashNumber.trim()
        }
      };

      let updatedDoc: any = null;
      try {
        const res = await fetch(`${sellerBackendApiUrl}/api/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.seller) {
            updatedDoc = data.seller;
          }
        }
      } catch (backendErr) {
        console.warn('Backend sync notice:', backendErr);
      }

      const hasRequiredDocs = !!(
        payload.ownerName &&
        (payload.tradeLicenseNumber || payload.tradeLicenseImage) &&
        payload.nidFrontImage &&
        payload.nidBackImage
      );

      const mergedSeller: SellerProfile = {
        ...currentSeller,
        ...payload,
        ...(updatedDoc || {}),
        kycStatus: hasRequiredDocs
          ? (currentSeller.kycStatus === 'verified' ? 'verified' : 'pending_verification')
          : 'unverified'
      };

      setCurrentSeller(mergedSeller);
      localStorage.setItem('packbang_seller_user', JSON.stringify(mergedSeller));
      if (onSellerUpdate) onSellerUpdate(mergedSeller);

      showToast(
        currentLang === 'bn'
          ? 'প্রোফাইল ও ভেরিফিকেশন তথ্য সংরক্ষিত হয়েছে!'
          : 'Profile and verification documents saved successfully!'
      );
    } catch (err: any) {
      console.error('Save profile error:', err);
      showToast(err.message || 'Error updating profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newPrice || !newStock) {
      showToast(currentLang === 'bn' ? 'অনুগ্রহ করে আবশ্যক তথ্য পূরণ করুন' : 'Please fill all required fields');
      return;
    }

    setIsSubmittingProduct(true);
    try {
      const payload = {
        name: newProductName.trim(),
        category: newCategory,
        price: parseFloat(newPrice),
        originalPrice: newOriginalPrice ? parseFloat(newOriginalPrice) : undefined,
        stock: parseInt(newStock) || 0,
        moq: parseInt(newMoq) || 1,
        unit: newUnit,
        description: newDescription.trim(),
        images: newImageUrls.length > 0 ? newImageUrls : ['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80'],
        sellerId: currentSeller.id,
        sellerName: currentSeller.shopName || 'PackBang Verified Factory',
        sellerPhone: currentSeller.phone
      };

      const res = await fetch(`${storeApiUrl}/api/seller/products/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.product) {
        showToast(data.message || (currentLang === 'bn' ? 'পণ্যটি সফলভাবে সাবমিট হয়েছে!' : 'Product listed successfully!'));
        setShowAddModal(false);
        setNewProductName('');
        setNewPrice('');
        setNewOriginalPrice('');
        setNewStock('');
        setNewDescription('');
        setNewImageUrls([]);
        fetchSellerProducts();
      } else {
        throw new Error(data.message || 'Failed to create product');
      }
    } catch (err: any) {
      console.error('Add product error:', err);
      showToast(err.message || 'Error publishing product');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSubmittingProduct(true);
    try {
      const res = await fetch(`${storeApiUrl}/api/seller/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingProduct.name,
          price: editingProduct.unitPrice,
          originalPrice: editingProduct.originalPrice,
          stock: editingProduct.stock,
          moq: editingProduct.moq,
          unit: editingProduct.unit,
          category: editingProduct.category,
          description: editingProduct.description
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(currentLang === 'bn' ? 'পণ্য সফলভাবে আপডেট করা হয়েছে!' : 'Product updated successfully!');
        setEditingProduct(null);
        fetchSellerProducts();
      } else {
        showToast(data.message || 'Update failed');
      }
    } catch (err) {
      showToast('Error updating product');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm(currentLang === 'bn' ? 'আপনি কি নিশ্চিত এই পণ্যটি ডিলিট করতে চান?' : 'Are you sure you want to remove this product from marketplace listing?')) {
      return;
    }

    try {
      const res = await fetch(`${storeApiUrl}/api/seller/products/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast(currentLang === 'bn' ? 'পণ্য ডিলিট সম্পন্ন হয়েছে' : 'Product removed successfully');
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        showToast(data.message || 'Failed to delete');
      }
    } catch (e) {
      showToast('Error removing product');
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      formData.append('productImages', files[i]);
    }

    try {
      const res = await fetch(`${storeApiUrl}/api/seller/products/upload-image`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.urls)) {
        setNewImageUrls(prev => [...prev, ...data.urls]);
        showToast('Image(s) uploaded successfully!');
      } else {
        showToast('Image upload failed');
      }
    } catch (err) {
      showToast('Image upload error');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const fetchAndOpenSellerTerms = async () => {
    setShowSellerTermsModal(true);
    if (!sellerTermsData) {
      setIsLoadingSellerTerms(true);
      try {
        const res = await fetch(`${storeApiUrl}/api/terms?type=seller`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.terms) {
            setSellerTermsData({
              title: data.terms.title || 'Seller & Packaging Manufacturer Terms and Conditions',
              content: data.terms.content || '',
              updatedAt: data.terms.updatedAt
            });
          }
        }
      } catch (err) {
        console.warn('Error fetching live seller terms:', err);
      } finally {
        setIsLoadingSellerTerms(false);
      }
    }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidModalItem || !bidAmount) return;

    if (!hasRequiredKyc) {
      showToast(currentLang === 'bn' ? 'কাস্টম অর্ডারে বিড করতে ট্রেড লাইসেন্স ও এনআইডি জমা দেওয়া আবশ্যক।' : 'Custom order bidding requires Trade License and National ID verification.');
      setBidModalItem(null);
      setActiveTab('settings');
      return;
    }

    if (!bidTermsAccepted) {
      showToast(currentLang === 'bn' ? 'কোটেশন জমা দিতে অনুগ্রহ করে সেলার ম্যানুফ্যাকচারিং শর্তাবলী স্বীকার করুন।' : 'Please accept the Seller Manufacturing Terms & Conditions to submit your quote.');
      return;
    }

    setIsSubmittingBid(true);
    const amountNum = parseFloat(bidAmount);
    const qty = bidModalItem.quantity || 1;
    const totalAmountVal = Math.round(amountNum * qty * 100) / 100;

    try {
      const res = await fetch(`${storeApiUrl}/api/public/custom-order/${bidModalItem.id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: currentSeller.id || ('SELLER-' + (currentSeller.phone || Date.now())),
          sellerPhone: currentSeller.phone || '',
          sellerName: currentSeller.shopName || 'Verified Packaging Supplier',
          amount: amountNum,
          unitPrice: amountNum,
          totalAmount: totalAmountVal,
          deliveryTime: bidDeliveryTime || '3-5 Working Days',
          note: bidNote.trim() || `Factory quotation from ${currentSeller.shopName || 'packaging manufacturer'}`,
          termsAccepted: true
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresKyc) {
          showToast(currentLang === 'bn' ? 'কাস্টম অর্ডারে বিড করতে আপনার ট্রেড লাইসেন্স ও এনআইডি তথ্য আপডেট করুন।' : (data.error || 'KYC verification required to bid on custom orders.'));
          setBidModalItem(null);
          setActiveTab('settings');
          return;
        }
        showToast(data.message || data.error || 'Failed to submit quotation');
        return;
      }
      setBids(bids.map(b => b.id === bidModalItem.id ? { ...b, bidPlaced: amountNum } : b));
      setBidModalItem(null);
      setBidAmount('');
      setBidNote('');
      setBidTermsAccepted(false);
      showToast(currentLang === 'bn' ? 'পাইকারি অর্ডারে আপনার আনুষ্ঠানিক ফ্যাক্টরি কোটেশন সফলভাবে জমা হয়েছে!' : 'Official wholesale factory quotation submitted successfully!');
    } catch (err) {
      console.warn('Bid submission error:', err);
      showToast('Network error submitting bid. Please try again.');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const openSellerChat = async (item: CustomBidRequest) => {
    setSellerChatModalItem(item);
    setChatMessageText('');
    setChatFilterWarning(null);
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`${storeApiUrl}/api/public/custom-order/${item.id}/messages?sellerId=${encodeURIComponent(seller.id || currentSeller.phone || 'seller')}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setSellerChatMessages(data.messages);
      } else {
        setSellerChatMessages([]);
      }
    } catch (err) {
      console.warn('Failed to load chat messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleChatInputChange = (val: string) => {
    setChatMessageText(val);

    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(\b[a-zA-Z0-9._%+-]+\s*(at|@|\[at\]|\(at\))\s*[a-zA-Z0-9.-]+\s*(dot|\.|\(dot\)|\bcom\b|\bnet\b))/i;
    const bengaliDigits: Record<string, string> = {'০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9'};
    const normalized = val.replace(/[০-৯]/g, d => bengaliDigits[d] || d);
    const digitsOnly = normalized.replace(/\D/g, '');

    const hasPhone = /(^|01|8801|\+8801)[3-9]\d{8}/.test(digitsOnly) || (digitsOnly.length >= 10 && /(01[3-9]\d{8})/.test(digitsOnly));
    const hasEmail = emailRegex.test(val);
    const hasSocialOrOffsite = /\b(whatsapp|wa\.me|imo|telegram|viber|skype|call\s*me|phone\s*me|my\s*number|bkash|nagad|rocket|meet\s*me|deal\s*outside|যোগাযোগ|ফোন|নাম্বার|কল\s*দিন)\b/i.test(normalized);

    if (hasEmail || hasPhone || hasSocialOrOffsite) {
      setChatFilterWarning(hasEmail
        ? '⚠️ Sharing email addresses is not permitted to protect buyer and seller safety.'
        : (hasPhone
            ? '⚠️ Direct phone numbers cannot be shared. Keep all communication inside PackBang.'
            : '⚠️ External contacts (WhatsApp, Imo, bKash, offline deals) are strictly prohibited.'));
    } else {
      setChatFilterWarning(null);
    }
  };

  const handleSendSellerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerChatModalItem || !chatMessageText.trim() || chatFilterWarning) return;

    setIsSendingMessage(true);
    try {
      const res = await fetch(`${storeApiUrl}/api/public/custom-order/${sellerChatModalItem.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: currentSeller.id || ('SELLER-' + (currentSeller.phone || 'supplier')),
          sellerName: currentSeller.shopName || 'Verified Packaging Supplier',
          text: chatMessageText.trim()
        })
      });

      if (!res.ok) {
        let errData: any;
        try { errData = await res.json(); } catch (_) {}
        if (errData && errData.message) {
          alert(errData.message);
          return;
        }
        if (res.status === 404) {
          alert('Backend service is updating. Please deploy latest commit on Render or wait a moment.');
          return;
        }
        throw new Error('HTTP ' + res.status);
      }

      const data = await res.json();
      if (data.success) {
        setChatMessageText('');
        if (data.chatMessage) {
          setSellerChatMessages(prev => [...prev, data.chatMessage]);
        }
      } else {
        alert(data.message || 'Message blocked or failed');
      }
    } catch (err: any) {
      console.error('Chat send error:', err);
      alert('Network error sending message: ' + (err.message || 'Please check connection or backend deployment status.'));
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="packbang-seller-app">
      {/* Toast Notification */}
      {notification && (
        <div className="pb-toast-notification">
          <span>✅</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      {showMobileSidebar && (
        <div 
          className="pb-mobile-backdrop" 
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (Desktop & Mobile Drawer)                                 */}
      {/* ========================================================================= */}
      <aside className={`pb-sidebar ${showMobileSidebar ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="pb-sidebar-brand" onClick={onGoLanding} title="View Packbang Portal">
          <div className="pb-brand-logo-card">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="#10B981" />
              <path d="M18 7L28 12.5V23.5L18 29L8 23.5V12.5L18 7Z" fill="#047857" />
              <path d="M18 7L28 12.5L18 18L8 12.5L18 7Z" fill="#34D399" />
              <path d="M18 18V29L8 23.5V12.5L18 18Z" fill="#065F46" />
              <path d="M18 18V29L28 23.5V12.5L18 18Z" fill="#059669" />
            </svg>
          </div>
          <div className="pb-brand-info">
            <div className="pb-brand-name">Packbang</div>
            <div className="pb-brand-sub">Seller Center</div>
          </div>
          {/* Close drawer on mobile */}
          <button 
            type="button" 
            className="pb-close-drawer-btn" 
            onClick={(e) => { e.stopPropagation(); setShowMobileSidebar(false); }}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Navigation Menu (Preserves all 5 existing core options) */}
        <nav className="pb-sidebar-nav">
          <button
            type="button"
            className={`pb-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setShowMobileSidebar(false); }}
          >
            <span className="pb-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <span className="pb-nav-text">{currentLang === 'bn' ? 'ওভারভিউ ও অর্ডার' : 'Overview & Orders'}</span>
          </button>

          <button
            type="button"
            className={`pb-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => { setActiveTab('products'); setShowMobileSidebar(false); }}
          >
            <span className="pb-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </span>
            <span className="pb-nav-text">{currentLang === 'bn' ? 'প্যাকেজিং ইনভেন্টরি' : 'Packaging Inventory'}</span>
          </button>

          <button
            type="button"
            className={`pb-nav-item ${activeTab === 'bids' ? 'active' : ''}`}
            onClick={() => { setActiveTab('bids'); setShowMobileSidebar(false); }}
          >
            <span className="pb-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </span>
            <span className="pb-nav-text">{currentLang === 'bn' ? 'পাইকারি কোটেশন বিড' : 'Wholesale Bids'}</span>
            <span className="pb-badge-pill">{bids.length || 36}</span>
          </button>

          <button
            type="button"
            className={`pb-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveTab('reports'); setShowMobileSidebar(false); }}
          >
            <span className="pb-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
            <span className="pb-nav-text">{currentLang === 'bn' ? 'বিক্রয় রিপোর্ট' : 'Sales Report'}</span>
          </button>

          <button
            type="button"
            className={`pb-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setShowMobileSidebar(false); }}
          >
            <span className="pb-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span className="pb-nav-text">{currentLang === 'bn' ? 'ফ্যাক্টরি প্রোফাইল' : 'Factory Profile'}</span>
          </button>
        </nav>

        {/* Sidebar Promo Card: Grow Your Business with Packbang */}
        <div className="pb-sidebar-promo">
          <div className="pb-promo-rocket">🚀</div>
          <div className="pb-promo-title">{currentLang === 'bn' ? 'ব্যবসা সম্প্রসারণ করুন' : 'Grow Your Business with Packbang'}</div>
          <button
            type="button"
            className="pb-promo-btn"
            onClick={() => { setActiveTab('bids'); setShowMobileSidebar(false); }}
          >
            {currentLang === 'bn' ? 'কাস্টম বিড দেখুন →' : 'Learn More →'}
          </button>
        </div>

        {/* Sidebar Need Help Footer */}
        <div className="pb-sidebar-help">
          <span className="pb-help-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
          </span>
          <div className="pb-help-content">
            <div className="pb-help-title">{currentLang === 'bn' ? 'সাহায্য প্রয়োজন?' : 'Need Help?'}</div>
            <a href="mailto:support@packbang.com" className="pb-help-email">support@packbang.com</a>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN LAYOUT AREA                                                      */}
      {/* ========================================================================= */}
      <div className="pb-main-layout">
        
        {/* TOP APP BAR */}
        <header className="pb-top-bar">
          <div className="pb-top-bar-left">
            {/* Hamburger on mobile */}
            <button 
              type="button" 
              className="pb-hamburger-btn" 
              onClick={() => setShowMobileSidebar(true)}
              aria-label="Open menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Mobile Brand Logo */}
            <div className="pb-mobile-brand" onClick={onGoLanding}>
              <div className="pb-brand-logo-card small">
                <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
                  <rect width="36" height="36" rx="8" fill="#10B981" />
                  <path d="M18 7L28 12.5V23.5L18 29L8 23.5V12.5L18 7Z" fill="#047857" />
                  <path d="M18 7L28 12.5L18 18L8 12.5L18 7Z" fill="#34D399" />
                </svg>
              </div>
              <span className="pb-mobile-brand-title">Packbang</span>
            </div>

            {/* Search Bar Input */}
            <div className="pb-search-box">
              <svg className="pb-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder={currentLang === 'bn' ? 'অর্ডার বা পণ্য সার্চ করুন...' : 'Search orders, products...'}
                className="pb-search-input"
              />
            </div>
          </div>

          <div className="pb-top-bar-right">
            {/* Notification Bell */}
            <div className="pb-bell-wrapper" title="3 Notifications">
              <button type="button" className="pb-bell-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="pb-bell-badge">3</span>
              </button>
            </div>

            {/* User Profile Pill with Dropdown */}
            <div className="pb-profile-dropdown-wrapper">
              <div 
                className="pb-profile-pill" 
                onClick={() => setShowUserDropdown(prev => !prev)}
                title="Account Settings"
              >
                <div className="pb-avatar-circle">
                  {(currentSeller.ownerName || currentSeller.shopName || 'KH').substring(0, 2).toUpperCase()}
                </div>
                <span className="pb-profile-name">
                  {currentSeller.ownerName || currentSeller.shopName || 'Kayum Hossain'}
                </span>
                <svg className="pb-profile-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {showUserDropdown && (
                <div className="pb-profile-menu">
                  <div className="pb-profile-menu-header">
                    <div className="pb-menu-shop-name">{currentSeller.shopName}</div>
                    <div className="pb-menu-phone">{currentSeller.phone}</div>
                  </div>
                  <div className="pb-profile-menu-links">
                    <button 
                      type="button" 
                      onClick={() => { setActiveTab('settings'); setShowUserDropdown(false); }}
                      className="pb-menu-link"
                    >
                      ⚙️ {currentLang === 'bn' ? 'ফ্যাক্টরি প্রোফাইল ও কেওয়াইসি' : 'Factory Profile & KYC'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { onLangChange(currentLang === 'en' ? 'bn' : 'en'); setShowUserDropdown(false); }}
                      className="pb-menu-link"
                    >
                      🌐 {currentLang === 'en' ? 'বাংলা সংস্করণ' : 'English Version'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { onGoLanding(); setShowUserDropdown(false); }}
                      className="pb-menu-link"
                    >
                      🏪 {currentLang === 'bn' ? 'মার্কেটপ্লেস স্টোর দেখুন' : 'View Public Storefront'}
                    </button>
                    <div className="pb-menu-divider" />
                    <button 
                      type="button" 
                      onClick={() => { onLogout(); setShowUserDropdown(false); }}
                      className="pb-menu-link text-danger"
                    >
                      🚪 {currentLang === 'bn' ? 'লগআউট' : 'Logout'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="pb-content-container">

          {/* Verification & KYC Status Alert Banner (Non-intrusive) */}
          {!hasRequiredKyc ? (
            <div className="pb-kyc-alert-banner">
              <div className="pb-alert-left">
                <div className="pb-alert-badge-icon">⚡</div>
                <div>
                  <div className="pb-alert-title">
                    {currentLang === 'bn' ? 'ক্যাটালগ পণ্য বিক্রি সক্রিয় — পাইকারি কোটেশন বিডের জন্য কেওয়াইসি তথ্য দিন' : 'Catalog Sales Active — Complete KYC for Custom Wholesale Bids'}
                  </div>
                  <div className="pb-alert-desc">
                    {currentLang === 'bn'
                      ? 'প্যাকেজিং পণ্য বিক্রয় চালু আছে। তবে কাস্টম অর্ডারে বিড ও ব্যাংক উইথড্র এর জন্য ট্রেড লাইসেন্স ও এনআইডি আপলোড করুন।'
                      : 'You can sell ready-stock packaging items right away. To place bids on custom bulk cartons, submit your Trade License and NID.'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="pb-alert-cta-btn"
              >
                {currentLang === 'bn' ? 'কেওয়াইসি সম্পন্ন করুন →' : 'Complete Verification →'}
              </button>
            </div>
          ) : isPendingApproval ? (
            <div className="pb-kyc-alert-banner pending">
              <div className="pb-alert-left">
                <div className="pb-alert-badge-icon">⏳</div>
                <div>
                  <div className="pb-alert-title">
                    {currentLang === 'bn' ? 'কেওয়াইসি যাচাই প্রক্রিয়াধীন রয়েছে' : 'KYC Verification Under Review'}
                  </div>
                  <div className="pb-alert-desc">
                    {currentLang === 'bn'
                      ? 'আপনার ডকুমেন্ট সফলভাবে জমা হয়েছে। অ্যাডমিন টিম যাচাই সম্পন্ন করলে পাইকারি কাস্টম বিড সক্রিয় হবে।'
                      : 'Your Trade License and NID are being reviewed. Catalog selling remains active.'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="pb-alert-cta-btn pending"
              >
                {currentLang === 'bn' ? 'ডকুমেন্ট দেখুন' : 'View Submitted Info'}
              </button>
            </div>
          ) : null}

          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW & ORDERS (Exact Match to Reference Photo)                 */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="pb-overview-tab">
              {/* Header Row: Welcome back, Seller! + Controls */}
              <div className="pb-page-header-row">
                <div className="pb-page-header-text">
                  <h1 className="pb-welcome-title">
                    {currentLang === 'bn' ? `স্বাগতম, ${currentSeller.ownerName || currentSeller.shopName || 'সেলার'}!` : `Welcome back, ${currentSeller.ownerName || currentSeller.shopName || 'Seller'}!`}
                  </h1>
                  <p className="pb-welcome-subtitle">
                    {currentLang === 'bn' ? 'আজকে আপনার স্টোরের সাম্প্রতিক হালনাগাদ ও অর্ডারসমূহ।' : "Here's what's happening with your store today."}
                  </p>
                </div>

                <div className="pb-page-header-actions">
                  {/* Date Filter Dropdown */}
                  <div className="pb-date-dropdown-wrapper">
                    <button
                      type="button"
                      className="pb-date-filter-btn"
                      onClick={() => setShowDateRangeDropdown(prev => !prev)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>{dateRangeFilter}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {showDateRangeDropdown && (
                      <div className="pb-date-dropdown-menu">
                        {['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Fiscal Year'].map(range => (
                          <button
                            key={range}
                            type="button"
                            className={`pb-date-option ${dateRangeFilter === range ? 'selected' : ''}`}
                            onClick={() => { setDateRangeFilter(range); setShowDateRangeDropdown(false); }}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Primary CTA: + Add Product */}
                  <button
                    type="button"
                    className="pb-add-product-btn"
                    onClick={() => {
                      if (isSuspended) {
                        showToast(currentLang === 'bn' ? 'অ্যাকাউন্ট সাময়িকভাবে স্থগিত রয়েছে।' : 'Account is currently suspended.');
                      } else if (isBanned) {
                        showToast(currentLang === 'bn' ? 'অ্যাকাউন্ট স্থায়ীভাবে বন্ধ।' : 'Account is banned.');
                      } else {
                        setShowAddModal(true);
                      }
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>{currentLang === 'bn' ? 'পণ্য যোগ করুন' : 'Add Product'}</span>
                  </button>
                </div>
              </div>

              {/* 4 Pastel Stat Cards (Exact Color and Trend Mapping) */}
              <div className="pb-stats-grid">
                
                {/* 1. Total Sales */}
                <div className="pb-stat-card mint">
                  <div className="pb-stat-top">
                    <div className="pb-stat-icon-box mint">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                    </div>
                    <span className="pb-stat-title">{currentLang === 'bn' ? 'মোট বিক্রয়' : 'Total Sales'}</span>
                  </div>
                  <div className="pb-stat-body">
                    <div className="pb-stat-value">
                      ৳{sellerMetrics.totalRevenue ? sellerMetrics.totalRevenue.toLocaleString() : '2,45,800'}
                    </div>
                    <div className="pb-stat-sparkline mint">
                      <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
                        <rect x="2" y="14" width="5" height="8" rx="2" fill="#10B981" />
                        <rect x="11" y="10" width="5" height="12" rx="2" fill="#10B981" />
                        <rect x="20" y="6" width="5" height="16" rx="2" fill="#10B981" />
                        <rect x="29" y="2" width="5" height="20" rx="2" fill="#10B981" />
                      </svg>
                    </div>
                  </div>
                  <div className="pb-stat-trend positive">
                    <span>↑ 12.5%</span>
                    <span className="pb-trend-sub">vs previous period</span>
                  </div>
                </div>

                {/* 2. Total Orders */}
                <div className="pb-stat-card sky">
                  <div className="pb-stat-top">
                    <div className="pb-stat-icon-box sky">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                    </div>
                    <span className="pb-stat-title">{currentLang === 'bn' ? 'মোট অর্ডার' : 'Total Orders'}</span>
                  </div>
                  <div className="pb-stat-body">
                    <div className="pb-stat-value">
                      {orders.length ? orders.length.toLocaleString() : '1,248'}
                    </div>
                    <div className="pb-stat-sparkline sky">
                      <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
                        <rect x="2" y="12" width="5" height="10" rx="2" fill="#3B82F6" />
                        <rect x="11" y="8" width="5" height="14" rx="2" fill="#3B82F6" />
                        <rect x="20" y="14" width="5" height="8" rx="2" fill="#3B82F6" />
                        <rect x="29" y="4" width="5" height="18" rx="2" fill="#3B82F6" />
                      </svg>
                    </div>
                  </div>
                  <div className="pb-stat-trend positive">
                    <span>↑ 8.3%</span>
                    <span className="pb-trend-sub">vs previous period</span>
                  </div>
                </div>

                {/* 3. Pending Orders */}
                <div className="pb-stat-card amber">
                  <div className="pb-stat-top">
                    <div className="pb-stat-icon-box amber">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <span className="pb-stat-title">{currentLang === 'bn' ? 'প্রক্রিয়াধীন অর্ডার' : 'Pending Orders'}</span>
                  </div>
                  <div className="pb-stat-body">
                    <div className="pb-stat-value">
                      {orders.filter(o => o.status === 'Processing').length || 36}
                    </div>
                    <div className="pb-stat-sparkline amber">
                      <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
                        <rect x="2" y="6" width="5" height="16" rx="2" fill="#F59E0B" />
                        <rect x="11" y="10" width="5" height="12" rx="2" fill="#F59E0B" />
                        <rect x="20" y="8" width="5" height="14" rx="2" fill="#F59E0B" />
                        <rect x="29" y="12" width="5" height="10" rx="2" fill="#F59E0B" />
                      </svg>
                    </div>
                  </div>
                  <div className="pb-stat-trend warning">
                    <span>↓ 5.0%</span>
                    <span className="pb-trend-sub">vs previous period</span>
                  </div>
                </div>

                {/* 4. Low Stock Items */}
                <div className="pb-stat-card lilac">
                  <div className="pb-stat-top">
                    <div className="pb-stat-icon-box lilac">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                    <span className="pb-stat-title">{currentLang === 'bn' ? 'স্বল্প স্টকের পণ্য' : 'Low Stock Items'}</span>
                  </div>
                  <div className="pb-stat-body">
                    <div className="pb-stat-value">
                      {products.filter(p => p.status === 'low_stock' || p.stock < 100).length || 12}
                    </div>
                    <div className="pb-stat-sparkline lilac">
                      <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
                        <rect x="2" y="4" width="5" height="18" rx="2" fill="#8B5CF6" />
                        <rect x="11" y="8" width="5" height="14" rx="2" fill="#8B5CF6" />
                        <rect x="20" y="14" width="5" height="8" rx="2" fill="#8B5CF6" />
                        <rect x="29" y="16" width="5" height="6" rx="2" fill="#8B5CF6" />
                      </svg>
                    </div>
                  </div>
                  <div className="pb-stat-trend purple">
                    <span>↓ 20.0%</span>
                    <span className="pb-trend-sub">vs previous period</span>
                  </div>
                </div>

              </div>

              {/* Middle Row: Sales Overview Chart + Top-Selling Products */}
              <div className="pb-middle-row-grid">
                
                {/* Left: Sales Overview Interactive Line Chart */}
                <div className="pb-chart-card">
                  <div className="pb-chart-card-header">
                    <div className="pb-chart-title-wrap">
                      <span className="pb-chart-icon-box">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="20" x2="18" y2="10" />
                          <line x1="12" y1="20" x2="12" y2="4" />
                          <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                      </span>
                      <h3 className="pb-chart-heading">{currentLang === 'bn' ? 'বিক্রয় পর্যালোচনা' : 'Sales Overview'}</h3>
                    </div>

                    {/* Period Tabs: 7D, 30D, 90D */}
                    <div className="pb-chart-period-tabs">
                      {(['7D', '30D', '90D'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          className={`pb-period-pill ${salesOverviewPeriod === p ? 'active' : ''}`}
                          onClick={() => setSalesOverviewPeriod(p)}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SVG Chart Graphic */}
                  <div className="pb-svg-chart-container">
                    <svg viewBox="0 0 540 170" className="pb-sales-svg" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="pbAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Y-Axis Gridlines */}
                      <line x1="45" y1="25" x2="520" y2="25" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="45" y1="60" x2="520" y2="60" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="45" y1="95" x2="520" y2="95" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="45" y1="130" x2="520" y2="130" stroke="#F1F5F9" strokeWidth="1" />

                      {/* Y-Axis Labels */}
                      <text x="35" y="29" textAnchor="end" className="pb-axis-label">2L</text>
                      <text x="35" y="64" textAnchor="end" className="pb-axis-label">1.5L</text>
                      <text x="35" y="99" textAnchor="end" className="pb-axis-label">1L</text>
                      <text x="35" y="134" textAnchor="end" className="pb-axis-label">50k</text>
                      <text x="35" y="158" textAnchor="end" className="pb-axis-label">0</text>

                      {/* Area Fill Under Bezier Curve */}
                      <path
                        d="M 60 120 C 110 100, 150 70, 190 85 C 230 100, 270 125, 310 90 C 350 55, 390 40, 440 28 C 475 48, 495 55, 515 35 L 515 150 L 60 150 Z"
                        fill="url(#pbAreaGradient)"
                      />

                      {/* Smooth Green Bezier Curve */}
                      <path
                        d="M 60 120 C 110 100, 150 70, 190 85 C 230 100, 270 125, 310 90 C 350 55, 390 40, 440 28 C 475 48, 495 55, 515 35"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      {/* Data Point Markers */}
                      {[
                        { cx: 60, cy: 120, val: '৳55,000' },
                        { cx: 190, cy: 85, val: '৳85,000' },
                        { cx: 310, cy: 90, val: '৳92,000' },
                        { cx: 440, cy: 28, val: '৳1,82,500', isPeak: true },
                        { cx: 515, cy: 35, val: '৳1,68,000' }
                      ].map((pt, idx) => (
                        <g 
                          key={idx} 
                          style={{ cursor: 'pointer' }}
                          onClick={() => setActiveChartPoint(idx)}
                        >
                          <circle
                            cx={pt.cx}
                            cy={pt.cy}
                            r={activeChartPoint === idx ? 6 : (pt.isPeak ? 5 : 4)}
                            fill={activeChartPoint === idx ? "#059669" : "#FFFFFF"}
                            stroke="#10B981"
                            strokeWidth={activeChartPoint === idx ? 3 : 2.5}
                          />
                        </g>
                      ))}
                    </svg>

                    {/* Floating Peak Tooltip (Matches ৳1,82,500 in Photo) */}
                    <div className="pb-chart-peak-tooltip">
                      <span className="pb-tooltip-val">
                        {activeChartPoint === 0 ? '৳55,000' : 
                         activeChartPoint === 1 ? '৳85,000' : 
                         activeChartPoint === 2 ? '৳92,000' : 
                         activeChartPoint === 4 ? '৳1,68,000' : '৳1,82,500'}
                      </span>
                      <div className="pb-tooltip-arrow" />
                    </div>

                    {/* X-Axis Date Labels */}
                    <div className="pb-chart-x-labels">
                      <span>Oct 6</span>
                      <span>Oct 13</span>
                      <span>Oct 20</span>
                      <span>Oct 27</span>
                      <span>Nov 4</span>
                    </div>
                  </div>
                </div>

                {/* Right: Top-Selling Products */}
                <div className="pb-top-products-card">
                  <div className="pb-top-products-header">
                    <span className="pb-trophy-icon">🏆</span>
                    <h3 className="pb-top-products-title">{currentLang === 'bn' ? 'শীর্ষ বিক্রিত পণ্য' : 'Top-Selling Products'}</h3>
                  </div>

                  <div className="pb-products-rank-list">
                    {/* Item 1 */}
                    <div className="pb-ranked-item">
                      <div className="pb-rank-number rank-1">1</div>
                      <div className="pb-product-thumbnail-box box-carton">
                        📦
                      </div>
                      <div className="pb-product-details">
                        <div className="pb-product-title">Corrugated Box (5 Ply)</div>
                        <div className="pb-product-sold">584 sold</div>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="pb-ranked-item">
                      <div className="pb-rank-number rank-2">2</div>
                      <div className="pb-product-thumbnail-box box-poly">
                        ✉️
                      </div>
                      <div className="pb-product-details">
                        <div className="pb-product-title">Courier Bag (12" x 16")</div>
                        <div className="pb-product-sold">420 sold</div>
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div className="pb-ranked-item">
                      <div className="pb-rank-number rank-3">3</div>
                      <div className="pb-product-thumbnail-box box-bubble">
                        🫧
                      </div>
                      <div className="pb-product-details">
                        <div className="pb-product-title">Bubble Wrap (1m x 50m)</div>
                        <div className="pb-product-sold">312 sold</div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="pb-view-all-products-link"
                    onClick={() => setActiveTab('products')}
                  >
                    <span>{currentLang === 'bn' ? 'সকল পণ্য দেখুন →' : 'View All Products →'}</span>
                  </button>
                </div>

              </div>

              {/* Bottom Row: Recent Orders Table & Mobile Cards */}
              <div className="pb-recent-orders-card">
                <div className="pb-orders-card-header">
                  <div className="pb-orders-title-wrap">
                    <span className="pb-orders-icon">📋</span>
                    <h3 className="pb-orders-heading">{currentLang === 'bn' ? 'সাম্প্রতিক অর্ডারসমূহ' : 'Recent Orders'}</h3>
                  </div>
                  <button
                    type="button"
                    className="pb-view-all-orders-btn"
                    onClick={() => setShowAllOrders(prev => !prev)}
                  >
                    {showAllOrders 
                      ? (currentLang === 'bn' ? 'সংক্ষেপ দেখুন ↑' : 'Show Less ↑') 
                      : (currentLang === 'bn' ? 'সবগুলো দেখুন →' : 'View All →')}
                  </button>
                </div>

                {/* Desktop Orders Table */}
                <div className="pb-desktop-orders-table-wrapper">
                  {isLoadingOrders && (
                    <div style={{ padding: '8px 12px', fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
                      ⏳ {currentLang === 'bn' ? 'অর্ডার তালিকা লোড হচ্ছে...' : 'Syncing live factory orders...'}
                    </div>
                  )}
                  <table className="pb-orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Order Date</th>
                        <th>Status</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(orders.length > 0 ? orders : [
                        { orderId: 'PB-1001248', buyerShop: 'Rahim Uddin', date: 'Nov 04, 2026, 09:15 AM', status: 'Pending', amount: 8750 },
                        { orderId: 'PB-1001247', buyerShop: 'Fatema Akter', date: 'Nov 04, 2026, 08:42 AM', status: 'Processing', amount: 12300 },
                        { orderId: 'PB-1001246', buyerShop: 'Md. Hasan', date: 'Nov 04, 2026, 07:50 AM', status: 'Shipped', amount: 6200 },
                        { orderId: 'PB-1001245', buyerShop: 'Nusrat Jahan', date: 'Nov 03, 2026, 06:30 PM', status: 'Delivered', amount: 9100 },
                        { orderId: 'PB-1001244', buyerShop: 'Karim Hossain', date: 'Nov 03, 2026, 04:20 PM', status: 'Processing', amount: 7650 }
                      ]).slice(0, showAllOrders ? undefined : 5).map((ord: any) => (
                        <tr key={ord.orderId}>
                          <td className="font-semibold text-slate">{ord.orderId}</td>
                          <td className="font-medium text-slate-800">{ord.buyerShop || 'Customer'}</td>
                          <td className="text-muted text-sm">{ord.date}</td>
                          <td>
                            <span className={`pb-status-badge ${(ord.status || 'Pending').toLowerCase()}`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="font-bold text-slate-900">৳{ord.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Orders Card List (Matches iPhone Mockup in Photo) */}
                <div className="pb-mobile-orders-cards">
                  {(orders.length > 0 ? orders : [
                    { orderId: 'PB-1001248', buyerShop: 'Rahim Uddin', date: 'Nov 04, 09:15 AM', status: 'Pending', amount: 8750, icon: '📦' },
                    { orderId: 'PB-1001247', buyerShop: 'Fatema Akter', date: 'Nov 04, 08:42 AM', status: 'Processing', amount: 12300, icon: '✉️' }
                  ]).slice(0, showAllOrders ? undefined : 3).map((ord: any, idx: number) => (
                    <div key={ord.orderId || idx} className="pb-mobile-order-card">
                      <div className="pb-card-product-icon">
                        {ord.icon || (idx % 2 === 0 ? '📦' : '✉️')}
                      </div>
                      <div className="pb-card-mid">
                        <div className="pb-card-order-id">{ord.orderId}</div>
                        <div className="pb-card-amount">৳{ord.amount.toLocaleString()}</div>
                        <div className="pb-card-date">{ord.date}</div>
                      </div>
                      <div className="pb-card-right">
                        <span className={`pb-status-badge ${(ord.status || 'Pending').toLowerCase()}`}>
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}

{/* TAB 2: PACKAGING INVENTORY */}
        {activeTab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Stat Summary Cards */}
            <div className="seller-products-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📦</div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Listings</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>{products.length}</div>
                </div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>💰</div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>In-Stock Valuation</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669' }}>
                    ৳ {products.reduce((acc, p) => acc + (p.unitPrice * p.stock), 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚠️</div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Low Stock Alert</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#DC2626' }}>
                    {products.filter(p => p.stock <= 20).length}
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Container */}
            <div className="seller-content-card" style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              boxSizing: 'border-box'
            }}>
              {/* Header and Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0', color: '#0F172A' }}>
                    {currentLang === 'bn' ? 'ফ্যাক্টরি প্যাকেজিং ইনভেন্টরি' : 'Factory Packaging Catalog & Inventory'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                    {currentLang === 'bn'
                      ? 'এখানে যোগ করা পণ্য সরাসরি packbang.com ক্যাটালগে ক্রেতারা দেখতে ও অর্ডার করতে পারবেন।'
                      : 'Products listed here are instantly published to packbang.com storefront for customer orders.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={fetchSellerProducts}
                    title="Refresh product list"
                    style={{
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#475569'
                    }}
                  >
                    🔄 {isLoadingProducts ? 'Loading...' : 'Refresh'}
                  </button>

                  <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #FF5A1F, #E64A19)',
                      color: '#fff',
                      border: 'none',
                      padding: '11px 20px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(255, 90, 31, 0.35)'
                    }}
                  >
                    <span>+</span> {currentLang === 'bn' ? 'নতুন পণ্য পোস্ট করুন' : 'Post New Product'}
                  </button>
                </div>
              </div>

              {/* Filters & Search Row */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                  <input
                    type="text"
                    placeholder={currentLang === 'bn' ? 'পণ্যের নাম বা SKU দিয়ে খুঁজুন...' : 'Search product title or SKU...'}
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <select
                  value={selectedCategoryFilter}
                  onChange={e => setSelectedCategoryFilter(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    background: '#fff',
                    outline: 'none',
                    fontWeight: 600,
                    color: '#334155'
                  }}
                >
                  <option value="All">All Categories</option>
                  {categoriesList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={e => setSelectedStatusFilter(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    background: '#fff',
                    outline: 'none',
                    fontWeight: 600,
                    color: '#334155'
                  }}
                >
                  <option value="All">All Status</option>
                  <option value="in_stock">In Stock (10+)</option>
                  <option value="low_stock">Low Stock (1-10)</option>
                  <option value="out_of_stock">Out of Stock (0)</option>
                </select>
              </div>

              {/* Products Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
                      <th style={{ padding: '12px 14px' }}>Product</th>
                      <th style={{ padding: '12px 14px' }}>Category</th>
                      <th style={{ padding: '12px 14px' }}>Unit Price (BDT)</th>
                      <th style={{ padding: '12px 14px' }}>Available Stock & MOQ</th>
                      <th style={{ padding: '12px 14px' }}>Listing Status</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Live Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products
                      .filter(p => {
                        const matchesSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.id.toLowerCase().includes(productSearch.toLowerCase());
                        const matchesCategory = selectedCategoryFilter === 'All' || p.category === selectedCategoryFilter;
                        const matchesStatus = selectedStatusFilter === 'All' || p.status === selectedStatusFilter;
                        return matchesSearch && matchesCategory && matchesStatus;
                      })
                      .map(p => {
                        const thumb = p.imagePath || (p.images && p.images[0]) || '/uploads/default.jpg';
                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '14px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img
                                  src={thumb}
                                  alt={p.name}
                                  onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=100&auto=format&fit=crop&q=60'; }}
                                  style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '8px',
                                    objectFit: 'cover',
                                    border: '1px solid #E2E8F0',
                                    background: '#F8FAFC'
                                  }}
                                />
                                <div>
                                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '14px', maxWidth: '300px', lineHeight: '1.4' }}>
                                    {p.name}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginTop: '2px' }}>
                                    SKU: <span style={{ color: '#64748B' }}>{p.id}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '14px 14px' }}>
                              <span style={{ background: '#F1F5F9', color: '#334155', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                                {p.category}
                              </span>
                            </td>

                            <td style={{ padding: '14px 14px' }}>
                              <div style={{ fontWeight: 800, color: '#FF5A1F', fontSize: '15px' }}>
                                ৳ {p.unitPrice.toFixed(2)}
                              </div>
                              {p.originalPrice && p.originalPrice > p.unitPrice && (
                                <div style={{ fontSize: '11px', color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>
                                  ৳ {p.originalPrice.toFixed(2)}
                                </div>
                              )}
                            </td>

                            <td style={{ padding: '14px 14px' }}>
                              <div style={{ fontWeight: 800, color: p.stock <= 10 ? '#DC2626' : '#0F172A', fontSize: '14px' }}>
                                {p.stock.toLocaleString()} {p.unit || 'pcs'}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                                MOQ: {p.moq || 1} {p.unit || 'pcs'}
                              </div>
                            </td>

                            <td style={{ padding: '14px 14px' }}>
                              {p.approvalStatus === 'pending' ? (
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  background: '#FEF3C7',
                                  color: '#92400E',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  ⏳ Awaiting Approval
                                </span>
                              ) : p.approvalStatus === 'rejected' ? (
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  background: '#FEE2E2',
                                  color: '#991B1B',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }} title={p.rejectionReason || 'Review required'}>
                                  ✕ Review Required
                                </span>
                              ) : (
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  background: p.stock > 10 ? '#DEF7EC' : (p.stock > 0 ? '#FEF08A' : '#FDE8E8'),
                                  color: p.stock > 10 ? '#03543F' : (p.stock > 0 ? '#854D0E' : '#9B1C1C'),
                                  display: 'inline-block'
                                }}>
                                  {p.stock > 10 ? '● In Stock' : (p.stock > 0 ? '▲ Low Stock' : '✕ Out of Stock')}
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '14px 14px' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                {p.approvalStatus === 'pending' ? (
                                  <span style={{
                                    background: '#F8FAFC',
                                    color: '#64748B',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    fontWeight: 700,
                                    fontSize: '11.5px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    ⏳ In Review
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => window.open(`${storeApiUrl}/product/${p.id}`, '_blank')}
                                    title="View Live on PackBang Storefront"
                                    style={{
                                      background: '#F0FDF4',
                                      color: '#15803D',
                                      border: '1px solid #BBF7D0',
                                      borderRadius: '6px',
                                      padding: '6px 10px',
                                      cursor: 'pointer',
                                      fontWeight: 700,
                                      fontSize: '12px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    🌐 View Live
                                  </button>
                                )}

                                <button
                                  onClick={() => setEditingProduct(p)}
                                  title="Edit Product"
                                  style={{
                                    background: '#EFF6FF',
                                    color: '#1D4ED8',
                                    border: '1px solid #BFDBFE',
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '12px'
                                  }}
                                >
                                  ✏️ Edit
                                </button>

                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  title="Delete Product"
                                  style={{
                                    background: '#FEF2F2',
                                    color: '#DC2626',
                                    border: '1px solid #FECACA',
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '12px'
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM WHOLESALE BIDS */}
        {activeTab === 'bids' && (
          <div>
            {!hasRequiredKyc && (
              <div style={{
                background: '#FFFBEB',
                border: '1.5px solid #F59E0B',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <div>
                    <strong style={{ color: '#92400E', fontSize: '14px', display: 'block' }}>
                      {currentLang === 'bn' ? 'কাস্টম অর্ডারে বিড করার জন্য কেওয়াইসি প্রয়োজন' : 'Custom Order Bidding Requires KYC Verification'}
                    </strong>
                    <span style={{ color: '#B45309', fontSize: '13px' }}>
                      {currentLang === 'bn'
                        ? 'আপনার সাধারণ প্যাকেজিং পণ্য বিক্রি চালু আছে। তবে কাস্টম প্রোডাকশন অর্ডারে কোটেশন দিতে ট্রেড লাইসেন্স ও জাতীয় পরিচয়পত্র (উভয় অংশ) জমা দিন।'
                        : 'Your ready-stock catalog selling is active. To submit quotation bids on custom manufacturing orders, please submit your Trade License and National ID (both sides).'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  style={{
                    background: '#D97706',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {currentLang === 'bn' ? 'কেওয়াইসি আপডেট করুন →' : 'Update KYC Now →'}
                </button>
              </div>
            )}

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
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={fetchAndOpenSellerTerms}
                  style={{
                    background: '#FFF7ED',
                    color: '#C2410C',
                    border: '1.5px solid #FFEDD5',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                  title="View Official Seller & Packaging Manufacturer Legal Terms"
                >
                  📜 {currentLang === 'bn' ? 'সেলার শর্তাবলী' : 'Seller Terms & Conditions'}
                </button>
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
                      <span>Quantity: <strong style={{ color: '#0F172A' }}>{b.quantity.toLocaleString()} {b.unit || 'pcs'}</strong></span>
                      <span>Target Budget: <strong style={{ color: '#059669' }}>{b.targetBudget}</strong></span>
                    </div>

                    {b.images && b.images.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {b.images.map((imgUrl, imgIdx) => (
                          <div
                            key={imgIdx}
                            onClick={() => {
                              setPreviewImageRotation(0);
                              setPreviewImageModal({ url: imgUrl, title: `Reference Spec #${imgIdx + 1} - ${b.id}` });
                            }}
                            style={{
                              width: '52px',
                              height: '52px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: '1.5px solid #CBD5E1',
                              cursor: 'pointer',
                              position: 'relative',
                              background: '#F1F5F9'
                            }}
                            title="Click to preview reference specification"
                          >
                            <img src={imgUrl} alt={`Spec ${imgIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    {b.bidPlaced ? (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#059669', fontWeight: 800, marginBottom: '4px' }}>
                          ✓ Quotation Submitted
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#FF5A1F' }}>
                          ৳ {b.bidPlaced.toFixed(2)} / {b.unit || 'unit'}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '8px' }}>
                          <a
                            href={`${storeApiUrl}/custom-order/${b.id}?sellerId=${encodeURIComponent(currentSeller.id || currentSeller.phone || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#0F172A',
                              color: '#FFFFFF',
                              textDecoration: 'none',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            👁️ {currentLang === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}
                          </a>
                          <button
                            type="button"
                            onClick={() => openSellerChat(b)}
                            style={{
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              border: '1px solid #BFDBFE',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            💬 Chat with Customer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <a
                          href={`${storeApiUrl}/custom-order/${b.id}?sellerId=${encodeURIComponent(currentSeller.id || currentSeller.phone || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: '#0F172A',
                            color: '#FFFFFF',
                            textDecoration: 'none',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          👁️ {currentLang === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}
                        </a>
                        <button
                          onClick={() => {
                            if (!hasRequiredKyc) {
                              showToast(currentLang === 'bn' ? 'কাস্টম অর্ডারে বিড করতে ফ্যাক্টরি প্রোফাইলে ট্রেড লাইসেন্স ও এনআইডি জমা দিন।' : 'Bidding on custom orders requires Trade License and NID verification. Please update KYC in Tab 4.');
                              setActiveTab('settings');
                              return;
                            }
                            setBidModalItem(b);
                            setBidAmount(b.bidPlaced ? String(b.bidPlaced) : '');
                            setBidDeliveryTime('3-5 Working Days');
                            setBidNote('');
                            setBidTermsAccepted(false);
                          }}
                          style={{
                            background: hasRequiredKyc ? '#FF5A1F' : '#D97706',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: hasRequiredKyc ? '0 4px 12px rgba(255, 90, 31, 0.3)' : '0 4px 12px rgba(217, 119, 6, 0.25)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {hasRequiredKyc ? (
                            <>⚡ {currentLang === 'bn' ? 'ফ্যাক্টরি বিড দিন' : 'Submit Factory Bid'}</>
                          ) : (
                            <>🔒 {currentLang === 'bn' ? 'কেওয়াইসি দিয়ে বিড করুন' : 'Update KYC to Bid'}</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

                {/* TAB 4: SALES REPORT */}
        {activeTab === 'reports' && (() => {
          const sellerTotalOrders = orders;
          const totalSellerRevenue = sellerTotalOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
          const regularSellerOrders = sellerTotalOrders.filter(o => o.type === 'direct_sale' || !o.type);
          const regularSellerRevenue = regularSellerOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
          const customSellerOrders = sellerTotalOrders.filter(o => o.type === 'custom_order');
          const customSellerRevenue = customSellerOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

          const filteredReportOrders = sellerTotalOrders.filter(o => {
            if (reportSaleType === 'regular' && o.type === 'custom_order') return false;
            if (reportSaleType === 'custom' && o.type !== 'custom_order') return false;
            if (reportStatusFilter !== 'all' && (o.status || '').toLowerCase() !== reportStatusFilter.toLowerCase()) return false;
            if (reportSearchQuery.trim()) {
              const q = reportSearchQuery.toLowerCase().trim();
              const matchId = (o.orderId || '').toLowerCase().includes(q);
              const matchBuyer = (o.buyerShop || '').toLowerCase().includes(q);
              const matchItems = (o.items || '').toLowerCase().includes(q);
              if (!matchId && !matchBuyer && !matchItems) return false;
            }
            return true;
          });

          filteredReportOrders.sort((a, b) => {
            if (reportSortBy === 'highest') return (b.amount || 0) - (a.amount || 0);
            if (reportSortBy === 'lowest') return (a.amount || 0) - (b.amount || 0);
            const dateA = new Date(a.date).getTime() || 0;
            const dateB = new Date(b.date).getTime() || 0;
            if (reportSortBy === 'oldest') return dateA - dateB;
            return dateB - dateA;
          });

          const visibleReportRevenue = filteredReportOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

          const exportSellerSalesReport = () => {
            if (filteredReportOrders.length === 0) {
              alert('No sales data currently visible to export!');
              return;
            }
            const headers = ['Order ID', 'Sale Type', 'Buyer / Merchant', 'Items', 'Total Amount (BDT)', 'Date', 'Status', 'Courier'];
            const csvRows = filteredReportOrders.map(o => [
              `"${o.orderId}"`,
              `"${o.type === 'custom_order' ? 'Custom Packaging Order' : 'Regular Sale'}"`,
              `"${(o.buyerShop || '').replace(/"/g, '""')}"`,
              `"${(o.items || '').replace(/"/g, '""')}"`,
              o.amount || 0,
              `"${o.date || ''}"`,
              `"${o.status || ''}"`,
              `"${(o.courier || '').replace(/"/g, '""')}"`
            ]);
            const csvString = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `seller_sales_report_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Report Header Card */}
              <div className="seller-content-card" style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '24px',
                border: '1.5px solid #E2E8F0',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>📈</span> {currentLang === 'bn' ? 'ফ্যাক্টরি বিক্রয় ও আয় রিপোর্ট' : 'Factory Sales & Revenue Report'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
                      {currentLang === 'bn' 
                        ? 'আপনার ফ্যাক্টরির নিজস্ব নিয়মিত পণ্য ও কাস্টম প্যাকেজিং অর্ডারের সমন্বিত হিসাব।' 
                        : 'Unified performance ledger for your direct packaging sales and custom manufacturing bids.'}
                    </p>
                  </div>
                  <div style={{
                    background: '#FEF3C7',
                    color: '#B45309',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>🏭</span> {currentSeller.shopName || 'Verified Factory'}
                  </div>
                </div>

                {/* 4 Stats Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '14px',
                  marginBottom: '24px'
                }}>
                  <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                      {currentLang === 'bn' ? 'মোট বিক্রয় আয়' : 'Total Sales Revenue'}
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0369A1' }}>
                      BDT. {totalSellerRevenue.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#0284C7', marginTop: '2px' }}>
                      {sellerTotalOrders.length} {currentLang === 'bn' ? 'টি মোট অর্ডার' : 'total orders'}
                    </div>
                  </div>

                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                      {currentLang === 'bn' ? 'মোট লেনদেন' : 'Total Transactions'}
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#B45309' }}>
                      {sellerTotalOrders.length}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#D97706', marginTop: '2px' }}>
                      {currentLang === 'bn' ? 'সম্পন্ন ও প্রক্রিয়াধীন' : 'Completed & Active'}
                    </div>
                  </div>

                  <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                      {currentLang === 'bn' ? 'নিয়মিত পণ্য বিক্রয়' : 'Regular Sales (Direct)'}
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#C2410C' }}>
                      BDT. {regularSellerRevenue.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#EA580C', marginTop: '2px' }}>
                      {regularSellerOrders.length} {currentLang === 'bn' ? 'টি পণ্য বিক্রয়' : 'direct items'}
                    </div>
                  </div>

                  <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9333EA', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                      {currentLang === 'bn' ? 'কাস্টম অর্ডার বিড' : 'Custom Orders (Bids)'}
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#7E22CE' }}>
                      BDT. {customSellerRevenue.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#9333EA', marginTop: '2px' }}>
                      {customSellerOrders.length} {currentLang === 'bn' ? 'টি কাস্টম অর্ডার' : 'custom orders'}
                    </div>
                  </div>
                </div>

                {/* Filter Toolbar */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  background: '#F8FAFC',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '16px'
                }}>
                  <div style={{ flex: '1.5', minWidth: '200px' }}>
                    <input
                      type="text"
                      placeholder={currentLang === 'bn' ? 'অর্ডার আইডি, বায়ার বা পণ্যের নাম খুঁজুন...' : 'Search order ID, buyer shop, item...'}
                      value={reportSearchQuery}
                      onChange={e => setReportSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        background: '#FFFFFF',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Sale Type Filter Dropdown */}
                  <select
                    value={reportSaleType}
                    onChange={e => setReportSaleType(e.target.value as any)}
                    style={{
                      padding: '10px 14px',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#334155',
                      outline: 'none',
                      background: '#FFFFFF',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">🏷️ {currentLang === 'bn' ? 'সকল সেলস টাইপ' : 'All Sale Types'}</option>
                    <option value="regular">🛍️ {currentLang === 'bn' ? 'নিয়মিত পণ্য বিক্রয়' : 'Regular Sales'}</option>
                    <option value="custom">🎨 {currentLang === 'bn' ? 'কাস্টম প্যাকেজিং অর্ডার' : 'Custom Packaging Orders'}</option>
                  </select>

                  {/* Status Filter Dropdown */}
                  <select
                    value={reportStatusFilter}
                    onChange={e => setReportStatusFilter(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#334155',
                      outline: 'none',
                      background: '#FFFFFF',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">📌 {currentLang === 'bn' ? 'সকল স্ট্যাটাস' : 'All Statuses'}</option>
                    <option value="delivered">✅ {currentLang === 'bn' ? 'ডেলিভার্ড' : 'Delivered'}</option>
                    <option value="processing">⏳ {currentLang === 'bn' ? 'প্রসেসিং' : 'Processing'}</option>
                    <option value="shipped">🚚 {currentLang === 'bn' ? 'শিপড' : 'Shipped'}</option>
                    <option value="pending">🕒 {currentLang === 'bn' ? 'পেন্ডিং' : 'Pending'}</option>
                  </select>

                  {/* Sort Filter Dropdown */}
                  <select
                    value={reportSortBy}
                    onChange={e => setReportSortBy(e.target.value as any)}
                    style={{
                      padding: '10px 14px',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#334155',
                      outline: 'none',
                      background: '#FFFFFF',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="newest">🔽 {currentLang === 'bn' ? 'নতুন আগে' : 'Newest First'}</option>
                    <option value="oldest">🔼 {currentLang === 'bn' ? 'পুরনো আগে' : 'Oldest First'}</option>
                    <option value="highest">💰 {currentLang === 'bn' ? 'সর্বোচ্চ আয়' : 'Highest Amount'}</option>
                    <option value="lowest">💸 {currentLang === 'bn' ? 'সর্বনিম্ন আয়' : 'Lowest Amount'}</option>
                  </select>

                  {/* CSV Export Button */}
                  <button
                    onClick={exportSellerSalesReport}
                    style={{
                      padding: '10px 18px',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    <span>📊</span> {currentLang === 'bn' ? 'সিএসভি এক্সপোর্ট' : 'Export CSV'}
                  </button>
                </div>

                {/* Live Count Pill */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#F1F5F9',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  color: '#475569',
                  marginBottom: '16px',
                  fontWeight: 600
                }}>
                  <span>🔍</span> {currentLang === 'bn' ? 'প্রদর্শিত:' : 'Showing:'} <strong>{filteredReportOrders.length}</strong> {currentLang === 'bn' ? 'টি লেনদেন (আয়: ' : 'transactions (Revenue: '} <strong>BDT. {visibleReportRevenue.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>)
                </div>

                {/* Transactions Table */}
                {filteredReportOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🧾</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#475569' }}>
                      {currentLang === 'bn' ? 'কোন বিক্রয় রেকর্ড পাওয়া যায়নি' : 'No sales records match your criteria'}
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      {currentLang === 'bn' ? 'ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।' : 'Try adjusting your search query or sale type filter.'}
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          <th style={{ padding: '12px 14px' }}>{currentLang === 'bn' ? 'অর্ডার আইডি' : 'Order ID'}</th>
                          <th style={{ padding: '12px 14px' }}>{currentLang === 'bn' ? 'সেলস টাইপ' : 'Sale Type'}</th>
                          <th style={{ padding: '12px 14px' }}>{currentLang === 'bn' ? 'ক্রেতা / বায়ার' : 'Buyer / Merchant'}</th>
                          <th style={{ padding: '12px 14px' }}>{currentLang === 'bn' ? 'পণ্য বিবরণ' : 'Items'}</th>
                          <th style={{ padding: '12px 14px' }}>{currentLang === 'bn' ? 'মোট মূল্য' : 'Total Amount'}</th>
                          <th style={{ padding: '12px 14px' }}>{currentLang === 'bn' ? 'তারিখ' : 'Date'}</th>
                          <th style={{ padding: '12px 14px' }}>{currentLang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReportOrders.map((ord, idx) => {
                          const isCustom = ord.type === 'custom_order';
                          const st = (ord.status || 'Pending').toLowerCase();
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                              <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#334155' }}>
                                #{ord.orderId}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  background: isCustom ? '#FAF5FF' : '#FFF7ED',
                                  color: isCustom ? '#7E22CE' : '#C2410C',
                                  border: isCustom ? '1px solid #E9D5FF' : '1px solid #FED7AA'
                                }}>
                                  <span>{isCustom ? '🎨' : '🛍️'}</span>
                                  {isCustom ? (currentLang === 'bn' ? 'কাস্টম অর্ডার' : 'Custom Order') : (currentLang === 'bn' ? 'নিয়মিত পণ্য' : 'Regular Sale')}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0F172A' }}>
                                <div>{ord.buyerShop || 'Verified Merchant'}</div>
                                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{ord.courier || 'Packaging Logistics'}</div>
                              </td>
                              <td style={{ padding: '12px 14px', color: '#334155', maxWidth: '240px' }}>
                                {ord.items}
                              </td>
                              <td style={{ padding: '12px 14px', fontWeight: 800, color: '#059669', whiteSpace: 'nowrap' }}>
                                BDT. {(ord.amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '12px 14px', color: '#64748B', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                {ord.date}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  textTransform: 'capitalize',
                                  background: (st === 'delivered' || st === 'completed') ? '#DCFCE7' : (st === 'processing' ? '#DBEAFE' : (st === 'shipped' ? '#FEF3C7' : '#F1F5F9')),
                                  color: (st === 'delivered' || st === 'completed') ? '#166534' : (st === 'processing' ? '#1E40AF' : (st === 'shipped' ? '#92400E' : '#475569'))
                                }}>
                                  {ord.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB 4: FACTORY PROFILE & KYC VERIFICATION */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '820px' }}>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Status Header Banner */}
              <div style={{
                background: isApproved
                  ? '#ECFDF5'
                  : isSuspended
                    ? '#FAF5FF'
                    : isBanned
                      ? '#FEF2F2'
                      : isRejected
                        ? '#FEF2F2'
                        : '#EFF6FF',
                border: `1.5px solid ${
                  isApproved
                    ? '#10B981'
                    : isSuspended
                      ? '#9333EA'
                      : isBanned
                        ? '#EF4444'
                        : isRejected
                          ? '#F87171'
                          : '#3B82F6'
                }`,
                borderRadius: '14px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 800,
                      background: isApproved ? '#059669' : isSuspended ? '#7E22CE' : isBanned ? '#991B1B' : isRejected ? '#DC2626' : '#2563EB',
                      color: '#FFFFFF'
                    }}>
                      {isApproved
                        ? '✓ APPROVED SUPPLIER'
                        : isSuspended
                          ? '⏸ ACCOUNT SUSPENDED'
                          : isBanned
                            ? '🚫 ACCOUNT BANNED'
                            : isRejected
                              ? '✕ APPLICATION REJECTED'
                              : '⏳ PENDING ADMIN APPROVAL'}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748B' }}>
                      Seller ID: {currentSeller.id}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '6px 0 2px 0', color: '#0F172A' }}>
                    {currentLang === 'bn' ? 'সেলার প্রোফাইল ও কেওয়াইসি (KYC) তথ্য' : 'Seller Profile & KYC Identity Verification'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                    {currentLang === 'bn'
                      ? 'রেজিস্ট্রেশন সম্পন্ন হলেই সাধারণ প্যাকেজিং পণ্য বিক্রি চালু থাকে। কাস্টম ও পাইকারি অর্ডারে বিড করতে আপনার ট্রেড লাইসেন্স এবং এনআইডি (উভয় অংশ) জমা দিন।'
                      : 'Product catalog selling is active immediately upon registration. To bid on wholesale custom orders, please provide your Trade License and National ID (Front & Back).'}
                  </p>
                  {isRejected && currentSeller.rejectionReason && (
                    <div style={{ marginTop: '10px', padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '13px', color: '#991B1B', fontWeight: 700 }}>
                      ⚠️ Admin Rejection Notice: "{currentSeller.rejectionReason}". Please update the required document below and resubmit.
                    </div>
                  )}
                  {isSuspended && (
                    <div style={{ marginTop: '10px', padding: '10px 14px', background: '#F3E8FF', border: '1px solid #E9D5FF', borderRadius: '8px', fontSize: '13px', color: '#6B21A8', fontWeight: 700 }}>
                      ⏸ Admin Suspension: Suspended until {currentSeller.suspendedUntil ? new Date(currentSeller.suspendedUntil).toLocaleDateString() : 'notice'}. Reason: "{currentSeller.suspensionReason || 'Compliance review'}".
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 1: SELLER IDENTITY & SHOP DETAILS */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                padding: '24px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>👤</span>
                  <span>{currentLang === 'bn' ? '১. সেলার ও কারখানা পরিচিতি' : '1. Seller Identity & Factory Details'}</span>
                </h4>

                <div className="seller-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', boxSizing: 'border-box' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      {currentLang === 'bn' ? 'সেলার নাম (মালিকের নাম) *' : 'Seller Legal Name (Owner Name) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={profileOwnerName}
                      onChange={e => setProfileOwnerName(e.target.value)}
                      placeholder="e.g. Md. Rafiqul Islam"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      {currentLang === 'bn' ? 'দোকান / কারখানার নাম *' : 'Packaging Shop / Factory Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={profileShopName}
                      onChange={e => setProfileShopName(e.target.value)}
                      placeholder="e.g. Dhaka Poly & Packaging Mills"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      {currentLang === 'bn' ? 'নিবন্ধিত ফোন নম্বর' : 'Registered Phone Number'}
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={currentSeller.phone}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        background: '#F8FAFC',
                        color: '#64748B',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      {currentLang === 'bn' ? 'অফিসিয়াল ইমেইল এড্রেস' : 'Business Email Address'}
                    </label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={e => setProfileEmail(e.target.value)}
                      placeholder="factory@packaging.com"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    {currentLang === 'bn' ? 'কারখানা ও গুদামের ঠিকানা (ফুল এড্রেস)' : 'Factory Hub / Warehouse Address'}
                  </label>
                  <input
                    type="text"
                    value={profileAddress}
                    onChange={e => setProfileAddress(e.target.value)}
                    placeholder="e.g. Plot 14, Road 4, Chawkbazar Packaging Cluster, Dhaka-1211"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* SECTION 2: TRADE LICENSE VERIFICATION */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                padding: '24px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📜</span>
                    <span>{currentLang === 'bn' ? '২. ট্রেড লাইসেন্স ভেরিফিকেশন (Trade License) *' : '2. Trade License Verification *'}</span>
                  </h4>
                  <span style={{ fontSize: '12px', background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    Required for Factory Clearance
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    {currentLang === 'bn' ? 'ট্রেড লাইসেন্স নম্বর *' : 'Trade License Number *'}
                  </label>
                  <input
                    type="text"
                    value={profileTradeLicenseNumber}
                    onChange={e => setProfileTradeLicenseNumber(e.target.value)}
                    placeholder="e.g. TRAD/DNCC/019284/2024"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    {currentLang === 'bn' ? 'ট্রেড লাইসেন্স ডকুমেন্ট কপি (ছবি বা স্ক্যান কপি) *' : 'Trade License Document (Photo or Certificate Scan) *'}
                  </label>

                  {profileTradeLicenseImage ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      background: '#F8FAFC'
                    }}>
                      <img
                        src={profileTradeLicenseImage}
                        alt="Trade License"
                        style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                          ✓ Trade License Uploaded
                        </div>
                        <a
                          href={profileTradeLicenseImage}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '12px', color: '#FF5A1F', textDecoration: 'none', fontWeight: 600 }}
                        >
                          View Full Document ↗
                        </a>
                      </div>
                      <label style={{
                        background: '#EFF6FF',
                        color: '#1D4ED8',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: '1px solid #BFDBFE'
                      }}>
                        Change Document
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={e => handleDocFileUpload(e, 'tradeLicense')}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setProfileTradeLicenseImage('')}
                        style={{
                          background: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label style={{
                      border: '2px dashed #CBD5E1',
                      borderRadius: '12px',
                      padding: '24px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: '#F8FAFC',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>
                        {uploadingDocType === 'tradeLicense' ? '⏳' : '📄'}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                        {uploadingDocType === 'tradeLicense' ? 'Uploading Trade License...' : 'Click to Upload Trade License Document'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                        Supports JPG, PNG, WEBP (Max 10MB)
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        disabled={uploadingDocType === 'tradeLicense'}
                        onChange={e => handleDocFileUpload(e, 'tradeLicense')}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* SECTION 3: NATIONAL ID (NID) - FRONT & BACK PARTS */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                padding: '24px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🪪</span>
                    <span>{currentLang === 'bn' ? '৩. জাতীয় পরিচয়পত্র (NID) ভেরিফিকেশন *' : '3. National ID (NID) Verification *'}</span>
                  </h4>
                  <span style={{ fontSize: '12px', background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    Both Front & Back Parts Required
                  </span>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    {currentLang === 'bn' ? 'জাতীয় পরিচয়পত্র (NID) নম্বর *' : 'National ID (NID) Number *'}
                  </label>
                  <input
                    type="text"
                    value={profileNidNumber}
                    onChange={e => setProfileNidNumber(e.target.value)}
                    placeholder="e.g. 19912692019000342 (10, 13 or 17 digits)"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div className="seller-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', boxSizing: 'border-box' }}>
                  
                  {/* NID FRONT PART */}
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', background: '#FAFAFA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                        {currentLang === 'bn' ? 'NID সামনের অংশ (Front Part) *' : 'NID Front Part (Photo Side) *'}
                      </div>
                      {profileNidFrontImage && (
                        <span style={{ fontSize: '11px', background: '#DEF7EC', color: '#03543F', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          ✓ Done
                        </span>
                      )}
                    </div>

                    {profileNidFrontImage ? (
                      <div>
                        <img
                          src={profileNidFrontImage}
                          alt="NID Front"
                          style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '10px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <label style={{
                            flex: 1,
                            textAlign: 'center',
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: '1px solid #BFDBFE'
                          }}>
                            Change Front
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => handleDocFileUpload(e, 'nidFront')}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setProfileNidFrontImage('')}
                            style={{
                              background: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label style={{
                        border: '2px dashed #CBD5E1',
                        borderRadius: '8px',
                        padding: '24px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        background: '#FFFFFF',
                        minHeight: '130px'
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '6px' }}>
                          {uploadingDocType === 'nidFront' ? '⏳' : '📷'}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', textAlign: 'center' }}>
                          {uploadingDocType === 'nidFront' ? 'Uploading...' : 'Upload NID Front Part'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          Photo & Date of Birth side
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          disabled={uploadingDocType === 'nidFront'}
                          onChange={e => handleDocFileUpload(e, 'nidFront')}
                        />
                      </label>
                    )}
                  </div>

                  {/* NID BACK PART */}
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', background: '#FAFAFA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                        {currentLang === 'bn' ? 'NID পেছনের অংশ (Back Part) *' : 'NID Back Part (Address Side) *'}
                      </div>
                      {profileNidBackImage && (
                        <span style={{ fontSize: '11px', background: '#DEF7EC', color: '#03543F', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          ✓ Done
                        </span>
                      )}
                    </div>

                    {profileNidBackImage ? (
                      <div>
                        <img
                          src={profileNidBackImage}
                          alt="NID Back"
                          style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '10px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <label style={{
                            flex: 1,
                            textAlign: 'center',
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: '1px solid #BFDBFE'
                          }}>
                            Change Back
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => handleDocFileUpload(e, 'nidBack')}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setProfileNidBackImage('')}
                            style={{
                              background: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label style={{
                        border: '2px dashed #CBD5E1',
                        borderRadius: '8px',
                        padding: '24px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        background: '#FFFFFF',
                        minHeight: '130px'
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '6px' }}>
                          {uploadingDocType === 'nidBack' ? '⏳' : '📷'}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', textAlign: 'center' }}>
                          {uploadingDocType === 'nidBack' ? 'Uploading...' : 'Upload NID Back Part'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          Address & Barcode side
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          disabled={uploadingDocType === 'nidBack'}
                          onChange={e => handleDocFileUpload(e, 'nidBack')}
                        />
                      </label>
                    )}
                  </div>

                </div>
              </div>

              {/* SECTION 4: BANK & SETTLEMENT DETAILS */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                padding: '24px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏦</span>
                  <span>{currentLang === 'bn' ? '৪. পেমেন্ট সেটেলমেন্ট ব্যাংক অ্যাকাউন্ট' : '4. Settlement Bank & Payout Details'}</span>
                </h4>

                <div className="seller-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', boxSizing: 'border-box' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Bank Name</label>
                    <input
                      type="text"
                      value={profileBankName}
                      onChange={e => setProfileBankName(e.target.value)}
                      placeholder="e.g. Dutch-Bangla Bank PLC"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Account Holder Name</label>
                    <input
                      type="text"
                      value={profileAccountHolderName}
                      onChange={e => setProfileAccountHolderName(e.target.value)}
                      placeholder="e.g. Md. Rafiqul Islam"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Bank Account Number</label>
                    <input
                      type="text"
                      value={profileAccountNumber}
                      onChange={e => setProfileAccountNumber(e.target.value)}
                      placeholder="e.g. 120.101.002891"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Branch Name</label>
                    <input
                      type="text"
                      value={profileBranchName}
                      onChange={e => setProfileBranchName(e.target.value)}
                      placeholder="e.g. Chawkbazar Branch, Dhaka"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>bKash / Nagad Merchant Number</label>
                    <input
                      type="text"
                      value={profileBkashNumber}
                      onChange={e => setProfileBkashNumber(e.target.value)}
                      placeholder="e.g. 01712345678"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SAVE / SUBMIT BUTTON */}
              <div>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  style={{
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '14px 28px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '15px',
                    cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isSavingProfile ? '⏳ Saving Documents...' : isRejected ? '🔄 Resubmit for Admin Approval' : isPendingApproval ? '💾 Update Submitted Documents' : '💾 Save & Submit for Verification'}
                </button>
              </div>

            </form>
          </div>
        )}

      

        </main>

        {/* ========================================================================= */}
        {/* 3. MOBILE BOTTOM NAVIGATION BAR (Fixed for Small Screens)                 */}
        {/* ========================================================================= */}
        <nav className="pb-mobile-bottom-bar">
          <button
            type="button"
            className={`pb-bottom-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>{currentLang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
          </button>

          <button
            type="button"
            className={`pb-bottom-tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span>{currentLang === 'bn' ? 'অর্ডার/পণ্য' : 'Orders'}</span>
          </button>

          <button
            type="button"
            className={`pb-bottom-tab ${activeTab === 'bids' ? 'active' : ''}`}
            onClick={() => setActiveTab('bids')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <span>{currentLang === 'bn' ? 'বিড/কোটেশন' : 'Products'}</span>
          </button>

          <button
            type="button"
            className={`pb-bottom-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{currentLang === 'bn' ? 'প্রোফাইল' : 'Profile'}</span>
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* 4. EMBEDDED HUMANIZED CSS STYLING (Soft Soothing Palette)                  */}
      {/* ========================================================================= */}
      <style>{`
        .packbang-seller-app {
          display: flex;
          min-height: 100vh;
          background: #F8FAFC;
          color: #0F172A;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
          width: 100%;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        /* Toast */
        .pb-toast-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #0C2B27;
          color: #FFFFFF;
          padding: 12px 20px;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          z-index: 99999;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          font-size: 13.5px;
          border-left: 4px solid #10B981;
        }

        /* SIDEBAR (Desktop) */
        .pb-sidebar {
          width: 250px;
          background: #0C2B27;
          color: #FFFFFF;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          padding: 24px 16px 20px 16px;
          box-sizing: border-box;
          z-index: 100;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pb-sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 6px 20px 6px;
          cursor: pointer;
          position: relative;
        }

        .pb-brand-logo-card {
          width: 38px;
          height: 38px;
          background: #FFFFFF;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        }

        .pb-brand-logo-card.small {
          width: 32px;
          height: 32px;
          border-radius: 8px;
        }

        .pb-brand-name {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #FFFFFF;
          line-height: 1.1;
        }

        .pb-brand-sub {
          font-size: 11px;
          color: #94A3B8;
          font-weight: 500;
          margin-top: 2px;
        }

        .pb-close-drawer-btn {
          display: none;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #FFFFFF;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          margin-left: auto;
          font-size: 14px;
        }

        /* Sidebar Nav */
        .pb-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 10px;
          flex: 1;
        }

        .pb-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          background: transparent;
          border: none;
          color: #94A3B8;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          text-align: left;
        }

        .pb-nav-item:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.05);
        }

        .pb-nav-item.active {
          background: #059669;
          color: #FFFFFF;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);
        }

        .pb-nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .pb-nav-text {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pb-badge-pill {
          background: rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .pb-nav-item.active .pb-badge-pill {
          background: rgba(255, 255, 255, 0.25);
        }

        /* Promo Card */
        .pb-sidebar-promo {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 14px 12px;
          text-align: center;
          margin: 16px 0;
        }

        .pb-promo-rocket {
          font-size: 26px;
          margin-bottom: 6px;
        }

        .pb-promo-title {
          font-size: 12px;
          font-weight: 700;
          color: #F1F5F9;
          line-height: 1.35;
          margin-bottom: 10px;
        }

        .pb-promo-btn {
          background: #10B981;
          color: #FFFFFF;
          border: none;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }

        .pb-promo-btn:hover {
          background: #059669;
        }

        /* Sidebar Help */
        .pb-sidebar-help {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 12px;
        }

        .pb-help-icon {
          color: #10B981;
          display: flex;
        }

        .pb-help-title {
          font-weight: 700;
          color: #FFFFFF;
          font-size: 12px;
        }

        .pb-help-email {
          color: #94A3B8;
          text-decoration: none;
          font-size: 11px;
          transition: color 0.2s;
        }

        .pb-help-email:hover {
          color: #10B981;
        }

        /* MAIN LAYOUT */
        .pb-main-layout {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow-y: auto;
          box-sizing: border-box;
        }

        /* TOP BAR */
        .pb-top-bar {
          background: #FFFFFF;
          height: 64px;
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          box-sizing: border-box;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .pb-top-bar-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          max-width: 520px;
        }

        .pb-hamburger-btn {
          display: none;
          background: transparent;
          border: none;
          color: #0F172A;
          cursor: pointer;
          padding: 4px;
        }

        .pb-mobile-brand {
          display: none;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .pb-mobile-brand-title {
          font-size: 17px;
          font-weight: 800;
          color: #0C2B27;
        }

        .pb-search-box {
          position: relative;
          width: 100%;
          max-width: 440px;
        }

        .pb-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
        }

        .pb-search-input {
          width: 100%;
          height: 38px;
          background: #F1F5F9;
          border: 1px solid transparent;
          border-radius: 30px;
          padding: 0 16px 0 38px;
          font-size: 13.5px;
          color: #0F172A;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .pb-search-input:focus {
          background: #FFFFFF;
          border-color: #10B981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }

        .pb-top-bar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .pb-bell-wrapper {
          position: relative;
        }

        .pb-bell-btn {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #475569;
          position: relative;
          transition: all 0.2s;
        }

        .pb-bell-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .pb-bell-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #EF4444;
          color: #FFFFFF;
          font-size: 10px;
          font-weight: 800;
          width: 17px;
          height: 17px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #FFFFFF;
        }

        /* Profile Pill */
        .pb-profile-dropdown-wrapper {
          position: relative;
        }

        .pb-profile-pill {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 4px 12px 4px 4px;
          border-radius: 30px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pb-profile-pill:hover {
          border-color: #CBD5E1;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .pb-avatar-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #0C2B27;
          color: #FFFFFF;
          font-weight: 800;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pb-profile-name {
          font-size: 13.5px;
          font-weight: 700;
          color: #1E293B;
          max-width: 140px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pb-profile-chevron {
          color: #94A3B8;
        }

        .pb-profile-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 240px;
          background: #FFFFFF;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
          border: 1px solid #E2E8F0;
          padding: 8px 0;
          z-index: 1000;
        }

        .pb-profile-menu-header {
          padding: 10px 16px;
          border-bottom: 1px solid #F1F5F9;
        }

        .pb-menu-shop-name {
          font-size: 13.5px;
          font-weight: 800;
          color: #0F172A;
        }

        .pb-menu-phone {
          font-size: 11.5px;
          color: #64748B;
          margin-top: 2px;
        }

        .pb-profile-menu-links {
          padding: 6px 0;
        }

        .pb-menu-link {
          width: 100%;
          text-align: left;
          padding: 9px 16px;
          background: transparent;
          border: none;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.15s;
        }

        .pb-menu-link:hover {
          background: #F8FAFC;
          color: #0F172A;
        }

        .pb-menu-link.text-danger {
          color: #EF4444;
        }

        .pb-menu-link.text-danger:hover {
          background: #FEF2F2;
        }

        .pb-menu-divider {
          height: 1px;
          background: #F1F5F9;
          margin: 4px 0;
        }

        /* CONTENT CONTAINER */
        .pb-content-container {
          padding: 24px 28px 48px 28px;
          box-sizing: border-box;
          max-width: 1380px;
          width: 100%;
          margin: 0 auto;
        }

        /* KYC Alert Banner */
        .pb-kyc-alert-banner {
          background: #FFFBEB;
          border: 1.5px solid #F59E0B;
          border-radius: 14px;
          padding: 14px 18px;
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .pb-kyc-alert-banner.pending {
          background: #EFF6FF;
          border-color: #3B82F6;
        }

        .pb-alert-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pb-alert-badge-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #FEF3C7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #D97706;
          flex-shrink: 0;
        }

        .pb-kyc-alert-banner.pending .pb-alert-badge-icon {
          background: #DBEAFE;
          color: #2563EB;
        }

        .pb-alert-title {
          font-size: 14px;
          font-weight: 800;
          color: #92400E;
        }

        .pb-kyc-alert-banner.pending .pb-alert-title {
          color: #1E40AF;
        }

        .pb-alert-desc {
          font-size: 12.5px;
          color: #B45309;
          margin-top: 2px;
        }

        .pb-kyc-alert-banner.pending .pb-alert-desc {
          color: #1D4ED8;
        }

        .pb-alert-cta-btn {
          background: #D97706;
          color: #FFFFFF;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
        }

        .pb-alert-cta-btn.pending {
          background: #2563EB;
        }

        /* PAGE HEADER ROW */
        .pb-page-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .pb-welcome-title {
          font-size: 24px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.5px;
          margin: 0;
        }

        .pb-welcome-subtitle {
          font-size: 13.5px;
          color: #64748B;
          margin: 4px 0 0 0;
        }

        .pb-page-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pb-date-dropdown-wrapper {
          position: relative;
        }

        .pb-date-filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          padding: 8px 14px;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pb-date-filter-btn:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
        }

        .pb-date-dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          padding: 6px 0;
          width: 160px;
          z-index: 100;
        }

        .pb-date-option {
          width: 100%;
          text-align: left;
          padding: 8px 14px;
          background: transparent;
          border: none;
          font-size: 12.5px;
          color: #334155;
          font-weight: 600;
          cursor: pointer;
        }

        .pb-date-option:hover {
          background: #F1F5F9;
        }

        .pb-date-option.selected {
          color: #059669;
          font-weight: 700;
          background: #ECFDF5;
        }

        .pb-add-product-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #059669;
          color: #FFFFFF;
          border: none;
          padding: 8px 18px;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
        }

        .pb-add-product-btn:hover {
          background: #047857;
          transform: translateY(-1px);
        }

        /* 4 STAT CARDS (Pastel Gradients) */
        .pb-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        .pb-stat-card {
          border-radius: 16px;
          padding: 18px 20px;
          box-sizing: border-box;
          transition: transform 0.2s, box-shadow 0.2s;
          border: 1px solid transparent;
        }

        .pb-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
        }

        .pb-stat-card.mint {
          background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
          border-color: #A7F3D0;
        }

        .pb-stat-card.sky {
          background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
          border-color: #BFDBFE;
        }

        .pb-stat-card.amber {
          background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
          border-color: #FDE68A;
        }

        .pb-stat-card.lilac {
          background: linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%);
          border-color: #E9D5FF;
        }

        .pb-stat-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .pb-stat-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pb-stat-icon-box.mint {
          background: rgba(16, 185, 129, 0.2);
          color: #059669;
        }

        .pb-stat-icon-box.sky {
          background: rgba(59, 130, 246, 0.2);
          color: #2563EB;
        }

        .pb-stat-icon-box.amber {
          background: rgba(245, 158, 11, 0.2);
          color: #D97706;
        }

        .pb-stat-icon-box.lilac {
          background: rgba(139, 92, 246, 0.2);
          color: #7C3AED;
        }

        .pb-stat-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #1E293B;
        }

        .pb-stat-body {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .pb-stat-value {
          font-size: 25px;
          font-weight: 900;
          color: #0F172A;
          letter-spacing: -0.5px;
        }

        .pb-stat-trend {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
        }

        .pb-stat-trend.positive {
          color: #059669;
        }

        .pb-stat-trend.warning {
          color: #D97706;
        }

        .pb-stat-trend.purple {
          color: #7C3AED;
        }

        .pb-trend-sub {
          color: #64748B;
          font-weight: 500;
        }

        /* MIDDLE ROW (Chart + Top Selling) */
        .pb-middle-row-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        .pb-chart-card, .pb-top-products-card {
          background: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          padding: 20px 22px;
          box-sizing: border-box;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
        }

        .pb-chart-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .pb-chart-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pb-chart-heading {
          font-size: 16px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }

        .pb-chart-period-tabs {
          display: flex;
          gap: 4px;
          background: #F1F5F9;
          padding: 3px;
          border-radius: 20px;
        }

        .pb-period-pill {
          background: transparent;
          border: none;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 700;
          color: #64748B;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pb-period-pill.active {
          background: #059669;
          color: #FFFFFF;
          box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);
        }

        .pb-svg-chart-container {
          position: relative;
          width: 100%;
          height: 180px;
        }

        .pb-sales-svg {
          width: 100%;
          height: 155px;
        }

        .pb-axis-label {
          font-size: 10px;
          fill: #94A3B8;
          font-weight: 600;
          font-family: inherit;
        }

        .pb-chart-peak-tooltip {
          position: absolute;
          top: 8px;
          left: 77%;
          transform: translateX(-50%);
          background: #0C2B27;
          color: #FFFFFF;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          pointer-events: none;
        }

        .pb-tooltip-arrow {
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 4px solid #0C2B27;
        }

        .pb-chart-x-labels {
          display: flex;
          justify-content: space-between;
          padding: 0 25px 0 60px;
          font-size: 11px;
          color: #94A3B8;
          font-weight: 600;
          margin-top: 2px;
        }

        /* Top Products */
        .pb-top-products-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .pb-top-products-title {
          font-size: 16px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }

        .pb-products-rank-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pb-ranked-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 0;
        }

        .pb-rank-number {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .pb-rank-number.rank-1, .pb-rank-number.rank-3 {
          background: #ECFDF5;
          color: #059669;
        }

        .pb-rank-number.rank-2 {
          background: #EFF6FF;
          color: #2563EB;
        }

        .pb-product-thumbnail-box {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .pb-product-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.25;
        }

        .pb-product-sold {
          font-size: 12px;
          color: #64748B;
          margin-top: 2px;
        }

        .pb-view-all-products-link {
          margin-top: 14px;
          padding: 8px 0 0 0;
          background: transparent;
          border: none;
          color: #059669;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-block;
          text-align: left;
        }

        .pb-view-all-products-link:hover {
          text-decoration: underline;
        }

        /* RECENT ORDERS CARD */
        .pb-recent-orders-card {
          background: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          padding: 20px 22px;
          box-sizing: border-box;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
        }

        .pb-orders-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .pb-orders-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pb-orders-heading {
          font-size: 16px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }

        .pb-view-all-orders-btn {
          background: transparent;
          border: none;
          color: #059669;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .pb-view-all-orders-btn:hover {
          text-decoration: underline;
        }

        /* Table */
        .pb-desktop-orders-table-wrapper {
          overflow-x: auto;
        }

        .pb-orders-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13.5px;
        }

        .pb-orders-table th {
          padding: 10px 14px;
          color: #64748B;
          font-weight: 600;
          font-size: 12.5px;
          border-bottom: 1px solid #E2E8F0;
        }

        .pb-orders-table td {
          padding: 14px;
          border-bottom: 1px solid #F1F5F9;
        }

        .pb-status-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 700;
        }

        .pb-status-badge.pending {
          background: #FEF3C7;
          color: #92400E;
        }

        .pb-status-badge.processing {
          background: #DBEAFE;
          color: #1E40AF;
        }

        .pb-status-badge.shipped {
          background: #D1FAE5;
          color: #065F46;
        }

        .pb-status-badge.delivered {
          background: #DCFCE7;
          color: #166534;
        }

        /* Mobile Order Cards */
        .pb-mobile-orders-cards {
          display: none;
          flex-direction: column;
          gap: 12px;
        }

        .pb-mobile-order-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
        }

        .pb-card-product-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .pb-card-mid {
          flex: 1;
        }

        .pb-card-order-id {
          font-size: 13px;
          font-weight: 800;
          color: #0F172A;
        }

        .pb-card-amount {
          font-size: 13px;
          font-weight: 800;
          color: #059669;
          margin-top: 1px;
        }

        .pb-card-date {
          font-size: 11px;
          color: #94A3B8;
          margin-top: 2px;
        }

        /* Mobile Bottom Bar */
        .pb-mobile-bottom-bar {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: #FFFFFF;
          border-top: 1px solid #E2E8F0;
          z-index: 1000;
          justify-content: space-around;
          align-items: center;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.04);
        }

        .pb-bottom-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          background: transparent;
          border: none;
          color: #64748B;
          font-size: 10.5px;
          font-weight: 600;
          cursor: pointer;
        }

        .pb-bottom-tab.active {
          color: #059669;
          font-weight: 800;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .pb-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .pb-middle-row-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .pb-sidebar {
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            transform: translateX(-100%);
            box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
          }

          .pb-sidebar.open {
            transform: translateX(0);
          }

          .pb-close-drawer-btn {
            display: block;
          }

          .pb-mobile-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.45);
            z-index: 99;
          }

          .pb-hamburger-btn {
            display: flex;
          }

          .pb-mobile-brand {
            display: flex;
          }

          .pb-top-bar {
            padding: 0 16px;
          }

          .pb-search-box {
            display: none;
          }

          .pb-content-container {
            padding: 16px 14px 80px 14px;
          }

          .pb-desktop-orders-table-wrapper {
            display: none;
          }

          .pb-mobile-orders-cards {
            display: flex;
          }

          .pb-mobile-bottom-bar {
            display: flex;
          }

          .pb-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .pb-stat-card {
            padding: 14px 14px;
          }

          .pb-stat-value {
            font-size: 20px;
          }

          .pb-page-header-row {
            margin-bottom: 16px;
          }

          .pb-welcome-title {
            font-size: 20px;
          }
        }
      `}</style>

{showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '28px',
            width: '100%',
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
                  📦 {currentLang === 'bn' ? 'প্যাকেজিং পণ্য ক্যাটালগে যুক্ত করুন' : 'Post Product to PackBang Marketplace'}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                  {currentLang === 'bn' ? 'পণ্য পোস্ট করার সাথে সাথে packbang.com এর লাইভ স্টোরে যুক্ত হবে।' : 'Instantly published to packbang.com catalog with factory verified badge.'}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Product Title / Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5-Ply Heavy Duty Corrugated Carton Box (12x10x8 inch)"
                  required
                  value={newProductName}
                  onChange={e => setNewProductName(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', background: '#fff', outline: 'none' }}
                  >
                    {categoriesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Packaging Unit
                  </label>
                  <select
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', background: '#fff', outline: 'none' }}
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="packet">Packet (100 pcs)</option>
                    <option value="roll">Roll / Bundle</option>
                    <option value="box">Box / Carton</option>
                    <option value="kg">Kilogram (kg)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Offer Price (BDT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 18.50"
                    required
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Regular Strikethrough Price (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 24.00"
                    value={newOriginalPrice}
                    onChange={e => setNewOriginalPrice(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Available Factory Stock *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    required
                    value={newStock}
                    onChange={e => setNewStock(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Minimum Order Qty (MOQ)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={newMoq}
                    onChange={e => setNewMoq(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Product Images Upload & URL */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Product Images (Upload or Add URL)
                </label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <label style={{
                    background: '#F1F5F9',
                    border: '1px dashed #94A3B8',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#334155',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    📁 {isUploadingImage ? 'Uploading...' : 'Upload Image File'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageFileUpload}
                      style={{ display: 'none' }}
                      disabled={isUploadingImage}
                    />
                  </label>

                  <div style={{ display: 'flex', flex: 1, gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="Or paste image URL (https://...)"
                      value={imageInputVal}
                      onChange={e => setImageInputVal(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (imageInputVal.trim()) {
                          setNewImageUrls(prev => [...prev, imageInputVal.trim()]);
                          setImageInputVal('');
                        }
                      }}
                      style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Add URL
                    </button>
                  </div>
                </div>

                {/* Previews */}
                {newImageUrls.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '10px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    {newImageUrls.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '60px', height: '60px' }}>
                        <img src={url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
                        <button
                          type="button"
                          onClick={() => setNewImageUrls(prev => prev.filter((_, i) => i !== idx))}
                          style={{ position: 'absolute', top: -5, right: -5, width: '18px', height: '18px', borderRadius: '50%', background: '#DC2626', color: '#fff', border: 'none', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Product Description & Specifications
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide materials, ply rating, flute type, GSM, dimensions, and wholesale delivery terms..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid #F1F5F9' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#64748B' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #FF5A1F, #E64A19)',
                    color: '#fff',
                    cursor: isSubmittingProduct ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(255, 90, 31, 0.35)'
                  }}
                >
                  {isSubmittingProduct ? 'Publishing...' : 'Publish to Marketplace 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '28px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                ✏️ Edit Product ({editingProduct.id})
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Unit Price (BDT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.unitPrice}
                    onChange={e => setEditingProduct({ ...editingProduct, unitPrice: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Stock Available
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock}
                    onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', background: '#fff' }}
                  >
                    {categoriesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    MOQ
                  </label>
                  <input
                    type="number"
                    value={editingProduct.moq || 1}
                    onChange={e => setEditingProduct({ ...editingProduct, moq: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#FF5A1F', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                >
                  {isSubmittingProduct ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
{bidModalItem && (() => {
        const qty = bidModalItem.quantity || 1;
        const unitName = bidModalItem.unit || 'Pcs';
        const targetRate = bidModalItem.unitPrice || (bidModalItem.targetBudgetRaw && qty > 0 ? (bidModalItem.targetBudgetRaw / qty) : 0);
        const enteredUnitVal = parseFloat(bidAmount);
        const isValidVal = !isNaN(enteredUnitVal) && enteredUnitVal > 0;
        const totalQuotationVal = isValidVal ? (enteredUnitVal * qty) : 0;
        const rateDiffPercent = (targetRate > 0 && isValidVal) ? Math.round(((enteredUnitVal - targetRate) / targetRate) * 100) : null;

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #E2E8F0'
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px 16px 24px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                background: '#FFFFFF'
              }}>
                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#FFF7ED',
                    color: '#C2410C',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    marginBottom: '6px',
                    border: '1px solid #FFEDD5',
                    letterSpacing: '0.3px'
                  }}>
                    <span>🏭</span> OFFICIAL FACTORY QUOTATION
                  </div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
                    Submit Wholesale Quotation
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                    Order ID: <strong style={{ color: '#1E293B' }}>{bidModalItem.id}</strong> • Open for Packaging Bids
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBidModalItem(null)}
                  style={{
                    background: '#F1F5F9',
                    border: 'none',
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748B',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#0F172A'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Body */}
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                {/* Buyer Specifications Card */}
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>👤</span>
                      <strong style={{ fontSize: '14px', color: '#0F172A' }}>{bidModalItem.buyer}</strong>
                      <span style={{ fontSize: '11px', background: '#DCFCE7', color: '#15803D', padding: '1px 8px', borderRadius: '12px', fontWeight: 700 }}>
                        ✓ {bidModalItem.location}
                      </span>
                    </div>
                    {bidModalItem.deadline && (
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        ⏳ Needed By: <strong style={{ color: '#0F172A' }}>{bidModalItem.deadline}</strong>
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#334155', lineHeight: '1.5', fontStyle: 'italic' }}>
                    "{bidModalItem.requestText}"
                  </p>

                  {/* 4-Metric Badges Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))',
                    gap: '10px'
                  }}>
                    <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Requested Volume</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                        {qty.toLocaleString()} {unitName}
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Target Budget</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#059669' }}>
                        {bidModalItem.targetBudget}
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Benchmark Rate</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#3B82F6' }}>
                        {targetRate > 0 ? `৳ ${targetRate.toFixed(2)} / ${unitName.toLowerCase()}` : 'Negotiable'}
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Payment Terms</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#7C3AED' }}>
                        100% Escrow
                      </div>
                    </div>
                  </div>

                  {/* Spec Reference Images Thumbnails */}
                  {bidModalItem.images && bidModalItem.images.length > 0 && (
                    <div style={{ marginTop: '12px', borderTop: '1px dashed #CBD5E1', paddingTop: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
                        Buyer Reference Specifications ({bidModalItem.images.length}):
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {bidModalItem.images.map((img, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setPreviewImageRotation(0);
                              setPreviewImageModal({ url: img, title: `Reference Spec #${i + 1} - ${bidModalItem.id}` });
                            }}
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '8px',
                              border: '1.5px solid #CBD5E1',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              background: '#fff'
                            }}
                            title="Click to zoom spec photo"
                          >
                            <img src={img} alt="Spec" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <form id="wholesaleBidForm" onSubmit={handlePlaceBid}>
                  {/* Price per Unit Input */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                        Your Factory Price Per Unit (৳ / {unitName}) *
                      </label>
                      {rateDiffPercent !== null && (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: rateDiffPercent <= 0 ? '#ECFDF5' : '#FFFBEB',
                          color: rateDiffPercent <= 0 ? '#059669' : '#D97706',
                          border: rateDiffPercent <= 0 ? '1px solid #A7F3D0' : '1px solid #FDE68A'
                        }}>
                          {rateDiffPercent <= 0
                            ? `✓ Competitive (${Math.abs(rateDiffPercent)}% below budget)`
                            : `ℹ +${rateDiffPercent}% above benchmark`}
                        </span>
                      )}
                    </div>

                    <div style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '17px',
                        fontWeight: 800,
                        color: '#64748B'
                      }}>
                        ৳
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder={targetRate > 0 ? targetRate.toFixed(2) : "e.g. 4.20"}
                        value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 34px',
                          borderRadius: '10px',
                          border: '2px solid #CBD5E1',
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#0F172A',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = '#FF5A1F'}
                        onBlur={e => e.currentTarget.style.borderColor = '#CBD5E1'}
                      />
                    </div>
                  </div>

                  {/* Real-time Total Quotation Box */}
                  <div style={{
                    background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                    border: '1.5px solid #FDBA74',
                    borderRadius: '14px',
                    padding: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Total Quotation Value
                        </div>
                        <div style={{ fontSize: '12px', color: '#7C2D12', marginTop: '2px' }}>
                          Calculation: {isValidVal ? `৳ ${enteredUnitVal.toFixed(2)} × ${qty.toLocaleString()} ${unitName}` : `Enter unit price to calculate`}
                        </div>
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: '#EA580C' }}>
                        ৳ {totalQuotationVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#9A3412', marginTop: '8px', borderTop: '1px dashed #FDBA74', paddingTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🛡️</span> PackBang Escrow Guaranteed. Direct bank payout released 24h after delivery sign-off.
                    </div>
                  </div>

                  {/* Production & Delivery Lead Time */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                      Manufacturing & Delivery Lead Time *
                    </label>
                    <select
                      value={bidDeliveryTime}
                      onChange={e => setBidDeliveryTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0F172A',
                        background: '#FFFFFF',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="2-3 Working Days">2-3 Working Days (Express Factory Run)</option>
                      <option value="3-5 Working Days">3-5 Working Days (Standard)</option>
                      <option value="5-7 Working Days">5-7 Working Days</option>
                      <option value="7-10 Working Days">7-10 Working Days</option>
                      <option value="10-15 Working Days">10-15 Working Days (Bulk / Cylinder Engraving)</option>
                      <option value="15-21 Working Days">15-21 Working Days (Custom Import / Large Consignment)</option>
                    </select>
                  </div>

                  {/* Factory Technical Notes / Specs */}
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                      Technical Specifications & Production Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g., 120 GSM virgin kraft, 2-color flexographic printing, cylinder charges included, bundle packing..."
                      value={bidNote}
                      onChange={e => setBidNote(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Mandatory Terms & Conditions Checkbox */}
                  <div style={{
                    background: bidTermsAccepted ? '#F0FDF4' : '#F8FAFC',
                    border: bidTermsAccepted ? '1.5px solid #86EFAC' : '1.5px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '14px',
                    marginBottom: '20px',
                    transition: 'all 0.2s ease'
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#0F172A',
                      fontWeight: 600,
                      lineHeight: '1.4'
                    }}>
                      <input
                        type="checkbox"
                        checked={bidTermsAccepted}
                        onChange={e => setBidTermsAccepted(e.target.checked)}
                        style={{
                          width: '18px',
                          height: '18px',
                          marginTop: '2px',
                          accentColor: '#FF5A1F',
                          cursor: 'pointer'
                        }}
                      />
                      <div>
                        <span>
                          I agree to the <strong>PackBang Seller & Packaging Manufacturer Terms & Conditions</strong>.
                        </span>
                        <div style={{ marginTop: '4px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              fetchAndOpenSellerTerms();
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              color: '#FF5A1F',
                              fontWeight: 800,
                              fontSize: '12px',
                              textDecoration: 'underline',
                              cursor: 'pointer'
                            }}
                          >
                            📄 Read Full Seller Manufacturing Agreement
                          </button>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '12px',
                    paddingTop: '8px'
                  }}>
                    <button
                      type="button"
                      onClick={() => setBidModalItem(null)}
                      style={{
                        padding: '11px 20px',
                        borderRadius: '10px',
                        border: '1.5px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#475569',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingBid || !bidTermsAccepted || !isValidVal}
                      style={{
                        padding: '11px 26px',
                        borderRadius: '10px',
                        border: 'none',
                        background: (!bidTermsAccepted || !isValidVal) ? '#94A3B8' : 'linear-gradient(135deg, #FF5A1F 0%, #E04810 100%)',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: 800,
                        cursor: (!bidTermsAccepted || !isValidVal) ? 'not-allowed' : 'pointer',
                        boxShadow: (!bidTermsAccepted || !isValidVal) ? 'none' : '0 4px 14px rgba(255, 90, 31, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isSubmittingBid ? 'Submitting...' : '🚀 Submit Official Quotation'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Seller Terms & Conditions Modal */}
      {showSellerTermsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '2px solid #FF5A1F',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#FFFFFF'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📜</span> {sellerTermsData?.title || 'Seller & Packaging Manufacturer Terms and Conditions'}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
                  Official B2B Manufacturing Policy & Escrow Payout Compliance
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSellerTermsModal(false)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Terms Content Body */}
            <div style={{
              padding: '22px 24px',
              overflowY: 'auto',
              flex: 1,
              fontSize: '13px',
              lineHeight: '1.7',
              color: '#334155',
              whiteSpace: 'pre-line'
            }}>
              {isLoadingSellerTerms ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                  <div>Loading Official Seller Terms & Conditions...</div>
                </div>
              ) : (
                sellerTermsData?.content || `1. Binding Quotations & Manufacturing Commitments:
All wholesale bids, factory unit rates, and delivery lead times submitted on the PackBang Seller Portal are legally binding once accepted by the buyer or approved by platform administration. Sellers may not retroactively increase quoted rates, scale back agreed quantities, or revoke bids following acceptance.

2. Material Specifications & Industrial Quality Standards:
The seller guarantees that all packaging materials (paper grammage/GSM, plastic microns, corrugated flute type, ply count, printing plates/cylinders, ink adhesion, and tensile resistance) strictly conform to the approved buyer specifications and pre-production proofs. Substituting inferior or substandard raw materials without prior written consent constitutes a material breach and grounds for contract cancellation.

3. Production Tolerances & Defect Allowances:
Standard packaging manufacturing tolerances apply across production runs (dimensions +/- 3mm to 5mm; GSM / thickness +/- 5%; finished batch count variation strictly within +/- 5%). Consignments with defects or dimensional variations exceeding allowable tolerance thresholds require prompt factory replacement at the manufacturer's expense.

4. Turnaround Timelines & Dispatch Deadlines:
Sellers must manufacture, quality-inspect, and hand over consignments to logistics within the agreed delivery schedule (e.g. 3-7 business days from proof approval). In the event of unforeseen machine breakdowns or force majeure, the seller must formally notify platform support in writing within 24 hours. Unexcused production delays exceeding 72 hours may incur late delivery penalty deductions.

5. Strict Anti-Disintermediation & Platform Integrity:
PackBang provides secure escrow payment protection and buyer matching. Sellers are strictly prohibited from soliciting buyers for off-platform communication (sharing personal phone numbers, WhatsApp, email addresses) or transacting outside the platform. Any attempt to bypass platform escrow will trigger immediate account suspension, permanent blacklist, and forfeiture of pending payouts.

6. Inspection, Escrow Clearance & Payout Terms:
Buyer payments are securely held in PackBang Escrow. Payouts (net of standard platform marketplace commission) are released directly to the seller's verified payout account within 24 to 48 hours of successful shipment delivery and buyer/QC inspection clearance.

7. Defective Batches & Dispute Resolution:
If delivered goods fail quality inspection due to printing defects, incorrect sizing, or material flaws, PackBang dispute arbitration will investigate. The seller agrees to either produce a replacement batch within 5 business days or allow an escrow refund deduction corresponding to the defective percentage.`
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                🛡️ Binding for all certified packaging suppliers on PackBang.
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowSellerTermsModal(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBidTermsAccepted(true);
                    setShowSellerTermsModal(false);
                  }}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#FF5A1F',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  ✓ I Understand & Agree
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    
      {/* Seller Chat Modal */}
      {sellerChatModalItem && (
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
            width: '95%',
            maxWidth: '520px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '85vh',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            {/* Header */}
            <div style={{ background: '#0F172A', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Chat with Buyer ({sellerChatModalItem.buyer})</h4>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>Inquiry: {sellerChatModalItem.id}</div>
              </div>
              <button
                onClick={() => setSellerChatModalItem(null)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Message Body */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: '#F8FAFC' }}>
              {isLoadingMessages ? (
                <div style={{ textAlign: 'center', color: '#64748B', fontSize: '13px', padding: '20px' }}>Loading conversation...</div>
              ) : sellerChatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748B', fontSize: '13px', padding: '20px' }}>No messages yet. Send an inquiry regarding sample specs or delivery schedule.</div>
              ) : (
                sellerChatMessages.map((m, idx) => {
                  const isMe = m.sellerId === seller.id || m.senderRole === 'seller';
                  const isSys = m.senderId === 'SYSTEM';
                  if (isSys) {
                    return (
                      <div key={idx} style={{ background: '#F1F5F9', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', color: '#475569', textAlign: 'center', margin: 'auto' }}>
                        ℹ️ {m.text}
                      </div>
                    );
                  }
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '80%',
                        padding: '9px 13px',
                        borderRadius: '12px',
                        background: isMe ? '#FF5A1F' : '#FFFFFF',
                        color: isMe ? '#FFFFFF' : '#0F172A',
                        border: isMe ? 'none' : '1px solid #E2E8F0',
                        fontSize: '13px'
                      }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, opacity: 0.8, marginBottom: '2px' }}>{m.senderName}</div>
                        <div>{m.text}</div>
                        <div style={{ fontSize: '9px', opacity: 0.7, textAlign: 'right', marginTop: '2px' }}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Filter Warning */}
            {chatFilterWarning && (
              <div style={{ background: '#FEF2F2', padding: '8px 16px', color: '#DC2626', fontSize: '12px', fontWeight: 700, borderTop: '1px solid #FEE2E2' }}>
                {chatFilterWarning}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSendSellerMessage} style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <textarea
                  value={chatMessageText}
                  onChange={e => handleChatInputChange(e.target.value)}
                  placeholder="Type a message regarding paper GSM, sample approval, or production timeline..."
                  rows={2}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    resize: 'none',
                    outline: 'none'
                  }}
                  required
                />
                <button
                  type="submit"
                  disabled={isSendingMessage || !!chatFilterWarning || !chatMessageText.trim()}
                  style={{
                    background: '#FF5A1F',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    height: '40px',
                    opacity: (isSendingMessage || !!chatFilterWarning || !chatMessageText.trim()) ? 0.5 : 1
                  }}
                >
                  {isSendingMessage ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Specification Image Preview Modal */}
      {previewImageModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '20px',
            boxSizing: 'border-box'
          }}
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '20px 24px',
              width: '100%',
              maxWidth: '820px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🖼️</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                  {previewImageModal.title || 'Packaging Specification Preview'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                textAlign: 'center',
                background: '#0F172A',
                borderRadius: '12px',
                overflow: 'hidden',
                maxHeight: '70vh',
                minHeight: '250px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #334155'
              }}
            >
              <img
                src={previewImageModal.url}
                alt="Specification Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  transform: `rotate(${previewImageRotation}deg)`,
                  transition: 'transform 0.2s ease'
                }}
              />
            </div>

            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>
                ℹ️ High-resolution specification blueprint / reference sample
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewImageRotation(prev => (prev + 90) % 360)}
                  style={{
                    background: '#F1F5F9',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Rotate
                </button>
                <a
                  href={previewImageModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#0F172A',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  ↗ Open Full Original
                </a>
              </div>
            </div>
          </div>
        </div>
      )}


</div>
  );
}
