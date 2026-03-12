import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Layout, Menu, Typography, Card, Row, Col, 
  Avatar, ConfigProvider, Space, Button, Modal, 
  Form, Input, Select, message, Badge, Upload, 
  InputNumber, Drawer, Grid, Spin, Tabs, Divider
} from 'antd';
import { 
  DashboardOutlined, SafetyCertificateOutlined, WarningOutlined,
  UserOutlined, FileTextOutlined, PlusOutlined, CheckOutlined, 
  CloseOutlined, BuildOutlined, EnvironmentOutlined, UploadOutlined,
  IdcardOutlined, AlertOutlined, ReadOutlined, QrcodeOutlined, BellOutlined,
  EyeOutlined, FilePdfOutlined, LogoutOutlined, CheckCircleOutlined, 
  MenuOutlined, RocketOutlined, CalendarOutlined, ClockCircleOutlined, 
  ToolOutlined, HourglassOutlined, InfoCircleOutlined, AppstoreAddOutlined, ScanOutlined, FormOutlined, 
  FileAddOutlined, PhoneOutlined, SafetyOutlined, LockOutlined
} from '@ant-design/icons';
import QRScanner from './components/QRScanner';
import dayjs from 'dayjs';
import liff from '@line/liff'; 
import { useReactToPrint } from 'react-to-print';

// 🟢 ท่าไม้ตาย! Import รูปเข้ามาตรงๆ จากโฟลเดอร์ src 
// (ถ้าไฟล์ชื่ออื่น หรือนามสกุลอื่น เช่น .png ให้แก้ตรงนี้ได้เลยนะครับ)
import logoImg from './test.svg';

// --- Components ---
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
import { supabase } from './supabase'; 

// --- Configs ---
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/th';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('th');
dayjs.tz.setDefault('Asia/Bangkok');

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid; 

// ==========================================
// 🎨 UTILITY COMPONENTS
// ==========================================
const ModernDateRange = ({ value, onChange }: any) => {
  const onStartChange = (e: React.ChangeEvent<HTMLInputElement>) => { onChange([e.target.value ? dayjs(e.target.value) : null, value?.[1]]); };
  const onEndChange = (e: React.ChangeEvent<HTMLInputElement>) => { onChange([value?.[0], e.target.value ? dayjs(e.target.value) : null]); };
  const toNativeFormat = (date: any) => date ? date.format('YYYY-MM-DDTHH:mm') : '';
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white p-3 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-center">
        <label className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-wide mb-1"><CalendarOutlined className="mr-1"/> เวลาเริ่มงาน</label>
        <input type="datetime-local" className="w-full bg-transparent outline-none text-slate-800 font-bold text-sm md:text-base py-1" value={toNativeFormat(value?.[0])} onChange={onStartChange} />
      </div>
      <div className="bg-white p-3 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-center">
        <label className="text-[10px] md:text-xs font-bold text-red-500 uppercase tracking-wide mb-1"><ClockCircleOutlined className="mr-1"/> เวลาสิ้นสุด</label>
        <input type="datetime-local" className="w-full bg-transparent outline-none text-slate-800 font-bold text-sm md:text-base py-1" value={toNativeFormat(value?.[1])} onChange={onEndChange} />
      </div>
    </div>
  );
};

const ModernToggleChips = ({ value = [], onChange, options, activeColor = "bg-blue-600 text-white" }: any) => {
  const toggle = (val: string) => { onChange(value.includes(val) ? value.filter((v: string) => v !== val) : [...value, val]); };
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {options.map((opt: any) => {
        const isSelected = value.includes(opt.value);
        return (
          <div key={opt.value} onClick={() => toggle(opt.value)} className={`cursor-pointer px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 select-none border shadow-sm ${isSelected ? `${activeColor} border-transparent scale-105` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
            {isSelected ? <CheckCircleOutlined /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div>} {opt.label}
          </div>
        );
      })}
    </div>
  );
};

const getStatusDisplayModern = (status: string) => { 
  switch(status) { 
    case 'PENDING_AREA_OWNER': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200 shadow-sm whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>รอเจ้าของพื้นที่</span>; 
    case 'PENDING_SAFETY': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 shadow-sm whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>รอ จป. อนุมัติ</span>; 
    case 'APPROVED': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm whitespace-nowrap"><CheckCircleOutlined /> อนุมัติแล้ว</span>; 
    case 'REJECTED': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 shadow-sm whitespace-nowrap"><CloseOutlined /> ไม่อนุมัติ</span>; 
    default: return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-sm whitespace-nowrap">{status}</span>; 
  } 
};

// ==========================================
// 🚀 MAIN COMPONENT
// ==========================================
export default function App() {
  const screens = useBreakpoint(); 
  const isMobile = !screens.md; 
  const isTablet = screens.md && !screens.lg;

  // --- 1. STATES ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true); 
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [lineProfile, setLineProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null); 

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); 
  const [activeMenu, setActiveMenu] = useState('DASHBOARD'); 
  const [verifyUserId, setVerifyUserId] = useState<string | null>(null);
  
  const [realPermits, setRealPermits] = useState<any[]>([]); 
  const [users, setUsers] = useState<any[]>([]);
  const [bbsRecords, setBbsRecords] = useState<any[]>([]);
  const [activeConfinedPermits, setActiveConfinedPermits] = useState<any[]>([]);
  const [selectedConfinedPermit, setSelectedConfinedPermit] = useState<string | null>(null);
  const [confinedEntries, setConfinedEntries] = useState<any[]>([]);
  const [gasLogsDetail, setGasLogsDetail] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [isSubmittingBbs, setIsSubmittingBbs] = useState(false); 
  const [activeBbsTab, setActiveBbsTab] = useState('form'); 
  const [fileList, setFileList] = useState<any[]>([]); 
  const [selectedPermitTypeForm, setSelectedPermitTypeForm] = useState<string>('');
  const [isScannerOpen, setIsScannerOpen] = useState(false); 
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewType, setPreviewType] = useState('pdf');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPermitDetail, setSelectedPermitDetail] = useState<any>(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyMessage, setEmergencyMsg] = useState('');

  const [form] = Form.useForm();
  const [loginForm] = Form.useForm(); 
  const documentRef = useRef<HTMLDivElement>(null);

  // --- 2. EFFECTS ---
  const handlePrint = useReactToPrint({
    contentRef: documentRef, 
    documentTitle: `WorkPermit_${selectedPermitDetail?.permit_number || 'Export'}`,
    onBeforeGetContent: () => {
      if (liff.isInClient()) {
        message.warning('⚠️ แอป LINE ไม่รองรับการเซฟไฟล์ ให้เปิดใน Browser เพื่อเซฟ PDF', 8);
      }
      return Promise.resolve();
    },
    onAfterPrint: () => message.success('เตรียมไฟล์ PDF เรียบร้อย')
  });

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const targetPage = queryParams.get('page');
    if (targetPage && ['DASHBOARD', 'E_PASSPORT', 'E_PERMIT', 'BBS', 'CONFINED_SPACE', 'CERTIFICATE', 'INCIDENT', 'E_LEARNING', 'EQUIPMENT'].includes(targetPage)) {
      setActiveMenu(targetPage);
    }
    const path = window.location.pathname;
    if (path.startsWith('/verify/')) setVerifyUserId(path.split('/verify/')[2]); 
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        let profile = null;
        await liff.init({ liffId: '2009277207-jNY8QghJ' }); 

        if (liff.isLoggedIn()) {
          profile = await liff.getProfile();
          setLineProfile(profile);
        }

        const savedUserStr = localStorage.getItem('safetyos_user');
        
        if (profile) {
          try {
            const res = await axios.post('https://safetyos-backend.onrender.com/login/line', { 
              line_id: profile.userId, picture_url: profile.pictureUrl, display_name: profile.displayName 
            });
            localStorage.setItem('safetyos_user', JSON.stringify(res.data.user));
            setCurrentUser(res.data.user);
            setIsAuthenticated(true);
          } catch (e) {
            if (savedUserStr) {
              try { setCurrentUser(JSON.parse(savedUserStr)); setIsAuthenticated(true); } catch(err) {}
            }
          }
        } else if (savedUserStr) {
          try { setCurrentUser(JSON.parse(savedUserStr)); setIsAuthenticated(true); } 
          catch (e) { localStorage.removeItem('safetyos_user'); }
        }
      } catch (err) {
        console.log("LIFF Init Failed", err);
      } finally {
        setIsAuthChecking(false);
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    const safetyChannel = supabase.channel('safety-alert-channel');
    safetyChannel
      .on('broadcast', { event: 'EMERGENCY_EVACUATE' }, (payload) => {
        setEmergencyMsg(payload.payload.message);
        setIsEmergency(true);
      })
      .on('broadcast', { event: 'CONFINED_SPACE_UPDATE' }, (payload) => {
        if (payload.payload.permit_id) fetchEntries(payload.payload.permit_id);
      })
      .subscribe();

    return () => { supabase.removeChannel(safetyChannel); };
  }, []);

  const fetchUsers = async () => { try { const res = await axios.get('https://safetyos-backend.onrender.com/users'); setUsers(res.data); } catch (error) {} };
  const fetchPermits = async () => { setLoading(true); try { const response = await axios.get('https://safetyos-backend.onrender.com/permits'); setRealPermits(response.data); } catch (error) {} finally { setLoading(false); } };
  const fetchBbs = async () => { try { const res = await axios.get('https://safetyos-backend.onrender.com/bbs'); setBbsRecords(res.data); } catch (error) {} };
  const fetchConfinedSpaceData = async () => { try { const res = await axios.get('https://safetyos-backend.onrender.com/confined-space/active-permits'); setActiveConfinedPermits(res.data); if (res.data.length > 0 && !selectedConfinedPermit) { setSelectedConfinedPermit(res.data[0].id); fetchEntries(res.data[0].id); } } catch (error) {} };
  const fetchEntries = async (permitId: string) => { try { const res = await axios.get(`https://safetyos-backend.onrender.com/confined-space/${permitId}/entries`); setConfinedEntries(res.data); } catch (error) {} };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { if (isAuthenticated && (activeMenu === 'DASHBOARD' || activeMenu === 'E_PERMIT')) fetchPermits(); }, [isAuthenticated, activeMenu]);
  useEffect(() => { if (isAuthenticated && activeMenu === 'BBS') fetchBbs(); }, [isAuthenticated, activeMenu]);
  useEffect(() => { if (isAuthenticated && activeMenu === 'CONFINED_SPACE') fetchConfinedSpaceData(); }, [isAuthenticated, activeMenu]);
  useEffect(() => {
    if (activeMenu === 'CONFINED_SPACE' && selectedConfinedPermit) {
      fetchEntries(selectedConfinedPermit);
      const interval = setInterval(() => { fetchEntries(selectedConfinedPermit); }, 60000); 
      return () => clearInterval(interval);
    }
  }, [activeMenu, selectedConfinedPermit]);

  // --- 3. HANDLERS ---
  const handleLogin = async (values: any) => {
    setIsLoggingIn(true);
    try {
      const payload = { ...values, line_id: lineProfile ? lineProfile.userId : null, picture_url: lineProfile ? lineProfile.pictureUrl : null };
      const response = await axios.post('https://safetyos-backend.onrender.com/login', payload);
      localStorage.setItem('safetyos_user', JSON.stringify(response.data.user));
      setCurrentUser(response.data.user); 
      setIsAuthenticated(true); 
      message.success(`ยินดีต้อนรับคุณ ${response.data.user.full_name}`);
    } catch (error: any) { 
      message.error(error.response?.data?.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'); 
    } finally { setIsLoggingIn(false); }
  };

  const handleLineLoginSubmit = async () => {
    if (liff.isInClient() && lineProfile) {
      setIsLoggingIn(true);
      try {
        const res = await axios.post('https://safetyos-backend.onrender.com/login/line', { 
          line_id: lineProfile.userId, picture_url: lineProfile.pictureUrl, display_name: lineProfile.displayName
        });
        localStorage.setItem('safetyos_user', JSON.stringify(res.data.user));
        setCurrentUser(res.data.user);
        setIsAuthenticated(true);
        message.success(res.data.isNew ? `🎉 ลงทะเบียนผู้รับเหมาสำเร็จ` : `เข้าสู่ระบบสำเร็จ`);
      } catch (error: any) { message.error('เข้าสู่ระบบไม่สำเร็จ'); } finally { setIsLoggingIn(false); }
    } else {
      liff.login(); 
    }
  };

  const handleSSOLogin = () => {
    Modal.info({
      title: 'Microsoft Entra ID (SSO)',
      content: 'ในการใช้งานจริง เมื่อคลิกปุ่มนี้ ระบบจะพาพนักงานไปยังหน้าจอ Login ขององค์กร (SCG Microsoft 365) ครับ',
      okText: 'รับทราบ',
      centered: true
    });
  };

  const handleLogout = () => { 
    localStorage.removeItem('safetyos_user');
    setIsAuthenticated(false); 
    setCurrentUser(null); 
    if (liff.isLoggedIn()) liff.logout(); 
    message.info('ออกจากระบบเรียบร้อย'); 
  };

  const handleCreateBbs = async (values: any) => {
    setIsSubmittingBbs(true);
    try {
      let fileUrl = null;
      if (values.photos && values.photos.length > 0) { 
        const file = values.photos[0].originFileObj; 
        const uniqueName = `bbs-${Date.now()}-${file.name.split('.').pop()}`; 
        const { error } = await supabase.storage.from('permits').upload(uniqueName, file); 
        if (!error) {
          const { data } = supabase.storage.from('permits').getPublicUrl(uniqueName); 
          fileUrl = data.publicUrl; 
        }
      }
      const formattedValues = {
        ...values, date: values.date ? values.date.toISOString() : new Date().toISOString(),
        observer_id: currentUser.id, image_url: fileUrl
      };
      await axios.post('https://safetyos-backend.onrender.com/bbs', formattedValues);
      message.success('บันทึกข้อมูล BBS สำเร็จ!'); 
      fetchBbs(); setActiveBbsTab('history'); 
    } catch (error: any) { message.error(`บันทึกไม่สำเร็จ`); } finally { setIsSubmittingBbs(false); }
  };

  const handleCheckIn = async (values: any) => { 
    try { 
      await axios.post('https://safetyos-backend.onrender.com/confined-space/in', { ...values, permit_id: selectedConfinedPermit }); 
      fetchEntries(selectedConfinedPermit!); 
      await supabase.channel('safety-alert-channel').send({ type: 'broadcast', event: 'CONFINED_SPACE_UPDATE', payload: { permit_id: selectedConfinedPermit } });
    } catch (error) {} 
  };

  const handleCheckOut = async (entryId: string) => { 
    try { 
      await axios.put(`https://safetyos-backend.onrender.com/confined-space/out/${entryId}`); 
      fetchEntries(selectedConfinedPermit!); 
      await supabase.channel('safety-alert-channel').send({ type: 'broadcast', event: 'CONFINED_SPACE_UPDATE', payload: { permit_id: selectedConfinedPermit } });
    } catch (error) {} 
  };

  const handleEvacuateAll = async () => { 
    try { 
      await axios.post('https://safetyos-backend.onrender.com/confined-space/evacuate', { permit_id: selectedConfinedPermit, triggered_by: currentUser.full_name }); 
      fetchEntries(selectedConfinedPermit!); 
      await supabase.channel('safety-alert-channel').send({ type: 'broadcast', event: 'EMERGENCY_EVACUATE', payload: { message: `สั่งอพยพโดย: ${currentUser.full_name}` } });
    } catch (error) {} 
  };

  const handlePreviewFile = (url: string) => { setPreviewUrl(url); setPreviewType(url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? 'image' : 'pdf'); setIsPreviewOpen(true); };
  
  const handleViewDetails = async (record: any) => { 
    setSelectedPermitDetail(record); setIsDetailModalOpen(true); 
    if (record.permit_type === 'HOT_WORK' || record.permit_type === 'CONFINED_SPACE') {
      try { const res = await axios.get(`https://safetyos-backend.onrender.com/permits/${record.id}/gas-logs`); setGasLogsDetail(res.data); } catch (error) {}
    }
  };

  const handleCreatePermit = async (values: any) => {
    try {
      if (!currentUser) return;
      if (fileList.length === 0) return message.error('⚠️ กรุณาแนบเอกสาร JSA');
      setIsSubmitting(true); 
      let fileUrl = null, fileNameToSave = null;
      if (fileList.length > 0) { 
        const file = fileList[0].originFileObj; 
        const uniqueName = `${Date.now()}.${file.name.split('.').pop()}`; 
        const { error } = await supabase.storage.from('permits').upload(uniqueName, file); 
        if (error) throw error;
        const { data } = supabase.storage.from('permits').getPublicUrl(uniqueName); 
        fileUrl = data.publicUrl; fileNameToSave = file.name; 
      }
      const payload = { 
        ...values, start_time: dayjs(values.timeRange[0]).toISOString(), end_time: dayjs(values.timeRange[1]).toISOString(),
        applicant_id: currentUser.id, attachment_url: fileUrl, attachment_name: fileNameToSave
      };
      await axios.post('https://safetyos-backend.onrender.com/permits', payload);
      message.success('ส่งคำขอสำเร็จ!'); setIsModalOpen(false); form.resetFields(); setFileList([]); fetchPermits();
    } catch (error: any) { message.error(`ผิดพลาด`); } finally { setIsSubmitting(false); }
  };

  const handleUpdateStatus = async (permitId: string, currentStatus: string, action: 'APPROVE' | 'REJECT' | 'CLOSE' | 'REVOKE') => {
    try { 
      let nextStatus = action === 'REJECT' ? 'REJECTED' : action === 'CLOSE' ? 'CLOSED' : action === 'REVOKE' ? 'REVOKED' : (currentStatus === 'PENDING_AREA_OWNER' ? 'PENDING_SAFETY' : 'APPROVED');
      await axios.put(`https://safetyos-backend.onrender.com/permits/${permitId}`, { status: nextStatus, approver_id: currentUser.id }); 
      fetchPermits(); message.success(`ดำเนินการ ${action} เรียบร้อย`);
    } catch (error) {}
  };

  const handleOpenScannerClick = async () => {
    if (liff.isInClient() && liff.scanCodeV2) {
      try {
        const result = await liff.scanCodeV2(); 
        if (result?.value?.includes('/verify/')) setVerifyUserId(result.value.split('/verify/')[1]); 
      } catch (error) { setIsScannerOpen(true); }
    } else setIsScannerOpen(true);
  };

  const getDisplayAvatar = () => lineProfile?.pictureUrl || currentUser?.profile_url || null;

  // --- 4. RENDER VIEWS ---

  if (isAuthChecking) return ( <ConfigProvider theme={{ token: { colorPrimary: '#2563eb' }}}> <div className="h-screen w-full flex items-center justify-center bg-slate-50"> <Spin size="large" /> </div> </ConfigProvider> );
  if (verifyUserId) return <VerificationPage userId={verifyUserId} />;

  // 🎬 LOGIN VIEW (✨ PURE CSS MESH GRADIENT WITH ORGANIC SHAPE)
  if (!isAuthenticated) {
    return (
      <ConfigProvider theme={{ token: { colorPrimary: '#2563eb', fontFamily: "'Prompt', sans-serif" }}}>
        {/* พื้นหลังนอกสุดสีเทาอ่อนสะอาดตา */}
        <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f4f8] p-4 sm:p-8">
          
          {/* กล่องหลักขอบมนใหญ่ๆ */}
          <div className="w-full max-w-[1000px] bg-white rounded-[2rem] md:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col md:flex-row overflow-hidden relative">
            
            {/* 🎨 ฝั่งซ้าย: Pure CSS Radial Gradient (การันตีขึ้นแน่นอน 100% ไม่มีทางจอขาว) */}
            <div 
              className="w-full md:w-1/2 min-h-[350px] md:min-h-[600px] relative flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-slate-100"
              style={{
                backgroundColor: '#ffffff',
                backgroundImage: `
                  radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.45) 0%, transparent 60%),
                  radial-gradient(circle at 90% 10%, rgba(16, 185, 129, 0.35) 0%, transparent 60%),
                  radial-gradient(circle at 10% 90%, rgba(244, 63, 94, 0.35) 0%, transparent 60%),
                  radial-gradient(circle at 90% 90%, rgba(234, 179, 8, 0.35) 0%, transparent 60%)
                `
              }}
            >
               {/* 🌿 รอยบากกั้นขอบ Organic Shape Divider (SVG แท้) โค้งรับฝั่งขวา */}
               <svg className="hidden md:block absolute right-0 top-0 h-full w-[80px] text-white z-10 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100" fill="currentColor">
                 <path d="M100,0 L100,100 L0,100 C 60,70 40,30 0,0 Z" />
               </svg>
               <svg className="md:hidden absolute bottom-[-1px] left-0 w-full h-[40px] text-white z-10 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100" fill="currentColor">
                 <path d="M0,100 L100,100 L100,0 C 70,60 30,40 0,0 Z" />
               </svg>

               {/* 🪟 กล่องกระจกใสตรงกลาง (Glassmorphism Card) */}
               <div className="z-20 flex flex-col items-center justify-center rounded-[2rem] w-[240px] h-[240px] p-6 text-center border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-transform hover:scale-105 duration-300" 
                    style={{ background: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
                  <div className="bg-white p-3.5 rounded-2xl shadow-sm mb-4 flex items-center justify-center">
                    {/* 🟢 เรียกไฟล์ด้วยตัวแปร logoImg ที่ import ไว้ด้านบน */}
                    <img src={logoImg} alt="SafetyOS" className="w-14 h-14 object-contain" />
                  </div>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight m-0 drop-shadow-sm">Safety<span className="text-[#2563eb]">OS</span></h1>
                  <p className="text-slate-600 font-bold mt-1 tracking-widest uppercase text-[10px]">Enterprise Gateway</p>
               </div>
            </div>

            {/* 🔐 ฝั่งขวา: ฟอร์มล็อกอิน (ปรับปรุง Label ให้สวยเหมือนรูปเป๊ะ) */}
            <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white z-20 relative">
               <div className="w-full max-w-[340px] mx-auto text-left">
                  
                  <h2 className="text-[32px] sm:text-[36px] font-black text-slate-800 mb-1 tracking-tight">Welcome Back</h2>
                  <p className="text-slate-500 font-medium text-sm mb-8">Log in to proceed.</p>

                  {/* ฟอร์มกรอกรหัส (แก้ Label หนาและเอาคำใบ้ออกตามแบบ) */}
                  <Form form={loginForm} layout="vertical" onFinish={handleLogin} requiredMark={false} className="mb-0 custom-login-form">
                    <Form.Item 
                      name="username" 
                      label={<span className="text-[13px] text-slate-800 font-extrabold tracking-wide">Login, email or phone number</span>} 
                      rules={[{ required: true, message: 'Please input your username!' }]} 
                      className="mb-5"
                    >
                      <Input 
                        size="large" 
                        prefix={<UserOutlined className="text-slate-400 text-lg mr-2" />}
                        className="rounded-[1rem] h-[54px] px-5 border-slate-200 hover:border-blue-400 focus:border-blue-500 text-base shadow-sm bg-[#f8fafc] focus:bg-white transition-colors" 
                      />
                    </Form.Item>
                    
                    <Form.Item 
                      name="password" 
                      label={<span className="text-[13px] text-slate-800 font-extrabold tracking-wide">Password</span>} 
                      rules={[{ required: true, message: 'Please input your password!' }]} 
                      className="mb-2"
                    >
                      <Input.Password 
                        size="large" 
                        prefix={<LockOutlined className="text-slate-400 text-lg mr-2" />}
                        className="rounded-[1rem] h-[54px] px-5 border-slate-200 hover:border-blue-400 focus:border-blue-500 text-base shadow-sm bg-[#f8fafc] focus:bg-white transition-colors" 
                      />
                    </Form.Item>

                    <div className="text-right mb-6">
                       <a href="#" onClick={(e) => { e.preventDefault(); message.info('กรุณาติดต่อ IT Support เพื่อรีเซ็ตรหัสผ่าน'); }} className="text-slate-400 hover:text-blue-600 text-[11px] font-bold transition-colors">Forgot login or password?</a>
                    </div>
                    
                    <Button htmlType="submit" loading={isLoggingIn} className="w-full h-[54px] rounded-[1rem] font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] border-none text-[16px] shadow-[0_8px_20px_-6px_rgba(37,99,235,0.5)] transition-all active:scale-[0.98]">
                      Log in
                    </Button>
                  </Form>

                  {/* เส้นกั้น or log in with */}
                  <Divider plain className="my-8 text-slate-400 text-xs font-medium border-slate-100">or log in with</Divider>

                  {/* ปุ่ม 2 อันล่าง (LINE & SSO) ปรับให้เหมือนในรูปเป๊ะ */}
                  <div className="grid grid-cols-2 gap-4">
                     <Button 
                       size="large"
                       onClick={handleLineLoginSubmit}
                       className="h-[52px] rounded-[1rem] font-bold text-slate-700 border border-slate-200 hover:border-[#00C300] hover:text-[#00C300] bg-white flex items-center justify-center gap-2 transition-all shadow-sm group"
                     >
                       <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="group-hover:scale-110 transition-transform"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.938 8.91 9.388 9.62.367.082.868.256.996.584.115.294.074.755.035 1.053-.053.407-.246 1.488-.299 1.748-.087.419.412.632.748.441 3.585-2.036 9.539-5.617 11.83-9.351C23.633 12.923 24 11.666 24 10.304z"/></svg>
                       LINE
                     </Button>

                     <Button 
                       size="large"
                       onClick={handleSSOLogin}
                       className="h-[52px] rounded-[1rem] font-bold text-slate-700 border border-slate-200 hover:border-[#00a4ef] hover:bg-slate-50 bg-white flex items-center justify-center gap-2 transition-all shadow-sm group"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform"><path fill="#f25022" d="M11.4 11.4H0V0h11.4v11.4z"/><path fill="#7fba00" d="M24 11.4H12.6V0H24v11.4z"/><path fill="#00a4ef" d="M11.4 24H0V12.6h11.4V24z"/><path fill="#ffb900" d="M24 24H12.6V12.6H24V24z"/></svg>
                       SCG SSO
                     </Button>
                  </div>
                  
                  {/* แสดงสถานะถ้าเปิดแอปผ่าน LINE อยู่ */}
                  {lineProfile && (
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 py-2 px-4 rounded-xl border border-emerald-100 w-max mx-auto">
                      <Avatar src={lineProfile.pictureUrl} size={20} /> Ready to login as {lineProfile.displayName}
                    </div>
                  )}

               </div>
            </div>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  // 🎬 RENDER: MAIN DASHBOARD (FLOATING UI)
  const menuItems = (
    <Menu mode="inline" selectedKeys={[activeMenu]} onClick={(e) => { setActiveMenu(e.key); setMobileMenuOpen(false); }} style={{ border: 'none', background: 'transparent' }}>
      <div className="px-4 mb-2 mt-4"><Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Main Menu</Text></div>
      <Menu.Item key="DASHBOARD" icon={<DashboardOutlined />} className={`rounded-xl my-1 !h-12 leading-[48px] font-medium transition-all ${activeMenu === 'DASHBOARD' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>Dashboard</Menu.Item>
      <Menu.Item key="E_PASSPORT" icon={<IdcardOutlined />} className={`rounded-xl my-1 !h-12 leading-[48px] font-medium transition-all ${activeMenu === 'E_PASSPORT' ? 'bg-green-50 text-green-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>My E-Passport</Menu.Item>
      <Menu.Item key="E_PERMIT" icon={<FileTextOutlined />} className={`rounded-xl my-1 !h-12 leading-[48px] font-medium transition-all ${activeMenu === 'E_PERMIT' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>E-Permit (PTW)</Menu.Item>
      
      <div className="px-4 mb-2 mt-6"><Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Safety Tools</Text></div>
      <Menu.Item key="BBS" icon={<EyeOutlined />} className={`rounded-xl my-1 !h-12 leading-[48px] font-medium transition-all ${activeMenu === 'BBS' ? 'bg-emerald-50 text-emerald-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>BBS Observation</Menu.Item>
      <Menu.Item key="CONFINED_SPACE" icon={<BuildOutlined />} className={`rounded-xl my-1 !h-12 leading-[48px] font-medium transition-all ${activeMenu === 'CONFINED_SPACE' ? 'bg-purple-50 text-purple-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>Confined Space</Menu.Item>
      <Menu.Item key="INCIDENT" icon={<AlertOutlined />} className={`rounded-xl my-1 !h-12 leading-[48px] font-medium transition-all ${activeMenu === 'INCIDENT' ? 'bg-rose-50 text-rose-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>แจ้งจุดเสี่ยง (Incident)</Menu.Item>
      
      <div className="px-4 mb-2 mt-6"><Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Management</Text></div>
      <Menu.Item key="CERTIFICATE" icon={<SafetyCertificateOutlined />} className={`rounded-xl my-1 !h-12 leading-[48px] font-medium transition-all ${activeMenu === 'CERTIFICATE' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>Certificates</Menu.Item>
      <Menu.Item key="E_LEARNING" icon={<ReadOutlined />} className={`rounded-xl my-1 !h-12 leading-[48px] font-medium transition-all ${activeMenu === 'E_LEARNING' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>E-Learning</Menu.Item>
      <Menu.Item key="EQUIPMENT" icon={<QrcodeOutlined />} className={`rounded-xl my-1 !h-12 leading-[48px] font-medium transition-all ${activeMenu === 'EQUIPMENT' ? 'bg-teal-50 text-teal-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>ตรวจอุปกรณ์ (QR)</Menu.Item>
    </Menu>
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#2563eb', borderRadius: 16, fontFamily: "'Prompt', sans-serif" }}}>
      <div className="min-h-screen bg-[#f3f6f9] relative overflow-x-hidden">
        <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-[#e0eaf5] to-transparent pointer-events-none z-0"></div>

        <Layout style={{ background: 'transparent' }}>
          
          {/* DESKTOP FLOATING SIDER */}
          {!isMobile && (
            <Sider width={280} style={{ background: 'transparent', position: 'fixed', left: 0, height: '100vh', zIndex: 100, padding: '20px 0 20px 20px' }} theme="light">
              <div className="bg-white/80 backdrop-blur-xl h-full rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col overflow-hidden">
                <div className="p-6 flex items-center gap-3 border-b border-slate-100">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-[14px] shadow-md shadow-blue-600/20">
                    <SafetyOutlined className="text-xl text-white" />
                  </div>
                  <Title level={4} className="m-0 !font-black !tracking-tight text-slate-800">Safety<span className="text-blue-600">OS</span></Title>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
                  {menuItems}
                </div>
              </div>
            </Sider>
          )}

          {/* MOBILE SIDER (DRAWER) */}
          <Drawer 
            title={<div className="flex items-center gap-3"><div className="bg-blue-600 p-2 rounded-xl"><SafetyOutlined className="text-white" /></div><Title level={4} className="m-0 !font-black">SafetyOS</Title></div>} 
            placement="left" onClose={() => setMobileMenuOpen(false)} open={mobileMenuOpen} styles={{ body: { padding: '10px' } }}
          >
            {menuItems}
          </Drawer>

          <Layout style={{ marginLeft: isMobile ? 0 : 300, background: 'transparent', transition: 'all 0.3s', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* FLOATING HEADER */}
            <Header className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] z-50 flex items-center justify-between"
              style={{ margin: isMobile ? '0' : '20px 24px 0 0', padding: isMobile ? '0 16px' : '0 24px', height: '76px', borderRadius: isMobile ? '0 0 24px 24px' : '24px', position: 'sticky', top: isMobile ? 0 : 20 }}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {isMobile && (
                  <Button type="text" icon={<MenuOutlined className="text-xl" />} onClick={() => setMobileMenuOpen(true)} className="flex-shrink-0" />
                )}
                <div className="min-w-0 flex flex-col justify-center h-full">
                  <h1 className="text-lg md:text-2xl font-black text-slate-800 m-0 truncate leading-tight capitalize">
                    {activeMenu.replace('_', ' ')}
                  </h1>
                  {!isMobile && !isTablet && (
                    <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5 flex items-center gap-1.5"><EnvironmentOutlined className="text-blue-500" /> Map Ta Phut Terminal</Text>
                  )}
                </div>
              </div>
              
              <Space size={isMobile ? 10 : 16} align="center" className="flex-shrink-0">
                <Button type="primary" shape="circle" icon={<ScanOutlined />} size={isMobile ? "middle" : "large"} onClick={handleOpenScannerClick} className="bg-emerald-500 hover:bg-emerald-600 border-none shadow-md shadow-emerald-500/30" />
                
                {!isMobile && <div className="w-px h-8 bg-slate-200 mx-2"></div>}

                <div className="bg-slate-50/50 hover:bg-slate-100 transition-colors rounded-[100px] border border-slate-200/60 p-1.5 flex items-center gap-3 pr-2 cursor-pointer max-w-[200px]">
                  <Avatar src={getDisplayAvatar()} size={isMobile ? "small" : "large"} className="border-2 border-white shadow-sm bg-blue-600 shrink-0" icon={<UserOutlined />} />
                  {screens.lg && (
                    <div className="flex flex-col min-w-[80px] pr-2 leading-tight overflow-hidden">
                      <Text strong className="text-[13px] text-slate-800 truncate block">{currentUser?.full_name}</Text>
                      <Text className="text-[10px] text-blue-600 font-bold uppercase tracking-widest truncate block">{currentUser?.role}</Text>
                    </div>
                  )}
                  <Button type="text" shape="circle" icon={<LogoutOutlined />} onClick={handleLogout} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 shrink-0" />
                </div>

                {activeMenu === 'E_PERMIT' && currentUser?.role === 'CONTRACTOR' && (
                  <Button type="primary" shape={isMobile || isTablet ? "circle" : "round"} icon={<FileAddOutlined />} size="large" onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-lg shadow-blue-600/30 font-bold px-6 ml-2">
                    {!isMobile && !isTablet && 'ขอ Permit ใหม่'}
                  </Button>
                )}
              </Space>
            </Header>

            {/* MAIN CONTENT AREA */}
            <Content className="flex-1 relative z-10" style={{ padding: isMobile ? '16px' : '24px 24px 32px 0' }}>
              <div className="animate-fade-in w-full max-w-[1400px] mx-auto">
                {activeMenu === 'DASHBOARD' && <Dashboard currentUser={currentUser} />}
                
                {activeMenu === 'E_PERMIT' && (
                  <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden p-2 md:p-6">
                    <WorkPermitQueue permits={realPermits} loading={loading} currentUser={currentUser} onPreviewFile={handlePreviewFile} onViewDetails={handleViewDetails} onUpdateStatus={handleUpdateStatus} />
                  </div>
                )}
                
                {activeMenu === 'E_PASSPORT' && <EPassport currentUser={currentUser} lineProfile={lineProfile} />}
                
                {activeMenu === 'BBS' && (
                  <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
                    <Tabs
                      activeKey={activeBbsTab}
                      onChange={setActiveBbsTab}
                      centered
                      size="large"
                      className="custom-bbs-tabs"
                      items={[
                        { key: 'form', label: <span className="font-bold px-4 md:px-8"><FormOutlined /> รายงาน BBS ใหม่</span>, children: <div className="p-4 md:p-8 pt-0"><BBSObservationForm onSubmit={handleCreateBbs} onCancel={() => setActiveMenu('DASHBOARD')} isSubmitting={isSubmittingBbs} /></div> },
                        { key: 'history', label: <span className="font-bold px-4 md:px-8"><EyeOutlined /> ประวัติรายงาน</span>, children: <div className="p-4 md:p-8 pt-0"><BBSHistory records={bbsRecords} /></div> },
                      ]}
                    />
                  </div>
                )}
                
                {activeMenu === 'CONFINED_SPACE' && <ConfinedSpaceBoard activePermits={activeConfinedPermits} selectedPermit={selectedConfinedPermit} onSelectPermit={setSelectedConfinedPermit} entries={confinedEntries} onCheckIn={handleCheckIn} onCheckOut={handleCheckOut} onEvacuate={handleEvacuateAll} currentUser={currentUser} isMobile={isMobile} glassPanel={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid #ffffff' }} />}
                
                {activeMenu === 'CERTIFICATE' && <CertificateManager currentUser={currentUser} />}
                {activeMenu === 'INCIDENT' && <IncidentReport currentUser={currentUser} />}
                {activeMenu === 'E_LEARNING' && <ELearning currentUser={currentUser} />}
                {activeMenu === 'EQUIPMENT' && <EquipmentInspection currentUser={currentUser} />} 
              </div>
            </Content>
          </Layout>

          {/* ==========================================
              🌟 MODALS & DRAWERS
             ========================================== */}
          
          {/* Detail & Print Modal */}
          <Modal title={null} open={isDetailModalOpen} onCancel={() => setIsDetailModalOpen(false)} width={750} footer={null} styles={{ body: { padding: 0 } }} centered>
            {selectedPermitDetail && (
              <div className="bg-slate-50 rounded-3xl overflow-hidden">
                <div ref={documentRef} className="bg-slate-50 pb-8">
                  <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-white relative">
                    <div className="absolute top-8 right-8">{getStatusDisplayModern(selectedPermitDetail.status)}</div>
                    <SafetyCertificateOutlined className="text-5xl mb-4 opacity-50" />
                    <h2 className="text-3xl font-black m-0 tracking-tight text-white uppercase">Work Permit</h2>
                    <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-2">Document No. {selectedPermitDetail.permit_number}</p>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <Row gutter={[24, 24]}>
                        <Col span={24}><Text type="secondary" className="block text-[10px] font-black uppercase mb-1">หัวข้องาน (Task Title)</Text><Text className="text-lg font-bold text-slate-800">{selectedPermitDetail.title}</Text></Col>
                        <Col span={12}><Text type="secondary" className="block text-[10px] font-black uppercase mb-1">พื้นที่ (Location)</Text><Text className="font-bold text-slate-700">{selectedPermitDetail.location_detail}</Text></Col>
                        <Col span={12}><Text type="secondary" className="block text-[10px] font-black uppercase mb-1">ประเภทงาน (Type)</Text><div className="mt-1">{getStatusDisplayModern(selectedPermitDetail.permit_type)}</div></Col>
                      </Row>
                    </div>
                    <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                      <Row gutter={24}>
                        <Col span={12}><Text type="secondary" className="block text-[10px] font-black uppercase mb-1">วันเริ่มงาน</Text><Text strong>{dayjs(selectedPermitDetail.start_time).format('DD/MM/YYYY HH:mm น.')}</Text></Col>
                        <Col span={12}><Text type="secondary" className="block text-[10px] font-black uppercase mb-1">วันสิ้นสุด</Text><Text strong className="text-rose-600">{dayjs(selectedPermitDetail.end_time).format('DD/MM/YYYY HH:mm น.')}</Text></Col>
                      </Row>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      <Text type="secondary" className="block text-[10px] font-black uppercase mb-3">มาตรการควบคุมความเสี่ยง (Safety Measures)</Text>
                      <div className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl font-medium whitespace-pre-wrap">{selectedPermitDetail.description}</div>
                    </div>
                    {gasLogsDetail.length > 0 && (
                      <div className="bg-cyan-50 p-6 rounded-3xl border border-cyan-100">
                        <Text type="secondary" className="block text-[10px] font-black uppercase mb-3">ประวัติการตรวจวัดก๊าซ (Gas Testing)</Text>
                        <div className="space-y-3">
                          {gasLogsDetail.map((log, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-2xl border border-cyan-100 flex justify-between items-center">
                              <Text className="text-xs font-bold text-slate-500">{dayjs(log.recorded_at).format('HH:mm')}</Text>
                              <div className="flex gap-4">
                                <div className="text-center"><div className="text-[10px] font-black text-slate-400">O2</div><div className="font-bold text-blue-600">{log.o2_level}%</div></div>
                                <div className="text-center"><div className="text-[10px] font-black text-slate-400">LEL</div><div className="font-bold text-orange-500">{log.lel_level}%</div></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white p-6 border-t border-slate-100 flex gap-3 px-8">
                  <Button size="large" block className="rounded-2xl h-12 font-bold" onClick={() => setIsDetailModalOpen(false)}>ปิด</Button>
                  <Button type="primary" icon={<FilePdfOutlined />} size="large" block className="rounded-2xl h-12 font-black bg-indigo-600" onClick={handlePrint}>Export PDF</Button>
                </div>
              </div>
            )}
          </Modal>

          {/* File Preview Modal */}
          <Modal title="เอกสารแนบ" open={isPreviewOpen} onCancel={() => setIsPreviewOpen(false)} width={850} footer={null} centered>
            <div className="h-[75vh] bg-slate-50 rounded-2xl overflow-hidden mt-4">
              {previewType === 'image' ? <img src={previewUrl} className="w-full h-full object-contain" /> : <iframe src={previewUrl} className="w-full h-full border-none" />}
            </div>
          </Modal>

          {/* PERMIT CREATE MODAL */}
          <Modal title={null} footer={null} open={isModalOpen} onCancel={() => { setIsModalOpen(false); setFileList([]); form.resetFields(); setSelectedPermitTypeForm(''); }} width={750} centered styles={{ body: { padding: 0 } }}>
             <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white rounded-t-3xl">
                <h2 className="text-2xl md:text-3xl font-black m-0 text-white flex items-center gap-3"><FileAddOutlined /> ขออนุญาตทำงาน (E-Permit)</h2>
                <p className="text-blue-200 text-xs md:text-sm mt-2 opacity-90 font-medium">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อความปลอดภัยในการปฏิบัติงาน</p>
             </div>
             <div className="p-4 md:p-8 max-h-[75vh] overflow-y-auto custom-scrollbar bg-slate-50">
                <Form form={form} layout="vertical" onFinish={handleCreatePermit} requiredMark={false}>
                  
                  <div className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-6">
                    <Form.Item name="title" label={<span className="font-bold text-slate-700">หัวข้องาน</span>} rules={[{ required: true }]}>
                      <Input placeholder="เช่น งานซ่อมบำรุง Tank 01" className="h-12 md:h-14 rounded-xl" />
                    </Form.Item>
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item name="permit_type" label={<span className="font-bold text-slate-700">ประเภทงาน</span>} rules={[{ required: true }]}>
                          <Select size="large" className="h-12 md:h-14" onChange={setSelectedPermitTypeForm}>
                            <Select.Option value="HOT_WORK">🔥 Hot Work</Select.Option>
                            <Select.Option value="CONFINED_SPACE">🕳️ Confined Space</Select.Option>
                            <Select.Option value="ELECTRICAL">⚡ Electrical</Select.Option>
                            <Select.Option value="COLD_WORK">❄️ Cold Work</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="location_detail" label={<span className="font-bold text-slate-700">สถานที่</span>} rules={[{ required: true }]}>
                          <Input placeholder="โซน / แผนก" className="h-12 md:h-14 rounded-xl" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  <div className="bg-blue-50 p-5 md:p-6 rounded-[2rem] border border-blue-100 mb-6">
                    <Form.Item name="timeRange" label={<span className="font-bold text-slate-700">ระยะเวลาปฏิบัติงาน</span>} rules={[{ required: true }]} className="mb-0">
                      <ModernDateRange />
                    </Form.Item>
                  </div>

                  {(selectedPermitTypeForm === 'HOT_WORK' || selectedPermitTypeForm === 'CONFINED_SPACE') && (
                    <div className="bg-rose-50 p-5 md:p-6 rounded-[2rem] border border-rose-200 mb-6 animate-fade-in relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                      <div className="flex items-center gap-2 mb-4 text-rose-700 font-extrabold border-b border-rose-200 pb-3">
                        <WarningOutlined className="text-lg" /> ข้อมูลบังคับทางกฎหมาย (Mandatory Fields)
                      </div>
                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item name="gas_tester_name" label={<span className="font-bold text-slate-700">ผู้ตรวจสอบสภาพอากาศ</span>} rules={[{ required: true }]}>
                            <Input size="large" placeholder="ชื่อ-นามสกุล" className="rounded-xl h-12" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="standby_person_name" label={<span className="font-bold text-slate-700">ผู้เฝ้าระวัง (Standby)</span>} rules={[{ required: true }]}>
                            <Input size="large" placeholder="ชื่อ-นามสกุล" className="rounded-xl h-12" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  )}

                  <div className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-6">
                    <Form.Item name="description" label={<span className="font-bold text-slate-700">รายละเอียดและมาตรการความปลอดภัย</span>}>
                      <Input.TextArea rows={4} className="rounded-xl p-3" placeholder="ระบุมาตรการควบคุมความเสี่ยง..." />
                    </Form.Item>
                    <Form.Item label={<span className="font-bold text-slate-700">เอกสาร JSA (บังคับแนบ)</span>} className="mb-0">
                      <Upload beforeUpload={() => false} maxCount={1} fileList={fileList} onChange={({ fileList }) => setFileList(fileList)}>
                         <Button icon={<UploadOutlined />} className="h-14 rounded-xl w-full text-slate-500 border-dashed border-2 hover:border-blue-500 hover:text-blue-500">แตะเพื่อเลือกไฟล์ JSA (PDF/Image)</Button>
                      </Upload>
                    </Form.Item>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <Button size="large" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 rounded-2xl font-bold bg-slate-100 border-none text-slate-600 hover:bg-slate-200">ยกเลิก</Button>
                    <Button type="primary" htmlType="submit" loading={isSubmitting} size="large" className="flex-[2] h-14 rounded-2xl font-black bg-blue-600 shadow-xl shadow-blue-500/30">ส่งคำขอ Permit</Button>
                  </div>
                </Form>
             </div>
          </Modal>

          {/* EMERGENCY MODAL */}
          <Modal open={isEmergency} closable={false} footer={null} width="100%" centered wrapClassName="emergency-modal">
            <div className="bg-red-600 w-full h-full flex flex-col items-center justify-center p-10 text-center animate-pulse relative overflow-hidden">
              <WarningOutlined className="text-white text-[120px] mb-8" />
              <h1 className="text-6xl md:text-8xl font-black text-white m-0 tracking-tighter uppercase">Emergency</h1>
              <p className="text-2xl text-white/90 mt-4 font-bold">{emergencyMessage}</p>
              <Button size="large" className="mt-12 h-20 px-16 rounded-full text-2xl font-black bg-white text-red-600 border-none hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.4)]" onClick={() => setIsEmergency(false)}>รับทราบและอพยพทันที!</Button>
            </div>
          </Modal>

          {/* QR SCANNER MODAL */}
          <Modal title={null} open={isScannerOpen} onCancel={() => setIsScannerOpen(false)} footer={null} centered destroyOnClose width={400} styles={{ body: { padding: 0 } }}>
            <div className="bg-slate-900 p-8 text-center rounded-[2rem] overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
               <div className="mb-6"><ScanOutlined className="text-5xl text-blue-500 mb-3" /><h3 className="text-white m-0 font-black text-xl">สแกน QR Code</h3><p className="text-slate-400 text-xs mt-1">E-Passport หรือ ตรวจอุปกรณ์</p></div>
               <div className="rounded-xl overflow-hidden border-2 border-slate-700">
                 <QRScanner onScan={(text) => { setIsScannerOpen(false); if (text.includes('/verify/')) setVerifyUserId(text.split('/verify/')[1]); }} />
               </div>
               <Button block size="large" type="text" className="mt-6 text-slate-400 hover:text-white" onClick={() => setIsScannerOpen(false)}>ยกเลิก</Button>
            </div>
          </Modal>

          {/* ==========================================
              🎨 GLOBAL CSS OVERRIDES
             ========================================== */}
          <style>{`
            .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
            
            /* Custom Scrollbar */
            .custom-scrollbar::-webkit-scrollbar { width: 8px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            
            /* Modals & Drawers Reset */
            .emergency-modal .ant-modal-content { background: transparent !important; box-shadow: none !important; padding: 0 !important; }
            .emergency-modal .ant-modal { max-width: 100vw !important; margin: 0 !important; top: 0 !important; padding: 0 !important; }
            
            /* Tabs Customization (BBS) */
            .custom-bbs-tabs .ant-tabs-nav::before { border-bottom: 1px solid #f1f5f9; }
            .custom-bbs-tabs .ant-tabs-tab { padding: 16px 0; margin-right: 0 !important; flex: 1; justify-content: center; }
            .custom-bbs-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #2563eb !important; }
            .custom-bbs-tabs .ant-tabs-ink-bar { background: #2563eb !important; height: 3px !important; border-radius: 3px 3px 0 0; }

            /* ลดระยะห่างของ Label เพื่อให้กระชับแบบในรูป */
            .custom-login-form .ant-form-item-label > label { height: auto !important; padding-bottom: 4px !important; }
          `}</style>

        </Layout>
      </div>
    </ConfigProvider>
  );
}