export const TERMS_DOCUMENT_KEY = 'lockrnotes/terms-of-use';
export const TERMS_VERSION = '1.0.0';

export type TermsSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export type TermsAcceptanceRecord = {
  documentKey: string;
  version: string;
  locale: string;
  contentSha256: string;
  acceptedAt: string;
};

function normalizeLocale(locale: string): 'pt-BR' | 'en' {
  return locale.startsWith('pt') ? 'pt-BR' : 'en';
}

const TERMS_PT: TermsSection[] = [
  {
    id: 'acceptance',
    title: '1. Aceitação',
    paragraphs: [
      'Ao marcar a caixa de aceite e continuar usando o Lockr Notes, você declara que leu, compreendeu e concorda com estes Termos de Uso.',
      'Se você não concordar, não utilize o aplicativo.',
    ],
  },
  {
    id: 'software',
    title: '2. Natureza do software',
    paragraphs: [
      'O Lockr Notes é software de código aberto, licenciado sob a MIT License. O código-fonte está disponível no repositório público do projeto no GitHub.',
      'O aplicativo é fornecido gratuitamente, sem garantia de disponibilidade contínua, suporte comercial ou evolução de funcionalidades.',
    ],
  },
  {
    id: 'responsibility',
    title: '3. Responsabilidade do usuário',
    paragraphs: [
      'Você é o único responsável pelo conteúdo que armazena, edita, exporta, importa ou compartilha por meio do Lockr Notes.',
      'Você deve usar o software em conformidade com a legislação aplicável e não empregá-lo para atividades ilícitas, fraudulentas ou que violem direitos de terceiros.',
      'Credenciais, senhas, chaves e demais dados sensíveis que você guardar no aplicativo são de sua exclusiva responsabilidade.',
    ],
  },
  {
    id: 'data',
    title: '4. Dados locais, criptografia e backups',
    paragraphs: [
      'Por padrão, suas notas e configurações ficam armazenadas localmente no seu computador. A criptografia depende das opções que você escolher e do ambiente em que o app é executado.',
      'Perda de arquivos, corrupção de dados, exclusão acidental, falha de disco, formatação, troca de perfil do sistema ou perda da chave de criptografia podem tornar o conteúdo irrecuperável.',
      'Você deve manter cópias de segurança periódicas e testar a restauração dessas cópias. O autor não garante recuperação de dados.',
    ],
  },
  {
    id: 'network',
    title: '5. Recursos que acessam a rede',
    paragraphs: [
      'Embora o foco do Lockr Notes seja o armazenamento local, alguns recursos podem abrir conexões de rede quando você os utiliza, incluindo login web, SSH, RDP e verificação de atualizações na versão instalada.',
      'Essas conexões ocorrem conforme os destinos, credenciais e URLs definidos por você. O Lockr Notes não substitui firewalls, antivírus, políticas corporativas ou práticas de segurança da sua organização.',
    ],
  },
  {
    id: 'warranty',
    title: '6. Isenção de garantias',
    paragraphs: [
      'O software é fornecido "COMO ESTÁ" e "CONFORME DISPONÍVEL", sem garantias de qualquer tipo, expressas ou implícitas, incluindo, sem limitação, garantias de comerciabilidade, adequação a um propósito específico, ausência de erros ou continuidade de operação.',
    ],
  },
  {
    id: 'liability',
    title: '7. Limitação de responsabilidade',
    paragraphs: [
      'Na máxima extensão permitida pela lei aplicável, o autor e os colaboradores do projeto não serão responsáveis por danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos.',
      'Isso inclui, sem limitação, perda de dados, lucros cessantes, interrupção de negócios, uso indevido do software, acesso não autorizado, danos a equipamentos, falhas de hardware ou software de terceiros, ou qualquer prejuízo decorrente do uso ou da impossibilidade de uso do Lockr Notes.',
      'Você utiliza o aplicativo por sua conta e risco.',
    ],
  },
  {
    id: 'changes',
    title: '8. Alterações destes termos',
    paragraphs: [
      'Estes termos podem ser atualizados quando o conteúdo legal ou as funcionalidades do aplicativo mudarem. Quando houver nova versão, você poderá precisar aceitar novamente os termos para continuar usando o Lockr Notes.',
      'A versão aceita fica registrada localmente no arquivo de configuração criptografado do aplicativo, com identificador do documento, versão, idioma, data e checksum do texto aceito.',
    ],
  },
];

const TERMS_EN: TermsSection[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance',
    paragraphs: [
      'By checking the acceptance box and continuing to use Lockr Notes, you confirm that you have read, understood, and agree to these Terms of Use.',
      'If you do not agree, do not use the application.',
    ],
  },
  {
    id: 'software',
    title: '2. Nature of the software',
    paragraphs: [
      'Lockr Notes is open source software licensed under the MIT License. Source code is available in the project public GitHub repository.',
      'The application is provided free of charge, without any promise of continuous availability, commercial support, or feature development.',
    ],
  },
  {
    id: 'responsibility',
    title: '3. User responsibility',
    paragraphs: [
      'You are solely responsible for the content you store, edit, export, import, or share through Lockr Notes.',
      'You must use the software in compliance with applicable law and must not use it for unlawful, fraudulent, or rights-violating activities.',
      'Credentials, passwords, keys, and other sensitive data you store in the app are your exclusive responsibility.',
    ],
  },
  {
    id: 'data',
    title: '4. Local data, encryption, and backups',
    paragraphs: [
      'By default, your notes and settings are stored locally on your computer. Encryption depends on the options you choose and the environment where the app runs.',
      'File loss, data corruption, accidental deletion, disk failure, formatting, system profile changes, or loss of an encryption key may make content unrecoverable.',
      'You must keep periodic backups and test restoration. The author does not guarantee data recovery.',
    ],
  },
  {
    id: 'network',
    title: '5. Network-related features',
    paragraphs: [
      'Although Lockr Notes focuses on local storage, some features may open network connections when you use them, including web login, SSH, RDP, and update checks in the installed build.',
      'Those connections depend on destinations, credentials, and URLs defined by you. Lockr Notes does not replace firewalls, antivirus tools, corporate policies, or your organization security practices.',
    ],
  },
  {
    id: 'warranty',
    title: '6. Disclaimer of warranties',
    paragraphs: [
      'The software is provided "AS IS" and "AS AVAILABLE", without warranties of any kind, whether express or implied, including without limitation merchantability, fitness for a particular purpose, error-free operation, or uninterrupted availability.',
    ],
  },
  {
    id: 'liability',
    title: '7. Limitation of liability',
    paragraphs: [
      'To the maximum extent permitted by applicable law, the author and project contributors shall not be liable for direct, indirect, incidental, special, consequential, or punitive damages.',
      'This includes, without limitation, data loss, lost profits, business interruption, misuse of the software, unauthorized access, equipment damage, third-party hardware or software failures, or any harm arising from use or inability to use Lockr Notes.',
      'You use the application at your own risk.',
    ],
  },
  {
    id: 'changes',
    title: '8. Changes to these terms',
    paragraphs: [
      'These terms may be updated when legal content or application features change. When a new version is published, you may need to accept the terms again to continue using Lockr Notes.',
      'The accepted version is stored locally in the app encrypted configuration file, including document identifier, version, language, date, and checksum of the accepted text.',
    ],
  },
];

export function getTermsSections(locale: string): TermsSection[] {
  return normalizeLocale(locale) === 'pt-BR' ? TERMS_PT : TERMS_EN;
}

export function getTermsSummary(locale: string): string[] {
  const isPt = normalizeLocale(locale) === 'pt-BR';
  return isPt
    ? [
        'Software open source, licenciado sob MIT, fornecido sem garantias.',
        'Você é responsável pelo conteúdo, credenciais, backups e uso legal do aplicativo.',
        'Perda de dados, uso indevido, falhas de equipamento e danos indiretos não geram responsabilidade do autor.',
        'Recursos como SSH, RDP, login web e atualizações podem usar rede quando você os acionar.',
      ]
    : [
        'Open source software under the MIT License, provided without warranties.',
        'You are responsible for content, credentials, backups, and lawful use.',
        'The author is not liable for data loss, misuse, equipment failure, or indirect damages.',
        'Features such as SSH, RDP, web login, and update checks may use the network when you enable them.',
      ];
}

export function getCanonicalTermsPayload(locale: string): string {
  const normalized = normalizeLocale(locale);
  return JSON.stringify({
    documentKey: TERMS_DOCUMENT_KEY,
    version: TERMS_VERSION,
    locale: normalized,
    sections: getTermsSections(locale),
  });
}

export async function computeTermsChecksum(locale: string): Promise<string> {
  const payload = getCanonicalTermsPayload(locale);
  const data = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function isTermsAcceptanceCurrent(
  acceptance: TermsAcceptanceRecord | null | undefined,
): boolean {
  if (!acceptance) {
    return false;
  }

  return (
    acceptance.documentKey === TERMS_DOCUMENT_KEY &&
    acceptance.version === TERMS_VERSION &&
    typeof acceptance.contentSha256 === 'string' &&
    acceptance.contentSha256.length === 64 &&
    typeof acceptance.acceptedAt === 'string'
  );
}

export async function verifyTermsAcceptance(
  acceptance: TermsAcceptanceRecord | null | undefined,
): Promise<boolean> {
  if (!acceptance || !isTermsAcceptanceCurrent(acceptance)) {
    return false;
  }

  const expected = await computeTermsChecksum(acceptance.locale);
  return acceptance.contentSha256 === expected;
}

export async function buildTermsAcceptanceRecord(
  locale: string,
): Promise<TermsAcceptanceRecord> {
  return {
    documentKey: TERMS_DOCUMENT_KEY,
    version: TERMS_VERSION,
    locale: normalizeLocale(locale),
    contentSha256: await computeTermsChecksum(locale),
    acceptedAt: new Date().toISOString(),
  };
}
