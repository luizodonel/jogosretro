import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  signal,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Game } from '../../models/game.model';
import { GameService } from '../../services/game.service';

declare global {
  interface Window {
    EJS_player?: string;
    EJS_core?: string;
    EJS_gameName?: string;
    EJS_gameID?: number;
    EJS_gameUrl?: string;
    EJS_pathtodata?: string;
    EJS_startOnLoaded?: boolean;
    EJS_virtualGamepadSettings?: any;
    EJS_emulator?: any;
    EJS_onGameStart?: () => void;
    EJS_onReady?: () => void;
    EJS_onSaveState?: (state: any) => void;
  }
}

@Component({
  selector: 'app-retro-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './retro-player.component.html',
  styleUrls: ['./retro-player.component.css']
})
export class RetroPlayerComponent implements OnInit, OnDestroy {
  @Input({ required: true }) game!: Game;
  @Output() close = new EventEmitter<void>();

  @ViewChild('playerContainer', { static: true }) playerContainerRef!: ElementRef<HTMLDivElement>;

  private gameService = inject(GameService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  private scriptElement?: HTMLScriptElement;
  private checkInterval?: any;
  private autoDismissTimeout?: any;
  private currentBlobUrl?: string;

  isLoading = signal(true);
  showControlsModal = signal(false);
  statusMessage = signal('');
  isSaving = signal(false);

  ngOnInit(): void {
    this.bootEmulator();
  }

  bootEmulator(): void {
    this.isLoading.set(true);
    this.statusMessage.set('Obtendo arquivo da ROM do servidor...');

    const canvasContainer = document.getElementById('game-viewport');
    if (canvasContainer) {
      canvasContainer.innerHTML = '';
    }

    // Baixa a ROM em memória como Blob diretamente via Angular
    this.gameService.downloadRomBlob(this.game.id).subscribe({
      next: (blob) => {
        if (this.currentBlobUrl) {
          URL.revokeObjectURL(this.currentBlobUrl);
        }
        this.currentBlobUrl = URL.createObjectURL(blob);
        this.statusMessage.set('Iniciando motor WebAssembly...');
        this.launchEmulatorJs(this.currentBlobUrl);
      },
      error: (err) => {
        console.warn('Fallback para URL direta após erro ao baixar ROM como blob:', err);
        this.statusMessage.set('Inicializando...');
        this.launchEmulatorJs(this.gameService.getRomDownloadUrl(this.game.id));
      }
    });
  }

  private launchEmulatorJs(gameUrl: string): void {
    // Configuração EmulatorJS local (carregamento ultra-rápido instantâneo)
    window.EJS_player = '#game-viewport';
    window.EJS_core = this.game.systemCore;
    window.EJS_gameName = this.game.title;
    window.EJS_gameID = this.game.id;
    window.EJS_gameUrl = gameUrl;
    window.EJS_pathtodata = '/emulatorjs/data/';
    window.EJS_startOnLoaded = true;

    // Configuração para controles touch virtuais em telas mobile
    window.EJS_virtualGamepadSettings = {
      touchControls: true
    };

    window.EJS_onGameStart = () => {
      this.dismissLoader();
    };

    window.EJS_onReady = () => {
      this.dismissLoader();
    };

    // Remove script antigo se existente
    this.removeScript();

    // Injeta loader script local
    this.scriptElement = document.createElement('script');
    this.scriptElement.src = '/emulatorjs/data/loader.js';
    this.scriptElement.async = true;

    this.scriptElement.onload = () => {
      // Monitora criação do canvas/elementos internos do emulador
      this.startWatchdog();
    };

    this.scriptElement.onerror = () => {
      // Fallback de segurança para CDN externa caso necessário
      console.warn('Arquivo local não encontrado, alternando para CDN externa...');
      window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
      const fallbackScript = document.createElement('script');
      fallbackScript.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
      fallbackScript.async = true;
      fallbackScript.onload = () => this.startWatchdog();
      document.body.appendChild(fallbackScript);
    };

    document.body.appendChild(this.scriptElement);

    // Timeout de segurança: fecha a cortina de loading em 1.5s
    this.autoDismissTimeout = setTimeout(() => {
      this.dismissLoader();
    }, 1500);
  }

  private startWatchdog(): void {
    clearInterval(this.checkInterval);
    this.checkInterval = setInterval(() => {
      const container = document.getElementById('game-viewport');
      if (container) {
        // Se EmulatorJS injetou canvas ou elementos dentro do viewport
        const hasCanvas = container.querySelector('canvas') !== null;
        const hasElements = container.children.length > 0;
        if (hasCanvas || hasElements) {
          this.dismissLoader();
          clearInterval(this.checkInterval);
        }
      }
    }, 150);
  }

  dismissLoader(): void {
    this.ngZone.run(() => {
      this.isLoading.set(false);
      this.statusMessage.set('');
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  saveToCloud(): void {
    if (this.isSaving()) return;

    try {
      if (window.EJS_emulator && window.EJS_emulator.gameManager && typeof window.EJS_emulator.gameManager.getState === 'function') {
        this.isSaving.set(true);
        this.statusMessage.set('Extraindo save state...');

        const stateResult = window.EJS_emulator.gameManager.getState();
        Promise.resolve(stateResult).then((bytes: Uint8Array) => {
          if (!bytes || bytes.length === 0) {
            this.statusMessage.set('Nenhum dado de save retornado pelo emulador.');
            this.isSaving.set(false);
            return;
          }

          const blob = new Blob([bytes as any], { type: 'application/octet-stream' });
          this.gameService.uploadSaveState(this.game.id, blob).subscribe({
            next: () => {
              this.ngZone.run(() => {
                this.statusMessage.set('Progresso salvo na nuvem com sucesso!');
                this.game.hasSaveState = true;
                this.isSaving.set(false);
                this.cdr.detectChanges();
                setTimeout(() => { this.statusMessage.set(''); this.cdr.detectChanges(); }, 3000);
              });
            },
            error: () => {
              this.ngZone.run(() => {
                this.statusMessage.set('Erro ao salvar na nuvem.');
                this.isSaving.set(false);
                this.cdr.detectChanges();
                setTimeout(() => { this.statusMessage.set(''); this.cdr.detectChanges(); }, 3000);
              });
            }
          });
        }).catch(() => {
          this.ngZone.run(() => {
            this.statusMessage.set('Erro ao capturar estado do emulador.');
            this.isSaving.set(false);
            this.cdr.detectChanges();
          });
        });
      } else {
        this.statusMessage.set('Função de save do emulador ainda não disponível.');
        setTimeout(() => { this.statusMessage.set(''); this.cdr.detectChanges(); }, 3000);
      }
    } catch (e) {
      this.statusMessage.set('Save manual indisponível neste momento.');
      this.isSaving.set(false);
    }
  }

  toggleFullscreen(): void {
    const el = this.playerContainerRef.nativeElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  restartGame(): void {
    if (window.EJS_emulator && window.EJS_emulator.gameManager && typeof window.EJS_emulator.gameManager.restart === 'function') {
      window.EJS_emulator.gameManager.restart();
    } else {
      this.bootEmulator();
    }
  }

  toggleControlsModal(): void {
    this.showControlsModal.set(!this.showControlsModal());
  }

  onClose(): void {
    this.cleanup();
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private cleanup(): void {
    clearInterval(this.checkInterval);
    clearTimeout(this.autoDismissTimeout);
    this.removeScript();
    const container = document.getElementById('game-viewport');
    if (container) {
      container.innerHTML = '';
    }
    if (this.currentBlobUrl) {
      try {
        URL.revokeObjectURL(this.currentBlobUrl);
      } catch (ignored) {}
      this.currentBlobUrl = undefined;
    }
    // Interrompe contexto de áudio se possível
    if (window.EJS_emulator && typeof window.EJS_emulator.stop === 'function') {
      try {
        window.EJS_emulator.stop();
      } catch (ignored) {}
    }
  }

  private removeScript(): void {
    if (this.scriptElement && document.body.contains(this.scriptElement)) {
      document.body.removeChild(this.scriptElement);
      this.scriptElement = undefined;
    }
  }
}
