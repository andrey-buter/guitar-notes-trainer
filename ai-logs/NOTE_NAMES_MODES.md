# Режимы отображения названий нот

## Обзор

Приложение поддерживает два режима отображения названий нот (A, B, C, D, E, F, G) вместо номеров ладов на табулатуре:

### 1. **Overlay Mode** (По умолчанию) ✅ Рекомендуется

**Как работает:**
- Создается прозрачный HTML overlay поверх AlphaTab canvas
- Использует `includeNoteBounds` API для получения точных координат нот
- Названия нот накладываются поверх цифр с белым контуром
- Цифры становятся полупрозрачными (opacity: 0.15)

**Преимущества:**
- ✅ **Точное позиционирование** - координаты берутся из bounds API
- ✅ **Гибкая стилизация** - можно менять цвет, шрифт, размер
- ✅ **Надежность** - не зависит от внутренней структуры AlphaTab
- ✅ **Производительность** - overlay создается один раз

**Недостатки:**
- ⚠️ Цифры все еще видны под буквами (полупрозрачные)

**Технические детали:**
```typescript
// Координаты из NoteBounds API
const noteBounds = beatBounds.notes.find(nb => nb.note === note);
const x = noteBounds.noteHeadBounds.x + w / 2;
const y = noteBounds.noteHeadBounds.y + h / 2;

// Создание overlay элемента
const noteLabel = document.createElement('div');
noteLabel.style.left = `${x}px`;
noteLabel.style.top = `${y}px`;
noteLabel.textContent = noteName; // "A", "B", "C#", etc.
```

---

### 2. **Replace Mode** (Экспериментальный) ⚠️

**Как работает:**
- Пытается скрыть цифры через CSS `visibility: hidden`
- Использует тот же overlay, но с полным скрытием цифр
- Эффективно = Overlay + visibility: hidden для цифр

**Преимущества:**
- ✅ Цифры полностью скрыты
- ✅ Чистый вид - только названия нот

**Недостатки:**
- ❌ **Ограничено canvas рендерингом** - AlphaTab рендерит в canvas, не HTML
- ⚠️ CSS селекторы `.at-tab-number` могут не работать
- ⚠️ Невозможно истинно "заменить" цифры на canvas

**Почему ограничено:**
AlphaTab рендерит табулатуру в `<canvas>`, а не в HTML элементы:
```
<canvas class="at-surface">
  <!-- Все цифры нарисованы пикселями, не DOM элементами -->
</canvas>
```

Поэтому CSS замена через `::before` и `content` не работает.

**Текущая реализация:**
```css
/* Пытаемся скрыть, но это не работает для canvas */
.note-names-replace .at-tab-number {
  visibility: hidden !important;
}
```

---

## Сравнение режимов

| Характеристика | Overlay Mode | Replace Mode |
|----------------|--------------|--------------|
| **Точность** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Чистота вида** | ⭐⭐⭐ (цифры видны) | ⭐⭐⭐ (цифры видны) |
| **Надежность** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Производительность** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Стилизация** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Canvas ограничения** | Нет | Да |

---

## Как использовать

### В UI:

1. Откройте **Настройки** (⚙️)
2. Включите **"Показывать названия нот вместо номеров ладов"**
3. Выберите **Режим отображения**:
   - **Overlay** - буквы поверх цифр (рекомендуется)
   - **Replace** - заменить цифры (экспериментально)

### Programmatic API:

```typescript
// Включить overlay mode
settingsService.updateSettings({
  display: {
    showNoteNames: true,
    noteNamesMode: 'overlay'
  }
});

// Включить replace mode
settingsService.updateSettings({
  display: {
    showNoteNames: true,
    noteNamesMode: 'replace'
  }
});
```

---

## Технические детали реализации

### Overlay Mode

```typescript
// 1. Получаем bounds нот
const boundsLookup = api.renderer.boundsLookup;
const beatBounds = boundsLookup.findBeat(beat);
const noteBounds = beatBounds.notes.find(nb => nb.note === note);

// 2. Создаем overlay элементы
const overlay = document.createElement('div');
overlay.id = 'note-names-overlay';

beat.notes.forEach(note => {
  const label = document.createElement('div');
  label.className = 'note-name-label';
  label.textContent = midiToNoteName(note.realValue);
  label.style.left = `${noteX}px`;
  label.style.top = `${noteY}px`;
  overlay.appendChild(label);
});

// 3. Добавляем в DOM
htmlContainer.appendChild(overlay);
```

### Replace Mode

```typescript
// 1. Добавляем CSS класс
htmlContainer.classList.add('note-names-replace');

// 2. CSS пытается скрыть цифры (ограничено для canvas)
.note-names-replace .at-tab-number {
  visibility: hidden !important;
}

// 3. Overlay все равно используется для буквенного отображения
// (canvas нельзя модифицировать через CSS)
```

---

## Альтернативные подходы (не реализованы)

### 1. Canvas Post-Processing

Манипуляция canvas после рендеринга:

```typescript
api.renderFinished.on(() => {
  const canvas = api.canvasElement;
  const ctx = canvas.getContext('2d');
  
  // Закрашиваем цифры белым
  boundsLookup.staffSystems.forEach(system => {
    // ...найти позиции цифр
    ctx.fillStyle = 'white';
    ctx.fillRect(x, y, w, h);
  });
  
  // Рисуем названия нот
  ctx.fillStyle = '#667eea';
  ctx.fillText(noteName, x, y);
});
```

**Проблемы:**
- ❌ Сложно точно найти где цифры
- ❌ Может затронуть другие элементы (линии, ноты)
- ❌ Нарушает другие overlays AlphaTab

### 2. Форк AlphaTab

Модификация исходного кода:

```typescript
// src/rendering/glyphs/TabNumberGlyph.ts
export class TabNumberGlyph extends Glyph {
  public paint(cx: number, cy: number, canvas: ICanvas): void {
    const displayValue = this.settings.showNoteNames 
      ? this.midiToNoteName(this.note.realValue)
      : this.noteValue.toString();
      
    canvas.fillText(displayValue, cx, cy);
  }
}
```

**Проблемы:**
- ❌ Нужно поддерживать форк
- ❌ Сложно обновляться
- ❌ Overkill для простой фичи

---

## Рекомендации

### Для пользователей:
✅ **Используйте Overlay Mode** - надежный и красивый результат

### Для разработчиков:
- ✅ Overlay mode - оптимальное решение
- ⚠️ Replace mode - proof of concept, показывает ограничения
- 💡 Если нужна истинная замена - только через форк AlphaTab

---

## FAQ

**Q: Почему цифры все еще видны в Replace mode?**  
A: AlphaTab рендерит в canvas, CSS не может модифицировать пиксели. Replace mode использует тот же overlay что и Overlay mode.

**Q: Можно ли полностью скрыть цифры?**  
A: Да, но только через:
1. Canvas post-processing (сложно, ненадежно)
2. Форк AlphaTab (требует поддержки)

**Q: Какой режим быстрее?**  
A: Оба одинаково быстрые, overlay создается один раз.

**Q: Можно ли изменить стиль названий нот?**  
A: Да! Редактируйте CSS класс `.note-name-label`:

```css
.note-name-label {
  color: #ff0000;      /* Красный цвет */
  font-size: 16px;     /* Больше размер */
  font-family: Arial;  /* Другой шрифт */
}
```

---

## Итог

| Режим | Рекомендация | Применение |
|-------|--------------|------------|
| **Overlay** | ✅ Рекомендуется | Для всех пользователей |
| **Replace** | ⚠️ Экспериментальный | Демонстрация ограничений canvas |

**Вывод:** Overlay mode - лучшее доступное решение без форка AlphaTab! 🎸

