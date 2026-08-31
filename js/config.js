/**
 * إعداد الاتصال بقاعدة Supabase.
 *
 * 1) أنشئي مشروعًا في Supabase.
 * 2) نفّذي ملف supabase/schema.sql.
 * 3) انسخي Project URL و anon public key هنا.
 *
 * ملاحظة: مفتاح anon مخصص للاستخدام في الواجهة الأمامية، ولا تضعي أبدًا
 * service_role key أو أي مفتاح سري داخل هذا الملف.
 */
window.SHAGEN_CONFIG = {
  supabaseUrl: "YOUR_SUPABASE_URL",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY"
};
