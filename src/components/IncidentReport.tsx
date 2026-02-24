import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Button, Space, Typography, Form, Input, 
  Select, Upload, message, Badge, Tooltip, Row, Col, Modal, List, Avatar, Grid 
} from 'antd'; // 👈 เพิ่ม List, Avatar, Grid
import { 
  WarningOutlined, CameraOutlined, EnvironmentOutlined, 
  PushpinOutlined, CheckCircleOutlined, SyncOutlined, AlertOutlined,
  UserOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { supabase } from '../supabase';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid; // 🚀 เรียกใช้ Hook เช็คขนาดจอ

export default function IncidentReport({ currentUser }: { currentUser: any }) {
  const screens = useBreakpoint(); // 🚀 ตัวแปรเช็คขนาดจอ
  const isMobile = !screens.md; // เล็กกว่า Tablet = Mobile

  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  
  // State สำหรับเก็บ GPS
  const [location, setLocation] = useState<{ lat: number | null, lng: number | null }>({ lat: null, lng: null });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const [form] = Form.useForm();

  const fetchIncidents = async () => {
    try {
      const res = await fetch('https://safetyos-backend.onrender.com/incidents');
      const data = await res.json();
      setIncidents(data);
    } catch (error) {
      message.error('ไม่สามารถดึงข้อมูลจุดเสี่ยงได้');
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  // 🌍 ฟังก์ชันดึง GPS จากอุปกรณ์ (มือถือ/คอม)
  const getLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          message.success('ดึงพิกัด GPS สำเร็จ!');
          setIsGettingLocation(false);
        },
        (error) => {
          message.error('ไม่สามารถดึงพิกัดได้ กรุณาเปิด GPS หรืออนุญาตการเข้าถึง Location');
          setIsGettingLocation(false);
        }
      );
    } else {
      message.error('อุปกรณ์ของคุณไม่รองรับ GPS');
      setIsGettingLocation(false);
    }
  };

  const handleReportIncident = async (values: any) => {
    if (!currentUser) return message.error('กรุณาเข้าสู่ระบบก่อนแจ้งจุดเสี่ยง');
    
    setIsLoading(true);
    try {
      let imageUrl = null;

      // 1. อัปโหลดรูปภาพหลักฐาน
      if (fileList.length > 0) {
        const file = fileList[0].originFileObj;
        const fileExt = file.name.split('.').pop();
        const uniqueName = `incidents/${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;

        const { data, error } = await supabase.storage.from('permits').upload(uniqueName, file);
        if (error) throw error;

        const { data: publicUrlData } = supabase.storage.from('permits').getPublicUrl(uniqueName);
        imageUrl = publicUrlData.publicUrl;
      }

      // 2. ส่งข้อมูลไป Backend
      await fetch('https://safetyos-backend.onrender.com/incidents', {
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

      message.success('ส่งรายงานจุดเสี่ยงสำเร็จ! ระบบได้แจ้งเตือน จป. แล้ว');
      form.resetFields();
      setFileList([]);
      setLocation({ lat: null, lng: null });
      fetchIncidents();
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการส่งรายงาน');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`https://safetyos-backend.onrender.com/incidents/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      message.success(`อัปเดตสถานะเป็น ${newStatus} เรียบร้อยแล้ว`);
      fetchIncidents();
    } catch (error) {
      message.error('อัปเดตสถานะไม่สำเร็จ');
    }
  };

  // --- UI Helpers ---
  const getTypeTag = (type: string) => {
    switch(type) {
      case 'NEAR_MISS': return <Tag color="volcano" icon={<AlertOutlined />}>Near Miss (เกือบเกิดอุบัติเหตุ)</Tag>;
      case 'UNSAFE_ACT': return <Tag color="magenta" icon={<WarningOutlined />}>Unsafe Act (การกระทำ)</Tag>;
      case 'UNSAFE_CONDITION': return <Tag color="gold" icon={<WarningOutlined />}>Unsafe Condition (สภาพแวดล้อม)</Tag>;
      default: return <Tag color="default">{type}</Tag>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'OPEN': return <Badge status="error" text={<span style={{color: '#ff4d4f', fontWeight: 'bold'}}>รอ (OPEN)</span>} />;
      case 'IN_PROGRESS': return <Badge status="warning" text={<span style={{color: '#faad14', fontWeight: 'bold'}}>กำลังแก้</span>} />;
      case 'RESOLVED': return <Badge status="success" text={<span style={{color: '#52c41a', fontWeight: 'bold'}}>เสร็จแล้ว</span>} />;
      default: return <Badge status="default" text={status} />;
    }
  };

  const glassPanel = { background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)' };

  // 🚀 Action Buttons สำหรับใช้ทั้งใน Table และ Card View
  const ActionButtons = ({ record }: { record: any }) => {
    if (currentUser?.role !== 'SAFETY_ENGINEER') return null;

    return (
      <Space size="small" wrap>
        {record.status === 'OPEN' && (
          <Button type="default" size="small" shape="round" icon={<SyncOutlined />} onClick={() => handleUpdateStatus(record.id, 'IN_PROGRESS')} style={{ color: '#faad14', borderColor: '#faad14', fontSize: '12px' }}>รับเรื่อง</Button>
        )}
        {record.status === 'IN_PROGRESS' && (
          <Button type="primary" size="small" shape="round" icon={<CheckCircleOutlined />} onClick={() => handleUpdateStatus(record.id, 'RESOLVED')} style={{ background: '#52c41a', border: 'none', fontSize: '12px' }}>ปิดเคส</Button>
        )}
      </Space>
    );
  };

  const columns: ColumnsType<any> = [
    {
      title: 'วันที่ / เวลา',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (text) => (
        <Space direction="vertical" size={0}>
          <Text strong>{dayjs(text).format('DD MMM')}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{dayjs(text).format('HH:mm')}</Text>
        </Space>
      )
    },
    {
      title: 'ข้อมูลจุดเสี่ยง (Incident Details)',
      key: 'details',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: '15px' }}>{record.title}</Text>
          {getTypeTag(record.type)}
          <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>{record.description}</Text>
          <Text type="secondary" style={{ fontSize: '12px', color: '#007AFF' }}>
            <EnvironmentOutlined /> ผู้แจ้ง: {record.reporter?.full_name}
          </Text>
        </Space>
      )
    },
    {
      title: 'พิกัด GPS',
      key: 'gps',
      render: (_, record) => (
        record.lat && record.lng ? (
          <Button 
            type="link" 
            size="small" 
            icon={<PushpinOutlined />}
            href={`https://www.google.com/maps/search/?api=1&query=${record.lat},${record.lng}`}
            target="_blank"
            style={{ padding: 0 }}
          >
             ดูแผนที่
          </Button>
        ) : <Text type="secondary" style={{ fontSize: '12px' }}>-</Text>
      )
    },
    {
      title: 'รูปถ่าย (Evidence)',
      key: 'image',
      render: (_, record) => (
        record.image_url ? (
          <Button type="primary" ghost size="small" icon={<CameraOutlined />} href={record.image_url} target="_blank" style={{ borderRadius: '8px' }}>
            ดูรูป
          </Button>
        ) : <Text type="secondary">-</Text>
      )
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusBadge(status)
    },
    {
      title: 'การจัดการ (จป.)',
      key: 'action',
      render: (_, record) => <ActionButtons record={record} />
    }
  ];

  return (
    <div className="space-y-6" style={{ padding: isMobile ? '12px' : '0' }}> {/* 🚀 ลด Padding มือถือ */}
      
      {/* ส่วนที่ 1: ฟอร์มแจ้งเหตุ */}
      <Card 
        title={<Space><AlertOutlined style={{color: '#ff4d4f'}} /> <Text strong style={{color: '#ff4d4f', fontSize: isMobile ? '16px' : '18px'}}>ระบบรายงานจุดเสี่ยง (Incident Report)</Text></Space>} 
        bordered={false} 
        style={{...glassPanel, background: 'linear-gradient(135deg, rgba(255, 241, 240, 0.8) 0%, rgba(255, 255, 255, 0.8) 100%)'}}
        bodyStyle={{ padding: isMobile ? '16px' : '24px' }}
      >
        <Form form={form} layout="vertical" onFinish={handleReportIncident}>
          <Row gutter={16}>
            <Col xs={24} md={16}> {/* 🚀 มือถือเต็มจอ (24), คอม 2/3 (16) */}
              <Form.Item name="title" label={<Text strong>หัวข้อ/จุดที่พบเห็น (What happened?)</Text>} rules={[{ required: true, message: 'กรุณาระบุหัวข้อ' }]}>
                <Input size="large" placeholder="เช่น พบนั่งร้านชำรุด, น้ำมันรั่วไหล" style={{ borderRadius: '8px' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}> {/* 🚀 มือถือเต็มจอ (24), คอม 1/3 (8) */}
              <Form.Item name="type" label={<Text strong>ประเภทความเสี่ยง (Incident Type)</Text>} rules={[{ required: true }]}>
                <Select size="large" placeholder="เลือกประเภท" options={[
                  { value: 'NEAR_MISS', label: '⚠️ Near Miss' },
                  { value: 'UNSAFE_ACT', label: '🚫 Unsafe Act' },
                  { value: 'UNSAFE_CONDITION', label: '🏭 Unsafe Condition' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label={<Text strong>รายละเอียดเพิ่มเติม (Description)</Text>} rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="อธิบายรายละเอียดสิ่งที่พบเห็น..." style={{ borderRadius: '8px' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label={<Text strong>📍 พิกัด GPS (สำคัญ)</Text>}>
                <Button block={isMobile} type="dashed" size="large" onClick={getLocation} loading={isGettingLocation} icon={<EnvironmentOutlined />} style={{ borderRadius: '8px', borderColor: '#007AFF', color: '#007AFF' }}>
                  {location.lat ? 'อัปเดตพิกัดเรียบร้อย' : 'คลิกดึงพิกัด GPS'}
                </Button>
                {location.lat && <div style={{ marginTop: 8 }}><Text type="success" strong><CheckCircleOutlined /> {location.lat.toFixed(4)}, {location.lng?.toFixed(4)}</Text></div>}
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={<Text strong>📸 รูปถ่าย (Evidence)</Text>}>
                <Upload beforeUpload={() => false} maxCount={1} fileList={fileList} onChange={(info) => setFileList(info.fileList)}>
                  <Button block={isMobile} icon={<CameraOutlined />} size="large" style={{ borderRadius: '8px', width: isMobile ? '100%' : 'auto' }}>อัปโหลดรูปถ่าย</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, marginTop: '8px' }}>
            <Button type="primary" htmlType="submit" size="large" loading={isLoading} style={{ background: '#ff4d4f', borderRadius: '8px', fontWeight: 600, width: isMobile ? '100%' : '200px', height: '50px' }}>
              ส่งรายงานจุดเสี่ยงด่วน!
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* ส่วนที่ 2: Dashboard */}
      <Card title={<b style={{fontSize: isMobile ? '16px' : '18px', color: '#1d1d1f'}}>🚨 กระดานติดตามจุดเสี่ยง</b>} bordered={false} style={glassPanel} bodyStyle={{ padding: isMobile ? '12px' : '24px' }}>
        
        {/* 🚀 Desktop: แสดง Table */}
        {!isMobile && (
          <Table columns={columns} dataSource={incidents} loading={isLoading && incidents.length === 0} pagination={{ pageSize: 5 }} size="middle" rowKey="id" />
        )}

        {/* 🚀 Mobile: แสดง List แบบ Facebook Feed */}
        {isMobile && (
          <List
            itemLayout="vertical"
            size="large"
            pagination={{ pageSize: 3 }}
            dataSource={incidents}
            renderItem={(item) => (
              <List.Item
                key={item.title}
                style={{ background: '#fff', borderRadius: '12px', marginBottom: '16px', border: '1px solid #f0f0f0', padding: '16px' }}
                actions={[
                  <ActionButtons record={item} />, // ปุ่มรับเรื่อง/ปิดเคส
                  item.lat && <Button type="link" size="small" icon={<EnvironmentOutlined />} href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`} target="_blank">แผนที่</Button>,
                  item.image_url && <Button type="link" size="small" icon={<CameraOutlined />} href={item.image_url} target="_blank">รูปภาพ</Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#007AFF' }} />}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Text strong style={{ fontSize: '16px', color: '#1d1d1f' }}>{item.title}</Text>
                      {getStatusBadge(item.status)}
                    </div>
                  }
                  description={
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>{item.reporter?.full_name} • {dayjs(item.created_at).fromNow()}</Text>
                      <div style={{ marginTop: '8px' }}>{getTypeTag(item.type)}</div>
                    </Space>
                  }
                />
                <div style={{ marginTop: '12px', color: '#555', fontSize: '14px' }}>
                  {item.description}
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}