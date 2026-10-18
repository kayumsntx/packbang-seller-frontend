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
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'bids' | 'settings'>('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [bidModalItem, setBidModalItem] = useState<CustomBidRequest | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoadingBids, setIsLoadingBids] = useState(false);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [sellerChatModalItem, setSellerChatModalItem] = useState<CustomBidRequest | null>(null);
  const [sellerChatMessages, setSellerChatMessages] = useState<any[]>([]);
  const [chatMessageText, setChatMessageText] = useState('');
  const [chatFilterWarning, setChatFilterWarning] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

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
            isActive: p.isActive !== false
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
        showToast(currentLang === 'bn' ? 'পণ্যটি লাইভ ক্যাটালগে পোস্ট হয়েছে!' : 'Product listed live on PackBang marketplace!');
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
          sellerId: currentSeller.id || ('SELLER-' + (currentSeller.phone || Date.now())),
          sellerName: currentSeller.shopName || 'Verified Packaging Supplier',
          amount: amountNum,
          deliveryTime: '3-5 Days',
          note: `Factory quotation from ${currentSeller.shopName || 'packaging manufacturer'}`
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
            {currentSeller.shopName}
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
              <span style={{
                fontSize: '12px',
                background: isApproved ? '#059669' : isSuspended ? '#7C3AED' : isBanned ? '#991B1B' : isRejected ? '#DC2626' : '#D97706',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 800
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
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>Seller ID: {currentSeller.id || 'PB-8942'}</span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 6px 0', color: '#FFFFFF' }}>
              {currentLang === 'bn' ? `স্বাগতম, ${currentSeller.shopName}!` : `Welcome back, ${currentSeller.shopName}!`}
            </h1>
            <p style={{ margin: 0, color: '#CBD5E1', fontSize: '14px' }}>
              {currentLang === 'bn'
                ? 'আপনার কারখানা ও প্যাকেজিং স্টক প্রস্তুত রাখুন। প্রতিদিন দেশজুড়ে ডেলিভারি যাচ্ছে।'
                : 'Manage your packaging stock, view merchant bulk orders, and bid on custom carton print requests.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                if (!hasRequiredKyc) {
                  showToast(currentLang === 'bn' ? 'অনুগ্রহ করে প্রথমে আপনার ট্রেড লাইসেন্স ও এনআইডি জমা দিন।' : 'Please complete your Trade License and NID verification in Tab 4 first.');
                  setActiveTab('settings');
                } else if (!isApproved) {
                  if (isPendingApproval) {
                    showToast(currentLang === 'bn' ? 'আপনার অ্যাকাউন্ট অ্যাডমিন অনুমোদনের অপেক্ষায় রয়েছে। অনুমোদনের পর পণ্য যোগ করতে পারবেন।' : 'Your account is pending admin approval. You can post products after admin approval.');
                  } else if (isSuspended) {
                    showToast(currentLang === 'bn' ? 'অ্যাকাউন্ট স্থগিত রয়েছে। নতুন পণ্য যোগ করা সম্ভব নয়।' : 'Account is currently suspended. You cannot add products during suspension.');
                  } else if (isRejected) {
                    showToast(currentLang === 'bn' ? 'আবেদন বাতিল হয়েছে। অনুগ্রহ করে প্রোফাইল আপডেট করুন।' : 'Application was rejected. Please update documents in Tab 4 to resubmit.');
                    setActiveTab('settings');
                  } else if (isBanned) {
                    showToast(currentLang === 'bn' ? 'অ্যাকাউন্ট চিরতরে ব্যান করা হয়েছে।' : 'Account permanently banned.');
                  }
                } else {
                  setShowAddModal(true);
                }
              }}
              style={{
                background: isApproved ? '#FF5A1F' : '#64748B',
                color: '#fff',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: isApproved ? '0 4px 14px rgba(255, 90, 31, 0.4)' : 'none'
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

        {/* DYNAMIC STATUS & VERIFICATION BANNERS */}
        {!hasRequiredKyc ? (
          <div style={{
            background: '#FFFBEB',
            border: '1.5px solid #F59E0B',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#FEF3C7',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0
              }}>
                ⚠️
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#92400E', marginBottom: '2px' }}>
                  {currentLang === 'bn' ? 'কেওয়াইসি তথ্য বাকি রয়েছে' : 'Action Required: Incomplete Verification Documents'}
                </div>
                <div style={{ fontSize: '13px', color: '#B45309', lineHeight: 1.4 }}>
                  {currentLang === 'bn'
                    ? 'অ্যাকাউন্ট তৈরির পর সেলার নাম, ট্রেড লাইসেন্স এবং এনআইডি (উভয় অংশ) জমা দেওয়া আবশ্যক।'
                    : 'Please provide your Seller Legal Name, Trade License, and National ID (Front & Back parts) to send your approval request to admin.'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                background: '#D97706',
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)'
              }}
            >
              {currentLang === 'bn' ? 'এখনই তথ্য জমা দিন →' : 'Complete Profile Documents →'}
            </button>
          </div>
        ) : isPendingApproval ? (
          <div style={{
            background: '#EFF6FF',
            border: '1.5px solid #3B82F6',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#DBEAFE',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0
              }}>
                ⏳
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E40AF', marginBottom: '2px' }}>
                  {currentLang === 'bn' ? 'অ্যাডমিন অনুমোদনের অপেক্ষায় রয়েছে' : 'Account Under Admin Review & Verification'}
                </div>
                <div style={{ fontSize: '13px', color: '#1D4ED8', lineHeight: 1.4 }}>
                  {currentLang === 'bn'
                    ? 'আপনার ট্রেড লাইসেন্স ও এনআইডি ডকুমেন্ট সফলভাবে জমা হয়েছে। অ্যাডমিন টিম যাচাই করে অনুমোদন দিলেই পণ্য পোস্ট ও বিড করতে পারবেন।'
                    : 'Your trade documents and NID details have been submitted. Our compliance team is verifying your application. Once approved, you will have full access to list products and submit bids.'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {currentLang === 'bn' ? 'ডকুমেন্ট দেখুন' : 'View Submitted Documents'}
            </button>
          </div>
        ) : isSuspended ? (
          <div style={{
            background: '#FAF5FF',
            border: '1.5px solid #9333EA',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#F3E8FF',
                color: '#7E22CE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0
              }}>
                ⏸
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#6B21A8', marginBottom: '2px' }}>
                  {currentLang === 'bn' ? 'অ্যাকাউন্ট সাময়িকভাবে স্থগিত রয়েছে' : 'Supplier Account Temporarily Suspended'}
                </div>
                <div style={{ fontSize: '13px', color: '#7E22CE', lineHeight: 1.4 }}>
                  {currentSeller.suspendedUntil ? `Suspension active until: ${new Date(currentSeller.suspendedUntil).toLocaleDateString()}. ` : ''}
                  {currentSeller.suspensionReason ? `Reason: "${currentSeller.suspensionReason}". ` : ''}
                  {currentLang === 'bn' ? 'স্থগিতকালীন সময়ে নতুন পণ্য তালিকাভুক্তকরণ ও বিডিং বন্ধ থাকবে।' : 'New catalog listings and quotation bidding are paused during suspension.'}
                </div>
              </div>
            </div>
            <a
              href="mailto:support@packbang.com"
              style={{
                background: '#7E22CE',
                color: '#FFFFFF',
                textDecoration: 'none',
                padding: '9px 18px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px'
              }}
            >
              Contact Support
            </a>
          </div>
        ) : isBanned ? (
          <div style={{
            background: '#FEF2F2',
            border: '1.5px solid #EF4444',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0
              }}>
                🚫
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#991B1B', marginBottom: '2px' }}>
                  {currentLang === 'bn' ? 'অ্যাকাউন্ট চিরতরে ব্যান করা হয়েছে' : 'Supplier Account Permanently Banned'}
                </div>
                <div style={{ fontSize: '13px', color: '#B91C1C', lineHeight: 1.4 }}>
                  {currentSeller.banReason ? `Reason: "${currentSeller.banReason}". ` : ''}
                  {currentLang === 'bn' ? 'সকল বাণিজ্যিক সুবিধা বাতিল করা হয়েছে।' : 'All supplier privileges have been permanently revoked.'}
                </div>
              </div>
            </div>
            <a
              href="mailto:support@packbang.com"
              style={{
                background: '#DC2626',
                color: '#FFFFFF',
                textDecoration: 'none',
                padding: '9px 18px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px'
              }}
            >
              Appeal to Support
            </a>
          </div>
        ) : isRejected ? (
          <div style={{
            background: '#FEF2F2',
            border: '1.5px solid #F87171',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0
              }}>
                ✕
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#991B1B', marginBottom: '2px' }}>
                  {currentLang === 'bn' ? 'আবেদন বাতিল করা হয়েছে' : 'Supplier Verification Application Rejected'}
                </div>
                <div style={{ fontSize: '13px', color: '#B91C1C', lineHeight: 1.4 }}>
                  {currentSeller.rejectionReason ? `Reason: "${currentSeller.rejectionReason}". ` : ''}
                  {currentLang === 'bn' ? 'অনুগ্রহ করে সঠিক ট্রেড লাইসেন্স বা এনআইডি আপলোড করে পুনরায় জমা দিন।' : 'Please review and re-upload the correct documents in Tab 4 to resubmit for approval.'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                background: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {currentLang === 'bn' ? 'সংশোধন করে জমা দিন →' : 'Update & Resubmit →'}
            </button>
          </div>
        ) : null}

        {/* 4 Isolated Metric KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          marginBottom: '28px'
        }}>
          {/* Card 1: Individual Seller Stock */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700, marginBottom: '8px' }}>
              📦 {currentLang === 'bn' ? 'আপনার ইন-স্টক ইউনিট' : 'Total Units in Stock'}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', marginBottom: '4px' }}>
              {products.reduce((acc, p) => acc + (p.stock || 0), 0).toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>pcs</span>
            </div>
            <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 700 }}>
              {products.length} {currentLang === 'bn' ? 'টি পণ্য লাইভ ক্যাটালগে' : 'active packaging listings'}
            </div>
          </div>

          {/* Card 2: Individual Seller Total Sales */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700, marginBottom: '8px' }}>
              💰 {currentLang === 'bn' ? 'আপনার মোট বিক্রি (রেভিনিউ)' : 'Total Sales (Revenue)'}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#FF5A1F', marginBottom: '4px' }}>
              ৳ {((sellerMetrics.totalRevenue || orders.reduce((sum, o) => sum + (o.status === 'Delivered' ? o.amount : 0), 0)) || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>
              ✓ {currentLang === 'bn' ? 'সরাসরি সেলার পে-আউট সক্রিয়' : 'Direct Seller Payout Active'}
            </div>
          </div>

          {/* Card 3: Custom Wholesale Bids Placed */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700, marginBottom: '8px' }}>
              ⚡ {currentLang === 'bn' ? 'কাস্টম পাইকারি বিড' : 'Wholesale Bids Placed'}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#2563EB', marginBottom: '4px' }}>
              {sellerMetrics.bidsPlaced || bids.filter(b => b.bidPlaced !== undefined).length} <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>bids</span>
            </div>
            <div style={{ fontSize: '12px', color: '#2563EB', fontWeight: 700 }}>
              {bids.length} {currentLang === 'bn' ? 'টি ওপেন রিকোয়েস্ট মার্কেটপ্লেসে' : 'open inquiries available'}
            </div>
          </div>

          {/* Card 4: Orders & Shipments */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700, marginBottom: '8px' }}>
              🚚 {currentLang === 'bn' ? 'আপনার অর্ডারসমূহ' : 'Factory Orders'}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', marginBottom: '4px' }}>
              {orders.length} <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>orders</span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
              {orders.filter(o => o.status === 'Processing').length} {currentLang === 'bn' ? 'টি শিপমেন্ট প্রক্রিয়াধীন' : 'awaiting dispatch'}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', color: '#0F172A' }}>
                    {currentLang === 'bn' ? 'আপনার সাম্প্রতিক প্যাকেজিং অর্ডারসমূহ' : 'Your Recent Packaging Orders'}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>
                    {orders.length > 0 ? `Showing ${orders.length} orders for your factory` : 'Isolated exclusively to your store'}
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  style={{
                    background: '#FF5A1F',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  + {currentLang === 'bn' ? 'পণ্য যোগ করুন' : 'Post Product'}
                </button>
              </div>

              {isLoadingOrders ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏳</div>
                  <div>Loading your factory orders...</div>
                </div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                  <div style={{ fontSize: '46px', marginBottom: '12px' }}>📦</div>
                  <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                    {currentLang === 'bn' ? 'এখনও কোনো অর্ডার আসেনি' : 'No packaging orders yet'}
                  </h4>
                  <p style={{ fontSize: '13px', margin: '0 auto 20px auto', maxWidth: '440px', lineHeight: 1.5 }}>
                    {currentLang === 'bn'
                      ? 'আপনার তালিকাভুক্ত পণ্যগুলো packbang.com এর মার্কেটপ্লেসে লাইভ প্রদর্শিত হচ্ছে। ক্রেতারা অর্ডার করলে সরাসরি এখানে দেখতে পাবেন।'
                      : 'Your inventory is active on packbang.com storefront. Direct customer purchases and custom bulk orders assigned to your factory will appear here in real time.'}
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                      background: '#FF5A1F',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '10px 22px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    + {currentLang === 'bn' ? 'নতুন পণ্য পোস্ট করুন' : 'Add Packaging Item to Catalog'}
                  </button>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PACKAGING INVENTORY */}
        {activeTab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Stat Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
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
            <div style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
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
                            </td>

                            <td style={{ padding: '14px 14px' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
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
                        <button
                          type="button"
                          onClick={() => openSellerChat(b)}
                          style={{
                            marginTop: '8px',
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
                      ? 'অ্যাকাউন্ট তৈরির পর সেলারের নাম, ট্রেড লাইসেন্স এবং জাতীয় পরিচয়পত্রের (NID) উভয় অংশ জমা দিলে অ্যাডমিন যাচাই করে অনুমোদন দেন।'
                      : 'When you submit your Seller Name, Trade License, and National ID (Front & Back), an approval request is sent to Admin for review.'}
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
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

      </div>

      {/* Modal: Add Product */}
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

</div>
  );
}
