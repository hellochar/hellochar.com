import * as React from "react";

import { params } from "../params";

interface InstructionsProps {
    play: () => void;
}
export class Instructions extends React.PureComponent<InstructionsProps, {}> {
    render() {
        return (<div className="mito-instructions">
            <div className="mito-instructions-container">
                <div className="esc" onClick={() => this.props.play()}>Back (Esc)</div>
                <h1>Mito</h1>
                <div className="play-button" onClick={() => this.props.play()}>
                    Play
                    </div>
                <p>
                    <ol>
                        <li>Build Tissue to expand your reach (press t and walk into empty space).</li>
                        <li>Build Roots (press r) underground to suck up adjacent water.</li>
                        <li>Build Leaves (press l) above ground and drop water (press 1) to convert water into sugar.</li>
                        <li><b>Win the game by building and loading the Fruit with 1000 sugar.</b></li>
                        <li>Click around to see the different properties of each tile.</li>
                        <li>Build leaves early.</li>
                        <li>Leaves higher up have better water/sugar ratios, determined by the co2 percentage in the air.</li>
                        <li>Explore underground for water reservoires and Fountains.</li>
                        <li>Build transports (capital T) to carry water back up the plant.</li>
                        <li>You can scroll out infinitely far.</li>
                    </ol>
                </p>
                <h3>You</h3>
                <p>
                    You can carry max {params.maxResources} resources, and you automatically suck in any resources you're standing over.
                    You can only walk on Tissue (and Transport).
                    You start at the center of the map, with soil below and air above.
                    </p>
                <h3>Soil and Underground</h3>
                <p>
                    Underground, Soil holds water, rocks block your way, and occasionally Fountains (at the very bottom) are a permanent source of water.
                        Soil holds up to {params.soilMaxWater} water at a time.
                        Fountains emit one water per {params.fountainTurnsPerWater} turns.
                    </p>
                <h3>Air and Aboveground</h3>
                <p>
                    Aboveground, Air provides both sunlight and co2.
                    Sunlight determines the ratio of waters-per-sugar at which reactions happen and are affected by shadows.
                    Co2 determines the speed of reaction and gets better as you build higher up. Orange is low co2, blue is high co2.
                    Gravity will pull down on your structures, so make sure they're structurally sound.
                    Your structures cast shadows on the leaves below in relation to the sun, which gently sways left to right.
                    </p>
                <h3>Water</h3>
                <p>
                    Water is one of the main two resources.
                        Water slowly diffuses from high to low densities (difference 2 required) at about 1 unit per {(1 / params.soilDiffusionWater).toFixed(0)} turns.
                    Obtain water in the ground through Roots. Leaves require water to photosynthesize. You require water to build.
                    </p>
                <h3>Sugar</h3>
                <p>
                    Sugar is the other main resource. Sugar does not diffuse. Leaves convert water into sugar. Obtain sugar by putting
                    water next to leaves. Cells require sugar to survive. You require sugar to build.
                    </p>
                <h3>Building</h3>
                <p>
                    Build Tissue, Leaves, Roots, and The Fruit by toggling "build mode" on and walking into Air or Soil.
                    Build Transport over existing tissue by walking around. Building costs 1 sugar and 1 water.
                    You can build Tissue over Leaves and Roots - be careful!
                    When you build above ground, Cells will Droop if they're not properly supported underneath them.
                    </p>
                <h3>Cells</h3>
                <p>
                    All cells require energy upkeep and will automatically eat sugar on their tile, or get energy from their neighbors.
                        Each cell consumes 1 sugar every {params.cellEnergyMax} turns.
                    </p>
                <h3>Tissue</h3>
                <p>
                    Tissue connects your plant together, you may only walk on Tissue. Each Tissue carries up to {params.tissueInventoryCapacity} resources.
                    </p>
                <h3>Roots</h3>
                <p>
                    Roots are the only way to get water. Each turn Roots transport one water per neighboring soil into the Tissue in the
                    opposite direction (so the Tissue North of the root get water in the South tile). This is called a Pairing.
                    </p>
                <h3>Leaves</h3>
                <p>
                    When exposed to Air, Leaves convert water to sugar. Leaves also use Pairings between opposite direction Air/Tissue with water.
                        In perfect co2, leave produce on average 1 sugar per {(1 / params.leafReactionRate).toFixed(0)} turns per pair.
                    Leaf efficiency is heavily influenced by co2 and sunlight of its neighboring Air.
                    If your leaf is in too much shadow, it will not be able to photosynthesize.
                    Leaves higher up produce sugar faster.
                    </p>
                <h3>Transport</h3>
                <p>
                    Transports move 1 water from its own Tile in the direction it was laid per turn, as well as moving you. Transport hungers at double speed.
                    </p>
                <h3>The Fruit</h3>
                <p>
                    You can only build one Fruit, and it is the goal of the game to fill it up with resources. Fruit has up to 1000 sugar storage
                    and aggressively pulls in every available sugar in its surrounding vicinity.
                    </p>
                {this.renderCredit()}
            </div>
        </div>);
    }
    renderCredit() {
        return (<>
            <h2>Attribution</h2>
            <p>
                Tiles: <a href="http://kenney.nl/assets?s=roguelike" target="_blank">Kenney.nl Roguelike Assets</a>
            </p>
            <p>
                Pop sound when leaves convert: <a href="http://soundbible.com/2067-Blop.html" target="_blank">Blop by Mark DiAngelo</a> (<a href="https://creativecommons.org/licenses/by/3.0/us/">CC BY 3.0 US</a>)
                </p>
            <p>
                Perlin noise: <a href="https://github.com/josephg/noisejs" target="_blank">josephg/noisejs</a>
            </p>
            <p>
                Part of 7drl 2018: <a href="http://7drl.org/" target="_blank">http://7drl.org/</a>
            </p>
            <p>
                Fruit icon: <a href='https://www.freepik.com/free-vector/fruits-set-pixel-icons_1001072.htm'>Designed by Freepik</a>
            </p>
        </>);
    }
}
