import { Component, OnInit, inject, signal, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Game, SystemInfo } from './models/game.model';
import { GameService } from './services/game.service';
import { RetroPlayerComponent } from './components/player/retro-player.component';
import { UploadModalComponent } from './components/upload-modal/upload-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RetroPlayerComponent, UploadModalComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  private gameService = inject(GameService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  games = signal<Game[]>([]);
  systems = signal<SystemInfo[]>([]);

  selectedSystem = signal<string>('all');
  searchQuery = signal<string>('');
  isLoading = signal<boolean>(false);

  activeGameForPlay = signal<Game | null>(null);
  showUploadModal = signal<boolean>(false);
  showGuideModal = signal<boolean>(false);

  gamepadConnected = signal<boolean>(false);
  connectedGamepadName = signal<string>('');
  toastMessage = signal<string>('');

  ngOnInit(): void {
    this.loadSystems();
    this.loadGames();
    this.setupGamepadListeners();
  }

  loadSystems(): void {
    this.gameService.getSystems().subscribe({
      next: (data) => {
        this.systems.set(data);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar sistemas:', err);
      }
    });
  }

  loadGames(): void {
    this.isLoading.set(true);
    this.cdr.detectChanges();

    this.gameService.getGames(this.searchQuery(), this.selectedSystem()).subscribe({
      next: (data) => {
        this.games.set(data);
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar catálogo:', err);
        this.isLoading.set(false);
        this.showToast('Erro ao carregar catálogo. Verifique se o backend Spring Boot está ativo.');
        this.cdr.detectChanges();
      }
    });
  }

  selectSystem(core: string): void {
    this.selectedSystem.set(core);
    this.loadGames();
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.loadGames();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.loadGames();
  }

  playGame(game: Game): void {
    this.activeGameForPlay.set(game);
  }

  closePlayer(): void {
    this.activeGameForPlay.set(null);
    this.loadGames(); // Atualiza saves e último jogado
  }

  confirmDelete(game: Game, event: Event): void {
    event.stopPropagation();
    if (confirm(`Deseja realmente remover o jogo "${game.title}" da biblioteca?`)) {
      this.gameService.deleteGame(game.id).subscribe({
        next: () => {
          this.showToast(`Jogo "${game.title}" removido com sucesso.`);
          this.loadGames();
          this.loadSystems();
        },
        error: () => {
          this.showToast('Falha ao excluir o jogo.');
        }
      });
    }
  }

  downloadSave(game: Game, event: Event): void {
    event.stopPropagation();
    window.open(this.gameService.getSaveStateDownloadUrl(game.id), '_blank');
  }

  openUploadModal(): void {
    this.showUploadModal.set(true);
  }

  closeUploadModal(): void {
    this.showUploadModal.set(false);
  }

  onGameUploaded(): void {
    this.showToast('Jogo adicionado com sucesso!');
    this.loadGames();
    this.loadSystems();
  }

  toggleGuide(): void {
    this.showGuideModal.set(!this.showGuideModal());
  }

  showToast(message: string): void {
    this.toastMessage.set(message);
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastMessage.set('');
      this.cdr.detectChanges();
    }, 4000);
  }

  private setupGamepadListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('gamepadconnected', (e: any) => {
        this.ngZone.run(() => {
          this.gamepadConnected.set(true);
          this.connectedGamepadName.set(e.gamepad.id || 'Controle Conectado');
          this.showToast(`🎮 Gamepad detectado: ${this.connectedGamepadName()}`);
          this.cdr.detectChanges();
        });
      });

      window.addEventListener('gamepaddisconnected', () => {
        this.ngZone.run(() => {
          this.gamepadConnected.set(false);
          this.connectedGamepadName.set('');
          this.showToast('Controle desconectado');
          this.cdr.detectChanges();
        });
      });
    }
  }
}
