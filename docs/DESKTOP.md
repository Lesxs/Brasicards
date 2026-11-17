# BRASICARDS Desktop

## Objetivo

A versão desktop usa Tauri 2 para empacotar a aplicação React + Vite existente em um aplicativo Windows. A versão web continua sendo produzida pelo mesmo comando `npm run build`.

## Requisitos para desenvolvimento local

- Windows 10 ou 11 de 64 bits
- Node.js 22 ou 24
- Rust estável
- Microsoft C++ Build Tools (MSVC)
- WebView2 Runtime (normalmente já presente no Windows 10/11)

## Comandos

Instalar dependências:

```bash
npm install
```

Executar a versão desktop em desenvolvimento:

```bash
npm run desktop:dev
```

Gerar o instalador NSIS para Windows:

```bash
npm run desktop:build
```

O instalador é gerado em:

```
src-tauri/target/release/bundle/nsis/
```

## Compilação automatizada

O workflow `.github/workflows/desktop-build.yml` executa verificação de formatação Rust, testes, build e geração do instalador em um runner Windows do GitHub Actions. O instalador fica disponível como artefato da execução por 14 dias.

A integração contínua usa Node.js 24 e versões atuais das Actions oficiais para evitar a execução de ações antigas baseadas em Node.js 20.

## Segurança e escopo inicial

- A janela inicial não recebe permissões nativas além de `core:default`.
- Não há plugin de filesystem, shell, updater ou acesso externo adicionado.
- O salvamento atual em LocalStorage permanece como está nesta primeira integração.
- O instalador ainda não é assinado digitalmente; o Windows pode exibir o aviso de editor desconhecido.
- Atualização automática e testes em máquinas Windows reais ficam para etapas posteriores.

## Observações de distribuição

O instalador gerado pelo CI é adequado para teste inicial. Antes de uma distribuição pública ampla, será necessário validar instalação, inicialização, persistência dos dados, desinstalação e comportamento em máquinas Windows diferentes. Para eliminar o aviso de editor desconhecido, será necessária assinatura de código com certificado válido.
