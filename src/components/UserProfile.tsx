import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  UserOutlined, MailOutlined, PhoneOutlined, IdcardOutlined, SafetyCertificateOutlined,
  CheckCircleOutlined, SettingOutlined, HistoryOutlined, CameraOutlined, EditOutlined,
  FileTextOutlined, EyeOutlined, ReadOutlined, ArrowRightOutlined, LogoutOutlined,
  ToolOutlined, PictureOutlined, DisconnectOutlined, LinkOutlined, LoadingOutlined,
  EnvironmentOutlined, HeartOutlined, MedicineBoxOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { message, Popconfirm, Modal, Form, Input, Button, Upload, Timeline, Tag, Spin, Select } from 'antd';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';

dayjs.extend(relativeTime);
dayjs.locale('th');

const { Option } = Select;
const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';

interface UserProfileProps {
  currentUser: any;
  lineProfile: any;
  onUpdateProfile?: (values: any) => Promise<boolean>;
  onUploadAvatar?: (file: File) => Promise<string | null>;
  onToggleLineConnection?: () => void;
}

export default function UserProfile({ 
  currentUser, 
  lineProfile,
  onUpdateProfile,
  onUploadAvatar,
  onToggleLineConnection
}: UserProfileProps) {
  
  const [activeTab, setActiveTab] = useState('timeline');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [form] = Form.useForm();
  const [medicalForm] = Form.useForm(); 

  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);
  const [myTimelineData, setMyTimelineData] = useState<{permits: any[], bbs: any[], certs: any[], elearning: any[]}>({
    permits: [], bbs: [], certs: [], elearning: []
  });

  useEffect(() => {
    const fetchMyTimeline = async () => {
      setIsLoadingTimeline(true);
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('safetyos_token');
        const response = await axios.get(`${API_URL}/users/me/timeline`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setMyTimelineData(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch timeline:", error);
      } finally {
        setIsLoadingTimeline(false);
      }
    };

    if (currentUser?.id) {
      fetchMyTimeline();
    }
  }, [currentUser?.id]);

  const getDisplayAvatar = () => {
    if (localAvatarUrl) return localAvatarUrl;
    if (currentUser?.profile_url) return currentUser.profile_url;
    if (lineProfile?.pictureUrl) return lineProfile.pictureUrl;
    return null;
  };

  const handleOpenEditModal = () => {
    form.setFieldsValue({
      department: currentUser?.department || '',
      phone: currentUser?.phone || '',
      email: currentUser?.email || ''
    });
    setIsEditModalOpen(true);
  };

  const handleOpenMedicalModal = () => {
    medicalForm.setFieldsValue({
      blood_group: currentUser?.blood_group || 'ไม่ระบุ',
      medical_cond: currentUser?.medical_cond || 'ไม่มี',
      emergency_contact: currentUser?.emergency_contact || ''
    });
    setIsMedicalModalOpen(true);
  };

  const handleSaveProfile = async (values: any) => {
    if (onUpdateProfile) {
      setIsSubmitting(true);
      const success = await onUpdateProfile(values);
      setIsSubmitting(false);
      if (success) {
        message.success('อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว');
        setIsEditModalOpen(false);
      } else {
        message.error('ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองใหม่');
      }
    }
  };

  const handleSaveMedicalInfo = async (values: any) => {
    if (onUpdateProfile) {
      setIsSubmitting(true);
      const success = await onUpdateProfile(values); 
      setIsSubmitting(false);
      if (success) {
        message.success('บันทึกข้อมูลทางการแพทย์สำเร็จ! (จะแสดงในหลังบัตร E-Passport)');
        setIsMedicalModalOpen(false);
      } else {
        message.error('ไม่สามารถบันทึกข้อมูลได้');
      }
    }
  };

  const uploadProps: UploadProps = {
    name: 'avatar',
    showUploadList: false,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) { message.error('อัปโหลดได้เฉพาะไฟล์ JPG/PNG เท่านั้น!'); return false; }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) { message.error('ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB!'); return false; }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }: any) => {
      if (onUploadAvatar) {
        setIsUploading(true);
        try {
          const newUrl = await onUploadAvatar(file);
          if (newUrl) {
            setLocalAvatarUrl(newUrl);
            message.success('เปลี่ยนรูปโปรไฟล์สำเร็จ!');
            if (onSuccess) onSuccess("ok");
          } else { throw new Error('อัปโหลดล้มเหลว'); }
        } catch (err) {
          message.error('อัปโหลดรูปภาพไม่สำเร็จ');
          if (onError) onError(err as any);
        } finally { setIsUploading(false); }
      }
    },
  };

  const handleLineAction = () => {
    if (onToggleLineConnection) {
      onToggleLineConnection();
    } else {
      message.info('ฟังก์ชันเชื่อมต่อ LINE ยังไม่พร้อมใช้งานในส่วนนี้');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('safetyos_token');
    message.success('ออกจากระบบเรียบร้อยแล้ว');
    setTimeout(() => { window.location.href = '/'; }, 1000);
  };

  const getCombinedTimeline = () => {
    const allEvents: any[] = [];
    
    myTimelineData.permits.forEach(p => {
      allEvents.push({
        id: `permit-${p.id}`,
        type: 'PERMIT',
        title: `ขอใบอนุญาต: ${p.title || 'ไม่ระบุชื่อเอกสาร'}`,
        time: p.created_at,
        icon: <FileTextOutlined />,
        color: 'blue',
        detail: `สถานที่: ${p.location_detail || 'ไม่ระบุ'} | เลขที่: ${p.permit_number}`,
        status: p.status
      });
    });

    myTimelineData.bbs.forEach(b => {
      allEvents.push({
        id: `bbs-${b.id}`,
        type: 'BBS',
        title: 'รายงาน BBS Observation',
        time: b.date || b.created_at, 
        icon: <EyeOutlined />,
        color: b.behavior_type === 'SAFE' ? 'green' : 'red',
        detail: `พฤติกรรม: ${b.description || 'ไม่ระบุ'} | สถานที่: ${b.location || 'ไม่ระบุ'}`,
        status: b.behavior_type
      });
    });

    return allEvents.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  };

  const timelineEvents = getCombinedTimeline();

  return (
    <div className="animate-fade-in w-full max-w-7xl mx-auto pb-20 px-4 sm:px-6 lg:px-8">
      
      {/* Header Banner & Avatar */}
      <div className="relative mt-4 mb-28 md:mb-32">
        <div className="h-40 sm:h-56 md:h-80 w-full rounded-3xl md:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] relative overflow-hidden transition-all duration-500" style={{ backgroundColor: '#ffffff', backgroundImage: `radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.45) 0%, transparent 60%), radial-gradient(circle at 80% 10%, rgba(16, 185, 129, 0.35) 0%, transparent 60%), radial-gradient(circle at 30% 90%, rgba(244, 63, 94, 0.35) 0%, transparent 60%), radial-gradient(circle at 90% 80%, rgba(234, 179, 8, 0.35) 0%, transparent 60%)` }}>
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]"></div>
          <button onClick={() => message.info('ฟังก์ชันเปลี่ยนรูปพื้นหลังจะมาเร็วๆ นี้!')} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-3 bg-white/30 hover:bg-white/50 backdrop-blur-md rounded-xl sm:rounded-2xl text-slate-700 border border-white/50 transition-all shadow-sm">
            <PictureOutlined className="text-lg sm:text-xl" />
          </button>
        </div>

        <div className="absolute -bottom-20 sm:-bottom-16 left-0 right-0 md:left-12 md:right-auto flex flex-col md:flex-row items-center md:items-end gap-3 sm:gap-6 px-4 md:px-0">
          <Upload {...uploadProps} disabled={isUploading}>
            <div className="relative group cursor-pointer">
              <div className="p-1.5 sm:p-2 bg-white rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
                {/* 🟢 แก้ไขตรงนี้: ลบ class w-full h-full ใน img ออก และใส่ class ที่บังคับให้รูปเป็นจัตุรัสและไม่ยืดหด */}
                <div className="w-28 h-28 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden bg-slate-50 relative flex items-center justify-center">
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center text-blue-500"><LoadingOutlined className="text-2xl sm:text-3xl mb-1 sm:mb-2" /><span className="text-[10px] sm:text-xs font-bold">Uploading...</span></div>
                  ) : getDisplayAvatar() ? (
                    <img src={getDisplayAvatar()!} alt="Profile" className="w-full h-full object-cover object-center rounded-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-200 text-5xl sm:text-6xl"><UserOutlined /></div>
                  )}
                  {!isUploading && (<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all"><CameraOutlined className="text-white text-2xl sm:text-3xl mb-1" /><span className="text-white text-[10px] sm:text-xs font-bold">เปลี่ยนรูปโปรไฟล์</span></div>)}
                </div>
              </div>
              {!isUploading && (<div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-8 h-8 sm:w-10 sm:h-10 bg-[#2563eb] hover:bg-[#1d4ed8] border-[3px] sm:border-4 border-white rounded-full shadow-md text-white flex items-center justify-center transition-transform hover:scale-110"><CameraOutlined className="text-xs sm:text-sm" /></div>)}
            </div>
          </Upload>

          <div className="text-center md:text-left md:pb-6">
            <div className="flex flex-col md:flex-row items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1e293b] m-0 tracking-tight leading-none">{currentUser?.full_name || 'ไม่ระบุชื่อ'}</h1>
              <span className="px-3 py-1 sm:px-4 sm:py-1.5 bg-blue-50 text-blue-600 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest rounded-full shadow-sm">{currentUser?.role || 'User'}</span>
            </div>
            <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px] sm:text-[11px] mt-1.5 sm:mt-2 flex items-center justify-center md:justify-start gap-1.5">
              <IdcardOutlined /> Employee ID: {currentUser?.employee_id || currentUser?.username || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-12 sm:mt-0">
        
        {/* Left Column: Personal Data */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-5 sm:p-8 border border-slate-50">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h3 className="text-base sm:text-[18px] font-black text-slate-800 m-0">ข้อมูลส่วนตัว</h3>
              <button onClick={handleOpenEditModal} className="text-blue-600 font-bold text-[10px] sm:text-xs flex items-center gap-1 hover:underline bg-blue-50 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl transition-colors hover:bg-blue-100"><EditOutlined /> แก้ไข</button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {[
                { icon: <ToolOutlined />, label: "แผนก / บริษัท (Department)", value: currentUser?.department || 'ไม่ได้ระบุ', bg: "bg-blue-50", text: "text-blue-600" },
                { icon: <SafetyCertificateOutlined />, label: "ระดับความปลอดภัย", value: currentUser?.role === 'SAFETY_ENGINEER' ? "Safety Engineer (จป.)" : currentUser?.role === 'AREA_OWNER' ? "Area Owner" : "Contractor / Worker", bg: "bg-emerald-50", text: "text-emerald-600" },
                { icon: <PhoneOutlined />, label: "เบอร์โทรศัพท์", value: currentUser?.phone || 'ไม่ได้ระบุ', bg: "bg-orange-50", text: "text-orange-600" },
                { icon: <MailOutlined />, label: "อีเมลติดต่อ", value: currentUser?.email || 'ไม่ได้ระบุ', bg: "bg-purple-50", text: "text-purple-600" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 sm:gap-4 group">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${item.bg} ${item.text} flex items-center justify-center text-lg sm:text-xl shadow-sm transition-transform group-hover:scale-110 flex-shrink-0`}>{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest m-0 mb-0.5 truncate">{item.label}</p>
                    <p className={`text-[13px] sm:text-[14px] font-extrabold m-0 truncate ${item.value === 'ไม่ได้ระบุ' ? 'text-slate-300' : 'text-slate-700'}`}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full h-px bg-slate-100 my-6 sm:my-8"></div>

            {/* Connection Status */}
            <div>
              <h3 className="text-base sm:text-[18px] font-black text-slate-800 mb-4 sm:mb-5">การแจ้งเตือน (LINE)</h3>
              {lineProfile ? (
                <div className="bg-[#00C300]/5 border border-[#00C300]/20 p-3 sm:p-4 rounded-2xl sm:rounded-[1.5rem] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="bg-[#00C300] p-2 sm:p-2.5 rounded-xl shadow-md shadow-emerald-500/20 flex-shrink-0"><svg viewBox="0 0 24 24" width="16" height="16" sm:width="18" sm:height="18" fill="white"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.938 8.91 9.388 9.62.367.082.868.256.996.584.115.294.074.755.035 1.053-.053.407-.246 1.488-.299 1.748-.087.419.412.632.748.441 3.585-2.036 9.539-5.617 11.83-9.351C23.633 12.923 24 11.666 24 10.304z"/></svg></div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-[13px] font-extrabold text-slate-800 m-0 leading-tight truncate">{lineProfile.displayName}</p>
                        <p className="text-[10px] sm:text-[11px] text-emerald-600 font-bold m-0 mt-0.5">เชื่อมต่อเรียบร้อย</p>
                      </div>
                    </div>
                    <CheckCircleOutlined className="text-emerald-500 text-lg sm:text-xl flex-shrink-0 ml-2" />
                  </div>
                  <Popconfirm title="ยกเลิกการเชื่อมต่อ LINE?" description="คุณจะไม่ได้รับการแจ้งเตือนผ่าน LINE อีกต่อไป" onConfirm={() => message.info('ระบบยกเลิกการเชื่อมต่อ (Mock)')} okText="ยืนยัน" okButtonProps={{ danger: true }} cancelText="ปิด">
                    <button className="w-full py-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl text-rose-500 text-[11px] sm:text-xs font-bold transition-colors flex items-center justify-center gap-1.5 mt-1 sm:mt-2"><DisconnectOutlined /> ยกเลิกการเชื่อมต่อ</button>
                  </Popconfirm>
                </div>
              ) : (
                <button onClick={handleLineAction} className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:border-[#00C300] hover:text-[#00C300] hover:bg-emerald-50/30 transition-all flex items-center justify-center gap-2"><LinkOutlined /> เปิดรับการแจ้งเตือน (LINE)</button>
              )}
            </div>
            
            <Popconfirm title="ออกจากระบบ" description="คุณต้องการออกจากระบบ ใช่หรือไม่?" onConfirm={handleSignOut} okText="ยืนยัน" cancelText="ยกเลิก" okButtonProps={{ danger: true, className: "rounded-xl font-bold" }} cancelButtonProps={{ className: "rounded-xl font-bold border-none bg-slate-100" }}>
              <button className="w-full mt-5 sm:mt-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-600 font-bold text-xs sm:text-[13px] hover:bg-rose-500 hover:text-white hover:shadow-md transition-all flex items-center justify-center gap-2"><LogoutOutlined /> Sign Out (ออกจากระบบ)</button>
            </Popconfirm>
          </div>
        </div>

        {/* Right Column: Stats & Activity */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[
              { label: "Permits", val: isLoadingTimeline ? <LoadingOutlined /> : myTimelineData.permits.length.toString(), icon: <FileTextOutlined />, color: "from-blue-600 to-indigo-600", shadow: "shadow-[0_16px_32px_rgba(37,99,235,0.2)]" },
              { label: "BBS Done", val: isLoadingTimeline ? <LoadingOutlined /> : myTimelineData.bbs.length.toString(), icon: <EyeOutlined />, color: "from-emerald-500 to-teal-600", shadow: "shadow-[0_16px_32px_rgba(16,185,129,0.2)]" },
              { label: "Certs", val: isLoadingTimeline ? <LoadingOutlined /> : myTimelineData.certs.length.toString(), icon: <SafetyCertificateOutlined />, color: "from-orange-400 to-rose-500", shadow: "shadow-[0_16px_32px_rgba(249,115,22,0.2)]" },
              { label: "E-Learn", val: isLoadingTimeline ? <LoadingOutlined /> : myTimelineData.elearning.length.toString(), icon: <ReadOutlined />, color: "from-purple-600 to-indigo-700", shadow: "shadow-[0_16px_32px_rgba(147,51,234,0.2)]" }
            ].map((stat, i) => (
              <div key={i} className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-gradient-to-br ${stat.color} ${stat.shadow} text-white transform transition-transform hover:-translate-y-1`}>
                <div className="bg-white/20 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 backdrop-blur-md shadow-inner text-lg sm:text-xl">{stat.icon}</div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-black mb-0.5 sm:mb-1 tracking-tight">{stat.val}</div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/80 truncate">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] min-h-[400px] sm:min-h-[500px] flex flex-col overflow-hidden border border-slate-50">
            {/* 📱 ปรับ Tab ให้เหมาะกับมือถือ */}
            <div className="flex p-2 sm:p-4 gap-2 bg-slate-50/50 border-b border-slate-100">
              <button onClick={() => setActiveTab('timeline')} className={`flex-1 py-2.5 sm:py-3.5 text-[11px] sm:text-[13px] font-extrabold uppercase tracking-wide transition-all rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 ${activeTab === 'timeline' ? 'bg-white text-[#2563eb] shadow-[0_4px_12px_rgba(0,0,0,0.04)]' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`}>
                <HistoryOutlined /> <span className="hidden xs:inline">ประวัติกิจกรรม</span><span className="xs:hidden">ประวัติ</span>
              </button>
              <button onClick={() => setActiveTab('settings')} className={`flex-1 py-2.5 sm:py-3.5 text-[11px] sm:text-[13px] font-extrabold uppercase tracking-wide transition-all rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 ${activeTab === 'settings' ? 'bg-white text-[#2563eb] shadow-[0_4px_12px_rgba(0,0,0,0.04)]' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`}>
                <SettingOutlined /> <span className="hidden xs:inline">การตั้งค่า</span><span className="xs:hidden">ตั้งค่า</span>
              </button>
            </div>

            <div className="p-4 sm:p-8 flex-1 overflow-y-auto max-h-[400px] sm:max-h-[600px] custom-scrollbar">
              {activeTab === 'timeline' ? (
                isLoadingTimeline ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-blue-500">
                     <Spin size="large" />
                     <p className="mt-4 font-bold text-slate-500 text-sm">กำลังโหลดประวัติกิจกรรม...</p>
                  </div>
                ) : timelineEvents.length > 0 ? (
                  <Timeline
                    className="mt-2 sm:mt-4 timeline-mobile-fix"
                    items={timelineEvents.map(event => ({
                      color: event.color,
                      dot: <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-${event.color}-50 text-${event.color}-500 flex items-center justify-center text-xs sm:text-sm shadow-sm border border-${event.color}-100`}>{event.icon}</div>,
                      children: (
                        <div className="ml-1 sm:ml-2 pb-5 sm:pb-6">
                          <p className="text-[10px] sm:text-xs font-bold text-slate-400 m-0 mb-1 sm:mb-1.5">{dayjs(event.time).format('DD MMM YYYY • HH:mm')}</p>
                          <div className="bg-slate-50 border border-slate-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:border-blue-200 transition-colors group">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 sm:gap-4">
                              <div className="min-w-0 w-full">
                                <h4 className="text-[13px] md:text-[15px] font-bold text-slate-800 m-0 group-hover:text-blue-600 transition-colors leading-tight truncate">{event.title}</h4>
                                <p className="text-[10px] md:text-xs text-slate-500 mt-1 sm:mt-1.5 m-0 flex items-center gap-1.5 truncate"><EnvironmentOutlined className="text-slate-400 flex-shrink-0" /> <span className="truncate">{event.detail}</span></p>
                              </div>
                              <Tag color={event.status === 'APPROVED' || event.status === 'SAFE' || event.status === 'CLOSED' ? 'success' : event.status === 'UNSAFE' || event.status === 'REJECTED' || event.status === 'REVOKED' ? 'error' : 'processing'} className="m-0 rounded-md sm:rounded-lg font-bold border-none px-2 py-0.5 sm:px-3 sm:py-1 flex-shrink-0 text-[10px] sm:text-xs self-start md:self-auto">
                                {event.status}
                              </Tag>
                            </div>
                          </div>
                        </div>
                      )
                    }))}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10 sm:py-12">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-inner"><HistoryOutlined className="text-3xl sm:text-4xl text-slate-300" /></div>
                    <h4 className="text-lg sm:text-xl font-black text-slate-800 m-0">ยังไม่มีประวัติกิจกรรม</h4>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm max-w-[250px] sm:max-w-[280px] mt-2 leading-relaxed">เมื่อคุณทำกิจกรรมในระบบ เช่น ขอใบอนุญาตทำงาน ประวัติจะแสดงที่นี่โดยอัตโนมัติ</p>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <button onClick={handleOpenMedicalModal} className="p-4 sm:p-6 bg-rose-50 hover:bg-rose-100 shadow-sm rounded-2xl sm:rounded-[2rem] border border-rose-100 flex items-center justify-between transition-all group text-left">
                    <div>
                      <h5 className="font-extrabold text-[13px] sm:text-[14px] text-rose-600 m-0">ข้อมูลการแพทย์ (Medical Info)</h5>
                      <p className="text-[10px] sm:text-[11px] text-rose-400 font-bold mt-1 m-0">อัปเดตกรุ๊ปเลือด และติดต่อฉุกเฉิน</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-rose-400 group-hover:text-rose-600 group-hover:scale-110 transition-all shadow-sm">
                      <MedicineBoxOutlined className="text-lg sm:text-xl" />
                    </div>
                  </button>

                  <button onClick={() => message.info('เมนูนี้กำลังอยู่ระหว่างการพัฒนา')} className="p-4 sm:p-6 bg-[#f8fafc] hover:bg-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-blue-100 rounded-2xl sm:rounded-[2rem] border border-transparent flex items-center justify-between transition-all group text-left">
                    <div>
                      <h5 className="font-extrabold text-[13px] sm:text-[14px] text-slate-800 m-0">เปลี่ยนรหัสผ่าน (Password)</h5>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold mt-1 m-0">อัปเดตรหัสผ่านเพื่อความปลอดภัย</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors shadow-sm"><EditOutlined /></div>
                  </button>

                  <button onClick={() => message.info('เมนูนี้กำลังอยู่ระหว่างการพัฒนา')} className="p-4 sm:p-6 bg-[#f8fafc] hover:bg-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-blue-100 rounded-2xl sm:rounded-[2rem] border border-transparent flex items-center justify-between transition-all group text-left">
                    <div>
                      <h5 className="font-extrabold text-[13px] sm:text-[14px] text-slate-800 m-0">การแจ้งเตือน (Notifications)</h5>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold mt-1 m-0">จัดการการแจ้งเตือนผ่าน LINE</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors shadow-sm"><CheckCircleOutlined /></div>
                  </button>

                  <button onClick={() => message.info('เมนูนี้กำลังอยู่ระหว่างการพัฒนา')} className="p-4 sm:p-6 bg-[#f8fafc] hover:bg-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-blue-100 rounded-2xl sm:rounded-[2rem] border border-transparent flex items-center justify-between transition-all group text-left">
                    <div>
                      <h5 className="font-extrabold text-[13px] sm:text-[14px] text-slate-800 m-0">ภาษา (Language)</h5>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold mt-1 m-0">สลับการแสดงผลภาษา ไทย / อังกฤษ</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors shadow-sm"><ArrowRightOutlined /></div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: แก้ไขข้อมูลส่วนตัวทั่วไป */}
      <Modal title={<div className="flex items-center gap-2 text-lg sm:text-xl font-black text-slate-800 pb-3 border-b border-slate-100"><EditOutlined className="text-blue-500" /> แก้ไขข้อมูลส่วนตัว</div>} open={isEditModalOpen} onCancel={() => setIsEditModalOpen(false)} footer={null} destroyOnClose centered className="custom-modern-modal">
        <div className="p-4 sm:p-6">
          <Form form={form} layout="vertical" onFinish={handleSaveProfile} requiredMark={false}>
            <Form.Item name="department" label={<span className="font-bold text-slate-700 text-xs sm:text-sm">แผนก / บริษัท (Department)</span>}><Input size="large" prefix={<ToolOutlined className="text-slate-400 mr-2" />} className="rounded-xl h-10 sm:h-12 text-sm" placeholder="เช่น ฝ่ายซ่อมบำรุง, บจก. เอบีซี" /></Form.Item>
            <Form.Item name="phone" label={<span className="font-bold text-slate-700 text-xs sm:text-sm">เบอร์โทรศัพท์ (Phone Number)</span>}><Input size="large" prefix={<PhoneOutlined className="text-slate-400 mr-2" />} className="rounded-xl h-10 sm:h-12 text-sm" placeholder="08x-xxx-xxxx" /></Form.Item>
            <Form.Item name="email" label={<span className="font-bold text-slate-700 text-xs sm:text-sm">อีเมลติดต่อ (Email)</span>} rules={[{ type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }]}><Input size="large" prefix={<MailOutlined className="text-slate-400 mr-2" />} className="rounded-xl h-10 sm:h-12 text-sm" placeholder="example@email.com" /></Form.Item>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8">
              <Button size="large" onClick={() => setIsEditModalOpen(false)} className="w-full sm:flex-1 rounded-xl font-bold bg-slate-100 border-none text-slate-600 hover:bg-slate-200">ยกเลิก</Button>
              <Button size="large" type="primary" htmlType="submit" loading={isSubmitting} className="w-full sm:flex-[2] rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-md">บันทึกการเปลี่ยนแปลง</Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Modal 2: แก้ไขข้อมูลทางการแพทย์ */}
      <Modal 
        title={
          <div className="flex items-center gap-2 text-lg sm:text-xl font-black text-rose-600 pb-3 border-b border-rose-100">
            <HeartOutlined /> ข้อมูลฉุกเฉินและการแพทย์
          </div>
        } 
        open={isMedicalModalOpen} 
        onCancel={() => setIsMedicalModalOpen(false)} 
        footer={null} 
        destroyOnClose 
        centered 
        className="custom-modern-modal"
      >
        <div className="p-4 sm:p-6">
          <div className="bg-rose-50 text-rose-600 p-3 rounded-xl mb-4 sm:mb-5 text-[11px] sm:text-xs font-bold border border-rose-100 flex items-start gap-2">
            <InfoCircleOutlined className="mt-0.5 flex-shrink-0" />
            <span>ข้อมูลส่วนนี้จะถูกนำไปแสดงด้านหลังบัตร E-Passport ของคุณ เพื่อความปลอดภัยในกรณีเกิดเหตุฉุกเฉิน</span>
          </div>

          <Form form={medicalForm} layout="vertical" onFinish={handleSaveMedicalInfo} requiredMark={false}>
            <Form.Item 
              name="blood_group" 
              label={<span className="font-bold text-slate-700 text-xs sm:text-sm">กรุ๊ปเลือด (Blood Group)</span>}
            >
              <Select size="large" className="h-10 sm:h-12" placeholder="เลือกกรุ๊ปเลือดของคุณ">
                <Option value="ไม่ระบุ">ไม่ระบุ</Option>
                <Option value="A">A</Option>
                <Option value="B">B</Option>
                <Option value="O">O</Option>
                <Option value="AB">AB</Option>
              </Select>
            </Form.Item>
            
            <Form.Item 
              name="medical_cond" 
              label={<span className="font-bold text-slate-700 text-xs sm:text-sm">โรคประจำตัว / การแพ้ยา</span>}
              tooltip="หากไม่มีให้ใส่คำว่า 'ไม่มี'"
            >
              <Input size="large" prefix={<MedicineBoxOutlined className="text-rose-400 mr-2" />} className="rounded-xl h-10 sm:h-12 text-sm" placeholder="เช่น หอบหืด, แพ้เพนิซิลลิน, ไม่มี" />
            </Form.Item>

            <Form.Item 
              name="emergency_contact" 
              label={<span className="font-bold text-slate-700 text-xs sm:text-sm">เบอร์โทรศัพท์ติดต่อฉุกเฉิน (ญาติ/ครอบครัว)</span>}
            >
              <Input size="large" prefix={<PhoneOutlined className="text-orange-400 mr-2" />} className="rounded-xl h-10 sm:h-12 text-sm" placeholder="08x-xxx-xxxx (เช่น เบอร์ภรรยา)" />
            </Form.Item>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8">
              <Button size="large" onClick={() => setIsMedicalModalOpen(false)} className="w-full sm:flex-1 rounded-xl font-bold bg-slate-100 border-none text-slate-600 hover:bg-slate-200">ยกเลิก</Button>
              <Button size="large" type="primary" htmlType="submit" loading={isSubmitting} className="w-full sm:flex-[2] rounded-xl font-bold bg-rose-500 hover:bg-rose-600 border-none shadow-md shadow-rose-500/30">
                บันทึกข้อมูลการแพทย์
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      <style>{`
        /* 📱 จัดการ Modal บนมือถือให้เต็มจอและโค้งมน */
        .custom-modern-modal .ant-modal-content { border-radius: 1.5rem !important; padding: 0 !important; overflow: hidden; }
        @media (min-width: 640px) {
          .custom-modern-modal .ant-modal-content { border-radius: 2rem !important; }
        }
        
        .ant-upload-wrapper { display: block; }
        
        /* สกอร์บาร์ที่ปรับให้เข้ากับมือถือ */
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        @media (min-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

        /* จัดหน้า Timeline สำหรับมือถือโดยเฉพาะ */
        @media (max-width: 639px) {
          .timeline-mobile-fix .ant-timeline-item-tail { left: 12px !important; }
          .timeline-mobile-fix .ant-timeline-item-head { left: 12px !important; }
          .timeline-mobile-fix .ant-timeline-item-content { margin-left: 28px !important; }
        }
      `}</style>
    </div>
  );
}