import { EventEmitter } from "events";
import { Vector2 } from "three";

// floating point rounding error fix
// without: 0.8 - 0.1 = 0.7000000000000001
// with: fpref(0.8 - 0.1) = 0.7
function fpref(x: number) {
    return Math.round(x * 1e12) / 1e12;
}

interface HasPosition {
    pos: Vector2;
}

export class Inventory {
    constructor(
        public capacity: number,
        public carrier: HasPosition,
        public water: number = 0,
        public sugar: number = 0,
    ) {
        this.validate();
    }

    // public exchange(other: Inventory, giveWater: number, giveSugar: number, getWater: number, getSugar: number) {
    //     giveWater = Math.min(giveWater, this.water);
    //     giveSugar = Math.min(giveSugar, this.sugar);
    //     getWater = Math.min(getWater, other.water);
    //     getSugar = Math.min(getWater, other.sugar);

    //     // positive = give this amount
    //     // negative = other gives this amount
    //     const wantedExchangedWater = giveWater - getWater;
    //     const wantedExchangedSugar = giveSugar - getSugar;

    //     const mySpace = fpref(this.space() + wantedExchangedSugar + wantedExchangedWater);
    //     const otherSpace = fpref(other.space() - wantedExchangedSugar - wantedExchangedWater);

    //     // const mySpace = fpref(this.capacity + giveWater + giveSugar - this.water - this.sugar);

    //     // const otherSpace = fpref(other.capacity - other.water - other.sugar)

    //     // const mySpaceNeeded = fpref(getWater + getSugar);
    //     // const otherSpaceNeeded = fpref(giveWater + giveSugar);

    //     // if (mySpace < mySpaceNeeded) {
    //     //     // e.g. space = 2, needed = 4
    //     //     // only get half
    //     //     const weightedRatio = mySpace / mySpaceNeeded;
    //     //     getWater = getWater * mySpace / mySpaceNeeded;
    //     //     getSugar = getSugar * mySpace / mySpaceNeeded;
    //     // }

    //     // if (otherSpace < otherSpaceNeeded) {
    //     //     giveWater = giveWater / otherSpace;
    //     //     giveSugar = giveSugar / otherSpace;
    //     // }
    // }

    public give(other: Inventory, amountWater: number, amountSugar: number) {
        if (other === this) {
            throw new Error("shouldn't give to self");
        }
        // to check:
        // 1) we have enough water and sugar
        //      if we don't, cap water and sugar to the amount available
        // 2) other has enough space
        //      if it doesn't, scale down to the amount that is available
        let water = Math.min(amountWater, this.water);
        let sugar = Math.min(amountSugar, this.sugar);
        const spaceNeeded = fpref(water + sugar);
        const spaceAvailable = other.space();
        if (spaceNeeded > spaceAvailable) {
            // scale down the amount to give
            // give less than capacity
            water = Math.floor(water / spaceNeeded * spaceAvailable);
            sugar = Math.floor(sugar / spaceNeeded * spaceAvailable);
        }
        this.change(-water, -sugar);
        other.change(water, sugar);
        if (this.events) {
            this.events.emit("give", other, water, sugar);
        }
        if (other.events) {
            other.events.emit("get", this, water, sugar);
        }
        return {water, sugar};
    }

    private events?: EventEmitter;
    public on(name: "give" | "get", fn: (other: Inventory, water: number, sugar: number) => void) {
        this.events = this.events || new EventEmitter();
        this.events.on(name, fn);
    }

    public add(water: number, sugar: number) {
        const spaceNeeded = fpref(water + sugar);
        const spaceAvailable = this.space();
        if (spaceNeeded > spaceAvailable) {
            // scale down the amount to give
            water = water / spaceNeeded * spaceAvailable;
            sugar = sugar / spaceNeeded * spaceAvailable;
        }
        this.change(water, sugar);
    }

    private change(water: number, sugar: number) {
        const newWater = fpref(this.water + water);
        const newSugar = fpref(this.sugar + sugar);
        this.validate(newWater, newSugar);
        this.water = newWater;
        this.sugar = newSugar;

        // fixup if needed
        if (this.water < 0) { this.water = 0; }
        if (this.sugar < 0) { this.sugar = 0; }
        if (this.water + this.sugar > this.capacity) {
            if (this.water > this.sugar) {
                this.water = this.capacity - this.sugar;
            } else {
                this.sugar = this.capacity - this.water;
            }
        }
    }

    public space() {
        const { capacity, water, sugar } = this;
        return fpref(capacity - water - sugar);
    }

    validate(water: number = this.water, sugar: number = this.sugar) {
        const { capacity } = this;
        if (water < 0) {
            console.warn(`water < 0: ${water}`);
            // throw new Error(`water < 0: ${water}`);
        }
        if (sugar < 0) {
            console.warn(`sugar < 0: ${sugar}`);
            // throw new Error(`sugar < 0: ${sugar}`);
        }
        if (water + sugar > capacity) {
            console.warn(`bad inventory: ${water} water + ${sugar} > ${capacity} max`);
            // throw new Error(`bad inventory: ${water} water + ${sugar} > ${capacity} max`);
        }
    }
}

export interface HasInventory {
    inventory: Inventory;
}

export function hasInventory<T>(obj?: T): obj is (HasInventory & T) {
    return obj != null && ((obj as any).inventory instanceof Inventory);
}
