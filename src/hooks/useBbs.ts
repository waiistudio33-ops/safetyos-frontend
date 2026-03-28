import { useState, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { supabase } from '../supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';

export function useBbs(currentUser: any) {
  const [bbsRecords, setBbsRecords] = useState<any[]>([]);
  const [isSubmittingBbs, setIsSubmittingBbs] = useState(false);

  const fetchBbs = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/bbs`);
      setBbsRecords(res.data);
    } catch (error) {
      console.error("ดึงข้อมูล BBS พลาด:", error);
    }
  }, []);

  const handleCreateBbs = async (values: any, onSuccess: () => void) => {
    setIsSubmittingBbs(true);
    try {
      let fileUrl = null;
      if (values.photos && values.photos.length > 0) {
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
      
      await axios.post(`${API_URL}/bbs`, formattedValues);
      message.success('บันทึกข้อมูล BBS สำเร็จ!'); 
      fetchBbs();
      onSuccess(); // สั่งให้เปลี่ยนหน้าจอหลังบันทึกเสร็จ
    } catch (error: any) { 
      message.error(`บันทึกไม่สำเร็จ`); 
    } finally { 
      setIsSubmittingBbs(false); 
    }
  };

  return { bbsRecords, isSubmittingBbs, fetchBbs, handleCreateBbs };
}