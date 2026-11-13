import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  GetIssuesResponse,
  GetStatesResponse,
  LatestGrantsRequest,
  LatestGrantsResponse,
  GrantDetailRequest,
} from '../../datatype';

import { environment } from '../../environments';

@Injectable({
  providedIn: 'root',
})
export class Api {
  constructor(private http: HttpClient) {}

  /* ---------- FILTER DROPDOWN APIs ---------- */
  getStates(): Observable<GetStatesResponse> {
    return this.http.get<GetStatesResponse>(`${environment.apiUrl}/State/GetStates`);
  }

  getIssues(): Observable<GetIssuesResponse> {
    return this.http.get<GetIssuesResponse>(`${environment.apiUrl}/Issue/GetIssues`);
  }

  getCounties(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/County/GetCounties`);
  }

  getDonorCountries(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/Country/GetDonorCountries`);
  }

  getFocusCountries(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/Country/GetFocusCountries`);
  }

  getLatestGrants(payload: LatestGrantsRequest): Observable<LatestGrantsResponse> {
    return this.http.post<LatestGrantsResponse>(
      `${environment.apiUrl}/Grant/LatestGrantsSearch`,
      payload,
    );
  }
  getUsGrantDetail(payload: {
    friendlyURL: string;
    memberId: number;
    referenceId: number;
  }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/Premium/GetUsGrantDetailForURL`, payload);
  }
}
