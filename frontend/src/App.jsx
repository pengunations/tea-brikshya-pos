import React, { useState, useRef, useEffect } from 'react'
import './App.css'
import NepaliDate from 'nepali-date';

// Mobile detection hook
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);
      setIsLandscape(width > height);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return { isMobile, isTablet, isLandscape };
};

// API URL - can be configured for online deployment
// Updated: Simplified authentication system - Force rebuild - Fresh deployment - Cache bust
const API_URL = 'https://tea-brikshya-pos-production.up.railway.app';


const INITIAL_PRODUCTS = [];

const INITIAL_ORDERS = [];

const getCategoryIcon = (category) => {
  switch(category) {
    case 'Chiya':
      return '🫖';
    case 'Snacks':
      return '🥟';
    case 'Chiso':
      return '🥤';
    case 'Food':
      return '🍽️';
    case 'Cigarettes':
      return '🚬';
    default:
      return '🍽️';
  }
};

// Helper to convert numbers to Nepali numerals
const toNepaliNumerals = (num) => {
  const map = ['०','१','२','३','४','५','६','७','८','९'];
  return String(num).split('').map(d => (d >= '0' && d <= '9') ? map[d] : d).join('');
};

const toNepaliTime = (date) => {
  const timeString = date.toLocaleTimeString('en-US', { hour12: false, timeZone: 'Asia/Kathmandu' });
  return timeString.split('').map(char => {
    if (char >= '0' && char <= '9') {
      return ['०','१','२','३','४','५','६','७','८','९'][parseInt(char)];
    }
    return char;
  }).join('');
};

// Nepali BS Date conversion function
const convertToNepaliBS = (date) => {
  try {
    let adDate = new Date(date);
    if (isNaN(adDate.getTime())) adDate = new Date();
    
    const nepaliDate = new NepaliDate(adDate);
    const bsYear = nepaliDate.getYear();
    const bsMonth = nepaliDate.getMonth() + 1;
    const bsDay = nepaliDate.getDate();
    
    return {
      latin: `${bsDay}/${bsMonth}/${bsYear}`,
      nepaliNumeric: `${toNepaliNumerals(bsDay)}/${toNepaliNumerals(bsMonth)}/${toNepaliNumerals(bsYear)}`
    };
  } catch (e) {
    console.error('BS date conversion error:', date, e);
    // fallback to now
    const now = new Date();
    const nepaliDate = new NepaliDate(now);
    const bsYear = nepaliDate.getYear();
    const bsMonth = nepaliDate.getMonth() + 1;
    const bsDay = nepaliDate.getDate();
    
    return {
      latin: `${bsDay}/${bsMonth}/${bsYear}`,
      nepaliNumeric: `${toNepaliNumerals(bsDay)}/${toNepaliNumerals(bsMonth)}/${toNepaliNumerals(bsYear)}`
    };
  }
};

function App() {
  const { isMobile, isTablet, isLandscape } = useMobileDetection();
  
  // Error state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  
  // Products
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  
  // Customers
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  // Rewards System
  const [customersWithRewards, setCustomersWithRewards] = useState([]);
  const [rewardTiers, setRewardTiers] = useState([]);
  const [selectedCustomerRewards, setSelectedCustomerRewards] = useState(null);
  const [customerTransactions, setCustomerTransactions] = useState([]);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  
  const [tableNumber, setTableNumber] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuSelectedCategory, setMenuSelectedCategory] = useState('All');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [viewOrder, setViewOrder] = useState(null);
  const [refundItem, setRefundItem] = useState(null);
  const [lineItemDiscounts, setLineItemDiscounts] = useState({}); // {itemId: {type: 'percentage'|'flat', value: number}}
  const [showItemDiscount, setShowItemDiscount] = useState(null); // itemId for which to show discount modal

  // Indoor Table Configuration
  const [tableConfig, setTableConfig] = useState({
    totalTables: 4,
    tableNames: [
      'Table 1', 'Table 2', 'Table 3', 'Table 4'
    ]
  });
  
  // Backyard Table Configuration
  const [backyardTableConfig, setBackyardTableConfig] = useState({
    totalTables: 16,
    tableNames: [
      'Backyard Table 1', 'Backyard Table 2', 'Backyard Table 3', 'Backyard Table 4',
      'Backyard Table 5', 'Backyard Table 6', 'Backyard Table 7', 'Backyard Table 8',
      'Backyard Table 9', 'Backyard Table 10', 'Backyard Table 11', 'Backyard Table 12',
      'Backyard Table 13', 'Backyard Table 14', 'Backyard Table 15', 'Backyard Table 16'
    ]
  });
  
  // Simple table order state
  const [tableOrders, setTableOrders] = useState({});
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableOrder, setShowTableOrder] = useState(false);
  
  // Backyard table state
  const [backyardTableOrders, setBackyardTableOrders] = useState({});
  const [selectedBackyardTable, setSelectedBackyardTable] = useState(null);
  const [showBackyardTableOrder, setShowBackyardTableOrder] = useState(false);

  const receiptRef = useRef();
  const [editingOrder, setEditingOrder] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutPayment, setCheckoutPayment] = useState('Cash');
  const [checkoutCash, setCheckoutCash] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutTableInfo, setCheckoutTableInfo] = useState(null);

  // Top-right header state
  const [now, setNow] = useState(new Date());

  // Navigation state
  const [activeTab, setActiveTab] = useState('Take-out');
  const [dineInActiveTab, setDineInActiveTab] = useState('indoor');
  
  // Dashboard state
  const [dashboardData, setDashboardData] = useState({
    todaySales: 0,
    todayOrders: 0,
    averageOrderValue: 0,
    topProducts: [],
    tableStatus: {
      available: 0,
      occupied: 0,
      reserved: 0
    },
    recentOrders: []
  });
  const [selectedDateRange, setSelectedDateRange] = useState('today');
  const [showTableManagement, setShowTableManagement] = useState(false);

  // At the top of the App function, after other useState hooks:
  const [cart, setCart] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');
  


  // Refund state
  const [refunds, setRefunds] = useState([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [showRefundHistory, setShowRefundHistory] = useState(false);



  // Apply manual line item discount
  const applyLineItemDiscount = (itemId, discountType, discountValue) => {
    console.log('Applying line item discount:', { itemId, discountType, discountValue });
    setLineItemDiscounts(prev => {
      const newDiscounts = {
        ...prev,
        [itemId]: { type: discountType, value: parseFloat(discountValue) || 0 }
      };
      console.log('Updated line item discounts:', newDiscounts);
      return newDiscounts;
    });
  };

  // Remove line item discount
  const removeLineItemDiscount = (itemId) => {
    setLineItemDiscounts(prev => {
      const newDiscounts = { ...prev };
      delete newDiscounts[itemId];
      return newDiscounts;
    });
  };

  // Calculate item price with discounts
  const getItemPrice = (item) => {
    const manualDiscount = lineItemDiscounts[item.id];
    let finalPrice = item.price;

    console.log('getItemPrice debug:', { itemId: item.id, originalPrice: item.price, manualDiscount });

    // Apply manual discount
    if (manualDiscount) {
      if (manualDiscount.type === 'percentage') {
        finalPrice = finalPrice * (1 - manualDiscount.value / 100);
        console.log('Applied percentage discount:', { original: item.price, discount: manualDiscount.value, final: finalPrice });
      } else if (manualDiscount.type === 'flat') {
        finalPrice = Math.max(0, finalPrice - manualDiscount.value);
        console.log('Applied flat discount:', { original: item.price, discount: manualDiscount.value, final: finalPrice });
      }
    }

    return finalPrice;
  };

  // Calculate total with all discounts
  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      const itemPrice = getItemPrice(item);
      return sum + (itemPrice * item.qty);
    }, 0);
  };



  // Add to cart
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    
    // Also remove manual discount
    removeLineItemDiscount(productId);
  };

  // Update quantity
  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQty = item.qty + delta;
        return newQty <= 0 ? null : { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  // Global error handler
  useEffect(() => {
    const handleError = (error) => {
      console.error('Global error caught:', error);
      setHasError(true);
      setErrorMessage(error.message || 'An unexpected error occurred');
    };

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      setHasError(true);
      setErrorMessage(event.reason?.message || 'An unexpected error occurred');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Check for existing authentication token on app load
  useEffect(() => {
    try {
      console.log('=== AUTHENTICATION CHECK ===');
      const token = sessionStorage.getItem('authToken');
      console.log('Token found:', !!token);
      
      if (token) {
        console.log('Validating token...');
        // Validate the token by making a request to /auth/me
        fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(res => {
          console.log('Auth response status:', res.status);
          if (res.ok) {
            return res.json();
          } else {
            // Token is invalid, remove it
            console.log('Token invalid, removing...');
            sessionStorage.removeItem('authToken');
            throw new Error('Invalid token');
          }
        })
        .then(user => {
          console.log('Token valid, user:', user);
          setIsAuthenticated(true);
          setCurrentUser(user);
          setActiveTab('Dashboard');
        })
        .catch(error => {
          console.log('Token validation failed:', error);
          setIsAuthenticated(false);
          setCurrentUser(null);
        });
      } else {
        console.log('No token found, showing login screen');
      }
    } catch (error) {
      console.error('Authentication check error:', error);
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load existing pending orders for table management
  useEffect(() => {
    const loadPendingOrders = async () => {
      try {
        const response = await fetch(`${API_URL}/orders`, {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const allOrders = await response.json();
          const pendingOrders = allOrders.filter(order => 
            order.status === 'pending' && order.serviceType === 'dine-in'
          );
          
          const tableOrdersMap = {};
          pendingOrders.forEach(order => {
            const tableNumber = order.table;
            const tableId = tableConfig.tableNames.findIndex(name => name === tableNumber) + 1;
            if (tableId > 0) {
              console.log('Loading table order:', {
                tableId,
                orderId: order.id,
                items: order.items,
                total: order.total,
                lineItemDiscounts: order.lineItemDiscounts
              });
              
              // Parse lineItemDiscounts if it's a string
              let parsedLineItemDiscounts = {};
              if (order.lineItemDiscounts) {
                try {
                  parsedLineItemDiscounts = typeof order.lineItemDiscounts === 'string' 
                    ? JSON.parse(order.lineItemDiscounts) 
                    : order.lineItemDiscounts;
                  console.log('Parsed line item discounts:', parsedLineItemDiscounts);
                } catch (error) {
                  console.error('Error parsing line item discounts:', error);
                  parsedLineItemDiscounts = {};
                }
              }
              
              tableOrdersMap[tableId] = {
                items: order.items,
                total: order.total,
                lineItemDiscounts: parsedLineItemDiscounts,
                customerName: order.customerName || '',
                status: 'pending',
                orderId: order.id
              };
            }
          });
          
          setTableOrders(tableOrdersMap);
        }
      } catch (error) {
        console.error('Error loading pending orders:', error);
      }
    };

    if (isAuthenticated) {
      loadPendingOrders();
    }
  }, [isAuthenticated, tableConfig.tableNames]);

  // Authentication state - no automatic login
  // Users must manually log in each time

  // Authentication functions
  const handleLogin = async (username, password) => {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Username:', username);
    console.log('API_URL:', API_URL);
    console.log('Backend URL:', `${API_URL}/auth/login`);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('Login response status:', response.status);
      console.log('Login response headers:', response.headers);
      const data = await response.json();
      console.log('Login response data:', data);

      if (response.ok) {
        console.log('Login successful, storing token...');
        // Store token in sessionStorage instead of localStorage for session-only persistence
        sessionStorage.setItem('authToken', data.token);
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        setLoginError('');
        // Set Dashboard as the default tab after login
        setActiveTab('Dashboard');
        console.log('Login complete, user authenticated');
      } else {
        console.log('Login failed:', data.error);
        setLoginError(data.error || 'Login failed');
      }
    } catch (error) {
      console.log('Login network error:', error);
      setLoginError('Network error. Please try again.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('Take-out');
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('authToken');
    console.log('getAuthHeaders - token:', token ? 'exists' : 'missing');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Count today's orders
  const todayStr = now.toLocaleDateString('en-GB', { timeZone: 'Asia/Kathmandu' });
  const todaysOrders = orders.filter(o => {
    const orderDate = new Date(o.date);
    return orderDate.toLocaleDateString('en-GB', { timeZone: 'Asia/Kathmandu' }) === todayStr;
  });

  const categories = ['All', 'Chiya', 'Chiso', 'Snacks', 'Food', 'Cigarettes'];

  // Fetch products
  useEffect(() => {
    setProductsLoading(true);
    fetch(`${API_URL}/products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        } else {
          // Use initial products if database is empty
          console.log('Database empty, using initial products');
          setProducts(INITIAL_PRODUCTS);
        }
      })
      .catch(e => {
        console.log('Error fetching products, using initial products:', e.message);
        setProducts(INITIAL_PRODUCTS);
        setProductsError(e.message);
      })
      .finally(() => setProductsLoading(false));
  }, []);

  // Fetch orders
  useEffect(() => {
    setOrdersLoading(true);
    fetch(`${API_URL}/orders`)
      .then(res => res.json())
      .then(data => {
        console.log('Fetched orders:', data);
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
        }
      })
      .catch(e => {
        setOrdersError(e.message);
        setOrders([]);
      })
      .finally(() => setOrdersLoading(false));
  }, []);

  // Fetch customers and rewards data
  useEffect(() => {
    setCustomersLoading(true);
    Promise.all([
      fetch(`${API_URL}/customers`).then(res => res.json()),
      loadCustomersWithRewards(),
      loadRewardTiers(),
      loadTableOrders()
    ])
      .then(([customersData]) => {
        console.log('Loaded customers:', customersData);
        setCustomers(customersData);
      })
      .catch(e => setCustomersError(e.message))
      .finally(() => setCustomersLoading(false));
  }, []);

  // Load dashboard analytics data
  const loadDashboardData = async () => {
    console.log('=== LOADING DASHBOARD DATA ===');
    console.log('Orders count:', orders.length);
    console.log('Selected date range:', selectedDateRange);
    try {
      const nowLocal = new Date();
      let startDate, endDate, filteredOrders;
      
      switch (selectedDateRange) {
        case 'today':
          startDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate());
          endDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate() + 1);
          break;
        case 'week':
          const dayOfWeek = nowLocal.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          startDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate() - daysToMonday);
          endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), 1);
          endDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth() + 1, 1);
          break;
        default:
          startDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate());
          endDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate() + 1);
      }
      
      filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        if (selectedDateRange === 'today') {
          return (
            orderDate.getFullYear() === nowLocal.getFullYear() &&
            orderDate.getMonth() === nowLocal.getMonth() &&
            orderDate.getDate() === nowLocal.getDate()
          );
        }
        if (selectedDateRange === 'month') {
          return (
            orderDate.getFullYear() === nowLocal.getFullYear() &&
            orderDate.getMonth() === nowLocal.getMonth()
          );
        }
        if (selectedDateRange === 'week') {
          return orderDate >= startDate && orderDate < endDate;
        }
        return orderDate >= startDate && orderDate < endDate;
      });
      
      const periodSales = filteredOrders.reduce((sum, order) => sum + order.total, 0);
      
      console.log('=== DASHBOARD DEBUG ===');
      console.log('Date range:', selectedDateRange);
      console.log('Now local time:', nowLocal.toISOString());
      console.log('Start date:', startDate.toISOString());
      console.log('End date:', endDate.toISOString());
      console.log('Total orders:', orders.length);
      console.log('Filtered orders:', filteredOrders.length);
      
      // Show details of the filtered orders
      if (filteredOrders.length > 0) {
        console.log('Filtered order details:');
        filteredOrders.forEach((order, index) => {
          const orderDateUTC = new Date(order.date);
          const orderNepal = new Date(orderDateUTC.toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' }));
          console.log(`Order ${index + 1}:`, {
            id: order.id,
            originalDate: order.date,
            nepalDate: orderNepal.toISOString(),
            total: order.total
          });
        });
      }
      
      console.log('Period sales:', periodSales);
      console.log('========================');
      const averageOrderValue = filteredOrders.length > 0 ? periodSales / filteredOrders.length : 0;
      
      // Calculate top products for the period
      const productSales = {};
      filteredOrders.forEach(order => {
        order.items.forEach(item => {
          productSales[item.name] = (productSales[item.name] || 0) + item.qty;
        });
      });
      
      const topProducts = Object.entries(productSales)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, qty]) => ({ name, qty }));
      
      // Calculate table status (always current, not period-specific)
      const totalIndoorTables = tableConfig.totalTables;
      const totalBackyardTables = backyardTableConfig.totalTables;
      const totalTables = totalIndoorTables + totalBackyardTables;
      
      const occupiedIndoorTables = Object.keys(tableOrders).length;
      const occupiedBackyardTables = Object.keys(backyardTableOrders).length;
      const totalOccupiedTables = occupiedIndoorTables + occupiedBackyardTables;
      
      const tableStatus = {
        available: totalTables - totalOccupiedTables,
        occupied: totalOccupiedTables,
        reserved: 0 // For now, no reserved tables
      };
      
      // Get recent orders (always show recent, not period-specific)
      const recentOrders = orders.slice(0, 10);
      
      // Load refund statistics
      let refundStats = { totalRefunds: 0, totalRefundAmount: 0, avgRefundAmount: 0 };
      try {
        const refundResponse = await fetch(`${API_URL}/refunds/stats?period=${selectedDateRange}`, {
          headers: getAuthHeaders()
        });
        if (refundResponse.ok) {
          refundStats = await refundResponse.json();
        }
      } catch (error) {
        console.error('Error loading refund stats:', error);
      }
      
      setDashboardData({
        todaySales: periodSales,
        todayOrders: filteredOrders.length,
        averageOrderValue,
        topProducts,
        tableStatus,
        recentOrders,
        refundStats
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  // Update dashboard data when orders change or date range changes
  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [orders, isAuthenticated, selectedDateRange]);

  // Product CRUD
  const addProduct = async (newProduct) => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newProduct),
      });
      if (response.ok) {
        const product = await response.json();
        setProducts([...products, product]);
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const updateProduct = async (updatedProduct) => {
    try {
      const response = await fetch(`${API_URL}/products/${updatedProduct.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedProduct),
      });
      if (response.ok) {
        const product = await response.json();
        setProducts(products.map(p => p.id === product.id ? product : p));
        setEditingProduct(null);
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const deleteProduct = async (id) => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  // Customer CRUD
  const addCustomer = async (customer) => {
    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      if (response.ok) {
        const newCustomer = await response.json();
        setCustomers([newCustomer, ...customers]);
        setShowCustomerForm(false);
        setEditingCustomer(null);
        return newCustomer;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add customer');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (customer) => {
    try {
      const response = await fetch(`${API_URL}/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      if (response.ok) {
        const updatedCustomer = await response.json();
        setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
        setShowCustomerForm(false);
        setEditingCustomer(null);
        return updatedCustomer;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  const deleteCustomer = async (id) => {
    try {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCustomers(customers.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const redeemFreeItem = async (customerId) => {
    try {
      const response = await fetch(`${API_URL}/customers/${customerId}/redeem-free-item`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const result = await response.json();
        // Update the customer in the list
        setCustomers(customers.map(c => 
          c.id === customerId ? result.customer : c
        ));
        alert(result.message);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error redeeming free item:', error);
      alert('Error redeeming free item. Please try again.');
    }
  };

  // Rewards System Functions
  const loadCustomersWithRewards = async () => {
    try {
      console.log('Loading customers with rewards...');
      const response = await fetch(`${API_URL}/customers-with-rewards`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded customers with rewards:', data);
        setCustomersWithRewards(data);
      } else {
        console.error('Failed to load customers with rewards:', response.status);
      }
    } catch (error) {
      console.error('Error loading customers with rewards:', error);
    }
  };

  const loadRewardTiers = async () => {
    try {
      const response = await fetch(`${API_URL}/reward-tiers`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setRewardTiers(data);
      }
    } catch (error) {
      console.error('Error loading reward tiers:', error);
    }
  };

  const loadCustomerRewards = async (customerId) => {
    try {
      const response = await fetch(`${API_URL}/customers/${customerId}/rewards`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedCustomerRewards(data);
        return data;
      }
    } catch (error) {
      console.error('Error loading customer rewards:', error);
    }
  };

  const loadCustomerTransactions = async (customerId) => {
    try {
      const response = await fetch(`${API_URL}/customers/${customerId}/transactions`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setCustomerTransactions(data);
        return data;
      }
    } catch (error) {
      console.error('Error loading customer transactions:', error);
    }
  };



  const redeemPoints = async (customerId, pointsToRedeem, orderTotal) => {
    try {
      const response = await fetch(`${API_URL}/customers/${customerId}/redeem-points`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointsToRedeem, orderTotal }),
      });
      if (response.ok) {
        const data = await response.json();
        // Reload customer rewards
        await loadCustomerRewards(customerId);
        return data;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to redeem points');
      }
    } catch (error) {
      console.error('Error redeeming points:', error);
      throw error;
    }
  };

  // Order CRUD
  const addOrder = async (order) => {
    try {
      console.log('Adding order:', order);
      console.log('Selected customer:', selectedCustomer);
      const orderWithCustomer = {
        ...order,
        customerId: selectedCustomer?.id || null
      };
      console.log('Order with customer:', orderWithCustomer);
      console.log('Customer ID being sent:', orderWithCustomer.customerId);
      
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderWithCustomer),
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const newOrder = await response.json();
        console.log('Order saved successfully:', newOrder);
        setOrders([newOrder, ...orders]);
        setCart([]);
        setTableNumber('');
        setSelectedCustomer(null); // Clear selected customer after order
        
        // Reload customers to update visit counts
        if (orderWithCustomer.customerId) {
          console.log('Reloading customers to update visit counts...');
          // Reload both customer lists to ensure visit counts are updated
          Promise.all([
            fetch(`${API_URL}/customers`).then(res => res.json()).then(data => setCustomers(data)),
            loadCustomersWithRewards()
          ]).catch(error => {
            console.error('Error reloading customers:', error);
          });
        }
        
        alert('Order completed successfully!');
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        alert(`Error saving order: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding order:', error);
      alert(`Network error: ${error.message}`);
    }
  };

  const updateOrder = async (orderId, items, total, discountInfo = {}) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items, 
          total,
          discountAmount: discountInfo.discountAmount || 0,
          discountType: discountInfo.discountType || 'none',
          promoCode: discountInfo.promoCode || null,
          lineItemDiscounts: discountInfo.lineItemDiscounts || {},
          customerName: discountInfo.customerName || null,
          customerId: discountInfo.customerId || null,
          orderNotes: discountInfo.orderNotes || null
        }),
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        return updatedOrder;
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  };

  const deleteOrder = async (id) => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setOrders(orders.filter(o => o.id !== id));
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const total = calculateTotal();

  const canOrder = cart.length > 0;

  const handleResetSales = async () => {
    if (!window.confirm('Are you sure you want to reset all sales and refunds? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setOrders([]);
            // Also clear table orders when resetting sales
    setTableOrders({});
    // Clear backyard table orders when resetting sales
    setBackyardTableOrders({});
    
    // Clear pending table orders from database
    try {
      const response = await fetch(`${API_URL}/pending-table-orders`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        console.log('Pending table orders cleared from database');
      }
    } catch (error) {
      console.error('Error clearing pending table orders:', error);
    }
        // Clear refunds from state
        setRefunds([]);
        // Force reload dashboard data
        setDashboardData({
          todaySales: 0,
          todayOrders: 0,
          averageOrderValue: 0,
          topProducts: [],
          tableStatus: {
            available: tableConfig.totalTables,
            occupied: 0,
            reserved: 0
          },
          recentOrders: [],
          refundStats: {
            totalRefunds: 0,
            totalRefundAmount: 0,
            avgRefundAmount: 0
          }
        });
        alert('All sales and refunds have been reset successfully.');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error resetting sales:', error);
      alert('Error resetting sales. Please try again.');
    }
  };

  const handleResetCustomerVisits = async () => {
    if (!window.confirm('Are you sure you want to reset all customer visit counters? This will reset all customer progress towards free items.')) {
      return;
    }
    
    try {
      console.log('Sending reset customer visits request...');
      const response = await fetch(`${API_URL}/customers/reset-visits`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Reset successful:', result);
        // Reload customers to get updated visit counts
        loadCustomersWithRewards();
        alert('All customer visit counters have been reset successfully.');
      } else {
        const error = await response.json();
        console.error('Server error:', error);
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error resetting customer visits:', error);
      alert(`Error resetting customer visits: ${error.message}`);
    }
  };

  const handleClearAllOrders = async () => {
    if (!window.confirm('Are you sure you want to clear ALL orders? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/orders/clear`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        alert('All orders cleared successfully!');
        // Reload orders to show empty state
        setOrders([]);
      } else {
        const error = await response.json();
        alert('Error clearing orders: ' + error.error);
      }
    } catch (error) {
      console.error('Error clearing orders:', error);
      alert('Error clearing orders. Please try again.');
    }
  };

  const handleClearAllProducts = async () => {
    if (!window.confirm('Are you sure you want to clear ALL products? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/products/clear`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        alert('All products cleared successfully!');
        // Reload products to show empty state
        setProducts([]);
      } else {
        const error = await response.json();
        alert('Error clearing products: ' + error.error);
      }
    } catch (error) {
      console.error('Error clearing products:', error);
      alert('Error clearing products. Please try again.');
    }
  };

  const openCheckout = () => {
    setShowCheckout(true);
  };

  const closeCheckout = () => {
    setShowCheckout(false);
    setCheckoutPayment('Cash');
    setCheckoutCash('');
    setCheckoutError('');
    setCheckoutTableInfo(null);
  };

  const handleCheckoutComplete = async (discountInfo = {}) => {
    console.log('Checkout complete called with:', { checkoutPayment, checkoutCash, total, discountInfo, checkoutTableInfo });
    
    // Process checkout
    console.log('Processing checkout...');
    
    if (checkoutPayment === 'Cash') {
      const cash = parseFloat(checkoutCash);
      const finalTotal = discountInfo.finalTotal || total;
      if (isNaN(cash) || cash < finalTotal) {
        setCheckoutError('Cash received must be at least the final total amount.');
        return;
      }
    }

    // Check if this is a dine-in checkout
    if (checkoutTableInfo) {
      console.log('Processing dine-in checkout for table:', checkoutTableInfo.tableName);
      // Update the existing dine-in order
      if (checkoutTableInfo.orderId) {
        updateOrder(checkoutTableInfo.orderId, cart, total, discountInfo);
      }

      // Delete from database first, then clear the table
      console.log('Deleting table order for table:', checkoutTableInfo.tableId);
      const deleteSuccess = await deleteTableOrder(checkoutTableInfo.tableId);
      console.log('Delete result:', deleteSuccess);
      
      // Clear the table state based on whether it's indoor or backyard
      if (checkoutTableInfo.tableId <= 4) {
        // Indoor table
        setTableOrders(prev => {
          const newState = { ...prev };
          delete newState[checkoutTableInfo.tableId];
          return newState;
        });
      } else {
        // Backyard table - convert from database ID (101+) back to table number (1-16)
        const backyardTableId = checkoutTableInfo.tableId - 100;
        setBackyardTableOrders(prev => {
          const newState = { ...prev };
          delete newState[backyardTableId];
          console.log(`Cleared backyard table ${backyardTableId} from state`);
          return newState;
        });
      }

    const order = {
      date: new Date().toISOString(),
        table: checkoutTableInfo.tableName,
      items: cart,
      total: total,
      payment: checkoutPayment,
        status: 'completed',
        serviceType: 'dine-in',
        discountAmount: discountInfo.discountAmount || 0,
        discountType: discountInfo.discountType || 'none',
        promoCode: discountInfo.promoCode || null,
        finalTotal: discountInfo.finalTotal || total,
        lineItemDiscounts: discountInfo.lineItemDiscounts || {},
        orderNotes: orderNotes
    };

    addOrder(order);
      setCheckoutTableInfo(null);
      alert(`Table ${checkoutTableInfo.tableName} has been checked out successfully!`);
    } else {
      // Regular take-out order
      console.log('Processing take-out checkout');
      const order = {
        date: new Date().toISOString(),
        table: 'Takeaway',
        items: cart,
        total: total,
        payment: checkoutPayment,
        status: 'completed',
        serviceType: 'take-out',
        discountAmount: discountInfo.discountAmount || 0,
        discountType: discountInfo.discountType || 'none',
        promoCode: discountInfo.promoCode || null,
        finalTotal: discountInfo.finalTotal || total,
        lineItemDiscounts: discountInfo.lineItemDiscounts || {},
        orderNotes: orderNotes
      };
      console.log('Take-out order to be saved:', order);
      addOrder(order);
    }
    
    setCart([]);
    setOrderNotes('');
    closeCheckout();
    
    // Force reload table orders to sync with database after a delay
    setTimeout(() => {
      console.log('Force reloading table orders from database...');
      loadTableOrders();
    }, 1000);
    
          // Force clear the specific table state immediately
      if (checkoutTableInfo) {
        console.log('Force clearing table state for:', checkoutTableInfo.tableId);
        setTableOrders(prev => {
          const newState = { ...prev };
          delete newState[checkoutTableInfo.tableId];
          console.log('Cleared table state:', newState);
          return newState;
        });
        
        // Also clear from backyard table orders if it's a backyard table
        if (checkoutTableInfo.tableId > 4) {
          const backyardTableId = checkoutTableInfo.tableId - 100;
          setBackyardTableOrders(prev => {
            const newState = { ...prev };
            delete newState[backyardTableId];
            console.log(`Force cleared backyard table ${backyardTableId} from state:`, newState);
            return newState;
          });
        }
      }
  } // <-- This is the end of handleCheckoutComplete


  
    // Simple table order functions
  const openTableOrder = (tableId) => {
    console.log(`🟢 openTableOrder called with tableId: ${tableId}`);
    console.log('Current showTableOrder state:', showTableOrder);
    console.log('Current selectedTable state:', selectedTable);
    console.log('Current tableOrders state:', tableOrders);
    console.log('Authentication status:', isAuthenticated);
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated, attempting to authenticate...');
      const token = sessionStorage.getItem('authToken');
      if (token) {
        console.log('Token found, setting authenticated state...');
        setIsAuthenticated(true);
        setCurrentUser({ username: 'admin', role: 'admin' });
      } else {
        console.log('No token found, showing login prompt...');
        alert('Please log in to use table functions.');
        return;
      }
    }
    
    console.log(`🔄 Setting selectedTable to: ${tableId}`);
    setSelectedTable(tableId);
    setShowTableOrder(true);
    console.log('Table order modal should now be visible');
    
    // Force a re-render to ensure the modal shows up
    setTimeout(() => {
      console.log('After timeout - showTableOrder:', showTableOrder);
      console.log('After timeout - selectedTable:', selectedTable);
      console.log('After timeout - tableOrders:', tableOrders);
    }, 100);
  };

  const saveTableOrder = async (tableId, items, customerId = null) => {
    console.log(`🔄 saveTableOrder called with tableId: ${tableId}, items:`, items, 'customerId:', customerId);
    console.log('📊 Current tableOrders state before update:', tableOrders);
    
    try {
      const response = await fetch(`${API_URL}/pending-table-orders`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: tableId, // Indoor tables use original tableId (1-4)
          tableName: `Table ${tableId}`,
          items,
          total: items.reduce((sum, item) => sum + (item.price * item.qty), 0),
          status: 'pending',
          customerId: customerId
        }),
      });
      
      if (response.ok) {
        console.log(`✅ Table order saved successfully for table: ${tableId}`);
        // Update local state
        setTableOrders(prev => {
          console.log('🔄 Previous state in setTableOrders:', prev);
          const newState = {
            ...prev,
            [tableId]: {
              items,
              total: items.reduce((sum, item) => sum + (item.price * item.qty), 0),
              status: 'pending',
              customerId: customerId
            }
          };
          console.log('🆕 New tableOrders state:', newState);
          console.log(`🎯 Table ${tableId} should have:`, newState[tableId]);
          console.log(`🔍 Checking if table 3 also has items:`, newState[3]);
          return newState;
        });
      } else {
        console.error('❌ Failed to save table order');
      }
    } catch (error) {
      console.error('❌ Error saving table order:', error);
    }
  };

  const deleteTableOrder = async (tableId) => {
    try {
      // Determine if this is an indoor or backyard table
      const isBackyardTable = tableId > 100; // Backyard tables use 101+
      const actualTableId = tableId; // tableId is already the database ID
      
      console.log(`🗑️ deleteTableOrder called with tableId: ${tableId}, isBackyardTable: ${isBackyardTable}, actualTableId: ${actualTableId}`);
      
      const response = await fetch(`${API_URL}/pending-table-orders/${actualTableId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      console.log(`🗑️ Delete response status: ${response.status}`);
      
      if (response.ok) {
        console.log('✅ Table order deleted successfully from database');
        // Clear local state based on table type
        if (isBackyardTable) {
          const localTableId = tableId - 100; // Convert back to local ID (1-16)
          console.log(`🗑️ Clearing backyard table ${localTableId} from local state`);
          setBackyardTableOrders(prev => {
            const newState = { ...prev };
            delete newState[localTableId];
            console.log('🗑️ Updated backyard table orders:', newState);
            return newState;
          });
        } else {
          console.log(`🗑️ Clearing indoor table ${tableId} from local state`);
          setTableOrders(prev => {
            const newState = { ...prev };
            delete newState[tableId];
            console.log('🗑️ Updated indoor table orders:', newState);
            return newState;
          });
        }
        return true;
      } else {
        console.error('❌ Failed to delete table order from database');
        return false;
      }
    } catch (error) {
      console.error('❌ Error deleting table order:', error);
      return false;
    }
  };

  const loadTableOrders = async () => {
    console.log('loadTableOrders called');
    try {
      const response = await fetch(`${API_URL}/pending-table-orders`, {
        headers: getAuthHeaders(),
      });
      console.log('loadTableOrders response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded table orders:', data);
        
        const tableOrdersMap = {};
        const backyardTableOrdersMap = {};
        
        data.forEach(order => {
          console.log('Processing order from database:', order);
          const orderData = {
            items: order.items || [],
            total: order.total || 0,
            status: order.status || 'pending'
          };
          
          // Separate indoor and backyard tables
          if (order.table_id <= 4) {
            // Indoor tables (1-4)
            console.log(`Adding to indoor table ${order.table_id}:`, orderData);
            tableOrdersMap[order.table_id] = orderData;
          } else if (order.table_id >= 101) {
            // Backyard tables (101+)
            const backyardTableId = order.table_id - 100;
            console.log(`Adding to backyard table ${backyardTableId}:`, orderData);
            backyardTableOrdersMap[backyardTableId] = orderData;
          }
        });
        
        console.log('Final tableOrdersMap:', tableOrdersMap);
        console.log('Final backyardTableOrdersMap:', backyardTableOrdersMap);
        
        setTableOrders(tableOrdersMap);
        setBackyardTableOrders(backyardTableOrdersMap);
      }
    } catch (error) {
      console.error('Error loading table orders:', error);
    }
  };

  const getTableStatus = (tableId) => {
    const tableOrder = tableOrders[tableId];
    console.log(`getTableStatus for table ${tableId}:`, tableOrder);
    if (!tableOrder || !tableOrder.items || tableOrder.items.length === 0) {
      console.log(`Table ${tableId} is FREE`);
      return 'free';
    }
    console.log(`Table ${tableId} is OCCUPIED with ${tableOrder.items.length} items`);
    return 'occupied';
  };

  const getTableStatusColor = (status) => {
    switch (status) {
      case 'free': return '#10b981';
      case 'occupied': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTableStatusText = (status) => {
    switch (status) {
      case 'free': return 'Free';
      case 'occupied': return 'Occupied';
      default: return 'Unknown';
    }
  };

  const checkoutTable = (tableId) => {
    const tableOrder = tableOrders[tableId];
    if (!tableOrder || tableOrder.items.length === 0) {
      alert('No items to checkout for this table.');
      return;
    }

    setCart(tableOrder.items);
    setShowCheckout(true);
    
    // Set the selected customer from the table order if available
    if (tableOrder.customerId) {
      const customer = customers.find(c => c.id == tableOrder.customerId);
      setSelectedCustomer(customer || null);
      console.log('Setting customer from table order:', customer);
    } else {
      setSelectedCustomer(null);
    }
    
    setCheckoutTableInfo({
      tableId: tableId,
      tableName: `Table ${tableId}`,
      customerId: tableOrder.customerId || null
    });
  };

  // Backyard table functions
  const openBackyardTableOrder = (tableId) => {
    console.log('openBackyardTableOrder called with tableId:', tableId);
    console.log('Current showBackyardTableOrder state:', showBackyardTableOrder);
    console.log('Current selectedBackyardTable state:', selectedBackyardTable);
    console.log('Authentication status:', isAuthenticated);
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated, attempting to authenticate...');
      const token = sessionStorage.getItem('authToken');
      if (token) {
        console.log('Token found, setting authenticated state...');
        setIsAuthenticated(true);
        setCurrentUser({ username: 'admin', role: 'admin' });
      } else {
        console.log('No token found, showing login prompt...');
        alert('Please log in to use table functions.');
        return;
      }
    }
    
    setSelectedBackyardTable(tableId);
    setShowBackyardTableOrder(true);
    console.log('Backyard table order modal should now be visible');
    // Force a re-render to ensure the modal shows up
    setTimeout(() => {
      console.log('After timeout - showBackyardTableOrder:', showBackyardTableOrder);
      console.log('After timeout - selectedBackyardTable:', selectedBackyardTable);
    }, 100);
  };

  const saveBackyardTableOrder = async (tableId, items, customerId = null) => {
    try {
      const response = await fetch(`${API_URL}/pending-table-orders`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: tableId + 100, // Backyard tables use tableId + 100 (101, 102, etc.)
          tableName: backyardTableConfig.tableNames[tableId - 1],
          items,
          total: items.reduce((sum, item) => sum + (item.price * item.qty), 0),
          status: 'pending',
          customerId: customerId
        }),
      });
      
      if (response.ok) {
        console.log('Backyard table order saved successfully');
        // Update local state
        setBackyardTableOrders(prev => ({
          ...prev,
          [tableId]: {
            items,
            total: items.reduce((sum, item) => sum + (item.price * item.qty), 0),
            status: 'pending',
            customerId: customerId
          }
        }));
      } else {
        console.error('Failed to save backyard table order');
      }
    } catch (error) {
      console.error('Error saving backyard table order:', error);
    }
  };

  const getBackyardTableStatus = (tableId) => {
    const tableOrder = backyardTableOrders[tableId];
    console.log(`getBackyardTableStatus for table ${tableId}:`, tableOrder);
    if (!tableOrder || !tableOrder.items || tableOrder.items.length === 0) {
      return 'free';
    }
    return 'occupied';
  };

  const getBackyardTableStatusColor = (status) => {
    switch (status) {
      case 'free': return '#10b981';
      case 'occupied': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const checkoutBackyardTable = (tableId) => {
    const tableOrder = backyardTableOrders[tableId];
    if (!tableOrder || tableOrder.items.length === 0) {
      alert('No items to checkout for this table.');
      return;
    }

    setCart(tableOrder.items);
    setShowCheckout(true);
    
    // Set the selected customer from the table order if available
    if (tableOrder.customerId) {
      const customer = customers.find(c => c.id == tableOrder.customerId);
      setSelectedCustomer(customer || null);
      console.log('Setting customer from backyard table order:', customer);
    } else {
      setSelectedCustomer(null);
    }
    
    setCheckoutTableInfo({
      tableId: tableId + 100, // Convert to database ID (101+)
      tableName: backyardTableConfig.tableNames[tableId - 1],
      customerId: tableOrder.customerId || null
    });
  };

  const sendBackyardToKitchen = (tableId, newItems) => {
    console.log('sendBackyardToKitchen called with:', { tableId, newItems });
    if (!newItems || newItems.length === 0) {
      alert('No items to send to kitchen.');
      return;
    }

    // Save to database using the simple saveBackyardTableOrder function
    saveBackyardTableOrder(tableId, newItems);
  };
  


  const sendToKitchen = (tableId, newItems) => {
    console.log('sendToKitchen called with:', { tableId, newItems });
    if (!newItems || newItems.length === 0) {
      alert('No items to send to kitchen.');
      return;
    }

    // Save to database using the simple saveTableOrder function
    saveTableOrder(tableId, newItems);
  };





  const printKitchenOrder = (order) => {
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      
    const kitchenOrderHTML = `
        <!DOCTYPE html>
        <html>
        <head>
        <title>Kitchen Order - Tea वृक्ष</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: white; 
              color: black;
            }
          .kitchen-order {
              max-width: 300px;
              margin: 0 auto;
            border: 3px solid #ea580c;
              padding: 20px;
              border-radius: 8px;
            background: #fff7ed;
            }
          .kitchen-header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #ea580c;
              padding-bottom: 15px;
            }
          .kitchen-header h2 {
              margin: 5px 0;
              color: #ea580c;
            font-size: 1.8em;
            font-weight: 800;
            }
          .kitchen-meta {
              margin-bottom: 20px;
            font-size: 1.1em;
            color: #333;
            text-align: center;
            }
          .kitchen-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
          .kitchen-table th,
          .kitchen-table td {
            padding: 12px 8px;
              text-align: left;
            border-bottom: 1px solid #ddd;
            font-size: 1.1em;
            }
          .kitchen-table th {
            background: #ea580c;
            color: white;
              font-weight: bold;
            }
          .kitchen-footer {
              text-align: center;
            color: #ea580c;
            font-weight: 700;
            font-size: 1.2em;
              margin-top: 20px;
            padding: 10px;
            background: #fff;
            border-radius: 5px;
            border: 2px solid #ea580c;
            }
            @media print {
              body { margin: 0; padding: 10px; }
            .kitchen-order { border: none; }
            }
          </style>
        </head>
        <body>
        <div class="kitchen-order">
          <div class="kitchen-header">
            <h2>KITCHEN ORDER</h2>
            <div style="font-size: 1.2em; color: #ea580c; font-weight: 700;">Tea वृक्ष</div>
            </div>
          <div class="kitchen-meta">
            <div><b>Table:</b> ${order.table}</div>
            <div><b>Time:</b> ${order.date}</div>
            <div style="color: #ea580c; font-weight: 700; margin-top: 5px;">PENDING ORDER</div>
            </div>
          <table class="kitchen-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                <th>Notes</th>
                </tr>
              </thead>
              <tbody>
              ${order.items.map(item => `
                  <tr>
                  <td style="font-weight: 700;">${item.name}</td>
                  <td style="font-weight: 700; font-size: 1.2em; color: #ea580c;">${item.qty}</td>
                  <td></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          <div class="kitchen-footer">
            Please prepare this order for Table ${order.table}
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 100);
            };
          </script>
        </body>
        </html>
      `;
      
    printWindow.document.write(kitchenOrderHTML);
      printWindow.document.close();
    };



  // Filter products based on selected category
  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const renderPOS = () => (
    <div className="pos-main">
      {/* Product Section */}
      <div className="products-section">
        {/* Category Filter */}
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Products Grid */}
        <div className="products-grid">
          {(() => {
            // Group products by category
            const groupedProducts = {};
            filteredProducts.forEach(product => {
              if (!groupedProducts[product.category]) {
                groupedProducts[product.category] = [];
              }
              groupedProducts[product.category].push(product);
            });

            // Sort products by type and then alphabetically within each category
            Object.keys(groupedProducts).forEach(category => {
              groupedProducts[category].sort((a, b) => {
                // Extract the main product type (e.g., "Momo", "Fried Rice", "Chiya")
                const getProductType = (name) => {
                  if (name.toLowerCase().includes('momo')) return 'momo';
                  if (name.toLowerCase().includes('fried rice')) return 'fried rice';
                  if (name.toLowerCase().includes('chiya')) return 'chiya';
                  if (name.toLowerCase().includes('milkshake')) return 'milkshake';
                  if (name.toLowerCase().includes('sausage')) return 'sausage';
                  if (name.toLowerCase().includes('fries') || name.toLowerCase().includes('wedges')) return 'fries';
                  if (name.toLowerCase().includes('samosa') || name.toLowerCase().includes('pakauda') || name.toLowerCase().includes('puff')) return 'snacks';
                  if (name.toLowerCase().includes('chatpate') || name.toLowerCase().includes('wai wai')) return 'chatpate';
                  if (name.toLowerCase().includes('lassi') || name.toLowerCase().includes('mohi')) return 'lassi';
                  if (name.toLowerCase().includes('coke') || name.toLowerCase().includes('sprite') || name.toLowerCase().includes('iced tea')) return 'drinks';
                  return 'other';
                };
                
                const typeA = getProductType(a.name);
                const typeB = getProductType(b.name);
                
                // Define type order
                const typeOrder = ['momo', 'fried rice', 'chiya', 'milkshake', 'sausage', 'fries', 'snacks', 'chatpate', 'lassi', 'drinks', 'other'];
                const orderA = typeOrder.indexOf(typeA);
                const orderB = typeOrder.indexOf(typeB);
                
                // First sort by type order
                if (orderA !== orderB) {
                  return orderA - orderB;
                }
                
                // Custom sorting within each type
                if (typeA === 'momo') {
                  // Momo order: Vegetable, Chicken, Buff
                  const momoOrder = ['vegetable', 'chicken', 'buff'];
                  const momoA = momoOrder.find(type => a.name.toLowerCase().includes(type)) || 'other';
                  const momoB = momoOrder.find(type => b.name.toLowerCase().includes(type)) || 'other';
                  const momoOrderA = momoOrder.indexOf(momoA);
                  const momoOrderB = momoOrder.indexOf(momoB);
                  if (momoOrderA !== momoOrderB) {
                    return momoOrderA - momoOrderB;
                  }
                } else if (typeA === 'chiya') {
                  // Chiya order: Milk, Matka, Black, Green, Lemon, Hot Lemon
                  const chiyaOrder = ['milk', 'matka', 'black', 'green', 'lemon', 'hot lemon'];
                  const chiyaA = chiyaOrder.find(type => a.name.toLowerCase().includes(type)) || 'other';
                  const chiyaB = chiyaOrder.find(type => b.name.toLowerCase().includes(type)) || 'other';
                  const chiyaOrderA = chiyaOrder.indexOf(chiyaA);
                  const chiyaOrderB = chiyaOrder.indexOf(chiyaB);
                  if (chiyaOrderA !== chiyaOrderB) {
                    return chiyaOrderA - chiyaOrderB;
                  }
                } else if (typeA === 'milkshake' || typeA === 'lassi' || typeA === 'drinks' || typeA === 'snacks' || typeA === 'chatpate') {
                  // Sort by price (low to high) for Chiso and Snacks categories
                  return a.price - b.price;
                }
                
                // Then sort alphabetically within the same type
                return a.name.localeCompare(b.name);
              });
            });

            // Flatten the grouped products to maintain grid layout with specific category order
            const sortedProducts = [];
            const categoryOrder = ['Chiya', 'Chiso', 'Snacks', 'Food'];
            
            categoryOrder.forEach(category => {
              if (groupedProducts[category]) {
                sortedProducts.push(...groupedProducts[category]);
              }
            });
            
            // Add any remaining categories that weren't in the predefined order
            Object.keys(groupedProducts).forEach(category => {
              if (!categoryOrder.includes(category)) {
                sortedProducts.push(...groupedProducts[category]);
              }
            });

            // Apply category-specific sorting
            if (selectedCategory === 'Chiso' || selectedCategory === 'Snacks') {
              // Sort by price (low to high) for Chiso and Snacks categories
              sortedProducts.sort((a, b) => a.price - b.price);
            }

            return sortedProducts.map((product) => (
              <div key={product.id} className="product-card" onClick={() => addToCart(product)}>
                <div className="product-img">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.querySelector('.img-placeholder').style.display = 'flex'; }}
                      style={{ display: 'block' }}
                    />
                  ) : null}
                  <div className="img-placeholder" style={{
                    display: product.image ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    minHeight: '120px',
                    background: '#f3f4f6',
                    color: '#cbd5e1',
                    fontSize: '2.5rem',
                    borderRadius: '12px',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}>
                    🫖
                  </div>
                </div>
                <div className="product-details">
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-price">Rs. {product.price.toFixed(2)}</div>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
      
      {/* Cart Section */}
      <div className="cart-section">
        <div className="cart-header">
          <h2>Take-out Order</h2>
        </div>
        
        <div className="cart-customer-section">
          <div className="customer-selector">
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const customerId = e.target.value;
                const customer = customers.find(c => c.id == customerId);
                console.log('Customer selected:', customer);
                setSelectedCustomer(customer || null);
              }}
            >
              <option value="">Select Customer (Optional)</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </option>
              ))}
            </select>
            <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
              {customers.length} customers available
            </div>
            <button
              className="add-customer-btn-small"
              onClick={() => {
                setEditingCustomer(null);
                setShowCustomerForm(true);
              }}
              title="Add New Customer"
            >
              ➕
            </button>
          </div>
          {selectedCustomer && (
            <div className="selected-customer">
              <span>👤 {selectedCustomer.name} ({selectedCustomer.phone})</span>
              <button
                className="clear-customer-btn"
                onClick={() => setSelectedCustomer(null)}
                title="Clear Customer"
              >
                ×
              </button>
            </div>
          )}
        </div>
        

        
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>No items added</p>
            </div>
          ) : (
            cart.map((item) => {
              const itemPrice = getItemPrice(item);
              const originalPrice = item.price;
              const manualDiscount = lineItemDiscounts[item.id];
              const hasDiscount = manualDiscount !== undefined;
              
              console.log('Cart item debug:', {
                itemId: item.id,
                itemName: item.name,
                originalPrice,
                itemPrice,
                manualDiscount,
                hasDiscount,
                lineItemDiscounts
              });
              
              return (
                <div key={item.id} className="cart-item">
                  <div className="item-details">
                    <span className="item-name">{item.name}</span>
                    <div className="item-pricing">
                      {hasDiscount ? (
                        <div>
                          <div style={{textDecoration: 'line-through', color: '#6b7280', fontSize: '0.9em'}}>
                            Rs. {originalPrice.toFixed(2)}
                          </div>
                          <div style={{color: '#059669', fontWeight: 'bold'}}>
                            Rs. {itemPrice.toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span className="item-price">Rs. {itemPrice.toFixed(2)}</span>
                      )}
                      <span className="item-total">Rs. {(itemPrice * item.qty).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="item-controls">
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                    <span className="qty">{item.qty}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}>×</button>
                    <button 
                      className="discount-btn" 
                      onClick={() => setShowItemDiscount(item.id)}
                      title="Apply manual discount"
                    >
                      💰
                    </button>
                  </div>
                  {manualDiscount && (
                    <div className="manual-discount-info">
                      Manual: {manualDiscount.type === 'percentage' ? `${manualDiscount.value}%` : `Rs. ${manualDiscount.value}`} off
                      <button 
                        className="remove-discount-btn"
                        onClick={() => removeLineItemDiscount(item.id)}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {/* Order Notes Section */}
        <div className="order-notes-section">
          <label htmlFor="order-notes">📝 Order Notes (Special Requests)</label>
          <textarea
            id="order-notes"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="e.g., Less sugar, Extra hot, No ice, Special instructions..."
            rows="3"
            className="order-notes-input"
          />
        </div>
        
        <div className="cart-footer">
          <div className="total">
            <span>Total</span>
            <span className="total-amount">Rs. {calculateTotal().toFixed(2)}</span>
          </div>
          <div className="cart-action-buttons">
            <button 
              className="checkout-btn" 
              disabled={cart.length === 0}
              onClick={openCheckout}
            >
              💳 Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderManageMenu = () => {
    // Filter products based on selected category
    const filteredProducts = menuSelectedCategory === 'All'
      ? products
      : products.filter(product => product.category === menuSelectedCategory);

    return (
      <div className="manage-menu">
        <div className="manage-header">
          <h2>Menu Management</h2>
          <div style={{display:'flex',gap:'1rem'}}>
            <button 
              className="add-product-btn"
              onClick={() => setShowAddForm(true)}
            >
              + Add Product
            </button>
            {currentUser?.role === 'admin' && (
              <button 
                className="clear-btn" 
                onClick={handleClearAllProducts} 
                style={{backgroundColor: '#dc2626', color: 'white'}}
              >
                Clear All Products
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs" style={{ marginBottom: '20px' }}>
          {['All', 'Chiya', 'Chiso', 'Snacks', 'Food', 'Cigarettes'].map(category => (
            <button
              key={category}
              className={`category-btn ${menuSelectedCategory === category ? 'active' : ''}`}
              onClick={() => setMenuSelectedCategory(category)}
              style={{
                padding: '8px 16px',
                margin: '0 4px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                backgroundColor: menuSelectedCategory === category ? '#3b82f6' : '#f8fafc',
                color: menuSelectedCategory === category ? 'white' : '#374151',
                border: menuSelectedCategory === category ? 'none' : '1px solid #e5e7eb'
              }}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="products-table-card">
          <div className="products-table-header">
            <div className="products-table-col product-col">PRODUCT</div>
            <div className="products-table-col desc-col">DESCRIPTION</div>
            <div className="products-table-col price-col">PRICE</div>
            <div className="products-table-col actions-col">ACTIONS</div>
          </div>
          <div className="products-table-body">
            {filteredProducts
              .sort((a, b) => a.price - b.price) // Sort by price (low to high)
              .map((product) => (
            <div key={product.id} className="products-table-row">
              <div className="products-table-col product-col">
                <div className="product-list-img"><img src={product.image} alt={product.name} /></div>
                <div>
                  <div className="product-list-name">{product.name}</div>
                  <div className="product-list-category">{product.category}</div>
                </div>
              </div>
              <div className="products-table-col desc-col">{product.description || <span style={{color:'#cbd5e1'}}>—</span>}</div>
              <div className="products-table-col price-col">Rs. {product.price.toFixed(2)}</div>
              <div className="products-table-col actions-col">
                <button className="edit-btn" onClick={() => setEditingProduct(product)} title="Edit">✏️</button>
                <button className="delete-btn" onClick={() => deleteProduct(product.id)} title="Delete">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New Product</h3>
            <ProductForm 
              onSubmit={addProduct}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Product Form */}
      {editingProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Product</h3>
            <ProductForm 
              product={editingProduct}
              onSubmit={updateProduct}
              onCancel={() => setEditingProduct(null)}
            />
          </div>
        </div>
      )}
    </div>
    );
  };

  const renderDineIn = () => (
    <div className="dine-in-container">
      <div className="dine-in-header">
        <h2>🍽️ Dine-in Table Management</h2>
        <div className="table-config">
          <button 
            className="config-btn"
            onClick={() => {
              const newTotal = prompt('Enter number of tables:', tableConfig.totalTables);
              if (newTotal && !isNaN(newTotal)) {
                const total = parseInt(newTotal);
                setTableConfig({
                  totalTables: total,
                  tableNames: Array.from({length: total}, (_, i) => `Table ${i + 1}`)
                });
              }
            }}
          >
            ⚙️ Configure Tables
          </button>
          <button 
            className="config-btn"
            onClick={() => {
              console.log('Auto-authenticating user...');
              sessionStorage.setItem('authToken', 'YWRtaW46YWRtaW4=');
              setIsAuthenticated(true);
              setCurrentUser({ username: 'admin', role: 'admin' });
              alert('User authenticated! Try clicking on tables now.');
            }}
            style={{marginLeft: '10px', backgroundColor: '#10b981'}}
          >
            🔐 Auto Login
          </button>
                      <button 
              className="config-btn"
              onClick={async () => {
                console.log('🧹 Clearing all table orders...');
                setTableOrders({});
                setBackyardTableOrders({});
                try {
                  await fetch(`${API_URL}/pending-table-orders`, {
                    method: 'DELETE',
                    headers: getAuthHeaders(),
                  });
                  console.log('✅ All table orders cleared');
                  alert('All table orders cleared!');
                } catch (error) {
                  console.error('❌ Error clearing table orders:', error);
                }
              }}
              style={{marginLeft: '10px', backgroundColor: '#dc2626'}}
            >
              🧹 Clear All
            </button>

        </div>
      </div>
      
      {/* Dine-in Tabs */}
      <div className="dine-in-tabs">
        <button 
          className={`dine-in-tab ${dineInActiveTab === 'indoor' ? 'active' : ''}`}
          onClick={() => setDineInActiveTab('indoor')}
        >
          🏠 Indoor
        </button>
        <button 
          className={`dine-in-tab ${dineInActiveTab === 'outdoor' ? 'active' : ''}`}
          onClick={() => setDineInActiveTab('outdoor')}
        >
          🌿 Outdoor
        </button>
      </div>
      
      <div className="floor-plan">
        {/* Indoor Layout Section */}
        {dineInActiveTab === 'indoor' && (
          <div className="layout-section indoor-section">
            <h3 className="layout-title">🏠 Indoor</h3>
            <div className="tables-grid">
              {Array.from({ length: tableConfig.totalTables }, (_, index) => {
                const tableId = index + 1;
                const tableName = tableConfig.tableNames[index];
                const tableStatus = getTableStatus(tableId);
                const statusColor = getTableStatusColor(tableStatus);
                const statusText = getTableStatusText(tableStatus);
                
                return (
                  <div
                    key={tableId}
                    className="table-card"
                    style={{
                      backgroundColor: statusColor,
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      minHeight: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <div 
                      onClick={() => openTableOrder(tableId)}
                      style={{
                        cursor: 'pointer',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                        {tableName}
                      </div>
                      <div style={{ fontSize: '14px', opacity: 0.8 }}>
                        {statusText}
                      </div>
                      {tableOrders[tableId] && (
                        <div style={{ 
                          fontSize: '12px', 
                          marginTop: '8px',
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          Rs. {tableOrders[tableId].total}
                        </div>
                      )}
                    </div>
                    
                    {/* Checkout Button */}
                    {tableOrders[tableId] && tableOrders[tableId].items && tableOrders[tableId].items.length > 0 && (
                      <button
                        className="table-checkout-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          checkoutTable(tableId);
                        }}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: '#059669',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '2px 6px',
                          fontSize: '8px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                          zIndex: 3,
                          minWidth: '24px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        💳
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Backyard Layout Section */}
        {dineInActiveTab === 'outdoor' && (
          <div className="layout-section backyard-section">
            <h3 className="layout-title">🌿 Backyard</h3>
            <div className="tables-grid">
              {Array.from({ length: backyardTableConfig.totalTables }, (_, index) => {
                const tableId = index + 1;
                const tableName = backyardTableConfig.tableNames[index];
                const tableStatus = getBackyardTableStatus(tableId);
                const statusColor = getBackyardTableStatusColor(tableStatus);
                const statusText = getTableStatusText(tableStatus);
                
                return (
                  <div
                    key={`backyard-${tableId}`}
                    className="table-card"
                    style={{
                      backgroundColor: statusColor,
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      minHeight: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <div 
                      onClick={() => openBackyardTableOrder(tableId)}
                      style={{
                        cursor: 'pointer',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                        {tableName}
                      </div>
                      <div style={{ fontSize: '14px', opacity: 0.8 }}>
                        {statusText}
                      </div>
                      {backyardTableOrders[tableId] && (
                        <div style={{ 
                          fontSize: '12px', 
                          marginTop: '8px',
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          Rs. {backyardTableOrders[tableId].total}
                        </div>
                      )}
                    </div>
                    
                    {/* Checkout Button */}
                    {backyardTableOrders[tableId] && backyardTableOrders[tableId].items && backyardTableOrders[tableId].items.length > 0 && (
                      <button
                        className="table-checkout-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          checkoutBackyardTable(tableId);
                        }}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: '#059669',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '2px 6px',
                          fontSize: '8px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                          zIndex: 3,
                          minWidth: '24px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        💳
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Table Order Modal */}
      {showTableOrder && selectedTable && (
        <TableOrderModal
          tableId={selectedTable}
          tableName={tableConfig.tableNames[selectedTable - 1]}
          products={products}
          currentOrder={tableOrders[selectedTable] || { items: [], total: 0, status: 'pending' }}
          onClose={() => {
            console.log('🔒 Closing table order modal for table:', selectedTable);
            setShowTableOrder(false);
            setSelectedTable(null);
          }}
          onSendToKitchen={(tableId, newItems) => sendToKitchen(tableId, newItems)}
          onUpdateOrder={async (items, discountInfo = {}) => {
            const actualTableId = selectedTable;
            const tableName = tableConfig.tableNames[actualTableId - 1];
            const { lineItemDiscounts = {}, total: calculatedTotal, customerName = '', customerId = null } = discountInfo;
            
            console.log('🔄 onUpdateOrder called with:', { items, discountInfo, tableName, actualTableId });
            
            // Update local state
            setTableOrders(prev => ({
              ...prev,
              [actualTableId]: {
                items,
                total: calculatedTotal,
                status: 'pending',
                lineItemDiscounts
              }
            }));
            
            // Save to backend
            try {
              await saveTableOrder(actualTableId, items, customerId);
              console.log('✅ Order saved successfully for table:', actualTableId, 'with customer:', customerId);
              // Close the modal after successful save
              setShowTableOrder(false);
              setSelectedTable(null);
            } catch (error) {
              console.error('❌ Error saving order:', error);
            }
          }}
          customers={customers}
          onCustomerAdded={addCustomer}
          getAuthHeaders={getAuthHeaders}
        />
      )}
      
      {/* Backyard Table Order Modal */}
      {showBackyardTableOrder && selectedBackyardTable && (
        <TableOrderModal
          tableId={selectedBackyardTable}
          tableName={backyardTableConfig.tableNames[selectedBackyardTable - 1]}
          products={products}
          currentOrder={backyardTableOrders[selectedBackyardTable] || { items: [], total: 0, status: 'pending' }}
          onClose={() => {
            setShowBackyardTableOrder(false);
            setSelectedBackyardTable(null);
          }}
          onSendToKitchen={(tableId, newItems) => sendBackyardToKitchen(tableId, newItems)}
          onUpdateOrder={async (items, discountInfo = {}) => {
            const { lineItemDiscounts = {}, total: calculatedTotal, customerName = '', customerId = null } = discountInfo;
            
            // Update local state
            setBackyardTableOrders(prev => ({
              ...prev,
              [selectedBackyardTable]: {
                items,
                total: calculatedTotal,
                status: 'pending',
                lineItemDiscounts
              }
            }));
            
            // Save to backend
            try {
              await saveBackyardTableOrder(selectedBackyardTable, items, customerId);
              console.log('✅ Backyard order saved successfully for table:', selectedBackyardTable, 'with customer:', customerId);
              // Close the modal after successful save
              setShowBackyardTableOrder(false);
              setSelectedBackyardTable(null);
            } catch (error) {
              console.error('❌ Error saving backyard order:', error);
            }
          }}
          customers={customers}
          onCustomerAdded={addCustomer}
          getAuthHeaders={getAuthHeaders}
        />
      )}
    </div>
  );

  // SALES HISTORY TAB
  const renderSalesHistory = () => {
    const filteredOrders = orders.filter(order =>
      order.table.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(orderSearch.toLowerCase()))
    );
    const totalRevenue = orders.reduce((sum, o) => sum + (o.finalTotal || o.total), 0);
  return (
      <div className="sales-history">
        <div className="sales-header">
          <h2>Sales History</h2>
          <div style={{display:'flex',gap:'1rem'}}>
            {currentUser?.role === 'admin' && (
              <button className="export-btn">Export CSV</button>
            )}
            {currentUser?.role === 'admin' && (
              <button className="reset-btn" onClick={handleResetSales}>Reset Sales</button>
            )}
            {currentUser?.role === 'admin' && (
              <button className="clear-btn" onClick={handleClearAllOrders} style={{backgroundColor: '#dc2626', color: 'white'}}>Clear All Orders</button>
            )}
          </div>
        </div>
        <div className="sales-meta">
          <div>Total Orders: {orders.length}</div>
          <div>Total Revenue: Rs. {totalRevenue.toFixed(2)}</div>
        </div>
        <input
          className="order-search"
          type="text"
          placeholder="Search by table number or product..."
          value={orderSearch}
          onChange={e => setOrderSearch(e.target.value)}
        />
        <div className="orders-table-card">
          <div className="orders-table-header">
            <div className="orders-table-col details-col">ORDER DETAILS</div>
            <div className="orders-table-col table-col">TABLE</div>
            <div className="orders-table-col items-col">ITEMS</div>
            <div className="orders-table-col total-col">TOTAL</div>
            <div className="orders-table-col payment-col">PAYMENT</div>
            <div className="orders-table-col actions-col">ACTIONS</div>
          </div>
          <div className="orders-table-body">
            {filteredOrders.map(order => (
              <div key={order.id} className="orders-table-row">
                <div className="orders-table-col details-col">
                  <div className="order-date">{order.date}</div>
                  <div style={{fontSize: '0.85em', color: '#666', marginTop: '2px'}}>{convertToNepaliBS(order.date).nepaliNumeric}</div>
                  <div className="order-id">#{order.id}</div>
                </div>
                <div className="orders-table-col table-col">
                  <span className="table-pill">{order.table}</span>
                </div>
                <div className="orders-table-col items-col">
                  {order.items.length} items
                </div>
                <div className="orders-table-col total-col">
                  <div>Rs. {(order.finalTotal || order.total).toFixed(2)}</div>
                  {order.discountAmount > 0 && (
                    <div style={{fontSize: '0.8em', color: '#059669', marginTop: '2px'}}>
                      -Rs. {order.discountAmount.toFixed(2)} discount
                    </div>
                  )}
                </div>
                <div className="orders-table-col payment-col">
                  <span className="payment-pill">{order.payment}</span>
                </div>
                <div className="orders-table-col actions-col">
                  <button className="icon-btn view-btn" title="View" onClick={() => setViewOrder(order)}>👁️</button>
                  {currentUser?.role === 'admin' && (
                    <>
                      <button 
                        className="icon-btn refund-btn" 
                        title="Refund" 
                        onClick={() => {
                          console.log('=== SALES HISTORY REFUND DEBUG ===');
                          console.log('Order structure:', order);
                          console.log('Order keys:', Object.keys(order));
                          console.log('Order items:', order.items);
                          console.log('Order items type:', typeof order.items);
                          console.log('Order items length:', order.items?.length);
                          console.log('First item:', order.items?.[0]);
                          console.log('First item keys:', order.items?.[0] ? Object.keys(order.items[0]) : 'No item');
                          
                          if (order.items && order.items.length > 0 && order.items[0]) {
                            // Get the item with quantity from the order
                            const orderItem = order.items[0];
                            console.log('Order item before processing:', orderItem);
                            
                            // Create a complete item object with all required properties
                            const refundItemData = {
                              ...orderItem,
                              qty: orderItem.qty || orderItem.quantity || 1 // Try different property names
                            };
                            console.log('Refund item data after processing:', refundItemData);
                            console.log('Refund item has qty:', 'qty' in refundItemData);
                            console.log('Refund item qty value:', refundItemData.qty);
                            
                            setRefundItem({order, item: refundItemData});
                          } else {
                            alert('No items found in this order to refund.');
                          }
                        }}
                      >
                        ↩️
                      </button>

                    </>
                  )}
      </div>
              </div>
            ))}
          </div>
        </div>
        {/* Order Details Modal */}
        {viewOrder && (
          <OrderDetailsModal 
            order={viewOrder} 
            onClose={() => setViewOrder(null)} 
            onRefund={item => {
              console.log('OrderDetailsModal onRefund called with item:', item);
              setRefundItem({order: viewOrder, item});
            }}
            onEdit={() => { 
              if (viewOrder && viewOrder.id) {
                setEditingOrder(viewOrder); // always pass the full order object
              } else {
                alert('Cannot edit this order: missing order ID.');
              }
            }}
            userRole={currentUser?.role}
          />
        )}
        {/* Edit Order Modal */}
        {editingOrder && (
          <EditOrderModal 
            order={editingOrder} 
            products={products}
            onSave={saveEditedOrder}
            onCancel={() => setEditingOrder(null)}
          />
        )}
        {/* Refund Modal */}
        {refundItem && (
          <RefundModal 
            refundItem={refundItem} 
            onClose={() => setRefundItem(null)} 
            onRefund={handleRefund} 
          />
        )}

        {/* Refund History Section */}
        {currentUser?.role === 'admin' && (
          <div className="refund-history-section" style={{marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
              <h3 style={{margin: 0, color: '#333'}}>🔄 Refund History</h3>
              <div style={{display: 'flex', gap: '0.5rem'}}>
                <button 
                  className="btn-secondary"
                  onClick={() => setShowRefundHistory(!showRefundHistory)}
                  style={{padding: '0.5rem 1rem', fontSize: '0.875rem'}}
                >
                  {showRefundHistory ? 'Hide' : 'Show'} Refund History
                </button>
                {showRefundHistory && (
                  <button 
                    className="btn-secondary"
                    onClick={loadRefunds}
                    style={{padding: '0.5rem 1rem', fontSize: '0.875rem'}}
                  >
                    🔄 Refresh
                  </button>
                )}
              </div>
            </div>
            
            {showRefundHistory && (
              <div>
                {refundsLoading ? (
                  <div style={{textAlign: 'center', padding: '2rem', color: '#666'}}>Loading refunds...</div>
                ) : refunds.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '2rem', color: '#666'}}>No refunds found</div>
                ) : (
                  <div className="refunds-table" style={{backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden'}}>
                    <div className="refunds-table-header" style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', padding: '1rem', backgroundColor: '#f1f3f4', fontWeight: '600', fontSize: '0.875rem'}}>
                      <div>Date</div>
                      <div>Order ID</div>
                      <div>Item</div>
                      <div>Quantity</div>
                      <div>Amount</div>
                      <div>Reason</div>
                    </div>
                    <div className="refunds-table-body">
                      {refunds.map(refund => (
                        <div key={refund.id} className="refund-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', padding: '1rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem'}}>
                          <div>{new Date(refund.refundDate).toLocaleDateString()}</div>
                          <div>#{refund.orderId}</div>
                          <div>{refund.itemName}</div>
                          <div>{refund.refundQuantity}/{refund.originalQuantity}</div>
                          <div style={{color: '#dc2626', fontWeight: '600'}}>Rs. {refund.refundAmount.toFixed(2)}</div>
                          <div style={{color: '#666', fontSize: '0.8rem'}}>{refund.refundReason || 'N/A'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // CUSTOMERS TAB
  const renderCustomers = () => {
    return (
      <div className="customers">
        <div className="customers-header">
          <h2>👥 Customer Management</h2>
          <div className="customer-actions">
            <button 
              className="add-customer-btn"
              onClick={() => {
                setEditingCustomer(null);
                setShowCustomerForm(true);
              }}
            >
              ➕ Add Customer
            </button>
            <button 
              className="reset-visits-btn"
              onClick={handleResetCustomerVisits}
              title="Reset all customer visit counters"
            >
              🔄 Reset Visits
            </button>
          </div>
        </div>
        <div className="customers-meta">
          <div>Total Customers: {customers.length}</div>
        </div>
        {customersLoading ? (
          <div className="loading">Loading customers...</div>
        ) : customersError ? (
          <div className="error">Error: {customersError}</div>
        ) : (
          <div className="customers-grid">
            {customers.map(customer => (
              <div key={customer.id} className="customer-card">
                <div className="customer-info">
                  <div className="customer-name">{customer.name}</div>
                  <div className="customer-phone">{customer.phone}</div>
                  <div className="customer-date">Added: {new Date(customer.created_at).toLocaleDateString()}</div>
                  <div className="customer-visits">
                    Visits: {customer.visits || 0}/10
                    {customer.free_item_eligible ? (
                      <span className="free-item-badge">🎉 Free item available!</span>
                    ) : null}
                  </div>
                </div>
                <div className="customer-actions">
                  {customer.free_item_eligible && (
                    <button 
                      className="redeem-free-item-btn"
                      onClick={() => {
                        if (window.confirm(`${customer.name} is eligible for a free item! Redeem it now?`)) {
                          redeemFreeItem(customer.id);
                        }
                      }}
                      title="Redeem Free Item"
                    >
                      🎁 Redeem Free Item
                    </button>
                  )}
                  <button 
                    className="edit-customer-btn"
                    onClick={() => {
                      setEditingCustomer(customer);
                      setShowCustomerForm(true);
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="delete-customer-btn"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
                        deleteCustomer(customer.id);
                      }
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {showCustomerForm && (
          <CustomerForm 
            customer={editingCustomer}
            onSubmit={editingCustomer ? updateCustomer : addCustomer}
            onCancel={() => {
              setShowCustomerForm(false);
              setEditingCustomer(null);
            }}
          />
        )}
      </div>
    );
  };

  const renderDashboard = () => {
    // Helper function to get dynamic labels based on date range
    const getPeriodLabel = (baseLabel) => {
      switch (selectedDateRange) {
        case 'today':
          return baseLabel;
        case 'week':
          return baseLabel.replace('Today', 'This Week');
        case 'month':
          return baseLabel.replace('Today', 'This Month');
        default:
          return baseLabel;
      }
    };

    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>📈 Business Dashboard</h2>
          <div className="date-range-selector">
            <select 
              value={selectedDateRange} 
              onChange={(e) => setSelectedDateRange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <div className="metric-value">Rs. {dashboardData.todaySales.toFixed(2)}</div>
              <div className="metric-label">{getPeriodLabel("Today's Sales")}</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">📋</div>
            <div className="metric-content">
              <div className="metric-value">{dashboardData.todayOrders}</div>
              <div className="metric-label">{getPeriodLabel("Orders Today")}</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <div className="metric-value">Rs. {dashboardData.averageOrderValue.toFixed(2)}</div>
              <div className="metric-label">Average Order Value</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">🍽️</div>
            <div className="metric-content">
              <div className="metric-value">{dashboardData.tableStatus.occupied}</div>
              <div className="metric-label">Tables Occupied</div>
            </div>
          </div>
          
          {currentUser?.role === 'admin' && (
            <>
              <div className="metric-card">
                <div className="metric-icon">🔄</div>
                <div className="metric-content">
                  <div className="metric-value">{dashboardData.refundStats?.totalRefunds || 0}</div>
                  <div className="metric-label">{getPeriodLabel("Refunds")}</div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">💸</div>
                <div className="metric-content">
                  <div className="metric-value" style={{color: '#dc2626'}}>Rs. {dashboardData.refundStats?.totalRefundAmount?.toFixed(2) || '0.00'}</div>
                  <div className="metric-label">{getPeriodLabel("Refund Amount")}</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Table Management Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3>🪑 Table Management</h3>
            <button 
              className="table-management-btn"
              onClick={() => setShowTableManagement(!showTableManagement)}
            >
              {showTableManagement ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          
          <div className="table-status-overview">
            <div className="status-card available">
              <div className="status-count">{dashboardData.tableStatus.available}</div>
              <div className="status-label">Available</div>
            </div>
            <div className="status-card occupied">
              <div className="status-count">{dashboardData.tableStatus.occupied}</div>
              <div className="status-label">Occupied</div>
            </div>
            <div className="status-card reserved">
              <div className="status-count">{dashboardData.tableStatus.reserved}</div>
              <div className="status-label">Reserved</div>
            </div>
          </div>

          {showTableManagement && (
            <div className="table-management-details">
              <div className="table-grid">
                {/* Indoor Tables */}
                {tableConfig.tableNames.map((tableName, index) => {
                  const tableId = index + 1;
                  const tableOrder = tableOrders[tableId];
                  const status = tableOrder && tableOrder.items && tableOrder.items.length > 0 ? 'occupied' : 'free';
                  
                  return (
                    <div 
                      key={`indoor-${tableId}`} 
                      className={`table-card ${status}`}
                      onClick={() => openTableOrder(tableId)}
                    >
                      <div className="table-content">
                        <div className="table-number">{tableName}</div>
                        <div className={`table-status ${status}`}>
                          {getTableStatusText(status)}
                        </div>
                        {tableOrder && tableOrder.items && tableOrder.items.length > 0 && (
                          <div className="table-items-count">
                            {tableOrder.items.length} items
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Backyard Tables */}
                {backyardTableConfig.tableNames.map((tableName, index) => {
                  const tableId = index + 1;
                  const tableOrder = backyardTableOrders[tableId];
                  const status = tableOrder && tableOrder.items && tableOrder.items.length > 0 ? 'occupied' : 'free';
                  
                  return (
                    <div 
                      key={`backyard-${tableId}`} 
                      className={`table-card ${status}`}
                      onClick={() => openBackyardTableOrder(tableId)}
                    >
                      <div className="table-content">
                        <div className="table-number">{tableName}</div>
                        <div className={`table-status ${status}`}>
                          {getTableStatusText(status)}
                        </div>
                        {tableOrder && tableOrder.items && tableOrder.items.length > 0 && (
                          <div className="table-items-count">
                            {tableOrder.items.length} items
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="dashboard-section">
          <h3>🔥 {getPeriodLabel("Top Products Today")}</h3>
          <div className="top-products-list">
            {dashboardData.topProducts.length > 0 ? (
              dashboardData.topProducts.map((product, index) => (
                <div key={product.name} className="top-product-item">
                  <div className="product-rank">#{index + 1}</div>
                  <div className="product-name">{product.name}</div>
                  <div className="product-sales">{product.qty} sold</div>
                </div>
              ))
            ) : (
              <div className="no-data">No sales data available for {selectedDateRange === 'today' ? 'today' : selectedDateRange === 'week' ? 'this week' : 'this month'}</div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="dashboard-section">
          <h3>📝 Recent Orders</h3>
          <div className="recent-orders-list">
            {dashboardData.recentOrders.length > 0 ? (
              dashboardData.recentOrders.slice(0, 5).map(order => (
                <div key={order.id} className="recent-order-item">
                  <div className="order-info">
                    <div className="order-id">Order #{order.id}</div>
                    <div className="order-table">{order.table}</div>
                    <div className="order-time">{order.date}</div>
                  </div>
                  <div className="order-amount">Rs. {order.total}</div>
                </div>
              ))
            ) : (
              <div className="no-data">No recent orders</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Update order in orders array
  const saveEditedOrder = async (updatedOrder) => {
    try {
      console.log('Saving edited order, id:', updatedOrder.id);
      let itemsArray = updatedOrder.items;
      if (typeof itemsArray === 'string') {
        try { itemsArray = JSON.parse(itemsArray); } catch { itemsArray = []; }
      }
      const plainItems = itemsArray.map(({ id, name, price, qty, image }) => ({
        id, name, price, qty, image
      }));
      await updateOrder(updatedOrder.id, plainItems, updatedOrder.total);
      // Always fetch latest orders from backend after edit
      const freshOrders = await fetch(`${API_URL}/orders`, { headers: getAuthHeaders() }).then(res => res.json());
      setOrders(freshOrders);
      setEditingOrder(null);
      setViewOrder(null);
    } catch (error) {
      console.error('Error saving edited order:', error);
      alert('Error saving order. Please try again.');
    }
  };

  // Load refunds
  const loadRefunds = async () => {
    try {
      setRefundsLoading(true);
      const response = await fetch(`${API_URL}/refunds`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to load refunds');
      }

      const refundsData = await response.json();
      setRefunds(refundsData);
    } catch (error) {
      console.error('Error loading refunds:', error);
    } finally {
      setRefundsLoading(false);
    }
  };

  const handleRefund = async (refundItem) => {
    try {
      const { order, item, refundAmount, refundReason } = refundItem;
      
      // Create refund record
      const refundData = {
        orderId: order.id,
        itemName: item.name,
        itemPrice: item.price,
        originalQuantity: item.qty,
        refundQuantity: refundAmount,
        refundReason: refundReason || 'Customer request'
      };

      console.log('Processing refund:', refundData);
      
      // Send refund data to backend
      const response = await fetch(`${API_URL}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(refundData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process refund');
      }

      const result = await response.json();
      
      // Show success message
      alert(`Refund processed successfully!\nItem: ${item.name}\nAmount: Rs. ${(item.price * refundAmount).toFixed(2)}\nRefund ID: ${result.refundId}`);
      
      // Refresh dashboard data to update refund statistics
      loadDashboardData();
      
      setRefundItem(null);
    } catch (error) {
      console.error('Error processing refund:', error);
      alert(`Error processing refund: ${error.message}`);
    }
  };





  // Remove the full-page edit order view - we'll use the modal instead

  // Error boundary
  if (hasError) {
    return (
      <div className="error-screen">
        <div className="error-container">
          <h1>🍃 Tea वृक्ष POS Error</h1>
          <p>Something went wrong. Please refresh the page.</p>
          <p className="error-details">{errorMessage}</p>
          <button 
            onClick={() => {
              setHasError(false);
              setErrorMessage('');
              window.location.reload();
            }}
            className="retry-btn"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`App ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''} ${isLandscape ? 'landscape' : ''}`}>
      {!isAuthenticated ? (
        <LoginScreen onLogin={handleLogin} error={loginError} />
      ) : (
        <div className={`pos-layout ${isMobile ? 'mobile-layout' : ''} ${isTablet ? 'tablet-layout' : ''}`}>
          {/* Simple Header */}
          <div className="pos-header">
            <div className="header-left">
              <div className="header-logo">
                <img src="/logo.png" alt="Tea वृक्ष Logo" className="logo-icon" />
                <div className="brand-text">
                  <h1>Tea <span className="nepali-text">वृक्ष</span></h1>
                </div>
              </div>
            </div>
            <div className="header-right">
              <div className="date-time">
                <div className="nepali-date">{convertToNepaliBS(now).nepaliNumeric}</div>
                <span className="time">{toNepaliTime(now)}</span>
              </div>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>

          {/* Simple Navigation */}
          <div className="nav-bar">
            {isMobile && (
              <div className="mobile-nav-toggle">
                <button 
                  className="mobile-menu-btn"
                  onClick={() => setActiveTab(activeTab === 'mobile-menu' ? 'Take-out' : 'mobile-menu')}
                >
                  {activeTab === 'mobile-menu' ? '✕' : '☰'}
                </button>
              </div>
            )}
            <div className={`main-tabs ${isMobile && activeTab === 'mobile-menu' ? 'mobile-menu-open' : ''}`}>
            <button 
                className={`tab-btn ${activeTab === 'Dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('Dashboard')}
            >
                📈 Dashboard
            </button>
            <button 
                className={`tab-btn ${activeTab === 'Take-out' ? 'active' : ''}`}
                onClick={() => setActiveTab('Take-out')}
            >
                📦 Take-out
            </button>
            <button 
                className={`tab-btn ${activeTab === 'Dine-in' ? 'active' : ''}`}
                onClick={() => setActiveTab('Dine-in')}
            >
                🍽️ Dine-in
            </button>
              <button 
                className={`tab-btn ${activeTab === 'Menu Management' ? 'active' : ''}`}
                onClick={() => setActiveTab('Menu Management')}
              >
                📋 Menu Management
              </button>
              <button 
                className={`tab-btn ${activeTab === 'Sales History' ? 'active' : ''}`}
                onClick={() => setActiveTab('Sales History')}
              >
                📊 Sales History
              </button>
              <button 
                className={`tab-btn ${activeTab === 'Customers' ? 'active' : ''}`}
                onClick={() => setActiveTab('Customers')}
              >
                👥 Customers
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="content-area">
            <div className="main-content">
              {activeTab === 'Take-out' && renderPOS()}
              {activeTab === 'Dine-in' && renderDineIn()}
              {activeTab === 'Dashboard' && renderDashboard()}
              {activeTab === 'Menu Management' && currentUser?.role === 'admin' && renderManageMenu()}
              {activeTab === 'Sales History' && renderSalesHistory()}
              {activeTab === 'Customers' && renderCustomers()}
            </div>
          </div>

          {/* Modals */}
          {showAddForm && (
            <ProductForm 
              onSubmit={addProduct} 
              onCancel={() => setShowAddForm(false)} 
            />
          )}
          {editingProduct && (
            <ProductForm 
              product={editingProduct} 
              onSubmit={updateProduct} 
              onCancel={() => setEditingProduct(null)} 
            />
          )}
          {viewOrder && (
            <OrderDetailsModal 
              order={viewOrder} 
              onClose={() => setViewOrder(null)}
              onRefund={(item) => {
                console.log('POS OrderDetailsModal onRefund called with item:', item);
                setRefundItem({order: viewOrder, item});
              }}
              onEdit={(order) => setEditingOrder(order)}
              userRole={currentUser?.role}
            />
          )}
          {refundItem && (
            <RefundModal 
              refundItem={refundItem}
              onClose={() => setRefundItem(null)}
              onRefund={handleRefund}
            />
          )}
          {showCheckout && (
            <CheckoutModal 
              total={calculateTotal()}
              checkoutPayment={checkoutPayment}
              setCheckoutPayment={setCheckoutPayment}
              checkoutCash={checkoutCash}
              setCheckoutCash={setCheckoutCash}
              checkoutError={checkoutError}
              closeCheckout={closeCheckout}
              handleCheckoutComplete={handleCheckoutComplete}
              cart={cart}
              checkoutTableInfo={checkoutTableInfo}
              lineItemDiscounts={lineItemDiscounts}
              selectedCustomer={selectedCustomer}
              getAuthHeaders={getAuthHeaders}
            />
          )}
          {showItemDiscount && (
            <LineItemDiscountModal
              item={cart.find(item => item.id === showItemDiscount)}
              onApply={(type, value) => {
                applyLineItemDiscount(showItemDiscount, type, value);
                setShowItemDiscount(null);
              }}
              onCancel={() => setShowItemDiscount(null)}
            />
          )}
          {editingOrder && (
            <EditOrderModal 
              order={editingOrder} 
              products={products}
              onSave={saveEditedOrder}
              onCancel={() => setEditingOrder(null)}
            />
          )}

          {/* Customer Form Modal */}
          {showCustomerForm && (
            <CustomerForm 
              customer={editingCustomer}
              onSubmit={editingCustomer ? updateCustomer : addCustomer}
              onCancel={() => {
                setShowCustomerForm(false);
                setEditingCustomer(null);
              }}
            />
          )}



        </div>
      )}
    </div>
  );
}

// Login Component
function LoginScreen({ onLogin, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="login-screen">
      <div className="login-container modern-login-card">
        <div className="login-header">
          <div className="login-logo">
            <img src="/logo.png" alt="Tea वृक्ष Logo" className="logo-icon" />
          </div>
          <div className="brand-en">Tea</div>
          <div className="brand-nepali">वृक्ष</div>
          <div className="login-subtitle">Sign in to your account</div>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error modern-login-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter username"
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="show-password-btn"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          <button type="submit" className="login-btn modern-login-btn">
            Login
          </button>
        </form>
        <div className="login-help modern-login-help">
          <p><strong>Contact administrator for login credentials</strong></p>
        </div>
      </div>
    </div>
  );
}

// Product Form Component
function ProductForm({ product, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price || '',
    category: product?.category || 'Coffee',
    image: product?.image || '',
    description: product?.description || ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image || '');
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setFormData(prev => ({ ...prev, image: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(product ? { ...product, ...formData } : formData);
    } catch (err) {
      setError(err.message || 'Failed to add product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <div className="form-group">
        <label>Product Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
          placeholder="Enter product name"
        />
      </div>
      <div className="form-group">
        <label>Price *</label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({...formData, price: e.target.value})}
          required
          min="0"
          step="0.01"
          placeholder="0.00"
        />
      </div>
      <div className="form-group">
        <label>Category *</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
          required
        >
          <option value="Chiya">Chiya</option>
          <option value="Chiso">Chiso</option>
          <option value="Snacks">Snacks</option>
          <option value="Food">Food</option>
          <option value="Cigarettes">Cigarettes</option>
        </select>
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Enter product description (optional)"
          rows={2}
          style={{resize:'vertical'}}
        />
      </div>
      <div className="form-group">
        <label>Product Image</label>
        <div 
          className={`image-upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {imagePreview ? (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
              <button 
                type="button" 
                className="remove-image"
                onClick={() => {
                  setImagePreview('');
                  setImageFile(null);
                  setFormData(prev => ({ ...prev, image: '' }));
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <div className="upload-placeholder">
              <div className="upload-icon">📷</div>
              <p>Drag & drop an image here or click to browse</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="file-input"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="browse-btn">
                Browse Files
              </label>
            </div>
          )}
        </div>
        <p className="upload-hint">Supports JPG, PNG, GIF up to 5MB</p>
      </div>
      {error && <div style={{color:'#ef4444',marginBottom:8}}>{error}</div>}
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="cancel-btn" disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="save-btn" disabled={submitting}>
          {submitting ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
        </button>
      </div>
    </form>
  );
}

// Customer Form Component
function CustomerForm({ customer, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(customer ? { ...customer, ...formData } : formData);
    } catch (err) {
      setError(err.message || 'Failed to save customer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{customer ? 'Edit Customer' : 'Add New Customer'}</h3>
        <form onSubmit={handleSubmit} className="customer-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Customer Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              placeholder="Enter customer name"
            />
          </div>
          
          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
              placeholder="Enter phone number"
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={submitting}>
              {submitting ? 'Saving...' : (customer ? 'Update Customer' : 'Add Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Order Details Modal
function OrderDetailsModal({ order, onClose, onRefund, onEdit, userRole }) {
  // Print receipt for this order
  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    const change = order.payment === 'Cash' && order.cashReceived ? (parseFloat(order.cashReceived) - (order.finalTotal || order.total)) : 0;
    
    // Calculate subtotal from items
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    // Get discount and tip info
    const discountAmount = order.discountAmount || 0;
    const discountType = order.discountType || 'none';
    const promoCode = order.promoCode || null;
    const tipAmount = order.tipAmount || 0;
    const tipType = order.tipType || 'none';
    const finalTotal = order.finalTotal || order.total;
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - Tea वृक्ष</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; color: black; }
          .receipt-print { max-width: 300px; margin: 0 auto; border: 1px solid #e5e5e5; padding: 20px; border-radius: 8px; background: #ffffff; }
          .receipt-header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #e5e5e5; padding-bottom: 15px; }
          .receipt-logo { width: 60px; height: 60px; object-fit: contain; margin-bottom: 10px; }
          .receipt-header h2 { margin: 5px 0; color: #1a1a1a; font-size: 1.5em; font-weight: 500; }
          .receipt-subtitle { color: #666666; font-size: 0.9em; }
          .receipt-meta { margin-bottom: 20px; font-size: 0.9em; color: #666666; }
          .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .receipt-table th, .receipt-table td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e5e5; }
          .receipt-table th { background: #fafafa; font-weight: 500; color: #1a1a1a; }
          .receipt-table td { color: #666666; }
          .receipt-subtotal { text-align: right; font-size: 1em; margin-bottom: 10px; color: #666666; }
          .receipt-discount { text-align: right; font-size: 1em; color: #059669; margin-bottom: 5px; }
          .receipt-tip { text-align: right; font-size: 1em; color: #ea580c; margin-bottom: 5px; }
          .receipt-total { text-align: right; font-size: 1.1em; font-weight: 600; margin-bottom: 20px; padding-top: 10px; border-top: 1px solid #e5e5e5; color: #1a1a1a; }
          .receipt-footer { text-align: center; color: #666666; font-style: italic; margin-top: 20px; }
          @media print { body { margin: 0; padding: 10px; } .receipt-print { border: none; } }
        </style>
      </head>
      <body>
        <div class="receipt-print">
          <div class="receipt-header">
            <img src="/logo.png" alt="Tea वृक्ष Logo" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 10px;" />
            <h2>Tea वृक्ष</h2>
            <div class="receipt-subtitle">Premium Tea & Coffee</div>
          </div>
          <div class="receipt-meta">
            <div>${order.date}</div>
            <div style="font-size: 0.9em; color: #666; margin-top: 2px;">${convertToNepaliBS(order.date).nepaliNumeric}</div>
            <div><b>Table:</b> ${order.table || 'Takeaway'}</div>
            <div><b>Order ID:</b> #${order.id}</div>
          </div>
          <table class="receipt-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.qty}</td>
                  <td>Rs. ${item.price.toFixed(2)}</td>
                  <td>Rs. ${(item.price * item.qty).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="receipt-subtotal">
            <b>Subtotal: Rs. ${subtotal.toFixed(2)}</b>
          </div>
          ${discountAmount > 0 ? `
            <div class="receipt-discount">
              ${discountType === 'promo' ? `Promo Code (${promoCode}):` : discountType === 'percentage' ? 'Discount:' : 'Discount:'} -Rs. ${discountAmount.toFixed(2)}
            </div>
          ` : ''}
          ${tipAmount > 0 ? `
            <div class="receipt-tip">
              ${tipType === 'percentage' ? 'Tip:' : 'Tip:'} +Rs. ${tipAmount.toFixed(2)}
            </div>
          ` : ''}
          <div class="receipt-total">
            <b>Total: Rs. ${finalTotal.toFixed(2)}</b>
          </div>
          ${(order.payment === 'Cash' && order.cashReceived && change > 0) ? `
            <div style="text-align: right; margin-bottom: 15px; color: #059669; font-weight: 600;">
              <div>Cash Received: Rs. ${parseFloat(order.cashReceived).toFixed(2)}</div>
              <div style="font-size: 1.1em; font-weight: 700; margin-top: 5px;">Change: Rs. ${change.toFixed(2)}</div>
            </div>
          ` : ''}
          <div class="receipt-footer">Thank you for your visit!</div>
        </div>
        <script>window.onload = function() { window.print(); }<\/script>
      </body>
      </html>
    `;
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Order Details - {order.table}</h3>
        <div className="order-details-meta">
          <div><b>Order ID:</b> #{order.id}</div>
          <div><b>Date:</b> {order.date}</div>
          <div style={{fontSize: '0.9em', color: '#666', marginTop: '2px'}}>{convertToNepaliBS(order.date).nepaliNumeric}</div>
          <div><b>Payment Method:</b> {order.payment.toLowerCase()}</div>
          <div><b>Status:</b> <span className="status-pill in-stock">{order.status}</span></div>
        </div>
        <div className="order-details-items">
          <div className="order-details-header">
            <div>Items</div>
            <div style={{textAlign:'right'}}>Subtotal</div>
          </div>
          {order.items.map(item => (
            <div className="order-details-row" key={item.name}>
              <div>{item.name}<span style={{marginLeft:8, color:'#64748b'}}>Rs. {item.price.toFixed(2)} × {item.qty}</span></div>
              <div style={{textAlign:'right'}}>
                Rs. {(item.price * item.qty).toFixed(2)} 
                {userRole === 'admin' && (
                  <button 
                    className="icon-btn refund-btn" 
                    title="Refund" 
                    onClick={() => {
                      console.log('OrderDetailsModal - Refunding item:', item);
                      if (item && item.name && item.price) {
                        // Ensure the item has quantity information
                        const refundItemData = {
                          ...item,
                          qty: item.qty || 1 // Ensure qty exists, default to 1
                        };
                        console.log('OrderDetailsModal - Complete refund item:', refundItemData);
                        onRefund(refundItemData);
                      } else {
                        alert('Cannot refund this item: invalid item data.');
                      }
                    }}
                  >
                    ↩️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="order-details-total">
          <b>Total:</b> Rs. {(order.finalTotal || order.total).toFixed(2)}
          {order.discountAmount > 0 && (
            <div style={{fontSize: '0.9em', color: '#059669', marginTop: '5px'}}>
              -Rs. {order.discountAmount.toFixed(2)} discount applied
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Close</button>
          <button className="save-btn" onClick={handlePrintReceipt}>Print Receipt</button>
          {userRole === 'admin' && (
            <button className="save-btn" onClick={() => onEdit(order)}>Edit Order</button>
          )}
        </div>
      </div>
    </div>
  );
}

// Edit Order Modal
function EditOrderModal({ order, products, onSave, onCancel }) {
  const [items, setItems] = React.useState(order.items || []);
  const isTakeaway = order.service_type === 'Takeaway';
  const orderTitle = isTakeaway ? 'Takeaway' : (order.table || order.table_number ? `Table ${order.table || order.table_number}` : 'Order');

  // Add product to order
  const addProduct = (product) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === product.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].qty = (updated[idx].qty || 0) + 1;
        return updated;
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  // Remove product from order
  const removeProduct = (name) => {
    setItems((prev) => prev.filter((i) => i.name !== name));
  };

  // Change quantity
  const changeQty = (name, delta) => {
    setItems((prev) => prev.map((i) => i.name === name ? { ...i, qty: Math.max(1, (i.qty || 1) + delta) } : i));
  };

  // Print receipt
  const handlePrintReceipt = () => {
    const receiptWindow = window.open('', '_blank', 'width=400,height=600');
    
    // Calculate totals
    const subtotal = items.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 0), 0);
    const discountAmount = order.discountAmount || 0;
    const discountType = order.discountType || 'none';
    const promoCode = order.promoCode || null;
    const finalTotal = order.finalTotal || subtotal;
    
    const receiptHTML = `
      <html><head><title>Receipt</title>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #fff; color: #222; margin: 0; padding: 0; }
        .receipt-container { max-width: 320px; margin: 0 auto; padding: 1.5rem; }
        .receipt-header { text-align: center; font-weight: 700; font-size: 1.2rem; margin-bottom: 1rem; }
        .receipt-meta { font-size: 0.9rem; color: #666; margin-bottom: 1rem; }
        .receipt-items { margin-bottom: 1rem; }
        .receipt-item { display: flex; justify-content: space-between; font-size: 0.95rem; margin-bottom: 0.25rem; }
        .receipt-subtotal { font-size: 0.95rem; margin-bottom: 0.5rem; text-align: right; }
        .receipt-discount { font-size: 0.95rem; color: #059669; margin-bottom: 0.25rem; text-align: right; }
        .receipt-tip { font-size: 0.95rem; color: #ea580c; margin-bottom: 0.25rem; text-align: right; }
        .receipt-total { font-weight: 700; font-size: 1.1rem; border-top: 1px solid #eee; padding-top: 0.5rem; margin-top: 0.5rem; text-align: right; }
        .receipt-footer { text-align: center; font-size: 0.85rem; color: #888; margin-top: 1.5rem; }
      </style>
      </head><body>
        <div class="receipt-container">
          <div class="receipt-header">Tea वृक्ष POS</div>
          <div class="receipt-meta">
            <div><b>Order:</b> ${orderTitle}</div>
            <div><b>Order ID:</b> #${order.id}</div>
            <div><b>Date:</b> ${order.date || new Date().toLocaleString()}</div>
            <div><b>Type:</b> ${isTakeaway ? 'Takeaway' : 'Dine-in'}</div>
          </div>
          <div class="receipt-items">
            ${items.map(item => `<div class="receipt-item"><span>${item.name} × ${item.qty}</span><span>Rs. ${(item.price * item.qty).toFixed(2)}</span></div>`).join('')}
          </div>
          <div class="receipt-subtotal"><b>Subtotal: Rs. ${subtotal.toFixed(2)}</b></div>
          ${discountAmount > 0 ? `<div class="receipt-discount">${discountType === 'promo' ? `Promo Code (${promoCode}):` : 'Discount:'} -Rs. ${discountAmount.toFixed(2)}</div>` : ''}
          <div class="receipt-total">Total: Rs. ${finalTotal.toFixed(2)}</div>
          <div class="receipt-footer">Thank you for your order!</div>
        </div>
        <script>window.onload = function() { setTimeout(function() { window.print(); window.onafterprint = function() { window.close(); }; }, 100); };</script>
      </body></html>
    `;
    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
  };

  // Get new items (not in original order)
  const getNewItems = () => {
    if (!order.items) return [];
    return items.filter((item) => {
      const orig = order.items.find((i) => i.id === item.id);
      return !orig || item.qty > orig.qty;
    }).map(item => {
      const originalItem = order.items.find(orig => orig.id === item.id);
      if (!originalItem) {
        // Return the full item for new items
        return item;
      }
      // Return only the difference in quantity for existing items
      const qtyDifference = item.qty - originalItem.qty;
      return { ...item, qty: qtyDifference };
    }).filter(item => item.qty > 0); // Only items with positive quantity
  };

  // Save changes
  const handleSave = () => {
    try {
      const total = items ? items.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 0), 0) : 0;
      onSave({ ...order, items, total });
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Error saving order. Please try again.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal edit-order-modal-large">
        <h3>Edit Order - {orderTitle}</h3>
        <div className="edit-order-flex">
          {/* Product Grid */}
          <div className="edit-order-product-grid">
            {products && products.length > 0 ? (() => {
              // Group products by category
              const groupedProducts = {};
              products.forEach(product => {
                if (!groupedProducts[product.category]) {
                  groupedProducts[product.category] = [];
                }
                groupedProducts[product.category].push(product);
              });

              // Sort products by type and then alphabetically within each category
              Object.keys(groupedProducts).forEach(category => {
                groupedProducts[category].sort((a, b) => {
                  // Extract the main product type (e.g., "Momo", "Fried Rice", "Chiya")
                  const getProductType = (name) => {
                    if (name.toLowerCase().includes('momo')) return 'momo';
                    if (name.toLowerCase().includes('fried rice')) return 'fried rice';
                    if (name.toLowerCase().includes('chiya')) return 'chiya';
                    if (name.toLowerCase().includes('milkshake')) return 'milkshake';
                    if (name.toLowerCase().includes('sausage')) return 'sausage';
                    if (name.toLowerCase().includes('fries') || name.toLowerCase().includes('wedges')) return 'fries';
                    if (name.toLowerCase().includes('samosa') || name.toLowerCase().includes('pakauda') || name.toLowerCase().includes('puff')) return 'snacks';
                    if (name.toLowerCase().includes('chatpate') || name.toLowerCase().includes('wai wai')) return 'chatpate';
                    if (name.toLowerCase().includes('lassi') || name.toLowerCase().includes('mohi')) return 'lassi';
                    if (name.toLowerCase().includes('coke') || name.toLowerCase().includes('sprite') || name.toLowerCase().includes('iced tea')) return 'drinks';
                    return 'other';
                  };
                  
                  const typeA = getProductType(a.name);
                  const typeB = getProductType(b.name);
                  
                  // Define type order
                  const typeOrder = ['momo', 'fried rice', 'chiya', 'milkshake', 'sausage', 'fries', 'snacks', 'chatpate', 'lassi', 'drinks', 'other'];
                  const orderA = typeOrder.indexOf(typeA);
                  const orderB = typeOrder.indexOf(typeB);
                  
                  // First sort by type order
                  if (orderA !== orderB) {
                    return orderA - orderB;
                  }
                  
                  // Custom sorting within each type
                  if (typeA === 'momo') {
                    // Momo order: Vegetable, Chicken, Buff
                    const momoOrder = ['vegetable', 'chicken', 'buff'];
                    const momoA = momoOrder.find(type => a.name.toLowerCase().includes(type)) || 'other';
                    const momoB = momoOrder.find(type => b.name.toLowerCase().includes(type)) || 'other';
                    const momoOrderA = momoOrder.indexOf(momoA);
                    const momoOrderB = momoOrder.indexOf(momoB);
                    if (momoOrderA !== momoOrderB) {
                      return momoOrderA - momoOrderB;
                    }
                  } else if (typeA === 'chiya') {
                    // Chiya order: Milk, Matka, Black, Green, Lemon, Hot Lemon
                    const chiyaOrder = ['milk', 'matka', 'black', 'green', 'lemon', 'hot lemon'];
                    const chiyaA = chiyaOrder.find(type => a.name.toLowerCase().includes(type)) || 'other';
                    const chiyaB = chiyaOrder.find(type => b.name.toLowerCase().includes(type)) || 'other';
                    const chiyaOrderA = chiyaOrder.indexOf(chiyaA);
                    const chiyaOrderB = chiyaOrder.indexOf(chiyaB);
                    if (chiyaOrderA !== chiyaOrderB) {
                      return chiyaOrderA - chiyaOrderB;
                    }
                  } else if (typeA === 'milkshake' || typeA === 'lassi' || typeA === 'drinks' || typeA === 'snacks' || typeA === 'chatpate') {
                    // Sort by price (low to high) for Chiso and Snacks categories
                    return a.price - b.price;
                  }
                  
                  // Then sort alphabetically within the same type
                  return a.name.localeCompare(b.name);
                });
              });

              // Flatten the grouped products to maintain grid layout with specific category order
              const sortedProducts = [];
              const categoryOrder = ['Chiya', 'Chiso', 'Snacks', 'Food'];
              
              categoryOrder.forEach(category => {
                if (groupedProducts[category]) {
                  sortedProducts.push(...groupedProducts[category]);
                }
              });
              
                             // Add any remaining categories that weren't in the predefined order
               Object.keys(groupedProducts).forEach(category => {
                 if (!categoryOrder.includes(category)) {
                   sortedProducts.push(...groupedProducts[category]);
                 }
               });

               // Apply category-specific sorting
               if (selectedCategory === 'Chiso' || selectedCategory === 'Snacks') {
                 // Sort by price (low to high) for Chiso and Snacks categories
                 sortedProducts.sort((a, b) => a.price - b.price);
               }

               return sortedProducts.map(product => (
                              <div key={product.id} className="edit-order-product-tile" onClick={() => addProduct(product)}>
                  <div className="edit-order-product-img"><img src={product.image} alt={product.name} /></div>
                  <div className="edit-order-product-info">
                    <div className="edit-order-product-name">{product.name}</div>
                    <div className="edit-order-product-price">Rs. {product.price.toFixed(2)}</div>
                  </div>
                </div>
              ));
            })() : (
              <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                No products available
              </div>
            )}
          </div>
          {/* Cart/Order Summary */}
          <div className="edit-order-cart">
            <div className="edit-order-cart-title">
              Order Items {isTakeaway ? '(Takeaway)' : ''}
            </div>
            {items && items.length === 0 ? (
              <div className="edit-order-cart-empty">No items in order</div>
            ) : (
              <div className="edit-order-cart-list">
                {items && items.map(item => (
                  <div key={item.name || item.id} className="edit-order-cart-row">
                    <div className="edit-order-cart-img">
                      <img src={item.image || '/placeholder.png'} alt={item.name} onError={e => e.target.style.display = 'none'} />
                    </div>
                    <div className="edit-order-cart-info">
                      <div className="edit-order-cart-name">{item.name}</div>
                      <div className="edit-order-cart-price">Rs. {item.price?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div className="edit-order-cart-qty-controls">
                      <button onClick={() => changeQty(item.name, -1)}>-</button>
                      <span>{item.qty || 0}</span>
                      <button onClick={() => changeQty(item.name, 1)}>+</button>
                    </div>
                    <button onClick={() => removeProduct(item.name)} className="remove-item">×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="edit-order-cart-total">
              <b>Total:</b> Rs. {items ? items.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 0), 0).toFixed(2) : '0.00'}
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={onCancel}>Cancel</button>
              <button className="print-btn" onClick={handlePrintReceipt}>Print Receipt</button>
              {/*
              {getNewItems().length > 0 && (
                <button className="kitchen-btn" onClick={() => {
                  const newItems = getNewItems();
                  const orderType = isTakeaway ? 'Takeaway' : `Table ${order.table || order.table_number}`;
                  
                  // Create a kitchen order for the new items
                  const kitchenOrder = {
                    table: isTakeaway ? 'Takeaway' : (order.table || order.table_number),
                    items: newItems,
                    date: new Date().toISOString(),
                    status: 'Pending',
                    orderType: isTakeaway ? 'Takeaway' : 'Dine-in'
                  };
                  
                  // Print kitchen order
                  const printWindow = window.open('', '_blank', 'width=400,height=600');
                  const kitchenHTML = `
                    <html><head><title>Kitchen Order</title>
                    <style>
                      body { font-family: 'Inter', Arial, sans-serif; background: #fff; color: #222; margin: 0; padding: 0; }
                      .kitchen-container { max-width: 320px; margin: 0 auto; padding: 1.5rem; }
                      .kitchen-header { text-align: center; font-weight: 700; font-size: 1.2rem; margin-bottom: 1rem; color: #ea580c; }
                      .kitchen-meta { font-size: 0.9rem; color: #666; margin-bottom: 1rem; }
                      .kitchen-items { margin-bottom: 1rem; }
                      .kitchen-item { display: flex; justify-content: space-between; font-size: 1.1rem; margin-bottom: 0.5rem; font-weight: 500; }
                      .kitchen-footer { text-align: center; font-size: 0.85rem; color: #888; margin-top: 1.5rem; font-weight: 600; }
                    </style>
                    </head><body>
                      <div class="kitchen-container">
                        <div class="kitchen-header">🍳 KITCHEN ORDER</div>
                        <div class="kitchen-meta">
                          <div><b>Order:</b> ${orderType}</div>
                          <div><b>Date:</b> ${kitchenOrder.date}</div>
                          <div><b>Type:</b> ${kitchenOrder.orderType}</div>
                          <div style="color: #ea580c; font-weight: 700; margin-top: 5px;">NEW ITEMS ADDED</div>
                        </div>
                        <div class="kitchen-items">
                          ${newItems.map(item => `<div class="kitchen-item"><span>${item.name} × ${item.qty}</span></div>`).join('')}
                        </div>
                        <div class="kitchen-footer">Please prepare these items!</div>
                      </div>
                      <script>window.onload = function() { setTimeout(function() { window.print(); window.onafterprint = function() { window.close(); }; }, 100); };</script>
                    </body></html>
                  `;
                  printWindow.document.write(kitchenHTML);
                  printWindow.document.close();
                }}>
                  🍳 Send to Kitchen ({getNewItems().length} new)
                </button>
              )}
              */}
              <button className="save-btn" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Refund Modal
function RefundModal({ refundItem, onClose, onRefund }) {
  const [qty, setQty] = useState(1);
  const [refundReason, setRefundReason] = useState('');
  
  // Debug logging
  console.log('RefundModal - refundItem:', refundItem);
  console.log('RefundModal - refundItem.item:', refundItem?.item);
  console.log('RefundModal - item properties:', refundItem?.item ? Object.keys(refundItem.item) : 'No item');
  
  // Safety check for refundItem and item
  if (!refundItem || !refundItem.item) {
    console.log('RefundModal - Safety check failed: refundItem or refundItem.item is null/undefined');
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h3>Refund Error</h3>
          <p>Invalid refund item. Please try again.</p>
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }
  
  // Check if item has qty property
  if (!refundItem.item.qty) {
    console.log('RefundModal - Item missing qty property:', refundItem.item);
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h3>Refund Error</h3>
          <p>Item is missing quantity information. Cannot process refund.</p>
          <div className="modal-actions">
            <button className="cancel-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }
  
  const maxQty = refundItem.item.qty;
  const refundAmount = refundItem.item.price * qty;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Refund Item</h3>
        <div className="refund-meta">
          <div><b>{refundItem.item.name}</b> <span style={{color:'#666666'}}>Original quantity: {refundItem.item.qty} × Rs. {refundItem.item.price.toFixed(2)}</span></div>
          <div>Total: Rs. {(refundItem.item.price * refundItem.item.qty).toFixed(2)}</div>
        </div>
        <div className="form-group">
          <label>Quantity to Refund *</label>
          <input type="number" min={1} max={maxQty} value={qty} onChange={e => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value))))} />
          <div style={{fontSize:'0.875rem',color:'#666666'}}>Maximum: {maxQty}</div>
        </div>
        <div className="form-group">
          <label>Refund Amount</label>
          <div className="refund-amount">Rs. {refundAmount.toFixed(2)}</div>
        </div>
        <div className="form-group">
          <label>Reason for Refund (Optional)</label>
          <textarea 
            placeholder="e.g., Customer didn't like the taste, wrong order, etc." 
            rows={2}
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button 
            className="refund-btn-red" 
            onClick={() => onRefund({
              order: refundItem.order,
              item: refundItem.item,
              refundAmount: qty,
              refundReason: refundReason
            })}
          >
            Process Refund
          </button>
        </div>
      </div>
    </div>
  );
}

// Receipt component for printing
const Receipt = React.forwardRef(({ cart, tableNumber, paymentMethod, cashReceived, discountInfo = {} }, ref) => {
  const now = new Date();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = discountInfo.discountAmount || 0;
  const discountType = discountInfo.discountType || 'none';
  const promoCode = discountInfo.promoCode || null;
  const finalTotal = discountInfo.finalTotal || subtotal;
  const change = paymentMethod === 'Cash' && cashReceived ? parseFloat(cashReceived) - finalTotal : 0;
  
  return (
    <div ref={ref} className="receipt-print">
      <div className="receipt-header">
        <img src="/logo.png" alt="Tea वृक्ष Logo" className="receipt-logo" />
        <h2>Tea वृक्ष</h2>
        <div className="receipt-subtitle">Premium Tea & Coffee</div>
      </div>
      <div className="receipt-meta">
        <div>{now.toLocaleString('en-GB', { hour12: false, timeZone: 'Asia/Kathmandu' })}</div>
        <div style={{fontSize: '0.9em', color: '#666', marginTop: '2px'}}>{convertToNepaliBS(now).nepaliNumeric}</div>
        <div><b>Table:</b> {tableNumber}</div>
      </div>
      <table className="receipt-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {cart.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.qty}</td>
              <td>Rs. {item.price.toFixed(2)}</td>
              <td>Rs. {(item.price * item.qty).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="receipt-subtotal"><b>Subtotal:</b> Rs. {subtotal.toFixed(2)}</div>
      {discountAmount > 0 && (
        <div className="receipt-discount">
          {discountType === 'promo' ? `Promo Code (${promoCode}):` : 'Discount:'} -Rs. {discountAmount.toFixed(2)}
        </div>
      )}

      <div className="receipt-total"><b>Total:</b> Rs. {finalTotal.toFixed(2)}</div>
      {paymentMethod === 'Cash' && cashReceived && change > 0 && (
        <div style={{textAlign: 'right', marginBottom: '15px', color: '#059669', fontWeight: 600}}>
          <div>Cash Received: Rs. {parseFloat(cashReceived).toFixed(2)}</div>
          <div style={{fontSize: '1.1em', fontWeight: 700, marginTop: '5px'}}>Change: Rs. {change.toFixed(2)}</div>
        </div>
      )}
      <div className="receipt-footer">Thank you for your visit!</div>
    </div>
  );
});

function CheckoutModal({ 
  total, 
  checkoutPayment, 
  setCheckoutPayment, 
  checkoutCash, 
  setCheckoutCash, 
  checkoutError, 
  closeCheckout, 
  handleCheckoutComplete,
  cart,
  checkoutTableInfo,
  lineItemDiscounts,
  selectedCustomer,
  getAuthHeaders
}) {
  const [discountType, setDiscountType] = useState('none'); // 'none', 'percentage', 'flat', 'promo'
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountValue, setDiscountValue] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [finalTotal, setFinalTotal] = useState(total);

  // Calculate line item discount total
  const lineItemDiscountTotal = cart.reduce((sum, item) => {
    const manualDiscount = lineItemDiscounts[item.id];
    if (manualDiscount) {
      if (manualDiscount.type === 'percentage') {
        return sum + (item.price * item.qty * manualDiscount.value / 100);
      } else if (manualDiscount.type === 'flat') {
        return sum + (manualDiscount.value * item.qty);
      }
    }
    return sum;
  }, 0);

  // Calculate automatic discount total
  const autoDiscountTotal = cart.reduce((sum, item) => {
    if (item.discountAmount) {
      return sum + item.discountAmount;
    }
    return sum;
  }, 0);

  // Calculate subtotal (original prices)
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // Calculate final total whenever discount changes
  useEffect(() => {
    let calculatedDiscount = 0;
    
    if (discountType === 'percentage' && discountValue) {
      calculatedDiscount = (subtotal * parseFloat(discountValue)) / 100;
    } else if (discountType === 'flat' && discountValue) {
      calculatedDiscount = parseFloat(discountValue);
    } else if (discountType === 'promo' && discountAmount) {
      // For promo codes, use the discountAmount directly (already calculated by backend)
      calculatedDiscount = discountAmount;
    }
    
    // Ensure discount doesn't exceed subtotal
    calculatedDiscount = Math.min(calculatedDiscount, subtotal);
    
    // Only update discountAmount if it's not a promo code (to avoid overwriting backend calculation)
    if (discountType !== 'promo') {
      setDiscountAmount(calculatedDiscount);
    }
    
    // Calculate final total
    const newFinalTotal = Math.max(0, total - calculatedDiscount);
    setFinalTotal(newFinalTotal);
  }, [discountType, discountValue, subtotal, total, discountAmount]);



  // Validate promo code
  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/promo/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          code: promoCode.trim(),
          orderTotal: subtotal
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPromoSuccess(`Promo code applied! ${data.promo.discountType === 'percentage' ? `${data.promo.discountValue}% off` : `Rs. ${data.promo.discountValue} off`}`);
        setPromoError('');
        setDiscountType('promo');
        setDiscountAmount(data.promo.discountAmount);
      } else {
        setPromoError(data.error);
        setPromoSuccess('');
        setDiscountType('none');
        setDiscountAmount(0);
        setFinalTotal(total);
      }
    } catch (error) {
      setPromoError('Error validating promo code. Please try again.');
      setPromoSuccess('');
    }
  };

  // Clear promo code
  const clearPromoCode = () => {
    setPromoCode('');
    setPromoError('');
    setPromoSuccess('');
    setDiscountType('none');
    setDiscountAmount(0);
    setFinalTotal(total);
  };

  // Handle manual discount input
  const handleDiscountChange = (value) => {
    setDiscountValue(value);
    if (discountType === 'percentage') {
      const percentage = parseFloat(value) || 0;
      const calculatedDiscount = (subtotal * percentage) / 100;
      setDiscountAmount(Math.min(calculatedDiscount, subtotal));
    } else if (discountType === 'flat') {
      const flatAmount = parseFloat(value) || 0;
      setDiscountAmount(Math.min(flatAmount, subtotal));
    }
  };



  // Update the checkout complete handler to include discount info
  const handleCompleteWithDiscount = () => {
    // Update the cart with discount information
    const orderWithDiscount = {
      discountAmount: discountAmount,
      discountType: discountType,
      promoCode: discountType === 'promo' ? promoCode : null,
      finalTotal: finalTotal,
      lineItemDiscounts: lineItemDiscounts
    };
    
    // Call the original handler with discount info
    handleCheckoutComplete(orderWithDiscount);
  };

  const printBill = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - Tea वृक्ष</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; color: black; }
          .bill-print { max-width: 300px; margin: 0 auto; border: 1px solid #e5e5e5; padding: 20px; border-radius: 8px; background: #ffffff; }
          .bill-header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #e5e5e5; padding-bottom: 15px; }
          .bill-logo { width: 60px; height: 60px; object-fit: contain; margin-bottom: 10px; }
          .bill-header h2 { margin: 5px 0; color: #1a1a1a; font-size: 1.5em; font-weight: 500; }
          .bill-subtitle { color: #666666; font-size: 0.9em; }
          .bill-meta { margin-bottom: 20px; font-size: 0.9em; color: #666666; }
          .bill-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .bill-table th, .bill-table td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e5e5; }
          .bill-table th { background: #fafafa; font-weight: 500; color: #1a1a1a; }
          .bill-table td { color: #666666; }
          .bill-total { text-align: right; font-size: 1.1em; font-weight: 600; margin-bottom: 20px; padding-top: 10px; border-top: 1px solid #e5e5e5; color: #1a1a1a; }
          .bill-discount { text-align: right; font-size: 1em; color: #059669; margin-bottom: 10px; }

          .bill-final-total { text-align: right; font-size: 1.2em; font-weight: 700; margin-bottom: 20px; color: #1a1a1a; }
          .bill-footer { text-align: center; color: #666666; font-style: italic; margin-top: 20px; padding: 10px; background: #fafafa; border-radius: 5px; }
          @media print { body { margin: 0; padding: 10px; } .bill-print { border: none; } }
        </style>
      </head>
      <body>
        <div class="bill-print">
          <div class="bill-header">
            <img src="/logo.png" alt="Tea वृक्ष Logo" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 10px;" />
            <h2>Tea वृक्ष</h2>
            <div class="bill-subtitle">Premium Tea & Coffee</div>
          </div>
          <div class="bill-meta">
            <div>${new Date().toLocaleString('en-GB', { hour12: false, timeZone: 'Asia/Kathmandu' })}</div>
            <div style="font-size: 0.9em; color: #666; margin-top: 2px;">${convertToNepaliBS(new Date()).nepaliNumeric}</div>
            <div><b>Service:</b> ${checkoutTableInfo ? 'Dine-in' : 'Take-out'}</div>
            ${checkoutTableInfo ? `<div><b>Table:</b> ${checkoutTableInfo.tableName}</div>` : ''}
            <div style="color: #ea580c; font-weight: 700; margin-top: 5px;">BILL</div>
          </div>
          <table class="bill-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${cart.map(item => {
                const originalPrice = item.price;
                const originalSubtotal = originalPrice * item.qty;
                
                return `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                    <td>Rs. ${originalPrice.toFixed(2)}</td>
                    <td>Rs. ${originalSubtotal.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="bill-total">
            <b>Subtotal: Rs. ${cart.reduce((sum, item) => sum + (item.price * item.qty), 0).toFixed(2)}</b>
          </div>
          ${(autoDiscountTotal + lineItemDiscountTotal) > 0 ? `
            <div class="bill-discount">
              Line Item Discounts: -Rs. ${(autoDiscountTotal + lineItemDiscountTotal).toFixed(2)}
            </div>
          ` : ''}
          ${discountAmount > 0 ? `
            <div class="bill-discount">
              ${discountType === 'promo' ? `Promo Code (${promoCode}):` : discountType === 'percentage' ? `Discount (${discountValue}%):` : 'Discount:'} -Rs. ${discountAmount.toFixed(2)}
            </div>
          ` : ''}
          <div class="bill-final-total">
            <b>Total: Rs. ${finalTotal.toFixed(2)}</b>
          </div>
          <div class="bill-footer">Please pay at the counter when ready.</div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }, 100);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(billHTML);
    printWindow.document.close();
  };

  return (
    <div className="modal-overlay">
      <div className="modal checkout-modal">
        <button onClick={printBill} className="print-bill-btn">
          🖨️ Print Bill
        </button>
        <h3>Checkout</h3>
        
        {/* Line Item Discounts Summary */}
        {(autoDiscountTotal + lineItemDiscountTotal) > 0 && (
          <div className="line-item-discounts-summary">
            <h4 style={{fontWeight: 600, marginBottom: '0.5rem', color: '#1a1a1a'}}>Line Item Discounts</h4>
            {autoDiscountTotal > 0 && (
              <div className="discount-line">
                <span>Automatic Discounts:</span>
                <span>-Rs. {autoDiscountTotal.toFixed(2)}</span>
              </div>
            )}
            {lineItemDiscountTotal > 0 && (
              <div className="discount-line">
                <span>Manual Discounts:</span>
                <span>-Rs. {lineItemDiscountTotal.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Discount Section */}
        <div className="discount-section">
          <h4 style={{fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a'}}>Order Discounts & Promos</h4>
          
          {/* Discount Type Selection */}
          <div className="form-group">
            <label>Discount Type</label>
            <div className="discount-type-options">
              <label className="discount-type-option">
                <input 
                  type="radio" 
                  name="discountType" 
                  value="none" 
                  checked={discountType === 'none'} 
                  onChange={() => {
                    setDiscountType('none');
                    setDiscountValue('');
                    setDiscountAmount(0);
                    setPromoCode('');
                    setPromoError('');
                    setPromoSuccess('');
                  }} 
                />
                No Discount
              </label>
              <label className="discount-type-option">
                <input 
                  type="radio" 
                  name="discountType" 
                  value="percentage" 
                  checked={discountType === 'percentage'} 
                  onChange={() => {
                    setDiscountType('percentage');
                    setDiscountValue('');
                    setDiscountAmount(0);
                    setPromoCode('');
                    setPromoError('');
                    setPromoSuccess('');
                  }} 
                />
                Percentage
              </label>
              <label className="discount-type-option">
                <input 
                  type="radio" 
                  name="discountType" 
                  value="flat" 
                  checked={discountType === 'flat'} 
                  onChange={() => {
                    setDiscountType('flat');
                    setDiscountValue('');
                    setDiscountAmount(0);
                    setPromoCode('');
                    setPromoError('');
                    setPromoSuccess('');
                  }} 
                />
                Flat Amount
              </label>
              <label className="discount-type-option">
                <input 
                  type="radio" 
                  name="discountType" 
                  value="promo" 
                  checked={discountType === 'promo'} 
                  onChange={() => {
                    setDiscountType('promo');
                    setDiscountValue('');
                    setDiscountAmount(0);
                    setPromoCode('');
                    setPromoError('');
                    setPromoSuccess('');
                  }} 
                />
                Promo Code
              </label>
            </div>
          </div>

          {/* Discount Input */}
          {(discountType === 'percentage' || discountType === 'flat') && (
            <div className="form-group">
              <label>
                {discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (Rs.)'}
              </label>
              <input
                type="number"
                min="0"
                max={discountType === 'percentage' ? "100" : subtotal}
                step={discountType === 'percentage' ? "1" : "0.01"}
                value={discountValue}
                onChange={(e) => handleDiscountChange(e.target.value)}
                placeholder={discountType === 'percentage' ? "Enter percentage" : "Enter amount"}
                className="discount-input"
              />
            </div>
          )}

          {/* Promo Code Input */}
          {discountType === 'promo' && (
            <div className="form-group">
              <label>Promo Code</label>
              <div className="promo-input-group">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="promo-input"
                />
                <button 
                  onClick={validatePromoCode}
                  className="validate-promo-btn"
                  disabled={!promoCode.trim()}
                >
                  Apply
                </button>
                {promoCode && (
                  <button 
                    onClick={clearPromoCode}
                    className="clear-promo-btn"
                  >
                    Clear
                  </button>
                )}
              </div>
              {promoError && <div className="promo-error">{promoError}</div>}
              {promoSuccess && <div className="promo-success">{promoSuccess}</div>}
            </div>
          )}
        </div>



        {/* Totals Section */}
        <div className="totals-section">
          <div className="checkout-subtotal">
            <span>Subtotal:</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>
          {(autoDiscountTotal + lineItemDiscountTotal) > 0 && (
            <div className="checkout-discount">
              <span>Line Item Discounts:</span>
              <span>-Rs. {(autoDiscountTotal + lineItemDiscountTotal).toFixed(2)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="checkout-discount">
              <span>
                {discountType === 'promo' ? `Promo Code (${promoCode}):` : 
                 discountType === 'percentage' ? `Discount (${discountValue}%):` : 'Discount:'}
              </span>
              <span>-Rs. {discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="checkout-final-total">
            <span>Final Total:</span>
            <span>Rs. {finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Section */}
        <div className="payment-section">
          <h4 style={{fontWeight: 600, marginBottom: '1rem', color: '#1a1a1a'}}>Payment</h4>
          
          {checkoutPayment === 'Cash' && checkoutCash && parseFloat(checkoutCash) > finalTotal && (
            <div className="checkout-change">
              <span>Change:</span>
              <span>Rs. {(parseFloat(checkoutCash) - finalTotal).toFixed(2)}</span>
            </div>
          )}
          
          <div className="form-group">
            <label>Payment Method</label>
            <div className="checkout-payment-options">
              <label className="checkout-payment-option">
                <input type="radio" name="payment" value="Cash" checked={checkoutPayment==='Cash'} onChange={()=>setCheckoutPayment('Cash')} />
                💰 Cash
              </label>
              <label className="checkout-payment-option">
                <input type="radio" name="payment" value="Mobile Payment" checked={checkoutPayment==='Mobile Payment'} onChange={()=>setCheckoutPayment('Mobile Payment')} />
                📱 Mobile Payment
              </label>
            </div>
          </div>
          
          {checkoutPayment==='Cash' && (
            <div className="form-group">
              <label>Cash Amount Received</label>
              <input
                type="number"
                min={finalTotal}
                value={checkoutCash}
                onChange={e => setCheckoutCash(e.target.value)}
                placeholder="Enter cash received"
                className="checkout-cash-input"
                required
              />
            </div>
          )}
        </div>

        {checkoutError && <div className="checkout-error">{checkoutError}</div>}
        
        <div className="checkout-actions">
          <button className="cancel-btn" onClick={closeCheckout}>Cancel</button>
          <button className="save-btn" onClick={handleCompleteWithDiscount}>
            Complete Order
          </button>
        </div>
      </div>
    </div>
  );
}

function BillModal({ order, onClose, onPayment }) {
  const [finalTotal, setFinalTotal] = useState(order.total || 0);



  const printBill = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - Tea वृक्ष</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white; 
            color: black;
          }
          .bill-print {
            max-width: 300px;
            margin: 0 auto;
            border: 2px solid #ea580c;
            padding: 20px;
            border-radius: 8px;
          }
          .bill-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #ea580c;
            padding-bottom: 15px;
          }
          .bill-logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
            margin-bottom: 10px;
          }
          .bill-header h2 {
            margin: 5px 0;
            color: #ea580c;
            font-size: 1.5em;
          }
          .bill-subtitle {
            color: #666;
            font-size: 0.9em;
          }
          .bill-meta {
            margin-bottom: 20px;
            font-size: 0.9em;
            color: #666;
          }
          .bill-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .bill-table th,
          .bill-table td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #eee;
          }
          .bill-table th {
            background: #f8f9fa;
            font-weight: bold;
          }
          .bill-subtotal {
            text-align: right;
            font-size: 1em;
            margin-bottom: 10px;
            color: #666;
          }

          .bill-total {
            text-align: right;
            font-size: 1.1em;
            font-weight: bold;
            margin-bottom: 20px;
            padding-top: 10px;
            border-top: 2px solid #ea580c;
          }
          .bill-footer {
            text-align: center;
            color: #666;
            font-style: italic;
            margin-top: 20px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .bill-print { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="bill-print">
          <div class="bill-header">
            <img src="/logo.png" alt="Tea वृक्ष Logo" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 10px;" />
            <h2>Tea वृक्ष</h2>
            <div class="bill-subtitle">Premium Tea & Coffee</div>
          </div>
          <div class="bill-meta">
            <div>${order.date}</div>
            <div style="font-size: 0.9em; color: #666; margin-top: 2px;">${convertToNepaliBS(order.date).nepaliNumeric}</div>
            <div><b>Service:</b> Dine-in</div>
            <div><b>Table:</b> ${order.table}</div>
            <div style="color: #ea580c; font-weight: 700; margin-top: 5px;">BILL</div>
          </div>
          <table class="bill-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.qty}</td>
                  <td>Rs. ${item.price.toFixed(2)}</td>
                  <td>Rs. ${(item.price * item.qty).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="bill-subtotal">
            <b>Subtotal: Rs. ${order.total.toFixed(2)}</b>
          </div>
          <div class="bill-total">
            <b>Total: Rs. ${finalTotal.toFixed(2)}</b>
          </div>

          <div class="bill-footer">
            Please pay at the counter when ready to leave.<br>
            Thank you for dining with us!
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }, 100);
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(billHTML);
    printWindow.document.close();
  };

  return (
    <div className="modal-overlay">
      <div className="modal bill-modal">
        <h3>Bill - Table {order.table}</h3>
        <div className="bill-content">
          <div className="bill-subtotal">
            <span>Subtotal:</span>
            <span>Rs. {order.total.toFixed(2)}</span>
          </div>
          <div className="bill-final-total">
            <span>Final Total:</span>
            <span>Rs. {finalTotal.toFixed(2)}</span>
          </div>
          <div className="bill-items">
            <div style={{fontWeight:600,marginBottom:'0.5rem'}}>Items:</div>
            {order.items.map(item => (
              <div key={item.name} className="bill-item">
                <span>{item.name} × {item.qty}</span>
                <span>Rs. {(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Close</button>
          <button className="save-btn" onClick={printBill}>
            🖨️ Print Bill
          </button>
          <button className="save-btn" onClick={onPayment}>
            💳 Process Payment
          </button>
        </div>
      </div>
    </div>
  );
}

function TableOrderModal({ tableId, tableName, products, currentOrder, onClose, onSendToKitchen, onUpdateOrder, customers, onCustomerAdded, getAuthHeaders }) {
  console.log('🎯 TableOrderModal received props:', { tableId, tableName, currentOrder });
  
  const [items, setItems] = useState(currentOrder.items || []);
  const [originalItems, setOriginalItems] = useState(currentOrder.items || []);
  const [lineItemDiscounts, setLineItemDiscounts] = useState(currentOrder.lineItemDiscounts || {});
  const [showLineItemDiscountModal, setShowLineItemDiscountModal] = useState(false);
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState(null);
  const [customerName, setCustomerName] = useState(currentOrder.customerName || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState(currentOrder.customerId || null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState(currentOrder.orderNotes || '');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Debug logging
  useEffect(() => {
    console.log('🎯 TableOrderModal mounted/updated:', { 
      tableId, 
      tableName, 
      currentOrder, 
      itemsCount: items.length,
      originalItemsCount: originalItems.length 
    });
  }, [tableId, tableName, currentOrder, items, originalItems]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCustomerDropdown && !event.target.closest('.customer-dropdown-container')) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomerDropdown]);

  const addToOrder = (product) => {
    setItems(prev => {
      const found = prev.find(item => item.id === product.id);
      if (found) {
        return prev.map(item => 
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromOrder = (productId) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setItems(prev => prev.flatMap(item => {
      if (item.id === productId) {
        const newQty = item.qty + delta;
        if (newQty <= 0) return [];
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  // Function to get only new items (items not in original order)
  const getNewItems = () => {
    return items.filter(item => {
      const originalItem = originalItems.find(orig => orig.id === item.id);
      if (!originalItem) {
        // This is a completely new item
        return true;
      }
      // This item exists but check if quantity increased
      return item.qty > originalItem.qty;
    }).map(item => {
      const originalItem = originalItems.find(orig => orig.id === item.id);
      if (!originalItem) {
        // Return the full item for new items
        return item;
      }
      // Return only the difference in quantity for existing items
      const qtyDifference = item.qty - originalItem.qty;
      return { ...item, qty: qtyDifference };
    }).filter(item => item.qty > 0); // Only items with positive quantity
  };

  const getItemPrice = (item) => {
    const manualDiscount = lineItemDiscounts[item.id];
    let finalPrice = item.price;

    console.log('Table getItemPrice debug:', { itemId: item.id, originalPrice: item.price, manualDiscount });

    // Apply manual discount
    if (manualDiscount) {
      if (manualDiscount.type === 'percentage') {
        finalPrice = finalPrice * (1 - manualDiscount.value / 100);
        console.log('Table applied percentage discount:', { original: item.price, discount: manualDiscount.value, final: finalPrice });
      } else if (manualDiscount.type === 'flat') {
        finalPrice = Math.max(0, finalPrice - manualDiscount.value);
        console.log('Table applied flat discount:', { original: item.price, discount: manualDiscount.value, final: finalPrice });
      }
    }

    return finalPrice;
  };

  const getItemTotal = (item) => {
    return getItemPrice(item) * item.qty;
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountedSubtotal = items.reduce((sum, item) => sum + getItemTotal(item), 0);
  
  const total = discountedSubtotal;

  const applyLineItemDiscount = (itemId, discountType, discountValue) => {
    console.log('Applying line item discount:', { itemId, discountType, discountValue });
    setLineItemDiscounts(prev => {
      const newDiscounts = {
        ...prev,
        [itemId]: { type: discountType, value: discountValue }
      };
      console.log('Updated line item discounts:', newDiscounts);
      return newDiscounts;
    });
    setShowLineItemDiscountModal(false);
    setSelectedItemForDiscount(null);
  };

  const removeLineItemDiscount = (itemId) => {
    setLineItemDiscounts(prev => {
      const newDiscounts = { ...prev };
      delete newDiscounts[itemId];
      return newDiscounts;
    });
  };

  const handleAddNewCustomer = async () => {
    if (!customerName.trim() || !newCustomerPhone.trim()) {
      alert('Please enter both customer name and phone number');
      return;
    }

    const customerData = {
      name: customerName.trim(),
      phone: newCustomerPhone.trim()
    };

    console.log('Creating customer with data:', customerData);

    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const newCustomer = await response.json();
        console.log('Customer created successfully:', newCustomer);
        setSelectedCustomerId(newCustomer.id);
        setShowAddCustomerModal(false);
        setNewCustomerPhone('');
        setShowCustomerDropdown(false);
        // Notify parent component about the new customer
        if (onCustomerAdded) {
          onCustomerAdded(newCustomer);
        }
        alert('Customer created successfully!');
      } else {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || 'Unknown error';
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error('Server error:', errorMessage);
        alert(`Error creating customer: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Error creating customer. Please check your connection and try again.');
    }
  };

  // Category filtering logic
  const categories = ['All', 'Chiya', 'Chiso', 'Snacks', 'Food', 'Cigarettes'];
  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  return (
    <div className="modal-overlay">
      <div className="modal table-order-modal">
        <div className="table-order-header">
          <h3>Order for {tableName}</h3>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <div className="customer-dropdown-container" style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'relative'}}>
              <label style={{fontSize: '0.875rem', fontWeight: '500', color: '#374151'}}>Customer:</label>
              <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name or search existing"
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    minWidth: '200px'
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                />
                <button
                  type="button"
                  onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: '#f8fafc',
                    cursor: 'pointer'
                  }}
                  title="Select from existing customers"
                >
                  👥
                </button>
              </div>
              
              {/* Customer Dropdown */}
              {showCustomerDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{padding: '0.5rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.875rem', fontWeight: '500'}}>
                    Select Customer:
                  </div>
                  {customers
                    .filter(customer => 
                      customer.name.toLowerCase().includes(customerName.toLowerCase()) ||
                      customer.phone.includes(customerName)
                    )
                    .map(customer => (
                      <div
                        key={customer.id}
                        onClick={() => {
                          setCustomerName(customer.name);
                          setSelectedCustomerId(customer.id);
                          setShowCustomerDropdown(false);
                        }}
                        style={{
                          padding: '0.5rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f3f4f6',
                          fontSize: '0.875rem'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        <div style={{fontWeight: '500'}}>{customer.name}</div>
                        <div style={{fontSize: '0.75rem', color: '#6b7280'}}>{customer.phone}</div>
                      </div>
                    ))}
                  {customers.filter(customer => 
                    customer.name.toLowerCase().includes(customerName.toLowerCase()) ||
                    customer.phone.includes(customerName)
                  ).length === 0 && customerName.trim() && (
                    <div>
                      <div style={{padding: '0.5rem', fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic'}}>
                        No matching customers found
                      </div>
                      <div
                        onClick={() => setShowAddCustomerModal(true)}
                        style={{
                          padding: '0.5rem',
                          cursor: 'pointer',
                          borderTop: '1px solid #e5e7eb',
                          fontSize: '0.875rem',
                          color: '#059669',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f0fdf4'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        ➕ Add "{customerName}" as new customer
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button className="cancel-btn" onClick={onClose}>Close</button>
          </div>
        </div>
        
        <div className="table-order-content">
          {/* Product Grid */}
          <div className="table-order-products">
            <h4 style={{fontWeight:700,marginBottom:'1rem'}}>Add Items</h4>
            
            {/* Category Filter */}
            <div className="category-filter" style={{marginBottom: '1rem'}}>
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    padding: '0.5rem 1rem',
                    margin: '0 0.25rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: selectedCategory === category ? '#3b82f6' : '#f8fafc',
                    color: selectedCategory === category ? 'white' : '#374151',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== category) {
                      e.target.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== category) {
                      e.target.style.backgroundColor = '#f8fafc';
                    }
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
            
            <div className="table-product-grid">
              {(() => {
                // Group products by category
                const groupedProducts = {};
                filteredProducts.forEach(product => {
                  if (!groupedProducts[product.category]) {
                    groupedProducts[product.category] = [];
                  }
                  groupedProducts[product.category].push(product);
                });

                // Sort products by type and then alphabetically within each category
                Object.keys(groupedProducts).forEach(category => {
                  groupedProducts[category].sort((a, b) => {
                                       // Extract the main product type (e.g., "Momo", "Fried Rice", "Chiya")
                   const getProductType = (name) => {
                     if (name.toLowerCase().includes('momo')) return 'momo';
                     if (name.toLowerCase().includes('fried rice')) return 'fried rice';
                     if (name.toLowerCase().includes('chiya')) return 'chiya';
                     if (name.toLowerCase().includes('milkshake')) return 'milkshake';
                     if (name.toLowerCase().includes('sausage')) return 'sausage';
                     if (name.toLowerCase().includes('fries') || name.toLowerCase().includes('wedges')) return 'fries';
                     if (name.toLowerCase().includes('samosa') || name.toLowerCase().includes('pakauda') || name.toLowerCase().includes('puff')) return 'snacks';
                     if (name.toLowerCase().includes('chatpate') || name.toLowerCase().includes('wai wai')) return 'chatpate';
                     if (name.toLowerCase().includes('lassi') || name.toLowerCase().includes('mohi')) return 'lassi';
                     if (name.toLowerCase().includes('coke') || name.toLowerCase().includes('sprite') || name.toLowerCase().includes('iced tea')) return 'drinks';
                     return 'other';
                   };
                   
                   const typeA = getProductType(a.name);
                   const typeB = getProductType(b.name);
                   
                   // Define type order
                   const typeOrder = ['momo', 'fried rice', 'chiya', 'milkshake', 'sausage', 'fries', 'snacks', 'chatpate', 'lassi', 'drinks', 'other'];
                    const orderA = typeOrder.indexOf(typeA);
                    const orderB = typeOrder.indexOf(typeB);
                    
                                       // First sort by type order
                   if (orderA !== orderB) {
                     return orderA - orderB;
                   }
                   
                   // Custom sorting within each type
                   if (typeA === 'momo') {
                     // Momo order: Vegetable, Chicken, Buff
                     const momoOrder = ['vegetable', 'chicken', 'buff'];
                     const momoA = momoOrder.find(type => a.name.toLowerCase().includes(type)) || 'other';
                     const momoB = momoOrder.find(type => b.name.toLowerCase().includes(type)) || 'other';
                     const momoOrderA = momoOrder.indexOf(momoA);
                     const momoOrderB = momoOrder.indexOf(momoB);
                     if (momoOrderA !== momoOrderB) {
                       return momoOrderA - momoOrderB;
                     }
                   } else if (typeA === 'chiya') {
                     // Chiya order: Milk, Matka, Black, Green, Lemon, Hot Lemon
                     const chiyaOrder = ['milk', 'matka', 'black', 'green', 'lemon', 'hot lemon'];
                     const chiyaA = chiyaOrder.find(type => a.name.toLowerCase().includes(type)) || 'other';
                     const chiyaB = chiyaOrder.find(type => b.name.toLowerCase().includes(type)) || 'other';
                     const chiyaOrderA = chiyaOrder.indexOf(chiyaA);
                     const chiyaOrderB = chiyaOrder.indexOf(chiyaB);
                     if (chiyaOrderA !== chiyaOrderB) {
                       return chiyaOrderA - chiyaOrderB;
                     }
                   } else if (typeA === 'milkshake' || typeA === 'lassi' || typeA === 'drinks' || typeA === 'snacks' || typeA === 'chatpate') {
                     // Sort by price (low to high) for Chiso and Snacks categories
                     return a.price - b.price;
                   }
                   
                   // Then sort alphabetically within the same type
                   return a.name.localeCompare(b.name);
                  });
                });

                // Flatten the grouped products to maintain grid layout with specific category order
                const sortedProducts = [];
                const categoryOrder = ['Chiya', 'Chiso', 'Snacks', 'Food'];
                
                categoryOrder.forEach(category => {
                  if (groupedProducts[category]) {
                    sortedProducts.push(...groupedProducts[category]);
                  }
                });
                
                // Add any remaining categories that weren't in the predefined order
                Object.keys(groupedProducts).forEach(category => {
                  if (!categoryOrder.includes(category)) {
                    sortedProducts.push(...groupedProducts[category]);
                  }
                });

                // Apply category-specific sorting
                if (selectedCategory === 'Chiso' || selectedCategory === 'Snacks') {
                  // Sort by price (low to high) for Chiso and Snacks categories
                  sortedProducts.sort((a, b) => a.price - b.price);
                }

                return sortedProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="table-product-tile"
                    onClick={() => addToOrder(product)}
                  >
                    <div className="table-product-img">
                      <img src={product.image} alt={product.name} />
                    </div>
                    <div className="table-product-info">
                      <div className="table-product-name">{product.name}</div>
                      <div className="table-product-price">Rs. {product.price.toFixed(2)}</div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Order Summary */}
          <div className="table-order-summary">
            <h4 style={{fontWeight:700,marginBottom:'1rem'}}>Order Items</h4>
            <div className="table-order-items">
              {items.length === 0 ? (
                <div className="empty-order">No items added</div>
              ) : (
                items.map(item => {
                  const itemDiscount = lineItemDiscounts[item.id];
                  const finalPrice = getItemPrice(item);
                  const itemTotal = getItemTotal(item);
                  
                  return (
                    <div key={item.id} className="table-order-item">
                      <div className="table-item-info">
                        <div className="table-item-name">{item.name}</div>
                        <div className="item-total">
                          {itemDiscount ? (
                            <div>
                              <div style={{textDecoration: 'line-through', color: '#6b7280', fontSize: '0.9em'}}>
                                Rs. {(item.price * item.qty).toFixed(2)}
                              </div>
                              <div style={{color: '#059669', fontWeight: 'bold'}}>
                                Rs. {itemTotal.toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <span>Rs. {itemTotal.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <div className="table-item-controls">
                        <button 
                          className="table-qty-btn" 
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          -
                        </button>
                        <span className="table-item-qty">{item.qty}</span>
                        <button 
                          className="table-qty-btn" 
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          +
                        </button>
                        {itemDiscount ? (
                          <button 
                            className="remove-discount-btn" 
                            onClick={() => removeLineItemDiscount(item.id)}
                            title="Remove discount"
                          >
                            🗑️
                          </button>
                        ) : (
                          <button 
                            className="discount-btn" 
                            onClick={() => {
                              setSelectedItemForDiscount(item);
                              setShowLineItemDiscountModal(true);
                            }}
                            title="Add discount"
                          >
                            💰
                          </button>
                        )}
                        <button 
                          className="table-remove-btn" 
                          onClick={() => removeFromOrder(item.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Order Notes Section */}
            <div style={{marginTop: '1rem', padding: '1rem', borderTop: '1px solid #e5e7eb'}}>
              <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.875rem'}}>
                📝 Order Notes (Special Requests)
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="e.g., Less sugar, Extra hot, No ice, Special instructions..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: 'white',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
              />
            </div>

            <div className="table-order-total">
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem'}}>
                <span>Subtotal:</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              {discountedSubtotal !== subtotal && (
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#059669'}}>
                  <span>After Item Discounts:</span>
                  <span>Rs. {discountedSubtotal.toFixed(2)}</span>
                </div>
              )}

              <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem'}}>
                <span>Total:</span>
                <span>Rs. {total.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="table-order-actions">

              <button 
                className="table-save-btn"
                onClick={async () => {
                  const discountData = {
                    lineItemDiscounts,
                    total,
                    customerName,
                    customerId: selectedCustomerId,
                    orderNotes
                  };
                  
                  if (items.length === 0) {
                    alert('Please add items to the order before saving.');
                    return;
                  }
                  
                  try {
                    await onUpdateOrder(items, discountData);
                    console.log('✅ Order saved successfully!');
                  } catch (error) {
                    console.error('❌ Error saving order:', error);
                    alert('Error saving order: ' + error.message);
                  }
                }}
                disabled={items.length === 0}
              >
                💾 Save Order
              </button>
              {/*
              <button 
                className="table-kitchen-btn"
                onClick={() => {
                  const newItems = getNewItems();
                  if (newItems.length === 0) {
                    alert('No new items to send to kitchen.');
                    return;
                  }
                  onSendToKitchen(newItems);
                }}
                disabled={getNewItems().length === 0}
              >
                🍳 Send to Kitchen
              </button>
              */}
            </div>
          </div>
        </div>
      </div>

      {/* Line Item Discount Modal */}
      {showLineItemDiscountModal && selectedItemForDiscount && (
        <div className="modal-overlay" style={{zIndex: 1001}}>
          <div className="modal line-item-discount-modal" style={{maxWidth: '400px'}}>
            <h3>Add Discount to {selectedItemForDiscount.name}</h3>
            <div className="item-info" style={{marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '4px'}}>
              <div>Original Price: Rs. {selectedItemForDiscount.price.toFixed(2)}</div>
              <div>Quantity: {selectedItemForDiscount.qty}</div>
            </div>
            
            <div style={{marginBottom: '1rem'}}>
              <label style={{display: 'block', marginBottom: '0.5rem'}}>Discount Type:</label>
              <select 
                id="discountType"
                style={{width: '100%', padding: '0.5rem', marginBottom: '0.5rem'}}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (Rs.)</option>
              </select>
              
              <label style={{display: 'block', marginBottom: '0.5rem'}}>Discount Value:</label>
              <input
                type="number"
                id="discountValue"
                placeholder="Enter discount value"
                style={{width: '100%', padding: '0.5rem', marginBottom: '1rem'}}
                min="0"
              />
            </div>
            
            <div className="modal-actions" style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowLineItemDiscountModal(false);
                  setSelectedItemForDiscount(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={() => {
                  const discountType = document.getElementById('discountType').value;
                  const discountValue = parseFloat(document.getElementById('discountValue').value);
                  if (discountValue > 0) {
                    applyLineItemDiscount(selectedItemForDiscount.id, discountType, discountValue);
                  }
                }}
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {showAddCustomerModal && (
        <div className="modal-overlay" style={{zIndex: 1002}}>
          <div className="modal" style={{maxWidth: '400px'}}>
            <h3>Add New Customer</h3>
            <div style={{marginBottom: '1rem'}}>
              <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500'}}>
                Customer Name:
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}
                placeholder="Enter customer name"
              />
            </div>
            <div style={{marginBottom: '1rem'}}>
              <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500'}}>
                Phone Number:
              </label>
              <input
                type="text"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}
                placeholder="Enter phone number"
              />
            </div>
            <div className="modal-actions" style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowAddCustomerModal(false);
                  setNewCustomerPhone('');
                }}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={handleAddNewCustomer}
              >
                Add Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Line Item Discount Modal
function LineItemDiscountModal({ item, onApply, onCancel }) {
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [error, setError] = useState('');

  const handleApply = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid discount value');
      return;
    }

    if (discountType === 'percentage' && value > 100) {
      setError('Percentage cannot exceed 100%');
      return;
    }

    if (discountType === 'flat' && value >= item.price) {
      setError('Flat discount cannot exceed item price');
      return;
    }

    onApply(discountType, value);
  };

  return (
    <div className="modal-overlay">
      <div className="modal line-item-discount-modal">
        <h3>Apply Discount to {item.name}</h3>
        <div className="item-info">
          <div>Original Price: Rs. {item.price.toFixed(2)}</div>
          <div>Quantity: {item.qty}</div>
        </div>
        
        <div className="form-group">
          <label>Discount Type</label>
          <div className="discount-type-options">
            <label className="discount-type-option">
              <input 
                type="radio" 
                name="itemDiscountType" 
                value="percentage" 
                checked={discountType === 'percentage'} 
                onChange={() => setDiscountType('percentage')} 
              />
              Percentage
            </label>
            <label className="discount-type-option">
              <input 
                type="radio" 
                name="itemDiscountType" 
                value="flat" 
                checked={discountType === 'flat'} 
                onChange={() => setDiscountType('flat')} 
              />
              Flat Amount
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>
            {discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (Rs.)'}
          </label>
          <input
            type="number"
            min="0"
            max={discountType === 'percentage' ? "100" : item.price}
            step={discountType === 'percentage' ? "1" : "0.01"}
            value={discountValue}
            onChange={(e) => {
              setDiscountValue(e.target.value);
              setError('');
            }}
            placeholder={discountType === 'percentage' ? "Enter percentage" : "Enter amount"}
            className="discount-input"
          />
        </div>

        {discountValue && (
          <div className="discount-preview">
            <div>Original: Rs. {(item.price * item.qty).toFixed(2)}</div>
            <div>Discount: {discountType === 'percentage' ? `${discountValue}%` : `Rs. ${discountValue}`}</div>
            <div>Final: Rs. {
              discountType === 'percentage' 
                ? ((item.price * (1 - parseFloat(discountValue) / 100)) * item.qty).toFixed(2)
                : (Math.max(0, item.price - parseFloat(discountValue)) * item.qty).toFixed(2)
            }</div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="save-btn" onClick={handleApply}>Apply Discount</button>
        </div>
      </div>
    </div>
  );
}

// Rewards Modal
function RewardsModal({ customer, transactions, onClose, onRedeem }) {
  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'bronze': return '#cd7f32';
      case 'silver': return '#c0c0c0';
      case 'gold': return '#ffd700';
      case 'platinum': return '#e5e4e2';
      default: return '#cd7f32';
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'earned': return '➕';
      case 'redeemed': return '➖';
      case 'expired': return '⏰';
      case 'bonus': return '🎁';
      default: return '📝';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal rewards-modal">
        <div className="modal-header">
          <h3>🏆 {customer.name}'s Rewards</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="rewards-summary">
          <div className="rewards-tier-info">
            <div className="tier-display">
              <span 
                className="tier-badge-large" 
                style={{ backgroundColor: getTierColor(customer.tier) }}
              >
                {customer.tier}
              </span>
            </div>
            <div className="tier-benefits">
              <div>Points per Rs: {customer.points_per_rs}</div>
              <div>Redemption rate: Rs. {customer.redemption_rate} per point</div>
              {customer.discount_percentage > 0 && (
                <div>Tier discount: {customer.discount_percentage}%</div>
              )}
            </div>
          </div>
          
          <div className="rewards-stats">
            <div className="stat-card">
              <div className="stat-value">{customer.points_balance}</div>
              <div className="stat-label">Current Balance</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{customer.total_points_earned}</div>
              <div className="stat-label">Total Earned</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{customer.total_points_redeemed}</div>
              <div className="stat-label">Total Redeemed</div>
            </div>
          </div>
          
          {customer.next_tier && (
            <div className="next-tier-info">
              <div>Next tier: <strong>{customer.next_tier.name}</strong></div>
              <div>Points needed: <strong>{customer.points_to_next_tier}</strong></div>
            </div>
          )}
        </div>

        <div className="rewards-actions">
          {customer.points_balance > 0 && (
            <button 
              className="redeem-btn"
              onClick={() => onRedeem(customer.points_balance)}
            >
              💰 Redeem All Points
            </button>
          )}
        </div>

        <div className="transactions-section">
          <h4>Transaction History</h4>
          <div className="transactions-list">
            {transactions.length === 0 ? (
              <div className="no-transactions">No transactions yet</div>
            ) : (
              transactions.map(transaction => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-icon">
                    {getTransactionIcon(transaction.transaction_type)}
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-description">
                      {transaction.description}
                    </div>
                    <div className="transaction-date">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`transaction-points ${transaction.points > 0 ? 'positive' : 'negative'}`}>
                    {transaction.points > 0 ? '+' : ''}{transaction.points}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Redeem Points Modal
function RedeemPointsModal({ customer, pointsToRedeem, setPointsToRedeem, onRedeem, onClose }) {
  const [orderTotal, setOrderTotal] = useState('');
  const [error, setError] = useState('');

  const maxPoints = Math.min(customer.points_balance, parseInt(pointsToRedeem) || 0);
  const discountAmount = maxPoints * customer.redemption_rate;
  const tierDiscount = orderTotal ? (parseFloat(orderTotal) * customer.discount_percentage) / 100 : 0;
  const totalDiscount = discountAmount + tierDiscount;

  const handleRedeem = () => {
    if (!pointsToRedeem || parseInt(pointsToRedeem) <= 0) {
      setError('Please enter a valid number of points');
      return;
    }
    if (parseInt(pointsToRedeem) > customer.points_balance) {
      setError('Cannot redeem more points than available');
      return;
    }
    onRedeem();
  };

  return (
    <div className="modal-overlay">
      <div className="modal redeem-modal">
        <div className="modal-header">
          <h3>💰 Redeem Points</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="redeem-info">
          <div className="customer-info">
            <strong>{customer.name}</strong> - {customer.phone}
          </div>
          <div className="points-info">
            <div>Available points: <strong>{customer.points_balance}</strong></div>
            <div>Redemption rate: <strong>Rs. {customer.redemption_rate}</strong> per point</div>
          </div>
        </div>

        <div className="form-group">
          <label>Points to Redeem</label>
          <input
            type="number"
            min="1"
            max={customer.points_balance}
            value={pointsToRedeem}
            onChange={(e) => {
              setPointsToRedeem(e.target.value);
              setError('');
            }}
            placeholder="Enter points to redeem"
          />
        </div>

        <div className="form-group">
          <label>Order Total (Optional - for tier discount calculation)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={orderTotal}
            onChange={(e) => setOrderTotal(e.target.value)}
            placeholder="Enter order total"
          />
        </div>

        {pointsToRedeem && parseInt(pointsToRedeem) > 0 && (
          <div className="redeem-preview">
            <h4>Redemption Preview</h4>
            <div className="preview-item">
              <span>Points redeemed:</span>
              <span>{maxPoints}</span>
            </div>
            <div className="preview-item">
              <span>Points discount:</span>
              <span>Rs. {discountAmount.toFixed(2)}</span>
            </div>
            {customer.discount_percentage > 0 && orderTotal && (
              <div className="preview-item">
                <span>Tier discount ({customer.discount_percentage}%):</span>
                <span>Rs. {tierDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="preview-item total">
              <span>Total discount:</span>
              <span>Rs. {totalDiscount.toFixed(2)}</span>
            </div>
            <div className="preview-item">
              <span>Remaining points:</span>
              <span>{customer.points_balance - maxPoints}</span>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button 
            className="redeem-btn" 
            onClick={handleRedeem}
            disabled={!pointsToRedeem || parseInt(pointsToRedeem) <= 0 || parseInt(pointsToRedeem) > customer.points_balance}
          >
            Redeem Points
          </button>
        </div>
      </div>
    </div>
  );
}

export default App
