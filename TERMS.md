# Termos de Uso — Lockr Notes

**Documento:** `lockrnotes/terms-of-use`  
**Versão:** `1.0.0`

O texto canônico exibido no aplicativo e usado para calcular o checksum de aceite está em `src/renderer/terms/termsDocument.ts`. Ao alterar os termos, incremente `TERMS_VERSION` nesse arquivo.

## Resumo

- Software open source sob licença MIT ([LICENSE no GitHub](https://github.com/elongvieira/lockrnotes/blob/main/LICENSE)).
- Uso por conta e risco do usuário.
- Sem garantias; sem responsabilidade por perda de dados, uso indevido ou danos.
- Backups e proteção de credenciais são responsabilidade do usuário.
- Recursos de rede (SSH, RDP, login web, atualizações) só agem quando você os utiliza.

## Registro da aceite

Quando o usuário aceita no app, o arquivo criptografado `config.enc` (pasta de dados do aplicativo) guarda:

| Campo | Descrição |
|--------|-----------|
| `documentKey` | Identificador fixo do documento (`lockrnotes/terms-of-use`) |
| `version` | Versão dos termos aceitos |
| `locale` | Idioma do texto aceito (`pt-BR` ou `en`) |
| `contentSha256` | SHA-256 do payload canônico (chave + versão + locale + seções) |
| `acceptedAt` | Data/hora ISO 8601 da aceitação |

Se a versão mudar ou o checksum não bater com o texto atual, o app solicita nova aceitação.

---

# Terms of Use — Lockr Notes

**Document:** `lockrnotes/terms-of-use`  
**Version:** `1.0.0`

The canonical text shown in the app and used for acceptance checksums lives in `src/renderer/terms/termsDocument.ts`. When terms change, bump `TERMS_VERSION` in that file.

See the in-app **Read full terms** dialog for the complete legal text in Portuguese or English.
