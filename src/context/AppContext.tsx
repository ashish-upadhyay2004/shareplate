import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, DonationListing, DonationRequest, Notification, ChatMessage, UserRole, DonationStatus } from '@/types';
import { mockUsers, mockListings, mockRequests, mockNotifications, mockMessages } from '@/data/mockData';

interface AppContextType {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<User>, password: string) => Promise<boolean>;
  logout: () => void;
  
  // Users
  users: User[];
  updateUser: (userId: string, data: Partial<User>) => void;
  
  // Listings
  listings: DonationListing[];
  createListing: (listing: Omit<DonationListing, 'id' | 'createdAt' | 'status'>) => void;
  updateListingStatus: (listingId: string, status: DonationStatus) => void;
  getListingById: (id: string) => DonationListing | undefined;
  
  // Requests
  requests: DonationRequest[];
  createRequest: (request: Omit<DonationRequest, 'id' | 'createdAt' | 'status'>) => void;
  updateRequestStatus: (requestId: string, status: 'accepted' | 'rejected') => void;
  getRequestsByListing: (listingId: string) => DonationRequest[];
  getRequestsByNgo: (ngoId: string) => DonationRequest[];
  
  // Notifications
  notifications: Notification[];
  markNotificationRead: (notificationId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  unreadCount: number;
  
  // Chat
  messages: ChatMessage[];
  sendMessage: (listingId: string, message: string) => void;
  getMessagesByListing: (listingId: string) => ChatMessage[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [listings, setListings] = useState<DonationListing[]>(mockListings);
  const [requests, setRequests] = useState<DonationRequest[]>(mockRequests);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('shareplate_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const user = users.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('shareplate_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const register = async (userData: Partial<User>, password: string): Promise<boolean> => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: userData.name || '',
      email: userData.email || '',
      role: userData.role || 'donor',
      orgName: userData.orgName || '',
      contact: userData.contact || '',
      address: userData.address || '',
      verificationStatus: 'pending',
      createdAt: new Date(),
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    localStorage.setItem('shareplate_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('shareplate_user');
  };

  const updateUser = (userId: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
  };

  const createListing = (listing: Omit<DonationListing, 'id' | 'createdAt' | 'status'>) => {
    const newListing: DonationListing = {
      ...listing,
      id: `listing_${Date.now()}`,
      status: 'posted',
      createdAt: new Date(),
    };
    setListings(prev => [newListing, ...prev]);
  };

  const updateListingStatus = (listingId: string, status: DonationStatus) => {
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, status } : l));
  };

  const getListingById = (id: string) => listings.find(l => l.id === id);

  const createRequest = (request: Omit<DonationRequest, 'id' | 'createdAt' | 'status'>) => {
    const newRequest: DonationRequest = {
      ...request,
      id: `request_${Date.now()}`,
      status: 'pending',
      createdAt: new Date(),
    };
    setRequests(prev => [newRequest, ...prev]);
    
    // Update listing status
    updateListingStatus(request.listingId, 'requested');
    
    // Find listing and donor
    const listing = listings.find(l => l.id === request.listingId);
    if (listing) {
      addNotification({
        userId: listing.donorId,
        type: 'request_received',
        title: 'New Donation Request',
        message: `${request.ngoOrg} has requested your donation.`,
        listingId: request.listingId,
      });
    }
  };

  const updateRequestStatus = (requestId: string, status: 'accepted' | 'rejected') => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        const updated = { ...r, status };
        
        // If accepted, update listing status
        if (status === 'accepted') {
          updateListingStatus(r.listingId, 'confirmed');
          addNotification({
            userId: r.ngoId,
            type: 'request_accepted',
            title: 'Request Accepted!',
            message: 'Your donation request has been accepted. Contact details are now available.',
            listingId: r.listingId,
          });
        }
        
        return updated;
      }
      return r;
    }));
  };

  const getRequestsByListing = (listingId: string) => requests.filter(r => r.listingId === listingId);
  const getRequestsByNgo = (ngoId: string) => requests.filter(r => r.ngoId === ngoId);

  const markNotificationRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}`,
      read: false,
      createdAt: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const unreadCount = notifications.filter(n => !n.read && n.userId === currentUser?.id).length;

  const sendMessage = (listingId: string, message: string) => {
    if (!currentUser) return;
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      listingId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      message,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const getMessagesByListing = (listingId: string) => 
    messages.filter(m => m.listingId === listingId).sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  return (
    <AppContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      login,
      register,
      logout,
      users,
      updateUser,
      listings,
      createListing,
      updateListingStatus,
      getListingById,
      requests,
      createRequest,
      updateRequestStatus,
      getRequestsByListing,
      getRequestsByNgo,
      notifications,
      markNotificationRead,
      addNotification,
      unreadCount,
      messages,
      sendMessage,
      getMessagesByListing,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
