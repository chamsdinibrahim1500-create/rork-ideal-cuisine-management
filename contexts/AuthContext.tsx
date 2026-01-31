import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserPermissions, Message, Notification } from '@/types';
import { mockUsers, DEVELOPER_CREDENTIALS } from '@/mocks/data';
import { getDefaultPermissions } from '@/constants/permissions';

const AUTH_STORAGE_KEY = '@ideal_cuisine_auth';
const USERS_STORAGE_KEY = '@ideal_cuisine_users';
const MESSAGES_STORAGE_KEY = '@ideal_cuisine_messages';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedAuth, storedUsers, storedMessages] = await Promise.all([
        AsyncStorage.getItem(AUTH_STORAGE_KEY),
        AsyncStorage.getItem(USERS_STORAGE_KEY),
        AsyncStorage.getItem(MESSAGES_STORAGE_KEY),
      ]);

      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        const hasDev = parsedUsers.some((u: User) => u.role === 'developer');
        if (!hasDev) {
          parsedUsers.unshift(mockUsers[0]);
        }
        setUsers(parsedUsers);
      }

      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }

      if (storedAuth) {
        const userData = JSON.parse(storedAuth);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser && foundUser.password === password && foundUser.isActive) {
      setUser(foundUser);
      setIsAuthenticated(true);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(foundUser));
      console.log('Login successful:', foundUser.name);
      return true;
    }
    
    console.log('Login failed for:', email);
    return false;
  }, [users]);

  const logout = useCallback(async () => {
    setUser(null);
    setIsAuthenticated(false);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    console.log('User logged out');
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

  const createUser = useCallback(async (userData: Omit<User, 'id' | 'permissions' | 'createdAt' | 'isActive'> & { password: string }) => {
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

  return {
    user,
    users: getAllUsers,
    nonDevUsers: getNonDevUsers,
    employees: getEmployees,
    messages,
    conversations: getConversations,
    isLoading,
    isAuthenticated,
    login,
    logout,
    loginAsUser,
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
  };
});
