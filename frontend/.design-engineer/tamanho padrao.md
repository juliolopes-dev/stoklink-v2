# Design System Global - Padrão Reutilizável

Sistema de design genérico e reutilizável para projetos web/desktop.

---

## 🎨 Fundamentos de Design

### Escala de Tamanhos (Base 4px)
```
2px   - micro (gap-0.5, p-0.5)
4px   - tiny (gap-1, p-1)
8px   - small (gap-2, p-2)
12px  - base (gap-3, p-3)
16px  - medium (gap-4, p-4)
20px  - large (gap-5, p-5)
24px  - xlarge (gap-6, p-6)
32px  - 2xl (gap-8, p-8)
48px  - 3xl (gap-12, p-12)
64px  - 4xl (gap-16, p-16)
```

### Tipografia (Sistema de Fontes)

#### Tamanhos de Fonte
```css
/* Extra Small */
10px  - text-[10px]   - Legendas, badges
11px  - text-[11px]   - Textos muito pequenos

/* Small */
12px  - text-xs       - Corpo compacto, labels
13px  - text-[13px]   - Corpo intermediário
14px  - text-sm       - Corpo padrão

/* Medium */
16px  - text-base     - Corpo confortável
18px  - text-lg       - Subtítulos

/* Large */
20px  - text-xl       - Títulos pequenos
24px  - text-2xl      - Títulos médios
30px  - text-3xl      - Títulos grandes
36px  - text-4xl      - Títulos principais
48px  - text-5xl      - Display
```

#### Pesos de Fonte
```css
300 - font-light      - Textos leves
400 - font-normal     - Corpo de texto
500 - font-medium     - Ênfase leve
600 - font-semibold   - Títulos, labels
700 - font-bold       - Ênfase forte
800 - font-extrabold  - Destaque máximo
```

#### Altura de Linha
```css
leading-none    - 1       - Títulos compactos
leading-tight   - 1.25    - Títulos
leading-snug    - 1.375   - Corpo denso
leading-normal  - 1.5     - Corpo padrão
leading-relaxed - 1.625   - Corpo confortável
leading-loose   - 2       - Corpo espaçado
```

---

## 📏 Componentes por Tamanho

### Botões

#### Tamanho Compacto (Densidade Alta)
```tsx
<button className="h-6 px-2 text-[10px] font-medium">
  Micro
</button>

<button className="h-7 px-2 text-xs font-medium">
  Compacto
</button>
```

#### Tamanho Padrão
```tsx
<button className="h-8 px-3 text-xs font-medium">
  Pequeno
</button>

<button className="h-9 px-4 text-sm font-medium">
  Médio (Padrão)
</button>

<button className="h-10 px-4 text-sm font-medium">
  Normal
</button>
```

#### Tamanho Confortável
```tsx
<button className="h-11 px-5 text-base font-medium">
  Grande
</button>

<button className="h-12 px-6 text-base font-medium">
  Extra Grande
</button>
```

### Inputs

#### Tamanho Compacto
```tsx
<input className="h-6 px-2 text-[10px]" />  /* Micro */
<input className="h-7 px-2 text-xs" />      /* Compacto */
<input className="h-8 px-3 text-xs" />      /* Pequeno */
```

#### Tamanho Padrão
```tsx
<input className="h-9 px-3 text-sm" />      /* Médio */
<input className="h-10 px-4 text-sm" />     /* Normal (Padrão) */
```

#### Tamanho Confortável
```tsx
<input className="h-11 px-4 text-base" />   /* Grande */
<input className="h-12 px-5 text-base" />   /* Extra Grande */
```

### Cards

#### Padding por Densidade
```tsx
/* Alta Densidade */
<div className="p-2">Micro</div>
<div className="p-3">Compacto</div>

/* Densidade Média */
<div className="p-4">Padrão</div>
<div className="p-5">Confortável</div>

/* Baixa Densidade */
<div className="p-6">Espaçoso</div>
<div className="p-8">Extra Espaçoso</div>
```

### Tabelas

#### Compacta
```tsx
<table className="text-xs">
  <thead>
    <th className="px-2 py-1">Coluna</th>
  </thead>
  <tbody>
    <td className="px-2 py-1">Dado</td>
  </tbody>
</table>
```

#### Padrão
```tsx
<table className="text-sm">
  <thead>
    <th className="px-3 py-2">Coluna</th>
  </thead>
  <tbody>
    <td className="px-3 py-2">Dado</td>
  </tbody>
</table>
```

#### Confortável
```tsx
<table className="text-base">
  <thead>
    <th className="px-4 py-3">Coluna</th>
  </thead>
  <tbody>
    <td className="px-4 py-3">Dado</td>
  </tbody>
</table>
```

---

## 🎯 Guia de Escolha de Tamanhos

### Por Tipo de Aplicação

#### Desktop/Admin (Alta Densidade)
```
Fonte corpo: 12px (text-xs)
Fonte títulos: 14px (text-sm)
Botões: h-7 ou h-8
Inputs: h-7 ou h-8
Padding: p-2, p-3
Tabelas: text-xs, px-2 py-1
```

#### Web Padrão (Densidade Média)
```
Fonte corpo: 14px (text-sm) ou 16px (text-base)
Fonte títulos: 18px (text-lg) ou 20px (text-xl)
Botões: h-9 ou h-10
Inputs: h-9 ou h-10
Padding: p-4, p-5
Tabelas: text-sm, px-3 py-2
```

#### Mobile/Touch (Baixa Densidade)
```
Fonte corpo: 16px (text-base)
Fonte títulos: 20px (text-xl) ou 24px (text-2xl)
Botões: h-11 ou h-12 (mínimo 44px para touch)
Inputs: h-11 ou h-12
Padding: p-5, p-6
Tabelas: text-base, px-4 py-3
```

### Por Contexto de Uso

#### Dashboards/Análise
- Alta densidade
- Texto pequeno (12-14px)
- Componentes compactos
- Maximize informação visível

#### Formulários/Cadastros
- Densidade média
- Texto médio (14-16px)
- Componentes confortáveis
- Foco em legibilidade

#### Landing Pages/Marketing
- Baixa densidade
- Texto grande (16-18px)
- Componentes espaçosos
- Foco em impacto visual

---

## 📐 Border Radius (Arredondamento)

```css
rounded-none    - 0px      - Sem arredondamento
rounded-sm      - 2px      - Muito sutil
rounded         - 4px      - Padrão (recomendado)
rounded-md      - 6px      - Médio
rounded-lg      - 8px      - Grande
rounded-xl      - 12px     - Extra grande
rounded-2xl     - 16px     - Display
rounded-3xl     - 24px     - Muito grande
rounded-full    - 9999px   - Circular/Pill
```

**Recomendação:**
- Componentes pequenos: `rounded` (4px)
- Componentes médios: `rounded-md` ou `rounded-lg` (6-8px)
- Cards grandes: `rounded-lg` ou `rounded-xl` (8-12px)

---

## 🎨 Sistema de Cores (Genérico)

### Cores Neutras
```css
slate-50   - #f8fafc  - Background claro
slate-100  - #f1f5f9  - Background alternativo
slate-200  - #e2e8f0  - Bordas
slate-300  - #cbd5e1  - Bordas ativas
slate-400  - #94a3b8  - Texto desabilitado
slate-500  - #64748b  - Texto secundário
slate-600  - #475569  - Texto terciário
slate-700  - #334155  - Texto secundário escuro
slate-800  - #1e293b  - Headers, texto principal
slate-900  - #0f172a  - Texto principal escuro
```

### Cores Primárias (Exemplos)
```css
/* Blue - Confiança, Profissional */
blue-50 a blue-900

/* Green - Sucesso, Positivo */
green-50 a green-900

/* Red - Erro, Urgente */
red-50 a red-900

/* Yellow/Amber - Aviso, Atenção */
amber-50 a amber-900

/* Purple - Premium, Criativo */
purple-50 a purple-900
```

---

## 📱 Breakpoints Responsivos

```css
/* Mobile First */
sm:   640px   - Smartphone grande
md:   768px   - Tablet
lg:   1024px  - Desktop pequeno
xl:   1280px  - Desktop médio
2xl:  1536px  - Desktop grande
```

---

## 🔤 Convenções de Nomenclatura

### Classes Utilitárias Comuns
```tsx
/* Espaçamento */
gap-{n}    - Espaçamento entre elementos flex/grid
p-{n}      - Padding
px-{n}     - Padding horizontal
py-{n}     - Padding vertical
m-{n}      - Margin
space-x-{n} - Espaço horizontal entre filhos
space-y-{n} - Espaço vertical entre filhos

/* Tamanho */
w-{n}      - Largura
h-{n}      - Altura
min-w-{n}  - Largura mínima
max-w-{n}  - Largura máxima

/* Texto */
text-{size}   - Tamanho da fonte
font-{weight} - Peso da fonte
leading-{n}   - Altura da linha
tracking-{n}  - Espaçamento entre letras
```

---

## 🎯 Templates Prontos

### Layout Padrão (Aplicação)
```tsx
<div className="min-h-screen bg-slate-50">
  {/* Header */}
  <header className="h-12 bg-slate-800 text-white px-4 flex items-center justify-between">
    <span className="text-sm font-semibold">Logo</span>
    <button className="h-7 px-2 bg-slate-700 rounded text-xs">Ação</button>
  </header>

  {/* Container Principal */}
  <div className="flex flex-col h-[calc(100vh-3rem)]">
    
    {/* Header da Página */}
    <div className="flex-shrink-0 bg-white border-b border-slate-200 p-3">
      <h1 className="text-sm font-semibold">Título da Página</h1>
    </div>

    {/* Conteúdo com Scroll */}
    <div className="flex-1 overflow-y-auto p-3">
      {/* Seu conteúdo aqui */}
    </div>

    {/* Footer (opcional) */}
    <div className="flex-shrink-0 bg-white border-t border-slate-200 p-3">
      <p className="text-xs text-slate-500">Footer</p>
    </div>
  </div>
</div>
```

### Card Padrão
```tsx
<div className="bg-white rounded-lg border border-slate-200 p-4">
  <h2 className="text-sm font-semibold mb-2">Título</h2>
  <p className="text-xs text-slate-600">Conteúdo</p>
</div>
```

### Botão Padrão
```tsx
<button className="h-9 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors">
  Ação
</button>
```

### Input Padrão
```tsx
<input 
  type="text"
  className="h-9 px-3 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  placeholder="Digite..."
/>
```

---

## 📊 Guia Rápido de Decisão

### Escolha o Tamanho Base:
1. **Alta Densidade** (Dashboards, Admin): 12px corpo, h-7/h-8 componentes
2. **Média Densidade** (Web Padrão): 14-16px corpo, h-9/h-10 componentes
3. **Baixa Densidade** (Mobile, Marketing): 16px+ corpo, h-11/h-12 componentes

### Ajuste Conforme Necessário:
- **Mais informação na tela?** → Diminua tamanhos
- **Melhor legibilidade?** → Aumente tamanhos
- **Touch/Mobile?** → Mínimo 44px para áreas clicáveis
- **Idosos/Acessibilidade?** → Aumente tamanhos e contraste

---

## 🎓 Boas Práticas

1. **Consistência**: Use a mesma escala em todo o projeto
2. **Hierarquia**: Diferencie importância com tamanho e peso
3. **Espaçamento**: Use a escala de 4px para harmonia
4. **Contraste**: Garanta legibilidade (WCAG AA mínimo)
5. **Responsividade**: Ajuste tamanhos para diferentes telas
6. **Performance**: Evite muitas variações de tamanho

---

## 📦 Exportar para Projeto

Para usar este sistema em seu projeto:

1. **Copie as classes** que precisa
2. **Ajuste os valores** conforme sua densidade desejada
3. **Documente** as escolhas no README do projeto
4. **Mantenha consistência** em todo o código

---

**Este é um sistema genérico e adaptável. Ajuste conforme as necessidades específicas de cada projeto!**
