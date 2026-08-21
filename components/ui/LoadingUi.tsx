import { LOGO_BASE64 } from "../../constants/logo";

export function LoadingUi() {
  return (
    <div className="h-screen w-full bg-[#f9f7f2] flex flex-col items-center justify-center p-4">
      {LOGO_BASE64 && (
        <img
          src={LOGO_BASE64}
          alt="Logo"
          className="h-60 w-auto object-contain mb-6"
        />
      )}
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1b532b] mb-4"/>
    </div>
  );
}