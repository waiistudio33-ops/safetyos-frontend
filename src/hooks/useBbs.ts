import { useState, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { supabase } from '../supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';

export function useBbs(currentUser: any) {
  const [bbsRecords, setBbsRecords] = useState<any[]>([]);
  const [isSubmittingBbs, setIsSubmittingBbs] = useState(false);

  // 🟢 1. แก้ไข: แนบ Token ตอนดึงข้อมูล (GET)
  const fetchBbs = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      // แนบ headers Authorization เข้าไป
      const res = await axios.get(`${API_URL}/bbs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBbsRecords(res.data);
    } catch (error) {
      console.error("ดึงข้อมูล BBS พลาด:", error);
      // Optional: ถ้า 401 อาจจะแจ้งเตือนว่า session หมดอายุ
    }
  }, []);

  // 🟢 2. แก้ไข: แนบ Token ตอนส่งข้อมูล (POST)
  const handleCreateBbs = async (values: any, onSuccess: () => void) => {
    setIsSubmittingBbs(true);
    try {
      let fileUrl = null;
      if (values.photos && values.photos.length > 0) {
        // จัดการเรื่องรูปภาพ (Supabase) เหมือนเดิม
        const file = values.photos[0]?.originFileObj;
        if(file) {
          const uniqueName = `bbs-${Date.now()}-${file.name.split('.').pop()}`;
          const { error } = await supabase.storage.from('permits').upload(uniqueName, file);
          if (!error) { 
            const { data } = supabase.storage.from('permits').getPublicUrl(uniqueName); 
            fileUrl = data.publicUrl; 
          }
        }
      }
      
      const formattedValues = { 
        ...values, 
        date: values.date ? values.date.toISOString() : new Date().toISOString(), 
        observer_id: currentUser?.id, 
        image_url: fileUrl 
      };
      
      const token = localStorage.getItem('token');
      
      // 🟢 แนบ headers Authorization ตอน POST ด้วย
      await axios.post(`${API_URL}/bbs`, formattedValues, {
        headers: { Authorization: `Bearer ${token}` }
      });

      message.success('บันทึกข้อมูล BBS สำเร็จ!'); 
      fetchBbs(); // ดึงข้อมูลใหม่
      onSuccess(); // สั่งให้เปลี่ยนหน้าจอหลังบันทึกเสร็จ
    } catch (error: any) { 
      message.error(`บันทึกไม่สำเร็จ: ${error.response?.data?.error || error.message}`); 
    } finally { 
      setIsSubmittingBbs(false); 
    }
  };

  return { bbsRecords, isSubmittingBbs, fetchBbs, handleCreateBbs };
}