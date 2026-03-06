import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Input, Select, Popconfirm, Badge, Avatar, Button } from 'antd'; // 🟢 คืนค่า Button กลับมาแล้วครับ
import { 
  AlertOutlined, UserOutlined, LoginOutlined, SafetyCertificateOutlined, 
  EyeOutlined, WarningOutlined, FieldTimeOutlined, CheckCircleOutlined,
  LogoutOutlined, EnvironmentOutlined, BuildOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

export default function ConfinedSpaceBoard({ 
  activePermits, selectedPermit, onSelectPermit, entries, onCheckIn, onCheckOut, onEvacuate, currentUser, isMobile, glassPanel 
}: any) {
  
  const [form] = Form.useForm();
  
  const [currentTime, setCurrentTime] = useState(dayjs());

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
      {/* 🟢 คอลัมน์ซ้าย: เลือกรายการ Permit */}
      <Col xs={24} lg={8}> 
        <Card 
          title={
            <div className="flex items-center gap-2">
              <EnvironmentOutlined className="text-blue-500" />
              <b className="text-slate-800 text-base md:text-lg">เลือกพื้นที่ปฏิบัติงาน</b>
            </div>
          } 
          bordered={false} 
          style={glassPanel} 
          className="h-full shadow-sm rounded-2xl overflow-hidden"
          styles={{ body: { padding: '12px' } }}
        >
          {activePermits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-60">
              <BuildOutlined className="text-4xl text-slate-300 mb-2" />
              <span className="text-slate-500 font-medium">ไม่มีงานที่อับอากาศขณะนี้</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activePermits.map((p: any) => {
                const isSelected = selectedPermit === p.id;
                return (
                  <div 
                    key={p.id} 
                    onClick={() => onSelectPermit(p.id)}
                    className={`
                      relative cursor-pointer rounded-2xl p-4 transition-all duration-300 ease-in-out border-2 active:scale-[0.98]
                      ${isSelected 
                        ? 'bg-blue-50 border-blue-500 shadow-md shadow-blue-500/20' 
                        : 'bg-white border-slate-100 hover:border-blue-300 hover:bg-slate-50 hover:shadow-sm'
                      }
                    `}
                  >
                    {/* จุดสีน้ำเงินกระพริบ แสดงสถานะว่ากำลังดูรายการนี้อยู่ */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </div>
                    )}

                    <div className="flex flex-col gap-1 pr-6">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg flex items-center justify-center ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                          <BuildOutlined className="text-sm" />
                        </div>
                        <span className={`font-mono font-extrabold text-sm md:text-base ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                          {p.permit_number}
                        </span>
                      </div>
                      <div className={`text-xs md:text-sm font-medium leading-relaxed mt-1 line-clamp-2 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>
                        <EnvironmentOutlined className="mr-1 opacity-70" />
                        {p.location_detail}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </Col>

      {/* 🟢 คอลัมน์ขวา: บอร์ดเช็คชื่อ */}
      <Col xs={24} lg={16}> 
        <Card 
          title={
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <SafetyCertificateOutlined className="text-emerald-500 text-xl" />
                <b className="text-slate-800 text-base md:text-lg">บอร์ดควบคุมคนเข้า-ออก (Access Board)</b>
              </div>
              {selectedPermit && (
                <Popconfirm 
                  title={<span className="font-bold text-red-600">ยืนยันการสั่งอพยพฉุกเฉิน?</span>}
                  description="ระบบจะส่งแจ้งเตือนและบันทึกเวลาอพยพทันที"
                  onConfirm={onEvacuate} 
                  okText="ยืนยัน อพยพ!" 
                  okButtonProps={{ danger: true, className: "font-bold rounded-lg" }} 
                  cancelText="ยกเลิก"
                  cancelButtonProps={{ className: "rounded-lg" }}
                >
                  <button className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl font-bold text-xs md:text-sm shadow-lg shadow-red-500/30 animate-pulse transition-colors">
                    <AlertOutlined /> อพยพฉุกเฉิน
                  </button>
                </Popconfirm>
              )}
            </div>
          } 
          bordered={false} 
          style={glassPanel} 
          className="min-h-[500px] shadow-sm rounded-2xl"
          styles={{ body: { padding: isMobile ? '16px' : '24px' } }}
        >
          {selectedPermit ? (
            <>
              {/* ฟอร์มลงทะเบียนเข้าพื้นที่ */}
              <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-200 mb-6">
                <div className="text-slate-700 font-bold mb-3 flex items-center gap-2 text-sm">
                  <LoginOutlined className="text-blue-500" /> ลงทะเบียนเข้าพื้นที่
                </div>
                <Form form={form} layout={isMobile ? "vertical" : "inline"} onFinish={handleFinish} className="flex flex-wrap gap-3">
                  <Form.Item name="worker_name" rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]} className={`m-0 ${isMobile ? 'w-full' : 'flex-1'}`}>
                    <Input size="large" placeholder="ชื่อ-นามสกุล ผู้ปฏิบัติงาน" prefix={<UserOutlined className="text-slate-400 mr-1" />} className="rounded-xl" />
                  </Form.Item>
                  <Form.Item name="role" rules={[{ required: true, message: 'กรุณาเลือกหน้าที่' }]} className={`m-0 ${isMobile ? 'w-full' : 'w-[180px]'}`}>
                    <Select size="large" placeholder="-- เลือกหน้าที่ --" className="w-full">
                      <Select.Option value="ENTRANT">👷 ผู้ปฏิบัติงาน (Entrant)</Select.Option>
                      <Select.Option value="STANDBY">👁️ ผู้เฝ้าระวัง (Standby)</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item className="m-0 w-full md:w-auto mt-2 md:mt-0">
                    <Button size="large" type="primary" htmlType="submit" block={isMobile} className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-md shadow-blue-500/20 border-none h-10 px-6">
                      เพิ่มรายชื่อ
                    </Button>
                  </Form.Item>
                </Form>
              </div>

              {/* เส้นแบ่งสถานะ */}
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">สถานะปัจจุบัน (Real-time)</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>
              
              <Row gutter={[16, 16]}>
                {/* 👁️ โซนผู้เฝ้าระวัง */}
                <Col span={24}>
                  <div className="bg-white border-2 border-blue-200 rounded-2xl overflow-hidden">
                    <div className="bg-blue-50/80 px-4 py-2 border-b border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                        <EyeOutlined className="text-blue-500 text-lg" /> ผู้เฝ้าระวังปากบ่อ (Standby Person)
                      </div>
                    </div>
                    <div className="p-4">
                      {entries.filter((e: any) => e.status === 'INSIDE' && e.role === 'STANDBY').length === 0 ? (
                        <div className="text-center py-2">
                          <span className="text-amber-500 font-bold text-xs bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 flex items-center justify-center gap-1 w-fit mx-auto">
                            <WarningOutlined /> ไม่มีผู้เฝ้าระวัง (ไม่อนุญาตให้เริ่มงาน)
                          </span>
                        </div>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          {entries.filter((e: any) => e.status === 'INSIDE' && e.role === 'STANDBY').map((e: any) => (
                            <div key={e.id} className="bg-white border border-blue-200 shadow-sm rounded-xl pl-1.5 pr-1 py-1 flex items-center gap-2">
                              <Avatar size="small" icon={<UserOutlined />} className="bg-blue-100 text-blue-600" />
                              <span className="font-bold text-slate-700 text-sm pb-0.5">{e.worker_name}</span>
                              <button onClick={() => onCheckOut(e.id)} className="bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ml-1">
                                ลงชื่อออก
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Col>

                {/* 👷 โซนคนอยู่ในบ่อ */}
                <Col xs={24} sm={12}>
                  <div className="bg-white border-2 border-amber-200 rounded-2xl overflow-hidden h-full">
                    <div className="bg-amber-50/80 px-4 py-2 border-b border-amber-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                        <WarningOutlined className="text-amber-500 text-lg" /> กำลังปฏิบัติงาน (Entrants)
                      </div>
                      <Badge count={entries.filter((e: any) => e.status === 'INSIDE' && e.role === 'ENTRANT').length} showZero color="#f59e0b" />
                    </div>
                    <div className="p-3 bg-slate-50/50 min-h-[150px]">
                      {entries.filter((e: any) => e.status === 'INSIDE' && e.role === 'ENTRANT').length === 0 ? (
                        <div className="text-center py-6 text-slate-400 font-medium text-sm">ไม่มีผู้ปฏิบัติงานด้านใน</div>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          {entries.filter((e: any) => e.status === 'INSIDE' && e.role === 'ENTRANT').map((e: any) => {
                            const minsInside = currentTime.diff(dayjs(e.time_in), 'minute');
                            const isWarning = minsInside >= 60; // แจ้งเตือนถ้าอยู่เกิน 1 ชม.
                            
                            return (
                              <div key={e.id} className={`relative overflow-hidden rounded-xl border p-3 flex justify-between items-center shadow-sm transition-all ${isWarning ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'}`}>
                                {/* แถบสีด้านซ้าย */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isWarning ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                                
                                <div className="pl-3">
                                  <div className="font-bold text-slate-800 text-sm leading-tight">{e.worker_name}</div>
                                  <div className="text-[10px] font-semibold text-slate-500 mt-1">
                                    เข้า: <span className="text-slate-700">{dayjs(e.time_in).format('HH:mm')}</span>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${isWarning ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                    <FieldTimeOutlined /> {minsInside} นาที
                                  </div>
                                  <button onClick={() => onCheckOut(e.id)} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors shadow-md mt-0.5">
                                    นำตัวขึ้น (Out)
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </Col>

                {/* ✅ โซนคนออกแล้ว */}
                <Col xs={24} sm={12}>
                  <div className="bg-white border-2 border-emerald-200 rounded-2xl overflow-hidden h-full">
                    <div className="bg-emerald-50/80 px-4 py-2 border-b border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                        <CheckCircleOutlined className="text-emerald-500 text-lg" /> ออกแล้ว (Logged Out)
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50/50 min-h-[150px] max-h-[350px] overflow-y-auto custom-scrollbar">
                      {entries.filter((e: any) => e.status === 'OUTSIDE').length === 0 ? (
                        <div className="text-center py-6 text-slate-400 font-medium text-sm">ยังไม่มีประวัติการออก</div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {entries.filter((e: any) => e.status === 'OUTSIDE').map((e: any) => (
                            <div key={e.id} className="bg-white border border-slate-200 rounded-xl p-2.5 flex justify-between items-center shadow-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center text-[10px]">
                                  <LogoutOutlined />
                                </div>
                                <span className="font-bold text-slate-600 text-[13px]">{e.worker_name}</span>
                              </div>
                              <div className="text-right leading-tight">
                                <div className="text-[10px] text-slate-400 font-medium">เวลาออก</div>
                                <div className="text-xs font-bold text-emerald-600">{dayjs(e.time_out).format('HH:mm')}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </>
          ) : (
            // 🚫 กรณีที่ยังไม่ได้เลือก Permit 
            <div className="flex flex-col items-center justify-center h-[400px] text-center px-4">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                <SafetyCertificateOutlined className="text-3xl text-blue-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 m-0">กรุณาเลือกพื้นที่ปฏิบัติงาน</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-xs">คลิกเลือกรายการ Permit จากเมนูด้านซ้ายมือ เพื่อเปิดบอร์ดควบคุมการเข้า-ออกพื้นที่อับอากาศ</p>
            </div>
          )}
        </Card>
      </Col>
    </Row>
  );
}