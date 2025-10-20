import { Injectable } from '@angular/core';
import * as alphaTab from '@coderline/alphatab';
import { SettingsService } from './settings.service';
import { NoteNamesService } from './note-names.service';
import { Subject } from 'rxjs';
import { DEFAULT_ALPHATAB_CONFIG } from '../config/alphatab.config';

/**
 * Информация о дорожке
 */
export interface TrackInfo {
  index: number;
  name: string;
  instrument: string;
  isSolo: boolean;
  isMuted: boolean;
  isVisible: boolean;
}

/**
 * Основной сервис для работы с AlphaTab API
 * Управляет инициализацией, настройками и жизненным циклом API
 */
@Injectable({
  providedIn: 'root'
})
export class AlphaTabService {
  private api: alphaTab.AlphaTabApi | null = null;
  private isReady = new Subject<boolean>();
  private scoreLoaded = new Subject<boolean>();
  private isApplyingSettings = false;
  private renderFinishedHandler: any = null;
  private scoreLoadedHandler: any = null;
  private visibleTracks: Set<number> = new Set();

  public readonly ready$ = this.isReady.asObservable();
  public readonly scoreLoaded$ = this.scoreLoaded.asObservable();

  constructor(
    private settingsService: SettingsService,
    private noteNamesService: NoteNamesService
  ) {
    // Подписываемся на изменения настроек
    this.settingsService.getSettings().subscribe(settings => {
      if (this.api && !this.isApplyingSettings) {
        this.applySettings();
      }
    });
  }

  /**
   * Инициализировать AlphaTab API
   */
  initialize(element: HTMLElement, initialFile?: string): alphaTab.AlphaTabApi {
    const settings = this.settingsService.getCurrentSettings();

    // Определяем StaveProfile на основе настроек нотации
    const StaveProfile = (alphaTab as any).StaveProfile;
    let staveProfile = this.getStaveProfile(settings.notation.notationMode);

    console.log('[AlphaTab] Initializing with staveProfile:', settings.notation.notationMode, staveProfile);

    // Конфигурация AlphaTab
    const config: any = {
      ...DEFAULT_ALPHATAB_CONFIG,
      core: {
        ...DEFAULT_ALPHATAB_CONFIG.core,
        file: initialFile || 'https://www.alphatab.net/files/canon.gp'
      },
      display: {
        ...DEFAULT_ALPHATAB_CONFIG.display,
        scale: settings.display.zoom,
        staveProfile: staveProfile
      },
      notation: {
        notationMode: (alphaTab as any).NotationMode.GuitarPro
      }
    };

    this.api = new alphaTab.AlphaTabApi(element, config);

    // Применяем настройки после первого рендеринга
    this.setupRenderHandlers();

    this.isReady.next(true);

    return this.api;
  }

  /**
   * Настроить обработчики рендеринга
   */
  private setupRenderHandlers(): void {
    if (!this.api) return;

    let isFirstRender = true;
    this.renderFinishedHandler = () => {
      if (isFirstRender) {
        isFirstRender = false;
        this.applySettings();
      }
    };
    this.api.renderFinished.on(this.renderFinishedHandler);

    // Обработчик загрузки score
    this.scoreLoadedHandler = () => {
      console.log('[AlphaTab] Score loaded, emitting event');
      this.scoreLoaded.next(true);
    };
    this.api.scoreLoaded.on(this.scoreLoadedHandler);
  }

  /**
   * Получить текущий API экземпляр
   */
  getApi(): alphaTab.AlphaTabApi | null {
    return this.api;
  }

  /**
   * Применить текущие настройки к AlphaTab
   */
  private applySettings(): void {
    if (!this.api || this.isApplyingSettings) return;

    this.isApplyingSettings = true;
    const settings = this.settingsService.getCurrentSettings();

    console.log('[AlphaTab] Applying settings:', settings);

    // Применяем скорость воспроизведения
    this.applyPlaybackSpeed(settings.playback.speed);

    // Применяем настройки нотации
    this.applyNotationMode(settings.notation.notationMode);

    // Применяем масштаб
    this.applyZoom(settings.display.zoom);

    // Применяем названия нот
    this.applyNoteNames(settings.display.noteNamesTarget);

    setTimeout(() => {
      this.isApplyingSettings = false;
    }, 100);
  }

  /**
   * Применить скорость воспроизведения
   */
  private applyPlaybackSpeed(speed: number): void {
    if (this.api && this.api.player) {
      this.api.player.playbackSpeed = speed / 100;
      console.log('[AlphaTab] Playback speed set to:', speed);
    }
  }

  /**
   * Применить режим отображения нотации
   */
  private applyNotationMode(mode: 'staff-only' | 'tab-only' | 'both'): void {
    if (!this.api) return;

    console.log('[AlphaTab] Applying notation mode:', mode);

    const staveProfile = this.getStaveProfile(mode);
    this.api.settings.display.staveProfile = staveProfile;

    // Изменение staveProfile требует перезагрузки трека
    console.log('[AlphaTab] Reloading track to apply staveProfile...');
    const apiAny = this.api as any;
    if (apiAny._score) {
      const currentScore = apiAny._score;
      this.api.renderScore(currentScore);
    } else {
      this.api.render();
    }
  }

  /**
   * Получить StaveProfile для режима нотации
   */
  private getStaveProfile(mode: 'staff-only' | 'tab-only' | 'both'): any {
    const StaveProfile = (alphaTab as any).StaveProfile;

    switch (mode) {
      case 'staff-only':
        return StaveProfile.Score;
      case 'tab-only':
        return StaveProfile.Tab;
      case 'both':
        return StaveProfile.ScoreTab;
      default:
        return StaveProfile.ScoreTab;
    }
  }

  /**
   * Применить масштаб
   */
  private applyZoom(zoom: number): void {
    if (!this.api) return;

    const currentScale = this.api.settings.display.scale;
    if (Math.abs(currentScale - zoom) > 0.01) {
      console.log('[AlphaTab] Changing scale from', currentScale, 'to', zoom);
      this.api.settings.display.scale = zoom;
      this.api.render();
    }
  }

  /**
   * Применить настройки названий нот
   */
  private applyNoteNames(target: 'none' | 'tab-numbers' | 'tab-numbers-octave' | 'scale-degrees' | 'scale-degrees-roman'): void {
    if (!this.api) return;

    console.log('[AlphaTab] Note names target:', target);

    // ВСЕГДА сначала удаляем overlay (чтобы пересоздать с новыми настройками)
    this.noteNamesService.disableNoteNames(this.api);

    // Затем создаём новый, если нужно
    if (target !== 'none') {
      this.noteNamesService.enableNoteNames(this.api);
    }
  }

  /**
   * Уничтожить API
   */
  destroy(): void {
    if (this.api) {
      // Отписываемся от событий
      if (this.renderFinishedHandler) {
        this.api.renderFinished.off(this.renderFinishedHandler);
      }
      if (this.scoreLoadedHandler) {
        this.api.scoreLoaded.off(this.scoreLoadedHandler);
      }
      this.api.destroy();
      this.api = null;
    }
  }

  /**
   * Воспроизведение/пауза
   */
  playPause(): void {
    this.api?.playPause();
  }

  /**
   * Остановить воспроизведение
   */
  stop(): void {
    this.api?.stop();
  }

  /**
   * Загрузить файл
   */
  loadFile(file: File): void {
    if (!this.api) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      this.api?.load(new Uint8Array(arrayBuffer));
    };
    reader.readAsArrayBuffer(file);
  }

  /**
   * Загрузить из URL
   */
  loadFromUrl(url: string): void {
    if (!this.api) return;
    this.api.load(url);
  }

  /**
   * Получить список всех дорожек
   */
  getTracks(): TrackInfo[] {
    if (!this.api || !this.api.score) return [];

    return this.api.score.tracks.map((track: any, index: number) => ({
      index: index,
      name: track.name || `Track ${index + 1}`,
      instrument: this.getInstrumentName(track),
      isSolo: track.playbackInfo?.isSolo || false,
      isMuted: track.playbackInfo?.isMute || false,
      isVisible: this.visibleTracks.size === 0 || this.visibleTracks.has(index)
    }));
  }

  /**
   * Получить название инструмента
   */
  private getInstrumentName(track: any): string {
    if (track.shortName) return track.shortName;

    // Попытка получить название программы MIDI
    const program = track.playbackInfo?.program || 0;
    const midiInstruments: { [key: number]: string } = {
      0: 'Piano', 25: 'Acoustic Guitar', 26: 'Electric Guitar (jazz)',
      27: 'Electric Guitar (clean)', 28: 'Electric Guitar (muted)',
      29: 'Overdriven Guitar', 30: 'Distortion Guitar', 31: 'Guitar Harmonics',
      32: 'Acoustic Bass', 33: 'Electric Bass (finger)', 34: 'Electric Bass (pick)',
      // ... можно добавить больше инструментов
    };

    return midiInstruments[program] || 'Guitar';
  }

  /**
   * Переключить видимость дорожки
   */
  toggleTrackVisibility(trackIndex: number): void {
    if (!this.api || !this.api.score) return;

    if (this.visibleTracks.has(trackIndex)) {
      this.visibleTracks.delete(trackIndex);
    } else {
      this.visibleTracks.add(trackIndex);
    }

    // Если не выбрано ни одной дорожки, показываем все
    if (this.visibleTracks.size === 0) {
      console.log('[AlphaTab] No tracks selected, rendering all tracks');
      this.api.renderScore(this.api.score);
    } else {
      const tracksToRender = Array.from(this.visibleTracks);
      console.log('[AlphaTab] Rendering tracks:', tracksToRender);
      this.api.renderTracks(tracksToRender.map(i => this.api!.score!.tracks[i]));
    }
  }

  /**
   * Установить видимость дорожки
   */
  setTrackVisibility(trackIndex: number, visible: boolean): void {
    if (!this.api || !this.api.score) return;

    if (visible) {
      this.visibleTracks.add(trackIndex);
    } else {
      this.visibleTracks.delete(trackIndex);
    }

    // Если не выбрано ни одной дорожки, показываем все
    if (this.visibleTracks.size === 0) {
      this.api.renderScore(this.api.score);
    } else {
      const tracksToRender = Array.from(this.visibleTracks);
      this.api.renderTracks(tracksToRender.map(i => this.api!.score!.tracks[i]));
    }
  }

  /**
   * Переключить mute/solo дорожки
   */
  toggleTrackMute(trackIndex: number): void {
    if (!this.api || !this.api.score) return;

    const track = this.api.score.tracks[trackIndex];
    if (track && track.playbackInfo) {
      track.playbackInfo.isMute = !track.playbackInfo.isMute;
      console.log(`[AlphaTab] Track ${trackIndex} mute:`, track.playbackInfo.isMute);
    }
  }

  /**
   * Переключить solo дорожки
   */
  toggleTrackSolo(trackIndex: number): void {
    if (!this.api || !this.api.score) return;

    const track = this.api.score.tracks[trackIndex];
    if (track && track.playbackInfo) {
      track.playbackInfo.isSolo = !track.playbackInfo.isSolo;
      console.log(`[AlphaTab] Track ${trackIndex} solo:`, track.playbackInfo.isSolo);
    }
  }
}
