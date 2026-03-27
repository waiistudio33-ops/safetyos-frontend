import React, { useState } from 'react';
import { Modal, Descriptions, Tag, Button, Divider, Space, Typography, Checkbox, Form, Input, message } from 'antd';
import { 
  PrinterOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  SafetyOutlined, ClockCircleOutlined, LockOutlined, EnvironmentOutlined
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

  // ตรวจสอบสิทธิ์ว่า user คนนี้มีสิทธิ์กดปุ่มต่างๆ ไหม
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
        // ต่ออายุ (สมมติต่อไปอีก 4 ชั่วโมง)
        const newTime = dayjs(permit.end_time).add(4, 'hour').toISOString();
        await onExtendPermit(permit.id, newTime, values.reason);
        message.success('ส่งคำขอต่ออายุสำเร็จ');
      } 
      else if (actionType === 'CLOSE' && onUpdateStatus) {
        // ขอปิดงาน
        await onUpdateStatus(permit.id, permit.status, 'CLOSE', values.reason);
        message.success('ส่งคำขอปิดใบอนุญาตเรียบร้อย');
      }
      else if ((actionType === 'APPROVE' || actionType === 'REJECT') && onUpdateStatus) {
        // อนุมัติ หรือ ไม่อนุมัติ
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

  // Helper ฟังก์ชันสำหรับแกะ JSON ออกมาแสดงผล
  const renderJsonList = (data: any) => {
    if (!data || !Array.isArray(data) || data.length === 0) return <Text type="secondary">-</Text>;
    return (
      <div className="flex flex-wrap gap-2">
        {data.map((item: string, index: number) => (
          <Tag key={index} color="blue" className="rounded-md font-medium border-blue-200 bg-blue-50 text-blue-700 m-0">
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
      onCancel={() => { setActionType('NONE'); onCancel(); }}
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
          <Button type="primary" icon={<PrinterOutlined />} onClick={onPrint} className="bg-white/20 hover:bg-white/30 border-none backdrop-blur-md rounded-xl font-bold h-10 text-white">
            พิมพ์ / บันทึก PDF
          </Button>
        </div>
      </div>

      {/* 📃 Content Section (สำหรับ Print และดูรายละเอียด) */}
      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-50">
        <div ref={documentRef} className="p-6 md:p-8 bg-white print-container">
          
          <Divider orientation="left" className="m-0 mb-4 border-slate-200"><span className="font-black text-blue-800 text-lg">1. ข้อมูลทั่วไป</span></Divider>
          <Descriptions column={{ xs: 1, sm: 2, md: 2 }} bordered size="small" className="mb-6 bg-white shadow-sm rounded-lg overflow-hidden font-medium">
            <Descriptions.Item label="ผู้ขออนุญาต">{permit.applicant?.full_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="บริษัท/แผนก">{permit.applicant?.department || '-'}</Descriptions.Item>
            <Descriptions.Item label="สถานที่ปฏิบัติงาน">
              <EnvironmentOutlined className="text-rose-500 mr-1"/> {permit.location_detail}
            </Descriptions.Item>
            <Descriptions.Item label="ระยะเวลา">
              {dayjs(permit.start_time).format('DD/MM/YYYY HH:mm')} - {dayjs(permit.end_time).format('HH:mm')} น.
            </Descriptions.Item>
            <Descriptions.Item label="รายละเอียดงาน" span={2}>{permit.description || '-'}</Descriptions.Item>
          </Descriptions>

          <Divider orientation="left" className="m-0 mb-4 border-slate-200"><span className="font-black text-rose-700 text-lg">2. มาตรการเฉพาะงาน (Hazard Details)</span></Divider>
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small" className="mb-6 bg-white shadow-sm rounded-lg overflow-hidden font-medium">
            {permit.supervisor_name && <Descriptions.Item label="ผู้ควบคุมงาน">{permit.supervisor_name}</Descriptions.Item>}
            {permit.gas_tester_name && <Descriptions.Item label="ผู้ตรวจสภาพอากาศ">{permit.gas_tester_name}</Descriptions.Item>}
            {permit.standby_person_name && <Descriptions.Item label="ผู้เฝ้าระวัง">{permit.standby_person_name}</Descriptions.Item>}
            {permit.rescuer_name && <Descriptions.Item label="ผู้ช่วยเหลือ">{permit.rescuer_name}</Descriptions.Item>}
            {permit.height_level && <Descriptions.Item label="ความสูง (เมตร)">{permit.height_level} เมตร</Descriptions.Item>}
            {permit.is_med_cert_verified !== undefined && (
              <Descriptions.Item label="ใบรับรองแพทย์">
                {permit.is_med_cert_verified ? <Tag color="green">ตรวจสอบแล้ว (Fit to Work)</Tag> : <Tag color="red">ยังไม่ตรวจสอบ</Tag>}
              </Descriptions.Item>
            )}
            
            {/* แสดง JSON Checklists */}
            <Descriptions.Item label="ลักษณะงานย่อย" span={2}>{renderJsonList(permit.work_sub_type)}</Descriptions.Item>
            <Descriptions.Item label="มาตรการความปลอดภัย" span={2}>{renderJsonList(permit.safety_measures)}</Descriptions.Item>
            <Descriptions.Item label="PPE ที่บังคับใช้" span={2}>{renderJsonList(permit.ppe_required)}</Descriptions.Item>
          </Descriptions>

          {permit.is_loto_required && (
            <>
              <Divider orientation="left" className="m-0 mb-4 border-slate-200"><span className="font-black text-purple-700 text-lg">3. การตัดแยกพลังงาน (LOTO)</span></Divider>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                <Row gutter={16}>
                  <Col span={8}><Text type="secondary" className="text-xs font-bold uppercase">จุดตัดแยก:</Text><br/><Text strong>{permit.loto_records?.[0]?.isolation_point || '-'}</Text></Col>
                  <Col span={8}><Text type="secondary" className="text-xs font-bold uppercase">พลังงาน:</Text><br/><Text strong>{permit.loto_records?.[0]?.energy_type || '-'}</Text></Col>
                  <Col span={8}><Text type="secondary" className="text-xs font-bold uppercase">Lock No.:</Text><br/><Text strong>{permit.loto_records?.[0]?.lock_number || '-'}</Text></Col>
                </Row>
              </div>
            </>
          )}

          {gasLogs && gasLogs.length > 0 && (
            <>
              <Divider orientation="left" className="m-0 mb-4 border-slate-200"><span className="font-black text-emerald-700 text-lg">ประวัติวัดสภาพอากาศ (Gas Tests)</span></Divider>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                {gasLogs.map((log: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between border-b border-emerald-200/50 pb-2 mb-2 last:border-0 last:mb-0 last:pb-0">
                    <Text className="font-bold text-slate-700">{dayjs(log.recorded_at).format('DD/MM HH:mm น.')}</Text>
                    <Space size="middle">
                      <Tag color={log.o2_level >= 19.5 && log.o2_level <= 23.5 ? 'success' : 'error'} className="m-0 font-bold">O2: {log.o2_level}%</Tag>
                      <Tag color={log.lel_level < 10 ? 'success' : 'error'} className="m-0 font-bold">LEL: {log.lel_level}%</Tag>
                    </Space>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>

      {/* ⚡ Action Form (ซ่อน/โชว์ตามที่ผู้ใช้กด) */}
      {actionType !== 'NONE' && (
        <div className="bg-slate-100 p-6 border-t border-slate-200 animate-fade-in">
          <Form form={form} layout="vertical">
            
            {actionType === 'CLOSE' && (
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 mb-4">
                <Form.Item name="is_housekeeping_done" valuePropName="checked" rules={[{ validator: (_, val) => val ? Promise.resolve() : Promise.reject('ต้องยืนยันการเคลียร์พื้นที่') }]} className="m-0">
                  <Checkbox className="font-black text-slate-800">
                    ข้าพเจ้ายืนยันว่างานเสร็จสิ้น นำเครื่องจักรออก และเคลียร์พื้นที่เรียบร้อย ปลอดภัย 100%
                  </Checkbox>
                </Form.Item>
              </div>
            )}

            <Form.Item 
              name="reason" 
              label={<span className="font-black text-slate-700">{actionType === 'EXTEND' ? 'เหตุผลที่ขอต่อเวลา' : actionType === 'CLOSE' ? 'สรุปผลการทำงาน (ระบุปัญหาถ้ามี)' : 'ความคิดเห็น (ถ้าไม่อนุมัติ กรุณาระบุเหตุผล)'}</span>} 
              rules={[{ required: actionType === 'REJECT' || actionType === 'EXTEND' }]}
              className="mb-4"
            >
              <Input.TextArea rows={3} className="rounded-xl border-slate-300 focus:border-blue-400" />
            </Form.Item>
            
            <div className="flex justify-end gap-3 mt-4">
              <Button onClick={() => setActionType('NONE')} className="rounded-xl font-bold h-10">ยกเลิก</Button>
              <Button type="primary" onClick={handleActionSubmit} loading={isSubmitting} className={`rounded-xl font-black h-10 px-8 ${actionType === 'REJECT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                ยืนยันการทำรายการ
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* 🕹️ Footer Action Buttons (ปุ่มจะเปลี่ยนไปตาม Role และ Status) */}
      {actionType === 'NONE' && (
        <div className="bg-white p-5 md:px-8 border-t border-slate-100 rounded-b-[24px] flex flex-wrap items-center justify-between gap-4">
          <Text type="secondary" className="text-xs font-bold">Ref: {permit.id}</Text>
          
          <Space>
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