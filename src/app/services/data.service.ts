import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as Papa from 'papaparse';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  // private dataUrl = 'assets/data.json';
  private csvUrl = 'assets/Electric_Vehicle_Population_Data.csv';

  constructor(private http: HttpClient) {}

  // fetchData(): Observable<any[]> {
  //   return this.http.get<any[]>(this.dataUrl);
  // }

  fetchCsvData(): Observable<any[]> {
    return new Observable((observer) => {
      this.http.get(this.csvUrl, { responseType: 'text' }).subscribe(
        (data: string) => {
          Papa.parse(data, {
            header: true, // Convert rows into objects based on headers
            skipEmptyLines: true,
            complete: (result) => {
              observer.next(result.data); // Pass parsed data
              observer.complete();
            },
            error: (error: any) => observer.error(error),
          });
        },
        (error) => observer.error(error)
      );
    });
  }
}
