import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VoucherInfoComponent } from './voucher-info.component';

describe('VoucherInfoComponent', () => {
  let component: VoucherInfoComponent;
  let fixture: ComponentFixture<VoucherInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VoucherInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VoucherInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
