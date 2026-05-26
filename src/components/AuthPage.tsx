import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { Mail, Lock, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

type AuthTab = 'signin' | 'signup' | 'recovery';

export const AuthPage: React.FC = () => {
  const { signUpWithEmail, signInWithEmail, recoverPassword } = useFirebase();

  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [submitting, setSubmitting] = useState(false);

  // Sign In States
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [signinErrors, setSigninErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  // Sign Up States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupErrors, setSignupErrors] = useState<{
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    password?: string;
    general?: string;
  }>({});

  // Password Recovery States
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  // Email format validation helper
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Sign In Validation and Submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigninErrors({});
    const errors: { email?: string; password?: string } = {};

    if (!signinEmail) {
      errors.email = 'يرجى إدخال البريد الإلكتروني';
    } else if (!isValidEmail(signinEmail)) {
      errors.email = 'بريد إلكتروني غير صالح، يرجى إدخال بريد إلكتروني صحيح';
    }

    if (!signinPassword) {
      errors.password = 'يرجى إدخال كلمة المرور';
    }

    if (Object.keys(errors).length > 0) {
      setSigninErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await signInWithEmail(signinEmail.trim(), signinPassword);
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'بريد إلكتروني أو كلمة مرور غير صحيحة، يرجى المحاولة ثانيةً';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة، يرجى التحقق وإعادة المحاولة';
      } else if (err.code === 'auth/network-request-failed') {
        errorMsg = 'حدث خطأ في شبكة الاتصال، يرجى التحقق من اتصالك بالإنترنت';
      }
      setSigninErrors({ general: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  // Sign Up Validation and Submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});
    const errors: typeof signupErrors = {};

    if (!firstName.trim()) {
      errors.firstName = 'الاسم الأول مطلوب ويجب أن يكون حرفين على الأقل';
    } else if (firstName.trim().length < 2) {
      errors.firstName = 'الاسم الأول مطلوب ويجب أن يكون حرفين على الأقل';
    }

    if (!lastName.trim()) {
      errors.lastName = 'اسم العائلة مطلوب ويجب أن يكون حرفين على الأقل';
    } else if (lastName.trim().length < 2) {
      errors.lastName = 'اسم العائلة مطلوب ويجب أن يكون حرفين على الأقل';
    }

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      errors.username = 'اسم المستخدم مطلوب ويجب أن يتكون من 3 أحرف أو أرقام على الأقل وبدون مسافات';
    } else if (cleanUsername.length < 3) {
      errors.username = 'اسم المستخدم مطلوب ويجب أن يتكون من 3 أحرف أو أرقام على الأقل وبدون مسافات';
    } else if (!/^[A-Za-z0-9_-]+$/.test(cleanUsername)) {
      errors.username = 'اسم المستخدم يجب أن يحتوي فقط على أحرف إنجليزية وأرقام، وبدون مسافات';
    }

    if (!signupEmail.trim()) {
      errors.email = 'بريد إلكتروني غير صالح، يرجى إدخال بريد إلكتروني صحيح';
    } else if (!isValidEmail(signupEmail.trim())) {
      errors.email = 'بريد إلكتروني غير صالح، يرجى إدخال بريد إلكتروني صحيح';
    }

    if (!signupPassword) {
      errors.password = 'كلمة المرور مطلوبة ويجب أن تكون من 6 أحرف أو أرقام على الأقل';
    } else if (signupPassword.length < 6) {
      errors.password = 'كلمة المرور مطلوبة ويجب أن تكون من 6 أحرف أو أرقام على الأقل';
    }

    if (Object.keys(errors).length > 0) {
      setSignupErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await signUpWithEmail(
        signupEmail.trim(),
        signupPassword,
        firstName.trim(),
        lastName.trim(),
        cleanUsername
      );
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'تعذر تسجيل الحساب، يرجى مراجعة البيانات المدخلة';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'البريد الإلكتروني المدخل مستخدم بالفعل في حساب آخر';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'البريد الإلكتروني الإلكتروني غير صالح';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'كلمة المرور ضعيفة للغاية، يرجى إدخال كلمة مرور أقوى';
      }
      setSignupErrors({ general: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  // Password Recovery Submit
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (!recoveryEmail.trim()) {
      setRecoveryError('يرجى إدخال البريد الإلكتروني لاستعادة كلمة المرور');
      return;
    } else if (!isValidEmail(recoveryEmail.trim())) {
      setRecoveryError('بريد إلكتروني غير صالح، يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    setSubmitting(true);
    try {
      await recoverPassword(recoveryEmail.trim());
      setRecoverySuccess('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح!');
      setRecoveryEmail('');
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'حدث خطأ أثناء محاولة إرسال رابط استعادة المرور';
      if (err.code === 'auth/user-not-found') {
        errorMsg = 'البريد الإلكتروني المدخل غير مرتبط بأي حساب مسجل لدينا';
      }
      setRecoveryError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 text-right selection:bg-blue-100" dir="rtl" id="auth_page_root">
      {/* Auth Interactive Form Box */}
      <div className="w-full max-w-md bg-white border border-slate-200/60 shadow-xl rounded-3xl p-6 sm:p-8 space-y-8" id="auth_page_form_pane">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full space-y-8"
        >
          {/* Form Tabs for Sign In & Sign Up */}
          {activeTab !== 'recovery' && (
            <div className="flex border border-slate-200/50 bg-slate-50 p-1.5 rounded-2xl gap-2" id="auth_page_tabs_btn_group">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setSigninErrors({});
                  setSignupErrors({});
                }}
                className={`flex-1 py-2.5 text-center text-xs font-bold transition-all rounded-xl cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
                    : 'bg-transparent text-slate-600 hover:bg-slate-100'
                }`}
                id="tab_page_signin_btn"
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setSigninErrors({});
                  setSignupErrors({});
                }}
                className={`flex-1 py-2.5 text-center text-xs font-bold transition-all rounded-xl cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
                    : 'bg-transparent text-slate-600 hover:bg-slate-100'
                }`}
                id="tab_page_signup_btn"
              >
                إنشاء حساب جديد
              </button>
            </div>
          )}

          {/* SECTION: SIGN IN FORM */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4" id="page_signin_form" noValidate>
              {signinErrors.general && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2" id="page_signin_general_error">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{signinErrors.general}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="page_signin_email_input">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    id="page_signin_email_input"
                    placeholder="example@domain.com"
                    value={signinEmail}
                    onChange={(e) => setSigninEmail(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none transition-all text-right ${
                      signinErrors.email ? 'border-red-400 focus:ring-2 focus:ring-red-500/15' : 'border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500'
                    }`}
                  />
                </div>
                {signinErrors.email && (
                  <p className="text-[11px] font-medium text-red-600" id="page_signin_email_error">
                    {signinErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700" htmlFor="page_signin_password_input">
                    كلمة المرور
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('recovery')}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                    id="page_forgot_password"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    id="page_signin_password_input"
                    placeholder="••••••••"
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none transition-all text-right ${
                      signinErrors.password ? 'border-red-400 focus:ring-2 focus:ring-red-500/15' : 'border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500'
                    }`}
                  />
                </div>
                {signinErrors.password && (
                  <p className="text-[11px] font-medium text-red-600" id="page_signin_password_error">
                    {signinErrors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer mt-6"
                id="page_signin_submit_btn"
              >
                {submitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </button>
            </form>
          )}

          {/* SECTION: SIGN UP FORM */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4" id="page_signup_form" noValidate>
              {signupErrors.general && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2" id="page_signup_general_error">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{signupErrors.general}</span>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block" htmlFor="page_signup_firstname_input">
                    الاسم الأول
                  </label>
                  <input
                    type="text"
                    id="page_signup_firstname_input"
                    placeholder="أحمد"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-right ${
                      signupErrors.firstName ? 'border-red-400 focus:ring-2 focus:ring-red-500/15' : 'border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500'
                    }`}
                  />
                  {signupErrors.firstName && (
                    <p className="text-[11px] font-medium text-red-600" id="page_signup_firstname_error">
                      {signupErrors.firstName}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block" htmlFor="page_signup_lastname_input">
                    اسم العائلة
                  </label>
                  <input
                    type="text"
                    id="page_signup_lastname_input"
                    placeholder="محمود"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm outline-none transition-all text-right ${
                      signupErrors.lastName ? 'border-red-400 focus:ring-2 focus:ring-red-500/15' : 'border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500'
                    }`}
                  />
                  {signupErrors.lastName && (
                    <p className="text-[11px] font-medium text-red-600" id="page_signup_lastname_error">
                      {signupErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="page_signup_username_input">
                  اسم المستخدم (مُعرّف فريد)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 font-mono text-xs">
                    @
                  </span>
                  <input
                    type="text"
                    id="page_signup_username_input"
                    placeholder="ahmed_99"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none transition-all text-right font-mono ${
                      signupErrors.username ? 'border-red-400 focus:ring-2 focus:ring-red-500/15' : 'border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500'
                    }`}
                  />
                </div>
                {signupErrors.username && (
                  <p className="text-[11px] font-medium text-red-600" id="page_signup_username_error">
                    {signupErrors.username}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="page_signup_email_input">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    id="page_signup_email_input"
                    placeholder="name@domain.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none transition-all text-right ${
                      signupErrors.email ? 'border-red-400 focus:ring-2 focus:ring-red-500/15' : 'border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500'
                    }`}
                  />
                </div>
                {signupErrors.email && (
                  <p className="text-[11px] font-medium text-red-600" id="page_signup_email_error">
                    {signupErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="page_signup_password_input">
                  كلمة المرور
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    id="page_signup_password_input"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none transition-all text-right ${
                      signupErrors.password ? 'border-red-400 focus:ring-2 focus:ring-red-500/15' : 'border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500'
                    }`}
                  />
                </div>
                {signupErrors.password && (
                  <p className="text-[11px] font-medium text-red-600" id="page_signup_password_error">
                    {signupErrors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer mt-6"
                id="page_signup_submit_btn"
              >
                {submitting ? 'جاري إنشاء الحساب...' : 'إنشاء حساب مستخدم جديد'}
              </button>
            </form>
          )}

          {/* SECTION: PASSWORD RECOVERY */}
          {activeTab === 'recovery' && (
            <form onSubmit={handleRecoverySubmit} className="space-y-4" id="page_recovery_form" noValidate>
              {recoverySuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs flex items-start gap-2" id="page_recovery_success_msg">
                  <Check className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                  <span>{recoverySuccess}</span>
                </div>
              )}

              {recoveryError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2" id="page_recovery_error_alert">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{recoveryError}</span>
                </div>
              )}

              {/* Recovery Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="page_recovery_email_input">
                  البريد الإلكتروني للحساب
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    id="page_recovery_email_input"
                    placeholder="name@domain.com"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none transition-all text-right ${
                      recoveryError ? 'border-red-400 focus:ring-2 focus:ring-red-500/15' : 'border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              {/* Recovery Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer mt-4"
                id="page_recovery_submit_btn"
              >
                {submitting ? 'جاري الإرسال...' : 'إرسال رابط استعادة كلمة المرور'}
              </button>

              {/* Back to signin link */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setRecoveryError('');
                    setRecoverySuccess('');
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  id="page_back_to_login_link"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>العودة لصفحة تسجيل الدخول</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};
