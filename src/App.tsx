import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import liff from '@line/liff';
import { useReactToPrint } from 'react-to-print';

// 🟢 ตั้งค่า Axios ให้แนบ Token ไปใน Header เสมอ
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('safetyos_token');
  if (token && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- Ant Design Components & Icons ---
import { Layout, Menu, Typography, Avatar, ConfigProvider, Space, Button, Drawer, Grid, Spin, Tabs, message, Modal } from 'antd';
import {
  DashboardOutlined, SafetyCertificateOutlined, UserOutlined, FileTextOutlined,
  BuildOutlined, EnvironmentOutlined, IdcardOutlined, AlertOutlined, ReadOutlined, QrcodeOutlined,
  EyeOutlined, LogoutOutlined, CheckCircleOutlined, MenuOutlined, ClockCircleOutlined,
  ToolOutlined, ScanOutlined, FormOutlined, FileAddOutlined, SafetyOutlined, 
  CloseOutlined, LockOutlined, StopOutlined, FireOutlined, ThunderboltOutlined,
} from '@ant-design/icons';

// --- Local Components ---
import WelcomeEmptyState from './components/common/WelcomeEmptyState';
import LoginScreen from './features/auth/LoginScreen';
import CreatePermitModal from './features/permits/CreatePermitModal';
import PermitDetailModal from './features/permits/PermitDetailModal';
import QRScanner from './components/QRScanner';
import UserProfile from './components/UserProfile';
import WorkPermitQueue from "./components/WorkPermitQueue";
import BBSHistory from "./components/BBSHistory";
import ConfinedSpaceBoard from "./components/ConfinedSpaceBoard";
import BBSObservationForm from "./components/BBSObservationForm";
import VerificationPage from './components/VerificationPage';
import EPassport from './components/EPassport';
import CertificateManager from './components/CertificateManager';
import IncidentReport from './components/IncidentReport';
import ELearning from './components/ELearning';
import EquipmentInspection from './components/EquipmentInspection';
import Dashboard from './components/Dashboard';

// --- Custom Hooks ---
import { supabase } from './supabase';
import { useAuth } from './hooks/useAuth';
import { usePermits } from './hooks/usePermits';
import { useBbs } from './hooks/useBbs';
import { useConfinedSpace } from './hooks/useConfinedSpace';

import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/th';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('th');
dayjs.tz.setDefault('Asia/Bangkok');

const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function App() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // 🟢 1. ดึงเมนูล่าสุดจาก localStorage เป็นค่าเริ่มต้น ถ้าไม่มีให้ใช้ 'DASHBOARD'
  const [activeMenu, setActiveMenu] = useState(() => {
    return localStorage.getItem('safetyos_active_menu') || 'DASHBOARD';
  });

  // 🟢 2. บันทึก activeMenu ลง localStorage ทุกครั้งที่เปลี่ยนหน้า
  useEffect(() => {
    localStorage.setItem('safetyos_active_menu', activeMenu);
  }, [activeMenu]);

  const [verifyUserId, setVerifyUserId] = useState<string | null>(null);
  const [activeBbsTab, setActiveBbsTab] = useState('form');

  const { isAuthenticated, isAuthChecking, isLoggingIn, lineProfile, currentUser, setCurrentUser, handleLogin, handleLineLoginSubmit, handleSSOLogin, handleLogout } = useAuth();
  
  const { permits, loading: permitsLoading, isSubmitting: isSubmittingPermit, fetchPermits, createPermit, updatePermitStatus, total, currentPage, pageSize, uploadToolboxPhoto } = usePermits(currentUser);
  
  const { bbsRecords, isSubmittingBbs, fetchBbs, handleCreateBbs } = useBbs(currentUser);
  const { activeConfinedPermits, selectedConfinedPermit, confinedEntries, setSelectedConfinedPermit, fetchConfinedSpaceData, fetchEntries, handleCheckIn, handleCheckOut, handleEvacuateAll } = useConfinedSpace(currentUser);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPermitDetail, setSelectedPermitDetail] = useState<any>(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyMessage, setEmergencyMsg] = useState('');
  const [gasLogsDetail, setGasLogsDetail] = useState<any[]>([]);

  const documentRef = useRef<HTMLDivElement>(null);

  const handleUpdateProfile = async (values: any) => {
    try {
      if (!currentUser?.id) return false;
      const response = await axios.put(`${API_URL}/users/${currentUser.id}/profile`, values);
      
      if (response.data.success) {
        if (setCurrentUser) {
           setCurrentUser({
             ...currentUser, 
             ...response.data.user 
           });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  };

  const handleUploadAvatar = async (file: File) => {
    try {
      if (!currentUser?.id) return null;

      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Supabase Upload Error:", uploadError);
        throw new Error('อัปโหลดรูปล้มเหลว');
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      const response = await axios.put(`${API_URL}/users/${currentUser.id}/profile`, {
        profile_url: publicUrl
      });
      
      if (response.data.success) {
        if (setCurrentUser) {
           setCurrentUser({
             ...currentUser,
             profile_url: publicUrl 
           });
        }
        return publicUrl; 
      }
      return null;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return null;
    }
  };

  useEffect(() => {
    const safetyChannel = supabase.channel('safety-alert-channel');
    safetyChannel
      .on('broadcast', { event: 'EMERGENCY_EVACUATE' }, (payload) => { setEmergencyMsg(payload.payload.message); setIsEmergency(true); })
      .on('broadcast', { event: 'CONFINED_SPACE_UPDATE' }, (payload) => { if (payload.payload.permit_id) fetchEntries(payload.payload.permit_id); })
      .subscribe();
    return () => { supabase.removeChannel(safetyChannel); };
  }, [fetchEntries]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeMenu === 'DASHBOARD' || activeMenu === 'E_PERMIT') fetchPermits(1, 10); 
    if (activeMenu === 'BBS') fetchBbs();
    if (activeMenu === 'CONFINED_SPACE') fetchConfinedSpaceData();
  }, [isAuthenticated, activeMenu, fetchPermits, fetchBbs, fetchConfinedSpaceData]);

  useEffect(() => {
    if (activeMenu === 'CONFINED_SPACE' && selectedConfinedPermit) {
      const interval = setInterval(() => { fetchEntries(selectedConfinedPermit); }, 60000);
      return () => clearInterval(interval);
    }
  }, [activeMenu, selectedConfinedPermit, fetchEntries]);

  const handlePrint = useReactToPrint({
    contentRef: documentRef,
    content: () => documentRef.current,
    documentTitle: `WorkPermit_${selectedPermitDetail?.permit_number || 'Export'}`,
    onAfterPrint: () => message.success('เตรียมไฟล์ PDF เรียบร้อย')
  });

  const getStatusDisplayModern = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-extrabold shadow-sm whitespace-nowrap backdrop-blur-md border";
    switch (status) {
      case 'PENDING_AREA_OWNER': return <span className={`${baseClasses} bg-amber-50/80 text-amber-700 border-amber-200/50`}><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>รอเจ้าของพื้นที่</span>;
      case 'PENDING_SAFETY': return <span className={`${baseClasses} bg-blue-50/80 text-blue-700 border-blue-200/50`}><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>รอ จป. อนุมัติ</span>;
      case 'APPROVED': return <span className={`${baseClasses} bg-emerald-50/80 text-emerald-700 border-emerald-200/50`}><CheckCircleOutlined className="animate-pulse" /> กำลังปฏิบัติงาน</span>;
      case 'REJECTED': return <span className={`${baseClasses} bg-rose-50/80 text-rose-700 border-rose-200/50`}><CloseOutlined /> ไม่อนุมัติ</span>;
      case 'CLOSED': return <span className={`${baseClasses} bg-slate-100/80 text-slate-600 border-slate-200/50`}><LockOutlined /> ปิดงานแล้ว</span>;
      case 'REVOKED': return <span className={`${baseClasses} bg-rose-600/90 text-white border-rose-500`}><StopOutlined /> ระงับงานฉุกเฉิน</span>;
      case 'EXPIRED': return <span className={`${baseClasses} bg-orange-50/80 text-orange-700 border-orange-200/50`}><ClockCircleOutlined /> ใบอนุญาตหมดอายุ</span>;
      default: return <span className={`${baseClasses} bg-slate-50/80 text-slate-600 border-slate-200/50`}>{status || 'PENDING'}</span>;
    }
  };

  const getPermitTypeDisplayModern = (type: string) => {
    const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black whitespace-nowrap shadow-sm backdrop-blur-md border";
    switch (type) {
      case 'HOT_WORK': return <span className={`${baseClasses} bg-orange-50/80 text-orange-700 border-orange-200/50`}><FireOutlined /> Hot Work</span>;
      case 'CONFINED_SPACE': return <span className={`${baseClasses} bg-purple-50/80 text-purple-700 border-purple-200/50`}><BuildOutlined /> Confined Space</span>;
      case 'WORKING_AT_HEIGHT': return <span className={`${baseClasses} bg-sky-50/80 text-sky-700 border-sky-200/50`}><EnvironmentOutlined /> Work at Height</span>;
      case 'ELECTRICAL': return <span className={`${baseClasses} bg-yellow-50/80 text-yellow-700 border-yellow-200/50`}><ThunderboltOutlined /> Electrical</span>;
      case 'EXCAVATION': return <span className={`${baseClasses} bg-amber-50/80 text-amber-900 border-amber-200/50`}><ToolOutlined /> Excavation</span>;
      default: return <span className={`${baseClasses} bg-blue-50/80 text-blue-700 border-blue-200/50`}><ToolOutlined /> Cold Work</span>;
    }
  };

  const handleViewDetails = async (record: any) => {
    if (!record) return;
    setSelectedPermitDetail(record);
    setIsDetailModalOpen(true);
    setGasLogsDetail([]); 
    if (record?.permit_type === 'HOT_WORK' || record?.permit_type === 'CONFINED_SPACE') {
      try { 
        if (record?.id) { 
          const res = await axios.get(`${API_URL}/permits/${record.id}/gas-logs`); 
          setGasLogsDetail(Array.isArray(res.data) ? res.data : []); 
        } 
      } catch (error) { 
        setGasLogsDetail([]); 
      }
    }
  };

  const getDisplayAvatar = () => currentUser?.profile_url || lineProfile?.pictureUrl || null;

  if (isAuthChecking) {
    return <ConfigProvider theme={{ token: { colorPrimary: '#2563eb' } }}><div className="h-screen w-full flex items-center justify-center bg-slate-50"><Spin size="large" /></div></ConfigProvider>;
  }

  if (verifyUserId) return <VerificationPage userId={verifyUserId} />;

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} onLineLogin={handleLineLoginSubmit} onSSOLogin={handleSSOLogin} isLoggingIn={isLoggingIn} lineProfile={lineProfile} />;
  }

  const sideMenuItems = [
    { type: 'group', label: <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Main Menu</span>, children: [
      { key: 'DASHBOARD', icon: <DashboardOutlined className="text-lg" />, label: <span className="font-bold">Dashboard</span>, className: "rounded-xl mb-1" },
      { key: 'PROFILE', icon: <UserOutlined className="text-lg" />, label: <span className="font-bold">My Profile</span>, className: "rounded-xl mb-1" },
      { key: 'E_PASSPORT', icon: <IdcardOutlined className="text-lg" />, label: <span className="font-bold">My E-Passport</span>, className: "rounded-xl mb-1" },
      { key: 'E_PERMIT', icon: <FileTextOutlined className="text-lg" />, label: <span className="font-bold">E-Permit (PTW)</span>, className: "rounded-xl mb-1" }
    ]},
    { type: 'divider' },
    { type: 'group', label: <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Safety Tools</span>, children: [
      { key: 'BBS', icon: <EyeOutlined className="text-lg" />, label: <span className="font-bold">BBS Observation</span>, className: "rounded-xl mb-1" },
      { key: 'CONFINED_SPACE', icon: <BuildOutlined className="text-lg" />, label: <span className="font-bold">Confined Space</span>, className: "rounded-xl mb-1" },
      { key: 'INCIDENT', icon: <AlertOutlined className="text-lg text-rose-500" />, label: <span className="font-bold text-rose-600">แจ้งจุดเสี่ยง (Incident)</span>, className: "rounded-xl mb-1 bg-rose-50/50 hover:bg-rose-100/80 transition-colors" }
    ]},
    { type: 'divider' },
    { type: 'group', label: <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Management</span>, children: [
      { key: 'CERTIFICATE', icon: <SafetyCertificateOutlined className="text-lg" />, label: <span className="font-bold">Certificates</span>, className: "rounded-xl mb-1" },
      { key: 'E_LEARNING', icon: <ReadOutlined className="text-lg" />, label: <span className="font-bold">E-Learning</span>, className: "rounded-xl mb-1" },
      { key: 'EQUIPMENT', icon: <QrcodeOutlined className="text-lg" />, label: <span className="font-bold">ตรวจอุปกรณ์ (QR)</span>, className: "rounded-xl mb-1" }
    ]}
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#2563eb', borderRadius: 12, fontFamily: "var(--font-system, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif)" } }}>
      <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
        
        <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-20%] left-[10%] w-[50%] h-[80%] bg-blue-200/40 rounded-full blur-[140px] mix-blend-multiply"></div>
          <div className="absolute top-[10%] right-[10%] w-[40%] h-[60%] bg-emerald-100/40 rounded-full blur-[120px] mix-blend-multiply"></div>
        </div>

        <Layout style={{ background: 'transparent' }}>
          {!isMobile && (
            <Sider width={280} style={{ background: 'transparent', position: 'fixed', left: 0, height: '100vh', zIndex: 100, padding: '20px 0 20px 20px' }} theme="light">
              <div className="bg-white/70 backdrop-blur-2xl h-full rounded-[2rem] border border-white shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden">
                <div className="p-6 flex items-center gap-3 border-b border-white/60">
                  <div className="bg-blue-600 p-2.5 rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.3)]"><SafetyOutlined className="text-xl text-white" /></div>
                  <Title level={4} className="m-0 !font-black !tracking-tight text-slate-800">Safety<span className="text-blue-600">OS</span></Title>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
                  <Menu mode="inline" selectedKeys={[activeMenu]} onClick={(e) => { setActiveMenu(e.key); setMobileMenuOpen(false); }} style={{ border: 'none', background: 'transparent' }} items={sideMenuItems} />
                </div>
              </div>
            </Sider>
          )}

          <Drawer title={<div className="flex items-center gap-3"><div className="bg-blue-600 p-2 rounded-xl"><SafetyOutlined className="text-white" /></div><Title level={4} className="m-0 !font-black text-slate-800">SafetyOS</Title></div>} placement="left" onClose={() => setMobileMenuOpen(false)} open={mobileMenuOpen} styles={{ body: { padding: '10px', background: '#f8fafc' }, header: { background: '#ffffff' } }}>
            <Menu mode="inline" selectedKeys={[activeMenu]} onClick={(e) => { setActiveMenu(e.key); setMobileMenuOpen(false); }} style={{ border: 'none', background: 'transparent' }} items={sideMenuItems} />
          </Drawer>

          <Layout style={{ marginLeft: isMobile ? 0 : 300, background: 'transparent', transition: 'all 0.3s ease-out', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            
            <Header className="bg-white/60 backdrop-blur-xl border border-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] z-50 flex items-center justify-between" style={{ margin: isMobile ? '0' : '20px 24px 0 0', padding: isMobile ? '0 16px' : '0 24px', height: '76px', borderRadius: isMobile ? '0' : '24px', position: 'sticky', top: isMobile ? 0 : 20 }}>
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {isMobile && <Button type="text" icon={<MenuOutlined className="text-xl" />} onClick={() => setMobileMenuOpen(true)} className="flex-shrink-0" />}
                <div className="min-w-0 flex flex-col justify-center h-full">
                  <h1 className="text-lg md:text-2xl font-black text-slate-800 m-0 truncate tracking-tight capitalize">{activeMenu.replace('_', ' ')}</h1>
                </div>
              </div>

              <Space size={isMobile ? 10 : 16} align="center" className="flex-shrink-0">
                <Button type="default" icon={<ScanOutlined />} size={isMobile ? "middle" : "large"} onClick={() => setIsScannerOpen(true)} className="font-bold border-white bg-white/60 hover:bg-white text-slate-700 shadow-sm" />
                {!isMobile && <div className="w-px h-8 bg-slate-200/50 mx-2"></div>}
                
                <div onClick={() => setActiveMenu('PROFILE')} className="bg-white/60 hover:bg-white backdrop-blur-md transition-colors duration-300 ease-out rounded-full border border-white shadow-sm p-1.5 flex items-center gap-3 pr-2 cursor-pointer max-w-[200px]">
                  <Avatar src={getDisplayAvatar()} size={isMobile ? "small" : "large"} className="border-2 border-white shadow-sm bg-blue-100 text-blue-600 shrink-0" icon={<UserOutlined />} />
                  {screens.lg && (
                    <div className="flex flex-col min-w-[80px] pr-2 leading-tight overflow-hidden">
                      <Text strong className="text-[13px] text-slate-800 truncate block">{currentUser?.full_name}</Text>
                      <Text className="text-[10px] text-blue-600 font-black uppercase tracking-widest truncate block">{currentUser?.role}</Text>
                    </div>
                  )}
                  <Button type="text" shape="circle" icon={<LogoutOutlined />} onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 shrink-0 transition-colors duration-300 ease-out" />
                </div>
                
                {activeMenu === 'E_PERMIT' && currentUser?.role === 'CONTRACTOR' && (
                  <Button type="primary" shape={isMobile || isTablet ? "circle" : "round"} icon={<FileAddOutlined />} size="large" onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 border-none font-bold px-6 ml-2 shadow-[0_4px_12px_rgba(37,99,235,0.3)] transition-all duration-300 ease-out">
                    {!isMobile && !isTablet && 'สร้างคำขอทำงาน'}
                  </Button>
                )}
              </Space>
            </Header>

            <Content className="flex-1 relative z-10" style={{ padding: isMobile ? '16px' : '24px 24px 32px 0' }}>
              <div className="animate-fade-in w-full max-w-[1400px] mx-auto">
                {activeMenu === 'DASHBOARD' && <Dashboard currentUser={currentUser} />}
                
                {activeMenu === 'PROFILE' && (
                  <UserProfile 
                    currentUser={currentUser} 
                    lineProfile={lineProfile} 
                    onUpdateProfile={handleUpdateProfile} 
                    onUploadAvatar={handleUploadAvatar}
                    onToggleLineConnection={handleLineLoginSubmit}
                    userTimelineData={{
                      permits: permits || [], 
                      bbs: bbsRecords || [],  
                      certs: [],              
                      elearning: []           
                    }}
                  />
                )}
                
                {activeMenu === 'E_PERMIT' && (
                  <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden p-2 md:p-6 min-h-[60vh] flex flex-col">
                    {!permitsLoading && (!permits || permits.length === 0) ? (
                      <div className="flex-1 flex items-center justify-center">
                        <WelcomeEmptyState title="เริ่มต้นสร้างคำขอทำงานใบแรก" description="ระบบ E-Permit พร้อมใช้งานแล้ว" buttonText="สร้างคำขอทำงาน" icon={<FileTextOutlined />} onAction={() => setIsModalOpen(true)} />
                      </div>
                    ) : (
                      <WorkPermitQueue 
                        permits={permits || []} 
                        loading={permitsLoading} 
                        currentUser={currentUser} 
                        onPreviewFile={(url: string) => { setPreviewUrl(url); setIsPreviewOpen(true); }} 
                        onViewDetails={handleViewDetails} 
                        onUpdateStatus={updatePermitStatus}
                        pagination={{ current: currentPage, pageSize: pageSize, total: total }}
                        onChangePage={(page: number, limit: number) => fetchPermits(page, limit)}
                        uploadToolboxPhoto={uploadToolboxPhoto} 
                      />
                    )}
                  </div>
                )}
                
                {activeMenu === 'E_PASSPORT' && <EPassport currentUser={currentUser} lineProfile={lineProfile} />}
                
                {activeMenu === 'BBS' && (
                  <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden">
                    <Tabs activeKey={activeBbsTab} onChange={setActiveBbsTab} centered size="large" items={[
                      { key: 'form', label: <span className="font-bold px-4"><FormOutlined /> สร้างรายงาน BBS</span>, children: <div className="p-4 md:p-8 pt-0"><BBSObservationForm onSubmit={(vals) => handleCreateBbs(vals, () => setActiveBbsTab('history'))} onCancel={() => setActiveMenu('DASHBOARD')} isSubmitting={isSubmittingBbs} /></div> }, 
                      { key: 'history', label: <span className="font-bold px-4"><EyeOutlined /> ประวัติรายงาน</span>, children: (<div className="p-4 md:p-8 pt-0 min-h-[50vh] flex flex-col">{(!bbsRecords || bbsRecords.length === 0) ? (<div className="flex-1 flex items-center justify-center"><WelcomeEmptyState title="ยังไม่มีประวัติ" description="เริ่มต้นรายงานความปลอดภัย" buttonText="สร้างรายงาน BBS" icon={<EyeOutlined />} onAction={() => setActiveBbsTab('form')} /></div>) : (<BBSHistory records={bbsRecords} />)}</div>) }
                    ]} />
                  </div>
                )}
                
                {activeMenu === 'CONFINED_SPACE' && <ConfinedSpaceBoard activePermits={activeConfinedPermits} selectedPermit={selectedConfinedPermit} onSelectPermit={setSelectedConfinedPermit} entries={confinedEntries} onCheckIn={handleCheckIn} onCheckOut={handleCheckOut} onEvacuate={handleEvacuateAll} currentUser={currentUser} isMobile={isMobile} onRefresh={fetchConfinedSpaceData} glassPanel={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(24px)', borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.03)' }} />}
                {activeMenu === 'CERTIFICATE' && <CertificateManager currentUser={currentUser} />}
                {activeMenu === 'INCIDENT' && <IncidentReport currentUser={currentUser} />}
                {activeMenu === 'E_LEARNING' && <ELearning currentUser={currentUser} />}
                {activeMenu === 'EQUIPMENT' && <EquipmentInspection currentUser={currentUser} />} 
              </div>
            </Content>
          </Layout>

          <PermitDetailModal open={isDetailModalOpen} onCancel={() => setIsDetailModalOpen(false)} permit={selectedPermitDetail} gasLogs={gasLogsDetail} documentRef={documentRef} onPrint={handlePrint} getStatusDisplay={getStatusDisplayModern} getPermitTypeDisplay={getPermitTypeDisplayModern} onUpdateStatus={updatePermitStatus} currentUser={currentUser} />
          
          <CreatePermitModal open={isModalOpen} onCancel={() => setIsModalOpen(false)} onSubmit={async (values, files) => { const success = await createPermit(values, files); if (success) setIsModalOpen(false); }} isSubmitting={isSubmittingPermit} />
          
          <Modal title={<span className="font-black text-slate-800">เอกสารแนบ</span>} open={isPreviewOpen} destroyOnClose={true} onCancel={() => setIsPreviewOpen(false)} width={850} footer={null} centered>
            <div className="h-[75vh] bg-slate-50/80 backdrop-blur-xl rounded-2xl overflow-hidden mt-4 border border-slate-200"><img src={previewUrl} className="w-full h-full object-contain" alt="Preview" /></div>
          </Modal>

          {isScannerOpen && <QRScanner visible={isScannerOpen} onClose={() => setIsScannerOpen(false)} />}
        </Layout>
      </div>
    </ConfigProvider>
  );
}