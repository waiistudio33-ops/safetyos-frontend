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
  CalendarOutlined, ClockCircleOutlined, ToolOutlined, HourglassOutlined, InfoCircleOutlined, AppstoreAddOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import html2pdf from 'html2pdf.js'; 
import liff from '@line/liff'; // 🟢 1. IMPORT LIFF SDK
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

// ... (เก็บ WaveSeparator, ModernDateRange, ModernToggleChips, getStatusDisplayModern ไว้เหมือนเดิม ไม่ลบครับ)
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

const getStatusDisplayModern = (status: string) => { 
  switch(status) { 
    case 'PENDING_AREA_OWNER': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-600"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>รอเจ้าของพื้นที่</span>; 
    case 'PENDING_SAFETY': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>รอ จป. อนุมัติ</span>; 
    case 'APPROVED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-600"><CheckCircleOutlined /> อนุมัติแล้ว</span>; 
    case 'REJECTED': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600"><CloseOutlined /> ไม่อนุมัติ</span>; 
    default: return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">{status}</span>; 
  } 
};

export default function App() {
  const screens = useBreakpoint(); 
  const isMobile = !screens.md; 

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true); 
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); 
  const [activeMenu, setActiveMenu] = useState('DASHBOARD'); 

  // 🟢 2. State สำหรับเก็บข้อมูลโปรไฟล์จาก LINE
  const [lineProfile, setLineProfile] = useState<any>(null);

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

  const [bbsRecords, setBbsRecords] = useState<any[]>([]);
  const [activeConfinedPermits, setActiveConfinedPermits] = useState<any[]>([]);
  const [selectedConfinedPermit, setSelectedConfinedPermit] = useState<string | null>(null);
  const [confinedEntries, setConfinedEntries] = useState<any[]>([]);
  const [isBbsModalOpen, setIsBbsModalOpen] = useState(false);
  const [bbsForm] = Form.useForm();
  const [confinedForm] = Form.useForm();
  const [currentTime, setCurrentTime] = useState(dayjs());

  // 🟢 3. Initialize LINE LIFF เมื่อเปิดแอป
  // 🟢 รวมระบบเช็คล็อกอินเดิม + LINE LIFF เข้าด้วยกัน
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. เช็ค LocalStorage ก่อน (เผื่อเคยล็อกอินค้างไว้)
        const savedUser = localStorage.getItem('safetyos_user');
        if (savedUser) {
          try {
            setCurrentUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
          } catch (e) {
            localStorage.removeItem('safetyos_user');
          }
        }

        // 2. สั่งเริ่มการทำงานของ LINE LIFF
        // ⚠️ อย่าลืมแก้ 'YOUR_LIFF_ID' เป็นไอดีของคุณวิวนะครับ
        await liff.init({ liffId: 'https://liff.line.me/2009277207-jNY8QghJ' }); 

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setLineProfile(profile);

          // 3. ถ้าในเครื่องยังไม่ได้ล็อกอิน ให้ลอง Auto-Login ผ่าน LINE ID
          if (!savedUser) {
            try {
              const res = await axios.post('https://safetyos-backend.onrender.com/login/line', { line_id: profile.userId });
              localStorage.setItem('safetyos_user', JSON.stringify(res.data.user));
              setCurrentUser(res.data.user);
              setIsAuthenticated(true);
              message.success(`เข้าสู่ระบบอัตโนมัติ: ${res.data.user.full_name}`);
            } catch (e) {
              console.log("ผู้ใช้นี้ยังไม่ได้ผูกบัญชี LINE");
            }
          }
        } else if (liff.isInClient()) {
          // ถ้าเปิดในแอป LINE แต่ยังไม่ได้ล็อกอิน ให้เด้งหน้าล็อกอิน LINE
          liff.login();
        }

      } catch (err) {
        console.log("LIFF Init Failed (อาจจะเปิดผ่านเว็บปกติไม่ได้เปิดผ่าน LINE)", err);
      } finally {
        // 🔴 สำคัญที่สุด: ไม่ว่าจะสำเร็จหรือพัง ต้องสั่งปลดหน้าจอโหลด (Spin) ทิ้งเสมอ!
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

  // 🟢 2. ตอนล็อกอินปกติ ให้แนบ userId ไปด้วยเพื่อผูกบัญชี
  const handleLogin = async (values: any) => {
    setIsLoggingIn(true);
    try {
      // เอาข้อมูล username/password มารวมกับ lineProfile.userId
      const payload = { 
        ...values, 
        line_id: lineProfile ? lineProfile.userId : null 
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
    if (liff.isLoggedIn()) liff.logout(); // 🟢 4. Logout LINE ด้วย (ถ้ามี)
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
      message.success('Check-in สำเร็จ!'); confinedForm.resetFields(); fetchEntries(selectedConfinedPermit!);
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
  const handleExportPDF = () => { const element = document.getElementById('pdf-document-content'); if (!element) return; html2pdf().set({ margin: [0.5, 0.5, 0.5, 0.5], filename: `WorkPermit_${selectedPermitDetail?.permit_number}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, windowWidth: 800 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } }).from(element).save(); message.success('ดาวน์โหลดไฟล์ PDF สำเร็จ!'); };
  
  const handleCreatePermit = async (values: any) => {
    try {
      if (!currentUser) return message.error('กรุณาเข้าสู่ระบบก่อน');
      if (fileList.length === 0) return message.error('⚠️ กรุณาแนบเอกสาร JSA');
      setIsSubmitting(true); 
      let fileUrl = null; let fileNameToSave = null;
      if (fileList.length > 0) { const file = fileList[0].originFileObj; const uniqueName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${file.name.split('.').pop()}`; const { error } = await supabase.storage.from('permits').upload(uniqueName, file); if (error) { message.error('อัปโหลดไฟล์ไม่สำเร็จ!'); setIsSubmitting(false); return; } const { data: publicUrlData } = supabase.storage.from('permits').getPublicUrl(uniqueName); fileUrl = publicUrlData.publicUrl; fileNameToSave = file.name; }
      const startTime = values.timeRange && values.timeRange[0] ? dayjs(values.timeRange[0]).toISOString() : new Date().toISOString(); const endTime = values.timeRange && values.timeRange[1] ? dayjs(values.timeRange[1]).toISOString() : new Date().toISOString();
      const ppeString = values.ppe ? `\n🛡️ อุปกรณ์ PPE: ${values.ppe.join(', ')}` : ''; const safetyString = values.safety_measures ? `\n⚠️ มาตรการ: ${values.safety_measures.join(', ')}` : ''; const workerString = values.workers ? `\n👷 จำนวนผู้ปฏิบัติงาน: ${values.workers} คน` : ''; const finalDescription = `${values.description || 'ไม่มีรายละเอียดเพิ่มเติม'}${workerString}${ppeString}${safetyString}`;
      await axios.post('https://safetyos-backend.onrender.com/permits', { title: values.title, description: finalDescription, permit_type: values.permit_type, location_detail: values.location_detail, start_time: startTime, end_time: endTime, applicant_id: currentUser.id, attachment_url: fileUrl, attachment_name: fileNameToSave });
      message.success('ส่งคำขอ Permit สำเร็จ!'); setIsModalOpen(false); form.resetFields(); setFileList([]); fetchPermits();
    } catch (error) { message.error('สร้างรายการไม่สำเร็จ'); } finally { setIsSubmitting(false); }
  };

  const handleUpdateStatus = async (permitId: string, currentStatus: string, action: 'APPROVE' | 'REJECT') => {
    try { let nextStatus = ''; if (action === 'REJECT') nextStatus = 'REJECTED'; else { if (currentStatus === 'PENDING_AREA_OWNER') nextStatus = 'PENDING_SAFETY'; else if (currentStatus === 'PENDING_SAFETY') nextStatus = 'APPROVED'; } await axios.put(`https://safetyos-backend.onrender.com/permits/${permitId}`, { status: nextStatus, approver_id: currentUser.id, comment: action === 'APPROVE' ? 'อนุมัติผ่านระบบ E-Permit' : 'ไม่อนุมัติตามมาตรการความปลอดภัย' }); message.success(`ดำเนินการ ${action} เรียบร้อยแล้ว`); fetchPermits(); } catch (error) { message.error('ไม่สามารถอัปเดตสถานะได้'); }
  };

  const getPermitTypeDisplay = (type: string) => { switch(type) { case 'HOT_WORK': return { icon: <FireOutlined />, color: 'volcano', text: 'Hot Work' }; case 'CONFINED_SPACE': return { icon: <BuildOutlined />, color: 'purple', text: 'Confined Space' }; case 'ELECTRICAL': return { icon: <ThunderboltOutlined />, color: 'gold', text: 'Electrical' }; default: return { icon: <BuildOutlined />, color: 'geekblue', text: 'Cold Work' }; } };

  const glassPanel = { background: 'rgba(255, 255, 255, 0.4)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)' };
  const modernHeaderStyle = { background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', borderRadius: isMobile ? '0px' : '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: 'none', margin: isMobile ? '0' : '16px 24px 0', padding: isMobile ? '0 12px' : '0 24px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, position: isMobile ? 'sticky' as 'sticky' : 'relative' as 'relative', top: 0 };

  const columns: ColumnsType<any> = [
    { title: 'Permit No.', dataIndex: 'permit_number', key: 'permit_number', width: 130, render: (text) => <Text style={{ fontFamily: 'monospace', fontWeight: 700, color: '#007AFF', background: 'rgba(0, 122, 255, 0.1)', padding: '4px 8px', borderRadius: '8px' }}>{text || 'PTW-XX'}</Text> },
    { title: 'รายละเอียดงาน', key: 'details', render: (_, record) => ( <Space direction="vertical" size={2}><Text strong style={{ color: '#1d1d1f', fontSize: '15px' }}>{record.title}</Text><Text type="secondary" style={{ fontSize: '12px' }}><TeamOutlined /> {record.applicant?.full_name || 'ไม่ทราบชื่อ'} ({record.applicant?.department})</Text><Text type="secondary" style={{ fontSize: '12px' }}><EnvironmentOutlined /> {record.location_detail}</Text>{record.attachment_url && (<Button type="dashed" size="small" icon={<FileTextOutlined />} onClick={() => handlePreviewFile(record.attachment_url)} style={{ marginTop: '4px', borderRadius: '8px', fontSize: '12px', color: '#007AFF', borderColor: '#007AFF' }}>ดูเอกสาร JSA</Button>)}</Space> ) },
    { title: 'ประเภท', dataIndex: 'permit_type', key: 'type', width: 140, render: (type) => { const { icon, color, text } = getPermitTypeDisplay(type); return <Tag icon={icon} color={color} style={{ borderRadius: '10px', padding: '4px 10px', border: 'none', fontWeight: 600 }}>{text}</Tag>; }, responsive: ['md'] }, 
    { title: 'สถานะ', dataIndex: 'status', key: 'status', width: 160, render: (status) => getStatusDisplayModern(status) },
    { title: 'Action', key: 'action', width: 190, render: (_, record) => {
        const isAreaOwnerTurn = record.status === 'PENDING_AREA_OWNER' && currentUser?.role === 'AREA_OWNER'; const isSafetyTurn = record.status === 'PENDING_SAFETY' && currentUser?.role === 'SAFETY_ENGINEER';
        return (
          <Space size="small" wrap>
            <Button size="small" type="default" shape="round" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} style={{ fontSize: '12px' }}>รายละเอียด</Button>
            {(isAreaOwnerTurn || isSafetyTurn) && ( <Space size="small"><Button type="primary" shape="round" icon={<CheckOutlined />} onClick={() => handleUpdateStatus(record.id, record.status, 'APPROVE')} style={{ background: '#34c759', border: 'none', fontSize: '12px' }}>อนุมัติ</Button><Button type="primary" shape="circle" icon={<CloseOutlined />} onClick={() => handleUpdateStatus(record.id, record.status, 'REJECT')} style={{ background: '#ff3b30', border: 'none' }} /></Space> )}
            {(record.status === 'APPROVED' || record.status === 'REJECTED') && <Text type="secondary" style={{fontSize: '12px'}}><CheckOutlined /> จบงานแล้ว</Text>}
          </Space>
        );
      },
    },
  ];

  if (isAuthChecking) {
    return ( <ConfigProvider theme={{ token: { colorPrimary: '#007AFF' }}}> <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}> <Spin size="large" description="กำลังโหลดข้อมูล..." /> </div> </ConfigProvider> );
  }

  // 🔥 Login Screen (แก้ให้รองรับการแสดงผลเชื่อม LINE)
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
              
              {/* 🟢 5. แสดงข้อความทักทายถ้าเปิดจาก LINE */}
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

  // --- ✨ อัปเกรด Main Layout (Sidebar Menu สวยขึ้น สไตล์ Modern) ---
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
                {!isMobile && (
                  <Badge count={3} dot offset={[-4, 4]}><Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: '20px', color: '#64748b' }} />} /></Badge>
                )}
                {!isMobile && <div style={{ width: '1px', height: '32px', background: '#e2e8f0', margin: '0 8px' }}></div>}
                
                <div style={{ background: '#ffffff', borderRadius: '100px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* 🟢 6. ถ้ายูสเซอร์เปิดจาก LINE ให้เอารูปโปรไฟล์ LINE มาโชว์เลย! */}
                  <Avatar 
                    src={lineProfile?.pictureUrl} 
                    size={isMobile ? "default" : "large"} 
                    style={{ backgroundColor: currentUser?.role === 'SAFETY_ENGINEER' ? '#4f46e5' : currentUser?.role === 'AREA_OWNER' ? '#f59e0b' : '#2563eb', border: '2px solid #fff' }} 
                    icon={!lineProfile && <UserOutlined />} 
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
                <Card title={<b style={{fontSize: '18px', color: '#1d1d1f'}}>รายการ Work Queue</b>} bordered={false} style={glassPanel} styles={{ header: { borderBottom: '1px solid rgba(0,0,0,0.05)' }, body: { padding: isMobile ? '0' : '24px' }}}>
                  <Table columns={columns} dataSource={realPermits} loading={loading} pagination={{ pageSize: 8 }} size="small" scroll={{ x: 'max-content' }} />
                </Card>
              )}
              {activeMenu === 'E_PASSPORT' && <EPassport currentUser={currentUser} lineProfile={lineProfile} />}
              {activeMenu === 'BBS' && (
                <Card title={<b style={{fontSize: '18px', color: '#1d1d1f'}}>ประวัติ BBS</b>} bordered={false} style={glassPanel}>
                  <List
                    itemLayout="horizontal"
                    dataSource={bbsRecords}
                    renderItem={item => (
                      <List.Item style={{ background: '#fff', marginBottom: '12px', padding: '16px', borderRadius: '16px', borderLeft: `6px solid ${item.behavior_type === 'SAFE' ? '#10b981' : '#ef4444'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'block' }}>
                        <List.Item.Meta
                          avatar={<Avatar icon={item.behavior_type === 'SAFE' ? <CheckCircleOutlined /> : <WarningOutlined />} style={{ backgroundColor: item.behavior_type === 'SAFE' ? '#d1fae5' : '#fee2e2', color: item.behavior_type === 'SAFE' ? '#10b981' : '#ef4444' }} size="large" />}
                          title={<Space wrap><Text strong>{item.category}</Text> <Tag color={item.behavior_type === 'SAFE' ? 'success' : 'error'}>{item.behavior_type}</Tag></Space>}
                          description={
                            <div style={{ marginTop: '8px' }}>
                              <Text>{item.description}</Text><br/>
                              <Text type="secondary" style={{ fontSize: '12px' }}><EnvironmentOutlined /> {item.location} | ตรวจโดย: {item.observer?.full_name}</Text><br/>
                              <Tag color="blue" style={{ marginTop: '8px' }}>Action: {item.action_taken}</Tag>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}

              {activeMenu === 'CONFINED_SPACE' && (
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}> 
                    <Card title={<b style={{color: '#1d1d1f'}}>1. เลือกพื้นที่ปฏิบัติงาน</b>} bordered={false} style={{...glassPanel, height: '100%'}}>
                      {activeConfinedPermits.length === 0 ? <Text type="secondary">ไม่มีงานที่อับอากาศที่กำลังดำเนินการ</Text> : (
                        <Menu mode="vertical" selectedKeys={[selectedConfinedPermit || '']} style={{ border: 'none', background: 'transparent' }} onClick={(e) => setSelectedConfinedPermit(e.key)}>
                          {activeConfinedPermits.map(p => (
                            <Menu.Item key={p.id} style={{ borderRadius: '12px', height: 'auto', padding: '12px', marginBottom: '8px', border: '1px solid #e5e5ea', background: selectedConfinedPermit === p.id ? '#eff6ff' : '#fff' }}>
                              <Text strong style={{ color: '#8b5cf6' }}>{p.permit_number}</Text><br/>
                              <Text style={{ fontSize: '12px' }}>{p.location_detail}</Text>
                            </Menu.Item>
                          ))}
                        </Menu>
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} md={16}> 
                    <Card 
                      title={
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px'}}>
                          <b style={{color: '#1d1d1f'}}>2. บอร์ดเช็คชื่อเข้า-ออก</b>
                          {selectedConfinedPermit && (
                            <Popconfirm title="ยืนยันอพยพฉุกเฉิน?" onConfirm={handleEvacuateAll} okText="อพยพทันที" okButtonProps={{danger: true}} cancelText="ยกเลิก">
                              <Button type="primary" danger icon={<AlertOutlined />} size={isMobile ? "small" : "middle"} className="animate-pulse" style={{fontWeight: 'bold'}}>อพยพ!</Button>
                            </Popconfirm>
                          )}
                        </div>
                      } 
                      bordered={false} style={{...glassPanel, minHeight: '500px'}}
                    >
                      {selectedConfinedPermit ? (
                        <>
                          <Form form={confinedForm} layout={isMobile ? "vertical" : "inline"} onFinish={handleCheckIn} style={{ marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Form.Item name="worker_name" rules={[{ required: true, message: 'กรอกชื่อ' }]} style={{flex: 1, marginBottom: isMobile ? '12px' : '0'}}><Input size="large" placeholder="ชื่อผู้ปฏิบัติงาน" prefix={<UserOutlined className="text-slate-400" />} style={{borderRadius: '12px'}} /></Form.Item>
                            <Form.Item name="role" rules={[{ required: true, message: 'เลือกหน้าที่' }]} style={{marginBottom: isMobile ? '12px' : '0'}}><Select size="large" placeholder="หน้าที่" options={[{value:'ENTRANT', label:'ผู้ปฏิบัติงาน'}, {value:'STANDBY', label:'ผู้เฝ้าระวัง'}]} style={{ width: isMobile ? '100%' : '150px' }}/></Form.Item>
                            <Form.Item style={{marginBottom: 0}}><Button size="large" type="primary" htmlType="submit" block={isMobile} icon={<LoginOutlined />} style={{ background: '#2563eb', borderRadius: '12px', border: 'none' }}>เข้าพื้นที่</Button></Form.Item>
                          </Form>

                          <Divider orientation="left"><Text strong className="text-slate-500">สถานะปัจจุบัน (Real-time)</Text></Divider>
                          
                          <Row gutter={[16, 16]}>
                            <Col span={24}>
                              <Card size="small" title={<Space><SafetyCertificateOutlined style={{color:'#3b82f6'}}/> <Text strong style={{color: '#1d4ed8'}}>ผู้เฝ้าระวัง (Standby)</Text></Space>} styles={{ header: {background: '#eff6ff', borderBottom: '1px solid #bfdbfe'} }} style={{ border: '1px solid #bfdbfe', borderRadius: '12px', overflow: 'hidden' }}>
                                {confinedEntries.filter(e => e.status === 'INSIDE' && e.role === 'STANDBY').length === 0 ? <Text type="secondary" italic>⚠️ ไม่มีผู้เฝ้าระวังปากบ่อ</Text> : null}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {confinedEntries.filter(e => e.status === 'INSIDE' && e.role === 'STANDBY').map(e => (
                                    <Tag key={e.id} color="blue" style={{ padding: '8px', fontSize: '14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: '#dbeafe', color: '#1e3a8a' }}>
                                      <Avatar size="small" icon={<EyeOutlined />} style={{background: '#3b82f6'}} />
                                      <span style={{fontWeight: 600}}>{e.worker_name}</span>
                                      <Button size="small" type="text" danger onClick={() => handleCheckOut(e.id)} style={{marginLeft: '4px', padding: 0}}>ออก</Button>
                                    </Tag>
                                  ))}
                                </div>
                              </Card>
                            </Col>

                            <Col xs={24} sm={12}>
                              <Card size="small" title={<Space><WarningOutlined style={{color:'#ef4444'}}/> <Text strong style={{color: '#b91c1c'}}>อยู่ในบ่อ (Entrants)</Text> <Badge count={confinedEntries.filter(e => e.status === 'INSIDE' && e.role === 'ENTRANT').length} style={{backgroundColor: '#ef4444'}} /></Space>} styles={{ header: {background: '#fef2f2', borderBottom: '1px solid #fecaca'} }} style={{ border: '1px solid #fecaca', borderRadius: '12px', overflow: 'hidden' }}>
                                {confinedEntries.filter(e => e.status === 'INSIDE' && e.role === 'ENTRANT').length === 0 ? <Text type="secondary">ไม่มีคนด้านใน</Text> : null}
                                {confinedEntries.filter(e => e.status === 'INSIDE' && e.role === 'ENTRANT').map(e => {
                                  const minsInside = dayjs().diff(dayjs(e.time_in), 'minute');
                                  const isWarning = minsInside >= 60; 
                                  return (
                                    <Card key={e.id} size="small" style={{ marginBottom: '8px', borderLeft: `4px solid ${isWarning ? '#ef4444' : '#f59e0b'}`, background: isWarning ? '#fef2f2' : '#fff', borderRadius: '8px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <div><Text strong>{e.worker_name}</Text><br/><Text type="secondary" style={{fontSize:'12px'}}>เข้า: {dayjs(e.time_in).format('HH:mm')}</Text></div>
                                        <div style={{ textAlign: 'right' }}>
                                          <Tag color={isWarning ? 'red' : 'orange'} style={{borderRadius: '12px', padding: '2px 8px', border: 'none'}}><FieldTimeOutlined /> {minsInside} นาที</Tag><br/>
                                          <Button size="small" type="primary" onClick={() => handleCheckOut(e.id)} style={{marginTop: '4px', background: '#1e293b', border: 'none', borderRadius: '6px'}}>ดึงขึ้น</Button>
                                        </div>
                                      </div>
                                    </Card>
                                  )
                                })}
                              </Card>
                            </Col>

                            <Col xs={24} sm={12}>
                              <Card size="small" title={<Space><CheckCircleOutlined style={{color:'#10b981'}}/> <Text strong style={{color: '#047857'}}>ออกแล้ว (Logged Out)</Text></Space>} styles={{ header: {background: '#ecfdf5', borderBottom: '1px solid #a7f3d0'} }} style={{ border: '1px solid #a7f3d0', borderRadius: '12px', overflow: 'hidden' }}>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                  {confinedEntries.filter(e => e.status === 'OUTSIDE').map(e => (
                                    <div key={e.id} style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                                      <Text type="secondary" style={{fontSize: '13px'}}>{e.worker_name}</Text>
                                      <Text type="secondary" style={{fontSize: '11px'}}>{dayjs(e.time_out).format('HH:mm')}</Text>
                                    </div>
                                  ))}
                                </div>
                              </Card>
                            </Col>
                          </Row>
                        </>
                      ) : <div style={{textAlign:'center', marginTop:'50px'}}><Text type="secondary">โปรดเลือก Permit ด้านซ้ายมือเพื่อดูบอร์ด</Text></div>}
                    </Card>
                  </Col>
                </Row>
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
                  <Button size="large" type="primary" onClick={handleExportPDF} icon={<FilePdfOutlined />} className="flex-1 rounded-xl h-12 font-bold bg-indigo-600 hover:bg-indigo-700 border-none shadow-md shadow-indigo-500/30">
                    โหลด PDF
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

        </Layout>
      </div>
    </ConfigProvider>
  );
}