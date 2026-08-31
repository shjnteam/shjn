/**
 * إعدادات مشروع شَجَن.
 *
 * Supabase:
 * - Project URL
 * - anon public key
 *
 * دخول الإدارة:
 * - adminUsername: اسم المستخدم الذي ستكتبينه في صفحة الإدارة.
 * - adminEmail: البريد الذي أنشأتِ به مستخدم الإدارة داخل Supabase Authentication.
 * - localAdminPassword: للاختبار المحلي فقط قبل ربط Supabase. لا تعتمدي عليه كحماية لموقع منشور.
 *
 * لا تضعي service_role key أو أي مفتاح سري داخل هذا الملف.
 */
window.SHAGEN_CONFIG = {
  supabaseUrl: "YOUR_SUPABASE_URL",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",

  adminUsername: "admin",
  adminEmail: "YOUR_ADMIN_EMAIL",
  localAdminPassword: "ChangeMe2026!"
};
