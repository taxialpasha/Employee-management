 // Firebase Configuration
    const firebaseConfig = {
        apiKey: "AIzaSyDGpAHia_wEmrhnmYjrPf1n1TrAzwEMiAI",
        authDomain: "messageemeapp.firebaseapp.com",
        databaseURL: "https://messageemeapp-default-rtdb.firebaseio.com",
        projectId: "messageemeapp",
        storageBucket: "messageemeapp.appspot.com",
        messagingSenderId: "255034474844",
        appId: "1:255034474844:web:5e3b7a6bc4b2fb94cc4199"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const storage = firebase.storage();

    // Global variables
    let currentInvestor = null;
    let currentCard = null;
    let qrScanner = null;
    let currentFilter = 'all';
    let notifications = [];
    let currentProject = '';
    
    // متغيرات إضافية لإدارة المشاريع
    let categories = [];
    let projects = [];
    let isAdminMode = false;
    let isProjectEditMode = false;
    let projectImageFile = null;
    let editImageChanged = false;

    // المسار الصحيح في Firebase
    const FIREBASE_USER_ID = '6wS4ga5v6MXUMC0yzyDnxuI2dh03';
    const INVESTOR_CARD_ID = 'mai4v8cousf7soxqvt'; // معرف البطاقة المحدد
    const CARDS_PATH = `users/${FIREBASE_USER_ID}/investorCards`;
    const TRANSACTIONS_PATH = `users/${FIREBASE_USER_ID}/transactions`;
    const WITHDRAWAL_REQUESTS_PATH = `users/${FIREBASE_USER_ID}/withdrawRequests`;
    const SUPPORT_REQUESTS_PATH = `users/${FIREBASE_USER_ID}/supportRequests`;
    const NOTIFICATIONS_PATH = `users/${FIREBASE_USER_ID}/notifications`;
    const OPERATIONS_PATH = `users/${FIREBASE_USER_ID}/investorCards/${INVESTOR_CARD_ID}/recentOperations`;
    
    // المسارات الجديدة الخاصة بإدارة المشاريع
    const PROJECTS_PATH = `users/${FIREBASE_USER_ID}/projects`;
    const CATEGORIES_PATH = `users/${FIREBASE_USER_ID}/categories`;

    // Initialize app
    window.onload = function() {
        setupEventListeners();
        checkLocalStorage();
        hideLoading();
        
        // التحقق من وجود مستخدم مشرف (للاختبار فقط)
        checkAdminRights();
    };

    // Check for saved login info in localStorage
    function checkLocalStorage() {
        const savedCard = localStorage.getItem('investorCard');
        const savedInvestor = localStorage.getItem('investorData');
        
        if (savedCard && savedInvestor) {
            try {
                currentCard = JSON.parse(savedCard);
                currentInvestor = JSON.parse(savedInvestor);
                showDashboard();
            } catch (error) {
                console.error('Error parsing saved data:', error);
                localStorage.removeItem('investorCard');
                localStorage.removeItem('investorData');
            }
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Card number formatting
        const cardNumberInput = document.getElementById('cardNumber');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', formatCardNumber);
        }
        
        // Expiry date formatting
        const expiryDateInput = document.getElementById('expiryDate');
        if (expiryDateInput) {
            expiryDateInput.addEventListener('input', formatExpiryDate);
        }
        
        // CVV formatting
        const cvvInput = document.getElementById('cvv');
        if (cvvInput) {
            cvvInput.addEventListener('input', formatCVV);
        }
        
        // Withdraw method change
        const withdrawMethodSelect = document.getElementById('withdrawMethod');
        if (withdrawMethodSelect) {
            withdrawMethodSelect.addEventListener('change', function() {
                const method = this.value;
                document.getElementById('bankDetailsGroup').style.display = method === 'bank_transfer' ? 'block' : 'none';
                document.getElementById('walletDetailsGroup').style.display = method === 'e_wallet' ? 'block' : 'none';
            });
        }
        
        // Search input handling
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                searchProjects(this.value);
            });
        }
    }

    // Format card number input
    function formatCardNumber(e) {
        let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
    }

    // Format expiry date input
    function formatExpiryDate(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    }

    // Format CVV input
    function formatCVV(e) {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
    }

    // Switch between tabs
    function switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    // Login with card
    async function loginWithCard(event) {
        event.preventDefault();
        showLoading();
        clearErrors();

        const cardNumber = document.getElementById('cardNumber').value.replace(/\s+/g, '');
        const expiryDate = document.getElementById('expiryDate').value;
        const cvv = document.getElementById('cvv').value;

        console.log("Attempting login with:", { cardNumber, expiryDate, cvv });

        try {
            // Search for card in Firebase with correct path
            const cardData = await findCardInDatabase(cardNumber, expiryDate, cvv);
            
            if (cardData) {
                currentCard = cardData;
                console.log("Card found:", cardData);
                
                // Load investor data from the card
                currentInvestor = {
                    id: cardData.investorId,
                    name: cardData.investorName,
                    phone: cardData.investorPhone,
                    email: cardData.investorEmail || '',
                    joinDate: cardData.joinDate || new Date().toISOString()
                };
                
                // Save to localStorage for persistent login
                localStorage.setItem('investorCard', JSON.stringify(currentCard));
                localStorage.setItem('investorData', JSON.stringify(currentInvestor));
                
                showDashboard();
            } else {
                showError('بيانات البطاقة غير صحيحة');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('حدث خطأ في النظام');
        } finally {
            hideLoading();
        }
    }

    // Find card in database with correct path
    async function findCardInDatabase(cardNumber, expiryDate, cvv) {
        console.log("Searching in path:", CARDS_PATH);
        
        const cardsRef = database.ref(CARDS_PATH);
        const snapshot = await cardsRef.once('value');
        const cards = snapshot.val() || {};
        
        console.log("Cards found:", cards);

        // Search through all cards
        for (const cardId in cards) {
            const card = cards[cardId];
            console.log("Checking card:", card);
            
            if (card.cardNumber === cardNumber && 
                formatCardExpiryDateFromDB(card.expiryDate) === expiryDate && 
                card.cvv === cvv) {
                console.log("Card match found!");
                return card;
            }
        }

        return null;
    }

    // Format expiry date from database format
    function formatCardExpiryDateFromDB(dateString) {
        const date = new Date(dateString);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().substr(-2);
        return `${month}/${year}`;
    }

    // Start QR scan
    async function startQRScan() {
        try {
            const qrScannerElement = document.getElementById('qr-scanner');
            qrScannerElement.style.display = 'block';
            
            qrScanner = new Html5QrcodeScanner(
                "qr-scanner", 
                { fps: 10, qrbox: 250 }
            );

            qrScanner.render(onQRSuccess, onQRError);
            document.getElementById('startScanBtn').style.display = 'none';
        } catch (error) {
            console.error('QR scanner error:', error);
            showError('خطأ في تشغيل الكاميرا');
        }
    }

    // Decode QR code from uploaded image
    function decodeQRFromImage(file) {
        if (!file) {
            return;
        }
        
        showLoading();
        
        const html5QrCode = new Html5Qrcode("qr-scanner");
        
        html5QrCode.scanFile(file, true)
            .then(decodedText => {
                console.log(`QR Code from image: ${decodedText}`);
                processQRData(decodedText);
            })
            .catch(err => {
                console.error(`Error scanning uploaded QR code: ${err}`);
                showError('فشل في قراءة رمز QR من الصورة');
                hideLoading();
            });
    }

    // Process QR data (used by both camera and uploaded image)
    async function processQRData(decodedText) {
        try {
            console.log("QR Code scanned:", decodedText);

            // Parse QR data
            const qrData = JSON.parse(decodedText);
            
            if (qrData.type === 'investor-card' && qrData.cardNumber) {
                // Auto-fill card data
                document.getElementById('cardNumber').value = formatCardNumberDisplay(qrData.cardNumber);
                document.getElementById('expiryDate').value = qrData.expiryDate;
                
                // Find card in database
                const cardData = await findCardByQR(qrData);
                
                if (cardData) {
                    currentCard = cardData;
                    
                    // Load investor data from the card
                    currentInvestor = {
                        id: cardData.investorId,
                        name: cardData.investorName,
                        phone: cardData.investorPhone,
                        email: cardData.investorEmail || '',
                        joinDate: cardData.joinDate || new Date().toISOString()
                    };
                    
                    // Save to localStorage for persistent login
                    localStorage.setItem('investorCard', JSON.stringify(currentCard));
                    localStorage.setItem('investorData', JSON.stringify(currentInvestor));
                    
                    showDashboard();
                } else {
                    showError('البطاقة غير موجودة في النظام');
                }
            } else {
                showError('رمز QR غير صالح');
            }
        } catch (error) {
            console.error('QR processing error:', error);
            showError('خطأ في معالجة رمز QR');
        } finally {
            hideLoading();
        }
    }

    // QR scan success
    function onQRSuccess(decodedText) {
        if (qrScanner) {
            qrScanner.clear();
            qrScanner = null;
        }
        
        processQRData(decodedText);
    }

    // QR scan error
    function onQRError(error) {
        console.warn('QR scan error:', error);
    }

    // Find card by QR data
    async function findCardByQR(qrData) {
        const cardsRef = database.ref(CARDS_PATH);
        const snapshot = await cardsRef.once('value');
        const cards = snapshot.val() || {};

        // Search by card ID or investor ID
        for (const cardId in cards) {
            const card = cards[cardId];
            if ((card.id === qrData.id || card.investorId === qrData.investorId) &&
                card.cardNumber === qrData.cardNumber) {
                return card;
            }
        }

        return null;
    }

    // Show dashboard
    function showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboardScreen').style.display = 'block';
        document.getElementById('bottomNav').style.display = 'flex';
        
        // Make sure home section is visible and others are hidden
        switchSection('home');

        // Update dashboard with card data
        updateDashboard();
        
        // Load notifications
        loadNotifications();
        
        // Load categories and projects
        loadCategories();
        loadProjects();
        
        // Check for withdrawal requests status
        setTimeout(checkWithdrawalRequestsStatus, 2000);
        
        // تحديث بيانات المستخدم في الصفحة الرئيسية
        updateHomeUserInfo();
        
        // تحميل النشاطات الأخيرة
        loadRecentActivities();
    }

    // Update dashboard
    function updateDashboard() {
        // Update header with investor name
        document.getElementById('headerUsername').textContent = `مرحباً، ${currentInvestor.name}`;
        
        // Update card display
        document.getElementById('displayCardNumber').textContent = formatCardNumberDisplay(currentCard.cardNumber);
        document.getElementById('displayExpiryDate').textContent = formatCardExpiryDateFromDB(currentCard.expiryDate);
        document.getElementById('cardDueProfit').textContent = formatCurrency(currentCard.dueProfit || 0);
        document.getElementById('cardCompanyName').textContent = "سما بابل للاستثمار";

        // Update financial info
        document.getElementById('totalInvestment').textContent = formatCurrency(currentCard.totalInvestment || 0);
        document.getElementById('dueProfit').textContent = formatCurrency(currentCard.dueProfit || 0);
        document.getElementById('maturityDate').textContent = formatCardExpiryDateFromDB(currentCard.expiryDate);
        document.getElementById('investmentStatus').textContent = currentCard.status || "نشط";

        // Update profile section
        updateProfileSection();
        
        // Load transactions
        loadTransactions();
        
        // Load filtered transactions
        loadFilteredTransactions(currentFilter);
    }

    // تحديث بيانات المستخدم في الصفحة الرئيسية
    function updateHomeUserInfo() {
        // تحديث اسم المستخدم في الترحيب
        document.getElementById('welcomeText').textContent = `مرحباً، ${currentInvestor.name}`;
        
        // تحديث الحرف الأول من اسم المستخدم في الصورة
        const avatarElement = document.getElementById('userAvatar');
        const firstLetter = currentInvestor.name.charAt(0);
        avatarElement.innerHTML = firstLetter;
    }

    // Refresh dashboard data
    async function refreshDashboard() {
        showLoading();
        
        try {
            // Reload card data from Firebase
            if (currentCard && currentCard.id) {
                const cardRef = database.ref(`${CARDS_PATH}/${currentCard.id}`);
                const snapshot = await cardRef.once('value');
                const updatedCard = snapshot.val();
                
                if (updatedCard) {
                    currentCard = updatedCard;
                    
                    // Update localStorage
                    localStorage.setItem('investorCard', JSON.stringify(currentCard));
                    
                    // Update UI
                    updateDashboard();
                }
            }
            
            // Reload projects and categories from Firebase
            await loadCategories();
            await loadProjects();
            
            // Reload notifications
            loadNotifications();
            
            // تحديث النشاطات الأخيرة
            loadRecentActivities();
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            hideLoading();
        }
    }

    // تحميل النشاطات الأخيرة للصفحة الرئيسية
    function loadRecentActivities() {
        const recentActivitiesContainer = document.getElementById('recentActivities');
        recentActivitiesContainer.innerHTML = '';
        
        // استخدام العمليات الحديثة من البطاقة إذا كانت متوفرة
        if (currentCard.recentOperations && currentCard.recentOperations.length > 0) {
            // ترتيب العمليات حسب التاريخ (الأحدث أولاً)
            const sortedOperations = [...currentCard.recentOperations]
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // عرض آخر 3 عمليات فقط
            const recentOps = sortedOperations.slice(0, 3);
            
            recentOps.forEach(operation => {
                const activityItem = createActivityElement(operation);
                recentActivitiesContainer.appendChild(activityItem);
            });
        } else {
            // إذا لم تكن هناك عمليات، استخدم بيانات وهمية
            const mockActivities = generateMockActivities();
            mockActivities.forEach(activity => {
                const activityItem = createActivityElement(activity);
                recentActivitiesContainer.appendChild(activityItem);
            });
        }
    }

    // إنشاء عنصر نشاط
    function createActivityElement(activity) {
        const div = document.createElement('div');
        div.className = 'activity-item';
        
        // تحديد الأيقونة المناسبة
        let icon = 'fas fa-exchange-alt';
        if (activity.type === 'investment' || activity.type === 'deposit') {
            icon = 'fas fa-arrow-down';
        } else if (activity.type === 'withdrawal') {
            icon = 'fas fa-arrow-up';
        } else if (activity.type === 'profit') {
            icon = 'fas fa-hand-holding-usd';
        }
        
        // تحديد ما إذا كان المبلغ إيجابيًا أم سلبيًا
        const isPositive = activity.type === 'profit' || activity.type === 'investment';
        
        div.innerHTML = `
            <div class="activity-icon">
                <i class="${icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${getTransactionTypeName(activity.type)}</div>
                <div class="activity-time">${formatDate(activity.date)} ${formatTime(activity.date)}</div>
            </div>
            <div class="activity-amount ${isPositive ? 'positive' : 'negative'}">
                ${isPositive ? '+' : '-'} ${formatCurrency(activity.amount || 0)}
            </div>
        `;
        
        return div;
    }

    // إنشاء أنشطة وهمية للعرض
    function generateMockActivities() {
        return [
            {
                id: 'mock1',
                type: 'profit',
                amount: 150,
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                description: 'أرباح شهرية'
            },
            {
                id: 'mock2',
                type: 'investment',
                amount: 1000,
                date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                description: 'استثمار جديد'
            },
            {
                id: 'mock3',
                type: 'withdrawal',
                amount: 500,
                date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                description: 'سحب أرباح'
            }
        ];
    }

    // Update profile section
    function updateProfileSection() {
        // Set profile data
        document.getElementById('profileName').textContent = currentInvestor.name;
        document.getElementById('profileCardNumber').textContent = formatCardNumberDisplay(currentCard.cardNumber);
        document.getElementById('profileFullName').textContent = currentInvestor.name;
        document.getElementById('profilePhone').textContent = currentInvestor.phone || '-';
        document.getElementById('profileEmail').textContent = currentInvestor.email || '-';
        document.getElementById('profileJoinDate').textContent = formatDate(currentInvestor.joinDate);
        
        // Set the first letter of the name as avatar text
        const avatarElement = document.getElementById('profileAvatar');
        const firstLetter = currentInvestor.name.charAt(0);
        avatarElement.innerHTML = `<span style="font-size: 2.5rem;">${firstLetter}</span>`;
    }

    // Format card number for display
    function formatCardNumberDisplay(cardNumber) {
        return cardNumber.match(/.{1,4}/g).join(' ');
    }

    // Format currency
    function formatCurrency(amount) {
        return new Intl.NumberFormat('ar-IQ', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + " د.ع";
    }

    // Load transactions
    function loadTransactions() {
        const transactionsList = document.getElementById('transactionsList');
        transactionsList.innerHTML = '';
        
        try {
            // If we have recent operations in the card object
            if (currentCard.recentOperations && currentCard.recentOperations.length > 0) {
                // Sort operations by date (newest first)
                const sortedOperations = [...currentCard.recentOperations]
                    .sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // Display the 5 most recent transactions
                const recentOperations = sortedOperations.slice(0, 5);
                
                recentOperations.forEach(transaction => {
                    const transactionElement = createTransactionElement(transaction);
                    transactionsList.appendChild(transactionElement);
                });
            } else {
                // Load operations from Firebase
                loadRecentOperationsFromFirebase(transactionsList);
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            transactionsList.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); margin-top: 30px;">حدث خطأ في تحميل المعاملات</p>';
        }
    }

    // Load recent operations from Firebase
    async function loadRecentOperationsFromFirebase(transactionsList) {
        try {
            const operationsRef = database.ref(OPERATIONS_PATH);
            const snapshot = await operationsRef.orderByChild('date').once('value');
            
            // Convert to array and sort by date (newest first)
            const operations = [];
            snapshot.forEach(childSnapshot => {
                operations.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            
            // Sort by date (newest first)
            operations.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Display operations
            if (operations.length > 0) {
                // Update currentCard with recent operations
                if (!currentCard.recentOperations) {
                    currentCard.recentOperations = [];
                }
                currentCard.recentOperations = operations;
                localStorage.setItem('investorCard', JSON.stringify(currentCard));
                
                // Display the 5 most recent transactions
                const recentOperations = operations.slice(0, 5);
                recentOperations.forEach(transaction => {
                    const transactionElement = createTransactionElement(transaction);
                    transactionsList.appendChild(transactionElement);
                });
            } else {
                // No operations found, generate mock data
                const mockTransactions = generateMockTransactions();
                
                // Save mock transactions to card
                currentCard.recentOperations = mockTransactions;
                localStorage.setItem('investorCard', JSON.stringify(currentCard));
                
                // Display mock transactions
                mockTransactions.forEach(transaction => {
                    const transactionElement = createTransactionElement(transaction);
                    transactionsList.appendChild(transactionElement);
                });
            }
        } catch (error) {
            console.error('Error loading operations from Firebase:', error);
            
            // Use mock data as fallback
            const mockTransactions = generateMockTransactions();
            currentCard.recentOperations = mockTransactions;
            localStorage.setItem('investorCard', JSON.stringify(currentCard));
            
            mockTransactions.forEach(transaction => {
                const transactionElement = createTransactionElement(transaction);
                transactionsList.appendChild(transactionElement);
            });
        }
    }

    // Generate mock transactions if none exist
    function generateMockTransactions() {
        const transactions = [];
        const today = new Date();
        
        // Investment transaction
        transactions.push({
            id: generateId(),
            type: 'investment',
            amount: currentCard.totalInvestment || 4000,
            date: new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 days ago
            status: 'completed',
            description: 'استثمار أولي'
        });
        
        // Generate multiple profit transactions for the past few months
        for (let i = 6; i > 0; i--) {
            transactions.push({
                id: generateId(),
                type: 'profit',
                amount: 500 + Math.random() * 300,
                date: new Date(today.getTime() - i * 30 * 24 * 60 * 60 * 1000).toISOString(), // i months ago
                status: 'completed',
                description: 'أرباح شهرية'
            });
        }
        
        // Add a withdrawal transaction
        transactions.push({
            id: generateId(),
            type: 'withdrawal',
            amount: 800,
            date: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
            status: 'completed',
            description: 'سحب أرباح'
        });
        
        // Sort by date (newest first)
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Load filtered transactions
    function loadFilteredTransactions(filter) {
        const transactionsList = document.getElementById('filteredTransactionsList');
        transactionsList.innerHTML = '';
        
        // Activate the selected filter button
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.filter-btn[onclick="filterTransactions('${filter}')"]`).classList.add('active');
        
        // If we have recent operations in the card object
        if (currentCard.recentOperations && currentCard.recentOperations.length > 0) {
            // Sort operations by date (newest first)
            const sortedOperations = [...currentCard.recentOperations]
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Filter transactions based on selected filter
            let filteredOperations = sortedOperations;
            if (filter !== 'all') {
                filteredOperations = sortedOperations.filter(op => op.type === filter);
            }
            
            // Group transactions by date
            const groupedTransactions = groupTransactionsByDate(filteredOperations);
            
            // Display grouped transactions
            Object.keys(groupedTransactions).forEach(date => {
                // Add date header
                const dateHeader = document.createElement('div');
                dateHeader.className = 'transaction-date-header';
                dateHeader.textContent = date;
                transactionsList.appendChild(dateHeader);
                
                // Add transactions for this date
                groupedTransactions[date].forEach(transaction => {
                    const transactionElement = createTransactionElement(transaction);
                    transactionsList.appendChild(transactionElement);
                });
            });
            
            // If no transactions found for this filter
            if (filteredOperations.length === 0) {
                transactionsList.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); margin-top: 30px;">لا توجد معاملات لهذا النوع</p>';
            }
        } else {
            transactionsList.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); margin-top: 30px;">لا توجد معاملات</p>';
        }
    }

    // Group transactions by date
    function groupTransactionsByDate(transactions) {
        const groups = {};
        
        transactions.forEach(transaction => {
            const dateString = formatDate(transaction.date);
            
            if (!groups[dateString]) {
                groups[dateString] = [];
            }
            
            groups[dateString].push(transaction);
        });
        
        return groups;
    }

    // Filter transactions
    function filterTransactions(filter) {
        currentFilter = filter;
        loadFilteredTransactions(filter);
    }

    // Create transaction element
    function createTransactionElement(transaction) {
        const div = document.createElement('div');
        div.className = 'transaction-item';
        div.dataset.id = transaction.id || '';

        const icon = getTransactionIcon(transaction.type);
        const amount = transaction.amount;
        const isPositive = transaction.type === 'profit' || transaction.type === 'investment';
        
        // Extract time from date for display
        const transactionDate = new Date(transaction.date);
        const hours = transactionDate.getHours().toString().padStart(2, '0');
        const minutes = transactionDate.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}`;

        div.innerHTML = `
            <div class="transaction-icon">
                <i class="${icon}"></i>
            </div>
            <div class="transaction-info">
                <div class="transaction-type">${getTransactionTypeName(transaction.type)}</div>
                <div class="transaction-date">${formatDate(transaction.date)}</div>
            </div>
            <div style="text-align: left; direction: ltr;">
                <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                    ${isPositive ? '+' : '-'} ${formatCurrency(amount)}
                </div>
                <div class="transaction-time">${timeString}</div>
            </div>
        `;

        return div;
    }

    // Get transaction icon
    function getTransactionIcon(type) {
        switch (type) {
            case 'deposit':
            case 'investment':
                return 'fas fa-arrow-down';
            case 'withdrawal':
                return 'fas fa-arrow-up';
            case 'profit':
                return 'fas fa-hand-holding-usd';
            default:
                return 'fas fa-exchange-alt';
        }
    }

    // Get transaction type name
    function getTransactionTypeName(type) {
        switch (type) {
            case 'deposit':
                return 'إيداع';
            case 'investment':
                return 'استثمار';
            case 'withdrawal':
                return 'سحب';
            case 'profit':
                return 'أرباح';
            default:
                return type;
        }
    }

    // تحديث دالة تحميل الإشعارات لجلب البيانات الحقيقية من Firebase
    async function loadNotifications() {
        const notificationsList = document.getElementById('notificationsList');
        notificationsList.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); margin-top: 30px;">جاري تحميل الإشعارات...</p>';
        
        try {
            // مسار الإشعارات للمستثمر الحالي في Firebase
            // مسار الإشعارات الصحيح يستخدم معرف المستخدم وبطاقة المستثمر
            const investorId = currentInvestor?.id || '';
            const cardId = currentCard?.id || '';
            
            // تحقق من صحة المعرفات قبل الاستمرار
            if (!investorId || !cardId) {
                console.error('معرفات المستثمر أو البطاقة غير متوفرة');
                notificationsList.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); margin-top: 30px;">لا يمكن تحميل الإشعارات، الرجاء إعادة تسجيل الدخول</p>';
                return;
            }
            
            // الحصول على الإشعارات من Firebase - استخدام المسار الصحيح
            const notificationsRef = database.ref(`${NOTIFICATIONS_PATH}`);
            const snapshot = await notificationsRef.orderByChild('date').once('value');
            
            // إنشاء مصفوفة من الإشعارات
            const notificationsArray = [];
            snapshot.forEach(childSnapshot => {
                const notification = childSnapshot.val();
                // إضافة معرف الإشعار للاستخدام لاحقًا
                notification.id = childSnapshot.key;
                notificationsArray.push(notification);
            });
            
            // جلب العمليات الحالية وتحويلها إلى إشعارات
            const operationsRef = database.ref(`${OPERATIONS_PATH}`);
            const operationsSnapshot = await operationsRef.once('value');
            const operations = [];
            
            operationsSnapshot.forEach(childSnapshot => {
                const operation = childSnapshot.val();
                // إضافة معرف العملية
                operation.id = childSnapshot.key;
                operations.push(operation);
                
                // تحويل العملية إلى إشعار وإضافته إلى مصفوفة الإشعارات
                const notification = createNotificationFromOperation(operation);
                if (notification) {
                    notificationsArray.push(notification);
                }
            });
            
            // ترتيب الإشعارات حسب التاريخ (الأحدث أولاً)
            notifications = notificationsArray.sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });
            
            // عرض الإشعارات
            displayNotifications(notifications);
            
            // تحديث عدد الإشعارات غير المقروءة
            updateUnreadCount();
            
            // الاستماع للتغييرات في الإشعارات في الوقت الفعلي
            listenForNotificationChanges();
        } catch (error) {
            console.error('خطأ في تحميل الإشعارات:', error);
            notificationsList.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); margin-top: 30px;">حدث خطأ في تحميل الإشعارات</p>';
        }
    }

    // دالة لعرض الإشعارات
    function displayNotifications(notificationsArray) {
        const notificationsList = document.getElementById('notificationsList');
        notificationsList.innerHTML = '';
        
        if (notificationsArray.length === 0) {
            notificationsList.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); margin-top: 30px;">لا توجد إشعارات</p>';
            return;
        }
        
        // عرض كل إشعار
        notificationsArray.forEach(notification => {
            const notificationElement = createNotificationElement(notification);
            notificationsList.appendChild(notificationElement);
        });
    }

    // تحديث دالة تحويل العملية إلى إشعار
    function createNotificationFromOperation(operation) {
        if (!operation || !operation.type) return null;
        
        // تخصيص عنوان الإشعار ونص الرسالة حسب نوع العملية
        let title = '';
        let message = '';
        let notificationType = operation.type;
        
        switch (operation.type) {
            case 'investment':
            case 'deposit':
                title = 'استثمار جديد';
                message = `تم إضافة استثمار جديد بقيمة ${formatCurrency(operation.amount)}`;
                if (operation.notes) {
                    message += `. ${operation.notes}`;
                }
                break;
            case 'withdrawal':
                title = 'طلب سحب';
                message = `تم تسجيل طلب سحب بقيمة ${formatCurrency(operation.amount)}`;
                if (operation.status === 'pending') {
                    message += `. الطلب قيد المراجعة`;
                } else if (operation.status === 'completed') {
                    message += `. تمت الموافقة على الطلب`;
                } else if (operation.status === 'rejected') {
                    message += `. تم رفض الطلب`;
                }
                break;
            case 'profit':
                title = 'أرباح جديدة';
                message = `تم إضافة أرباح بقيمة ${formatCurrency(operation.amount)} إلى حسابك`;
                if (operation.notes) {
                    message += `. ${operation.notes}`;
                }
                break;
            case 'system':
                title = 'إشعار نظام';
                message = operation.message || 'إشعار من النظام';
                break;
            default:
                title = 'إشعار جديد';
                message = operation.message || `تم تسجيل عملية جديدة بقيمة ${formatCurrency(operation.amount || 0)}`;
                if (operation.notes) {
                    message += `. ${operation.notes}`;
                }
                break;
        }
        
        // إنشاء كائن الإشعار
        return {
            id: operation.id || generateId(),
            title: title,
            message: message,
            type: notificationType,
            read: false,
            date: operation.date || new Date().toISOString(),
            amount: operation.amount,
            status: operation.status,
            operation: operation // تخزين العملية الأصلية للرجوع إليها عند الحاجة
        };
    }

    // تحديث دالة إنشاء عنصر الإشعار
    function createNotificationElement(notification) {
        const div = document.createElement('div');
        div.className = `notification-item ${notification.read ? '' : 'unread'} ${Date.now() - new Date(notification.date) < 3600000 ? 'new-notification' : ''}`;
        div.dataset.id = notification.id;
        
        const icon = getNotificationIcon(notification.type);
        
        let statusHTML = '';
        if (notification.status) {
            let statusClass = notification.status;
            let statusText = 'قيد المراجعة';
            
            if (notification.status === 'completed') {
                statusText = 'مكتمل';
            } else if (notification.status === 'rejected') {
                statusText = 'مرفوض';
            } else if (notification.status === 'active') {
                statusText = 'نشط';
            }
            
            statusHTML = `<div class="notification-status ${statusClass}">الحالة: ${statusText}</div>`;
        }
        
        div.innerHTML = `
            <div class="notification-icon">
                <i class="${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                ${notification.amount ? `<div class="notification-amount">${formatCurrency(notification.amount)}</div>` : ''}
                ${statusHTML}
                <div class="notification-date">${formatDate(notification.date)} - ${formatTime(notification.date)}</div>
            </div>
        `;
        
        // إضافة حدث النقر لعرض تفاصيل الإشعار
        div.addEventListener('click', () => {
            markNotificationAsRead(notification.id);
            div.classList.remove('unread');
            openNotificationDetails(notification);
        });
        
        return div;
    }

    // دالة للاستماع للتغييرات في الإشعارات في الوقت الفعلي
    function listenForNotificationChanges() {
        // الاستماع للإشعارات الجديدة
        const notificationsRef = database.ref(`${NOTIFICATIONS_PATH}`);
        notificationsRef.off(); // إزالة المستمعين السابقين
        
        notificationsRef.on('child_added', (snapshot) => {
            const newNotification = snapshot.val();
            if (newNotification) {
                newNotification.id = snapshot.key;
                
                // التحقق من عدم وجود الإشعار مسبقًا
                const existingIndex = notifications.findIndex(n => n.id === newNotification.id);
                if (existingIndex === -1) {
                    // إضافة الإشعار الجديد إلى القائمة
                    notifications.unshift(newNotification);
                    
                    // إعادة عرض الإشعارات إذا كان قسم الإشعارات مفتوحًا
                    if (document.getElementById('notificationsSection').style.display === 'block') {
                        displayNotifications(notifications);
                    } else {
                        // إظهار مؤشر على وجود إشعارات جديدة
                        showNotificationIndicator();
                    }
                    
                    // تحديث عدد الإشعارات غير المقروءة
                    updateUnreadCount();
                }
            }
        });
        
        // الاستماع لتحديثات الإشعارات
        notificationsRef.on('child_changed', (snapshot) => {
            const updatedNotification = snapshot.val();
            if (updatedNotification) {
                updatedNotification.id = snapshot.key;
                
                // تحديث الإشعار في القائمة
                const existingIndex = notifications.findIndex(n => n.id === updatedNotification.id);
                if (existingIndex !== -1) {
                    notifications[existingIndex] = updatedNotification;
                    
                    // إعادة عرض الإشعارات إذا كان قسم الإشعارات مفتوحًا
                    if (document.getElementById('notificationsSection').style.display === 'block') {
                        displayNotifications(notifications);
                    }
                    
                    // تحديث عدد الإشعارات غير المقروءة
                    updateUnreadCount();
                }
            }
        });
        
        // الاستماع لحذف الإشعارات
        notificationsRef.on('child_removed', (snapshot) => {
            const removedId = snapshot.key;
            
            // حذف الإشعار من القائمة
            notifications = notifications.filter(n => n.id !== removedId);
            
            // إعادة عرض الإشعارات إذا كان قسم الإشعارات مفتوحًا
            if (document.getElementById('notificationsSection').style.display === 'block') {
                displayNotifications(notifications);
            }
            
            // تحديث عدد الإشعارات غير المقروءة
            updateUnreadCount();
        });
        
        // الاستماع للعمليات الجديدة
        const operationsRef = database.ref(`${OPERATIONS_PATH}`);
        operationsRef.off(); // إزالة المستمعين السابقين
        
        operationsRef.on('child_added', (snapshot) => {
            const newOperation = snapshot.val();
            if (newOperation) {
                newOperation.id = snapshot.key;
                
                // إنشاء إشعار من العملية
                const newNotification = createNotificationFromOperation(newOperation);
                if (newNotification) {
                    // التحقق من عدم وجود الإشعار مسبقًا
                    const existingIndex = notifications.findIndex(n => n.id === newNotification.id);
                    if (existingIndex === -1) {
                        // إضافة الإشعار الجديد إلى القائمة
                        notifications.unshift(newNotification);
                        
                        // إعادة عرض الإشعارات إذا كان قسم الإشعارات مفتوحًا
                        if (document.getElementById('notificationsSection').style.display === 'block') {
                            displayNotifications(notifications);
                        } else {
                            // إظهار مؤشر على وجود إشعارات جديدة
                            showNotificationIndicator();
                        }
                        
                        // تحديث عدد الإشعارات غير المقروءة
                        updateUnreadCount();
                    }
                }
            }
        });
    }

    // تحديث دالة وضع علامة "مقروء" على الإشعار
    async function markNotificationAsRead(notificationId) {
        // التحقق من وجود الإشعار
        const notificationIndex = notifications.findIndex(n => n.id === notificationId);
        if (notificationIndex === -1) return;
        
        // تحديث حالة الإشعار في المصفوفة
        notifications[notificationIndex].read = true;
        
        try {
            // تحديث حالة الإشعار في Firebase - استخدام المسار الصحيح
            await database.ref(`${NOTIFICATIONS_PATH}/${notificationId}`).update({ read: true });
            
            // تحديث عدد الإشعارات غير المقروءة
            updateUnreadCount();
        } catch (error) {
            console.error('خطأ في تحديث حالة الإشعار:', error);
        }
    }

    // دالة لإظهار مؤشر على وجود إشعارات جديدة
    function showNotificationIndicator() {
        const notificationNav = document.querySelector('.nav-item[onclick="switchSection(\'notifications\')"]');
        if (notificationNav) {
            // إضافة نقطة حمراء صغيرة لتنبيه المستخدم بوجود إشعارات جديدة
            if (!notificationNav.querySelector('.notification-indicator')) {
                const indicator = document.createElement('div');
                indicator.className = 'notification-indicator';
                indicator.style.cssText = `
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    width: 8px;
                    height: 8px;
                    background-color: var(--red);
                    border-radius: 50%;
                `;
                notificationNav.appendChild(indicator);
                notificationNav.style.position = 'relative';
            }
        }
    }

    // تحديث دالة تحديد عدد الإشعارات غير المقروءة
    function updateUnreadCount() {
        const unreadCount = notifications.filter(notification => !notification.read).length;
        
        const notificationNav = document.querySelector('.nav-item[onclick="switchSection(\'notifications\')"]');
        const countBadge = notificationNav.querySelector('.notification-count');
        
        if (unreadCount > 0) {
            if (countBadge) {
                countBadge.textContent = unreadCount;
            } else {
                const badge = document.createElement('div');
                badge.className = 'notification-count';
                badge.textContent = unreadCount;
                badge.style.cssText = `
                    position: absolute;
                    top: 0;
                    right: 0;
                    min-width: 16px;
                    height: 16px;
                    background-color: var(--red);
                    border-radius: 8px;
                    color: white;
                    font-size: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 4px;
                `;
                notificationNav.appendChild(badge);
                notificationNav.style.position = 'relative';
            }
        } else if (countBadge) {
            countBadge.remove();
        }
    }

    // تحديث دالة تنسيق الوقت
    function formatTime(dateString) {
        const date = new Date(dateString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // تحديث switchSection لتحديث قراءة الإشعارات عند الانتقال إلى قسم الإشعارات
    function switchSection(section) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`.nav-item[onclick="switchSection('${section}')"]`).classList.add('active');
        
        // تغيير عنوان الصفحة
        updateSectionTitle(section);
        
        // Hide all sections
        document.getElementById('homeSection').style.display = 'none';
        document.getElementById('cardSection').style.display = 'none';
        document.getElementById('profileSection').style.display = 'none';
        document.getElementById('transactionsSection').style.display = 'none';
        document.getElementById('notificationsSection').style.display = 'none';
        
        // Show the selected section
        if (section === 'home') {
            document.getElementById('homeSection').style.display = 'block';
            // تحديث المشاريع والمعلومات في الصفحة الرئيسية
            updateHomeDisplay();
        } else if (section === 'card') {
            document.getElementById('cardSection').style.display = 'block';
            // تحديث النشاطات الأخيرة في صفحة البطاقة
            loadRecentActivities();
        } else if (section === 'profile') {
            document.getElementById('profileSection').style.display = 'block';
        } else if (section === 'transactions') {
            document.getElementById('transactionsSection').style.display = 'block';
            // Make sure transactions are loaded with current filter
            loadFilteredTransactions(currentFilter);
        } else if (section === 'notifications') {
            document.getElementById('notificationsSection').style.display = 'block';
            // Make sure notifications are loaded
            loadNotifications();
            
            // تحديث قراءة الإشعارات وإزالة المؤشر
            const notificationNav = document.querySelector('.nav-item[onclick="switchSection(\'notifications\')"]');
            const indicator = notificationNav.querySelector('.notification-indicator');
            if (indicator) {
                indicator.remove();
            }
            
            // تحديث حالة القراءة للإشعارات المعروضة
            const notificationItems = document.querySelectorAll('#notificationsList .notification-item.unread');
            notificationItems.forEach(item => {
                const notificationId = item.dataset.id;
                if (notificationId) {
                    markNotificationAsRead(notificationId);
                    item.classList.remove('unread');
                }
            });
            
            // تحديث عدد الإشعارات غير المقروءة
            updateUnreadCount();
        }
    }

    // تحديث عرض الصفحة الرئيسية
    function updateHomeDisplay() {
        // تحديث النشاطات الأخيرة
        loadRecentActivities();
        
        // تحديث معلومات المستخدم
        updateHomeUserInfo();
    }

    // تحديث عنوان الصفحة
    function updateSectionTitle(section) {
        const titleElement = document.getElementById('sectionTitle');
        
        switch (section) {
            case 'home':
                titleElement.textContent = 'مشاريع الاستثمار';
                break;
            case 'card':
                titleElement.textContent = 'بطاقة المستثمر';
                break;
            case 'profile':
                titleElement.textContent = 'الملف الشخصي';
                break;
            case 'transactions':
                titleElement.textContent = 'سجل المعاملات';
                break;
            case 'notifications':
                titleElement.textContent = 'الإشعارات';
                break;
            default:
                titleElement.textContent = 'سما بابل للاستثمار';
        }
    }

    // إضافة دالة لفتح نافذة تفاصيل الإشعار
    function openNotificationDetails(notification) {
        // التأكد من وجود النافذة المنبثقة في الصفحة
        const modal = document.getElementById('notificationDetailsModal');
        const modalTitle = document.getElementById('notificationDetailsTitle');
        const modalContent = document.getElementById('notificationDetailsContent');
        
        if (!modal || !modalTitle || !modalContent) {
            console.error('عناصر نافذة تفاصيل الإشعار غير موجودة');
            return;
        }
        
        // تعيين عنوان النافذة
        modalTitle.textContent = notification.title;
        
        // تحديد نوع المحتوى بناءً على نوع الإشعار
        let detailsContent = '';
        
        if (notification.operation) {
            const operation = notification.operation;
            
            switch (operation.type) {
                case 'investment':
                case 'deposit':
                    detailsContent = `
                        <div class="detail-item">
                            <div class="detail-label">المبلغ المستثمر</div>
                            <div class="detail-value">${formatCurrency(operation.amount)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">تاريخ الاستثمار</div>
                            <div class="detail-value">${formatDate(operation.date)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">الحالة</div>
                            <div class="detail-value">${operation.status === 'active' ? 'نشط' : operation.status === 'completed' ? 'مكتمل' : 'قيد المراجعة'}</div>
                        </div>
                    `;
                    break;
                case 'withdrawal':
                    detailsContent = `
                        <div class="detail-item">
                            <div class="detail-label">المبلغ المسحوب</div>
                            <div class="detail-value">${formatCurrency(operation.amount)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">تاريخ الطلب</div>
                            <div class="detail-value">${formatDate(operation.date)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">طريقة الاستلام</div>
                            <div class="detail-value">${operation.method === 'cash' ? 'نقداً' : operation.method === 'bank_transfer' ? 'حوالة بنكية' : 'محفظة إلكترونية'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">الحالة</div>
                            <div class="detail-value">${operation.status === 'completed' ? 'مكتمل' : operation.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}</div>
                        </div>
                    `;
                    break;
                case 'profit':
                    detailsContent = `
                        <div class="detail-item">
                            <div class="detail-label">مبلغ الربح</div>
                            <div class="detail-value">${formatCurrency(operation.amount)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">تاريخ الإضافة</div>
                            <div class="detail-value">${formatDate(operation.date)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">الفترة</div>
                            <div class="detail-value">${operation.period || 'غير محدد'}</div>
                        </div>
                    `;
                    break;
                default:
                    detailsContent = `
                        <div class="detail-item">
                            <div class="detail-label">التاريخ</div>
                            <div class="detail-value">${formatDate(operation.date)}</div>
                        </div>
                        <div class="detail-label">الوصف</div>
                            <div class="detail-value">${operation.description || 'غير متوفر'}</div>
                        </div>
                    `;
            }
        } else {
            detailsContent = `
                <div class="detail-item">
                    <div class="detail-label">التاريخ</div>
                    <div class="detail-value">${formatDate(notification.date)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">الوصف</div>
                    <div class="detail-value">${notification.message}</div>
                </div>
            `;
        }
        
        // إضافة المحتوى إلى النافذة
        modalContent.innerHTML = detailsContent;
        
        // عرض النافذة
        modal.classList.add('active');
    }

    // إغلاق نافذة تفاصيل الإشعار
    function closeNotificationDetailsModal() {
        const modal = document.getElementById('notificationDetailsModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // وظائف إدارة المشاريع والتصنيفات
    
    // تحميل التصنيفات من Firebase
    async function loadCategories() {
        try {
            const categoriesRef = database.ref(CATEGORIES_PATH);
            const snapshot = await categoriesRef.once('value');
            
            if (snapshot.exists()) {
                // تحويل البيانات إلى مصفوفة
                categories = [];
                snapshot.forEach(childSnapshot => {
                    categories.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                
                console.log('تم تحميل التصنيفات:', categories);
                
                // عرض التصنيفات في واجهة المستخدم
                updateCategoriesUI();
            } else {
                console.log('لا توجد تصنيفات، سيتم إنشاء التصنيفات الافتراضية');
                
                // إنشاء التصنيفات الافتراضية
                createDefaultCategories();
            }
        } catch (error) {
            console.error('خطأ في تحميل التصنيفات:', error);
            
            // استخدام بيانات افتراضية في حالة الخطأ
            createDefaultCategories();
        }
    }
    
    // إنشاء تصنيفات افتراضية
    async function createDefaultCategories() {
        const defaultCategories = [
            { id: 'real-estate', name: 'مشاريع عقارية' },
            { id: 'agriculture', name: 'مشاريع زراعية' },
            { id: 'industrial', name: 'مشاريع صناعية' }
        ];
        
        categories = defaultCategories;
        
        try {
            // حفظ التصنيفات الافتراضية في Firebase
            const categoriesRef = database.ref(CATEGORIES_PATH);
            
            for (const category of defaultCategories) {
                await categoriesRef.child(category.id).set({
                    name: category.name,
                    created_at: new Date().toISOString()
                });
            }
            
            console.log('تم إنشاء التصنيفات الافتراضية');
            
            // عرض التصنيفات في واجهة المستخدم
            updateCategoriesUI();
        } catch (error) {
            console.error('خطأ في إنشاء التصنيفات الافتراضية:', error);
        }
    }
    
    // تحديث واجهة المستخدم بالتصنيفات
    function updateCategoriesUI() {
        // تحديث التصنيفات في الصفحة الرئيسية
        const categoriesContainer = document.getElementById('projectCategories');
        if (categoriesContainer) {
            // حفظ التصنيف النشط الحالي
            const activeCategory = categoriesContainer.querySelector('.filter-tab.active')?.dataset.category || 'all';
            
            // مسح التصنيفات الحالية مع الاحتفاظ بزر "الكل"
            categoriesContainer.innerHTML = `
                <div class="filter-tab ${activeCategory === 'all' ? 'active' : ''}" data-category="all" onclick="filterProjects('all')">الكل</div>
            `;
            
            // إضافة التصنيفات من المصفوفة
            categories.forEach(category => {
                const categoryTab = document.createElement('div');
                categoryTab.className = `filter-tab ${activeCategory === category.id ? 'active' : ''}`;
                categoryTab.dataset.category = category.id;
                categoryTab.textContent = category.name;
                categoryTab.onclick = function() { filterProjects(category.id); };
                categoriesContainer.appendChild(categoryTab);
            });
        }
        
        // تحديث التصنيفات في نموذج إضافة مشروع جديد
        const projectCategorySelect = document.getElementById('projectCategory');
        if (projectCategorySelect) {
            projectCategorySelect.innerHTML = '';
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                projectCategorySelect.appendChild(option);
            });
        }
        
        // تحديث التصنيفات في نموذج تعديل مشروع
        const editProjectCategorySelect = document.getElementById('editProjectCategory');
        if (editProjectCategorySelect) {
            editProjectCategorySelect.innerHTML = '';
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                editProjectCategorySelect.appendChild(option);
            });
        }
    }
    
    // تحميل المشاريع من Firebase
    async function loadProjects() {
        try {
            const projectsRef = database.ref(PROJECTS_PATH);
            const snapshot = await projectsRef.once('value');
            
            if (snapshot.exists()) {
                // تحويل البيانات إلى مصفوفة
                projects = [];
                snapshot.forEach(childSnapshot => {
                    projects.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                
                console.log('تم تحميل المشاريع:', projects);
                
                // عرض المشاريع في واجهة المستخدم
                displayProjects();
            } else {
                console.log('لا توجد مشاريع، سيتم إنشاء المشاريع الافتراضية');
                
                // إنشاء المشاريع الافتراضية
                createDefaultProjects();
            }
        } catch (error) {
            console.error('خطأ في تحميل المشاريع:', error);
            
            // استخدام بيانات افتراضية في حالة الخطأ
            createDefaultProjects();
        }
    }
    
    // إنشاء مشاريع افتراضية
    async function createDefaultProjects() {
        const defaultProjects = [
            {
                id: 'residential',
                title: 'مجمع سكني',
                category: 'real-estate',
                description: 'مشروع سكني متميز يضم شققاً مفروشة في موقع استراتيجي بالقرب من مركز المدينة. يتكون المشروع من 32 وحدة سكنية فاخرة مجهزة بأحدث التقنيات والتصاميم العصرية.',
                return: '15-20% سنوياً',
                duration: '3-5 سنوات',
                minInvestment: '5,000 د.ع',
                totalValue: '1,500,000 د.ع',
                features: [
                    'موقع استراتيجي بالقرب من مركز المدينة',
                    'تشطيبات فاخرة وتصاميم عصرية',
                    'خدمات متكاملة للسكان',
                    'عوائد مضمونة من الإيجارات'
                ],
                imageUrl: 'https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_1280.jpg',
                icon: 'building'
            },
            {
                id: 'farm',
                title: 'مزرعة زراعية',
                category: 'agriculture',
                description: 'مشروع زراعي متكامل لزراعة وإنتاج المحاصيل الاستراتيجية على مساحة 500 دونم من الأراضي الخصبة. يعتمد المشروع على أحدث التقنيات الزراعية وأنظمة الري الحديثة.',
                return: '18-25% سنوياً',
                duration: '2-4 سنوات',
                minInvestment: '3,000 د.ع',
                totalValue: '800,000 د.ع',
                features: [
                    'القمح والشعير',
                    'الخضروات الموسمية',
                    'النخيل وأشجار الفاكهة'
                ],
                imageUrl: 'https://cdn.pixabay.com/photo/2016/09/21/04/46/agriculture-landscape-1684052_1280.jpg',
                icon: 'seedling'
            },
            {
                id: 'factory',
                title: 'مصنع إنتاج',
                category: 'industrial',
                description: 'مشروع صناعي متخصص في إنتاج وتصنيع المنتجات المعدنية والإنشائية لتلبية احتياجات السوق المحلي والإقليمي. يعتمد المصنع على خطوط إنتاج حديثة وتقنيات متطورة.',
                return: '20-30% سنوياً',
                duration: '5-7 سنوات',
                minInvestment: '10,000 د.ع',
                totalValue: '3,000,000 د.ع',
                features: [
                    'هياكل معدنية للبناء',
                    'أنابيب وملحقات معدنية',
                    'منتجات الألمنيوم'
                ],
                imageUrl: 'https://cdn.pixabay.com/photo/2020/06/09/13/09/factory-5278865_1280.jpg',
                icon: 'industry'
            }
        ];
        
        projects = defaultProjects;
        
        try {
            // حفظ المشاريع الافتراضية في Firebase
            const projectsRef = database.ref(PROJECTS_PATH);
            
            for (const project of defaultProjects) {
                const projectId = project.id;
                delete project.id; // حذف الـ ID من الكائن قبل الحفظ
                
                await projectsRef.child(projectId).set({
                    ...project,
                    created_at: new Date().toISOString()
                });
            }
            
            console.log('تم إنشاء المشاريع الافتراضية');
            
            // عرض المشاريع في واجهة المستخدم
            displayProjects();
        } catch (error) {
            console.error('خطأ في إنشاء المشاريع الافتراضية:', error);
        }
    }
    
    // عرض المشاريع في واجهة المستخدم
    function displayProjects() {
        const projectsGrid = document.getElementById('projectsGrid');
        if (!projectsGrid) return;
        
        // الحصول على التصنيف النشط
        const activeCategory = document.querySelector('.filter-tab.active')?.dataset.category || 'all';
        
        // فلترة المشاريع حسب التصنيف
        let filteredProjects = projects;
        if (activeCategory !== 'all') {
            filteredProjects = projects.filter(project => project.category === activeCategory);
        }
        
        if (filteredProjects.length === 0) {
            projectsGrid.innerHTML = '<p style="text-align: center; color: var(--text-light); margin-top: 30px;">لا توجد مشاريع متاحة في هذا التصنيف</p>';
            return;
        }
        
        // مسح المحتوى الحالي
        projectsGrid.innerHTML = '';
        
        // عرض المشاريع
        filteredProjects.forEach(project => {
            const projectElement = createProjectElement(project);
            projectsGrid.appendChild(projectElement);
        });
    }
    
    // إنشاء عنصر مشروع
    function createProjectElement(project) {
        const div = document.createElement('div');
        div.className = 'project-card';
        div.dataset.id = project.id;
        div.dataset.category = project.category;
        
        // تحديد أيقونة المشروع المناسبة
        let iconClass = 'fas fa-building';
        switch (project.icon) {
            case 'seedling':
                iconClass = 'fas fa-seedling';
                break;
            case 'industry':
                iconClass = 'fas fa-industry';
                break;
            case 'shopping-cart':
                iconClass = 'fas fa-shopping-cart';
                break;
            case 'truck':
                iconClass = 'fas fa-truck';
                break;
            case 'medkit':
                iconClass = 'fas fa-medkit';
                break;
            case 'graduation-cap':
                iconClass = 'fas fa-graduation-cap';
                break;
            case 'hotel':
                iconClass = 'fas fa-hotel';
                break;
            case 'solar-panel':
                iconClass = 'fas fa-solar-panel';
                break;
            case 'coins':
                iconClass = 'fas fa-coins';
                break;
        }
        
        // إضافة أزرار التحرير والحذف في وضع المشرف
        let adminButtons = '';
        if (isProjectEditMode) {
            adminButtons = `
                <div class="admin-actions">
                    <div class="admin-btn edit" onclick="editProject('${project.id}')">
                        <i class="fas fa-edit"></i>
                    </div>
                    <div class="admin-btn delete" onclick="confirmDeleteProject('${project.id}')">
                        <i class="fas fa-trash-alt"></i>
                    </div>
                </div>
            `;
        }
        
        div.innerHTML = `
            ${adminButtons}
            <div class="project-image" style="background-image: url('${project.imageUrl}');">
                <div class="project-avatar">
                    <i class="${iconClass}"></i>
                </div>
            </div>
            <div class="project-content">
                <div class="project-title">${project.title}</div>
                <div class="project-description">${shortenText(project.description, 100)}</div>
            </div>
        `;
        
        // إضافة حدث النقر لفتح تفاصيل المشروع
        div.addEventListener('click', function(event) {
            // تجنب فتح التفاصيل عند النقر على أزرار الإدارة
            if (event.target.closest('.admin-actions')) {
                return;
            }
            
            showProjectDetails(project.id);
        });
        
        return div;
    }
    
    // تصفية المشاريع حسب الفئة
    function filterProjects(category) {
        // تحديد زر التصفية النشط
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`.filter-tab[data-category="${category}"]`).classList.add('active');
        
        // عرض المشاريع المفلترة
        displayProjects();
    }
    
    // البحث في المشاريع
    function searchProjects(query) {
        if (!query) {
            // إذا كان البحث فارغاً، عرض جميع المشاريع حسب التصفية الحالية
            displayProjects();
            return;
        }
        
        // تحويل البحث إلى أحرف صغيرة للمقارنة دون حساسية للحالة
        query = query.toLowerCase();
        
        // البحث في العنوان والوصف
        const searchResults = projects.filter(project => {
            return project.title.toLowerCase().includes(query) || 
                   project.description.toLowerCase().includes(query);
        });
        
        // عرض نتائج البحث
        const projectsGrid = document.getElementById('projectsGrid');
        if (!projectsGrid) return;
        
        if (searchResults.length === 0) {
            projectsGrid.innerHTML = '<p style="text-align: center; color: var(--text-light); margin-top: 30px;">لا توجد نتائج مطابقة للبحث</p>';
            return;
        }
        
        // مسح المحتوى الحالي
        projectsGrid.innerHTML = '';
        
        // عرض نتائج البحث
        searchResults.forEach(project => {
            const projectElement = createProjectElement(project);
            projectsGrid.appendChild(projectElement);
        });
    }
    
    // عرض تفاصيل المشروع
    function showProjectDetails(projectId) {
        // العثور على المشروع بواسطة المعرف
        const project = projects.find(p => p.id === projectId);
        if (!project) {
            console.error('المشروع غير موجود:', projectId);
            return;
        }
        
        // تخزين معرف المشروع الحالي
        currentProject = projectId;
        
        const modal = document.getElementById('projectDetailsModal');
        const modalTitle = document.getElementById('projectDetailsTitle');
        const modalContent = document.getElementById('projectDetailsContent');
        
        // تعيين العنوان والمحتوى
        modalTitle.textContent = project.title;
        
        // تحويل القائمة إلى HTML
        let featuresList = '';
        if (project.features && project.features.length > 0) {
            featuresList = '<ul style="list-style-type: none; padding: 0;">';
            project.features.forEach(feature => {
                featuresList += `<li style="margin-bottom: 8px; color: var(--text-light);"><i class="fas fa-check" style="color: var(--gold); margin-left: 8px;"></i> ${feature}</li>`;
            });
            featuresList += '</ul>';
        }
        
        modalContent.innerHTML = `
            <div style="margin-bottom: 15px;">
                <img src="${project.imageUrl}" style="width: 100%; border-radius: 10px; margin-bottom: 15px;">
                <p style="color: var(--text-light); line-height: 1.6; margin-bottom: 20px;">
                    ${project.description}
                </p>
            </div>
            
            <div class="account-details" style="margin-bottom: 20px;">
                <div class="detail-item">
                    <div class="detail-label">العائد المتوقع</div>
                    <div class="detail-value">${project.return}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">مدة الاستثمار</div>
                    <div class="detail-value">${project.duration}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">الحد الأدنى للاستثمار</div>
                    <div class="detail-value">${project.minInvestment}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">القيمة الإجمالية للمشروع</div>
                    <div class="detail-value">${project.totalValue || 'غير محدد'}</div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: var(--gold); margin-bottom: 10px;">مميزات المشروع</h3>
                ${featuresList}
            </div>
        `;
        
        // عرض النافذة
        modal.classList.add('active');
    }
    
    // إغلاق نافذة تفاصيل المشروع
    function closeProjectDetailsModal() {
        const modal = document.getElementById('projectDetailsModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    // التقدم للاستثمار في المشروع
    function applyForProject() {
        // العثور على المشروع بواسطة المعرف
        const project = projects.find(p => p.id === currentProject);
        if (!project) {
            console.error('المشروع غير موجود:', currentProject);
            return;
        }
        
        // عرض رسالة نجاح
        createNotification(
            'تم تقديم الطلب',
            'تم استلام طلب الاستثمار بنجاح وسيتم التواصل معك قريباً',
            'success'
        );
        
        // إغلاق النافذة المنبثقة
        closeProjectDetailsModal();
        
        // إنشاء إشعار للمستخدم
        const notification = {
            id: generateId(),
            title: 'طلب استثمار جديد',
            message: `تم استلام طلب الاستثمار في ${project.title} بنجاح وسيتم مراجعته قريباً`,
            type: 'investment',
            read: false,
            date: new Date().toISOString(),
            status: 'pending'
        };
        
        // إضافة الإشعار إلى المصفوفة
        notifications.unshift(notification);
        
        // تحديث عدد الإشعارات غير المقروءة وإظهار المؤشر
        updateUnreadCount();
        showNotificationIndicator();
        
        // حفظ الإشعار في Firebase
        database.ref(`${NOTIFICATIONS_PATH}/${notification.id}`).set(notification)
            .catch(error => console.error('خطأ في حفظ الإشعار:', error));
        
        // استخراج قيمة الاستثمار
        const investmentAmount = parseFloat(project.minInvestment.replace(/[^\d.]/g, ''));
        
        // إنشاء عملية استثمار جديدة
        const operation = {
            id: generateId(),
            type: 'investment',
            amount: investmentAmount,
            date: new Date().toISOString(),
            status: 'pending',
            description: `استثمار في ${project.title}`,
            investorId: currentInvestor.id,
            investorName: currentInvestor.name,
            projectId: project.id,
            projectTitle: project.title
        };
        
        // حفظ العملية في Firebase
        database.ref(`${OPERATIONS_PATH}/${operation.id}`).set(operation)
            .catch(error => console.error('خطأ في حفظ العملية:', error));
        
        // إضافة العملية إلى مصفوفة العمليات
        if (!currentCard.recentOperations) {
            currentCard.recentOperations = [];
        }
        
        currentCard.recentOperations.unshift(operation);
        localStorage.setItem('investorCard', JSON.stringify(currentCard));
        
        // تحديث النشاطات الأخيرة
        loadRecentActivities();
    }
    
    // وظائف إدارة المشاريع
    
    // التحقق من حقوق المشرف
    function checkAdminRights() {
        // في البيئة الحقيقية، يمكن التحقق من حقوق المستخدم عبر Firebase Authentication
        // لغرض الاختبار، سنضع مفتاح في localStorage لتفعيل ميزات المشرف
        
        isAdminMode = localStorage.getItem('adminMode') === 'true';
        toggleAdminUI(isAdminMode);
    }
    
    // تبديل وضع المشرف
    function toggleAdminMode() {
        isAdminMode = !isAdminMode;
        localStorage.setItem('adminMode', isAdminMode);
        
        // عرض/إخفاء عناصر واجهة المشرف
        toggleAdminUI(isAdminMode);
        
        // عرض القائمة المنسدلة
        const adminDropdown = document.getElementById('adminDropdown');
        if (adminDropdown) {
            adminDropdown.classList.toggle('active', isAdminMode);
        }
        
        // تحديث حالة مفتاح التبديل
        const adminSwitch = document.getElementById('adminModeSwitch');
        if (adminSwitch) {
            adminSwitch.classList.toggle('active', isAdminMode);
        }
    }
    
    // تبديل عناصر واجهة المشرف
    function toggleAdminUI(isAdmin) {
        // عرض/إخفاء زر إضافة مشروع
        const addProjectBtn = document.getElementById('addProjectBtn');
        if (addProjectBtn) {
            addProjectBtn.style.display = isAdmin ? 'flex' : 'none';
        }
        
        // عرض/إخفاء مفتاح وضع المشرف
        const adminSwitch = document.getElementById('adminModeSwitch');
        if (adminSwitch) {
            adminSwitch.style.display = isAdmin ? 'flex' : 'none';
            adminSwitch.classList.toggle('active', isAdmin);
        }
        
        // عرض/إخفاء زر إضافة تصنيف
        const categoriesAction = document.getElementById('categoriesAction');
        if (categoriesAction) {
            categoriesAction.style.display = isAdmin ? 'flex' : 'none';
        }
    }
    
    // تبديل وضع تحرير المشاريع
    function toggleProjectEditMode() {
        isProjectEditMode = !isProjectEditMode;
        
        // إغلاق القائمة المنسدلة
        document.getElementById('adminDropdown').classList.remove('active');
        
        // إعادة عرض المشاريع مع/بدون أزرار التحرير
        displayProjects();
        
        // إظهار إشعار
        createNotification(
            isProjectEditMode ? 'وضع التحرير مفعل' : 'تم إلغاء وضع التحرير',
            isProjectEditMode ? 'يمكنك الآن تعديل أو حذف المشاريع' : 'تم إلغاء وضع تحرير المشاريع',
            'info'
        );
    }
    
    // فتح نافذة إضافة مشروع جديد
    function openAddProjectModal() {
        // مسح النموذج
        document.getElementById('addProjectForm').reset();
        
        // مسح معاينة الصورة
        const imagePreview = document.getElementById('projectImagePreview');
        imagePreview.style.backgroundImage = '';
        imagePreview.querySelector('.image-preview-text').style.display = 'flex';
        
        // مسح مميزات المشروع
        document.getElementById('projectFeatures').innerHTML = '';
        
        // مسح رسائل الخطأ والنجاح
        document.getElementById('addProjectError').style.display = 'none';
        document.getElementById('addProjectSuccess').style.display = 'none';
        
        // تحميل التصنيفات
        updateCategoriesUI();
        
        // إعادة تعيين ملف الصورة
        projectImageFile = null;
        
        // عرض النافذة
        document.getElementById('addProjectModal').classList.add('active');
    }
    
    // إغلاق نافذة إضافة مشروع جديد
    function closeAddProjectModal() {
        document.getElementById('addProjectModal').classList.remove('active');
    }
    
    // تشغيل محدد الصورة
    function triggerImageUpload() {
        document.getElementById('projectImageUpload').click();
    }
    
    // معاينة صورة المشروع المختارة
    function previewProjectImage(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const preview = document.getElementById('projectImagePreview');
                preview.style.backgroundImage = `url('${e.target.result}')`;
                preview.style.backgroundSize = 'cover';
                preview.style.backgroundPosition = 'center';
                preview.querySelector('.image-preview-text').style.display = 'none';
                
                // حفظ الملف للتحميل
                projectImageFile = input.files[0];
            };
            
            reader.readAsDataURL(input.files[0]);
        }
    }
    
    // تحميل صورة إلى Firebase Storage
    async function uploadProjectImage(imageFile, projectId) {
        if (!imageFile) {
            return null; // لا توجد صورة للتحميل
        }
        
        try {
            // إنشاء مسار التخزين للصورة
            const storageRef = storage.ref();
            const imageRef = storageRef.child(`projects/${projectId}/${Date.now()}_${imageFile.name}`);
            
            // تحميل الصورة
            const snapshot = await imageRef.put(imageFile);
            
            // الحصول على رابط التنزيل
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            return downloadURL;
        } catch (error) {
            console.error('خطأ في تحميل الصورة:', error);
            throw error;
        }
    }
    
    // إرسال مشروع جديد
    async function submitNewProject(event) {
        event.preventDefault();
        showLoading();
        
        try {
            // جمع بيانات المشروع من النموذج
            const title = document.getElementById('projectTitle').value;
            const category = document.getElementById('projectCategory').value;
            const returnValue = document.getElementById('projectReturn').value;
            const duration = document.getElementById('projectDuration').value;
            const minInvestment = document.getElementById('projectMinInvestment').value;
            const totalValue = document.getElementById('projectTotalValue').value;
            const description = document.getElementById('projectDescription').value;
            const featuresText = document.getElementById('projectFeatures').innerHTML;
            const icon = document.getElementById('projectIcon').value;
            
            // تحويل مميزات المشروع من HTML إلى مصفوفة
            const features = featuresText
                .split('<br>')
                .map(feature => feature.trim())
                .filter(feature => feature.length > 0);
            
            // التحقق من البيانات الإلزامية
            if (!title || !category || !returnValue || !duration || !minInvestment || !description) {
                throw new Error('يرجى ملء جميع الحقول الإلزامية');
            }
            
            // إنشاء معرف فريد للمشروع
            const projectId = generateId();
            
            // تحميل الصورة إذا تم اختيارها
            let imageUrl = 'https://cdn.pixabay.com/photo/2018/01/10/23/53/buildings-3075053_1280.jpg'; // صورة افتراضية
            
            if (projectImageFile) {
                imageUrl = await uploadProjectImage(projectImageFile, projectId);
            }
            
            // إنشاء كائن المشروع
            const project = {
                title,
                category,
                return: returnValue,
                duration,
                minInvestment,
                totalValue,
                description,
                features,
                imageUrl,
                icon,
                created_at: new Date().toISOString()
            };
            
            // حفظ المشروع في Firebase
            await database.ref(`${PROJECTS_PATH}/${projectId}`).set(project);
            
            // إضافة المشروع إلى المصفوفة المحلية
            projects.push({
                id: projectId,
                ...project
            });
            
            // عرض رسالة نجاح
            document.getElementById('addProjectSuccess').textContent = 'تم إضافة المشروع بنجاح!';
            document.getElementById('addProjectSuccess').style.display = 'block';
            
            // إعادة عرض المشاريع
            displayProjects();
            
            // إغلاق النافذة بعد 2 ثانية
            setTimeout(() => {
                closeAddProjectModal();
            }, 2000);
        } catch (error) {
            console.error('خطأ في إضافة المشروع:', error);
            
            // عرض رسالة الخطأ
            document.getElementById('addProjectError').textContent = error.message || 'حدث خطأ في إضافة المشروع';
            document.getElementById('addProjectError').style.display = 'block';
        } finally {
            hideLoading();
        }
    }
    
    // فتح نافذة إضافة تصنيف جديد
    function openAddCategoryModal() {
        // مسح النموذج
        document.getElementById('addCategoryForm').reset();
        
        // مسح رسائل الخطأ والنجاح
        document.getElementById('addCategoryError').style.display = 'none';
        document.getElementById('addCategorySuccess').style.display = 'none';
        
        // إغلاق القائمة المنسدلة
        document.getElementById('adminDropdown').classList.remove('active');
        
        // عرض النافذة
        document.getElementById('addCategoryModal').classList.add('active');
    }
    
    // إغلاق نافذة إضافة تصنيف جديد
    function closeAddCategoryModal() {
        document.getElementById('addCategoryModal').classList.remove('active');
    }
    
    // إرسال تصنيف جديد
    async function submitNewCategory(event) {
        event.preventDefault();
        showLoading();
        
        try {
            // جمع بيانات التصنيف من النموذج
            const name = document.getElementById('categoryName').value;
            const id = document.getElementById('categoryId').value;
            
            // التحقق من البيانات
            if (!name || !id) {
                throw new Error('يرجى ملء جميع الحقول');
            }
            
            // التحقق من عدم وجود تصنيف بنفس المعرف
            const existingCategory = categories.find(c => c.id === id);
            if (existingCategory) {
                throw new Error('يوجد تصنيف بنفس المعرف، يرجى اختيار معرف آخر');
            }
            
            // إنشاء كائن التصنيف
            const category = {
                name,
                created_at: new Date().toISOString()
            };
            
            // حفظ التصنيف في Firebase
            await database.ref(`${CATEGORIES_PATH}/${id}`).set(category);
            
            // إضافة التصنيف إلى المصفوفة المحلية
            categories.push({
                id,
                ...category
            });
            
            // عرض رسالة نجاح
            document.getElementById('addCategorySuccess').textContent = 'تم إضافة التصنيف بنجاح!';
            document.getElementById('addCategorySuccess').style.display = 'block';
            
            // تحديث واجهة المستخدم
            updateCategoriesUI();
            
            // إغلاق النافذة بعد 2 ثانية
            setTimeout(() => {
                closeAddCategoryModal();
            }, 2000);
        } catch (error) {
            console.error('خطأ في إضافة التصنيف:', error);
            
            // عرض رسالة الخطأ
            document.getElementById('addCategoryError').textContent = error.message || 'حدث خطأ في إضافة التصنيف';
            document.getElementById('addCategoryError').style.display = 'block';
        } finally {
            hideLoading();
        }
    }
    
    // فتح نافذة إدارة التصنيفات
    function openManageCategoriesModal() {
        // مسح القائمة الحالية
        document.getElementById('categoriesList').innerHTML = '';
        
        // إضافة التصنيفات
        categories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'detail-item';
            categoryItem.innerHTML = `
                <div class="detail-label">${category.name}</div>
                <div class="detail-value" style="display: flex; gap: 10px;">
                    <button class="admin-btn edit" onclick="editCategory('${category.id}')" style="background: rgba(33, 150, 243, 0.6);">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="admin-btn delete" onclick="deleteCategory('${category.id}')" style="background: rgba(255, 82, 82, 0.6);">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            document.getElementById('categoriesList').appendChild(categoryItem);
        });
        
        // إغلاق القائمة المنسدلة
        document.getElementById('adminDropdown').classList.remove('active');
        
        // عرض النافذة
        document.getElementById('manageCategoriesModal').classList.add('active');
    }
    
    // إغلاق نافذة إدارة التصنيفات
    function closeManageCategoriesModal() {
        document.getElementById('manageCategoriesModal').classList.remove('active');
    }
    
    // تعديل تصنيف
    function editCategory(categoryId) {
        // للتبسيط، سنقوم بحذف التصنيف وإضافة جديد
        closeManageCategoriesModal();
        openAddCategoryModal();
        
        // البحث عن التصنيف
        const category = categories.find(c => c.id === categoryId);
        if (category) {
            // ملء النموذج بالبيانات الحالية
            document.getElementById('categoryName').value = category.name;
            document.getElementById('categoryId').value = categoryId;
        }
    }
    
    // حذف تصنيف
    async function deleteCategory(categoryId) {
        if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) {
            return;
        }
        
        showLoading();
        
        try {
            // التحقق من وجود مشاريع تستخدم هذا التصنيف
            const categoryProjects = projects.filter(p => p.category === categoryId);
            if (categoryProjects.length > 0) {
                throw new Error(`لا يمكن حذف التصنيف لأنه يحتوي على ${categoryProjects.length} مشاريع. قم بنقلها إلى تصنيف آخر أولاً.`);
            }
            
            // حذف التصنيف من Firebase
            await database.ref(`${CATEGORIES_PATH}/${categoryId}`).remove();
            
            // حذف التصنيف من المصفوفة المحلية
            categories = categories.filter(c => c.id !== categoryId);
            
            // تحديث واجهة المستخدم
            updateCategoriesUI();
            
            // إعادة فتح نافذة إدارة التصنيفات
            openManageCategoriesModal();
            
            // عرض إشعار نجاح
            createNotification('تم حذف التصنيف', 'تم حذف التصنيف بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في حذف التصنيف:', error);
            
            // عرض إشعار خطأ
            createNotification('خطأ في حذف التصنيف', error.message, 'danger');
        } finally {
            hideLoading();
        }
    }
    
    // تعديل مشروع
    function editProject(projectId) {
        // البحث عن المشروع
        const project = projects.find(p => p.id === projectId);
        if (!project) {
            console.error('المشروع غير موجود:', projectId);
            return;
        }
        
        // فتح نافذة التعديل
        openEditProjectModal(project);
    }
    
    // فتح نافذة تعديل مشروع
    function openEditProjectModal(project) {
        // ملء النموذج بالبيانات الحالية
        document.getElementById('editProjectId').value = project.id;
        document.getElementById('editProjectTitle').value = project.title;
        document.getElementById('editProjectCategory').value = project.category;
        document.getElementById('editProjectReturn').value = project.return;
        document.getElementById('editProjectDuration').value = project.duration;
        document.getElementById('editProjectMinInvestment').value = project.minInvestment;
        document.getElementById('editProjectTotalValue').value = project.totalValue || '';
        document.getElementById('editProjectDescription').value = project.description;
        document.getElementById('editProjectIcon').value = project.icon || 'building';
        
        // تعيين مميزات المشروع
        if (project.features && project.features.length > 0) {
            document.getElementById('editProjectFeatures').innerHTML = project.features.join('<br>');
        } else {
            document.getElementById('editProjectFeatures').innerHTML = '';
        }
        
        // تعيين معاينة الصورة
        const imagePreview = document.getElementById('editProjectImagePreview');
        imagePreview.style.backgroundImage = `url('${project.imageUrl}')`;
        imagePreview.style.backgroundSize = 'cover';
        imagePreview.style.backgroundPosition = 'center';
        imagePreview.querySelector('.image-preview-text').style.display = 'none';
        
        // مسح رسائل الخطأ والنجاح
        document.getElementById('editProjectError').style.display = 'none';
        document.getElementById('editProjectSuccess').style.display = 'none';
        
        // إعادة تعيين متغير التحقق من تغيير الصورة
        editImageChanged = false;
        
        // عرض النافذة
        document.getElementById('editProjectModal').classList.add('active');
    }
    
    // إغلاق نافذة تعديل مشروع
    function closeEditProjectModal() {
        document.getElementById('editProjectModal').classList.remove('active');
    }
    
    // تشغيل محدد الصورة للتعديل
    function triggerEditImageUpload() {
        document.getElementById('editProjectImageUpload').click();
    }
    
    // معاينة صورة المشروع المعدلة
    function previewEditProjectImage(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const preview = document.getElementById('editProjectImagePreview');
                preview.style.backgroundImage = `url('${e.target.result}')`;
                preview.style.backgroundSize = 'cover';
                preview.style.backgroundPosition = 'center';
                preview.querySelector('.image-preview-text').style.display = 'none';
                
                // تعيين متغير لتأكيد تغيير الصورة
                editImageChanged = true;
                projectImageFile = input.files[0];
            };
            
            reader.readAsDataURL(input.files[0]);
        }
    }
    
    // إرسال تعديلات المشروع
    async function submitEditProject(event) {
        event.preventDefault();
        showLoading();
        
        try {
            // جمع بيانات المشروع من النموذج
            const projectId = document.getElementById('editProjectId').value;
            const title = document.getElementById('editProjectTitle').value;
            const category = document.getElementById('editProjectCategory').value;
            const returnValue = document.getElementById('editProjectReturn').value;
            const duration = document.getElementById('editProjectDuration').value;
            const minInvestment = document.getElementById('editProjectMinInvestment').value;
            const totalValue = document.getElementById('editProjectTotalValue').value;
            const description = document.getElementById('editProjectDescription').value;
            const featuresText = document.getElementById('editProjectFeatures').innerHTML;
            const icon = document.getElementById('editProjectIcon').value;
            
            // تحويل مميزات المشروع من HTML إلى مصفوفة
            const features = featuresText
                .split('<br>')
                .map(feature => feature.trim())
                .filter(feature => feature.length > 0);
            
            // التحقق من البيانات الإلزامية
            if (!title || !category || !returnValue || !duration || !minInvestment || !description) {
                throw new Error('يرجى ملء جميع الحقول الإلزامية');
            }
            
            // البحث عن المشروع الحالي للحصول على الصورة
            const existingProject = projects.find(p => p.id === projectId);
            if (!existingProject) {
                throw new Error('المشروع غير موجود');
            }
            
            // تحميل الصورة الجديدة إذا تم تغييرها
            let imageUrl = existingProject.imageUrl;
            
            if (editImageChanged && projectImageFile) {
                imageUrl = await uploadProjectImage(projectImageFile, projectId);
            }
            
            // إنشاء كائن المشروع المعدل
            const updatedProject = {
                title,
                category,
                return: returnValue,
                duration,
                minInvestment,
                totalValue,
                description,
                features,
                imageUrl,
                icon,
                updated_at: new Date().toISOString()
            };
            
            // حفظ التعديلات في Firebase
            await database.ref(`${PROJECTS_PATH}/${projectId}`).update(updatedProject);
            
            // تحديث المشروع في المصفوفة المحلية
            const projectIndex = projects.findIndex(p => p.id === projectId);
            if (projectIndex !== -1) {
                projects[projectIndex] = {
                    id: projectId,
                    ...updatedProject,
                    created_at: existingProject.created_at // الاحتفاظ بتاريخ الإنشاء الأصلي
                };
            }
            
            // عرض رسالة نجاح
            document.getElementById('editProjectSuccess').textContent = 'تم تحديث المشروع بنجاح!';
            document.getElementById('editProjectSuccess').style.display = 'block';
            
            // إعادة عرض المشاريع
            displayProjects();
            
            // إغلاق النافذة بعد 2 ثانية
            setTimeout(() => {
                closeEditProjectModal();
            }, 2000);
        } catch (error) {
            console.error('خطأ في تحديث المشروع:', error);
            
            // عرض رسالة الخطأ
            document.getElementById('editProjectError').textContent = error.message || 'حدث خطأ في تحديث المشروع';
            document.getElementById('editProjectError').style.display = 'block';
        } finally {
            hideLoading();
        }
    }
    
    // تأكيد حذف مشروع
    function confirmDeleteProject(projectId) {
        if (confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
            deleteProject(projectId);
        }
    }
    
    // حذف مشروع
    async function deleteProject(projectId) {
        showLoading();
        
        try {
            // حذف المشروع من Firebase
            await database.ref(`${PROJECTS_PATH}/${projectId}`).remove();
            
            // حذف المشروع من المصفوفة المحلية
            projects = projects.filter(p => p.id !== projectId);
            
            // إعادة عرض المشاريع
            displayProjects();
            
            // عرض إشعار نجاح
            createNotification('تم حذف المشروع', 'تم حذف المشروع بنجاح', 'success');
            
            // إغلاق نافذة التعديل إذا كانت مفتوحة
            closeEditProjectModal();
        } catch (error) {
            console.error('خطأ في حذف المشروع:', error);
            
            // عرض إشعار خطأ
            createNotification('خطأ في حذف المشروع', error.message, 'danger');
        } finally {
            hideLoading();
        }
    }
    
    // وظائف واجهة المستخدم الإضافية
    
    // تبديل عرض خانة البحث
    function toggleSearch() {
        const searchContainer = document.getElementById('searchContainer');
        searchContainer.classList.toggle('active');
        
        if (searchContainer.classList.contains('active')) {
            // التركيز على حقل البحث
            setTimeout(() => {
                document.getElementById('searchInput').focus();
            }, 300);
        } else {
            // مسح البحث وإعادة عرض جميع المشاريع
            document.getElementById('searchInput').value = '';
            displayProjects();
        }
    }
    
    // تحسين وظيفة طلب السحب
    async function openWithdrawModal() {
        document.getElementById('withdrawModal').classList.add('active');
        
        try {
            // تحديث المبلغ المتاح للسحب من البيانات الحالية
            // احصل على أحدث بيانات البطاقة من قاعدة البيانات
            if (currentCard && currentCard.id) {
                const cardRef = database.ref(`${CARDS_PATH}/${currentCard.id}`);
                const snapshot = await cardRef.once('value');
                const updatedCard = snapshot.val();
                
                if (updatedCard) {
                    // تحديث البيانات المحلية
                    currentCard = updatedCard;
                    localStorage.setItem('investorCard', JSON.stringify(currentCard));
                }
            }
            
            // عرض المبلغ المتاح للسحب
            document.getElementById('availableBalance').value = formatCurrency(currentCard.dueProfit || 0);
            
            // إضافة رقم البطاقة
            const withdrawCardNumber = document.getElementById('withdrawCardNumber');
            if (withdrawCardNumber) {
                withdrawCardNumber.textContent = formatCardNumberDisplay(currentCard.cardNumber);
            }
            
            // إضافة الحد الأدنى والأقصى
            const withdrawMinAmount = document.getElementById('withdrawMinAmount');
            if (withdrawMinAmount) {
                // تحديد الحد الأدنى (مثال: 50 دينار)
                const minAmount = 50;
                withdrawMinAmount.textContent = `الحد الأدنى: ${formatCurrency(minAmount)}`;
                
                // تعيين قيمة الحد الأدنى في حقل المبلغ
                document.getElementById('withdrawAmount').min = minAmount;
            }
            
            const withdrawMaxAmount = document.getElementById('withdrawMaxAmount');
            if (withdrawMaxAmount) {
                // تحديد الحد الأقصى (مبلغ الأرباح المستحقة)
                const maxAmount = currentCard.dueProfit || 0;
                withdrawMaxAmount.textContent = `الحد الأقصى: ${formatCurrency(maxAmount)}`;
                
                // تعيين قيمة الحد الأقصى في حقل المبلغ
                document.getElementById('withdrawAmount').max = maxAmount;
            }
        } catch (error) {
            console.error('خطأ في تحديث بيانات طلب السحب:', error);
        }
        
        // إعادة ضبط النموذج
        document.getElementById('withdrawForm').reset();
        document.getElementById('withdrawError').style.display = 'none';
        document.getElementById('withdrawSuccess').style.display = 'none';
        document.getElementById('bankDetailsGroup').style.display = 'none';
        document.getElementById('walletDetailsGroup').style.display = 'none';
    }

    // تحسين وظيفة إرسال طلب السحب
    async function submitWithdrawRequest(event) {
        event.preventDefault();
        showLoading();

        const amount = parseFloat(document.getElementById('withdrawAmount').value);
        const method = document.getElementById('withdrawMethod').value;
        const notes = document.getElementById('withdrawNotes').value;
        
        // الحصول على التفاصيل الإضافية حسب طريقة السحب
        let details = '';
        if (method === 'bank_transfer') {
            details = document.getElementById('bankDetails').value;
            
            // التحقق من صحة تفاصيل البنك
            if (!details) {
                showWithdrawError('يرجى إدخال تفاصيل الحساب البنكي');
                hideLoading();
                return;
            }
        } else if (method === 'e_wallet') {
            details = document.getElementById('walletDetails').value;
            
            // التحقق من صحة تفاصيل المحفظة
            if (!details) {
                showWithdrawError('يرجى إدخال تفاصيل المحفظة الإلكترونية');
                hideLoading();
                return;
            }
        }

        try {
            // التحقق من صحة البيانات
            if (amount <= 0) {
                showWithdrawError('يرجى إدخال مبلغ صحيح');
                hideLoading();
                return;
            }
            
            // احصل على أحدث بيانات البطاقة
            let dueProfit = currentCard.dueProfit || 0;
            
            if (currentCard && currentCard.id) {
                try {
                    const cardRef = database.ref(`${CARDS_PATH}/${currentCard.id}`);
                    const snapshot = await cardRef.once('value');
                    const updatedCard = snapshot.val();
                    
                    if (updatedCard) {
                        dueProfit = updatedCard.dueProfit || 0;
                        
                        // تحديث البيانات المحلية
                        currentCard = updatedCard;
                        localStorage.setItem('investorCard', JSON.stringify(currentCard));
                    }
                } catch (cardError) {
                    console.error('خطأ في تحديث بيانات البطاقة:', cardError);
                }
            }
            
            if (amount > dueProfit) {
                showWithdrawError('المبلغ المطلوب أكبر من الرصيد المتاح');
                hideLoading();
                return;
            }
            
            // التحقق من الحد الأدنى للسحب
            const minAmount = 50; // الحد الأدنى للسحب
            if (amount < minAmount) {
                showWithdrawError(`الحد الأدنى للسحب هو ${formatCurrency(minAmount)}`);
                hideLoading();
                return;
            }

            // إنشاء طلب سحب
            const withdrawRequest = {
                id: generateId(),
                type: 'withdrawal',
                investorId: currentInvestor.id,
                investorName: currentInvestor.name,
                cardId: currentCard.id,
                cardNumber: currentCard.cardNumber,
                amount: amount,
                method: method,
                details: details,
                notes: notes,
                status: 'pending',
                requestDate: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            // حفظ طلب السحب في Firebase
            await database.ref(`${WITHDRAWAL_REQUESTS_PATH}/${withdrawRequest.id}`).set(withdrawRequest);
            
            // إضافة العملية إلى عمليات البطاقة
            const operationId = generateId();
            const operation = {
                id: operationId,
                type: 'withdrawal',
                investorId: currentInvestor.id,
                investorName: currentInvestor.name,
                cardId: currentCard.id,
                cardNumber: currentCard.cardNumber,
                amount: amount,
                date: new Date().toISOString(),
                status: 'pending',
                description: 'طلب سحب قيد المراجعة',
                method: method,
                details: details,
                notes: notes
            };
            
            // حفظ العملية في Firebase
            await database.ref(`${OPERATIONS_PATH}/${operationId}`).set(operation);
            
            // إضافة العملية إلى مصفوفة العمليات المحلية
            if (!currentCard.recentOperations) {
                currentCard.recentOperations = [];
            }
            
            currentCard.recentOperations.push(operation);
            localStorage.setItem('investorCard', JSON.stringify(currentCard));
            
            // إنشاء إشعار للمستخدم
            const notificationId = generateId();
            const notification = {
                id: notificationId,
                title: 'تم استلام طلب السحب',
                message: `تم استلام طلب سحب بقيمة ${formatCurrency(amount)} وسيتم مراجعته في أقرب وقت.`,
                type: 'withdrawal',
                read: false,
                date: new Date().toISOString(),
                investorId: currentInvestor.id,
                amount: amount,
                operation: operation
            };
            
            // حفظ الإشعار في Firebase
            await database.ref(`${NOTIFICATIONS_PATH}/${notificationId}`).set(notification);
            
            // عرض رسالة نجاح
            showWithdrawSuccess('تم إرسال طلب السحب بنجاح. سيتم مراجعة طلبك قريبًا وستتلقى إشعارًا عند معالجته.');
            
            // تحديث صفحة الرئيسية والمعاملات
            loadTransactions();
            
            // تحديث النشاطات الأخيرة
            loadRecentActivities();
            
            // إغلاق النافذة بعد فترة
            setTimeout(() => {
                closeWithdrawModal();
            }, 3000);
        } catch (error) {
            console.error('خطأ في إرسال طلب السحب:', error);
            showWithdrawError('حدث خطأ في إرسال الطلب. الرجاء المحاولة مرة أخرى لاحقًا.');
        } finally {
            hideLoading();
        }
    }

    // دالة لعرض خطأ في نافذة السحب
    function showWithdrawError(message) {
        const errorElement = document.getElementById('withdrawError');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // التمرير إلى رسالة الخطأ
        errorElement.scrollIntoView({ behavior: 'smooth' });
        
        // إخفاء الرسالة بعد 5 ثوان
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }

    // دالة لعرض رسالة نجاح في نافذة السحب
    function showWithdrawSuccess(message) {
        const successElement = document.getElementById('withdrawSuccess');
        successElement.textContent = message;
        successElement.style.display = 'block';
        
        // التمرير إلى رسالة النجاح
        successElement.scrollIntoView({ behavior: 'smooth' });
    }

    // تحسين دالة إغلاق نافذة السحب
    function closeWithdrawModal() {
        document.getElementById('withdrawModal').classList.remove('active');
        
        // إعادة تحميل البيانات المحلية للتأكد من التحديثات
        loadTransactions();
    }

    // التحقق من حالة طلبات السحب
    async function checkWithdrawalRequestsStatus() {
        try {
            // التحقق من وجود مستثمر حالي
            if (!currentInvestor || !currentInvestor.id) {
                return;
            }
            
            // الحصول على طلبات السحب الحالية
            const withdrawalsRef = database.ref(WITHDRAWAL_REQUESTS_PATH);
            const query = withdrawalsRef.orderByChild('investorId').equalTo(currentInvestor.id);
            const snapshot = await query.once('value');
            
            // المعالجة إذا كان هناك طلبات
            if (snapshot.exists()) {
                const withdrawals = [];
                
                snapshot.forEach(childSnapshot => {
                    withdrawals.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                
                // فرز الطلبات حسب التاريخ (الأحدث أولاً)
                withdrawals.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
                
                // التحقق من طلبات تمت معالجتها مؤخرًا
                const recentWithdrawals = withdrawals.filter(w => {
                    // تحقق من الحالة وما إذا تم التحديث خلال الساعة الماضية
                    const isRecent = new Date(w.requestDate) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return isRecent && (w.status === 'completed' || w.status === 'rejected');
                });
                
                // عرض إشعارات للطلبات المعالجة حديثًا
                recentWithdrawals.forEach(withdrawal => {
                    // التحقق من أنه لم يتم إنشاء إشعار مسبقًا
                    const statusText = withdrawal.status === 'completed' ? 'تمت الموافقة على' : 'تم رفض';
                    const message = `${statusText} طلب السحب بقيمة ${formatCurrency(withdrawal.amount)}`;
                    
                    createNotification(
                        withdrawal.status === 'completed' ? 'تم الموافقة على الطلب' : 'تم رفض الطلب',
                        message,
                        withdrawal.status === 'completed' ? 'success' : 'danger'
                    );
                });
            }
        } catch (error) {
            console.error('خطأ في التحقق من حالة طلبات السحب:', error);
        }
    }

    // دالة إنشاء إشعار مرئي
    function createNotification(title, message, type = 'info') {
        // إنشاء عنصر الإشعار
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        
        // إضافة المحتوى
        notification.innerHTML = `
            <div class="notification-toast-header">
                <div class="notification-toast-title">${title}</div>
                <button class="notification-toast-close">&times;</button>
            </div>
            <div class="notification-toast-body">${message}</div>
        `;
        
        // إضافة الإشعار إلى الصفحة
        const container = document.getElementById('notificationToastContainer');
        if (!container) {
            // إنشاء حاوية الإشعارات إذا لم تكن موجودة
            const newContainer = document.createElement('div');
            newContainer.id = 'notificationToastContainer';
            newContainer.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                right: 20px;
                z-index: 9999;
                direction: rtl;
            `;
            document.body.appendChild(newContainer);
            newContainer.appendChild(notification);
        } else {
            container.appendChild(notification);
        }
        
        // إضافة سلوك زر الإغلاق
        const closeButton = notification.querySelector('.notification-toast-close');
        closeButton.addEventListener('click', () => {
            notification.classList.add('hiding');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // إغلاق الإشعار تلقائيًا بعد 5 ثوان
        setTimeout(() => {
            notification.classList.add('hiding');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
        
        return notification;
    }

    // Show contact support modal
    function showContactSupport() {
        document.getElementById('supportModal').classList.add('active');
        
        // Reset form
        document.getElementById('supportForm').reset();
        document.getElementById('supportError').style.display = 'none';
        document.getElementById('supportSuccess').style.display = 'none';
    }

    // Close support modal
    function closeSupportModal() {
        document.getElementById('supportModal').classList.remove('active');
    }

    // Submit support request
    async function submitSupportRequest(event) {
        event.preventDefault();
        showLoading();
        
        const topic = document.getElementById('supportTopic').value;
        const message = document.getElementById('supportMessage').value;
        
        try {
            // Validate inputs
            if (!topic || !message) {
                document.getElementById('supportError').textContent = 'يرجى ملء جميع الحقول';
                document.getElementById('supportError').style.display = 'block';
                hideLoading();
                return;
            }
            
            // Create support request
            const supportRequest = {
                id: generateId(),
                investorId: currentInvestor.id,
                investorName: currentInvestor.name,
                phone: currentInvestor.phone,
                email: currentInvestor.email,
                topic: topic,
                message: message,
                status: 'new',
                date: new Date().toISOString()
            };
            
            // Save to Firebase
            await database.ref(`${SUPPORT_REQUESTS_PATH}/${supportRequest.id}`).set(supportRequest);
            
            // Add notification for support request
            const supportNotification = {
                id: generateId(),
                title: 'تم استلام طلب الدعم',
                message: 'تم استلام رسالتك وسيتم التواصل معك في أقرب وقت ممكن.',
                type: 'support',
                read: false,
                date: new Date().toISOString()
            };
            
            // Save notification to Firebase
            await database.ref(`${NOTIFICATIONS_PATH}/${supportNotification.id}`).set(supportNotification);
            
            // Show success
            document.getElementById('supportSuccess').textContent = 'تم إرسال طلبك بنجاح وسيتم التواصل معك قريبًا';
            document.getElementById('supportSuccess').style.display = 'block';
            
            // Clear form
            document.getElementById('supportForm').reset();
            
            // Close modal after delay
            setTimeout(() => {
                document.getElementById('supportSuccess').style.display = 'none';
                closeSupportModal();
            }, 3000);
        } catch (error) {
            console.error('Support request error:', error);
            document.getElementById('supportError').textContent = 'حدث خطأ في إرسال الطلب';
            document.getElementById('supportError').style.display = 'block';
        } finally {
            hideLoading();
        }
    }

    // تحديث دالة عرض تفاصيل الحساب
    function showDetails() {
        // Populate the details modal
        document.getElementById('detailsName').textContent = currentInvestor.name;
        document.getElementById('detailsCardNumber').textContent = formatCardNumberDisplay(currentCard.cardNumber);
        document.getElementById('detailsExpiryDate').textContent = formatCardExpiryDateFromDB(currentCard.expiryDate);
        document.getElementById('detailsTotalInvestment').textContent = formatCurrency(currentCard.totalInvestment || 0);
        document.getElementById('detailsTotalProfit').textContent = formatCurrency(currentCard.totalProfit || 0);
        document.getElementById('detailsDueProfit').textContent = formatCurrency(currentCard.dueProfit || 0);
        document.getElementById('detailsPaidProfit').textContent = formatCurrency(currentCard.paidProfit || 0);
        
        // Set investment details
        document.getElementById('detailsInvestmentType').textContent = currentCard.investmentType || 'استثمار عام';
        
        // Set investment date (use 60 days ago if not available)
        const investmentDate = currentCard.investmentDate || 
            new Date(new Date().getTime() - 180 * 24 * 60 * 60 * 1000).toISOString();
        document.getElementById('detailsInvestmentDate').textContent = formatDate(investmentDate);
        
        // Set maturity date (use 300 days from investment date if not available)
        const maturityDate = currentCard.maturityDate || 
            new Date(new Date(investmentDate).getTime() + 300 * 24 * 60 * 60 * 1000).toISOString();
        document.getElementById('detailsMaturityDate').textContent = formatDate(maturityDate);
        
        // Show the modal
        document.getElementById('detailsModal').classList.add('active');
    }

    // Close details modal
    function closeDetailsModal() {
        document.getElementById('detailsModal').classList.remove('active');
    }

    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-IQ');
    }

    // Logout
    function logout() {
        // Clear localStorage
        localStorage.removeItem('investorCard');
        localStorage.removeItem('investorData');
        localStorage.removeItem('loginTime');
        
        currentInvestor = null;
        currentCard = null;
        
        // Reset forms
        document.getElementById('loginForm').reset();
        
        // Hide dashboard, show login
        document.getElementById('dashboardScreen').style.display = 'none';
        document.getElementById('bottomNav').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'block';
        
        // Clear any QR scanner
        if (qrScanner) {
            qrScanner.clear();
            qrScanner = null;
        }
        
        // Reset QR scanner UI
        document.getElementById('qr-scanner').style.display = 'none';
        document.getElementById('startScanBtn').style.display = 'block';
    }

    // Generate unique ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Show loading
    function showLoading() {
        document.getElementById('loadingScreen').style.display = 'flex';
    }

    // Hide loading
    function hideLoading() {
        document.getElementById('loadingScreen').style.display = 'none';
    }

    // Show error
    function showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => errorElement.style.display = 'none', 5000);
    }

    // Clear errors
    function clearErrors() {
        document.getElementById('errorMessage').style.display = 'none';
    }
    
    // وظائف مساعدة إضافية
    
    // تقصير النص
    function shortenText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        
        return text.substr(0, maxLength) + '...';
    }
    
    // الحصول على أيقونة الإشعار
    function getNotificationIcon(type) {
        switch (type) {
            case 'investment':
            case 'deposit':
                return 'fas fa-chart-line';
            case 'withdrawal':
                return 'fas fa-money-bill-wave';
            case 'profit':
                return 'fas fa-coins';
            case 'welcome':
                return 'fas fa-handshake';
            case 'system':
                return 'fas fa-cogs';
            default:
                return 'fas fa-bell';
        }
    }

    // تعزيز الاتصال بين الإشعارات والعمليات
    function syncNotificationsWithOperations() {
        try {
            if (!currentCard || !currentCard.recentOperations) {
                return;
            }
            
            // تحويل جميع العمليات إلى إشعارات إذا لم يكن لديها إشعار بالفعل
            currentCard.recentOperations.forEach(operation => {
                // التحقق من عدم وجود إشعار بالفعل لهذه العملية
                const hasNotification = notifications.some(n => n.operation && n.operation.id === operation.id);
                
                if (!hasNotification) {
                    // إنشاء إشعار من العملية
                    const notification = createNotificationFromOperation(operation);
                    
                    if (notification) {
                        // إضافة الإشعار إلى مصفوفة الإشعارات
                        notifications.push(notification);
                        
                        // حفظ الإشعار في Firebase
                        database.ref(`${NOTIFICATIONS_PATH}/${notification.id}`).set(notification)
                            .catch(error => console.error('خطأ في حفظ الإشعار:', error));
                    }
                }
            });
            
            // إعادة عرض الإشعارات إذا كان قسم الإشعارات مفتوحًا
            if (document.getElementById('notificationsSection').style.display === 'block') {
                displayNotifications(notifications);
            }
            
            // تحديث عدد الإشعارات غير المقروءة
            updateUnreadCount();
        } catch (error) {
            console.error('خطأ في مزامنة الإشعارات مع العمليات:', error);
        }
    }

    // دالة لاستعادة البيانات المحذوفة أو لإصلاح مشاكل التخزين المحلي
    function repairLocalStorage() {
        try {
            // التحقق من وجود بيانات في التخزين المحلي
            const savedCard = localStorage.getItem('investorCard');
            const savedInvestor = localStorage.getItem('investorData');
            
            if (!savedCard || !savedInvestor) {
                console.warn('بيانات التخزين المحلي غير متوفرة');
                return false;
            }
            
            // محاولة تحليل البيانات
            try {
                const card = JSON.parse(savedCard);
                const investor = JSON.parse(savedInvestor);
                
                // التحقق من صحة البيانات
                if (!card.id || !card.cardNumber || !investor.id || !investor.name) {
                    console.warn('بيانات التخزين المحلي غير صالحة');
                    return false;
                }
                
                // تعيين البيانات الصالحة
                currentCard = card;
                currentInvestor = investor;
                
                return true;
            } catch (error) {
                console.error('خطأ في تحليل بيانات التخزين المحلي:', error);
                
                // مسح البيانات غير الصالحة
                localStorage.removeItem('investorCard');
                localStorage.removeItem('investorData');
                
                return false;
            }
        } catch (error) {
            console.error('خطأ في إصلاح التخزين المحلي:', error);
            return false;
        }
    }

    // تحسين الأمان بتشفير البيانات المحلية
    function secureLocalStorage() {
        // يمكن تنفيذ هذه الدالة لاحقًا عند الحاجة لتحسين الأمان
        // يمكن استخدام مكتبات مثل CryptoJS للتشفير
    }

    // الاستماع المستمر لتغييرات بيانات البطاقة
    function listenForCardChanges() {
        if (!currentCard || !currentCard.id) {
            return;
        }
        
        const cardRef = database.ref(`${CARDS_PATH}/${currentCard.id}`);
        
        // إزالة المستمعين السابقين
        cardRef.off();
        
        // إضافة مستمع جديد
        cardRef.on('value', (snapshot) => {
            const updatedCard = snapshot.val();
            
            if (updatedCard) {
                // تحديث البيانات المحلية
                currentCard = updatedCard;
                localStorage.setItem('investorCard', JSON.stringify(currentCard));
                
                // تحديث واجهة المستخدم
                updateDashboard();
            }
        });
    }

    // التحقق من حالة الاتصال بالإنترنت
    function checkInternetConnection() {
        return navigator.onLine;
    }

    // معالجة حالة عدم الاتصال بالإنترنت
    function handleOfflineMode() {
        if (!checkInternetConnection()) {
            // إظهار رسالة للمستخدم
            createNotification(
                'انقطاع الاتصال',
                'أنت حاليًا غير متصل بالإنترنت. سيتم استخدام البيانات المخزنة محليًا.',
                'warning'
            );
            
            // تعطيل الوظائف التي تتطلب اتصالًا بالإنترنت
            document.querySelectorAll('.action-btn').forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
            });
        } else {
            // إعادة تفعيل الوظائف
            document.querySelectorAll('.action-btn').forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
            });
        }
    }

    // إضافة مستمع لحالة الاتصال
    window.addEventListener('online', () => {
        // إعادة تفعيل الوظائف وتحديث البيانات
        createNotification('تم استعادة الاتصال', 'تم استعادة الاتصال بالإنترنت', 'success');
        refreshDashboard();
        handleOfflineMode();
    });

    window.addEventListener('offline', () => {
        // تفعيل وضع عدم الاتصال
        handleOfflineMode();
    });

    // التحقق من الجلسة منتهية الصلاحية
    function checkSessionExpiry() {
        const loginTime = localStorage.getItem('loginTime');
        
        if (loginTime) {
            const now = new Date().getTime();
            const lastLogin = parseInt(loginTime);
            
            // تحقق مما إذا كانت قد مرت أكثر من 24 ساعة (مثال)
            if (now - lastLogin > 24 * 60 * 60 * 1000) {
                // تسجيل خروج تلقائي
                createNotification('انتهت الجلسة', 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'warning');
                logout();
                return true;
            }
        }
        
        return false;
    }

    // تحديث وقت تسجيل الدخول
    function updateLoginTime() {
        localStorage.setItem('loginTime', new Date().getTime().toString());
    }

    // إضافة تحديث وقت تسجيل الدخول إلى دالة showDashboard
    const originalShowDashboard = showDashboard;
    window.showDashboard = function() {
        originalShowDashboard();
        updateLoginTime(); // تحديث وقت تسجيل الدخول
        
        // استماع لتغييرات البطاقة
        listenForCardChanges();
        
        // التحقق من حالة الاتصال
        handleOfflineMode();
        
        // تحديث عدد الإشعارات غير المقروءة
        updateUnreadCount();
        
        // مزامنة الإشعارات والعمليات
        syncNotificationsWithOperations();
    };

    // تعريف السلوك العام للإغلاق عند النقر خارج النوافذ المنبثقة
    document.addEventListener('click', function(event) {
        // إغلاق النوافذ المنبثقة عندما يتم النقر خارجها
        const modals = document.querySelectorAll('.modal.active');
        
        modals.forEach(modal => {
            // التحقق من أن النقرة كانت خارج مربع الحوار وعلى الطبقة الخلفية
            if (event.target === modal && !modal.id.includes('loadingScreen')) {
                // الحصول على دالة الإغلاق المناسبة للنافذة المنبثقة
                if (modal.id === 'withdrawModal') {
                    closeWithdrawModal();
                } else if (modal.id === 'supportModal') {
                    closeSupportModal();
                } else if (modal.id === 'detailsModal') {
                    closeDetailsModal();
                } else if (modal.id === 'notificationDetailsModal') {
                    closeNotificationDetailsModal();
                } else if (modal.id === 'projectDetailsModal') {
                    closeProjectDetailsModal();
                } else if (modal.id === 'addProjectModal') {
                    closeAddProjectModal();
                } else if (modal.id === 'addCategoryModal') {
                    closeAddCategoryModal();
                } else if (modal.id === 'manageCategoriesModal') {
                    closeManageCategoriesModal();
                } else if (modal.id === 'editProjectModal') {
                    closeEditProjectModal();
                }
            }
        });
        
        // إغلاق القائمة المنسدلة للمشرف عند النقر خارجها
        const adminDropdown = document.getElementById('adminDropdown');
        if (adminDropdown && adminDropdown.classList.contains('active') && 
            !event.target.closest('#adminDropdown') && 
            !event.target.closest('#adminModeSwitch')) {
            adminDropdown.classList.remove('active');
        }
        
        // إغلاق خانة البحث عند النقر خارجها
        const searchContainer = document.getElementById('searchContainer');
        if (searchContainer && searchContainer.classList.contains('active') && 
            !event.target.closest('#searchContainer') && 
            !event.target.closest('#searchIcon')) {
            searchContainer.classList.remove('active');
            // إعادة عرض جميع المشاريع
            document.getElementById('searchInput').value = '';
            displayProjects();
        }
    });

    // استدعاء وظائف البدء النهائية
    (function initialize() {
        // تعيين الوظائف في النافذة العالمية للاستخدام من HTML
        window.switchTab = switchTab;
        window.loginWithCard = loginWithCard;
        window.startQRScan = startQRScan;
        window.decodeQRFromImage = decodeQRFromImage;
        window.refreshDashboard = refreshDashboard;
        window.switchSection = switchSection;
        window.openWithdrawModal = openWithdrawModal;
        window.closeWithdrawModal = closeWithdrawModal;
        window.submitWithdrawRequest = submitWithdrawRequest;
        window.showDetails = showDetails;
        window.closeDetailsModal = closeDetailsModal;
        window.showContactSupport = showContactSupport;
        window.closeSupportModal = closeSupportModal;
        window.submitSupportRequest = submitSupportRequest;
        window.filterTransactions = filterTransactions;
        window.logout = logout;
        window.closeNotificationDetailsModal = closeNotificationDetailsModal;
        
        // وظائف الصفحة الرئيسية الجديدة (صفحة المشاريع)
        window.filterProjects = filterProjects;
        window.showProjectDetails = showProjectDetails;
        window.closeProjectDetailsModal = closeProjectDetailsModal;
        window.applyForProject = applyForProject;
        window.toggleSearch = toggleSearch;
        window.searchProjects = searchProjects;
        
        // وظائف المشرف
        window.toggleAdminMode = toggleAdminMode;
        window.openAddProjectModal = openAddProjectModal;
        window.closeAddProjectModal = closeAddProjectModal;
        window.triggerImageUpload = triggerImageUpload;
        window.previewProjectImage = previewProjectImage;
        window.submitNewProject = submitNewProject;
        window.openAddCategoryModal = openAddCategoryModal;
        window.closeAddCategoryModal = closeAddCategoryModal;
        window.submitNewCategory = submitNewCategory;
        window.openManageCategoriesModal = openManageCategoriesModal;
        window.closeManageCategoriesModal = closeManageCategoriesModal;
        window.editCategory = editCategory;
        window.deleteCategory = deleteCategory;
        window.toggleProjectEditMode = toggleProjectEditMode;
        window.editProject = editProject;
        window.confirmDeleteProject = confirmDeleteProject;
        window.deleteProject = deleteProject;
        window.triggerEditImageUpload = triggerEditImageUpload;
        window.previewEditProjectImage = previewEditProjectImage;
        window.submitEditProject = submitEditProject;
    })();