import { Feature } from "../enum/feature-flag";

export type FeatureFlag = {
    [key in Feature]: boolean;
}; 