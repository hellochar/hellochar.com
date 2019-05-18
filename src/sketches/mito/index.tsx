import * as React from "react";
import * as THREE from "three";
import { OrthographicCamera, Scene, Vector3 } from "three";

import devlog from "../../common/devlog";
import { map } from "../../math/index";
import { ISketch } from "../../sketch";
import { Action, ActionBuild, ActionBuildTransport, ActionMove, ActionStill } from "./action";
import { drums, hookUpAudio, strings } from "./audio";
import { Constructor } from "./constructor";
import { Player, World } from "./game";
import { Cell, Fruit, Tile, Tissue, Transport } from "./game/tile";
import { ACTION_KEYMAP, BUILD_HOTKEYS } from "./keymap";
import { params } from "./params";
import { directionFor, findPath } from "./pathfinding";
import { PlayerRenderer } from "./renderers/PlayerRenderer";
import { Renderer } from "./renderers/Renderer";
import { TileRenderer } from "./renderers/TileRenderer";
import { NewPlayerTutorial } from "./tutorial";
import TileHighlight from "./tutorial/tileHighlight";
import { GameStack, HUD, ParamsGUI, TileHover } from "./ui";

export type Entity = Tile | Player;

interface Steppable {
    step(): void;
}

export function isSteppable(obj: any): obj is Steppable {
    return typeof obj.step === "function";
}
export const width = 50;
export const height = 100;

export function lerp2(v: Vector3, t: {x: number, y: number}, l: number) {
    v.x = v.x * (1 - l) + t.x * l;
    v.y = v.y * (1 - l) + t.y * l;
}

function createRendererFor<E extends Entity>(object: E, scene: Scene, mito: Mito): Renderer<Entity> {
    if (object instanceof Player) {
        return new PlayerRenderer(object, scene, mito);
    } else if (object instanceof Tile) {
        return new TileRenderer(object, scene, mito);
    } else {
        throw new Error(`Couldn't find renderer for ${object}`);
    }
}

export type GameState = "main" | "win" | "lose" | "instructions";

export interface UIStateMain {
    type: "main";
}
export interface UIStateExpanding {
    type: "expanding";
    originalAction: Action;
    originalZoom: number;
    target: THREE.Vector2;
}
export type UIState = UIStateMain | UIStateExpanding;

export class Mito extends ISketch {
    public readonly world = new World();
    public scene = new Scene();
    private camera = new OrthographicCamera(0, 0, 0, 0, -100, 100);
    public renderers = new Map<Entity, Renderer<Entity>>();
    // when true, automatically create tissue tiles when walking into soil or dirt
    public autoplace: Constructor<Cell> | undefined;
    public render() {
        return <>
        <HUD
            ref={(ref) => this.hudRef = ref!}
            // onAutoplaceSet={(autoplace) => {
            //     if (autoplace === this.autoplace) {
            //         this.autoplace = undefined;
            //     } else {
            //         this.autoplace = autoplace;
            //     }
            //     this.hudRef.setState({ autoplace: this.autoplace });
            // }}
            onTryActionKey={(key) => {
                this.tryAction(key, false);
            }}
            world={this.world}
        />
        <TileHover ref={(ref) => this.hoverRef = ref } />
        <GameStack ref={(ref) => this.gameStackRef = ref } mito={this} />
        {/* <NewPlayerTutorial ref={(ref) => this.tutorialRef = ref } mito={this} />, */}
        <ParamsGUI />
        { this.hoveredTile ? <TileHighlight x={this.hoveredTile.pos.x} y={this.hoveredTile.pos.y} scene={this.scene} /> : null }
        </>;
    }
    public hudRef: HUD | null = null;
    public hoverRef: TileHover | null = null;
    public gameStackRef: GameStack | null = null;
    public tutorialRef: NewPlayerTutorial | null = null;
    public mouse = new THREE.Vector2();
    public hoveredTile?: Tile;
    private raycaster = new THREE.Raycaster();
    public gameState: GameState = "instructions";
    public audioListener = new THREE.AudioListener();
    private keyMap = new Set<string>();
    public uiState: UIState = { type: "main" };

    private enterUIStateExpanding(move: ActionMove) {
        const target = this.world.player.pos.clone().add(move.dir);
        const originalZoom = this.uiState.type === "main" ? this.camera.zoom : this.uiState.originalZoom;
        this.uiState = {
            type: "expanding",
            originalAction: move,
            originalZoom,
            target,
        };
        if (this.hudRef) {
            this.hudRef.setState({ uiState: this.uiState });
        }
    }

    private resetUIState() {
        if (this.uiState.type === "expanding") {
            this.camera.zoom = this.uiState.originalZoom;
            this.camera.updateProjectionMatrix();
            this.uiState = { type: "main" };
            if (this.hudRef) {
                this.hudRef.setState({ uiState: this.uiState });
            }
        }
    }

    public events = {
        contextmenu: (event: JQuery.Event) => {
            if (this.uiState.type === "main") {
                const tile = this.getTileAtScreenPosition(event.clientX!, event.clientY!);
                if (tile != null) {
                    this.world.player.setAction({
                        type: "deconstruct",
                        position: tile.pos,
                    });
                }
            }
            return false;
        },
        mousemove: (event: JQuery.Event) => {
            this.mouse.x = event.clientX!;
            this.mouse.y = event.clientY!;
        },
        click: (event: JQuery.Event) => {
            // left-click
            const isBuildAttempt = (() => {
                const { player } = this.world;
                // try build
                const tile = this.getTileAtScreenPosition(event.clientX!, event.clientY!);
                if (tile) {
                    const direction = directionFor(player.pos.x, player.pos.y, tile.pos.x, tile.pos.y);
                    if (direction) {
                        const move: ActionMove = {
                            type: "move",
                            dir: direction,
                        };
                        const isBuildCandidate = this.world.player.isBuildCandidate(move);
                        if (isBuildCandidate) {
                            this.enterUIStateExpanding(move);
                            return true;
                        }
                    }
                }
            })();
            if (!isBuildAttempt) {
                this.resetUIState();
                this.enqueuePlayerMoveToMouse(event.clientX!, event.clientY!);
            }
        },
        keydown: (event: JQuery.Event) => {
            const key = event.key!;
            const isRepeatedStroke = this.keyMap.has(key);
            this.keyMap.add(key);
            this.tryAction(key, isRepeatedStroke);
        },
        keyup: (event: JQuery.Event) => {
            this.keyMap.delete(event.key!);
        },
        wheel: (event: JQuery.Event) => {
            const e = event.originalEvent as WheelEvent;
            // on my mouse, one scroll is + or - 125
            const delta = -(e.deltaX + e.deltaY) / 125 / 20;
            const currZoom = this.camera.zoom;
            const scalar = Math.pow(2, delta);
            // console.log(currZoom);
            // zoom of 2 is zooming in
            // const newZoom = Math.min(Math.max(currZoom * scalar, 1), 2.5);
            const newZoom = currZoom * scalar;
            this.camera.zoom = newZoom;
            this.camera.updateProjectionMatrix();
        },
    };

    tryAction(key: string, isRepeatedStroke: boolean) {
        const { world } = this;
        if (key === "?") {
            this.gameState = (this.gameState === "instructions" ? "main" : "instructions");
            return;
        }
        if (this.uiState.type === "expanding") {
            if (key === "Escape") {
                this.resetUIState();
                return;
            }
            if (key in BUILD_HOTKEYS && !(BUILD_HOTKEYS[key] === Fruit && this.world.fruit != null)) {
                const cellType = BUILD_HOTKEYS[key];
                const buildAction: ActionBuild = {
                    type: "build",
                    cellType: cellType,
                    position: this.uiState.target,
                };
                this.world.player.setAction(buildAction);
                this.resetUIState();
                return;
            } else if (ACTION_KEYMAP[key] && ACTION_KEYMAP[key] !== this.uiState.originalAction) {
                this.resetUIState();
                return;
            }
        }
        if (this.gameState === "instructions") {
            if (key === "Escape") {
                this.gameState = "main";
            }
            // block further actions
            return;
        }
        if (this.autoplace != null && key === "Escape") {
            this.autoplace = undefined;
        }
        const action = ACTION_KEYMAP[key];
        if (action != null) {
            // autoplace
            if (this.autoplace !== undefined && action.type === "move") {
                if (this.autoplace === Transport) {
                    const buildTransportAction: ActionBuildTransport = {
                        type: "build-transport",
                        cellType: Transport,
                        position: this.world.player.pos.clone(),
                        dir: action.dir,
                    };
                    this.world.player.setAction(buildTransportAction);
                } else if (!world.player.verifyMove(action) && !isRepeatedStroke) {
                    const buildAction: ActionBuild = {
                        type: "build",
                        cellType: this.autoplace,
                        position: this.world.player.pos.clone().add(action.dir),
                    };
                    this.world.player.setAction(buildAction);
                    if (this.autoplace !== Tissue) {
                        this.autoplace = undefined;
                    }
                } else {
                    this.world.player.setAction(action);
                    // this.autoplace = undefined;
                }
            } else if (this.autoplace == null && action.type === "move" && this.world.player.isBuildCandidate(action)) {
                // we attempt to move into a place we cannot
                this.enterUIStateExpanding(action);
            } else {
                this.world.player.setAction(action);
            }
        } else {
            if (key in BUILD_HOTKEYS) {
                if (this.autoplace === BUILD_HOTKEYS[key] || BUILD_HOTKEYS[key] === Fruit && this.world.fruit != null) {
                    this.autoplace = undefined;
                } else {
                    this.autoplace = BUILD_HOTKEYS[key];
                }
            }
        }
        if (this.hudRef != null) {
            this.hudRef.setState({ autoplace: this.autoplace });
        }
    }

    private expandingTileHighlight = (() => {
        const mesh = new THREE.Mesh(
            TileRenderer.geometry,
            new THREE.MeshBasicMaterial({
                color: "white",
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5,
            }),
        );
        return mesh;
    })();

    public init() {
        hookUpAudio(this.audioContext);
        this.camera.zoom = 1.5;
        this.camera.add(this.audioListener);

        this.resize(this.canvas.width, this.canvas.height);
        // darkness and water diffuse a few times to stabilize it
        for (let i = 0; i < 5; i++) {
            this.world.step();
        }
        // this.gameState = "instructions";
        this.camera.position.z = 10;
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.camera.position.x = this.world.player.pos.x;
        this.camera.position.y = this.world.player.pos.y;

        // const airBg = new THREE.Mesh(
        //     new PlaneBufferGeometry(width, height),
        //     materialMapping.get(Air)!.clone(),
        // );
        // airBg.position.x = width / 2 - 0.5;
        // airBg.position.y = height / 2 - 0.5;
        // this.scene.add(airBg);
        this.updateAmbientAudio();
    }

    public getOrCreateRenderer(entity: Entity) {
        const renderer = this.renderers.get(entity);
        if (renderer == null) {
            const created = createRendererFor(entity, this.scene, this);
            this.renderers.set(entity, created);
            return created;
        } else {
            return renderer;
        }
    }

    public updateAmbientAudio() {
        const yPos = this.world.player.pos.y;
        const drumVolume = map(yPos, height / 2, height, 0, 0.5);
        const stringsVolume = map(yPos, height / 2, 0, 0, 0.5);
        drums.gain.gain.value = Math.max(0, drumVolume);
        strings.gain.gain.value = Math.max(0, stringsVolume);
    }

    public logRenderInfo() {
        devlog(
`Geometries in memory: ${this.renderer.info.memory.geometries}
Textures in memory: ${this.renderer.info.memory.textures}
# Render Calls: ${this.renderer.info.render.calls}
# Render Lines: ${this.renderer.info.render.lines}
# Render Points: ${this.renderer.info.render.points}
# Render Tris: ${this.renderer.info.render.triangles}
`,
        );
    }

    public worldStepAndUpdateRenderers() {
        this.world.step();
        if (this.tutorialRef) {
            this.tutorialRef.setState({ time: this.world.time });
        }
        this.gameState = this.world.checkWinLoss() || this.gameState;

        const oldEntities = Array.from(this.renderers.keys());
        // delete the renderers for entities that have been removed since last render
        // this is the performance bottleneck, it's O(n^2)
        const renderableEntities = this.world.renderableEntities();
        const removedEntities = oldEntities.filter((e) => renderableEntities.indexOf(e) === -1);
        for (const e of removedEntities) {
            const renderer = this.renderers.get(e);
            if (renderer == null) {
                throw new Error(`Couldn't find renderer for ${e}!`);
            }
            renderer.destroy();
            this.renderers.delete(e);
        }

        this.updateAmbientAudio();
    }

    private getCameraNormCoordinates(clientX: number, clientY: number) {
        return new THREE.Vector2(
            clientX / this.canvas.width * 2 - 1,
            -clientY / this.canvas.height * 2 + 1,
        );
    }

    private getTileAtScreenPosition(clientX: number, clientY: number) {
        const cameraNorm = this.getCameraNormCoordinates(clientX, clientY);
        this.raycaster.setFromCamera(cameraNorm, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        const i = intersects[0];
        if (i != null) {
            const {x, y} = i.point;
            const ix = Math.round(x);
            const iy = Math.round(y);
            const tile = this.world.tileAt(ix, iy);
            if (tile != null && tile.lightAmount() > 0) {
                return tile;
            }
        }
    }

    public animate() {
        const { world } = this;
        if (document.activeElement !== this.canvas) {
            this.canvas.focus();
        }
        if (this.gameState === "main") {
            if (params.isRealtime) {
                if (this.frameCount % 3 === 0) {
                    this.worldStepAndUpdateRenderers();
                }
            } else if (world.player.getAction() != null) {
                this.worldStepAndUpdateRenderers();
            }
            // this.world.entities().forEach((entity) => {
            this.world.renderableEntities().forEach((entity) => {
                const renderer = this.getOrCreateRenderer(entity);
                renderer.update();
            });
        }
        const mouseNorm = this.getCameraNormCoordinates(this.mouse.x, this.mouse.y);
        if (this.uiState.type === "main") {
            this.scene.remove(this.expandingTileHighlight);
            const target = new THREE.Vector2(
                this.world.player.pos.x + mouseNorm.x / 2,
                this.world.player.pos.y - mouseNorm.y / 2,
            );
            lerp2(this.camera.position, target, 0.3);
        } else {
            this.scene.add(this.expandingTileHighlight);
            this.expandingTileHighlight.position.set(
                this.uiState.target.x,
                this.uiState.target.y,
                1,
            );
            const target = new THREE.Vector2(
                this.uiState.target.x,
                this.uiState.target.y,
            );
            lerp2(this.camera.position, target, 0.3);
        }
        this.renderer.render(this.scene, this.camera);

        if (this.hoverRef != null) {
            this.hoveredTile = this.getTileAtScreenPosition(this.mouse.x, this.mouse.y);
            this.hoverRef.setState({
                tile: this.hoveredTile,
            });
        }

        if (this.hudRef != null) {
            const isTutorialFinished = this.tutorialRef == null ? true : this.tutorialRef.isFinished();
            this.hudRef.setState({
                isTutorialFinished,
                sugar: this.world.player.inventory.sugar,
                water: this.world.player.inventory.water,
            });
        }
        if (this.gameStackRef != null) {
            this.gameStackRef.setState({
                state: this.gameState,
            });
        }
        // this.logRenderInfo();
    }

    public resize(w: number, h: number) {
        const aspect = h / w;
        const cameraHeight = 12;
        this.camera.left = -cameraHeight / aspect;
        this.camera.right = cameraHeight / aspect;
        this.camera.top = -cameraHeight;
        this.camera.bottom = cameraHeight;
        // this.camera.position.z = 1;
        // this.camera.lookAt(new Vector3(0, 0, 0));
        this.camera.updateProjectionMatrix();
    }

    public enqueuePlayerMoveToMouse(clientX: number, clientY: number) {
        const target = this.getTileAtScreenPosition(clientX, clientY);
        if (target) {
            const path = findPath(this.world, target.pos, true);
            const actions = path.map((dir) => ({
                type: "move",
                dir,
            }) as ActionMove);
            this.world.player.setActions(actions);
        }
    }
}

export default Mito;
