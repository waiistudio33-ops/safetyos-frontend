import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Upload, message, Button, Grid, Table, Popconfirm, Avatar, Tooltip, Segmented, Empty } from 'antd';
import { 
  WarningOutlined, CameraOutlined, EnvironmentOutlined, 
  PushpinOutlined, CheckCircleOutlined, SyncOutlined, AlertOutlined,
  UserOutlined, ThunderboltOutlined, HistoryOutlined, SafetyCertificateOutlined,
  FireOutlined, DashboardOutlined, SafetyOutlined, MedicineBoxOutlined, 
  ToolOutlined, CloudOutlined, FormOutlined, AppstoreOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';
import { supabase } from '../supabase';

dayjs.extend(relativeTime);
dayjs.locale('th');

const { useBreakpoint } = Grid; 

export default function IncidentReport({ currentUser }: { currentUser: any }) {
  const screens = useBreakpoint(); 
  const isMobile = !screens.lg;

  const [activeTab, setActiveTab] = useState<string>('REPORT'); 

  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [fileList, setFileList] = useState<any[]>([]);
  const [location, setLocation] = useState<{ lat: number | null, lng: number | null }>({ lat: null, lng: null });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const [form] = Form.useForm();

  const stats = {
    total: incidents.length,
    open: incidents.filter(i => i.status === 'OPEN').length,
    inProgress: incidents.filter(i => i.status === 'IN_PROGRESS').length,
    resolved: incidents.filter(i => i.status === 'RESOLVED').length,
  };

  const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';

  const fetchIncidents = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`${API_URL}/incidents`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setIncidents(data);
    } catch (error) {
      console.error("Fetch Error:", error);
      message.error('ไม่สามารถดึงข้อมูลจุดเสี่ยงได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const getLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          message.success('ดึงพิกัด GPS สำเร็จ!');
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("GPS Error:", error);
          message.error('ไม่สามารถดึงพิกัดได้ กรุณาอนุญาตการเข้าถึง GPS หรือเปิด Location Service');
          setIsGettingLocation(false);
        }
      );
    } else {
      message.error('เบราว์เซอร์หรืออุปกรณ์ของคุณไม่รองรับ GPS');
      setIsGettingLocation(false);
    }
  };

  const handleReportIncident = async (values: any) => {
    if (!currentUser) return message.error('กรุณาเข้าสู่ระบบก่อนแจ้งจุดเสี่ยง');
    
    setIsLoading(true);
    try {
      let imageUrl = null;

      if (fileList.length > 0) {
        const file = fileList[0].originFileObj;
        const fileExt = file.name.split('.').pop();
        const uniqueName = `incidents/${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;

        const { error } = await supabase.storage.from('permits').upload(uniqueName, file);
        if (error) throw error;

        const { data: publicUrlData } = supabase.storage.from('permits').getPublicUrl(uniqueName);
        imageUrl = publicUrlData.publicUrl;
      }

      const response = await fetch(`${API_URL}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter_id: currentUser.id,
          title: values.title,
          description: values.description,
          type: values.type,
          lat: location.lat,
          lng: location.lng,
          image_url: imageUrl
        })
      });

      if (!response.ok) throw new Error('Failed to create incident');

      message.success('ส่งรายงานจุดเสี่ยงสำเร็จ! ระบบได้แจ้งเตือนทีมความปลอดภัยแล้ว');
      form.resetFields();
      setFileList([]);
      setLocation({ lat: null, lng: null });
      fetchIncidents(); 
      setActiveTab('TRACKING'); 
    } catch (error) {
      console.error("Submit Error:", error);
      message.error('เกิดข้อผิดพลาดในการส่งรายงาน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/incidents/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Failed to update status');
      
      message.success(`อัปเดตสถานะเรียบร้อยแล้ว`);
      fetchIncidents();
    } catch (error) {
      console.error("Update Error:", error);
      message.error('อัปเดตสถานะไม่สำเร็จ');
    }
  };

  const getTypeConfig = (type: string) => {
    switch(type) {
      case 'NEAR_MISS': return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: <WarningOutlined />, label: 'Near Miss (เกือบเกิดเหตุ)' };
      case 'FIRST_AID': return { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', icon: <MedicineBoxOutlined />, label: 'First Aid (บาดเจ็บเล็กน้อย)' };
      case 'EQUIPMENT_DAMAGE': return { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', icon: <ToolOutlined />, label: 'Equipment Damage (ของพัง)' };
      case 'ENVIRONMENTAL': return { color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', icon: <CloudOutlined />, label: 'Environmental (สิ่งแวดล้อม)' };
      case 'SAFETY_HAZARD': return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertOutlined />, label: 'Safety Hazard (พบจุดเสี่ยง)' };
      case 'UNSAFE_ACT': return { color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', icon: <UserOutlined />, label: 'Unsafe Act' };
      case 'UNSAFE_CONDITION': return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <EnvironmentOutlined />, label: 'Unsafe Condition' };
      default: return { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: <InfoCircleOutlined />, label: type || 'ไม่ระบุ' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'OPEN': return { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', label: 'รอตรวจสอบ', dot: 'bg-rose-500' };
      case 'IN_PROGRESS': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'กำลังแก้ไข', dot: 'bg-blue-500 animate-pulse' };
      case 'RESOLVED': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'แก้ไขแล้ว', dot: 'bg-emerald-500' };
      case 'CLOSED': return { color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-300', label: 'ปิดงาน (Closed)', dot: 'bg-slate-400' };
      default: return { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', label: status || 'ไม่ระบุ', dot: 'bg-slate-500' };
    }
  };

  const ActionButtons = ({ record }: { record: any }) => {
    if (currentUser?.role !== 'SAFETY_ENGINEER' && currentUser?.role !== 'AREA_OWNER') {
       return <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-md">ผู้รับผิดชอบเท่านั้น</span>;
    }

    return (
      <div className="flex gap-2">
        {record.status === 'OPEN' && (
          <Popconfirm title="ยืนยันการรับเรื่อง?" onConfirm={() => handleUpdateStatus(record.id, 'IN_PROGRESS')} okText="ยืนยัน" cancelText="ยกเลิก">
            <Button type="primary" size="small" icon={<SyncOutlined />} className="bg-blue-500 hover:bg-blue-600 font-bold text-[10px] md:text-xs rounded-lg shadow-sm border-none transition-all active:scale-95 h-7">
              รับเรื่องไปแก้ไข
            </Button>
          </Popconfirm>
        )}
        {record.status === 'IN_PROGRESS' && (
          <Popconfirm title="ยืนยันว่าแก้ไขเสร็จสิ้นและปลอดภัยแล้ว?" onConfirm={() => handleUpdateStatus(record.id, 'RESOLVED')} okText="ยืนยัน" cancelText="ยกเลิก">
            <Button type="primary" size="small" icon={<CheckCircleOutlined />} className="bg-emerald-500 hover:bg-emerald-600 font-bold text-[10px] md:text-xs rounded-lg shadow-sm border-none transition-all active:scale-95 h-7">
              ปิดเคส (แก้แล้ว)
            </Button>
          </Popconfirm>
        )}
        {record.status === 'RESOLVED' && (
          <span className="text-[11px] text-emerald-500 font-bold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100"><CheckCircleOutlined /> แก้ไขเรียบร้อย</span>
        )}
      </div>
    );
  };

  const columns: ColumnsType<any> = [
    {
      title: 'ข้อมูลเหตุการณ์',
      key: 'details',
      width: 300,
      render: (_, record) => {
        const typeConf = getTypeConfig(record.type);
        return (
          <div className="flex flex-col gap-2 py-1">
            <div className="font-extrabold text-slate-800 text-sm leading-tight break-words">{record.title}</div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 ${typeConf.bg} ${typeConf.color} px-2 py-0.5 rounded-md text-[10px] font-black border ${typeConf.border} whitespace-nowrap`}>
                {typeConf.icon} {typeConf.label}
              </span>
            </div>
            <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">{record.description}</div>
          </div>
        )
      }
    },
    {
      title: 'ผู้แจ้ง / วันที่',
      key: 'reporter_date',
      width: 150,
      render: (_, record) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
             <Avatar src={record.reporter?.profile_url} icon={<UserOutlined />} size="small" className="bg-slate-100 text-slate-400 shrink-0" />
             <span className="font-bold text-slate-700 text-xs truncate max-w-[100px]">{record.reporter?.full_name || 'ไม่ทราบชื่อ'}</span>
          </div>
          <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
            <HistoryOutlined /> {dayjs(record.created_at).format('DD MMM YY HH:mm')} น.
          </div>
        </div>
      )
    },
    {
      title: 'หลักฐาน',
      key: 'attachment',
      width: 120,
      render: (_, record) => (
        <div className="flex flex-col gap-1.5">
          {record.lat ? (
            <a href={`http://maps.google.com/?q=${record.lat},${record.lng}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded-lg border border-blue-100 transition-colors whitespace-nowrap w-full">
              <PushpinOutlined /> ดูแผนที่
            </a>
          ) : <span className="text-[10px] text-slate-300 text-center bg-slate-50 rounded-lg py-1.5 w-full">-</span>}
          
          {record.image_url ? (
            <a href={record.image_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 text-[10px] font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1.5 rounded-lg border border-purple-100 transition-colors whitespace-nowrap w-full">
              <CameraOutlined /> ดูรูปถ่าย
            </a>
          ) : <span className="text-[10px] text-slate-300 text-center bg-slate-50 rounded-lg py-1.5 w-full">-</span>}
        </div>
      )
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => {
        const statConf = getStatusConfig(status);
        return (
          <div className={`flex items-center justify-center gap-1.5 ${statConf.bg} ${statConf.border} border px-2 py-1.5 rounded-lg w-full whitespace-nowrap`}>
            <div className={`w-1.5 h-1.5 rounded-full ${statConf.dot}`}></div>
            <span className={`text-[10px] font-black ${statConf.color}`}>{statConf.label}</span>
          </div>
        )
      }
    },
    {
      title: 'การจัดการ',
      key: 'action',
      width: 140, 
      align: 'center',
      render: (_, record) => <ActionButtons record={record} />
    }
  ];

  return (
    <div className="w-full h-full min-h-[85vh] flex flex-col pb-10 incident-container animate-fade-in relative">
      
      {/* 🟢 Background Blur Effects */}
      <div className="absolute top-0 right-0 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-red-400/10 rounded-full blur-[80px] md:blur-[100px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[250px] md:w-[300px] h-[250px] md:h-[300px] bg-blue-400/10 rounded-full blur-[80px] md:blur-[100px] pointer-events-none -z-10"></div>

      {/* 🚀 Header & Dashboard Stats */}
      <div className="mb-6 md:mb-8 px-2 md:px-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-gradient-to-tr from-red-500 to-rose-600 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-[1rem] sm:rounded-[1.2rem] shadow-lg shadow-red-500/30 text-white shrink-0">
              <AlertOutlined className="text-2xl sm:text-3xl" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-800 m-0 tracking-tight leading-tight">ระบบรายงานอุบัติการณ์</h2>
              <p className="text-slate-500 text-[11px] sm:text-sm md:text-base m-0 mt-0.5 md:mt-1 font-medium flex items-center gap-1.5">
                <SafetyOutlined className="text-emerald-500 hidden sm:inline" /> Incident Report & Tracking
              </p>
            </div>
          </div>
        </div>

        {/* 🟢 สถิติ (Stats Grid) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-md p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1">
            <span className="text-[8px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">ทั้งหมด</span>
            <span className="text-lg sm:text-3xl font-black text-slate-700">{stats.total}</span>
          </div>
          <div className="bg-rose-50/80 backdrop-blur-md p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-rose-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden transition-transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-rose-200 rounded-bl-full -mr-1 -mt-1 sm:-mr-2 sm:-mt-2"></div>
            <span className="text-[8px] sm:text-xs font-black text-rose-500 uppercase tracking-widest mb-0.5 sm:mb-1 flex items-center gap-1"><FireOutlined className="hidden sm:inline"/> รอตรวจสอบ</span>
            <span className="text-lg sm:text-3xl font-black text-rose-600">{stats.open}</span>
          </div>
          <div className="bg-blue-50/80 backdrop-blur-md p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1">
            <span className="text-[8px] sm:text-xs font-black text-blue-500 uppercase tracking-widest mb-0.5 sm:mb-1 flex items-center gap-1"><SyncOutlined className="hidden sm:inline animate-spin-slow"/> กำลังแก้</span>
            <span className="text-lg sm:text-3xl font-black text-blue-600">{stats.inProgress}</span>
          </div>
          <div className="bg-emerald-50/80 backdrop-blur-md p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1">
            <span className="text-[8px] sm:text-xs font-black text-emerald-500 uppercase tracking-widest mb-0.5 sm:mb-1 flex items-center gap-1"><CheckCircleOutlined className="hidden sm:inline"/> ปลอดภัย</span>
            <span className="text-lg sm:text-3xl font-black text-emerald-600">{stats.resolved}</span>
          </div>
        </div>

        {/* 🟢 ตัวเลือกสลับหน้าจอ (Glassmorphism Segmented Control) */}
        <div className="flex justify-center w-full max-w-lg mx-auto mb-2">
          <Segmented
            options={[
              { 
                label: (
                  <div className={`px-4 py-2 font-black text-[13px] md:text-sm flex items-center gap-2 transition-colors duration-300 ${activeTab === 'REPORT' ? 'text-blue-600' : 'text-slate-500'}`}>
                    <FormOutlined /> แจ้งจุดเสี่ยง
                  </div>
                ), 
                value: 'REPORT' 
              },
              { 
                label: (
                  <div className={`px-4 py-2 font-black text-[13px] md:text-sm flex items-center gap-2 transition-colors duration-300 ${activeTab === 'TRACKING' ? 'text-blue-600' : 'text-slate-500'}`}>
                    <AppstoreOutlined /> กระดานติดตาม
                  </div>
                ), 
                value: 'TRACKING' 
              },
            ]}
            value={activeTab}
            onChange={(value) => setActiveTab(value as string)}
            className="custom-glass-segmented"
            block
          />
        </div>
      </div>

      {/* 🚀 Main Content Area */}
      <div className="flex flex-col px-2 md:px-0 flex-1 relative min-h-[500px]">
        
        {/* =========================================
            📝 ส่วนที่ 1: ฟอร์มแจ้งเหตุ (REPORT TAB)
            ========================================= */}
        <div className={`transition-all duration-500 ease-in-out w-full max-w-2xl mx-auto ${activeTab === 'REPORT' ? 'opacity-100 translate-y-0 relative z-10' : 'opacity-0 translate-y-8 absolute inset-0 pointer-events-none z-0'}`}>
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100/80 overflow-hidden">
            
            <div className="bg-gradient-to-r from-rose-500 to-red-600 p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-xl"></div>
              <h3 className="text-xl sm:text-2xl font-black text-white m-0 flex items-center gap-2 relative z-10 shadow-sm">
                <ThunderboltOutlined className="text-2xl text-yellow-300" /> พบเหตุแจ้งด่วน!
              </h3>
              <p className="text-[11px] sm:text-sm font-medium text-red-100 m-0 mt-1 relative z-10 opacity-90">รูปภาพ + พิกัด จะถูกส่งตรงถึงทีมความปลอดภัย (จป.)</p>
            </div>
            
            <div className="p-6 sm:p-8">
              <Form form={form} layout="vertical" onFinish={handleReportIncident} requiredMark={false} className="anatomy-form">
                
                <Form.Item name="title" label={<span className="font-extrabold text-slate-700 text-sm">หัวข้อ / จุดที่พบเห็น <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาระบุหัวข้อ' }]}>
                  <Input size="large" placeholder="เช่น ท่อเคมีรั่ว, นั่งร้านเอียง" className="rounded-xl sm:rounded-2xl border-slate-200 bg-slate-50 focus:bg-white hover:bg-white h-12 text-sm sm:text-base font-bold transition-all shadow-inner-sm" />
                </Form.Item>
                
                <Form.Item name="type" label={<span className="font-extrabold text-slate-700 text-sm">ประเภทความเสี่ยง <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'เลือกประเภท' }]}>
                  <Select size="large" placeholder="ระบุประเภทของปัญหา" className="w-full h-12 font-bold [&_.ant-select-selector]:rounded-xl sm:[&_.ant-select-selector]:rounded-2xl [&_.ant-select-selector]:bg-slate-50 [&_.ant-select-selector]:border-slate-200">
                    <Select.Option value="NEAR_MISS"><span className="font-bold text-orange-600">⚠️ Near Miss (เกือบเกิดเหตุ)</span></Select.Option>
                    <Select.Option value="FIRST_AID"><span className="font-bold text-rose-600">🩹 First Aid (บาดเจ็บเล็กน้อย)</span></Select.Option>
                    <Select.Option value="EQUIPMENT_DAMAGE"><span className="font-bold text-purple-600">🔧 Equipment Damage (ของพัง)</span></Select.Option>
                    <Select.Option value="ENVIRONMENTAL"><span className="font-bold text-cyan-600">☁️ Environmental (สิ่งแวดล้อม)</span></Select.Option>
                    <Select.Option value="SAFETY_HAZARD"><span className="font-bold text-amber-600">🚧 Safety Hazard (พบจุดเสี่ยง)</span></Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="description" label={<span className="font-extrabold text-slate-700 text-sm">รายละเอียดเพิ่มเติม <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาระบุรายละเอียด' }]}>
                  <Input.TextArea rows={4} placeholder="อธิบายรายละเอียดสิ่งที่พบเห็น เพื่อให้ทีมงานเข้าแก้ไขได้ถูกต้อง..." className="rounded-xl sm:rounded-2xl border-slate-200 bg-slate-50 focus:bg-white hover:bg-white p-4 text-sm sm:text-base font-medium transition-all resize-none shadow-inner-sm custom-scrollbar" />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {/* GPS Button */}
                  <div className="flex flex-col">
                    <label className="font-extrabold text-slate-700 text-[11px] sm:text-xs mb-2 uppercase tracking-wide">พิกัด GPS <span className="text-red-500">*</span></label>
                    <Button 
                      type={location.lat ? "primary" : "dashed"} 
                      onClick={getLocation} 
                      loading={isGettingLocation} 
                      icon={location.lat ? <CheckCircleOutlined /> : <EnvironmentOutlined />} 
                      className={`h-12 rounded-xl sm:rounded-2xl border-2 font-bold w-full transition-all text-xs sm:text-sm ${location.lat ? 'bg-emerald-500 border-emerald-500 hover:!bg-emerald-600 hover:!border-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.3)] text-white' : 'border-blue-200 text-blue-600 bg-blue-50 hover:!border-blue-400 hover:!text-blue-700'}`}
                    >
                      {location.lat ? 'พิกัดพร้อม' : 'ดึงพิกัด'}
                    </Button>
                  </div>

                  {/* Upload Button */}
                  <div className="flex flex-col">
                    <label className="font-extrabold text-slate-700 text-[11px] sm:text-xs mb-2 uppercase tracking-wide">รูปหลักฐาน</label>
                    <Upload beforeUpload={() => false} maxCount={1} fileList={fileList} onChange={(info) => setFileList(info.fileList)}>
                      <Button icon={<CameraOutlined />} className={`h-12 rounded-xl sm:rounded-2xl border-2 w-full font-bold transition-all text-xs sm:text-sm ${fileList.length > 0 ? 'border-purple-500 text-purple-600 bg-purple-50 hover:!border-purple-600 shadow-[0_4px_12px_rgba(168,85,247,0.2)]' : 'border-slate-200 text-slate-500 bg-slate-50 hover:!border-slate-300 hover:!text-slate-600'}`}>
                        {fileList.length > 0 ? 'แนบแล้ว' : 'แนบรูป'}
                      </Button>
                    </Upload>
                  </div>
                </div>

                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={isLoading} 
                  className="w-full h-14 rounded-xl sm:rounded-2xl text-base sm:text-lg font-black bg-slate-800 hover:!bg-slate-900 border-none shadow-[0_8px_20px_rgba(15,23,42,0.3)] flex items-center justify-center gap-2 transition-transform active:scale-[0.98] hover:-translate-y-0.5"
                >
                  <WarningOutlined className="text-xl text-red-500" /> ยืนยันการแจ้งเหตุ
                </Button>
              </Form>
            </div>
          </div>
        </div>

        {/* =========================================
            🚨 ส่วนที่ 2: กระดานติดตาม (TRACKING TAB)
            ========================================= */}
        <div className={`transition-all duration-500 ease-in-out w-full h-full flex flex-col flex-1 ${activeTab === 'TRACKING' ? 'opacity-100 translate-y-0 relative z-10' : 'opacity-0 translate-y-8 absolute inset-0 pointer-events-none z-0'}`}>
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100/80 overflow-hidden flex flex-col flex-1">
            
            <div className="p-4 sm:p-6 border-b border-slate-100/80 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h3 className="text-lg sm:text-xl font-black text-slate-800 m-0 flex items-center gap-2 sm:gap-3">
                <div className="bg-blue-100 p-1.5 sm:p-2 rounded-xl text-blue-600 shadow-inner-sm"><DashboardOutlined /></div>
                กระดานติดตามสถานะ
              </h3>
              <Tooltip title="รีเฟรชข้อมูล">
                 <Button type="text" icon={<SyncOutlined className={isFetching ? "animate-spin" : ""} />} onClick={fetchIncidents} className="text-slate-400 hover:text-blue-500 bg-white shadow-sm border border-slate-100 rounded-lg sm:rounded-xl w-10 h-10 flex items-center justify-center transition-colors active:bg-blue-50" />
              </Tooltip>
            </div>

            <div className="p-4 sm:p-6 flex-1 bg-slate-50/30 overflow-y-auto custom-scrollbar touch-pan-y relative min-h-[400px]">
              
              {isFetching && incidents.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full opacity-60 py-20">
                    <SyncOutlined className="text-4xl text-blue-500 animate-spin mb-4" />
                    <p className="font-bold text-slate-500">กำลังโหลดข้อมูล...</p>
                 </div>
              ) : incidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 bg-white rounded-3xl border border-dashed border-slate-200 m-2 shadow-sm">
                  <SafetyCertificateOutlined className="text-6xl text-emerald-400 mb-4 opacity-50" />
                  <p className="font-extrabold text-xl text-slate-800 m-0 mt-4">พื้นที่ปลอดภัย 100%</p>
                  <p className="font-medium text-slate-400 mt-1 text-sm">ยังไม่มีการรายงานจุดเสี่ยงในระบบ</p>
                </div>
              ) : (
                <>
                  {/* 🚀 Desktop View: Modern Table (สำหรับจอ Tablet แนวนอนขึ้นไป) */}
                  {!isMobile && (
                    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden animate-fade-in">
                      <Table 
                        columns={columns} 
                        dataSource={incidents} 
                        pagination={{ pageSize: 8, className: "px-4" }} 
                        rowKey="id" 
                        className="modern-table"
                        scroll={{ x: 900 }} 
                      />
                    </div>
                  )}

                  {/* 🚀 Mobile View: Modern Feed Cards (สำหรับมือถือ) */}
                  {isMobile && (
                    <div className="flex flex-col gap-4 pb-4">
                      {incidents.map((item) => {
                        const statConf = getStatusConfig(item.status);
                        const typeConf = getTypeConfig(item.type);

                        return (
                          <div key={item.id} className="bg-white rounded-[1.5rem] border border-slate-100 p-5 shadow-[0_4px_15px_rgba(0,0,0,0.02)] relative overflow-hidden transition-all active:scale-[0.98] animate-fade-in">
                            
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${statConf.bg.replace('bg-', 'bg-').replace('-50', '-500')}`}></div>
                            
                            <div className="pl-3">
                              {/* Card Header */}
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                  <Avatar src={item.reporter?.profile_url} icon={<UserOutlined />} size="default" className="bg-slate-100 text-slate-400 border border-slate-200 shrink-0" />
                                  <div>
                                    <p className="text-xs font-black text-slate-800 m-0 leading-tight">{item.reporter?.full_name || 'ไม่ระบุ'}</p>
                                    <p className="text-[10px] font-bold text-slate-400 m-0 mt-0.5 flex items-center gap-1"><HistoryOutlined /> {dayjs(item.created_at).fromNow()}</p>
                                  </div>
                                </div>
                                <div className={`flex items-center gap-1.5 ${statConf.bg} ${statConf.border} border px-2.5 py-1.5 rounded-lg shrink-0`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${statConf.dot}`}></div>
                                  <span className={`text-[10px] font-black ${statConf.color}`}>{statConf.label}</span>
                                </div>
                              </div>

                              {/* Card Body */}
                              <h4 className="text-base font-extrabold text-slate-800 mb-2 leading-snug pr-2 break-words">{item.title}</h4>
                              <div className="mb-3 flex flex-wrap">
                                <span className={`inline-flex items-center gap-1 ${typeConf.bg} ${typeConf.color} px-2.5 py-1 rounded-lg text-[10px] font-black border ${typeConf.border}`}>
                                  {typeConf.icon} {typeConf.label}
                                </span>
                              </div>
                              <div className="text-[12px] font-medium text-slate-600 mb-5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100/80 leading-relaxed line-clamp-3">
                                {item.description}
                              </div>

                              {/* Card Footer */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100/80">
                                <div className="flex gap-2">
                                  {item.lat && (
                                    <a href={`http://maps.google.com/?q=${item.lat},${item.lng}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100 active:bg-blue-100">
                                      <PushpinOutlined /> แผนที่
                                    </a>
                                  )}
                                  {item.image_url && (
                                    <a href={item.image_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-bold border border-purple-100 active:bg-purple-100">
                                      <CameraOutlined /> หลักฐาน
                                    </a>
                                  )}
                                </div>
                                
                                <ActionButtons record={item} />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 🎨 Global CSS สำหรับแต่ง UI เพิ่มเติม */}
      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .shadow-inner-sm { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02); }
        
        /* 🟢 Glassmorphism Segmented Control Styles */
        .custom-glass-segmented {
          background: rgba(241, 245, 249, 0.6) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          padding: 6px !important;
          border-radius: 20px !important;
          border: 1px solid rgba(255, 255, 255, 0.8) !important;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.02) !important;
        }
        .custom-glass-segmented .ant-segmented-item {
          border-radius: 14px !important;
          transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
        }
        .custom-glass-segmented .ant-segmented-item:hover:not(.ant-segmented-item-selected) {
          background: rgba(255, 255, 255, 0.4) !important;
        }
        /* ตัวเลื่อน (Slider) แบบ Elevated */
        .custom-glass-segmented .ant-segmented-thumb {
          background: #ffffff !important;
          border-radius: 14px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.02) !important;
          border: 1px solid rgba(255,255,255,1) !important;
          transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
        }
        
        /* Scrollbar อัจฉริยะ */
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.4); }
        .touch-pan-y { touch-action: pan-y; -webkit-overflow-scrolling: touch; }

        /* Modern Table Overrides */
        .modern-table .ant-table { background: transparent !important; }
        .modern-table .ant-table-thead > tr > th { 
          background-color: #f8fafc !important; 
          color: #64748b; 
          font-weight: 800; 
          text-transform: uppercase; 
          font-size: 11px; 
          letter-spacing: 0.05em; 
          border-bottom: 2px solid #f1f5f9; 
          padding: 16px; 
        }
        .modern-table .ant-table-tbody > tr > td { 
          border-bottom: 1px solid #f1f5f9; 
          padding: 16px; 
        }
        .modern-table .ant-table-tbody > tr:hover > td { background-color: #f8fafc !important; }
        
        /* Form Overrides */
        .anatomy-form .ant-form-item-label > label { height: auto; }
        
        /* Fix Layout for Mobile Container */
        @media (max-width: 1024px) {
          .incident-container { height: auto !important; min-height: auto !important; overflow: visible !important; }
        }
      `}</style>
    </div>
  );
}