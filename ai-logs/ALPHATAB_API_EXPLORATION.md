# Исследование AlphaTab API для замены цифр на названия нот

## Цель

Найти способ заменить номера ладов (0, 1, 2, 3...) на названия нот (C, D, E, F, G, A, B) в табулатуре.

## Текущий статус: 🔬 Исследование

### Что мы пытаемся найти:

1. **Custom Rendering Hooks**
   - `note.pitch.toNoteName()` - метод для получения названия ноты
   - `renderNote` hook - для переопределения рендеринга отдельных нот
   - `preRender` / `postRender` события

2. **Renderer API**
   - Доступ к `api.renderer`
   - Доступ к `api.scoreRenderer`
   - Настройки рендерера

3. **Score Modification**
   - Модификация `score.tracks[].staves[].bars[]`
   - Изменение отображения через свойства нот

## Реализованные проверки:

### В `setupCustomRendering()`:
```typescript
console.log('[AlphaTab] API properties:', Object.keys(this.api));
// Проверяем какие свойства доступны в API

if (apiAny.renderer) {
  console.log('[AlphaTab] Renderer found');
}

if (apiAny.scoreRenderer) {
  console.log('[AlphaTab] ScoreRenderer found');
}
```

### В `tryModifyNoteDisplay()`:
```typescript
// 1. Проверка renderer.settings
if (apiAny.renderer && apiAny.renderer.settings) {
  // Есть ли опции для кастомизации?
}

// 2. Анализ структуры score
score.tracks.forEach((track) => {
  track.staves.forEach((staff) => {
    // Логируем структуру
    // Ищем свойства для модификации
  });
});

// 3. Проверка событий
if (apiAny.preRender) {
  // Можно подписаться на событие перед рендерингом
}
```

## Как тестировать:

1. Откройте приложение http://localhost:4200
2. Откройте консоль браузера (F12)
3. Включите настройку "Показывать названия нот"
4. Смотрите в консоль - будут выведены все доступные свойства и методы API

## Что искать в консоли:

```
[AlphaTab] Setting up custom rendering...
[AlphaTab] API properties: [array of properties]
[AlphaTab] Renderer found: [renderer properties]

[AlphaTab] Trying to modify note display...
[AlphaTab] Score structure: {...}
[AlphaTab] Track 0: {...}
[AlphaTab] Staff 0 tuning: [64, 59, 55, 50, 45, 40]
```

## Возможные решения:

### Вариант 1: Через настройки при инициализации

Если AlphaTab поддерживает hooks в Settings:

```typescript
const config = {
  core: {...},
  display: {...},
  hooks: {
    renderNote: (note: any) => {
      // Вместо note.fret вернуть note.pitch.toNoteName()
      return note.pitch ? note.pitch.toNoteName() : note.fret;
    }
  }
};
```

### Вариант 2: Через модификацию renderer после создания

```typescript
const api = new AlphaTabApi(element, config);
const renderer = (api as any).renderer;

if (renderer && renderer.setNoteTextProvider) {
  renderer.setNoteTextProvider((note: any) => {
    return note.pitch.toNoteName();
  });
}
```

### Вариант 3: Через события рендеринга

```typescript
api.preRender.on(() => {
  // Модифицировать score перед рендерингом
  score.tracks.forEach(track => {
    track.staves.forEach(staff => {
      staff.bars.forEach(bar => {
        bar.voices.forEach(voice => {
          voice.beats.forEach(beat => {
            beat.notes.forEach(note => {
              // Изменить отображение ноты
              note.displayText = note.pitch.toNoteName();
            });
          });
        });
      });
    });
  });
});
```

### Вариант 4: Canvas overlay с координатами нот

Если AlphaTab предоставляет координаты отрендеренных нот:

```typescript
api.renderFinished.on(() => {
  const bounds = api.renderer.getBoundsLookup();
  // Рисуем названия нот поверх canvas
});
```

## Известные ограничения:

1. AlphaTab 1.5.0-alpha может не иметь всех API из более новых версий
2. Canvas рендеринг усложняет модификацию
3. Может потребоваться обновление библиотеки

## Следующие шаги:

1. ✅ Логировать все доступные свойства API
2. ⏳ Найти правильный hook или метод
3. ⏳ Протестировать модификацию
4. ⏳ Документировать рабочее решение

## Ссылки:

- AlphaTab Documentation: https://alphatab.net/docs
- AlphaTab GitHub: https://github.com/CoderLine/alphaTab
- AlphaTab Discussions: https://github.com/CoderLine/alphaTab/discussions

---

**Дата:** 2025-10-11  
**Статус:** В процессе исследования

