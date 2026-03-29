import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '../supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';

export function useConfinedSpace(currentUser: any) {
  const [activeConfinedPermits, setActiveConfinedPermits] = useState<any[]>([]);
  const [selectedConfinedPermit, setSelectedConfinedPermit] = useState<string | null>(null);
  const [confinedEntries, setConfinedEntries] = useState<any[]>([]);

  const fetchEntries = useCallback(async (permitId: string) => {
    try {
      const res = await axios.get(`${API_URL}/confined-space/${permitId}/entries`);
      setConfinedEntries(res.data);
    } catch (error) {}
  }, []);

  const fetchConfinedSpaceData = useCallback(async () => { 
    try { 
      const res = await axios.get(`${API_URL}/confined-space/active-permits`); 
      setActiveConfinedPermits(res.data); 
      if (res.data.length > 0 && !selectedConfinedPermit) { 
        setSelectedConfinedPermit(res.data[0].id); 
        fetchEntries(res.data[0].id); 
      } 
    } catch (error) {} 
  }, [selectedConfinedPermit, fetchEntries]);

  const handleCheckIn = async (workerName: string, role: string = 'ENTRANT') => { // 🟢 เพิ่มรับค่า role
    if (!selectedConfinedPermit) return;
    try {
      await axios.post(`${API_URL}/confined-space/in`, {
        permit_id: selectedConfinedPermit,
        worker_name: workerName,
        time_in: new Date().toISOString(),
        status: 'INSIDE',
        role: role // 🟢 ส่ง role ไปด้วย!
      });
      message.success(`บันทึก ${workerName} เข้าสู่พื้นที่แล้ว`);
      fetchEntries(selectedConfinedPermit);
    } catch (error) {
      message.error('เช็คอินไม่สำเร็จ');
    }
  };
  
  const handleCheckOut = async (entryId: string) => { 
    try { 
      await axios.put(`${API_URL}/confined-space/out/${entryId}`); 
      fetchEntries(selectedConfinedPermit!); 
      await supabase.channel('safety-alert-channel').send({ type: 'broadcast', event: 'CONFINED_SPACE_UPDATE', payload: { permit_id: selectedConfinedPermit } }); 
    } catch (error) {} 
  };
  
  const handleEvacuateAll = async () => { 
    try { 
      await axios.post(`${API_URL}/confined-space/evacuate`, { permit_id: selectedConfinedPermit, triggered_by: currentUser?.full_name }); 
      fetchEntries(selectedConfinedPermit!); 
      await supabase.channel('safety-alert-channel').send({ type: 'broadcast', event: 'EMERGENCY_EVACUATE', payload: { message: `สั่งอพยพโดย: ${currentUser?.full_name}` } }); 
    } catch (error) {} 
  };

  return { 
    activeConfinedPermits, selectedConfinedPermit, confinedEntries, 
    setSelectedConfinedPermit, fetchConfinedSpaceData, fetchEntries, 
    handleCheckIn, handleCheckOut, handleEvacuateAll 
  };
}