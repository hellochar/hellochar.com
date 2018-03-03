export class Inventory {
    constructor(
        public capacity: number,
        public water: number = 0,
        public sugar: number = 0,
    ) {
    }

    public give(other: Inventory, amountWater: number, amountSugar: number) {
        // to check:
        // 1) we have enough water and sugar
        //      if we don't, cap water and sugar to the amount available
        // 2) other has enough space
        //      if it doesn't, scale down to the amount that is available
        let water = Math.max(amountWater, this.water);
        let sugar = Math.max(amountSugar, this.sugar);
        const spaceNeeded = water + sugar;
        if (spaceNeeded > other.space()) {
            const capacity = other.space();
            // scale down the amount to give
            water = Math.round(water / spaceNeeded * capacity);
            sugar = Math.round(sugar / spaceNeeded * capacity);
        }
        this.change(-water, -sugar);
        other.change(water, sugar);
    }

    public change(water: number, sugar: number) {
        this.water += water;
        this.sugar += sugar;
        this.validate();
    }

    public space() {
        const { capacity, water, sugar } = this;
        return capacity - water - sugar;
    }

    validate() {
        const { capacity, water, sugar } = this;
        if (water < 0) {
            throw new Error(`water < 0: ${water}`);
        }
        if (sugar < 0) {
            throw new Error(`sugar < 0: ${sugar}`);
        }
        if (water + sugar > capacity) {
            throw new Error(`bad inventory: ${water} water + ${sugar} > ${capacity} max`);
        }
    }
}

export interface HasInventory {
    inventory: Inventory;
}

export function hasInventory(obj: any): obj is HasInventory {
    return obj.inventory instanceof Inventory;
}
