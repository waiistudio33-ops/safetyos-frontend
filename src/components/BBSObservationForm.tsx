import React, { useState } from 'react';
import { Form, Input, Select, Button, Upload, DatePicker, Typography } from 'antd';
import { 
  CameraOutlined, 
  EnvironmentOutlined, 
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  SendOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  IdcardOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SafetyOutlined,
  ToolOutlined,
  SyncOutlined,
  FileProtectOutlined,
  LikeOutlined,
  MessageOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
  UserOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;
const { TextArea } = Input;

export default function BBSObservationForm({ onSubmit, onCancel, isSubmitting }: any) {
  const [form] = Form.useForm();
  
  // 🟢 State สำหรับควบคุมปุ่มต่างๆ แบบ Custom
  const [behaviorType, setBehaviorType] = useState('SAFE');
  const [observedGroup, setObservedGroup] = useState('EMPLOYEE');

  const handleFinish = async (values: any) => {
    await onSubmit(values); 
    form.resetFields();     
    setBehaviorType('SAFE'); 
    setObservedGroup('EMPLOYEE');
  };

  const handleBehaviorToggle = (type: string) => {
    setBehaviorType(type);
    form.setFieldsValue({ behavior_type: type });
  };

  const handleGroupToggle = (group: string) => {
    setObservedGroup(group);
    form.setFieldsValue({ observed_group: group });
  };

  return (
    <div className="bg-slate-50/50 rounded-2xl h-full flex flex-col relative overflow-hidden">
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleFinish} 
        initialValues={{
          date: dayjs(),
          behavior_type: 'SAFE',
          observed_group: 'EMPLOYEE'
        }}
        requiredMark={false}
        className="flex flex-col flex-1"
      >
        {/* 📍 Section 1: ข้อมูลพื้นที่และเวลา */}
        <div className="bg-white p-5 md:p-8 rounded-[2rem] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-slate-100 mb-5 md:mb-6 transition-all duration-300 hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
            <div className="bg-blue-50 p-2.5 md:p-3 rounded-xl text-blue-600 shadow-inner">
              <EnvironmentOutlined className="text-xl md:text-2xl" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-800 m-0 tracking-tight">ข้อมูลพื้นที่และเวลา</h2>
              <p className="text-[10px] md:text-xs text-slate-400 m-0 mt-0.5">ระบุสถานที่และเวลาที่พบเห็นเหตุการณ์</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <Form.Item name="date" label={<span className="font-bold text-slate-700 text-xs md:text-sm">วันที่และเวลา</span>} rules={[{ required: true }]}>
              <DatePicker format="DD/MM/YYYY HH:mm" showTime className="w-full rounded-xl h-12 md:h-14 text-sm md:text-base border-slate-200 hover:border-blue-400 focus:border-blue-500" />
            </Form.Item>
            
            <Form.Item name="location" label={<span className="font-bold text-slate-700 text-xs md:text-sm">พื้นที่ที่พบเห็น <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาระบุพื้นที่' }]}>
              <Input placeholder="ระบุโซน / แผนก / ตึก" className="rounded-xl h-12 md:h-14 text-sm md:text-base border-slate-200 hover:border-blue-400 focus:border-blue-500" prefix={<EnvironmentOutlined className="text-slate-400 mr-2" />} />
            </Form.Item>

            {/* 🌟 Segmented Control: พนักงาน vs ผู้รับเหมา (ดีไซน์ใหม่) */}
            <Form.Item name="observed_group" hidden><Input /></Form.Item>
            <div className="md:col-span-2 mt-2 mb-2">
              <div className="font-bold text-slate-700 text-xs md:text-sm mb-2.5">กลุ่มผู้ถูกสังเกต</div>
              
              <div className="bg-slate-100 p-1.5 md:p-2 rounded-[1.25rem] flex w-full shadow-inner relative overflow-hidden">
                
                {/* 🟢 Slider Background (ตัววิ่งดุ๊กดิ๊ก) */}
                <div 
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-md transition-all duration-500 ease-out z-0
                  ${observedGroup === 'EMPLOYEE' ? 'translate-x-0' : 'translate-x-[calc(100%+12px)]'}`}
                ></div>
                
                <div 
                  onClick={() => handleGroupToggle('EMPLOYEE')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 rounded-xl font-bold text-xs md:text-sm cursor-pointer transition-colors duration-500 z-10 select-none
                    ${observedGroup === 'EMPLOYEE' 
                      ? 'text-blue-600' 
                      : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <IdcardOutlined className="text-lg md:text-xl" /> พนักงานบริษัท
                </div>
                
                <div 
                  onClick={() => handleGroupToggle('CONTRACTOR')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 rounded-xl font-bold text-xs md:text-sm cursor-pointer transition-colors duration-500 z-10 select-none
                    ${observedGroup === 'CONTRACTOR' 
                      ? 'text-orange-600' 
                      : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <TeamOutlined className="text-lg md:text-xl" /> ผู้รับเหมา
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* 🛡️ Section 2: การประเมินพฤติกรรม */}
        <div className="bg-white p-5 md:p-8 rounded-[2rem] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-slate-100 mb-5 md:mb-6 transition-all duration-300 hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="bg-emerald-50 p-2.5 md:p-3 rounded-xl text-emerald-600 shadow-inner">
              <SafetyCertificateOutlined className="text-xl md:text-2xl" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-800 m-0 tracking-tight">การประเมินพฤติกรรม</h2>
              <p className="text-[10px] md:text-xs text-slate-400 m-0 mt-0.5">เลือกประเภทพฤติกรรมที่คุณพบเห็น</p>
            </div>
          </div>

          <Form.Item name="behavior_type" hidden><Input /></Form.Item>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
             <div 
                onClick={() => handleBehaviorToggle('SAFE')}
                className={`flex-1 cursor-pointer rounded-[1.5rem] p-6 border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 select-none 
                  ${behaviorType === 'SAFE' 
                    ? 'bg-gradient-to-b from-emerald-50 to-emerald-100/50 border-emerald-400 shadow-[0_8px_20px_rgba(16,185,129,0.2)] scale-[1.02]' 
                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 opacity-70'}`}
             >
                <div className={`text-4xl md:text-5xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110 ${behaviorType === 'SAFE' ? 'text-emerald-500' : 'text-slate-300'}`}>
                  <CheckCircleOutlined />
                </div>
                <div className={`font-black text-sm md:text-lg mt-2 ${behaviorType === 'SAFE' ? 'text-emerald-700' : 'text-slate-500'}`}>พฤติกรรมปลอดภัย (Safe)</div>
             </div>
             
             <div 
                onClick={() => handleBehaviorToggle('UNSAFE')}
                className={`flex-1 cursor-pointer rounded-[1.5rem] p-6 border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 select-none 
                  ${behaviorType === 'UNSAFE' 
                    ? 'bg-gradient-to-b from-rose-50 to-rose-100/50 border-rose-400 shadow-[0_8px_20px_rgba(225,29,72,0.2)] scale-[1.02]' 
                    : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 opacity-70'}`}
             >
                <div className={`text-4xl md:text-5xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110 ${behaviorType === 'UNSAFE' ? 'text-rose-500' : 'text-slate-300'}`}>
                  <WarningOutlined />
                </div>
                <div className={`font-black text-sm md:text-lg mt-2 ${behaviorType === 'UNSAFE' ? 'text-rose-700' : 'text-slate-500'}`}>พฤติกรรมเสี่ยง (At-Risk)</div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            <Form.Item name="category" label={<span className="font-bold text-slate-700 text-xs md:text-sm">หมวดหมู่งาน <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาเลือกหมวดหมู่' }]}>
              <Select size="large" placeholder="เลือกหมวดหมู่งาน" className="h-12 md:h-14">
                <Select.Option value="PPE"><div className="flex items-center gap-2"><SafetyOutlined className="text-blue-500" /> <span>อุปกรณ์ป้องกันภัย (PPE)</span></div></Select.Option>
                <Select.Option value="TOOLS"><div className="flex items-center gap-2"><ToolOutlined className="text-slate-500" /> <span>เครื่องมือ/อุปกรณ์ (Tools)</span></div></Select.Option>
                <Select.Option value="POSTURE"><div className="flex items-center gap-2"><UserOutlined className="text-orange-500" /> <span>ท่าทางการทำงาน (Posture)</span></div></Select.Option>
                <Select.Option value="HOUSEKEEPING"><div className="flex items-center gap-2"><SyncOutlined className="text-emerald-500" /> <span>ความสะอาด (Housekeeping)</span></div></Select.Option>
                <Select.Option value="LINE_OF_FIRE"><div className="flex items-center gap-2"><ExclamationCircleOutlined className="text-rose-500" /> <span>แนวรัศมีอันตราย (Line of Fire)</span></div></Select.Option>
                <Select.Option value="PROCEDURE"><div className="flex items-center gap-2"><FileProtectOutlined className="text-purple-500" /> <span>ขั้นตอนการทำงาน (Procedure)</span></div></Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="action_taken" label={<span className="font-bold text-slate-700 text-xs md:text-sm">การตอบสนองของคุณ <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาเลือกการดำเนินการ' }]}>
              <Select size="large" placeholder="เลือกการตอบสนอง" className="h-12 md:h-14">
                <Select.Option value="PRAISED"><div className="flex items-center gap-2"><LikeOutlined className="text-emerald-500" /> <span className="text-emerald-600 font-bold">กล่าวชื่นชม (Praised)</span></div></Select.Option>
                <Select.Option value="CORRECTED"><div className="flex items-center gap-2"><MessageOutlined className="text-blue-500" /> <span className="text-blue-600 font-bold">แนะนำ/แก้ไขทันที (Corrected)</span></div></Select.Option>
                <Select.Option value="VERBAL_WARNING"><div className="flex items-center gap-2"><WarningOutlined className="text-orange-500" /> <span className="text-orange-500 font-bold">ตักเตือน (Verbal Warning)</span></div></Select.Option>
                <Select.Option value="STOP_WORK"><div className="flex items-center gap-2"><StopOutlined className="text-rose-500" /> <span className="text-rose-600 font-bold">สั่งหยุดงาน (Stop Work)</span></div></Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="description" label={<span className="font-bold text-slate-700 text-xs md:text-sm">รายละเอียดสิ่งที่พบเห็น <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาระบุรายละเอียด' }]} className="mt-2">
            <TextArea rows={3} placeholder="อธิบายพฤติกรรมที่พบอย่างชัดเจน..." className="rounded-xl p-4 text-sm md:text-base border-slate-200 hover:border-blue-400 focus:border-blue-500 bg-slate-50/50 focus:bg-white transition-colors" />
          </Form.Item>

          {/* ⚡ ส่วนวิเคราะห์สาเหตุ (โชว์เฉพาะ UNSAFE) */}
          {behaviorType === 'UNSAFE' && (
            <div className="bg-gradient-to-br from-rose-50 to-orange-50/30 p-5 md:p-6 rounded-[1.5rem] border border-rose-200 mt-6 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
              
              <div className="text-rose-700 font-black text-sm md:text-base mb-4 flex items-center gap-2">
                <div className="bg-rose-100 p-1.5 rounded-lg"><ThunderboltOutlined /></div> การวิเคราะห์สาเหตุ (Root Cause)
              </div>
              
              <div className="pl-2">
                <Form.Item name="root_cause" label={<span className="font-bold text-slate-700 text-xs md:text-sm">อะไรคือสาเหตุที่ทำให้เกิดความเสี่ยง?</span>} rules={[{ required: behaviorType === 'UNSAFE', message: 'กรุณาระบุสาเหตุ' }]}>
                  <Select size="large" placeholder="เลือกสาเหตุหลัก" className="h-12 md:h-14">
                    <Select.Option value="RUSH"><div className="flex items-center gap-2"><ClockCircleOutlined className="text-orange-500" /> <span>รีบเร่ง / ต้องการประหยัดเวลา</span></div></Select.Option>
                    <Select.Option value="UNAWARE"><div className="flex items-center gap-2"><QuestionCircleOutlined className="text-slate-500" /> <span>ไม่รู้ / ไม่ตระหนักถึงอันตราย</span></div></Select.Option>
                    <Select.Option value="EQUIPMENT"><div className="flex items-center gap-2"><ToolOutlined className="text-blue-500" /> <span>อุปกรณ์ไม่พร้อม / ไม่เหมาะสม</span></div></Select.Option>
                    <Select.Option value="HABIT"><div className="flex items-center gap-2"><SyncOutlined className="text-purple-500" /> <span>ความเคยชิน / ทำเป็นประจำ</span></div></Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item name="suggestion" label={<span className="font-bold text-slate-700 text-xs md:text-sm">ข้อเสนอแนะเพื่อป้องกัน (Preventive Measure)</span>} className="mb-0">
                  <TextArea rows={2} placeholder="เสนอวิธีแก้ไขไม่ให้เกิดซ้ำ..." className="rounded-xl p-3 border-slate-200 hover:border-rose-400 focus:border-rose-500" />
                </Form.Item>
              </div>
            </div>
          )}
        </div>

        {/* 📸 Section 3: รูปภาพประกอบ */}
        <div className="bg-white p-5 md:p-8 rounded-[2rem] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-slate-100 mb-6 transition-all duration-300 hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]">
           <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
             <div className="flex items-center gap-3">
               <div className="bg-purple-50 p-2.5 md:p-3 rounded-xl text-purple-600 shadow-inner">
                <PictureOutlined className="text-xl md:text-2xl" />
               </div>
               <div>
                <h2 className="text-lg md:text-xl font-black text-slate-800 m-0 tracking-tight">รูปภาพประกอบ</h2>
                <p className="text-[10px] md:text-xs text-slate-400 m-0 mt-0.5">แนบรูปภาพสภาพแวดล้อม (ทางเลือก)</p>
               </div>
             </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed mb-2 text-center">
            <Form.Item name="photos" className="mb-0 w-full flex justify-center">
              <Upload listType="picture-card" maxCount={2} beforeUpload={() => false} customRequest={() => {}} className="bbs-upload-custom">
                <div className="text-slate-500 flex flex-col items-center justify-center p-4">
                  <CameraOutlined className="text-2xl md:text-3xl mb-2 text-blue-500" />
                  <div className="text-xs md:text-sm font-bold text-slate-600">แตะเพื่อเพิ่มรูปภาพ</div>
                  <div className="text-[10px] text-slate-400 mt-1">สูงสุด 2 รูป</div>
                </div>
              </Upload>
            </Form.Item>
          </div>
          <Text type="secondary" className="text-[10px] md:text-xs flex items-center justify-center gap-1 text-orange-500 font-medium">
            <InfoCircleOutlined /> กรุณาหลีกเลี่ยงการถ่ายติดใบหน้าบุคคลโดยตรง
          </Text>
        </div>

        {/* 🚀 Footer Buttons */}
        <div className="flex gap-3 md:gap-4 sticky bottom-0 bg-white/80 backdrop-blur-xl py-4 md:py-5 border-t border-slate-200 z-20 mt-auto -mx-1 px-4 md:px-6 rounded-b-[2rem] shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
          <Button 
            size="large" 
            onClick={onCancel} 
            className="flex-1 h-12 md:h-14 rounded-2xl font-bold bg-slate-100 border-none text-slate-600 hover:bg-slate-200 hover:text-slate-800 text-xs md:text-base transition-colors"
          >
            ยกเลิก
          </Button>
          <Button 
            size="large" 
            type="primary" 
            htmlType="submit" 
            loading={isSubmitting} 
            icon={<SendOutlined />}
            className="flex-[2] h-12 md:h-14 rounded-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(79,70,229,0.6)] text-white text-sm md:text-base transition-all"
          >
            บันทึกรายงาน BBS
          </Button>
        </div>

      </Form>

      <style>{`
        .bbs-upload-custom .ant-upload.ant-upload-select-picture-card {
          width: 120px !important;
          height: 120px !important;
          border-radius: 16px !important;
          border: 2px dashed #cbd5e1 !important;
          background: white !important;
          transition: all 0.3s ease;
        }
        .bbs-upload-custom .ant-upload.ant-upload-select-picture-card:hover {
          border-color: #3b82f6 !important;
          background: #eff6ff !important;
        }
        @media (max-width: 768px) {
           .bbs-upload-custom .ant-upload.ant-upload-select-picture-card {
             width: 100px !important;
             height: 100px !important;
           }
        }
      `}</style>
    </div>
  );
}