import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Row, Col, Statistic, Typography, List, Tag, Space, Avatar, Progress, Skeleton, Modal, Button, Image, Grid } from 'antd'; // 👈 เพิ่ม Grid
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
const { useBreakpoint } = Grid; // 🚀 เรียกใช้ Hook สำหรับเช็คขนาดหน้าจอ

export default function Dashboard() {
  const screens = useBreakpoint(); // 🚀 ตัวแปรเช็คขนาดจอ (md, lg, xs)
  const isMobile = !screens.md; // ถ้าไม่ใช่จอขนาดกลางขึ้นไป (Tablet/PC) ถือว่าเป็นมือถือ

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [recentPermits, setRecentPermits] = useState<any[]>([]);

  // State สำหรับเปิดหน้าต่าง (Modal) ดูรายละเอียด
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const resDash = await axios.get('https://safetyos-backend.onrender.com/dashboard');
      setData(resDash.data);

      const resPermits = await axios.get('https://safetyos-backend.onrender.com/permits');
      setRecentPermits(resPermits.data.slice(0, 4)); 

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
    // 🚀 ปรับ Padding: มือถือ = 12px, คอม = 24px (ใช้พื้นที่คุ้มค่าแบบ Facebook)
    <div className="space-y-6" style={{ padding: isMobile ? '12px' : '24px', paddingBottom: '80px' }}>
      
      {/* Header Responsive */}
      <div style={{ 
        marginBottom: '32px', 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', // 👈 มือถือเรียงแนวตั้ง, คอมเรียงแนวนอน
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'flex-end',
        gap: '16px' // 👈 เว้นระยะห่างเวลาซ้อนกัน
      }}>
        <Space align="center" size="middle" style={{ width: '100%' }}>
          <div style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)', padding: '16px', borderRadius: '18px', boxShadow: '0 8px 16px rgba(0,122,255,0.2)' }}>
            <DashboardOutlined style={{ fontSize: isMobile ? '24px' : '32px', color: '#fff' }} />
          </div>
          <div>
            <Title level={isMobile ? 3 : 2} style={{ margin: 0, wordBreak: 'keep-all' }}>Safety Overview</Title>
            <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>ศูนย์บัญชาการและสรุปสถิติความปลอดภัยแบบ Real-time</Text>
          </div>
        </Space>
        
        {/* 🚀 ย้าย Tag ไปชิดขวาหรือชิดซ้ายตามขนาดจอ */}
        <Tag color="blue" style={{ borderRadius: '20px', padding: '4px 12px', alignSelf: isMobile ? 'flex-start' : 'auto', marginLeft: isMobile ? 54 : 0 }}>
          อัปเดตล่าสุด: {dayjs().format('HH:mm')} น.
        </Tag>
      </div>

      {/* 📊 ส่วนที่ 1: การ์ดตัวเลขสรุป (ใช้ Grid เดิม แต่ปรับ Font ให้เหมาะกับมือถือ) */}
      <Row gutter={[16, 16]}> {/* ลดช่องว่าง Grid บนมือถือให้กระชับขึ้น */}
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ ...glassPanel, borderTop: '4px solid #007AFF' }} hoverable bodyStyle={{ padding: '20px' }}>
            <Statistic title="ใบอนุญาตงานทั้งหมด" value={data.stats.totalPermits} prefix={<FileTextOutlined style={{color:'#007AFF'}}/>} valueStyle={{fontWeight: 800, fontSize: isMobile ? '24px' : '32px'}} />
            <Progress percent={Math.round((data.stats.pendingPermits / data.stats.totalPermits) * 100) || 0} status="active" strokeColor="#007AFF" size="small" />
            <Text type="secondary" style={{fontSize:'12px'}}>รอตรวจสอบ {data.stats.pendingPermits} ใบ</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ ...glassPanel, borderTop: '4px solid #ff4d4f' }} hoverable bodyStyle={{ padding: '20px' }}>
            <Statistic title="จุดเสี่ยง (Open)" value={data.stats.openIncidents} prefix={<WarningOutlined style={{color:'#ff4d4f'}}/>} valueStyle={{color: '#ff4d4f', fontWeight: 800, fontSize: isMobile ? '24px' : '32px'}} />
            <Text type="secondary" style={{fontSize:'12px'}}>ต้องการการแก้ไขด่วน!</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ ...glassPanel, borderTop: '4px solid #faad14' }} hoverable bodyStyle={{ padding: '20px' }}>
            <Statistic title="อุปกรณ์ชำรุด" value={data.stats.defectiveEquip} prefix={<ToolOutlined style={{color:'#faad14'}}/>} valueStyle={{color: '#faad14', fontWeight: 800, fontSize: isMobile ? '24px' : '32px'}} />
            <Text type="secondary" style={{fontSize:'12px'}}>รอดำเนินการซ่อมบำรุง</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ ...glassPanel, borderTop: '4px solid #52c41a' }} hoverable bodyStyle={{ padding: '20px' }}>
            <Statistic title="พนักงานในพื้นที่" value={data.stats.totalUsers} prefix={<TeamOutlined style={{color:'#52c41a'}}/>} valueStyle={{color: '#52c41a', fontWeight: 800, fontSize: isMobile ? '24px' : '32px'}} />
            <Text type="secondary" style={{fontSize:'12px'}}>ยืนยันผ่าน E-Passport</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        
        {/* 🚀 ส่วนที่ 2: รายงานจุดเสี่ยงล่าสุด */}
        <Col xs={24} lg={12}>
          <Card title={<Space><WarningOutlined style={{color:'#ff4d4f'}}/> <Text strong>รายงานจุดเสี่ยงล่าสุด</Text></Space>} style={glassPanel} bodyStyle={{ padding: isMobile ? '12px' : '24px' }}>
            <List
              itemLayout="horizontal"
              dataSource={data.recentIncidents}
              renderItem={(item: any) => (
                <List.Item 
                  style={{ cursor: 'pointer', transition: 'all 0.3s', padding: '12px', borderRadius: '12px', flexWrap: 'nowrap' }}
                  className="hover:bg-gray-50"
                  onClick={() => showIncidentDetail(item)}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={item.image_url} icon={<WarningOutlined />} shape="square" style={{backgroundColor: '#fff1f0', color: '#ff4d4f', width: 48, height: 48, borderRadius: '12px'}} />}
                    title={<Text strong style={{ color: '#007AFF', fontSize: isMobile ? '14px' : '16px' }} ellipsis={{ tooltip: item.title }}>{item.title}</Text>}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary" style={{fontSize:'12px'}} ellipsis><TeamOutlined /> {item.reporter?.full_name}</Text>
                        <Text type="secondary" style={{fontSize:'10px'}}>{dayjs(item.created_at).fromNow()}</Text>
                      </Space>
                    }
                  />
                  <div style={{ marginLeft: '10px' }}>
                     <Tag color="error" style={{ borderRadius: '12px', fontSize: '10px' }}>OPEN</Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 🚀 ส่วนที่ 3: งานล่าสุด */}
        <Col xs={24} lg={12}>
          <Card title={<Space><FileTextOutlined style={{color:'#007AFF'}}/> <Text strong>ใบอนุญาตทำงานล่าสุด</Text></Space>} style={glassPanel} bodyStyle={{ padding: isMobile ? '12px' : '24px' }}>
            <List
              itemLayout="horizontal"
              dataSource={recentPermits}
              renderItem={(item: any) => (
                <List.Item style={{ padding: '12px', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: '10px' }}>
                  <List.Item.Meta
                    avatar={
                      <div style={{ background: '#e6f7ff', padding: '12px', borderRadius: '12px' }}>
                        <ThunderboltOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                      </div>
                    }
                    title={<Text strong style={{ fontSize: isMobile ? '14px' : '16px' }}>{item.title}</Text>}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary" style={{fontSize:'12px'}}>{item.permit_type}</Text>
                        <Text type="secondary" style={{fontSize:'12px'}} ellipsis style={{ maxWidth: 150 }}>{item.applicant?.full_name}</Text>
                      </Space>
                    }
                  />
                  {/* ปุ่มดาวน์โหลดจะขยายเต็มในมือถือ */}
                  <div style={{ width: isMobile ? '100%' : 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                    {item.attached_file ? (
                      <Button type="primary" shape="round" icon={<DownloadOutlined />} size="small" href={item.attached_file} target="_blank" style={{ background: '#5856D6', border: 'none', width: isMobile ? '100%' : 'auto' }}>
                        เปิดไฟล์ JSA
                      </Button>
                    ) : (
                      <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>ไม่มีไฟล์แนบ</Text>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* =========================================================
          🔥 Modal Responsive: มือถือ = เต็มจอ, คอม = Popup 600px
         ========================================================= */}
      <Modal
        title={<Space><WarningOutlined style={{ color: '#ff4d4f' }} /> รายละเอียดจุดเสี่ยง</Space>}
        open={isIncidentModalOpen}
        onCancel={() => setIsIncidentModalOpen(false)}
        footer={null} // ซ่อน Footer เดิม เพื่อทำปุ่มปิดเองที่เหมาะกับมือถือ
        width={isMobile ? '100%' : 600} // 👈 มือถือ: เต็มความกว้าง 100%
        style={{ top: isMobile ? 0 : 20, maxWidth: '100vw', margin: 0, padding: 0 }} // 👈 มือถือ: ชิดขอบบน ไม่เหลือขอบขาว
        bodyStyle={{ height: isMobile ? '100vh' : 'auto', overflowY: 'auto', paddingBottom: '40px' }} // 👈 มือถือ: สกอลล์ได้
        destroyOnClose
      >
        {selectedIncident && (
          <div style={{ marginTop: '0px' }}>
            <Title level={4} style={{ fontSize: isMobile ? '18px' : '20px' }}>{selectedIncident.title}</Title>
            <Space style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
              <Tag color="error">{selectedIncident.type}</Tag>
              <Tag color="orange">สถานะ: {selectedIncident.status}</Tag>
              <Tag><EnvironmentOutlined /> GPS: {selectedIncident.lat?.toFixed(4)}, {selectedIncident.lng?.toFixed(4)}</Tag>
            </Space>

            {/* รูปภาพใหญ่สะใจแบบ Facebook */}
            <div style={{ textAlign: 'center', background: '#000', borderRadius: '12px', padding: '4px', marginBottom: '16px', overflow: 'hidden' }}>
              {selectedIncident.image_url ? (
                <Image 
                  src={selectedIncident.image_url} 
                  alt="Incident" 
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ padding: '40px', background: '#f5f5f5', color: '#999' }}>ไม่มีรูปภาพ</div>
              )}
            </div>

            <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
              <Text strong style={{ fontSize: '16px' }}>รายละเอียดที่พบ:</Text>
              <Paragraph style={{ marginTop: '8px', marginBottom: 0, fontSize: '14px', color: '#555' }}>{selectedIncident.description}</Paragraph>
            </div>

            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={24}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '10px' }}>
                  <Avatar icon={<TeamOutlined />} size="large" style={{ backgroundColor: '#007AFF' }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>ผู้แจ้งเหตุ</Text><br />
                    <Text strong style={{ fontSize: '16px' }}>{selectedIncident.reporter?.full_name}</Text>
                  </div>
                </div>
              </Col>
            </Row>

            <Button block type="primary" size="large" shape="round" onClick={() => setIsIncidentModalOpen(false)} style={{ height: '50px', fontSize: '16px' }}>
              ปิดหน้าต่าง
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}