import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ConfigProvider, Form, Input, Button, Divider, Avatar, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, MailOutlined, PhoneOutlined, IdcardOutlined, CheckCircleOutlined, TeamOutlined } from '@ant-design/icons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface LoginScreenProps {
  onLogin: (values: any) => Promise<void>;
  onLineLogin: () => Promise<void>; // เปลี่ยนเป็น Promise เพื่อให้เรารอรับผลลัพธ์ได้
  onSSOLogin: () => void;
  isLoggingIn: boolean;
  lineProfile: any;
}

export default function LoginScreen({ onLogin, onLineLogin, onSSOLogin, isLoggingIn, lineProfile }: LoginScreenProps) {
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [lineBindingForm] = Form.useForm(); // 🟢 ฟอร์มสำหรับ LINE Progressive Profiling
  
  // ควบคุมหน้าจอว่าจะโชว์อะไร
  const [viewMode, setViewMode] = useState<'LOGIN' | 'REGISTER' | 'LINE_BINDING'>('LOGIN');
  
  // States สำหรับระบบ OTP
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // ถ้ามี lineProfile เข้ามา และเรากำลังรอกรอกข้อมูล ให้ตั้งค่าเริ่มต้นลงฟอร์ม
  useEffect(() => {
    if (lineProfile && viewMode === 'LINE_BINDING') {
      lineBindingForm.setFieldsValue({
        full_name: lineProfile.displayName, // ดึงชื่อ LINE มาเป็นค่าเริ่มต้น (เผื่อขี้เกียจพิมพ์)
      });
    }
  }, [lineProfile, viewMode]);

  const switchView = (mode: 'LOGIN' | 'REGISTER' | 'LINE_BINDING') => {
    setViewMode(mode);
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setOtpValue('');
    registerForm.resetFields();
  };

  // 🚀 1. ยิง API ขอรหัส OTP (สำหรับสมัครผ่าน Email)
  const handleSendOTP = async () => {
    const email = registerForm.getFieldValue('email');
    if (!email || !email.includes('@')) { message.warning('กรุณากรอกอีเมลที่ถูกต้องก่อนขอรับรหัส OTP'); return; }
    setIsSendingOtp(true);
    try {
      await axios.post(`${API_URL}/auth/request-otp`, { email });
      setIsOtpSent(true);
      message.success(`ส่งรหัส 6 หลักไปที่ ${email} แล้ว!`);
    } catch (error: any) { message.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการส่งอีเมล'); } 
    finally { setIsSendingOtp(false); }
  };

  // 🚀 2. ยิง API ตรวจสอบ OTP
  const handleVerifyOTP = async () => {
    if (otpValue.length !== 6) { message.error('กรุณากรอกรหัส 6 หลักให้ครบ'); return; }
    try {
      const email = registerForm.getFieldValue('email');
      await axios.post(`${API_URL}/auth/verify-otp`, { email, otp: otpValue });
      setIsOtpVerified(true);
      message.success('ยืนยันอีเมลสำเร็จ!');
    } catch (error: any) { message.error(error.response?.data?.error || 'รหัส OTP ไม่ถูกต้อง หรือหมดอายุแล้ว'); }
  };

  // 🚀 3. ยิง API สมัครสมาชิก (Email)
  const handleRegister = async (values: any) => {
    if (!isOtpVerified) { message.warning('กรุณายืนยันอีเมลด้วยรหัส OTP ก่อนสร้างบัญชี'); return; }
    setIsRegistering(true);
    try {
      const response = await axios.post(`${API_URL}/register`, values);
      if (response.data.success) {
        message.success('สร้างบัญชีสำเร็จ! กรุณาเข้าสู่ระบบ');
        setTimeout(() => { switchView('LOGIN'); loginForm.setFieldsValue({ username: values.email }); }, 1000);
      }
    } catch (error: any) { message.error(error.response?.data?.error || 'ไม่สามารถสร้างบัญชีได้'); } 
    finally { setIsRegistering(false); }
  };

  // 🚀 4. จัดการปุ่ม "ล็อกอินด้วย LINE"
  const handleLineClick = async () => {
    try {
      // เรียกฟังก์ชันเชื่อมต่อ LIFF จาก App.tsx
      await onLineLogin();
      
      // หมายเหตุ: ตรงนี้ในของจริง ถ้า backend ตอบกลับมา 401 (ยังไม่เคยมีบัญชี)
      // เฮียต้องดักจับ Error ตรงนี้ แล้วสั่ง `switchView('LINE_BINDING')` ครับ
      // ตัวอย่าง:
      // if (userIsNew) { switchView('LINE_BINDING'); }
      
    } catch (error: any) {
      // จำลองว่าถ้าหลังบ้านบอกว่า "ยังไม่ได้ผูกบัญชี" ให้พาไปหน้ากรอกข้อมูล
      if (error.message === 'NEW_USER' || error.response?.status === 401) {
        message.info('พบการเข้าใช้งานครั้งแรก กรุณากรอกข้อมูลเพิ่มเติมเพื่อเริ่มใช้งาน');
        switchView('LINE_BINDING');
      } else {
        message.error('เกิดข้อผิดพลาดในการเชื่อมต่อ LINE');
      }
    }
  };

  // 🚀 5. บันทึกข้อมูล Progressive Profiling (LINE)
  const handleLineRegisterSubmit = async (values: any) => {
    if (!lineProfile) { message.error('ไม่พบข้อมูลจาก LINE กรุณาลองใหม่อีกครั้ง'); return; }
    
    setIsRegistering(true);
    try {
      const response = await axios.post(`${API_URL}/register/line`, {
        line_id: lineProfile.userId,
        picture_url: lineProfile.pictureUrl,
        full_name: values.full_name,
        employee_id: values.employee_id,
        department: values.department
      });

      if (response.data.success) {
        message.success('ลงทะเบียนสำเร็จ! กำลังเข้าสู่ระบบ...');
        // TODO: นำ Token ไปบันทึกลง localStorage แล้วเข้าสู่ระบบ
        // localStorage.setItem('token', response.data.token);
        // window.location.reload();
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#2563eb', fontFamily: "var(--font-system, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif)" } }}>
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f7f9] p-4 sm:p-8">
        <div className={`w-full ${viewMode !== 'LOGIN' ? 'max-w-[1200px]' : 'max-w-[1000px]'} bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] flex flex-col md:flex-row overflow-hidden relative transition-all duration-500 ease-in-out`}>
          
          {/* 🌈 Colorful Vibrant Gradient Background (ซ้ายมือ) */}
          <div 
            className="w-full md:w-[45%] lg:w-[40%] min-h-[250px] md:min-h-[600px] relative flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-slate-100/50"
            style={{ backgroundColor: '#ffffff', backgroundImage: `radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.45) 0%, transparent 60%), radial-gradient(circle at 90% 10%, rgba(16, 185, 129, 0.35) 0%, transparent 60%), radial-gradient(circle at 10% 90%, rgba(244, 63, 94, 0.35) 0%, transparent 60%), radial-gradient(circle at 90% 90%, rgba(234, 179, 8, 0.35) 0%, transparent 60%)` }}
          >
            <svg className="hidden md:block absolute right-0 top-0 h-full w-[80px] text-white z-10 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100" fill="currentColor"><path d="M100,0 L100,100 L0,100 C 60,70 40,30 0,0 Z" /></svg>
            <svg className="md:hidden absolute bottom-[-1px] left-0 w-full h-[40px] text-white z-10 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100" fill="currentColor"><path d="M0,100 L100,100 L100,0 C 70,60 30,40 0,0 Z" /></svg>

            {/* Glass Hero Card */}
            <div className="z-20 flex flex-col items-center justify-center rounded-[2rem] w-[240px] h-[240px] p-6 text-center border border-white/60 shadow-[0_16px_40px_rgba(0,0,0,0.06)] transition-transform hover:scale-105 duration-300" style={{ background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(16px)' }}>
              <div className="bg-white p-3.5 rounded-2xl shadow-sm mb-4 flex items-center justify-center"><SafetyOutlined className="text-4xl text-blue-600" /></div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight m-0 drop-shadow-sm">Safety<span className="text-[#2563eb]">OS</span></h1>
              <p className="text-slate-500 font-extrabold mt-1 tracking-widest uppercase text-[10px]">Safety Gateway</p>
            </div>
          </div>

          {/* 📝 Content Area (ขวามือ) */}
          <div className="w-full md:w-[55%] lg:w-[60%] p-8 sm:p-12 flex flex-col justify-center bg-white z-20 relative overflow-y-auto max-h-[90vh] md:max-h-none custom-scrollbar">
            
            {/* =========================================================
                🔐 1. หน้าต่าง LOGIN
                ========================================================= */}
            {viewMode === 'LOGIN' && (
              <div className="w-full max-w-[380px] mx-auto text-left animate-fade-in">
                <h2 className="text-[32px] sm:text-[36px] font-black text-[#1e293b] mb-1 tracking-tight">เข้าสู่ระบบ</h2>
                <p className="text-slate-500 font-medium text-[13px] mb-8">กรุณายืนยันตัวตนเพื่อดำเนินการต่อ</p>

                <Form form={loginForm} layout="vertical" onFinish={onLogin} requiredMark={false} className="mb-0 custom-login-form">
                  <Form.Item name="username" label={<span className="text-[13px] text-[#1e293b] font-extrabold tracking-wide mb-1 block">รหัสพนักงาน หรือ อีเมล</span>} rules={[{ required: true, message: 'กรุณาระบุข้อมูล' }]} className="mb-5">
                    <Input size="large" prefix={<UserOutlined className="text-slate-400 text-lg mr-2" />} placeholder="ระบุข้อมูล" className="rounded-2xl h-[54px] px-5 bg-[#f8fafc] focus:bg-white transition-all" />
                  </Form.Item>
                  <Form.Item name="password" label={<span className="text-[13px] text-[#1e293b] font-extrabold tracking-wide mb-1 block">รหัสผ่าน</span>} rules={[{ required: true, message: 'กรุณาระบุรหัสผ่าน' }]} className="mb-2">
                    <Input.Password size="large" prefix={<LockOutlined className="text-slate-400 text-lg mr-2" />} placeholder="ระบุรหัสผ่าน" className="rounded-2xl h-[54px] px-5 bg-[#f8fafc] focus:bg-white transition-all" />
                  </Form.Item>
                  <div className="text-right mb-6"><a href="#" onClick={(e) => { e.preventDefault(); message.info('กรุณาติดต่อ IT Support เพื่อรีเซ็ตรหัสผ่าน'); }} className="text-slate-400 hover:text-blue-600 text-[12px] font-bold">ลืมรหัสผ่าน?</a></div>
                  
                  <Button htmlType="submit" loading={isLoggingIn} className="w-full h-[54px] rounded-2xl font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] border-none text-[16px] shadow-[0_8px_24px_-8px_rgba(37,99,235,0.4)]">
                    เข้าสู่ระบบ (Sign In)
                  </Button>
                </Form>

                <Divider plain className="my-8 text-slate-400 text-[11px] font-medium border-slate-100">หรือเข้าสู่ระบบด้วย</Divider>

                <div className="grid grid-cols-2 gap-4">
                  <Button size="large" onClick={handleLineClick} className="h-[52px] rounded-2xl font-extrabold text-[#1e293b] border border-slate-200 hover:border-[#00C300] hover:bg-emerald-50/30 flex items-center justify-center gap-2 group">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="group-hover:scale-110 transition-transform text-[#00C300]"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.938 8.91 9.388 9.62.367.082.868.256.996.584.115.294.074.755.035 1.053-.053.407-.246 1.488-.299 1.748-.087.419.412.632.748.441 3.585-2.036 9.539-5.617 11.83-9.351C23.633 12.923 24 11.666 24 10.304z"/></svg>
                    LINE
                  </Button>
                  <Button size="large" onClick={onSSOLogin} className="h-[52px] rounded-2xl font-extrabold text-[#1e293b] border border-slate-200 hover:border-[#00a4ef] hover:bg-blue-50/30 flex items-center justify-center gap-2 group">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform"><path fill="#f25022" d="M11.4 11.4H0V0h11.4v11.4z"/><path fill="#7fba00" d="M24 11.4H12.6V0H24v11.4z"/><path fill="#00a4ef" d="M11.4 24H0V12.6h11.4V24z"/><path fill="#ffb900" d="M24 24H12.6V12.6H24V24z"/></svg>
                    SSO
                  </Button>
                </div>
                
                <div className="mt-8 text-center text-sm font-bold text-slate-500">
                  ยังไม่มีบัญชีใช่ไหม? <a href="#" onClick={(e) => { e.preventDefault(); switchView('REGISTER'); }} className="text-blue-600 hover:underline">สร้างบัญชีผู้ใช้ใหม่</a>
                </div>
                
                {lineProfile && (
                  <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 py-2 px-4 rounded-2xl border border-emerald-100 w-max mx-auto cursor-pointer hover:bg-emerald-100 transition-colors" onClick={() => switchView('LINE_BINDING')}>
                    <Avatar src={lineProfile.pictureUrl} size={20} /> ยืนยันตัวตน LINE สำเร็จ (คลิกเพื่อทำต่อ)
                  </div>
                )}
              </div>
            )}

            {/* =========================================================
                🟢 2. หน้าต่าง PROGRESSIVE PROFILING (สมัครง่ายด้วย LINE)
                ========================================================= */}
            {viewMode === 'LINE_BINDING' && (
              <div className="w-full max-w-[420px] mx-auto text-center animate-fade-in relative pt-4">
                <button onClick={() => switchView('LOGIN')} className="absolute top-0 left-0 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                </button>

                {/* ดึงรูปโปรไฟล์ LINE มาโชว์แบบเท่ๆ */}
                <div className="relative inline-block mb-4">
                  <Avatar src={lineProfile?.pictureUrl} size={100} className="shadow-[0_8px_24px_rgba(0,195,0,0.3)] border-4 border-[#00C300]/20 object-cover" />
                  <div className="absolute bottom-0 right-0 bg-[#00C300] text-white p-1.5 rounded-full border-2 border-white">
                    <CheckCircleOutlined />
                  </div>
                </div>

                <h2 className="text-[26px] sm:text-[30px] font-black text-[#1e293b] mb-1 tracking-tight">ยินดีต้อนรับ!</h2>
                <p className="text-slate-500 font-medium text-[13px] mb-8">คุณ <span className="font-bold text-[#00C300]">{lineProfile?.displayName || 'ผู้ใช้งาน LINE'}</span> <br/>โปรดระบุข้อมูลพื้นฐานเพิ่มเติมเพื่อเริ่มใช้งาน</p>

                <Form form={lineBindingForm} layout="vertical" onFinish={handleLineRegisterSubmit} requiredMark={false} className="text-left">
                  
                  <Form.Item name="full_name" label={<span className="text-[13px] font-extrabold text-[#1e293b]">ชื่อ-นามสกุลจริง (ตามบัตร ปชช.)</span>} rules={[{ required: true, message: 'กรุณาระบุชื่อ' }]} className="mb-4">
                    <Input size="large" prefix={<UserOutlined className="text-slate-400 mr-2" />} placeholder="เช่น สมชาย ใจดี" className="rounded-2xl h-[52px] px-4 bg-[#f8fafc]" />
                  </Form.Item>

                  <Form.Item name="employee_id" label={<span className="text-[13px] font-extrabold text-[#1e293b]">รหัสพนักงาน หรือ เลขบัตร ปชช.</span>} rules={[{ required: true, message: 'กรุณาระบุรหัสพนักงานหรือเลขบัตร' }]} className="mb-4">
                    <Input size="large" prefix={<IdcardOutlined className="text-slate-400 mr-2" />} placeholder="เช่น EMP-12345 หรือเลขบัตร" className="rounded-2xl h-[52px] px-4 bg-[#f8fafc]" />
                  </Form.Item>

                  <Form.Item name="department" label={<span className="text-[13px] font-extrabold text-[#1e293b]">บริษัท / สังกัด / แผนก (ถ้ามี)</span>} className="mb-6">
                    <Input size="large" prefix={<TeamOutlined className="text-slate-400 mr-2" />} placeholder="เช่น บริษัทผู้รับเหมา A" className="rounded-2xl h-[52px] px-4 bg-[#f8fafc]" />
                  </Form.Item>

                  <Button htmlType="submit" loading={isRegistering} className="w-full h-[54px] rounded-2xl font-bold text-white bg-[#00C300] hover:bg-[#00a300] border-none text-[16px] shadow-[0_8px_24px_-8px_rgba(0,195,0,0.4)] transition-all">
                    บันทึกข้อมูลและเข้าใช้งานแอป
                  </Button>
                </Form>
              </div>
            )}

            {/* =========================================================
                📝 3. หน้าต่าง REGISTER (Email ปกติ)
                ========================================================= */}
            {viewMode === 'REGISTER' && (
              <div className="w-full mx-auto text-left animate-fade-in relative pt-4">
                <button onClick={() => switchView('LOGIN')} className="absolute top-0 left-0 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                </button>

                <h2 className="text-[28px] sm:text-[32px] font-black text-[#1e293b] mt-4 mb-1 tracking-tight">สร้างบัญชีผู้ใช้ใหม่</h2>
                <p className="text-slate-500 font-medium text-[13px] mb-6">กรอกข้อมูลพื้นฐานและยืนยันอีเมลของคุณ</p>

                <Form form={registerForm} layout="vertical" onFinish={handleRegister} requiredMark={false} className="mb-0 custom-login-form">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0">
                    <Form.Item name="full_name" label={<span className="text-[13px] text-[#1e293b] font-extrabold mb-1 block">ชื่อ-นามสกุล</span>} rules={[{ required: true, message: 'กรุณาระบุชื่อ' }]} className="mb-4">
                      <Input size="large" prefix={<UserOutlined className="text-slate-400 mr-2" />} placeholder="เช่น สมชาย ใจดี" className="rounded-2xl h-[50px] bg-[#f8fafc]" />
                    </Form.Item>
                    <Form.Item name="employee_id" label={<span className="text-[13px] text-[#1e293b] font-extrabold mb-1 block">รหัสพนักงาน / รหัส ปชช.</span>} rules={[{ required: true, message: 'กรุณาระบุรหัส' }]} className="mb-4">
                      <Input size="large" prefix={<IdcardOutlined className="text-slate-400 mr-2" />} placeholder="เช่น EMP-12345" className="rounded-2xl h-[50px] bg-[#f8fafc]" />
                    </Form.Item>
                    <Form.Item name="phone" label={<span className="text-[13px] text-[#1e293b] font-extrabold mb-1 block">เบอร์โทรศัพท์</span>} className="mb-4 md:col-span-2">
                      <Input size="large" prefix={<PhoneOutlined className="text-slate-400 mr-2" />} placeholder="เช่น 0812345678" className="rounded-2xl h-[50px] bg-[#f8fafc]" />
                    </Form.Item>
                    <Form.Item name="password" label={<span className="text-[13px] text-[#1e293b] font-extrabold mb-1 block">ตั้งรหัสผ่าน</span>} rules={[{ required: true, message: 'กรุณาระบุรหัสผ่าน' }]} className="mb-4">
                      <Input.Password size="large" prefix={<LockOutlined className="text-slate-400 mr-2" />} placeholder="รหัสผ่าน 8 ตัวอักษรขึ้นไป" className="rounded-2xl h-[50px] bg-[#f8fafc]" />
                    </Form.Item>
                    <Form.Item name="confirm_password" label={<span className="text-[13px] text-[#1e293b] font-extrabold mb-1 block">ยืนยันรหัสผ่าน</span>} dependencies={['password']} rules={[{ required: true, message: 'กรุณายืนยันรหัสผ่าน' }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('password') === value) return Promise.resolve(); return Promise.reject(new Error('รหัสผ่านไม่ตรงกัน!')); }, }), ]} className="mb-4">
                      <Input.Password size="large" prefix={<LockOutlined className="text-slate-400 mr-2" />} placeholder="ใส่รหัสผ่านอีกครั้ง" className="rounded-2xl h-[50px] bg-[#f8fafc]" />
                    </Form.Item>
                  </div>

                  {/* 📧 โซน Email OTP */}
                  <div className="bg-blue-50/50 p-4 md:p-5 rounded-3xl border border-blue-100 mb-6 mt-2">
                    <Form.Item name="email" label={<span className="text-[13px] text-[#1e293b] font-extrabold mb-1 flex items-center gap-1.5"><MailOutlined className="text-blue-500"/> อีเมลยืนยันตัวตน</span>} rules={[{ required: true, message: 'กรุณาระบุอีเมล' }, { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }]} className="mb-0">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Input disabled={isOtpVerified || isOtpSent} size="large" placeholder="your.email@company.com" className="flex-1 rounded-2xl h-[50px] bg-[#f8fafc] disabled:bg-slate-100" />
                        {!isOtpVerified && (
                          <Button onClick={handleSendOTP} loading={isSendingOtp} disabled={isOtpSent} className="h-[50px] rounded-2xl font-bold bg-slate-800 text-white hover:bg-slate-900 border-none px-6">
                            {isOtpSent ? 'ส่งรหัสแล้ว' : 'ขอรหัส OTP'}
                          </Button>
                        )}
                      </div>
                    </Form.Item>
                    {isOtpSent && !isOtpVerified && (
                      <div className="mt-4 p-4 bg-white rounded-2xl border border-blue-100 shadow-sm flex flex-col sm:flex-row items-end gap-3">
                        <div className="flex-1 w-full">
                          <label className="text-[11px] font-bold text-slate-500 mb-1.5 block uppercase tracking-widest">รหัส 6 หลักจากอีเมล</label>
                          <Input size="large" maxLength={6} placeholder="_ _ _ _ _ _" value={otpValue} onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))} className="rounded-xl h-[46px] text-center font-mono text-lg tracking-[0.5em] bg-blue-50/30" />
                        </div>
                        <Button onClick={handleVerifyOTP} className="w-full sm:w-auto h-[46px] rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 border-none px-6">ยืนยันรหัส</Button>
                      </div>
                    )}
                    {isOtpVerified && (
                      <div className="mt-3 flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                        <CheckCircleOutlined className="text-xl" /> <span className="font-bold text-sm">ยืนยันอีเมลสำเร็จเรียบร้อยแล้ว</span>
                      </div>
                    )}
                  </div>

                  <Button htmlType="submit" loading={isRegistering} disabled={!isOtpVerified} className={`w-full h-[54px] rounded-2xl font-bold text-white border-none text-[16px] transition-all shadow-md ${!isOtpVerified ? 'bg-slate-300' : 'bg-[#2563eb] hover:bg-[#1d4ed8]'}`}>
                    สร้างบัญชี (Sign Up)
                  </Button>
                </Form>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </ConfigProvider>
  );
}