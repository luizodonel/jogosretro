import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Game, SystemInfo } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api';

  getGames(search?: string, system?: string): Observable<Game[]> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    if (system && system !== 'all') {
      params = params.set('system', system);
    }
    return this.http.get<Game[]>(`${this.baseUrl}/games`, { params });
  }

  getGame(id: number): Observable<Game> {
    return this.http.get<Game>(`${this.baseUrl}/games/${id}`);
  }

  getSystems(): Observable<SystemInfo[]> {
    return this.http.get<SystemInfo[]>(`${this.baseUrl}/systems`);
  }

  uploadGame(formData: FormData): Observable<Game> {
    return this.http.post<Game>(`${this.baseUrl}/games/upload`, formData);
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
}
