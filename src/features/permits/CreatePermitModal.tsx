import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Row, Col, Divider, Checkbox, Upload, Button, message, Steps, Grid } from 'antd';
import { 
  FileAddOutlined, FireOutlined, BuildOutlined, ThunderboltOutlined, 
  ToolOutlined, WarningOutlined, MedicineBoxOutlined, KeyOutlined, 
  UploadOutlined, EnvironmentOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import ModernDateRange from '../../components/common/ModernDateRange';

const { useBreakpoint } = Grid;

interface CreatePermitModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: any, fileList: any[]) => Promise<void>;
  isSubmitting: boolean;
}

export default function CreatePermitModal({ open, onCancel, onSubmit, isSubmitting }: CreatePermitModalProps) {
  const screens = useBreakpoint();
  const isMobile = !screens.md; // เช็คว่าเป็นหน้าจอมือถือหรือไม่

  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  
  const [fileList, setFileList] = useState<any[]>([]);
  const [selectedPermitType, setSelectedPermitType] = useState<string>('');
  const [isLotoRequired, setIsLotoRequired] = useState(false);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setCurrentStep(0);
      setFileList([]);
      setSelectedPermitType('');
      setIsLotoRequired(false);
    }
  }, [open, form]);

  const isHazardousWork = ['HOT_WORK', 'CONFINED_SPACE', 'ELECTRICAL'].includes(selectedPermitType);

  const next = async () => {
    try {
      await form.validateFields();
      setCurrentStep(currentStep + 1);
    } catch (error) {
      message.warning('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
    }
  };
  const prev = () => setCurrentStep(currentStep - 1);

  const handleFinish = async () => {
    try {
      await form.validateFields();
      if (fileList.length === 0) {
        message.error('กรุณาแนบเอกสาร JSA หรือเอกสารที่เกี่ยวข้องก่อนดำเนินการ');
        return;
      }
      const values = form.getFieldsValue();
      onSubmit(values, fileList);
    } catch (error) {
      message.error('กรุณาตรวจสอบข้อมูลอีกครั้ง');
    }
  };

  // =====================================
  // 🎨 STEP 1: ข้อมูลพื้นฐาน
  // =====================================
  const renderStep1 = () => (
    <div className="animate-fade-in pb-4">
      <Divider orientation="left" className="m-0 mb-4 md:mb-6 border-slate-200">
        <span className="font-black text-base md:text-lg text-slate-800">ข้อมูลพื้นฐานของงาน</span>
      </Divider>
      <Form.Item name="title" label={<span className="font-black text-slate-700 text-[11px] md:text-[12px] uppercase tracking-widest">หัวข้องาน</span>} rules={[{ required: true }]}>
        <Input placeholder="ระบุชื่องาน (เช่น งานซ่อมบำรุง Tank 01)" />
      </Form.Item>
      <Row gutter={[16, { xs: 0, sm: 16 }]}>
        <Col xs={24} md={12}>
          <Form.Item name="permit_type" label={<span className="font-black text-slate-700 text-[11px] md:text-[12px] uppercase tracking-widest">ประเภทงาน</span>} rules={[{ required: true }]}>
            <Select size="large" onChange={setSelectedPermitType} placeholder="เลือกประเภทงาน" popupClassName="font-medium">
              <Select.Option value="HOT_WORK"><div className="flex items-center gap-2 font-bold text-slate-800"><FireOutlined className="text-orange-500"/> Hot Work (ความร้อน)</div></Select.Option>
              <Select.Option value="CONFINED_SPACE"><div className="flex items-center gap-2 font-bold text-slate-800"><BuildOutlined className="text-purple-500"/> Confined Space (อับอากาศ)</div></Select.Option>
              <Select.Option value="WORKING_AT_HEIGHT"><div className="flex items-center gap-2 font-bold text-slate-800"><EnvironmentOutlined className="text-sky-500"/> Work at Height (ที่สูง)</div></Select.Option>
              <Select.Option value="ELECTRICAL"><div className="flex items-center gap-2 font-bold text-slate-800"><ThunderboltOutlined className="text-yellow-500"/> Electrical (งานไฟฟ้า)</div></Select.Option>
              <Select.Option value="COLD_WORK"><div className="flex items-center gap-2 font-bold text-slate-800"><ToolOutlined className="text-blue-500"/> Cold Work (ทั่วไป)</div></Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="location_detail" label={<span className="font-black text-slate-700 text-[11px] md:text-[12px] uppercase tracking-widest">สถานที่ปฏิบัติงาน</span>} rules={[{ required: true }]}>
            <Input placeholder="ระบุโซน หรือ แผนก" />
          </Form.Item>
        </Col>
      </Row>
      <div className="mt-2">
        <Form.Item name="timeRange" rules={[{ required: true }]} className="mb-0">
          <ModernDateRange />
        </Form.Item>
      </div>
    </div>
  );

  // =====================================
  // 🎨 STEP 2: มาตรการเฉพาะงาน (Dynamic)
  // =====================================
  const renderStep2 = () => (
    <div className="animate-fade-in pb-4">
      {!isHazardousWork ? (
        <div className="text-center py-8 md:py-12 bg-slate-50 rounded-xl md:rounded-2xl border-2 border-slate-100 shadow-sm mx-1 md:mx-0">
          <SafetyCertificateOutlined className="text-4xl md:text-5xl text-emerald-500 mb-3 md:mb-4 drop-shadow-sm" />
          <h3 className="font-black text-slate-800 text-lg md:text-xl m-0">งานทั่วไป (Cold Work)</h3>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-2 px-4">ไม่จำเป็นต้องระบุผู้เฝ้าระวังหรือแผนกู้ภัยฉุกเฉิน</p>
        </div>
      ) : (
        <>
          <Divider orientation="left" className="m-0 mb-4 md:mb-6 border-slate-200">
            <span className="font-black text-base md:text-lg text-slate-800">มาตรการควบคุมความเสี่ยงเฉพาะงาน</span>
          </Divider>
          
          {(selectedPermitType === 'HOT_WORK' || selectedPermitType === 'CONFINED_SPACE') && (
            <div className="mb-4 md:mb-6 bg-orange-50 p-4 md:p-6 rounded-xl md:rounded-2xl border-2 border-orange-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3 md:mb-4 text-orange-700 font-black text-[11px] md:text-sm uppercase tracking-widest border-b border-orange-200 pb-2 md:pb-3">
                <WarningOutlined className="text-base md:text-lg" /> การตรวจสอบสภาพอากาศ & ผู้เฝ้าระวัง
              </div>
              <Row gutter={[16, { xs: 0, sm: 16 }]}>
                <Col xs={24} md={12}>
                  <Form.Item name="gas_tester_name" label={<span className="font-black text-slate-800 text-[11px] md:text-[12px] uppercase tracking-widest">ผู้ตรวจสอบสภาพอากาศ</span>} rules={[{ required: true }]}>
                    <Input size="large" placeholder="ระบุชื่อ-นามสกุล" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="standby_person_name" label={<span className="font-black text-slate-800 text-[11px] md:text-[12px] uppercase tracking-widest">ผู้เฝ้าระวัง (Standby)</span>} rules={[{ required: true }]}>
                    <Input size="large" placeholder="ระบุชื่อ-นามสกุล" />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {selectedPermitType === 'CONFINED_SPACE' && (
            <div className="mb-4 md:mb-6 bg-purple-50 p-4 md:p-6 rounded-xl md:rounded-2xl border-2 border-purple-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3 md:mb-4 text-purple-700 font-black text-[11px] md:text-sm uppercase tracking-widest border-b border-purple-200 pb-2 md:pb-3">
                <BuildOutlined className="text-base md:text-lg" /> ข้อมูลเพิ่มเติมสำหรับที่อับอากาศ
              </div>
              <Row gutter={[16, { xs: 0, sm: 16 }]}>
                <Col xs={24} md={12}>
                  <Form.Item name="supervisor_name" label={<span className="font-black text-slate-800 text-[11px] md:text-[12px] uppercase tracking-widest">ผู้ควบคุมงาน (Supervisor)</span>} rules={[{ required: true }]}>
                    <Input size="large" placeholder="ระบุชื่อ-นามสกุล" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="rescue_plan_url" label={<span className="font-bold text-slate-800 text-[11px] md:text-[12px] uppercase tracking-widest">แผนกู้ภัย (Rescue Plan)</span>} rules={[{ required: true }]}>
                    <Input size="large" placeholder="ระบุรายละเอียด หรือ ลิงก์เอกสาร" />
                  </Form.Item>
                </Col>
              </Row>
              <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl border-2 border-emerald-100 mt-1 md:mt-2 flex items-start gap-2 md:gap-3 shadow-sm transition-all hover:border-emerald-300">
                <MedicineBoxOutlined className="text-xl md:text-2xl text-emerald-500 mt-0.5" />
                <div className="flex-1 pt-0 md:pt-0.5">
                  <Form.Item name="is_med_cert_verified" valuePropName="checked" rules={[{ validator: (_, val) => val ? Promise.resolve() : Promise.reject('ต้องยืนยันใบรับรองแพทย์') }]} className="m-0 mb-1">
                    <Checkbox className="font-black text-slate-800 text-[12px] md:text-sm">ยืนยันการตรวจสุขภาพ (Fit to Work)</Checkbox>
                  </Form.Item>
                  <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 md:mt-1 mb-0 font-medium pl-6">บังคับตามกฎหมายงานอับอากาศ</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 border-b-2 border-slate-100 pb-3 md:pb-4 mb-4 md:mb-5">
              <span className="font-black text-slate-800 text-[12px] md:text-sm uppercase tracking-widest flex items-center gap-2">
                <KeyOutlined className="text-blue-600 text-base md:text-lg" /> งานนี้ต้องตัดแยกพลังงาน (LOTO)?
              </span>
              <Form.Item name="is_loto_required" valuePropName="checked" className="m-0 w-full sm:w-auto">
                <Checkbox onChange={(e) => setIsLotoRequired(e.target.checked)} className="font-black text-slate-800 bg-slate-50 py-1.5 px-4 rounded-lg border border-slate-200 w-full sm:w-auto text-center">
                  บังคับใช้ LOTO
                </Checkbox>
              </Form.Item>
            </div>

            {isLotoRequired && (
              <div className="bg-blue-50 p-4 md:p-6 rounded-xl md:rounded-2xl border-2 border-blue-100 shadow-sm animate-fade-in">
                <Row gutter={[16, { xs: 0, sm: 16 }]}>
                  <Col xs={24} md={8}>
                    <Form.Item name="loto_isolation_point" label={<span className="font-black text-slate-800 text-[11px] md:text-[12px] uppercase tracking-widest">จุดตัดแยก</span>} rules={[{ required: true }]}>
                      <Input placeholder="เช่น วาล์ว V-101" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="loto_energy_type" label={<span className="font-black text-slate-800 text-[11px] md:text-[12px] uppercase tracking-widest">ประเภทพลังงาน</span>} rules={[{ required: true }]}>
                      <Select size="large" placeholder="เลือกพลังงาน">
                        <Select.Option value="ELECTRICAL">ไฟฟ้า</Select.Option>
                        <Select.Option value="MECHANICAL">เครื่องกล</Select.Option>
                        <Select.Option value="PNEUMATIC">ลม</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="loto_lock_number" label={<span className="font-black text-slate-800 text-[11px] md:text-[12px] uppercase tracking-widest">หมายเลขแม่กุญแจ</span>} rules={[{ required: true }]}>
                      <Input placeholder="ระบุรหัส Lock" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  // =====================================
  // 🎨 STEP 3: เอกสารแนบ & ยืนยัน
  // =====================================
  const renderStep3 = () => (
    <div className="animate-fade-in pb-4">
      <Divider orientation="left" className="m-0 mb-4 md:mb-6 border-slate-200">
        <span className="font-black text-base md:text-lg text-slate-800">เอกสารแนบ & การยืนยัน</span>
      </Divider>
      <Form.Item name="description" label={<span className="font-black text-slate-700 text-[11px] md:text-[12px] uppercase tracking-widest">รายละเอียด/มาตรการเพิ่มเติม</span>}>
        <Input.TextArea rows={4} placeholder="ระบุรายละเอียดขั้นตอนการทำงาน หรือหมายเหตุเพิ่มเติม..." />
      </Form.Item>
      <Form.Item label={<span className="font-black text-slate-700 text-[11px] md:text-[12px] uppercase tracking-widest">อัปโหลดเอกสารที่เกี่ยวข้อง (บังคับแนบ JSA)</span>} className="mb-0">
        <Upload beforeUpload={() => false} maxCount={1} fileList={fileList} onChange={({ fileList }) => setFileList(fileList)}>
          <Button icon={<UploadOutlined />} className="h-12 md:h-14 rounded-xl w-full text-blue-600 font-bold border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-sm text-xs md:text-sm">
            คลิกเพื่อแนบไฟล์ PDF/รูปภาพ
          </Button>
        </Upload>
      </Form.Item>
      
      <div className="mt-6 md:mt-8 bg-slate-800 p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 shadow-lg">
        <SafetyCertificateOutlined className="text-3xl md:text-4xl text-emerald-400" />
        <div>
          <h4 className="m-0 font-black text-white text-sm md:text-base leading-tight">ข้าพเจ้าขอรับรองว่าข้อมูลทั้งหมดเป็นความจริง</h4>
          <p className="text-slate-300 text-[11px] md:text-sm font-medium m-0 mt-1 leading-relaxed">
            ผู้ขอมีความเข้าใจสภาพงานและอธิบายให้ทีมรับทราบแล้ว ยินยอมรับผิดชอบทุกประการหากเกิดข้อผิดพลาด
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Modal 
      title={null} 
      footer={null} 
      open={open} 
      destroyOnClose={true} 
      onCancel={onCancel} 
      width={isMobile ? '100%' : 850} 
      centered 
      styles={{ 
        body: { padding: 0 },
        content: { 
          borderRadius: isMobile ? '0' : '1.5rem', // เอาขอบโค้งออกบนมือถือถ้าเต็มจอ
          height: isMobile ? '100vh' : 'auto',     // สูงเต็มจอบนมือถือ
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column'
        } 
      }}
      wrapClassName={isMobile ? 'full-screen-modal' : ''}
    >
      {/* 🔮 CSS Overrides: Responsive Adjustments */}
      <style>{`
        .anatomy-form .ant-input, 
        .anatomy-form .ant-select-selector {
          border: 2px solid #cbd5e1 !important;
          border-radius: ${isMobile ? '0.5rem' : '0.75rem'} !important; 
          background-color: #ffffff !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
          transition: all 0.3s ease !important;
          color: #1e293b !important;
          font-weight: 600 !important;
        }
        .anatomy-form .ant-input {
          height: ${isMobile ? '3rem' : '3.5rem'} !important; 
          padding: 0 ${isMobile ? '0.75rem' : '1rem'} !important;
          font-size: ${isMobile ? '14px' : '16px'} !important; /* ป้องกัน iOS ซูมเวลากด input */
        }
        .anatomy-form .ant-select-selector {
          height: ${isMobile ? '3rem' : '3.5rem'} !important; 
          display: flex !important;
          align-items: center !important;
          font-size: ${isMobile ? '14px' : '16px'} !important;
        }
        .anatomy-form .ant-input:hover, 
        .anatomy-form .ant-select:hover .ant-select-selector {
          border-color: #60a5fa !important;
        }
        .anatomy-form .ant-input:focus, 
        .anatomy-form .ant-select-focused .ant-select-selector {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
        }
        .anatomy-form textarea.ant-input {
          height: auto !important;
          padding: 0.75rem !important;
        }
        /* Full screen modal overrides for mobile */
        .full-screen-modal .ant-modal {
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          top: 0 !important;
          height: 100vh !important;
        }
        .full-screen-modal .ant-modal-content {
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
      `}</style>

      {/* 🔮 Header */}
      <div className={`p-5 md:p-8 md:pb-6 bg-white border-b border-slate-100 ${isMobile ? '' : 'rounded-t-[1.5rem]'}`}>
        <h2 className="text-xl md:text-3xl font-black m-0 text-slate-800 flex items-center gap-2 md:gap-3">
          <FileAddOutlined className="text-blue-600" /> ขออนุญาตทำงาน
        </h2>
        <p className="text-slate-500 font-medium text-[11px] md:text-sm mt-1 mb-4 md:mb-6">กรอกข้อมูลตามความจริงเพื่อความปลอดภัย</p>
        
        <div className="overflow-x-auto custom-scrollbar pb-1">
          <Steps 
            current={currentStep} 
            size={isMobile ? 'small' : 'default'} 
            className="font-bold min-w-[300px]" // บังคับไม่ให้บีบจนน่าเกลียดบนมือถือ
            items={[
              { title: <span className="text-[11px] md:text-sm">ข้อมูลทั่วไป</span> },
              { title: <span className="text-[11px] md:text-sm">มาตรการควบคุม</span> },
              { title: <span className="text-[11px] md:text-sm">ยืนยันข้อมูล</span> },
            ]} 
          />
        </div>
      </div>

      {/* 🔮 Content Area */}
      <div className={`p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 ${isMobile ? '' : 'max-h-[60vh]'}`}>
        <Form form={form} layout="vertical" requiredMark={false} className="anatomy-form">
          {currentStep === 0 && renderStep1()}
          {currentStep === 1 && renderStep2()}
          {currentStep === 2 && renderStep3()}
        </Form>
      </div>

      {/* 🕹️ Footer & Navigation Buttons */}
      <div className={`bg-white p-4 md:p-6 border-t border-slate-100 flex justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] relative z-10 ${isMobile ? '' : 'rounded-b-[1.5rem]'}`}>
        {currentStep > 0 ? (
          <Button size={isMobile ? "middle" : "large"} onClick={prev} className="h-12 md:h-14 px-4 md:px-8 rounded-lg md:rounded-xl font-extrabold text-slate-600 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-sm">
            ย้อนกลับ
          </Button>
        ) : (
          <Button size={isMobile ? "middle" : "large"} onClick={onCancel} className="h-12 md:h-14 px-4 md:px-8 rounded-lg md:rounded-xl font-bold text-slate-500 hover:bg-slate-50 border-none bg-transparent text-sm">
            ยกเลิก
          </Button>
        )}

        {currentStep < 2 ? (
          <Button type="primary" size={isMobile ? "middle" : "large"} onClick={next} className="h-12 md:h-14 px-6 md:px-10 rounded-lg md:rounded-xl font-black bg-blue-600 hover:bg-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:scale-105 transition-all text-sm">
            ถัดไป
          </Button>
        ) : (
          <Button type="primary" size={isMobile ? "middle" : "large"} onClick={handleFinish} loading={isSubmitting} className="h-12 md:h-14 px-6 md:px-10 rounded-lg md:rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 shadow-[0_8px_24px_rgba(5,150,105,0.3)] hover:scale-105 transition-all text-sm">
            ส่งคำขออนุมัติ
          </Button>
        )}
      </div>
    </Modal>
  );
}