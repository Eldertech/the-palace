import React from "react";
import { Composition } from "remotion";
import { PhenomenaWalk, FPS, DURATION_IN_FRAMES, WIDTH, HEIGHT } from "./PhenomenaWalk";

export const Root: React.FC = () => (
  <>
    <Composition
      id="PhenomenaWalk"
      component={PhenomenaWalk}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  </>
);
