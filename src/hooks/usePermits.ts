import { useState, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { supabase } from '../supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';

export function usePermits(currentUser: any) {
  const [permits, setPermits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchPermits = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/permits`, { params: { page, limit } });
      if (response.data && Array.isArray(response.data)) {
        setPermits(response.data); setTotal(response.data.length);
      } else if (response.data && response.data.data) {
        setPermits(response.data.data || []); setTotal(response.data.meta?.total || 0);
        setCurrentPage(response.data.meta?.page || 1); setPageSize(response.data.meta?.limit || 10);
      } else {
        setPermits([]); setTotal(0);
      }
    } catch (error) {
      console.error("ดึงข้อมูล Permits ไม่สำเร็จ:", error);
      setPermits([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPermit = async (values: any, uploadedFiles: any[]) => {
    if (!currentUser) return false;
    setIsSubmitting(true);
    try {
      let fileUrl = null, fileNameToSave = null;
      if (uploadedFiles.length > 0) {
        const file = uploadedFiles[0]?.originFileObj;
        if (file) {
          const uniqueName = `${Date.now()}.${file.name.split('.').pop()}`;
          const { error } = await supabase.storage.from('permits').upload(uniqueName, file);
          if (error) throw error;
          const { data } = supabase.storage.from('permits').getPublicUrl(uniqueName);
          fileUrl = data.publicUrl; fileNameToSave = file.name;
        }
      }

      let startTime = values.start_time || new Date().toISOString();
      let endTime = values.end_time || new Date(Date.now() + 2 * 3600000).toISOString();

      const payload = {
        title: values.title, description: values.description, permit_type: values.permit_type, location_detail: values.location_detail, start_time: startTime, end_time: endTime, applicant_id: currentUser.id, attachment_url: fileUrl, attachment_name: fileNameToSave, applicant_phone: values.applicant_phone || null, contractor_company: values.contractor_company || null, contractor_supervisor: values.contractor_supervisor || null, project_manager: values.project_manager || null, workers: values.workers || [], work_sub_type: values.work_sub_type || null, safety_measures: values.safety_measures || null, ppe_required: values.ppe_required || null, supervisor_name: values.supervisor_name || null, gas_tester_name: values.gas_tester_name || null, standby_person_name: values.standby_person_name || null, rescuer_name: values.rescuer_name || null, communication_method: values.communication_method || null, height_level: values.height_level || null, rescue_plan_url: values.rescue_plan_url || null, is_med_cert_verified: values.is_med_cert_verified || false, is_loto_required: values.is_loto_required || false, loto_isolation_point: values.loto_isolation_point || null, loto_energy_type: values.loto_energy_type || null, loto_lock_number: values.loto_lock_number || null,
      };

      await axios.post(`${API_URL}/permits`, payload);
      message.success('ส่งคำขอสร้าง Permit สำเร็จ');
      fetchPermits(1, pageSize);
      return true;
    } catch (error: any) {
      message.error('ระบบขัดข้อง ไม่สามารถส่งคำขอได้');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePermitStatus = async (permitId: string, currentStatus: string, action: 'APPROVE' | 'REJECT' | 'CLOSE' | 'REVOKE') => {
    try {
      let nextStatus = action === 'REJECT' ? 'REJECTED' : action === 'CLOSE' ? 'CLOSED' : action === 'REVOKE' ? 'REVOKED' : (currentStatus === 'PENDING_AREA_OWNER' ? 'PENDING_SAFETY' : 'APPROVED');
      await axios.put(`${API_URL}/permits/${permitId}`, { status: nextStatus, action: action, approver_id: currentUser.id });
      message.success(`ดำเนินการ ${action} สำเร็จ`);
      fetchPermits(currentPage, pageSize);
    } catch (error: any) {
      message.error(error.response?.data?.error || 'ระบบขัดข้อง ไม่สามารถอัปเดตสถานะได้');
      throw error;
    }
  };

  // 🟢 ฟังก์ชันใหม่: อัปโหลดรูป Toolbox Talk
  const uploadToolboxPhoto = async (permitId: string, file: any) => {
    setIsSubmitting(true);
    try {
      const uniqueName = `toolbox_${Date.now()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('permits').upload(uniqueName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('permits').getPublicUrl(uniqueName);

      await axios.post(`${API_URL}/permits/${permitId}/toolbox-talk`, { image_url: data.publicUrl });
      message.success('บันทึกภาพ Toolbox Talk และหลักฐานการเตรียมความพร้อมสำเร็จ!');
      fetchPermits(currentPage, pageSize);
      return true;
    } catch (err) {
      message.error('ไม่สามารถอัปโหลดภาพได้');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { permits: permits || [], loading, isSubmitting, total, currentPage, pageSize, fetchPermits, createPermit, updatePermitStatus, uploadToolboxPhoto };
}