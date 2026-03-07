import React, { useState } from 'react';
import { Table, Avatar, Popconfirm, Modal, Form, InputNumber, Checkbox, message, Button } from 'antd';
import { 
  FileTextOutlined, EnvironmentOutlined, UserOutlined, 
  EyeOutlined, CheckOutlined, CloseOutlined, CheckCircleOutlined, 
  FireOutlined, BuildOutlined, ThunderboltOutlined, ToolOutlined,
  StopOutlined, LockOutlined, ClockCircleOutlined, DashboardOutlined,
  NotificationOutlined, SaveOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import dayjs from 'dayjs';

export default function WorkPermitQueue({ permits, loading, currentUser, onPreviewFile, onViewDetails, onUpdateStatus }: any) {
  
  // 🟢 State สำหรับควบคุม Modal บันทึกค่าก๊าซ (Phase 3)
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [selectedGasPermit, setSelectedGasPermit] = useState<any>(null);
  const [isSubmittingGas, setIsSubmittingGas] = useState(false);
  const [gasForm] = Form.useForm();

  // ✨ Badge สถานะ
  const getStatusDisplayModern = (status: string) => { 
    switch(status) { 
      case 'PENDING_AREA_OWNER': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>รอเจ้าของพื้นที่</span>; 
      case 'PENDING_SAFETY': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>รอ จป. อนุมัติ</span>; 
      case 'APPROVED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 whitespace-nowrap"><CheckCircleOutlined className="animate-pulse" /> กำลังปฏิบัติงาน</span>; 
      case 'REJECTED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 whitespace-nowrap"><CloseOutlined /> ไม่อนุมัติ</span>; 
      case 'CLOSED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20 whitespace-nowrap"><LockOutlined /> ปิดงาน/คืนพื้นที่แล้ว</span>; 
      case 'REVOKED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-sm whitespace-nowrap"><StopOutlined /> ถูกระงับงานฉุกเฉิน</span>; 
      case 'EXPIRED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20 whitespace-nowrap"><ClockCircleOutlined /> ใบอนุญาตหมดอายุ</span>; 
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20 whitespace-nowrap">{status}</span>; 
    } 
  };

  const getPermitTypeDisplayModern = (type: string) => { 
    switch(type) { 
      case 'HOT_WORK': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20 whitespace-nowrap"><FireOutlined /> Hot Work</span>; 
      case 'CONFINED_SPACE': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20 whitespace-nowrap"><BuildOutlined /> Confined Space</span>; 
      case 'ELECTRICAL': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20 whitespace-nowrap"><ThunderboltOutlined /> Electrical</span>; 
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20 whitespace-nowrap"><ToolOutlined /> Cold Work</span>; 
    } 
  };

  // 🟢 ฟังก์ชันเปิด Modal บันทึกก๊าซ
  const handleOpenGasModal = (record: any) => {
    setSelectedGasPermit(record);
    gasForm.resetFields();
    setIsGasModalOpen(true);
  };

  // 🟢 ฟังก์ชันส่งข้อมูลบันทึกก๊าซ
  const handleSubmitGasLog = async (values: any) => {
    setIsSubmittingGas(true);
    try {
      // 💡 หมายเหตุ: ตอนนี้เราจำลองการส่งข้อมูลไปก่อน ถ้ามี Table ใหม่ใน Backend ค่อยเปลี่ยน Endpoint ครับ
      const payload = {
        permit_id: selectedGasPermit.id,
        tester_id: currentUser.id,
        o2_level: values.o2,
        lel_level: values.lel,
        co_level: values.co,
        h2s_level: values.h2s,
        safety_talk_done: values.safety_talk,
        recorded_at: new Date().toISOString()
      };
      
      console.log('Sending Gas Log:', payload);
      
      // จำลองการโหลด 1 วินาที ให้เหมือนส่งข้อมูลจริง
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('บันทึกผลตรวจวัดก๊าซ และ Safety Talk สำเร็จ!');
      setIsGasModalOpen(false);
    } catch (error) {
      message.error('ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setIsSubmittingGas(false);
    }
  };

  const columns: ColumnsType<any> = [
    { 
      title: 'Permit No.', 
      dataIndex: 'permit_number', 
      key: 'permit_number', 
      width: 130, 
      render: (text) => (
        <span className="inline-block bg-slate-100 text-slate-700 font-mono font-bold px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm text-sm whitespace-nowrap">
          {text || 'PTW-XX'}
        </span>
      )
    },
    { 
      title: 'รายละเอียดงาน (Work Details)', 
      key: 'details', 
      render: (_, record) => ( 
        <div className="flex flex-col gap-2 min-w-[280px] py-2">
          <div className="font-bold text-slate-800 text-base leading-tight tracking-tight">
            {record.title}
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              <Avatar size="small" icon={<UserOutlined />} className="bg-blue-100 text-blue-600 w-5 h-5 flex items-center justify-center text-[10px]" />
              <span className="text-slate-700">{record.applicant?.full_name || 'ไม่ทราบชื่อ'}</span>
              <span className="text-slate-400 hidden sm:inline">({record.applicant?.department || '-'})</span>
            </div>
            <div className="flex items-center gap-1 font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              <EnvironmentOutlined className="text-emerald-500" /> 
              <span className="text-slate-600 truncate max-w-[150px] sm:max-w-xs">{record.location_detail}</span>
            </div>
          </div>

          {record.attachment_url && (
            <button 
              onClick={() => onPreviewFile(record.attachment_url)} 
              className="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-all duration-200 w-fit group"
            >
              <FileTextOutlined className="group-hover:scale-110 transition-transform" /> ดูเอกสาร JSA
            </button>
          )}
        </div> 
      ) 
    },
    { title: 'ประเภท', dataIndex: 'permit_type', key: 'type', width: 140, render: (type) => getPermitTypeDisplayModern(type) }, 
    { title: 'สถานะ', dataIndex: 'status', key: 'status', width: 160, render: (status) => getStatusDisplayModern(status) },
    { 
      title: 'การจัดการ (Action)', 
      key: 'action', 
      width: 190, 
      render: (_, record) => {
        const isAreaOwnerTurn = record.status === 'PENDING_AREA_OWNER' && currentUser?.role === 'AREA_OWNER'; 
        const isSafetyTurn = record.status === 'PENDING_SAFETY' && currentUser?.role === 'SAFETY_ENGINEER';
        const isApproved = record.status === 'APPROVED';
        const isOwnerOrSafety = currentUser?.role === 'SAFETY_ENGINEER' || currentUser?.role === 'AREA_OWNER';
        const isApplicant = currentUser?.role === 'CONTRACTOR'; 
        
        // 🟢 เช็คว่าเป็นงานที่ต้องตรวจก๊าซหรือไม่ (Hot Work / Confined Space)
        const requiresGasTest = record.permit_type === 'HOT_WORK' || record.permit_type === 'CONFINED_SPACE';

        return (
          <div className="flex flex-col gap-2 w-full pr-2">
            <button 
              onClick={() => onViewDetails(record)} 
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all whitespace-nowrap shadow-sm"
            >
              <EyeOutlined /> ดูรายละเอียด
            </button>

            {/* ปุ่มอนุมัติ / ไม่อนุมัติ (เมื่อสถานะ Pending) */}
            {(isAreaOwnerTurn || isSafetyTurn) && ( 
              <div className="flex gap-2 w-full">
                <button onClick={() => onUpdateStatus(record.id, record.status, 'APPROVE')} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg hover:from-emerald-400 hover:to-teal-400 active:scale-95 transition-all whitespace-nowrap">
                  <CheckOutlined /> อนุมัติ
                </button>
                <button onClick={() => onUpdateStatus(record.id, record.status, 'REJECT')} className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-white text-rose-500 rounded-lg border border-rose-200 hover:bg-rose-500 hover:text-white hover:border-rose-500 shadow-sm active:scale-95 transition-all" title="ไม่อนุมัติ">
                  <CloseOutlined />
                </button>
              </div> 
            )}
            
            {/* 🟢 ปุ่มเพิ่มเติมเมื่อสถานะเป็น APPROVED แล้ว */}
            {isApproved && (
              <div className="flex flex-col gap-2 w-full mt-1 border-t border-slate-100 pt-2">
                
                {/* 🚀 เฟส 3: ปุ่มบันทึกค่าก๊าซและ Safety Talk (เฉพาะ จป. หรือ Area Owner ที่ทำได้) */}
                {isOwnerOrSafety && requiresGasTest && (
                  <button 
                    onClick={() => handleOpenGasModal(record)} 
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-cyan-50 hover:bg-cyan-500 text-cyan-700 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-cyan-200 hover:border-cyan-500 shadow-sm"
                  >
                    <DashboardOutlined /> ตรวจก๊าซ & Safety Talk
                  </button>
                )}

                {/* ผู้รับเหมา: กดขอปิดงานเมื่อทำความสะอาดเสร็จ */}
                {isApplicant && (
                  <Popconfirm title="ยืนยันการปิดงาน?" description="คุณได้ทำความสะอาดพื้นที่เรียบร้อยแล้วใช่หรือไม่?" onConfirm={() => onUpdateStatus(record.id, record.status, 'CLOSE')} okText="ยืนยันปิดงาน" cancelText="ยกเลิก">
                    <button className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all border border-slate-200">
                      <CheckCircleOutlined /> ปิดงาน/คืนพื้นที่
                    </button>
                  </Popconfirm>
                )}

                {/* จป. / Area Owner: มีอำนาจกดระงับงานฉุกเฉินได้ตลอดเวลา */}
                {isOwnerOrSafety && (
                  <Popconfirm title="สั่งระงับงานฉุกเฉิน!" description="ต้องการยกเลิกใบอนุญาตนี้ทันทีใช่หรือไม่?" onConfirm={() => onUpdateStatus(record.id, record.status, 'REVOKE')} okText="ระงับงาน" okButtonProps={{danger: true}} cancelText="ยกเลิก">
                    <button className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-red-200 hover:border-red-500">
                      <StopOutlined /> สั่งระงับงาน (Revoke)
                    </button>
                  </Popconfirm>
                )}
              </div>
            )}

            {/* แสดงป้ายบอกว่าจบกระบวนการแล้ว สำหรับสถานะที่ปิดไปแล้ว */}
            {(record.status === 'REJECTED' || record.status === 'CLOSED' || record.status === 'REVOKED' || record.status === 'EXPIRED') && (
              <div className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg whitespace-nowrap">
                จบกระบวนการ
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Table 
          columns={columns} 
          dataSource={permits} 
          loading={loading} 
          pagination={{ pageSize: 8, className: "px-4 pb-4" }} 
          size="middle" 
          scroll={{ x: 1000 }} 
          className="modern-table"
        />
      </div>

      {/* =========================================================
          🚀 PHASE 3: Modal บันทึกผลตรวจวัดก๊าซ & Safety Talk (หน้างาน)
         ========================================================= */}
      <Modal 
        title={null} 
        open={isGasModalOpen} 
        onCancel={() => setIsGasModalOpen(false)} 
        footer={null} 
        width={600} 
        centered 
        styles={{ body: { padding: 0 } }}
        destroyOnClose
      >
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 rounded-t-xl text-white shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-20"><DashboardOutlined style={{ fontSize: '100px' }} /></div>
          <h2 className="text-xl md:text-2xl font-bold m-0 flex items-center gap-3 text-white relative z-10">
            <div className="bg-white/20 p-2 rounded-lg"><DashboardOutlined /></div>
            บันทึกผลตรวจวัดก๊าซหน้างาน
          </h2>
          <p className="text-cyan-100 text-xs md:text-sm mt-2 opacity-90 mb-0 relative z-10">
            Permit No: <span className="font-mono font-bold bg-black/20 px-2 py-0.5 rounded">{selectedGasPermit?.permit_number}</span>
          </p>
        </div>
        
        <div className="p-4 md:p-6 bg-slate-50">
          <Form form={gasForm} layout="vertical" onFinish={handleSubmitGasLog} requiredMark={false}>
            
            {/* 1. Safety Talk Confirmation */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-5 flex items-start gap-3">
              <div className="bg-orange-100 text-orange-500 p-2 rounded-xl mt-1"><NotificationOutlined className="text-xl" /></div>
              <div className="flex-1">
                <Form.Item name="safety_talk" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('ต้องทำการ Safety Talk ก่อนเริ่มงาน')) }]} className="m-0">
                  <Checkbox className="font-bold text-slate-800 text-sm md:text-base">
                    ยืนยันการทำ Safety Talk (Toolbox Talk)
                  </Checkbox>
                </Form.Item>
                <p className="text-xs text-slate-500 mt-1 mb-0 pl-6">ได้ทำการชี้แจงอันตราย ขั้นตอนการทำงาน และแผนฉุกเฉินให้ผู้ปฏิบัติงานทุกคนรับทราบและเข้าใจตรงกันแล้ว</p>
              </div>
            </div>

            {/* 2. Gas Measurement Log (Digital Gauge Style) */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6">
              <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <DashboardOutlined className="text-blue-500" /> ค่ามาตรฐานก๊าซ (Atmospheric Testing)
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                {/* O2 */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <Form.Item name="o2" label={<span className="font-bold text-slate-600 text-xs">Oxygen (O₂) <span className="text-emerald-500 font-normal ml-1">19.5 - 23.5%</span></span>} rules={[{ required: true, message: 'ระบุค่า O2' }]} className="m-0">
                    <InputNumber size="large" className="w-full text-lg font-mono font-bold text-blue-600" placeholder="0.0" suffix="%" step={0.1} />
                  </Form.Item>
                </div>
                
                {/* LEL */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <Form.Item name="lel" label={<span className="font-bold text-slate-600 text-xs">ก๊าซไวไฟ (LEL) <span className="text-emerald-500 font-normal ml-1">&lt; 10%</span></span>} rules={[{ required: true, message: 'ระบุค่า LEL' }]} className="m-0">
                    <InputNumber size="large" className="w-full text-lg font-mono font-bold text-orange-500" placeholder="0.0" suffix="%" step={0.1} />
                  </Form.Item>
                </div>

                {/* H2S */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <Form.Item name="h2s" label={<span className="font-bold text-slate-600 text-xs">ก๊าซไข่เน่า (H₂S) <span className="text-emerald-500 font-normal ml-1">&lt; 10 ppm</span></span>} rules={[{ required: true, message: 'ระบุค่า H2S' }]} className="m-0">
                    <InputNumber size="large" className="w-full text-lg font-mono font-bold text-purple-600" placeholder="0.0" suffix="ppm" step={0.1} />
                  </Form.Item>
                </div>

                {/* CO */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <Form.Item name="co" label={<span className="font-bold text-slate-600 text-xs">ก๊าซพิษ (CO) <span className="text-emerald-500 font-normal ml-1">&lt; 25 ppm</span></span>} rules={[{ required: true, message: 'ระบุค่า CO' }]} className="m-0">
                    <InputNumber size="large" className="w-full text-lg font-mono font-bold text-rose-500" placeholder="0.0" suffix="ppm" step={0.1} />
                  </Form.Item>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button size="large" onClick={() => setIsGasModalOpen(false)} className="flex-1 rounded-xl h-12 font-bold bg-white text-slate-600 border border-slate-300">ยกเลิก</Button>
              <Button size="large" type="primary" htmlType="submit" loading={isSubmittingGas} icon={<SaveOutlined />} className="flex-1 rounded-xl h-12 font-bold bg-cyan-600 hover:bg-cyan-700 border-none shadow-md shadow-cyan-500/30">บันทึกผลหน้างาน</Button>
            </div>
          </Form>
        </div>
      </Modal>
    </>
  );
}