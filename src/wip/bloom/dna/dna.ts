import { BranchBone } from "../branch/branchBone";
import { Component } from "../component";
import { Petal } from "../flower";
import { Leaf } from "../leaf";
import { LeafTemplate } from "../veinMesh/leafTemplate";
import { WhorlParameters } from "../whorl";

export interface DNA {
    leafTemplate: LeafTemplate;
    petalTemplate: LeafTemplate;
    leafWhorlTemplate: WhorlParameters<Leaf>;
    petalWhorlTemplate: WhorlParameters<Petal>;
    branchingPattern: BranchingPattern;
}

export interface BranchingPattern {
    getComponentsFor(branch: BranchBone): Component[] | null;
}
