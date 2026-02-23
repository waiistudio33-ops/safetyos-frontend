import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Row, Col, Statistic, Typography, List, Tag, Space, Avatar, Progress, Skeleton, Modal, Button, Image } from 'antd';
import { 
  ToolOutlined, CheckCircleOutlined, WarningOutlined, 
  DashboardOutlined, HistoryOutlined, QrcodeOutlined,
  FileTextOutlined, TeamOutlined, ThunderboltOutlined,
  EyeOutlined, DownloadOutlined, EnvironmentOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';

dayjs.extend(relativeTime);
dayjs.locale('th');

const { Title, Text, Paragraph } = Typography;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [recentPermits, setRecentPermits] = useState<any[]>([]);

  // 🚀 State สำหรับเปิดหน้าต่าง (Modal) ดูรายละเอียด
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // ดึงข้อมูล Dashboard สถิติ
      const resDash = await axios.get('https://safetyos-backend.onrender.com/dashboard');
      setData(resDash.data);

      // 🚀 ดึงข้อมูล Permit ทั้งหมดมาเพื่อโชว์รายการล่าสุดในหน้าแรก
      const resPermits = await axios.get('https://safetyos-backend.onrender.com/permits');
      setRecentPermits(resPermits.data.slice(0, 4)); // เอาแค่ 4 งานล่าสุดมาโชว์

    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const showIncidentDetail = (incident: any) => {
    setSelectedIncident(incident);
    setIsIncidentModalOpen(true);
  };

  const glassPanel = { 
    background: '#ffffff', 
    borderRadius: '24px', 
    border: '1px solid #f0f0f0', 
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)' 
  };

  if (loading || !data) return <Skeleton active paragraph={{ rows: 10 }} />;

  return (
    <div className="space-y-6" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Space align="center" size="middle">
          <div style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)', padding: '16px', borderRadius: '18px', boxShadow: '0 8px 16px rgba(0,122,255,0.2)' }}>
            <DashboardOutlined style={{ fontSize: '32px', color: '#fff' }} />
          </div>
          <div>
            <Title level={2} style={{ margin: 0 }}>Safety Overview</Title>
            <Text type="secondary">ศูนย์บัญชาการและสรุปสถิติความปลอดภัยแบบ Real-time</Text>
          </div>
        </Space>
        <Tag color="blue" style={{ borderRadius: '20px', padding: '4px 12px' }}>อัปเดตล่าสุด: {dayjs().format('HH:mm')} น.</Tag>
      </div>

      {/* 📊 ส่วนที่ 1: การ์ดตัวเลขสรุป (Top Stats) */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ ...glassPanel, borderTop: '4px solid #007AFF' }} hoverable>
            <Statistic title="ใบอนุญาตงานทั้งหมด" value={data.stats.totalPermits} prefix={<FileTextOutlined style={{color:'#007AFF'}}/>} valueStyle={{fontWeight: 800}} />
            <Progress percent={Math.round((data.stats.pendingPermits / data.stats.totalPermits) * 100) || 0} status="active" strokeColor="#007AFF" />
            <Text type="secondary" style={{fontSize:'12px'}}>รอตรวจสอบ {data.stats.pendingPermits} ใบ</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ ...glassPanel, borderTop: '4px solid #ff4d4f' }} hoverable>
            <Statistic title="จุดเสี่ยงที่ยังไม่แก้ไข (Open)" value={data.stats.openIncidents} prefix={<WarningOutlined style={{color:'#ff4d4f'}}/>} valueStyle={{color: '#ff4d4f', fontWeight: 800}} />
            <Text type="secondary">ต้องการการแก้ไขด่วน!</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ ...glassPanel, borderTop: '4px solid #faad14' }} hoverable>
            <Statistic title="อุปกรณ์ชำรุด (Defective)" value={data.stats.defectiveEquip} prefix={<ToolOutlined style={{color:'#faad14'}}/>} valueStyle={{color: '#faad14', fontWeight: 800}} />
            <Text type="secondary">รอดำเนินการซ่อมบำรุง</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ ...glassPanel, borderTop: '4px solid #52c41a' }} hoverable>
            <Statistic title="พนักงานในพื้นที่" value={data.stats.totalUsers} prefix={<TeamOutlined style={{color:'#52c41a'}}/>} valueStyle={{color: '#52c41a', fontWeight: 800}} />
            <Text type="secondary">ยืนยันผ่าน E-Passport แล้ว</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        
        {/* 🚀 ส่วนที่ 2: รายงานจุดเสี่ยงล่าสุด (คลิกเพื่อดูรูปและรายละเอียดได้) */}
        <Col xs={24} lg={12}>
          <Card title={<Space><WarningOutlined style={{color:'#ff4d4f'}}/> <Text strong>รายงานจุดเสี่ยงล่าสุด (คลิกดูรายละเอียด)</Text></Space>} style={glassPanel}>
            <List
              itemLayout="horizontal"
              dataSource={data.recentIncidents}
              renderItem={(item: any) => (
                <List.Item 
                  style={{ cursor: 'pointer', transition: 'all 0.3s', padding: '12px', borderRadius: '12px' }}
                  className="hover:bg-gray-50"
                  onClick={() => showIncidentDetail(item)} // 👈 กดปุ๊บเปิด Modal
                >
                  <List.Item.Meta
                    avatar={<Avatar src={item.image_url} icon={<WarningOutlined />} style={{backgroundColor: '#fff1f0', color: '#ff4d4f', width: 48, height: 48, borderRadius: '12px'}} />}
                    title={<Text strong style={{ color: '#007AFF' }}>{item.title}</Text>}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary" style={{fontSize:'12px'}}><TeamOutlined /> {item.reporter?.full_name}</Text>
                        <Text type="secondary" style={{fontSize:'12px'}}>{dayjs(item.created_at).fromNow()}</Text>
                      </Space>
                    }
                  />
                  <Space direction="vertical" align="end">
                    <Tag color="error" style={{ borderRadius: '12px' }}>OPEN</Tag>
                    
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 🚀 ส่วนที่ 3: งานล่าสุดและไฟล์แนบ (โหลดไฟล์ JSA/เอกสาร ได้จากหน้าแรกเลย) */}
        <Col xs={24} lg={12}>
          <Card title={<Space><FileTextOutlined style={{color:'#007AFF'}}/> <Text strong>ใบอนุญาตทำงานล่าสุด (Permits & Files)</Text></Space>} style={glassPanel}>
            <List
              itemLayout="horizontal"
              dataSource={recentPermits}
              renderItem={(item: any) => (
                <List.Item style={{ padding: '12px' }}>
                  <List.Item.Meta
                    avatar={
                      <div style={{ background: '#e6f7ff', padding: '12px', borderRadius: '12px' }}>
                        <ThunderboltOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                      </div>
                    }
                    title={<Text strong>{item.title}</Text>}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary" style={{fontSize:'12px'}}>{item.permit_type}</Text>
                        <Text type="secondary" style={{fontSize:'12px'}}>{item.applicant?.full_name}</Text>
                      </Space>
                    }
                  />
                  {/* 👈 ปุ่มดาวน์โหลดไฟล์เอกสารแนบตรงๆ จาก Dashboard */}
                  {item.attached_file ? (
                    <Button type="primary" shape="round" icon={<DownloadOutlined />} size="small" href={item.attached_file} target="_blank" style={{ background: '#5856D6', border: 'none' }}>
                      เปิดไฟล์ JSA
                    </Button>
                  ) : (
                    <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>ไม่มีไฟล์แนบ</Text>
                  )}
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* =========================================================
          🔥 Modal สำหรับแสดงรายละเอียดจุดเสี่ยงแบบเต็มจอ (Popup)
          ========================================================= */}
      <Modal
        title={<Space><WarningOutlined style={{ color: '#ff4d4f' }} /> รายละเอียดจุดเสี่ยง (Incident Details)</Space>}
        open={isIncidentModalOpen}
        onCancel={() => setIsIncidentModalOpen(false)}
        footer={[
          <Button key="close" type="primary" shape="round" onClick={() => setIsIncidentModalOpen(false)}>
            ปิดหน้าต่าง
          </Button>
        ]}
        width={600}
        destroyOnClose
      >
        {selectedIncident && (
          <div style={{ marginTop: '16px' }}>
            <Title level={4}>{selectedIncident.title}</Title>
            <Space style={{ marginBottom: '16px' }}>
              <Tag color="error">{selectedIncident.type}</Tag>
              <Tag color="orange">สถานะ: {selectedIncident.status}</Tag>
            </Space>

            <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
              <Text strong>รายละเอียดที่พบ:</Text>
              <Paragraph style={{ marginTop: '8px', marginBottom: 0 }}>{selectedIncident.description}</Paragraph>
            </div>

            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: '12px' }}>ผู้แจ้ง:</Text><br />
                <Text strong><TeamOutlined /> {selectedIncident.reporter?.full_name}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: '12px' }}>พิกัด GPS:</Text><br />
                <Text strong><EnvironmentOutlined /> {selectedIncident.lat?.toFixed(4)}, {selectedIncident.lng?.toFixed(4)}</Text>
              </Col>
            </Row>

            {/* โชว์รูปถ่ายหน้างานแบบคลิกขยายได้ */}
            {selectedIncident.image_url ? (
              <div style={{ textAlign: 'center', background: '#000', borderRadius: '12px', padding: '8px' }}>
                <Image 
                  src={selectedIncident.image_url} 
                  alt="Incident" 
                  style={{ maxHeight: '300px', borderRadius: '8px', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', background: '#f0f0f0', borderRadius: '12px', padding: '24px' }}>
                <Text type="secondary">ไม่มีรูปถ่ายหน้างาน</Text>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}