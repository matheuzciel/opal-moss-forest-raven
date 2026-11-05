# Velatura — marca d'água em lote (Windows)

Aplicativo de desktop em Python para aplicar marca d'água em várias fotos de uma vez.
A interface fica em `main.py`. As fotos originais nunca são substituídas: o programa grava
cópias numa pasta de saída, com o sufixo escolhido (padrão `_marca`).

Formatos: JPG, JPEG, PNG, WEBP e BMP. A orientação EXIF é respeitada (a foto não sai de lado).
A última configuração fica em `watermark_settings.json`, ao lado do script ou do `.exe`.

## 1. Instalar o Python

1. Baixe Python 3.11 ou 3.12, 64 bits, em [python.org/downloads](https://www.python.org/downloads/windows/).
2. Na primeira tela do instalador, marque **Add python.exe to PATH**.
3. Clique em **Customize installation** e confirme que **tcl/tk and IDLE** está marcado
   (é o que desenha a janela).
4. Conclua a instalação.

Abra o **Prompt de Comando** e confira:

```bat
python --version
```

Tem de aparecer Python 3.11 ou 3.12. Se o comando não for achado, feche o Prompt e abra de novo.

## 2. Instalar as dependências

No Prompt, entre na pasta onde estão `main.py` e `requirements.txt`:

```bat
cd C:\caminho\para\a\pasta
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

O `(.venv)` no começo da linha indica que o ambiente virtual está ativo.
Abra um Prompt novo no futuro? Ative de novo com `.venv\Scripts\activate`.

## 3. Testar antes de gerar o .exe

```bat
python main.py
```

A janela do Velatura deve abrir. Arraste fotos, escolha a marca, escolha a pasta de saída
e processe um lote pequeno. Feche a janela quando estiver tudo certo.

Se aparecer erro de tkinter, reinstale o Python com **tcl/tk** marcado.
Se arrastar e soltar não funcionar, use os botões **Adicionar arquivos** e **Adicionar pasta**.
Isso só acontece quando o pacote `tkinterdnd2` não foi instalado.

## 4. Gerar o .exe com PyInstaller

Ainda com o `(.venv)` ativo, na mesma pasta do `main.py`:

```bat
pip install pyinstaller
pyinstaller --noconfirm --clean --onefile --windowed --name Velatura --collect-all customtkinter --collect-all tkinterdnd2 main.py
```

O que cada opção faz:

| Opção | Efeito |
| --- | --- |
| `--onefile` | Um único `Velatura.exe` |
| `--windowed` | Não abre a janela preta do console |
| `--name Velatura` | Nome do executável |
| `--collect-all customtkinter` | Leva os temas da interface |
| `--collect-all tkinterdnd2` | Leva o suporte a arrastar e soltar |

Quando terminar, o programa está em:

```text
dist\Velatura.exe
```

Copie esse arquivo para onde quiser. A primeira abertura demora alguns segundos
(o executável único descompacta a si mesmo). As configurações são gravadas em
`watermark_settings.json` **na mesma pasta do .exe**.

### Aviso do Windows (SmartScreen)

O `.exe` não tem assinatura digital. O Windows pode mostrar "Windows protegeu o computador".
Clique em **Mais informações** e depois em **Executar assim mesmo**.
Alguns antivírus também alertam qualquer executável feito com PyInstaller. Isso é um
falso positivo comum. Gere o arquivo você mesmo, no seu PC, em vez de baixar um `.exe` de origem desconhecida.

### Se o .exe fechar na hora

Gere de novo **sem** `--windowed` para ver a mensagem de erro:

```bat
pyinstaller --noconfirm --clean --onefile --name Velatura --collect-all customtkinter --collect-all tkinterdnd2 main.py
```

Rode `dist\Velatura.exe` pelo Prompt de Comando e leia o texto.

### Alternativa que abre mais rápido

Uma pasta em vez de um arquivo único (a abertura é mais rápida):

```bat
pyinstaller --noconfirm --clean --windowed --name Velatura --collect-all customtkinter --collect-all tkinterdnd2 main.py
```

Distribua a pasta inteira `dist\Velatura\`. O executável é `dist\Velatura\Velatura.exe`.

## 5. Uso rápido

1. Arraste fotos ou pastas para a janela, ou use **Adicionar arquivos**.
2. Escolha texto (fonte, cor, tamanho) ou um logo PNG com transparência.
3. Ajuste opacidade, tamanho (% da largura da foto), rotação e posição.
4. A primeira foto da lista aparece na pré-visualização.
5. Escolha a pasta de saída. Não use a mesma pasta esperando substituir os originais:
   o programa sempre cria um arquivo novo e, se o nome já existir, acrescenta ` (1)`, ` (2)`…
6. Clique em **Aplicar marca**. A barra de progresso anda enquanto a janela continua responsiva.
7. No fim, um resumo mostra quantas fotos foram salvas e quais falharam
   (arquivo corrompido, sem permissão, formato inválido).

## Solução de problemas

| Sintoma | O que fazer |
| --- | --- |
| `python` não é reconhecido | Reinstale marcando **Add python.exe to PATH** e abra o Prompt de novo |
| Erro ao importar tkinter / customtkinter | Reinstale o Python com tcl/tk. Não use um Python embarcado sem Tk |
| Arrastar não funciona | `pip install tkinterdnd2` e gere o exe de novo com `--collect-all tkinterdnd2` |
| Foto saiu cortada ou preta | Arquivo corrompido, ou PNG transparente exportado para JPG (o fundo fica branco) |
| "sem permissão" | Escolha uma pasta de saída em Documentos ou na Área de Trabalho, não em `C:\` |
| Qualidade ruim | Suba o controle **Qualidade JPEG/WEBP** (padrão 92, máximo 100, sem subamostragem de cor) |
