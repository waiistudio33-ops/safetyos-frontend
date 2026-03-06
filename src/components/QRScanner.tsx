import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export default function QRScanner({ onScan }: { onScan: (text: string) => void }) {
  const [isStarting, setIsInitializing] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // ใช้ Html5Qrcode ตัว Core แทน Scanner เพื่อควบคุมการเปิดกล้องเองทั้งหมด
    const html5QrCode = new Html5Qrcode("qr-reader");
    const scanSize = window.innerWidth < 400 ? 220 : 250;

    const startScanning = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" }, // บังคับใช้กล้องหลัง
          {
            fps: 15,
            qrbox: { width: scanSize, height: scanSize },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // สแกนสำเร็จ: สั่งหยุดกล้องทันทีและส่งค่ากลับ
            if (html5QrCode.isScanning) {
              html5QrCode.stop().then(() => {
                onScan(decodedText);
              }).catch(err => console.error("Stop error", err));
            }
          },
          (errorMessage) => {
            // ไม่พบ QR (ทำงานตลอดเวลา ไม่ต้อง console.log ให้รก)
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

    // Cleanup ตอนปิดหน้าต่าง
    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch((err) => console.error("Failed to stop scanner", err));
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
            <p className="font-medium text-sm animate-pulse">กำลังเตรียมกล้อง...</p>
          </div>
        )}

        {/* State: กรณีไม่อนุญาตสิทธิ์กล้อง */}
        {hasError && !isStarting && (
          <div className="absolute z-20 flex flex-col items-center justify-center text-white px-6 text-center">
            <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <p className="font-bold text-lg mb-1">ไม่สามารถเข้าถึงกล้องได้</p>
            <p className="text-xs text-slate-400">กรุณาอนุญาตให้เบราว์เซอร์ใช้งานกล้องในการตั้งค่า</p>
          </div>
        )}
        
        {/* ตัวคอนเทนเนอร์กล้อง */}
        <div id="qr-reader" className="w-full h-full flex items-center justify-center absolute inset-0"></div>

        {/* 🎨 Overlay กรอบโฟกัส (ฟิล์มดำเจาะช่องใสตรงกลาง) */}
        {!isStarting && !hasError && (
          <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center overflow-hidden">
             
             {/* กล่องใสตรงกลาง + เงามืดรอบนอก (ใช้ CSS Shadow สร้างฟิล์มดำ) */}
             <div className="relative w-[240px] h-[240px] rounded-3xl shadow-[0_0_0_999px_rgba(0,0,0,0.55)]">
               
               {/* 🟢 เส้นเลเซอร์สแกนขึ้นลง */}
               <div className="absolute left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.8)] animate-scan-laser"></div>

               {/* มุม 4 ด้าน (Corner Brackets) สีขาวคลีนๆ แบบแอปธนาคาร */}
               <div className="absolute -top-0.5 -left-0.5 w-12 h-12 border-t-[4px] border-l-[4px] border-white rounded-tl-3xl opacity-100"></div>
               <div className="absolute -top-0.5 -right-0.5 w-12 h-12 border-t-[4px] border-r-[4px] border-white rounded-tr-3xl opacity-100"></div>
               <div className="absolute -bottom-0.5 -left-0.5 w-12 h-12 border-b-[4px] border-l-[4px] border-white rounded-bl-3xl opacity-100"></div>
               <div className="absolute -bottom-0.5 -right-0.5 w-12 h-12 border-b-[4px] border-r-[4px] border-white rounded-br-3xl opacity-100"></div>
             </div>

             {/* ข้อความบอกผู้ใช้สไตล์เรียบหรู */}
             <p className="absolute bottom-12 text-white text-sm font-medium tracking-wide drop-shadow-md bg-black/40 px-5 py-2 rounded-full backdrop-blur-md border border-white/10">
               จัดคิวอาร์โค้ดให้อยู่ในกรอบ
             </p>
          </div>
        )}
      </div>

      {/* 🎨 CSS ล้างขยะและจัดการเลเซอร์ */}
      <style>{`
        /* ซ่อน UI ทั้งหมดที่ library พยายามจะสร้าง */
        #qr-reader {
          border: none !important;
        }
        #qr-reader img,
        #qr-reader a,
        #qr-reader span,
        #qr-reader div[style*="text-align: center"] {
          display: none !important;
        }

        /* ปรับวิดีโอให้เต็มจอ ไม่มีขอบดำ */
        #qr-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          transform: scale(1.05); /* ซูมเข้าเล็กน้อยเพื่อตัดขอบดำ */
        }

        /* อนิเมชันเลเซอร์สแกน */
        @keyframes scan-laser {
          0% { top: 10px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 230px; opacity: 0; }
        }
        .animate-scan-laser {
          animation: scan-laser 2.5s infinite linear;
        }
      `}</style>
    </div>
  );
}