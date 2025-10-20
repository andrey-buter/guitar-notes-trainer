# API Reference

Полная документация по API Guitar Pro Clone.

## Сервисы

### SettingsService

Управление настройками приложения.

#### Методы

##### `getSettings(): Observable<AppSettings>`

Возвращает Observable с текущими настройками. Подписчики получают обновления при каждом изменении настроек.

**Возвращает:** `Observable<AppSettings>`

**Пример:**

```typescript
this.settingsService.getSettings().subscribe(settings => {
  console.log('Текущие настройки:', settings);
});
```

---

##### `getCurrentSettings(): AppSettings`

Возвращает текущие настройки как значение (не Observable).

**Возвращает:** `AppSettings`

**Пример:**

```typescript
const settings = this.settingsService.getCurrentSettings();
console.log('Масштаб:', settings.display.zoom);
```

---

##### `updateSettings(settings: Partial<AppSettings>): void`

Обновляет настройки. Принимает частичный объект настроек - обновляются только переданные поля.

**Параметры:**
- `settings`: `Partial<AppSettings>` - объект с настройками для обновления

**Пример:**

```typescript
// Обновить только масштаб
this.settingsService.updateSettings({
  display: {
    zoom: 1.5
  }
});

// Обновить несколько настроек
this.settingsService.updateSettings({
  display: {
    zoom: 1.5,
    showNoteNames: true
  },
  playback: {
    speed: 75
  }
});
```

---

##### `toggleNoteNames(): void`

Переключает режим отображения названий нот (включить/выключить).

**Пример:**

```typescript
this.settingsService.toggleNoteNames();
```

---

##### `resetToDefaults(): void`

Сбрасывает все настройки к значениям по умолчанию.

**Пример:**

```typescript
this.settingsService.resetToDefaults();
```

---

### AlphaTabService

Управление AlphaTab API и рендерингом табулатур.

#### Свойства

##### `ready$: Observable<boolean>`

Observable, который эмитит `true` когда AlphaTab готов к использованию.

**Пример:**

```typescript
this.alphaTabService.ready$.subscribe(() => {
  console.log('AlphaTab готов');
  // Можно выполнять операции с API
});
```

---

#### Методы

##### `initialize(element: HTMLElement, initialFile?: string): AlphaTabApi`

Инициализирует AlphaTab API в указанном HTML элементе.

**Параметры:**
- `element`: `HTMLElement` - DOM элемент для рендеринга
- `initialFile`: `string` (опционально) - URL файла для загрузки

**Возвращает:** `AlphaTabApi`

**Пример:**

```typescript
@ViewChild('alphaTab') alphaTabElement!: ElementRef<HTMLDivElement>;

ngAfterViewInit(): void {
  this.alphaTabService.initialize(
    this.alphaTabElement.nativeElement,
    'https://example.com/song.gp5'
  );
}
```

---

##### `getApi(): AlphaTabApi | null`

Возвращает текущий экземпляр AlphaTab API или `null`, если API не инициализирован.

**Возвращает:** `AlphaTabApi | null`

**Пример:**

```typescript
const api = this.alphaTabService.getApi();
if (api) {
  console.log('Текущая композиция:', api.score?.title);
}
```

---

##### `playPause(): void`

Переключает воспроизведение (play/pause).

**Пример:**

```typescript
playPauseClicked(): void {
  this.alphaTabService.playPause();
}
```

---

##### `stop(): void`

Останавливает воспроизведение.

**Пример:**

```typescript
stopClicked(): void {
  this.alphaTabService.stop();
}
```

---

##### `loadFile(file: File): void`

Загружает файл Guitar Pro из объекта File.

**Параметры:**
- `file`: `File` - файл для загрузки

**Пример:**

```typescript
onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    this.alphaTabService.loadFile(input.files[0]);
  }
}
```

---

##### `loadFromUrl(url: string): void`

Загружает файл Guitar Pro по URL.

**Параметры:**
- `url`: `string` - URL файла

**Пример:**

```typescript
loadSong(songUrl: string): void {
  this.alphaTabService.loadFromUrl(songUrl);
}
```

---

##### `destroy(): void`

Уничтожает экземпляр AlphaTab API и освобождает ресурсы.

**Пример:**

```typescript
ngOnDestroy(): void {
  this.alphaTabService.destroy();
}
```

---

## Модели данных

### AppSettings

Корневой интерфейс для всех настроек приложения.

```typescript
interface AppSettings {
  display: DisplaySettings;
  playback: PlaybackSettings;
  notation: NotationSettings;
}
```

---

### DisplaySettings

Настройки отображения интерфейса.

```typescript
interface DisplaySettings {
  /** Показывать названия нот вместо номеров ладов */
  showNoteNames: boolean;
  
  /** Тема оформления */
  theme: 'light' | 'dark';
  
  /** Масштаб отображения (0.5 - 2.0) */
  zoom: number;
}
```

**Значения по умолчанию:**

```typescript
{
  showNoteNames: false,
  theme: 'light',
  zoom: 1.0
}
```

---

### PlaybackSettings

Настройки воспроизведения.

```typescript
interface PlaybackSettings {
  /** Скорость воспроизведения в процентах (25 - 200) */
  speed: number;
  
  /** Включен ли метроном */
  metronomeEnabled: boolean;
  
  /** Включен ли счёт перед началом */
  countInEnabled: boolean;
}
```

**Значения по умолчанию:**

```typescript
{
  speed: 100,
  metronomeEnabled: false,
  countInEnabled: false
}
```

---

### NotationSettings

Настройки нотации и отображения музыкальных элементов.

```typescript
interface NotationSettings {
  /** Показывать стандартную нотацию */
  showStandardNotation: boolean;
  
  /** Показывать табулатуру */
  showTablature: boolean;
  
  /** Система обозначения нот */
  noteNameFormat: 'english' | 'german' | 'solfege';
}
```

**Значения по умолчанию:**

```typescript
{
  showStandardNotation: true,
  showTablature: true,
  noteNameFormat: 'english'
}
```

**Форматы нот:**

- `'english'`: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
- `'german'`: C, C#, D, D#, E, F, F#, G, G#, A, B, H
- `'solfege'`: Do, Do#, Re, Re#, Mi, Fa, Fa#, Sol, Sol#, La, La#, Si

---

## Конфигурация

### DEFAULT_ALPHATAB_CONFIG

Конфигурация AlphaTab по умолчанию.

```typescript
const DEFAULT_ALPHATAB_CONFIG: Partial<alphaTab.Settings>
```

**Структура:**

```typescript
{
  core: {
    fontDirectory: '/font/',
    useWorkers: true
  },
  display: {
    scale: 1.0,
    stretchForce: 0.8,
    layoutMode: LayoutMode.Page,
    staveProfile: StaveProfile.Default
  },
  notation: {
    notationMode: NotationMode.GuitarPro,
    elements: { /* ... */ }
  },
  player: {
    enablePlayer: true,
    enableCursor: true,
    enableUserInteraction: true,
    soundFont: '/soundfont/sonivox.sf2',
    enableAnimatedBeatCursor: true
  }
}
```

---

### ALPHATAB_PRESETS

Предустановленные конфигурации для различных сценариев.

```typescript
const ALPHATAB_PRESETS: {
  minimal: Partial<alphaTab.Settings>;
  print: Partial<alphaTab.Settings>;
  performance: Partial<alphaTab.Settings>;
  beginner: Partial<alphaTab.Settings>;
}
```

**Пресеты:**

- `minimal` - минималистичный режим, только табулатура
- `print` - режим для печати, все элементы
- `performance` - режим производительности, отключены визуальные эффекты
- `beginner` - упрощённое отображение для начинающих

**Пример использования:**

```typescript
import { AlphaTabConfigHelper } from './config/alphatab.config';

const config = AlphaTabConfigHelper.getPreset('beginner');
```

---

### MUSIC_CONSTANTS

Музыкальные константы и ограничения.

```typescript
const MUSIC_CONSTANTS = {
  // Настройки струн (MIDI ноты)
  STANDARD_TUNING: [64, 59, 55, 50, 45, 40],
  DROP_D_TUNING: [64, 59, 55, 50, 45, 38],
  HALF_STEP_DOWN: [63, 58, 54, 49, 44, 39],
  WHOLE_STEP_DOWN: [62, 57, 53, 48, 43, 38],
  
  // Названия нот
  NOTE_NAMES: {
    english: string[],
    german: string[],
    solfege: string[],
    englishFlat: string[],
    germanFlat: string[],
    solfegeFlat: string[]
  },
  
  // Ограничения
  MIN_FRET: 0,
  MAX_FRET: 24,
  MIN_STRING: 0,
  MAX_STRING: 5,
  MIN_SPEED: 0.25,
  MAX_SPEED: 2.0,
  DEFAULT_SPEED: 1.0,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 2.0,
  DEFAULT_ZOOM: 1.0
}
```

---

### AlphaTabConfigHelper

Вспомогательный класс для работы с конфигурацией.

#### Статические методы

##### `getPreset(presetName: string): Partial<alphaTab.Settings>`

Получить конфигурацию по имени пресета.

**Параметры:**
- `presetName`: `'minimal' | 'print' | 'performance' | 'beginner'`

**Возвращает:** `Partial<alphaTab.Settings>`

**Пример:**

```typescript
const config = AlphaTabConfigHelper.getPreset('beginner');
```

---

##### `mergeConfigs(base, override): Partial<alphaTab.Settings>`

Объединить две конфигурации.

**Параметры:**
- `base`: `Partial<alphaTab.Settings>` - базовая конфигурация
- `override`: `Partial<alphaTab.Settings>` - переопределяющая конфигурация

**Возвращает:** `Partial<alphaTab.Settings>`

**Пример:**

```typescript
const baseConfig = AlphaTabConfigHelper.getPreset('minimal');
const customConfig = {
  display: { scale: 1.5 }
};
const merged = AlphaTabConfigHelper.mergeConfigs(baseConfig, customConfig);
```

---

##### `createConfigFromSettings(baseConfig, userSettings)`

Создать конфигурацию на основе пользовательских настроек.

**Параметры:**
- `baseConfig`: `Partial<alphaTab.Settings>` - базовая конфигурация
- `userSettings`: объект с пользовательскими настройками

**Возвращает:** `Partial<alphaTab.Settings>`

---

##### `validateZoom(zoom: number): number`

Проверить и нормализовать значение масштаба.

**Параметры:**
- `zoom`: `number` - значение масштаба

**Возвращает:** `number` - валидное значение (0.5 - 2.0)

**Пример:**

```typescript
const validZoom = AlphaTabConfigHelper.validateZoom(3.0); // Вернёт 2.0
```

---

##### `validateSpeed(speed: number): number`

Проверить и нормализовать значение скорости.

**Параметры:**
- `speed`: `number` - значение скорости

**Возвращает:** `number` - валидное значение (0.25 - 2.0)

**Пример:**

```typescript
const validSpeed = AlphaTabConfigHelper.validateSpeed(0.1); // Вернёт 0.25
```

---

## Компоненты

### AppComponent

Главный компонент приложения.

#### Свойства

- `title`: `string` - заголовок приложения

#### Методы

##### `openSettings(): void`

Открывает панель настроек.

---

### PlayerControlsComponent

Компонент управления воспроизведением.

#### Входные параметры

- `onOpenSettings`: `() => void` - callback для открытия настроек

#### Свойства

- `isPlaying`: `boolean` - состояние воспроизведения

#### Методы

##### `playPause(): void`

Переключает воспроизведение.

##### `stop(): void`

Останавливает воспроизведение.

##### `loadFile(event: Event): void`

Загружает выбранный файл.

##### `openSettings(): void`

Вызывает callback для открытия настроек.

---

### SettingsPanelComponent

Компонент панели настроек.

#### Свойства

- `settings`: `AppSettings` - текущие настройки
- `isOpen`: `boolean` - состояние видимости панели

#### Методы

##### `togglePanel(): void`

Переключает видимость панели.

##### `close(): void`

Закрывает панель.

##### `updateDisplaySettings(): void`

Сохраняет изменения настроек отображения.

##### `updatePlaybackSettings(): void`

Сохраняет изменения настроек воспроизведения.

##### `updateNotationSettings(): void`

Сохраняет изменения настроек нотации.

##### `toggleNoteNames(): void`

Переключает режим отображения названий нот.

##### `resetSettings(): void`

Сбрасывает все настройки (с подтверждением).

---

## События и хуки жизненного цикла

### AlphaTab API события

При работе с `AlphaTabService.getApi()` доступны следующие события:

```typescript
const api = this.alphaTabService.getApi();

if (api) {
  // Начало рендеринга
  api.renderStarted.on(() => {
    console.log('Рендеринг начался');
  });

  // Окончание рендеринга
  api.renderFinished.on(() => {
    console.log('Рендеринг завершён');
  });

  // Плеер готов
  api.playerReady.on(() => {
    console.log('Плеер готов');
  });

  // Изменение состояния плеера
  api.playerStateChanged.on((e) => {
    console.log('Состояние плеера:', e.state);
  });

  // Изменение позиции воспроизведения
  api.playerPositionChanged.on((e) => {
    console.log('Позиция:', e.currentTime, 'из', e.endTime);
  });

  // Окончание воспроизведения
  api.playerFinished.on(() => {
    console.log('Воспроизведение завершено');
  });
}
```

---

## Примеры использования

### Создание кастомного плеера

```typescript
import { Component, OnInit } from '@angular/core';
import { AlphaTabService } from './services/alphatab.service';

@Component({
  selector: 'app-custom-player',
  template: `
    <div>
      <button (click)="play()">Play</button>
      <button (click)="pause()">Pause</button>
      <button (click)="stop()">Stop</button>
      <div>{{ currentTime }} / {{ duration }}</div>
    </div>
  `
})
export class CustomPlayerComponent implements OnInit {
  currentTime = 0;
  duration = 0;

  constructor(private alphaTabService: AlphaTabService) {}

  ngOnInit(): void {
    const api = this.alphaTabService.getApi();
    
    if (api) {
      api.playerPositionChanged.on((e) => {
        this.currentTime = e.currentTime;
        this.duration = e.endTime;
      });
    }
  }

  play(): void {
    const api = this.alphaTabService.getApi();
    if (api && !api.isPlaying) {
      this.alphaTabService.playPause();
    }
  }

  pause(): void {
    const api = this.alphaTabService.getApi();
    if (api && api.isPlaying) {
      this.alphaTabService.playPause();
    }
  }

  stop(): void {
    this.alphaTabService.stop();
  }
}
```

### Создание списка треков

```typescript
import { Component, OnInit } from '@angular/core';
import { AlphaTabService } from './services/alphatab.service';

@Component({
  selector: 'app-track-list',
  template: `
    <ul>
      <li *ngFor="let track of tracks" (click)="selectTrack(track)">
        {{ track.name }}
      </li>
    </ul>
  `
})
export class TrackListComponent implements OnInit {
  tracks: any[] = [];

  constructor(private alphaTabService: AlphaTabService) {}

  ngOnInit(): void {
    this.alphaTabService.ready$.subscribe(() => {
      const api = this.alphaTabService.getApi();
      
      if (api && api.score) {
        this.tracks = api.score.tracks;
      }
    });
  }

  selectTrack(track: any): void {
    const api = this.alphaTabService.getApi();
    if (api) {
      api.renderTracks([track]);
    }
  }
}
```

---

## TypeScript типы

Все основные типы экспортируются и могут быть импортированы:

```typescript
import { 
  AppSettings, 
  DisplaySettings, 
  PlaybackSettings, 
  NotationSettings,
  DEFAULT_SETTINGS 
} from './models/settings.model';

import { 
  DEFAULT_ALPHATAB_CONFIG,
  ALPHATAB_PRESETS,
  MUSIC_CONSTANTS,
  AlphaTabConfigHelper
} from './config/alphatab.config';
```

---

## Версионирование

Проект следует семантическому версионированию (SemVer):

- **MAJOR** - несовместимые изменения API
- **MINOR** - добавление функционала с обратной совместимостью
- **PATCH** - исправления ошибок

Текущая версия: **1.0.0**

