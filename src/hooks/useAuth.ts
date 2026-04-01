import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';
import liff from '@line/liff';

const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';
const LIFF_ID = import.meta.env.VITE_LINE_LIFF_ID || '2009277207-jNY8QghJ'; 

export function useAuth() {
  // 🟢 1. ประกาศ useState ทั้งหมดให้เสร็จก่อน ห้ามมีเงื่อนไขมาคั่น
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [lineProfile, setLineProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 🟢 2. ประกาศ useCallback ให้เสร็จ
  const handleLogout = useCallback(() => {
    localStorage.removeItem('safetyos_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('safetyos_token');
      if (!token) throw new Error('No token');

      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenData.id;

      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const users = response.data;
      const me = users.find((u: any) => u.id === userId);
      
      if (me) {
        setCurrentUser(me);
        setIsAuthenticated(true);
      } else {
        throw new Error('User not found in DB');
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      handleLogout();
    } finally {
      setIsAuthChecking(false);
    }
  }, [handleLogout]);

  // 🟢 3. ประกาศ useEffect ให้เสร็จ
  useEffect(() => {
    const initAuth = async () => {
      try {
        await liff.init({ liffId: LIFF_ID });
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setLineProfile(profile);
        }
      } catch (err) {
        console.error('LIFF init failed', err);
      }

      const token = localStorage.getItem('safetyos_token');
      if (token) {
        await fetchUserData();
      } else {
        setIsAuthChecking(false);
      }
    };

    initAuth();
  }, [fetchUserData]);

  // 🟢 4. ประกาศฟังก์ชันทั่วไป
  const handleLogin = async (values: any) => {
    setIsLoggingIn(true);
    try {
      const response = await axios.post(`${API_URL}/login`, {
        username: values.username,
        password: values.password,
        line_id: lineProfile?.userId,
        picture_url: lineProfile?.pictureUrl
      });
      
      const { token, user } = response.data;
      localStorage.setItem('safetyos_token', token);
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      message.success(`ยินดีต้อนรับคุณ ${user.full_name}`);
      
    } catch (error: any) {
      message.error(error.response?.data?.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLineLoginSubmit = async () => {
    if (!lineProfile) {
      liff.login();
      return;
    }
    
    setIsLoggingIn(true);
    try {
      const response = await axios.post(`${API_URL}/login/line`, {
        line_id: lineProfile.userId,
        picture_url: lineProfile.pictureUrl
      });
      
      const { token, user } = response.data;
      localStorage.setItem('safetyos_token', token);
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      message.success(`ยินดีต้อนรับคุณ ${user.full_name}`);
      
    } catch (error: any) {
      message.error(error.response?.data?.error || 'บัญชี LINE นี้ยังไม่เชื่อมต่อกับระบบ');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSSOLogin = () => {
    message.info('ระบบ SCGC SSO กำลังอยู่ระหว่างการพัฒนา');
  };

  // 🟢 5. Return ค่าออกไป
  return {
    isAuthenticated,
    isAuthChecking,
    isLoggingIn,
    lineProfile,
    currentUser,
    setCurrentUser, 
    handleLogin,
    handleLineLoginSubmit,
    handleSSOLogin,
    handleLogout,
    fetchUserData 
  };
}