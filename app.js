      // ==============================
        // المتغيرات العامة والبيانات
        // ==============================
        let currentUser = null;
        let currentPage = 'dashboard';
        let userData = [];
        let employeeData = [];
        let categoryData = [];
        let attendanceData = [];
        let salaryData = [];
        let logsData = [];
        let settings = {};
        let confirmCallback = null; // لتخزين دالة التأكيد

        // ==============================
        // دوال المساعدة
        // ==============================

        // توليد معرف فريد
        function generateId() {
            return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }

        // تنسيق التاريخ
        function formatDate(date) {
            if (!date) return '';
            const d = new Date(date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        // تنسيق الوقت
        function formatTime(date) {
            if (!date) return '';
            const d = new Date(date);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }

        // تنسيق التاريخ والوقت
        function formatDateTime(date) {
            if (!date) return '';
            return `${formatDate(date)} ${formatTime(date)}`;
        }

        // حساب الفرق بين وقتين بالساعات
        function calculateHoursDifference(startTime, endTime) {
            if (!startTime || !endTime) return 0;
            const start = new Date(startTime);
            const end = new Date(endTime);
            const diffMs = end - start;
            return diffMs / (1000 * 60 * 60);
        }

        // إظهار إشعار
        function showNotification(message, type = 'success') {
            const notification = document.getElementById('notification');
            const notificationMessage = document.getElementById('notification-message');
            const notificationTitle = notification.querySelector('.notification-title');
            const notificationIcon = notification.querySelector('.notification-icon');
            
            notificationMessage.textContent = message;
            
            // تعيين النوع والأيقونة
            notification.className = 'notification';
            notificationIcon.className = 'notification-icon';
            
            if (type === 'success') {
                notificationTitle.textContent = 'نجاح';
                notificationIcon.classList.add('success-icon');
                notificationIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            } else if (type === 'error') {
                notificationTitle.textContent = 'خطأ';
                notificationIcon.classList.add('danger-icon');
                notificationIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
            } else if (type === 'warning') {
                notificationTitle.textContent = 'تنبيه';
                notificationIcon.classList.add('warning-icon');
                notificationIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
            } else if (type === 'info') {
                notificationTitle.textContent = 'معلومات';
                notificationIcon.classList.add('info-icon');
                notificationIcon.innerHTML = '<i class="fas fa-info-circle"></i>';
            }
            
            // إظهار الإشعار
            notification.classList.add('show');
            
            // إخفاء الإشعار بعد 3 ثوان
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

        // عرض نافذة التأكيد
        function showConfirmModal(message, callback) {
            document.getElementById('confirm-message').textContent = message;
            document.getElementById('confirm-modal-backdrop').classList.add('show');
            document.getElementById('confirm-modal').classList.add('show');
            confirmCallback = callback;
        }

        // إخفاء نافذة التأكيد
        function hideConfirmModal() {
            document.getElementById('confirm-modal-backdrop').classList.remove('show');
            document.getElementById('confirm-modal').classList.remove('show');
        }

        // التنقل بين الصفحات
        function navigateTo(pageName) {
            // إخفاء جميع الصفحات
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            // إظهار الصفحة المطلوبة
            const page = document.getElementById(pageName);
            if (page) {
                page.classList.add('active');
                
                // تحديث الصفحة الحالية
                currentPage = pageName;
                
                // تحديث عنوان الصفحة في الهيدر
                updatePageTitle(pageName);
                
                // تحديث العنصر النشط في القائمة
                updateActiveMenuItem(pageName);
                
                // تحديث البيانات المعروضة في الصفحة
                updatePageData(pageName);
                
                // إضافة سجل للتنقل
                addLog(`تم الانتقال إلى ${getPageTitle(pageName)}`, 'navigation');
            }
        }

        // تحديث عنوان الصفحة في الهيدر
        function updatePageTitle(pageName) {
            const pageTitle = document.getElementById('page-title');
            pageTitle.textContent = getPageTitle(pageName);
        }

        // الحصول على عنوان الصفحة
        function getPageTitle(pageName) {
            const pageTitles = {
                'dashboard': 'لوحة القيادة',
                'employees-list': 'قائمة الموظفين',
                'add-employee': 'إضافة موظف',
                'employee-categories': 'تصنيفات الموظفين',
                'attendance': 'الحضور والانصراف',
                'attendance-reports': 'تقارير الحضور',
                'salaries': 'إدارة الرواتب',
                'salary-reports': 'تقارير الرواتب',
                'barcode': 'إدارة البطاقات',
                'settings': 'الإعدادات',
                'users': 'إدارة المستخدمين',
                'logs': 'سجلات النظام'
            };
            
            return pageTitles[pageName] || pageName;
        }

        // تحديث العنصر النشط في القائمة
        function updateActiveMenuItem(pageName) {
            // إزالة التنشيط من جميع العناصر
            document.querySelectorAll('.sidebar-menu-item, .sidebar-submenu-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // تنشيط العنصر المناسب
            let menuItem = document.querySelector(`.sidebar-menu-item[data-page="${pageName}"]`);
            
            if (menuItem) {
                menuItem.classList.add('active');
            } else {
                // قد تكون هذه صفحة فرعية
                menuItem = document.querySelector(`.sidebar-submenu-item[data-page="${pageName}"]`);
                
                if (menuItem) {
                    menuItem.classList.add('active');
                    
                    // تنشيط القائمة الأم وإظهار القائمة الفرعية
                    const parentSubmenu = menuItem.closest('.sidebar-submenu');
                    if (parentSubmenu) {
                        const parentItem = document.querySelector(`[data-submenu="${parentSubmenu.id.replace('-submenu', '')}"]`);
                        if (parentItem) {
                            parentItem.classList.add('active');
                            parentSubmenu.classList.add('show');
                        }
                    }
                }
            }
        }

        // تحديث البيانات المعروضة في الصفحة
        function updatePageData(pageName) {
            switch(pageName) {
                case 'dashboard':
                    updateDashboard();
                    break;
                case 'employees-list':
                    loadEmployees();
                    break;
                case 'attendance':
                    updateAttendanceData();
                    break;
                case 'attendance-reports':
                    loadAttendanceReportEmployees();
                    break;
                case 'salaries':
                    updateSalaryMonth();
                    break;
                case 'salary-reports':
                    loadSalaryReportEmployees();
                    break;
                case 'barcode':
                    loadBarcodeEmployees();
                    break;
                case 'users':
                    loadUsers();
                    break;
                case 'logs':
                    loadLogs();
                    break;
                case 'settings':
                    loadSettings();
                    break;
                case 'employee-categories':
                    loadCategories();
                    break;
            }
        }

        // ==============================
        // إدارة المستخدمين والصلاحيات
        // ==============================

        // التحقق من صلاحيات المستخدم
        function hasPermission(permission) {
            if (!currentUser) return false;
            
            const rolePermissions = {
                'admin': ['all'],
                'manager': ['manage_employees', 'view_reports', 'manage_salaries', 'view_attendance'],
                'deputy': ['manage_employees', 'view_reports', 'approve_salaries', 'view_attendance'],
                'supervisor': ['view_employees', 'manage_attendance', 'view_reports'],
                'hr': ['manage_employees', 'manage_attendance', 'view_reports'],
                'accountant': ['view_employees', 'manage_salaries', 'view_reports'],
                'employee': ['view_profile', 'view_attendance', 'view_salary']
            };
            
            if (currentUser.role === 'admin' || rolePermissions[currentUser.role].includes('all')) {
                return true;
            }
            
            return rolePermissions[currentUser.role].includes(permission);
        }

       // تسجيل الدخول
function login(username, password) {
    console.log('محاولة تسجيل الدخول بـ:', username);
    
    // التحقق من تهيئة userData
    if (!userData || userData.length === 0) {
        console.error('بيانات المستخدمين غير متوفرة!');
        // تهيئة بيانات المستخدم مباشرة
        userData = [{
            id: 'admin',
            username: 'admin',
            password: 'admin',
            fullname: 'مدير النظام',
            email: 'admin@example.com',
            role: 'admin',
            status: 'active',
            createdAt: new Date()
        }];
        console.log('تم إنشاء مستخدم افتراضي:', userData);
    }
    
    const user = userData.find(u => u.username === username && u.password === password && u.status === 'active');
    
    if (user) {
        console.log('تم العثور على المستخدم:', user);
        currentUser = user;
        
        try {
            // عناصر واجهة المستخدم
            const loginError = document.getElementById('login-error');
            const loginPage = document.getElementById('login-page');
            const appPage = document.getElementById('app-page');
            const sidebar = document.getElementById('sidebar');
            
            if (loginError) loginError.style.display = 'none';
            
            if (loginPage) {
                console.log('إخفاء صفحة تسجيل الدخول');
                loginPage.classList.remove('active');
            } else {
                console.error('عنصر login-page غير موجود!');
            }
            
            if (appPage) {
                console.log('إظهار صفحة التطبيق');
                appPage.classList.add('active');
            } else {
                console.error('عنصر app-page غير موجود!');
            }
            
            if (sidebar) {
                console.log('إظهار الشريط الجانبي');
                sidebar.classList.remove('sidebar-hidden');
            } else {
                console.error('عنصر sidebar غير موجود!');
            }
            
            // تحديث واجهة المستخدم
            const userDisplayName = document.getElementById('user-display-name');
            const userRole = document.querySelector('.user-role');
            const userRoleDisplay = document.getElementById('user-role-display');
            
            if (userDisplayName) userDisplayName.textContent = user.fullname;
            if (userRole) userRole.textContent = getUserRoleDisplay(user.role);
            if (userRoleDisplay) userRoleDisplay.textContent = getUserRoleDisplay(user.role);
            
            // إخفاء/إظهار العناصر حسب صلاحيات المستخدم
            updateUIBasedOnPermissions();
            
            // تحديث لوحة القيادة
            console.log('الانتقال إلى لوحة القيادة');
            navigateTo('dashboard');
            
            // إضافة سجل لتسجيل الدخول
            addLog('تسجيل دخول', 'login');
            
            console.log('تم تسجيل الدخول بنجاح');
            return true;
        } catch (error) {
            console.error('خطأ أثناء تسجيل الدخول:', error);
            return false;
        }
    } else {
        console.log('فشل تسجيل الدخول: المستخدم غير موجود أو كلمة المرور غير صحيحة');
        const loginError = document.getElementById('login-error');
        if (loginError) loginError.style.display = 'block';
        return false;
    }
}
        // تسجيل الخروج
        function logout() {
            // إضافة سجل لتسجيل الخروج
            addLog('تسجيل خروج', 'logout');
            
            currentUser = null;
            document.getElementById('app-page').classList.remove('active');
            document.getElementById('login-page').classList.add('active');
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            document.getElementById('sidebar').classList.add('sidebar-hidden');
        }

        // تحديث واجهة المستخدم بناءً على صلاحيات المستخدم
        function updateUIBasedOnPermissions() {
            // إخفاء/إظهار عناصر القائمة
            if (!hasPermission('manage_users')) {
                document.querySelectorAll('.admin-only').forEach(item => {
                    item.style.display = 'none';
                });
            } else {
                document.querySelectorAll('.admin-only').forEach(item => {
                    item.style.display = 'block';
                });
            }
        }

        // الحصول على اسم العرض للدور
        function getUserRoleDisplay(role) {
            const roleDisplay = {
                'admin': 'مدير النظام',
                'manager': 'المدير',
                'deputy': 'نائب المدير',
                'supervisor': 'المشرف',
                'hr': 'مدير الموارد البشرية',
                'accountant': 'محاسب',
                'employee': 'موظف'
            };
            
            return roleDisplay[role] || role;
        }

        // ==============================
        // إدارة لوحة القيادة
        // ==============================

        // تحديث لوحة القيادة
        function updateDashboard() {
            // تحديث إحصاءات الموظفين
            document.getElementById('total-employees').textContent = employeeData.length;
            
            // حساب الحاضرين والغائبين اليوم
            const today = formatDate(new Date());
            const todayAttendance = attendanceData.filter(a => formatDate(a.date) === today);
            const presentEmployees = [...new Set(todayAttendance.map(a => a.employeeId))];
            const absentEmployees = employeeData.filter(e => !presentEmployees.includes(e.id));
            
            document.getElementById('present-today').textContent = presentEmployees.length;
            document.getElementById('absent-today').textContent = absentEmployees.length;
            
            // حساب إجمالي الرواتب
            const totalSalaries = employeeData.reduce((sum, employee) => sum + parseInt(employee.basicSalary || 0), 0);
            document.getElementById('total-salaries').textContent = totalSalaries.toLocaleString() + ' د.ع';
            
            // تحديث أحدث الإجراءات
            updateRecentActions();
            
            // تحديث الموظفين الجدد
            updateNewEmployees();
            
            // تحديث الرسم البياني
            updateAttendanceChart();
        }

        // تحديث أحدث الإجراءات
        function updateRecentActions() {
            const recentActions = logsData
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 5);
            
            const tbody = document.querySelector('#recent-actions tbody');
            tbody.innerHTML = '';
            
            if (recentActions.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="4" class="text-center">لا توجد إجراءات حديثة</td>`;
                tbody.appendChild(tr);
                return;
            }
            
            recentActions.forEach(action => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${action.action}</td>
                    <td>${action.username}</td>
                    <td>${formatDateTime(action.timestamp)}</td>
                    <td>${action.details || '-'}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        // تحديث الموظفين الجدد
        function updateNewEmployees() {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            
            const newEmployees = employeeData
                .filter(e => new Date(e.joinDate) >= oneMonthAgo)
                .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
                .slice(0, 5);
            
            const tbody = document.querySelector('#new-employees tbody');
            tbody.innerHTML = '';
            
            if (newEmployees.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="5" class="text-center">لا يوجد موظفون جدد</td>`;
                tbody.appendChild(tr);
                return;
            }
            
            newEmployees.forEach(employee => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${employee.name}</td>
                    <td>${employee.jobTitle}</td>
                    <td>${employee.department}</td>
                    <td>${formatDate(employee.joinDate)}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="viewEmployee('${employee.id}')">
                            <i class="fas fa-eye"></i>
                            عرض
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        // تحديث الرسم البياني
        function updateAttendanceChart() {
            const chartContainer = document.getElementById('attendance-chart');
            
            // إذا كانت هناك مكتبة Chart.js متاحة
            if (typeof Chart !== 'undefined' && chartContainer) {
                // إنشاء مجموعة بيانات للأيام السبعة الماضية
                const labels = [];
                const presentData = [];
                const absentData = [];
                
                const today = new Date();
                
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(today.getDate() - i);
                    
                    const dateStr = formatDate(date);
                    labels.push(getDayName(date.getDay()));
                    
                    const dayAttendance = attendanceData.filter(a => formatDate(a.date) === dateStr);
                    const presentEmployees = [...new Set(dayAttendance.map(a => a.employeeId))];
                    
                    presentData.push(presentEmployees.length);
                    absentData.push(employeeData.length - presentEmployees.length);
                }
                
                // تدمير الرسم البياني الحالي إذا كان موجودًا
                if (window.attendanceChart) {
                    window.attendanceChart.destroy();
                }
                
                // إنشاء رسم بياني جديد
                window.attendanceChart = new Chart(chartContainer, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'الحضور',
                                data: presentData,
                                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                borderColor: 'rgba(59, 130, 246, 1)',
                                borderWidth: 2,
                                tension: 0.3
                            },
                            {
                                label: 'الغياب',
                                data: absentData,
                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                borderColor: 'rgba(239, 68, 68, 1)',
                                borderWidth: 2,
                                tension: 0.3
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                rtl: true,
                                labels: {
                                    usePointStyle: true,
                                    font: {
                                        family: 'Cairo'
                                    }
                                }
                            },
                            tooltip: {
                                rtl: true,
                                titleFont: {
                                    family: 'Cairo'
                                },
                                bodyFont: {
                                    family: 'Cairo'
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                },
                                ticks: {
                                    font: {
                                        family: 'Cairo'
                                    }
                                }
                            },
                            x: {
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                },
                                ticks: {
                                    font: {
                                        family: 'Cairo'
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }

        // الحصول على اسم اليوم
        function getDayName(dayIndex) {
            const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
            return days[dayIndex];
        }

        // ==============================
        // إدارة الموظفين
        // ==============================

        // تحميل قائمة الموظفين
        function loadEmployees() {
            const tbody = document.querySelector('#employees-table tbody');
            tbody.innerHTML = '';
            
            // تطبيق الفلترة إذا كانت موجودة
            const searchTerm = document.getElementById('employee-search').value.toLowerCase();
            const departmentFilter = document.getElementById('employee-filter').value;
            
            let filteredEmployees = employeeData;
            
            if (searchTerm) {
                filteredEmployees = filteredEmployees.filter(e => 
                    e.name.toLowerCase().includes(searchTerm) || 
                    e.jobTitle.toLowerCase().includes(searchTerm) || 
                    e.department.toLowerCase().includes(searchTerm) || 
                    (e.id && e.id.toLowerCase().includes(searchTerm))
                );
            }
            
            if (departmentFilter) {
                filteredEmployees = filteredEmployees.filter(e => e.department === departmentFilter);
            }
            
            if (filteredEmployees.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="8" class="text-center">لا توجد بيانات للعرض</td>`;
                tbody.appendChild(tr);
                return;
            }
            
            filteredEmployees.forEach(employee => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${employee.id}</td>
                    <td>${employee.name}</td>
                    <td>${employee.jobTitle}</td>
                    <td>${employee.department}</td>
                    <td>${formatDate(employee.joinDate)}</td>
                    <td>${parseInt(employee.basicSalary).toLocaleString()} د.ع</td>
                    <td>
                        <span class="status-badge ${employee.status === 'active' ? 'status-active' : 'status-inactive'}">
                            <i class="fas fa-${employee.status === 'active' ? 'check-circle' : 'times-circle'}"></i>
                            ${employee.status === 'active' ? 'نشط' : 'غير نشط'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="viewEmployee('${employee.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="editEmployee('${employee.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${employee.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        // عرض موظف
        function viewEmployee(employeeId) {
            const employee = employeeData.find(e => e.id === employeeId);
            if (!employee) return;
            
            // تحويل إلى صفحة التعديل مع وضعها في وضع القراءة فقط
            editEmployee(employeeId, true);
        }

        // تعديل موظف
        function editEmployee(employeeId, readOnly = false) {
            const employee = employeeData.find(e => e.id === employeeId);
            if (!employee) return;
            
            // الانتقال إلى صفحة إضافة موظف
            navigateTo('add-employee');
            
            // تغيير عنوان الصفحة
            document.querySelector('#add-employee .page-title').innerHTML = `
                <i class="fas fa-${readOnly ? 'user' : 'user-edit'}"></i>
                ${readOnly ? 'عرض بيانات الموظف' : 'تعديل بيانات الموظف'}
            `;
            
            // تعبئة النموذج ببيانات الموظف
            document.getElementById('employee-id').value = employee.id;
            document.getElementById('employee-name').value = employee.name;
            document.getElementById('employee-national-id').value = employee.nationalId;
            document.getElementById('employee-dob').value = formatDate(employee.dob);
            document.getElementById('employee-gender').value = employee.gender;
            document.getElementById('employee-phone').value = employee.phone;
            document.getElementById('employee-email').value = employee.email || '';
            document.getElementById('employee-address').value = employee.address || '';
            document.getElementById('employee-job-title').value = employee.jobTitle;
            document.getElementById('employee-department').value = employee.department;
            document.getElementById('employee-join-date').value = formatDate(employee.joinDate);
            document.getElementById('employee-type').value = employee.employmentType;
            document.getElementById('employee-basic-salary').value = employee.basicSalary;
            document.getElementById('employee-salary-type').value = employee.salaryType;
            document.getElementById('employee-admin-order').value = employee.adminOrder || '';
            document.getElementById('employee-admin-order-date').value = employee.adminOrderDate ? formatDate(employee.adminOrderDate) : '';
            document.getElementById('employee-work-hours').value = employee.workHours || 8;
            document.getElementById('employee-work-days').value = employee.workDays || 5;
            document.getElementById('employee-check-in-time').value = employee.checkInTime || '08:00';
            document.getElementById('employee-check-out-time').value = employee.checkOutTime || '16:00';
            document.getElementById('employee-notes').value = employee.notes || '';
            
            // تعبئة العلاوات
            loadAllowances(employee.allowances || []);
            
            // تعبئة الاستقطاعات
            loadDeductions(employee.deductions || []);
            
            // تنشيط علامة التبويب الأولى
            activateTab('basic-info');
            
            // وضع النموذج في وضع القراءة فقط إذا كان مطلوبًا
            if (readOnly) {
                document.querySelectorAll('#employee-form input, #employee-form select, #employee-form textarea').forEach(input => {
                    input.setAttribute('readonly', true);
                    input.setAttribute('disabled', true);
                });
                document.querySelectorAll('#employee-form button:not([onclick="navigateTo(\'employees-list\')"])').forEach(button => {
                    button.style.display = 'none';
                });
            } else {
                document.querySelectorAll('#employee-form input, #employee-form select, #employee-form textarea').forEach(input => {
                    input.removeAttribute('readonly');
                    input.removeAttribute('disabled');
                });
                document.querySelectorAll('#employee-form button').forEach(button => {
                    button.style.display = 'inline-flex';
                });
            }
        }

        // حذف موظف
        function deleteEmployee(employeeId) {
            showConfirmModal('هل أنت متأكد من حذف هذا الموظف؟', () => {
                employeeData = employeeData.filter(e => e.id !== employeeId);
                saveEmployees();
                loadEmployees();
                showNotification('تم حذف الموظف بنجاح');
                addLog(`تم حذف الموظف (${employeeId})`, 'delete');
            });
        }

        // تحميل العلاوات
        function loadAllowances(allowances) {
            const container = document.getElementById('allowances-container');
            container.innerHTML = '';
            
            if (allowances.length === 0) {
                const row = document.createElement('div');
                row.className = 'form-grid mb-2';
                row.innerHTML = `
                    <div class="form-group m-0">
                        <input type="text" class="form-control allowance-name" placeholder="اسم العلاوة">
                    </div>
                    <div class="form-group m-0">
                        <input type="number" class="form-control allowance-amount" placeholder="المبلغ">
                    </div>
                `;
                container.appendChild(row);
                return;
            }
            
            allowances.forEach(allowance => {
                const row = document.createElement('div');
                row.className = 'form-grid mb-2';
                row.innerHTML = `
                    <div class="form-group m-0">
                        <input type="text" class="form-control allowance-name" placeholder="اسم العلاوة" value="${allowance.name}">
                    </div>
                    <div class="form-group m-0">
                        <input type="number" class="form-control allowance-amount" placeholder="المبلغ" value="${allowance.amount}">
                    </div>
                `;
                container.appendChild(row);
            });
        }

        // تحميل الاستقطاعات
        function loadDeductions(deductions) {
            const container = document.getElementById('deductions-container');
            container.innerHTML = '';
            
            if (deductions.length === 0) {
                const row = document.createElement('div');
                row.className = 'form-grid mb-2';
                row.innerHTML = `
                    <div class="form-group m-0">
                        <input type="text" class="form-control deduction-name" placeholder="اسم الاستقطاع">
                    </div>
                    <div class="form-group m-0">
                        <input type="number" class="form-control deduction-amount" placeholder="المبلغ">
                    </div>
                `;
                container.appendChild(row);
                return;
            }
            
            deductions.forEach(deduction => {
                const row = document.createElement('div');
                row.className = 'form-grid mb-2';
                row.innerHTML = `
                    <div class="form-group m-0">
                        <input type="text" class="form-control deduction-name" placeholder="اسم الاستقطاع" value="${deduction.name}">
                    </div>
                    <div class="form-group m-0">
                        <input type="number" class="form-control deduction-amount" placeholder="المبلغ" value="${deduction.amount}">
                    </div>
                `;
                container.appendChild(row);
            });
        }

        // جمع بيانات العلاوات
        function collectAllowances() {
            const allowances = [];
            const namesElements = document.querySelectorAll('.allowance-name');
            const amountsElements = document.querySelectorAll('.allowance-amount');
            
            for (let i = 0; i < namesElements.length; i++) {
                const name = namesElements[i].value.trim();
                const amount = amountsElements[i].value.trim();
                
                if (name && amount) {
                    allowances.push({
                        name,
                        amount: parseInt(amount)
                    });
                }
            }
            
            return allowances;
        }

        // جمع بيانات الاستقطاعات
        function collectDeductions() {
            const deductions = [];
            const namesElements = document.querySelectorAll('.deduction-name');
            const amountsElements = document.querySelectorAll('.deduction-amount');
            
            for (let i = 0; i < namesElements.length; i++) {
                const name = namesElements[i].value.trim();
                const amount = amountsElements[i].value.trim();
                
                if (name && amount) {
                    deductions.push({
                        name,
                        amount: parseInt(amount)
                    });
                }
            }
            
            return deductions;
        }

        // حفظ بيانات الموظفين
        function saveEmployees() {
            localStorage.setItem('employeeData', JSON.stringify(employeeData));
        }

        // حفظ بيانات الموظف
        function saveEmployee() {
            const employeeId = document.getElementById('employee-id').value;
            const name = document.getElementById('employee-name').value;
            const nationalId = document.getElementById('employee-national-id').value;
            const dob = document.getElementById('employee-dob').value;
            const gender = document.getElementById('employee-gender').value;
            const phone = document.getElementById('employee-phone').value;
            const email = document.getElementById('employee-email').value;
            const address = document.getElementById('employee-address').value;
            const jobTitle = document.getElementById('employee-job-title').value;
            const department = document.getElementById('employee-department').value;
            const joinDate = document.getElementById('employee-join-date').value;
            const employmentType = document.getElementById('employee-type').value;
            const basicSalary = document.getElementById('employee-basic-salary').value;
            const salaryType = document.getElementById('employee-salary-type').value;
            const adminOrder = document.getElementById('employee-admin-order').value;
            const adminOrderDate = document.getElementById('employee-admin-order-date').value;
            const workHours = document.getElementById('employee-work-hours').value;
            const workDays = document.getElementById('employee-work-days').value;
            const checkInTime = document.getElementById('employee-check-in-time').value;
            const checkOutTime = document.getElementById('employee-check-out-time').value;
            const notes = document.getElementById('employee-notes').value;
            
            // التحقق من إدخال البيانات المطلوبة
            if (!name || !nationalId || !jobTitle || !department || !joinDate || !basicSalary) {
                showNotification('الرجاء إدخال جميع البيانات المطلوبة', 'error');
                return;
            }
            
            // جمع العلاوات والاستقطاعات
            const allowances = collectAllowances();
            const deductions = collectDeductions();
            
            if (employeeId) {
                // تعديل موظف موجود
                const index = employeeData.findIndex(e => e.id === employeeId);
                if (index !== -1) {
                    employeeData[index] = {
                        ...employeeData[index],
                        name,
                        nationalId,
                        dob,
                        gender,
                        phone,
                        email,
                        address,
                        jobTitle,
                        department,
                        joinDate,
                        employmentType,
                        basicSalary,
                        salaryType,
                        adminOrder,
                        adminOrderDate,
                        workHours,
                        workDays,
                        checkInTime,
                        checkOutTime,
                        notes,
                        allowances,
                        deductions,
                        updatedAt: new Date(),
                        updatedBy: currentUser.id
                    };
                }
            } else {
                // إضافة موظف جديد
                const newEmployee = {
                    id: generateId(),
                    name,
                    nationalId,
                    dob,
                    gender,
                    phone,
                    email,
                    address,
                    jobTitle,
                    department,
                    joinDate,
                    employmentType,
                    basicSalary,
                    salaryType,
                    adminOrder,
                    adminOrderDate,
                    workHours,
                    workDays,
                    checkInTime,
                    checkOutTime,
                    notes,
                    allowances,
                    deductions,
                    status: 'active',
                    createdAt: new Date(),
                    createdBy: currentUser.id
                };
                
                employeeData.push(newEmployee);
            }
            
            // حفظ البيانات
            saveEmployees();
            
            // التنقل إلى قائمة الموظفين
            navigateTo('employees-list');
            
            // عرض إشعار
            showNotification(employeeId ? 'تم تعديل بيانات الموظف بنجاح' : 'تم إضافة الموظف بنجاح');
            
            // إضافة سجل
            addLog(employeeId ? `تم تعديل الموظف (${name})` : `تم إضافة موظف جديد (${name})`, employeeId ? 'update' : 'create');
        }

        // ==============================
        // إدارة تصنيفات الموظفين
        // ==============================

        // تحميل التصنيفات
        function loadCategories() {
            const tbody = document.querySelector('#categories-table tbody');
            tbody.innerHTML = '';
            
            if (categoryData.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="4" class="text-center">لا توجد تصنيفات للعرض</td>`;
                tbody.appendChild(tr);
                return;
            }
            
            categoryData.forEach(category => {
                // حساب عدد الموظفين في هذا التصنيف
                const employeesCount = employeeData.filter(e => e.categories && e.categories.includes(category.id)).length;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${category.name}</td>
                    <td>${category.description || '-'}</td>
                    <td>${employeesCount}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editCategory('${category.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteCategory('${category.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        // إضافة تصنيف جديد
        function addCategory() {
            // إعادة تعيين النموذج
            document.getElementById('category-id').value = '';
            document.getElementById('category-name').value = '';
            document.getElementById('category-description').value = '';
            
            // تغيير عنوان النافذة
            document.getElementById('category-modal-title').textContent = 'إضافة تصنيف جديد';
            
            // إظهار النافذة
            document.getElementById('category-modal-backdrop').classList.add('show');
            document.getElementById('category-modal').classList.add('show');
        }

        // تعديل تصنيف
        function editCategory(categoryId) {
            const category = categoryData.find(c => c.id === categoryId);
            if (!category) return;
            
            // تعبئة النموذج
            document.getElementById('category-id').value = category.id;
            document.getElementById('category-name').value = category.name;
            document.getElementById('category-description').value = category.description || '';
            
            // تغيير عنوان النافذة
            document.getElementById('category-modal-title').textContent = 'تعديل التصنيف';
            
            // إظهار النافذة
            document.getElementById('category-modal-backdrop').classList.add('show');
            document.getElementById('category-modal').classList.add('show');
        }

        // حذف تصنيف
        function deleteCategory(categoryId) {
            showConfirmModal('هل أنت متأكد من حذف هذا التصنيف؟', () => {
                categoryData = categoryData.filter(c => c.id !== categoryId);
                saveCategories();
                loadCategories();
                showNotification('تم حذف التصنيف بنجاح');
                addLog(`تم حذف التصنيف (${categoryId})`, 'delete');
            });
        }

        // حفظ التصنيف
        function saveCategory() {
            const categoryId = document.getElementById('category-id').value;
            const name = document.getElementById('category-name').value;
            const description = document.getElementById('category-description').value;
            
            // التحقق من إدخال البيانات المطلوبة
            if (!name) {
                showNotification('الرجاء إدخال اسم التصنيف', 'error');
                return;
            }
            
            if (categoryId) {
                // تعديل تصنيف موجود
                const index = categoryData.findIndex(c => c.id === categoryId);
                if (index !== -1) {
                    categoryData[index] = {
                        ...categoryData[index],
                        name,
                        description,
                        updatedAt: new Date(),
                        updatedBy: currentUser.id
                    };
                }
            } else {
                // إضافة تصنيف جديد
                const newCategory = {
                    id: generateId(),
                    name,
                    description,
                    createdAt: new Date(),
                    createdBy: currentUser.id
                };
                
                categoryData.push(newCategory);
            }
            
            // حفظ البيانات
            saveCategories();
            
            // إخفاء النافذة
            document.getElementById('category-modal-backdrop').classList.remove('show');
            document.getElementById('category-modal').classList.remove('show');
            
            // تحديث قائمة التصنيفات
            loadCategories();
            
            // عرض إشعار
            showNotification(categoryId ? 'تم تعديل التصنيف بنجاح' : 'تم إضافة التصنيف بنجاح');
            
            // إضافة سجل
            addLog(categoryId ? `تم تعديل التصنيف (${name})` : `تم إضافة تصنيف جديد (${name})`, categoryId ? 'update' : 'create');
        }

        // ==============================
        // إدارة الحضور والانصراف
        // ==============================

        // تحديث بيانات الحضور
        function updateAttendanceData() {
            // تحديث الحضور لليوم الحالي
            loadTodayAttendance();
            
            // التركيز على حقل الباركود
            document.getElementById('attendance-barcode').focus();
        }

        // تحميل حضور اليوم
        function loadTodayAttendance() {
            const today = formatDate(new Date());
            const todayAttendance = attendanceData.filter(a => formatDate(a.date) === today);
            
            const tbody = document.querySelector('#today-attendance-table tbody');
            tbody.innerHTML = '';
            
            if (todayAttendance.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="6" class="text-center">لا توجد بيانات حضور لليوم</td>`;
                tbody.appendChild(tr);
                return;
            }
            
            todayAttendance.sort((a, b) => a.checkIn > b.checkIn ? -1 : 1).forEach(record => {
                const employee = employeeData.find(e => e.id === record.employeeId);
                if (!employee) return;
                
                const tr = document.createElement('tr');
                
                // تحديد لون الصف حسب الحالة
                let statusClass = '';
                let statusText = getAttendanceStatus(record);
                
                if (statusText === 'حاضر') {
                    statusClass = 'status-active';
                } else if (statusText === 'متأخر' || statusText === 'مغادرة مبكرة') {
                    statusClass = 'status-pending';
                } else if (statusText === 'غائب') {
                    statusClass = 'status-inactive';
                }
                
                tr.innerHTML = `
                    <td>${employee.name}</td>
                    <td>${formatDate(record.date)}</td>
                    <td>${formatTime(record.checkIn)}</td>
                    <td>${record.checkOut ? formatTime(record.checkOut) : '-'}</td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            <i class="fas fa-${statusText === 'حاضر' ? 'check-circle' : statusText === 'غائب' ? 'times-circle' : 'exclamation-circle'}"></i>
                            ${statusText}
                        </span>
                    </td>
                    <td>${record.notes || '-'}</td>
                `;
                
                tbody.appendChild(tr);
            });
        }

        // الحصول على حالة الحضور
        function getAttendanceStatus(record) {
            if (!record.checkIn) return 'غائب';
            if (!record.checkOut) return 'في العمل';
            
            const employee = employeeData.find(e => e.id === record.employeeId);
            if (!employee) return 'غير معروف';
            
            const checkInTime = new Date(record.checkIn);
            const checkOutTime = new Date(record.checkOut);
            const scheduledCheckIn = new Date(record.date + 'T' + (employee.checkInTime || '08:00') + ':00');
            const scheduledCheckOut = new Date(record.date + 'T' + (employee.checkOutTime || '16:00') + ':00');
            
            const lateMinutes = Math.floor((checkInTime - scheduledCheckIn) / 60000);
            const earlyMinutes = Math.floor((scheduledCheckOut - checkOutTime) / 60000);
            
            if (lateMinutes > 15) return 'متأخر';
            if (earlyMinutes > 15) return 'مغادرة مبكرة';
            
            return 'حاضر';
        }
// عرض نتيجة تسجيل الحضور
function showAttendanceResult(message, type) {
    const resultElement = document.getElementById('attendance-result');
    const messageElement = document.getElementById('attendance-message');
    
    resultElement.style.display = 'block';
    messageElement.innerHTML = message;
    
    if (type === 'success') {
        messageElement.className = 'scanner-success';
    } else if (type === 'error') {
        messageElement.className = 'scanner-error';
    } else {
        messageElement.className = '';
    }
    
    // مسح حقل الباركود
    document.getElementById('attendance-barcode').value = '';
    document.getElementById('attendance-barcode').focus();
}

// حفظ بيانات الحضور
function saveAttendance() {
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
}

// حفظ بيانات التصنيفات
function saveCategories() {
    localStorage.setItem('categoryData', JSON.stringify(categoryData));
}

// تحميل موظفي تقرير الحضور
function loadAttendanceReportEmployees() {
    const select = document.getElementById('attendance-employee');
    
    // الاحتفاظ بالقيمة المحددة
    const selectedValue = select.value;
    
    // مسح القائمة
    select.innerHTML = '<option value="">جميع الموظفين</option>';
    
    // إضافة الموظفين
    employeeData.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        select.appendChild(option);
    });
    
    // إعادة تحديد القيمة المحددة
    if (selectedValue) {
        select.value = selectedValue;
    }
}

// إنشاء تقرير الحضور
function generateAttendanceReport() {
    const fromDate = document.getElementById('attendance-date-from').value;
    const toDate = document.getElementById('attendance-date-to').value;
    const employeeId = document.getElementById('attendance-employee').value;
    const department = document.getElementById('attendance-department').value;
    const status = document.getElementById('attendance-status').value;
    
    // التحقق من إدخال التواريخ
    if (!fromDate || !toDate) {
        showNotification('الرجاء تحديد نطاق التاريخ', 'warning');
        return;
    }
    
    // فلترة البيانات
    let filteredData = attendanceData.filter(record => {
        const recordDate = record.date;
        return recordDate >= fromDate && recordDate <= toDate;
    });
    
    // فلترة حسب الموظف
    if (employeeId) {
        filteredData = filteredData.filter(record => record.employeeId === employeeId);
    }
    
    // فلترة حسب القسم
    if (department) {
        filteredData = filteredData.filter(record => {
            const employee = employeeData.find(e => e.id === record.employeeId);
            return employee && employee.department === department;
        });
    }
    
    // فلترة حسب الحالة
    if (status) {
        filteredData = filteredData.filter(record => record.status === status);
    }
    
    // عرض النتائج
    displayAttendanceReport(filteredData);
}

// عرض تقرير الحضور
function displayAttendanceReport(data) {
    const tbody = document.querySelector('#attendance-report-table tbody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="9" class="text-center">لا توجد بيانات للعرض</td>`;
        tbody.appendChild(tr);
        
        // إخفاء ملخص التقرير
        document.getElementById('attendance-report-summary').innerHTML = '';
        return;
    }
    
    // فرز البيانات حسب التاريخ
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // عرض البيانات
    data.forEach(record => {
        const employee = employeeData.find(e => e.id === record.employeeId);
        if (!employee) return;
        
        const recordDate = new Date(record.date);
        const dayName = getDayName(recordDate.getDay());
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${employee.name}</td>
            <td>${employee.department}</td>
            <td>${formatDate(record.date)}</td>
            <td>${dayName}</td>
            <td>${record.checkIn ? formatTime(record.checkIn) : '-'}</td>
            <td>${record.checkOut ? formatTime(record.checkOut) : '-'}</td>
            <td>${record.hoursWorked || '-'}</td>
            <td>
                <span class="status-badge ${record.status === 'حاضر' ? 'status-active' : record.status === 'غائب' ? 'status-inactive' : 'status-pending'}">
                    ${record.status || '-'}
                </span>
            </td>
            <td>${record.notes || '-'}</td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // عرض ملخص التقرير
    displayAttendanceReportSummary(data);
}

// عرض ملخص تقرير الحضور
function displayAttendanceReportSummary(data) {
    const summary = document.getElementById('attendance-report-summary');
    
    // حساب الإحصائيات
    const totalRecords = data.length;
    const presentCount = data.filter(r => r.status === 'حاضر').length;
    const absentCount = data.filter(r => r.status === 'غائب').length;
    const lateCount = data.filter(r => r.status === 'متأخر').length;
    const earlyLeaveCount = data.filter(r => r.status === 'مغادرة مبكرة').length;
    
    // إجمالي ساعات العمل
    const totalHours = data.reduce((sum, record) => {
        return sum + (parseFloat(record.hoursWorked) || 0);
    }, 0);
    
    // عرض الملخص
    summary.innerHTML = `
        <div class="flex flex-wrap gap-4 mt-4">
            <div class="summary-card">
                <div class="summary-value">${totalRecords}</div>
                <div class="summary-label">إجمالي السجلات</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${presentCount}</div>
                <div class="summary-label">الحضور</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${absentCount}</div>
                <div class="summary-label">الغياب</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${lateCount}</div>
                <div class="summary-label">التأخير</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${earlyLeaveCount}</div>
                <div class="summary-label">المغادرة المبكرة</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${totalHours.toFixed(2)}</div>
                <div class="summary-label">إجمالي ساعات العمل</div>
            </div>
        </div>
    `;
}

// تحديث شهر الراتب
function updateSalaryMonth() {
    // تعيين الشهر والسنة الحاليين
    const now = new Date();
    document.getElementById('salary-month').value = now.getMonth() + 1;
    document.getElementById('salary-year').value = now.getFullYear();
}

// توليد كشف الرواتب
function generateSalarySheet() {
    const month = parseInt(document.getElementById('salary-month').value);
    const year = parseInt(document.getElementById('salary-year').value);
    const department = document.getElementById('salary-department').value;
    
    // تحديد الشهر
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    
    const monthStartStr = formatDate(monthStart);
    const monthEndStr = formatDate(monthEnd);
    
    // فلترة الموظفين حسب القسم
    let filteredEmployees = employeeData;
    
    if (department) {
        filteredEmployees = filteredEmployees.filter(e => e.department === department);
    }
    
    // إنشاء كشف الرواتب
    const salarySheet = [];
    
    filteredEmployees.forEach(employee => {
        // حساب أيام العمل
        const attendanceRecords = attendanceData.filter(record => 
            record.employeeId === employee.id && 
            record.date >= monthStartStr && 
            record.date <= monthEndStr &&
            record.checkIn && record.checkOut
        );
        
        const workDays = attendanceRecords.length;
        
        // حساب ساعات العمل
        const workHours = attendanceRecords.reduce((sum, record) => {
            return sum + (parseFloat(record.hoursWorked) || 0);
        }, 0);
        
        // حساب الراتب الأساسي
        let basicSalary = parseInt(employee.basicSalary) || 0;
        
        // حساب العلاوات
        const allowancesTotal = (employee.allowances || []).reduce((sum, allowance) => {
            return sum + (parseInt(allowance.amount) || 0);
        }, 0);
        
        // حساب الاستقطاعات
        const deductionsTotal = (employee.deductions || []).reduce((sum, deduction) => {
            return sum + (parseInt(deduction.amount) || 0);
        }, 0);
        
        // حساب إجمالي الراتب
        const totalSalary = basicSalary + allowancesTotal - deductionsTotal;
        
        // إضافة السجل
        salarySheet.push({
            id: generateId(),
            employeeId: employee.id,
            month,
            year,
            basicSalary,
            allowances: allowancesTotal,
            deductions: deductionsTotal,
            totalSalary,
            workDays,
            workHours,
            status: 'pending', // pending, approved, paid
            createdAt: new Date(),
            createdBy: currentUser.id
        });
    });
    
    // عرض كشف الرواتب
    displaySalarySheet(salarySheet);
}

// عرض كشف الرواتب
function displaySalarySheet(data) {
    const tbody = document.querySelector('#salary-sheet-table tbody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="8" class="text-center">لا توجد بيانات للعرض</td>`;
        tbody.appendChild(tr);
        return;
    }
    
    // عرض البيانات
    data.forEach(record => {
        const employee = employeeData.find(e => e.id === record.employeeId);
        if (!employee) return;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${employee.name}</td>
            <td>${employee.department}</td>
            <td>${employee.jobTitle}</td>
            <td>${record.basicSalary.toLocaleString()} د.ع</td>
            <td>${record.allowances.toLocaleString()} د.ع</td>
            <td>${record.deductions.toLocaleString()} د.ع</td>
            <td>${record.totalSalary.toLocaleString()} د.ع</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewSalaryDetails('${record.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editSalary('${record.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="printSalarySlip('${record.id}')">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // حفظ بيانات الرواتب
    salaryData = data;
    saveSalaries();
}

// حفظ بيانات الرواتب
function saveSalaries() {
    localStorage.setItem('salaryData', JSON.stringify(salaryData));
}

// عرض تفاصيل الراتب
function viewSalaryDetails(salaryId) {
    const salary = salaryData.find(s => s.id === salaryId);
    if (!salary) return;
    
    const employee = employeeData.find(e => e.id === salary.employeeId);
    if (!employee) return;
    
    // عرض التفاصيل
    const content = document.getElementById('salary-details-content');
    
    // تحديد الشهر بالعربية
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthName = months[salary.month - 1];
    
    content.innerHTML = `
        <div class="salary-details">
            <h3 class="mb-4 text-lg font-bold text-primary">تفاصيل راتب ${employee.name} لشهر ${monthName} ${salary.year}</h3>
            
            <div class="mb-4">
                <div class="flex justify-between mb-2">
                    <span>القسم:</span>
                    <span>${employee.department}</span>
                </div>
                <div class="flex justify-between mb-2">
                    <span>المسمى الوظيفي:</span>
                    <span>${employee.jobTitle}</span>
                </div>
                <div class="flex justify-between mb-2">
                    <span>أيام العمل:</span>
                    <span>${salary.workDays} / ${employee.workDays || 22} يوم</span>
                </div>
                <div class="flex justify-between mb-2">
                    <span>ساعات العمل:</span>
                    <span>${salary.workHours.toFixed(2)} ساعة</span>
                </div>
            </div>
            
            <div class="salary-row">
                <div class="salary-label">الراتب الأساسي</div>
                <div class="salary-value">${salary.basicSalary.toLocaleString()} د.ع</div>
            </div>
            
            <div class="salary-row">
                <div class="salary-label">العلاوات</div>
                <div class="salary-value">${salary.allowances.toLocaleString()} د.ع</div>
            </div>
    `;
    
    // إضافة تفاصيل العلاوات
    if (employee.allowances && employee.allowances.length > 0) {
        employee.allowances.forEach(allowance => {
            content.innerHTML += `
                <div class="salary-row">
                    <div class="salary-label mr-4">- ${allowance.name}</div>
                    <div class="salary-value">${parseInt(allowance.amount).toLocaleString()} د.ع</div>
                </div>
            `;
        });
    }
    
    content.innerHTML += `
        <div class="salary-row">
            <div class="salary-label">الاستقطاعات</div>
            <div class="salary-value">${salary.deductions.toLocaleString()} د.ع</div>
        </div>
    `;
    
    // إضافة تفاصيل الاستقطاعات
    if (employee.deductions && employee.deductions.length > 0) {
        employee.deductions.forEach(deduction => {
            content.innerHTML += `
                <div class="salary-row">
                    <div class="salary-label mr-4">- ${deduction.name}</div>
                    <div class="salary-value">${parseInt(deduction.amount).toLocaleString()} د.ع</div>
                </div>
            `;
        });
    }
    
    content.innerHTML += `
        <div class="salary-row">
            <div class="salary-label font-bold">صافي الراتب</div>
            <div class="salary-value salary-total">${salary.totalSalary.toLocaleString()} د.ع</div>
        </div>
    `;
    
    // إظهار النافذة
    document.getElementById('salary-details-modal-backdrop').classList.add('show');
    document.getElementById('salary-details-modal').classList.add('show');
    document.getElementById('salary-details-modal-title').textContent = `تفاصيل الراتب - ${employee.name}`;
}

// تعديل الراتب
function editSalary(salaryId) {
    const salary = salaryData.find(s => s.id === salaryId);
    if (!salary) return;
    
    const employee = employeeData.find(e => e.id === salary.employeeId);
    if (!employee) return;
    
    // تعبئة النموذج
    document.getElementById('edit-salary-id').value = salary.id;
    document.getElementById('edit-basic-salary').value = salary.basicSalary;
    document.getElementById('edit-allowances').value = salary.allowances;
    document.getElementById('edit-deductions').value = salary.deductions;
    document.getElementById('edit-salary-notes').value = salary.notes || '';
    
    // إظهار النافذة
    document.getElementById('salary-edit-modal-backdrop').classList.add('show');
    document.getElementById('salary-edit-modal').classList.add('show');
    document.getElementById('salary-edit-modal-title').textContent = `تعديل راتب - ${employee.name}`;
}

// حفظ تعديلات الراتب
function saveSalaryEdit() {
    const salaryId = document.getElementById('edit-salary-id').value;
    const basicSalary = parseInt(document.getElementById('edit-basic-salary').value);
    const allowances = parseInt(document.getElementById('edit-allowances').value);
    const deductions = parseInt(document.getElementById('edit-deductions').value);
    const notes = document.getElementById('edit-salary-notes').value;
    
    // التحقق من صحة البيانات
    if (isNaN(basicSalary) || isNaN(allowances) || isNaN(deductions)) {
        showNotification('الرجاء إدخال قيم صحيحة', 'error');
        return;
    }
    
    // تحديث بيانات الراتب
    const index = salaryData.findIndex(s => s.id === salaryId);
    if (index !== -1) {
        salaryData[index].basicSalary = basicSalary;
        salaryData[index].allowances = allowances;
        salaryData[index].deductions = deductions;
        salaryData[index].totalSalary = basicSalary + allowances - deductions;
        salaryData[index].notes = notes;
        salaryData[index].updatedAt = new Date();
        salaryData[index].updatedBy = currentUser.id;
    }
    
    // حفظ البيانات
    saveSalaries();
    
    // إخفاء النافذة
    document.getElementById('salary-edit-modal-backdrop').classList.remove('show');
    document.getElementById('salary-edit-modal').classList.remove('show');
    
    // تحديث عرض كشف الرواتب
    generateSalarySheet();
    
    // عرض إشعار
    showNotification('تم تعديل الراتب بنجاح');
    
    // إضافة سجل
    addLog(`تم تعديل راتب (${salaryId})`, 'update');
}

// طباعة قسيمة الراتب
function printSalarySlip(salaryId) {
    const salary = salaryData.find(s => s.id === salaryId);
    if (!salary) return;
    
    const employee = employeeData.find(e => e.id === salary.employeeId);
    if (!employee) return;
    
    // إعداد محتوى الطباعة
    const printSection = document.getElementById('print-section');
    
    // تحديد الشهر بالعربية
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthName = months[salary.month - 1];
    
    printSection.innerHTML = `
        <div style="padding: 20px; font-family: 'Cairo', sans-serif; direction: rtl;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #3c50e0; margin-bottom: 5px;">قسيمة راتب</h1>
                <h2>شهر ${monthName} ${salary.year}</h2>
            </div>
            
            <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 5px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <div>
                        <strong>الموظف:</strong> ${employee.name}
                    </div>
                    <div>
                        <strong>الرقم الوظيفي:</strong> ${employee.id}
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <div>
                        <strong>القسم:</strong> ${employee.department}
                    </div>
                    <div>
                        <strong>المسمى الوظيفي:</strong> ${employee.jobTitle}
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <strong>تاريخ التعيين:</strong> ${formatDate(employee.joinDate)}
                    </div>
                    <div>
                        <strong>نوع التوظيف:</strong> ${employee.employmentType}
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f8fafc;">
                            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">البند</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;">المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">الراتب الأساسي</td>
                            <td style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;">${salary.basicSalary.toLocaleString()} د.ع</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">إجمالي العلاوات</td>
                            <td style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;">${salary.allowances.toLocaleString()} د.ع</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">إجمالي الاستقطاعات</td>
                            <td style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;">${salary.deductions.toLocaleString()} د.ع</td>
                        </tr>
                        <tr style="font-weight: bold; color: #3c50e0;">
                            <td style="padding: 10px; text-align: right;">صافي الراتب</td>
                            <td style="padding: 10px; text-align: left;">${salary.totalSalary.toLocaleString()} د.ع</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div style="text-align: center; font-size: 0.8rem; color: #64748b; margin-top: 40px;">
                <p>هذه الوثيقة تم إنشاؤها بواسطة نظام إدارة الموظفين</p>
                <p>تاريخ الإصدار: ${formatDate(new Date())} ${formatTime(new Date())}</p>
            </div>
        </div>
    `;
    
    // فتح نافذة الطباعة
    window.print();
}

// تحميل موظفي تقرير الرواتب
function loadSalaryReportEmployees() {
    const select = document.getElementById('salary-report-employee');
    
    // الاحتفاظ بالقيمة المحددة
    const selectedValue = select.value;
    
    // مسح القائمة
    select.innerHTML = '<option value="">جميع الموظفين</option>';
    
    // إضافة الموظفين
    employeeData.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        select.appendChild(option);
    });
    
    // إعادة تحديد القيمة المحددة
    if (selectedValue) {
        select.value = selectedValue;
    }
}

// إنشاء تقرير الرواتب
function generateSalaryReport() {
    const fromMonth = parseInt(document.getElementById('salary-report-from-month').value);
    const fromYear = parseInt(document.getElementById('salary-report-from-year').value);
    const toMonth = parseInt(document.getElementById('salary-report-to-month').value);
    const toYear = parseInt(document.getElementById('salary-report-to-year').value);
    const employeeId = document.getElementById('salary-report-employee').value;
    const department = document.getElementById('salary-report-department').value;
    
    // التحقق من صحة النطاق
    if (fromYear > toYear || (fromYear === toYear && fromMonth > toMonth)) {
        showNotification('نطاق التاريخ غير صحيح', 'error');
        return;
    }
    
    // فلترة البيانات
    let filteredData = salaryData.filter(record => {
        const recordYear = record.year;
        const recordMonth = record.month;
        
        // التحقق من وقوع السجل ضمن النطاق المحدد
        if (recordYear < fromYear || recordYear > toYear) {
            return false;
        }
        
        if (recordYear === fromYear && recordMonth < fromMonth) {
            return false;
        }
        
        if (recordYear === toYear && recordMonth > toMonth) {
            return false;
        }
        
        return true;
    });
    
    // فلترة حسب الموظف
    if (employeeId) {
        filteredData = filteredData.filter(record => record.employeeId === employeeId);
    }
    
    // فلترة حسب القسم
    if (department) {
        filteredData = filteredData.filter(record => {
            const employee = employeeData.find(e => e.id === record.employeeId);
            return employee && employee.department === department;
        });
    }
    
    // عرض النتائج
    displaySalaryReport(filteredData);
}

// عرض تقرير الرواتب
function displaySalaryReport(data) {
    const tbody = document.querySelector('#salary-report-table tbody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="8" class="text-center">لا توجد بيانات للعرض</td>`;
        tbody.appendChild(tr);
        
        // إخفاء ملخص التقرير
        document.getElementById('salary-report-summary').innerHTML = '';
        
        // إخفاء الرسم البياني
        const chartContainer = document.getElementById('salary-chart');
        chartContainer.innerHTML = '';
        
        return;
    }
    
    // فرز البيانات حسب التاريخ
    data.sort((a, b) => {
        if (a.year !== b.year) {
            return a.year - b.year;
        }
        return a.month - b.month;
    });
    
    // عرض البيانات
    data.forEach(record => {
        const employee = employeeData.find(e => e.id === record.employeeId);
        if (!employee) return;
        
        // تحديد الشهر بالعربية
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const monthName = months[record.month - 1];
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${employee.name}</td>
            <td>${employee.department}</td>
            <td>${monthName}</td>
            <td>${record.year}</td>
            <td>${record.basicSalary.toLocaleString()} د.ع</td>
            <td>${record.allowances.toLocaleString()} د.ع</td>
            <td>${record.deductions.toLocaleString()} د.ع</td>
            <td>${record.totalSalary.toLocaleString()} د.ع</td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // عرض ملخص التقرير
    displaySalaryReportSummary(data);
    
    // عرض الرسم البياني
    displaySalaryChart(data);
}

// عرض ملخص تقرير الرواتب
function displaySalaryReportSummary(data) {
    const summary = document.getElementById('salary-report-summary');
    
    // حساب الإحصائيات
    const totalRecords = data.length;
    
    // إجمالي الرواتب
    const totalBasicSalary = data.reduce((sum, record) => sum + record.basicSalary, 0);
    const totalAllowances = data.reduce((sum, record) => sum + record.allowances, 0);
    const totalDeductions = data.reduce((sum, record) => sum + record.deductions, 0);
    const totalSalaries = data.reduce((sum, record) => sum + record.totalSalary, 0);
    
    // حساب متوسط الراتب
    const averageSalary = totalSalaries / totalRecords;
    
    // عرض الملخص
    summary.innerHTML = `
        <div class="flex flex-wrap gap-4 mt-4">
            <div class="summary-card">
                <div class="summary-value">${totalRecords}</div>
                <div class="summary-label">إجمالي السجلات</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${totalBasicSalary.toLocaleString()} د.ع</div>
                <div class="summary-label">إجمالي الرواتب الأساسية</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${totalAllowances.toLocaleString()} د.ع</div>
                <div class="summary-label">إجمالي العلاوات</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${totalDeductions.toLocaleString()} د.ع</div>
                <div class="summary-label">إجمالي الاستقطاعات</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${totalSalaries.toLocaleString()} د.ع</div>
                <div class="summary-label">إجمالي صافي الرواتب</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">${averageSalary.toLocaleString()} د.ع</div>
                <div class="summary-label">متوسط الراتب</div>
            </div>
        </div>
    `;
}

// عرض الرسم البياني للرواتب
function displaySalaryChart(data) {
    const chartContainer = document.getElementById('salary-chart');
    
    // إذا كانت هناك مكتبة Chart.js متاحة
    if (typeof Chart !== 'undefined' && chartContainer) {
        // تجميع البيانات حسب الشهر والسنة
        const chartData = {};
        
        data.forEach(record => {
            const label = `${record.month}/${record.year}`;
            
            if (!chartData[label]) {
                chartData[label] = {
                    basic: 0,
                    allowances: 0,
                    deductions: 0,
                    total: 0
                };
            }
            
            chartData[label].basic += record.basicSalary;
            chartData[label].allowances += record.allowances;
            chartData[label].deductions += record.deductions;
            chartData[label].total += record.totalSalary;
        });
        
        // تحويل البيانات إلى مصفوفات للرسم البياني
        const labels = Object.keys(chartData).sort((a, b) => {
            const [aMonth, aYear] = a.split('/').map(Number);
            const [bMonth, bYear] = b.split('/').map(Number);
            
            if (aYear !== bYear) {
                return aYear - bYear;
            }
            return aMonth - bMonth;
        });
        
        const basicData = labels.map(label => chartData[label].basic);
        const allowancesData = labels.map(label => chartData[label].allowances);
        const deductionsData = labels.map(label => chartData[label].deductions);
        const totalData = labels.map(label => chartData[label].total);
        
        // تدمير الرسم البياني الحالي إذا كان موجودًا
        if (window.salaryChart) {
            window.salaryChart.destroy();
        }
        
        // إنشاء رسم بياني جديد
        window.salaryChart = new Chart(chartContainer, {
            type: 'bar',
            data: {
                labels: labels.map(label => {
                    const [month, year] = label.split('/');
                    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                    return `${months[parseInt(month) - 1]} ${year}`;
                }),
                datasets: [
                    {
                        label: 'الراتب الأساسي',
                        data: basicData,
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'العلاوات',
                        data: allowancesData,
                        backgroundColor: 'rgba(34, 197, 94, 0.7)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'الاستقطاعات',
                        data: deductionsData,
                        backgroundColor: 'rgba(239, 68, 68, 0.7)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'صافي الراتب',
                        data: totalData,
                        type: 'line',
                        backgroundColor: 'rgba(60, 80, 224, 0.2)',
                        borderColor: 'rgba(60, 80, 224, 1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true,
                        labels: {
                            usePointStyle: true,
                            font: {
                                family: 'Cairo'
                            }
                        }
                    },
                    tooltip: {
                        rtl: true,
                        titleFont: {
                            family: 'Cairo'
                        },
                        bodyFont: {
                            family: 'Cairo'
                        },
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toLocaleString() + ' د.ع';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                family: 'Cairo'
                            },
                            callback: function(value) {
                                return value.toLocaleString() + ' د.ع';
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                family: 'Cairo'
                            }
                        }
                    }
                }
            }
        });
    }
}

// تحميل موظفي الباركود
function loadBarcodeEmployees() {
    const select = document.getElementById('barcode-employee');
    
    // مسح القائمة
    select.innerHTML = '<option value="">اختر الموظف</option>';
    
    // إضافة الموظفين
    employeeData.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        select.appendChild(option);
    });
}

// إنشاء باركود
function generateBarcode() {
    const employeeId = document.getElementById('barcode-employee').value;
    
    if (!employeeId) {
        showNotification('الرجاء اختيار موظف', 'warning');
        return;
    }
    
    const employee = employeeData.find(e => e.id === employeeId);
    if (!employee) return;
    
    // عرض بيانات الموظف
    document.getElementById('employee-card-name').textContent = employee.name;
    document.getElementById('employee-card-title').textContent = employee.jobTitle;
    document.getElementById('employee-card-department').textContent = employee.department;
    document.getElementById('employee-card-id').textContent = employee.id;
    
    // إنشاء الباركود (ملاحظة: في تطبيق حقيقي يمكن استخدام مكتبة مثل JsBarcode)
    const barcodeImage = document.getElementById('barcode-image');
    
    // محاكاة لصورة باركود
    barcodeImage.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="80">
            <rect x="0" y="0" width="200" height="80" fill="white" />
            <text x="100" y="20" font-family="monospace" font-size="12" text-anchor="middle">BARCODE SIMULATION</text>
            <g stroke="black" stroke-width="2">
                ${generateBarcodeSVGLines(employee.id)}
            </g>
            <text x="100" y="70" font-family="monospace" font-size="14" text-anchor="middle">${employee.id}</text>
        </svg>
    `;
    
    // إظهار البطاقة
    document.getElementById('barcode-container').classList.remove('hidden');
    
    // عرض إشعار
    showNotification('تم إنشاء الباركود بنجاح');
}

// توليد خطوط الباركود لـ SVG (وظيفة مساعدة بسيطة)
function generateBarcodeSVGLines(id) {
    let lines = '';
    const chars = id.toString().split('');
    let x = 20;
    
    chars.forEach((char, index) => {
        const code = char.charCodeAt(0) % 10;
        const width = code + 1;
        
        lines += `<line x1="${x}" y1="25" x2="${x}" y2="55" stroke-width="${width}" />`;
        x += width + 3;
    });
    
    return lines;
}

// طباعة البطاقة
function printBarcode() {
    // التحقق من وجود بطاقة
    if (document.getElementById('barcode-container').classList.contains('hidden')) {
        showNotification('الرجاء إنشاء البطاقة أولاً', 'warning');
        return;
    }
    
    // إعداد محتوى الطباعة
    const printSection = document.getElementById('print-section');
    printSection.innerHTML = document.getElementById('barcode-container').outerHTML;
    
    // إضافة أسلوب للطباعة
    const style = document.createElement('style');
    style.textContent = `
        .barcode-card {
            display: block !important;
            margin: 0 auto;
        }
    `;
    printSection.appendChild(style);
    
    // فتح نافذة الطباعة
    window.print();
}

// إنشاء بطاقات متعددة
function generateMultipleBarcodes() {
    const department = document.getElementById('barcode-department').value;
    
    // فلترة الموظفين حسب القسم
    let filteredEmployees = employeeData;
    
    if (department) {
        filteredEmployees = filteredEmployees.filter(e => e.department === department);
    }
    
    if (filteredEmployees.length === 0) {
        showNotification('لا يوجد موظفون للقسم المحدد', 'warning');
        return;
    }
    
    // إنشاء البطاقات
    const container = document.getElementById('multiple-barcodes-container');
    container.innerHTML = '';
    
    filteredEmployees.forEach(employee => {
        const card = document.createElement('div');
        card.className = 'barcode-card';
        
        card.innerHTML = `
            <div class="barcode-header">
                <div class="barcode-company">نظام إدارة الموظفين</div>
                <div class="barcode-title">بطاقة موظف</div>
            </div>
            <div class="barcode-subtitle">${employee.name}</div>
            <div class="text-sm text-secondary mb-2">${employee.jobTitle}</div>
            <div class="text-sm text-secondary">${employee.department}</div>
            <div class="barcode-image">
                <svg xmlns="http://www.w3.org/2000/svg" width="200" height="80">
                    <rect x="0" y="0" width="200" height="80" fill="white" />
                    <text x="100" y="20" font-family="monospace" font-size="12" text-anchor="middle">BARCODE SIMULATION</text>
                    <g stroke="black" stroke-width="2">
                        ${generateBarcodeSVGLines(employee.id)}
                    </g>
                    <text x="100" y="70" font-family="monospace" font-size="14" text-anchor="middle">${employee.id}</text>
                </svg>
            </div>
            <div class="barcode-id">${employee.id}</div>
            <div class="barcode-footer">
                استخدم هذه البطاقة لتسجيل الحضور والانصراف
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // إظهار الحاوية
    container.classList.remove('hidden');
    
    // عرض إشعار
    showNotification(`تم إنشاء ${filteredEmployees.length} بطاقة بنجاح`);
}

// طباعة البطاقات المتعددة
function printMultipleBarcodes() {
    // التحقق من وجود بطاقات
    if (document.getElementById('multiple-barcodes-container').classList.contains('hidden')) {
        showNotification('الرجاء إنشاء البطاقات أولاً', 'warning');
        return;
    }
    
    // إعداد محتوى الطباعة
    const printSection = document.getElementById('print-section');
    printSection.innerHTML = document.getElementById('multiple-barcodes-container').outerHTML;
    
    // إضافة أسلوب للطباعة
    const style = document.createElement('style');
    style.textContent = `
        #multiple-barcodes-container {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 20px !important;
            justify-content: center !important;
        }
        
        .barcode-card {
            display: block !important;
            page-break-inside: avoid !important;
        }
    `;
    printSection.appendChild(style);
    
    // فتح نافذة الطباعة
    window.print();
}

// تحميل الإعدادات
function loadSettings() {
    // تعبئة نموذج الإعدادات العامة
    document.getElementById('company-name').value = settings.companyName || 'شركة تكنولوجيا المعلومات';
    document.getElementById('company-address').value = settings.companyAddress || 'الحلة، محافظة بابل، العراق';
    document.getElementById('company-phone').value = settings.companyPhone || '+964 7801234567';
    document.getElementById('company-email').value = settings.companyEmail || 'info@example.com';
    document.getElementById('system-language').value = settings.systemLanguage || 'ar';
    
    // تعبئة نموذج إعدادات الرواتب
    document.getElementById('default-work-hours').value = settings.defaultWorkHours || 8;
    document.getElementById('default-work-days').value = settings.defaultWorkDays || 5;
    document.getElementById('default-check-in').value = settings.defaultCheckIn || '08:00';
    document.getElementById('default-check-out').value = settings.defaultCheckOut || '16:00';
    document.getElementById('overtime-rate').value = settings.overtimeRate || 1.5;
    document.getElementById('late-deduction').value = settings.lateDeduction || 30;
    document.getElementById('tax-rate').value = settings.taxRate || 5;
    document.getElementById('social-insurance').value = settings.socialInsurance || 10;
    
    // تعبئة نموذج إعدادات النظام
    document.getElementById('backup-frequency').value = settings.backupFrequency || 'weekly';
    document.getElementById('backup-location').value = settings.backupLocation || 'localStorage';
    document.getElementById('session-timeout').value = settings.sessionTimeout || 30;
    document.getElementById('data-retention').value = settings.dataRetention || 365;
}

// حفظ الإعدادات العامة
function saveGeneralSettings() {
    settings.companyName = document.getElementById('company-name').value;
    settings.companyAddress = document.getElementById('company-address').value;
    settings.companyPhone = document.getElementById('company-phone').value;
    settings.companyEmail = document.getElementById('company-email').value;
    settings.systemLanguage = document.getElementById('system-language').value;
    
    saveSettings();
    showNotification('تم حفظ الإعدادات العامة بنجاح');
    addLog('تم تحديث الإعدادات العامة', 'settings');
}

// حفظ إعدادات الرواتب
function saveSalarySettings() {
    settings.defaultWorkHours = parseInt(document.getElementById('default-work-hours').value);
    settings.defaultWorkDays = parseInt(document.getElementById('default-work-days').value);
    settings.defaultCheckIn = document.getElementById('default-check-in').value;
    settings.defaultCheckOut = document.getElementById('default-check-out').value;
    settings.overtimeRate = parseFloat(document.getElementById('overtime-rate').value);
    settings.lateDeduction = parseInt(document.getElementById('late-deduction').value);
    settings.taxRate = parseFloat(document.getElementById('tax-rate').value);
    settings.socialInsurance = parseFloat(document.getElementById('social-insurance').value);
    
    saveSettings();
    showNotification('تم حفظ إعدادات الرواتب بنجاح');
    addLog('تم تحديث إعدادات الرواتب', 'settings');
}

// حفظ إعدادات النظام
function saveSystemSettings() {
    settings.backupFrequency = document.getElementById('backup-frequency').value;
    settings.backupLocation = document.getElementById('backup-location').value;
    settings.sessionTimeout = parseInt(document.getElementById('session-timeout').value);
    settings.dataRetention = parseInt(document.getElementById('data-retention').value);
    
    saveSettings();
    showNotification('تم حفظ إعدادات النظام بنجاح');
    addLog('تم تحديث إعدادات النظام', 'settings');
}

// حفظ الإعدادات
function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings));
}

// إنشاء نسخة احتياطية
function createBackup() {
    const backup = {
        timestamp: new Date(),
        userData,
        employeeData,
        categoryData,
        attendanceData,
        salaryData,
        logsData,
        settings
    };
    
    const backupId = `backup_${formatDate(new Date())}_${formatTime(new Date()).replace(':', '-')}`;
    
    // حفظ النسخة الاحتياطية في localStorage
    localStorage.setItem(backupId, JSON.stringify(backup));
    
    return backupId;
}

// استعادة نسخة احتياطية
function restoreBackup(backupId) {
    const backupStr = localStorage.getItem(backupId);
    
    if (!backupStr) {
        showNotification('النسخة الاحتياطية غير موجودة', 'error');
        return false;
    }
    
    try {
        const backup = JSON.parse(backupStr);
        
        // استعادة البيانات
        userData = backup.userData || [];
        employeeData = backup.employeeData || [];
        categoryData = backup.categoryData || [];
        attendanceData = backup.attendanceData || [];
        salaryData = backup.salaryData || [];
        logsData = backup.logsData || [];
        settings = backup.settings || {};
        
        // حفظ البيانات
        saveUsers();
        saveEmployees();
        saveCategories();
        saveAttendance();
        saveSalaries();
        saveLogs();
        saveSettings();
        
        showNotification('تم استعادة النسخة الاحتياطية بنجاح');
        addLog(`تم استعادة النسخة الاحتياطية (${backupId})`, 'restore');
        
        return true;
    } catch (error) {
        console.error('Error restoring backup:', error);
        showNotification('حدث خطأ أثناء استعادة النسخة الاحتياطية', 'error');
        return false;
    }
}

// تحميل نسخ احتياطية متاحة
function loadBackups() {
    const select = document.getElementById('backup-select');
    select.innerHTML = '';
    
    // البحث عن النسخ الاحتياطية في localStorage
    const backups = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key.startsWith('backup_')) {
            try {
                const backup = JSON.parse(localStorage.getItem(key));
                backups.push({
                    id: key,
                    timestamp: backup.timestamp
                });
            } catch (error) {
                console.error('Error parsing backup:', error);
            }
        }
    }
    
    // فرز النسخ الاحتياطية حسب التاريخ
    backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (backups.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'لا توجد نسخ احتياطية متاحة';
        option.disabled = true;
        select.appendChild(option);
        return;
    }
    
    // إضافة النسخ الاحتياطية
    backups.forEach(backup => {
        const option = document.createElement('option');
        option.value = backup.id;
        option.textContent = `${backup.id.replace('backup_', '')} (${formatDateTime(backup.timestamp)})`;
        select.appendChild(option);
    });
}

// تحميل المستخدمين
function loadUsers() {
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = '';
    
    if (userData.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="7" class="text-center">لا يوجد مستخدمون للعرض</td>`;
        tbody.appendChild(tr);
        return;
    }
    
    userData.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.username}</td>
            <td>${user.fullname}</td>
            <td>${user.email}</td>
            <td>${getUserRoleDisplay(user.role)}</td>
            <td>
                <span class="status-badge ${user.status === 'active' ? 'status-active' : 'status-inactive'}">
                    <i class="fas fa-${user.status === 'active' ? 'check-circle' : 'times-circle'}"></i>
                    ${user.status === 'active' ? 'نشط' : 'غير نشط'}
                </span>
            </td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// إضافة مستخدم جديد
function addUser() {
    // إعادة تعيين النموذج
    document.getElementById('user-id').value = '';
    document.getElementById('user-username').value = '';
    document.getElementById('user-fullname').value = '';
    document.getElementById('user-email').value = '';
    document.getElementById('user-password').value = '';
    document.getElementById('user-role').value = 'employee';
    document.getElementById('user-status').value = 'active';
    
    // تغيير عنوان النافذة
    document.getElementById('user-modal-title').textContent = 'إضافة مستخدم جديد';
    
    // إظهار النافذة
    document.getElementById('user-modal-backdrop').classList.add('show');
    document.getElementById('user-modal').classList.add('show');
}

// تعديل مستخدم
function editUser(userId) {
    const user = userData.find(u => u.id === userId);
    if (!user) return;
    
    // تعبئة النموذج
    document.getElementById('user-id').value = user.id;
    document.getElementById('user-username').value = user.username;
    document.getElementById('user-fullname').value = user.fullname;
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-password').value = '********'; // لحماية كلمة المرور
    document.getElementById('user-role').value = user.role;
    document.getElementById('user-status').value = user.status;
    
    // تغيير عنوان النافذة
    document.getElementById('user-modal-title').textContent = 'تعديل المستخدم';
    
    // إظهار النافذة
    document.getElementById('user-modal-backdrop').classList.add('show');
    document.getElementById('user-modal').classList.add('show');
}

// حذف مستخدم
function deleteUser(userId) {
    // منع حذف المستخدم الحالي
    if (userId === currentUser.id) {
        showNotification('لا يمكن حذف المستخدم الحالي', 'error');
        return;
    }
    
    showConfirmModal('هل أنت متأكد من حذف هذا المستخدم؟', () => {
        userData = userData.filter(u => u.id !== userId);
        saveUsers();
        loadUsers();
        showNotification('تم حذف المستخدم بنجاح');
        addLog(`تم حذف المستخدم (${userId})`, 'delete');
    });
}

// حفظ المستخدم
function saveUser() {
    const userId = document.getElementById('user-id').value;
    const username = document.getElementById('user-username').value;
    const fullname = document.getElementById('user-fullname').value;
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;
    const status = document.getElementById('user-status').value;
    
    // التحقق من إدخال البيانات المطلوبة
    if (!username || !fullname || !email || (!userId && !password)) {
        showNotification('الرجاء إدخال جميع البيانات المطلوبة', 'error');
        return;
    }
    
    // التحقق من عدم تكرار اسم المستخدم والبريد الإلكتروني
    const existingUser = userData.find(u => 
        u.id !== userId && (u.username === username || u.email === email)
    );
    
    if (existingUser) {
        showNotification('اسم المستخدم أو البريد الإلكتروني مستخدم مسبقاً', 'error');
        return;
    }
    
    if (userId) {
        // تعديل مستخدم موجود
        const index = userData.findIndex(u => u.id === userId);
        if (index !== -1) {
            userData[index] = {
                ...userData[index],
                username,
                fullname,
                email,
                role,
                status,
                updatedAt: new Date(),
                updatedBy: currentUser.id
            };
            
            // تحديث كلمة المرور إذا تم تغييرها
            if (password !== '********') {
                userData[index].password = password;
            }
        }
    } else {
        // إضافة مستخدم جديد
        const newUser = {
            id: generateId(),
            username,
            fullname,
            email,
            password,
            role,
            status,
            createdAt: new Date(),
            createdBy: currentUser.id
        };
        
        userData.push(newUser);
    }
    
    // حفظ البيانات
    saveUsers();
    
    // إخفاء النافذة
    document.getElementById('user-modal-backdrop').classList.remove('show');
    document.getElementById('user-modal').classList.remove('show');
    
    // تحديث قائمة المستخدمين
    loadUsers();
    
    // عرض إشعار
    showNotification(userId ? 'تم تعديل المستخدم بنجاح' : 'تم إضافة المستخدم بنجاح');
    
    // إضافة سجل
    addLog(userId ? `تم تعديل المستخدم (${username})` : `تم إضافة مستخدم جديد (${username})`, userId ? 'update' : 'create');
}

// حفظ بيانات المستخدمين
function saveUsers() {
    localStorage.setItem('userData', JSON.stringify(userData));
}

// تحميل السجلات
function loadLogs() {
    const tbody = document.querySelector('#logs-table tbody');
    tbody.innerHTML = '';
    
    // تطبيق الفلترة إذا كانت موجودة
    const fromDate = document.getElementById('log-date-from').value;
    const toDate = document.getElementById('log-date-to').value;
    const userFilter = document.getElementById('log-user').value;
    const typeFilter = document.getElementById('log-type').value;
    
    let filteredLogs = logsData;
    
    if (fromDate) {
        filteredLogs = filteredLogs.filter(log => {
            const logDate = new Date(log.timestamp);
            return formatDate(logDate) >= fromDate;
        });
    }
    
    if (toDate) {
        filteredLogs = filteredLogs.filter(log => {
            const logDate = new Date(log.timestamp);
            return formatDate(logDate) <= toDate;
        });
    }
    
    if (userFilter) {
        filteredLogs = filteredLogs.filter(log => log.userId === userFilter);
    }
    
    if (typeFilter) {
        filteredLogs = filteredLogs.filter(log => log.type === typeFilter);
    }
    
    // فرز السجلات حسب التاريخ (الأحدث أولاً)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (filteredLogs.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="6" class="text-center">لا توجد سجلات للعرض</td>`;
        tbody.appendChild(tr);
        return;
    }
    
    // عرض السجلات
    filteredLogs.forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDateTime(log.timestamp)}</td>
            <td>${log.username}</td>
            <td>${getLogTypeDisplay(log.type)}</td>
            <td>${log.action}</td>
            <td>${log.details || '-'}</td>
            <td>${log.ip || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
    
    // تحديث قائمة المستخدمين في الفلتر
    updateLogUsersFilter();
}

// تحديث فلتر المستخدمين في سجلات النظام
function updateLogUsersFilter() {
    const select = document.getElementById('log-user');
    
    // الاحتفاظ بالقيمة المحددة
    const selectedValue = select.value;
    
    // مسح القائمة
    select.innerHTML = '<option value="">جميع المستخدمين</option>';
    
    // إنشاء قائمة بالمستخدمين الفريدين في السجلات
    const uniqueUsers = [...new Set(logsData.map(log => log.userId))];
    
    // إضافة المستخدمين
    uniqueUsers.forEach(userId => {
        const user = userData.find(u => u.id === userId);
        if (user) {
            const option = document.createElement('option');
            option.value = userId;
            option.textContent = user.fullname || user.username;
            select.appendChild(option);
        }
    });
    
    // إعادة تحديد القيمة المحددة
    if (selectedValue) {
        select.value = selectedValue;
    }
}

// الحصول على اسم العرض لنوع السجل
function getLogTypeDisplay(type) {
    const typeDisplay = {
        'login': 'تسجيل دخول',
        'logout': 'تسجيل خروج',
        'create': 'إنشاء',
        'update': 'تحديث',
        'delete': 'حذف',
        'attendance': 'حضور',
        'settings': 'إعدادات',
        'restore': 'استعادة',
        'navigation': 'تنقل',
        'error': 'خطأ'
    };
    
    return typeDisplay[type] || type;
}

// إضافة سجل
function addLog(action, type = 'info', details = '') {
    if (!currentUser) return;
    
    const log = {
        id: generateId(),
        timestamp: new Date(),
        userId: currentUser.id,
        username: currentUser.username,
        action,
        type,
        details,
        ip: '127.0.0.1' // في تطبيق حقيقي يمكن الحصول على عنوان IP الفعلي
    };
    
    logsData.push(log);
    saveLogs();
}

// حفظ السجلات
function saveLogs() {
    localStorage.setItem('logsData', JSON.stringify(logsData));
}

// تنشيط علامة التبويب
function activateTab(tabId) {
    // إلغاء تنشيط جميع علامات التبويب
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // إخفاء جميع محتويات علامات التبويب
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // تنشيط علامة التبويب المطلوبة
    document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// ==============================
// الأحداث والإعدادات الأولية
// ==============================

// تحميل البيانات عند بدء التطبيق
function initializeApp() {
    // تحميل البيانات من localStorage
    try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
            userData = JSON.parse(userDataStr);
        }
        
        const employeeDataStr = localStorage.getItem('employeeData');
        if (employeeDataStr) {
            employeeData = JSON.parse(employeeDataStr);
        }
        
        const categoryDataStr = localStorage.getItem('categoryData');
        if (categoryDataStr) {
            categoryData = JSON.parse(categoryDataStr);
        }
        
        const attendanceDataStr = localStorage.getItem('attendanceData');
        if (attendanceDataStr) {
            attendanceData = JSON.parse(attendanceDataStr);
        }
        
        const salaryDataStr = localStorage.getItem('salaryData');
        if (salaryDataStr) {
            salaryData = JSON.parse(salaryDataStr);
        }
        
        const logsDataStr = localStorage.getItem('logsData');
        if (logsDataStr) {
            logsData = JSON.parse(logsDataStr);
        }
        
        const settingsStr = localStorage.getItem('settings');
        if (settingsStr) {
            settings = JSON.parse(settingsStr);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
    
    // إنشاء بيانات تجريبية إذا كانت البيانات فارغة
    if (userData.length === 0) {
        createDemoData();
    }
    
    // تسجيل أحداث النقر
    registerEventListeners();
}

// إنشاء بيانات تجريبية
function createDemoData() {
    // إنشاء مستخدم افتراضي
    userData.push({
        id: 'admin123',
        username: 'admin',
        password: 'admin',
        fullname: 'مدير النظام',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active',
        createdAt: new Date()
    });
    
    // إنشاء موظفين تجريبيين
    const demoEmployees = [
        {
            id: 'emp001',
            name: 'محمد أحمد',
            nationalId: '10020030040',
            dob: '1985-05-15',
            gender: 'ذكر',
            phone: '07801234567',
            email: 'mohammed@example.com',
            address: 'الحلة، محافظة بابل',
            jobTitle: 'مدير تقنية المعلومات',
            department: 'تكنولوجيا المعلومات',
            joinDate: '2020-01-15',
            employmentType: 'دوام كامل',
            basicSalary: 1500000,
            salaryType: 'شهري',
            status: 'active',
            workHours: 8,
            workDays: 5,
            checkInTime: '08:00',
            checkOutTime: '16:00',
            allowances: [
                { name: 'بدل نقل', amount: 100000 },
                { name: 'بدل سكن', amount: 200000 }
            ],
            deductions: [
                { name: 'ضريبة الدخل', amount: 50000 }
            ],
            createdAt: new Date()
        },
        {
            id: 'emp002',
            name: 'فاطمة علي',
            nationalId: '10020030041',
            dob: '1990-08-20',
            gender: 'أنثى',
            phone: '07701234567',
            email: 'fatima@example.com',
            address: 'الحلة، محافظة بابل',
            jobTitle: 'محاسب',
            department: 'المالية',
            joinDate: '2021-03-10',
            employmentType: 'دوام كامل',
            basicSalary: 1200000,
            salaryType: 'شهري',
            status: 'active',
            workHours: 8,
            workDays: 5,
            checkInTime: '08:30',
            checkOutTime: '16:30',
            allowances: [
                { name: 'بدل نقل', amount: 80000 }
            ],
            deductions: [
                { name: 'ضريبة الدخل', amount: 40000 }
            ],
            createdAt: new Date()
        },
        {
            id: 'emp003',
            name: 'علي حسين',
            nationalId: '10020030042',
            dob: '1988-11-05',
            gender: 'ذكر',
            phone: '07901234567',
            email: 'ali@example.com',
            address: 'الحلة، محافظة بابل',
            jobTitle: 'مهندس برمجيات',
            department: 'تكنولوجيا المعلومات',
            joinDate: '2019-06-20',
            employmentType: 'دوام كامل',
            basicSalary: 1300000,
            salaryType: 'شهري',
            status: 'active',
            workHours: 8,
            workDays: 5,
            checkInTime: '09:00',
            checkOutTime: '17:00',
            allowances: [
                { name: 'بدل نقل', amount: 90000 },
                { name: 'علاوة مهارات', amount: 150000 }
            ],
            deductions: [
                { name: 'ضريبة الدخل', amount: 45000 }
            ],
            createdAt: new Date()
        }
    ];
    
    employeeData = demoEmployees;
    
    // إنشاء تصنيفات تجريبية
    categoryData = [
        {
            id: 'cat001',
            name: 'موظفون دائميون',
            description: 'موظفون بعقود دائمة',
            createdAt: new Date()
        },
        {
            id: 'cat002',
            name: 'موظفون مؤقتون',
            description: 'موظفون بعقود مؤقتة',
            createdAt: new Date()
        },
        {
            id: 'cat003',
            name: 'مبرمجون',
            description: 'موظفو البرمجة وتطوير البرمجيات',
            createdAt: new Date()
        }
    ];
    
    // إنشاء بيانات حضور تجريبية
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    attendanceData = [
        {
            id: 'att001',
            employeeId: 'emp001',
            date: formatDate(yesterday),
            checkIn: new Date(yesterday.setHours(8, 0, 0)),
            checkOut: new Date(yesterday.setHours(16, 0, 0)),
            hoursWorked: '8.00',
            status: 'حاضر'
        },
        {
            id: 'att002',
            employeeId: 'emp002',
            date: formatDate(yesterday),
            checkIn: new Date(yesterday.setHours(8, 30, 0)),
            checkOut: new Date(yesterday.setHours(16, 30, 0)),
            hoursWorked: '8.00',
            status: 'حاضر'
        },
        {
            id: 'att003',
            employeeId: 'emp003',
            date: formatDate(yesterday),
            checkIn: new Date(yesterday.setHours(9, 15, 0)),
            checkOut: new Date(yesterday.setHours(17, 0, 0)),
            hoursWorked: '7.75',
            status: 'متأخر'
        },
        {
            id: 'att004',
            employeeId: 'emp001',
            date: formatDate(today),
            checkIn: new Date(today.setHours(8, 5, 0)),
            checkOut: new Date(today.setHours(16, 10, 0)),
            hoursWorked: '8.08',
            status: 'حاضر'
        },
        {
            id: 'att005',
            employeeId: 'emp002',
            date: formatDate(today),
            checkIn: new Date(today.setHours(8, 25, 0)),
            status: 'في العمل'
        }
    ];
    
    // إنشاء بيانات رواتب تجريبية
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    salaryData = [
        {
            id: 'sal001',
            employeeId: 'emp001',
            month: previousMonth,
            year: previousYear,
            basicSalary: 1500000,
            allowances: 300000,
            deductions: 50000,
            totalSalary: 1750000,
            workDays: 22,
            workHours: 176,
            status: 'paid',
            createdAt: new Date(previousYear, previousMonth - 1, 28)
        },
        {
            id: 'sal002',
            employeeId: 'emp002',
            month: previousMonth,
            year: previousYear,
            basicSalary: 1200000,
            allowances: 80000,
            deductions: 40000,
            totalSalary: 1240000,
            workDays: 22,
            workHours: 176,
            status: 'paid',
            createdAt: new Date(previousYear, previousMonth - 1, 28)
        },
        {
            id: 'sal003',
            employeeId: 'emp003',
            month: previousMonth,
            year: previousYear,
            basicSalary: 1300000,
            allowances: 240000,
            deductions: 45000,
            totalSalary: 1495000,
            workDays: 20,
            workHours: 160,
            status: 'paid',
            createdAt: new Date(previousYear, previousMonth - 1, 28)
        }
    ];
    
    // إنشاء إعدادات تجريبية
    settings = {
        companyName: 'شركة تكنولوجيا المعلومات',
        companyAddress: 'الحلة، محافظة بابل، العراق',
        companyPhone: '+964 7801234567',
        companyEmail: 'info@example.com',
        systemLanguage: 'ar',
        defaultWorkHours: 8,
        defaultWorkDays: 5,
        defaultCheckIn: '08:00',
        defaultCheckOut: '16:00',
        overtimeRate: 1.5,
        lateDeduction: 30,
        taxRate: 5,
        socialInsurance: 10,
        backupFrequency: 'weekly',
        backupLocation: 'localStorage',
        sessionTimeout: 30,
        dataRetention: 365
    };
    
    // حفظ البيانات التجريبية
    saveUsers();
    saveEmployees();
    saveCategories();
    saveAttendance();
    saveSalaries();
    saveSettings();
}


// تسجيل أحداث النقر
function registerEventListeners() {
    // استمارة تسجيل الدخول
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        login(username, password);
    });
    
    // زر تسجيل الخروج
    document.getElementById('logout-btn').addEventListener('click', function() {
        logout();
    });
    
    document.getElementById('logout-btn-menu').addEventListener('click', function() {
        logout();
    });
    
    // زر فتح/إغلاق القائمة الجانبية (للموبايل)
    document.getElementById('sidebar-toggle').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('sidebar-hidden');
        document.getElementById('main-content').classList.toggle('full-width');
    });
    
    // عناصر القائمة
    document.querySelectorAll('.sidebar-menu-item[data-page]').forEach(item => {
        item.addEventListener('click', function() {
            navigateTo(this.dataset.page);
        });
    });
    
    // عناصر القائمة الفرعية
    document.querySelectorAll('.sidebar-menu-item[data-submenu]').forEach(item => {
        item.addEventListener('click', function() {
            const submenuId = this.dataset.submenu + '-submenu';
            document.getElementById(submenuId).classList.toggle('show');
        });
    });
    
    // عناصر القوائم الفرعية
    document.querySelectorAll('.sidebar-submenu-item[data-page]').forEach(item => {
        item.addEventListener('click', function() {
            navigateTo(this.dataset.page);
        });
    });
    
    // ملف المستخدم
    document.getElementById('user-profile').addEventListener('click', function() {
        document.getElementById('user-dropdown').classList.toggle('show');
    });
    
    // إغلاق القائمة المنسدلة عند النقر خارجها
    document.addEventListener('click', function(event) {
        if (!event.target.closest('#user-profile')) {
            document.getElementById('user-dropdown').classList.remove('show');
        }
    });
    
    // البحث العام
    document.getElementById('global-search').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.toLowerCase().trim();
            if (!searchTerm) return;
            
            // البحث في الموظفين
            navigateTo('employees-list');
            document.getElementById('employee-search').value = searchTerm;
            loadEmployees();
        }
    });
    
    // استمارة إضافة/تعديل الموظف
    document.getElementById('employee-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEmployee();
    });
    
    // أزرار إضافة علاوة/استقطاع
    document.getElementById('add-allowance').addEventListener('click', function() {
        const container = document.getElementById('allowances-container');
        const row = document.createElement('div');
        row.className = 'form-grid mb-2';
        row.innerHTML = `
            <div class="form-group m-0">
                <input type="text" class="form-control allowance-name" placeholder="اسم العلاوة">
            </div>
            <div class="form-group m-0">
                <input type="number" class="form-control allowance-amount" placeholder="المبلغ">
            </div>
        `;
        container.appendChild(row);
    });
    
    document.getElementById('add-deduction').addEventListener('click', function() {
        const container = document.getElementById('deductions-container');
        const row = document.createElement('div');
        row.className = 'form-grid mb-2';
        row.innerHTML = `
            <div class="form-group m-0">
                <input type="text" class="form-control deduction-name" placeholder="اسم الاستقطاع">
            </div>
            <div class="form-group m-0">
                <input type="number" class="form-control deduction-amount" placeholder="المبلغ">
            </div>
        `;
        container.appendChild(row);
    });
    
    // علامات التبويب
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            activateTab(tabId);
        });
    });
    
    // زر البحث في الموظفين
    document.getElementById('employee-search').addEventListener('keyup', function() {
        loadEmployees();
    });
    
    document.getElementById('employee-filter').addEventListener('change', function() {
        loadEmployees();
    });
    
    // زر البحث في الحضور
    document.getElementById('attendance-barcode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const barcode = this.value.trim();
            if (barcode) {
                recordAttendance(barcode);
            }
        }
    });
    
    // زر إنشاء تقرير الحضور
    document.getElementById('generate-attendance-report').addEventListener('click', function() {
        generateAttendanceReport();
    });
    
    // زر إنشاء كشف الرواتب
    document.getElementById('generate-salary-sheet').addEventListener('click', function() {
        generateSalarySheet();
    });
    
    // زر إنشاء تقرير الرواتب
    document.getElementById('generate-salary-report').addEventListener('click', function() {
        generateSalaryReport();
    });
    
    // زر إنشاء الباركود
    document.getElementById('generate-barcode').addEventListener('click', function() {
        generateBarcode();
    });
    
    // زر طباعة البطاقة
    document.getElementById('print-barcode').addEventListener('click', function() {
        printBarcode();
    });
    
    // زر إنشاء البطاقات المتعددة
    document.getElementById('generate-multiple-barcodes').addEventListener('click', function() {
        generateMultipleBarcodes();
    });
    
    // زر طباعة البطاقات المتعددة
    document.getElementById('print-multiple-barcodes').addEventListener('click', function() {
        printMultipleBarcodes();
    });

}
    // تسجيل الحضور/الانصراف
function recordAttendance(barcode) {
    // البحث عن الموظف بواسطة الباركود أو الرقم الوظيفي
    const employee = employeeData.find(e => e.id === barcode || e.nationalId === barcode);
    
    if (!employee) {
        showAttendanceResult('لم يتم العثور على الموظف. الرجاء التحقق من الكود.', 'error');
        return;
    }
    
    const now = new Date();
    const today = formatDate(now);
    
    // البحث عن سجل حضور لهذا اليوم
    let todayRecord = attendanceData.find(a => a.employeeId === employee.id && formatDate(a.date) === today);
    
    if (!todayRecord) {
        // إنشاء سجل جديد للحضور
        todayRecord = {
            id: generateId(),
            employeeId: employee.id,
            date: today,
            checkIn: now,
            status: 'حاضر'
        };
        
        attendanceData.push(todayRecord);
        showAttendanceResult(`تم تسجيل حضور ${employee.name} في ${formatTime(now)}`, 'success');
        addLog(`تم تسجيل حضور (${employee.name})`, 'attendance');
    } else if (!todayRecord.checkOut) {
        // تسجيل الانصراف
        todayRecord.checkOut = now;
        
        // تحديث الحالة
        todayRecord.status = getAttendanceStatus(todayRecord);
        
        // حساب ساعات العمل
        const workHours = calculateHoursDifference(todayRecord.checkIn, todayRecord.checkOut);
        todayRecord.workHours = workHours.toFixed(2);
        
        showAttendanceResult(`تم تسجيل انصراف ${employee.name} في ${formatTime(now)}. مدة العمل: ${workHours.toFixed(2)} ساعة`, 'success');
        addLog(`تم تسجيل انصراف (${employee.name})`, 'attendance');
    } else {
        // الموظف قد سجل حضور وانصراف بالفعل
        showAttendanceResult(`${employee.name} قد سجل حضور وانصراف بالفعل اليوم!`, 'warning');
        return;
    }
    
    // حفظ بيانات الحضور المحدثة
    saveAttendance();
    
    // تحديث جدول الحضور اليومي
    loadTodayAttendance();
}

// عرض نتيجة تسجيل الحضور/الانصراف
function showAttendanceResult(message, type = 'success') {
    const resultElement = document.getElementById('attendance-result');
    const messageElement = document.getElementById('attendance-message');
    const detailsElement = document.getElementById('attendance-details');
    
    resultElement.style.display = 'block';
    messageElement.textContent = message;
    messageElement.className = type === 'success' ? 'scanner-success' : type === 'error' ? 'scanner-error' : '';
    
    // إضافة معلومات إضافية
    if (type === 'success') {
        const now = new Date();
        detailsElement.innerHTML = `
            <div class="text-secondary mt-2">
                <div>التاريخ: ${formatDate(now)}</div>
                <div>الوقت: ${formatTime(now)}</div>
            </div>
        `;
    } else {
        detailsElement.innerHTML = '';
    }
}

// حفظ بيانات الحضور
function saveAttendance() {
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
}

// حفظ التصنيفات
function saveCategories() {
    localStorage.setItem('categoryData', JSON.stringify(categoryData));
}

// ==============================
// تقارير الحضور
// ==============================

// تحميل قائمة الموظفين في تقارير الحضور
function loadAttendanceReportEmployees() {
    const employeeSelect = document.getElementById('attendance-employee');
    // الحفاظ على الاختيار الحالي
    const currentValue = employeeSelect.value;
    
    // إفراغ القائمة
    employeeSelect.innerHTML = '<option value="">جميع الموظفين</option>';
    
    // تعبئة القائمة بالموظفين
    employeeData.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        employeeSelect.appendChild(option);
    });
    
    // استعادة الاختيار السابق إن وجد
    if (currentValue) {
        employeeSelect.value = currentValue;
    }
}

// إنشاء تقرير الحضور
function generateAttendanceReport() {
    const dateFrom = document.getElementById('attendance-date-from').value;
    const dateTo = document.getElementById('attendance-date-to').value;
    const employeeId = document.getElementById('attendance-employee').value;
    const department = document.getElementById('attendance-department').value;
    const status = document.getElementById('attendance-status').value;
    
    if (!dateFrom || !dateTo) {
        showNotification('الرجاء تحديد نطاق التاريخ', 'warning');
        return;
    }
    
    // فلترة البيانات
    let filteredData = attendanceData.filter(record => 
        (!dateFrom || formatDate(record.date) >= dateFrom) && 
        (!dateTo || formatDate(record.date) <= dateTo)
    );
    
    if (employeeId) {
        filteredData = filteredData.filter(record => record.employeeId === employeeId);
    }
    
    if (department) {
        const departmentEmployees = employeeData
            .filter(e => e.department === department)
            .map(e => e.id);
        
        filteredData = filteredData.filter(record => departmentEmployees.includes(record.employeeId));
    }
    
    if (status) {
        filteredData = filteredData.filter(record => getAttendanceStatus(record) === status);
    }
    
    // عرض البيانات المفلترة
    displayAttendanceReport(filteredData);
    
    // عرض ملخص التقرير
    displayAttendanceReportSummary(filteredData);
}

// عرض بيانات تقرير الحضور
function displayAttendanceReport(data) {
    const tbody = document.querySelector('#attendance-report-table tbody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="9" class="text-center">لا توجد بيانات للعرض</td>`;
        tbody.appendChild(tr);
        return;
    }
    
    // ترتيب البيانات حسب التاريخ (الأحدث أولاً)
    data.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(record => {
        const employee = employeeData.find(e => e.id === record.employeeId);
        if (!employee) return;
        
        const tr = document.createElement('tr');
        
        // تحديد حالة الحضور
        const status = getAttendanceStatus(record);
        let statusClass = '';
        
        if (status === 'حاضر') {
            statusClass = 'status-active';
        } else if (status === 'متأخر' || status === 'مغادرة مبكرة' || status === 'في العمل') {
            statusClass = 'status-pending';
        } else if (status === 'غائب') {
            statusClass = 'status-inactive';
        }
        
        // الحصول على اسم اليوم من التاريخ
        const date = new Date(record.date);
        const dayName = getDayName(date.getDay());
        
        // حساب ساعات العمل
        const workHours = record.checkOut ? 
            calculateHoursDifference(record.checkIn, record.checkOut).toFixed(2) : 
            '-';
        
        tr.innerHTML = `
            <td>${employee.name}</td>
            <td>${employee.department}</td>
            <td>${formatDate(record.date)}</td>
            <td>${dayName}</td>
            <td>${record.checkIn ? formatTime(record.checkIn) : '-'}</td>
            <td>${record.checkOut ? formatTime(record.checkOut) : '-'}</td>
            <td>${workHours}</td>
            <td>
                <span class="status-badge ${statusClass}">
                    <i class="fas fa-${status === 'حاضر' ? 'check-circle' : status === 'غائب' ? 'times-circle' : 'exclamation-circle'}"></i>
                    ${status}
                </span>
            </td>
            <td>${record.notes || '-'}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

// عرض ملخص تقرير الحضور
function displayAttendanceReportSummary(data) {
    const summaryContainer = document.getElementById('attendance-report-summary');
    summaryContainer.innerHTML = '';
    
    if (data.length === 0) {
        return;
    }
    
    // حساب الإحصاءات
    const totalRecords = data.length;
    const presentCount = data.filter(r => getAttendanceStatus(r) === 'حاضر').length;
    const absentCount = data.filter(r => getAttendanceStatus(r) === 'غائب').length;
    const lateCount = data.filter(r => getAttendanceStatus(r) === 'متأخر').length;
    const earlyLeaveCount = data.filter(r => getAttendanceStatus(r) === 'مغادرة مبكرة').length;
    const inWorkCount = data.filter(r => getAttendanceStatus(r) === 'في العمل').length;
    
    // حساب إجمالي ساعات العمل
    const totalWorkHours = data.reduce((sum, record) => {
        if (record.checkIn && record.checkOut) {
            return sum + calculateHoursDifference(record.checkIn, record.checkOut);
        }
        return sum;
    }, 0);
    
    // إنشاء عناصر الملخص
    const summaryItems = [
        { label: 'إجمالي السجلات', value: totalRecords },
        { label: 'أيام الحضور', value: presentCount },
        { label: 'أيام الغياب', value: absentCount },
        { label: 'حالات التأخير', value: lateCount },
        { label: 'حالات المغادرة المبكرة', value: earlyLeaveCount },
        { label: 'حاليًا في العمل', value: inWorkCount },
        { label: 'إجمالي ساعات العمل', value: totalWorkHours.toFixed(2) + ' ساعة' }
    ];
    
    // إنشاء عناصر HTML
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'report-summary';
    
    summaryItems.forEach(item => {
        const summaryCard = document.createElement('div');
        summaryCard.className = 'summary-card';
        summaryCard.innerHTML = `
            <div class="summary-value">${item.value}</div>
            <div class="summary-label">${item.label}</div>
        `;
        summaryDiv.appendChild(summaryCard);
    });
    
    summaryContainer.appendChild(summaryDiv);
}

// ==============================
// إدارة الرواتب
// ==============================

// تحديث شهر وسنة الرواتب
function updateSalaryMonth() {
    const currentDate = new Date();
    
    // تعيين الشهر والسنة الحالية
    document.getElementById('salary-month').value = currentDate.getMonth() + 1;
    document.getElementById('salary-year').value = currentDate.getFullYear();
    
    // تحميل كشف الرواتب الحالي إن وجد
    loadCurrentSalarySheet();
}

// تحميل كشف الرواتب الحالي
function loadCurrentSalarySheet() {
    const month = document.getElementById('salary-month').value;
    const year = document.getElementById('salary-year').value;
    const department = document.getElementById('salary-department').value;
    
    // فلترة بيانات الرواتب
    let filteredSalaries = salaryData.filter(salary => 
        salary.month == month && 
        salary.year == year &&
        (!department || salary.department === department)
    );
    
    // إذا لم يكن هناك بيانات، قم بإنشاء كشف رواتب جديد
    if (filteredSalaries.length === 0) {
        // إفراغ الجدول
        document.querySelector('#salary-sheet-table tbody').innerHTML = '';
        
        // تعطيل أزرار الطباعة والتصدير والاعتماد
        document.getElementById('print-salary-sheet').disabled = true;
        document.getElementById('export-salary-sheet').disabled = true;
        document.getElementById('finalize-salary-sheet').disabled = true;
        
        return;
    }
    
    // عرض كشف الرواتب
    displaySalarySheet(filteredSalaries);
    
    // تفعيل أزرار الطباعة والتصدير والاعتماد
    document.getElementById('print-salary-sheet').disabled = false;
    document.getElementById('export-salary-sheet').disabled = false;
    document.getElementById('finalize-salary-sheet').disabled = false;
}

// إنشاء كشف الرواتب
function generateSalarySheet() {
    const month = document.getElementById('salary-month').value;
    const year = document.getElementById('salary-year').value;
    const department = document.getElementById('salary-department').value;
    
    // التحقق من وجود كشف رواتب مسبق لهذا الشهر
    const existingSalary = salaryData.find(s => s.month == month && s.year == year);
    
    if (existingSalary && existingSalary.finalized) {
        showNotification('كشف الرواتب لهذا الشهر معتمد بالفعل ولا يمكن تعديله', 'warning');
        return;
    }
    
    // الحصول على قائمة الموظفين حسب القسم
    let employeesToProcess = employeeData;
    
    if (department) {
        employeesToProcess = employeesToProcess.filter(e => e.department === department);
    }
    
    // التحقق من وجود موظفين
    if (employeesToProcess.length === 0) {
        showNotification('لا يوجد موظفون للعرض', 'warning');
        return;
    }
    
    // حذف كشوف الرواتب السابقة لهذا الشهر والسنة
    salaryData = salaryData.filter(s => !(s.month == month && s.year == year && (!department || s.department === department)));
    
    // إنشاء كشوف رواتب جديدة
    const newSalaries = [];
    
    employeesToProcess.forEach(employee => {
        // حساب إجمالي العلاوات
        const totalAllowances = (employee.allowances || []).reduce((sum, a) => sum + parseInt(a.amount), 0);
        
        // حساب إجمالي الاستقطاعات
        const totalDeductions = (employee.deductions || []).reduce((sum, d) => sum + parseInt(d.amount), 0);
        
        // حساب استقطاعات الحضور
        const attendanceDeduction = calculateAttendanceDeduction(employee.id, month, year);
        
        // حساب الراتب الإجمالي
        const grossSalary = parseInt(employee.basicSalary) + totalAllowances;
        
        // حساب إجمالي الاستقطاعات (بما فيها استقطاعات الحضور)
        const totalDeductionsWithAttendance = totalDeductions + attendanceDeduction;
        
        // حساب صافي الراتب
        const netSalary = grossSalary - totalDeductionsWithAttendance;
        
        // إنشاء سجل راتب جديد
        const newSalary = {
            id: generateId(),
            employeeId: employee.id,
            employeeName: employee.name,
            department: employee.department,
            jobTitle: employee.jobTitle,
            month: month,
            year: year,
            basicSalary: parseInt(employee.basicSalary),
            allowances: totalAllowances,
            deductions: totalDeductionsWithAttendance,
            grossSalary: grossSalary,
            netSalary: netSalary,
            createdAt: new Date(),
            createdBy: currentUser.id,
            status: 'pending',
            finalized: false
        };
        
        newSalaries.push(newSalary);
        salaryData.push(newSalary);
    });
    
    // حفظ بيانات الرواتب
    saveSalaryData();
    
    // عرض كشف الرواتب
    displaySalarySheet(newSalaries);
    
    // تفعيل أزرار الطباعة والتصدير والاعتماد
    document.getElementById('print-salary-sheet').disabled = false;
    document.getElementById('export-salary-sheet').disabled = false;
    document.getElementById('finalize-salary-sheet').disabled = false;
    
    // عرض إشعار
    showNotification('تم إنشاء كشف الرواتب بنجاح');
    
    // إضافة سجل
    addLog(`تم إنشاء كشف رواتب (${getMonthName(month)} ${year})`, 'create');
}

// حساب استقطاعات الحضور
function calculateAttendanceDeduction(employeeId, month, year) {
    // الحصول على بيانات الحضور للموظف
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // اليوم الأخير من الشهر
    
    const employeeAttendance = attendanceData.filter(a => 
        a.employeeId === employeeId && 
        new Date(a.date) >= startDate && 
        new Date(a.date) <= endDate
    );
    
    // الحصول على معلومات الموظف
    const employee = employeeData.find(e => e.id === employeeId);
    if (!employee) return 0;
    
    const settings = getSettings();
    const lateDeductionMinutes = settings.lateDeduction || 30;
    const dailySalary = parseInt(employee.basicSalary) / 30; // افتراض أن هناك 30 يوم في الشهر
    
    let totalDeduction = 0;
    
    // حساب استقطاعات الغياب
    const daysInMonth = endDate.getDate();
    const workdays = Math.min(daysInMonth, parseInt(employee.workDays || 5) * 4); // أيام العمل الشهرية
    const absentDays = workdays - employeeAttendance.length;
    
    if (absentDays > 0) {
        totalDeduction += absentDays * dailySalary;
    }
    
    // حساب استقطاعات التأخير
    employeeAttendance.forEach(record => {
        // التحقق من وجود وقت حضور
        if (!record.checkIn) return;
        
        const checkInTime = new Date(record.checkIn);
        const scheduledCheckIn = new Date(record.date + 'T' + (employee.checkInTime || '08:00') + ':00');
        
        const lateMinutes = Math.floor((checkInTime - scheduledCheckIn) / 60000);
        
        if (lateMinutes > lateDeductionMinutes) {
            // حساب الاستقطاع كنسبة من الراتب اليومي
            const lateHours = lateMinutes / 60;
            const lateDeduction = (dailySalary / 8) * lateHours; // افتراض 8 ساعات عمل يوميًا
            totalDeduction += lateDeduction;
        }
        
        // التحقق من وجود وقت انصراف
        if (!record.checkOut) return;
        
        const checkOutTime = new Date(record.checkOut);
        const scheduledCheckOut = new Date(record.date + 'T' + (employee.checkOutTime || '16:00') + ':00');
        
        const earlyMinutes = Math.floor((scheduledCheckOut - checkOutTime) / 60000);
        
        if (earlyMinutes > lateDeductionMinutes) {
            // حساب الاستقطاع كنسبة من الراتب اليومي
            const earlyHours = earlyMinutes / 60;
            const earlyDeduction = (dailySalary / 8) * earlyHours;
            totalDeduction += earlyDeduction;
        }
    });
    
    return Math.round(totalDeduction);
}

// الحصول على اسم الشهر
function getMonthName(monthNumber) {
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    return months[monthNumber - 1];
}

// عرض كشف الرواتب
function displaySalarySheet(salaries) {
    const tbody = document.querySelector('#salary-sheet-table tbody');
    tbody.innerHTML = '';
    
    if (salaries.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="8" class="text-center">لا توجد بيانات للعرض</td>`;
        tbody.appendChild(tr);
        return;
    }
    
    salaries.forEach(salary => {
        const tr = document.createElement('tr');
        
        // تحديد نوع الصف حسب الحالة
        if (salary.finalized) {
            tr.classList.add('bg-light');
        }
        
        tr.innerHTML = `
            <td>${salary.employeeName}</td>
            <td>${salary.department}</td>
            <td>${salary.jobTitle}</td>
            <td>${salary.basicSalary.toLocaleString()} د.ع</td>
            <td>${salary.allowances.toLocaleString()} د.ع</td>
            <td>${salary.deductions.toLocaleString()} د.ع</td>
            <td>${salary.netSalary.toLocaleString()} د.ع</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewSalaryDetails('${salary.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editSalary('${salary.id}')" ${salary.finalized ? 'disabled' : ''}>
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// عرض تفاصيل الراتب
function viewSalaryDetails(salaryId) {
    const salary = salaryData.find(s => s.id === salaryId);
    if (!salary) return;
    
    // الحصول على معلومات الموظف
    const employee = employeeData.find(e => e.id === salary.employeeId);
    if (!employee) return;
    
    // تعبئة محتوى النافذة
    const content = document.getElementById('salary-details-content');
    
    // إنشاء مصفوفة العلاوات
    const allowancesDetails = (employee.allowances || []).map(a => `
        <div class="salary-row">
            <div class="salary-label">${a.name}</div>
            <div class="salary-value">${parseInt(a.amount).toLocaleString()} د.ع</div>
        </div>
    `).join('');
    
    // إنشاء مصفوفة الاستقطاعات
    const deductionsDetails = (employee.deductions || []).map(d => `
        <div class="salary-row">
            <div class="salary-label">${d.name}</div>
            <div class="salary-value">${parseInt(d.amount).toLocaleString()} د.ع</div>
        </div>
    `).join('');
    
    // حساب استقطاعات الحضور
    const attendanceDeduction = salary.deductions - (employee.deductions || []).reduce((sum, d) => sum + parseInt(d.amount), 0);
    
    content.innerHTML = `
        <div class="mb-4">
            <h3 class="text-xl font-bold mb-2">تفاصيل راتب ${employee.name}</h3>
            <div class="text-secondary">
                <div>القسم: ${employee.department}</div>
                <div>المسمى الوظيفي: ${employee.jobTitle}</div>
                <div>الشهر: ${getMonthName(salary.month)} ${salary.year}</div>
            </div>
        </div>
        
        <div class="salary-details">
            <div class="mb-4">
                <h4 class="text-lg font-bold mb-2">الراتب الأساسي</h4>
                <div class="salary-row">
                    <div class="salary-label">الراتب الأساسي</div>
                    <div class="salary-value">${salary.basicSalary.toLocaleString()} د.ع</div>
                </div>
            </div>
            
            <div class="mb-4">
                <h4 class="text-lg font-bold mb-2">العلاوات</h4>
                ${allowancesDetails || '<div class="text-center text-secondary">لا توجد علاوات</div>'}
                <div class="salary-row">
                    <div class="salary-label">إجمالي العلاوات</div>
                    <div class="salary-value">${salary.allowances.toLocaleString()} د.ع</div>
                </div>
            </div>
            
            <div class="mb-4">
                <h4 class="text-lg font-bold mb-2">الاستقطاعات</h4>
                ${deductionsDetails || '<div class="text-center text-secondary">لا توجد استقطاعات ثابتة</div>'}
                <div class="salary-row">
                    <div class="salary-label">استقطاعات الحضور والانصراف</div>
                    <div class="salary-value">${attendanceDeduction.toLocaleString()} د.ع</div>
                </div>
                <div class="salary-row">
                    <div class="salary-label">إجمالي الاستقطاعات</div>
                    <div class="salary-value">${salary.deductions.toLocaleString()} د.ع</div>
                </div>
            </div>
            
            <div class="mb-4">
                <h4 class="text-lg font-bold mb-2">الإجماليات</h4>
                <div class="salary-row">
                    <div class="salary-label">إجمالي الراتب</div>
                    <div class="salary-value">${salary.grossSalary.toLocaleString()} د.ع</div>
                </div>
                <div class="salary-row">
                    <div class="salary-label">إجمالي الاستقطاعات</div>
                    <div class="salary-value">${salary.deductions.toLocaleString()} د.ع</div>
                </div>
                <div class="salary-row">
                    <div class="salary-label">صافي الراتب</div>
                    <div class="salary-value salary-total">${salary.netSalary.toLocaleString()} د.ع</div>
                </div>
            </div>
            
            <div class="mt-4 text-secondary text-sm">
                <div>تم إنشاء الكشف بواسطة: ${salary.createdBy}</div>
                <div>تاريخ الإنشاء: ${formatDateTime(salary.createdAt)}</div>
                <div>حالة الكشف: ${salary.finalized ? 'معتمد' : 'قيد الإعداد'}</div>
            </div>
        </div>
    `;
    
    // إظهار النافذة
    document.getElementById('salary-details-modal-backdrop').classList.add('show');
    document.getElementById('salary-details-modal').classList.add('show');
    document.getElementById('salary-details-modal-title').textContent = `تفاصيل راتب شهر ${getMonthName(salary.month)} ${salary.year}`;
}

// تعديل راتب
function editSalary(salaryId) {
    const salary = salaryData.find(s => s.id === salaryId);
    if (!salary) return;
    
    // التحقق من اعتماد الراتب
    if (salary.finalized) {
        showNotification('لا يمكن تعديل راتب معتمد', 'error');
        return;
    }
    
    // الحصول على معلومات الموظف
    const employee = employeeData.find(e => e.id === salary.employeeId);
    if (!employee) return;
    
    // تعبئة النموذج
    document.getElementById('edit-salary-id').value = salary.id;
    document.getElementById('edit-basic-salary').value = salary.basicSalary;
    document.getElementById('edit-allowances').value = salary.allowances;
    document.getElementById('edit-deductions').value = salary.deductions;
    document.getElementById('edit-salary-notes').value = '';
    
    // إظهار النافذة
    document.getElementById('salary-edit-modal-backdrop').classList.add('show');
    document.getElementById('salary-edit-modal').classList.add('show');
    document.getElementById('salary-edit-modal-title').textContent = `تعديل راتب ${employee.name}`;
}

// حفظ تعديل الراتب
function saveSalaryEdit() {
    const salaryId = document.getElementById('edit-salary-id').value;
    const basicSalary = parseInt(document.getElementById('edit-basic-salary').value);
    const allowances = parseInt(document.getElementById('edit-allowances').value);
    const deductions = parseInt(document.getElementById('edit-deductions').value);
    const notes = document.getElementById('edit-salary-notes').value;
    
    // التحقق من إدخال البيانات
    if (isNaN(basicSalary) || isNaN(allowances) || isNaN(deductions)) {
        showNotification('الرجاء إدخال أرقام صحيحة', 'error');
        return;
    }
    
    // البحث عن الراتب
    const index = salaryData.findIndex(s => s.id === salaryId);
    if (index === -1) return;
    
    // حساب الراتب الإجمالي
    const grossSalary = basicSalary + allowances;
    
    // حساب صافي الراتب
    const netSalary = grossSalary - deductions;
    
    // تحديث بيانات الراتب
    salaryData[index] = {
        ...salaryData[index],
        basicSalary,
        allowances,
        deductions,
        grossSalary,
        netSalary,
        notes,
        updatedAt: new Date(),
        updatedBy: currentUser.id
    };
    
    // حفظ البيانات
    saveSalaryData();
    
    // إخفاء النافذة
    document.getElementById('salary-edit-modal-backdrop').classList.remove('show');
    document.getElementById('salary-edit-modal').classList.remove('show');
    
    // تحديث الجدول
    loadCurrentSalarySheet();
    
    // عرض إشعار
    showNotification('تم تعديل الراتب بنجاح');
    
    // إضافة سجل
    addLog(`تم تعديل راتب الموظف (${salaryData[index].employeeName})`, 'update');
}

// اعتماد كشف الرواتب
function finalizeSalarySheet() {
    const month = document.getElementById('salary-month').value;
    const year = document.getElementById('salary-year').value;
    const department = document.getElementById('salary-department').value;
    
    // التأكيد قبل الاعتماد
    showConfirmModal('هل أنت متأكد من اعتماد كشف الرواتب؟ لا يمكن التراجع عن هذه العملية.', () => {
        // تحديث حالة الرواتب
        let updatedCount = 0;
        
        salaryData.forEach((salary, index) => {
            if (
                salary.month == month && 
                salary.year == year && 
                (!department || salary.department === department) && 
                !salary.finalized
            ) {
                salaryData[index].finalized = true;
                salaryData[index].finalizedAt = new Date();
                salaryData[index].finalizedBy = currentUser.id;
                updatedCount++;
            }
        });
        
        if (updatedCount === 0) {
            showNotification('لم يتم تحديث أي سجلات', 'warning');
            return;
        }
        
        // حفظ البيانات
        saveSalaryData();
        
        // تحديث الجدول
        loadCurrentSalarySheet();
        
        // عرض إشعار
        showNotification(`تم اعتماد ${updatedCount} سجل بنجاح`);
        
        // إضافة سجل
        addLog(`تم اعتماد كشف رواتب (${getMonthName(month)} ${year})`, 'update');
    });
}

// حفظ بيانات الرواتب
function saveSalaryData() {
    localStorage.setItem('salaryData', JSON.stringify(salaryData));
}

// ==============================
// تقارير الرواتب
// ==============================

// تحميل قائمة الموظفين في تقارير الرواتب
function loadSalaryReportEmployees() {
    const employeeSelect = document.getElementById('salary-report-employee');
    // الحفاظ على الاختيار الحالي
    const currentValue = employeeSelect.value;
    
    // إفراغ القائمة
    employeeSelect.innerHTML = '<option value="">جميع الموظفين</option>';
    
    // تعبئة القائمة بالموظفين
    employeeData.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        employeeSelect.appendChild(option);
    });
    
    // استعادة الاختيار السابق إن وجد
    if (currentValue) {
        employeeSelect.value = currentValue;
    }
    
    // تعيين التواريخ الافتراضية
    const currentDate = new Date();
    document.getElementById('salary-report-from-month').value = 1;
    document.getElementById('salary-report-from-year').value = currentDate.getFullYear();
    document.getElementById('salary-report-to-month').value = currentDate.getMonth() + 1;
    document.getElementById('salary-report-to-year').value = currentDate.getFullYear();
}

// إنشاء تقرير الرواتب
function generateSalaryReport() {
    const fromMonth = document.getElementById('salary-report-from-month').value;
    const fromYear = document.getElementById('salary-report-from-year').value;
    const toMonth = document.getElementById('salary-report-to-month').value;
    const toYear = document.getElementById('salary-report-to-year').value;
    const employeeId = document.getElementById('salary-report-employee').value;
    const department = document.getElementById('salary-report-department').value;
    
    // التحقق من التواريخ
    if (!fromMonth || !fromYear || !toMonth || !toYear) {
        showNotification('الرجاء تحديد نطاق التاريخ', 'warning');
        return;
    }
    
    // التحقق من صحة النطاق
    const fromDate = new Date(fromYear, fromMonth - 1, 1);
    const toDate = new Date(toYear, toMonth - 1, 1);
    
    if (fromDate > toDate) {
        showNotification('تاريخ البداية يجب أن يكون قبل تاريخ النهاية', 'error');
        return;
    }
    
    // فلترة البيانات
    let filteredData = salaryData.filter(salary => {
        const salaryDate = new Date(salary.year, salary.month - 1, 1);
        return salaryDate >= fromDate && salaryDate <= toDate;
    });
    
    if (employeeId) {
        filteredData = filteredData.filter(salary => salary.employeeId === employeeId);
    }
    
    if (department) {
        filteredData = filteredData.filter(salary => salary.department === department);
    }
    
    // عرض البيانات المفلترة
    displaySalaryReport(filteredData);
    
    // عرض ملخص التقرير
    displaySalaryReportSummary(filteredData);
    
    // تحديث الرسم البياني
    updateSalaryChart(filteredData);
}

// عرض بيانات تقرير الرواتب
function displaySalaryReport(data) {
    const tbody = document.querySelector('#salary-report-table tbody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="8" class="text-center">لا توجد بيانات للعرض</td>`;
        tbody.appendChild(tr);
        return;
    }
    
    // ترتيب البيانات حسب التاريخ (الأحدث أولاً)
    data.sort((a, b) => {
        const dateA = new Date(a.year, a.month - 1, 1);
        const dateB = new Date(b.year, b.month - 1, 1);
        return dateB - dateA;
    }).forEach(salary => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${salary.employeeName}</td>
            <td>${salary.department}</td>
            <td>${getMonthName(salary.month)}</td>
            <td>${salary.year}</td>
            <td>${salary.basicSalary.toLocaleString()} د.ع</td>
            <td>${salary.allowances.toLocaleString()} د.ع</td>
            <td>${salary.deductions.toLocaleString()} د.ع</td>
            <td>${salary.netSalary.toLocaleString()} د.ع</td>
        `;
        
        tbody.appendChild(tr);
    });
}

// عرض ملخص تقرير الرواتب
function displaySalaryReportSummary(data) {
    const summaryContainer = document.getElementById('salary-report-summary');
    summaryContainer.innerHTML = '';
    
    if (data.length === 0) {
        return;
    }
    
    // حساب الإحصاءات
    const totalEmployees = [...new Set(data.map(s => s.employeeId))].length;
    const totalMonths = [...new Set(data.map(s => s.year + '-' + s.month))].length;
    const totalBasicSalary = data.reduce((sum, s) => sum + s.basicSalary, 0);
    const totalAllowances = data.reduce((sum, s) => sum + s.allowances, 0);
    const totalDeductions = data.reduce((sum, s) => sum + s.deductions, 0);
    const totalNetSalary = data.reduce((sum, s) => sum + s.netSalary, 0);
    const averageSalary = Math.round(totalNetSalary / data.length);
    
    // إنشاء عناصر الملخص
    const summaryItems = [
        { label: 'عدد الموظفين', value: totalEmployees },
        { label: 'عدد الأشهر', value: totalMonths },
        { label: 'إجمالي الرواتب الأساسية', value: totalBasicSalary.toLocaleString() + ' د.ع' },
        { label: 'إجمالي العلاوات', value: totalAllowances.toLocaleString() + ' د.ع' },
        { label: 'إجمالي الاستقطاعات', value: totalDeductions.toLocaleString() + ' د.ع' },
        { label: 'إجمالي صافي الرواتب', value: totalNetSalary.toLocaleString() + ' د.ع' },
        { label: 'متوسط الراتب', value: averageSalary.toLocaleString() + ' د.ع' }
    ];
    
    // إنشاء عناصر HTML
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'report-summary';
    
    summaryItems.forEach(item => {
        const summaryCard = document.createElement('div');
        summaryCard.className = 'summary-card';
        summaryCard.innerHTML = `
            <div class="summary-value">${item.value}</div>
            <div class="summary-label">${item.label}</div>
        `;
        summaryDiv.appendChild(summaryCard);
    });
    
    summaryContainer.appendChild(summaryDiv);
}

// تحديث الرسم البياني للرواتب
function updateSalaryChart(data) {
    const chartContainer = document.getElementById('salary-chart');
    
    // إذا كانت هناك مكتبة Chart.js متاحة
    if (typeof Chart !== 'undefined' && chartContainer) {
        // تجميع البيانات حسب الشهر
        const monthlyData = {};
        
        data.forEach(salary => {
            const key = `${salary.year}-${salary.month}`;
            if (!monthlyData[key]) {
                monthlyData[key] = {
                    label: `${getMonthName(salary.month)} ${salary.year}`,
                    basicSalary: 0,
                    allowances: 0,
                    deductions: 0,
                    netSalary: 0,
                    count: 0
                };
            }
            
            monthlyData[key].basicSalary += salary.basicSalary;
            monthlyData[key].allowances += salary.allowances;
            monthlyData[key].deductions += salary.deductions;
            monthlyData[key].netSalary += salary.netSalary;
            monthlyData[key].count++;
        });
        
        // تحويل البيانات إلى مصفوفات للرسم البياني
        const labels = [];
        const basicSalaryData = [];
        const allowancesData = [];
        const deductionsData = [];
        const netSalaryData = [];
        
        // ترتيب البيانات حسب التاريخ
        const sortedKeys = Object.keys(monthlyData).sort();
        
        sortedKeys.forEach(key => {
            const monthData = monthlyData[key];
            labels.push(monthData.label);
            basicSalaryData.push(monthData.basicSalary);
            allowancesData.push(monthData.allowances);
            deductionsData.push(monthData.deductions);
            netSalaryData.push(monthData.netSalary);
        });
        
        // تدمير الرسم البياني الحالي إذا كان موجودًا
        if (window.salaryChart) {
            window.salaryChart.destroy();
        }
        
        // إنشاء رسم بياني جديد
        window.salaryChart = new Chart(chartContainer, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'صافي الراتب',
                        data: netSalaryData,
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'الراتب الأساسي',
                        data: basicSalaryData,
                        backgroundColor: 'rgba(34, 197, 94, 0.7)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'العلاوات',
                        data: allowancesData,
                        backgroundColor: 'rgba(245, 158, 11, 0.7)',
                        borderColor: 'rgba(245, 158, 11, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'الاستقطاعات',
                        data: deductionsData,
                        backgroundColor: 'rgba(239, 68, 68, 0.7)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true,
                        labels: {
                            usePointStyle: true,
                            font: {
                                family: 'Cairo'
                            }
                        }
                    },
                    tooltip: {
                        rtl: true,
                        titleFont: {
                            family: 'Cairo'
                        },
                        bodyFont: {
                            family: 'Cairo'
                        },
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.raw.toLocaleString() + ' د.ع';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                family: 'Cairo'
                            },
                            callback: function(value) {
                                return value.toLocaleString() + ' د.ع';
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                family: 'Cairo'
                            }
                        }
                    }
                }
            }
        });
    }
}

// ==============================
// إدارة البطاقات
// ==============================

// تحميل قائمة الموظفين في قسم البطاقات
function loadBarcodeEmployees() {
    const employeeSelect = document.getElementById('barcode-employee');
    // إفراغ القائمة
    employeeSelect.innerHTML = '<option value="">اختر الموظف</option>';
    
    // تعبئة القائمة بالموظفين
    employeeData.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        employeeSelect.appendChild(option);
    });
}

// إنشاء باركود للموظف
function generateBarcode() {
    const employeeId = document.getElementById('barcode-employee').value;
    
    if (!employeeId) {
        showNotification('الرجاء اختيار موظف', 'warning');
        return;
    }
    
    const employee = employeeData.find(e => e.id === employeeId);
    if (!employee) return;
    
    // تعبئة بيانات البطاقة
    document.getElementById('employee-card-name').textContent = employee.name;
    document.getElementById('employee-card-title').textContent = employee.jobTitle;
    document.getElementById('employee-card-department').textContent = employee.department;
    document.getElementById('employee-card-id').textContent = employee.id;
    
    // إنشاء الباركود
    const barcodeContainer = document.getElementById('barcode-image');
    barcodeContainer.innerHTML = '';
    
    if (typeof JsBarcode !== 'undefined') {
        // إذا كانت مكتبة JsBarcode متاحة
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        barcodeContainer.appendChild(svg);
        
        JsBarcode(svg, employee.id, {
            format: 'CODE128',
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12,
            font: 'Cairo'
        });
    } else {
        // استخدام صورة باركود وهمية
        barcodeContainer.innerHTML = `
            <img src="https://via.placeholder.com/250x80?text=BARCODE:${employee.id}" alt="Barcode" style="max-width: 100%">
        `;
    }
    
    // إظهار البطاقة
    document.getElementById('barcode-container').classList.remove('hidden');
    
    // تفعيل زر الطباعة
    document.getElementById('print-barcode').disabled = false;
    
    // عرض إشعار
    showNotification('تم إنشاء الباركود بنجاح');
}

// طباعة بطاقة الموظف
function printBarcode() {
    const cardContainer = document.getElementById('barcode-container');
    
    if (cardContainer.classList.contains('hidden')) {
        showNotification('الرجاء إنشاء الباركود أولاً', 'warning');
        return;
    }
    
    const printSection = document.getElementById('print-section');
    printSection.innerHTML = '';
    
    // نسخ محتوى البطاقة إلى قسم الطباعة
    const cardClone = cardContainer.cloneNode(true);
    cardClone.style.display = 'block';
    printSection.appendChild(cardClone);
    
    // طباعة القسم
    window.print();
}

// إنشاء بطاقات متعددة
function generateMultipleBarcodes() {
    const department = document.getElementById('barcode-department').value;
    
    // فلترة الموظفين حسب القسم
    let employeesToProcess = employeeData;
    
    if (department) {
        employeesToProcess = employeesToProcess.filter(e => e.department === department);
    }
    
    // التحقق من وجود موظفين
    if (employeesToProcess.length === 0) {
        showNotification('لا يوجد موظفون للعرض', 'warning');
        return;
    }
    
    // حاوية البطاقات المتعددة
    const cardsContainer = document.getElementById('multiple-barcodes-container');
    cardsContainer.innerHTML = '';
    
    // إنشاء بطاقة لكل موظف
    employeesToProcess.forEach(employee => {
        const card = document.createElement('div');
        card.className = 'barcode-card';
        
        // تعبئة بيانات البطاقة
        card.innerHTML = `
            <div class="barcode-header">
                <div class="barcode-company">نظام إدارة الموظفين</div>
                <div class="barcode-title">بطاقة موظف</div>
            </div>
            <div class="barcode-subtitle">${employee.name}</div>
            <div class="text-sm text-secondary mb-2">${employee.jobTitle}</div>
            <div class="text-sm text-secondary">${employee.department}</div>
            <div class="barcode-image" id="barcode-image-${employee.id}"></div>
            <div class="barcode-id">${employee.id}</div>
            <div class="barcode-footer">
                استخدم هذه البطاقة لتسجيل الحضور والانصراف
            </div>
        `;
        
        cardsContainer.appendChild(card);
        
        // إنشاء الباركود
        const barcodeContainer = document.getElementById(`barcode-image-${employee.id}`);
        
        if (typeof JsBarcode !== 'undefined') {
            // إذا كانت مكتبة JsBarcode متاحة
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            barcodeContainer.appendChild(svg);
            
            JsBarcode(svg, employee.id, {
                format: 'CODE128',
                width: 2,
                height: 50,
                displayValue: true,
                fontSize: 12,
                font: 'Cairo'
            });
        } else {
            // استخدام صورة باركود وهمية
            barcodeContainer.innerHTML = `
                <img src="https://via.placeholder.com/250x80?text=BARCODE:${employee.id}" alt="Barcode" style="max-width: 100%">
            `;
        }
    });
    
    // إظهار الحاوية
    cardsContainer.classList.remove('hidden');
    
    // تفعيل زر الطباعة
    document.getElementById('print-multiple-barcodes').disabled = false;
    
    // عرض إشعار
    showNotification(`تم إنشاء ${employeesToProcess.length} بطاقة بنجاح`);
}

// طباعة بطاقات متعددة
function printMultipleBarcodes() {
    const cardsContainer = document.getElementById('multiple-barcodes-container');
    
    if (cardsContainer.classList.contains('hidden') || cardsContainer.children.length === 0) {
        showNotification('الرجاء إنشاء البطاقات أولاً', 'warning');
        return;
    }
    
    const printSection = document.getElementById('print-section');
    printSection.innerHTML = '';
    
    // نسخ محتوى البطاقات إلى قسم الطباعة
    const cardsClone = cardsContainer.cloneNode(true);
    cardsClone.style.display = 'flex';
    cardsClone.style.flexWrap = 'wrap';
    cardsClone.style.gap = '1rem';
    printSection.appendChild(cardsClone);
    
    // طباعة القسم
    window.print();
}

// ==============================
// إدارة الإعدادات
// ==============================

// تحميل الإعدادات
function loadSettings() {
    // تعبئة نموذج الإعدادات العامة
    document.getElementById('company-name').value = settings.companyName || 'شركة تكنولوجيا المعلومات';
    document.getElementById('company-address').value = settings.companyAddress || 'الحلة، محافظة بابل، العراق';
    document.getElementById('company-phone').value = settings.companyPhone || '+964 7801234567';
    document.getElementById('company-email').value = settings.companyEmail || 'info@example.com';
    document.getElementById('system-language').value = settings.systemLanguage || 'ar';
    
    // تعبئة نموذج إعدادات الرواتب
    document.getElementById('default-work-hours').value = settings.defaultWorkHours || 8;
    document.getElementById('default-work-days').value = settings.defaultWorkDays || 5;
    document.getElementById('default-check-in').value = settings.defaultCheckIn || '08:00';
    document.getElementById('default-check-out').value = settings.defaultCheckOut || '16:00';
    document.getElementById('overtime-rate').value = settings.overtimeRate || 1.5;
    document.getElementById('late-deduction').value = settings.lateDeduction || 30;
    document.getElementById('tax-rate').value = settings.taxRate || 5;
    document.getElementById('social-insurance').value = settings.socialInsurance || 10;
    
    // تعبئة نموذج إعدادات النظام
    document.getElementById('backup-frequency').value = settings.backupFrequency || 'weekly';
    document.getElementById('backup-location').value = settings.backupLocation || 'localStorage';
    document.getElementById('session-timeout').value = settings.sessionTimeout || 30;
    document.getElementById('data-retention').value = settings.dataRetention || 365;
    
    // تنشيط علامة التبويب الأولى
    activateTab('general-settings');
}

// حفظ الإعدادات العامة
function saveGeneralSettings() {
    settings.companyName = document.getElementById('company-name').value;
    settings.companyAddress = document.getElementById('company-address').value;
    settings.companyPhone = document.getElementById('company-phone').value;
    settings.companyEmail = document.getElementById('company-email').value;
    settings.systemLanguage = document.getElementById('system-language').value;
    
    saveSettings();
    showNotification('تم حفظ الإعدادات العامة بنجاح');
    addLog('تم تحديث الإعدادات العامة', 'update');
}

// حفظ إعدادات الرواتب
function saveSalarySettings() {
    settings.defaultWorkHours = document.getElementById('default-work-hours').value;
    settings.defaultWorkDays = document.getElementById('default-work-days').value;
    settings.defaultCheckIn = document.getElementById('default-check-in').value;
    settings.defaultCheckOut = document.getElementById('default-check-out').value;
    settings.overtimeRate = document.getElementById('overtime-rate').value;
    settings.lateDeduction = document.getElementById('late-deduction').value;
    settings.taxRate = document.getElementById('tax-rate').value;
    settings.socialInsurance = document.getElementById('social-insurance').value;
    
    saveSettings();
    showNotification('تم حفظ إعدادات الرواتب بنجاح');
    addLog('تم تحديث إعدادات الرواتب', 'update');
}

// حفظ إعدادات النظام
function saveSystemSettings() {
    settings.backupFrequency = document.getElementById('backup-frequency').value;
    settings.backupLocation = document.getElementById('backup-location').value;
    settings.sessionTimeout = document.getElementById('session-timeout').value;
    settings.dataRetention = document.getElementById('data-retention').value;
    
    saveSettings();
    showNotification('تم حفظ إعدادات النظام بنجاح');
    addLog('تم تحديث إعدادات النظام', 'update');
}

// حفظ الإعدادات
function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings));
}

// الحصول على الإعدادات
function getSettings() {
    return settings;
}

// عمل نسخة احتياطية
function backupNow() {
    const backupData = {
        timestamp: new Date(),
        userData,
        employeeData,
        categoryData,
        attendanceData,
        salaryData,
        logsData,
        settings
    };
    
    const backupId = `backup_${formatDate(new Date())}_${formatTime(new Date()).replace(':', '-')}`;
    
    // حفظ النسخة الاحتياطية
    localStorage.setItem(backupId, JSON.stringify(backupData));
    
    showNotification('تم عمل نسخة احتياطية بنجاح');
    addLog('تم عمل نسخة احتياطية يدوية', 'backup');
}

// استعادة نسخة احتياطية
function restoreBackup() {
    // الحصول على قائمة النسخ الاحتياطية
    const backups = [];
    
    for(let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('backup_')) {
            try {
                const backupData = JSON.parse(localStorage.getItem(key));
                backups.push({
                    id: key,
                    timestamp: backupData.timestamp,
                    label: `${formatDate(backupData.timestamp)} ${formatTime(backupData.timestamp)}`
                });
            } catch (e) {
                console.error('Error parsing backup:', e);
            }
        }
    }
    
    // التحقق من وجود نسخ احتياطية
    if (backups.length === 0) {
        showNotification('لا توجد نسخ احتياطية للاستعادة', 'warning');
        return;
    }
    
    // ترتيب النسخ الاحتياطية (الأحدث أولاً)
    backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // تعبئة قائمة النسخ الاحتياطية
    const backupSelect = document.getElementById('backup-select');
    backupSelect.innerHTML = '';
    
    backups.forEach(backup => {
        const option = document.createElement('option');
        option.value = backup.id;
        option.textContent = backup.label;
        backupSelect.appendChild(option);
    });
    
    // إظهار نافذة اختيار النسخة الاحتياطية
    document.getElementById('backup-modal-backdrop').classList.add('show');
    document.getElementById('backup-modal').classList.add('show');
}

// تأكيد استعادة النسخة الاحتياطية
function confirmRestore() {
    const backupId = document.getElementById('backup-select').value;
    
    if (!backupId) {
        showNotification('الرجاء اختيار نسخة احتياطية', 'warning');
        return;
    }
    
    try {
        const backupData = JSON.parse(localStorage.getItem(backupId));
        
        // استعادة البيانات
        userData = backupData.userData || [];
        employeeData = backupData.employeeData || [];
        categoryData = backupData.categoryData || [];
        attendanceData = backupData.attendanceData || [];
        salaryData = backupData.salaryData || [];
        logsData = backupData.logsData || [];
        settings = backupData.settings || {};
        
        // حفظ البيانات في التخزين المحلي
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('employeeData', JSON.stringify(employeeData));
        localStorage.setItem('categoryData', JSON.stringify(categoryData));
        localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
        localStorage.setItem('salaryData', JSON.stringify(salaryData));
        localStorage.setItem('logsData', JSON.stringify(logsData));
        localStorage.setItem('settings', JSON.stringify(settings));
        
        // إخفاء نافذة الاستعادة
        document.getElementById('backup-modal-backdrop').classList.remove('show');
        document.getElementById('backup-modal').classList.remove('show');
        
        // عرض إشعار
        showNotification('تم استعادة النسخة الاحتياطية بنجاح');
        
        // إضافة سجل
        addLog(`تم استعادة نسخة احتياطية (${formatDateTime(backupData.timestamp)})`, 'restore');
        
        // تحديث الصفحة الحالية
        updatePageData(currentPage);
    } catch (e) {
        console.error('Error restoring backup:', e);
        showNotification('حدث خطأ أثناء استعادة النسخة الاحتياطية', 'error');
    }
}

// ==============================
// إدارة المستخدمين
// ==============================

// تحميل قائمة المستخدمين
function loadUsers() {
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = '';
    
    if (userData.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="7" class="text-center">لا يوجد مستخدمون للعرض</td>`;
        tbody.appendChild(tr);
        return;
    }
    
    userData.forEach(user => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${user.username}</td>
            <td>${user.fullname}</td>
            <td>${user.email}</td>
            <td>${getUserRoleDisplay(user.role)}</td>
            <td>
                <span class="status-badge ${user.status === 'active' ? 'status-active' : 'status-inactive'}">
                    <i class="fas fa-${user.status === 'active' ? 'check-circle' : 'times-circle'}"></i>
                    ${user.status === 'active' ? 'نشط' : 'غير نشط'}
                </span>
            </td>
            <td>${formatDateTime(user.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')" ${user.id === currentUser.id ? 'disabled' : ''}>
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// إضافة مستخدم جديد
function addUser() {
    // إعادة تعيين النموذج
    document.getElementById('user-id').value = '';
    document.getElementById('user-username').value = '';
    document.getElementById('user-fullname').value = '';
    document.getElementById('user-email').value = '';
    document.getElementById('user-password').value = '';
    document.getElementById('user-role').value = 'employee';
    document.getElementById('user-status').value = 'active';
    
    // تغيير عنوان النافذة
    document.getElementById('user-modal-title').textContent = 'إضافة مستخدم جديد';
    
    // إظهار حقل كلمة المرور
    document.getElementById('user-password').parentNode.style.display = 'block';
    
    // إظهار النافذة
    document.getElementById('user-modal-backdrop').classList.add('show');
    document.getElementById('user-modal').classList.add('show');
}

// تعديل مستخدم
function editUser(userId) {
    const user = userData.find(u => u.id === userId);
    if (!user) return;
    
    // تعبئة النموذج
    document.getElementById('user-id').value = user.id;
    document.getElementById('user-username').value = user.username;
    document.getElementById('user-fullname').value = user.fullname;
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-password').value = '';
    document.getElementById('user-role').value = user.role;
    document.getElementById('user-status').value = user.status;
    
    // تغيير عنوان النافذة
    document.getElementById('user-modal-title').textContent = 'تعديل المستخدم';
    
    // إخفاء حقل كلمة المرور (اختياري عند التعديل)
    document.getElementById('user-password').parentNode.style.display = 'none';
    
    // إظهار النافذة
    document.getElementById('user-modal-backdrop').classList.add('show');
    document.getElementById('user-modal').classList.add('show');
}

// حذف مستخدم
function deleteUser(userId) {
    // التحقق من عدم حذف المستخدم الحالي
    if (userId === currentUser.id) {
        showNotification('لا يمكن حذف المستخدم الحالي', 'error');
        return;
    }
    
    showConfirmModal('هل أنت متأكد من حذف هذا المستخدم؟', () => {
        userData = userData.filter(u => u.id !== userId);
        saveUsers();
        loadUsers();
        showNotification('تم حذف المستخدم بنجاح');
        addLog(`تم حذف المستخدم (${userId})`, 'delete');
    });
}

// حفظ المستخدم
function saveUser() {
    const userId = document.getElementById('user-id').value;
    const username = document.getElementById('user-username').value;
    const fullname = document.getElementById('user-fullname').value;
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;
    const status = document.getElementById('user-status').value;
    
    // التحقق من إدخال البيانات المطلوبة
    if (!username || !fullname || !email || (!userId && !password)) {
        showNotification('الرجاء إدخال جميع البيانات المطلوبة', 'error');
        return;
    }
    
    // التحقق من عدم تكرار اسم المستخدم
    const existingUser = userData.find(u => u.username === username && u.id !== userId);
    if (existingUser) {
        showNotification('اسم المستخدم موجود بالفعل', 'error');
        return;
    }
    
    if (userId) {
        // تعديل مستخدم موجود
        const index = userData.findIndex(u => u.id === userId);
        if (index !== -1) {
            userData[index] = {
                ...userData[index],
                username,
                fullname,
                email,
                role,
                status,
                updatedAt: new Date(),
                updatedBy: currentUser.id
            };
            
            // تحديث كلمة المرور إذا تم إدخالها
            if (password) {
                userData[index].password = password;
            }
        }
    } else {
        // إضافة مستخدم جديد
        const newUser = {
            id: generateId(),
            username,
            fullname,
            email,
            password,
            role,
            status,
            createdAt: new Date(),
            createdBy: currentUser.id
        };
        
        userData.push(newUser);
    }
    
    // حفظ البيانات
    saveUsers();
    
    // إخفاء النافذة
    document.getElementById('user-modal-backdrop').classList.remove('show');
    document.getElementById('user-modal').classList.remove('show');
    
    // تحديث قائمة المستخدمين
    loadUsers();
    
    // عرض إشعار
    showNotification(userId ? 'تم تعديل المستخدم بنجاح' : 'تم إضافة المستخدم بنجاح');
    
    // إضافة سجل
    addLog(userId ? `تم تعديل المستخدم (${username})` : `تم إضافة مستخدم جديد (${username})`, userId ? 'update' : 'create');
}

// حفظ بيانات المستخدمين
function saveUsers() {
    localStorage.setItem('userData', JSON.stringify(userData));
}

// ==============================
// إدارة السجلات
// ==============================

// تحميل السجلات
function loadLogs() {
    // تعبئة قائمة المستخدمين في فلتر السجلات
    const userSelect = document.getElementById('log-user');
    userSelect.innerHTML = '<option value="">جميع المستخدمين</option>';
    
    userData.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.fullname;
        userSelect.appendChild(option);
    });
    
    // عرض السجلات بدون فلترة
    filterLogs();
}

// فلترة السجلات
function filterLogs() {
    const dateFrom = document.getElementById('log-date-from').value;
    const dateTo = document.getElementById('log-date-to').value;
    const userId = document.getElementById('log-user').value;
    const logType = document.getElementById('log-type').value;
    
    // فلترة البيانات
    let filteredLogs = logsData;
    
    if (dateFrom) {
        filteredLogs = filteredLogs.filter(log => formatDate(log.timestamp) >= dateFrom);
    }
    
    if (dateTo) {
        filteredLogs = filteredLogs.filter(log => formatDate(log.timestamp) <= dateTo);
    }
    
    if (userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }
    
    if (logType) {
        filteredLogs = filteredLogs.filter(log => log.type === logType);
    }
    
    // ترتيب السجلات (الأحدث أولاً)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // عرض السجلات المفلترة
    displayLogs(filteredLogs);
}

// عرض السجلات
function displayLogs(logs) {
    const tbody = document.querySelector('#logs-table tbody');
    tbody.innerHTML = '';
    
    if (logs.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="6" class="text-center">لا توجد سجلات للعرض</td>`;
        tbody.appendChild(tr);
        return;
    }
    
    logs.forEach(log => {
        const tr = document.createElement('tr');
        
        // الحصول على اسم المستخدم
        const user = userData.find(u => u.id === log.userId);
        const username = user ? user.fullname : log.username || '-';
        
        tr.innerHTML = `
            <td>${formatDateTime(log.timestamp)}</td>
            <td>${username}</td>
            <td>${getLogTypeDisplay(log.type)}</td>
            <td>${log.action}</td>
            <td>${log.details || '-'}</td>
            <td>${log.ip || '-'}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

// الحصول على اسم عرض لنوع السجل
function getLogTypeDisplay(type) {
    const types = {
        'login': 'تسجيل دخول',
        'logout': 'تسجيل خروج',
        'create': 'إنشاء',
        'update': 'تحديث',
        'delete': 'حذف',
        'error': 'خطأ',
        'attendance': 'حضور وانصراف',
        'backup': 'نسخ احتياطي',
        'restore': 'استعادة',
        'navigation': 'تنقل'
    };
    
    return types[type] || type;
}

// إضافة سجل
function addLog(action, type = 'info', details = '') {
    const newLog = {
        id: generateId(),
        timestamp: new Date(),
        userId: currentUser ? currentUser.id : null,
        username: currentUser ? currentUser.username : null,
        action,
        type,
        details,
        ip: '127.0.0.1' // في تطبيق حقيقي، يجب الحصول على عنوان IP الفعلي
    };
    
    logsData.push(newLog);
    saveLogs();
}

// حفظ السجلات
function saveLogs() {
    localStorage.setItem('logsData', JSON.stringify(logsData));
}

// ==============================
// دوال عامة للواجهة
// ==============================

// تنشيط علامة تبويب
function activateTab(tabId) {
    // إزالة التنشيط من جميع علامات التبويب
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // إزالة التنشيط من جميع محتويات علامات التبويب
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // تنشيط علامة التبويب المطلوبة
    document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// التبديل بين إظهار/إخفاء القائمة الفرعية
function toggleSubmenu(submenuId) {
    const submenu = document.getElementById(submenuId);
    if (submenu) {
        submenu.classList.toggle('show');
    }
}

// ==============================
// تهيئة التطبيق
// ==============================

// تحميل البيانات من التخزين المحلي
function loadData() {
    userData = JSON.parse(localStorage.getItem('userData')) || [];
    employeeData = JSON.parse(localStorage.getItem('employeeData')) || [];
    categoryData = JSON.parse(localStorage.getItem('categoryData')) || [];
    attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || [];
    salaryData = JSON.parse(localStorage.getItem('salaryData')) || [];
    logsData = JSON.parse(localStorage.getItem('logsData')) || [];
    settings = JSON.parse(localStorage.getItem('settings')) || {};
    
    // إنشاء مستخدم افتراضي إذا لم يكن هناك مستخدمين
    if (userData.length === 0) {
        const defaultAdmin = {
            id: 'admin',
            username: 'admin',
            password: 'admin',
            fullname: 'مدير النظام',
            email: 'admin@example.com',
            role: 'admin',
            status: 'active',
            createdAt: new Date()
        };
        
        userData.push(defaultAdmin);
        saveUsers();
    }
}

// تحميل شعار المؤسسة
function loadCompanyLogo() {
    // تحديث شعار الشركة إذا كان متاحًا
    if (settings.companyLogo) {
        // تطبيق الشعار في جميع الأماكن المطلوبة
    }
}

// ربط الأحداث
function bindEvents() {
    // نموذج تسجيل الدخول
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        login(username, password);
    });
    
    // أزرار تسجيل الخروج
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('logout-btn-menu').addEventListener('click', logout);
    
    // بحث الموظفين
    document.getElementById('employee-search').addEventListener('input', loadEmployees);
    document.getElementById('employee-filter').addEventListener('change', loadEmployees);
    
    // القائمة الرئيسية
    document.querySelectorAll('.sidebar-menu-item[data-page]').forEach(item => {
        item.addEventListener('click', function() {
            navigateTo(this.dataset.page);
        });
    });
    
    // القوائم الفرعية
    document.querySelectorAll('.sidebar-menu-item[data-submenu]').forEach(item => {
        item.addEventListener('click', function() {
            toggleSubmenu(this.dataset.submenu + '-submenu');
        });
    });
    
    // عناصر القوائم الفرعية
    document.querySelectorAll('.sidebar-submenu-item[data-page]').forEach(item => {
        item.addEventListener('click', function() {
            navigateTo(this.dataset.page);
        });
    });
    
    // إضافة علاوة
    document.getElementById('add-allowance').addEventListener('click', function() {
        const container = document.getElementById('allowances-container');
        const newRow = document.createElement('div');
        newRow.className = 'form-grid mb-2';
        newRow.innerHTML = `
            <div class="form-group m-0">
                <input type="text" class="form-control allowance-name" placeholder="اسم العلاوة">
            </div>
            <div class="form-group m-0">
                <input type="number" class="form-control allowance-amount" placeholder="المبلغ">
            </div>
        `;
        container.appendChild(newRow);
    });
    
    // إضافة استقطاع
    document.getElementById('add-deduction').addEventListener('click', function() {
        const container = document.getElementById('deductions-container');
        const newRow = document.createElement('div');
        newRow.className = 'form-grid mb-2';
        newRow.innerHTML = `
            <div class="form-group m-0">
                <input type="text" class="form-control deduction-name" placeholder="اسم الاستقطاع">
            </div>
            <div class="form-group m-0">
                <input type="number" class="form-control deduction-amount" placeholder="المبلغ">
            </div>
        `;
        container.appendChild(newRow);
    });
    
    // علامات التبويب
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            activateTab(this.dataset.tab);
        });
    });
    
    // ملف الموظف
    document.getElementById('employee-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEmployee();
    });
    
    // زر إضافة تصنيف
    document.getElementById('add-category-btn').addEventListener('click', addCategory);
    
    // نموذج التصنيف
    document.getElementById('save-category-btn').addEventListener('click', saveCategory);
    document.getElementById('cancel-category-btn').addEventListener('click', function() {
        document.getElementById('category-modal-backdrop').classList.remove('show');
        document.getElementById('category-modal').classList.remove('show');
    });
    document.getElementById('category-modal-close').addEventListener('click', function() {
        document.getElementById('category-modal-backdrop').classList.remove('show');
        document.getElementById('category-modal').classList.remove('show');
    });
    
    // نافذة تأكيد
    document.getElementById('confirm-action-btn').addEventListener('click', function() {
        if (typeof confirmCallback === 'function') {
            confirmCallback();
        }
        hideConfirmModal();
    });
    document.getElementById('cancel-confirm-btn').addEventListener('click', hideConfirmModal);
    document.getElementById('confirm-modal-close').addEventListener('click', hideConfirmModal);
    
    // صفحة الحضور والانصراف
    document.getElementById('attendance-barcode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            recordAttendance(this.value);
            this.value = '';
            e.preventDefault();
        }
    });
    
    // تقارير الحضور
    document.getElementById('generate-attendance-report').addEventListener('click', generateAttendanceReport);
    document.getElementById('print-attendance-report').addEventListener('click', function() {
        window.print();
    });
    
    // صفحة الرواتب
    document.getElementById('generate-salary-sheet').addEventListener('click', generateSalarySheet);
    document.getElementById('print-salary-sheet').addEventListener('click', function() {
        window.print();
    });
    document.getElementById('finalize-salary-sheet').addEventListener('click', finalizeSalarySheet);
    
    // نافذة تفاصيل الراتب
    document.getElementById('salary-details-modal-close').addEventListener('click', function() {
        document.getElementById('salary-details-modal-backdrop').classList.remove('show');
        document.getElementById('salary-details-modal').classList.remove('show');
    });
    document.getElementById('close-salary-details-btn').addEventListener('click', function() {
        document.getElementById('salary-details-modal-backdrop').classList.remove('show');
        document.getElementById('salary-details-modal').classList.remove('show');
    });
    document.getElementById('print-salary-details-btn').addEventListener('click', function() {
        window.print();
    });
    
    // نافذة تعديل الراتب
    document.getElementById('salary-edit-modal-close').addEventListener('click', function() {
        document.getElementById('salary-edit-modal-backdrop').classList.remove('show');
        document.getElementById('salary-edit-modal').classList.remove('show');
    });
    document.getElementById('cancel-salary-edit-btn').addEventListener('click', function() {
        document.getElementById('salary-edit-modal-backdrop').classList.remove('show');
        document.getElementById('salary-edit-modal').classList.remove('show');
    });
    document.getElementById('save-salary-edit-btn').addEventListener('click', saveSalaryEdit);
    
    // تقارير الرواتب
    document.getElementById('generate-salary-report').addEventListener('click', generateSalaryReport);
    document.getElementById('print-salary-report').addEventListener('click', function() {
        window.print();
    });
    
    // ملف التعريف والإعدادات للمستخدم
    document.getElementById('user-profile').addEventListener('click', function() {
        document.getElementById('user-dropdown').classList.toggle('show');
    });
    
    // إخفاء القائمة المنسدلة عند النقر خارجها
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#user-profile') && !e.target.closest('#user-dropdown')) {
            document.getElementById('user-dropdown').classList.remove('show');
        }
    });
    
    // صفحة الباركود
    document.getElementById('generate-barcode').addEventListener('click', generateBarcode);
    document.getElementById('print-barcode').addEventListener('click', printBarcode);
    document.getElementById('generate-multiple-barcodes').addEventListener('click', generateMultipleBarcodes);
    document.getElementById('print-multiple-barcodes').addEventListener('click', printMultipleBarcodes);
    
   // صفحة الإعدادات
    document.getElementById('general-settings-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveGeneralSettings();
    });
    
    document.getElementById('salary-settings-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveSalarySettings();
    });
    
    document.getElementById('system-settings-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveSystemSettings();
    });
    
    document.getElementById('backup-now').addEventListener('click', backupNow);
    document.getElementById('restore-backup').addEventListener('click', restoreBackup);
    
    // نافذة استعادة النسخة الاحتياطية
    document.getElementById('backup-modal-close').addEventListener('click', function() {
        document.getElementById('backup-modal-backdrop').classList.remove('show');
        document.getElementById('backup-modal').classList.remove('show');
    });
    document.getElementById('cancel-restore-btn').addEventListener('click', function() {
        document.getElementById('backup-modal-backdrop').classList.remove('show');
        document.getElementById('backup-modal').classList.remove('show');
    });
    document.getElementById('confirm-restore-btn').addEventListener('click', confirmRestore);
    
    // صفحة المستخدمين
    document.getElementById('add-user-btn').addEventListener('click', addUser);
    
    // نافذة المستخدم
    document.getElementById('user-modal-close').addEventListener('click', function() {
        document.getElementById('user-modal-backdrop').classList.remove('show');
        document.getElementById('user-modal').classList.remove('show');
    });
    document.getElementById('cancel-user-btn').addEventListener('click', function() {
        document.getElementById('user-modal-backdrop').classList.remove('show');
        document.getElementById('user-modal').classList.remove('show');
    });
    document.getElementById('save-user-btn').addEventListener('click', saveUser);
    
    // صفحة السجلات
    document.getElementById('filter-logs').addEventListener('click', filterLogs);
    
    // زر تبديل القائمة الجانبية
    document.getElementById('sidebar-toggle').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('sidebar-hidden');
        document.getElementById('main-content').classList.toggle('full-width');
    });
    
    // إغلاق الإشعار
    document.getElementById('notification-close').addEventListener('click', function() {
        document.getElementById('notification').classList.remove('show');
    });
}

// تهيئة التطبيق
function initializeApp() {
    // تحميل البيانات
    loadData();
    
    // ربط الأحداث
    bindEvents();
    
    // تحميل شعار المؤسسة
    loadCompanyLogo();
}

// بدء التطبيق عند اكتمال تحميل الصفحة
document.addEventListener('DOMContentLoaded', initializeApp);

// دوال مساعدة للتعامل مع الوقت المنقضي منذ آخر نشاط
let inactivityTimeout;

function resetInactivityTimer() {
    clearTimeout(inactivityTimeout);
    const settings = getSettings();
    const sessionTimeout = settings.sessionTimeout || 30;
    
    // تعيين مؤقت جديد
    if (currentUser) {
        inactivityTimeout = setTimeout(() => {
            // تسجيل الخروج تلقائيًا بعد انتهاء مدة الجلسة
            showNotification('تم تسجيل الخروج تلقائيًا بسبب عدم النشاط', 'warning');
            logout();
        }, sessionTimeout * 60 * 1000); // تحويل الدقائق إلى مللي ثانية
    }
}

// تحديث مؤقت الخمول عند كل نشاط
document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('click', resetInactivityTimer);
document.addEventListener('scroll', resetInactivityTimer);




