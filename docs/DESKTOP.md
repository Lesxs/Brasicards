# BRASICARDS Desktop

## Objetivo

A versão desktop usa Tauri 2 para empacotar a aplicação React + Vite existente em um aplicativo Windows. A versão web continua sendo produzida pelo mesmo comando `npm run build`.

## Requisitos para desenvolvimento local

- Node.js 20 ou superior
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

O workflow `.github/workflows/desktop-build.yml` executa testes, build e geração do instalador em um runner Windows do GitHub Actions. O instalador fica disponível como artefato da execução por 14 dias.

## Segurança e escopo inicial

- A janela inicial não recebe permissões nativas além de `core:default`.
- Não há plugin de filesystem, shell, updater ou acesso externo adicionado.
- O salvamento atual em LocalStorage permanece como está nesta primeira integração.
- O ícone definitivo, assinatura do instalador, atualização automática e testes em máquinas Windows reais ficam para etapas posteriores.
