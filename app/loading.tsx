import { LOGO_BASE64 } from '@/constants/logo';

export default function Loading() {
  return (
    <div className="h-screen w-full bg-[#f9f7f2] flex flex-col items-center justify-center p-4">
      {/* LOGO DO APLICATIVO */}
      {LOGO_BASE64 && (
        <img
          src={LOGO_BASE64}
          alt="Logo Maxsoane Costa Nutrição"
          className="h-48 w-auto object-contain mb-6 animate-pulse"
        />
      )}

      {/* SPINNER PERSONALIZADO NO VERDE DA MARCA */}
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1b532b] mb-4" />

      {/* MENSAGEM SUAVE DE CARREGAMENTO */}
      <p className="text-[#1b532b] font-medium text-sm tracking-wide">
        Carregando formulário...
      </p>
    </div>
  );
}