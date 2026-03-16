import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Row, Col, Divider, Checkbox, Upload, Button, message } from 'antd';
import { FileAddOutlined, FireOutlined, BuildOutlined, ThunderboltOutlined, ToolOutlined, WarningOutlined, MedicineBoxOutlined, KeyOutlined, UploadOutlined } from '@ant-design/icons';
import ModernDateRange from '../../components/common/ModernDateRange';

interface CreatePermitModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: any, fileList: any[]) => Promise<void>;
  isSubmitting: boolean;
}

export default function CreatePermitModal({ open, onCancel, onSubmit, isSubmitting }: CreatePermitModalProps) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [selectedPermitTypeForm, setSelectedPermitTypeForm] = useState<string>('');
  const [isLotoRequired, setIsLotoRequired] = useState(false);

  // เคลียร์ค่าฟอร์มทุกครั้งที่เปิด/ปิด Modal
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setFileList([]);
      setSelectedPermitTypeForm('');
      setIsLotoRequired(false);
    }
  }, [open, form]);

  const handleFinish = (values: any) => {
    if (fileList.length === 0) {
      message.error('กรุณาแนบเอกสาร JSA ก่อนดำเนินการ');
      return;
    }
    onSubmit(values, fileList);
  };

  return (
    <Modal 
      title={null} 
      footer={null} 
      open={open} 
      destroyOnClose={true} 
      onCancel={onCancel} 
      width={750} 
      centered 
      styles={{ body: { padding: 0 } }}
    >
      {/* Soft Glass Header */}
      <div className="p-8 md:p-10 rounded-t-[2.5rem] border-b border-white" style={{ background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%)', backdropFilter: 'blur(20px)' }}>
        <h2 className="text-2xl md:text-3xl font-black m-0 text-blue-900 flex items-center gap-3">
          <FileAddOutlined className="text-blue-600" /> สร้างคำขอทำงาน (E-Permit)
        </h2>
        <p className="text-slate-500 text-xs md:text-sm mt-2 font-bold tracking-wide">
          กรุณาระบุข้อมูลให้ครบถ้วนเพื่อดำเนินการขออนุมัติ
        </p>
      </div>

      <div className="p-6 md:p-10 max-h-[75vh] overflow-y-auto custom-scrollbar bg-white/90 backdrop-blur-3xl rounded-b-[2.5rem]">
        <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark={false} className="anatomy-form">

          <div className="mb-8">
            <Divider orientation="left" className="m-0 mb-6 border-slate-200"><span className="font-black text-lg text-slate-800 tracking-tight">ข้อมูลพื้นฐาน</span></Divider>
            <Form.Item name="title" label={<span className="font-black text-slate-700 text-[11px] uppercase tracking-widest">หัวข้องาน</span>} rules={[{ required: true }]}>
              <Input placeholder="ระบุชื่องาน (เช่น งานซ่อมบำรุง Tank 01)" className="h-14 rounded-xl bg-slate-50/50 border-slate-200 focus:border-blue-400 focus:bg-white transition-colors duration-300 ease-out" />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="permit_type" label={<span className="font-black text-slate-700 text-[11px] uppercase tracking-widest">ประเภทงาน</span>} rules={[{ required: true }]}>
                  <Select size="large" className="h-14 custom-select-radius" onChange={setSelectedPermitTypeForm} placeholder="เลือกประเภทงาน">
                    <Select.Option value="HOT_WORK"><div className="flex items-center gap-2 font-bold text-slate-700"><FireOutlined className="text-orange-500"/> Hot Work</div></Select.Option>
                    <Select.Option value="CONFINED_SPACE"><div className="flex items-center gap-2 font-bold text-slate-700"><BuildOutlined className="text-purple-500"/> Confined Space</div></Select.Option>
                    <Select.Option value="ELECTRICAL"><div className="flex items-center gap-2 font-bold text-slate-700"><ThunderboltOutlined className="text-yellow-500"/> Electrical</div></Select.Option>
                    <Select.Option value="COLD_WORK"><div className="flex items-center gap-2 font-bold text-slate-700"><ToolOutlined className="text-blue-500"/> Cold Work</div></Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="location_detail" label={<span className="font-black text-slate-700 text-[11px] uppercase tracking-widest">สถานที่ปฏิบัติงาน</span>} rules={[{ required: true }]}>
                  <Input placeholder="ระบุโซน หรือ แผนก" className="h-14 rounded-xl bg-slate-50/50 border-slate-200 focus:border-blue-400 focus:bg-white transition-colors duration-300 ease-out" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="mb-8">
            <Divider orientation="left" className="m-0 mb-6 border-slate-200"><span className="font-black text-lg text-slate-800 tracking-tight">ระยะเวลาปฏิบัติงาน</span></Divider>
            <Form.Item name="timeRange" rules={[{ required: true }]} className="mb-0">
              <ModernDateRange />
            </Form.Item>
          </div>

          {(selectedPermitTypeForm === 'HOT_WORK' || selectedPermitTypeForm === 'CONFINED_SPACE') && (
            <div className="mb-8 animate-fade-in bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
              <div className="flex items-center gap-2 mb-6 text-orange-700 font-black text-sm uppercase tracking-widest border-b border-orange-200/50 pb-3">
                <WarningOutlined /> การตรวจสอบสภาพอากาศ
              </div>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="gas_tester_name" label={<span className="font-black text-slate-700 text-[11px] uppercase tracking-widest">ผู้ตรวจสอบสภาพอากาศ</span>} rules={[{ required: true }]}>
                    <Input size="large" placeholder="ระบุชื่อ-นามสกุล" className="rounded-xl h-14 bg-white/60 border-white focus:border-orange-400 focus:bg-white transition-colors duration-300 ease-out" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="standby_person_name" label={<span className="font-black text-slate-700 text-[11px] uppercase tracking-widest">ผู้เฝ้าระวัง (Standby)</span>} rules={[{ required: true }]}>
                    <Input size="large" placeholder="ระบุชื่อ-นามสกุล" className="rounded-xl h-14 bg-white/60 border-white focus:border-orange-400 focus:bg-white transition-colors duration-300 ease-out" />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {selectedPermitTypeForm === 'CONFINED_SPACE' && (
            <div className="mb-8 animate-fade-in bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
              <div className="flex items-center gap-2 mb-6 text-purple-700 font-black text-sm uppercase tracking-widest border-b border-purple-200/50 pb-3">
                <BuildOutlined /> กฎหมายที่อับอากาศ (Confined Space)
              </div>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="supervisor_name" label={<span className="font-black text-slate-700 text-[11px] uppercase tracking-widest">ผู้ควบคุมงาน (Supervisor)</span>} rules={[{ required: true, message: 'ระบุชื่อผู้ควบคุมงาน' }]}>
                    <Input size="large" placeholder="ระบุชื่อ-นามสกุล" className="rounded-xl h-14 bg-white/60 border-white focus:border-purple-400 focus:bg-white transition-colors duration-300 ease-out" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="rescue_plan_url" label={<span className="font-bold text-slate-700 text-[11px] uppercase tracking-widest">แผนกู้ภัยฉุกเฉิน (Rescue Plan)</span>} rules={[{ required: true, message: 'ระบุรายละเอียดหรือแนบลิงก์' }]}>
                    <Input size="large" placeholder="ระบุรายละเอียด หรือ แนบลิงก์" className="rounded-xl h-14 bg-white/60 border-white focus:border-purple-400 focus:bg-white transition-colors duration-300 ease-out" />
                  </Form.Item>
                </Col>
              </Row>
              <div className="bg-white/80 p-4 rounded-xl border border-purple-100/50 mt-2 flex items-start gap-3 shadow-sm">
                <div className="text-emerald-500 mt-0.5"><MedicineBoxOutlined className="text-xl" /></div>
                <div className="flex-1 pt-1">
                  <Form.Item name="is_med_cert_verified" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('ต้องยืนยันใบรับรองแพทย์')) }]} className="m-0 mb-1">
                    <Checkbox className="font-black text-slate-800 text-sm">ยืนยันว่าผู้ปฏิบัติงานทุกคนผ่านการตรวจสุขภาพ (Fit to Work)</Checkbox>
                  </Form.Item>
                  <p className="text-xs text-slate-500 mt-1 mb-0 font-medium leading-relaxed pl-6">ผู้เข้าทำงานในที่อับอากาศต้องมีใบรับรองแพทย์ที่ยังไม่หมดอายุตามกฎหมาย</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3 mb-6">
              <span className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2"><KeyOutlined className="text-blue-500" /> งานนี้ต้องตัดแยกพลังงาน (LOTO) หรือไม่?</span>
              <Form.Item name="is_loto_required" valuePropName="checked" className="m-0">
                <Checkbox onChange={(e) => setIsLotoRequired(e.target.checked)} className="font-black text-slate-800">บังคับใช้ LOTO</Checkbox>
              </Form.Item>
            </div>

            {isLotoRequired && (
              <div className="animate-fade-in bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item name="loto_isolation_point" label={<span className="font-black text-slate-700 text-[11px] uppercase tracking-widest">จุดตัดแยก (Isolation Point)</span>} rules={[{ required: true }]}>
                      <Input placeholder="ระบุจุดตัดแยก" className="rounded-xl h-14 bg-white/60 border-white focus:border-blue-400 focus:bg-white transition-colors duration-300 ease-out" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="loto_energy_type" label={<span className="font-black text-slate-700 text-[11px] uppercase tracking-widest">ประเภทพลังงาน</span>} rules={[{ required: true }]}>
                      <Select className="h-14" placeholder="เลือกประเภทพลังงาน">
                        <Select.Option value="ELECTRICAL">ไฟฟ้า (Electrical)</Select.Option>
                        <Select.Option value="MECHANICAL">เครื่องกล (Mechanical)</Select.Option>
                        <Select.Option value="CHEMICAL">สารเคมี (Chemical)</Select.Option>
                        <Select.Option value="PNEUMATIC">ลม (Pneumatic)</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="loto_lock_number" label={<span className="font-black text-slate-700 text-[11px] uppercase tracking-widest">หมายเลขแม่กุญแจ</span>} rules={[{ required: true }]}>
                      <Input placeholder="ระบุหมายเลข" className="rounded-xl h-14 bg-white/60 border-white focus:border-blue-400 focus:bg-white transition-colors duration-300 ease-out" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            )}
          </div>

          <div className="mb-4">
            <Form.Item name="description" label={<span className="font-black text-slate-700 text-[11px] uppercase tracking-widest">มาตรการความปลอดภัยเพิ่มเติม</span>}>
              <Input.TextArea rows={4} className="rounded-xl p-4 bg-slate-50/50 border-slate-200 focus:border-blue-400 focus:bg-white transition-colors duration-300 ease-out" placeholder="ระบุรายละเอียด (หากมี)..." />
            </Form.Item>
            <Form.Item label={<span className="font-black text-slate-700 text-[11px] uppercase tracking-widest">เอกสารแนบ (บังคับแนบ JSA)</span>} className="mb-0">
              <Upload beforeUpload={() => false} maxCount={1} fileList={fileList} onChange={({ fileList }) => setFileList(fileList)}>
                <Button icon={<UploadOutlined />} className="h-14 rounded-xl w-full text-slate-600 font-bold border-slate-300 bg-white hover:border-blue-500 hover:text-blue-600 transition-colors duration-300 ease-out flex items-center justify-center shadow-sm">แนบไฟล์เอกสาร</Button>
              </Upload>
            </Form.Item>
          </div>

          <div className="flex gap-4 mt-10 pt-6 border-t border-slate-100">
            <Button size="large" onClick={onCancel} className="flex-1 h-14 rounded-xl font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors duration-300 ease-out shadow-sm">
              ยกเลิก
            </Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting} size="large" className="flex-[2] h-14 rounded-xl font-black bg-blue-600 hover:bg-blue-700 shadow-[0_8px_24px_rgba(37,99,235,0.3)] transition-all duration-300 ease-out active:scale-[0.98]">
              ยืนยันการส่งคำขอทำงาน
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}