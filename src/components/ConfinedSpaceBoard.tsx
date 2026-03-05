import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Menu, Typography, Button, Popconfirm, Form, Input, Select, Divider, Space, Badge, Tag, Avatar } from 'antd';
import { AlertOutlined, UserOutlined, LoginOutlined, SafetyCertificateOutlined, EyeOutlined, WarningOutlined, FieldTimeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function ConfinedSpaceBoard({ 
  activePermits, selectedPermit, onSelectPermit, entries, onCheckIn, onCheckOut, onEvacuate, currentUser, isMobile, glassPanel 
}: any) {
  
  const [form] = Form.useForm();
  
  // 🟢 เพิ่มฟังก์ชัน: State สำหรับเก็บเวลาปัจจุบัน เพื่อให้ตัวนับเวลาในบ่ออัปเดตแบบ Real-time
  const [currentTime, setCurrentTime] = useState(dayjs());

  // 🟢 เพิ่มฟังก์ชัน: ตั้งเวลาให้อัปเดต currentTime ทุกๆ 1 นาที (60000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleFinish = (values: any) => {
    onCheckIn(values);
    form.resetFields();
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}> 
        <Card title={<b className="text-slate-900">1. เลือกพื้นที่ปฏิบัติงาน</b>} bordered={false} style={glassPanel} className="h-full">
          {activePermits.length === 0 ? <Text type="secondary">ไม่มีงานที่อับอากาศที่กำลังดำเนินการ</Text> : (
            <Menu mode="vertical" selectedKeys={[selectedPermit || '']} className="border-none bg-transparent" onClick={(e) => onSelectPermit(e.key)}>
              {activePermits.map((p: any) => (
                <Menu.Item key={p.id} className={`rounded-xl h-auto p-3 mb-2 border border-slate-200 ${selectedPermit === p.id ? 'bg-blue-50' : 'bg-white'}`}>
                  <Text strong className="text-violet-500">{p.permit_number}</Text><br/>
                  <Text className="text-xs">{p.location_detail}</Text>
                </Menu.Item>
              ))}
            </Menu>
          )}
        </Card>
      </Col>
      <Col xs={24} md={16}> 
        <Card 
          title={
            <div className="flex justify-between items-center flex-wrap gap-2">
              <b className="text-slate-900">2. บอร์ดเช็คชื่อเข้า-ออก</b>
              {selectedPermit && (
                <Popconfirm title="ยืนยันอพยพฉุกเฉิน?" onConfirm={onEvacuate} okText="อพยพทันที" okButtonProps={{danger: true}} cancelText="ยกเลิก">
                  <Button type="primary" danger icon={<AlertOutlined />} size={isMobile ? "small" : "middle"} className="animate-pulse font-bold">อพยพ!</Button>
                </Popconfirm>
              )}
            </div>
          } 
          bordered={false} 
          style={glassPanel} 
          className="min-h-[500px]"
        >
          {selectedPermit ? (
            <>
              <Form form={form} layout={isMobile ? "vertical" : "inline"} onFinish={handleFinish} className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <Form.Item name="worker_name" rules={[{ required: true, message: 'กรอกชื่อ' }]} className={`flex-1 ${isMobile ? 'mb-3' : 'mb-0'}`}>
                  <Input size="large" placeholder="ชื่อผู้ปฏิบัติงาน" prefix={<UserOutlined className="text-slate-400" />} className="rounded-xl" />
                </Form.Item>
                <Form.Item name="role" rules={[{ required: true, message: 'เลือกหน้าที่' }]} className={isMobile ? 'mb-3' : 'mb-0'}>
                  <Select size="large" placeholder="หน้าที่" options={[{value:'ENTRANT', label:'ผู้ปฏิบัติงาน'}, {value:'STANDBY', label:'ผู้เฝ้าระวัง'}]} className={isMobile ? 'w-full' : 'w-[150px]'}/>
                </Form.Item>
                <Form.Item className="mb-0">
                  <Button size="large" type="primary" htmlType="submit" block={isMobile} icon={<LoginOutlined />} className="bg-blue-600 rounded-xl border-none">เข้าพื้นที่</Button>
                </Form.Item>
              </Form>

              <Divider orientation="left"><Text strong className="text-slate-500">สถานะปัจจุบัน (Real-time)</Text></Divider>
              
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card size="small" title={<Space><SafetyCertificateOutlined className="text-blue-500"/> <Text strong className="text-blue-700">ผู้เฝ้าระวัง (Standby)</Text></Space>} styles={{ header: {background: '#eff6ff', borderBottom: '1px solid #bfdbfe'} }} className="border border-blue-200 rounded-xl overflow-hidden">
                    {entries.filter((e: any) => e.status === 'INSIDE' && e.role === 'STANDBY').length === 0 ? <Text type="secondary" italic>⚠️ ไม่มีผู้เฝ้าระวังปากบ่อ</Text> : null}
                    <div className="flex gap-2 flex-wrap">
                      {entries.filter((e: any) => e.status === 'INSIDE' && e.role === 'STANDBY').map((e: any) => (
                        <Tag key={e.id} color="blue" className="p-2 text-sm rounded-lg flex items-center gap-2 border-none bg-blue-100 text-blue-900">
                          <Avatar size="small" icon={<EyeOutlined />} className="bg-blue-500" />
                          <span className="font-semibold">{e.worker_name}</span>
                          <Button size="small" type="text" danger onClick={() => onCheckOut(e.id)} className="ml-1 p-0">ออก</Button>
                        </Tag>
                      ))}
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={12}>
                  <Card size="small" title={<Space><WarningOutlined className="text-red-500"/> <Text strong className="text-red-700">อยู่ในบ่อ (Entrants)</Text> <Badge count={entries.filter((e: any) => e.status === 'INSIDE' && e.role === 'ENTRANT').length} style={{backgroundColor: '#ef4444'}} /></Space>} styles={{ header: {background: '#fef2f2', borderBottom: '1px solid #fecaca'} }} className="border border-red-200 rounded-xl overflow-hidden">
                    {entries.filter((e: any) => e.status === 'INSIDE' && e.role === 'ENTRANT').length === 0 ? <Text type="secondary">ไม่มีคนด้านใน</Text> : null}
                    {entries.filter((e: any) => e.status === 'INSIDE' && e.role === 'ENTRANT').map((e: any) => {
                      // 🟢 อัปเดตให้คำนวณจาก currentTime แทน dayjs() เปล่าๆ เพื่อให้ตัวเลขเดินได้
                      const minsInside = currentTime.diff(dayjs(e.time_in), 'minute');
                      const isWarning = minsInside >= 60; 
                      return (
                        <Card key={e.id} size="small" className={`mb-2 border-l-4 rounded-lg ${isWarning ? 'border-red-500 bg-red-50' : 'border-amber-500 bg-white'}`}>
                          <div className="flex justify-between items-center flex-wrap">
                            <div><Text strong>{e.worker_name}</Text><br/><Text type="secondary" className="text-xs">เข้า: {dayjs(e.time_in).format('HH:mm')}</Text></div>
                            <div className="text-right">
                              <Tag color={isWarning ? 'red' : 'orange'} className="rounded-xl px-2 py-0.5 border-none"><FieldTimeOutlined /> {minsInside} นาที</Tag><br/>
                              <Button size="small" type="primary" onClick={() => onCheckOut(e.id)} className="mt-1 bg-slate-800 border-none rounded-md">ดึงขึ้น</Button>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </Card>
                </Col>

                <Col xs={24} sm={12}>
                  <Card size="small" title={<Space><CheckCircleOutlined className="text-emerald-500"/> <Text strong className="text-emerald-700">ออกแล้ว (Logged Out)</Text></Space>} styles={{ header: {background: '#ecfdf5', borderBottom: '1px solid #a7f3d0'} }} className="border border-emerald-200 rounded-xl overflow-hidden">
                    <div className="max-h-[300px] overflow-y-auto">
                      {entries.filter((e: any) => e.status === 'OUTSIDE').map((e: any) => (
                        <div key={e.id} className="p-2 border-b border-slate-100 flex justify-between">
                          <Text type="secondary" className="text-[13px]">{e.worker_name}</Text>
                          <Text type="secondary" className="text-[11px]">{dayjs(e.time_out).format('HH:mm')}</Text>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              </Row>
            </>
          ) : <div className="text-center mt-[50px]"><Text type="secondary">โปรดเลือก Permit ด้านซ้ายมือเพื่อดูบอร์ด</Text></div>}
        </Card>
      </Col>
    </Row>
  );
}