import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export default function QRScanner({ onScan }: { onScan: (text: string) => void }) {
  const [isStarting, setIsInitializing] = useState(true);
  const [hasError, setHasError] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // 🔊 1. เตรียมเสียง "ติ๊ด" (Beep Sound)
  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // ความถี่เสียง 800Hz
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // ความดัง (0.1 = เบาๆ)
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15); // ดังแค่ 0.15 วินาที
    } catch (e) {
      console.log("Audio not supported or blocked");
    }
  };

  useEffect(() => {
    // ป้องกันการสร้าง Instance ซ้ำซ้อนเวลา Component Rerender
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("qr-reader");
    }
    
    const html5QrCode = scannerRef.current;
    const scanSize = window.innerWidth < 400 ? 220 : 250;

    let isScanSuccess = false; // Flag ป้องกันการยิงสแกนติดกันรัวๆ (Debounce)

    const startScanning = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" }, // บังคับใช้กล้องหลัง
          {
            fps: 10, // 💡 ลด FPS ลงเหลือ 10 เพื่อไม่ให้มือถือทำงานหนักเกินไปและเครื่องร้อน
            qrbox: { width: scanSize, height: scanSize },
            aspectRatio: 1.0,
            disableFlip: false // ยอมให้แอปกลับหัวภาพเพื่อหา QR เผื่อคนถือเอียงๆ
          },
          (decodedText) => {
            // สแกนสำเร็จ: ทำงานแค่ครั้งแรกครั้งเดียว
            if (!isScanSuccess && html5QrCode.isScanning) {
              isScanSuccess = true; // ล็อคไว้ไม่ให้ทำงานซ้ำ
              
              // 📳 2. Haptic Feedback (สั่น) 
              if (navigator.vibrate) { navigator.vibrate(50); }
              
              // 🔊 เล่นเสียงติ๊ด
              playBeepSound();

              // หยุดกล้องแล้วส่งค่ากลับ
              html5QrCode.stop().then(() => {
                onScan(decodedText);
              }).catch(err => {
                console.error("Stop error", err);
                onScan(decodedText); // ถึงหยุดกล้อง Error ก็ควรส่งค่ากลับไปทำงานต่อ
              });
            }
          },
          (errorMessage) => {
            // ไม่พบ QR (ทำงานตลอดเวลา ไม่ต้อง console.log)
          }
        );
        setIsInitializing(false);
      } catch (err) {
        console.error("Camera start error:", err);
        setHasError(true);
        setIsInitializing(false);
      }
    };

    startScanning();

    // 🧹 3. Cleanup ที่รัดกุมขึ้นตอนปิด Modal หรือเปลี่ยนหน้า
    return () => {
      isScanSuccess = true; // ป้องกัน callback ทำงานตอนกำลังจะปิด
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch((err) => console.error("Failed to stop/clear scanner", err));
      }
    };
  }, [onScan]);

  return (
    <div className="relative flex flex-col items-center w-full">
      
      {/* 🌟 กล่องสแกนเนอร์สไตล์ "แอปธนาคาร" (Clean & Minimal) */}
      <div className="relative w-full max-w-sm bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-slate-700 min-h-[400px] flex items-center justify-center">
        
        {/* State: กำลังโหลดกล้อง */}
        {isStarting && (
          <div className="absolute z-20 flex flex-col items-center justify-center text-white space-y-3">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 36, color: '#fff' }} spin />} />
            <p className="font-medium text-sm animate-pulse tracking-wide">กำลังเตรียมกล้อง...</p>
          </div>
        )}

        {/* State: กรณีไม่อนุญาตสิทธิ์กล้อง หรือกล้องมีปัญหา */}
        {hasError && !isStarting && (
          <div className="absolute z-20 flex flex-col items-center justify-center text-white px-6 text-center bg-black/80 inset-0 backdrop-blur-sm">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-4 ring-1 ring-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <p className="font-bold text-lg mb-2 text-red-50">ไม่สามารถเข้าถึงกล้องได้</p>
            <p className="text-xs text-slate-300 leading-relaxed max-w-[250px]">
              อุปกรณ์อาจไม่รองรับ หรือคุณยังไม่ได้อนุญาตให้เบราว์เซอร์ใช้งานกล้อง<br/><br/>กรุณาตรวจสอบการตั้งค่าแล้วลองใหม่อีกครั้ง
            </p>
          </div>
        )}
        
        {/* ตัวคอนเทนเนอร์กล้อง */}
        <div id="qr-reader" className="w-full h-full flex items-center justify-center absolute inset-0 bg-black"></div>

        {/* 🎨 Overlay กรอบโฟกัส (ฟิล์มดำเจาะช่องใสตรงกลาง) */}
        {!isStarting && !hasError && (
          <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center overflow-hidden">
             
             {/* กล่องใสตรงกลาง + เงามืดรอบนอก */}
             <div className="relative w-[240px] h-[240px] rounded-[1.75rem] shadow-[0_0_0_999px_rgba(0,0,0,0.65)] transition-all duration-300">
               
               {/* 🟢 เส้นเลเซอร์สแกนขึ้นลง (ปรับให้สวยและสมูทขึ้น) */}
               <div className="absolute left-4 right-4 h-0.5 bg-emerald-400 shadow-[0_0_12px_3px_rgba(52,211,153,0.8)] animate-scan-laser rounded-full"></div>

               {/* มุม 4 ด้าน (Corner Brackets) สีขาวคลีนๆ แบบแอปธนาคาร */}
               <div className="absolute -top-0.5 -left-0.5 w-14 h-14 border-t-[4px] border-l-[4px] border-white rounded-tl-[1.75rem] opacity-100 drop-shadow-md"></div>
               <div className="absolute -top-0.5 -right-0.5 w-14 h-14 border-t-[4px] border-r-[4px] border-white rounded-tr-[1.75rem] opacity-100 drop-shadow-md"></div>
               <div className="absolute -bottom-0.5 -left-0.5 w-14 h-14 border-b-[4px] border-l-[4px] border-white rounded-bl-[1.75rem] opacity-100 drop-shadow-md"></div>
               <div className="absolute -bottom-0.5 -right-0.5 w-14 h-14 border-b-[4px] border-r-[4px] border-white rounded-br-[1.75rem] opacity-100 drop-shadow-md"></div>
             </div>

             {/* ข้อความบอกผู้ใช้สไตล์เรียบหรู */}
             <div className="absolute bottom-10 flex flex-col items-center animate-fade-in-up">
               <p className="text-white text-[13px] font-bold tracking-widest drop-shadow-lg bg-black/50 px-6 py-2.5 rounded-full backdrop-blur-md border border-white/20">
                 จัดคิวอาร์โค้ดให้อยู่ในกรอบ
               </p>
             </div>
          </div>
        )}
      </div>

      {/* 🎨 CSS ล้างขยะและจัดการเลเซอร์ */}
      <style>{`
        /* ซ่อน UI ขยะที่ html5-qrcode สร้างขึ้นมา */
        #qr-reader {
          border: none !important;
          background: #000;
        }
        #qr-reader img,
        #qr-reader a,
        #qr-reader span,
        #qr-reader div[style*="text-align: center"] {
          display: none !important;
        }

        /* ปรับวิดีโอให้เต็มจอ สมูท ไม่มีขอบดำ */
        #qr-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          transform: scale(1.02); /* ซูมเข้าจิ๊ดนึงเพื่อตัดขอบดำ */
          border-radius: 2rem;
        }

        /* อนิเมชันเลเซอร์สแกนแบบสมูท (Ease In Out) */
        @keyframes scan-laser {
          0% { top: 15px; opacity: 0; transform: scaleX(0.8); }
          15% { opacity: 1; transform: scaleX(1); }
          50% { top: 120px; }
          85% { opacity: 1; transform: scaleX(1); }
          100% { top: 225px; opacity: 0; transform: scaleX(0.8); }
        }
        .animate-scan-laser {
          animation: scan-laser 2.2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}