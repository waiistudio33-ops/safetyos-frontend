import React, { useState } from 'react';
import { Modal, Tag, Button, Divider, Space, Typography, Form, Input, DatePicker, message, Row, Col } from 'antd';
import { 
  PrinterOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  SafetyOutlined, ClockCircleOutlined, LockOutlined, EnvironmentOutlined,
  FileTextOutlined, IdcardOutlined, SettingOutlined // 🟢 เพิ่ม SettingOutlined ที่ลืม Import
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface PermitDetailModalProps {
  open: boolean;
  onCancel: () => void;
  permit: any;
  gasLogs?: any[];
  documentRef: React.RefObject<HTMLDivElement>;
  onPrint: () => void;
  getStatusDisplay: (status: string) => React.ReactNode;
  getPermitTypeDisplay: (type: string) => React.ReactNode;
  onUpdateStatus?: (id: string, status: string, action: 'APPROVE'|'REJECT'|'CLOSE'|'REVOKE', comment?: string) => Promise<void>;
  onExtendPermit?: (id: string, newEndTime: string, reason: string) => Promise<void>;
  currentUser?: any;
}

export default function PermitDetailModal({ 
  open, onCancel, permit, documentRef, onPrint, 
  getStatusDisplay, onUpdateStatus, onExtendPermit, currentUser 
}: PermitDetailModalProps) {
  
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage(); // 🟢 แก้ Warning message context
  const [actionType, setActionType] = useState<'NONE' | 'APPROVE' | 'REJECT' | 'EXTEND' | 'CLOSE'>('NONE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!permit) return null;

  const isApplicant = currentUser?.id === permit.applicant_id;
  const isSafetyOrOwner = ['SAFETY_ENGINEER', 'AREA_OWNER'].includes(currentUser?.role);
  const canApprove = isSafetyOrOwner && permit.status.includes('PENDING');
  const canExtendOrClose = isApplicant && permit.status === 'APPROVED';

  const handleActionSubmit = async () => {
    try {
      await form.validateFields();
      setIsSubmitting(true);
      const values = form.getFieldsValue();

      if (actionType === 'EXTEND' && onExtendPermit) {
        const newTime = values.new_end_time.toISOString();
        await onExtendPermit(permit.id, newTime, values.reason);
        messageApi.success('ส่งคำขอต่อเวลาสำเร็จ');
      } 
      else if (actionType === 'CLOSE' && onUpdateStatus) {
        await onUpdateStatus(permit.id, permit.status, 'CLOSE', values.reason);
        messageApi.success('ส่งคำขอปิดใบอนุญาตเรียบร้อย');
      }
      else if ((actionType === 'APPROVE' || actionType === 'REJECT') && onUpdateStatus) {
        await onUpdateStatus(permit.id, permit.status, actionType, values.reason);
      }
      
      form.resetFields();
      setActionType('NONE');
      onCancel();
    } catch (error) {
      messageApi.error('กรุณากรอกข้อมูลให้ครบถ้วน');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setActionType('NONE');
    form.resetFields();
    onCancel();
  };

  const renderDocumentChecklist = (docs: any) => {
    if (!docs || !Array.isArray(docs) || docs.length === 0) return <Text type="secondary" className="italic text-sm">ไม่มีข้อมูล</Text>;
    const docMap: Record<string, string> = {
      'DETAIL_AND_REQUESTOR': 'รายละเอียดงานและผู้ขอ',
      'JSEA': 'ใบวิเคราะห์ความปลอดภัย (JSEA)',
      'WORKER_LIST': 'รายชื่อผู้ปฏิบัติงาน',
      'EQUIPMENT_LIST': 'รายการเครื่องมือ/อุปกรณ์',
      'OTHER_DOCS': 'เอกสารอื่นๆ'
    };
    return (
      <div className="flex flex-wrap gap-2 mt-1">
        {docs.map((doc: string, idx: number) => (
          <Tag key={idx} color="geekblue" className="rounded-md font-bold m-0 border-blue-200 px-3 py-1">
            <CheckCircleOutlined className="mr-1" /> {docMap[doc] || doc}
          </Tag>
        ))}
      </div>
    );
  };

  const getPdfPermitTitle = (type: string) => {
    if (!type) return 'WORK PERMIT (ใบอนุญาตทำงานทั่วไป)';
    if (type.includes('HOT_WORK')) return 'HOT WORK PERMIT (ใบอนุญาตทำงานความร้อน)';
    if (type.includes('CONFINED_SPACE')) return 'CONFINED SPACE PERMIT (ใบอนุญาตเข้าที่อับอากาศ)';
    if (type.includes('WORKING_AT_HEIGHT')) return 'WORK AT HEIGHT PERMIT (ใบอนุญาตทำงานบนที่สูง)';
    if (type.includes('LIFTING')) return 'LIFTING PERMIT (ใบอนุญาตงานยก)';
    return 'WORK PERMIT (ใบอนุญาตทำงานทั่วไป)';
  };

  const displayPermitTypes = permit.permit_type ? permit.permit_type.split(',').map((t: string) => {
    if (t.startsWith('OTHER:')) return t.replace('OTHER:', 'อื่นๆ: ');
    const map: any = { 'COLD_WORK': 'งานทั่วไป', 'HOT_WORK': 'งานร้อน', 'CONFINED_SPACE': 'อับอากาศ', 'WORKING_AT_HEIGHT': 'ที่สูง', 'EXCAVATION': 'งานขุด', 'LIFTING': 'งานยก', 'ELECTRICAL': 'ไฟฟ้าแรงสูง', 'HIGH_PRESSURE': 'แรงดันสูง' };
    return map[t] || t;
  }) : [];

  return (
    <Modal title={null} open={open} onCancel={handleCloseModal} width={950} footer={null} centered destroyOnHidden={true} styles={{ body: { padding: 0, overflow: 'hidden', borderRadius: '1.5rem' } }}>
      {contextHolder}
      <style>{`
        .print-tag { white-space: normal !important; word-break: keep-all !important; }
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0 !important; padding: 0 !important; background: #fff !important; box-shadow: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-section { page-break-inside: avoid; margin-bottom: 20px !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* 🟢 Header Section */}
      <div className="bg-slate-800 p-6 md:p-8 text-white rounded-t-[24px] relative overflow-hidden no-print">
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[200px] h-[200px] bg-emerald-500/10 rounded-full blur-[60px]"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {displayPermitTypes.map((t: string, i: number) => (
                <Tag color="blue" key={i} className="border-blue-400 font-bold m-0">{t}</Tag>
              ))}
              {getStatusDisplay(permit.status)}
            </div>
            <Title level={3} className="!text-white m-0 !font-black tracking-tight leading-tight">{permit.title}</Title>
            <Text className="text-slate-300 font-medium text-sm mt-1.5 flex items-center gap-2">
              <FileTextOutlined /> เลขที่: <span className="text-white font-bold">{permit.permit_number}</span>
            </Text>
          </div>
          <Button type="primary" icon={<PrinterOutlined />} onClick={onPrint} className="bg-white/10 hover:bg-white/20 border-white/20 backdrop-blur-md rounded-xl font-bold h-11 px-5 text-white shadow-sm transition-all hover:scale-105">
            พิมพ์ PDF
          </Button>
        </div>
      </div>

      {/* 📃 Content Section */}
      <div className="max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-50">
        <div ref={documentRef} className="p-4 md:p-8 bg-white print-container">
          
          <div className="hidden print:block text-center mb-6 border-b-2 border-slate-800 pb-4">
            <h1 className="text-2xl font-black text-slate-800 m-0 uppercase tracking-widest">{getPdfPermitTitle(permit.permit_type)}</h1>
            <p className="text-sm font-bold text-slate-500 mt-1 mb-0">เลขที่อ้างอิง: {permit.permit_number}</p>
          </div>

          <div className="mb-6 print-section">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-lg print:border print:border-blue-500">1</div>
              <h3 className="m-0 font-black text-slate-800 text-lg">ข้อมูลผู้ขออนุญาตและโครงการ</h3>
            </div>
            
            <div className="bg-blue-50/30 border border-blue-100 rounded-xl overflow-hidden shadow-sm print:border-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-blue-100 print:divide-slate-300">
                <div className="p-4 md:p-5">
                  <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1">ผู้ขออนุญาต (อ้างอิงจากระบบ)</Text>
                  <div className="text-sm font-black text-slate-800">{permit.applicant?.full_name || '-'}</div>
                  <Text type="secondary" className="text-[10px] block mt-1">เบอร์โทร: {permit.applicant?.phone || '-'}</Text>
                </div>
                <div className="p-4 md:p-5 bg-white">
                  <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1">เจ้าของพื้นที่งาน</Text>
                  <div className="text-sm font-black text-slate-800">{permit.area_owner_name || '-'}</div>
                  <Text type="secondary" className="text-[10px] block mt-1">แผนก: {permit.owner_department || '-'}</Text>
                </div>
              </div>
              <Divider className="m-0 border-blue-100 print:border-slate-300" />
              <div className="p-4 md:p-5 bg-white">
                <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1"><EnvironmentOutlined className="text-rose-500 mr-1"/> สถานที่ปฏิบัติงาน</Text>
                <div className="text-sm md:text-base font-black text-slate-800">{permit.location_detail}</div>
              </div>
              <Divider className="m-0 border-blue-100 print:border-slate-300" />
              <div className="p-4 md:p-5">
                <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1"><SettingOutlined className="text-slate-500 mr-1"/> เครื่องจักรหรือเครื่องมือหลักที่ใช้</Text>
                <div className="text-sm font-black text-slate-800">{permit.machinery_tools || '-'}</div>
              </div>
              <Divider className="m-0 border-blue-100 print:border-slate-300" />
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-blue-100 print:divide-slate-300">
                <div className="p-4 md:p-5">
                  <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1"><ClockCircleOutlined className="text-amber-500 mr-1"/> ระยะเวลาปฏิบัติงาน</Text>
                  <div className="text-sm font-black text-slate-800">
                    {dayjs(permit.start_time).format('DD/MM/YYYY HH:mm')} - {dayjs(permit.end_time).format('DD/MM/YYYY HH:mm')}
                  </div>
                </div>
                <div className="p-4 md:p-5 bg-white">
                  <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1">กะการทำงาน</Text>
                  <div className="text-sm font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg inline-block print:bg-transparent print:p-0 border border-blue-200 print:border-none">
                    {permit.work_shift === 'MORNING' ? '☀️ กะเช้า (07:30 - 19:30)' : permit.work_shift === 'NIGHT' ? '🌙 กะดึก (19:30 - 07:30)' : 'ไม่ได้ระบุ'}
                  </div>
                </div>
              </div>
              <Divider className="m-0 border-blue-100 print:border-slate-300" />
              <div className="p-4 md:p-5">
                <div className="flex items-start gap-2">
                   <CheckCircleOutlined className={`text-lg ${permit.jsa_agreement ? 'text-emerald-500' : 'text-slate-300'} mt-0.5`} />
                   <Text className={`text-sm ${permit.jsa_agreement ? 'font-bold text-slate-700' : 'text-slate-500'}`}>
                     ผู้ขออนุญาตยืนยันว่าได้วิเคราะห์ JSA และแนบเอกสารรายละเอียดการทำงานมาพร้อมกันแล้ว
                   </Text>
                </div>
              </div>
            </div>
          </div>

          {/* ส่วนที่ 2: รายชื่อผู้ปฏิบัติงาน */}
          {permit.workers && permit.workers.length > 0 && (
            <div className="mb-6 print-section">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-lg print:border print:border-emerald-500">2</div>
                <h3 className="m-0 font-black text-slate-800 text-lg">รายชื่อผู้ปฏิบัติงาน <span className="text-slate-500 font-medium text-sm">({permit.workers.length} คน)</span></h3>
              </div>
              <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-4 md:p-5 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-emerald-200">
                      <th className="pb-2 font-black text-slate-600 text-xs uppercase w-12">ลำดับ</th>
                      <th className="pb-2 font-black text-slate-600 text-xs uppercase">ชื่อ-นามสกุล</th>
                      <th className="pb-2 font-black text-slate-600 text-xs uppercase">บริษัท</th>
                      <th className="pb-2 font-black text-slate-600 text-xs uppercase">ประเภทบัตร / เลขที่</th>
                      <th className="pb-2 font-black text-slate-600 text-xs uppercase">Access Card (Area/No.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permit.workers.map((w: any, i: number) => {
                      return (
                        <tr key={i} className="border-b border-emerald-100 last:border-0 bg-white hover:bg-emerald-50/50 transition-colors">
                          <td className="py-3 px-2 font-bold text-emerald-700">{i+1}</td>
                          <td className="py-3 font-bold text-slate-800">{w.worker_name}</td>
                          <td className="py-3 font-medium text-slate-600">{w.company || '-'}</td>
                          <td className="py-3">
                            <span className="text-[10px] text-slate-500 block uppercase">{w.card_type === 'CONTRACTOR' ? 'บัตร ผรม.' : 'Visitor'}</span>
                            <span className="font-medium text-slate-800 font-mono">{w.card_number || '-'}</span>
                          </td>
                          <td className="py-3">
                            <span className="font-bold text-blue-600">{w.access_area || '-'}</span> / <span className="font-bold text-slate-700">{w.access_number || '-'}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ส่วนที่ 3: เอกสารประกอบการขออนุญาต */}
          <div className="mb-6 print-section">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black text-lg print:border print:border-purple-500">3</div>
                <h3 className="m-0 font-black text-slate-800 text-lg">เอกสารประกอบการขออนุญาต</h3>
             </div>
             
             <div className="bg-purple-50/30 border border-purple-100 rounded-xl p-4 md:p-5">
                <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-2">เอกสารหลักที่แนบมา</Text>
                {renderDocumentChecklist(permit.document_checklist)}
                
                {permit.other_documents_text && (
                  <div className="mt-4">
                    <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1">เอกสารอื่นๆ เพิ่มเติม</Text>
                    <div className="text-sm font-bold text-slate-700">{permit.other_documents_text}</div>
                  </div>
                )}

                {/* ปุ่มเปิดเอกสาร (PDF/Image) */}
                {permit.attached_docs && (
                  <div className="no-print mt-5 p-4 border border-purple-200 rounded-xl bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer gap-4" onClick={() => window.open(permit.attached_docs, '_blank')}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                        <FileTextOutlined className="text-xl text-purple-600" />
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-sm">แฟ้มเอกสาร PDF ฉบับเต็ม</div>
                        <Text type="secondary" className="text-[11px] font-bold">คลิกที่นี่เพื่อเปิดดูเอกสารที่ผู้ขอแนบมา</Text>
                      </div>
                    </div>
                    <Button type="link" className="font-bold text-purple-600 px-0 w-full sm:w-auto text-left sm:text-right">เปิดดูเอกสาร</Button>
                  </div>
                )}
             </div>
          </div>

        </div>
      </div>

      {/* ⚡ Action Form (🟢 แก้ Warning useForm โดยให้ Form render ค้างไว้แต่ใช้ CSS ซ่อน) */}
      <div className={`bg-slate-100 p-6 border-t border-slate-200 animate-fade-in shadow-[inset_0_4px_10px_rgba(0,0,0,0.02)] no-print ${actionType === 'NONE' ? 'hidden' : 'block'}`}>
        <Form form={form} layout="vertical">
          {actionType === 'APPROVE' && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-yellow-800 text-sm">
              <b>ยืนยันการอนุมัติ:</b> กรุณาตรวจสอบเอกสารแนบ (JSA) และข้อมูลผู้ปฏิบัติงานว่าครบถ้วนและถูกต้องตามระเบียบความปลอดภัยก่อนกดอนุมัติ
            </div>
          )}
          
          <Form.Item name="reason" label={<span className="font-black text-slate-800">{actionType === 'REJECT' ? 'เหตุผลที่ไม่อนุมัติ (บังคับ)' : 'ความคิดเห็นเพิ่มเติม (ถ้ามี)'}</span>} rules={[{ required: actionType === 'REJECT', message: 'กรุณาระบุเหตุผล' }]} className="mb-4">
            <Input.TextArea rows={3} className="rounded-xl border-slate-300 focus:border-blue-400 shadow-sm" placeholder="พิมพ์รายละเอียดที่นี่..." />
          </Form.Item>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={() => setActionType('NONE')} className="rounded-xl font-bold h-11 px-6 text-slate-500 hover:bg-slate-200 border-transparent bg-slate-200/50">ยกเลิก</Button>
            <Button type="primary" onClick={handleActionSubmit} loading={isSubmitting} className={`rounded-xl font-black h-11 px-8 w-full sm:w-auto ${actionType === 'REJECT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'} shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-transform hover:scale-105`}>
              ยืนยันการทำรายการ
            </Button>
          </div>
        </Form>
      </div>

      {actionType === 'NONE' && (
        <div className="bg-white p-5 md:px-8 border-t border-slate-100 rounded-b-[24px] flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
          <Text type="secondary" className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-2 py-1 rounded w-full sm:w-auto text-center sm:text-left">Ref: {permit.id?.substring(0,8)}</Text>
          
          <Space wrap className="justify-center sm:justify-end w-full sm:w-auto">
            {canApprove && (
              <>
                <Button icon={<CloseCircleOutlined />} onClick={() => setActionType('REJECT')} className="h-11 rounded-xl font-bold text-rose-600 border-rose-200 hover:bg-rose-50 shadow-sm w-full sm:w-auto">
                  ไม่อนุมัติ (Reject)
                </Button>
                <Button type="primary" icon={<SafetyOutlined />} onClick={() => setActionType('APPROVE')} className="h-11 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 px-8 shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-transform hover:scale-105 w-full sm:w-auto">
                  ตรวจสอบและอนุมัติ
                </Button>
              </>
            )}
          </Space>
        </div>
      )}
    </Modal>
  );
}