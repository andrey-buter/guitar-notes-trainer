# AlphaTab Extension Guide

## Способы расширения и кастомизации AlphaTab

### 1. **CSS Overlay (Текущий подход)**

**Преимущества:**
- ✅ Не требует изменения AlphaTab
- ✅ Работает с любой версией
- ✅ Полный контроль над визуальным отображением

**Недостатки:**
- ❌ Требует bounds API (доступен после рендеринга)
- ❌ Не меняет внутреннюю логику

**Реализация:**
```typescript
// Используем renderer.boundsLookup для получения координат
const boundsLookup = api.renderer.boundsLookup;
const beatBounds = boundsLookup.findBeat(beat);
const noteHead = beatBounds.noteHeads.get(note);

// Создаем div поверх
const overlay = document.createElement('div');
overlay.style.left = `${noteHead.x}px`;
overlay.style.top = `${noteHead.y}px`;
```

---

### 2. **Custom Renderer (Наследование)**

AlphaTab поддерживает создание кастомных рендереров через наследование.

**Пример структуры:**
```typescript
import { ScoreRenderer } from '@coderline/alphatab';

class CustomScoreRenderer extends ScoreRenderer {
  // Переопределяем методы рендеринга
  protected renderTabNote(note: Note, x: number, y: number): void {
    // Здесь можно изменить логику отображения нот
    const noteName = this.midiToNoteName(note.realValue);
    // Рендерим название вместо цифры
    this.renderText(noteName, x, y);
  }
}

// Использование
const api = new AlphaTabApi(container, {
  core: {
    // Указываем кастомный renderer
    // Требует глубокой интеграции с AlphaTab
  }
});
```

**Проблемы:**
- ❌ ScoreRenderer - внутренний класс, не экспортирован
- ❌ Требует модификации сборки AlphaTab
- ❌ Сложная структура наследования

---

### 3. **Web Worker Modification**

AlphaTab использует Web Worker для рендеринга. Можно модифицировать worker.

**Подход:**
```typescript
const settings = {
  core: {
    useWorkers: false, // Отключаем worker
    // Теперь можно перехватывать рендеринг
  }
};
```

**Проблемы:**
- ❌ Ухудшает производительность
- ❌ Всё равно не дает доступа к рендерингу нот

---

### 4. **Plugin System (Hooks)**

AlphaTab предоставляет события для хуков:

#### Доступные события:
```typescript
api.scoreLoaded.on((score) => {
  // Score загружен, можно модифицировать данные
});

api.renderStarted.on(() => {
  // Рендеринг начался
});

api.renderer.preRender.on((result) => {
  // ДО рендеринга (но данные read-only)
});

api.renderFinished.on((result) => {
  // ПОСЛЕ рендеринга (bounds доступны)
});

api.postRenderFinished.on(() => {
  // Полностью завершен
});
```

#### Текущая реализация:
```typescript
// Подписываемся на renderFinished
api.renderFinished.on(() => {
  this.createNoteNamesOverlay(); // Создаем overlay
});
```

---

### 5. **Canvas/SVG Post-Processing**

После рендеринга можно модифицировать canvas/SVG напрямую.

**Canvas подход:**
```typescript
api.renderFinished.on(() => {
  const canvas = api.canvasElement;
  const ctx = canvas.getContext('2d');
  
  // Получаем bounds нот
  const boundsLookup = api.renderer.boundsLookup;
  
  // Закрашиваем цифры белым
  // Рисуем названия нот
});
```

**Проблемы:**
- ❌ Трудно точно определить где цифры
- ❌ Может нарушить другие элементы
- ✅ Но технически возможно

---

### 6. **Font Substitution**

Заменить шрифт цифр на кастомный с буквами.

**Идея:**
```typescript
// Создать кастомный шрифт где:
// глиф "0" → отображает что-то другое
// глиф "1" → отображает "A"
// и т.д.

const settings = {
  display: {
    resources: {
      fontDirectory: '/custom-fonts/'
    }
  }
};
```

**Проблемы:**
- ❌ Сложно создать такой шрифт
- ❌ Цифры != ноты (цифра 5 на разных струнах = разные ноты)
- ❌ Непрактично

---

## 🎯 Рекомендуемый подход: CSS Overlay + Bounds API

### Почему это лучшее решение:

1. **Не требует форка AlphaTab** - работает как плагин
2. **Полный контроль** - можем стилизовать как угодно
3. **Использует официальное API** - `boundsLookup`
4. **Производительно** - создаем overlay один раз
5. **Легко поддерживать** - не зависит от внутренностей AlphaTab

### Текущая реализация:

```typescript
// 1. Подписываемся на renderFinished
api.renderFinished.on(() => {
  this.createNoteNamesOverlay();
});

// 2. Используем boundsLookup
const beatBounds = boundsLookup.findBeat(beat);
const noteHead = beatBounds.noteHeads.get(note);

// 3. Создаем overlay
const noteLabel = document.createElement('div');
noteLabel.style.left = `${noteHead.x}px`;
noteLabel.style.top = `${noteHead.y}px`;
noteLabel.textContent = noteName;

// 4. CSS скрывает оригинальные цифры
.show-note-names .at-tab-number {
  opacity: 0.1;
}
```

---

## 🚀 Альтернативные решения для будущего

### 1. Форк AlphaTab
Создать форк с модифицированным рендерером табулатуры.

**Плюсы:**
- Полный контроль
- Нативная интеграция

**Минусы:**
- Нужно поддерживать форк
- Сложно обновляться

### 2. Вклад в AlphaTab
Предложить фичу в официальный репозиторий.

```typescript
// Идеальное API в будущем:
const settings = {
  notation: {
    tabNotationMode: 'note-names', // вместо 'fret-numbers'
  }
};
```

**Issue на GitHub:**
```
Feature Request: Tab Notation Mode - Note Names instead of Fret Numbers

Allow displaying note names (A, B, C, etc.) on tablature 
instead of fret numbers (0-24).
```

---

## 📊 Comparison Table

| Подход | Сложность | Производительность | Поддержка | Рекомендация |
|--------|-----------|-------------------|-----------|--------------|
| CSS Overlay | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ **Recommended** |
| Custom Renderer | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | ❌ Too complex |
| Worker Mod | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ❌ Poor performance |
| Canvas Post-process | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⚠️ Possible but risky |
| Font Substitution | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ | ❌ Impractical |
| AlphaTab Fork | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⚠️ Future option |

---

## 🔧 Current Implementation Status

✅ CSS Overlay approach implemented  
✅ Bounds API integration ready  
✅ MIDI to Note name conversion  
✅ Fallback to info panel  
⏳ Waiting for renderFinished event  
⏳ Testing bounds availability  

---

## 📝 Next Steps

1. **Debug bounds availability** - check when boundsLookup is ready
2. **Test overlay creation** - verify coordinates are correct
3. **Add scroll sync** - update overlay on scroll
4. **Add zoom support** - update overlay on zoom change
5. **Optimize performance** - cache bounds, debounce updates

---

## 🐛 Known Issues

1. **BoundsLookup not ready immediately** - need to wait for renderFinished
2. **Overlay positioning** - may need adjustments for scroll/zoom
3. **Memory leaks** - need to cleanup overlay on disable

---

## 📚 Resources

- [AlphaTab Documentation](https://alphatab.net/docs)
- [AlphaTab API Reference](https://alphatab.net/docs/reference/api)
- [BoundsLookup API](https://alphatab.net/docs/reference/api/boundslookup)
- [GitHub Issues](https://github.com/CoderLine/alphaTab/issues)

