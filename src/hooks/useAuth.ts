import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';
import liff from '@line/liff';

const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';
const LIFF_ID = import.meta.env.VITE_LINE_LIFF_ID || '2009277207-jNY8QghJ'; 

export function useAuth() {
  // 🟢 ให้สิทธิ์ isAuthenticated เป็น true ไปก่อนเลย ถ้ามี token ในกระเป๋า (แก้ปัญหารีเฟรชแล้วจอกระพริบ)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  
  // 🟢 isAuthChecking เอาไว้โชว์หน้าโหลด (Loading Screen) ระหว่างรอข้อมูลจาก Backend
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [lineProfile, setLineProfile] = useState<any>(null);
  
  // 🟢 พยายามดึงข้อมูล User จาก LocalStorage มาโชว์พลางๆ ก่อนได้ (ถ้าเคยเก็บไว้)
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('currentUser'); // 🟢 ล้างข้อมูล User ด้วย
    setIsAuthenticated(false);
    setCurrentUser(null);
    window.location.href = '/'; // 🟢 บังคับเด้งกลับหน้าแรกทันที
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token'); 
      
      if (!token || token === 'undefined' || !token.includes('.')) {
         throw new Error('Invalid or missing token');
      }

      // ถอดรหัส Token เพื่อเอา ID
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenData.id;

      // ยิงไปดึงข้อมูล User จาก Backend
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const users = response.data;
      const me = users.find((u: any) => u.id === userId);
      
      if (me) {
        setCurrentUser(me);
        setIsAuthenticated(true);
        // 🟢 อัปเดตข้อมูล User ในกระเป๋าให้เป็นปัจจุบันเสมอ
        localStorage.setItem('currentUser', JSON.stringify(me)); 
      } else {
        throw new Error('User not found in DB');
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      handleLogout(); // ถ้า Token พัง หรือหา User ไม่เจอ ค่อยเตะออก
    } finally {
      setIsAuthChecking(false); // เลิกหมุน Loading
    }
  }, [handleLogout]);

  useEffect(() => {
    const initAuth = async () => {
      // 1. ลอง init LINE LIFF ดูก่อน (ถ้าไม่ได้เปิดใน LINE ก็จะผ่านไปเงียบๆ)
      try {
        await liff.init({ liffId: LIFF_ID });
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setLineProfile(profile);
        }
      } catch (err) {
        console.error('LIFF init failed', err);
      }

      // 2. เช็ค Token ทันทีที่เปิดเว็บ หรือ รีเฟรช
      const token = localStorage.getItem('token'); 
      if (token && token !== 'undefined') {
        // ถ้ามี Token ให้ดึงข้อมูล User ใหม่เงียบๆ เป็น Background
        await fetchUserData();
      } else {
        // ถ้าไม่มี Token ให้ปิด Loading แล้วปล่อยให้อยู่หน้า Login
        setIsAuthChecking(false);
        setIsAuthenticated(false);
      }
    };

    initAuth();
  }, [fetchUserData]);

  const handleLogin = async (values: any) => {
    setIsLoggingIn(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token); 
        localStorage.setItem('currentUser', JSON.stringify(data.user)); // 🟢 เซฟ User ไว้ด้วยเผื่อตอนรีเฟรช
        
        setCurrentUser(data.user);
        setIsAuthenticated(true); 
        message.success('เข้าสู่ระบบสำเร็จ');
      } else {
        message.error(data.error);
      }
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
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
      
      localStorage.setItem('token', token); 
      localStorage.setItem('currentUser', JSON.stringify(user)); // 🟢 เซฟ User ไว้ด้วย
      
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