import React, { useState } from 'react';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  IdcardOutlined, 
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  HistoryOutlined,
  CameraOutlined,
  EditOutlined,
  FileTextOutlined,
  EyeOutlined,
  ReadOutlined,
  ArrowRightOutlined,
  LogoutOutlined,
  ToolOutlined,
  PictureOutlined,
  DisconnectOutlined,
  LinkOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { message, Popconfirm, Modal, Form, Input, Button, Upload } from 'antd';
import type { UploadProps } from 'antd';

interface UserProfileProps {
  currentUser: any;
  lineProfile: any;
  // 🟢 รับ Props เพิ่มเติมสำหรับฟังก์ชันต่างๆ
  onUpdateProfile?: (values: any) => Promise<boolean>;
  onUploadAvatar?: (file: File) => Promise<string | null>;
  onToggleLineConnection?: () => void;
}

export default function UserProfile({ 
  currentUser, 
  lineProfile,
  onUpdateProfile,
  onUploadAvatar,
  onToggleLineConnection
}: UserProfileProps) {
  
  const [activeTab, setActiveTab] = useState('timeline');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [form] = Form.useForm();

  // 🟢 1. จัดการรูปโปรไฟล์ (รวมถึงรูปที่เพิ่งอัปโหลดใหม่)
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

  const getDisplayAvatar = () => {
    if (localAvatarUrl) return localAvatarUrl; // ให้ความสำคัญกับรูปที่เพิ่งอัปโหลด
    if (currentUser?.profile_url) return currentUser.profile_url;
    if (lineProfile?.pictureUrl) return lineProfile.pictureUrl;
    return null;
  };

  // 🟢 2. ฟังก์ชันแก้ไขข้อมูลส่วนตัว
  const handleOpenEditModal = () => {
    form.setFieldsValue({
      department: currentUser?.department || '',
      phone: currentUser?.phone || '',
      email: currentUser?.email || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (values: any) => {
    if (onUpdateProfile) {
      setIsSubmitting(true);
      const success = await onUpdateProfile(values);
      setIsSubmitting(false);
      
      if (success) {
        message.success('อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว');
        setIsEditModalOpen(false);
        // ในระบบจริง currentUser ควรรีเฟรชตามข้อมูลใหม่
      } else {
        message.error('ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองใหม่');
      }
    } else {
      message.warning('ฟังก์ชัน API อัปเดตข้อมูลยังไม่ได้เชื่อมต่อ');
      setIsEditModalOpen(false);
    }
  };

  // 🟢 3. ฟังก์ชันอัปโหลดรูปโปรไฟล์
  const uploadProps: UploadProps = {
    name: 'avatar',
    showUploadList: false,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('อัปโหลดได้เฉพาะไฟล์ JPG/PNG เท่านั้น!');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB!');
        return false;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }: any) => {
      if (onUploadAvatar) {
        setIsUploading(true);
        try {
          const newUrl = await onUploadAvatar(file);
          if (newUrl) {
            setLocalAvatarUrl(newUrl); // อัปเดต UI ทันที
            message.success('เปลี่ยนรูปโปรไฟล์สำเร็จ!');
            if (onSuccess) onSuccess("ok");
          } else {
            throw new Error('อัปโหลดล้มเหลว');
          }
        } catch (err) {
          message.error('อัปโหลดรูปภาพไม่สำเร็จ');
          if (onError) onError(err as any);
        } finally {
          setIsUploading(false);
        }
      } else {
        message.warning('ฟังก์ชัน API อัปโหลดรูปยังไม่ได้เชื่อมต่อ (Mocking success)');
        // จำลองการอัปโหลดสำเร็จ
        setTimeout(() => {
          setLocalAvatarUrl(URL.createObjectURL(file as Blob));
          if (onSuccess) onSuccess("ok");
        }, 1000);
      }
    },
  };

  // 🟢 4. ฟังก์ชันจัดการ LINE Connection
  const handleLineAction = () => {
    if (onToggleLineConnection) {
      onToggleLineConnection();
    } else {
      if (lineProfile) {
        message.info('ระบบจะทำการยกเลิกการเชื่อมต่อ LINE (รอต่อ API)');
      } else {
        message.info('ระบบจะพาวิ่งไปหน้า LINE Login (รอต่อ API)');
      }
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('safetyos_token');
    message.success('ออกจากระบบเรียบร้อยแล้ว');
    setTimeout(() => {
      window.location.href = '/'; 
    }, 1000);
  };

  return (
    <div className="animate-fade-in w-full max-w-7xl mx-auto pb-20 px-4 sm:px-6 lg:px-8">
      
      {/* 1. Header Banner & Avatar */}
      <div className="relative mt-4 mb-24 md:mb-32">
        <div 
          className="h-44 sm:h-56 md:h-80 w-full rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] relative overflow-hidden transition-all duration-500"
          style={{
            backgroundColor: '#ffffff',
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.45) 0%, transparent 60%),
              radial-gradient(circle at 80% 10%, rgba(16, 185, 129, 0.35) 0%, transparent 60%),
              radial-gradient(circle at 30% 90%, rgba(244, 63, 94, 0.35) 0%, transparent 60%),
              radial-gradient(circle at 90% 80%, rgba(234, 179, 8, 0.35) 0%, transparent 60%)
            `
          }}
        >
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]"></div>
          <button 
            onClick={() => message.info('ฟังก์ชันเปลี่ยนรูปพื้นหลังจะมาเร็วๆ นี้!')}
            className="absolute top-6 right-6 p-3 bg-white/30 hover:bg-white/50 backdrop-blur-md rounded-2xl text-slate-700 border border-white/50 transition-all hidden sm:block shadow-sm"
          >
            <PictureOutlined className="text-xl" />
          </button>
        </div>

        <div className="absolute -bottom-16 left-0 right-0 md:left-12 md:right-auto flex flex-col md:flex-row items-center md:items-end gap-6">
          
          {/* 🟢 อัปเกรดส่วน Avatar ให้รองรับ Upload */}
          <Upload {...uploadProps} disabled={isUploading}>
            <div className="relative group cursor-pointer">
              <div className="p-2 bg-white rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
                <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden bg-slate-50 relative flex items-center justify-center">
                  
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center text-blue-500">
                      <LoadingOutlined className="text-3xl mb-2" />
                      <span className="text-xs font-bold">Uploading...</span>
                    </div>
                  ) : getDisplayAvatar() ? (
                    <img src={getDisplayAvatar()!} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-200 text-6xl">
                      <UserOutlined />
                    </div>
                  )}

                  {!isUploading && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                      <CameraOutlined className="text-white text-3xl mb-1" />
                      <span className="text-white text-xs font-bold">เปลี่ยนรูปโปรไฟล์</span>
                    </div>
                  )}

                </div>
              </div>
              {!isUploading && (
                <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#2563eb] hover:bg-[#1d4ed8] border-4 border-white rounded-full shadow-md text-white flex items-center justify-center transition-transform hover:scale-110">
                  <CameraOutlined className="text-sm" />
                </div>
              )}
            </div>
          </Upload>

          <div className="text-center md:text-left md:pb-6">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-black text-[#1e293b] m-0 tracking-tight">
                {currentUser?.full_name || 'ไม่ระบุชื่อ'}
              </h1>
              <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[11px] font-extrabold uppercase tracking-widest rounded-full shadow-sm">
                {currentUser?.role || 'User'}
              </span>
            </div>
            <p className="text-slate-400 font-bold tracking-widest uppercase text-[11px] mt-2 flex items-center justify-center md:justify-start gap-1.5">
              <IdcardOutlined /> Employee ID: {currentUser?.employee_id || currentUser?.username || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Personal Data */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-8 border border-slate-50">
            
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[18px] font-black text-slate-800 m-0">ข้อมูลส่วนตัว</h3>
              <button 
                onClick={handleOpenEditModal}
                className="text-blue-600 font-bold text-xs flex items-center gap-1 hover:underline bg-blue-50 px-3 py-1.5 rounded-xl transition-colors hover:bg-blue-100"
              >
                <EditOutlined /> แก้ไข
              </button>
            </div>

            <div className="space-y-6">
              {[
                { icon: <ToolOutlined />, label: "แผนก / บริษัท (Department)", value: currentUser?.department || 'ไม่ได้ระบุ', bg: "bg-blue-50", text: "text-blue-600" },
                { icon: <SafetyCertificateOutlined />, label: "ระดับความปลอดภัย", value: currentUser?.role === 'SAFETY_ENGINEER' ? "Safety Engineer (จป.)" : currentUser?.role === 'AREA_OWNER' ? "Area Owner" : "Contractor / Worker", bg: "bg-emerald-50", text: "text-emerald-600" },
                { icon: <PhoneOutlined />, label: "เบอร์โทรศัพท์", value: currentUser?.phone || 'ไม่ได้ระบุ', bg: "bg-orange-50", text: "text-orange-600" },
                { icon: <MailOutlined />, label: "อีเมลติดต่อ", value: currentUser?.email || 'ไม่ได้ระบุ', bg: "bg-purple-50", text: "text-purple-600" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.text} flex items-center justify-center text-xl shadow-sm transition-transform group-hover:scale-110`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest m-0 mb-0.5 truncate">{item.label}</p>
                    <p className={`text-[14px] font-extrabold m-0 truncate ${item.value === 'ไม่ได้ระบุ' ? 'text-slate-300' : 'text-slate-700'}`}>
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full h-px bg-slate-100 my-8"></div>

            {/* 🟢 Section 2: Connection Status (เพิ่มปุ่มยกเลิก/เชื่อมต่อ) */}
            <div>
              <h3 className="text-[18px] font-black text-slate-800 mb-5">การแจ้งเตือน (LINE)</h3>
              {lineProfile ? (
                <div className="bg-[#00C300]/5 border border-[#00C300]/20 p-4 rounded-[1.5rem] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#00C300] p-2.5 rounded-xl shadow-md shadow-emerald-500/20">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.938 8.91 9.388 9.62.367.082.868.256.996.584.115.294.074.755.035 1.053-.053.407-.246 1.488-.299 1.748-.087.419.412.632.748.441 3.585-2.036 9.539-5.617 11.83-9.351C23.633 12.923 24 11.666 24 10.304z"/></svg>
                      </div>
                      <div>
                        <p className="text-[13px] font-extrabold text-slate-800 m-0 leading-tight truncate max-w-[120px]">{lineProfile.displayName}</p>
                        <p className="text-[11px] text-emerald-600 font-bold m-0 mt-0.5">เชื่อมต่อเรียบร้อย</p>
                      </div>
                    </div>
                    <CheckCircleOutlined className="text-emerald-500 text-xl" />
                  </div>
                  
                  <Popconfirm
                    title="ยกเลิกการเชื่อมต่อ LINE?"
                    description="คุณจะไม่ได้รับการแจ้งเตือนงานฉุกเฉินผ่าน LINE อีกต่อไป"
                    onConfirm={handleLineAction}
                    okText="ยกเลิกการเชื่อมต่อ"
                    okButtonProps={{ danger: true }}
                    cancelText="ปิด"
                  >
                    <button className="w-full py-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl text-rose-500 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 mt-2">
                      <DisconnectOutlined /> ยกเลิกการเชื่อมต่อ
                    </button>
                  </Popconfirm>
                </div>
              ) : (
                <button 
                  onClick={handleLineAction}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest hover:border-[#00C300] hover:text-[#00C300] hover:bg-emerald-50/30 transition-all flex items-center justify-center gap-2"
                >
                  <LinkOutlined /> เปิดรับการแจ้งเตือน (LINE)
                </button>
              )}
            </div>
            
            <Popconfirm
              title="ออกจากระบบ"
              description="คุณต้องการออกจากระบบ SafetyOS ใช่หรือไม่?"
              onConfirm={handleSignOut}
              okText="ยืนยัน (Sign Out)"
              cancelText="ยกเลิก"
              okButtonProps={{ danger: true, className: "rounded-xl font-bold" }}
              cancelButtonProps={{ className: "rounded-xl font-bold border-none bg-slate-100" }}
            >
              <button className="w-full mt-6 py-4 rounded-2xl bg-rose-50 text-rose-600 font-bold text-[13px] hover:bg-rose-500 hover:text-white hover:shadow-md transition-all flex items-center justify-center gap-2">
                 <LogoutOutlined /> Sign Out (ออกจากระบบ)
              </button>
            </Popconfirm>

          </div>
        </div>

        {/* Right Column: Stats & Activity */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: "Permits", val: "N/A", icon: <FileTextOutlined />, color: "from-blue-600 to-indigo-600", shadow: "shadow-[0_16px_32px_rgba(37,99,235,0.2)]" },
              { label: "BBS Done", val: "N/A", icon: <EyeOutlined />, color: "from-emerald-500 to-teal-600", shadow: "shadow-[0_16px_32px_rgba(16,185,129,0.2)]" },
              { label: "Certs", val: "N/A", icon: <SafetyCertificateOutlined />, color: "from-orange-400 to-rose-500", shadow: "shadow-[0_16px_32px_rgba(249,115,22,0.2)]" },
              { label: "E-Learn", val: "N/A", icon: <ReadOutlined />, color: "from-purple-600 to-indigo-700", shadow: "shadow-[0_16px_32px_rgba(147,51,234,0.2)]" }
            ].map((stat, i) => (
              <div key={i} className={`p-6 rounded-[2rem] bg-gradient-to-br ${stat.color} ${stat.shadow} text-white transform transition-transform hover:-translate-y-1`}>
                <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md shadow-inner text-xl">
                  {stat.icon}
                </div>
                <div className="text-3xl sm:text-4xl font-black mb-1 tracking-tight">{stat.val}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] min-h-[500px] flex flex-col overflow-hidden border border-slate-50">
            <div className="flex p-4 gap-2 bg-slate-50/50 border-b border-slate-100">
              <button 
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 py-3.5 text-[13px] font-extrabold uppercase tracking-wide transition-all rounded-2xl ${activeTab === 'timeline' ? 'bg-white text-[#2563eb] shadow-[0_4px_12px_rgba(0,0,0,0.04)]' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`}
              >
                <HistoryOutlined className="mr-1.5" /> ประวัติกิจกรรม (Timeline)
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-3.5 text-[13px] font-extrabold uppercase tracking-wide transition-all rounded-2xl ${activeTab === 'settings' ? 'bg-white text-[#2563eb] shadow-[0_4px_12px_rgba(0,0,0,0.04)]' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`}
              >
                <SettingOutlined className="mr-1.5" /> การตั้งค่า (Settings)
              </button>
            </div>

            <div className="p-8 flex-1">
              {activeTab === 'timeline' ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <HistoryOutlined className="text-4xl text-slate-300" />
                  </div>
                  <h4 className="text-xl font-black text-slate-800 m-0">ยังไม่มีประวัติกิจกรรม</h4>
                  <p className="text-slate-500 font-medium text-sm max-w-[280px] mt-2 leading-relaxed">เมื่อคุณทำกิจกรรมในระบบ เช่น ขอใบอนุญาตทำงาน ประวัติจะแสดงที่นี่โดยอัตโนมัติ</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: "เปลี่ยนรหัสผ่าน (Change Password)", desc: "อัปเดตรหัสผ่านเพื่อความปลอดภัย", icon: <EditOutlined /> },
                    { title: "การแจ้งเตือน (Notifications)", desc: "จัดการการแจ้งเตือนผ่าน LINE", icon: <CheckCircleOutlined /> },
                    { title: "ภาษา (Language)", desc: "สลับการแสดงผลภาษา ไทย / อังกฤษ", icon: <ArrowRightOutlined /> },
                  ].map((opt, i) => (
                    <button key={i} onClick={() => message.info('เมนูนี้กำลังอยู่ระหว่างการพัฒนา')} className="p-6 bg-[#f8fafc] hover:bg-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-blue-100 rounded-[2rem] border border-transparent flex items-center justify-between transition-all group text-left">
                      <div>
                        <h5 className="font-extrabold text-[14px] text-slate-800 m-0">{opt.title}</h5>
                        <p className="text-[11px] text-slate-500 font-bold mt-1 m-0">{opt.desc}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors shadow-sm">
                        {opt.icon}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 5. Modal สำหรับแก้ไขข้อมูลส่วนตัว */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-xl font-black text-slate-800 pb-3 border-b border-slate-100">
            <EditOutlined className="text-blue-500" /> แก้ไขข้อมูลส่วนตัว
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        destroyOnClose
        centered
        className="custom-modern-modal"
      >
        <div className="p-6">
          <Form form={form} layout="vertical" onFinish={handleSaveProfile} requiredMark={false}>
            <Form.Item 
              name="department" 
              label={<span className="font-bold text-slate-700">แผนก / บริษัท (Department)</span>}
            >
              <Input size="large" prefix={<ToolOutlined className="text-slate-400 mr-2" />} className="rounded-xl h-12" placeholder="เช่น ฝ่ายซ่อมบำรุง, บจก. เอบีซี" />
            </Form.Item>
            
            <Form.Item 
              name="phone" 
              label={<span className="font-bold text-slate-700">เบอร์โทรศัพท์ (Phone Number)</span>}
            >
              <Input size="large" prefix={<PhoneOutlined className="text-slate-400 mr-2" />} className="rounded-xl h-12" placeholder="08x-xxx-xxxx" />
            </Form.Item>

            <Form.Item 
              name="email" 
              label={<span className="font-bold text-slate-700">อีเมลติดต่อ (Email)</span>}
              rules={[{ type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }]}
            >
              <Input size="large" prefix={<MailOutlined className="text-slate-400 mr-2" />} className="rounded-xl h-12" placeholder="example@email.com" />
            </Form.Item>

            <div className="flex gap-3 mt-8">
              <Button size="large" onClick={() => setIsEditModalOpen(false)} className="flex-1 rounded-xl font-bold bg-slate-100 border-none text-slate-600 hover:bg-slate-200">
                ยกเลิก
              </Button>
              <Button size="large" type="primary" htmlType="submit" loading={isSubmitting} className="flex-[2] rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-md">
                บันทึกการเปลี่ยนแปลง
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      <style>{`
        .custom-modern-modal .ant-modal-content { border-radius: 2rem !important; padding: 0 !important; overflow: hidden; }
        .ant-upload-wrapper { display: block; }
      `}</style>
    </div>
  );
}