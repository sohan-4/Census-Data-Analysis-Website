import { Component, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Census } from '../census'; 
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const THEME_LIGHT = {
    default: "#d1d5db",
    hover: "#ff9800",
    flash: "#ff0000",
    selected: "#00e676",
    stroke: "#ffffff"
};

const THEME_DARK = {
    default: "#374151",
    hover: "#ff9800",
    flash: "#ff0000",
    selected: "#00e676",
    stroke: "#6b7280"
};

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main implements AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  selectedStateInfo: string = "Select a state to view census data.";
  selectedStateId: string | null = null;
  
  isDarkMode: boolean = true; 
  currentTheme = THEME_DARK;

  private censusService = inject(Census); 
  
  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.createMap();
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.currentTheme = this.isDarkMode ? THEME_DARK : THEME_LIGHT;
    this.updateMapColors();
  }

  updateMapColors() {
    const svg = d3.select(this.mapContainer.nativeElement).select('svg');
    const paths = svg.selectAll('path.state-path');
    const borders = svg.selectAll('path.mesh-border');

    paths.attr("stroke", this.currentTheme.stroke);
    borders.attr("stroke", this.currentTheme.stroke);

    paths.transition().duration(300)
         .attr("fill", (d: any) => {
             return d.id === this.selectedStateId 
                 ? this.currentTheme.selected 
                 : this.currentTheme.default;
         });
  }

  async createMap() {
    const width = 975;
    const height = 610;

    d3.select(this.mapContainer.nativeElement).selectAll('*').remove();

    const svg = d3.select(this.mapContainer.nativeElement)
      .append('svg')
      .attr('viewBox', [0, 0, width, height])
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', '100%')
      .style('display', 'block');

    const [us, stateDataMap] = await Promise.all([
      d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json") as Promise<any>,
      this.censusService.getCensusData()
    ]);

    const states = topojson.feature(us, us.objects.states as any);
    const projection = d3.geoAlbersUsa().fitSize([width, height], states);
    const path = d3.geoPath().projection(projection);

    const paths = svg.append("g")
      .selectAll("path")
      .data((states as any).features)
      .join("path")
      .attr("d", path as any)
      .attr("class", "state-path")
      .attr("stroke", this.currentTheme.stroke)
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .attr("fill", this.currentTheme.default);
    
    paths
      .on("mouseover", (event, d: any) => {
        d3.select(event.currentTarget)
          .interrupt() 
          .transition().duration(200)
          .attr("fill", this.currentTheme.hover);
      })
      .on("mouseout", (event, d: any) => {
        const isSelected = this.selectedStateId === d.id;
        d3.select(event.currentTarget)
          .transition().duration(200)
          .attr("fill", isSelected ? this.currentTheme.selected : this.currentTheme.default);
      })
      .on("click", (event, d: any) => {
        this.selectedStateId = d.id;
        
        paths.filter((node: any) => node.id !== d.id)
             .transition().duration(200)
             .attr("fill", this.currentTheme.default);

        d3.select(event.currentTarget)
          .interrupt()
          .attr("fill", this.currentTheme.flash)
          .transition().duration(650)
          .attr("fill", this.currentTheme.selected);

        const stateName = this.censusService.getStateName(d.id);
        const data = stateDataMap.get(stateName);

        if (data) {
            const getPct = (n: number) => ((n / data.population) * 100).toFixed(1) + '%';
            this.selectedStateInfo = `
              <div style="text-align: left;">
                <h2 style="margin-bottom: 10px;">${data.name}</h2>
                <p><strong>Population:</strong> ${data.population.toLocaleString()}</p>
                <p><strong>Median Income:</strong> $${data.medianIncome.toLocaleString()}</p>
                <br>
                <strong>Demographics:</strong>
                <ul style="padding-left: 20px; margin-top: 5px;">
                    <li>White: ${getPct(data.demographics.white)}</li>
                    <li>Hispanic: ${getPct(data.demographics.hispanic)}</li>
                    <li>Black: ${getPct(data.demographics.black)}</li>
                    <li>Asian: ${getPct(data.demographics.asian)}</li>
                    <li>Other/Mixed: ${getPct(data.demographics.other)}</li>
                </ul>
              </div>
            `;
        } else {
            this.selectedStateInfo = "Data Unavailable";
        }
        this.cdr.detectChanges(); 
      });

    svg.append("path")
      .datum(topojson.mesh(us, us.objects.states as any, (a, b) => a !== b))
      .attr("class", "mesh-border")
      .attr("fill", "none")
      .attr("stroke", this.currentTheme.stroke)
      .attr("stroke-linejoin", "round")
      .attr("d", path as any);
  }
}