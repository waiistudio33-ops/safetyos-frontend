import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Row, Col, Divider, Checkbox, Upload, Button, message, Steps, Grid, Radio, Space } from 'antd';
import { 
  FileAddOutlined, FireOutlined, BuildOutlined, ThunderboltOutlined, 
  ToolOutlined, WarningOutlined, MedicineBoxOutlined, KeyOutlined, 
  UploadOutlined, EnvironmentOutlined, SafetyCertificateOutlined,
  PlusOutlined, MinusCircleOutlined, IdcardOutlined, PhoneOutlined, TeamOutlined,
  StopOutlined, FileTextOutlined, InfoCircleOutlined, UserOutlined, SettingOutlined
} from '@ant-design/icons';
import ModernDateRange from '../../components/common/ModernDateRange';
import dayjs from 'dayjs';

const { useBreakpoint } = Grid;

interface CreatePermitModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: any, fileList: any[]) => Promise<void>;
  isSubmitting: boolean;
  currentUser: any; 
}

export default function CreatePermitModal({ open, onCancel, onSubmit, isSubmitting, currentUser }: CreatePermitModalProps) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  
  const [fileList, setFileList] = useState<any[]>([]);
  const [selectedPermitTypes, setSelectedPermitTypes] = useState<string[]>([]);
  const [isOtherType, setIsOtherType] = useState(false);
  const [isLotoRequired, setIsLotoRequired] = useState(false);

  const isHazardousWork = selectedPermitTypes.some(type => 
    ['HOT_WORK', 'CONFINED_SPACE', 'WORKING_AT_HEIGHT', 'ELECTRICAL', 'LIFTING'].includes(type)
  );

  const isSafetyOrAdmin = currentUser?.role === 'SAFETY_ENGINEER' || currentUser?.role === 'ADMIN';

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setCurrentStep(0);
      setFileList([]);
      setSelectedPermitTypes([]);
      setIsOtherType(false);
      setIsLotoRequired(false);
      form.setFieldsValue({ 
        workers: [{ worker_name: '', company: '', card_type: 'CONTRACTOR', card_number: '', access_area: '', access_number: '' }], // 🟢 เอา role ออกจาก Initial Value
        other_documents: [''] 
      });
    }
  }, [open, form]);

  const handlePermitTypeChange = (checkedValues: any[]) => {
    setSelectedPermitTypes(checkedValues);
    setIsOtherType(checkedValues.includes('OTHER'));
  };

  const next = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields([
          'work_purpose', 'area_owner_name', 'department', 'location_detail', 'machinery_tools', 'jsa_agreement',
          'timeRange', 'work_shift', 'permit_type', 'other_permit_type',
          'workers', 'other_documents'
        ]);
      } else if (currentStep === 1) {
        await form.validateFields([
          'work_sub_type', 'gas_tester_name', 'standby_person_name', 'height_level', 
          'safety_measures', 'ppe_required', 'supervisor_name', 'rescuer_name', 
          'communication_method', 'is_med_cert_verified', 'is_loto_required', 
          'loto_isolation_point', 'loto_energy_type', 'loto_lock_number'
        ]);
      }
      setCurrentStep(currentStep + 1);
    } catch (error) {
      message.warning('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
    }
  };
  
  const prev = () => setCurrentStep(currentStep - 1);

  const handleClose = () => {
    onCancel();
  };

  const handleFinish = async () => {
    if (isSafetyOrAdmin) {
      message.error('คุณไม่มีสิทธิขอใบอนุญาต');
      return;
    }

    try {
      if (fileList.length === 0) {
        message.error('กรุณาแนบเอกสาร JSA หรือเอกสารที่เกี่ยวข้องก่อนดำเนินการ');
        return;
      }
      
      const values = form.getFieldsValue();
      
      let finalPermitTypes = [...(values.permit_type || [])];
      if (isOtherType && values.other_permit_type) {
        finalPermitTypes = finalPermitTypes.map((t: string) => t === 'OTHER' ? `OTHER:${values.other_permit_type}` : t);
      }
      values.permit_type = finalPermitTypes.join(',');

      if (values.other_documents && values.other_documents.length > 0) {
        const validDocs = values.other_documents.filter((doc: string) => doc && doc.trim() !== '');
        values.other_documents_text = validDocs.join(', ');
      } else {
        values.other_documents_text = '';
      }

      if (values.workers) {
        values.workers = values.workers.filter((w: any) => w && w.worker_name && w.worker_name.trim() !== '');
      } else {
        values.workers = [];
      }

      if (values.timeRange && values.timeRange.length === 2) {
        values.start_time = dayjs(values.timeRange[0]).format('YYYY-MM-DDTHH:mm:ssZ');
        values.end_time = dayjs(values.timeRange[1]).format('YYYY-MM-DDTHH:mm:ssZ');
      }

      values.title = values.work_purpose; 

      await onSubmit(values, fileList);
      handleClose();

    } catch (error) {
      console.error("Form Validation Error:", error);
    }
  };

  return (
    <Modal 
      title={null} footer={null} open={open} destroyOnHidden={true} onCancel={handleClose} 
      width={isMobile ? '100%' : 1000} centered 
      styles={{ 
        body: { padding: 0 },
        content: { 
          borderRadius: isMobile ? '0' : '1.5rem',
          height: isMobile ? '100vh' : '85vh',     
          margin: 0, padding: 0, display: 'flex', flexDirection: 'column'
        } 
      }}
      wrapClassName={isMobile ? 'full-screen-modal' : ''}
    >
      <style>{`
        .anatomy-form .ant-input, .anatomy-form .ant-select-selector {
          border: 2px solid #cbd5e1 !important; border-radius: 0.75rem !important; 
          background-color: #ffffff !important; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
          transition: all 0.3s ease !important; color: #1e293b !important; font-weight: 600 !important;
        }
        .anatomy-form .ant-input { height: 3.2rem !important; padding: 0 1rem !important; }
        .anatomy-form .ant-select-selector { height: 3.2rem !important; display: flex !important; align-items: center !important; }
        .anatomy-form .ant-input:hover, .anatomy-form .ant-select:hover .ant-select-selector { border-color: #60a5fa !important; }
        .anatomy-form .ant-input:focus, .anatomy-form .ant-select-focused .ant-select-selector { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important; }
        .anatomy-form textarea.ant-input { height: auto !important; padding: 0.75rem !important; }
        
        .anatomy-form .ant-radio-button-wrapper {
          height: auto !important; min-height: 3.2rem; padding: 0.5rem !important;
          display: flex !important; align-items: center; justify-content: center;
          white-space: normal !important; line-height: 1.3 !important;
        }

        .full-screen-modal .ant-modal { max-width: 100% !important; margin: 0 !important; padding: 0 !important; top: 0 !important; height: 100vh !important; }
        .full-screen-modal .ant-modal-content { display: flex; flex-direction: column; height: 100vh; }
        .worker-row-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 16px; margin-bottom: 16px; }
        .compact-item { margin-bottom: 8px !important; }
        
        .responsive-checkbox {
          display: flex !important;
          align-items: flex-start !important;
          width: 100%;
        }
        .responsive-checkbox .ant-checkbox {
          flex-shrink: 0 !important;
          margin-top: 3px !important;
        }
        .responsive-checkbox > span:last-child {
          white-space: normal !important;
          word-break: break-word !important;
          flex: 1 !important;
          padding-right: 0 !important;
          line-height: 1.5 !important;
        }
      `}</style>

      {isSafetyOrAdmin ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[1.5rem] relative overflow-hidden">
          <div className="absolute top-0 w-full h-2 bg-red-500"></div>
          <StopOutlined className="text-6xl md:text-8xl text-red-400 mb-6 drop-shadow-md" />
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2 text-center">คุณไม่มีสิทธิขอใบอนุญาตทำงาน</h2>
          <p className="text-slate-500 text-center font-medium text-sm md:text-base max-w-md">
            บทบาท <b>{currentUser?.role === 'SAFETY_ENGINEER' ? 'เจ้าหน้าที่ความปลอดภัย (จป.)' : 'ผู้ดูแลระบบ (Admin)'}</b> ถูกกำหนดให้เป็นผู้อนุมัติและตรวจสอบเท่านั้น
          </p>
          <Button size="large" type="primary" danger onClick={handleClose} className="mt-8 font-black px-8 rounded-xl h-12 shadow-lg hover:scale-105 transition-transform">ปิดหน้าต่างนี้</Button>
        </div>
      ) : (
        <>
          <div className={`p-5 md:p-8 md:pb-6 bg-white border-b border-slate-100 ${isMobile ? '' : 'rounded-t-[1.5rem]'}`}>
            <h2 className="text-xl md:text-3xl font-black m-0 text-slate-800 flex items-center gap-3">
              <FileAddOutlined className="text-blue-600" /> ใบขออนุญาตทำงาน / Work Permit
            </h2>
            <p className="text-slate-500 font-medium text-[11px] md:text-sm mt-1 mb-4 md:mb-6">ส่วนที่ 1: การขออนุญาตทำงาน (Requisition)</p>
            
            <div className="overflow-x-auto custom-scrollbar pb-1">
              <Steps 
                current={currentStep} size={isMobile ? 'small' : 'default'} className="font-bold min-w-[300px]"
                items={[
                  { title: <span className="text-[11px] md:text-sm">ข้อมูลทั่วไป</span> },
                  { title: <span className="text-[11px] md:text-sm">มาตรการควบคุม</span> },
                  { title: <span className="text-[11px] md:text-sm">เอกสารแนบ</span> },
                ]} 
              />
            </div>
          </div>

          <div className={`p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 ${isMobile ? '' : 'max-h-[65vh]'}`}>
            <Form form={form} layout="vertical" requiredMark={false} className="anatomy-form" initialValues={{ workers: [{ worker_name: '', company: '', card_type: 'CONTRACTOR', card_number: '', access_area: '', access_number: '' }], other_documents: [''] }}>
              
              {/* ================= STEP 1: General Info ================= */}
              <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
                <div className="animate-fade-in pb-4">
                  
                  <Divider titlePlacement="left" className="m-0 mb-4 md:mb-6 border-slate-200">
                    <span className="font-black text-base md:text-lg text-slate-800">1. รายละเอียดงานและสถานที่</span>
                  </Divider>
                  
                  <Row gutter={[16, { xs: 0, sm: 16 }]}>
                    <Col xs={24} md={12}>
                      <Form.Item name="work_purpose" label={<span className="font-black text-slate-700 text-xs uppercase tracking-widest">ความประสงค์จะขออนุญาตทำงาน</span>} rules={[{ required: true }]}>
                        <Input placeholder="ระบุชื่องานที่ต้องการทำ" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="location_detail" label={<span className="font-black text-slate-700 text-xs uppercase tracking-widest">สถานที่ทำงาน</span>} rules={[{ required: true }]}>
                        <Input placeholder="เช่น NS/MMA, TK 1101" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="area_owner_name" label={<span className="font-black text-slate-700 text-xs uppercase tracking-widest">ชื่อเจ้าของงาน (ชื่อ-สกุล)</span>} rules={[{ required: true }]}>
                        <Input prefix={<UserOutlined className="text-slate-400" />} placeholder="ระบุชื่อเจ้าของพื้นที่" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="department" label={<span className="font-black text-slate-700 text-xs uppercase tracking-widest">หน่วยงาน</span>} rules={[{ required: true }]}>
                        <Input placeholder="ระบุแผนกเจ้าของงาน" />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item name="machinery_tools" label={<span className="font-black text-slate-700 text-xs uppercase tracking-widest">เครื่องจักรหรือเครื่องมือหลักที่ใช้ในงาน</span>} rules={[{ required: true }]}>
                        <Input prefix={<SettingOutlined className="text-slate-400" />} placeholder="เช่น Hiab 5 Ton, เครื่องเชื่อม, สว่านไฟฟ้า..." />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div className="bg-blue-50/50 p-4 md:p-5 rounded-xl border border-blue-100 mb-6 flex items-start gap-3 w-full overflow-hidden">
                     <InfoCircleOutlined className="text-blue-500 text-xl mt-0.5 shrink-0" />
                     <Form.Item name="jsa_agreement" valuePropName="checked" rules={[{ validator: (_, val) => val ? Promise.resolve() : Promise.reject('กรุณายืนยันการทำ JSEAA') }]} className="m-0 w-full overflow-hidden">
                        <Checkbox className="responsive-checkbox w-full">
                          <span className="font-black text-slate-800 text-[12px] md:text-sm">
                            ผู้ขออนุญาตทำงานได้ระบุรายละเอียดของงานและทำการวิเคราะห์ JSA ไว้ในเอกสารแนบ "รายละเอียดของงานและผู้ขออนุญาต: Detail of work to be done & Work Requestor" แล้ว
                          </span>
                        </Checkbox>
                     </Form.Item>
                  </div>

                  <div className="mt-2 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Form.Item name="timeRange" label={<span className="font-black text-slate-700 text-xs uppercase tracking-widest">ช่วงเวลาในการขออนุญาตทำงาน</span>} rules={[{ required: true }]} className="mb-0">
                          <ModernDateRange />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="work_shift" label={<span className="font-black text-slate-700 text-xs uppercase tracking-widest">กะการทำงาน (Work Shift)</span>} rules={[{ required: true, message: 'กรุณาเลือกกะ' }]} className="mb-0">
                          <Radio.Group className="w-full grid grid-cols-2 gap-2" size="large">
                            <Radio.Button value="MORNING" className="text-center rounded-xl font-bold">กะเช้า (07:30-19:30)</Radio.Button>
                            <Radio.Button value="NIGHT" className="text-center rounded-xl font-bold">กะดึก (19:30-07:30)</Radio.Button>
                          </Radio.Group>
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>

                  <div className="mb-6 bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                    <Form.Item name="permit_type" label={<span className="font-black text-slate-800 text-sm uppercase tracking-widest">ประเภทงาน (เลือกได้มากกว่า 1 งาน)</span>} rules={[{ required: true, message: 'กรุณาเลือกประเภทงานอย่างน้อย 1 อย่าง' }]}>
                      <Checkbox.Group className="w-full" onChange={handlePermitTypeChange}>
                        <Row gutter={[16, 16]}>
                          <Col span={24} md={12} lg={8}><Checkbox className="responsive-checkbox" value="COLD_WORK"><span className="font-bold text-slate-700"><span className="text-slate-500 font-black mr-1">[A]</span> งานทั่วไป</span></Checkbox></Col>
                          <Col span={24} md={12} lg={8}><Checkbox className="responsive-checkbox" value="HOT_WORK"><span className="font-bold text-slate-700"><span className="text-slate-500 font-black mr-1">[B]</span> งานที่มีความร้อนหรือประกายไฟ</span></Checkbox></Col>
                          <Col span={24} md={12} lg={8}><Checkbox className="responsive-checkbox" value="CONFINED_SPACE"><span className="font-bold text-slate-700"><span className="text-slate-500 font-black mr-1">[C]</span> งานในพื้นที่อับอากาศ</span></Checkbox></Col>
                          <Col span={24} md={12} lg={8}><Checkbox className="responsive-checkbox" value="WORKING_AT_HEIGHT"><span className="font-bold text-slate-700"><span className="text-slate-500 font-black mr-1">[D]</span> งานบนที่สูง &gt; 1.8 ม.</span></Checkbox></Col>
                          <Col span={24} md={12} lg={8}><Checkbox className="responsive-checkbox" value="HIGH_PRESSURE"><span className="font-bold text-slate-700"><span className="text-slate-500 font-black mr-1">[E]</span> แรงดันสูง &gt; 100 Bar</span></Checkbox></Col>
                          <Col span={24} md={12} lg={8}><Checkbox className="responsive-checkbox" value="EXCAVATION"><span className="font-bold text-slate-700"><span className="text-slate-500 font-black mr-1">[F]</span> งานขุด &gt; 15 ซม.</span></Checkbox></Col>
                          <Col span={24} md={12} lg={8}><Checkbox className="responsive-checkbox" value="LIFTING"><span className="font-bold text-slate-700"><span className="text-slate-500 font-black mr-1">[I]</span> งานยกของหนัก </span></Checkbox></Col>
                          <Col span={24} md={12} lg={8}><Checkbox className="responsive-checkbox" value="Diving"><span className="font-bold text-slate-700"><span className="text-slate-500 font-black mr-1">[J]</span> งานประดาน้ำ</span></Checkbox></Col>
                          <Col span={24} md={12} lg={8}><Checkbox className="responsive-checkbox" value="Radiation"><span className="font-bold text-slate-700"><span className="text-slate-500 font-black mr-1">[K]</span> งานที่เกี่ยวข้องกับรังสี </span></Checkbox></Col>                          
                          <Col span={24} md={12} lg={8}><Checkbox className="responsive-checkbox" value="ELECTRICAL"><span className="font-bold text-slate-700"><span className="text-slate-500 font-black mr-1">[G]</span> งานที่ไฟฟ้าแรงสูง &gt; 380 V</span></Checkbox></Col>
                          <Col span={24} md={12} lg={8}><Checkbox className="responsive-checkbox" value="OTHER"><span className="font-bold text-slate-700"><span className="text-slate-500 font-black mr-1">[I]</span> อื่นๆ (โปรดระบุ)</span></Checkbox></Col>
                        </Row>
                      </Checkbox.Group>
                    </Form.Item>
                    {isOtherType && (
                      <Form.Item name="other_permit_type" rules={[{ required: true, message: 'กรุณาระบุประเภทงานอื่นๆ' }]} className="mb-0 mt-2 animate-fade-in">
                        <Input placeholder="ระบุประเภทงานอื่นๆ..." className="border-dashed" />
                      </Form.Item>
                    )}
                  </div>

                  <div className="bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] p-4 md:p-6 mt-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                      <div className="font-black text-slate-800 text-base md:text-lg flex items-center gap-2">
                        <IdcardOutlined className="text-blue-500 text-xl" /> รายชื่อผู้ปฏิบัติงาน
                      </div>
                    </div>

                    <Form.List name="workers">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map((field, index) => (
                            <div key={field.key} className="worker-row-card animate-fade-in relative bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                              <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-600 text-white font-black rounded-full flex items-center justify-center shadow-md border-2 border-white">
                                {index + 1}
                              </div>
                              {fields.length > 1 && (
                                <div className="absolute top-2 right-2 z-10">
                                  <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} className="bg-rose-50 hover:bg-rose-100" />
                                </div>
                              )}
                              
                              <Row gutter={[12, 0]} className="pt-2">
                                <Col xs={24} md={12}>
                                  <Form.Item name={[field.name, 'worker_name']} label={<span className="text-[10px] font-bold text-slate-500">ชื่อ-นามสกุล</span>} rules={[{ required: true, message: 'ระบุชื่อ' }]} className="compact-item">
                                    <Input placeholder="ระบุชื่อ-นามสกุล" />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                  <Form.Item name={[field.name, 'company']} label={<span className="text-[10px] font-bold text-slate-500">บริษัท</span>} className="compact-item">
                                    <Input placeholder="ระบุบริษัท" />
                                  </Form.Item>
                                </Col>
                              </Row>

                              <Row gutter={[12, 0]}>
                                <Col xs={10} sm={8} md={8}>
                                  <Form.Item name={[field.name, 'card_type']} label={<span className="text-[10px] font-bold text-slate-500">ประเภทบัตร</span>} className="compact-item">
                                    <Select classNames={{ popup: { root: 'font-medium' } }}>
                                      <Select.Option value="CONTRACTOR">บัตร ผรม.</Select.Option>
                                      <Select.Option value="VISITOR">Visitor</Select.Option>
                                    </Select>
                                  </Form.Item>
                                </Col>
                                <Col xs={14} sm={16} md={16}>
                                  <Form.Item name={[field.name, 'card_number']} label={<span className="text-[10px] font-bold text-slate-500">เลขที่บัตร (Card No.)</span>} rules={[{ required: true, message: 'ระบุเลขบัตร' }]} className="compact-item">
                                    <Input placeholder="กรอกเลขที่บัตร" />
                                  </Form.Item>
                                </Col>
                              </Row>

                              {/* 🟢 เอา Role ออกแล้ว ให้เหลือแค่ Area/Number ปิดท้ายแถว */}
                              <Row gutter={[12, 0]} className="mb-2">
                                <Col xs={12} md={12}>
                                  <Form.Item name={[field.name, 'access_area']} label={<span className="text-[10px] font-bold text-slate-500">Access Card (Area)</span>} className="compact-item mb-0">
                                    <Input placeholder="เช่น TK" />
                                  </Form.Item>
                                </Col>
                                <Col xs={12} md={12}>
                                  <Form.Item name={[field.name, 'access_number']} label={<span className="text-[10px] font-bold text-slate-500">Access Card (Number)</span>} className="compact-item mb-0">
                                    <Input placeholder="เช่น 699" />
                                  </Form.Item>
                                </Col>
                              </Row>
                            </div>
                          ))}
                          <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="mt-2 border-2 border-dashed border-blue-300 text-blue-600 hover:border-blue-500 hover:text-blue-700 font-black h-12 rounded-xl bg-white shadow-sm transition-all hover:-translate-y-0.5">
                            + เพิ่มรายชื่อผู้ปฏิบัติงาน
                          </Button>
                        </>
                      )}
                    </Form.List>
                  </div>

                  <Divider titlePlacement="left" className="m-0 mt-8 mb-4 md:mb-6 border-slate-200">
                    <span className="font-black text-base md:text-lg text-slate-800">2. เอกสารประกอบการขออนุญาต</span>
                  </Divider>

                  <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="mb-4">
                       <span className="font-bold text-slate-500 text-xs block mb-2">เอกสารหลัก (ติ๊กเพื่อยืนยันว่ามีเอกสารเหล่านี้):</span>
                       <Form.Item name="document_checklist" className="mb-0">
                         <Checkbox.Group className="flex flex-col gap-3 w-full">
                           <Checkbox value="DETAIL_AND_REQUESTOR" className="responsive-checkbox"><span className="font-bold text-slate-700">รายละเอียดของงานและผู้ขออนุญาต</span></Checkbox>
                           <Checkbox value="JSEA" className="responsive-checkbox"><span className="font-bold text-slate-700">ใบวิเคราะห์ความปลอดภัย (JSEA / JSA)</span></Checkbox>
                           <Checkbox value="WORKER_LIST" className="responsive-checkbox"><span className="font-bold text-slate-700">รายชื่อผู้ปฏิบัติงาน</span></Checkbox>
                           <Checkbox value="EQUIPMENT_LIST" className="responsive-checkbox"><span className="font-bold text-slate-700">รายการแสดงเครื่องมือ-อุปกรณ์</span></Checkbox>
                         </Checkbox.Group>
                       </Form.Item>
                    </div>

                    <Divider className="my-4 border-slate-100" />
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-600 text-xs block mb-3">เอกสารอื่นๆ (ถ้ามี กรุณาระบุ):</span>
                      <Form.List name="other_documents">
                        {(fields, { add, remove }) => (
                          <div className="flex flex-col gap-2">
                            {fields.map((field) => (
                              <div key={field.key} className="flex gap-2 items-center animate-fade-in">
                                <Form.Item name={field.name} className="mb-0 flex-1">
                                  <Input placeholder="เช่น Lifting Plan, Load Chart, รูปรถเครน..." className="!border-dashed bg-white" />
                                </Form.Item>
                                {fields.length > 1 && (
                                  <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} className="shrink-0 bg-white border border-rose-100" />
                                )}
                              </div>
                            ))}
                            <Button type="dashed" onClick={() => add()} className="mt-1 w-fit text-xs font-bold text-slate-500 border-slate-300" icon={<PlusOutlined />}>
                              เพิ่มรายการเอกสารอื่นๆ
                            </Button>
                          </div>
                        )}
                      </Form.List>
                    </div>
                  </div>

                </div>
              </div>

              {/* ================= STEP 2: Control Measures ================= */}
              <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                 {!isHazardousWork ? (
                    <div className="text-center py-8 md:py-12 bg-slate-50 rounded-xl md:rounded-2xl border-2 border-slate-100 shadow-sm mx-1 md:mx-0">
                      <SafetyCertificateOutlined className="text-4xl md:text-5xl text-emerald-500 mb-3 md:mb-4 drop-shadow-sm" />
                      <h3 className="font-black text-slate-800 text-lg md:text-xl m-0">งานทั่วไป (Cold Work)</h3>
                      <p className="text-slate-500 font-medium text-xs md:text-sm mt-2 px-4">ไม่จำเป็นต้องระบุผู้เฝ้าระวัง หรือมาตรการพิเศษเพิ่มเติม สามารถใช้ PPE พื้นฐานได้</p>
                    </div>
                  ) : (
                    <>
                      <Divider titlePlacement="left" className="m-0 mb-4 md:mb-6 border-slate-200">
                        <span className="font-black text-base md:text-lg text-slate-800">มาตรการควบคุมความเสี่ยงเฉพาะงาน</span>
                      </Divider>
                      
                      {selectedPermitTypes.includes('HOT_WORK') && (
                        <div className="mb-4 md:mb-6 bg-orange-50 p-4 md:p-6 rounded-xl md:rounded-2xl border-2 border-orange-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-4 text-orange-700 font-black text-sm uppercase tracking-widest border-b border-orange-200 pb-3">
                            <FireOutlined className="text-lg" /> มาตรการงานความร้อน (Hot Work)
                          </div>
                          <Form.Item name="work_sub_type" label={<span className="font-bold text-slate-700 text-xs">ลักษณะของงาน (เลือกได้มากกว่า 1)</span>}>
                            <Checkbox.Group className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full custom-checkbox-wrapper">
                              <Checkbox value="GRINDING"><span className="block pr-2">เจียร / ตัด</span></Checkbox>
                              <Checkbox value="ARC_WELDING"><span className="block pr-2">เชื่อม / ตัดด้วยไฟฟ้า</span></Checkbox>
                              <Checkbox value="GAS_WELDING"><span className="block pr-2">เชื่อม / ตัดด้วยแก๊ส</span></Checkbox>
                              <Checkbox value="DRILLING"><span className="block pr-2">เจาะ / ขุด</span></Checkbox>
                            </Checkbox.Group>
                          </Form.Item>
                          <Row gutter={[16, { xs: 0, sm: 16 }]}>
                            <Col xs={24} md={12}>
                              <Form.Item name="gas_tester_name" label={<span className="font-black text-slate-800 text-[11px] uppercase tracking-widest">ผู้ตรวจวัดก๊าซ</span>} rules={[{ required: true }]}>
                                <Input placeholder="ระบุชื่อ-นามสกุล" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item name="standby_person_name" label={<span className="font-black text-slate-800 text-[11px] uppercase tracking-widest">ผู้เฝ้าระวัง (Standby)</span>} rules={[{ required: true }]}>
                                <Input placeholder="ระบุชื่อ-นามสกุล" />
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>
                      )}

                      {selectedPermitTypes.includes('WORKING_AT_HEIGHT') && (
                        <div className="mb-4 md:mb-6 bg-sky-50 p-4 md:p-6 rounded-xl md:rounded-2xl border-2 border-sky-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-4 text-sky-700 font-black text-sm uppercase tracking-widest border-b border-sky-200 pb-3">
                            <EnvironmentOutlined className="text-lg" /> มาตรการงานบนที่สูง
                          </div>
                          <Row gutter={[16, { xs: 0, sm: 16 }]}>
                            <Col xs={24} md={12}>
                              <Form.Item name="height_level" label={<span className="font-bold text-slate-700 text-xs">ระดับความสูงจากพื้น (เมตร)</span>} rules={[{ required: true }]}>
                                <Input type="number" placeholder="เช่น 2.5, 5.0" suffix="เมตร" />
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>
                      )}

                      {selectedPermitTypes.includes('CONFINED_SPACE') && (
                        <div className="mb-4 md:mb-6 bg-purple-50 p-4 md:p-6 rounded-xl md:rounded-2xl border-2 border-purple-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-3 md:mb-4 text-purple-700 font-black text-[11px] md:text-sm uppercase tracking-widest border-b border-purple-200 pb-2 md:pb-3">
                            <BuildOutlined className="text-base md:text-lg" /> ข้อมูลเพิ่มเติมสำหรับที่อับอากาศ
                          </div>
                          <Row gutter={[16, { xs: 0, sm: 16 }]}>
                            <Col xs={24} md={12}>
                              <Form.Item name="supervisor_name" label={<span className="font-black text-slate-800 text-[11px] uppercase tracking-widest">ผู้ควบคุมงาน</span>} rules={[{ required: true }]}>
                                <Input placeholder="ระบุชื่อ-นามสกุล" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item name="rescuer_name" label={<span className="font-black text-slate-800 text-[11px] uppercase tracking-widest">ผู้ช่วยเหลือ (Rescuer)</span>} rules={[{ required: true }]}>
                                <Input placeholder="ระบุชื่อ-นามสกุล" />
                              </Form.Item>
                            </Col>
                          </Row>
                          <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl border-2 border-emerald-100 mt-2 flex items-start gap-2 shadow-sm w-full">
                            <MedicineBoxOutlined className="text-xl md:text-2xl text-emerald-500 mt-0.5 shrink-0" />
                            <div className="flex-1 pt-0 md:pt-0.5 w-full">
                              <Form.Item name="is_med_cert_verified" valuePropName="checked" rules={[{ validator: (_, val) => val ? Promise.resolve() : Promise.reject('ต้องยืนยันใบรับรองแพทย์') }]} className="m-0 mb-1 w-full">
                                <Checkbox className="responsive-checkbox w-full">
                                  <span className="font-black text-slate-800 text-[12px] md:text-sm block pr-2">ยืนยันการตรวจสุขภาพ (Fit to Work)</span>
                                </Checkbox>
                              </Form.Item>
                              <p className="text-[10px] md:text-xs text-slate-500 mt-1 mb-0 font-medium pl-6">ผู้ปฏิบัติงานทุกคนต้องมีใบรับรองแพทย์</p>
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
                            <Checkbox onChange={(e) => setIsLotoRequired(e.target.checked)} className="responsive-checkbox bg-slate-50 py-2 px-4 rounded-lg border border-slate-200 w-full sm:w-auto flex justify-center items-center">
                              <span className="font-black text-slate-800 block pr-2 text-center w-full">บังคับใช้ LOTO</span>
                            </Checkbox>
                          </Form.Item>
                        </div>

                        {isLotoRequired && (
                          <div className="bg-blue-50 p-4 md:p-6 rounded-xl md:rounded-2xl border-2 border-blue-100 shadow-sm animate-fade-in">
                            <Row gutter={[16, { xs: 0, sm: 16 }]}>
                              <Col xs={24} md={8}>
                                <Form.Item name="loto_isolation_point" label={<span className="font-black text-slate-800 text-[11px] uppercase tracking-widest">จุดตัดแยก</span>} rules={[{ required: true }]}>
                                  <Input placeholder="เช่น วาล์ว V-101" />
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={8}>
                                <Form.Item name="loto_energy_type" label={<span className="font-black text-slate-800 text-[11px] uppercase tracking-widest">ประเภทพลังงาน</span>} rules={[{ required: true }]}>
                                  <Select classNames={{ popup: { root: 'font-medium' } }} placeholder="เลือกพลังงาน">
                                    <Select.Option value="ELECTRICAL">ไฟฟ้า</Select.Option>
                                    <Select.Option value="MECHANICAL">เครื่องกล</Select.Option>
                                    <Select.Option value="PNEUMATIC">ลม</Select.Option>
                                  </Select>
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={8}>
                                <Form.Item name="loto_lock_number" label={<span className="font-black text-slate-800 text-[11px] uppercase tracking-widest">หมายเลขแม่กุญแจ</span>} rules={[{ required: true }]}>
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

              {/* ================= STEP 3: Upload & Submit ================= */}
              <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                <div className="animate-fade-in pb-4">
                  <Divider titlePlacement="left" className="m-0 mb-4 md:mb-6 border-slate-200">
                    <span className="font-black text-base md:text-lg text-slate-800">เอกสารแนบ & การยืนยัน</span>
                  </Divider>
                  <Form.Item name="description" label={<span className="font-black text-slate-700 text-[11px] md:text-[12px] uppercase tracking-widest">รายละเอียด/มาตรการเพิ่มเติม (ถ้ามี)</span>}>
                    <Input.TextArea rows={4} placeholder="ระบุรายละเอียดขั้นตอนการทำงาน หรือหมายเหตุเพิ่มเติม..." />
                  </Form.Item>
                  <Form.Item label={<span className="font-black text-slate-700 text-[11px] md:text-[12px] uppercase tracking-widest">อัปโหลดแฟ้มเอกสารรวม (PDF บังคับแนบ)</span>} className="mb-0">
                    <Upload beforeUpload={() => false} maxCount={1} fileList={fileList} onChange={({ fileList }) => setFileList(fileList)}>
                      <Button icon={<UploadOutlined />} className="h-12 md:h-14 rounded-xl w-full text-blue-600 font-bold border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-sm text-xs md:text-sm">
                        คลิกเพื่อแนบไฟล์ PDF/รูปภาพ
                      </Button>
                    </Upload>
                  </Form.Item>
                  
                  <div className="mt-6 md:mt-8 bg-slate-800 p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 shadow-lg">
                    <SafetyCertificateOutlined className="text-3xl md:text-4xl text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="m-0 font-black text-white text-sm md:text-base leading-tight">ข้าพเจ้าขอรับรองว่าข้อมูลทั้งหมดเป็นความจริง</h4>
                      <p className="text-slate-300 text-[11px] md:text-sm font-medium m-0 mt-1 leading-relaxed">
                        ผู้ขอมีความเข้าใจสภาพงานและอธิบายให้ทีมรับทราบแล้ว ยินยอมรับผิดชอบทุกประการหากเกิดข้อผิดพลาด
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
            </Form>
          </div>

          <div className={`bg-white p-4 md:p-6 border-t border-slate-100 flex justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] relative z-10 ${isMobile ? '' : 'rounded-b-[1.5rem]'}`}>
            {currentStep > 0 ? (
              <Button size={isMobile ? "middle" : "large"} onClick={prev} className="h-12 md:h-14 px-4 md:px-8 rounded-lg md:rounded-xl font-extrabold text-slate-600 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-sm">
                ย้อนกลับ
              </Button>
            ) : (
              <Button size={isMobile ? "middle" : "large"} onClick={handleClose} className="h-12 md:h-14 px-4 md:px-8 rounded-lg md:rounded-xl font-bold text-slate-500 hover:bg-slate-50 border-none bg-transparent text-sm">
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
        </>
      )}
    </Modal>
  );
}