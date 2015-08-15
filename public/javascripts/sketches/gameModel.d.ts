declare module Game {
    interface IGameMesh extends THREE.Mesh {
      animate?: (millisElapsed: number) => void;
      time?: number;
    }

    interface ICharacterMesh extends IGameMesh {
    }

    interface ILevelMesh extends IGameMesh {
      depth: number;
    }

    interface IObjectModel {
      position: THREE.Vector3;
    }

    interface ICharacterModel extends IObjectModel {
      energy: number;
      maxEnergy: number;
      inventory: IGameMesh[];
        moveDepth: (depth: number) => void;
        move: (x: number, y: number) => void;
    }

    interface ILevelModel {
      mesh: ILevelMesh;
      grid: GridCell[];
      obstructions: boolean[];
      width: number;
      height: number;
      depth: number;
      generator: (x: number, y: number) => GridCell;
      getFloorTile: () => number[];
    }

    export enum GridCell {
      EMPTY = -1,
      GROUND = 0
    }
}
