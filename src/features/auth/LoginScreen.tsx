import React from 'react';
import { ConfigProvider, Form, Input, Button, Divider, Avatar, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';

interface LoginScreenProps {
  onLogin: (values: any) => Promise<void>;
  onLineLogin: () => void;
  onSSOLogin: () => void;
  isLoggingIn: boolean;
  lineProfile: any;
}

export default function LoginScreen({ onLogin, onLineLogin, onSSOLogin, isLoggingIn, lineProfile }: LoginScreenProps) {
  const [loginForm] = Form.useForm();

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#2563eb', fontFamily: "'Prompt', sans-serif" } }}>
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f7f9] p-4 sm:p-8">
        <div className="w-full max-w-[1000px] bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] flex flex-col md:flex-row overflow-hidden relative">
          
          <div 
            className="w-full md:w-1/2 min-h-[350px] md:min-h-[600px] relative flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-slate-100/50"
            style={{
              backgroundColor: '#ffffff',
              backgroundImage: `
                radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.45) 0%, transparent 60%),
                radial-gradient(circle at 90% 10%, rgba(16, 185, 129, 0.35) 0%, transparent 60%),
                radial-gradient(circle at 10% 90%, rgba(244, 63, 94, 0.35) 0%, transparent 60%),
                radial-gradient(circle at 90% 90%, rgba(234, 179, 8, 0.35) 0%, transparent 60%)
              `
            }}
          >
            <svg className="hidden md:block absolute right-0 top-0 h-full w-[80px] text-white z-10 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100" fill="currentColor"><path d="M100,0 L100,100 L0,100 C 60,70 40,30 0,0 Z" /></svg>
            <svg className="md:hidden absolute bottom-[-1px] left-0 w-full h-[40px] text-white z-10 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100" fill="currentColor"><path d="M0,100 L100,100 L100,0 C 70,60 30,40 0,0 Z" /></svg>

            {/* Glass Hero Card */}
            <div className="z-20 flex flex-col items-center justify-center rounded-[2rem] w-[240px] h-[240px] p-6 text-center border border-white/60 shadow-[0_16px_40px_rgba(0,0,0,0.06)] transition-transform hover:scale-105 duration-300" style={{ background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
              <div className="bg-white p-3.5 rounded-2xl shadow-sm mb-4 flex items-center justify-center">
                <SafetyOutlined className="text-4xl text-blue-600" />
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight m-0 drop-shadow-sm">Safety<span className="text-[#2563eb]">OS</span></h1>
              <p className="text-slate-500 font-extrabold mt-1 tracking-widest uppercase text-[10px]">Enterprise Gateway</p>
            </div>
          </div>

          <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white z-20 relative">
            <div className="w-full max-w-[340px] mx-auto text-left">
              <h2 className="text-[32px] sm:text-[36px] font-black text-[#1e293b] mb-1 tracking-tight">เข้าสู่ระบบ</h2>
              <p className="text-slate-500 font-medium text-[13px] mb-8">กรุณายืนยันตัวตนเพื่อดำเนินการต่อ</p>

              <Form form={loginForm} layout="vertical" onFinish={onLogin} requiredMark={false} className="mb-0 custom-login-form">
                <Form.Item name="username" label={<span className="text-[13px] text-[#1e293b] font-extrabold tracking-wide mb-1 block">รหัสพนักงาน หรือ อีเมล</span>} rules={[{ required: true, message: 'กรุณาระบุข้อมูล' }]} className="mb-5">
                  <Input size="large" prefix={<UserOutlined className="text-slate-400 text-lg mr-2" />} placeholder="ระบุข้อมูล" className="rounded-2xl h-[54px] px-5 border-slate-200 hover:border-blue-400 focus:border-blue-500 text-base shadow-[0_2px_8px_rgba(0,0,0,0.02)] bg-[#f8fafc] focus:bg-white transition-all" />
                </Form.Item>
                
                <Form.Item name="password" label={<span className="text-[13px] text-[#1e293b] font-extrabold tracking-wide mb-1 block">รหัสผ่าน</span>} rules={[{ required: true, message: 'กรุณาระบุรหัสผ่าน' }]} className="mb-2">
                  <Input.Password size="large" prefix={<LockOutlined className="text-slate-400 text-lg mr-2" />} placeholder="ระบุรหัสผ่าน" className="rounded-2xl h-[54px] px-5 border-slate-200 hover:border-blue-400 focus:border-blue-500 text-base shadow-[0_2px_8px_rgba(0,0,0,0.02)] bg-[#f8fafc] focus:bg-white transition-all" />
                </Form.Item>

                <div className="text-right mb-6">
                  <a href="#" onClick={(e) => { e.preventDefault(); message.info('กรุณาติดต่อ IT Support เพื่อรีเซ็ตรหัสผ่าน'); }} className="text-slate-400 hover:text-blue-600 text-[12px] font-bold transition-colors">ลืมรหัสผ่าน?</a>
                </div>
                
                <Button htmlType="submit" loading={isLoggingIn} className="w-full h-[54px] rounded-2xl font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] border-none text-[16px] shadow-[0_8px_24px_-8px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98]">
                  เข้าสู่ระบบ (Sign In)
                </Button>
              </Form>

              <Divider plain className="my-8 text-slate-400 text-[11px] font-medium border-slate-100">หรือเข้าสู่ระบบด้วย</Divider>

              <div className="grid grid-cols-2 gap-4">
                <Button size="large" onClick={onLineLogin} className="h-[52px] rounded-2xl font-extrabold text-[#1e293b] border border-slate-200 hover:border-[#00C300] hover:bg-emerald-50/30 bg-white flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] group">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="group-hover:scale-110 transition-transform text-[#00C300]"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.938 8.91 9.388 9.62.367.082.868.256.996.584.115.294.074.755.035 1.053-.053.407-.246 1.488-.299 1.748-.087.419.412.632.748.441 3.585-2.036 9.539-5.617 11.83-9.351C23.633 12.923 24 11.666 24 10.304z"/></svg>
                  LINE
                </Button>

                <Button size="large" onClick={onSSOLogin} className="h-[52px] rounded-2xl font-extrabold text-[#1e293b] border border-slate-200 hover:border-[#00a4ef] hover:bg-blue-50/30 bg-white flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform"><path fill="#f25022" d="M11.4 11.4H0V0h11.4v11.4z"/><path fill="#7fba00" d="M24 11.4H12.6V0H24v11.4z"/><path fill="#00a4ef" d="M11.4 24H0V12.6h11.4V24z"/><path fill="#ffb900" d="M24 24H12.6V12.6H24V24z"/></svg>
                  SCG SSO
                </Button>
              </div>
              
              {lineProfile && (
                <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 py-2 px-4 rounded-2xl border border-emerald-100 w-max mx-auto shadow-sm">
                  <Avatar src={lineProfile.pictureUrl} size={20} /> พร้อมเข้าใช้งานในชื่อ {lineProfile.displayName}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}