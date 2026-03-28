import { useState, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';
import dayjs from 'dayjs';
import { supabase } from '../supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';

export function usePermits(currentUser: any) {
  const [permits, setPermits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPermits = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/permits`);
      setPermits(response.data);
    } catch (error) {
      console.error("ดึงข้อมูล Permits ไม่สำเร็จ:", error);
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
          fileUrl = data.publicUrl;
          fileNameToSave = file.name;
        }
      }

      let startTime = values.start_time || new Date().toISOString();
      let endTime = values.end_time || new Date(Date.now() + 2 * 3600000).toISOString();

      const payload = {
        title: values.title,
        description: values.description,
        permit_type: values.permit_type,
        location_detail: values.location_detail,
        start_time: startTime,
        end_time: endTime,
        applicant_id: currentUser.id,
        attachment_url: fileUrl,
        attachment_name: fileNameToSave,
        applicant_phone: values.applicant_phone || null,
        contractor_company: values.contractor_company || null,
        contractor_supervisor: values.contractor_supervisor || null,
        project_manager: values.project_manager || null,
        workers: values.workers || [],
        work_sub_type: values.work_sub_type || null,
        safety_measures: values.safety_measures || null,
        ppe_required: values.ppe_required || null,
        supervisor_name: values.supervisor_name || null,
        gas_tester_name: values.gas_tester_name || null,
        standby_person_name: values.standby_person_name || null,
        rescuer_name: values.rescuer_name || null,
        communication_method: values.communication_method || null,
        height_level: values.height_level || null,
        rescue_plan_url: values.rescue_plan_url || null,
        is_med_cert_verified: values.is_med_cert_verified || false,
        is_loto_required: values.is_loto_required || false,
        loto_isolation_point: values.loto_isolation_point || null,
        loto_energy_type: values.loto_energy_type || null,
        loto_lock_number: values.loto_lock_number || null,
      };

      await axios.post(`${API_URL}/permits`, payload);
      message.success('ส่งคำขอสร้าง Permit สำเร็จ');
      fetchPermits();
      return true; // สำเร็จ
    } catch (error: any) {
      console.error("Submit Exception:", error);
      message.error('ระบบขัดข้อง ไม่สามารถส่งคำขอได้');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePermitStatus = async (permitId: string, currentStatus: string, action: 'APPROVE' | 'REJECT' | 'CLOSE' | 'REVOKE') => {
    try {
      let nextStatus = action === 'REJECT' ? 'REJECTED' : action === 'CLOSE' ? 'CLOSED' : action === 'REVOKE' ? 'REVOKED' : (currentStatus === 'PENDING_AREA_OWNER' ? 'PENDING_SAFETY' : 'APPROVED');
      await axios.put(`${API_URL}/permits/${permitId}`, { status: nextStatus, approver_id: currentUser.id });
      message.success(`ดำเนินการ ${action} สำเร็จ`);
      fetchPermits();
    } catch (error) {}
  };

  return { permits, loading, isSubmitting, fetchPermits, createPermit, updatePermitStatus };
}