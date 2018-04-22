import { Math as THREEMath, Vector2 } from "three";
import { generateVeinGrowthParameters, IVeinGrowthParameters, ReasonStopped, Vein } from "./vein";

export class VeinedLeaf {
  public world: Vein[] = [];

  root: Vein;
  // outer boundary from last growth step
  boundary: Vein[] = [];
  // nodes without any children
  terminalNodes: Vein[] = [];

  finished = false;

  growthParameters: IVeinGrowthParameters = generateVeinGrowthParameters();

  constructor(public x: number, public y: number, public scale: number) {
    this.root = new Vein(new Vector2(this.growthParameters.EXPAND_DIST, 0), this);
    this.root.distanceToRoot = 0;
    this.root.costToRoot = 0;
    this.boundary.push(this.root);
  }

  expandBoundary() {
    if (this.finished) {
      return;
    }

    // reset weights
    for (const s of this.world) {
      s.weight = -1;
    }
    this.root.computeWeight();

    const newBoundary: Vein[] = [];
    for (const s of this.boundary) {
      s.branchOut();
      newBoundary.push(...s.children);
    }
    if (newBoundary.length === 0) {
      this.finished = true;
    }
    // world.addAll(newBoundary);

    for (const s of this.boundary) {
      if (s.children.length === 0) {
        this.terminalNodes.push(s);
      }
    }
    this.boundary = newBoundary;

    // for (Small s : world) {
    //  if (s.children.size() == 0) {
    //    terminalNodes.add(s);
    //  }
    // }

    // reset weights
    for (const s of this.world) {
      s.weight = -1;
    }
    this.root.computeWeight();
    // Collections.sort(world, new Comparator() {
    //  public int compare(Object obj1, Object obj2) {
    //    Small s1 = (Small)obj1;
    //    Small s2 = (Small)obj2;
    //    return Integer.compare(s1.weight, s2.weight);
    //  }
    // }
    // );
  }

  draw(context: CanvasRenderingContext2D) {
    context.save();
    context.translate(this.x, this.y);
    context.scale(this.scale, this.scale);
    this.drawWorld(context);
    context.restore();
  }

    drawWorld(context: CanvasRenderingContext2D) {
        // computes whole subtree
        this.root.computeWeight();
        context.strokeStyle = "rgba(0, 0, 0, 0.5)";
        for (const s of this.world) {
            context.lineWidth = Math.log(1 + s.weight) / 10;
            context.beginPath();
            s.draw(context);
            context.stroke();
            //   textAlign(BOTTOM, RIGHT);
            // text(int(100 * (s.costToRoot / MAX_PATH_COST)), s.position.x, s.position.y);
            // text(s.weight, s.position.x, s.position.y);
            // text(s.numTurns, s.position.x, s.position.y);
        }

        context.beginPath();
        context.lineWidth = 1;
        context.strokeStyle = "rgb(64, 255, 75)";
        for (const s of this.terminalNodes) {
            if (s.reason === ReasonStopped.Expensive) {
                s.draw(context);
            }
        }
        context.stroke();

        // drawBoundary();
    }

  // degenerate:
  // doesn't grow at all
  // terminal nodes < 10
  // alternatively, to get rid of grass:
  //   terminal nodes who are terminal because it was too expensive.size < 10
  isDegenerate() {
    return this.terminalNodes.length < 10;
  }

//   void drawBoundary() {
//     stroke(64, 255, 64);
//     strokeWeight(0.5);
//     noFill();
//     beginShape();
//     // vertex(root.position.x, root.position.y);
//     Collections.sort(terminalNodes, new Comparator() {
//       public int compare(Object obj1, Object obj2) {
//         Small s1 = (Small)obj1;
//         Small s2 = (Small)obj2;
//         return Float.compare(atan2(s1.position.y, s1.position.x), atan2(s2.position.y, s2.position.x));
//       }
//     }
//     );
//     for (Small s : terminalNodes) {
//       if (s.reason == ReasonStopped.Expensive) {
//         vertex(s.position.x, s.position.y);
//       }
//     }
//     endShape();
//   }
}
