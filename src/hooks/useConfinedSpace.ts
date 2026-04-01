import { useState, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd'; // 🟢 เพิ่มบรรทัดนี้เข้ามาครับ!

const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';

export function useConfinedSpace(currentUser: any) {
  const [activeConfinedPermits, setActiveConfinedPermits] = useState<any[]>([]);
  const [selectedConfinedPermit, setSelectedConfinedPermit] = useState<string | null>(null);
  const [confinedEntries, setConfinedEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConfinedSpaceData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/confined-space/active-permits`);
      setActiveConfinedPermits(res.data || []);
      // ถ้ามีงานอับอากาศที่กำลังทำอยู่ ให้เลือกงานแรกอัตโนมัติ
      if (res.data && res.data.length > 0 && !selectedConfinedPermit) {
        setSelectedConfinedPermit(res.data[0].id);
        fetchEntries(res.data[0].id);
      }
    } catch (error) {
      console.error('Fetch Confined Space Error:', error);
    }
  }, [selectedConfinedPermit]);

  const fetchEntries = useCallback(async (permitId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/confined-space/${permitId}/entries`);
      setConfinedEntries(res.data || []);
    } catch (error) {
      console.error('Fetch Entries Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCheckIn = async (workerName: string, role: string = 'ENTRANT') => {
    if (!selectedConfinedPermit) return;
    try {
      await axios.post(`${API_URL}/confined-space/in`, {
        permit_id: selectedConfinedPermit,
        worker_name: workerName,
        time_in: new Date().toISOString(),
        status: 'INSIDE',
        role: role
      });
      message.success(`บันทึก ${workerName} เข้าสู่พื้นที่แล้ว`);
      fetchEntries(selectedConfinedPermit);
    } catch (error) {
      message.error('เช็คอินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleCheckOut = async (entryId: string) => {
    if (!selectedConfinedPermit) return;
    try {
      await axios.put(`${API_URL}/confined-space/out/${entryId}`);
      message.success('บันทึกการออกจากพื้นที่สำเร็จ');
      fetchEntries(selectedConfinedPermit);
    } catch (error) {
      message.error('เช็คเอาท์ไม่สำเร็จ');
    }
  };

  const handleEvacuateAll = async () => {
    if (!selectedConfinedPermit) return;
    try {
      await axios.post(`${API_URL}/confined-space/evacuate`, {
        permit_id: selectedConfinedPermit
      });
      message.warning('สั่งอพยพผู้ปฏิบัติงานทั้งหมดแล้ว!');
      fetchEntries(selectedConfinedPermit);
    } catch (error) {
      message.error('สั่งอพยพไม่สำเร็จ');
    }
  };

  return {
    activeConfinedPermits,
    selectedConfinedPermit,
    confinedEntries,
    loading,
    setSelectedConfinedPermit: (id: string) => {
      setSelectedConfinedPermit(id);
      fetchEntries(id);
    },
    fetchConfinedSpaceData,
    fetchEntries,
    handleCheckIn,
    handleCheckOut,
    handleEvacuateAll
  };
}