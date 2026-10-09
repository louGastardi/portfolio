import React from "react";
import { Composition } from "remotion";
import { AA_FRAMES, AnimationAutomation } from "./AnimationAutomation";
import { SequenceFromSRT, SRT_FRAMES } from "./SequenceFromSRT";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="AnimationAutomation" component={AnimationAutomation} durationInFrames={AA_FRAMES} fps={30} width={1800} height={920} />
    <Composition id="SequenceFromSRT" component={SequenceFromSRT} durationInFrames={SRT_FRAMES} fps={30} width={1800} height={920} />
  </>
);
