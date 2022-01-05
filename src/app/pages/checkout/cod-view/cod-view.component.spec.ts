import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CodViewComponent } from './cod-view.component';

describe('CodViewComponent', () => {
  let component: CodViewComponent;
  let fixture: ComponentFixture<CodViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CodViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CodViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
