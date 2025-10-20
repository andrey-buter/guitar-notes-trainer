# Лог по работе с переводами

## Дата: 12 октября 2025 г.

### Проблема
При запуске приложения в браузере отображались **ключи переводов** вместо текстов (например, "APP.TITLE", "TABS.DEFAULT", "SCALE_DEGREES.NOTES" и т.д.).

### Причина
В файле `src/app/app.config.ts` не был настроен **HTTP-загрузчик** для модуля `@ngx-translate/core`. Конфигурация TranslateModule была минимальной и не указывала, откуда загружать файлы переводов.

---

## Выполненные действия

### 1. Установка зависимостей (ранее выполнено)
```bash
npm install @ngx-translate/core @ngx-translate/http-loader --save
```

### 2. Исправление конфигурации `app.config.ts`

**Исходная конфигурация:**
```typescript
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'en'
      })
    )
  ]
};
```

**Исправленная конфигурация:**
```typescript
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import { routes } from './app.routes';

// Пользовательский загрузчик переводов
export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string): Observable<any> {
    return this.http.get(`./assets/i18n/${lang}.json`);
  }
}

// Фабрика для создания CustomTranslateLoader
export function HttpLoaderFactory(http: HttpClient) {
  return new CustomTranslateLoader(http);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    )
  ]
};
```

**Изменения:**
- Добавлен импорт `TranslateLoader` из `@ngx-translate/core`
- Добавлен импорт `Observable` и `of` из `rxjs` (для реализации загрузчика)
- Создан пользовательский класс `CustomTranslateLoader`, реализующий интерфейс `TranslateLoader`
- Метод `getTranslation()` загружает файлы переводов из `./assets/i18n/${lang}.json`
- Создана фабрика `HttpLoaderFactory`, которая создаёт экземпляр `CustomTranslateLoader`
- В конфигурацию `TranslateModule.forRoot()` добавлен параметр `loader` с настройкой фабрики

**Примечание:** Изначально была попытка использовать `TranslateHttpLoader` из пакета `@ngx-translate/http-loader`, но возникла ошибка компиляции TypeScript, так как этот класс не принимает аргументы в текущей версии. Поэтому был создан пользовательский загрузчик.

---

### 3. Проверка файлов переводов

Убедились, что файлы переводов существуют и имеют корректную структуру:

#### `src/assets/i18n/en.json`
```json
{
  "APP": {
    "TITLE": "Guitar Pro Clone"
  },
  "TABS": {
    "DEFAULT": "Default",
    "NOTE_NAMES": "Note Names",
    "NOTE_NAMES_OCTAVE": "Note Names+Octave",
    "FRETBOARD_DEGREES": "Fretboard Degrees"
  },
  "HEADER": {
    "KEY": "KEY:",
    "TUNING": "TUNING:",
    "SCALE_DEGREES": "SCALE DEGREES"
  },
  "SCALE_DEGREES": {
    "NOTES": "Notes",
    "RUSSIAN": "RU",
    "TONIC": "Tonic",
    "SUPERTONIC": "Supertonic",
    "MEDIANT": "Mediant",
    "SUBDOMINANT": "Subdominant",
    "DOMINANT": "Dominant",
    "SUBMEDIANT": "Submediant",
    "LEADING_TONE": "Leading tone",
    "TONE": "Tone",
    "SEMITONE": "Semitone"
  },
  // ... остальные разделы
}
```

#### `src/assets/i18n/ru.json`
```json
{
  "APP": {
    "TITLE": "Guitar Pro Clone"
  },
  "TABS": {
    "DEFAULT": "Стандарт",
    "NOTE_NAMES": "Ноты",
    "NOTE_NAMES_OCTAVE": "Ноты+Октава",
    "FRETBOARD_DEGREES": "Ступени"
  },
  "HEADER": {
    "KEY": "ТОНАЛЬНОСТЬ:",
    "TUNING": "СТРОЙ:",
    "SCALE_DEGREES": "СТУПЕНИ ЛАДА"
  },
  "SCALE_DEGREES": {
    "NOTES": "Ноты",
    "RUSSIAN": "RU",
    "TONIC": "Тоника",
    "SUPERTONIC": "Супертоника",
    "MEDIANT": "Медианта",
    "SUBDOMINANT": "Субдоминанта",
    "DOMINANT": "Доминанта",
    "SUBMEDIANT": "Субмедианта",
    "LEADING_TONE": "Вводный тон",
    "TONE": "Тон",
    "SEMITONE": "Полутон"
  },
  // ... остальные разделы
}
```

---

### 4. Добавление перевода для чекбокса "RU"

Обнаружено, что в таблице "Ступени лада" чекбокс с текстом "RU" был жёстко закодирован:

```html
<span>RU</span>
```

**Исправление:**
```html
<span>{{ 'SCALE_DEGREES.RUSSIAN' | translate }}</span>
```

**Добавлены ключи в файлы переводов:**
- `en.json`: `"RUSSIAN": "RU"`
- `ru.json`: `"RUSSIAN": "RU"`

---

### 5. Проверка отображения переводов в браузере

После внесения изменений:
1. Перезагружена страница (`http://localhost:4200`)
2. **Результат:**
   - Все ключи переводов (APP.TITLE, TABS.DEFAULT и т.д.) заменились на соответствующие тексты
   - По умолчанию интерфейс отображается на **английском языке** (как указано в `defaultLanguage: 'en'`)
   - Переводы для всех элементов интерфейса корректно применяются

---

### 6. Проверка работы переключателя языка

#### Переключение на русский:
- Нажата кнопка "RU" в header
- **Результат:** Интерфейс переключился на русский язык:
  - Заголовок приложения: "Guitar Pro Clone" (остался без изменений, так как одинаковый в обоих языках)
  - Табы: "Стандарт", "Ноты", "Ноты+Октава", "Ступени"
  - Заголовок таблицы: "СТУПЕНИ ЛАДА"
  - Ключ: "ТОНАЛЬНОСТЬ:"
  - Строй: "СТРОЙ:"
  - Кнопки в плеере: "Проиграть", "Стоп", "Настройки"

#### Переключение обратно на английский:
- Нажата кнопка "EN" в header
- **Результат:** Интерфейс переключился на английский язык:
  - Табы: "Default", "Note Names", "Note Names+Octave", "Fretboard Degrees"
  - Заголовок таблицы: "SCALE DEGREES"
  - Ключ: "KEY:"
  - Строй: "TUNING:"
  - Кнопки в плеере: "Play", "Stop", "Settings"

---

### 7. Проверка локального переключателя "RU" в таблице ступеней

#### Логика работы:
- По умолчанию в таблице "Ступени лада" отображаются **английские** названия ступеней и интервалов:
  - Ступени: Tonic, Supertonic, Mediant, Subdominant, Dominant, Submediant, Leading tone
  - Интервалы: Tone, Semitone

- При включении чекбокса "RU" в таблице отображаются **русские** названия:
  - Ступени: Тоника, Супертоника, Медианта, Субдоминанта, Доминанта, Субмедианта, Вводный тон
  - Интервалы: Тон, Полутон

#### Проверка:
- Чекбокс "RU" включён → в таблице отображаются русские названия ступеней и интервалов ✅
- Глобальный переключатель языка (EN/RU) работает независимо от локального чекбокса ✅

---

## Найденные и исправленные места с ключами вместо текстов

### Места, где использовались ключи переводов:

1. **Заголовок приложения (`app.component.html`):**
   - `<h1>{{ 'APP.TITLE' | translate }}</h1>` ✅

2. **Кнопки выбора режима замены нот (`app.component.html`):**
   - `<button>{{ 'TABS.DEFAULT' | translate }}</button>` ✅
   - `<button>{{ 'TABS.NOTE_NAMES' | translate }}</button>` ✅
   - `<button>{{ 'TABS.NOTE_NAMES_OCTAVE' | translate }}</button>` ✅
   - `<button>{{ 'TABS.FRETBOARD_DEGREES' | translate }}</button>` ✅

3. **Информация о тональности и строе (`app.component.html`):**
   - `<strong>{{ 'HEADER.KEY' | translate }}</strong>` ✅
   - `<strong>{{ 'HEADER.TUNING' | translate }}</strong>` ✅

4. **Заголовок таблицы ступеней лада (`app.component.html`):**
   - `<span class="table-title">{{ 'HEADER.SCALE_DEGREES' | translate }}</span>` ✅

5. **Чекбокс "Ноты" в таблице ступеней (`app.component.html`):**
   - `<span>{{ 'SCALE_DEGREES.NOTES' | translate }}</span>` ✅

6. **Чекбокс "RU" в таблице ступеней (`app.component.html`):**
   - `<span>{{ 'SCALE_DEGREES.RUSSIAN' | translate }}</span>` ✅
   - **Ранее:** `<span>RU</span>` (жёстко закодировано) ❌
   - **Исправлено:** `<span>{{ 'SCALE_DEGREES.RUSSIAN' | translate }}</span>` ✅

7. **Кнопки управления плеером (`player-controls.component.html`):**
   - `<button>{{ 'PLAYER.PLAY' | translate }}</button>` ✅
   - `<button>{{ 'PLAYER.STOP' | translate }}</button>` ✅
   - `<button>{{ 'PLAYER.SETTINGS' | translate }}</button>` ✅
   - `<span>{{ 'PLAYER.LOAD_FILE' | translate }}</span>` ✅

8. **Панель настроек (`settings-panel.component.html`):**
   - Все заголовки, метки и опции используют ключи переводов ✅

---

## Проверка отсутствия вывода ключей вместо текстов

### Проверенные разделы:

1. **Header (шапка приложения):**
   - Заголовок: "Guitar Pro Clone" ✅
   - Кнопка смены языка EN/RU: работает корректно ✅

2. **Табы выбора режима отображения:**
   - "Default", "Note Names", "Note Names+Octave", "Fretboard Degrees" (EN) ✅
   - "Стандарт", "Ноты", "Ноты+Октава", "Ступени" (RU) ✅

3. **Информация о произведении:**
   - "KEY:" / "ТОНАЛЬНОСТЬ:" ✅
   - "TUNING:" / "СТРОЙ:" ✅

4. **Таблица "Ступени лада":**
   - Заголовок: "SCALE DEGREES" / "СТУПЕНИ ЛАДА" ✅
   - Чекбокс "Notes" / "Ноты" ✅
   - Чекбокс "RU" (одинаков в обоих языках) ✅
   - Названия ступеней: переключаются при включении/выключении чекбокса "RU" ✅
   - Интервалы: переключаются при включении/выключении чекбокса "RU" ✅

5. **Панель управления плеером:**
   - Кнопки "Play" / "Проиграть", "Stop" / "Стоп", "Settings" / "Настройки" ✅
   - "Load file" / "Загрузить файл" ✅

6. **Панель настроек:**
   - Все разделы (Display, Notation, Playback) используют переводы ✅
   - Все опции и метки переводятся корректно ✅

---

## Итоговый результат

### ✅ Успешно выполнено:

1. **Исправлена конфигурация TranslateModule** в `app.config.ts`
   - Создан пользовательский загрузчик `CustomTranslateLoader`
   - Настроена фабрика `HttpLoaderFactory`
   - Переводы загружаются из `./assets/i18n/${lang}.json`

2. **Проверено отображение переводов во всех разделах:**
   - Header ✅
   - Табы выбора режима ✅
   - Информация о произведении ✅
   - Таблица ступеней лада ✅
   - Панель управления плеером ✅
   - Панель настроек ✅

3. **Исправлена работа переключателя языка:**
   - Глобальный переключатель EN/RU работает корректно ✅
   - Изменяет язык во всех разделах интерфейса ✅
   - Работает с таблицей "HEADER.SCALE_DEGREES" ✅

4. **Удалён жёстко закодированный текст "RU":**
   - Заменён на `{{ 'SCALE_DEGREES.RUSSIAN' | translate }}` ✅
   - Добавлены соответствующие ключи в файлы переводов ✅

5. **Обеспечена корректная работа локального переключателя "RU" в таблице:**
   - При включении чекбокса "RU" отображаются русские названия ступеней и интервалов ✅
   - Работает независимо от глобального переключателя языка ✅

---

## Технические детали

### Структура файлов переводов:

```
src/
└── assets/
    └── i18n/
        ├── en.json  (английские переводы)
        └── ru.json  (русские переводы)
```

### Используемые технологии:

- **@ngx-translate/core** v15.x - библиотека для интернационализации Angular-приложений
- **@ngx-translate/http-loader** v8.x - HTTP-загрузчик для ngx-translate (не использован в итоговой реализации из-за ошибок компиляции)
- **Пользовательский загрузчик** `CustomTranslateLoader` - реализация интерфейса `TranslateLoader` для загрузки файлов переводов через `HttpClient`

### Используемые пайпы Angular:

- `{{ 'KEY' | translate }}` - пайп для вывода переведённого текста по ключу

---

## Заключение

Все ключи переводов успешно заменены на соответствующие тексты. Переводы корректно применяются во всех разделах приложения. Глобальный переключатель языка (EN/RU) работает корректно и изменяет язык во всех элементах интерфейса, включая таблицу "SCALE DEGREES". Локальный переключатель "RU" в таблице ступеней лада также работает корректно и независимо от глобального переключателя.

**Проблема решена полностью.** ✅

