// Admin Dashboard Application
class AdminDashboard {
    constructor() {
        this.items = this.loadItems();
        this.init();
    }

    init() {
        // Check if user is logged in
        if (sessionStorage.getItem('adminLoggedIn') !== 'true') {
            window.location.href = 'admin-login.html';
            return;
        }

        this.setupEventListeners();
        this.updateCategorySelects();
        this.renderItems();
        this.updateStats();
        this.renderNotifications();
    }

    // Local Storage Management
    loadItems() {
        const saved = localStorage.getItem('wishlistItems');
        return saved ? JSON.parse(saved) : [];
    }

    saveItems() {
        localStorage.setItem('wishlistItems', JSON.stringify(this.items));
    }

    // Event Listeners
    setupEventListeners() {
        // Add item form
        document.getElementById('addItemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addItem();
        });

        // Add category form
        document.getElementById('addCategoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCategory();
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterItems();
        });

        // Filter controls
        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.filterItems();
        });

        document.getElementById('priorityFilter').addEventListener('change', () => {
            this.filterItems();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.filterItems();
        });

        // Modal close on outside click
        document.getElementById('itemModal').addEventListener('click', (e) => {
            if (e.target.id === 'itemModal') {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
        });
    }

    // Item Management
    addItem() {
        const imageFile = document.getElementById('itemImage').files[0];
        let imageData = null;
        
        if (imageFile) {
            // Process and compress image
            this.processImage(imageFile, (compressedData) => {
                this.addItemWithImage(compressedData);
            });
        } else {
            this.addItemWithImage(null);
        }
    }
    
    addItemWithImage(imageData) {
        const item = {
            id: Date.now().toString(),
            name: document.getElementById('itemName').value.trim(),
            description: document.getElementById('itemDescription').value.trim(),
            price: document.getElementById('itemPrice').value.trim(),
            link: document.getElementById('itemLink').value.trim(),
            category: document.getElementById('itemCategory').value,
            priority: document.getElementById('itemPriority').value,
            status: 'available',
            dateAdded: new Date().toISOString(),
            purchasedBy: null,
            image: imageData
        };

        if (!item.name) {
            this.showNotification('Please enter an item name', 'error');
            return;
        }

        this.items.unshift(item);
        this.saveItems();
        this.renderItems();
        this.updateStats();
        this.clearForm();
        
        this.showNotification('Item added to wishlist!', 'success');
        
        // Scroll to top to see the new item
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    processImage(file, callback) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate new dimensions (max 800px width, maintain aspect ratio)
                let { width, height } = img;
                const maxWidth = 800;
                const maxHeight = 600;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                const compressedData = canvas.toDataURL('image/jpeg', 0.8);
                callback(compressedData);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    clearForm() {
        document.getElementById('addItemForm').reset();
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('previewImg').src = '';
    }

    removeItem(id) {
        if (confirm('Are you sure you want to remove this item?')) {
            this.items = this.items.filter(item => item.id !== id);
            this.saveItems();
            this.renderItems();
            this.updateStats();
            this.showNotification('Item removed from wishlist', 'info');
        }
    }

    togglePurchaseStatus(id) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            if (item.status === 'available') {
                const purchaser = prompt('Who purchased this item? (optional)');
                item.status = 'purchased';
                item.purchasedBy = purchaser || 'Someone special';
                item.datePurchased = new Date().toISOString();
                this.showNotification(`${item.name} marked as purchased!`, 'success');
            } else {
                item.status = 'available';
                item.purchasedBy = null;
                item.datePurchased = null;
                this.showNotification(`${item.name} marked as available again`, 'info');
            }
            this.saveItems();
            this.renderItems();
            this.updateStats();
        }
    }

    // Rendering
    renderItems() {
        const grid = document.getElementById('adminItemsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (this.items.length === 0) {
            grid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        
        const filteredItems = this.getFilteredItems();
        
        if (filteredItems.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No items match your filters</h3>
                    <p>Try adjusting your search or filter criteria</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredItems.map(item => this.createItemHTML(item)).join('');
    }

    createItemHTML(item) {
        const priorityClass = `priority-${item.priority}`;
        const statusClass = item.status === 'purchased' ? 'purchased' : '';
        
        return `
            <div class="admin-item ${statusClass}" data-id="${item.id}">
                <div class="admin-item-header">
                    <h3 class="admin-item-name">${this.escapeHtml(item.name)}</h3>
                    <span class="admin-item-priority ${priorityClass}">${item.priority}</span>
                </div>
                
                <span class="admin-item-category">${this.getCategoryDisplayName(item.category)}</span>
                
                ${item.image ? `<img src="${item.image}" alt="${this.escapeHtml(item.name)}" class="admin-item-image">` : ''}
                
                ${item.description ? `<p class="admin-item-description">${this.escapeHtml(item.description)}</p>` : ''}
                
                ${item.price ? `<div class="admin-item-price">${this.escapeHtml(item.price)}</div>` : ''}
                
                <div class="admin-item-actions">
                    ${item.link ? `
                        <a href="${item.link}" target="_blank" class="btn btn-primary btn-small">
                            <i class="fas fa-external-link-alt"></i> View Item
                        </a>
                    ` : ''}
                    
                    <button onclick="adminApp.togglePurchaseStatus('${item.id}')" class="btn ${item.status === 'purchased' ? 'btn-secondary' : 'btn-success'} btn-small">
                        <i class="fas fa-${item.status === 'purchased' ? 'undo' : 'check'}"></i>
                        ${item.status === 'purchased' ? 'Mark Available' : 'Mark Purchased'}
                    </button>
                    
                    <button onclick="adminApp.removeItem('${item.id}')" class="btn btn-secondary btn-small">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                    
                    <button onclick="adminApp.showItemDetails('${item.id}')" class="btn btn-primary btn-small">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
                
                ${item.purchasedBy ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0; color: #38a169; font-size: 0.9rem;">
                        <i class="fas fa-heart"></i> Purchased by ${this.escapeHtml(item.purchasedBy)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Filtering
    getFilteredItems() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        return this.items.filter(item => {
            const matchesSearch = !searchTerm || 
                item.name.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm);
            
            const matchesCategory = !categoryFilter || item.category === categoryFilter;
            const matchesPriority = !priorityFilter || item.priority === priorityFilter;
            const matchesStatus = !statusFilter || item.status === statusFilter;

            return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
        });
    }

    filterItems() {
        this.renderItems();
    }

    // Statistics
    updateStats() {
        const totalItems = this.items.length;
        const purchasedItems = this.items.filter(item => item.status === 'purchased').length;
        const highPriorityItems = this.items.filter(item => item.priority === 'high').length;

        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('purchasedItems').textContent = purchasedItems;
        document.getElementById('highPriorityItems').textContent = highPriorityItems;
    }

    // Modal Management
    showItemDetails(id) {
        const item = this.items.find(item => item.id === id);
        if (!item) return;

        const modal = document.getElementById('itemModal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <h2>${this.escapeHtml(item.name)}</h2>
            ${item.image ? `<img src="${item.image}" alt="${this.escapeHtml(item.name)}" style="width: 100%; max-width: 400px; height: auto; border-radius: 12px; margin-bottom: 20px; border: 2px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">` : ''}
            <div class="item-details">
                <div class="detail-row">
                    <strong>Category:</strong> ${this.getCategoryDisplayName(item.category)}
                </div>
                <div class="detail-row">
                    <strong>Priority:</strong> 
                    <span class="admin-item-priority priority-${item.priority}">${item.priority}</span>
                </div>
                <div class="detail-row">
                    <strong>Status:</strong> 
                    <span style="color: ${item.status === 'purchased' ? '#38a169' : '#667eea'}; font-weight: 600;">
                        ${item.status === 'purchased' ? 'Purchased' : 'Available'}
                    </span>
                </div>
                ${item.price ? `
                    <div class="detail-row">
                        <strong>Price Range:</strong> ${this.escapeHtml(item.price)}
                    </div>
                ` : ''}
                ${item.description ? `
                    <div class="detail-row">
                        <strong>Description:</strong>
                        <p style="margin-top: 5px;">${this.escapeHtml(item.description)}</p>
                    </div>
                ` : ''}
                ${item.link ? `
                    <div class="detail-row">
                        <strong>Purchase Link:</strong>
                        <a href="${item.link}" target="_blank" style="color: #667eea; word-break: break-all;">
                            ${item.link}
                        </a>
                    </div>
                ` : ''}
                <div class="detail-row">
                    <strong>Date Added:</strong> ${new Date(item.dateAdded).toLocaleDateString()}
                </div>
                ${item.purchasedBy ? `
                    <div class="detail-row">
                        <strong>Purchased By:</strong> ${this.escapeHtml(item.purchasedBy)}
                    </div>
                    <div class="detail-row">
                        <strong>Date Purchased:</strong> ${new Date(item.datePurchased).toLocaleDateString()}
                    </div>
                ` : ''}
            </div>
            
            <div style="margin-top: 30px; display: flex; gap: 15px; flex-wrap: wrap;">
                ${item.link ? `
                    <a href="${item.link}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-external-link-alt"></i> View Item
                    </a>
                ` : ''}
                
                <button onclick="adminApp.togglePurchaseStatus('${item.id}'); adminApp.closeModal();" class="btn ${item.status === 'purchased' ? 'btn-secondary' : 'btn-success'}">
                    <i class="fas fa-${item.status === 'purchased' ? 'undo' : 'check'}"></i>
                    ${item.status === 'purchased' ? 'Mark Available' : 'Mark Purchased'}
                </button>
                
                <button onclick="adminApp.removeItem('${item.id}'); adminApp.closeModal();" class="btn btn-secondary">
                    <i class="fas fa-trash"></i> Remove Item
                </button>
            </div>
        `;
        
        modal.classList.add('show');
    }

    closeModal() {
        document.getElementById('itemModal').classList.remove('show');
    }

    // Utility Functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getCategoryDisplayName(category) {
        const categoryNames = {
            'tea-herbs': 'Tea & Herbs',
            'beauty-health': 'Beauty & Health',
            'electronics': 'Electronics',
            'accessories': 'Accessories',
            'clothing': 'Clothing'
        };
        
        // Check for custom categories
        const customCategories = this.loadCustomCategories();
        if (customCategories[category]) {
            return customCategories[category];
        }
        
        return categoryNames[category] || category;
    }

    // Custom Categories Management
    loadCustomCategories() {
        const saved = localStorage.getItem('customCategories');
        return saved ? JSON.parse(saved) : {};
    }

    saveCustomCategories(categories) {
        localStorage.setItem('customCategories', JSON.stringify(categories));
    }

    addCustomCategory(name, value) {
        const customCategories = this.loadCustomCategories();
        customCategories[value] = name;
        this.saveCustomCategories(customCategories);
        this.updateCategorySelects();
    }

    updateCategorySelects() {
        const customCategories = this.loadCustomCategories();
        
        // Update main category select
        const mainSelect = document.getElementById('itemCategory');
        const currentValue = mainSelect.value;
        
        // Clear existing options except the first few
        const defaultOptions = [
            { value: 'tea-herbs', text: 'Tea & Herbs' },
            { value: 'beauty-health', text: 'Beauty & Health' },
            { value: 'electronics', text: 'Electronics' },
            { value: 'accessories', text: 'Accessories' },
            { value: 'clothing', text: 'Clothing' }
        ];
        
        mainSelect.innerHTML = '';
        defaultOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            mainSelect.appendChild(optionElement);
        });
        
        // Add custom categories
        Object.entries(customCategories).forEach(([value, name]) => {
            const optionElement = document.createElement('option');
            optionElement.value = value;
            optionElement.textContent = name;
            mainSelect.appendChild(optionElement);
        });
        
        // Restore selected value if it still exists
        if (currentValue && (defaultOptions.find(opt => opt.value === currentValue) || customCategories[currentValue])) {
            mainSelect.value = currentValue;
        }
        
        // Update filter select
        const filterSelect = document.getElementById('categoryFilter');
        const filterCurrentValue = filterSelect.value;
        
        filterSelect.innerHTML = '<option value="">All Categories</option>';
        defaultOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            filterSelect.appendChild(optionElement);
        });
        
        Object.entries(customCategories).forEach(([value, name]) => {
            const optionElement = document.createElement('option');
            optionElement.value = value;
            optionElement.textContent = name;
            filterSelect.appendChild(optionElement);
        });
        
        if (filterCurrentValue && (defaultOptions.find(opt => opt.value === filterCurrentValue) || customCategories[filterCurrentValue])) {
            filterSelect.value = filterCurrentValue;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#667eea'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 1001;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Notification Management
    loadNotifications() {
        const saved = localStorage.getItem('wishlistNotifications');
        return saved ? JSON.parse(saved) : [];
    }

    saveNotifications(notifications) {
        localStorage.setItem('wishlistNotifications', JSON.stringify(notifications));
    }

    renderNotifications() {
        const notifications = this.loadNotifications();
        const notificationsList = document.getElementById('notificationsList');
        const unreadCount = document.getElementById('unreadCount');
        
        const unreadNotifications = notifications.filter(n => !n.read);
        unreadCount.textContent = unreadNotifications.length;
        
        if (notifications.length === 0) {
            notificationsList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #a0aec0;">
                    <i class="fas fa-bell-slash" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <h3>No notifications yet</h3>
                    <p>When someone buys something or sends birthday wishes, they'll appear here!</p>
                </div>
            `;
            return;
        }
        
        notificationsList.innerHTML = notifications.map(notification => this.createNotificationHTML(notification)).join('');
    }

    createNotificationHTML(notification) {
        const isUnread = !notification.read;
        const timeAgo = this.getTimeAgo(notification.timestamp);
        
        if (notification.type === 'purchase') {
            return `
                <div class="notification-item ${isUnread ? 'unread' : ''}" data-id="${notification.id}">
                    <div class="notification-header">
                        <span class="notification-type purchase">
                            <i class="fas fa-gift"></i> Purchase
                        </span>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                    <div class="notification-content">
                        <strong>${this.escapeHtml(notification.purchaserName)}</strong> bought 
                        <strong>"${this.escapeHtml(notification.purchasedItem)}"</strong>
                        ${notification.message ? `<br><em>"${this.escapeHtml(notification.message)}"</em>` : ''}
                    </div>
                    <div class="notification-actions">
                        ${isUnread ? `
                            <button onclick="adminApp.markAsRead('${notification.id}')" class="btn btn-primary btn-small">
                                <i class="fas fa-check"></i> Mark as Read
                            </button>
                        ` : ''}
                        <button onclick="adminApp.deleteNotification('${notification.id}')" class="btn btn-secondary btn-small">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        } else if (notification.type === 'birthday_wish') {
            return `
                <div class="notification-item ${isUnread ? 'unread' : ''}" data-id="${notification.id}">
                    <div class="notification-header">
                        <span class="notification-type birthday_wish">
                            <i class="fas fa-heart"></i> Birthday Wish
                        </span>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                    <div class="notification-content">
                        <strong>${this.escapeHtml(notification.wisherName)}</strong> sent you a birthday wish:<br>
                        <em>"${this.escapeHtml(notification.message)}"</em>
                    </div>
                    <div class="notification-actions">
                        ${isUnread ? `
                            <button onclick="adminApp.markAsRead('${notification.id}')" class="btn btn-primary btn-small">
                                <i class="fas fa-check"></i> Mark as Read
                            </button>
                        ` : ''}
                        <button onclick="adminApp.deleteNotification('${notification.id}')" class="btn btn-secondary btn-small">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }
    }

    markAsRead(notificationId) {
        const notifications = this.loadNotifications();
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotifications(notifications);
            this.renderNotifications();
            this.showNotification('Notification marked as read', 'success');
        }
    }

    deleteNotification(notificationId) {
        if (confirm('Are you sure you want to delete this notification?')) {
            const notifications = this.loadNotifications();
            const filteredNotifications = notifications.filter(n => n.id !== notificationId);
            this.saveNotifications(filteredNotifications);
            this.renderNotifications();
            this.showNotification('Notification deleted', 'info');
        }
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffInSeconds = Math.floor((now - notificationTime) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        
        return notificationTime.toLocaleDateString();
    }

    // Data Management
    clearAllItems() {
        if (confirm('Are you sure you want to clear all items? This action cannot be undone.')) {
            this.items = [];
            this.saveItems();
            this.renderItems();
            this.updateStats();
            this.showNotification('All items cleared', 'info');
        }
    }

    // Export/Import functionality
    exportWishlist() {
        const dataStr = JSON.stringify(this.items, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'wishlist-backup.json';
        link.click();
        URL.revokeObjectURL(url);
        this.showNotification('Wishlist exported successfully', 'success');
    }

    importWishlist(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedItems = JSON.parse(e.target.result);
                if (Array.isArray(importedItems)) {
                    this.items = importedItems;
                    this.saveItems();
                    this.renderItems();
                    this.updateStats();
                    this.showNotification('Wishlist imported successfully', 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                this.showNotification('Error importing wishlist. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Category Management
    addCategory() {
        const name = document.getElementById('newCategoryName').value.trim();
        const value = document.getElementById('newCategoryValue').value.trim().toLowerCase().replace(/\s+/g, '-');

        if (!name || !value) {
            this.showNotification('Please fill in both category name and value', 'error');
            return;
        }

        // Check if category already exists
        const customCategories = this.loadCustomCategories();
        if (customCategories[value]) {
            this.showNotification('A category with this value already exists', 'error');
            return;
        }

        this.addCustomCategory(name, value);
        this.closeAddCategoryModal();
        this.showNotification(`Category "${name}" added successfully!`, 'success');
    }
}

// Global functions for HTML onclick handlers
function closeModal() {
    adminApp.closeModal();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminLoginTime');
        window.location.href = 'admin-login.html';
    }
}

function markAllAsRead() {
    if (confirm('Mark all notifications as read?')) {
        const notifications = adminApp.loadNotifications();
        notifications.forEach(notification => {
            notification.read = true;
        });
        adminApp.saveNotifications(notifications);
        adminApp.renderNotifications();
        adminApp.showNotification('All notifications marked as read', 'success');
    }
}

function showAddCategoryModal() {
    document.getElementById('addCategoryModal').classList.add('show');
    document.getElementById('newCategoryName').focus();
}

function closeAddCategoryModal() {
    document.getElementById('addCategoryModal').classList.remove('show');
    document.getElementById('addCategoryForm').reset();
}

// Initialize the application
let adminApp;
document.addEventListener('DOMContentLoaded', () => {
    adminApp = new AdminDashboard();
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
        
        .item-details {
            margin-top: 20px;
        }
        
        .detail-row {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        
        .detail-row strong {
            color: #4a5568;
            display: inline-block;
            min-width: 120px;
        }
    `;
    document.head.appendChild(style);
});
