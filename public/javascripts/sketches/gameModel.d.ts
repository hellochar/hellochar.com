declare module Game {
    interface IGameMesh extends THREE.Mesh {
      animate?: (millisElapsed: number) => void;
      time?: number;
    }

    interface IObjectModel {
      position: THREE.Vector3;
    }

    interface ICharacterModel extends IObjectModel {
      energy: number;
      maxEnergy: number;
      inventory: IGameMesh[];
    }

    interface ILevelModel {
      grid: number[];
      obstructions: boolean[];
      width: number;
      height: number;
      depth: number;
    }
}
