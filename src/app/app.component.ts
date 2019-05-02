import { Component } from '@angular/core';
import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import { Label } from 'ng2-charts';
import { FormGroup, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  constructor(private httpClient: HttpClient) { }

  ngOnInit() {
    this.reset();
    this.getData();
  }

  public barChartOptions: ChartOptions = {
    responsive: true,
  };
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [];
  public barChartData: ChartDataSets[];
  public barChartLabels: Label[];
  public years: number[];
  public yearsValid: boolean;
  public chartForm = new FormGroup({
    metrics: new FormControl('Tmax'),
    locations: new FormControl('UK'),
    yearFrom: new FormControl(),
    yearTo: new FormControl()
  });

  public getData(): void {
    this.reset();
    const metrics = this.chartForm.get('metrics').value;
    const location = this.chartForm.get('locations').value;
    this.httpClient.get('https://s3.eu-west-2.amazonaws.com/interview-question-data/metoffice/' + metrics + '-' + location + '.json').subscribe((res) => {
      this.years = _.uniq(_.map(res, 'year'));
      this.populateBarChartData(res);
    });
  }

  private populateBarChartData(response: any): void {
    let yearFrom = +this.chartForm.get('yearFrom').value;
    let yearTo = +this.chartForm.get('yearTo').value;
    if (!yearFrom) {
      yearFrom = this.years[0];
      this.chartForm.get('yearFrom').setValue(yearFrom);
    }
    if (!yearTo) {
      yearTo = this.years[this.years.length - 1];
      this.chartForm.get('yearTo').setValue(yearTo);
    }
    if (yearFrom <= yearTo) {
      response = _.filter(response, function (data) {
        return data.year >= yearFrom && data.year <= yearTo;
      });
      this.barChartLabels = response.map(obj => this.getMonthName(obj.month) + ' ' + obj.year);
      let selectedData = {};
      selectedData['data'] = response.map(obj => obj.value);
      selectedData['label'] = this.populateBarChartLabel();
      this.barChartData.push(selectedData);
    } else {
      this.yearsValid = false;
    }
  }

  private getMonthName(month: number): string {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[month - 1];
  }

  private populateBarChartLabel(): string {
    let metricsValue = this.chartForm.get('metrics').value;
    if (metricsValue === 'Tmax') {
      metricsValue = 'Max Temperature';
    } else if (metricsValue === 'Tmin') {
      metricsValue = 'Min Temperature';
    } else if (metricsValue === 'Rainfall') {
      metricsValue = 'Rainfall in mm'
    }
    return this.chartForm.get('locations').value + ' ' + metricsValue;
  }

  private reset(): void {
    this.yearsValid = true;
    this.barChartData = [];
    this.barChartLabels = [];
  }
}
