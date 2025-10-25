// Database Service Layer - Abstracts Firestore operations
import { db } from './firebase-config.js';
import { 
    collection, 
    doc, 
    getDocs, 
    getDoc,
    addDoc, 
    updateDoc, 
    deleteDoc, 
    setDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class DatabaseService {
    constructor() {
        this.collections = {
            items: 'items',
            notifications: 'notifications',
            categories: 'categories'
        };
        this.listeners = [];
    }

    // ==================== ITEMS ====================
    
    /**
     * Get all wishlist items
     * @returns {Promise<Array>} Array of items
     */
    async getItems() {
        try {
            const q = query(
                collection(db, this.collections.items),
                orderBy('dateAdded', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const items = [];
            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });
            return items;
        } catch (error) {
            console.error('Error getting items:', error);
            return [];
        }
    }

    /**
     * Add a new item to the wishlist
     * @param {Object} item - Item data
     * @returns {Promise<string>} Document ID
     */
    async addItem(item) {
        try {
            const itemData = {
                ...item,
                dateAdded: item.dateAdded || new Date().toISOString(),
                status: item.status || 'available',
                purchasedBy: item.purchasedBy || null,
                datePurchased: item.datePurchased || null
            };
            
            const docRef = await addDoc(collection(db, this.collections.items), itemData);
            return docRef.id;
        } catch (error) {
            console.error('Error adding item:', error);
            throw error;
        }
    }

    /**
     * Update an existing item
     * @param {string} id - Item ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<void>}
     */
    async updateItem(id, updates) {
        try {
            const itemRef = doc(db, this.collections.items, id);
            await updateDoc(itemRef, updates);
        } catch (error) {
            console.error('Error updating item:', error);
            throw error;
        }
    }

    /**
     * Delete an item
     * @param {string} id - Item ID
     * @returns {Promise<void>}
     */
    async deleteItem(id) {
        try {
            await deleteDoc(doc(db, this.collections.items, id));
        } catch (error) {
            console.error('Error deleting item:', error);
            throw error;
        }
    }

    /**
     * Listen to real-time changes in items
     * @param {Function} callback - Called when items change
     * @returns {Function} Unsubscribe function
     */
    onItemsChange(callback) {
        const q = query(
            collection(db, this.collections.items),
            orderBy('dateAdded', 'desc')
        );
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const items = [];
            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });
            callback(items);
        }, (error) => {
            console.error('Error listening to items:', error);
        });

        this.listeners.push(unsubscribe);
        return unsubscribe;
    }

    // ==================== NOTIFICATIONS ====================

    /**
     * Get all notifications
     * @returns {Promise<Array>} Array of notifications
     */
    async getNotifications() {
        try {
            const q = query(
                collection(db, this.collections.notifications),
                orderBy('timestamp', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const notifications = [];
            querySnapshot.forEach((doc) => {
                notifications.push({ id: doc.id, ...doc.data() });
            });
            return notifications;
        } catch (error) {
            console.error('Error getting notifications:', error);
            return [];
        }
    }

    /**
     * Add a new notification
     * @param {Object} notification - Notification data
     * @returns {Promise<string>} Document ID
     */
    async addNotification(notification) {
        try {
            const notificationData = {
                ...notification,
                timestamp: notification.timestamp || new Date().toISOString(),
                read: notification.read || false
            };
            
            const docRef = await addDoc(collection(db, this.collections.notifications), notificationData);
            return docRef.id;
        } catch (error) {
            console.error('Error adding notification:', error);
            throw error;
        }
    }

    /**
     * Update a notification
     * @param {string} id - Notification ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<void>}
     */
    async updateNotification(id, updates) {
        try {
            const notificationRef = doc(db, this.collections.notifications, id);
            await updateDoc(notificationRef, updates);
        } catch (error) {
            console.error('Error updating notification:', error);
            throw error;
        }
    }

    /**
     * Delete a notification
     * @param {string} id - Notification ID
     * @returns {Promise<void>}
     */
    async deleteNotification(id) {
        try {
            await deleteDoc(doc(db, this.collections.notifications, id));
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }

    /**
     * Listen to real-time changes in notifications
     * @param {Function} callback - Called when notifications change
     * @returns {Function} Unsubscribe function
     */
    onNotificationsChange(callback) {
        const q = query(
            collection(db, this.collections.notifications),
            orderBy('timestamp', 'desc')
        );
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const notifications = [];
            querySnapshot.forEach((doc) => {
                notifications.push({ id: doc.id, ...doc.data() });
            });
            callback(notifications);
        }, (error) => {
            console.error('Error listening to notifications:', error);
        });

        this.listeners.push(unsubscribe);
        return unsubscribe;
    }

    // ==================== CATEGORIES ====================

    /**
     * Get custom categories
     * @returns {Promise<Object>} Categories object
     */
    async getCategories() {
        try {
            const docRef = doc(db, this.collections.categories, 'custom');
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return docSnap.data().categories || {};
            } else {
                return {};
            }
        } catch (error) {
            console.error('Error getting categories:', error);
            return {};
        }
    }

    /**
     * Save custom categories
     * @param {Object} categories - Categories object
     * @returns {Promise<void>}
     */
    async saveCategories(categories) {
        try {
            const docRef = doc(db, this.collections.categories, 'custom');
            await setDoc(docRef, { categories }, { merge: true });
        } catch (error) {
            console.error('Error saving categories:', error);
            throw error;
        }
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Import items in bulk (for migration)
     * @param {Array} items - Array of items to import
     * @returns {Promise<void>}
     */
    async importItems(items) {
        try {
            const promises = items.map(item => this.addItem(item));
            await Promise.all(promises);
        } catch (error) {
            console.error('Error importing items:', error);
            throw error;
        }
    }

    /**
     * Clear all items (admin only)
     * @returns {Promise<void>}
     */
    async clearAllItems() {
        try {
            const querySnapshot = await getDocs(collection(db, this.collections.items));
            const promises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(promises);
        } catch (error) {
            console.error('Error clearing items:', error);
            throw error;
        }
    }

    // ==================== CLEANUP ====================

    /**
     * Unsubscribe from all listeners
     */
    cleanup() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }
}

// Create and export singleton instance
const dbService = new DatabaseService();
export default dbService;
