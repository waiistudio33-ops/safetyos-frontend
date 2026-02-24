import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Button, Space, Typography, Form, Input, 
  DatePicker, Select, Upload, message, Badge, Tooltip, List, Avatar, Grid, Row, Col 
} from 'antd'; // 🚀 เพิ่ม List, Avatar, Grid, Row, Col
import { 
  SafetyCertificateOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  UploadOutlined, FileTextOutlined, ClockCircleOutlined, UserOutlined, CalendarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { supabase } from '../supabase'; 

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid; // 🚀 เรียกใช้ Hook เช็คขนาดจอ

export default function CertificateManager({ currentUser }: { currentUser: any }) {
  const screens = useBreakpoint(); // 🚀 ตัวแปรเช็คขนาดจอ
  const isMobile = !screens.md; // เล็กกว่า Tablet = Mobile

  const [certs, setCerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();
  
  // State สำหรับเก็บไฟล์ที่ผู้รับเหมาเลือก
  const [fileList, setFileList] = useState<any[]>([]);

  const fetchCerts = async () => {
    try {
      const res = await fetch('https://safetyos-backend.onrender.com/certificates');
      const data = await res.json();
      setCerts(data);
    } catch (error) {
      console.error('ดึงข้อมูลไม่ได้:', error);
      message.error('ไม่สามารถดึงข้อมูลใบ Certificate ได้');
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

        const { data, error } = await supabase.storage
          .from('permits')
          .upload(uniqueName, file);

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from('permits')
          .getPublicUrl(uniqueName);

        finalFileUrl = publicUrlData.publicUrl;
      }

      const issuedDate = values.dateRange[0].toISOString();
      const expiryDate = values.dateRange[1].toISOString();

      await fetch('https://safetyos-backend.onrender.com/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          cert_name: values.cert_name,
          file_url: finalFileUrl, 
          issued_date: issuedDate,
          expiry_date: expiryDate
        })
      });

      message.success('อัปโหลดใบ Certificate สำเร็จ! รอ จป. ตรวจสอบครับ');
      form.resetFields();
      setFileList([]); 
      fetchCerts(); 
    } catch (error) {
      console.error(error);
      message.error('เกิดข้อผิดพลาดในการอัปโหลด');
    }
    setIsLoading(false);
  };

  const handleVerify = async (certId: string, status: string) => {
    try {
      await fetch(`https://safetyos-backend.onrender.com/certificates/${certId}/verify`, {
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

  const getStatusTag = (status: string) => {
    switch(status) {
      case 'PENDING': return <Badge status="processing" text={<span style={{color: '#007AFF', fontWeight: 600}}>รอตรวจสอบ</span>} />;
      case 'APPROVED': return <Badge status="success" text={<span style={{color: '#34c759', fontWeight: 600}}>ผ่าน</span>} />;
      case 'REJECTED': return <Badge status="error" text={<span style={{color: '#ff3b30', fontWeight: 600}}>ไม่ผ่าน</span>} />;
      default: return <Badge status="default" text={status} />;
    }
  };

  const getExpiryDisplay = (expiryDate: string) => {
    const expiry = dayjs(expiryDate);
    const today = dayjs();
    const daysLeft = expiry.diff(today, 'day');
    
    let color = '#34c759'; 
    if (daysLeft < 0) color = '#ff3b30'; 
    else if (daysLeft <= 30) color = '#ff9500'; 

    return (
      <Space size={4}>
        <ClockCircleOutlined style={{ color }} />
        <Text style={{ fontSize: '12px', color: color, fontWeight: 600 }}>
          {daysLeft < 0 ? 'หมดอายุแล้ว' : `เหลือ ${daysLeft} วัน`}
        </Text>
      </Space>
    );
  };

  const glassPanel = { background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)' };

  // 🚀 Action Buttons Component (ใช้ซ้ำทั้งใน Table และ List)
  const ActionButtons = ({ record }: { record: any }) => {
    if (currentUser?.role === 'SAFETY_ENGINEER' && record.status === 'PENDING') {
      return (
        <Space size="small">
          <Button type="primary" size="small" shape="round" icon={<CheckCircleOutlined />} onClick={() => handleVerify(record.id, 'APPROVED')} style={{ background: '#34c759', border: 'none', fontSize: '12px' }}>อนุมัติ</Button>
          <Button type="primary" size="small" shape="round" icon={<CloseCircleOutlined />} onClick={() => handleVerify(record.id, 'REJECTED')} style={{ background: '#ff3b30', border: 'none', fontSize: '12px' }}>ปฏิเสธ</Button>
        </Space>
      );
    }
    return null;
  };

  const columns: ColumnsType<any> = [
    {
      title: 'ผู้รับเหมา', 
      key: 'user', 
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: '#1d1d1f' }}>{record.user?.full_name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.user?.department}</Text>
        </Space>
      )
    },
    {
      title: 'ชื่อใบ Certificate', 
      dataIndex: 'cert_name', 
      key: 'cert_name',
      render: (text) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: '#007AFF' }} />
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: 'วันหมดอายุ', 
      key: 'expiry_date',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{dayjs(record.expiry_date).format('DD MMM YY')}</Text>
          {getExpiryDisplay(record.expiry_date)}
        </Space>
      )
    },
    {
      title: 'เอกสาร',
      key: 'document',
      render: (_, record) => (
        record.file_url ? (
          <Button type="link" icon={<FileTextOutlined />} size="small" style={{ padding: 0 }} href={record.file_url} target="_blank">ดูไฟล์</Button>
        ) : <Text type="secondary">-</Text>
      )
    },
    {
      title: 'สถานะ', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Action', 
      key: 'action',
      render: (_, record) => <ActionButtons record={record} />
    },
  ];

  return (
    <div className="space-y-6" style={{ padding: isMobile ? '12px' : '0' }}> {/* 🚀 ลด Padding มือถือ */}
      
      {/* ส่วนที่ 1: ฟอร์มอัปโหลด (เฉพาะผู้รับเหมา) */}
      {currentUser?.role === 'CONTRACTOR' && (
        <Card 
          title={<Space><UploadOutlined style={{color: '#007AFF'}} /> <Text strong style={{color: '#007AFF', fontSize: isMobile ? '16px' : '18px'}}>อัปโหลดใบ Certificate</Text></Space>} 
          bordered={false} 
          style={{...glassPanel, background: 'linear-gradient(135deg, rgba(240, 248, 255, 0.8) 0%, rgba(255, 255, 255, 0.8) 100%)'}}
          bodyStyle={{ padding: isMobile ? '16px' : '24px' }}
        >
          <Form form={form} layout="vertical" onFinish={handleUploadCert}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="cert_name" label={<Text strong>ประเภทใบ Certificate</Text>} rules={[{ required: true, message: 'กรุณาเลือกประเภท' }]}>
                  <Select size="large" placeholder="เลือกประเภทเอกสาร" options={[
                    { value: 'ผู้ปฏิบัติงานในที่อับอากาศ (Confined Space)', label: '🕳️ Confined Space' },
                    { value: 'ผู้ควบคุมปั้นจั่น (Crane Operator)', label: '🏗️ Crane Operator' },
                    { value: 'ช่างไฟฟ้า (Electrician)', label: '⚡ Electrician' },
                    { value: 'ผู้ควบคุมงานร้อน (Hot Work Safety)', label: '🔥 Hot Work Safety' },
                  ]} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="dateRange" label={<Text strong>วันที่ออกบัตร - วันหมดอายุ</Text>} rules={[{ required: true, message: 'กรุณาระบุวันที่' }]}>
                  <RangePicker size="large" style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label={<Text strong>แนบไฟล์เอกสาร (PDF/JPG)</Text>}>
              <Upload 
                beforeUpload={() => false} 
                maxCount={1}
                fileList={fileList}
                onChange={(info) => setFileList(info.fileList)}
              >
                <Button block={isMobile} icon={<UploadOutlined />} size="large" style={{ borderRadius: '8px', width: isMobile ? '100%' : 'auto' }}>เลือกไฟล์เอกสาร</Button>
              </Upload>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" size="large" loading={isLoading} style={{ background: '#007AFF', borderRadius: '8px', fontWeight: 600, width: isMobile ? '100%' : 'auto' }}>
                ส่งข้อมูลให้ จป. ตรวจสอบ
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* ส่วนที่ 2: ตารางข้อมูล */}
      <Card title={<b style={{fontSize: isMobile ? '16px' : '18px', color: '#1d1d1f'}}>📋 ทะเบียนประวัติใบ Certificate</b>} bordered={false} style={glassPanel} bodyStyle={{ padding: isMobile ? '12px' : '24px' }}>
        
        {/* 🚀 Desktop: แสดง Table */}
        {!isMobile && (
          <Table columns={columns} dataSource={certs} loading={isLoading && certs.length === 0} pagination={{ pageSize: 5 }} size="middle" rowKey="id" />
        )}

        {/* 🚀 Mobile: แสดง List แบบ Facebook Feed */}
        {isMobile && (
          <List
            itemLayout="vertical"
            size="large"
            pagination={{ pageSize: 5 }}
            dataSource={certs}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                style={{ background: '#fff', borderRadius: '12px', marginBottom: '16px', border: '1px solid #f0f0f0', padding: '16px' }}
                actions={[
                  <ActionButtons record={item} />, // ปุ่มอนุมัติของ จป.
                  item.file_url && <Button type="link" size="small" icon={<FileTextOutlined />} href={item.file_url} target="_blank">ดูไฟล์</Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Text strong style={{ fontSize: '15px', color: '#1d1d1f', maxWidth: '70%' }} ellipsis>{item.cert_name}</Text>
                      {getStatusTag(item.status)}
                    </div>
                  }
                  description={
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Text type="secondary" style={{ fontSize: '13px' }}>{item.user?.full_name} ({item.user?.department})</Text>
                      <Space style={{ marginTop: 4 }}>
                        <CalendarOutlined style={{ color: '#888' }} />
                        <Text type="secondary" style={{ fontSize: '12px' }}>หมดอายุ: {dayjs(item.expiry_date).format('DD MMM YY')}</Text>
                      </Space>
                      {getExpiryDisplay(item.expiry_date)}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}