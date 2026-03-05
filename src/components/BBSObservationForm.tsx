import React, { useState } from 'react';
import { Form, Input, Select, Radio, Button, Upload, DatePicker, Typography } from 'antd';
import { 
  CameraOutlined, 
  EnvironmentOutlined, 
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  SendOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;
const { TextArea } = Input;

export default function BBSObservationForm({ onSubmit, onCancel, isSubmitting }: any) {
  const [form] = Form.useForm();
  const [behaviorType, setBehaviorType] = useState('SAFE');

  const handleFinish = async (values: any) => {
    await onSubmit(values); 
    form.resetFields();     
    setBehaviorType('SAFE'); 
  };

  return (
    <div className="bg-slate-50 rounded-xl h-full">
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleFinish} 
        initialValues={{
          date: dayjs(),
          behavior_type: 'SAFE'
        }}
        requiredMark={false}
      >
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3 text-lg font-bold text-slate-800">
            <EnvironmentOutlined className="text-blue-500" /> ข้อมูลพื้นที่และเวลา
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item name="date" label={<span className="font-semibold text-slate-600">วันที่สังเกตการณ์</span>} rules={[{ required: true }]}>
              <DatePicker format="DD/MM/YYYY HH:mm" showTime className="w-full rounded-lg" size="large" />
            </Form.Item>
            
            <Form.Item name="location" label={<span className="font-semibold text-slate-600">พื้นที่ที่พบเห็น <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาระบุพื้นที่' }]}>
              <Input placeholder="ระบุโซน / แผนก / ตึก" size="large" className="rounded-lg" />
            </Form.Item>

            <Form.Item name="observed_group" label={<span className="font-semibold text-slate-600">กลุ่มผู้ถูกสังเกต</span>} className="md:col-span-2 mb-0">
              <Radio.Group className="flex flex-wrap gap-3 w-full">
                <Radio.Button value="EMPLOYEE" className="rounded-lg">พนักงานบริษัท (Employee)</Radio.Button>
                <Radio.Button value="CONTRACTOR" className="rounded-lg">ผู้รับเหมา (Contractor)</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3 text-lg font-bold text-slate-800">
            <SafetyCertificateOutlined className="text-emerald-500" /> การประเมินพฤติกรรม
          </div>

          <Form.Item name="behavior_type" label={<span className="font-semibold text-slate-600">ประเภทพฤติกรรม <span className="text-red-500">*</span></span>}>
            <Radio.Group 
              className="flex gap-4 w-full"
              onChange={(e) => setBehaviorType(e.target.value)}
            >
              <Radio.Button 
                value="SAFE" 
                className={`flex-1 h-auto p-4 text-center rounded-xl border-2 transition-all ${behaviorType === 'SAFE' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold' : 'bg-white border-slate-200 text-slate-500'}`}
              >
                <div className="text-2xl mb-1">✅</div>
                พฤติกรรมปลอดภัย (Safe)
              </Radio.Button>
              <Radio.Button 
                value="UNSAFE" 
                className={`flex-1 h-auto p-4 text-center rounded-xl border-2 transition-all ${behaviorType === 'UNSAFE' ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold' : 'bg-white border-slate-200 text-slate-500'}`}
              >
                <div className="text-2xl mb-1">⚠️</div>
                พฤติกรรมเสี่ยง (At-Risk)
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item name="category" label={<span className="font-semibold text-slate-600">หมวดหมู่ <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาเลือกหมวดหมู่' }]}>
              <Select size="large" placeholder="เลือกหมวดหมู่งาน" className="rounded-lg">
                <Select.Option value="PPE">🛡️ อุปกรณ์ป้องกันภัย (PPE)</Select.Option>
                <Select.Option value="TOOLS">🔧 เครื่องมือและอุปกรณ์ (Tools/Equipment)</Select.Option>
                <Select.Option value="POSTURE">🏃 ท่าทางการทำงาน (Body Mechanics)</Select.Option>
                <Select.Option value="HOUSEKEEPING">🧹 ความสะอาดและระเบียบ (Housekeeping)</Select.Option>
                <Select.Option value="LINE_OF_FIRE">🎯 แนวรัศมีอันตราย (Line of Fire)</Select.Option>
                <Select.Option value="PROCEDURE">📜 ขั้นตอนการทำงาน (Procedures)</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="action_taken" label={<span className="font-semibold text-slate-600">การดำเนินการทันที <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาเลือกการดำเนินการ' }]}>
              <Select size="large" placeholder="เลือกการตอบสนอง" className="rounded-lg">
                <Select.Option value="PRAISED">👏 กล่าวชื่นชม (Praised)</Select.Option>
                <Select.Option value="CORRECTED">🗣️ แนะนำ/แก้ไขทันที (Corrected on spot)</Select.Option>
                <Select.Option value="VERBAL_WARNING">⚠️ ตักเตือน (Verbal Warning)</Select.Option>
                <Select.Option value="STOP_WORK">🛑 สั่งหยุดงาน (Stop Work Authority)</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="description" label={<span className="font-semibold text-slate-600">รายละเอียดสิ่งที่พบเห็น <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาระบุรายละเอียด' }]}>
            <TextArea rows={3} placeholder="อธิบายพฤติกรรมที่พบอย่างชัดเจน" className="rounded-lg" />
          </Form.Item>

          {behaviorType === 'UNSAFE' && (
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 mb-4 animate-fade-in">
              <div className="text-rose-700 font-bold mb-3 flex items-center gap-2">
                <ThunderboltOutlined /> การวิเคราะห์สาเหตุ (Root Cause Analysis)
              </div>
              <Form.Item name="root_cause" label={<span className="font-medium text-slate-700">สาเหตุที่ทำให้เกิดพฤติกรรมเสี่ยง</span>} rules={[{ required: behaviorType === 'UNSAFE', message: 'กรุณาระบุสาเหตุ' }]}>
                <Select size="large" placeholder="เลือกสาเหตุหลัก" className="rounded-lg bg-white">
                  <Select.Option value="RUSH">⏳ รีบเร่ง / ต้องการประหยัดเวลา</Select.Option>
                  <Select.Option value="UNAWARE">🤷 ไม่รู้ / ไม่ตระหนักถึงอันตราย</Select.Option>
                  <Select.Option value="EQUIPMENT">🛠️ อุปกรณ์ไม่พร้อม / ไม่เหมาะสม</Select.Option>
                  <Select.Option value="HABIT">🔁 ความเคยชิน / ทำเป็นประจำ</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="suggestion" label={<span className="font-medium text-slate-700">ข้อเสนอแนะเพื่อป้องกัน (Preventive Measure)</span>} className="mb-0">
                <TextArea rows={2} placeholder="เสนอวิธีแก้ไขไม่ให้เกิดซ้ำ" className="rounded-lg bg-white" />
              </Form.Item>
            </div>
          )}
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
           <div className="flex items-center gap-2 mb-2 text-lg font-bold text-slate-800">
            <CameraOutlined className="text-slate-500" /> รูปภาพประกอบ (ถ้ามี)
          </div>
          <Text type="secondary" className="text-xs mb-4 block"><InfoCircleOutlined /> แนะนำให้ถ่ายภาพที่ไม่เห็นใบหน้าชัดเจน หรือภาพสภาพแวดล้อม</Text>
          <Form.Item name="photos" className="mb-0">
            {/* 🟢 เพิ่ม customRequest={() => {}} เพื่อกัน Error ของ Antd Upload */}
            <Upload listType="picture-card" maxCount={2} beforeUpload={() => false} customRequest={() => {}}>
              <div className="text-slate-500 flex flex-col items-center">
                <CameraOutlined className="text-2xl mb-1" />
                <div className="text-xs font-medium">เพิ่มรูปภาพ</div>
              </div>
            </Upload>
          </Form.Item>
        </div>

        {/* 🟢 เอา padding ที่ล้นออกไป ให้ปุ่มเรียงสวยงาม */}
        <div className="flex gap-4 sticky bottom-0 bg-slate-50 py-4 border-t border-slate-200 z-10">
          <Button 
            size="large" 
            onClick={onCancel} 
            className="flex-1 h-12 rounded-xl font-bold bg-white border-slate-300 text-slate-600 hover:text-slate-800 hover:border-slate-400"
          >
            ยกเลิก
          </Button>
          <Button 
            size="large" 
            type="primary" 
            htmlType="submit" 
            loading={isSubmitting} 
            icon={<SendOutlined />}
            className="flex-1 h-12 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 border-none shadow-lg shadow-emerald-500/30 text-white"
          >
            บันทึก BBS
          </Button>
        </div>
      </Form>
    </div>
  );
}