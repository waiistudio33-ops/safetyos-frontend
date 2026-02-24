import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Layout, Menu, Typography, Card, Row, Col, 
  Avatar, Table, Tag, ConfigProvider, Space,
  Button, Modal, Form, Input, Select, DatePicker, message, Badge, Upload, Divider, Checkbox, InputNumber, Descriptions,
  Radio, List, Popconfirm, Drawer, Grid, Spin 
} from 'antd';
import { 
  DashboardOutlined, SafetyCertificateOutlined, WarningOutlined,
  UserOutlined, SettingOutlined, FileTextOutlined,
  PlusOutlined, CheckOutlined, CloseOutlined,
  FieldTimeOutlined, FireOutlined, ThunderboltOutlined,
  BuildOutlined, EnvironmentOutlined, TeamOutlined, RetweetOutlined, UploadOutlined,
  IdcardOutlined, AlertOutlined, ReadOutlined, QrcodeOutlined, SafetyOutlined, BellOutlined,
  DownOutlined, DownloadOutlined, EyeOutlined, FilePdfOutlined, LogoutOutlined, LockOutlined,
  CheckCircleOutlined, StopOutlined, LoginOutlined, MenuOutlined 
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import html2pdf from 'html2pdf.js'; 

import CertificateManager from './components/CertificateManager';
import IncidentReport from './components/IncidentReport';
import ELearning from './components/ELearning';
import EquipmentInspection from './components/EquipmentInspection'; 
import Dashboard from './components/Dashboard'; 
import { supabase } from './supabase'; 

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker; 
const { useBreakpoint } = Grid; 

export default function App() {
  const screens = useBreakpoint(); 
  const isMobile = !screens.md; 

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true); 

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); 
  const [activeMenu, setActiveMenu] = useState('DASHBOARD'); 

  const [realPermits, setRealPermits] = useState<any[]>([]); 
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [fileList, setFileList] = useState<any[]>([]); 
  const [form] = Form.useForm();

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

  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem('safetyos_user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setCurrentUser(parsedUser);
          setIsAuthenticated(true);
        } catch (e) {
          localStorage.removeItem('safetyos_user');
        }
      }
      setIsAuthChecking(false); 
    };
    checkAuth();
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
      const interval = setInterval(() => {
        fetchEntries(selectedConfinedPermit);
        setCurrentTime(dayjs());
      }, 60000); 
      return () => clearInterval(interval);
    }
  }, [activeMenu, selectedConfinedPermit]);

  const handleLogin = async (values: any) => {
    setIsLoggingIn(true);
    try {
      const response = await axios.post('https://safetyos-backend.onrender.com/login', values);
      localStorage.setItem('safetyos_user', JSON.stringify(response.data.user));
      setCurrentUser(response.data.user); 
      setIsAuthenticated(true); 
      message.success(`ยินดีต้อนรับคุณ ${response.data.user.full_name}`);
    } catch (error: any) { message.error(error.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ'); } finally { setIsLoggingIn(false); }
  };

  const handleLogout = () => { 
    localStorage.removeItem('safetyos_user');
    setIsAuthenticated(false); 
    setCurrentUser(null); 
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
      await axios.post('https://safetyos-backend.onrender.com/confined-space/evacuate', { 
        permit_id: selectedConfinedPermit,
        triggered_by: currentUser.full_name 
      });
      message.success('สั่งอพยพและส่งแจ้งเตือนฉุกเฉินแล้ว!');
      fetchEntries(selectedConfinedPermit!);
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการสั่งอพยพ');
    }
  };

  const handlePreviewFile = (url: string) => { setPreviewUrl(url); if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) setPreviewType('image'); else setPreviewType('pdf'); setIsPreviewOpen(true); };
  const handleViewDetails = (record: any) => { setSelectedPermitDetail(record); setIsDetailModalOpen(true); };
  const handleExportPDF = () => { const element = document.getElementById('pdf-document-content'); if (!element) return; html2pdf().set({ margin: [0.5, 0.5, 0.5, 0.5], filename: `WorkPermit_${selectedPermitDetail?.permit_number}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } }).from(element).save(); message.success('ดาวน์โหลดไฟล์ PDF สำเร็จ!'); };
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
  const getStatusDisplay = (status: string) => { switch(status) { case 'PENDING_AREA_OWNER': return <Badge status="processing" color="orange" text={<span style={{color: '#fa8c16', fontWeight: 600}}>รอเจ้าของพื้นที่</span>} />; case 'PENDING_SAFETY': return <Badge status="processing" color="blue" text={<span style={{color: '#007AFF', fontWeight: 600}}>รอ จป. อนุมัติ</span>} />; case 'APPROVED': return <Badge status="success" text={<span style={{color: '#34c759', fontWeight: 600}}>อนุมัติแล้ว</span>} />; case 'REJECTED': return <Badge status="error" text={<span style={{color: '#ff3b30', fontWeight: 600}}>ไม่อนุมัติ</span>} />; default: return <Badge status="default" text={status} />; } };

  const glassPanel = { background: 'rgba(255, 255, 255, 0.4)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)' };
  
  const modernHeaderStyle = { 
    background: 'rgba(255, 255, 255, 0.9)', 
    backdropFilter: 'blur(20px)', 
    borderRadius: isMobile ? '0px' : '24px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.04)', 
    border: 'none', 
    margin: isMobile ? '0' : '16px 24px 0', 
    padding: isMobile ? '0 12px' : '0 24px', 
    height: '70px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    zIndex: 10,
    position: isMobile ? 'sticky' as 'sticky' : 'relative' as 'relative', 
    top: 0
  };

  const columns: ColumnsType<any> = [
    { title: 'Permit No.', dataIndex: 'permit_number', key: 'permit_number', width: 130, render: (text) => <Text style={{ fontFamily: 'monospace', fontWeight: 700, color: '#007AFF', background: 'rgba(0, 122, 255, 0.1)', padding: '4px 8px', borderRadius: '8px' }}>{text || 'PTW-XX'}</Text> },
    { title: 'รายละเอียดงาน', key: 'details', render: (_, record) => ( <Space direction="vertical" size={2}><Text strong style={{ color: '#1d1d1f', fontSize: '15px' }}>{record.title}</Text><Text type="secondary" style={{ fontSize: '12px' }}><TeamOutlined /> {record.applicant?.full_name || 'ไม่ทราบชื่อ'} ({record.applicant?.department})</Text><Text type="secondary" style={{ fontSize: '12px' }}><EnvironmentOutlined /> {record.location_detail}</Text>{record.attachment_url && (<Button type="dashed" size="small" icon={<FileTextOutlined />} onClick={() => handlePreviewFile(record.attachment_url)} style={{ marginTop: '4px', borderRadius: '8px', fontSize: '12px', color: '#007AFF', borderColor: '#007AFF' }}>ดูเอกสาร JSA</Button>)}</Space> ) },
    { title: 'ประเภท', dataIndex: 'permit_type', key: 'type', width: 140, render: (type) => { const { icon, color, text } = getPermitTypeDisplay(type); return <Tag icon={icon} color={color} style={{ borderRadius: '10px', padding: '4px 10px', border: 'none', fontWeight: 600 }}>{text}</Tag>; }, responsive: ['md'] }, 
    { title: 'สถานะ', dataIndex: 'status', key: 'status', width: 160, render: (status) => getStatusDisplay(status) },
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
    return (
      <ConfigProvider theme={{ token: { colorPrimary: '#007AFF' }}}>
        <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
          <Spin size="large" tip="กำลังโหลดข้อมูล..." />
        </div>
      </ConfigProvider>
    );
  }

  // 🔥🔥🔥 ปรับหน้า Login ให้เป็นสไตล์ Facebook (Split Screen) 🔥🔥🔥
  if (!isAuthenticated) {
    return (
      <ConfigProvider theme={{ token: { colorPrimary: '#007AFF', borderRadius: 12, fontFamily: "-apple-system, BlinkMacSystemFont, 'Prompt', sans-serif" }}}>
        {/* Container พื้นหลังสีเทาอ่อนเหมือน Facebook */}
        <div style={{ 
          minHeight: '100vh', 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: '#f0f2f5', 
          padding: '20px',
          overflow: 'hidden'
        }}>
          {/* Grid Layout: ซ้าย = Logo, ขวา = Login Box */}
          <Row style={{ width: '100%', maxWidth: '980px' }} gutter={[40, 40]} align="middle">
            
            {/* ฝั่งซ้าย: Logo & Branding (โชว์เฉพาะจอใหญ่ หรืออยู่ด้านบนในมือถือ) */}
            <Col xs={24} md={14} style={{ textAlign: isMobile ? 'center' : 'left' }}>
              <div style={{ marginBottom: isMobile ? '24px' : '0' }}>
                <Space align="center" size={16} style={{ marginBottom: '16px', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                  <div style={{ 
                    background: '#007AFF', 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(0,122,255,0.3)' 
                  }}>
                    <SafetyCertificateOutlined style={{ fontSize: '36px', color: '#fff' }} />
                  </div>
                  <Title level={1} style={{ margin: 0, fontWeight: 800, color: '#007AFF', fontSize: isMobile ? '36px' : '48px', letterSpacing: '-1px' }}>
                    SafetyOS
                  </Title>
                </Space>
                <Title level={3} style={{ fontWeight: 400, color: '#1d1d1f', marginTop: 0, fontSize: isMobile ? '20px' : '28px' }}>
                  Enterprise Safety Management System
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  เชื่อมต่อการทำงานด้านความปลอดภัยที่ Map Ta Phut ไว้ในที่เดียว
                </Text>
              </div>
            </Col>

            {/* ฝั่งขวา: Login Card (ขาวสะอาด มีเงา) */}
            <Col xs={24} md={10}>
              <Card 
                style={{ 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0,0,0,0.05)', // เงาสไตล์ Facebook
                  border: 'none',
                  padding: '12px',
                  background: '#fff'
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <Form layout="vertical" onFinish={handleLogin} size="large">
                  <Form.Item name="username" rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้' }]} style={{ marginBottom: '16px' }}>
                    <Input 
                      placeholder="รหัสพนักงาน (เช่น somchai)" 
                      style={{ borderRadius: '8px', padding: '10px 12px' }} 
                    />
                  </Form.Item>
                  <Form.Item name="password" rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]} style={{ marginBottom: '24px' }}>
                    <Input.Password 
                      placeholder="รหัสผ่าน" 
                      style={{ borderRadius: '8px', padding: '10px 12px' }} 
                    />
                  </Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    block 
                    loading={isLoggingIn} 
                    style={{ 
                      background: '#007AFF', // สีฟ้าเฟสบุ๊ค (ใกล้เคียง)
                      border: 'none', 
                      height: '48px', 
                      fontSize: '18px', 
                      fontWeight: 'bold', 
                      borderRadius: '8px' 
                    }}
                  >
                    เข้าสู่ระบบ
                  </Button>
                </Form>
                
                <Divider plain><Text type="secondary" style={{ fontSize: '12px' }}>หรือ</Text></Divider>
                
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: '13px' }}>บัญชีทดสอบ: somchai, somsak, view (pass: 1234)</Text>
                </div>
              </Card>
              
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  <strong>Create a Page</strong> for a celebrity, brand or business.
                </Text>
              </div>
            </Col>

          </Row>
        </div>
      </ConfigProvider>
    );
  }

  // 🚀 โครงสร้างเมนูด้านข้าง (แยกออกมาเผื่อใช้ใน Drawer สำหรับมือถือ)
  const menuItems = (
    <Menu mode="inline" selectedKeys={[activeMenu]} onClick={(e) => { setActiveMenu(e.key); setMobileMenuOpen(false); }} style={{ border: 'none', background: 'transparent', padding: '0 12px', marginTop: '16px' }}>
      <Menu.Item key="DASHBOARD" icon={<DashboardOutlined />} style={{ borderRadius: '12px', marginBottom: '8px', fontWeight: 'bold' }}>Dashboard สรุปผล</Menu.Item>
      <Menu.Item key="E_PERMIT" icon={<FileTextOutlined />} style={{ borderRadius: '12px', marginBottom: '8px' }}>ระบบ E-Permit (PTW)</Menu.Item>
      <Menu.Item key="BBS" icon={<EyeOutlined />} style={{ borderRadius: '12px', marginBottom: '8px', color: '#34c759', fontWeight: 'bold' }}>BBS Observation</Menu.Item>
      <Menu.Item key="CONFINED_SPACE" icon={<BuildOutlined />} style={{ borderRadius: '12px', marginBottom: '8px', color: '#af52de', fontWeight: 'bold' }}>บอร์ดที่อับอากาศ</Menu.Item>
      <Menu.Item key="CERTIFICATE" icon={<IdcardOutlined />} style={{ borderRadius: '12px', marginBottom: '8px' }}>จัดการใบ Certificate</Menu.Item>
      <Menu.Item key="INCIDENT" icon={<AlertOutlined />} style={{ borderRadius: '12px', marginBottom: '8px', color: '#ff4d4f' }}>แจ้งจุดเสี่ยง (Incident)</Menu.Item>
      <Menu.Item key="E_LEARNING" icon={<ReadOutlined />} style={{ borderRadius: '12px', marginBottom: '8px', color: '#5856D6' }}>ระบบอบรม (E-Learning)</Menu.Item>
      <Menu.Item key="EQUIPMENT" icon={<QrcodeOutlined />} style={{ borderRadius: '12px', marginBottom: '8px', color: '#ff9500' }}>ตรวจอุปกรณ์ (QR Code)</Menu.Item>
    </Menu>
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#007AFF', borderRadius: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'San Francisco', 'Prompt', sans-serif" }}}>
      <div className="app-container">
        <Layout style={{ minHeight: '100vh', background: 'radial-gradient(circle at 10% 20%, rgb(239, 246, 249) 0%, rgb(206, 239, 253) 90%)' }}>
          
          {/* 🚀 Sidebar สำหรับ Desktop */}
          {!isMobile && (
            <Sider width={260} style={{ ...glassPanel, margin: '16px 0 16px 16px', position: 'fixed', left: 0, zIndex: 100, height: 'calc(100vh - 32px)' }} theme="light">
              <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <div style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)', padding: '8px', borderRadius: '12px' }}><SafetyCertificateOutlined style={{ fontSize: '24px', color: '#fff' }} /></div>
                <Text strong style={{ fontSize: '20px', color: '#1d1d1f' }}>Safety<span style={{color: '#007AFF'}}>OS</span></Text>
              </div>
              {menuItems}
            </Sider>
          )}

          {/* 🚀 Drawer เมนูสำหรับ Mobile */}
          <Drawer title={<div><SafetyCertificateOutlined style={{color:'#007AFF'}}/> SafetyOS</div>} placement="left" onClose={() => setMobileMenuOpen(false)} open={mobileMenuOpen} bodyStyle={{ padding: 0 }}>
            {menuItems}
          </Drawer>

          {/* === Main Content Area === */}
          <Layout style={{ marginLeft: isMobile ? 0 : 280, transition: 'all 0.2s', background: 'transparent' }}>
            
            {/* === Header === */}
            <Header style={modernHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* 🚀 ปุ่มแฮมเบอร์เกอร์ จะโชว์เฉพาะในมือถือ */}
                {isMobile && (
                  <Button type="text" icon={<MenuOutlined style={{fontSize: '20px'}} />} onClick={() => setMobileMenuOpen(true)} style={{ padding: 0 }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Title level={isMobile ? 4 : 3} style={{ margin: 0, lineHeight: '1.1', fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.5px', fontSize: isMobile ? '16px' : 'auto' }}>
                    {activeMenu === 'DASHBOARD' ? 'ภาพรวม (Dashboard)' :
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
                      <EnvironmentOutlined style={{ color: '#007AFF', fontSize: '14px' }} /><Text type="secondary" style={{ fontSize: '13px', fontWeight: 500 }}>Map Ta Phut - Enterprise Level</Text>
                    </div>
                  )}
                </div>
              </div>
              
              <Space size={isMobile ? 'small' : 'middle'} align="center">
                {!isMobile && (
                  <Badge count={3} dot offset={[-4, 4]}><Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: '20px', color: '#8E8E93' }} />} /></Badge>
                )}
                
                {!isMobile && <div style={{ width: '1px', height: '32px', background: '#E5E5EA', margin: '0 8px' }}></div>}
                
                <div style={{ background: '#ffffff', borderRadius: '100px', border: '1px solid #E5E5EA', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Avatar size={isMobile ? "default" : "large"} style={{ backgroundColor: currentUser?.role === 'SAFETY_ENGINEER' ? '#5856D6' : currentUser?.role === 'AREA_OWNER' ? '#FF9500' : '#007AFF', border: '2px solid #fff' }} icon={<UserOutlined />} />
                  {!isMobile && (
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2', paddingRight: '8px' }}>
                      <Text strong style={{ fontSize: '13px', color: '#1d1d1f' }}>{currentUser?.full_name}</Text>
                      <Text style={{ fontSize: '11px', color: currentUser?.role === 'SAFETY_ENGINEER' ? '#5856D6' : currentUser?.role === 'AREA_OWNER' ? '#FF9500' : '#007AFF', fontWeight: 700 }}>{currentUser?.role}</Text>
                    </div>
                  )}
                  <Button type="text" shape="circle" icon={<LogoutOutlined />} onClick={handleLogout} style={{ color: '#ff3b30' }} title="ออกจากระบบ" />
                </div>

                {activeMenu === 'E_PERMIT' && currentUser?.role === 'CONTRACTOR' && (<Button type="primary" shape={isMobile ? "circle" : "round"} icon={<PlusOutlined />} size={isMobile ? "middle" : "large"} onClick={() => setIsModalOpen(true)} style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)', border: 'none', boxShadow: '0 4px 15px rgba(0,122,255,0.3)', fontWeight: 600 }}>{!isMobile && 'ขอ Permit ใหม่'}</Button>)}
                {activeMenu === 'BBS' && (currentUser?.role === 'SAFETY_ENGINEER' || currentUser?.role === 'AREA_OWNER') && (<Button type="primary" shape={isMobile ? "circle" : "round"} icon={<EyeOutlined />} size={isMobile ? "middle" : "large"} onClick={() => setIsBbsModalOpen(true)} style={{ background: '#34c759', border: 'none', boxShadow: '0 4px 15px rgba(52, 199, 89, 0.3)', fontWeight: 600 }}>{!isMobile && 'บันทึก BBS'}</Button>)}
              </Space>
            </Header>

            {/* === Content === */}
            <Content style={{ padding: isMobile ? '12px' : '24px', overflow: 'initial' }}>
              {activeMenu === 'DASHBOARD' && <Dashboard currentUser={currentUser} />}
              {activeMenu === 'E_PERMIT' && (
                <Card title={<b style={{fontSize: '18px', color: '#1d1d1f'}}>รายการ Work Queue</b>} bordered={false} style={glassPanel} headStyle={{borderBottom: '1px solid rgba(0,0,0,0.05)'}} bodyStyle={{padding: isMobile ? '0' : '24px'}}>
                  <Table columns={columns} dataSource={realPermits} loading={loading} pagination={{ pageSize: 8 }} size="small" scroll={{ x: 'max-content' }} /> {/* 🚀 scroll={{ x: 'max-content' }} ทำให้เลื่อนซ้ายขวาในมือถือได้ */}
                </Card>
              )}

              {activeMenu === 'BBS' && (
                <Card title={<b style={{fontSize: '18px', color: '#1d1d1f'}}>ประวัติ BBS</b>} bordered={false} style={glassPanel}>
                  <List
                    itemLayout="horizontal"
                    dataSource={bbsRecords}
                    renderItem={item => (
                      <List.Item style={{ background: '#fff', marginBottom: '12px', padding: '16px', borderRadius: '16px', borderLeft: `6px solid ${item.behavior_type === 'SAFE' ? '#34c759' : '#ff3b30'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'block' }}>
                        <List.Item.Meta
                          avatar={<Avatar icon={item.behavior_type === 'SAFE' ? <CheckCircleOutlined /> : <WarningOutlined />} style={{ backgroundColor: item.behavior_type === 'SAFE' ? '#e8f5e9' : '#fff1f0', color: item.behavior_type === 'SAFE' ? '#34c759' : '#ff3b30' }} size="large" />}
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

              {/* 🚀 หน้าจอ Confined Space Board (ปรับ Responsive Grid) */}
              {activeMenu === 'CONFINED_SPACE' && (
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}> {/* 🚀 ถ้าจอมือถือ (xs) ให้เต็ม 100%, ถ้าจอคอม (md) ให้ใช้แค่ 8 ส่วน */}
                    <Card title={<b style={{color: '#1d1d1f'}}>1. เลือกพื้นที่ปฏิบัติงาน</b>} bordered={false} style={{...glassPanel, height: '100%'}}>
                      {activeConfinedPermits.length === 0 ? <Text type="secondary">ไม่มีงานที่อับอากาศที่กำลังดำเนินการ</Text> : (
                        <Menu mode="vertical" selectedKeys={[selectedConfinedPermit || '']} style={{ border: 'none', background: 'transparent' }} onClick={(e) => setSelectedConfinedPermit(e.key)}>
                          {activeConfinedPermits.map(p => (
                            <Menu.Item key={p.id} style={{ borderRadius: '12px', height: 'auto', padding: '12px', marginBottom: '8px', border: '1px solid #e5e5ea', background: selectedConfinedPermit === p.id ? '#f0f5ff' : '#fff' }}>
                              <Text strong style={{ color: '#af52de' }}>{p.permit_number}</Text><br/>
                              <Text style={{ fontSize: '12px' }}>{p.location_detail}</Text>
                            </Menu.Item>
                          ))}
                        </Menu>
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} md={16}> {/* 🚀 ถ้าจอมือถือ (xs) ให้เต็ม 100%, ถ้าจอคอม (md) ให้ใช้ 16 ส่วน */}
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
                          <Form form={confinedForm} layout={isMobile ? "vertical" : "inline"} onFinish={handleCheckIn} style={{ marginBottom: '24px', background: '#f8f9fa', padding: '16px', borderRadius: '12px' }}>
                            <Form.Item name="worker_name" rules={[{ required: true, message: 'กรอกชื่อ' }]} style={{flex: 1, marginBottom: isMobile ? '12px' : '0'}}><Input size="large" placeholder="ชื่อผู้ปฏิบัติงาน" prefix={<UserOutlined />} /></Form.Item>
                            <Form.Item name="role" rules={[{ required: true, message: 'เลือกหน้าที่' }]} style={{marginBottom: isMobile ? '12px' : '0'}}><Select size="large" placeholder="หน้าที่" options={[{value:'ENTRANT', label:'ผู้ปฏิบัติงาน'}, {value:'STANDBY', label:'ผู้เฝ้าระวัง'}]} style={{ width: isMobile ? '100%' : '150px' }}/></Form.Item>
                            <Form.Item style={{marginBottom: 0}}><Button size="large" type="primary" htmlType="submit" block={isMobile} icon={<LoginOutlined />} style={{ background: '#007AFF' }}>เข้าพื้นที่</Button></Form.Item>
                          </Form>

                          <Divider orientation="left"><Text strong>สถานะปัจจุบัน (Real-time)</Text></Divider>
                          
                          <Row gutter={[16, 16]}>
                            <Col span={24}>
                              <Card size="small" title={<Space><SafetyCertificateOutlined style={{color:'#1890ff'}}/> <Text strong>ผู้เฝ้าระวัง (Standby)</Text></Space>} headStyle={{background: '#e6f7ff', borderBottom: '1px solid #91d5ff'}} style={{ border: '1px solid #91d5ff' }}>
                                {confinedEntries.filter(e => e.status === 'INSIDE' && e.role === 'STANDBY').length === 0 ? <Text type="secondary" italic>⚠️ ไม่มีผู้เฝ้าระวังปากบ่อ</Text> : null}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {confinedEntries.filter(e => e.status === 'INSIDE' && e.role === 'STANDBY').map(e => (
                                    <Tag key={e.id} color="blue" style={{ padding: '8px', fontSize: '14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <Avatar size="small" icon={<EyeOutlined />} style={{background: '#1890ff'}} />
                                      {e.worker_name}
                                      <Button size="small" type="text" danger onClick={() => handleCheckOut(e.id)} style={{marginLeft: '8px', padding: 0}}>ออก</Button>
                                    </Tag>
                                  ))}
                                </div>
                              </Card>
                            </Col>

                            <Col xs={24} sm={12}>
                              <Card size="small" title={<Space><WarningOutlined style={{color:'#ff3b30'}}/> <Text type="danger" strong>อยู่ในบ่อ (Entrants)</Text> <Badge count={confinedEntries.filter(e => e.status === 'INSIDE' && e.role === 'ENTRANT').length} style={{backgroundColor: '#ff3b30'}} /></Space>} headStyle={{background: '#fff1f0', borderBottom: '1px solid #ffa39e'}} style={{ border: '1px solid #ffa39e' }}>
                                {confinedEntries.filter(e => e.status === 'INSIDE' && e.role === 'ENTRANT').length === 0 ? <Text type="secondary">ไม่มีคนด้านใน</Text> : null}
                                {confinedEntries.filter(e => e.status === 'INSIDE' && e.role === 'ENTRANT').map(e => {
                                  const minsInside = dayjs().diff(dayjs(e.time_in), 'minute');
                                  const isWarning = minsInside >= 60; 
                                  return (
                                    <Card key={e.id} size="small" style={{ marginBottom: '8px', borderLeft: `4px solid ${isWarning ? '#ff3b30' : '#fa8c16'}`, background: isWarning ? '#fff2f0' : '#fff' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <div><Text strong>{e.worker_name}</Text><br/><Text type="secondary" style={{fontSize:'12px'}}>เข้า: {dayjs(e.time_in).format('HH:mm')}</Text></div>
                                        <div style={{ textAlign: 'right' }}>
                                          <Tag color={isWarning ? 'red' : 'orange'} style={{borderRadius: '12px', padding: '2px 8px'}}><FieldTimeOutlined /> {minsInside} นาที</Tag><br/>
                                          <Button size="small" type="primary" onClick={() => handleCheckOut(e.id)} style={{marginTop: '4px', background: '#1d1d1f', border: 'none', borderRadius: '6px'}}>ดึงขึ้น</Button>
                                        </div>
                                      </div>
                                    </Card>
                                  )
                                })}
                              </Card>
                            </Col>

                            <Col xs={24} sm={12}>
                              <Card size="small" title={<Space><CheckCircleOutlined style={{color:'#34c759'}}/> <Text type="success" strong>ออกแล้ว (Logged Out)</Text></Space>} headStyle={{background: '#e8f5e9', borderBottom: '1px solid #b7eb8f'}} style={{ border: '1px solid #b7eb8f' }}>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                  {confinedEntries.filter(e => e.status === 'OUTSIDE').map(e => (
                                    <div key={e.id} style={{ padding: '8px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
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

          <Modal title={<Space><EyeOutlined style={{color:'#34c759'}}/><Title level={4} style={{margin: 0}}>บันทึกพฤติกรรม (BBS Observation)</Title></Space>} open={isBbsModalOpen} onCancel={() => setIsBbsModalOpen(false)} onOk={() => bbsForm.submit()} okText="บันทึกข้อมูล" cancelButtonProps={{shape: 'round'}} okButtonProps={{shape: 'round', style: {background: '#34c759', border: 'none'}}} destroyOnClose>
            <Form form={bbsForm} layout="vertical" onFinish={handleCreateBbs} style={{ marginTop: '24px' }}>
              <Form.Item name="location" label="พื้นที่ที่พบเห็น" rules={[{required: true}]}><Input placeholder="เช่น Tank Farm Zone B" /></Form.Item>
              <Form.Item name="behavior_type" label="ประเภทพฤติกรรม" rules={[{required: true}]}>
                <Radio.Group optionType="button" buttonStyle="solid">
                  <Radio.Button value="SAFE" style={{ color: '#34c759' }}>พฤติกรรมปลอดภัย (Safe)</Radio.Button>
                  <Radio.Button value="UNSAFE" style={{ color: '#ff3b30' }}>พฤติกรรมเสี่ยง (Unsafe)</Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="category" label="หมวดหมู่ความปลอดภัย" rules={[{required: true}]}><Select placeholder="เลือกหมวดหมู่" options={[{value:'PPE', label:'อุปกรณ์ป้องกันภัยส่วนบุคคล (PPE)'}, {value:'TOOLS', label:'การใช้เครื่องมือ/อุปกรณ์'}, {value:'POSTURE', label:'ท่าทางการทำงาน/การยกของ'}, {value:'HOUSEKEEPING', label:'ความสะอาด/ความเป็นระเบียบ'}]} /></Form.Item>
              <Form.Item name="description" label="รายละเอียดพฤติกรรม" rules={[{required: true}]}><Input.TextArea rows={2} placeholder="อธิบายสิ่งที่พบเห็น..." /></Form.Item>
              <Form.Item name="action_taken" label="การดำเนินการหลังพบเห็น" rules={[{required: true}]}><Select placeholder="เลือกการดำเนินการ" options={[{value:'PRAISED', label:'กล่าวชื่นชม'}, {value:'VERBAL_WARNING', label:'ตักเตือน'}, {value:'STOP_WORK', label:'สั่งหยุดงานทันที'}]} /></Form.Item>
            </Form>
          </Modal>

          <Modal title={<Space><EyeOutlined style={{ color: '#007AFF' }} /><Text strong style={{ fontSize: '18px' }}>รายละเอียดคำขออนุญาตทำงาน</Text></Space>} open={isDetailModalOpen} onCancel={() => setIsDetailModalOpen(false)} width={800} footer={[<Button key="pdf" type="primary" shape="round" icon={<FilePdfOutlined />} onClick={handleExportPDF} style={{ background: '#ff4d4f', border: 'none', marginRight: '8px' }}>ดาวน์โหลด PDF</Button>, <Button key="close" type="primary" shape="round" onClick={() => setIsDetailModalOpen(false)} style={{ background: '#007AFF' }}>ปิด</Button>]}>
            {selectedPermitDetail && (
              <div id="pdf-document-content" style={{ padding: '30px', background: '#fff' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid #1d1d1f', paddingBottom: '16px' }}><Title level={3} style={{ margin: 0, textTransform: 'uppercase' }}>WORK PERMIT</Title><Text type="secondary">Enterprise Safety Management System (SafetyOS)</Text></div>
                <Descriptions bordered column={1} size="small" labelStyle={{ width: '180px', fontWeight: 'bold', background: '#f0f2f5' }}>
                  <Descriptions.Item label="เลขที่เอกสาร"><Text strong>{selectedPermitDetail.permit_number}</Text></Descriptions.Item>
                  <Descriptions.Item label="สถานะ">{getStatusDisplay(selectedPermitDetail.status)}</Descriptions.Item>
                  <Descriptions.Item label="หัวข้องาน">{selectedPermitDetail.title}</Descriptions.Item>
                  <Descriptions.Item label="ผู้ขออนุญาต">{selectedPermitDetail.applicant?.full_name}</Descriptions.Item>
                  <Descriptions.Item label="พื้นที่">{selectedPermitDetail.location_detail}</Descriptions.Item>
                  <Descriptions.Item label="เวลาปฏิบัติงาน"><Text strong>{dayjs(selectedPermitDetail.start_time).format('DD/MM/YYYY HH:mm')} - {dayjs(selectedPermitDetail.end_time).format('DD/MM/YYYY HH:mm')}</Text></Descriptions.Item>
                  <Descriptions.Item label="มาตรการความปลอดภัย"><div style={{ whiteSpace: 'pre-wrap', fontFamily: 'Prompt, sans-serif', fontSize: '14px', lineHeight: '1.6' }}>{selectedPermitDetail.description}</div></Descriptions.Item>
                </Descriptions>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '60px', textAlign: 'center' }}>
                  <div><div style={{ borderBottom: '1px solid #1d1d1f', width: '180px', marginBottom: '8px' }}></div><Text strong>ผู้ขออนุญาต</Text><br/><Text type="secondary" style={{fontSize: '12px'}}>{selectedPermitDetail.applicant?.full_name}</Text></div>
                  <div><div style={{ borderBottom: '1px solid #1d1d1f', width: '180px', marginBottom: '8px' }}></div><Text strong>ผู้อนุมัติ</Text><br/><Text type="secondary" style={{fontSize: '12px'}}>{selectedPermitDetail.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'รอการอนุมัติ'}</Text></div>
                </div>
              </div>
            )}
          </Modal>

          <Modal title="เอกสารแนบ" open={isPreviewOpen} onCancel={() => setIsPreviewOpen(false)} width={850} footer={[<Button key="close" onClick={() => setIsPreviewOpen(false)}>ปิด</Button>, <Button key="download" type="primary" href={previewUrl} target="_blank">เปิดหน้าต่างใหม่</Button>]}>
            <div style={{ height: '70vh', display: 'flex', justifyContent: 'center' }}>{previewType === 'image' ? <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} />}</div>
          </Modal>

          <Modal title="แบบฟอร์มขอ E-Permit" open={isModalOpen} onCancel={() => { setIsModalOpen(false); setFileList([]); form.resetFields(); }} onOk={() => form.submit()} confirmLoading={isSubmitting} width={800}>
            <Form form={form} layout="vertical" onFinish={handleCreatePermit}>
              <Row gutter={16}><Col span={16}><Form.Item name="title" label="หัวข้อการทำงาน" rules={[{ required: true }]}><Input /></Form.Item></Col><Col span={8}><Form.Item name="workers" label="จำนวนคน" rules={[{ required: true }]}><InputNumber style={{width: '100%'}} /></Form.Item></Col></Row>
              <Row gutter={16}><Col span={12}><Form.Item name="permit_type" label="ประเภทงาน" rules={[{ required: true }]}><Select options={[{value:'HOT_WORK', label:'🔥 Hot Work'}, {value:'CONFINED_SPACE', label:'🕳️ Confined Space'}, {value:'ELECTRICAL', label:'⚡ Electrical'}, {value:'COLD_WORK', label:'❄️ Cold Work'}]} /></Form.Item></Col><Col span={12}><Form.Item name="location_detail" label="พื้นที่ปฏิบัติงาน" rules={[{ required: true }]}><Input /></Form.Item></Col></Row>
              <Row gutter={16}><Col span={12}><Form.Item name="timeRange" label="เวลาขออนุญาต" rules={[{ required: true }]}><RangePicker showTime style={{ width: '100%' }} /></Form.Item></Col><Col span={12}><Form.Item name="description" label="รายละเอียด" rules={[{ required: true }]}><Input.TextArea rows={1} /></Form.Item></Col></Row>
              <Row gutter={16}>
                <Col span={12}><Form.Item name="ppe" label="อุปกรณ์ PPE" rules={[{ required: true }]}><Checkbox.Group><Col><Checkbox value="Helmet">หมวกนิรภัย</Checkbox></Col><Col><Checkbox value="Shoes">รองเท้านิรภัย</Checkbox></Col><Col><Checkbox value="Harness">เข็มขัดนิรภัย</Checkbox></Col><Col><Checkbox value="Glasses">แว่นตา</Checkbox></Col></Checkbox.Group></Form.Item></Col>
                <Col span={12}><Form.Item name="safety_measures" label="มาตรการเตรียมความพร้อม" rules={[{ required: true }]}><Checkbox.Group><Col><Checkbox value="ถังดับเพลิง">ถังดับเพลิง</Checkbox></Col><Col><Checkbox value="ผู้เฝ้าระวัง">ผู้เฝ้าระวัง</Checkbox></Col><Col><Checkbox value="ตรวจวัดก๊าซ">ตรวจวัดก๊าซ</Checkbox></Col><Col><Checkbox value="กั้นพื้นที่">กั้นพื้นที่</Checkbox></Col></Checkbox.Group></Form.Item></Col>
              </Row>
              <Form.Item label="แนบเอกสาร JSA" required><Upload beforeUpload={() => false} maxCount={1} fileList={fileList} onChange={(info) => setFileList(info.fileList)}><Button icon={<UploadOutlined />}>อัปโหลดไฟล์</Button></Upload></Form.Item>
            </Form>
          </Modal>
        </Layout>
      </div>
    </ConfigProvider>
  );
}