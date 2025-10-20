# Гайд по форку и модификации AlphaTab

## Когда нужен форк?

- Хотите изменить **внутреннюю логику рендеринга**
- Нужно **нативное** отображение названий нот (не overlay)
- Требуются изменения, недоступные через public API

## Шаги создания форка

### 1. Форк репозитория

```bash
# Форкаем официальный репо
git clone https://github.com/CoderLine/alphaTab.git
cd alphaTab

# Создаем ветку для изменений
git checkout -b feature/note-names-display
```

### 2. Найти место рендеринга табулатуры

Файлы для модификации (примерно):
```
src/rendering/glyphs/TabNumberGlyph.ts
src/rendering/glyphs/NoteNumberGlyph.ts
```

### 3. Модифицировать рендеринг

```typescript
// src/rendering/glyphs/TabNumberGlyph.ts

export class TabNumberGlyph extends Glyph {
  // ...
  
  public paint(cx: number, cy: number, canvas: ICanvas): void {
    // ОРИГИНАЛЬНЫЙ КОД:
    // canvas.fillText(this._noteValue.toString(), cx, cy);
    
    // МОДИФИЦИРОВАННЫЙ КОД:
    const displayValue = this.getDisplayValue();
    canvas.fillText(displayValue, cx, cy);
  }
  
  private getDisplayValue(): string {
    // Если включена настройка - показываем название ноты
    if (this.renderer.settings.notation.showNoteNames) {
      return this.midiToNoteName(this._note.realValue);
    }
    // Иначе - стандартный номер лада
    return this._noteValue.toString();
  }
  
  private midiToNoteName(midi: number): string {
    const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return names[midi % 12];
  }
}
```

### 4. Добавить настройку

```typescript
// src/NotationSettings.ts

export class NotationSettings {
  // ... existing settings
  
  /**
   * Whether to display note names (A, B, C...) instead of fret numbers on tablature
   */
  public showNoteNames: boolean = false;
}
```

### 5. Собрать модифицированную версию

```bash
npm install
npm run build
```

### 6. Использовать в проекте

#### Option A: Локальная ссылка
```bash
cd your-project
npm link ../alphaTab
```

#### Option B: Опубликовать в NPM под своим scope
```bash
npm publish --access public
```

```json
// package.json вашего проекта
{
  "dependencies": {
    "@yourname/alphatab": "^1.3.0-custom"
  }
}
```

#### Option C: Git dependency
```json
{
  "dependencies": {
    "@coderline/alphatab": "git+https://github.com/yourname/alphaTab.git#feature/note-names-display"
  }
}
```

## Поддержка форка

### Плюсы ✅
- Полный контроль над рендерингом
- Нативная интеграция функции
- Лучшая производительность

### Минусы ❌
- Нужно поддерживать форк
- Сложно обновляться до новых версий
- Нужно перебилдить при изменениях
- TypeScript типы могут конфликтовать

### Стратегия обновлений

```bash
# Регулярно синхронизируем с upstream
git remote add upstream https://github.com/CoderLine/alphaTab.git
git fetch upstream
git merge upstream/master

# Решаем конфликты
# Пересобираем
npm run build
```

## Альтернатива: Patch Package

Вместо форка можно использовать `patch-package`:

```bash
npm install patch-package --save-dev
```

```json
// package.json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

1. Модифицируете `node_modules/@coderline/alphatab/dist/...`
2. Создаете патч:
```bash
npx patch-package @coderline/alphatab
```
3. Патч автоматически применяется при `npm install`

Файл: `patches/@coderline+alphatab+1.3.0.patch`

## Рекомендация

**Для вашего случая НЕ нужен форк!**

Текущее решение (CSS Overlay + includeNoteBounds) оптимально:
- ✅ Работает с официальной версией
- ✅ Легко обновляться
- ✅ NoteBounds дает точные координаты
- ✅ CSS overlay гибче (можно стилизовать)

Форк нужен только если:
- Нужно менять формат экспорта (PDF, MIDI)
- Требуются изменения в parser (GP, MusicXML)
- Нужны новые нотные символы

