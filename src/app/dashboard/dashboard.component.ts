import { Component, OnInit } from '@angular/core';
import { Chart } from 'angular-highcharts';
import { DataService } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'angular-highcharts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  evPopulationByYearChart: Chart | undefined;
  evPopulationByRegionChart: Chart | undefined;
  evModelPopularityChart: Chart | undefined;
  evRangeVsMSRPChart: Chart | undefined;
  evModelComparisonChart: Chart | undefined;
  rawData: any[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.dataService.fetchCsvData().subscribe((data: any[]) => {
      this.rawData = data;
      this.createYearlyEVPopulationChart(data);
      this.createEVPopulationByRegionChart(data);
      this.createEVModelPopularityChart(data);
      this.createEVRangeVsMSRPChart(data);
    });
  }

  //widget 1
  createYearlyEVPopulationChart(data: any[]): void {
    const yearCounts: Record<number, number> = {};
    const evTypeCounts: Record<number, { BEV: number; PHEV: number }> = {};

    data.forEach((ev) => {
      const year = ev['Model Year'];
      const evType =
        ev['Electric Vehicle Type'] === 'Battery Electric Vehicle (BEV)'
          ? 'BEV'
          : 'PHEV';

      yearCounts[year] = (yearCounts[year] || 0) + 1;
      if (!evTypeCounts[year]) {
        evTypeCounts[year] = { BEV: 0, PHEV: 0 };
      }
      evTypeCounts[year][evType] += 1;
    });

    // Create the chart using angular-highcharts' Chart wrapper
    this.evPopulationByYearChart = new Chart({
      chart: {
        type: 'column',
      },
      title: {
        text: 'EV Population by Year',
      },
      xAxis: {
        categories: Object.keys(yearCounts),
      },
      series: [
        {
          name: 'Total EVs',
          type: 'column',
          data: Object.values(yearCounts),
        },
        {
          name: 'Battery Electric Vehicles (BEVs)',
          type: 'column',
          data: Object.values(evTypeCounts).map((typeCount) => typeCount.BEV),
          stack: 'EV Types',
        },
        {
          name: 'Plug-in Hybrid Electric Vehicles',
          type: 'column',
          data: Object.values(evTypeCounts).map((typeCount) => typeCount.PHEV),
          stack: 'EV Types',
        },
      ],
    });
  }

  //widget 2
  createEVPopulationByRegionChart(data: any[]): void {
    const regionCounts: Record<string, number> = {};
    const regionAvgRange: Record<string, number> = {};
    const regionCAFVEligibility: Record<string, number> = {};

    data.forEach((ev) => {
      const region = ev['County'] || ev['State']; // Choose either County or State
      const electricRange = Number(ev['Electric Range']);
      const isCAFVEligible =
        ev['Clean Alternative Fuel Vehicle (CAFV) Eligibility'] ===
        'Clean Alternative Fuel Vehicle Eligible'
          ? 1
          : 0;

      regionCounts[region] = (regionCounts[region] || 0) + 1;
      regionAvgRange[region] = (regionAvgRange[region] || 0) + electricRange;
      regionCAFVEligibility[region] =
        (regionCAFVEligibility[region] || 0) + isCAFVEligible;
    });

    // Calculate the average electric range per region
    Object.keys(regionAvgRange).forEach((region) => {
      regionAvgRange[region] = regionAvgRange[region] / regionCounts[region];
    });

    this.evPopulationByRegionChart = new Chart({
      chart: {
        type: 'column',
      },
      title: {
        text: 'EV Population by Region',
      },
      xAxis: {
        categories: Object.keys(regionCounts),
      },
      series: [
        {
          name: 'Total EVs',
          type: 'column',
          data: Object.values(regionCounts),
        },
        {
          name: 'Avg Electric Range',
          type: 'spline',
          data: Object.values(regionAvgRange),
          yAxis: 1,
        },
        {
          name: 'Clean Alternative Fuel Vehicle (CAFV) Eligible EVs',
          type: 'column',
          data: Object.values(regionCAFVEligibility),
          stack: 'CAFV Eligibility',
        },
      ],
      yAxis: [
        {
          title: {
            text: 'Total EVs and CAFV Eligible',
          },
        },
        {
          title: {
            text: 'Average Electric Range',
          },
          opposite: true,
        },
      ],
    });
  }

  //widget 3
  createEVModelPopularityChart(data: any[]): void {
    const makeCounts: Record<string, number> = {};
    const modelCounts: Record<string, number> = {};
    const makeMSRP: Record<string, number[]> = {};

    data.forEach((ev) => {
      const make = ev['Make'] || 'Unknown';
      const model = ev['Model'] || 'Unknown';
      const msrp = parseFloat(ev['Base MSRP'] || '0');

      makeCounts[make] = (makeCounts[make] || 0) + 1;
      modelCounts[model] = (modelCounts[model] || 0) + 1;
      if (!makeMSRP[make]) {
        makeMSRP[make] = [];
      }
      makeMSRP[make].push(msrp);
    });

    this.evModelPopularityChart = new Chart({
      chart: {
        type: 'pie',
      },
      title: {
        text: 'EV Popularity by Make',
      },
      series: [
        {
          name: 'Make Distribution',
          type: 'pie',
          data: Object.entries(makeCounts).map(([make, count]) => ({
            name: make,
            y: count,
          })),
        },
      ],
    });

    this.evModelComparisonChart = new Chart({
      chart: {
        type: 'column',
      },
      title: {
        text: 'EV Popularity by Model',
      },
      xAxis: {
        categories: Object.keys(modelCounts),
      },
      series: [
        {
          name: 'Models',
          type: 'column',
          data: Object.values(modelCounts),
        },
      ],
    });
  }

  //widget 4
  createEVRangeVsMSRPChart(data: any[]): void {
    const rangeMSRPData = data.map((ev) => {
      return {
        x: parseInt(ev['Electric Range'], 10),
        y: parseFloat(ev['Base MSRP'] || '0'),
        color:
          ev['Electric Vehicle Type'] === 'Battery Electric Vehicle (BEV)'
            ? '#0066cc'
            : '#ff6600', // Color based on EV Type
      };
    });

    this.evRangeVsMSRPChart = new Chart({
      chart: {
        type: 'scatter', // Use scatter plot to show relationship
      },
      title: {
        text: 'EV Range vs. MSRP',
      },
      xAxis: {
        title: { text: 'Electric Range (miles)' },
        min: 0,
      },
      yAxis: {
        title: { text: 'Base MSRP ($)' },
        min: 0,
      },
      plotOptions: {
        scatter: {
          marker: {
            radius: 5, // Adjust size of the dots
            states: {
              hover: {
                enabled: true,
                lineColor: 'rgb(100,100,100)',
              },
            },
          },
        },
      },
      series: [
        {
          name: 'EVs',
          type: 'scatter',
          data: rangeMSRPData,
          color: 'rgba(0, 255, 0, 0.5)', // Light green for overall color
        },
      ],
    });
  }
}
