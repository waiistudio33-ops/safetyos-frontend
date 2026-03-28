import React, { useState } from 'react';
import { Modal, Tag, Button, Divider, Space, Typography, Checkbox, Form, Input, DatePicker, message, Row, Col } from 'antd';
import { 
  PrinterOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  SafetyOutlined, ClockCircleOutlined, LockOutlined, EnvironmentOutlined,
  TeamOutlined, WarningOutlined, FileTextOutlined, IdcardOutlined, DashboardOutlined
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
  open, onCancel, permit, gasLogs, documentRef, onPrint, 
  getStatusDisplay, getPermitTypeDisplay, onUpdateStatus, onExtendPermit, currentUser 
}: PermitDetailModalProps) {
  
  const [form] = Form.useForm();
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
        message.success('ส่งคำขอต่อเวลาสำเร็จ');
      } 
      else if (actionType === 'CLOSE' && onUpdateStatus) {
        await onUpdateStatus(permit.id, permit.status, 'CLOSE', values.reason);
        message.success('ส่งคำขอปิดใบอนุญาตเรียบร้อย');
      }
      else if ((actionType === 'APPROVE' || actionType === 'REJECT') && onUpdateStatus) {
        await onUpdateStatus(permit.id, permit.status, actionType, values.reason);
      }
      
      form.resetFields();
      setActionType('NONE');
      onCancel();
    } catch (error) {
      message.error('กรุณากรอกข้อมูลให้ครบถ้วน');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setActionType('NONE');
    form.resetFields();
    onCancel();
  };

  const renderJsonList = (data: any, color: string = 'blue') => {
    if (!data || !Array.isArray(data) || data.length === 0) return <Text type="secondary" className="italic text-sm">ไม่ได้ระบุ</Text>;
    return (
      <div className="flex flex-wrap gap-2 mt-1">
        {data.map((item: string, index: number) => {
          let translated = item;
          const dictionary: Record<string, string> = {
            'GRINDING': 'เจียร / ตัด', 'ARC_WELDING': 'เชื่อมไฟฟ้า', 'GAS_WELDING': 'เชื่อมแก๊ส', 'DRILLING': 'เจาะ / ขุด',
            'HARD_HAT': 'หมวกนิรภัย', 'SAFETY_SHOES': 'รองเท้านิรภัย', 'WELDING_MASK': 'หน้ากากเชื่อม', 'WELDING_GLOVES': 'ถุงมือหนัง',
            'FIRE_SUIT': 'ชุดกันสะเก็ดไฟ', 'EAR_PLUG': 'ที่อุดหู', 'RESPIRATOR': 'หน้ากากกันสารเคมี',
            'FULL_BODY_HARNESS': 'เข็มขัดนิรภัยเต็มตัว', 'LIFELINE': 'สายช่วยชีวิต', 'GLOVES': 'ถุงมือกันบาด',
            'SCBA': 'SCBA', 'RESCUE_TRIPOD': 'สามขากู้ภัย', 'GAS_DETECTOR': 'เครื่องวัดก๊าซพกพา', 'SAFETY_HARNESS': 'เข็มขัดกู้ภัย',
            'SCAFFOLD': 'นั่งร้านตรวจสอบแล้ว', 'GUARD_RAIL': 'ราวกันตก', 'ANCHOR_POINT': 'จุดยึดเข็มขัด', 'SAFETY_NET': 'ตาข่ายกันตก', 'BARRICADE': 'กั้นพื้นที่'
          };
          if (dictionary[item]) translated = dictionary[item];
          else translated = item.replace(/_/g, ' ');

          return (
            <Tag key={index} color={color} className="rounded-md font-bold m-0 border border-opacity-30 shadow-sm text-[12px] px-3 py-1 whitespace-normal print-tag">
              {translated}
            </Tag>
          );
        })}
      </div>
    );
  };

  // 🟢 Helper function สำหรับหน้าพิมพ์
  const getPdfPermitTitle = (type: string) => {
    switch (type) {
      case 'HOT_WORK': return 'HOT WORK PERMIT (ใบอนุญาตทำงานความร้อน)';
      case 'CONFINED_SPACE': return 'CONFINED SPACE PERMIT (ใบอนุญาตเข้าที่อับอากาศ)';
      case 'WORKING_AT_HEIGHT': return 'WORK AT HEIGHT PERMIT (ใบอนุญาตทำงานบนที่สูง)';
      case 'ELECTRICAL': return 'ELECTRICAL WORK PERMIT (ใบอนุญาตทำงานไฟฟ้า)';
      case 'EXCAVATION': return 'EXCAVATION PERMIT (ใบอนุญาตงานขุดเจาะ)';
      default: return 'WORK PERMIT (ใบอนุญาตทำงาน)';
    }
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={handleCloseModal}
      width={950}
      footer={null}
      centered
      destroyOnClose
      styles={{ body: { padding: 0, overflow: 'hidden', borderRadius: '1.5rem' } }}
    >
      <style>{`
        .print-tag {
          white-space: normal !important;
          word-break: keep-all !important;
        }
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          body * { visibility: hidden; }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            box-shadow: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-section {
            page-break-inside: avoid;
            margin-bottom: 20px !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* 🟢 Header Section */}
      <div className="bg-slate-800 p-6 md:p-8 text-white rounded-t-[24px] relative overflow-hidden no-print">
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[200px] h-[200px] bg-emerald-500/10 rounded-full blur-[60px]"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {getPermitTypeDisplay(permit.permit_type)}
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
            {/* 🟢 เปลี่ยน Title PDF ให้ตรงกับประเภทงานจริง */}
            <h1 className="text-2xl font-black text-slate-800 m-0 uppercase tracking-widest">{getPdfPermitTitle(permit.permit_type)}</h1>
            <p className="text-sm font-bold text-slate-500 mt-1 mb-0">เลขที่อ้างอิง: {permit.permit_number}</p>
          </div>

          {/* ส่วนที่ 1: ข้อมูลผู้ขออนุญาต & โครงการ */}
          <div className="mb-6 print-section">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-lg print:border print:border-blue-500">1</div>
              <h3 className="m-0 font-black text-slate-800 text-lg">ข้อมูลผู้ขออนุญาตและโครงการ</h3>
            </div>
            
            <div className="bg-blue-50/30 border border-blue-100 rounded-xl overflow-hidden shadow-sm print:border-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-blue-100 print:divide-slate-300">
                <div className="p-4 md:p-5">
                  <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1">ผู้ขออนุญาต</Text>
                  <div className="text-sm font-black text-slate-800">{permit.applicant?.full_name || '-'}</div>
                </div>
                <div className="p-4 md:p-5 bg-white">
                  <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1">เบอร์โทรติดต่อ</Text>
                  <div className="text-sm font-black text-slate-800">{permit.applicant_phone || '-'}</div>
                </div>
              </div>
              <Divider className="m-0 border-blue-100 print:border-slate-300" />
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-blue-100 print:divide-slate-300">
                <div className="p-4 md:p-5 bg-white">
                  <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1">บริษัทผู้รับเหมา</Text>
                  <div className="text-sm font-black text-slate-800">{permit.contractor_company || permit.applicant?.department || '-'}</div>
                </div>
                <div className="p-4 md:p-5">
                  <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1">ผู้จัดการโครงการ</Text>
                  <div className="text-sm font-black text-slate-800">{permit.project_manager || '-'}</div>
                </div>
              </div>
              <Divider className="m-0 border-blue-100 print:border-slate-300" />
              <div className="p-4 md:p-5">
                <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1"><EnvironmentOutlined className="text-rose-500 mr-1"/> สถานที่ปฏิบัติงาน</Text>
                <div className="text-sm md:text-base font-black text-slate-800">{permit.location_detail}</div>
              </div>
              <Divider className="m-0 border-blue-100 print:border-slate-300" />
              <div className="p-4 md:p-5 bg-white">
                <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1"><ClockCircleOutlined className="text-amber-500 mr-1"/> ระยะเวลาปฏิบัติงาน</Text>
                <div className="text-sm font-black text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg inline-block print:bg-transparent print:p-0">
                  {dayjs(permit.start_time).format('DD/MM/YYYY HH:mm')} น. &nbsp;—&nbsp; {dayjs(permit.end_time).format('DD/MM/YYYY HH:mm')} น.
                </div>
              </div>
              <Divider className="m-0 border-blue-100 print:border-slate-300" />
              <div className="p-4 md:p-5">
                <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1">รายละเอียดงาน</Text>
                <div className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">{permit.description || '-'}</div>
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
              <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-4 md:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {permit.workers.map((w: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-emerald-100 shadow-sm print:shadow-none print:border-slate-300">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold print:border print:border-emerald-400">{i+1}</div>
                      <span className="font-bold text-slate-700 text-sm truncate print:whitespace-normal">{w.worker_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ส่วนที่ 3: มาตรการเฉพาะงาน (Hazard Details) */}
          <div className="mb-6 print-section">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-black text-lg print:border print:border-rose-500">3</div>
              <h3 className="m-0 font-black text-slate-800 text-lg">มาตรการเฉพาะงาน (Hazard Details)</h3>
            </div>
            
            <div className="bg-rose-50/30 border border-rose-100 rounded-xl overflow-hidden shadow-sm print:border-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-rose-100 print:divide-slate-300">
                {permit.contractor_supervisor && (
                  <div className="p-4 md:p-5 bg-white">
                    <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1">หัวหน้างาน</Text>
                    <div className="text-sm font-black text-slate-800">{permit.contractor_supervisor}</div>
                  </div>
                )}
                {permit.supervisor_name && (
                  <div className="p-4 md:p-5 bg-white">
                    <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1">ผู้ควบคุมอับอากาศ</Text>
                    <div className="text-sm font-black text-slate-800">{permit.supervisor_name}</div>
                  </div>
                )}
                {permit.gas_tester_name && (
                  <div className="p-4 md:p-5">
                    <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1">ผู้ตรวจวัดก๊าซ</Text>
                    <div className="text-sm font-black text-slate-800">{permit.gas_tester_name}</div>
                  </div>
                )}
                {permit.standby_person_name && (
                  <div className="p-4 md:p-5">
                    <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1">ผู้เฝ้าระวัง</Text>
                    <div className="text-sm font-black text-slate-800">{permit.standby_person_name}</div>
                  </div>
                )}
                {permit.rescuer_name && (
                  <div className="p-4 md:p-5 bg-white">
                    <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1">ผู้ช่วยเหลือ</Text>
                    <div className="text-sm font-black text-slate-800">{permit.rescuer_name}</div>
                  </div>
                )}
                {permit.communication_method && (
                  <div className="p-4 md:p-5 bg-white">
                    <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1">สื่อสารฉุกเฉิน</Text>
                    <div className="text-sm font-black text-slate-800">{permit.communication_method}</div>
                  </div>
                )}
                {permit.height_level && (
                  <div className="p-4 md:p-5">
                    <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1">ระดับความสูง</Text>
                    <div className="text-sm font-black text-slate-800">{permit.height_level} เมตร</div>
                  </div>
                )}
                {permit.is_med_cert_verified !== undefined && permit.permit_type === 'CONFINED_SPACE' && (
                  <div className="p-4 md:p-5">
                    <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-1">การตรวจสุขภาพ</Text>
                    <div className="text-sm font-black text-slate-800">
                      {permit.is_med_cert_verified ? <Tag color="success" className="font-bold border-emerald-300 print:text-emerald-700 print:bg-transparent print:border-none print:p-0"><CheckCircleOutlined /> ผ่านการตรวจแล้ว (Fit to Work)</Tag> : <Tag color="error">ยังไม่ตรวจ</Tag>}
                    </div>
                  </div>
                )}
              </div>

              {/* Checklists (ใช้พื้นที่เต็มแถว) */}
              <Divider className="m-0 border-rose-100 print:border-slate-300" />
              {['HOT_WORK'].includes(permit.permit_type) && (
                <div className="p-4 md:p-5 bg-white">
                  <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-2">ลักษณะงานย่อย</Text>
                  {renderJsonList(permit.work_sub_type, 'orange')}
                </div>
              )}
              {['WORKING_AT_HEIGHT'].includes(permit.permit_type) && (
                <div className="p-4 md:p-5 bg-white">
                  <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-2">มาตรการที่เตรียมไว้</Text>
                  {renderJsonList(permit.safety_measures, 'blue')}
                </div>
              )}
              {permit.permit_type !== 'COLD_WORK' && (
                <>
                  <Divider className="m-0 border-rose-100 print:border-slate-300" />
                  <div className="p-4 md:p-5">
                    <Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest block mb-2">PPE ที่บังคับใช้</Text>
                    {renderJsonList(permit.ppe_required, 'purple')}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ส่วนที่ 4: เอกสารแนบ LOTO และ ประวัติก๊าซ */}
          {permit.is_loto_required && (
            <div className="mb-6 print-section">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black text-sm print:border print:border-purple-500"><LockOutlined /></div>
                <h4 className="m-0 font-black text-slate-800 text-base">การตัดแยกพลังงาน (LOTO)</h4>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-white border border-purple-200 rounded-xl p-5 shadow-sm print:bg-white print:shadow-none print:border-slate-300">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Text type="secondary" className="text-[10px] font-black uppercase tracking-widest text-purple-600/70 print:text-slate-500 block mb-1">จุดตัดแยก (Isolation Point)</Text>
                    <Text strong className="text-sm bg-white px-3 py-1 rounded-md border border-purple-100 print:border-none print:p-0">{permit.loto_records?.[0]?.isolation_point || '-'}</Text>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Text type="secondary" className="text-[10px] font-black uppercase tracking-widest text-purple-600/70 print:text-slate-500 block mb-1">ประเภทพลังงาน</Text>
                    <Text strong className="text-sm bg-white px-3 py-1 rounded-md border border-purple-100 print:border-none print:p-0">{permit.loto_records?.[0]?.energy_type || '-'}</Text>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Text type="secondary" className="text-[10px] font-black uppercase tracking-widest text-purple-600/70 print:text-slate-500 block mb-1">หมายเลขแม่กุญแจ (Lock No.)</Text>
                    <Text strong className="text-sm bg-white px-3 py-1 rounded-md border border-purple-100 print:border-none print:p-0">{permit.loto_records?.[0]?.lock_number || '-'}</Text>
                  </Col>
                </Row>
              </div>
            </div>
          )}

          {gasLogs && gasLogs.length > 0 && (
            <div className="mb-6 print-section">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-sm print:border print:border-emerald-500"><DashboardOutlined /></div>
                <h4 className="m-0 font-black text-slate-800 text-base">ประวัติวัดสภาพอากาศ (Gas Tests)</h4>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 print:bg-white print:border-slate-300">
                {gasLogs.map((log: any, idx: number) => (
                  <div key={idx} className="flex flex-wrap items-center justify-between border-b border-emerald-100 pb-3 mb-3 last:border-0 last:mb-0 last:pb-0 gap-3 print:border-slate-300">
                    <Text className="font-bold text-slate-700 text-sm flex items-center gap-1.5"><ClockCircleOutlined className="text-emerald-500" /> {dayjs(log.recorded_at).format('DD/MM/YYYY HH:mm')}</Text>
                    <Space size="small" wrap>
                      <Tag color={log.o2_level >= 19.5 && log.o2_level <= 23.5 ? 'success' : 'error'} className="m-0 font-bold border-transparent shadow-sm print:border-slate-400 print:text-slate-800">O2: {log.o2_level}%</Tag>
                      <Tag color={log.lel_level < 10 ? 'success' : 'error'} className="m-0 font-bold border-transparent shadow-sm print:border-slate-400 print:text-slate-800">LEL: {log.lel_level}%</Tag>
                      <Tag color={log.co_level < 25 ? 'success' : 'error'} className="m-0 font-bold border-transparent shadow-sm print:border-slate-400 print:text-slate-800">CO: {log.co_level || 0}</Tag>
                      <Tag color={log.h2s_level < 10 ? 'success' : 'error'} className="m-0 font-bold border-transparent shadow-sm print:border-slate-400 print:text-slate-800">H2S: {log.h2s_level || 0}</Tag>
                    </Space>
                  </div>
                ))}
              </div>
            </div>
          )}

          {permit.extensions && permit.extensions.length > 0 && (
            <div className="mb-6 print-section">
              <Divider orientation="left" className="m-0 mb-4 border-slate-200"><span className="font-black text-indigo-700 text-lg">ประวัติการขอต่อเวลา (Extensions)</span></Divider>
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 print:bg-white print:border-slate-300">
                {permit.extensions.map((ext: any, idx: number) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-indigo-100 pb-3 mb-3 last:border-0 last:mb-0 last:pb-0 gap-2 print:border-slate-300">
                    <div>
                      <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-1 print:text-slate-500">ครั้งที่ {idx + 1} | วันที่ขอ: {dayjs(ext.request_date).format('DD/MM/YYYY')}</Text>
                      <Text strong className="text-indigo-900 text-sm block print:text-slate-800">ขยายเวลาสิ้นสุดถึง: <span className="bg-indigo-100 px-2 py-0.5 rounded text-indigo-700 print:bg-transparent print:px-0">{dayjs(ext.new_end_time).format('DD/MM/YYYY HH:mm น.')}</span></Text>
                      <Text type="secondary" className="text-xs mt-1 block">เหตุผล: {ext.action_details}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {permit.attached_file && (
             <div className="no-print mt-6 p-4 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-white flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer gap-4" onClick={() => window.open(permit.attached_file, '_blank')}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <FileTextOutlined className="text-xl text-blue-600" />
                  </div>
                  <div>
                    <div className="font-black text-slate-800 text-sm">เอกสารแนบ JSA / แบบฟอร์มสแกน</div>
                    <Text type="secondary" className="text-[11px] font-bold">คลิกที่นี่เพื่อเปิดดูเอกสารฉบับเต็ม</Text>
                  </div>
                </div>
                <Button type="link" className="font-bold text-blue-600 px-0 w-full sm:w-auto text-left sm:text-right">เปิดดูเอกสาร</Button>
             </div>
          )}

        </div>
      </div>

      {/* ⚡ Action Form */}
      {actionType !== 'NONE' && (
        <div className="bg-slate-100 p-6 border-t border-slate-200 animate-fade-in shadow-[inset_0_4px_10px_rgba(0,0,0,0.02)] no-print">
          <Form form={form} layout="vertical">
            
            {actionType === 'EXTEND' && (
              <Form.Item name="new_end_time" label={<span className="font-black text-slate-800">ขอขยายเวลาถึง (วันที่และเวลาใหม่)</span>} rules={[{ required: true, message: 'กรุณาระบุเวลาใหม่' }]}>
                <DatePicker showTime format="YYYY-MM-DD HH:mm" size="large" className="w-full rounded-xl border-slate-300 shadow-sm" />
              </Form.Item>
            )}

            {actionType === 'CLOSE' && (
              <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 mb-5 shadow-sm">
                <Form.Item name="is_housekeeping_done" valuePropName="checked" rules={[{ validator: (_, val) => val ? Promise.resolve() : Promise.reject('ต้องยืนยันการเคลียร์พื้นที่') }]} className="m-0">
                  <Checkbox className="font-black text-emerald-900 text-sm md:text-base flex items-start">
                    <span className="leading-snug block pt-1">ข้าพเจ้ายืนยันว่างานเสร็จสิ้น นำเครื่องจักรออก และเคลียร์พื้นที่เรียบร้อย ปลอดภัย 100%</span>
                  </Checkbox>
                </Form.Item>
              </div>
            )}

            <Form.Item 
              name="reason" 
              label={<span className="font-black text-slate-800">{actionType === 'EXTEND' ? 'เหตุผลที่ขอต่อเวลา' : actionType === 'CLOSE' ? 'สรุปผลการทำงาน (ระบุปัญหาถ้ามี)' : 'ความคิดเห็น (ถ้าไม่อนุมัติ กรุณาระบุเหตุผล)'}</span>} 
              rules={[{ required: actionType === 'REJECT' || actionType === 'EXTEND', message: 'กรุณาระบุเหตุผล' }]}
              className="mb-4"
            >
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
      )}

      {actionType === 'NONE' && (
        <div className="bg-white p-5 md:px-8 border-t border-slate-100 rounded-b-[24px] flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
          <Text type="secondary" className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-2 py-1 rounded w-full sm:w-auto text-center sm:text-left">Ref: {permit.id.substring(0,8)}</Text>
          
          <Space wrap className="justify-center sm:justify-end w-full sm:w-auto">
            {canExtendOrClose && (
              <>
                <Button icon={<ClockCircleOutlined />} onClick={() => setActionType('EXTEND')} className="h-11 rounded-xl font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 shadow-sm w-full sm:w-auto">
                  ขอต่อเวลา
                </Button>
                <Button icon={<LockOutlined />} onClick={() => setActionType('CLOSE')} className="h-11 rounded-xl font-black text-slate-700 border-slate-300 hover:bg-slate-100 shadow-sm transition-all hover:border-slate-400 w-full sm:w-auto">
                  ขอปิดใบอนุญาต
                </Button>
              </>
            )}

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