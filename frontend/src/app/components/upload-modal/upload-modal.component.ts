import { Component, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-upload-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload-modal.component.html',
  styleUrls: ['./upload-modal.component.css']
})
export class UploadModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() gameUploaded = new EventEmitter<void>();

  private gameService = inject(GameService);
  private cdr = inject(ChangeDetectorRef);

  selectedRomFile: File | null = null;
  selectedCoverFile: File | null = null;

  title = '';
  system = 'snes';
  year: number | null = null;
  genre = 'Aventura';
  description = '';
  customCoverUrl = '';

  isDragging = false;
  isUploading = false;
  errorMessage = '';

  systemsList = [
    { core: 'snes', name: 'Super Nintendo (SNES)', ext: '.sfc, .smc' },
    { core: 'gba', name: 'Game Boy Advance (GBA)', ext: '.gba' },
    { core: 'nes', name: 'NES (Nintendinho)', ext: '.nes' },
    { core: 'segaMD', name: 'Mega Drive / Genesis', ext: '.md, .gen, .bin' },
    { core: 'gbc', name: 'Game Boy Color (GBC)', ext: '.gbc' },
    { core: 'gb', name: 'Game Boy (GB)', ext: '.gb' }
  ];

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.handleRomSelection(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(): void {
    this.isDragging = false;
  }

  onRomFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleRomSelection(input.files[0]);
    }
  }

  onCoverFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedCoverFile = input.files[0];
    }
  }

  private handleRomSelection(file: File): void {
    this.selectedRomFile = file;
    this.errorMessage = '';

    // Sugere título limpo
    const rawName = file.name.replace(/\.[^/.]+$/, '');
    this.title = rawName.replace(/[_-]/g, ' ');

    // Detecta console pela extensão
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (ext === '.gba') {
      this.system = 'gba';
    } else if (ext === '.sfc' || ext === '.smc') {
      this.system = 'snes';
    } else if (ext === '.nes') {
      this.system = 'nes';
    } else if (ext === '.md' || ext === '.gen') {
      this.system = 'segaMD';
    } else if (ext === '.gbc') {
      this.system = 'gbc';
    } else if (ext === '.gb') {
      this.system = 'gb';
    }
    this.cdr.detectChanges();
  }

  submit(): void {
    if (!this.selectedRomFile) {
      this.errorMessage = 'Por favor, selecione um arquivo de ROM (.sfc, .gba, .nes, .md, etc.)';
      this.cdr.detectChanges();
      return;
    }

    if (!this.title.trim()) {
      this.errorMessage = 'Por favor, informe o título do jogo.';
      this.cdr.detectChanges();
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('rom', this.selectedRomFile);
    formData.append('title', this.title.trim());
    formData.append('system', this.system);
    if (this.year) formData.append('year', this.year.toString());
    if (this.genre) formData.append('genre', this.genre.trim());
    if (this.description) formData.append('description', this.description.trim());
    if (this.selectedCoverFile) formData.append('cover', this.selectedCoverFile);
    if (this.customCoverUrl) formData.append('coverUrl', this.customCoverUrl.trim());

    this.gameService.uploadGame(formData).subscribe({
      next: () => {
        this.isUploading = false;
        this.cdr.detectChanges();
        this.gameUploaded.emit();
        this.close.emit();
      },
      error: (err) => {
        this.isUploading = false;
        this.errorMessage = err.error?.error || 'Erro ao enviar o jogo para o servidor Spring Boot.';
        this.cdr.detectChanges();
      }
    });
  }
}
