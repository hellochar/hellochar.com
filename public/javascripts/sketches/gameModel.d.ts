declare module Game {
    interface IGameMesh extends THREE.Object3D {
        animate?: (millisElapsed: number) => void;
        time?: number;
    }

    interface IObjectModel {
        position: THREE.Vector3;
        mesh: IGameMesh;
    }

    interface IDoodadModel extends IObjectModel {
        spriteX: number;
        spriteY: number;
        spriteTile: string;
    }

    interface ICharacterModel extends IObjectModel {
        energy: number;
        maxEnergy: number;
        inventory: IGameMesh[];
    }

    interface ILevelModel {
        objects: IObjectModel[];
        grid: number[];
        obstructions: boolean[];
        width: number;
        height: number;
        depth: number;
    }
}
