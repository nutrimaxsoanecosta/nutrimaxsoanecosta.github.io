import Link from 'next/link';

const resources = [
  { label: 'Perfil', path: '/admin/perfil', description: 'Gerencie os perfis do sistema.' },
  { label: 'Paciente', path: '/admin/paciente', description: 'Cadastre e acompanhe os pacientes.' },
  { label: 'Categoria', path: '/admin/categoria', description: 'Organize as categorias do questionário.' },
  { label: 'Categoria/Pergunta', path: '/admin/categoria-pergunta', description: 'Associe categorias às perguntas.' },
  { label: 'Perfil/Pergunta', path: '/admin/perfil-pergunta', description: 'Defina quais perguntas pertencem ao perfil.' },
  { label: 'Pergunta', path: '/admin/pergunta', description: 'Crie e edite perguntas.' },
  { label: 'Tipo de pergunta', path: '/admin/tipo-pergunta', description: 'Controle os tipos de pergunta.' },
  { label: 'Resposta', path: '/admin/resposta', description: 'Administre respostas e opções.' },
  { label: 'Formulário', path: '/admin/formulario', description: 'Gerencie os formulários.' },
  { label: 'Formulário/Pergunta', path: '/admin/formulario-pergunta', description: 'Associe perguntas aos formulários.' },
];

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Administração</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Cradastrar, Editar e Excluir</h1>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => (
            <Link
              key={resource.path}
              href={resource.path}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="mb-3 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-base font-semibold uppercase tracking-[0.12em] text-blue-700">
               {resource.label}
              </div>
              <p className="mt-2 text-sm text-slate-600">{resource.description}</p>
              <span className="mt-4 inline-flex text-sm font-semibold text-blue-700 group-hover:text-blue-800">
                Abrir painel →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
