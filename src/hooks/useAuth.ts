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
    try {
      // 1. ตรวจสอบและ Login LINE LIFF
      if (!liff.isLoggedIn()) {
        await liff.login();
        return;
      }
      
      const profile = await liff.getProfile();
      setLineProfile(profile); // เก็บข้อมูลโปรไฟล์ไว้เผื่อต้องใช้หน้าสมัคร
      
      setIsLoggingIn(true);

      // 2. ยิงไปหา Backend เพื่อเข้าสู่ระบบ
      const response = await axios.post(`${API_URL}/login/line`, {
        line_id: profile.userId,
        picture_url: profile.pictureUrl
      });

      // 3. ถ้าสำเร็จ (มีบัญชีแล้ว) ก็เข้าแอปปกติ
      if (response.data.success || response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('safetyos_token', response.data.token);
        message.success('เข้าสู่ระบบอัตโนมัติสำเร็จ');
        
        // รีเฟรชหน้าเพื่อเข้าสู่ Dashboard
        window.location.replace('/'); 
      }

    } catch (error: any) {
      // 🟢 4. จุดสำคัญที่แก้: ถ้า Backend ตอบ 401 (ยังไม่มีบัญชี) ให้โยน Error ออกไปที่ LoginScreen!
      if (error.response && error.response.status === 401) {
        setIsLoggingIn(false);
        throw error; // 👈 ตรงนี้แหละครับที่ทำให้ LoginScreen รู้ว่าต้องโชว์หน้ากรอกข้อมูล!
      } else {
        // Error อื่นๆ เช่น เน็ตหลุด
        setIsLoggingIn(false);
        message.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE');
        throw error;
      }
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