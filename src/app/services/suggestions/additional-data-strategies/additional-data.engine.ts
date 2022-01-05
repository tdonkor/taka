import { AdditionalDataStrategy } from "./addition-data.strategy";

export class AdditionalDataEngine {
    private strategy: AdditionalDataStrategy;
    constructor(strategy: AdditionalDataStrategy) {
        this.strategy = strategy;
    }

    public setStrategy(strategy: AdditionalDataStrategy) {
        this.strategy = strategy;
    }

    public getAdditionalDataStrategy(){
        return this.strategy;
    }
}