import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Button, Space, Typography, Form, Input, 
  Select, Upload, message, Badge, Tooltip, Row, Col, Modal
} from 'antd';
import { 
  WarningOutlined, CameraOutlined, EnvironmentOutlined, 
  PushpinOutlined, CheckCircleOutlined, SyncOutlined, AlertOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { supabase } from '../supabase';

const { Title, Text } = Typography;

export default function IncidentReport({ currentUser }: { currentUser: any }) {
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
      case 'OPEN': return <Badge status="error" text={<span style={{color: '#ff4d4f', fontWeight: 'bold'}}>รอดำเนินการ (OPEN)</span>} />;
      case 'IN_PROGRESS': return <Badge status="warning" text={<span style={{color: '#faad14', fontWeight: 'bold'}}>กำลังแก้ไข (IN PROGRESS)</span>} />;
      case 'RESOLVED': return <Badge status="success" text={<span style={{color: '#52c41a', fontWeight: 'bold'}}>แก้ไขแล้ว (RESOLVED)</span>} />;
      default: return <Badge status="default" text={status} />;
    }
  };

  const glassPanel = { background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)' };

  const columns: ColumnsType<any> = [
    {
      title: 'วันที่ / เวลา',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => (
        <Space direction="vertical" size={0}>
          <Text strong>{dayjs(text).format('DD MMM YYYY')}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{dayjs(text).format('HH:mm')}</Text>
        </Space>
      )
    },
    {
      title: 'ข้อมูลจุดเสี่ยง (Incident Details)',
      key: 'details',
      width: 300,
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
            ดูแผนที่ ({record.lat.toFixed(4)}, {record.lng.toFixed(4)})
          </Button>
        ) : <Text type="secondary" style={{ fontSize: '12px' }}>ไม่ระบุพิกัด</Text>
      )
    },
    {
      title: 'รูปถ่าย (Evidence)',
      key: 'image',
      render: (_, record) => (
        record.image_url ? (
          <Button type="primary" ghost size="small" icon={<CameraOutlined />} href={record.image_url} target="_blank" style={{ borderRadius: '8px' }}>
            ดูรูปหลักฐาน
          </Button>
        ) : <Text type="secondary">-</Text>
      )
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusBadge(status)
    },
    {
      title: 'การจัดการ (จป.)',
      key: 'action',
      render: (_, record) => {
        if (currentUser?.role === 'SAFETY_ENGINEER') {
          return (
            <Space size="small">
              {record.status === 'OPEN' && (
                <Tooltip title="รับเรื่อง / กำลังดำเนินการแก้ไข">
                  <Button type="default" shape="round" icon={<SyncOutlined />} onClick={() => handleUpdateStatus(record.id, 'IN_PROGRESS')} style={{ color: '#faad14', borderColor: '#faad14', fontSize: '12px' }}>รับเรื่อง</Button>
                </Tooltip>
              )}
              {record.status === 'IN_PROGRESS' && (
                <Tooltip title="แก้ไขจุดเสี่ยงเรียบร้อยแล้ว (ปิดเคส)">
                  <Button type="primary" shape="round" icon={<CheckCircleOutlined />} onClick={() => handleUpdateStatus(record.id, 'RESOLVED')} style={{ background: '#52c41a', border: 'none', fontSize: '12px' }}>ปิดเคส (Resolved)</Button>
                </Tooltip>
              )}
              {record.status === 'RESOLVED' && <Text type="secondary" style={{fontSize:'12px'}}>ปิดเคสแล้ว</Text>}
            </Space>
          );
        }
        return <Text type="secondary" style={{fontSize: '12px'}}>-</Text>;
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* ส่วนที่ 1: ฟอร์มแจ้งเหตุ (ทุกคนแจ้งได้) */}
      <Card title={<b style={{color: '#ff4d4f', fontSize: '18px'}}><AlertOutlined /> ระบบรายงานจุดเสี่ยง (Incident Report)</b>} bordered={false} style={{...glassPanel, background: 'linear-gradient(135deg, rgba(255, 241, 240, 0.8) 0%, rgba(255, 255, 255, 0.8) 100%)'}}>
        <Form form={form} layout="vertical" onFinish={handleReportIncident}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="title" label={<Text strong>หัวข้อ/จุดที่พบเห็น (What happened?)</Text>} rules={[{ required: true, message: 'กรุณาระบุหัวข้อ' }]}>
                <Input size="large" placeholder="เช่น พบนั่งร้านชำรุด, น้ำมันรั่วไหล" style={{ borderRadius: '8px' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="type" label={<Text strong>ประเภทความเสี่ยง (Incident Type)</Text>} rules={[{ required: true }]}>
                <Select size="large" placeholder="เลือกประเภท" options={[
                  { value: 'NEAR_MISS', label: '⚠️ Near Miss (เกือบเกิดอุบัติเหตุ)' },
                  { value: 'UNSAFE_ACT', label: '🚫 Unsafe Act (การกระทำที่ไม่ปลอดภัย)' },
                  { value: 'UNSAFE_CONDITION', label: '🏭 Unsafe Condition (สภาพแวดล้อม)' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label={<Text strong>รายละเอียดเพิ่มเติม (Description)</Text>} rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="อธิบายรายละเอียดสิ่งที่พบเห็น..." style={{ borderRadius: '8px' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text strong>📍 พิกัด GPS (สำคัญมากต่อการสอบสวน)</Text>}>
                <Space>
                  <Button type="dashed" size="large" onClick={getLocation} loading={isGettingLocation} icon={<EnvironmentOutlined />} style={{ borderRadius: '8px', borderColor: '#007AFF', color: '#007AFF' }}>
                    {location.lat ? 'ดึงพิกัดแล้ว (คลิกเพื่อดึงใหม่)' : 'คลิกดึงพิกัด GPS ปัจจุบัน'}
                  </Button>
                  {location.lat && <Text type="success" strong><CheckCircleOutlined /> {location.lat.toFixed(4)}, {location.lng?.toFixed(4)}</Text>}
                </Space>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Text strong>📸 แนบรูปถ่ายหลักฐานหน้างาน (Evidence)</Text>}>
                <Upload beforeUpload={() => false} maxCount={1} fileList={fileList} onChange={(info) => setFileList(info.fileList)}>
                  <Button icon={<CameraOutlined />} size="large" style={{ borderRadius: '8px' }}>อัปโหลดรูปถ่าย</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, marginTop: '16px' }}>
            <Button type="primary" htmlType="submit" size="large" loading={isLoading} style={{ background: '#ff4d4f', borderRadius: '8px', fontWeight: 600, width: '200px' }}>
              ส่งรายงานจุดเสี่ยงด่วน!
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* ส่วนที่ 2: ตาราง (Dashboard) */}
      <Card title={<b style={{fontSize: '18px', color: '#1d1d1f'}}>🚨 กระดานติดตามจุดเสี่ยง (Incident Dashboard)</b>} bordered={false} style={glassPanel}>
        <Table columns={columns} dataSource={incidents} loading={isLoading && incidents.length === 0} pagination={{ pageSize: 5 }} size="middle" rowKey="id" />
      </Card>
    </div>
  );
}