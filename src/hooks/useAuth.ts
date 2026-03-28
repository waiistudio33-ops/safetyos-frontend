import { useState, useEffect } from 'react';
import axios from 'axios';
import liff from '@line/liff';
import { message, Modal } from 'antd';

const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [lineProfile, setLineProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        let profile = null;
        await liff.init({ liffId: '2009277207-jNY8QghJ' }); 

        if (liff.isLoggedIn()) {
          profile = await liff.getProfile();
          setLineProfile(profile);
        }
        
        // 🟢 โหลดทั้ง User และ Token กลับมาจาก Local Storage
        const savedUserStr = localStorage.getItem('safetyos_user');
        const savedToken = localStorage.getItem('safetyos_token');

        if (profile) {
          try {
            const res = await axios.post(`${API_URL}/login/line`, {
              line_id: profile.userId, picture_url: profile.pictureUrl, display_name: profile.displayName
            });
            localStorage.setItem('safetyos_user', JSON.stringify(res.data.user));
            localStorage.setItem('safetyos_token', res.data.token); // 🟢 เซฟ Token ตอน Auto-login
            setCurrentUser(res.data.user);
            setIsAuthenticated(true);
          } catch (e) {
            // ถ้าเน็ตหลุด แต่มีข้อมูลเก่าและบัตรเก่า ก็ให้เข้าได้
            if (savedUserStr && savedToken) { 
              try { 
                setCurrentUser(JSON.parse(savedUserStr)); 
                setIsAuthenticated(true); 
              } catch (err) {} 
            }
          }
        } else if (savedUserStr && savedToken) { // 🟢 ต้องมีทั้ง User และ Token
          try { 
            setCurrentUser(JSON.parse(savedUserStr)); 
            setIsAuthenticated(true); 
          } catch (e) { 
            localStorage.removeItem('safetyos_user'); 
            localStorage.removeItem('safetyos_token');
          }
        }
      } catch (err) {
        console.log("LIFF Init Failed", err);
      } finally { setIsAuthChecking(false); }
    };
    initializeApp();
  }, []);

  const handleLogin = async (values: any) => {
    setIsLoggingIn(true);
    try {
      const payload = { ...values, line_id: lineProfile?.userId || null, picture_url: lineProfile?.pictureUrl || null };
      const response = await axios.post(`${API_URL}/login`, payload);
      localStorage.setItem('safetyos_user', JSON.stringify(response.data.user));
      localStorage.setItem('safetyos_token', response.data.token); // 🟢 เซฟ Token 
      setCurrentUser(response.data.user);
      setIsAuthenticated(true);
      message.success(`ยินดีต้อนรับคุณ ${response.data.user.full_name}`);
    } catch (error: any) { 
      message.error(error.response?.data?.error || 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง'); 
    } finally { setIsLoggingIn(false); }
  };

  const handleLineLoginSubmit = async () => {
    if (liff.isInClient() && lineProfile) {
      setIsLoggingIn(true);
      try {
        const res = await axios.post(`${API_URL}/login/line`, { line_id: lineProfile.userId, picture_url: lineProfile.pictureUrl, display_name: lineProfile.displayName });
        localStorage.setItem('safetyos_user', JSON.stringify(res.data.user));
        localStorage.setItem('safetyos_token', res.data.token); // 🟢 เซฟ Token สำหรับ LINE
        setCurrentUser(res.data.user);
        setIsAuthenticated(true);
        message.success(res.data.isNew ? `ลงทะเบียนระบบเรียบร้อยแล้ว` : `เข้าสู่ระบบสำเร็จ`);
      } catch (error: any) { message.error('การเข้าสู่ระบบล้มเหลว'); } finally { setIsLoggingIn(false); }
    } else { liff.login(); }
  };

  const handleSSOLogin = () => { 
    Modal.info({ title: 'Microsoft Entra ID (SSO)', content: 'ระบบกำลังนำท่านไปยังหน้าต่างเข้าสู่ระบบขององค์กร', okText: 'ดำเนินการต่อ', centered: true }); 
  };

  const handleLogout = () => { 
    localStorage.removeItem('safetyos_user');
    localStorage.removeItem('safetyos_token'); 
    setIsAuthenticated(false); 
    setCurrentUser(null); 
    if (liff.isLoggedIn()) liff.logout(); 
    message.info('ออกจากระบบเรียบร้อย'); 
  };

  return { isAuthenticated, isAuthChecking, isLoggingIn, lineProfile, currentUser, handleLogin, handleLineLoginSubmit, handleSSOLogin, handleLogout };
}