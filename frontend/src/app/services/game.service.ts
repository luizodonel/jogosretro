import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
      map(games => games.map(g => this.normalizeGame(g)))
    );
  }

  getGame(id: number): Observable<Game> {
    return this.http.get<Game>(`${this.baseUrl}/games/${id}`).pipe(
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
    if (game.coverUrl) {
      if (game.coverUrl.startsWith('/api')) {
        const rootUrl = this.baseUrl.replace(/\/api$/, '');
        game.coverUrl = rootUrl + game.coverUrl;
      } else if (game.coverUrl.includes('localhost:8080') && this.baseUrl.includes('jogosretroapi.luizodonel.cloud')) {
        game.coverUrl = game.coverUrl.replace('http://localhost:8080/api', 'https://jogosretroapi.luizodonel.cloud/api');
      }
    }
    return game;
  }
}
