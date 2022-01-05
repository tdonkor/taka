import { Component,  Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { AtpScannerService, AtpEnvironmentService } from 'dotsdk';

@Component({
  selector: 'acr-scan',
  templateUrl: './scan.component.html'
})
export class ScanComponent implements OnInit, OnDestroy {
  @Output() public barcodeChanged: EventEmitter<string> = new EventEmitter();
  private _canScan = true;
  private _code = '';


  public get text(): string {
    return this._code;
  }

  public async ngOnInit() {
    await this.startScan();
  }
  public ngOnDestroy() {
    this._canScan = false;
  }

  protected async startScan() {
    if (!AtpEnvironmentService.getInstance().mBirdIsConnected()) {
      return;
    }
    const scannedCode = await AtpScannerService.getInstance().scan(3).catch(e => null);
    if (this._canScan) {
      if (scannedCode) {
        this.barcodeChanged.emit(scannedCode);
      } else {
        await this.startScan();
      }
    }
  }
}
