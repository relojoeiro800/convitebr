import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacidade")({
  component: PrivacyPage,
  head: () => ({ meta: [
    { title: "Política de privacidade — Convite BR" },
    { name: "description", content: "Como tratamos seus dados pessoais em conformidade com a LGPD (Lei 13.709/2018)." },
  ] }),
});

function PrivacyPage() {
  return (
    <main className="container max-w-3xl py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2 text-muted-foreground">
        <Link to="/seguranca"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
      </Button>
      <h1 className="font-display text-4xl font-semibold">Política de privacidade</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Atualizada em {new Date().toLocaleDateString("pt-BR")} · Em conformidade com a LGPD (Lei 13.709/2018)
      </p>

      <article className="prose-invite mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground">1. Quem somos</h2>
          <p className="mt-2">
            O Convite BR é uma plataforma para criar e compartilhar convites digitais.
            Atuamos como <strong>controlador</strong> dos seus dados de cadastro e como
            <strong> operador</strong> dos dados que você coleta de seus convidados (RSVPs).
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-foreground">2. Quais dados tratamos</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Cadastro:</strong> e-mail, nome e senha (com hash).</li>
            <li><strong>Convites:</strong> textos, imagens, datas e configurações que você cria.</li>
            <li><strong>RSVPs dos convidados:</strong> nome, e-mail e WhatsApp (opcionais), número de acompanhantes e mensagem.</li>
            <li><strong>Pagamentos:</strong> registro de plano e valor; dados de cartão são processados pelo provedor de pagamento, nunca por nós.</li>
            <li><strong>Logs técnicos:</strong> IP truncado e horário de acessos para fins de segurança.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-foreground">3. Bases legais</h2>
          <p className="mt-2">
            Tratamos dados com base em (i) <strong>execução de contrato</strong> para entregar o serviço,
            (ii) <strong>consentimento</strong> para envio de notificações, e (iii) <strong>legítimo interesse</strong>
            para segurança, prevenção a fraudes e melhoria do produto.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-foreground">4. Compartilhamento</h2>
          <p className="mt-2">
            Não vendemos seus dados. Compartilhamos apenas com operadores essenciais ao serviço
            (hospedagem, e-mail transacional, processamento de pagamento), todos sob obrigação contratual
            de confidencialidade e segurança.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-foreground">5. Segurança</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Criptografia TLS em trânsito e AES-256 em repouso.</li>
            <li>Senhas com hash bcrypt e salt único.</li>
            <li>Row-Level Security: cada usuário só acessa os próprios dados.</li>
            <li>Backups diários com retenção de 7 dias.</li>
            <li>Anti-spam (honeypot) em formulários públicos.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-foreground">6. Seus direitos (LGPD)</h2>
          <p className="mt-2">Você pode, a qualquer momento:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Confirmar quais dados temos sobre você.</li>
            <li>Acessar e baixar seus dados em formato JSON.</li>
            <li>Corrigir dados incompletos ou desatualizados.</li>
            <li>Revogar consentimento de notificações.</li>
            <li>Excluir definitivamente sua conta e todos os dados associados.</li>
          </ul>
          <p className="mt-2">
            Esses direitos estão disponíveis na página{" "}
            <Link to="/seguranca" className="text-primary hover:underline">Segurança e privacidade</Link>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-foreground">7. Retenção</h2>
          <p className="mt-2">
            Mantemos seus dados enquanto sua conta estiver ativa. Após exclusão, removemos os
            registros pessoais imediatamente, mantendo apenas dados anonimizados quando obrigatório
            por lei (ex.: registros fiscais de pagamento).
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-foreground">8. Cookies</h2>
          <p className="mt-2">
            Usamos apenas cookies essenciais para autenticação e preferências. Não utilizamos
            cookies de rastreamento publicitário.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-foreground">9. Encarregado (DPO)</h2>
          <p className="mt-2">
            Para exercer seus direitos ou tirar dúvidas, escreva para{" "}
            <a href="mailto:privacidade@convite.br" className="text-primary hover:underline">privacidade@convite.br</a>.
          </p>
        </section>
      </article>
    </main>
  );
}
