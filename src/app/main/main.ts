import { Component, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Census } from '../census'; 
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

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

  private censusService = inject(Census); 
  
  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.createMap();
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

    const COLOR_DEFAULT  = "#d1d5db";
    const COLOR_HOVER    = "#ff9800";
    const COLOR_FLASH    = "#ff0000";
    const COLOR_SELECTED = "#00e676";

    const paths = svg.append("g")
      .selectAll("path")
      .data((states as any).features)
      .join("path")
      .attr("d", path as any)
      .attr("class", "state-path")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .attr("fill", COLOR_DEFAULT);
    
    paths
      .on("mouseover", function(event, d: any) {
        d3.select(this)
          .interrupt() 
          .transition().duration(200)
          .attr("fill", COLOR_HOVER);
      })
      .on("mouseout", (event, d: any) => {
        const isSelected = this.selectedStateId === d.id;
        
        d3.select(event.currentTarget)
          .transition().duration(200)
          .attr("fill", isSelected ? COLOR_SELECTED : COLOR_DEFAULT);
      })
      .on("click", (event, d: any) => {
        this.selectedStateId = d.id;
        
        paths.filter((node: any) => node.id !== d.id)
             .transition().duration(200)
             .attr("fill", COLOR_DEFAULT);

        d3.select(event.currentTarget)
          .interrupt()
          .attr("fill", COLOR_FLASH)
          .transition().duration(650)
          .attr("fill", COLOR_SELECTED);

        const stateName = this.censusService.getStateName(d.id);
        const data = stateDataMap.get(stateName);

        if (data) {
            const getPct = (n: number) => ((n / data.population) * 100).toFixed(1) + '%';
            this.selectedStateInfo = `
              <div style="text-align: left;">
                <h2 style="margin-bottom: 10px; border-bottom: 2px solid #ddd;">${data.name}</h2>
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
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-linejoin", "round")
      .attr("d", path as any);
  }
}