import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Button, Space, Typography, Form, Input, 
  DatePicker, Select, Upload, message, Badge, Tooltip 
} from 'antd';
import { 
  SafetyCertificateOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  UploadOutlined, FileTextOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
// 🚀 เพิ่มการนำเข้า supabase สำหรับจัดการไฟล์
import { supabase } from '../supabase'; 

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function CertificateManager({ currentUser }: { currentUser: any }) {
  const [certs, setCerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();
  
  // 🚀 เพิ่ม State สำหรับเก็บไฟล์ที่ผู้รับเหมาเลือก
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

      // 🚀 1. อัปโหลดไฟล์ไปที่ Supabase Storage
      if (fileList.length > 0) {
        const file = fileList[0].originFileObj;
        const fileExt = file.name.split('.').pop();
        const uniqueName = `certs/${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('permits')
          .upload(uniqueName, file);

        if (error) throw error;

        // ดึง Public URL มาเพื่อบันทึกลงฐานข้อมูล
        const { data: publicUrlData } = supabase.storage
          .from('permits')
          .getPublicUrl(uniqueName);

        finalFileUrl = publicUrlData.publicUrl;
      }

      const issuedDate = values.dateRange[0].toISOString();
      const expiryDate = values.dateRange[1].toISOString();

      // 🚀 2. ส่ง URL จริงไปยัง Backend
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
      setFileList([]); // เคลียร์ไฟล์หลังอัปโหลดเสร็จ
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
      case 'PENDING': return <Badge status="processing" text={<span style={{color: '#007AFF', fontWeight: 600}}>รอ จป. ตรวจสอบ</span>} />;
      case 'APPROVED': return <Badge status="success" text={<span style={{color: '#34c759', fontWeight: 600}}>ผ่านการตรวจสอบ</span>} />;
      case 'REJECTED': return <Badge status="error" text={<span style={{color: '#ff3b30', fontWeight: 600}}>เอกสารไม่ผ่าน</span>} />;
      default: return <Badge status="default" text={status} />;
    }
  };

  const glassPanel = { background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)' };

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
      render: (_, record) => {
        const expiry = dayjs(record.expiry_date);
        const today = dayjs();
        const daysLeft = expiry.diff(today, 'day');
        
        let color = '#34c759'; 
        if (daysLeft < 0) color = '#ff3b30'; 
        else if (daysLeft <= 30) color = '#ff9500'; 

        return (
          <Space direction="vertical" size={0}>
            <Text>{expiry.format('DD MMM YYYY')}</Text>
            <Text style={{ fontSize: '12px', color: color, fontWeight: 600 }}>
              <ClockCircleOutlined /> {daysLeft < 0 ? 'หมดอายุแล้ว' : `เหลือ ${daysLeft} วัน`}
            </Text>
          </Space>
        );
      }
    },
    {
      title: 'เอกสารอ้างอิง',
      key: 'document',
      render: (_, record) => (
        // 🚀 เปลี่ยนให้กดเปิดไฟล์จาก URL จริงที่บันทึกไว้
        record.file_url ? (
          <Button 
            type="link" 
            icon={<FileTextOutlined />} 
            size="small" 
            style={{ padding: 0 }}
            href={record.file_url}
            target="_blank"
          >
            ดูไฟล์แนบ
          </Button>
        ) : <Text type="secondary">ไม่มีไฟล์</Text>
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
      render: (_, record) => {
        if (currentUser?.role === 'SAFETY_ENGINEER' && record.status === 'PENDING') {
          return (
            <Space size="small">
              <Tooltip title="อนุมัติเอกสาร (Pass)">
                <Button type="primary" shape="circle" icon={<CheckCircleOutlined />} onClick={() => handleVerify(record.id, 'APPROVED')} style={{ background: '#34c759', border: 'none' }} />
              </Tooltip>
              <Tooltip title="ปฏิเสธเอกสาร (Reject)">
                <Button type="primary" shape="circle" icon={<CloseCircleOutlined />} onClick={() => handleVerify(record.id, 'REJECTED')} style={{ background: '#ff3b30', border: 'none' }} />
              </Tooltip>
            </Space>
          );
        }
        return <Text type="secondary" style={{fontSize: '12px'}}>-</Text>;
      }
    },
  ];

  return (
    <div className="space-y-6">
      {currentUser?.role === 'CONTRACTOR' && (
        <Card title={<b style={{color: '#007AFF'}}>📤 อัปโหลดใบ Certificate ใหม่</b>} bordered={false} style={{...glassPanel, background: 'linear-gradient(135deg, rgba(240, 248, 255, 0.8) 0%, rgba(255, 255, 255, 0.8) 100%)'}}>
          <Form form={form} layout="vertical" onFinish={handleUploadCert}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <Form.Item name="cert_name" label={<Text strong>ประเภทใบ Certificate</Text>} rules={[{ required: true, message: 'กรุณาเลือกประเภท' }]}>
                <Select size="large" placeholder="เลือกประเภทเอกสารที่ต้องการอัปโหลด" options={[
                  { value: 'ผู้ปฏิบัติงานในที่อับอากาศ (Confined Space)', label: '🕳️ ผู้ปฏิบัติงานในที่อับอากาศ (Confined Space)' },
                  { value: 'ผู้ควบคุมปั้นจั่น (Crane Operator)', label: '🏗️ ผู้ควบคุมปั้นจั่น (Crane Operator)' },
                  { value: 'ช่างไฟฟ้า (Electrician)', label: '⚡ ช่างไฟฟ้า (Electrician)' },
                  { value: 'ผู้ควบคุมงานร้อน (Hot Work Safety)', label: '🔥 ผู้ควบคุมงานร้อน (Hot Work Safety)' },
                ]} />
              </Form.Item>
              
              <Form.Item name="dateRange" label={<Text strong>วันที่ออกบัตร - วันหมดอายุ</Text>} rules={[{ required: true, message: 'กรุณาระบุวันที่' }]}>
                <RangePicker size="large" style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </div>

            <Form.Item label={<Text strong>แนบไฟล์เอกสาร (PDF/JPG)</Text>}>
              {/* 🚀 เพิ่มการจัดการ fileList เพื่อใช้ตอนอัปโหลดจริง */}
              <Upload 
                beforeUpload={() => false} 
                maxCount={1}
                fileList={fileList}
                onChange={(info) => setFileList(info.fileList)}
              >
                <Button icon={<UploadOutlined />} size="large">เลือกไฟล์เอกสาร</Button>
              </Upload>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" size="large" loading={isLoading} style={{ background: '#007AFF', borderRadius: '8px', fontWeight: 600 }}>
                ส่งข้อมูลให้ จป. ตรวจสอบ
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      <Card title={<b style={{fontSize: '18px', color: '#1d1d1f'}}>📋 ทะเบียนประวัติใบ Certificate ผู้รับเหมา</b>} bordered={false} style={glassPanel}>
        <Table columns={columns} dataSource={certs} loading={isLoading && certs.length === 0} pagination={{ pageSize: 5 }} size="middle" rowKey="id" />
      </Card>
    </div>
  );
}