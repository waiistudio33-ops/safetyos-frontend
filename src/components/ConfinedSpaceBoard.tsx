import React, { useState, useEffect } from 'react';
import { Select, Button, Row, Col, Badge, Avatar, Popconfirm, Empty, Tag, Modal, Form, InputNumber } from 'antd';
import { SafetyOutlined, WarningOutlined, UserOutlined, LoginOutlined, LogoutOutlined, AlertOutlined, ClockCircleOutlined, BuildOutlined, DashboardOutlined, FieldTimeOutlined, CheckCircleOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';

export default function ConfinedSpaceBoard({ activePermits, selectedPermit, onSelectPermit, entries, onCheckIn, onCheckOut, onEvacuate, currentUser, isMobile, glassPanel }: any) {
  
  const [now, setNow] = useState(dayjs());
  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isSubmittingGas, setIsSubmittingGas] = useState(false);
  const [gasForm] = Form.useForm();

  const currentPermitData = activePermits.find((p: any) => p.id === selectedPermit);
  const activeInside = entries.filter((e: any) => e.status === 'INSIDE');
  const allWorkers = currentPermitData?.workers || [];

  const lastGasTest = currentPermitData?.gas_logs?.[0];
  const minutesSinceTest = lastGasTest ? now.diff(dayjs(lastGasTest.recorded_at), 'minute') : 0;
  const isGasTestOverdue = !lastGasTest || minutesSinceTest >= 60; 

  const handleSubmitGasLog = async (values: any) => {
    setIsSubmittingGas(true);
    try {
      const payload = { permit_id: selectedPermit, tester_id: currentUser?.id, o2_level: values.o2, lel_level: values.lel, co_level: values.co, h2s_level: values.h2s, safety_talk_done: true };
      await axios.post(`${API_URL}/gas-logs`, payload);
      setIsGasModalOpen(false);
      setTimeout(() => window.location.reload(), 1000); // Reload data
    } catch (error) { } 
    finally { setIsSubmittingGas(false); }
  };

  return (
    <>
      <div style={glassPanel} className="p-4 md:p-8 min-h-[65vh] flex flex-col relative overflow-hidden confined-space-container">
        <div className="absolute top-[-10%] right-[-5%] w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4 relative z-10">
          <div className="w-full sm:w-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 m-0 flex items-center gap-2 sm:gap-3">
              <div className="bg-purple-100 text-purple-600 p-1.5 sm:p-2 rounded-xl shadow-inner shrink-0"><BuildOutlined /></div>
              <span className="truncate">Confined Space Board</span>
            </h2>
            <p className="text-slate-500 font-medium text-xs md:text-sm mt-1 sm:mt-1.5 mb-0">กระดานควบคุมยอดผู้ปฏิบัติงานในที่อับอากาศ</p>
          </div>

          {activePermits.length > 0 && (
            <div className="w-full sm:w-[300px] shrink-0">
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
          <div className="flex-1 flex items-center justify-center relative z-10 py-12">
            <Empty 
              image={<BuildOutlined style={{ fontSize: 64, color: '#cbd5e1' }} />}
              description={<span className="text-slate-400 font-bold">ไม่มีงานอับอากาศที่กำลังดำเนินการอยู่</span>}
            />
          </div>
        ) : (
          <div className="relative z-10 flex-1 flex flex-col">
            
            {/* 🚨 แบนเนอร์เตือนวัดก๊าซ */}
            {isGasTestOverdue ? (
              <div className="bg-rose-500 text-white p-3 sm:p-4 rounded-2xl mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-lg animate-pulse gap-2 sm:gap-0">
                <div className="flex items-center gap-3">
                  <WarningOutlined className="text-2xl sm:text-3xl shrink-0" />
                  <div>
                    <div className="font-black text-sm sm:text-base">เลยกำหนดเวลาตรวจวัดสภาพอากาศ!</div>
                    <div className="text-[11px] sm:text-xs font-medium mt-0.5 opacity-90">กรุณาอัปเดตผลตรวจก๊าซรอบใหม่ ระบบได้ล็อกการนำคนเข้าพื้นที่แล้ว</div>
                  </div>
                </div>
                <Button type="primary" onClick={() => setIsGasModalOpen(true)} className="bg-white text-rose-600 border-none font-bold rounded-xl w-full sm:w-auto shadow-md shrink-0">
                  อัปเดตผลก๊าซเดี๋ยวนี้
                </Button>
              </div>
            ) : (
              <div className="bg-cyan-50 border border-cyan-200 text-cyan-700 p-3 sm:p-4 rounded-2xl mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-2 sm:gap-0">
                <div className="flex items-center gap-3">
                  <DashboardOutlined className="text-2xl sm:text-3xl shrink-0" />
                  <div>
                    <div className="font-black text-sm sm:text-base">สถานะอากาศปลอดภัย</div>
                    <div className="text-[11px] sm:text-xs font-bold mt-0.5">ตรวจวัดครั้งล่าสุดเมื่อ: {minutesSinceTest} นาทีที่แล้ว (อัปเดตโดย {lastGasTest?.inspector_name})</div>
                  </div>
                </div>
                {currentUser?.role === 'SAFETY_ENGINEER' || currentUser?.role === 'AREA_OWNER' ? (
                  <Button type="primary" onClick={() => setIsGasModalOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 border-none font-bold rounded-xl w-full sm:w-auto shadow-md shrink-0">
                    <DashboardOutlined /> ตรวจก๊าซรอบใหม่
                  </Button>
                ) : null}
              </div>
            )}

            {/* 🎛️ Live Gas Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className={`p-4 rounded-2xl border ${!lastGasTest ? 'bg-slate-50 border-slate-200' : 'bg-white border-blue-200'} shadow-sm text-center flex flex-col items-center justify-center`}>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">O₂ (19.5 - 23.5%)</span>
                <span className={`text-2xl font-black font-mono ${!lastGasTest ? 'text-slate-300' : 'text-blue-600'}`}>{lastGasTest ? `${lastGasTest.o2_level}%` : '--'}</span>
              </div>
              <div className={`p-4 rounded-2xl border ${!lastGasTest ? 'bg-slate-50 border-slate-200' : 'bg-white border-orange-200'} shadow-sm text-center flex flex-col items-center justify-center`}>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">LEL (&lt; 10%)</span>
                <span className={`text-2xl font-black font-mono ${!lastGasTest ? 'text-slate-300' : 'text-orange-500'}`}>{lastGasTest ? `${lastGasTest.lel_level}%` : '--'}</span>
              </div>
              <div className={`p-4 rounded-2xl border ${!lastGasTest ? 'bg-slate-50 border-slate-200' : 'bg-white border-purple-200'} shadow-sm text-center flex flex-col items-center justify-center`}>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">H₂S (&lt; 10 ppm)</span>
                <span className={`text-2xl font-black font-mono ${!lastGasTest ? 'text-slate-300' : 'text-purple-600'}`}>{lastGasTest ? `${lastGasTest.h2s_level} ` : '--'}</span>
              </div>
              <div className={`p-4 rounded-2xl border ${!lastGasTest ? 'bg-slate-50 border-slate-200' : 'bg-white border-rose-200'} shadow-sm text-center flex flex-col items-center justify-center`}>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CO (&lt; 25 ppm)</span>
                <span className={`text-2xl font-black font-mono ${!lastGasTest ? 'text-slate-300' : 'text-rose-500'}`}>{lastGasTest ? `${lastGasTest.co_level} ` : '--'}</span>
              </div>
            </div>

            <Row gutter={[24, 24]}>
              {/* ซ้าย: รอสแตนด์บาย */}
              <Col xs={24} lg={12}>
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-white shadow-sm h-full">
                  <h3 className="font-black text-slate-700 text-base sm:text-lg flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                    <UserOutlined className="text-blue-500" /> รอสแตนด์บายด้านนอก 
                    <Tag color="blue" className="ml-auto rounded-full px-3">{allWorkers.length - activeInside.length} คน</Tag>
                  </h3>
                  
                  <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 pb-4">
                    {allWorkers.length === 0 && <span className="text-slate-400 text-sm font-medium">ไม่มีรายชื่อผู้ปฏิบัติงานในใบอนุญาตนี้</span>}
                    
                    {allWorkers.map((worker: any) => {
                      const isInside = activeInside.find((e: any) => e.worker_name === worker.worker_name);
                      if (isInside) return null; 

                      const isStandby = currentPermitData?.standby_person_name === worker.worker_name;

                      return (
                        <div key={worker.id} className={`border p-3 rounded-2xl flex items-center justify-between transition-colors ${isGasTestOverdue ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                          <div className="flex items-center gap-3">
                            <Avatar icon={<UserOutlined />} className="bg-slate-200 text-slate-500" />
                            <div>
                              <div className={`font-bold ${isGasTestOverdue ? 'text-slate-500' : 'text-slate-700'}`}>{worker.worker_name}</div>
                              {isStandby && <div className="text-[10px] font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md mt-1 inline-block">ผู้เฝ้าระวัง (Standby)</div>}
                            </div>
                          </div>
                          
                          {/* 🚨 ผู้เฝ้าระวังไม่ต้องเข้าท่อ, ถ้าก๊าซหมดอายุ กดเข้าไม่ได้ */}
                          {!isStandby && (
                            <Button 
                              type="primary" 
                              icon={isGasTestOverdue ? <WarningOutlined /> : <LoginOutlined />} 
                              onClick={() => onCheckIn(worker.worker_name, 'ENTRANT')} // 🟢 ใส่ 'ENTRANT' เข้าไปแบบนี้!
                              disabled={isGasTestOverdue}
                              className={`font-bold rounded-xl shadow-sm ${isGasTestOverdue ? '!bg-slate-300 !text-slate-500 border-none' : 'bg-blue-600 hover:bg-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.2)]'}`}
                            >
                              {isGasTestOverdue ? 'รอผลก๊าซ' : 'เข้าพื้นที่'}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Col>

              {/* ขวา: โซนปฏิบัติงาน และ ประวัติการออก */}
              <Col xs={24} lg={12}>
                <div className="flex flex-col gap-4 sm:gap-6 h-full">
                  
                  {/* 👷 โซนคนอยู่ในบ่อ */}
                  <div className="bg-rose-50/50 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-rose-100 shadow-[inset_0_4px_20px_rgba(225,29,72,0.02)] relative overflow-hidden flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 border-b border-rose-200/50 pb-3 gap-3 sm:gap-0 relative z-10">
                      <h3 className="font-black text-rose-700 text-base sm:text-lg flex items-center gap-2 m-0">
                        <WarningOutlined className="animate-pulse" /> กำลังปฏิบัติงานด้านใน
                        <Badge count={activeInside.length} showZero color="#e11d48" className="ml-2" />
                      </h3>
                      
                      {activeInside.length > 0 && (
                        <Popconfirm title="ยืนยันการสั่งอพยพ?" description="กดปุ่มนี้เมื่อเกิดเหตุฉุกเฉินเท่านั้น" onConfirm={onEvacuate} okText="สั่งอพยพ!" okButtonProps={{ danger: true }} cancelText="ยกเลิก">
                          <Button danger type="primary" icon={<AlertOutlined />} className="font-black rounded-xl shadow-[0_4px_12px_rgba(225,29,72,0.3)] animate-bounce w-full sm:w-auto">
                            อพยพฉุกเฉิน
                          </Button>
                        </Popconfirm>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                      {activeInside.length === 0 ? (
                        <div className="text-center py-8 opacity-60">
                          <SafetyOutlined className="text-4xl text-emerald-500 mb-2" />
                          <p className="font-bold text-slate-500 m-0">พื้นที่ปลอดภัย ไม่มีคนอยู่ด้านใน</p>
                        </div>
                      ) : (
                        activeInside.map((e: any) => {
                          const minsInside = now.diff(dayjs(e.time_in), 'minute');
                          const isWarning = minsInside >= 60; 
                          
                          return (
                            <div key={e.id} className={`relative overflow-hidden rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-all ${isWarning ? 'bg-red-50 border-red-300' : 'bg-white border-rose-200'}`}>
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

                              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2 mt-2 sm:mt-0">
                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold border ${isWarning ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                  <FieldTimeOutlined /> {minsInside} นาที
                                </div>
                                <Button onClick={() => onCheckOut(e.id)} icon={<LogoutOutlined />} className="font-bold rounded-lg border-slate-300 text-slate-600 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 text-[11px] sm:text-xs py-1 h-auto w-full sm:w-auto mt-1 sm:mt-0">
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
                  <div className="bg-emerald-50/50 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-emerald-100 shadow-sm flex-1">
                    <div className="flex items-center justify-between mb-4 border-b border-emerald-200/50 pb-3">
                      <h3 className="font-black text-emerald-700 text-base flex items-center gap-2 m-0">
                        <CheckCircleOutlined className="text-emerald-500 text-lg" /> ประวัติการออก (Logged Out)
                      </h3>
                    </div>
                    <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2 pb-2">
                      {entries.filter((e: any) => e.status === 'OUTSIDE').length === 0 ? (
                        <div className="text-center py-4 text-slate-400 font-medium text-sm">ยังไม่มีผู้ปฏิบัติงานออกมา</div>
                      ) : (
                        entries.filter((e: any) => e.status === 'OUTSIDE').map((e: any) => (
                          <div key={e.id} className="bg-white border border-slate-200 rounded-xl p-2.5 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center text-[10px] shrink-0">
                                <LogoutOutlined />
                              </div>
                              <span className="font-bold text-slate-600 text-xs truncate max-w-[120px] sm:max-w-[180px]">{e.worker_name}</span>
                            </div>
                            <div className="text-right leading-tight shrink-0">
                              <div className="text-[9px] text-slate-400 font-medium">เวลาออก</div>
                              <div className="text-[11px] sm:text-xs font-bold text-emerald-600">{dayjs(e.time_out).format('HH:mm')}</div>
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

      {/* 🟢 Modal ตรวจวัดก๊าซ */}
      <Modal title={null} open={isGasModalOpen} onCancel={() => setIsGasModalOpen(false)} footer={null} width={600} centered styles={{ body: { padding: 0 } }} destroyOnClose className="custom-modern-modal">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-8 rounded-t-[2.5rem] text-white shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-20"><DashboardOutlined style={{ fontSize: '120px' }} /></div>
          <h2 className="text-2xl md:text-3xl font-black m-0 flex items-center gap-3 text-white relative z-10 tracking-tight">
            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md shadow-inner"><DashboardOutlined /></div>
            อัปเดตผลก๊าซล่าสุด
          </h2>
          <p className="text-cyan-100 text-sm mt-3 opacity-90 mb-0 relative z-10 font-medium">
            Permit No: <span className="font-mono font-bold bg-black/20 px-3 py-1 rounded-lg tracking-wider ml-1">{currentPermitData?.permit_number}</span>
          </p>
        </div>
        
        <div className="p-6 md:p-8 bg-[#f8fafc] rounded-b-[2.5rem]">
          <Form form={gasForm} layout="vertical" onFinish={handleSubmitGasLog} requiredMark={false} className="anatomy-form">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 mb-8">
              <h4 className="font-black text-slate-800 text-base mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <DashboardOutlined className="text-blue-500 text-xl" /> คีย์ค่ามาตรฐานก๊าซปัจจุบัน
              </h4>
              <div className="grid grid-cols-2 gap-5 md:gap-6">
                <Form.Item name="o2" label={<span className="font-extrabold text-slate-700 text-[13px] mb-1 block">O₂ <span className="text-emerald-500 font-bold text-[10px] ml-1">19.5 - 23.5%</span></span>} rules={[{ required: true, message: 'ระบุค่า O2' }]} className="m-0">
                  <InputNumber size="large" className="w-full text-lg font-mono font-bold text-blue-600 bg-[#f8fafc] border-slate-200 hover:bg-white focus:bg-white rounded-2xl h-14" placeholder="0.0" suffix="%" step={0.1} />
                </Form.Item>
                <Form.Item name="lel" label={<span className="font-extrabold text-slate-700 text-[13px] mb-1 block">LEL <span className="text-emerald-500 font-bold text-[10px] ml-1">&lt; 10%</span></span>} rules={[{ required: true, message: 'ระบุค่า LEL' }]} className="m-0">
                  <InputNumber size="large" className="w-full text-lg font-mono font-bold text-orange-500 bg-[#f8fafc] border-slate-200 hover:bg-white focus:bg-white rounded-2xl h-14" placeholder="0.0" suffix="%" step={0.1} />
                </Form.Item>
                <Form.Item name="h2s" label={<span className="font-extrabold text-slate-700 text-[13px] mb-1 block">H₂S <span className="text-emerald-500 font-bold text-[10px] ml-1">&lt; 10 ppm</span></span>} rules={[{ required: true, message: 'ระบุค่า H2S' }]} className="m-0">
                  <InputNumber size="large" className="w-full text-lg font-mono font-bold text-purple-600 bg-[#f8fafc] border-slate-200 hover:bg-white focus:bg-white rounded-2xl h-14" placeholder="0.0" suffix="ppm" step={0.1} />
                </Form.Item>
                <Form.Item name="co" label={<span className="font-extrabold text-slate-700 text-[13px] mb-1 block">CO <span className="text-emerald-500 font-bold text-[10px] ml-1">&lt; 25 ppm</span></span>} rules={[{ required: true, message: 'ระบุค่า CO' }]} className="m-0">
                  <InputNumber size="large" className="w-full text-lg font-mono font-bold text-rose-500 bg-[#f8fafc] border-slate-200 hover:bg-white focus:bg-white rounded-2xl h-14" placeholder="0.0" suffix="ppm" step={0.1} />
                </Form.Item>
              </div>
            </div>
            <div className="flex gap-4">
              <Button size="large" onClick={() => setIsGasModalOpen(false)} className="flex-1 rounded-2xl h-14 font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-500 border-none transition-transform active:scale-[0.98]">ยกเลิก</Button>
              <Button size="large" type="primary" htmlType="submit" loading={isSubmittingGas} icon={<SaveOutlined />} className="flex-[2] rounded-2xl h-14 font-black bg-cyan-600 hover:bg-cyan-700 border-none shadow-[0_8px_24px_rgba(8,145,178,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]">อัปเดตผลก๊าซ</Button>
            </div>
          </Form>
        </div>
      </Modal>
    </>
  );
}