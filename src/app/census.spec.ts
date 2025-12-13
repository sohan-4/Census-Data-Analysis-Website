import { TestBed } from '@angular/core/testing';

import { Census } from './census';

describe('Census', () => {
  let service: Census;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Census);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
