import { Component, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; 
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

    const us: any = await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json");
    const states = topojson.feature(us, us.objects.states as any);
    const projection = d3.geoAlbersUsa().fitSize([width, height], states);
    const path = d3.geoPath().projection(projection);

    svg.append("g")
      .selectAll("path")
      .data((states as any).features)
      .join("path")
      .attr("d", path as any)
      .attr("class", "state-path")
      .attr("fill", "#d1d5db")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      
      .on("mouseover", function(event, d) {
        d3.select(this).transition().duration(200).attr("fill", "#ff0000");
      })
      .on("mouseout", function(event, d) {
        d3.select(this).transition().duration(200).attr("fill", "#d1d5db");
      })
      
      .on("click", (event, d: any) => {
        console.log('Click detected on:', d.properties.name);

        this.selectedStateInfo = `You clicked on **${d.properties.name}**`;

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