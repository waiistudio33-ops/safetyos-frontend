import React, { useState, useEffect } from 'react';
import { Select, Button, Row, Col, Badge, Avatar, Popconfirm, Empty, Tag, Modal, Form, InputNumber, message } from 'antd';
import { SafetyOutlined, WarningOutlined, UserOutlined, LoginOutlined, LogoutOutlined, AlertOutlined, ClockCircleOutlined, BuildOutlined, DashboardOutlined, FieldTimeOutlined, CheckCircleOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';

export default function ConfinedSpaceBoard({ activePermits, selectedPermit, onSelectPermit, entries, onCheckIn, onCheckOut, onEvacuate, currentUser, isMobile, glassPanel, onRefresh }: any) {
  
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
      message.success('อัปเดตผลตรวจสภาพอากาศเรียบร้อย!');
      if (onRefresh) onRefresh();
    } catch (error) { 
      message.error('ไม่สามารถอัปเดตผลก๊าซได้');
    } 
    finally { setIsSubmittingGas(false); }
  };

  return (
    <>
      <div style={glassPanel} className="p-3 sm:p-4 md:p-8 min-h-[65vh] flex flex-col relative overflow-hidden confined-space-container">
        <div className="absolute top-[-10%] right-[-5%] w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none hidden md:block"></div>

        {/* 🟢 Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 md:mb-8 gap-4 relative z-10 w-full">
          <div className="w-full sm:w-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 m-0 flex items-center gap-2 sm:gap-3">
              <div className="bg-purple-100 text-purple-600 p-1.5 sm:p-2 rounded-xl shadow-inner shrink-0"><BuildOutlined /></div>
              <span className="truncate">Confined Space Board</span>
            </h2>
            <p className="text-slate-500 font-medium text-[10px] md:text-sm mt-1 sm:mt-1.5 mb-0">กระดานควบคุมยอดผู้ปฏิบัติงานในที่อับอากาศ</p>
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
              description={<span className="text-slate-400 font-bold text-sm">ไม่มีงานอับอากาศที่กำลังดำเนินการอยู่</span>}
            />
          </div>
        ) : (
          <div className="relative z-10 flex-1 flex flex-col w-full h-full">
            
            {/* 🟢 Gas Alert Status */}
            {isGasTestOverdue ? (
              <div className="bg-rose-500 text-white p-3 sm:p-4 rounded-2xl mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-lg animate-pulse gap-3 sm:gap-0 w-full">
                <div className="flex items-center gap-2 sm:gap-3 w-full">
                  <WarningOutlined className="text-2xl sm:text-3xl shrink-0" />
                  <div className="flex-1">
                    <div className="font-black text-[13px] sm:text-base leading-tight">เลยกำหนดเวลาตรวจวัดสภาพอากาศ!</div>
                    <div className="text-[9px] sm:text-xs font-medium mt-0.5 opacity-90 leading-tight">กรุณาอัปเดตผลตรวจก๊าซรอบใหม่ ระบบได้ล็อกการนำคนเข้าพื้นที่แล้ว</div>
                  </div>
                </div>
                <Button type="primary" onClick={() => setIsGasModalOpen(true)} className="bg-white text-rose-600 border-none font-bold rounded-xl w-full sm:w-auto shadow-md shrink-0 h-10">
                  อัปเดตผลก๊าซเดี๋ยวนี้
                </Button>
              </div>
            ) : (
              <div className="bg-cyan-50 border border-cyan-200 text-cyan-700 p-3 sm:p-4 rounded-2xl mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-3 sm:gap-0 w-full">
                <div className="flex items-center gap-2 sm:gap-3 w-full">
                  <DashboardOutlined className="text-2xl sm:text-3xl shrink-0" />
                  <div className="flex-1">
                    <div className="font-black text-[13px] sm:text-base leading-tight">สถานะอากาศปลอดภัย</div>
                    <div className="text-[9px] sm:text-xs font-bold mt-0.5 leading-tight">ตรวจวัดครั้งล่าสุดเมื่อ: {minutesSinceTest} นาทีที่แล้ว (โดย {lastGasTest?.inspector_name})</div>
                  </div>
                </div>
                {(currentUser?.role === 'SAFETY_ENGINEER' || currentUser?.role === 'AREA_OWNER') && (
                  <Button type="primary" onClick={() => setIsGasModalOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 border-none font-bold rounded-xl w-full sm:w-auto shadow-md shrink-0 h-10">
                    <DashboardOutlined /> ตรวจก๊าซรอบใหม่
                  </Button>
                )}
              </div>
            )}

            {/* 🟢 Gas Values Grid */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6 w-full">
              <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl border ${!lastGasTest ? 'bg-slate-50 border-slate-200' : 'bg-white border-blue-200'} shadow-sm text-center flex flex-col items-center justify-center`}>
                <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">O₂</span>
                <span className={`text-sm sm:text-2xl font-black font-mono leading-none ${!lastGasTest ? 'text-slate-300' : 'text-blue-600'}`}>{lastGasTest ? `${lastGasTest.o2_level}%` : '--'}</span>
              </div>
              <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl border ${!lastGasTest ? 'bg-slate-50 border-slate-200' : 'bg-white border-orange-200'} shadow-sm text-center flex flex-col items-center justify-center`}>
                <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">LEL</span>
                <span className={`text-sm sm:text-2xl font-black font-mono leading-none ${!lastGasTest ? 'text-slate-300' : 'text-orange-500'}`}>{lastGasTest ? `${lastGasTest.lel_level}%` : '--'}</span>
              </div>
              <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl border ${!lastGasTest ? 'bg-slate-50 border-slate-200' : 'bg-white border-purple-200'} shadow-sm text-center flex flex-col items-center justify-center`}>
                <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">H₂S</span>
                <span className={`text-sm sm:text-2xl font-black font-mono leading-none ${!lastGasTest ? 'text-slate-300' : 'text-purple-600'}`}>{lastGasTest ? `${lastGasTest.h2s_level}` : '--'}</span>
              </div>
              <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl border ${!lastGasTest ? 'bg-slate-50 border-slate-200' : 'bg-white border-rose-200'} shadow-sm text-center flex flex-col items-center justify-center`}>
                <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">CO</span>
                <span className={`text-sm sm:text-2xl font-black font-mono leading-none ${!lastGasTest ? 'text-slate-300' : 'text-rose-500'}`}>{lastGasTest ? `${lastGasTest.co_level}` : '--'}</span>
              </div>
            </div>

            {/* 🟢 Board Content */}
            <Row gutter={[16, 16]} className="w-full m-0 flex-1 flex flex-col lg:flex-row pb-4">
              
              {/* 🟢 ซ้าย: รอสแตนด์บายด้านนอก */}
              <Col xs={24} lg={12} className="h-full px-0 lg:pr-2 mb-2 lg:mb-0 flex">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-white shadow-sm flex-1 flex flex-col w-full h-full max-h-[400px] lg:max-h-full">
                  <h3 className="font-black text-slate-700 text-sm sm:text-lg flex items-center gap-2 mb-3 sm:mb-4 border-b border-slate-100 pb-2 sm:pb-3 shrink-0">
                    <UserOutlined className="text-blue-500" /> รอสแตนด์บายด้านนอก 
                    <Tag color="blue" className="ml-auto rounded-full px-2 sm:px-3 text-[10px] sm:text-xs">{allWorkers.length - activeInside.length} คน</Tag>
                  </h3>
                  
                  {/* 🟢 แก้บั๊กเลื่อนไม่ได้: ใช้ flex-1 และ overflow-y-auto ให้พอดีกล่อง */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 sm:pr-2 flex flex-col gap-2 sm:gap-3 touch-pan-y">
                    {allWorkers.length === 0 && <span className="text-slate-400 text-xs sm:text-sm font-medium p-2">ไม่มีรายชื่อผู้ปฏิบัติงานในใบอนุญาตนี้</span>}
                    
                    {allWorkers.map((worker: any) => {
                      const isInside = activeInside.find((e: any) => e.worker_name === worker.worker_name);
                      if (isInside) return null; 

                      const isStandby = currentPermitData?.standby_person_name === worker.worker_name;

                      return (
                        <div key={worker.id} className={`border p-2 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-between transition-colors shrink-0 ${isGasTestOverdue ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden flex-1 mr-2">
                            <Avatar icon={<UserOutlined />} size={isMobile ? "small" : "default"} className="bg-slate-200 text-slate-500 shrink-0" />
                            <div className="overflow-hidden">
                              <div className={`font-bold text-[11px] sm:text-sm truncate ${isGasTestOverdue ? 'text-slate-500' : 'text-slate-700'}`}>{worker.worker_name}</div>
                              {isStandby && <div className="text-[9px] sm:text-[10px] font-black text-purple-600 bg-purple-100 px-1.5 sm:px-2 py-0.5 rounded-md mt-0.5 sm:mt-1 inline-block">ผู้เฝ้าระวัง</div>}
                            </div>
                          </div>
                          
                          {!isStandby && (
                            <Button 
                              type="primary" 
                              icon={isGasTestOverdue ? <WarningOutlined /> : <LoginOutlined />} 
                              onClick={() => onCheckIn(worker.worker_name, 'ENTRANT')}
                              disabled={isGasTestOverdue}
                              size={isMobile ? "small" : "middle"}
                              className={`font-bold rounded-lg sm:rounded-xl shadow-sm shrink-0 text-[10px] sm:text-xs ${isGasTestOverdue ? '!bg-slate-300 !text-slate-500 border-none' : 'bg-blue-600 hover:bg-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.2)]'}`}
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

              {/* 🟢 ขวา: กำลังปฏิบัติงานด้านใน & ประวัติ */}
              <Col xs={24} lg={12} className="h-full px-0 lg:pl-2 flex flex-col gap-2 sm:gap-4">
                
                {/* กล่องกำลังปฏิบัติงาน */}
                <div className="bg-rose-50/50 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-rose-100 shadow-[inset_0_4px_20px_rgba(225,29,72,0.02)] relative overflow-hidden flex flex-col max-h-[400px] lg:max-h-full">
                  <div className="flex justify-between items-center mb-3 sm:mb-4 border-b border-rose-200/50 pb-2 sm:pb-3 relative z-10 shrink-0">
                    <h3 className="font-black text-rose-700 text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2 m-0">
                      <WarningOutlined className="animate-pulse" /> คนด้านใน
                      <Badge count={activeInside.length} showZero color="#e11d48" className="ml-1 sm:ml-2" />
                    </h3>
                    
                    {activeInside.length > 0 && (
                      <Popconfirm title="ยืนยันการสั่งอพยพ?" description="กดเมื่อฉุกเฉินเท่านั้น" onConfirm={onEvacuate} okText="อพยพ!" okButtonProps={{ danger: true }} cancelText="ยกเลิก" placement="bottomRight">
                        <Button danger type="primary" icon={<AlertOutlined />} size={isMobile ? "small" : "middle"} className="font-black rounded-lg sm:rounded-xl shadow-[0_4px_12px_rgba(225,29,72,0.3)] animate-bounce text-[10px] sm:text-xs">
                          {isMobile ? 'อพยพ' : 'อพยพฉุกเฉิน'}
                        </Button>
                      </Popconfirm>
                    )}
                  </div>

                  {/* 🟢 แก้บั๊กเลื่อนไม่ได้: ใส่ flex-1 และ overflow-y-auto */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 sm:pr-2 flex flex-col gap-2 sm:gap-3 touch-pan-y relative z-10">
                    {activeInside.length === 0 ? (
                      <div className="text-center py-6 sm:py-8 opacity-60">
                        <SafetyOutlined className="text-3xl sm:text-4xl text-emerald-500 mb-2" />
                        <p className="font-bold text-slate-500 text-xs sm:text-sm m-0">ปลอดภัย ไม่มีคนอยู่ด้านใน</p>
                      </div>
                    ) : (
                      activeInside.map((e: any) => {
                        const minsInside = now.diff(dayjs(e.time_in), 'minute');
                        const isWarning = minsInside >= 60; 
                        
                        return (
                          <div key={e.id} className={`relative overflow-hidden rounded-xl sm:rounded-2xl border p-2 sm:p-3 flex flex-row items-center justify-between gap-2 sm:gap-3 shadow-sm transition-all shrink-0 ${isWarning ? 'bg-red-50 border-red-300' : 'bg-white border-rose-200'}`}>
                            <div className={`absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 ${isWarning ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                            
                            <div className="flex items-center gap-2 sm:gap-3 pl-1.5 sm:pl-2 overflow-hidden flex-1">
                              <Avatar icon={<UserOutlined />} size={isMobile ? "small" : "default"} className="bg-rose-100 text-rose-600 border border-rose-200 shrink-0" />
                              <div className="overflow-hidden">
                                <div className="font-black text-slate-800 text-[11px] sm:text-sm leading-tight truncate">{e.worker_name}</div>
                                <div className="text-[9px] sm:text-[10px] font-bold text-rose-500 flex items-center gap-1 mt-0.5 truncate">
                                  <ClockCircleOutlined /> เข้า: {dayjs(e.time_in).format('HH:mm')} น.
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[11px] font-bold border ${isWarning ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                <FieldTimeOutlined /> {minsInside} นาที
                              </div>
                              <Button onClick={() => onCheckOut(e.id)} icon={<LogoutOutlined />} size={isMobile ? "small" : "middle"} className="font-bold rounded-md sm:rounded-lg border-slate-300 text-slate-600 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 text-[10px] sm:text-xs h-auto py-0.5 sm:py-1">
                                {isMobile ? 'นำออก' : 'นำตัวออก'}
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* กล่องประวัติคนออกแล้ว */}
                <div className="bg-emerald-50/50 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-emerald-100 shadow-sm flex flex-col h-[200px] sm:h-auto sm:flex-1 shrink-0">
                  <div className="flex items-center justify-between mb-2 sm:mb-4 border-b border-emerald-200/50 pb-2 sm:pb-3 shrink-0">
                    <h3 className="font-black text-emerald-700 text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 m-0">
                      <CheckCircleOutlined className="text-emerald-500 text-base sm:text-lg" /> ประวัติเข้า-ออก
                    </h3>
                  </div>
                  
                  {/* 🟢 แก้บั๊กเลื่อนไม่ได้: ใส่ flex-1 และ overflow-y-auto */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 sm:pr-2 flex flex-col gap-2 touch-pan-y">
                    {entries.filter((e: any) => e.status === 'OUTSIDE').length === 0 ? (
                      <div className="text-center py-4 text-slate-400 font-medium text-[11px] sm:text-sm">ยังไม่มีคนออกมา</div>
                    ) : (
                      entries.filter((e: any) => e.status === 'OUTSIDE').map((e: any) => {
                        const totalMins = dayjs(e.time_out).diff(dayjs(e.time_in), 'minute');
                        
                        return (
                          <div key={e.id} className="bg-white border border-slate-200 rounded-xl p-2 sm:p-3 flex flex-row justify-between items-center shadow-sm gap-2 shrink-0">
                            <div className="flex items-center gap-2 sm:gap-3 overflow-hidden flex-1">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center text-[10px] sm:text-xs shrink-0 border border-emerald-200">
                                <LogoutOutlined />
                              </div>
                              <div className="flex flex-col overflow-hidden w-full">
                                <span className="font-bold text-slate-700 text-[11px] sm:text-sm truncate w-full">{e.worker_name}</span>
                                <div className="flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                                  <span className="text-blue-500">เข้า {dayjs(e.time_in).format('HH:mm')}</span> 
                                  <span className="text-slate-300 mx-0.5">|</span> 
                                  <span className="text-emerald-500">ออก {dayjs(e.time_out).format('HH:mm')}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right leading-tight bg-slate-50 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-100 shrink-0">
                              <div className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wide">เวลารวม</div>
                              <div className="text-[10px] sm:text-xs font-black text-slate-600">{totalMins} นาที</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </Col>
            </Row>
          </div>
        )}
      </div>

      {/* 🟢 CSS พิเศษสำหรับมือถือ ให้ Scroll ลื่นขึ้น */}
      <style>{`
        .confined-space-container {
          /* ทำให้ Layout เป็น Column ในมือถือ */
          display: flex;
          flex-direction: column;
        }
        
        @media (max-width: 768px) {
          .confined-space-container {
             /* ปลดล็อกให้ Container แม่สามารถไถลงมาได้ */
             height: auto !important;
             min-height: auto !important;
          }
        }
        
        /* ปรับแต่ง Scrollbar ให้เล็กและสวยงาม */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.15);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.25);
        }
        /* บังคับให้ touch screen ลื่นขึ้น */
        .touch-pan-y {
          touch-action: pan-y;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>

      {/* Modal ตรวจวัดก๊าซ */}
      <Modal title={null} open={isGasModalOpen} onCancel={() => setIsGasModalOpen(false)} footer={null} width={600} centered styles={{ body: { padding: 0 } }} destroyOnClose className="custom-modern-modal">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 md:p-8 rounded-t-[2rem] md:rounded-t-[2.5rem] text-white shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-20"><DashboardOutlined style={{ fontSize: '120px' }} /></div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black m-0 flex items-center gap-2 sm:gap-3 text-white relative z-10 tracking-tight">
            <div className="bg-white/20 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-inner"><DashboardOutlined /></div>
            อัปเดตผลก๊าซ
          </h2>
          <p className="text-cyan-100 text-[11px] sm:text-sm mt-2 sm:mt-3 opacity-90 mb-0 relative z-10 font-medium">
            Permit No: <span className="font-mono font-bold bg-black/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg tracking-wider ml-1">{currentPermitData?.permit_number}</span>
          </p>
        </div>
        
        <div className="p-4 sm:p-6 md:p-8 bg-[#f8fafc] rounded-b-[2rem] md:rounded-b-[2.5rem]">
          <Form form={gasForm} layout="vertical" onFinish={handleSubmitGasLog} requiredMark={false} className="anatomy-form">
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 mb-4 sm:mb-8">
              <h4 className="font-black text-slate-800 text-sm sm:text-base mb-4 sm:mb-6 flex items-center gap-2 border-b border-slate-100 pb-2 sm:pb-3">
                <DashboardOutlined className="text-blue-500 text-lg sm:text-xl" /> คีย์ค่ามาตรฐานก๊าซปัจจุบัน
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:gap-6">
                <Form.Item name="o2" label={<span className="font-extrabold text-slate-700 text-[11px] sm:text-[13px] mb-0.5 sm:mb-1 block">O₂ <span className="text-emerald-500 font-bold text-[9px] sm:text-[10px] ml-1">19.5-23.5%</span></span>} rules={[{ required: true, message: 'ระบุค่า O2' }]} className="m-0">
                  <InputNumber size="large" className="w-full text-base sm:text-lg font-mono font-bold text-blue-600 bg-[#f8fafc] border-slate-200 hover:bg-white focus:bg-white rounded-xl sm:rounded-2xl h-10 sm:h-14" placeholder="0.0" suffix="%" step={0.1} />
                </Form.Item>
                <Form.Item name="lel" label={<span className="font-extrabold text-slate-700 text-[11px] sm:text-[13px] mb-0.5 sm:mb-1 block">LEL <span className="text-emerald-500 font-bold text-[9px] sm:text-[10px] ml-1">&lt; 10%</span></span>} rules={[{ required: true, message: 'ระบุค่า LEL' }]} className="m-0">
                  <InputNumber size="large" className="w-full text-base sm:text-lg font-mono font-bold text-orange-500 bg-[#f8fafc] border-slate-200 hover:bg-white focus:bg-white rounded-xl sm:rounded-2xl h-10 sm:h-14" placeholder="0.0" suffix="%" step={0.1} />
                </Form.Item>
                <Form.Item name="h2s" label={<span className="font-extrabold text-slate-700 text-[11px] sm:text-[13px] mb-0.5 sm:mb-1 block">H₂S <span className="text-emerald-500 font-bold text-[9px] sm:text-[10px] ml-1">&lt; 10 ppm</span></span>} rules={[{ required: true, message: 'ระบุค่า H2S' }]} className="m-0">
                  <InputNumber size="large" className="w-full text-base sm:text-lg font-mono font-bold text-purple-600 bg-[#f8fafc] border-slate-200 hover:bg-white focus:bg-white rounded-xl sm:rounded-2xl h-10 sm:h-14" placeholder="0.0" suffix="ppm" step={0.1} />
                </Form.Item>
                <Form.Item name="co" label={<span className="font-extrabold text-slate-700 text-[11px] sm:text-[13px] mb-0.5 sm:mb-1 block">CO <span className="text-emerald-500 font-bold text-[9px] sm:text-[10px] ml-1">&lt; 25 ppm</span></span>} rules={[{ required: true, message: 'ระบุค่า CO' }]} className="m-0">
                  <InputNumber size="large" className="w-full text-base sm:text-lg font-mono font-bold text-rose-500 bg-[#f8fafc] border-slate-200 hover:bg-white focus:bg-white rounded-xl sm:rounded-2xl h-10 sm:h-14" placeholder="0.0" suffix="ppm" step={0.1} />
                </Form.Item>
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <Button size={isMobile ? "middle" : "large"} onClick={() => setIsGasModalOpen(false)} className="flex-1 rounded-xl sm:rounded-2xl h-10 sm:h-14 font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-500 border-none transition-transform active:scale-[0.98] text-[11px] sm:text-sm">ยกเลิก</Button>
              <Button size={isMobile ? "middle" : "large"} type="primary" htmlType="submit" loading={isSubmittingGas} icon={<SaveOutlined />} className="flex-[2] rounded-xl sm:rounded-2xl h-10 sm:h-14 font-black bg-cyan-600 hover:bg-cyan-700 border-none shadow-[0_8px_24px_rgba(8,145,178,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98] text-[11px] sm:text-sm">อัปเดตผลก๊าซ</Button>
            </div>
          </Form>
        </div>
      </Modal>
    </>
  );
}