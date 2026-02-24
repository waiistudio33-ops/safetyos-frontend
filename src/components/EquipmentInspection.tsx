import React, { useState } from 'react';
import { Card, Button, Typography, Space, Input, message, Tag, Switch, Divider, Result, Tabs, Timeline, Empty, Grid } from 'antd'; // 👈 เพิ่ม Grid
import { 
  QrcodeOutlined, SearchOutlined, ToolOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, SaveOutlined, HistoryOutlined, UserOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

dayjs.locale('th');
const { Title, Text } = Typography;
const { useBreakpoint } = Grid; // 🚀 เรียกใช้ Hook เช็คขนาดจอ

// 📝 มาตรฐาน Checklist อิงตาม NFPA 10 และกฎหมายไทย
const CHECKLISTS: Record<string, string[]> = {
  'FIRE_EXTINGUISHER': [
    '1. เกจ์วัดความดัน: เข็มชี้อยู่ในแถบสีเขียว (Pressure in green zone)',
    '2. สลักและซีลล็อค: ไม่ฉีกขาด ไม่หลุดหาย (Pin and seal intact)',
    '3. สายฉีดและหัวฉีด: ไม่แตกร้าว ไม่อุดตัน (Hose/Nozzle clear)',
    '4. สภาพตัวถัง: ไม่มีรอยสนิม รอยบวม หรือบุบบี้ (No rust/dents)',
    '5. ป้ายแนะนำการใช้งาน: อ่านได้ชัดเจน ไม่ฉีกขาด (Labels legible)'
  ],
  'SCAFFOLDING': [
    '1. แผ่นฐานรองรับ (Base plate) มั่นคงและได้ระดับ',
    '2. โครงสร้างไม่บิดเบี้ยว งอ หรือมีรอยร้าว',
    '3. มีราวกันตก (Guardrail) และแผ่นกันของตก (Toeboard) ครบถ้วน',
    '4. แผ่นพื้นทางเดินยึดติดแน่นหนา ไม่มีรอยผุพัง'
  ],
  'HEAVY_MACHINERY': [
    '1. ระบบเบรกและสัญญาณเตือนทำงานปกติ',
    '2. ไม่มีรอยรั่วซึมของน้ำมันเครื่อง/น้ำมันไฮดรอลิก',
    '3. เข็มขัดนิรภัยและระบบความปลอดภัยพร้อมใช้งาน'
  ]
};

export default function EquipmentInspection({ currentUser }: { currentUser: any }) {
  const screens = useBreakpoint(); // 🚀 ตัวแปรเช็คขนาดจอ
  const isMobile = !screens.md; // ถ้าเล็กกว่า md (Tablet) ถือเป็น Mobile

  const [qrCode, setQrCode] = useState('');
  const [equipment, setEquipment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<Record<number, boolean>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSearchQR = async () => {
    if (!qrCode) return message.warning('กรุณาระบุรหัส QR Code');
    setIsLoading(true);
    try {
      const res = await fetch(`https://safetyos-backend.onrender.com/equipment/${qrCode}`);
      if (!res.ok) throw new Error('ไม่พบอุปกรณ์');
      const data = await res.json();
      setEquipment(data);
      
      const initialResult: Record<number, boolean> = {};
      const typeList = CHECKLISTS[data.type] || ['สภาพทั่วไปปกติพร้อมใช้งาน'];
      typeList.forEach((_, index) => { initialResult[index] = true; });
      setInspectionResult(initialResult);
      setIsSuccess(false);
    } catch (error) {
      message.error('ไม่พบอุปกรณ์ในระบบ หรือ QR Code ไม่ถูกต้อง');
      setEquipment(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const isDefective = Object.values(inspectionResult).includes(false);
    const finalStatus = isDefective ? 'DEFECTIVE' : 'NORMAL';

    try {
      await fetch(`https://safetyos-backend.onrender.com/equipment/${equipment.id}/inspect`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: finalStatus,
          inspector_id: currentUser?.id,
          inspector_name: currentUser?.full_name || 'เจ้าหน้าที่ (ไม่ระบุตัวตน)', 
          details: JSON.stringify(inspectionResult)
        })
      });
      message.success('บันทึกผลการตรวจสอบเรียบร้อยแล้ว');
      setIsSuccess(true);
    } catch (error) {
      message.error('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const getEquipmentIcon = (type: string) => {
    switch(type) {
      case 'FIRE_EXTINGUISHER': return '🧯';
      case 'SCAFFOLDING': return '🏗️';
      case 'HEAVY_MACHINERY': return '🚜';
      default: return '⚙️';
    }
  };

  const glassPanel = { 
    background: 'rgba(255, 255, 255, 0.9)', // ปรับให้ทึบขึ้นนิดนึงเพื่อให้อ่านง่ายบนมือถือ
    backdropFilter: 'blur(20px)', 
    borderRadius: '24px', 
    border: '1px solid rgba(255, 255, 255, 0.5)', 
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)' 
  };

  if (isSuccess) {
    return (
      <Card style={glassPanel} className="text-center" bodyStyle={{ padding: isMobile ? '24px 12px' : '32px' }}>
        <Result 
          status="success" 
          title={<Title level={isMobile ? 4 : 3} style={{ color: '#34c759' }}>บันทึกการตรวจสอบเรียบร้อย!</Title>}
          subTitle={`อัปเดตสถานะของ ${equipment?.name} ลงในระบบส่วนกลางแล้ว`}
          extra={[
            <Button 
              type="primary" 
              size="large" 
              icon={<QrcodeOutlined />} 
              key="console" 
              onClick={() => { setEquipment(null); setQrCode(''); setIsSuccess(false); }} 
              style={{ borderRadius: '12px', background: '#007AFF', width: isMobile ? '100%' : 'auto', padding: '0 32px' }}
            >
              สแกนอุปกรณ์ชิ้นต่อไป
            </Button>
          ]}
        />
      </Card>
    );
  }

  return (
    // 🚀 ปรับ Padding ตามขนาดจอ: มือถือชิดขอบมากขึ้น (12px), คอมเว้นที่เยอะหน่อย (24px)
    <div className="space-y-6" style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '12px' : '0' }}>
      
      <Space align="center" style={{ marginBottom: '16px', justifyContent: isMobile ? 'center' : 'flex-start', width: '100%' }}>
        <div style={{ background: '#007AFF', padding: '12px', borderRadius: '12px' }}>
          <SafetyCertificateOutlined style={{ fontSize: '24px', color: '#fff' }} />
        </div>
        <Title level={isMobile ? 4 : 3} style={{ color: '#1d1d1f', margin: 0 }}>ระบบตรวจสอบอุปกรณ์</Title>
      </Space>

      {/* Search Card */}
      <Card style={glassPanel} bodyStyle={{ padding: isMobile ? '16px' : '24px' }}>
        <Title level={5} style={{ color: '#1d1d1f', marginBottom: 12 }}>🔍 สแกน QR Code หรือ พิมพ์รหัส</Title>
        <Space.Compact style={{ width: '100%' }}>
          <Input 
            size="large" 
            placeholder="รหัสอุปกรณ์ (EXT-001)" 
            value={qrCode} 
            onChange={(e) => setQrCode(e.target.value)} 
            onPressEnter={handleSearchQR} 
            prefix={<QrcodeOutlined style={{ color: '#8e8e93' }} />} 
            style={{ fontSize: '16px' }}
          />
          <Button type="primary" size="large" onClick={handleSearchQR} loading={isLoading} icon={<SearchOutlined />} style={{ background: '#007AFF' }}>
            {!isMobile && 'ค้นหา'} 
          </Button>
        </Space.Compact>
        <Text type="secondary" style={{ display: 'block', marginTop: '12px', fontSize: '12px' }}>
          *รองรับการใช้งานผ่านกล้องมือถือและเครื่องสแกน
        </Text>
      </Card>

      {/* Equipment Details Card */}
      {equipment && (
        <Card style={{...glassPanel, borderTop: '4px solid #007AFF', marginTop: '16px'}} bodyStyle={{ padding: isMobile ? '12px' : '24px' }}>
          <Tabs defaultActiveKey="1" items={[
            {
              key: '1',
              label: <span><CheckCircleOutlined /> ตรวจสอบ</span>,
              children: (
                <div style={{ paddingTop: '16px' }}>
                  {/* 🚀 Header Info: บนมือถือเรียงแนวตั้ง (Column), บนคอมเรียงแนวนอน (Row) */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row', 
                    alignItems: 'center', 
                    gap: '20px', 
                    marginBottom: '24px', 
                    background: '#f8f9fa', 
                    padding: '16px', 
                    borderRadius: '16px',
                    textAlign: isMobile ? 'center' : 'left'
                  }}>
                    <div style={{ fontSize: '48px', background: '#fff', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                      {getEquipmentIcon(equipment.type)}
                    </div>
                    <div style={{ width: '100%' }}>
                      <Title level={4} style={{ margin: '0 0 4px 0', color: '#1d1d1f' }}>{equipment.name}</Title>
                      <Text type="secondary" style={{ fontSize: '14px' }}>รหัส: <Text strong>{equipment.qr_code}</Text></Text>
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px', justifyContent: isMobile ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
                        <Tag color="blue" style={{ borderRadius: '6px' }}>{equipment.type}</Tag>
                        <Tag color={equipment.status === 'NORMAL' ? 'green' : 'red'} style={{ borderRadius: '6px' }}>
                          สถานะ: {equipment.status}
                        </Tag>
                      </div>
                    </div>
                  </div>

                  <Divider orientation="left" style={{ margin: '12px 0' }}><Text strong style={{ fontSize: '16px', color: '#1d1d1f' }}>📝 รายการตรวจสอบ</Text></Divider>
                  
                  {/* Checklist Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(CHECKLISTS[equipment.type] || ['สภาพทั่วไปปกติพร้อมใช้งาน']).map((item, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row', // 🚀 มือถือเรียงลงมา, คอมเรียงข้าง
                        justifyContent: 'space-between', 
                        alignItems: isMobile ? 'flex-start' : 'center', 
                        gap: isMobile ? '12px' : '0',
                        background: inspectionResult[index] ? '#f6ffed' : '#fff1f0', 
                        padding: '16px', 
                        borderRadius: '12px', 
                        border: `1px solid ${inspectionResult[index] ? '#b7eb8f' : '#ffa39e'}`,
                        transition: 'all 0.3s'
                      }}>
                        <Space style={{ flex: 1, paddingRight: isMobile ? 0 : '16px', width: '100%' }}>
                          {inspectionResult[index] ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px', flexShrink: 0 }}/> : <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '20px', flexShrink: 0 }}/>}
                          <Text strong style={{ fontSize: '15px', color: inspectionResult[index] ? '#237804' : '#a8071a', wordBreak: 'break-word' }}>{item}</Text>
                        </Space>
                        
                        {/* ส่วน Switch บนมือถือจะกว้างเต็มจอ */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          width: isMobile ? '100%' : 'auto', 
                          borderTop: isMobile ? '1px solid rgba(0,0,0,0.05)' : 'none',
                          paddingTop: isMobile ? '8px' : '0'
                        }}>
                          <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'bold' }}>{inspectionResult[index] ? 'ผ่าน' : 'ชำรุด'}</Text>
                          <Switch 
                            checked={inspectionResult[index]} 
                            onChange={(checked) => setInspectionResult({...inspectionResult, [index]: checked})} 
                            style={{ background: inspectionResult[index] ? '#52c41a' : '#ff4d4f' }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Submit Section */}
                  <div style={{ marginTop: '32px', textAlign: 'center', background: '#f8f9fa', padding: '24px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: '16px', fontSize: '14px' }}>
                      <UserOutlined /> ผู้ตรวจสอบ: <Text strong style={{ color: '#007AFF' }}>{currentUser?.full_name || 'ไม่ระบุชื่อ'}</Text>
                    </Text>
                    <Button 
                      type="primary" 
                      size="large" 
                      icon={<SaveOutlined />} 
                      onClick={handleSubmit} 
                      loading={isLoading} 
                      style={{ 
                        borderRadius: '12px', 
                        background: 'linear-gradient(135deg, #007AFF, #5856D6)', 
                        border: 'none', 
                        width: '100%', 
                        maxWidth: '350px', 
                        height: '50px', 
                        fontSize: '16px', 
                        fontWeight: 'bold', 
                        boxShadow: '0 4px 15px rgba(0,122,255,0.3)' 
                      }}
                    >
                      ยืนยันผลการตรวจสอบ
                    </Button>
                  </div>
                </div>
              )
            },
            {
              key: '2',
              label: <span><HistoryOutlined /> ประวัติ</span>,
              children: (
                <div style={{ marginTop: '16px', padding: isMobile ? '12px' : '24px', background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0' }}>
                  {equipment.history && equipment.history.length > 0 ? (
                    <Timeline 
                      mode="left"
                      items={equipment.history.map((log: any) => ({
                        color: log.status === 'NORMAL' ? 'green' : 'red',
                        children: (
                          <div style={{ paddingBottom: '8px' }}>
                            <Text strong style={{ fontSize: '14px' }}>{dayjs(log.created_at).format('DD MMM YY, HH:mm')}</Text>
                            <div style={{ marginTop: '4px', background: log.status === 'NORMAL' ? '#f6ffed' : '#fff1f0', border: `1px solid ${log.status === 'NORMAL' ? '#b7eb8f' : '#ffa39e'}`, padding: '8px 12px', borderRadius: '8px' }}>
                              <Space direction="vertical" size={0} style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Tag color={log.status === 'NORMAL' ? 'green' : 'red'} style={{ margin: 0 }}>{log.status}</Tag>
                                </div>
                                <Text type="secondary" style={{ fontSize: '12px', marginTop: 4 }}><UserOutlined /> {log.inspector_name}</Text>
                              </Space>
                            </div>
                          </div>
                        )
                      }))}
                    />
                  ) : (
                    <Empty description={<Text type="secondary">ไม่มีประวัติ</Text>} />
                  )}
                </div>
              )
            }
          ]} />
        </Card>
      )}
    </div>
  );
}