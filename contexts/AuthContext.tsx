import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserPermissions, Message } from '@/types';
import { getDefaultPermissions } from '@/constants/permissions';

const AUTH_STORAGE_KEY = '@ideal_cuisine_auth';
const USERS_STORAGE_KEY = '@ideal_cuisine_users';
const MESSAGES_STORAGE_KEY = '@ideal_cuisine_messages';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const [storedUsers, storedMessages] = await Promise.all([
        AsyncStorage.getItem(USERS_STORAGE_KEY),
        AsyncStorage.getItem(MESSAGES_STORAGE_KEY),
      ]);

      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      }

      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }

      console.log('Auth context initialized - ready for Supabase connection');
    } catch (error) {
      console.log('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    
    console.log('Login attempt - Supabase integration required');
    console.log('Email:', email);
    
    setAuthError('Authentication not configured. Please connect to Supabase.');
    return false;
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setIsAuthenticated(false);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    console.log('User logged out');
  }, []);

  const setAuthenticatedUser = useCallback(async (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    console.log('User authenticated:', userData.name);
  }, []);

  const hasPermission = useCallback((permission: keyof UserPermissions): boolean => {
    if (!user) return false;
    return user.permissions[permission] === true;
  }, [user]);

  const updateUserPermissions = useCallback(async (userId: string, permissions: Partial<UserPermissions>) => {
    if (!user || user.role !== 'developer') {
      console.log('Only developers can update permissions');
      return false;
    }

    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          permissions: { ...u.permissions, ...permissions },
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

    if (userId === user.id) {
      const updatedUser = updatedUsers.find(u => u.id === userId);
      if (updatedUser) {
        setUser(updatedUser);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      }
    }

    console.log('Permissions updated for user:', userId);
    return true;
  }, [user, users]);

  const createUser = useCallback(async (userData: Omit<User, 'id' | 'permissions' | 'createdAt' | 'isActive'>) => {
    if (!user || user.role !== 'developer') {
      console.log('Only developers can create users');
      return null;
    }

    const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existingUser) {
      console.log('User with this email already exists');
      return null;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      ...userData,
      permissions: getDefaultPermissions(userData.role),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    
    console.log('User created:', newUser.name);
    return newUser;
  }, [user, users]);

  const updateUser = useCallback(async (userId: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>) => {
    if (!user || user.role !== 'developer') {
      console.log('Only developers can update users');
      return false;
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return false;
    if (targetUser.role === 'developer' && userId !== user.id) return false;

    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, ...updates };
      }
      return u;
    });

    setUsers(updatedUsers);
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    
    if (userId === user.id) {
      const updatedUser = updatedUsers.find(u => u.id === userId);
      if (updatedUser) {
        setUser(updatedUser);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      }
    }

    console.log('User updated:', userId);
    return true;
  }, [user, users]);

  const toggleUserActive = useCallback(async (userId: string) => {
    if (!user || user.role !== 'developer') return false;
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser || targetUser.role === 'developer') return false;

    return updateUser(userId, { isActive: !targetUser.isActive });
  }, [user, users, updateUser]);

  const deleteUser = useCallback(async (userId: string) => {
    if (!user || user.role !== 'developer') {
      console.log('Only developers can delete users');
      return false;
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return false;
    if (targetUser.role === 'developer') {
      console.log('Cannot delete developer account');
      return false;
    }

    if (userId === user.id) {
      console.log('Cannot delete yourself');
      return false;
    }

    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    
    console.log('User deleted:', userId);
    return true;
  }, [user, users]);

  const getEmployees = useMemo(() => {
    return users.filter(u => u.role === 'employee');
  }, [users]);

  const getAllUsers = useMemo(() => {
    return users;
  }, [users]);

  const getNonDevUsers = useMemo(() => {
    return users.filter(u => u.role !== 'developer');
  }, [users]);

  const sendMessage = useCallback(async (receiverId: string, content: string, attachments: any[] = []) => {
    if (!user || !user.permissions.sendMessages) return null;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      receiverId,
      content,
      attachments,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updatedMessages));
    
    console.log('Message sent to:', receiverId);
    return newMessage;
  }, [user, messages]);

  const getMessagesForUser = useCallback((otherUserId: string) => {
    if (!user) return [];
    return messages.filter(
      m => (m.senderId === user.id && m.receiverId === otherUserId) ||
           (m.senderId === otherUserId && m.receiverId === user.id)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [user, messages]);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    const updatedMessages = messages.map(m =>
      m.id === messageId ? { ...m, read: true } : m
    );
    setMessages(updatedMessages);
    await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updatedMessages));
  }, [messages]);

  const getUnreadMessagesCount = useCallback((fromUserId?: string) => {
    if (!user) return 0;
    return messages.filter(m => 
      m.receiverId === user.id && 
      !m.read && 
      (fromUserId ? m.senderId === fromUserId : true)
    ).length;
  }, [user, messages]);

  const getConversations = useMemo(() => {
    if (!user) return [];
    const conversationMap = new Map<string, Message>();
    
    messages.forEach(msg => {
      const otherUserId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
      if (msg.senderId === user.id || msg.receiverId === user.id) {
        const existing = conversationMap.get(otherUserId);
        if (!existing || new Date(msg.createdAt) > new Date(existing.createdAt)) {
          conversationMap.set(otherUserId, msg);
        }
      }
    });

    return Array.from(conversationMap.entries()).map(([oderId, lastMsg]) => ({
      oderId,
      lastMessage: lastMsg,
      user: users.find(u => u.id === oderId),
    })).sort((a, b) => 
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  }, [user, messages, users]);

  const getUserById = useCallback((userId: string) => {
    return users.find(u => u.id === userId);
  }, [users]);

  const loginAsUser = useCallback(async (userId: string) => {
    if (!user || user.role !== 'developer') return false;
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return false;

    setUser(targetUser);
    setIsAuthenticated(true);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(targetUser));
    console.log('Logged in as:', targetUser.name);
    return true;
  }, [user, users]);

  const syncUsersFromDatabase = useCallback(async (dbUsers: User[]) => {
    setUsers(dbUsers);
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(dbUsers));
    console.log('Users synced from database:', dbUsers.length);
  }, []);

  const syncMessagesFromDatabase = useCallback(async (dbMessages: Message[]) => {
    setMessages(dbMessages);
    await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(dbMessages));
    console.log('Messages synced from database:', dbMessages.length);
  }, []);

  return {
    user,
    users: getAllUsers,
    nonDevUsers: getNonDevUsers,
    employees: getEmployees,
    messages,
    conversations: getConversations,
    isLoading,
    isAuthenticated,
    authError,
    login,
    logout,
    loginAsUser,
    setAuthenticatedUser,
    hasPermission,
    updateUserPermissions,
    createUser,
    updateUser,
    toggleUserActive,
    deleteUser,
    getUserById,
    sendMessage,
    getMessagesForUser,
    markMessageAsRead,
    getUnreadMessagesCount,
    syncUsersFromDatabase,
    syncMessagesFromDatabase,
  };
});
