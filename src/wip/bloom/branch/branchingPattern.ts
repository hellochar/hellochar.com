import { Component } from "../component";
import { BranchBone } from "./branchBone";

export interface BranchingPattern {
    getComponentFor(branch: BranchBone): Component;
}
