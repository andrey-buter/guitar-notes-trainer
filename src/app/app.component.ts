import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AlphaTabService, TrackInfo } from './services/alphatab.service';
import { SettingsService } from './services/settings.service';
import { KeyDetectionService, KeyInfo, TuningInfo, ScaleDegree } from './services/key-detection.service';
import { PlayerControlsComponent } from './components/player-controls/player-controls.component';
import { SettingsPanelComponent } from './components/settings-panel/settings-panel.component';

/**
 * Главный компонент приложения Guitar Pro Clone
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    FormsModule,
    TranslateModule,
    PlayerControlsComponent,
    SettingsPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('alphaTab') alphaTabElement!: ElementRef<HTMLDivElement>;
  @ViewChild('settingsPanel') settingsPanel!: SettingsPanelComponent;

  title = 'Guitar Pro Clone';

  // Информация о композиции
  keyInfo: KeyInfo | null = null;
  tuningInfo: TuningInfo | null = null;
  songTitle: string = '';

  // Ступени лада
  scaleDegrees: ScaleDegree[] = [];
  scaleNotes: string[] = [];

  // Тогглеры для таблицы ступеней
  showScaleNotes: boolean = false;

  // Дорожки
  tracks: TrackInfo[] = [];
  showTracksPanel: boolean = false;

  // Памятка октав на грифе
  showFretboardOctaves: boolean = false;

  constructor(
    private alphaTabService: AlphaTabService,
    private settingsService: SettingsService,
    private keyDetectionService: KeyDetectionService,
    private translate: TranslateService
  ) {
    // Настройка переводов
    this.translate.addLangs(['en', 'ru']);
    this.translate.setDefaultLang('en');

    // Проверяем сохраненный язык в localStorage
    const savedLang = localStorage.getItem('app-language') || 'en';
    this.translate.use(savedLang);

    // Получаем ступени лада
    this.scaleDegrees = this.keyDetectionService.getScaleDegrees();
  }

  ngAfterViewInit(): void {
    // Инициализируем AlphaTab через сервис
    this.alphaTabService.initialize(
      this.alphaTabElement.nativeElement,
      'https://www.alphatab.net/files/canon.gp'
    );

    // Подписываемся на событие загрузки score
    this.alphaTabService.scoreLoaded$.subscribe(() => {
      setTimeout(() => {
        this.updateSongInfo();
      }, 500); // Небольшая задержка для полной инициализации
    });
  }

  ngOnDestroy(): void {
    this.alphaTabService.destroy();
  }

  /**
   * Обновить информацию о композиции
   */
  updateSongInfo(): void {
    const api = this.alphaTabService.getApi();
    if (!api || !api.score) return;

    console.log('[AppComponent] Updating song info...');

    // Получаем название композиции
    this.songTitle = api.score.title || 'Без названия';

    // Определяем тональность
    this.keyInfo = this.keyDetectionService.detectKey(api.score);

    // Получаем информацию о строе
    this.tuningInfo = this.keyDetectionService.getTuningInfo(api.score);

    // Получаем ноты текущей гаммы
    if (this.keyInfo) {
      this.scaleNotes = this.keyDetectionService.getScaleNotes(this.keyInfo);
    }

    // Получаем список дорожек
    this.tracks = this.alphaTabService.getTracks();

    console.log('[AppComponent] Song info updated:', {
      title: this.songTitle,
      key: this.keyInfo,
      tuning: this.tuningInfo,
      scaleNotes: this.scaleNotes,
      tracks: this.tracks
    });
  }

  /**
   * Получить отформатированный строй
   */
  getFormattedTuning(): string {
    if (!this.tuningInfo) return '';
    return this.keyDetectionService.formatTuning(this.tuningInfo);
  }

  /**
   * Проверить, включен ли режим ступеней лада
   */
  isScaleDegreesMode(): boolean {
    const settings = this.settingsService.getCurrentSettings();
    return settings.display.noteNamesTarget === 'scale-degrees' ||
           settings.display.noteNamesTarget === 'scale-degrees-roman';
  }

  /**
   * Открыть панель настроек
   */
  openSettings(): void {
    this.settingsPanel.togglePanel();
  }

  /**
   * Получить текущий режим отображения названий нот
   */
  getCurrentNoteNamesTarget(): string {
    const settings = this.settingsService.getCurrentSettings();
    return settings.display.noteNamesTarget;
  }

  /**
   * Установить режим отображения названий нот
   */
  setNoteNamesTarget(target: 'none' | 'tab-numbers' | 'tab-numbers-octave' | 'scale-degrees' | 'scale-degrees-roman'): void {
    const currentSettings = this.settingsService.getCurrentSettings();
    this.settingsService.updateSettings({
      display: {
        ...currentSettings.display,
        noteNamesTarget: target
      }
    });
  }

  /**
   * Получить текущий язык
   */
  getCurrentLanguage(): string {
    return this.translate.currentLang || 'en';
  }

  /**
   * Переключить язык
   */
  switchLanguage(lang: 'en' | 'ru'): void {
    this.translate.use(lang);
    localStorage.setItem('app-language', lang);
  }

  /**
   * Переключить панель дорожек
   */
  toggleTracksPanel(): void {
    this.showTracksPanel = !this.showTracksPanel;
  }

  /**
   * Переключить видимость дорожки
   */
  toggleTrackVisibility(trackIndex: number): void {
    this.alphaTabService.toggleTrackVisibility(trackIndex);
    // Обновляем список дорожек
    this.tracks = this.alphaTabService.getTracks();
  }

  /**
   * Переключить mute дорожки
   */
  toggleTrackMute(trackIndex: number): void {
    this.alphaTabService.toggleTrackMute(trackIndex);
    // Обновляем список дорожек
    this.tracks = this.alphaTabService.getTracks();
  }

  /**
   * Переключить solo дорожки
   */
  toggleTrackSolo(trackIndex: number): void {
    this.alphaTabService.toggleTrackSolo(trackIndex);
    // Обновляем список дорожек
    this.tracks = this.alphaTabService.getTracks();
  }

  /**
   * Переключить памятку октав
   */
  toggleFretboardOctaves(): void {
    this.showFretboardOctaves = !this.showFretboardOctaves;
  }

  /**
   * Получить октаву для ноты (MIDI значение)
   */
  getOctaveForMidi(midiValue: number): number {
    return Math.floor(midiValue / 12) - 1;
  }

  /**
   * Генерация данных грифа для стандартного строя E-A-D-G-B-E
   */
  getFretboardData(): { string: number; fret: number; note: string; octave: number }[] {
    const tuning = [64, 59, 55, 50, 45, 40]; // E4, B3, G3, D3, A2, E2 (стандартный строй)
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const fretboard: { string: number; fret: number; note: string; octave: number }[] = [];

    for (let stringIndex = 0; stringIndex < tuning.length; stringIndex++) {
      for (let fret = 0; fret <= 24; fret++) {
        const midiValue = tuning[stringIndex] + fret;
        const octave = Math.floor(midiValue / 12) - 1;
        const noteName = noteNames[midiValue % 12];
        fretboard.push({
          string: stringIndex + 1,
          fret: fret,
          note: noteName,
          octave: octave
        });
      }
    }

    return fretboard;
  }

  /**
   * Получить цвет для октавы
   */
  getOctaveColor(octave: number): string {
    const colors: { [key: number]: string } = {
      2: '#e53e3e', // Красный
      3: '#dd6b20', // Оранжевый
      4: '#d69e2e', // Желтый
      5: '#38a169', // Зеленый
      6: '#3182ce', // Синий
      7: '#805ad5'  // Фиолетовый
    };
    return colors[octave] || '#718096'; // Серый по умолчанию
  }
}
