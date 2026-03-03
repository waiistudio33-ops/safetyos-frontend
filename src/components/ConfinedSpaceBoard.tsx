import React from 'react';
import { Row, Col, Card, Menu, Typography, Button, Popconfirm, Form, Input, Select, Divider, Space, Badge, Tag, Avatar } from 'antd';
import { AlertOutlined, UserOutlined, LoginOutlined, SafetyCertificateOutlined, EyeOutlined, WarningOutlined, FieldTimeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function ConfinedSpaceBoard({ 
  activePermits, selectedPermit, onSelectPermit, entries, onCheckIn, onCheckOut, onEvacuate, currentUser, isMobile, glassPanel 
}: any) {
  
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    onCheckIn(values);
    form.resetFields();
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}> 
        <Card title={<b style={{color: '#1d1d1f'}}>1. เลือกพื้นที่ปฏิบัติงาน</b>} bordered={false} style={{...glassPanel, height: '100%'}}>
          {activePermits.length === 0 ? <Text type="secondary">ไม่มีงานที่อับอากาศที่กำลังดำเนินการ</Text> : (
            <Menu mode="vertical" selectedKeys={[selectedPermit || '']} style={{ border: 'none', background: 'transparent' }} onClick={(e) => onSelectPermit(e.key)}>
              {activePermits.map((p: any) => (
                <Menu.Item key={p.id} style={{ borderRadius: '12px', height: 'auto', padding: '12px', marginBottom: '8px', border: '1px solid #e5e5ea', background: selectedPermit === p.id ? '#eff6ff' : '#fff' }}>
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
              {selectedPermit && (
                <Popconfirm title="ยืนยันอพยพฉุกเฉิน?" onConfirm={onEvacuate} okText="อพยพทันที" okButtonProps={{danger: true}} cancelText="ยกเลิก">
                  <Button type="primary" danger icon={<AlertOutlined />} size={isMobile ? "small" : "middle"} className="animate-pulse" style={{fontWeight: 'bold'}}>อพยพ!</Button>
                </Popconfirm>
              )}
            </div>
          } 
          bordered={false} style={{...glassPanel, minHeight: '500px'}}
        >
          {selectedPermit ? (
            <>
              <Form form={form} layout={isMobile ? "vertical" : "inline"} onFinish={handleFinish} style={{ marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <Form.Item name="worker_name" rules={[{ required: true, message: 'กรอกชื่อ' }]} style={{flex: 1, marginBottom: isMobile ? '12px' : '0'}}><Input size="large" placeholder="ชื่อผู้ปฏิบัติงาน" prefix={<UserOutlined className="text-slate-400" />} style={{borderRadius: '12px'}} /></Form.Item>
                <Form.Item name="role" rules={[{ required: true, message: 'เลือกหน้าที่' }]} style={{marginBottom: isMobile ? '12px' : '0'}}><Select size="large" placeholder="หน้าที่" options={[{value:'ENTRANT', label:'ผู้ปฏิบัติงาน'}, {value:'STANDBY', label:'ผู้เฝ้าระวัง'}]} style={{ width: isMobile ? '100%' : '150px' }}/></Form.Item>
                <Form.Item style={{marginBottom: 0}}><Button size="large" type="primary" htmlType="submit" block={isMobile} icon={<LoginOutlined />} style={{ background: '#2563eb', borderRadius: '12px', border: 'none' }}>เข้าพื้นที่</Button></Form.Item>
              </Form>

              <Divider orientation="left"><Text strong className="text-slate-500">สถานะปัจจุบัน (Real-time)</Text></Divider>
              
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card size="small" title={<Space><SafetyCertificateOutlined style={{color:'#3b82f6'}}/> <Text strong style={{color: '#1d4ed8'}}>ผู้เฝ้าระวัง (Standby)</Text></Space>} styles={{ header: {background: '#eff6ff', borderBottom: '1px solid #bfdbfe'} }} style={{ border: '1px solid #bfdbfe', borderRadius: '12px', overflow: 'hidden' }}>
                    {entries.filter((e: any) => e.status === 'INSIDE' && e.role === 'STANDBY').length === 0 ? <Text type="secondary" italic>⚠️ ไม่มีผู้เฝ้าระวังปากบ่อ</Text> : null}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {entries.filter((e: any) => e.status === 'INSIDE' && e.role === 'STANDBY').map((e: any) => (
                        <Tag key={e.id} color="blue" style={{ padding: '8px', fontSize: '14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: '#dbeafe', color: '#1e3a8a' }}>
                          <Avatar size="small" icon={<EyeOutlined />} style={{background: '#3b82f6'}} />
                          <span style={{fontWeight: 600}}>{e.worker_name}</span>
                          <Button size="small" type="text" danger onClick={() => onCheckOut(e.id)} style={{marginLeft: '4px', padding: 0}}>ออก</Button>
                        </Tag>
                      ))}
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={12}>
                  <Card size="small" title={<Space><WarningOutlined style={{color:'#ef4444'}}/> <Text strong style={{color: '#b91c1c'}}>อยู่ในบ่อ (Entrants)</Text> <Badge count={entries.filter((e: any) => e.status === 'INSIDE' && e.role === 'ENTRANT').length} style={{backgroundColor: '#ef4444'}} /></Space>} styles={{ header: {background: '#fef2f2', borderBottom: '1px solid #fecaca'} }} style={{ border: '1px solid #fecaca', borderRadius: '12px', overflow: 'hidden' }}>
                    {entries.filter((e: any) => e.status === 'INSIDE' && e.role === 'ENTRANT').length === 0 ? <Text type="secondary">ไม่มีคนด้านใน</Text> : null}
                    {entries.filter((e: any) => e.status === 'INSIDE' && e.role === 'ENTRANT').map((e: any) => {
                      const minsInside = dayjs().diff(dayjs(e.time_in), 'minute');
                      const isWarning = minsInside >= 60; 
                      return (
                        <Card key={e.id} size="small" style={{ marginBottom: '8px', borderLeft: `4px solid ${isWarning ? '#ef4444' : '#f59e0b'}`, background: isWarning ? '#fef2f2' : '#fff', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div><Text strong>{e.worker_name}</Text><br/><Text type="secondary" style={{fontSize:'12px'}}>เข้า: {dayjs(e.time_in).format('HH:mm')}</Text></div>
                            <div style={{ textAlign: 'right' }}>
                              <Tag color={isWarning ? 'red' : 'orange'} style={{borderRadius: '12px', padding: '2px 8px', border: 'none'}}><FieldTimeOutlined /> {minsInside} นาที</Tag><br/>
                              <Button size="small" type="primary" onClick={() => onCheckOut(e.id)} style={{marginTop: '4px', background: '#1e293b', border: 'none', borderRadius: '6px'}}>ดึงขึ้น</Button>
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
                      {entries.filter((e: any) => e.status === 'OUTSIDE').map((e: any) => (
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
  );
}