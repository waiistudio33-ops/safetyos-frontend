import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, Button, Form, Select, Upload, message, Avatar, Grid, Input, Badge 
} from 'antd'; 
import { 
  SafetyCertificateOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  UploadOutlined, FileTextOutlined, ClockCircleOutlined, UserOutlined, 
  CalendarOutlined, IdcardOutlined, CheckOutlined, CloseOutlined,
  SearchOutlined, FilterOutlined, ExclamationCircleOutlined,
  WarningOutlined, AppstoreOutlined,
  // 🟢 นำเข้า Icon ใหม่สำหรับ Dropdown
  FireOutlined, ThunderboltOutlined, MedicineBoxOutlined, 
  BuildOutlined, ControlOutlined, ApartmentOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { supabase } from '../supabase'; 

const { useBreakpoint } = Grid; 
const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';

// 🗓️ ✨ Component เลือกวันที่แบบ Native 
const ModernDatePickerRange = ({ value, onChange }: any) => {
  const onStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const start = e.target.value ? dayjs(e.target.value) : null;
    onChange([start, value?.[1]]);
  };
  const onEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const end = e.target.value ? dayjs(e.target.value) : null;
    onChange([value?.[0], end]);
  };
  const toNativeFormat = (date: any) => date ? date.format('YYYY-MM-DD') : '';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
          <CalendarOutlined className="text-blue-500"/> วันที่ออกบัตร
        </label>
        <input 
          type="date" 
          className="w-full bg-transparent outline-none text-slate-800 font-bold text-sm"
          value={toNativeFormat(value?.[0])}
          onChange={onStartChange}
        />
      </div>
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
          <ClockCircleOutlined className="text-orange-500"/> วันหมดอายุ
        </label>
        <input 
          type="date" 
          className="w-full bg-transparent outline-none text-slate-800 font-bold text-sm"
          value={toNativeFormat(value?.[1])}
          onChange={onEndChange}
        />
      </div>
    </div>
  );
};

export default function CertificateManager({ currentUser }: { currentUser: any }) {
  const screens = useBreakpoint(); 
  const isMobile = !screens.md; 

  const [certs, setCerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  
  // 🟢 State สำหรับค้นหาและกรองข้อมูล
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // 🟢 State สำหรับ Segmented Control (Tab สลับหน้า)
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'REGISTRY'>(currentUser?.role === 'CONTRACTOR' ? 'UPLOAD' : 'REGISTRY');

  const fetchCerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/certificates`);
      const data = await res.json();
      setCerts(data);
    } catch (error) {
      message.error('ไม่สามารถดึงข้อมูลใบ Certificate ได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const handleUploadCert = async (values: any) => {
    if (!currentUser || currentUser.role !== 'CONTRACTOR') {
      message.error('เฉพาะผู้รับเหมาเท่านั้นที่อัปโหลดใบเซอร์ได้ครับ!');
      return;
    }

    setIsLoading(true);
    try {
      let finalFileUrl = 'https://example.com/dummy-cert.pdf';

      if (fileList.length > 0) {
        const file = fileList[0].originFileObj;
        const fileExt = file.name.split('.').pop();
        const uniqueName = `certs/${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;

        const { error } = await supabase.storage.from('permits').upload(uniqueName, file);
        if (error) throw error;
        
        const { data: publicUrlData } = supabase.storage.from('permits').getPublicUrl(uniqueName);
        finalFileUrl = publicUrlData.publicUrl;
      }

      const issuedDate = values.dateRange[0].toISOString();
      const expiryDate = values.dateRange[1].toISOString();

      await fetch(`${API_URL}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          cert_name: values.cert_name,
          file_url: finalFileUrl, 
          issued_date: issuedDate,
          expiry_date: expiryDate,
          status: 'PENDING'
        })
      });

      message.success('อัปโหลดใบ Certificate สำเร็จ! รอ จป. ตรวจสอบครับ');
      form.resetFields();
      setFileList([]); 
      fetchCerts(); 
      // เปลี่ยน Tab กลับไปหน้าตารางอัตโนมัติเมื่อส่งเสร็จ
      setActiveTab('REGISTRY');
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (certId: string, status: string) => {
    try {
      await fetch(`${API_URL}/certificates/${certId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      message.success(status === 'APPROVED' ? 'อนุมัติใบ Certificate แล้ว' : 'ปฏิเสธใบ Certificate แล้ว');
      fetchCerts(); 
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  // 🟢 Logic ประมวลผลข้อมูล (Filter & Search)
  const filteredCerts = useMemo(() => {
    return certs.filter(cert => {
      const matchName = cert.user?.full_name?.toLowerCase().includes(searchText.toLowerCase()) || 
                        cert.cert_name?.toLowerCase().includes(searchText.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || cert.status === filterStatus;
      
      // ดักเคสพิเศษ: หาใบที่หมดอายุ
      if (filterStatus === 'EXPIRED') {
        const isExpired = dayjs(cert.expiry_date).diff(dayjs(), 'day') < 0;
        return matchName && isExpired;
      }
      
      return matchName && matchStatus;
    });
  }, [certs, searchText, filterStatus]);

  // 🟢 คำนวณสถิติสำหรับ Dashboard
  const stats = useMemo(() => {
    const today = dayjs();
    let pending = 0, expired = 0, expiringSoon = 0, valid = 0;
    
    certs.forEach(cert => {
      if (cert.status === 'PENDING') pending++;
      else if (cert.status === 'APPROVED') {
        const daysLeft = dayjs(cert.expiry_date).diff(today, 'day');
        if (daysLeft < 0) expired++;
        else if (daysLeft <= 30) expiringSoon++;
        else valid++;
      }
    });
    return { pending, expired, expiringSoon, valid, total: certs.length };
  }, [certs]);

  // --- UI Helpers ---
  const getStatusTag = (status: string, expiryDate?: string) => {
    if (status === 'APPROVED' && expiryDate) {
      const daysLeft = dayjs(expiryDate).diff(dayjs(), 'day');
      if (daysLeft < 0) return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] md:text-xs font-black bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-500/30 whitespace-nowrap"><CloseCircleOutlined /> หมดอายุแล้ว</span>;
      if (daysLeft <= 30) return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] md:text-xs font-black bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-500/30 whitespace-nowrap"><WarningOutlined /> ใกล้หมดอายุ</span>;
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] md:text-xs font-black bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/30 whitespace-nowrap"><CheckCircleOutlined /> ใช้งานได้</span>;
    }
    
    switch(status) {
      case 'PENDING': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] md:text-xs font-black bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-500/30 whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>รอตรวจสอบ</span>;
      case 'REJECTED': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] md:text-xs font-black bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-500/30 whitespace-nowrap"><CloseCircleOutlined /> ไม่ผ่าน</span>;
      default: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] md:text-xs font-black bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-500/30 whitespace-nowrap">{status}</span>;
    }
  };

  const getExpiryDisplay = (expiryDate: string, status: string) => {
    if (status !== 'APPROVED') return null;
    
    const expiry = dayjs(expiryDate);
    const today = dayjs();
    const daysLeft = expiry.diff(today, 'day');
    
    if (daysLeft < 0) return <div className="text-[10px] font-black text-rose-500 mt-1 flex items-center gap-1"><ExclamationCircleOutlined /> เกินกำหนดมาแล้ว {Math.abs(daysLeft)} วัน</div>;
    if (daysLeft <= 30) return <div className="text-[10px] font-black text-amber-500 mt-1 flex items-center gap-1"><ClockCircleOutlined /> เหลือเวลาอีก {daysLeft} วัน</div>;
    return <div className="text-[10px] font-bold text-slate-400 mt-1">หมดอายุในอีก {daysLeft} วัน</div>;
  };

  const ActionButtons = ({ record }: { record: any }) => {
    const canVerify = currentUser?.role === 'SAFETY_ENGINEER' || currentUser?.role === 'ADMIN';

    if (canVerify && record.status === 'PENDING') {
      return (
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => handleVerify(record.id, 'APPROVED')} 
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-600 active:scale-95 transition-all whitespace-nowrap"
          >
            <CheckOutlined /> อนุมัติ
          </button>
          <button 
            onClick={() => handleVerify(record.id, 'REJECTED')} 
            className="w-8 h-8 md:w-auto md:px-3 md:py-1.5 flex-shrink-0 flex items-center justify-center gap-1.5 bg-white text-rose-500 rounded-lg border border-rose-200 hover:bg-rose-50 hover:border-rose-300 shadow-sm active:scale-95 transition-all"
            title="ปฏิเสธ"
          >
            <CloseOutlined /> <span className="hidden md:inline text-xs font-bold">ปฏิเสธ</span>
          </button>
        </div>
      );
    }
    return null;
  };

  const columns: ColumnsType<any> = [
    {
      title: 'พนักงาน / ผู้รับเหมา', 
      key: 'user', 
      width: 200,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} src={record.user?.profile_url} className="bg-slate-100 text-slate-500 border border-slate-200 shrink-0" />
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="font-bold text-slate-800 text-sm truncate" title={record.user?.full_name}>{record.user?.full_name}</span>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate">{record.user?.department}</span>
          </div>
        </div>
      )
    },
    {
      title: 'ประเภทใบรับรอง', 
      dataIndex: 'cert_name', 
      key: 'cert_name',
      render: (text) => (
        <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
          <SafetyCertificateOutlined className="text-blue-500" /> {text}
        </div>
      )
    },
    {
      title: 'วันหมดอายุ (Expiry)', 
      key: 'expiry_date',
      width: 150,
      render: (_, record) => (
        <div className="flex flex-col items-start leading-tight">
          <span className="text-sm font-bold text-slate-700">{dayjs(record.expiry_date).format('DD MMM YYYY')}</span>
          {getExpiryDisplay(record.expiry_date, record.status)}
        </div>
      )
    },
    {
      title: 'สถานะ', 
      dataIndex: 'status', 
      key: 'status',
      width: 120,
      render: (status, record) => getStatusTag(status, record.expiry_date)
    },
    {
      title: 'เอกสารอ้างอิง',
      key: 'document',
      width: 120,
      render: (_, record) => (
        record.file_url ? (
          <a href={record.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap group">
            <FileTextOutlined className="group-hover:scale-110 transition-transform" /> เปิดดูไฟล์
          </a>
        ) : <span className="text-[11px] text-slate-300 font-bold">-</span>
      )
    },
    {
      title: 'การจัดการ', 
      key: 'action',
      width: 150,
      render: (_, record) => <ActionButtons record={record} />
    },
  ];

  return (
    <div className="w-full pb-20 px-2 md:px-0 relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      
      {/* 🚀 Header */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-[1rem] shadow-lg shadow-blue-500/30 text-white shrink-0">
          <IdcardOutlined className="text-2xl md:text-3xl" />
        </div>
        <div>
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 m-0 tracking-tight leading-tight">ระบบทะเบียนใบรับรอง</h2>
          <p className="text-slate-500 text-[11px] md:text-sm m-0 mt-0.5 md:mt-1 font-medium">E-Certificate & Skill Matrix</p>
        </div>
      </div>

      {/* 🟢 Dashboard สถิติ (แสดงเฉพาะ จป. หรือ Admin) */}
      {currentUser?.role !== 'CONTRACTOR' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8 animate-fade-in-up">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><IdcardOutlined/> ใบเซอร์ทั้งหมด</span>
            <div className="text-2xl md:text-3xl font-black text-slate-800 mt-1">{stats.total}</div>
          </div>
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-center cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => setFilterStatus('PENDING')}>
            <span className="text-[10px] md:text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5"><ClockCircleOutlined/> รอการตรวจสอบ</span>
            <div className="text-2xl md:text-3xl font-black text-blue-600 mt-1">{stats.pending}</div>
          </div>
          <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-center cursor-pointer hover:bg-amber-50 transition-colors" onClick={() => setFilterStatus('APPROVED')}>
            <span className="text-[10px] md:text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5"><WarningOutlined/> ใกล้หมดอายุ (&lt;30 วัน)</span>
            <div className="text-2xl md:text-3xl font-black text-amber-600 mt-1">{stats.expiringSoon}</div>
          </div>
          <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-center cursor-pointer hover:bg-rose-50 transition-colors" onClick={() => setFilterStatus('EXPIRED')}>
            <span className="text-[10px] md:text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5"><CloseCircleOutlined/> หมดอายุแล้ว</span>
            <div className="text-2xl md:text-3xl font-black text-rose-600 mt-1">{stats.expired}</div>
          </div>
        </div>
      )}

      {/* 🚀 Segmented Control (สลับหน้าจอเฉพาะผู้รับเหมา) */}
      {currentUser?.role === 'CONTRACTOR' && (
        <div className="flex justify-center mb-8 animate-fade-in-up">
          <div className="relative flex bg-slate-200/50 backdrop-blur-xl p-1.5 rounded-[1.25rem] w-full max-w-[340px] md:max-w-[440px] shadow-inner border border-white/50">
            {/* 🟢 Elevated Slider Background */}
            <div
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-out"
              style={{ transform: activeTab === 'UPLOAD' ? 'translateX(0)' : 'translateX(100%)' }}
            />
            
            {/* Buttons */}
            <button
              onClick={() => setActiveTab('UPLOAD')}
              className={`relative z-10 flex-1 py-2.5 md:py-3 text-[13px] md:text-sm font-black transition-colors duration-300 flex items-center justify-center gap-2 rounded-xl ${
                activeTab === 'UPLOAD' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <UploadOutlined /> ยื่นเอกสารใบรับรอง
            </button>
            <button
              onClick={() => setActiveTab('REGISTRY')}
              className={`relative z-10 flex-1 py-2.5 md:py-3 text-[13px] md:text-sm font-black transition-colors duration-300 flex items-center justify-center gap-2 rounded-xl ${
                activeTab === 'REGISTRY' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <SafetyCertificateOutlined /> ทำเนียบผู้รับเหมา
            </button>
          </div>
        </div>
      )}

      {/* 🟢 Render Content Based on Active Tab */}
      <div className="w-full">
        
        {/* 📝 Tab 1: ฟอร์มอัปโหลด */}
        {activeTab === 'UPLOAD' && currentUser?.role === 'CONTRACTOR' && (
          <div className="animate-fade-in-up max-w-2xl mx-auto">
            <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 md:p-8 border-b border-slate-800 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
                  <UploadOutlined className="text-3xl text-blue-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white m-0 tracking-tight">
                  แบบฟอร์มนำส่งใบ Certificate
                </h3>
                <p className="text-xs md:text-sm font-medium text-slate-300 m-0 mt-2 max-w-md">
                  กรุณาตรวจสอบความถูกต้องของข้อมูลและเอกสารแนบก่อนนำส่ง เพื่อให้เจ้าหน้าที่ จป. ดำเนินการอนุมัติ
                </p>
              </div>
              
              <div className="p-5 md:p-8 bg-white">
                <Form form={form} layout="vertical" onFinish={handleUploadCert} requiredMark={false} className="anatomy-form">
                  {/* 🟢 อัปเกรด Dropdown เปลี่ยน Emojis เป็น Professional Icons */}
                  <Form.Item name="cert_name" label={<span className="font-black text-slate-700 text-xs">ประเภทใบรับรอง (Certificate Type) <span className="text-rose-500">*</span></span>} rules={[{ required: true, message: 'กรุณาเลือกประเภท' }]}>
                    <Select size="large" placeholder="-- เลือกประเภทเอกสาร --" className="w-full" popupClassName="cert-dropdown">
                      <Select.Option value="ผู้ปฏิบัติงานในที่อับอากาศ (Confined Space)">
                        <div className="flex items-center gap-2.5 text-slate-700 font-bold"><BuildOutlined className="text-blue-500 text-base" /> ผู้ปฏิบัติงานในที่อับอากาศ (4 ผู้)</div>
                      </Select.Option>
                      <Select.Option value="ผู้ควบคุมปั้นจั่น (Crane Operator)">
                        <div className="flex items-center gap-2.5 text-slate-700 font-bold"><ControlOutlined className="text-indigo-500 text-base" /> ผู้บังคับปั้นจั่น (4 ผู้)</div>
                      </Select.Option>
                      <Select.Option value="ช่างนั่งร้าน (Scaffolder)">
                        <div className="flex items-center gap-2.5 text-slate-700 font-bold"><ApartmentOutlined className="text-cyan-500 text-base" /> ผู้ติดตั้ง/ตรวจสอบนั่งร้าน</div>
                      </Select.Option>
                      <Select.Option value="ผู้ควบคุมงานร้อน (Hot Work Safety)">
                        <div className="flex items-center gap-2.5 text-slate-700 font-bold"><FireOutlined className="text-orange-500 text-base" /> ผู้ควบคุมงานร้อน / ช่างเชื่อม</div>
                      </Select.Option>
                      <Select.Option value="ช่างไฟฟ้า (Electrician)">
                        <div className="flex items-center gap-2.5 text-slate-700 font-bold"><ThunderboltOutlined className="text-amber-500 text-base" /> ช่างไฟฟ้า</div>
                      </Select.Option>
                      <Select.Option value="ใบรับรองแพทย์ (Fit to Work)">
                        <div className="flex items-center gap-2.5 text-slate-700 font-bold"><MedicineBoxOutlined className="text-emerald-500 text-base" /> ใบรับรองแพทย์ (Fit to Work)</div>
                      </Select.Option>
                      <Select.Option value="อื่นๆ (Others)">
                        <div className="flex items-center gap-2.5 text-slate-700 font-bold"><FileTextOutlined className="text-slate-400 text-base" /> อื่นๆ</div>
                      </Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="dateRange" label={<span className="font-black text-slate-700 text-xs">ระยะเวลาของใบรับรอง <span className="text-rose-500">*</span></span>} rules={[{ required: true, message: 'กรุณาระบุวันที่' }]} className="mb-5">
                    <ModernDatePickerRange />
                  </Form.Item>

                  <Form.Item label={<span className="font-black text-slate-700 text-xs">แนบไฟล์เอกสารอ้างอิง <span className="text-rose-500">*</span></span>}>
                    <Upload beforeUpload={() => false} maxCount={1} fileList={fileList} onChange={(info) => setFileList(info.fileList)}>
                      <div className="w-full border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer mb-2">
                        <div className="bg-white text-blue-500 p-3 rounded-full mb-3 shadow-sm border border-blue-100">
                          <FileTextOutlined className="text-3xl" />
                        </div>
                        <span className="text-slate-700 font-bold text-sm mb-1">แตะเพื่อเลือกไฟล์</span>
                        <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-widest">รองรับ PDF, JPG, PNG (Max 5MB)</span>
                      </div>
                    </Upload>
                  </Form.Item>

                  <div className="pt-4 border-t border-slate-100 mt-6">
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={isLoading} 
                      className="w-full h-14 rounded-2xl text-sm md:text-base font-black bg-blue-600 hover:bg-blue-700 border-none shadow-[0_4px_15px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 transition-all"
                    >
                      ส่งข้อมูลให้ จป. ตรวจสอบ
                    </Button>
                  </div>
                </Form>
              </div>
            </div>
          </div>
        )}

        {/* 📋 Tab 2: ตารางข้อมูลทะเบียนประวัติ */}
        {activeTab === 'REGISTRY' && (
          <div className="animate-fade-in-up w-full">
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col">
              
              {/* 🟢 Tools Bar (ค้นหาและกรอง) */}
              <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-base md:text-lg font-black text-slate-800 m-0 flex items-center gap-2">
                    <SafetyCertificateOutlined className="text-emerald-500" /> ทำเนียบผู้รับเหมา
                  </h3>
                  <Input 
                    placeholder="ค้นหาชื่อ, ประเภทใบเซอร์..." 
                    prefix={<SearchOutlined className="text-slate-400" />}
                    className="rounded-xl h-10 border-slate-200 w-full sm:w-72 font-medium"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                  />
                </div>

                {/* 🟢 Segmented Control สำหรับ Filter (แทน Select Dropdown) */}
                <div className="w-full overflow-x-auto pb-1 custom-scrollbar">
                  <div className="inline-flex bg-slate-200/50 p-1.5 rounded-2xl backdrop-blur-md shadow-inner min-w-max">
                    {[
                      { key: 'ALL', label: 'ทั้งหมด', icon: <AppstoreOutlined /> },
                      { key: 'PENDING', label: 'รอตรวจสอบ', icon: <ClockCircleOutlined /> },
                      { key: 'APPROVED', label: 'ใช้งานได้', icon: <CheckCircleOutlined /> },
                      { key: 'EXPIRED', label: 'หมดอายุ', icon: <WarningOutlined /> },
                      { key: 'REJECTED', label: 'ไม่อนุมัติ', icon: <CloseCircleOutlined /> },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setFilterStatus(tab.key)}
                        className={`
                          relative px-4 py-1.5 text-[11px] md:text-xs font-black rounded-xl transition-all duration-300 ease-out flex items-center justify-center gap-1.5
                          ${filterStatus === tab.key 
                            ? 'text-slate-800 bg-white shadow-sm ring-1 ring-slate-900/5' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
                          }
                        `}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-2 md:p-4 flex-1 overflow-x-auto min-h-[400px]">
                {/* 🚀 Desktop View: Table */}
                {!isMobile && (
                  <Table 
                    columns={columns} 
                    dataSource={filteredCerts} 
                    loading={isLoading && certs.length === 0} 
                    pagination={{ pageSize: 10, className: "px-4 pb-2 modern-pagination" }} 
                    rowKey="id" 
                    size="middle"
                    className="modern-table"
                    scroll={{ x: 800 }}
                    locale={{ emptyText: 'ไม่พบข้อมูลใบรับรอง' }}
                  />
                )}

                {/* 🚀 Mobile View: Card List */}
                {isMobile && (
                  <div className="space-y-4 p-2">
                    {filteredCerts.length > 0 ? filteredCerts.map((item) => (
                      <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden">
                        {/* แถบสีด้านซ้ายบอกสถานะ */}
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${
                          item.status === 'APPROVED' ? (dayjs(item.expiry_date).diff(dayjs(), 'day') < 0 ? 'bg-rose-500' : 'bg-emerald-500') : 
                          item.status === 'REJECTED' ? 'bg-slate-400' : 'bg-blue-500'
                        }`}></div>
                        
                        <div className="pl-2">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar icon={<UserOutlined />} src={item.user?.profile_url} className="bg-slate-100 text-slate-500 border border-slate-200 shrink-0" />
                              <div className="flex flex-col leading-tight">
                                <span className="text-sm font-extrabold text-slate-800 line-clamp-1">{item.user?.full_name}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.user?.department}</span>
                              </div>
                            </div>
                            <div>{getStatusTag(item.status, item.expiry_date)}</div>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                            <h4 className="text-xs font-black text-slate-700 m-0 mb-2 flex items-start gap-1.5 leading-tight">
                              <SafetyCertificateOutlined className="text-blue-500 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{item.cert_name}</span>
                            </h4>
                            <div className="flex justify-between items-end border-t border-slate-200 pt-2 mt-1">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">วันหมดอายุ</span>
                                <span className="text-xs font-bold text-slate-700">{dayjs(item.expiry_date).format('DD/MM/YYYY')}</span>
                              </div>
                              {getExpiryDisplay(item.expiry_date, item.status)}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-1">
                            {item.file_url ? (
                              <a href={item.file_url} target="_blank" rel="noreferrer" className="w-full flex justify-center items-center gap-1.5 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 px-3 py-2 rounded-xl text-xs font-bold transition-colors">
                                <FileTextOutlined /> ดูไฟล์แนบ
                              </a>
                            ) : <div className="w-full hidden sm:block"></div>}
                            
                            <div className="w-full mt-2 sm:mt-0"><ActionButtons record={item} /></div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <IdcardOutlined className="text-5xl text-slate-300 mb-3" />
                        <p className="font-bold text-sm text-slate-500 m-0">ไม่พบข้อมูลใบ Certificate</p>
                        <p className="text-xs font-medium text-slate-400 mt-1">ลองเปลี่ยนเงื่อนไขการค้นหาดูนะ</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* ✨ Animation */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }

        .anatomy-form .ant-select-selector { border-radius: 0.75rem !important; border: 1px solid #e2e8f0 !important; font-weight: 700; height: 3.5rem !important; align-items: center; }
        .anatomy-form .ant-select-selection-item { font-weight: 700; color: #334155; }
        
        .cert-dropdown .ant-select-item { padding: 12px 16px !important; transition: all 0.2s ease; }
        .cert-dropdown .ant-select-item-option-selected { background-color: #eff6ff !important; }
        
        .modern-table .ant-table { background: transparent; }
        .modern-table .ant-table-thead > tr > th { background-color: #f8fafc; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding: 16px 20px; }
        .modern-table .ant-table-tbody > tr > td { border-bottom: 1px solid #f1f5f9; padding: 16px 20px; background: white; }
        .modern-table .ant-table-tbody > tr:hover > td { background-color: #f8fafc; }
        
        /* 🟢 CSS RWD Pagination & Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        @media (max-width: 640px) {
          .modern-pagination.ant-pagination { display: flex !important; flex-wrap: wrap !important; justify-content: center !important; gap: 12px !important; padding: 16px 8px !important; }
          .modern-pagination .ant-pagination-total-text { width: 100% !important; text-align: center !important; margin-bottom: 4px !important; order: -1 !important; background: #f8fafc; padding: 8px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 11px;}
          .modern-pagination .ant-pagination-options { width: 100% !important; text-align: center !important; margin-left: 0 !important; margin-top: 4px !important; }
        }
      `}</style>
    </div>
  );
}