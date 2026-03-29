import React, { useState, useEffect } from 'react';
import { Table, Avatar, Popconfirm, Modal, Form, InputNumber, Checkbox, message, Button, Input, Row, Col, Tag, Divider, Upload } from 'antd';
import { 
  FileTextOutlined, EnvironmentOutlined, UserOutlined, 
  EyeOutlined, CheckOutlined, CloseOutlined, CheckCircleOutlined, 
  FireOutlined, BuildOutlined, ThunderboltOutlined, ToolOutlined,
  StopOutlined, LockOutlined, ClockCircleOutlined, DashboardOutlined,
  NotificationOutlined, SaveOutlined, WarningOutlined, InfoCircleOutlined,
  FilePdfOutlined, KeyOutlined, MedicineBoxOutlined, ProfileOutlined,
  CameraOutlined, UploadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/th';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('th');
dayjs.tz.setDefault('Asia/Bangkok');

export default function WorkPermitQueue({ permits, loading, currentUser, onPreviewFile, onViewDetails, onUpdateStatus, pagination, onChangePage, uploadToolboxPhoto }: any) {
  
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [selectedGasPermit, setSelectedGasPermit] = useState<any>(null);
  const [isSubmittingGas, setIsSubmittingGas] = useState(false);
  const [gasForm] = Form.useForm();
  const [completedGasTests, setCompletedGasTests] = useState<string[]>([]);

  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedExtendPermit, setSelectedExtendPermit] = useState<any>(null);
  const [isSubmittingExtend, setIsSubmittingExtend] = useState(false);
  const [extendForm] = Form.useForm();

  // 🟢 State สำหรับ Toolbox Talk Modal
  const [isToolboxModalOpen, setIsToolboxModalOpen] = useState(false);
  const [selectedToolboxPermit, setSelectedToolboxPermit] = useState<any>(null);
  const [toolboxFileList, setToolboxFileList] = useState<any[]>([]);
  const [isSubmittingToolbox, setIsSubmittingToolbox] = useState(false);
  const [toolboxForm] = Form.useForm();

  const getStatusDisplayModern = (status: string) => { 
    switch(status) { 
      case 'PENDING_AREA_OWNER': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>รอเจ้าของพื้นที่</span>; 
      case 'PENDING_SAFETY': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>รอ จป. อนุมัติ</span>; 
      case 'APPROVED': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm whitespace-nowrap"><CheckCircleOutlined className="text-emerald-500" /> กำลังปฏิบัติงาน</span>; 
      case 'REJECTED': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm whitespace-nowrap"><CloseOutlined /> ไม่อนุมัติ</span>; 
      case 'CLOSED': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200 shadow-sm whitespace-nowrap"><LockOutlined /> ปิดงานแล้ว</span>; 
      case 'REVOKED': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-red-600 text-white shadow-md whitespace-nowrap"><StopOutlined /> ถูกระงับงานฉุกเฉิน</span>; 
      case 'EXPIRED': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-orange-50 text-orange-700 border border-orange-200 shadow-sm whitespace-nowrap"><ClockCircleOutlined /> ใบอนุญาตหมดอายุ</span>; 
      default: return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-slate-50 text-slate-600 border border-slate-200 shadow-sm whitespace-nowrap">{status || 'PENDING'}</span>; 
    } 
  };

  const getPermitTypeDisplayModern = (type: string) => {
    const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black whitespace-nowrap shadow-sm hover:scale-[1.02] transition-transform";
    switch (type) {
      case 'HOT_WORK': return <span className={`${baseClasses} bg-orange-50 text-orange-700 border border-orange-200`}><FireOutlined /> Hot Work</span>;
      case 'CONFINED_SPACE': return <span className={`${baseClasses} bg-purple-50 text-purple-700 border border-purple-200`}><BuildOutlined /> Confined Space</span>;
      case 'WORKING_AT_HEIGHT': return <span className={`${baseClasses} bg-sky-50 text-sky-700 border border-sky-200`}><EnvironmentOutlined /> Work at Height</span>;
      case 'ELECTRICAL': return <span className={`${baseClasses} bg-yellow-50 text-yellow-700 border border-yellow-200`}><ThunderboltOutlined /> Electrical</span>;
      case 'EXCAVATION': return <span className={`${baseClasses} bg-amber-50 text-amber-900 border border-amber-200`}><ToolOutlined /> Excavation</span>;
      default: return <span className={`${baseClasses} bg-indigo-50 text-indigo-700 border border-indigo-200`}><ToolOutlined /> Cold Work</span>;
    }
  };

  const handleOpenGasModal = (record: any) => { setSelectedGasPermit(record); gasForm.resetFields(); setIsGasModalOpen(true); };
  const handleOpenExtendModal = (record: any) => { setSelectedExtendPermit(record); extendForm.resetFields(); setIsExtendModalOpen(true); };
  
  // 🟢 เปิด Modal ถ่ายรูป
  const handleOpenToolboxModal = (record: any) => { 
    setSelectedToolboxPermit(record); 
    toolboxForm.resetFields(); 
    setToolboxFileList([]);
    setIsToolboxModalOpen(true); 
  };

  const handleSubmitGasLog = async (values: any) => {
    setIsSubmittingGas(true);
    try {
      const payload = { permit_id: selectedGasPermit.id, tester_id: currentUser?.id, o2_level: values.o2, lel_level: values.lel, co_level: values.co, h2s_level: values.h2s, safety_talk_done: values.safety_talk };
      const response = await axios.post('https://safetyos-backend.onrender.com/gas-logs', payload);
      setIsGasModalOpen(false);
      setCompletedGasTests(prev => [...prev, selectedGasPermit.id]);

      if (response.data.isDangerous) {
        Modal.error({
          title: <span className="text-2xl font-black text-rose-600">🚨 สั่งอพยพฉุกเฉิน!</span>,
          content: (<div className="mt-4 text-base font-bold text-slate-700">ตรวจพบค่าก๊าซอันตรายเกินมาตรฐาน!<br/>ระบบได้ <span className="text-rose-600 font-black">"ระงับใบอนุญาตทำงาน"</span> และสั่งอพยพผู้ปฏิบัติงานทั้งหมดออกจากพื้นที่โดยอัตโนมัติแล้ว!</div>),
          centered: true, okText: 'รับทราบ', okButtonProps: { danger: true, size: 'large' }
        });
        setTimeout(() => window.location.reload(), 2000); 
      } else {
        message.success('บันทึกผลตรวจวัดก๊าซ และ Safety Talk สำเร็จ!');
        setTimeout(() => window.location.reload(), 1000); 
      }
    } catch (error) { message.error('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง'); } 
    finally { setIsSubmittingGas(false); }
  };

  const handleSubmitExtend = async (values: any) => {
    setIsSubmittingExtend(true);
    try {
      const payload = { new_end_time: dayjs(values.new_end_time).toISOString(), reason: values.reason, requested_by: currentUser?.full_name || 'ไม่ระบุชื่อ' };
      await axios.put(`https://safetyos-backend.onrender.com/permits/${selectedExtendPermit.id}/extend`, payload);
      message.success('ขอขยายเวลาสำเร็จ! ระบบได้ส่งแจ้งเตือนไปที่ จป. แล้ว');
      setIsExtendModalOpen(false);
      setTimeout(() => window.location.reload(), 1000); 
    } catch (error) { message.error('ระบบขัดข้อง ไม่สามารถขยายเวลาได้'); } 
    finally { setIsSubmittingExtend(false); }
  };

  // 🟢 ยืนยันการอัปโหลดรูป Toolbox Talk
  const handleSubmitToolbox = async (values: any) => {
    if (toolboxFileList.length === 0) {
      return message.error('กรุณาแนบภาพถ่ายหน้างานขณะทำ Toolbox Talk');
    }
    setIsSubmittingToolbox(true);
    const file = toolboxFileList[0].originFileObj;
    if (uploadToolboxPhoto) {
      const success = await uploadToolboxPhoto(selectedToolboxPermit.id, file);
      if (success) {
        setIsToolboxModalOpen(false);
      }
    } else {
      message.error('ไม่พบฟังก์ชันอัปโหลด (ระบบขัดข้อง)');
    }
    setIsSubmittingToolbox(false);
  };

  const columns: ColumnsType<any> = [
    { 
      title: 'Permit No.', 
      dataIndex: 'permit_number', 
      key: 'permit_number', 
      width: 140, 
      render: (text) => (
        <span className="inline-block bg-slate-50 text-slate-700 font-mono font-black px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-[13px] whitespace-nowrap">
          {text || 'PTW-NEW'}
        </span>
      )
    },
    { 
      title: 'รายละเอียดงาน (Work Details)', 
      key: 'details', 
      render: (_, record) => ( 
        <div className="flex flex-col gap-3 min-w-[320px] py-3 pr-4">
          <div className="font-black text-slate-800 text-[15px] leading-tight">
            {record?.title || 'ไม่มีชื่อหัวข้องาน'}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-start gap-2 bg-[#f8fafc] p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors duration-300">
              <EnvironmentOutlined className="text-emerald-500 mt-0.5 text-sm" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">สถานที่ปฏิบัติงาน</span>
                <span className="text-slate-700 font-bold mt-0.5 truncate max-w-[150px]">{record?.location_detail || '-'}</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2 bg-[#f8fafc] p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors duration-300">
              <ClockCircleOutlined className="text-blue-500 mt-0.5 text-sm" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">เวลาปฏิบัติงาน</span>
                <span className="text-slate-700 font-bold mt-0.5">
                  {record?.start_time ? dayjs(record.start_time).format('DD/MM HH:mm') : '-'} - {record?.end_time ? dayjs(record.end_time).format('HH:mm') : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1">
            <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100">
              <Avatar size="small" icon={<UserOutlined />} className="bg-blue-200 text-blue-700 w-5 h-5 text-[10px]" />
              <span className="text-[11px] font-extrabold text-slate-700">{record?.applicant?.full_name || 'ผู้รับเหมา'}</span>
            </div>
            
            {record?.attachment_url && (
              <button onClick={() => onPreviewFile(record.attachment_url)} className="flex items-center gap-1.5 text-[11px] font-extrabold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]">
                <FileTextOutlined /> ดูเอกสาร JSA
              </button>
            )}

            {record?.is_loto_required && (
              <Tag color="red" icon={<KeyOutlined />} className="m-0 rounded-lg font-bold border-red-200 text-[10px] shadow-sm">LOTO Req.</Tag>
            )}
          </div>
        </div> 
      ) 
    },
    { title: 'ประเภท', dataIndex: 'permit_type', key: 'type', width: 140, render: (type) => getPermitTypeDisplayModern(type || 'COLD_WORK') }, 
    { title: 'สถานะ', dataIndex: 'status', key: 'status', width: 180, render: (status) => getStatusDisplayModern(status || 'PENDING') },
    { 
      title: 'การจัดการ (Action)', 
      key: 'action', 
      width: 200, 
      render: (_, record) => {
        const isAreaOwnerTurn = record?.status === 'PENDING_AREA_OWNER' && currentUser?.role === 'AREA_OWNER'; 
        const isSafetyTurn = record?.status === 'PENDING_SAFETY' && currentUser?.role === 'SAFETY_ENGINEER';
        const isApproved = record?.status === 'APPROVED';
        const isOwnerOrSafety = currentUser?.role === 'SAFETY_ENGINEER' || currentUser?.role === 'AREA_OWNER';
        const isApplicant = currentUser?.role === 'CONTRACTOR'; 
        const requiresGasTest = record?.permit_type === 'HOT_WORK' || record?.permit_type === 'CONFINED_SPACE';
        const hasGasLog = (record.gas_logs && record.gas_logs.length > 0) || completedGasTests.includes(record.id);
        const hasToolboxPic = record.attachments?.some((a: any) => a.file_type === 'TOOLBOX_TALK' || a.file_name === 'Toolbox Talk Evidence');

        return (
          <div className="flex flex-col gap-2 w-full pr-2 pb-2 animate-fade-in-up">
            <button onClick={() => onViewDetails(record)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-white border-2 border-slate-100 text-slate-600 rounded-xl text-xs font-extrabold hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-200 ease-out active:scale-[0.98] shadow-sm">
              <FilePdfOutlined /> Print / เอกสารเต็ม
            </button>

            {isOwnerOrSafety && requiresGasTest && !hasGasLog && !['CLOSED', 'REVOKED', 'EXPIRED'].includes(record?.status) && (
              <button onClick={() => handleOpenGasModal(record)} className="w-full flex items-center justify-center gap-1.5 px-2 py-2 bg-cyan-50 hover:bg-cyan-500 text-cyan-700 hover:text-white rounded-xl text-[11px] font-extrabold transition-all duration-200 ease-out active:scale-[0.98] border border-cyan-200 shadow-[0_4px_12px_rgba(6,182,212,0.15)] mb-1">
                <DashboardOutlined /> ตรวจก๊าซหน้างาน (Pre-entry)
              </button>
            )}
            
            {requiresGasTest && hasGasLog && !['CLOSED', 'REVOKED', 'EXPIRED'].includes(record?.status) && (
               <div className="w-full flex items-center justify-center gap-1.5 px-2 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[11px] font-extrabold border border-emerald-200 shadow-sm cursor-default mb-1">
                 <CheckCircleOutlined /> ตรวจก๊าซเรียบร้อย
               </div>
            )}

            {(isAreaOwnerTurn || isSafetyTurn) && ( 
              <div className="flex gap-2 w-full">
                {requiresGasTest && !hasGasLog ? (
                  <button disabled className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-slate-100 text-slate-400 rounded-xl text-[11px] font-extrabold cursor-not-allowed border border-slate-200">
                    <LockOutlined /> รอผลก๊าซ
                  </button>
                ) : (
                  <button onClick={() => onUpdateStatus(record.id, record.status, 'APPROVE')} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:bg-emerald-600 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.96]">
                    <CheckOutlined /> อนุมัติ
                  </button>
                )}
                <button onClick={() => onUpdateStatus(record.id, record.status, 'REJECT')} className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white text-rose-500 rounded-xl border-2 border-rose-100 hover:bg-rose-50 hover:border-rose-300 shadow-sm transition-all duration-200 ease-out active:scale-[0.92]" title="ไม่อนุมัติ">
                  <CloseOutlined className="text-sm" />
                </button>
              </div> 
            )}
            
            {isApproved && (
              <div className="flex flex-col gap-2 w-full mt-1 border-t border-slate-100 pt-3">
                
                {/* 📸 ปุ่มถ่ายรูป Toolbox Talk โผล่มาหลังอนุมัติ */}
                {isApplicant && !hasToolboxPic && (
                  <button onClick={() => handleOpenToolboxModal(record)} className="w-full flex items-center justify-center gap-1.5 px-2 py-2 bg-blue-50 hover:bg-blue-500 text-blue-700 hover:text-white rounded-xl text-[11px] font-extrabold transition-all duration-200 ease-out active:scale-[0.98] border border-blue-200 shadow-[0_4px_12px_rgba(59,130,246,0.15)]">
                    <CameraOutlined /> ถ่ายรูปประชุมเริ่มงาน
                  </button>
                )}
                {isApplicant && hasToolboxPic && (
                  <div className="w-full flex items-center justify-center gap-1.5 px-2 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[11px] font-extrabold border border-emerald-200 shadow-sm cursor-default">
                    <CheckCircleOutlined /> ส่งหลักฐานประชุมแล้ว
                  </div>
                )}

                {isApplicant && (
                  <button onClick={() => handleOpenExtendModal(record)} className="w-full flex items-center justify-center gap-1.5 px-2 py-2 bg-purple-50 hover:bg-purple-500 text-purple-700 hover:text-white rounded-xl text-[11px] font-extrabold transition-all duration-200 ease-out active:scale-[0.98] border border-purple-200 shadow-sm">
                    <ClockCircleOutlined /> ขอต่อเวลา (Extend)
                  </button>
                )}

                {isApplicant && (
                  <Popconfirm title="ยืนยันการปิดงาน?" description="คุณได้ทำความสะอาดพื้นที่เรียบร้อยแล้วใช่หรือไม่?" onConfirm={() => onUpdateStatus(record.id, record.status, 'CLOSE')} okText="ยืนยันปิดงาน" cancelText="ยกเลิก">
                    <button className="w-full flex items-center justify-center gap-1.5 px-2 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[11px] font-extrabold transition-all duration-200 ease-out active:scale-[0.98] shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                      <CheckCircleOutlined /> คืนพื้นที่ / ปิดงาน
                    </button>
                  </Popconfirm>
                )}

                {isOwnerOrSafety && (
                  <Popconfirm title="สั่งระงับงานฉุกเฉิน!" description="ต้องการยกเลิกใบอนุญาตนี้ทันทีใช่หรือไม่?" onConfirm={() => onUpdateStatus(record.id, record.status, 'REVOKE')} okText="ระงับงาน" okButtonProps={{danger: true}} cancelText="ยกเลิก">
                    <button className="w-full flex items-center justify-center gap-1.5 px-2 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[11px] font-extrabold transition-all duration-200 ease-out active:scale-[0.98] shadow-[0_4px_12px_rgba(244,63,94,0.3)]">
                      <StopOutlined /> ระงับงาน (Revoke)
                    </button>
                  </Popconfirm>
                )}
              </div>
            )}

            {(record?.status === 'REJECTED' || record?.status === 'CLOSED' || record?.status === 'REVOKED' || record?.status === 'EXPIRED') && (
              <div className="w-full flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl whitespace-nowrap mt-1">
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
      <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden p-2 md:p-4">
        <Table 
          columns={columns} 
          dataSource={permits} 
          loading={loading} 
          pagination={{ 
            current: pagination?.current || 1,
            pageSize: pagination?.pageSize || 10,
            total: pagination?.total || 0,
            onChange: (page, pageSize) => {
              if (onChangePage) onChangePage(page, pageSize);
            },
            showSizeChanger: true, 
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => `แสดงผล ${range[0]}-${range[1]} จากทั้งหมด ${total} รายการ`,
            className: "px-4 pb-4" 
          }} 
          size="middle" 
          scroll={{ x: 1100 }} 
          rowKey="id"
          className="modern-expanded-table"
          expandable={{
            expandedRowRender: (record) => {
              if (!record) return null; 
              return (
              <div className="p-6 md:p-8 bg-[#f8fafc] rounded-[2rem] border border-slate-200/60 m-2 md:m-4 shadow-inner animate-[slideDown_0.3s_ease-out_forwards] origin-top">
                 <h4 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-200 pb-3">
                   <InfoCircleOutlined className="text-blue-500" /> ข้อมูลใบอนุญาตเชิงลึก (Deep Details)
                 </h4>
                 <Row gutter={[32, 24]}>
                    <Col xs={24} md={12}>
                       <div className="flex flex-col gap-5">
                          <div>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">มาตรการควบคุมความเสี่ยง (Safety Measures)</span>
                            <div className="mt-1 bg-white p-4 rounded-2xl border border-slate-200 text-sm font-medium text-slate-700 whitespace-pre-wrap shadow-sm">
                              {record?.description || 'ไม่มีการระบุมาตรการเพิ่มเติม'}
                            </div>
                          </div>
                          {record?.is_loto_required && (
                            <div className="bg-red-50 p-4 rounded-2xl border border-red-200 shadow-sm flex items-start gap-4">
                               <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 text-lg shrink-0 shadow-sm"><KeyOutlined /></div>
                               <div>
                                 <span className="text-[10px] text-red-500/80 font-black uppercase tracking-widest block mb-0.5">การตัดแยกพลังงาน (LOTO)</span>
                                 <span className="text-sm font-extrabold text-red-700 block mb-2">งานนี้จำเป็นต้องทำ LOTO ก่อนเริ่มงาน!</span>
                                 {record?.loto_records && record?.loto_records?.length > 0 ? (
                                   <div className="text-xs bg-white px-3 py-1.5 rounded-lg border border-red-100 inline-block font-bold text-slate-600">
                                     ✅ มีบันทึกการตัดแยกพลังงานแล้ว ({record?.loto_records?.length} จุด)
                                   </div>
                                 ) : (
                                   <div className="text-xs bg-white px-3 py-1.5 rounded-lg border border-red-100 inline-block font-bold text-red-500">
                                     ❌ ยังไม่มีการบันทึกการตัดแยก
                                   </div>
                                 )}
                               </div>
                            </div>
                          )}
                       </div>
                    </Col>
                    <Col xs={24} md={12}>
                       <div className="flex flex-col gap-4">
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-0.5 transition-transform duration-300">
                             <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 text-lg"><FireOutlined /></div>
                             <div>
                               <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">ผู้ตรวจสอบสภาพอากาศ (Gas Tester)</span>
                               <span className="text-sm font-extrabold text-slate-800">{record?.gas_tester_name || '-'}</span>
                             </div>
                          </div>
                          
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-0.5 transition-transform duration-300">
                             <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 text-lg"><EyeOutlined /></div>
                             <div>
                               <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">ผู้เฝ้าระวัง (Standby Person)</span>
                               <span className="text-sm font-extrabold text-slate-800">{record?.standby_person_name || '-'}</span>
                             </div>
                          </div>
                          {record?.permit_type === 'CONFINED_SPACE' && (
                            <>
                              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-0.5 transition-transform duration-300">
                                 <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 text-lg"><ProfileOutlined /></div>
                                 <div>
                                   <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">ผู้ควบคุมงาน (Supervisor)</span>
                                   <span className="text-sm font-extrabold text-slate-800">{record?.supervisor_name || 'ระบุในขั้นตอนการเตรียมงาน'}</span>
                                 </div>
                              </div>
                              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm flex justify-between items-center hover:-translate-y-0.5 transition-transform duration-300">
                                 <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-500 text-lg"><MedicineBoxOutlined /></div>
                                   <div>
                                     <span className="text-[10px] text-emerald-600/80 font-black uppercase tracking-widest block mb-0.5">ใบรับรองแพทย์ (Fit to Work)</span>
                                     <span className={`text-sm font-extrabold ${record?.is_med_cert_verified ? 'text-emerald-700' : 'text-slate-500'}`}>
                                       {record?.is_med_cert_verified ? 'ผ่านการตรวจสอบแล้ว' : 'รอการตรวจสอบ'}
                                     </span>
                                   </div>
                                 </div>
                                 {record?.is_med_cert_verified && <CheckCircleOutlined className="text-2xl text-emerald-500" />}
                              </div>
                            </>
                          )}
                       </div>
                    </Col>
                 </Row>
              </div>
            )}
          }}
        />
      </div>

      {/* 📸 หน้าต่าง Toolbox Talk */}
      <Modal title={null} open={isToolboxModalOpen} onCancel={() => setIsToolboxModalOpen(false)} footer={null} width={550} centered styles={{ body: { padding: 0 } }} destroyOnClose className="custom-modern-modal">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-t-[2.5rem] text-white shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-20"><CameraOutlined style={{ fontSize: '120px' }} /></div>
          <h2 className="text-2xl md:text-3xl font-black m-0 flex items-center gap-3 text-white relative z-10 tracking-tight">
            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md shadow-inner"><CameraOutlined /></div>ถ่ายภาพเริ่มงาน
          </h2>
          <p className="text-blue-100 text-sm mt-3 opacity-90 mb-0 relative z-10 font-medium">
            Permit No: <span className="font-mono font-bold bg-black/20 px-3 py-1 rounded-lg tracking-wider ml-1">{selectedToolboxPermit?.permit_number}</span>
          </p>
        </div>
        <div className="p-6 md:p-8 bg-[#f8fafc] rounded-b-[2.5rem]">
          <Form form={toolboxForm} layout="vertical" onFinish={handleSubmitToolbox} requiredMark={false} className="anatomy-form">
            <div className="bg-white p-5 rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 mb-6">
              {/* 🟢 อัปเดต Upload ให้รองรับกล้องมือถือได้ง่ายขึ้น */}
              <Form.Item label={<span className="font-black text-slate-800 text-[13px] uppercase tracking-widest">อัปโหลดรูปภาพทีมงาน (PPE ครบ) <span className="text-red-500">*</span></span>} className="mb-0">
                <Upload 
                  accept="image/*" 
                  capture="environment" 
                  beforeUpload={() => false} 
                  maxCount={1} 
                  fileList={toolboxFileList} 
                  onChange={({ fileList }) => setToolboxFileList(fileList)} 
                  listType="picture-card" 
                  className="toolbox-uploader"
                >
                  {toolboxFileList.length < 1 && (
                    <div className="text-slate-400 font-bold flex flex-col items-center gap-2">
                      <CameraOutlined className="text-3xl" /> แตะเพื่อถ่ายภาพ
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </div>
            
            <div className="bg-white p-5 rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 mb-6">
              <h4 className="font-black text-slate-800 text-sm mb-4 border-b border-slate-100 pb-3">✅ ยืนยันความพร้อมหน้างาน</h4>
              <Form.Item name="check1" valuePropName="checked" rules={[{ validator: (_, val) => val ? Promise.resolve() : Promise.reject('กดยืนยันด้วยครับ') }]} className="mb-3">
                <Checkbox className="font-bold text-slate-700 text-sm">สมาชิกมาครบถ้วน สภาพร่างกายพร้อมทำงาน</Checkbox>
              </Form.Item>
              <Form.Item name="check2" valuePropName="checked" rules={[{ validator: (_, val) => val ? Promise.resolve() : Promise.reject('กดยืนยันด้วยครับ') }]} className="mb-3">
                <Checkbox className="font-bold text-slate-700 text-sm">ตรวจสอบการสวมใส่ PPE ถูกต้องทุกคน</Checkbox>
              </Form.Item>
              <Form.Item name="check3" valuePropName="checked" rules={[{ validator: (_, val) => val ? Promise.resolve() : Promise.reject('กดยืนยันด้วยครับ') }]} className="m-0">
                <Checkbox className="font-bold text-slate-700 text-sm">อุปกรณ์ช่วยเหลือฉุกเฉินและเครื่องมือพร้อมใช้งาน</Checkbox>
              </Form.Item>
            </div>

            <div className="flex gap-4">
              <Button size="large" onClick={() => setIsToolboxModalOpen(false)} className="flex-1 rounded-2xl h-14 font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-500 border-none transition-transform active:scale-[0.98]">ยกเลิก</Button>
              <Button size="large" type="primary" htmlType="submit" loading={isSubmittingToolbox} icon={<SaveOutlined />} className="flex-[2] rounded-2xl h-14 font-black bg-blue-600 hover:bg-blue-700 border-none shadow-[0_8px_24px_rgba(37,99,235,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]">บันทึกข้อมูลเริ่มงาน</Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* 🟢 หน้าต่างตรวจวัดก๊าซ */}
      <Modal title={null} open={isGasModalOpen} onCancel={() => setIsGasModalOpen(false)} footer={null} width={600} centered styles={{ body: { padding: 0 } }} destroyOnClose className="custom-modern-modal">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-8 rounded-t-[2.5rem] text-white shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-20"><DashboardOutlined style={{ fontSize: '120px' }} /></div>
          <h2 className="text-2xl md:text-3xl font-black m-0 flex items-center gap-3 text-white relative z-10 tracking-tight">
            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md shadow-inner"><DashboardOutlined /></div>
            ตรวจก๊าซหน้างาน
          </h2>
          <p className="text-cyan-100 text-sm mt-3 opacity-90 mb-0 relative z-10 font-medium">
            Permit No: <span className="font-mono font-bold bg-black/20 px-3 py-1 rounded-lg tracking-wider ml-1">{selectedGasPermit?.permit_number}</span>
          </p>
        </div>
        
        <div className="p-6 md:p-8 bg-[#f8fafc] rounded-b-[2.5rem]">
          <Form form={gasForm} layout="vertical" onFinish={handleSubmitGasLog} requiredMark={false} className="anatomy-form">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 mb-8">
              <h4 className="font-black text-slate-800 text-base mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <DashboardOutlined className="text-blue-500 text-xl" /> ค่ามาตรฐานก๊าซ
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
              <Button size="large" type="primary" htmlType="submit" loading={isSubmittingGas} icon={<SaveOutlined />} className="flex-[2] rounded-2xl h-14 font-black bg-cyan-600 hover:bg-cyan-700 border-none shadow-[0_8px_24px_rgba(8,145,178,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]">บันทึกผล</Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* ⏳ หน้าต่างขอขยายเวลา */}
      <Modal title={null} open={isExtendModalOpen} onCancel={() => setIsExtendModalOpen(false)} footer={null} width={550} centered styles={{ body: { padding: 0 } }} destroyOnClose className="custom-modern-modal">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 rounded-t-[2.5rem] text-white shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-20"><ClockCircleOutlined style={{ fontSize: '120px' }} /></div>
          <h2 className="text-2xl md:text-3xl font-black m-0 flex items-center gap-3 text-white relative z-10 tracking-tight">
            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md shadow-inner"><ClockCircleOutlined /></div>ขอขยายเวลา
          </h2>
        </div>
        <div className="p-6 md:p-8 bg-[#f8fafc] rounded-b-[2.5rem]">
          <Form form={extendForm} layout="vertical" onFinish={handleSubmitExtend} requiredMark={false} className="anatomy-form">
            <Form.Item name="new_end_time" label={<span className="font-extrabold text-slate-800 text-[13px] mb-1.5 block">เวลาสิ้นสุดใหม่ <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'ระบุเวลา' }]}>
              <input type="datetime-local" className="w-full bg-white border border-slate-200 rounded-2xl px-5 h-14 text-slate-700 font-bold focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 shadow-sm transition-shadow" />
            </Form.Item>
            <Form.Item name="reason" label={<span className="font-extrabold text-slate-800 text-[13px] mb-1.5 block mt-2">เหตุผล <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'ระบุเหตุผล' }]}>
              <Input.TextArea rows={4} className="rounded-2xl border-slate-200 bg-white px-5 py-4 text-base focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 shadow-sm font-medium transition-shadow" />
            </Form.Item>
            <div className="flex gap-4 pt-6 border-t border-slate-200/60 mt-4">
              <Button size="large" onClick={() => setIsExtendModalOpen(false)} className="flex-1 rounded-2xl h-14 font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-500 border-none transition-transform active:scale-[0.98]">ยกเลิก</Button>
              <Button size="large" type="primary" htmlType="submit" loading={isSubmittingExtend} icon={<ClockCircleOutlined />} className="flex-[2] rounded-2xl h-14 font-black bg-purple-600 hover:bg-purple-700 border-none shadow-[0_8px_24px_rgba(147,51,234,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]">ส่งคำขอต่อเวลา</Button>
            </div>
          </Form>
        </div>
      </Modal>

      <style>{`
        /* ✨ Accessibility: Respect user's motion preferences globally */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }

        /* ✨ UI Tip: Specific animations for components */
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px) scaleY(0.95); }
          to { opacity: 1; transform: translateY(0) scaleY(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }

        .modern-expanded-table .ant-table { background: transparent !important; }
        .modern-expanded-table .ant-table-thead > tr > th { background: #f8fafc !important; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; border-bottom: 2px solid #f1f5f9; padding: 16px 24px; }
        .modern-expanded-table .ant-table-tbody > tr > td { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; }
        .modern-expanded-table .ant-table-tbody > tr:hover > td { background: #fdfdfd !important; }
        .modern-expanded-table .ant-table-expanded-row > td { background: #ffffff !important; padding: 0 !important; }
        
        /* Interactive icon hover for expand row */
        .modern-expanded-table .ant-table-row-expand-icon { width: 24px; height: 24px; border-radius: 8px; color: #3b82f6; border-color: #bfdbfe; background: #eff6ff; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease-out; }
        .modern-expanded-table .ant-table-row-expand-icon:hover { background: #3b82f6; color: white; transform: scale(1.1); }
        
        .custom-modern-modal .ant-modal-content { border-radius: 2.5rem !important; padding: 0 !important; overflow: hidden; background: transparent; box-shadow: 0 32px 64px -12px rgba(0,0,0,0.15) !important; }
        .anatomy-form .ant-form-item-label > label { height: auto !important; padding-bottom: 0 !important; }
        .anatomy-form .ant-input-number-input { font-weight: 800; }
        .anatomy-form .ant-input-number-handler-wrap { display: none !important; }
        
        .toolbox-uploader .ant-upload.ant-upload-select-picture-card {
          width: 100% !important;
          height: 180px !important;
          border-radius: 1rem !important;
          background: #f8fafc !important;
          border: 2px dashed #cbd5e1 !important;
          transition: all 0.3s ease !important;
        }
        .toolbox-uploader .ant-upload.ant-upload-select-picture-card:hover {
          border-color: #3b82f6 !important;
          background: #eff6ff !important;
        }
      `}</style>
    </>
  );
}