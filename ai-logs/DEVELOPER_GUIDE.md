# Руководство разработчика

Это руководство описывает архитектуру приложения и способы её расширения.

## Архитектура приложения

### Слои приложения

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Components: App, PlayerControls,      │
│   SettingsPanel)                        │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         Service Layer                   │
│  (AlphaTabService, SettingsService)     │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         Data Layer                      │
│  (Settings Model, LocalStorage)         │
└─────────────────────────────────────────┘
```

## Основные сервисы

### SettingsService

Управляет всеми настройками приложения с сохранением в LocalStorage.

**Основные методы:**

```typescript
// Получить настройки как Observable
getSettings(): Observable<AppSettings>

// Получить текущие настройки
getCurrentSettings(): AppSettings

// Обновить настройки
updateSettings(settings: Partial<AppSettings>): void

// Специализированные методы
toggleNoteNames(): void
resetToDefaults(): void
```

**Пример использования:**

```typescript
constructor(private settingsService: SettingsService) {
  // Подписка на изменения
  this.settingsService.getSettings().subscribe(settings => {
    console.log('Настройки изменились:', settings);
  });
}

// Обновление одной настройки
updateZoom(newZoom: number): void {
  const current = this.settingsService.getCurrentSettings();
  this.settingsService.updateSettings({
    display: {
      ...current.display,
      zoom: newZoom
    }
  });
}
```

### AlphaTabService

Управляет взаимодействием с AlphaTab API.

**Основные методы:**

```typescript
// Инициализация
initialize(element: HTMLElement, initialFile?: string): AlphaTabApi

// Получить API
getApi(): AlphaTabApi | null

// Управление воспроизведением
playPause(): void
stop(): void

// Загрузка файлов
loadFile(file: File): void
loadFromUrl(url: string): void

// Очистка
destroy(): void
```

**Пример использования:**

```typescript
@ViewChild('alphaTab') alphaTabElement!: ElementRef<HTMLDivElement>;

constructor(private alphaTabService: AlphaTabService) {}

ngAfterViewInit(): void {
  // Инициализация AlphaTab
  this.alphaTabService.initialize(
    this.alphaTabElement.nativeElement,
    'https://example.com/song.gp5'
  );
  
  // Подписка на готовность
  this.alphaTabService.ready$.subscribe(() => {
    console.log('AlphaTab готов');
  });
}

// Загрузка файла
onFileSelected(file: File): void {
  this.alphaTabService.loadFile(file);
}
```

## Модель данных

### AppSettings

Корневой интерфейс для всех настроек:

```typescript
interface AppSettings {
  display: DisplaySettings;
  playback: PlaybackSettings;
  notation: NotationSettings;
}
```

### DisplaySettings

Настройки отображения:

```typescript
interface DisplaySettings {
  showNoteNames: boolean;  // Показывать названия нот
  theme: 'light' | 'dark'; // Тема
  zoom: number;            // Масштаб (0.5 - 2.0)
}
```

### PlaybackSettings

Настройки воспроизведения:

```typescript
interface PlaybackSettings {
  speed: number;              // Скорость (25 - 200%)
  metronomeEnabled: boolean;  // Метроном
  countInEnabled: boolean;    // Счёт перед началом
}
```

### NotationSettings

Настройки нотации:

```typescript
interface NotationSettings {
  showStandardNotation: boolean;    // Стандартная нотация
  showTablature: boolean;           // Табулатура
  noteNameFormat: 'english' | 'german' | 'solfege';  // Формат нот
}
```

## Расширение функционала

### Сценарий 1: Добавление новой настройки отображения

Допустим, вы хотите добавить настройку для отображения аккордов.

**Шаг 1: Обновите модель**

```typescript
// src/app/models/settings.model.ts
export interface DisplaySettings {
  showNoteNames: boolean;
  theme: 'light' | 'dark';
  zoom: number;
  showChords: boolean;  // ← новая настройка
}

export const DEFAULT_SETTINGS: AppSettings = {
  display: {
    showNoteNames: false,
    theme: 'light',
    zoom: 1.0,
    showChords: true  // ← значение по умолчанию
  },
  // ...
};
```

**Шаг 2: Добавьте UI**

```html
<!-- src/app/components/settings-panel/settings-panel.component.html -->
<div class="setting-item">
  <label class="toggle-label">
    <input 
      type="checkbox" 
      [(ngModel)]="settings.display.showChords"
      (change)="updateDisplaySettings()"
    >
    <span class="toggle-slider"></span>
    <span class="setting-label">Показывать аккорды</span>
  </label>
</div>
```

**Шаг 3: Примените настройку**

```typescript
// src/app/services/alphatab.service.ts
private applySettings(): void {
  const settings = this.settingsService.getCurrentSettings();
  
  if (settings.display.showChords) {
    // Включить отображение аккордов
    this.api.settings.notation.elements.chordDiagrams = true;
  } else {
    this.api.settings.notation.elements.chordDiagrams = false;
  }
  
  this.api.render();
}
```

### Сценарий 2: Добавление нового компонента

Допустим, вы хотите добавить компонент для отображения информации о треке.

**Шаг 1: Создайте компонент**

```bash
ng generate component components/track-info --standalone
```

**Шаг 2: Реализуйте логику**

```typescript
// src/app/components/track-info/track-info.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlphaTabService } from '../../services/alphatab.service';

@Component({
  selector: 'app-track-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="track-info">
      <h3>{{ trackName }}</h3>
      <p>Композитор: {{ composer }}</p>
      <p>Альбом: {{ album }}</p>
    </div>
  `,
  styles: [`
    .track-info {
      padding: 16px;
      background: white;
      border-radius: 8px;
      margin: 16px;
    }
  `]
})
export class TrackInfoComponent implements OnInit {
  trackName = '';
  composer = '';
  album = '';

  constructor(private alphaTabService: AlphaTabService) {}

  ngOnInit(): void {
    this.alphaTabService.ready$.subscribe(() => {
      const api = this.alphaTabService.getApi();
      if (api && api.score) {
        this.trackName = api.score.title || 'Без названия';
        this.composer = api.score.music || 'Неизвестен';
        this.album = api.score.album || 'Не указан';
      }
    });
  }
}
```

**Шаг 3: Добавьте в главный компонент**

```typescript
// src/app/app.component.ts
import { TrackInfoComponent } from './components/track-info/track-info.component';

@Component({
  imports: [
    // ...
    TrackInfoComponent
  ]
})
```

```html
<!-- src/app/app.component.html -->
<div class="app-container">
  <app-track-info></app-track-info>
  <!-- ... остальной контент -->
</div>
```

### Сценарий 3: Добавление нового формата экспорта

Допустим, вы хотите добавить экспорт в PDF.

**Шаг 1: Добавьте метод в сервис**

```typescript
// src/app/services/alphatab.service.ts
export class AlphaTabService {
  // ...
  
  /**
   * Экспортировать в PDF
   */
  exportToPdf(): void {
    if (!this.api) return;
    
    // AlphaTab поддерживает экспорт через canvas
    const canvas = document.createElement('canvas');
    // ... логика рендеринга и экспорта
  }
}
```

**Шаг 2: Добавьте кнопку в UI**

```html
<!-- src/app/components/player-controls/player-controls.component.html -->
<button class="control-btn" (click)="exportPdf()">
  <svg><!-- иконка PDF --></svg>
  <span>Экспорт в PDF</span>
</button>
```

```typescript
// src/app/components/player-controls/player-controls.component.ts
exportPdf(): void {
  this.alphaTabService.exportToPdf();
}
```

## Работа с AlphaTab API

### Основные события

```typescript
ngAfterViewInit(): void {
  const api = this.alphaTabService.getApi();
  
  if (api) {
    // Окончание рендеринга
    api.renderFinished.on(() => {
      console.log('Рендеринг завершен');
    });
    
    // Изменение позиции воспроизведения
    api.playerPositionChanged.on((e) => {
      console.log('Позиция:', e.currentTime);
    });
    
    // Изменение состояния плеера
    api.playerStateChanged.on((e) => {
      console.log('Состояние:', e.state);
    });
  }
}
```

### Доступ к данным композиции

```typescript
const api = this.alphaTabService.getApi();
if (api && api.score) {
  const score = api.score;
  
  // Информация о композиции
  console.log('Название:', score.title);
  console.log('Композитор:', score.music);
  console.log('Темп:', score.tempo);
  
  // Треки
  score.tracks.forEach(track => {
    console.log('Трек:', track.name);
    console.log('Инструмент:', track.staves[0].tuning);
  });
  
  // Такты
  score.masterBars.forEach(bar => {
    console.log('Такт:', bar.index);
  });
}
```

## Стилизация

### Кастомизация AlphaTab

AlphaTab генерирует SVG, который можно стилизовать через CSS:

```css
/* Изменение цвета нот */
:host ::ng-deep .at-note text {
  fill: #ff0000;
}

/* Изменение толщины линий */
:host ::ng-deep .at-staff-lines line {
  stroke-width: 2px;
}

/* Кастомизация табулатуры */
:host ::ng-deep .at-tab-number {
  font-family: 'Courier New', monospace;
  font-weight: bold;
}
```

### Адаптивный дизайн

```css
/* Мобильные устройства */
@media (max-width: 768px) {
  .settings-panel {
    width: 100%;
  }
  
  .player-controls button span {
    display: none; /* Скрыть текст на мобильных */
  }
}

/* Планшеты */
@media (min-width: 769px) and (max-width: 1024px) {
  .settings-panel {
    width: 350px;
  }
}
```

## Тестирование

### Юнит-тесты для сервисов

```typescript
// src/app/services/settings.service.spec.ts
describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsService);
    localStorage.clear();
  });

  it('should return default settings', () => {
    const settings = service.getCurrentSettings();
    expect(settings.display.showNoteNames).toBe(false);
  });

  it('should update settings', () => {
    service.updateSettings({
      display: { showNoteNames: true }
    });
    
    const settings = service.getCurrentSettings();
    expect(settings.display.showNoteNames).toBe(true);
  });

  it('should save to localStorage', () => {
    service.updateSettings({
      display: { zoom: 1.5 }
    });
    
    const saved = localStorage.getItem('guitarpro_settings');
    expect(saved).toBeTruthy();
    
    const parsed = JSON.parse(saved!);
    expect(parsed.display.zoom).toBe(1.5);
  });
});
```

## Производительность

### Оптимизация рендеринга

```typescript
// Используйте ChangeDetectionStrategy.OnPush
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent {}

// Отписывайтесь от Observable
private destroy$ = new Subject<void>();

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}

ngOnInit(): void {
  this.settingsService.getSettings()
    .pipe(takeUntil(this.destroy$))
    .subscribe(settings => {
      // ...
    });
}
```

### Ленивая загрузка

```typescript
// Для больших файлов используйте Web Workers
private loadFileWithWorker(file: File): void {
  const worker = new Worker(
    new URL('../workers/file-loader.worker', import.meta.url)
  );
  
  worker.postMessage({ file });
  
  worker.onmessage = ({ data }) => {
    this.alphaTabService.loadFromUrl(data.url);
  };
}
```

## Отладка

### Включение debug режима

```typescript
// src/app/services/alphatab.service.ts
initialize(element: HTMLElement): AlphaTabApi {
  const config: alphaTab.Settings = {
    core: {
      // ...
      logLevel: alphaTab.LogLevel.Debug
    }
  };
  
  return new alphaTab.AlphaTabApi(element, config);
}
```

### Логирование событий

```typescript
private setupDebugListeners(): void {
  const api = this.api;
  if (!api) return;
  
  api.renderStarted.on(() => console.log('[Render] Started'));
  api.renderFinished.on(() => console.log('[Render] Finished'));
  api.playerReady.on(() => console.log('[Player] Ready'));
  api.playerFinished.on(() => console.log('[Player] Finished'));
}
```

## Дополнительные ресурсы

- [AlphaTab Documentation](https://alphatab.net/docs)
- [Angular Documentation](https://angular.io/docs)
- [RxJS Documentation](https://rxjs.dev)

