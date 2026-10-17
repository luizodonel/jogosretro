import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Game, SystemInfo } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private http = inject(HttpClient);

  // URL da API REST detectada automaticamente (Localhost vs Produção)
  readonly baseUrl = this.resolveApiBaseUrl();

  private resolveApiBaseUrl(): string {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'jogosretro.luizodonel.cloud' || hostname.includes('luizodonel.cloud')) {
        return 'https://jogosretroapi.luizodonel.cloud/api';
      }
    }
    return 'http://localhost:8080/api';
  }

  getGames(search?: string, system?: string): Observable<Game[]> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    if (system && system !== 'all') {
      params = params.set('system', system);
    }
    return this.http.get<Game[]>(`${this.baseUrl}/games`, { params }).pipe(
      catchError(() => this.http.get<Game[]>('/assets/catalog.json')),
      map(games => {
        if (!games || games.length === 0) {
          return this.getDefaultStaticGames();
        }
        return games.map(g => this.normalizeGame(g));
      }),
      catchError(() => of(this.getDefaultStaticGames()))
    );
  }

  getGame(id: number): Observable<Game> {
    return this.http.get<Game>(`${this.baseUrl}/games/${id}`).pipe(
      catchError(() => {
        const found = this.getDefaultStaticGames().find(g => g.id === id);
        return found ? of(found) : of(this.getDefaultStaticGames()[0]);
      }),
      map(g => this.normalizeGame(g))
    );
  }

  getSystems(): Observable<SystemInfo[]> {
    return this.http.get<SystemInfo[]>(`${this.baseUrl}/systems`);
  }

  uploadGame(formData: FormData): Observable<Game> {
    return this.http.post<Game>(`${this.baseUrl}/games/upload`, formData).pipe(
      map(g => this.normalizeGame(g))
    );
  }

  deleteGame(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/games/${id}`);
  }

  uploadSaveState(id: number, saveFile: Blob): Observable<{ message: string }> {
    const formData = new FormData();
    formData.append('saveFile', saveFile, `save_${id}.state`);
    return this.http.post<{ message: string }>(`${this.baseUrl}/games/${id}/save`, formData);
  }

  getRomDownloadUrl(id: number): string {
    return `${this.baseUrl}/games/${id}/rom`;
  }

  downloadRomBlob(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/games/${id}/rom`, { responseType: 'blob' });
  }

  getSaveStateDownloadUrl(id: number): string {
    return `${this.baseUrl}/games/${id}/save`;
  }

  private normalizeGame(game: Game): Game {
    const staticRomMap: Record<string, string> = {
      'game_12_Donkey_Kong_Country__U___V1.2_____.smc': '/assets/roms/game_12_Donkey_Kong_Country__U___V1.2_____.smc',
      'game_13_Street_Fighter_II_Turbo__V1.0___E_____.zip': '/assets/roms/game_13_Street_Fighter_II_Turbo__V1.0___E_____.zip'
    };

    const staticCoverMap: Record<string, string> = {
      'cover_12_Gemini_Generated_Image_ii6cbtii6cbtii6c.jpeg': '/assets/covers/cover_12_Gemini_Generated_Image_ii6cbtii6cbtii6c.jpeg',
      'cover_13_Gemini_Generated_Image_taql6ztaql6ztaql.jpeg': '/assets/covers/cover_13_Gemini_Generated_Image_taql6ztaql6ztaql.jpeg'
    };

    // Mapeamento por nome de arquivo de ROM
    if (game.romFileName && staticRomMap[game.romFileName]) {
      game.romUrl = staticRomMap[game.romFileName];
    } else if (game.title && game.title.toLowerCase().includes('donkey kong')) {
      game.romUrl = '/assets/roms/game_12_Donkey_Kong_Country__U___V1.2_____.smc';
      game.coverUrl = '/assets/covers/cover_12_Gemini_Generated_Image_ii6cbtii6cbtii6c.jpeg';
    } else if (game.title && game.title.toLowerCase().includes('street fighter')) {
      game.romUrl = '/assets/roms/game_13_Street_Fighter_II_Turbo__V1.0___E_____.zip';
      game.coverUrl = '/assets/covers/cover_13_Gemini_Generated_Image_taql6ztaql6ztaql.jpeg';
    }

    // Mapeamento por nome de capa
    if (game.coverFileName && staticCoverMap[game.coverFileName]) {
      game.coverUrl = staticCoverMap[game.coverFileName];
    } else if (game.coverUrl) {
      if (game.coverUrl.startsWith('/api')) {
        const rootUrl = this.baseUrl.replace(/\/api$/, '');
        game.coverUrl = rootUrl + game.coverUrl;
      } else if (game.coverUrl.includes('localhost:8080') && this.baseUrl.includes('jogosretroapi.luizodonel.cloud')) {
        game.coverUrl = game.coverUrl.replace('http://localhost:8080/api', 'https://jogosretroapi.luizodonel.cloud/api');
      }
    }
    return game;
  }

  getDefaultStaticGames(): Game[] {
    return [
      {
        id: 12,
        title: 'Donkey Kong Country (U) (V1.2) [!]',
        systemCore: 'snes',
        systemName: 'Super Nintendo',
        releaseYear: 1995,
        genre: 'Aventura',
        description: 'Jogo clássico do Super Nintendo.',
        romFileName: 'game_12_Donkey_Kong_Country__U___V1.2_____.smc',
        romSizeBytes: 4194304,
        coverUrl: '/assets/covers/cover_12_Gemini_Generated_Image_ii6cbtii6cbtii6c.jpeg',
        romUrl: '/assets/roms/game_12_Donkey_Kong_Country__U___V1.2_____.smc',
        hasSaveState: false,
        createdAt: '2026-10-17T15:53:09.000Z'
      },
      {
        id: 13,
        title: 'Street Fighter II Turbo (V1.0) (E) [!]',
        systemCore: 'snes',
        systemName: 'Super Nintendo',
        releaseYear: 1995,
        genre: 'Luta',
        description: 'Jogo clássico de luta para Super Nintendo.',
        romFileName: 'game_13_Street_Fighter_II_Turbo__V1.0___E_____.zip',
        romSizeBytes: 1668471,
        coverUrl: '/assets/covers/cover_13_Gemini_Generated_Image_taql6ztaql6ztaql.jpeg',
        romUrl: '/assets/roms/game_13_Street_Fighter_II_Turbo__V1.0___E_____.zip',
        hasSaveState: false,
        createdAt: '2026-10-17T16:10:53.000Z'
      }
    ];
  }
}
