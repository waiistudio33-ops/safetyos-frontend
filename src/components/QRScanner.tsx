import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Spin, message } from 'antd';
import { LoadingOutlined, PictureOutlined } from '@ant-design/icons';

export default function QRScanner({ onScan }: { onScan: (text: string) => void }) {
  const [isStarting, setIsInitializing] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔊 เตรียมเสียง "ติ๊ด"
  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); 
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15); 
    } catch (e) {
      console.log("Audio not supported or blocked");
    }
  };

  // 📸 ฟังก์ชันสแกนจากไฟล์รูปภาพ
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      
      if (navigator.vibrate) { navigator.vibrate(50); }
      playBeepSound();
      message.success('อ่าน QR Code จากรูปภาพสำเร็จ!');
      onScan(decodedText);

    } catch (err) {
      console.error("Error scanning file:", err);
      message.error('ไม่พบ QR Code ในรูปภาพนี้ หรือรูปภาพไม่ชัดเจน');
      startLiveScanning(); 
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 🎥 ฟังก์ชันเปิดกล้องสด (แก้ปัญหาจอยืด)
  const startLiveScanning = async () => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("qr-reader");
    }
    
    const html5QrCode = scannerRef.current;
    setIsInitializing(true);
    setHasError(false);

    // 🟢 แก้ไข: ใช้ขนาดกรอบตามสัดส่วนจอ แต่อย่าเล็กเกินไป
    const minEdge = Math.min(window.innerWidth, window.innerHeight);
    const scanSize = Math.max(200, Math.floor(minEdge * 0.7)); // ให้กรอบโฟกัสมีขนาด 70% ของจอ

    let isScanSuccess = false;

    try {
      await html5QrCode.start(
        { facingMode: "environment" }, 
        {
          fps: 10, 
          qrbox: { width: scanSize, height: scanSize },
          // 🚨 ท่าไม้ตาย: ลบคำสั่ง aspectRatio ทิ้งไปเลย! ปล่อยให้มันหาค่าธรรมชาติของกล้องเอง
          disableFlip: false 
        },
        (decodedText) => {
          if (!isScanSuccess && html5QrCode.isScanning) {
            isScanSuccess = true; 
            if (navigator.vibrate) { navigator.vibrate(50); }
            playBeepSound();

            html5QrCode.stop().then(() => {
              onScan(decodedText);
            }).catch(err => {
              onScan(decodedText); 
            });
          }
        },
        (errorMessage) => { /* ignore */ }
      );
      setIsInitializing(false);
    } catch (err) {
      console.error("Camera start error:", err);
      setHasError(true);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    startLiveScanning();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch((err) => console.error("Failed to stop/clear scanner", err));
      }
    };
  }, [onScan]);

  return (
    <div className="relative flex flex-col items-center w-full h-[500px] md:h-[600px] max-h-[80vh]">
      
      {/* 🌟 กล่องสแกนเนอร์ */}
      <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        
        {/* State: กำลังโหลดกล้อง หรือ กำลังประมวลผลรูป */}
        {(isStarting || isProcessingFile) && (
          <div className="absolute z-20 flex flex-col items-center justify-center text-white space-y-3 bg-black/50 inset-0 backdrop-blur-sm">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 36, color: '#fff' }} spin />} />
            <p className="font-medium text-sm animate-pulse tracking-wide">
              {isProcessingFile ? 'กำลังวิเคราะห์รูปภาพ...' : 'กำลังเตรียมกล้อง...'}
            </p>
          </div>
        )}

        {/* State: กรณีไม่อนุญาตสิทธิ์กล้อง */}
        {hasError && !isStarting && !isProcessingFile && (
          <div className="absolute z-20 flex flex-col items-center justify-center text-white px-6 text-center bg-black/80 inset-0 backdrop-blur-sm">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-4 ring-1 ring-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <p className="font-bold text-lg mb-2 text-red-50">ไม่สามารถเข้าถึงกล้องได้</p>
            <p className="text-xs text-slate-300 leading-relaxed max-w-[250px] mb-6">
              อุปกรณ์อาจไม่รองรับ หรือคุณยังไม่ได้อนุญาตให้เบราว์เซอร์ใช้งานกล้อง
            </p>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform"
            >
              <PictureOutlined className="text-lg" /> เลือกรูปภาพจากแกลลอรี่แทน
            </button>
          </div>
        )}
        
        {/* 🟢 ตัวคอนเทนเนอร์กล้อง */}
        {/* ใช้ absolute inset-0 ให้มันยืดเต็มกรอบที่กำหนดไว้ด้านบน */}
        <div id="qr-reader" className="absolute inset-0 bg-black z-0"></div>

        {/* 🎨 Overlay กรอบโฟกัส (ฟิล์มดำเจาะช่องใสตรงกลาง) */}
        {!isStarting && !hasError && !isProcessingFile && (
          <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center overflow-hidden">
             
             {/* กล่องใสตรงกลาง + เงามืดรอบนอก */}
             {/* 🟢 ปรับให้กรอบตรงกลางขยับขึ้นมานิดนึง ไม่ให้อยู่ต่ำเกินไป */}
             <div className="relative w-[220px] sm:w-[250px] h-[220px] sm:h-[250px] -mt-10 rounded-[1.75rem] shadow-[0_0_0_2000px_rgba(0,0,0,0.75)] transition-all duration-300">
               
               {/* เส้นเลเซอร์สแกนขึ้นลง */}
               <div className="absolute left-4 right-4 h-0.5 bg-emerald-400 shadow-[0_0_12px_3px_rgba(52,211,153,0.8)] animate-scan-laser rounded-full"></div>

               {/* มุม 4 ด้าน (Corner Brackets) */}
               <div className="absolute -top-0.5 -left-0.5 w-12 sm:w-14 h-12 sm:h-14 border-t-[4px] border-l-[4px] border-white rounded-tl-[1.75rem] opacity-100 drop-shadow-md"></div>
               <div className="absolute -top-0.5 -right-0.5 w-12 sm:w-14 h-12 sm:h-14 border-t-[4px] border-r-[4px] border-white rounded-tr-[1.75rem] opacity-100 drop-shadow-md"></div>
               <div className="absolute -bottom-0.5 -left-0.5 w-12 sm:w-14 h-12 sm:h-14 border-b-[4px] border-l-[4px] border-white rounded-bl-[1.75rem] opacity-100 drop-shadow-md"></div>
               <div className="absolute -bottom-0.5 -right-0.5 w-12 sm:w-14 h-12 sm:h-14 border-b-[4px] border-r-[4px] border-white rounded-br-[1.75rem] opacity-100 drop-shadow-md"></div>
             </div>
             
             {/* 🟢 ปุ่มเลือกรูปจากแกลลอรี่ */}
             <div className="absolute bottom-6 sm:bottom-10 w-full flex justify-center pointer-events-auto px-6">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white px-5 py-2.5 rounded-full font-bold text-[13px] tracking-wide transition-all shadow-lg active:scale-95"
                >
                  <PictureOutlined className="text-base" /> เลือกรูปจากแกลลอรี่
                </button>
             </div>
          </div>
        )}
      </div>

      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      <style>{`
        #qr-reader { border: none !important; background: #000; }
        #qr-reader img, #qr-reader a, #qr-reader span, #qr-reader div[style*="text-align: center"], #qr-reader > div:first-child { display: none !important; }
        
        /* 🟢 CSS ท่าไม้ตาย แก้ภาพยืด */
        #qr-reader video {
          object-fit: cover !important; /* บังคับให้วิดีโอตัดขอบตัวเองให้เต็มกรอบ ห้ามยืดเด็ดขาด! */
          width: 100% !important;
          height: 100% !important;
          /* ซูมเข้าจิ๊ดนึงเผื่อมันหดเกินไป */
          transform: scale(1.05); 
        }

        /* ปรับอนิเมชันเลเซอร์ให้ระยะพอดีกับกรอบใหม่ */
        @keyframes scan-laser {
          0% { top: 10px; opacity: 0; transform: scaleX(0.8); }
          15% { opacity: 1; transform: scaleX(1); }
          50% { top: 110px; }
          85% { opacity: 1; transform: scaleX(1); }
          100% { top: 200px; opacity: 0; transform: scaleX(0.8); }
        }
        .animate-scan-laser {
          animation: scan-laser 2.2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }
      `}</style>
    </div>
  );
}