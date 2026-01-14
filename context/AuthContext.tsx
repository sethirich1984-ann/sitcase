import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthState, Merchant } from '../types';
import * as authService from '../services/mockAuthService';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 安全初始化：在获取到最新商户信息前，不解除 Loading 状态，防止 UI 渲染由于数据缺失崩溃
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = authService.getSessionUser();
        
        if (storedUser) {
          setUser(storedUser);
          
          // 如果用户有商户ID，必须尝试获取最新的商户信息
          if (storedUser.currentMerchantId) {
            try {
              // 这里复用 loginAPI 来刷新数据（实际项目中会有专门的 getProfile 接口）
              const { user: freshUser, merchant: freshMerchant } = await authService.loginAPI(storedUser.phone, '0000');
              setUser(freshUser);
              setMerchant(freshMerchant);
            } catch (err) {
              console.error("Session invalid, clearing...", err);
              // 如果 Session 校验失败（如商户不存在），强制登出以防崩溃
              localStorage.removeItem('auth_token');
              setUser(null);
            }
          }
        }
      } catch (e) {
        console.error("Auth Init Failed", e);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const checkUserStatus = async () => {
    const storedUser = authService.getSessionUser();
    setUser(storedUser);
  };

  const login = async (phone: string, code: string) => {
    setIsLoading(true);
    try {
      const { user, merchant } = await authService.loginAPI(phone, code);
      setUser(user);
      setMerchant(merchant);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPassword = async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      const { user, merchant } = await authService.loginWithPasswordAPI(phone, password);
      setUser(user);
      setMerchant(merchant);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (phone: string, code: string) => {
    setIsLoading(true);
    try {
      const { user } = await authService.registerAPI(phone, code);
      setUser(user);
      setMerchant(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setMerchant(null);
    // 可选：跳转回登录页逻辑通常由路由层处理
  };

  const createMerchant = async (data: Partial<Merchant>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { user: updatedUser, merchant: newMerchant } = await authService.createMerchantAPI(user.id, data);
      setUser(updatedUser);
      setMerchant(newMerchant);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMerchantProfile = async (data: Partial<Merchant>) => {
    if (!merchant) return;
    setIsLoading(true);
    try {
      const updated = await authService.updateMerchantAPI(merchant.id, data);
      setMerchant(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserPassword = async (password: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await authService.updatePasswordAPI(user.id, password);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMerchant = async (merchantId: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { user: updatedUser, merchant: newMerchant } = await authService.switchMerchantAPI(user.id, merchantId);
      setUser(updatedUser);
      setMerchant(newMerchant);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserMerchants = async () => {
    if (!user) return [];
    return await authService.getUserMerchantsAPI(user.id);
  };

  const acceptInvite = async (token: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const invite = await authService.checkInviteTokenAPI(token);
      const updatedUser = await authService.joinMerchantAPI(user.id, invite.merchantId);
      setUser(updatedUser);
      // 刷新上下文
      const { merchant } = await authService.loginAPI(updatedUser.phone, '');
      setMerchant(merchant);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      merchant,
      isAuthenticated: !!user,
      isLoading,
      checkUserStatus,
      login,
      loginWithPassword,
      register,
      logout,
      createMerchant,
      updateMerchantProfile,
      updateUserPassword,
      switchMerchant,
      getUserMerchants,
      acceptInvite
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};