import React, { useState, useEffect } from 'react';
import { Select, Button, Row, Col, Badge, Avatar, Popconfirm, Empty, Tag } from 'antd';
import { SafetyOutlined, WarningOutlined, UserOutlined, LoginOutlined, LogoutOutlined, AlertOutlined, ClockCircleOutlined, BuildOutlined, DashboardOutlined, FieldTimeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export default function ConfinedSpaceBoard({ activePermits, selectedPermit, onSelectPermit, entries, onCheckIn, onCheckOut, onEvacuate, currentUser, isMobile, glassPanel }: any) {
  
  // 🟢 1. สร้างนาฬิกาให้กระดานอัปเดตตัวเองทุกๆ 1 นาที
  const [now, setNow] = useState(dayjs());
  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentPermitData = activePermits.find((p: any) => p.id === selectedPermit);
  const activeInside = entries.filter((e: any) => e.status === 'INSIDE');
  const allWorkers = currentPermitData?.workers || [];

  // 🟢 2. คำนวณเวลาการวัดก๊าซล่าสุด
  const lastGasTest = currentPermitData?.gas_logs?.[0];
  const minutesSinceTest = lastGasTest ? now.diff(dayjs(lastGasTest.recorded_at), 'minute') : 0;
  const isGasTestOverdue = !lastGasTest || minutesSinceTest >= 60; // 🚨 ถ้าเกิน 60 นาที = ต้องวัดใหม่!

  return (
    <div style={glassPanel} className="p-4 md:p-8 min-h-[65vh] flex flex-col relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute top-[-10%] right-[-5%] w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4 relative z-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 m-0 flex items-center gap-3">
            <div className="bg-purple-100 text-purple-600 p-2 rounded-xl shadow-inner"><BuildOutlined /></div>
            Confined Space Board
          </h2>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-1 mb-0">กระดานควบคุมยอดผู้ปฏิบัติงานในที่อับอากาศ</p>
        </div>

        {activePermits.length > 0 && (
          <div className="w-full sm:w-[300px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">เลือกใบอนุญาต (Active Permits)</span>
            <Select
              size="large"
              className="w-full font-bold shadow-sm"
              value={selectedPermit}
              onChange={onSelectPermit}
              options={activePermits.map((p: any) => ({
                label: `${p.permit_number} - ${p.location_detail}`,
                value: p.id
              }))}
            />
          </div>
        )}
      </div>

      {!selectedPermit || activePermits.length === 0 ? (
        <div className="flex-1 flex items-center justify-center relative z-10">
          <Empty 
            image={<BuildOutlined style={{ fontSize: 64, color: '#cbd5e1' }} />}
            description={<span className="text-slate-400 font-bold">ไม่มีงานอับอากาศที่กำลังดำเนินการอยู่</span>}
          />
        </div>
      ) : (
        <div className="relative z-10">
          
          {/* 🚨 3. แบนเนอร์เตือนวัดก๊าซ (Periodic Test Alert) */}
          {isGasTestOverdue ? (
            <div className="bg-rose-500 text-white p-4 rounded-2xl mb-6 flex items-center justify-between shadow-lg animate-pulse">
              <div className="flex items-center gap-3">
                <WarningOutlined className="text-3xl" />
                <div>
                  <div className="font-black text-base">เลยกำหนดเวลาตรวจวัดสภาพอากาศ!</div>
                  <div className="text-xs font-medium mt-0.5">กรุณาทำการตรวจก๊าซ (Periodic Test) ที่หน้า E-Permit ทันที ระบบได้ล็อกการนำคนเข้าพื้นที่แล้ว</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-cyan-50 border border-cyan-200 text-cyan-700 p-3 rounded-2xl mb-6 flex items-center gap-3 shadow-sm">
              <DashboardOutlined className="text-2xl" />
              <div>
                <div className="font-black text-sm">สถานะอากาศปลอดภัย</div>
                <div className="text-xs font-bold mt-0.5">ตรวจวัดครั้งล่าสุดเมื่อ: {minutesSinceTest} นาทีที่แล้ว (อัปเดตโดย {lastGasTest?.inspector_name})</div>
              </div>
            </div>
          )}

          <Row gutter={[24, 24]}>
            {/* ซ้าย: รอสแตนด์บาย */}
            <Col xs={24} lg={12}>
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-white shadow-sm h-full">
                <h3 className="font-black text-slate-700 text-lg flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                  <UserOutlined className="text-blue-500" /> รอสแตนด์บายด้านนอก 
                  <Tag color="blue" className="ml-auto rounded-full px-3">{allWorkers.length - activeInside.length} คน</Tag>
                </h3>
                
                <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                  {allWorkers.length === 0 && <span className="text-slate-400 text-sm font-medium">ไม่มีรายชื่อผู้ปฏิบัติงานในใบอนุญาตนี้</span>}
                  
                  {allWorkers.map((worker: any) => {
                    const isInside = activeInside.find((e: any) => e.worker_name === worker.worker_name);
                    if (isInside) return null; 

                    return (
                      <div key={worker.id} className={`border p-3 rounded-2xl flex items-center justify-between transition-colors ${isGasTestOverdue ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                        <div className="flex items-center gap-3">
                          <Avatar icon={<UserOutlined />} className="bg-slate-200 text-slate-500" />
                          <span className={`font-bold ${isGasTestOverdue ? 'text-slate-500' : 'text-slate-700'}`}>{worker.worker_name}</span>
                        </div>
                        
                        {/* 🚨 ล็อกปุ่มถ้าวัดก๊าซหมดอายุ! */}
                        <Button 
                          type="primary" 
                          icon={isGasTestOverdue ? <WarningOutlined /> : <LoginOutlined />} 
                          onClick={() => onCheckIn(worker.worker_name)}
                          disabled={isGasTestOverdue}
                          className={`font-bold rounded-xl shadow-sm ${isGasTestOverdue ? '!bg-slate-300 !text-slate-500 border-none' : 'bg-blue-600 hover:bg-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.2)]'}`}
                        >
                          {isGasTestOverdue ? 'รอผลก๊าซ' : 'เข้าพื้นที่'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Col>

            {/* ขวา: โซนปฏิบัติงาน และ ประวัติการออก */}
            <Col xs={24} lg={12}>
              <div className="flex flex-col gap-6 h-full">
                
                {/* 👷 โซนคนอยู่ในบ่อ */}
                <div className="bg-rose-50/50 backdrop-blur-md rounded-3xl p-5 border border-rose-100 shadow-[inset_0_4px_20px_rgba(225,29,72,0.02)] relative overflow-hidden flex-1">
                  <div className="flex justify-between items-center mb-4 border-b border-rose-200/50 pb-3 relative z-10">
                    <h3 className="font-black text-rose-700 text-lg flex items-center gap-2 m-0">
                      <WarningOutlined className="animate-pulse" /> กำลังปฏิบัติงานด้านใน
                      <Badge count={activeInside.length} showZero color="#e11d48" className="ml-2" />
                    </h3>
                    
                    {activeInside.length > 0 && (
                      <Popconfirm title="ยืนยันการสั่งอพยพ?" description="กดปุ่มนี้เมื่อเกิดเหตุฉุกเฉินเท่านั้น ระบบจะบันทึกว่าทุกคนออกมาแล้ว" onConfirm={onEvacuate} okText="สั่งอพยพ!" okButtonProps={{ danger: true }} cancelText="ยกเลิก">
                        <Button danger type="primary" icon={<AlertOutlined />} className="font-black rounded-xl shadow-[0_4px_12px_rgba(225,29,72,0.3)] animate-bounce">
                          อพยพฉุกเฉิน
                        </Button>
                      </Popconfirm>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 max-h-[35vh] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                    {activeInside.length === 0 ? (
                      <div className="text-center py-8 opacity-60">
                        <SafetyOutlined className="text-4xl text-emerald-500 mb-2" />
                        <p className="font-bold text-slate-500 m-0">พื้นที่ปลอดภัย ไม่มีคนอยู่ด้านใน</p>
                      </div>
                    ) : (
                      activeInside.map((e: any) => {
                        const minsInside = now.diff(dayjs(e.time_in), 'minute');
                        const isWarning = minsInside >= 60; // แจ้งเตือนถ้าคนคนนี้แช่เกิน 1 ชม.
                        
                        return (
                          <div key={e.id} className={`relative overflow-hidden rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-all ${isWarning ? 'bg-red-50 border-red-300' : 'bg-white border-rose-200'}`}>
                            {/* แถบสีด้านซ้าย */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isWarning ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                            
                            <div className="flex items-center gap-3 pl-2">
                              <Avatar icon={<UserOutlined />} className="bg-rose-100 text-rose-600 border border-rose-200" />
                              <div>
                                <div className="font-black text-slate-800 text-sm leading-tight">{e.worker_name}</div>
                                <div className="text-[10px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                                  <ClockCircleOutlined /> เข้าเมื่อ: {dayjs(e.time_in).format('HH:mm')}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2">
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${isWarning ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                <FieldTimeOutlined /> {minsInside} นาที
                              </div>
                              <Button 
                                onClick={() => onCheckOut(e.id)}
                                icon={<LogoutOutlined />} 
                                className="font-bold rounded-lg border-slate-300 text-slate-600 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 text-xs py-1 h-auto"
                              >
                                นำตัวออก (Check-out)
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* ✅ โซนคนออกแล้ว */}
                <div className="bg-emerald-50/50 backdrop-blur-md rounded-3xl p-5 border border-emerald-100 shadow-sm flex-1">
                  <div className="flex items-center justify-between mb-4 border-b border-emerald-200/50 pb-3">
                    <h3 className="font-black text-emerald-700 text-base flex items-center gap-2 m-0">
                      <CheckCircleOutlined className="text-emerald-500 text-lg" /> ประวัติการออก (Logged Out)
                    </h3>
                  </div>
                  <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                    {entries.filter((e: any) => e.status === 'OUTSIDE').length === 0 ? (
                      <div className="text-center py-4 text-slate-400 font-medium text-sm">ยังไม่มีผู้ปฏิบัติงานออกมา</div>
                    ) : (
                      entries.filter((e: any) => e.status === 'OUTSIDE').map((e: any) => (
                        <div key={e.id} className="bg-white border border-slate-200 rounded-xl p-2.5 flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center text-[10px]">
                              <LogoutOutlined />
                            </div>
                            <span className="font-bold text-slate-600 text-xs">{e.worker_name}</span>
                          </div>
                          <div className="text-right leading-tight">
                            <div className="text-[9px] text-slate-400 font-medium">เวลาออก</div>
                            <div className="text-xs font-bold text-emerald-600">{dayjs(e.time_out).format('HH:mm')}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
}