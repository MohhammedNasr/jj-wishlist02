// Wishlist Application (View-Only)
class WishlistApp {
    constructor() {
        this.items = this.loadItems();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderWishlist();
        this.updateStats();
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

        // Notification forms
        document.getElementById('purchaseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitPurchaseNotification();
        });

        document.getElementById('wishesForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitBirthdayWish();
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
            this.renderWishlist();
            this.updateStats();
        }
    }

    // Rendering
    renderWishlist() {
        const grid = document.getElementById('wishlistGrid');
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
            <div class="wishlist-item ${statusClass}" data-id="${item.id}">
                <div class="item-header">
                    <h3 class="item-name">${this.escapeHtml(item.name)}</h3>
                    <span class="item-priority ${priorityClass}">${item.priority}</span>
                </div>
                
                <span class="item-category">${this.getCategoryDisplayName(item.category)}</span>
                
                ${item.image ? `<img src="${item.image}" alt="${this.escapeHtml(item.name)}" class="item-image">` : ''}
                
                ${item.description ? `<p class="item-description">${this.escapeHtml(item.description)}</p>` : ''}
                
                ${item.price ? `<div class="item-price">${this.escapeHtml(item.price)}</div>` : ''}
                
                <div class="item-actions">
                    ${item.link ? `
                        <a href="${item.link}" target="_blank" class="btn btn-primary btn-small">
                            <i class="fas fa-external-link-alt"></i> View Item
                        </a>
                    ` : ''}
                    
                    <button onclick="app.togglePurchaseStatus('${item.id}')" class="btn ${item.status === 'purchased' ? 'btn-secondary' : 'btn-success'} btn-small">
                        <i class="fas fa-${item.status === 'purchased' ? 'undo' : 'check'}"></i>
                        ${item.status === 'purchased' ? 'Mark Available' : 'Mark Purchased'}
                    </button>
                    
                    <button onclick="app.showItemDetails('${item.id}')" class="btn btn-primary btn-small">
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
        this.renderWishlist();
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
                    <span class="item-priority priority-${item.priority}">${item.priority}</span>
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
                
                <button onclick="app.togglePurchaseStatus('${item.id}'); app.closeModal();" class="btn ${item.status === 'purchased' ? 'btn-secondary' : 'btn-success'}">
                    <i class="fas fa-${item.status === 'purchased' ? 'undo' : 'check'}"></i>
                    ${item.status === 'purchased' ? 'Mark Available' : 'Mark Purchased'}
                </button>
                
                ${this.isAdminMode ? `
                    <button onclick="app.removeItem('${item.id}'); app.closeModal();" class="btn btn-secondary">
                        <i class="fas fa-trash"></i> Remove Item
                    </button>
                ` : ''}
            </div>
        `;
        
        modal.classList.add('show');
    }

    closeModal() {
        document.getElementById('itemModal').classList.remove('show');
    }

    // Notification Functions
    submitPurchaseNotification() {
        const purchaserName = document.getElementById('purchaserName').value.trim();
        const purchasedItem = document.getElementById('purchasedItem').value.trim();
        const purchaseMessage = document.getElementById('purchaseMessage').value.trim();

        if (!purchaserName || !purchasedItem) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const notification = {
            id: Date.now().toString(),
            type: 'purchase',
            purchaserName: purchaserName,
            purchasedItem: purchasedItem,
            message: purchaseMessage,
            timestamp: new Date().toISOString(),
            read: false
        };

        this.saveNotification(notification);
        this.clearPurchaseForm();
        this.showNotification('Purchase notification sent! JJ will be so happy! 🎉', 'success');
    }

    submitBirthdayWish() {
        const wisherName = document.getElementById('wisherName').value.trim();
        const birthdayMessage = document.getElementById('birthdayMessage').value.trim();

        if (!wisherName || !birthdayMessage) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const notification = {
            id: Date.now().toString(),
            type: 'birthday_wish',
            wisherName: wisherName,
            message: birthdayMessage,
            timestamp: new Date().toISOString(),
            read: false
        };

        this.saveNotification(notification);
        this.clearWishesForm();
        this.showNotification('Birthday wish sent! Thank you for making JJ\'s day special! 💝', 'success');
    }

    saveNotification(notification) {
        const notifications = this.loadNotifications();
        notifications.unshift(notification);
        localStorage.setItem('wishlistNotifications', JSON.stringify(notifications));
    }

    loadNotifications() {
        const saved = localStorage.getItem('wishlistNotifications');
        return saved ? JSON.parse(saved) : [];
    }

    clearPurchaseForm() {
        document.getElementById('purchaseForm').reset();
    }

    clearWishesForm() {
        document.getElementById('wishesForm').reset();
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

    // Custom Categories Management (for display purposes)
    loadCustomCategories() {
        const saved = localStorage.getItem('customCategories');
        return saved ? JSON.parse(saved) : {};
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

}

// Global functions for HTML onclick handlers
function closeModal() {
    app.closeModal();
}

function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

function toggleNotifications() {
    const content = document.getElementById('notificationsContent');
    const icon = document.querySelector('.toggle-icon');
    
    if (content.classList.contains('show')) {
        content.classList.remove('show');
        icon.classList.remove('rotated');
    } else {
        content.classList.add('show');
        icon.classList.add('rotated');
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new WishlistApp();
    
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
