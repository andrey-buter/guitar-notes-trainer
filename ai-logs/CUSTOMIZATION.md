# Руководство по кастомизации

Это руководство описывает способы кастомизации внешнего вида и поведения Guitar Pro Clone.

## Изменение цветовой схемы

### Основные цвета приложения

Цвета определены в `app.component.css`. Вы можете легко изменить их:

```css
/* src/app/app.component.css */

/* Градиент заголовка */
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Измените на свои цвета: */
  /* background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%); */
}

/* Цвет активных элементов */
:host ::ng-deep .at-cursor-beat {
  background: rgba(102, 126, 234, 0.75);
  /* Измените на: */
  /* background: rgba(255, 107, 107, 0.75); */
}
```

### Создание тёмной темы

Добавьте CSS переменные в `src/styles.css`:

```css
:root {
  /* Светлая тема */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #333333;
  --text-secondary: #666666;
  --accent-color: #667eea;
  --border-color: #e0e0e0;
}

[data-theme="dark"] {
  /* Тёмная тема */
  --bg-primary: #1e1e1e;
  --bg-secondary: #2d2d2d;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --accent-color: #8b9aff;
  --border-color: #404040;
}

/* Применение переменных */
body {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
```

Затем добавьте переключение темы в сервис:

```typescript
// src/app/services/settings.service.ts
applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-theme', theme);
}
```

## Кастомизация AlphaTab

### Изменение шрифтов

```typescript
// src/app/config/alphatab.config.ts
export const CUSTOM_ALPHATAB_CONFIG = {
  ...DEFAULT_ALPHATAB_CONFIG,
  display: {
    ...DEFAULT_ALPHATAB_CONFIG.display,
    resources: {
      copyrightFont: '12px Arial',
      titleFont: 'bold 24px Georgia',
      subTitleFont: '16px Georgia',
      wordsFont: '14px Arial',
      effectFont: '10px Arial',
      fretboardNumberFont: '11px Arial',
      tablatureFont: '13px Arial',
      graceFont: '9px Arial'
    }
  }
};
```

### Изменение размеров элементов

```typescript
// src/app/config/alphatab.config.ts
export const CUSTOM_LAYOUT = {
  display: {
    scale: 1.2,  // Увеличить всё на 20%
    stretchForce: 0.8,
    layoutMode: alphaTab.LayoutMode.Page,
    
    // Кастомные размеры
    resources: {
      staffLineHeight: 8,
      effectHeight: 10,
      ...
    }
  }
};
```

### Кастомные цвета для нот

```css
/* src/app/app.component.css */

/* Цвет названий нот */
:host ::ng-deep .show-note-names .at-tab-number {
  fill: #ff6b6b;
  font-weight: bold;
}

/* Цвет нот при наведении */
:host ::ng-deep .at-tab-number:hover {
  fill: #4ecdc4;
}

/* Разные цвета для разных струн */
:host ::ng-deep .string-1 .at-tab-number { fill: #e74c3c; }
:host ::ng-deep .string-2 .at-tab-number { fill: #f39c12; }
:host ::ng-deep .string-3 .at-tab-number { fill: #f1c40f; }
:host ::ng-deep .string-4 .at-tab-number { fill: #2ecc71; }
:host ::ng-deep .string-5 .at-tab-number { fill: #3498db; }
:host ::ng-deep .string-6 .at-tab-number { fill: #9b59b6; }
```

## Кастомизация UI компонентов

### Настройки панели

#### Изменение ширины панели настроек

```css
/* src/app/components/settings-panel/settings-panel.component.css */
.settings-panel {
  width: 500px;  /* Было 400px */
  right: -500px;
}
```

#### Изменение анимации

```css
.settings-panel {
  transition: right 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

#### Изменение цвета переключателей

```css
.toggle-label input[type="checkbox"]:checked + .toggle-slider {
  background-color: #e74c3c;  /* Красный вместо зелёного */
}
```

### Панель управления

#### Изменение размера кнопок

```css
/* src/app/components/player-controls/player-controls.component.css */
.control-btn {
  padding: 14px 20px;  /* Увеличить padding */
  font-size: 16px;     /* Увеличить шрифт */
}
```

#### Изменение цвета кнопки Play

```css
.play-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
}

.play-btn:hover {
  background: linear-gradient(135deg, #5568d3, #653b8b);
}
```

## Добавление новых пресетов

### Создание пресета для джаза

```typescript
// src/app/config/alphatab.config.ts
export const ALPHATAB_PRESETS = {
  // ... существующие пресеты
  
  jazz: {
    ...DEFAULT_ALPHATAB_CONFIG,
    display: {
      ...DEFAULT_ALPHATAB_CONFIG.display,
      scale: 1.1
    },
    notation: {
      ...DEFAULT_ALPHATAB_CONFIG.notation,
      elements: {
        scoreTitle: true,
        chordDiagrams: true,
        dynamics: true,
        // Подчеркнуть важные элементы для джаза
        parenthesis: true,
        rhythm: true,
        effectsAndOrnamentations: true
      }
    }
  }
};
```

### Применение пресета

```typescript
// src/app/services/alphatab.service.ts
initializeWithPreset(element: HTMLElement, presetName: string): void {
  const config = AlphaTabConfigHelper.getPreset(presetName as any);
  this.api = new alphaTab.AlphaTabApi(element, config as alphaTab.Settings);
}
```

## Добавление кастомных настроек

### Шаг 1: Добавьте в модель

```typescript
// src/app/models/settings.model.ts
export interface DisplaySettings {
  showNoteNames: boolean;
  theme: 'light' | 'dark';
  zoom: number;
  // Новая настройка:
  showFretNumbers: boolean;
  highlightCurrentNote: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  display: {
    showNoteNames: false,
    theme: 'light',
    zoom: 1.0,
    showFretNumbers: true,
    highlightCurrentNote: true
  },
  // ...
};
```

### Шаг 2: Добавьте UI

```html
<!-- src/app/components/settings-panel/settings-panel.component.html -->
<div class="setting-item">
  <label class="toggle-label">
    <input 
      type="checkbox" 
      [(ngModel)]="settings.display.showFretNumbers"
      (change)="updateDisplaySettings()"
    >
    <span class="toggle-slider"></span>
    <span class="setting-label">Показывать номера ладов сбоку</span>
  </label>
</div>
```

### Шаг 3: Примените в сервисе

```typescript
// src/app/services/alphatab.service.ts
private applySettings(): void {
  const settings = this.settingsService.getCurrentSettings();
  
  if (settings.display.showFretNumbers) {
    this.showFretNumbers();
  }
  
  if (settings.display.highlightCurrentNote) {
    this.enableNoteHighlight();
  }
}

private showFretNumbers(): void {
  // Ваша реализация
}
```

## Создание кастомных компонентов

### Компонент выбора пресета

```typescript
// src/app/components/preset-selector/preset-selector.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlphaTabService } from '../../services/alphatab.service';

@Component({
  selector: 'app-preset-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="preset-selector">
      <label>Режим отображения:</label>
      <select (change)="onPresetChange($event)">
        <option value="default">По умолчанию</option>
        <option value="minimal">Минимальный</option>
        <option value="print">Печать</option>
        <option value="beginner">Для начинающих</option>
        <option value="performance">Производительность</option>
      </select>
    </div>
  `,
  styles: [`
    .preset-selector {
      padding: 12px;
      display: flex;
      gap: 12px;
      align-items: center;
    }
    
    select {
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #ddd;
    }
  `]
})
export class PresetSelectorComponent {
  constructor(private alphaTabService: AlphaTabService) {}
  
  onPresetChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const preset = select.value;
    
    // Перезагрузить с новым пресетом
    this.alphaTabService.destroy();
    // Инициализировать с новым пресетом
    // (нужно добавить метод в сервис)
  }
}
```

### Компонент отображения информации о композиции

```typescript
// src/app/components/score-info/score-info.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlphaTabService } from '../../services/alphatab.service';

interface ScoreInfo {
  title: string;
  artist: string;
  album: string;
  tempo: number;
  trackCount: number;
}

@Component({
  selector: 'app-score-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="score-info" *ngIf="info">
      <h2>{{ info.title }}</h2>
      <p class="artist">{{ info.artist }}</p>
      <div class="details">
        <span>🎵 {{ info.tempo }} BPM</span>
        <span>🎸 {{ info.trackCount }} треков</span>
        <span *ngIf="info.album">💿 {{ info.album }}</span>
      </div>
    </div>
  `,
  styles: [`
    .score-info {
      padding: 20px;
      background: white;
      border-radius: 12px;
      margin: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: #333;
    }
    
    .artist {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #666;
    }
    
    .details {
      display: flex;
      gap: 16px;
      font-size: 14px;
      color: #888;
    }
  `]
})
export class ScoreInfoComponent implements OnInit {
  info: ScoreInfo | null = null;
  
  constructor(private alphaTabService: AlphaTabService) {}
  
  ngOnInit(): void {
    this.alphaTabService.ready$.subscribe(() => {
      const api = this.alphaTabService.getApi();
      
      if (api && api.score) {
        this.info = {
          title: api.score.title || 'Без названия',
          artist: api.score.artist || 'Неизвестен',
          album: api.score.album || '',
          tempo: api.score.tempo,
          trackCount: api.score.tracks.length
        };
      }
    });
  }
}
```

## Продвинутая кастомизация AlphaTab

### Кастомный рендерер нот

```typescript
// src/app/services/custom-renderer.service.ts
import { Injectable } from '@angular/core';
import * as alphaTab from '@coderline/alphatab';

@Injectable({
  providedIn: 'root'
})
export class CustomRendererService {
  /**
   * Применить кастомные стили к нотам
   */
  applyCustomNoteStyles(api: alphaTab.AlphaTabApi): void {
    api.renderFinished.on(() => {
      const container = api.container;
      
      // Находим все ноты
      const notes = container.querySelectorAll('.at-note');
      
      notes.forEach((note, index) => {
        // Применяем градиент по цветам радуги
        const hue = (index * 30) % 360;
        (note as HTMLElement).style.filter = `hue-rotate(${hue}deg)`;
      });
    });
  }
  
  /**
   * Добавить анимацию к активным нотам
   */
  animateActiveNotes(api: alphaTab.AlphaTabApi): void {
    api.playerPositionChanged.on(() => {
      // Добавить класс анимации к активной ноте
      const activeNotes = api.container.querySelectorAll('.at-highlight');
      
      activeNotes.forEach(note => {
        note.classList.add('pulse-animation');
      });
    });
  }
}
```

### CSS для анимации

```css
/* src/app/app.component.css */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

:host ::ng-deep .pulse-animation {
  animation: pulse 0.5s ease-in-out;
}
```

## Адаптация под разные устройства

### Кастомные брейкпоинты

```css
/* src/styles.css */

/* Телефоны в портретной ориентации */
@media (max-width: 576px) {
  .app-header h1 {
    font-size: 18px;
  }
}

/* Телефоны в ландшафтной ориентации */
@media (min-width: 577px) and (max-width: 768px) {
  .app-header h1 {
    font-size: 20px;
  }
}

/* Планшеты */
@media (min-width: 769px) and (max-width: 1024px) {
  .settings-panel {
    width: 350px;
  }
}

/* Большие экраны */
@media (min-width: 1441px) {
  .app-container {
    max-width: 1920px;
    margin: 0 auto;
  }
}
```

## Интеграция со сторонними библиотеками

### Добавление аналитики

```typescript
// src/app/services/analytics.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  trackEvent(category: string, action: string, label?: string): void {
    // Интеграция с Google Analytics, Mixpanel и т.д.
    console.log(`Event: ${category} - ${action} - ${label}`);
  }
}

// Использование в компонентах
export class PlayerControlsComponent {
  constructor(private analytics: AnalyticsService) {}
  
  playPause(): void {
    this.alphaTabService.playPause();
    this.analytics.trackEvent('Player', 'PlayPause', 'User clicked play/pause');
  }
}
```

### Добавление уведомлений

```bash
npm install ngx-toastr
```

```typescript
// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private toastr: ToastrService) {}
  
  success(message: string): void {
    this.toastr.success(message, 'Успех');
  }
  
  error(message: string): void {
    this.toastr.error(message, 'Ошибка');
  }
}

// Использование
loadFile(file: File): void {
  try {
    this.alphaTabService.loadFile(file);
    this.notification.success('Файл успешно загружен');
  } catch (error) {
    this.notification.error('Не удалось загрузить файл');
  }
}
```

## Заключение

Эта кастомизация позволяет полностью адаптировать приложение под ваши нужды. Экспериментируйте с цветами, размерами и функциями, чтобы создать уникальный опыт для пользователей!

