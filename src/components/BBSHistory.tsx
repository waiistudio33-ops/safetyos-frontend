import React, { useState } from 'react';
import { Form, Input, Select, Radio, Button, Upload, DatePicker, Typography, Divider, Space } from 'antd';
import { 
  CameraOutlined, 
  EnvironmentOutlined, 
  UsergroupAddOutlined, 
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  SendOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TextArea } = Input;

export default function BBSObservationForm({ onSubmit, onCancel, isSubmitting }: any) {
  const [form] = Form.useForm();
  
  // 🟢 State ไว้เช็คว่าเลือกพฤติกรรมเสี่ยงหรือไม่ เพื่อโชว์ช่องวิเคราะห์สาเหตุ
  const [behaviorType, setBehaviorType] = useState('SAFE');

  return (
    <div className="bg-slate-50 -mx-6 -mt-6 -mb-6">
      {/* 🌟 Header Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 md:p-8 text-white rounded-t-xl">
        <Title level={3} style={{ color: 'white', margin: 0 }} className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <SafetyCertificateOutlined />
          </div>
          บันทึกสังเกตพฤติกรรม (BBS)
        </Title>
        <p className="text-emerald-50 mt-2 mb-0 text-sm md:text-base opacity-90">
          Behavior-Based Safety Observation Form
        </p>
      </div>

      <Form 
        form={form} 
        layout="vertical" 
        onFinish={onSubmit} 
        className="p-4 md:p-8"
        initialValues={{
          date: dayjs(),
          behavior_type: 'SAFE'
        }}
        requiredMark={false}
      >
        {/* 🌟 1. ข้อมูลทั่วไป (General Info) */}
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold border-b border-slate-100 pb-3 text-base md:text-lg">
            <EnvironmentOutlined className="text-blue-500" /> ข้อมูลพื้นที่และเวลา
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item name="date" label={<span className="font-semibold text-slate-600">วันที่สังเกตการณ์</span>} rules={[{ required: true }]}>
              <DatePicker format="DD/MM/YYYY HH:mm" showTime className="w-full rounded-xl" size="large" />
            </Form.Item>
            
            <Form.Item name="location" label={<span className="font-semibold text-slate-600">พื้นที่ที่พบเห็น <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาระบุพื้นที่' }]}>
              <Input placeholder="ระบุโซน / แผนก / ตึก" size="large" className="rounded-xl" />
            </Form.Item>

            <Form.Item name="observed_group" label={<span className="font-semibold text-slate-600">กลุ่มผู้ถูกสังเกต</span>} className="md:col-span-2 mb-0">
              <Radio.Group className="flex flex-wrap gap-3 w-full">
                <Radio value="EMPLOYEE" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 m-0 hover:border-blue-400 transition-colors">พนักงานบริษัท (Employee)</Radio>
                <Radio value="CONTRACTOR" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 m-0 hover:border-blue-400 transition-colors">ผู้รับเหมา (Contractor)</Radio>
              </Radio.Group>
            </Form.Item>
          </div>
        </div>

        {/* 🌟 2. การสังเกตพฤติกรรม (Observation Details) */}
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold border-b border-slate-100 pb-3 text-base md:text-lg">
            <SafetyCertificateOutlined className="text-emerald-500" /> การประเมินพฤติกรรม
          </div>

          <Form.Item name="behavior_type" label={<span className="font-semibold text-slate-600">ประเภทพฤติกรรม <span className="text-red-500">*</span></span>}>
            <Radio.Group 
              className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
              onChange={(e) => setBehaviorType(e.target.value)}
            >
              <Radio.Button 
                value="SAFE" 
                className={`h-auto p-4 text-center rounded-2xl border-2 transition-all ${behaviorType === 'SAFE' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' : 'border-slate-200 text-slate-500'}`}
              >
                <div className="text-lg mb-1">✅</div>
                พฤติกรรมปลอดภัย (Safe)
              </Radio.Button>
              <Radio.Button 
                value="UNSAFE" 
                className={`h-auto p-4 text-center rounded-2xl border-2 transition-all ${behaviorType === 'UNSAFE' ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold' : 'border-slate-200 text-slate-500'}`}
              >
                <div className="text-lg mb-1">⚠️</div>
                พฤติกรรมเสี่ยง (At-Risk)
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item name="category" label={<span className="font-semibold text-slate-600">หมวดหมู่ <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาเลือกหมวดหมู่' }]}>
              <Select size="large" placeholder="เลือกหมวดหมู่งาน" className="rounded-xl">
                <Select.Option value="PPE">🛡️ อุปกรณ์ป้องกันภัย (PPE)</Select.Option>
                <Select.Option value="TOOLS">🔧 เครื่องมือและอุปกรณ์ (Tools/Equipment)</Select.Option>
                <Select.Option value="POSTURE">🏃 ท่าทางการทำงาน (Body Mechanics)</Select.Option>
                <Select.Option value="HOUSEKEEPING">🧹 ความสะอาดและระเบียบ (Housekeeping)</Select.Option>
                <Select.Option value="LINE_OF_FIRE">🎯 แนวรัศมีอันตราย (Line of Fire)</Select.Option>
                <Select.Option value="PROCEDURE">📜 ขั้นตอนการทำงาน (Procedures)</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="action_taken" label={<span className="font-semibold text-slate-600">การดำเนินการทันที (Immediate Action) <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาเลือกการดำเนินการ' }]}>
              <Select size="large" placeholder="เลือกการตอบสนอง" className="rounded-xl">
                <Select.Option value="PRAISED">👏 กล่าวชื่นชม (Praised)</Select.Option>
                <Select.Option value="CORRECTED">🗣️ แนะนำ/แก้ไขทันที (Corrected on spot)</Select.Option>
                <Select.Option value="VERBAL_WARNING">⚠️ ตักเตือน (Verbal Warning)</Select.Option>
                <Select.Option value="STOP_WORK">🛑 สั่งหยุดงาน (Stop Work Authority)</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="description" label={<span className="font-semibold text-slate-600">รายละเอียดสิ่งที่พบเห็น <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาระบุรายละเอียด' }]}>
            <TextArea rows={3} placeholder="อธิบายพฤติกรรมที่พบอย่างชัดเจน (ใคร, ทำอะไร, อย่างไร)" className="rounded-xl" />
          </Form.Item>

          {/* 🌟 Conditional Rendering: โชว์เมื่อเลือกพฤติกรรมเสี่ยง */}
          {behaviorType === 'UNSAFE' && (
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 animate-fade-in mb-4">
              <div className="text-rose-700 font-bold mb-3 flex items-center gap-2">
                <ThunderboltOutlined /> การวิเคราะห์สาเหตุ (Root Cause Analysis)
              </div>
              <Form.Item name="root_cause" label={<span className="font-medium text-slate-700">สาเหตุที่ทำให้เกิดพฤติกรรมเสี่ยง</span>} rules={[{ required: behaviorType === 'UNSAFE', message: 'กรุณาระบุสาเหตุ' }]}>
                <Select size="large" placeholder="เลือกสาเหตุหลัก" className="rounded-xl bg-white">
                  <Select.Option value="RUSH">⏳ รีบเร่ง / ต้องการประหยัดเวลา</Select.Option>
                  <Select.Option value="UNAWARE">🤷 ไม่รู้ / ไม่ตระหนักถึงอันตราย</Select.Option>
                  <Select.Option value="EQUIPMENT">🛠️ อุปกรณ์ไม่พร้อม / ไม่เหมาะสม</Select.Option>
                  <Select.Option value="HABIT">🔁 ความเคยชิน / ทำเป็นประจำ</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="suggestion" label={<span className="font-medium text-slate-700">ข้อเสนอแนะเพื่อป้องกัน (Preventive Measure)</span>} className="mb-0">
                <TextArea rows={2} placeholder="เสนอวิธีแก้ไขไม่ให้เกิดซ้ำ" className="rounded-xl bg-white" />
              </Form.Item>
            </div>
          )}
        </div>

        {/* 🌟 3. แนบรูปภาพ (Evidence) */}
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
           <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-base md:text-lg">
            <CameraOutlined className="text-slate-500" /> รูปภาพประกอบ (ถ้ามี)
          </div>
          <Text type="secondary" className="text-xs mb-4 block"><InfoCircleOutlined /> แนะนำให้ถ่ายภาพที่ไม่เห็นใบหน้าชัดเจน หรือภาพสภาพแวดล้อม</Text>
          <Form.Item name="photos" className="mb-0">
            <Upload listType="picture-card" maxCount={2} beforeUpload={() => false}>
              <div className="text-slate-500 flex flex-col items-center">
                <CameraOutlined className="text-2xl mb-1" />
                <div className="text-xs">เพิ่มรูปภาพ</div>
              </div>
            </Upload>
          </Form.Item>
        </div>

        {/* 🌟 Footer Actions */}
        <div className="flex gap-4 sticky bottom-0 bg-slate-50 py-4 border-t border-slate-200 z-10 -mx-4 -mb-8 px-4 md:-mx-8 md:px-8">
          <Button 
            size="large" 
            onClick={onCancel} 
            className="flex-1 rounded-xl h-14 font-bold bg-white border-slate-300 text-slate-600 hover:text-slate-800 hover:border-slate-400"
          >
            ยกเลิก
          </Button>
          <Button 
            size="large" 
            type="primary" 
            htmlType="submit" 
            loading={isSubmitting} 
            icon={<SendOutlined />}
            className="flex-1 rounded-xl h-14 font-bold bg-emerald-500 hover:bg-emerald-600 border-none shadow-lg shadow-emerald-500/30 text-white"
          >
            บันทึก BBS
          </Button>
        </div>
      </Form>
    </div>
  );
}