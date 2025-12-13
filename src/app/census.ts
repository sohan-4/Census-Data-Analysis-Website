import { Injectable } from '@angular/core';

export interface StateData {
  name: string;
  population: number;
  medianIncome: number;
  demographics: {
    white: number;
    black: number;
    asian: number;
    hispanic: number;
    other: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class Census {

  private fipsMap: { [key: string]: string } = { "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas", "06": "California", "08": "Colorado", "09": "Connecticut", "10": "Delaware", "11": "District of Columbia", "12": "Florida", "13": "Georgia", "15": "Hawaii", "16": "Idaho", "17": "Illinois", "18": "Indiana", "19": "Iowa", "20": "Kansas", "21": "Kentucky", "22": "Louisiana", "23": "Maine", "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota", "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska", "32": "Nevada", "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico", "36": "New York", "37": "North Carolina", "38": "North Dakota", "39": "Ohio", "40": "Oklahoma", "41": "Oregon", "42": "Pennsylvania", "44": "Rhode Island", "45": "South Carolina", "46": "South Dakota", "47": "Tennessee", "48": "Texas", "49": "Utah", "50": "Vermont", "51": "Virginia", "53": "Washington", "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming", "72": "Puerto Rico" };

  constructor() { }

  async getCensusData(): Promise<Map<string, StateData>> {
    const variables = [
      'NAME',
      'B19013_001E',
      'B01003_001E',
      'B03002_003E', 
      'B03002_004E', 
      'B03002_006E', 
      'B03002_012E'
    ].join(',');

    const url = `https://api.census.gov/data/2020/acs/acs5?get=${variables}&for=state:*`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    const dataMap = new Map<string, StateData>();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const name = row[0];
      const income = +row[1];
      const population = +row[2];
      const white = +row[3];
      const black = +row[4];
      const asian = +row[5];
      const hispanic = +row[6];

      const other = population - (white + black + asian + hispanic);

      dataMap.set(name, {
        name: name,
        medianIncome: income,
        population: population,
        demographics: { white, black, asian, hispanic, other }
      });
    }

    return dataMap;
  }

  getStateName(fipsCode: string): string {
    return this.fipsMap[fipsCode] || "Unknown";
  }
}