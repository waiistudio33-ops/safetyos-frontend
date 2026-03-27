import React, { useState } from 'react';
import { Modal, Descriptions, Tag, Button, Divider, Space, Typography, Checkbox, Form, Input, DatePicker, message, Row, Col } from 'antd';
import { 
  PrinterOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  SafetyOutlined, ClockCircleOutlined, LockOutlined, EnvironmentOutlined,
  TeamOutlined, WarningOutlined, FileTextOutlined
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

  // ตรวจสอบสิทธิ์การกดปุ่ม
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
        // ขอต่อเวลา ต้องมีเวลาใหม่ส่งไปด้วย
        const newTime = values.new_end_time.toISOString();
        await onExtendPermit(permit.id, newTime, values.reason);
        message.success('ส่งคำขอต่อเวลาสำเร็จ');
      } 
      else if (actionType === 'CLOSE' && onUpdateStatus) {
        // ขอปิดงาน
        await onUpdateStatus(permit.id, permit.status, 'CLOSE', values.reason);
        message.success('ส่งคำขอปิดใบอนุญาตเรียบร้อย');
      }
      else if ((actionType === 'APPROVE' || actionType === 'REJECT') && onUpdateStatus) {
        // อนุมัติ / ไม่อนุมัติ
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

  // Helper: เรนเดอร์ JSON Array เป็น Tag สีสวยๆ
  const renderJsonList = (data: any, color: string = 'blue') => {
    if (!data || !Array.isArray(data) || data.length === 0) return <Text type="secondary">-</Text>;
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {data.map((item: string, index: number) => (
          <Tag key={index} color={color} className="rounded-md font-bold m-0 border-opacity-50">
            {item.replace(/_/g, ' ')}
          </Tag>
        ))}
      </div>
    );
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={handleCloseModal}
      width={900}
      footer={null}
      centered
      destroyOnClose
      styles={{ body: { padding: 0, overflow: 'hidden', borderRadius: '1.5rem' } }}
    >
      {/* 🟢 Header Section */}
      <div className="bg-slate-800 p-6 md:p-8 text-white rounded-t-[24px] relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[80px]"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {getPermitTypeDisplay(permit.permit_type)}
              {getStatusDisplay(permit.status)}
            </div>
            <Title level={3} className="!text-white m-0 !font-black tracking-tight">{permit.title}</Title>
            <Text className="text-slate-300 font-medium text-sm mt-1 block">เลขที่: {permit.permit_number}</Text>
          </div>
          <Button type="primary" icon={<PrinterOutlined />} onClick={onPrint} className="bg-white/20 hover:bg-white/30 border-none backdrop-blur-md rounded-xl font-bold h-10 text-white shadow-sm">
            พิมพ์ / บันทึก PDF
          </Button>
        </div>
      </div>

      {/* 📃 Content Section (พื้นที่ที่จะปรินต์ลง PDF) */}
      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-50">
        <div ref={documentRef} className="p-6 md:p-8 bg-white print-container">
          
          {/* ส่วนที่ 1: ข้อมูลผู้รับเหมา & โครงการ */}
          <Divider orientation="left" className="m-0 mb-4 border-slate-200"><span className="font-black text-blue-800 text-lg">1. ข้อมูลผู้ขออนุญาต / โครงการ</span></Divider>
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small" className="mb-6 bg-white shadow-sm rounded-lg overflow-hidden font-medium">
            <Descriptions.Item label="ผู้ขออนุญาต">{permit.applicant?.full_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="เบอร์โทรติดต่อ">{permit.applicant_phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="บริษัทผู้รับเหมา">{permit.contractor_company || permit.applicant?.department || '-'}</Descriptions.Item>
            <Descriptions.Item label="ผู้จัดการโครงการ">{permit.project_manager || '-'}</Descriptions.Item>
            <Descriptions.Item label="สถานที่ปฏิบัติงาน" span={2}>
              <EnvironmentOutlined className="text-rose-500 mr-1"/> {permit.location_detail}
            </Descriptions.Item>
            <Descriptions.Item label="ระยะเวลา">
              {dayjs(permit.start_time).format('DD/MM/YYYY HH:mm')} - {dayjs(permit.end_time).format('HH:mm')} น.
            </Descriptions.Item>
            <Descriptions.Item label="รายละเอียดงาน">{permit.description || '-'}</Descriptions.Item>
          </Descriptions>

          {/* ส่วนที่ 2: รายชื่อผู้ปฏิบัติงาน */}
          {permit.workers && permit.workers.length > 0 && (
            <>
              <Divider orientation="left" className="m-0 mb-4 border-slate-200"><span className="font-black text-slate-800 text-lg">2. รายชื่อผู้ปฏิบัติงาน ({permit.workers.length} คน)</span></Divider>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {permit.workers.map((w: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <TeamOutlined className="text-blue-500"/> {i+1}. {w.worker_name}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ส่วนที่ 3: มาตรการเฉพาะงาน (Hazard Details) */}
          <Divider orientation="left" className="m-0 mb-4 border-slate-200"><span className="font-black text-rose-700 text-lg">3. มาตรการเฉพาะงาน (Hazard Details)</span></Divider>
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small" className="mb-6 bg-white shadow-sm rounded-lg overflow-hidden font-medium">
            {permit.contractor_supervisor && <Descriptions.Item label="หัวหน้างาน (ผู้ควบคุม)">{permit.contractor_supervisor}</Descriptions.Item>}
            {permit.supervisor_name && <Descriptions.Item label="ผู้ควบคุมงานอับอากาศ">{permit.supervisor_name}</Descriptions.Item>}
            {permit.gas_tester_name && <Descriptions.Item label="ผู้ตรวจสภาพอากาศ">{permit.gas_tester_name}</Descriptions.Item>}
            {permit.standby_person_name && <Descriptions.Item label="ผู้เฝ้าระวัง">{permit.standby_person_name}</Descriptions.Item>}
            {permit.rescuer_name && <Descriptions.Item label="ผู้ช่วยเหลือ">{permit.rescuer_name}</Descriptions.Item>}
            {permit.communication_method && <Descriptions.Item label="ช่องทางสื่อสารฉุกเฉิน">{permit.communication_method}</Descriptions.Item>}
            {permit.height_level && <Descriptions.Item label="ความสูง (เมตร)">{permit.height_level} เมตร</Descriptions.Item>}
            
            {permit.is_med_cert_verified !== undefined && (
              <Descriptions.Item label="ใบรับรองแพทย์">
                {permit.is_med_cert_verified ? <Tag color="success" className="font-bold">ผ่านการตรวจ (Fit to Work)</Tag> : <Text type="secondary">ไม่ได้ระบุ</Text>}
              </Descriptions.Item>
            )}
            
            {/* แสดง JSON Checklists */}
            <Descriptions.Item label="ลักษณะงานย่อย" span={2}>{renderJsonList(permit.work_sub_type, 'orange')}</Descriptions.Item>
            <Descriptions.Item label="มาตรการความปลอดภัย" span={2}>{renderJsonList(permit.safety_measures, 'blue')}</Descriptions.Item>
            <Descriptions.Item label="PPE ที่บังคับใช้" span={2}>{renderJsonList(permit.ppe_required, 'purple')}</Descriptions.Item>
          </Descriptions>

          {/* ส่วนที่ 4: เอกสารแนบ LOTO และ ประวัติก๊าซ */}
          {permit.is_loto_required && (
            <>
              <Divider orientation="left" className="m-0 mb-4 border-slate-200"><span className="font-black text-purple-700 text-lg">4. การตัดแยกพลังงาน (LOTO)</span></Divider>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                <Row gutter={[16, 8]}>
                  <Col xs={24} sm={8}><Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest">จุดตัดแยก:</Text><br/><Text strong>{permit.loto_records?.[0]?.isolation_point || '-'}</Text></Col>
                  <Col xs={24} sm={8}><Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest">พลังงาน:</Text><br/><Text strong>{permit.loto_records?.[0]?.energy_type || '-'}</Text></Col>
                  <Col xs={24} sm={8}><Text type="secondary" className="text-[11px] font-bold uppercase tracking-widest">Lock No.:</Text><br/><Text strong>{permit.loto_records?.[0]?.lock_number || '-'}</Text></Col>
                </Row>
              </div>
            </>
          )}

          {gasLogs && gasLogs.length > 0 && (
            <>
              <Divider orientation="left" className="m-0 mb-4 border-slate-200"><span className="font-black text-emerald-700 text-lg">ประวัติวัดสภาพอากาศ (Gas Tests)</span></Divider>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                {gasLogs.map((log: any, idx: number) => (
                  <div key={idx} className="flex flex-wrap items-center justify-between border-b border-emerald-200/50 pb-2 mb-2 last:border-0 last:mb-0 last:pb-0 gap-2">
                    <Text className="font-bold text-slate-700 text-sm"><ClockCircleOutlined /> {dayjs(log.recorded_at).format('DD/MM/BB HH:mm')}</Text>
                    <Space size="small" wrap>
                      <Tag color={log.o2_level >= 19.5 && log.o2_level <= 23.5 ? 'success' : 'error'} className="m-0 font-bold">O2: {log.o2_level}%</Tag>
                      <Tag color={log.lel_level < 10 ? 'success' : 'error'} className="m-0 font-bold">LEL: {log.lel_level}%</Tag>
                      <Tag color={log.co_level < 25 ? 'success' : 'error'} className="m-0 font-bold">CO: {log.co_level || 0}</Tag>
                      <Tag color={log.h2s_level < 10 ? 'success' : 'error'} className="m-0 font-bold">H2S: {log.h2s_level || 0}</Tag>
                    </Space>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ส่วนที่ 5: ประวัติการต่อเวลา (ถ้ามี) */}
          {permit.extensions && permit.extensions.length > 0 && (
            <>
              <Divider orientation="left" className="m-0 mb-4 border-slate-200"><span className="font-black text-blue-700 text-lg">ประวัติการขอต่อเวลา (Extensions)</span></Divider>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                {permit.extensions.map((ext: any, idx: number) => (
                  <div key={idx} className="flex items-start justify-between border-b border-blue-200/50 pb-2 mb-2 last:border-0 last:mb-0 last:pb-0 text-sm">
                    <div>
                      <Text strong className="text-blue-800 block">ขอต่อเวลาถึง: {dayjs(ext.new_end_time).format('DD/MM/BB HH:mm น.')}</Text>
                      <Text type="secondary">เหตุผล: {ext.action_details}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {/* ข้อมูลเอกสารแนบ */}
          {permit.attached_file && (
             <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileTextOutlined className="text-2xl text-blue-500" />
                  <div>
                    <div className="font-bold text-slate-700 text-sm">เอกสาร JSA / สแกนแบบฟอร์ม</div>
                    <a href={permit.attached_file} target="_blank" rel="noreferrer" className="text-xs text-blue-600">คลิกเพื่อดูเอกสารแนบ</a>
                  </div>
                </div>
             </div>
          )}

        </div>
      </div>

      {/* ⚡ Action Form (ซ่อน/โชว์ตามปุ่มที่กด) */}
      {actionType !== 'NONE' && (
        <div className="bg-slate-100 p-6 border-t border-slate-200 animate-fade-in">
          <Form form={form} layout="vertical">
            
            {actionType === 'EXTEND' && (
              <Form.Item name="new_end_time" label={<span className="font-black text-slate-700">ขอขยายเวลาถึง (วันที่และเวลาใหม่)</span>} rules={[{ required: true, message: 'กรุณาระบุเวลาใหม่' }]}>
                <DatePicker showTime format="YYYY-MM-DD HH:mm" size="large" className="w-full rounded-xl" />
              </Form.Item>
            )}

            {actionType === 'CLOSE' && (
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 mb-4 shadow-sm">
                <Form.Item name="is_housekeeping_done" valuePropName="checked" rules={[{ validator: (_, val) => val ? Promise.resolve() : Promise.reject('ต้องยืนยันการเคลียร์พื้นที่') }]} className="m-0">
                  <Checkbox className="font-black text-slate-800 text-sm md:text-base">
                    ข้าพเจ้ายืนยันว่างานเสร็จสิ้น นำเครื่องจักรออก และเคลียร์พื้นที่เรียบร้อย ปลอดภัย 100%
                  </Checkbox>
                </Form.Item>
              </div>
            )}

            <Form.Item 
              name="reason" 
              label={<span className="font-black text-slate-700">{actionType === 'EXTEND' ? 'เหตุผลที่ขอต่อเวลา' : actionType === 'CLOSE' ? 'สรุปผลการทำงาน (ระบุปัญหาถ้ามี)' : 'ความคิดเห็น (ถ้าไม่อนุมัติ กรุณาระบุเหตุผล)'}</span>} 
              rules={[{ required: actionType === 'REJECT' || actionType === 'EXTEND', message: 'กรุณาระบุเหตุผล' }]}
              className="mb-4"
            >
              <Input.TextArea rows={3} className="rounded-xl border-slate-300 focus:border-blue-400" />
            </Form.Item>
            
            <div className="flex justify-end gap-3 mt-4">
              <Button onClick={() => setActionType('NONE')} className="rounded-xl font-bold h-10">ยกเลิก</Button>
              <Button type="primary" onClick={handleActionSubmit} loading={isSubmitting} className={`rounded-xl font-black h-10 px-8 ${actionType === 'REJECT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'} shadow-md`}>
                ยืนยันการทำรายการ
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* 🕹️ Footer Action Buttons */}
      {actionType === 'NONE' && (
        <div className="bg-white p-5 md:px-8 border-t border-slate-100 rounded-b-[24px] flex flex-wrap items-center justify-between gap-4">
          <Text type="secondary" className="text-[10px] font-bold uppercase tracking-widest">Ref: {permit.id.substring(0,8)}</Text>
          
          <Space wrap className="justify-end w-full sm:w-auto">
            {/* ฝั่งผู้รับเหมา: ขอต่ออายุ หรือ ขอปิดงาน */}
            {canExtendOrClose && (
              <>
                <Button icon={<ClockCircleOutlined />} onClick={() => setActionType('EXTEND')} className="h-10 rounded-xl font-bold text-purple-600 border-purple-200 hover:bg-purple-50">
                  ขอต่อเวลา (Extend)
                </Button>
                <Button icon={<LockOutlined />} onClick={() => setActionType('CLOSE')} className="h-10 rounded-xl font-black text-slate-700 border-slate-300 hover:bg-slate-100 shadow-sm">
                  ขอปิดใบอนุญาต (Close)
                </Button>
              </>
            )}

            {/* ฝั่ง Safety/Owner: อนุมัติ หรือ ไม่อนุมัติ */}
            {canApprove && (
              <>
                <Button icon={<CloseCircleOutlined />} onClick={() => setActionType('REJECT')} className="h-10 rounded-xl font-bold text-rose-600 border-rose-200 hover:bg-rose-50">
                  ไม่อนุมัติ (Reject)
                </Button>
                <Button type="primary" icon={<SafetyOutlined />} onClick={() => setActionType('APPROVE')} className="h-10 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 px-6 shadow-md">
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