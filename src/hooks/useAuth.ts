import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';
import liff from '@line/liff';

const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';
const LIFF_ID = import.meta.env.VITE_LINE_LIFF_ID || '2009277207-jNY8QghJ'; 

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [lineProfile, setLineProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token'); // 🟢 เปลี่ยนมาใช้ชื่อ 'token'
    localStorage.removeItem('safetyos_token'); // 🟢 ลบของเก่าทิ้งเผื่อมันค้าง
    setIsAuthenticated(false);
    setCurrentUser(null);
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token'); // 🟢 ดึงด้วยชื่อ 'token'
      
      // 🟢 เช็คแบบ Safe ป้องกัน atob error
      if (!token || token === 'undefined' || !token.includes('.')) {
         throw new Error('Invalid or missing token');
      }

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
      handleLogout(); // ถ้า Token พัง ให้เตะออกไปล็อกอินใหม่เลย
    } finally {
      setIsAuthChecking(false);
    }
  }, [handleLogout]);

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

      const token = localStorage.getItem('token'); // 🟢 เช็คด้วยชื่อ 'token'
      if (token && token !== 'undefined') {
        await fetchUserData();
      } else {
        setIsAuthChecking(false);
      }
    };

    initAuth();
  }, [fetchUserData]);

  const handleLogin = async (values: any) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token); // 🟢 เก็บด้วยชื่อ 'token'
        setCurrentUser(data.user);
        setIsAuthenticated(true); // 🟢 เพิ่มบรรทัดนี้ เพื่อให้ระบบรู้ว่าล็อกอินแล้ว
        message.success('เข้าสู่ระบบสำเร็จ');
      } else {
        message.error(data.error);
      }
    } catch (error) {
      message.error('เกิดข้อผิดพลาด');
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
      localStorage.setItem('token', token); // 🟢 เก็บด้วยชื่อ 'token' (เหมือนกันแล้ว!)
      
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