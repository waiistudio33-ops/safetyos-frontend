import { createClient } from '@supabase/supabase-js';

// 1. ใส่ Project URL ของคุณ
const supabaseUrl = 'https://rvqngaalfizcomnfmxlv.supabase.co'; 

// 2. 🚨 เอา Key ที่ก๊อปปี้จากบรรทัด anon public มาวางแทนที่ข้อความข้างล่างนี้ครับ (อย่าลบเครื่องหมาย ' ' นะครับ)
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cW5nYWFsZml6Y29tbmZteGx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjU0MjMsImV4cCI6MjA4NzAwMTQyM30.L0qVqFys7U027DFLjCvFYxPe_AtmuzsksoMnS4kCB0A'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);