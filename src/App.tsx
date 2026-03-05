import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Layout, Menu, Typography, Card, Row, Col, 
  Avatar, Table, Tag, ConfigProvider, Space,
  Button, Modal, Form, Input, Select, message, Badge, Upload, Divider, Checkbox, InputNumber, Descriptions,
  Radio, List, Popconfirm, Drawer, Grid, Spin 
} from 'antd';
import { 
  DashboardOutlined, SafetyCertificateOutlined, WarningOutlined,
  UserOutlined, SettingOutlined, FileTextOutlined,
  PlusOutlined, CheckOutlined, CloseOutlined,
  FieldTimeOutlined, FireOutlined, ThunderboltOutlined,
  BuildOutlined, EnvironmentOutlined, TeamOutlined, UploadOutlined,
  IdcardOutlined, AlertOutlined, ReadOutlined, QrcodeOutlined, BellOutlined,
  DownloadOutlined, EyeOutlined, FilePdfOutlined, LogoutOutlined,
  CheckCircleOutlined, LoginOutlined, MenuOutlined, RocketOutlined,
  CalendarOutlined, ClockCircleOutlined, ToolOutlined, HourglassOutlined, InfoCircleOutlined, AppstoreAddOutlined, ScanOutlined
} from '@ant-design/icons';
import QRScanner from './components/QRScanner';
import dayjs from 'dayjs';
import html2pdf from 'html2pdf.js'; 
import liff from '@line/liff'; 

import WorkPermitQueue from './components/WorkPermitQueue';
import BBSHistory from './components/BBSHistory';
import ConfinedSpaceBoard from './components/ConfinedSpaceBoard';

import VerificationPage from './components/VerificationPage';
import EPassport from './components/EPassport';
import CertificateManager from './components/CertificateManager';
import IncidentReport from './components/IncidentReport';
import ELearning from './components/ELearning';
import EquipmentInspection from './components/EquipmentInspection'; 
import Dashboard from './components/Dashboard'; 
import { supabase } from './supabase'; 

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid; 

const WaveSeparator = ({ isMobile }: { isMobile: boolean }) => (
  <div className="absolute z-10 pointer-events-none" style={{ right: isMobile ? 0 : -1, bottom: isMobile ? -1 : 0, width: isMobile ? '100%' : '150px', height: isMobile ? '120px' : '100%', display: 'flex', alignItems: isMobile ? 'flex-end' : 'stretch' }}>
    <svg viewBox={isMobile ? "0 0 1440 320" : "0 0 320 1440"} preserveAspectRatio="none" className="w-full h-full fill-white">
      {isMobile ? <path fillOpacity="1" d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,197.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path> : <path fillOpacity="1" d="M224,1440L197.3,1392C170.7,1344,117.3,1248,128,1152C138.7,1056,213.3,960,224,864C234.7,768,181.3,672,165.3,576C149.3,480,170.7,384,192,288C213.3,192,234.7,96,245.3,48L256,0L320,0L320,48C320,96,320,192,320,288C320,384,320,480,320,576C320,672,320,768,320,864C320,960,320,1056,320,1152C320,1248,320,1344,320,1392L320,1440Z"></path>}
    </svg>
  </div>
);

const ModernDateRange = ({ value, onChange }: any) => {
  const onStartChange = (e: React.ChangeEvent<HTMLInputElement>) => { onChange([e.target.value ? dayjs(e.target.value) : null, value?.[1]]); };
  const onEndChange = (e: React.ChangeEvent<HTMLInputElement>) => { onChange([value?.[0], e.target.value ? dayjs(e.target.value) : null]); };
  const toNativeFormat = (date: any) => date ? date.format('YYYY-MM-DDTHH:mm') : '';
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white p-3 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-center">
        <label className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1"><CalendarOutlined className="mr-1"/> เวลาเริ่มงาน</label>
        <input type="datetime-local" className="w-full bg-transparent outline-none text-gray-800 font-semibold text-base py-1" value={toNativeFormat(value?.[0])} onChange={onStartChange} />
      </div>
      <div className="bg-white p-3 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-center">
        <label className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1"><ClockCircleOutlined className="mr-1"/> เวลาสิ้นสุด</label>
        <input type="datetime-local" className="w-full bg-transparent outline-none text-gray-800 font-semibold text-base py-1" value={toNativeFormat(value?.[1])} onChange={onEndChange} />
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
          <div key={opt.value} onClick={() => toggle(opt.value)} className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 select-none border shadow-sm ${isSelected ? `${activeColor} border-transparent scale-105` : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {isSelected ? <CheckCircleOutlined /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300"></div>} {opt.label}
          </div>
        );
      })}
    </div>
  );
};

export default function App() {
  const screens = useBreakpoint(); 
  const isMobile = !screens.md; 

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true); 
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); 
  const [activeMenu, setActiveMenu] = useState('DASHBOARD'); 
  const [verifyUserId, setVerifyUserId] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false); 
  const [lineProfile, setLineProfile] = useState<any>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const targetPage = queryParams.get('page');
    if (targetPage) {
      const validPages = ['DASHBOARD', 'E_PASSPORT', 'E_PERMIT', 'BBS', 'CONFINED_SPACE', 'CERTIFICATE', 'INCIDENT', 'E_LEARNING', 'EQUIPMENT'];
      if (validPages.includes(targetPage)) {
        setActiveMenu(targetPage);
      }
    }
  }, []);

  const [realPermits, setRealPermits] = useState<any[]>([]); 
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [fileList, setFileList] = useState<any[]>([]); 
  const [form] = Form.useForm();
  const [loginForm] = Form.useForm(); 

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewType, setPreviewType] = useState('pdf');

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPermitDetail, setSelectedPermitDetail] = useState<any>(null);
  
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const [bbsRecords, setBbsRecords] = useState<any[]>([]);
  const [activeConfinedPermits, setActiveConfinedPermits] = useState<any[]>([]);
  const [selectedConfinedPermit, setSelectedConfinedPermit] = useState<string | null>(null);
  const [confinedEntries, setConfinedEntries] = useState<any[]>([]);
  const [isBbsModalOpen, setIsBbsModalOpen] = useState(false);
  const [bbsForm] = Form.useForm();

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/verify/')) {
      const id = path.split('/')[2]; 
      setVerifyUserId(id);
    }
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        let profile = null;
        await liff.init({ liffId: '2009277207-jNY8QghJ' }); 

        // 1. เช็ค LINE ก่อน
        if (liff.isLoggedIn()) {
          profile = await liff.getProfile();
          setLineProfile(profile); // สั่งให้หน้าบ้านจำรูปสดๆ จาก LINE ไว้ทันที!
        } else if (liff.isInClient()) {
          liff.login();
          return; 
        }

        const savedUserStr = localStorage.getItem('safetyos_user');
        
        // 2. ลอจิกการเข้าสู่ระบบแบบเสถียร
        if (profile) {
          // 🟢 ถ้าเปิดผ่าน LINE ให้ยิง API ไปอัปเดตข้อมูล/รูปล่าสุดเสมอแบบเงียบๆ (Silent Sync)
          try {
            const res = await axios.post('https://safetyos-backend.onrender.com/login/line', { 
              line_id: profile.userId,
              picture_url: profile.pictureUrl 
            });
            // อัปเดตข้อมูลใหม่ล่าสุดลง LocalStorage เผื่อเอาไปเปิดในคอม
            localStorage.setItem('safetyos_user', JSON.stringify(res.data.user));
            setCurrentUser(res.data.user);
            setIsAuthenticated(true);
            
            // ถ้านี่คือการล็อกอินครั้งแรกที่ไม่มีข้อมูลเดิม ให้เด้งต้อนรับ
            if (!savedUserStr) {
               message.success(`เข้าสู่ระบบอัตโนมัติ: ${res.data.user.full_name}`);
            }
          } catch (e) {
            console.log("ผู้ใช้นี้ยังไม่ได้ผูกบัญชี LINE ต้องรอล็อกอินด้วยรหัสผ่าน");
          }
        } else if (savedUserStr) {
          // 🟢 ถ้าไม่ได้เปิดผ่าน LINE (เช่นเปิดในเว็บ) แต่เคยล็อกอินไว้แล้ว ก็ให้โหลดข้อมูลเดิมขึ้นมา
          try {
            const parsedUser = JSON.parse(savedUserStr);
            setCurrentUser(parsedUser);
            setIsAuthenticated(true);
          } catch (e) {
            localStorage.removeItem('safetyos_user');
          }
        }

      } catch (err) {
        console.log("LIFF Init Failed", err);
      } finally {
        setIsAuthChecking(false);
      }
    };
    initializeApp();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('https://safetyos-backend.onrender.com/users');
      setUsers(res.data);
    } catch (error) {}
  };

  const fetchPermits = async () => {
    if (!isAuthenticated) return; 
    setLoading(true);
    try {
      const response = await axios.get('https://safetyos-backend.onrender.com/permits');
      setRealPermits(response.data);
    } catch (error) {} finally { setLoading(false); }
  };

  const fetchBbs = async () => {
    try {
      const res = await axios.get('https://safetyos-backend.onrender.com/bbs');
      setBbsRecords(res.data);
    } catch (error) {}
  };

  const fetchConfinedSpaceData = async () => {
    try {
      const res = await axios.get('https://safetyos-backend.onrender.com/confined-space/active-permits');
      setActiveConfinedPermits(res.data);
      if (res.data.length > 0 && !selectedConfinedPermit) {
        setSelectedConfinedPermit(res.data[0].id);
        fetchEntries(res.data[0].id);
      }
    } catch (error) {}
  };

  const fetchEntries = async (permitId: string) => {
    try {
      const res = await axios.get(`https://safetyos-backend.onrender.com/confined-space/${permitId}/entries`);
      setConfinedEntries(res.data);
    } catch (error) {}
  };

  useEffect(() => { 
    fetchUsers();
    if (isAuthenticated) {
      fetchPermits(); 
      fetchBbs(); 
      fetchConfinedSpaceData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeMenu === 'CONFINED_SPACE' && selectedConfinedPermit) {
      fetchEntries(selectedConfinedPermit);
      const interval = setInterval(() => { fetchEntries(selectedConfinedPermit); setCurrentTime(dayjs()); }, 60000); 
      return () => clearInterval(interval);
    }
  }, [activeMenu, selectedConfinedPermit]);

  const handleLogin = async (values: any) => {
    setIsLoggingIn(true);
    try {
      const payload = { 
        ...values, 
        line_id: lineProfile ? lineProfile.userId : null,
        picture_url: lineProfile ? lineProfile.pictureUrl : null // 🟢 ส่งรูปไปด้วยตอนล็อกอินปกติ
      };

      const response = await axios.post('https://safetyos-backend.onrender.com/login', payload);
      localStorage.setItem('safetyos_user', JSON.stringify(response.data.user));
      setCurrentUser(response.data.user); 
      setIsAuthenticated(true); 
      
      if (lineProfile) {
        message.success(`เชื่อมต่อบัญชี LINE กับคุณ ${response.data.user.full_name} สำเร็จ! ครั้งหน้าไม่ต้องกรอกรหัสแล้ว 🎉`);
      } else {
        message.success(`ยินดีต้อนรับคุณ ${response.data.user.full_name}`);
      }
    } catch (error: any) { 
      message.error(error.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ'); 
    } finally { 
      setIsLoggingIn(false); 
    }
  };

  const handleLogout = () => { 
    localStorage.removeItem('safetyos_user');
    setIsAuthenticated(false); 
    setCurrentUser(null); 
    if (liff.isLoggedIn()) liff.logout(); 
    message.info('ออกจากระบบเรียบร้อย'); 
  };

  const handleCreateBbs = async (values: any) => {
    try {
      await axios.post('https://safetyos-backend.onrender.com/bbs', { ...values, observer_id: currentUser.id });
      message.success('บันทึก BBS สำเร็จ'); setIsBbsModalOpen(false); bbsForm.resetFields(); fetchBbs();
    } catch (error) { message.error('บันทึกไม่สำเร็จ'); }
  };

  const handleCheckIn = async (values: any) => {
    try {
      await axios.post('https://safetyos-backend.onrender.com/confined-space/in', { ...values, permit_id: selectedConfinedPermit });
      message.success('Check-in สำเร็จ!'); fetchEntries(selectedConfinedPermit!);
    } catch (error) { message.error('Check-in ไม่สำเร็จ'); }
  };

  const handleCheckOut = async (entryId: string) => {
    try {
      await axios.put(`https://safetyos-backend.onrender.com/confined-space/out/${entryId}`);
      message.success('นำรายชื่อออกสำเร็จ'); fetchEntries(selectedConfinedPermit!);
    } catch (error) { message.error('Check-out ไม่สำเร็จ'); }
  };

  const handleEvacuateAll = async () => {
    try {
      await axios.post('https://safetyos-backend.onrender.com/confined-space/evacuate', { permit_id: selectedConfinedPermit, triggered_by: currentUser.full_name });
      message.success('สั่งอพยพและส่งแจ้งเตือนฉุกเฉินแล้ว!'); fetchEntries(selectedConfinedPermit!);
    } catch (error) { message.error('เกิดข้อผิดพลาดในการสั่งอพยพ'); }
  };

  const handlePreviewFile = (url: string) => { setPreviewUrl(url); if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) setPreviewType('image'); else setPreviewType('pdf'); setIsPreviewOpen(true); };
  const handleViewDetails = (record: any) => { setSelectedPermitDetail(record); setIsDetailModalOpen(true); };
  
  const handleExportPDF = async () => { 
    const element = document.getElementById('pdf-document-content'); 
    if (!element) return; 

    if (liff.isInClient()) {
      message.warning('⚠️ แอป LINE อาจไม่รองรับการโหลดไฟล์ แนะนำให้เปิดผ่าน Chrome/Safari (กดเมนูขวาบน)', 8);
    }

    setIsExportingPDF(true); 
    const hideLoadingMsg = message.loading('กำลังประมวลผลไฟล์ PDF กรุณารอสักครู่...', 0); 
    
    try {
      const opt = { 
        margin: 0.5, 
        filename: `WorkPermit_${selectedPermitDetail?.permit_number || 'Export'}.pdf`, 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2, useCORS: true, logging: false }, 
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } 
      };

      await html2pdf().set(opt).from(element).save(); 
      
      hideLoadingMsg(); 
      message.success('ดาวน์โหลดไฟล์ PDF สำเร็จ!'); 
    } catch (error) {
      console.error("PDF Export Error:", error);
      hideLoadingMsg(); 
      message.error('ระบบสร้างไฟล์ขัดข้อง กรุณาลองใหม่อีกครั้ง หรือเปิดผ่านเบราว์เซอร์ปกติ (Chrome)', 6);
    } finally {
      setIsExportingPDF(false); 
    }
  };
  
  const handleCreatePermit = async (values: any) => {
    try {
      if (!currentUser) return message.error('กรุณาเข้าสู่ระบบก่อน');
      if (fileList.length === 0) return message.error('⚠️ กรุณาแนบเอกสาร JSA');
      
      setIsSubmitting(true); 
      let fileUrl = null; 
      let fileNameToSave = null;
      
      if (fileList.length > 0) { 
        const file = fileList[0].originFileObj; 
        const uniqueName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${file.name.split('.').pop()}`; 
        
        try {
          const { error } = await supabase.storage.from('permits').upload(uniqueName, file); 
          if (error) { 
            console.error("Upload Error:", error);
            message.error(`อัปโหลดไฟล์ไม่สำเร็จ: ${error.message} (ตรวจสอบว่าสร้าง Bucket 'permits' แบบ Public หรือยัง)`); 
            setIsSubmitting(false); 
            return; 
          } 
          const { data: publicUrlData } = supabase.storage.from('permits').getPublicUrl(uniqueName); 
          fileUrl = publicUrlData.publicUrl; 
          fileNameToSave = file.name; 
        } catch (supaErr: any) {
          console.error("Supabase Exception:", supaErr);
          message.error(`ระบบเก็บเอกสารขัดข้อง: ${supaErr.message}`);
          setIsSubmitting(false); 
          return;
        }
      }
      
      if (!values.timeRange || !values.timeRange[0] || !values.timeRange[1]) {
        message.error('กรุณาระบุเวลาเริ่มและสิ้นสุดให้ครบถ้วน');
        setIsSubmitting(false);
        return;
      }

      const startTime = dayjs(values.timeRange[0]).toISOString(); 
      const endTime = dayjs(values.timeRange[1]).toISOString();
      
      const ppeString = values.ppe && values.ppe.length > 0 ? `\n🛡️ อุปกรณ์ PPE: ${values.ppe.join(', ')}` : ''; 
      const safetyString = values.safety_measures && values.safety_measures.length > 0 ? `\n⚠️ มาตรการ: ${values.safety_measures.join(', ')}` : ''; 
      const workerString = values.workers ? `\n👷 จำนวนผู้ปฏิบัติงาน: ${values.workers} คน` : ''; 
      const finalDescription = `${values.description || 'ไม่มีรายละเอียดเพิ่มเติม'}${workerString}${ppeString}${safetyString}`;
      
      const payload = { 
        title: values.title, 
        description: finalDescription, 
        permit_type: values.permit_type, 
        location_detail: values.location_detail, 
        start_time: startTime, 
        end_time: endTime, 
        applicant_id: currentUser.id, 
        attachment_url: fileUrl, 
        attachment_name: fileNameToSave,
        workers: values.workers 
      };

      await axios.post('https://safetyos-backend.onrender.com/permits', payload);
      
      message.success('ส่งคำขอ Permit สำเร็จ!'); 
      setIsModalOpen(false); 
      form.resetFields(); 
      setFileList([]); 
      fetchPermits();
    } catch (error: any) { 
      console.error("Create Permit Error:", error.response || error);
      const errMsg = error.response?.data?.error || error.message || 'สร้างรายการไม่สำเร็จ';
      message.error(`ผิดพลาด: ${errMsg}`); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleUpdateStatus = async (permitId: string, currentStatus: string, action: 'APPROVE' | 'REJECT') => {
    try { let nextStatus = ''; if (action === 'REJECT') nextStatus = 'REJECTED'; else { if (currentStatus === 'PENDING_AREA_OWNER') nextStatus = 'PENDING_SAFETY'; else if (currentStatus === 'PENDING_SAFETY') nextStatus = 'APPROVED'; } await axios.put(`https://safetyos-backend.onrender.com/permits/${permitId}`, { status: nextStatus, approver_id: currentUser.id, comment: action === 'APPROVE' ? 'อนุมัติผ่านระบบ E-Permit' : 'ไม่อนุมัติตามมาตรการความปลอดภัย' }); message.success(`ดำเนินการ ${action} เรียบร้อยแล้ว`); fetchPermits(); } catch (error) { message.error('ไม่สามารถอัปเดตสถานะได้'); }
  };

  const handleOpenScannerClick = async () => {
    if (liff.isInClient() && liff.scanCodeV2) {
      try {
        const result = await liff.scanCodeV2(); 
        if (result && result.value) {
          const scannedText = result.value;
          if (scannedText.includes('/verify/')) {
            const id = scannedText.split('/verify/')[1];
            setVerifyUserId(id); 
          } else {
            message.error('QR Code นี้ไม่ใช่ของระบบ SafetyOS!');
          }
        }
      } catch (error) {
        console.error("LINE Scanner error:", error);
        setIsScannerOpen(true);
      }
    } else {
      setIsScannerOpen(true);
    }
  };

  const glassPanel = { background: 'rgba(255, 255, 255, 0.4)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)' };
  const modernHeaderStyle = { background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', borderRadius: isMobile ? '0px' : '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: 'none', margin: isMobile ? '0' : '16px 24px 0', padding: isMobile ? '0 12px' : '0 24px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, position: isMobile ? 'sticky' as 'sticky' : 'relative' as 'relative', top: 0 };


  const getDisplayAvatar = () => {
    // 1. ถ้าเปิดผ่านแอป LINE ดึงรูปสดๆ จาก LINE มาโชว์ก่อนเลย (ชัวร์สุด)
    if (lineProfile && lineProfile.pictureUrl) {
      return lineProfile.pictureUrl;
    }
    // 2. ถ้าไม่ได้เปิดผ่าน LINE ให้ใช้รูปจากฐานข้อมูลที่บันทึกไว้
    if (currentUser && currentUser.profile_url) {
      return currentUser.profile_url;
    }
    // 3. ถ้าไม่มีเลยจริงๆ ส่งค่า null กลับไปเพื่อโชว์ไอคอน Default
    return null;
  };

  if (isAuthChecking) {
    return ( <ConfigProvider theme={{ token: { colorPrimary: '#007AFF' }}}> <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}> <Spin size="large" description="กำลังโหลดข้อมูล..." /> </div> </ConfigProvider> );
  }

  if (verifyUserId) {
    return <VerificationPage userId={verifyUserId} />;
  }

  if (!isAuthenticated) {
    const minimalInputStyle = { border: 'none', borderBottom: '2px solid #e2e8f0', borderRadius: '0', boxShadow: 'none', background: 'transparent', paddingLeft: '0', paddingBottom: '8px', fontSize: '16px' };
    return (
      <ConfigProvider theme={{ token: { colorPrimary: '#2563eb', fontFamily: "'Prompt', sans-serif" }}}>
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50 overflow-hidden">
          <div className={`${isMobile ? 'h-[40vh]' : 'w-1/2 h-screen'} bg-gradient-to-br from-blue-600 to-indigo-700 relative flex items-center justify-center text-white px-10 text-center`}>
            <div className="z-20">
              <div className="bg-white/20 backdrop-blur-md rounded-full w-20 h-20 md:w-24 md:h-24 flex items-center justify-center shadow-lg mb-6 mx-auto">
                <RocketOutlined style={{ fontSize: isMobile ? '40px' : '48px' }} />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-2">SafetyOS</h1>
              <p className="text-blue-100 text-sm md:text-lg opacity-90">Enterprise Safety Management</p>
            </div>
            <WaveSeparator isMobile={isMobile} />
          </div>

          <div className={`${isMobile ? 'flex-1 pt-8' : 'w-1/2 flex items-center'} bg-white px-8 md:px-20 pb-10`}>
            <div className="w-full max-w-md mx-auto">
              {lineProfile ? (
                <div className="mb-8 text-center animate-fade-in">
                  <Avatar src={lineProfile.pictureUrl} size={64} className="mb-3 border-2 border-green-500 shadow-md" />
                  <h2 className="text-2xl font-extrabold text-slate-800 mb-1">สวัสดีคุณ {lineProfile.displayName}</h2>
                  <p className="text-green-600 font-bold text-sm bg-green-50 inline-block px-3 py-1 rounded-full">เปิดผ่านแอป LINE สำเร็จ ✅</p>
                  <p className="text-slate-400 text-xs mt-3">กรุณาล็อกอินด้วยรหัสพนักงานในครั้งแรก</p>
                </div>
              ) : (
                <div className="mb-8">
                  <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Welcome Back</h2>
                  <p className="text-slate-400">Please enter your details to sign in.</p>
                </div>
              )}

              <Form form={loginForm} layout="vertical" onFinish={handleLogin} requiredMark={false}>
                <Form.Item name="username" label={<span className="font-bold text-slate-700 text-xs uppercase tracking-wider">Username (ทดสอบใช้: view / somchai)</span>} rules={[{ required: true, message: 'กรุณากรอก Username' }]}>
                  <Input size="large" placeholder="Enter username" style={minimalInputStyle} autoComplete="username" />
                </Form.Item>
                <Form.Item name="password" label={<span className="font-bold text-slate-700 text-xs uppercase tracking-wider">Password (รหัส: 1234)</span>} rules={[{ required: true, message: 'กรุณากรอก Password' }]}>
                  <Input.Password size="large" placeholder="Enter password" style={minimalInputStyle} autoComplete="current-password" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={isLoggingIn} block style={{ height: '56px', borderRadius: '16px', fontSize: '18px', fontWeight: 'bold', background: '#2563eb', border: 'none', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)' }}>
                  Sign In
                </Button>
              </Form>
            </div>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  const menuItems = (
    <Menu mode="inline" selectedKeys={[activeMenu]} onClick={(e) => { setActiveMenu(e.key); setMobileMenuOpen(false); }} style={{ border: 'none', background: 'transparent', padding: '0 12px', marginTop: '16px' }}>
      <Menu.Item key="DASHBOARD" icon={<DashboardOutlined />} style={{ borderRadius: '12px', marginBottom: '8px', fontWeight: activeMenu === 'DASHBOARD' ? 'bold' : 'normal', background: activeMenu === 'DASHBOARD' ? '#eff6ff' : 'transparent', color: activeMenu === 'DASHBOARD' ? '#2563eb' : '#475569' }}>Dashboard สรุปผล</Menu.Item>
      <Menu.Item key="E_PASSPORT" icon={<IdcardOutlined />} style={{ borderRadius: '12px', marginBottom: '8px', fontWeight: activeMenu === 'E_PASSPORT' ? 'bold' : 'normal', background: activeMenu === 'E_PASSPORT' ? '#f0fdf4' : 'transparent', color: activeMenu === 'E_PASSPORT' ? '#16a34a' : '#475569' }}>My E-Passport</Menu.Item>
      <Menu.Item key="E_PERMIT" icon={<FileTextOutlined />} style={{ borderRadius: '12px', marginBottom: '8px', fontWeight: activeMenu === 'E_PERMIT' ? 'bold' : 'normal', background: activeMenu === 'E_PERMIT' ? '#eff6ff' : 'transparent', color: activeMenu === 'E_PERMIT' ? '#2563eb' : '#475569' }}>ระบบ E-Permit (PTW)</Menu.Item>
      <Menu.Item key="BBS" icon={<EyeOutlined />} style={{ borderRadius: '12px', marginBottom: '8px', fontWeight: activeMenu === 'BBS' ? 'bold' : 'normal', background: activeMenu === 'BBS' ? '#ecfdf5' : 'transparent', color: activeMenu === 'BBS' ? '#10b981' : '#475569' }}>BBS Observation</Menu.Item>
      <Menu.Item key="CONFINED_SPACE" icon={<BuildOutlined />} style={{ borderRadius: '12px', marginBottom: '8px', fontWeight: activeMenu === 'CONFINED_SPACE' ? 'bold' : 'normal', background: activeMenu === 'CONFINED_SPACE' ? '#f3e8ff' : 'transparent', color: activeMenu === 'CONFINED_SPACE' ? '#9333ea' : '#475569' }}>บอร์ดที่อับอากาศ</Menu.Item>
      <Menu.Item key="CERTIFICATE" icon={<IdcardOutlined />} style={{ borderRadius: '12px', marginBottom: '8px', fontWeight: activeMenu === 'CERTIFICATE' ? 'bold' : 'normal', background: activeMenu === 'CERTIFICATE' ? '#eff6ff' : 'transparent', color: activeMenu === 'CERTIFICATE' ? '#2563eb' : '#475569' }}>จัดการใบ Certificate</Menu.Item>
      <Menu.Item key="INCIDENT" icon={<AlertOutlined />} style={{ borderRadius: '12px', marginBottom: '8px', fontWeight: activeMenu === 'INCIDENT' ? 'bold' : 'normal', background: activeMenu === 'INCIDENT' ? '#fef2f2' : 'transparent', color: activeMenu === 'INCIDENT' ? '#ef4444' : '#475569' }}>แจ้งจุดเสี่ยง (Incident)</Menu.Item>
      <Menu.Item key="E_LEARNING" icon={<ReadOutlined />} style={{ borderRadius: '12px', marginBottom: '8px', fontWeight: activeMenu === 'E_LEARNING' ? 'bold' : 'normal', background: activeMenu === 'E_LEARNING' ? '#eef2ff' : 'transparent', color: activeMenu === 'E_LEARNING' ? '#4f46e5' : '#475569' }}>ระบบอบรม (E-Learning)</Menu.Item>
      <Menu.Item key="EQUIPMENT" icon={<QrcodeOutlined />} style={{ borderRadius: '12px', marginBottom: '8px', fontWeight: activeMenu === 'EQUIPMENT' ? 'bold' : 'normal', background: activeMenu === 'EQUIPMENT' ? '#fff7ed' : 'transparent', color: activeMenu === 'EQUIPMENT' ? '#f97316' : '#475569' }}>ตรวจอุปกรณ์ (QR Code)</Menu.Item>
    </Menu>
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#2563eb', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'San Francisco', 'Prompt', sans-serif" }}}>
      <div className="app-container">
        <Layout style={{ minHeight: '100vh', background: 'radial-gradient(circle at 10% 20%, rgb(239, 246, 249) 0%, rgb(206, 239, 253) 90%)' }}>
          
          {!isMobile && (
            <Sider width={260} style={{ ...glassPanel, margin: '16px 0 16px 16px', position: 'fixed', left: 0, zIndex: 100, height: 'calc(100vh - 32px)' }} theme="light">
              <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <div style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', padding: '8px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(37,99,235,0.3)' }}><SafetyCertificateOutlined style={{ fontSize: '24px', color: '#fff' }} /></div>
                <Text strong style={{ fontSize: '20px', color: '#1e293b', letterSpacing: '-0.5px' }}>Safety<span style={{color: '#2563eb'}}>OS</span></Text>
              </div>
              {menuItems}
            </Sider>
          )}

          <Drawer title={<div className="flex items-center gap-2"><SafetyCertificateOutlined className="text-blue-600 text-xl"/> <span className="font-bold text-slate-800">SafetyOS</span></div>} placement="left" onClose={() => setMobileMenuOpen(false)} open={mobileMenuOpen} styles={{ body: { padding: 0 } }}>
            {menuItems}
          </Drawer>

          <Layout style={{ marginLeft: isMobile ? 0 : 280, transition: 'all 0.2s', background: 'transparent' }}>
            
            <Header style={modernHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isMobile && (
                  <Button type="text" icon={<MenuOutlined style={{fontSize: '20px'}} />} onClick={() => setMobileMenuOpen(true)} style={{ padding: 0 }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Title level={isMobile ? 4 : 3} style={{ margin: 0, lineHeight: '1.1', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px', fontSize: isMobile ? '16px' : 'auto' }}>
                    {activeMenu === 'DASHBOARD' ? 'ภาพรวม (Dashboard)' :
                     activeMenu === 'E_PASSPORT' ? 'บัตรประจำตัว (E-Passport)' :
                     activeMenu === 'E_PERMIT' ? 'E-Permit Control Room' : 
                     activeMenu === 'BBS' ? 'พฤติกรรมความปลอดภัย (BBS)' : 
                     activeMenu === 'CONFINED_SPACE' ? 'Confined Space Board' : 
                     activeMenu === 'CERTIFICATE' ? 'จัดการใบ Certificate' : 
                     activeMenu === 'INCIDENT' ? 'จุดเสี่ยง (Incident)' : 
                     activeMenu === 'EQUIPMENT' ? 'ตรวจสอบอุปกรณ์ (QR)' : 
                     'ระบบอบรม (E-Learning)'}
                  </Title>
                  {!isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <EnvironmentOutlined style={{ color: '#2563eb', fontSize: '14px' }} /><Text type="secondary" style={{ fontSize: '13px', fontWeight: 500 }}>Map Ta Phut - Enterprise Level</Text>
                    </div>
                  )}
                </div>
              </div>
              
              <Space size={isMobile ? 'small' : 'middle'} align="center">
                
                <Button 
                  type="primary" 
                  shape="circle" 
                  icon={<ScanOutlined style={{ fontSize: '18px' }} />} 
                  size={isMobile ? "middle" : "large"} 
                  onClick={handleOpenScannerClick} 
                  style={{ background: '#10b981', border: 'none', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }} 
                  title="สแกน QR Code"
                />

                {!isMobile && (
                  <Badge count={3} dot offset={[-4, 4]}><Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: '20px', color: '#64748b' }} />} /></Badge>
                )}
                {!isMobile && <div style={{ width: '1px', height: '32px', background: '#e2e8f0', margin: '0 8px' }}></div>}
                
                <div style={{ background: '#ffffff', borderRadius: '100px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* 🟢 ดึงรูปจาก DB มาแสดงแทน */}
                  <Avatar 
                    src={getDisplayAvatar()} 
                    size={isMobile ? "default" : "large"} 
                    style={{ backgroundColor: currentUser?.role === 'SAFETY_ENGINEER' ? '#4f46e5' : currentUser?.role === 'AREA_OWNER' ? '#f59e0b' : '#2563eb', border: '2px solid #fff' }} 
                    icon={!getDisplayAvatar() && <UserOutlined />} 
                  />
                  {!isMobile && (
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', paddingRight: '8px' }}>
                      <Text strong style={{ fontSize: '13px', color: '#1e293b' }}>{currentUser?.full_name}</Text>
                      <Text style={{ fontSize: '11px', color: currentUser?.role === 'SAFETY_ENGINEER' ? '#4f46e5' : currentUser?.role === 'AREA_OWNER' ? '#f59e0b' : '#2563eb', fontWeight: 700 }}>{currentUser?.role}</Text>
                    </div>
                  )}
                  <Button type="text" shape="circle" icon={<LogoutOutlined />} onClick={handleLogout} style={{ color: '#ef4444' }} title="ออกจากระบบ" />
                </div>

                {activeMenu === 'E_PERMIT' && currentUser?.role === 'CONTRACTOR' && (<Button type="primary" shape={isMobile ? "circle" : "round"} icon={<PlusOutlined />} size={isMobile ? "middle" : "large"} onClick={() => setIsModalOpen(true)} style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', border: 'none', boxShadow: '0 4px 15px rgba(37,99,235,0.3)', fontWeight: 600 }}>{!isMobile && 'ขอ Permit ใหม่'}</Button>)}
                {activeMenu === 'BBS' && (currentUser?.role === 'SAFETY_ENGINEER' || currentUser?.role === 'AREA_OWNER') && (<Button type="primary" shape={isMobile ? "circle" : "round"} icon={<EyeOutlined />} size={isMobile ? "middle" : "large"} onClick={() => setIsBbsModalOpen(true)} style={{ background: '#10b981', border: 'none', boxShadow: '0 4px 15px rgba(16,185,129,0.3)', fontWeight: 600 }}>{!isMobile && 'บันทึก BBS'}</Button>)}
              </Space>
            </Header>

            <Content style={{ padding: isMobile ? '12px' : '24px', overflow: 'initial' }}>
              {activeMenu === 'DASHBOARD' && <Dashboard currentUser={currentUser} />}
              
              {activeMenu === 'E_PERMIT' && (
                <Card title={<div className="flex items-center gap-2 text-slate-800"><FileTextOutlined className="text-blue-500" /><b className="text-lg md:text-xl">รายการ Work Queue</b></div>} bordered={false} style={glassPanel} styles={{ header: { borderBottom: '1px solid rgba(0,0,0,0.05)' }, body: { padding: isMobile ? '12px' : '24px' }}}>
                  <WorkPermitQueue 
                    permits={realPermits} 
                    loading={loading} 
                    currentUser={currentUser} 
                    onPreviewFile={handlePreviewFile} 
                    onViewDetails={handleViewDetails} 
                    onUpdateStatus={handleUpdateStatus} 
                  />
                </Card>
              )}

              {activeMenu === 'E_PASSPORT' && <EPassport currentUser={currentUser} lineProfile={lineProfile} />}
              
              {activeMenu === 'BBS' && (
                <Card title={<b style={{fontSize: '18px', color: '#1d1d1f'}}>ประวัติ BBS</b>} bordered={false} style={glassPanel}>
                  <BBSHistory records={bbsRecords} />
                </Card>
              )}

              {activeMenu === 'CONFINED_SPACE' && (
                <ConfinedSpaceBoard 
                  activePermits={activeConfinedPermits}
                  selectedPermit={selectedConfinedPermit}
                  onSelectPermit={setSelectedConfinedPermit}
                  entries={confinedEntries}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  onEvacuate={handleEvacuateAll}
                  currentUser={currentUser}
                  isMobile={isMobile}
                  glassPanel={glassPanel}
                />
              )}

              {activeMenu === 'CERTIFICATE' && <CertificateManager currentUser={currentUser} />}
              {activeMenu === 'INCIDENT' && <IncidentReport currentUser={currentUser} />}
              {activeMenu === 'E_LEARNING' && <ELearning currentUser={currentUser} />}
              {activeMenu === 'EQUIPMENT' && <EquipmentInspection currentUser={currentUser} />} 
            </Content>
          </Layout>

          <Modal title={<Space><EyeOutlined style={{color:'#10b981'}}/><Title level={4} style={{margin: 0}}>บันทึกพฤติกรรม (BBS Observation)</Title></Space>} open={isBbsModalOpen} onCancel={() => setIsBbsModalOpen(false)} onOk={() => bbsForm.submit()} okText="บันทึกข้อมูล" cancelButtonProps={{shape: 'round'}} okButtonProps={{shape: 'round', style: {background: '#10b981', border: 'none'}}}>
            <Form form={bbsForm} layout="vertical" onFinish={handleCreateBbs} style={{ marginTop: '24px' }}>
              <Form.Item name="location" label="พื้นที่ที่พบเห็น" rules={[{required: true}]}><Input placeholder="เช่น Tank Farm Zone B" /></Form.Item>
              <Form.Item name="behavior_type" label="ประเภทพฤติกรรม" rules={[{required: true}]}>
                <Radio.Group optionType="button" buttonStyle="solid">
                  <Radio.Button value="SAFE" style={{ background: '#10b981', borderColor: '#10b981' }}>พฤติกรรมปลอดภัย (Safe)</Radio.Button>
                  <Radio.Button value="UNSAFE" style={{ background: '#ef4444', borderColor: '#ef4444' }}>พฤติกรรมเสี่ยง (Unsafe)</Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="category" label="หมวดหมู่ความปลอดภัย" rules={[{required: true}]}><Select placeholder="เลือกหมวดหมู่" options={[{value:'PPE', label:'อุปกรณ์ป้องกันภัยส่วนบุคคล (PPE)'}, {value:'TOOLS', label:'การใช้เครื่องมือ/อุปกรณ์'}, {value:'POSTURE', label:'ท่าทางการทำงาน/การยกของ'}, {value:'HOUSEKEEPING', label:'ความสะอาด/ความเป็นระเบียบ'}]} /></Form.Item>
              <Form.Item name="description" label="รายละเอียดพฤติกรรม" rules={[{required: true}]}><Input.TextArea rows={2} placeholder="อธิบายสิ่งที่พบเห็น..." /></Form.Item>
              <Form.Item name="action_taken" label="การดำเนินการหลังพบเห็น" rules={[{required: true}]}><Select placeholder="เลือกการดำเนินการ" options={[{value:'PRAISED', label:'กล่าวชื่นชม'}, {value:'VERBAL_WARNING', label:'ตักเตือน'}, {value:'STOP_WORK', label:'สั่งหยุดงานทันที'}]} /></Form.Item>
            </Form>
          </Modal>

          {/* 🌟 NEW DETAILS MODAL */}
          <Modal 
            title={null} 
            open={isDetailModalOpen} 
            onCancel={() => setIsDetailModalOpen(false)} 
            width={700} 
            footer={null}
            styles={{ body: { padding: 0 } }}
            centered
          >
            {selectedPermitDetail && (
              <div id="pdf-document-content" className="bg-slate-50 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 md:p-8 text-white text-center rounded-t-xl relative">
                  <div className="absolute top-4 right-4">
                    {getStatusDisplayModern(selectedPermitDetail.status)}
                  </div>
                  <FileTextOutlined className="text-4xl md:text-5xl mb-2 opacity-80" />
                  <h2 className="text-2xl md:text-3xl font-bold m-0 tracking-widest text-white">WORK PERMIT</h2>
                  <p className="text-blue-200 text-xs md:text-sm mt-1 mb-0">SafetyOS Enterprise Management</p>
                </div>

                <div className="p-4 md:p-6">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                      <span className="text-gray-500 font-bold text-sm">เลขที่เอกสาร</span>
                      <span className="text-base font-bold text-blue-600 font-mono bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{selectedPermitDetail.permit_number}</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><ToolOutlined /></div>
                        <div>
                          <p className="text-xs text-slate-400 m-0">หัวข้องาน</p>
                          <p className="font-bold text-slate-800 m-0 text-base">{selectedPermitDetail.title}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><EnvironmentOutlined /></div>
                        <div>
                          <p className="text-xs text-slate-400 m-0">พื้นที่ปฏิบัติงาน</p>
                          <p className="font-semibold text-slate-700 m-0">{selectedPermitDetail.location_detail}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><UserOutlined /></div>
                        <div>
                          <p className="text-xs text-slate-400 m-0">ผู้ขออนุญาต</p>
                          <p className="font-semibold text-slate-700 m-0">{selectedPermitDetail.applicant?.full_name} <span className="text-xs font-normal text-slate-400">({selectedPermitDetail.applicant?.department})</span></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-4">
                    <div className="flex items-center gap-2 mb-3 text-blue-800 font-bold text-sm">
                      <ClockCircleOutlined /> ระยะเวลาดำเนินการ
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">เริ่ม</span>
                        <span className="font-bold text-slate-700">{dayjs(selectedPermitDetail.start_time).format('DD/MM/YY')} <span className="text-blue-600 ml-1">{dayjs(selectedPermitDetail.start_time).format('HH:mm')}</span></span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">สิ้นสุด</span>
                        <span className="font-bold text-slate-700">{dayjs(selectedPermitDetail.end_time).format('DD/MM/YY')} <span className="text-red-500 ml-1">{dayjs(selectedPermitDetail.end_time).format('HH:mm')}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
                    <div className="flex items-center gap-2 mb-3 text-orange-600 font-bold text-sm">
                      <SafetyCertificateOutlined /> มาตรการความปลอดภัย
                    </div>
                    <div className="bg-orange-50/50 p-4 rounded-xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-orange-100 font-medium">
                      {selectedPermitDetail.description}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                    <div className="text-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="border-b-2 border-slate-300 pb-2 mb-2 font-mono text-base text-slate-800 h-8 flex items-end justify-center">
                        {selectedPermitDetail.applicant?.full_name}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">ผู้ขออนุญาต</span>
                    </div>
                    <div className="text-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className={`border-b-2 pb-2 mb-2 font-bold text-sm h-8 flex items-end justify-center ${selectedPermitDetail.status === 'APPROVED' ? 'text-emerald-600 border-emerald-200' : 'text-orange-500 border-orange-200'}`}>
                        {selectedPermitDetail.status === 'APPROVED' ? 'APPROVER SIGNED' : 'WAITING APPROVAL'}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">ผู้อนุมัติ (Area Owner / จป.)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 border-t border-slate-200 flex gap-3 sticky bottom-0 z-10">
                  <Button size="large" onClick={() => setIsDetailModalOpen(false)} className="flex-1 rounded-xl h-12 font-bold bg-slate-100 border-none text-slate-600 hover:bg-slate-200">
                    ปิดหน้าต่าง
                  </Button>
                  <Button 
                    size="large" 
                    type="primary" 
                    onClick={handleExportPDF} 
                    loading={isExportingPDF}
                    icon={<FilePdfOutlined />} 
                    className="flex-1 rounded-xl h-12 font-bold bg-indigo-600 hover:bg-indigo-700 border-none shadow-md shadow-indigo-500/30"
                  >
                    {isExportingPDF ? 'กำลังสร้างไฟล์...' : 'โหลด PDF'}
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          <Modal title="เอกสารแนบ" open={isPreviewOpen} onCancel={() => setIsPreviewOpen(false)} width={850} footer={[<Button key="close" onClick={() => setIsPreviewOpen(false)}>ปิด</Button>, <Button key="download" type="primary" href={previewUrl} target="_blank">เปิดหน้าต่างใหม่</Button>]}>
            <div style={{ height: '70vh', display: 'flex', justifyContent: 'center', background: '#f8fafc', borderRadius: '12px', overflow: 'hidden' }}>{previewType === 'image' ? <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} />}</div>
          </Modal>

          <Modal title={null} footer={null} open={isModalOpen} onCancel={() => { setIsModalOpen(false); setFileList([]); form.resetFields(); }} width={750} centered styles={{ body: { padding: 0 } }}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-xl text-white shadow-sm">
              <h2 className="text-2xl font-bold m-0 flex items-center gap-3 text-white">
                <div className="bg-white/20 p-2 rounded-lg"><FileTextOutlined /></div>
                ระบบขออนุญาตทำงาน (E-Permit)
              </h2>
              <p className="text-blue-100 text-sm mt-2 opacity-90 mb-0">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อความปลอดภัยในการปฏิบัติงาน และเพื่อความรวดเร็วในการอนุมัติ</p>
            </div>

            <div className="p-4 md:p-8 bg-slate-50 overflow-y-auto max-h-[80vh]">
              <Form form={form} layout="vertical" onFinish={handleCreatePermit} requiredMark={false}>
                
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6">
                  <div className="flex items-center gap-2 mb-4 text-blue-700 font-bold border-b border-slate-100 pb-3">
                    <AppstoreAddOutlined className="text-lg" /> ข้อมูลพื้นฐานของงาน
                  </div>
                  <Form.Item name="title" label={<span className="font-bold text-slate-700">หัวข้องาน (Title) <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาระบุหัวข้องาน' }]} extra={<span className="text-xs text-slate-400">ระบุชื่องานหรือรหัสอุปกรณ์ให้ชัดเจน</span>}>
                     <Input size="large" placeholder="เช่น ซ่อมบำรุงปั๊มน้ำ P-101, งานเชื่อมโครงหลังคา" className="rounded-xl border-slate-300" />
                  </Form.Item>
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item name="permit_type" label={<span className="font-bold text-slate-700">ประเภทงาน <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'เลือกประเภทงาน' }]}>
                        <Select size="large" placeholder="เลือกประเภทงาน" className="w-full">
                          <Select.Option value="HOT_WORK">🔥 Hot Work (งานร้อน)</Select.Option>
                          <Select.Option value="CONFINED_SPACE">🕳️ Confined Space (ที่อับอากาศ)</Select.Option>
                          <Select.Option value="ELECTRICAL">⚡ Electrical (ไฟฟ้า)</Select.Option>
                          <Select.Option value="COLD_WORK">❄️ Cold Work (ทั่วไป)</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="workers" label={<span className="font-bold text-slate-700">จำนวนคนปฏิบัติงาน <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'ระบุจำนวนคน' }]}>
                        <InputNumber size="large" min={1} placeholder="0" className="w-full rounded-xl" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="location_detail" label={<span className="font-bold text-slate-700">สถานที่ปฏิบัติงาน <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'ระบุสถานที่' }]} style={{marginBottom: 0}}>
                    <Input size="large" prefix={<EnvironmentOutlined className="text-slate-400 mr-2" />} placeholder="ระบุตึก / ชั้น / แผนก / โซน" className="rounded-xl border-slate-300" />
                  </Form.Item>
                </div>

                <div className="bg-blue-50 p-5 rounded-2xl shadow-sm border border-blue-100 mb-6">
                  <div className="flex items-center gap-2 mb-4 text-blue-800 font-bold border-b border-blue-200 pb-3">
                    <HourglassOutlined className="text-lg" /> ระยะเวลาปฏิบัติงาน <span className="text-red-500">*</span>
                  </div>
                  <Form.Item name="timeRange" rules={[{ required: true, message: 'กรุณาระบุเวลาเริ่มและสิ้นสุด' }]} style={{marginBottom: 0}}>
                    <ModernDateRange />
                  </Form.Item>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6">
                  <div className="flex items-center gap-2 mb-4 text-orange-600 font-bold border-b border-slate-100 pb-3">
                    <SafetyCertificateOutlined className="text-lg" /> การเตรียมความพร้อมด้านความปลอดภัย
                  </div>
                  <Form.Item name="ppe" label={<span className="font-bold text-slate-700">อุปกรณ์ป้องกันภัย (PPE) ที่จำเป็น</span>} extra={<span className="text-xs text-slate-400">แตะเพื่อเลือกอุปกรณ์ที่ต้องใช้ในงานนี้ (เลือกได้มากกว่า 1)</span>}>
                    <ModernToggleChips activeColor="bg-blue-600 text-white border-blue-600" options={[{label:'หมวกนิรภัย', value:'Helmet'}, {label:'รองเท้านิรภัย', value:'Shoes'}, {label:'ถุงมือ', value:'Gloves'}, {label:'แว่นตานิรภัย', value:'Glasses'}, {label:'เข็มขัดกันตก', value:'Harness'}, {label:'ที่อุดหู', value:'Earplugs'}]} />
                  </Form.Item>
                  <Form.Item name="safety_measures" label={<span className="font-bold text-slate-700 mt-2 block">มาตรการควบคุมพื้นที่</span>} extra={<span className="text-xs text-slate-400">แตะเพื่อยืนยันมาตรการที่เตรียมไว้แล้ว</span>}>
                    <ModernToggleChips activeColor="bg-emerald-500 text-white border-emerald-500" options={[{label:'ถังดับเพลิง', value:'Fire Extinguisher'}, {label:'ผู้เฝ้าระวัง', value:'Standby Person'}, {label:'ตรวจวัดก๊าซ', value:'Gas Testing'}, {label:'กั้นพื้นที่', value:'Barricade'}, {label:'ตัดระบบ (LOTO)', value:'LOTO'}]} />
                  </Form.Item>
                  <Form.Item name="description" label={<span className="font-bold text-slate-700 mt-2 block">รายละเอียดเพิ่มเติม / หมายเหตุ</span>} style={{marginBottom: 0}}>
                    <Input.TextArea rows={2} placeholder="เช่น ข้อควรระวังพิเศษ, ชื่อผู้เฝ้าระวัง" className="rounded-xl border-slate-300" />
                  </Form.Item>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-slate-700">เอกสาร JSA (Job Safety Analysis) <span className="text-red-500">*</span></span>
                  </div>
                  <div className="text-xs text-slate-500 mb-4"><InfoCircleOutlined /> จำเป็นต้องแนบเอกสารประเมินความเสี่ยงก่อนเริ่มงาน</div>
                  <Form.Item name="attachment" rules={[{ required: true, message: 'กรุณาแนบไฟล์ JSA' }]} style={{marginBottom: 0}}>
                    <Upload beforeUpload={() => false} maxCount={1} fileList={fileList} onChange={(i) => setFileList(i.fileList)}>
                      <div className="w-full border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer">
                        <div className="bg-blue-200 text-blue-600 p-3 rounded-full mb-3 shadow-sm">
                          <UploadOutlined className="text-2xl" />
                        </div>
                        <span className="text-slate-700 font-semibold text-base mb-1">แตะเพื่อเลือกไฟล์</span>
                        <span className="text-slate-400 text-xs">รองรับ PDF, JPG, PNG</span>
                      </div>
                    </Upload>
                  </Form.Item>
                </div>

                <div className="flex gap-4 sticky bottom-0 bg-slate-50 py-2 border-t border-slate-200 mt-[-10px] pt-4 z-10">
                  <Button size="large" onClick={() => setIsModalOpen(false)} style={{ flex: 1, borderRadius: '16px', height: '56px', fontWeight: 'bold' }}>
                    ยกเลิก
                  </Button>
                  <Button size="large" type="primary" htmlType="submit" loading={isSubmitting} style={{ flex: 1, borderRadius: '16px', height: '56px', fontWeight: 'bold', background: '#2563eb', border: 'none', boxShadow: '0 10px 15px -3px rgba(37,99,235,0.3)' }}>
                    ส่งคำขออนุญาต
                  </Button>
                </div>
              </Form>
            </div>
          </Modal>

          <Modal 
            title={<div className="flex items-center gap-2 text-emerald-600"><ScanOutlined className="text-xl"/> <span className="font-bold">สแกนตรวจสอบประวัติ (E-Passport)</span></div>} 
            open={isScannerOpen} 
            onCancel={() => setIsScannerOpen(false)} 
            footer={null}
            centered
            destroyOnClose 
            styles={{ body: { padding: '24px 12px', background: '#f8fafc' } }}
          >
            <QRScanner 
              onScan={(text) => {
                setIsScannerOpen(false); 
                if (text.includes('/verify/')) {
                  const id = text.split('/verify/')[1];
                  setVerifyUserId(id); 
                } else {
                  message.error('QR Code นี้ไม่ใช่ของระบบ SafetyOS!');
                }
              }} 
            />
          </Modal>

          <style>{`
            /* 🌟 สไตล์พิเศษสำหรับทำให้ตาราง Ant Design ดูเป็น Tailwind มากขึ้น */
            .modern-table .ant-table {
              background: transparent;
            }
            .modern-table .ant-table-thead > tr > th {
              background-color: #f8fafc;
              color: #64748b;
              font-weight: 800;
              font-size: 13px;
              border-bottom: 2px solid #e2e8f0;
              padding: 16px;
            }
            .modern-table .ant-table-tbody > tr > td {
              border-bottom: 1px solid #f1f5f9;
              padding: 16px;
              background: white;
            }
            .modern-table .ant-table-tbody > tr:hover > td {
              background-color: #f8fafc;
            }
          `}</style>
        </Layout>
      </div>
    </ConfigProvider>
  );
}